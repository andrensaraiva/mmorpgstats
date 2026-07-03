import { describe, expect, it } from 'vitest'
import {
  DUNGEONS,
  MAIN_SKILL_ID,
  SKILLS,
  STARTER_LOADOUT,
  makeStarter,
  makeUnique,
} from './content'
import {
  aggregate,
  canCraft,
  connectedToStart,
  craft,
  dungeonOutcome,
  dungeonReplay,
  fingerprint,
  makeRng,
  measuredRotation,
  resolveItemMods,
  simulateDungeon,
  simulateRotation,
} from './engine'
import type { ItemInstance } from './types'

function starterEquipped(): { equipped: ItemInstance[]; map: Record<string, string> } {
  const starter = makeStarter()
  const byUid = Object.fromEntries(starter.inventory.map((i) => [i.uid, i]))
  const equipped = Object.values(starter.equipped)
    .filter((uid): uid is string => Boolean(uid))
    .map((uid) => byUid[uid])
  return { equipped, map: starter.equipped as Record<string, string> }
}

const defaultSockets = Object.fromEntries(SKILLS.map((s) => [s.id, s.defaultSockets.slice()]))

describe('aggregate (modelo de poder)', () => {
  it('deriva poder positivo a partir de itens + árvore + suportes', () => {
    const { equipped } = starterEquipped()
    const power = aggregate({ equipped, allocated: ['s0', 'o1', 'o2', 'o3'], sockets: defaultSockets })

    expect(power.dps).toBeGreaterThan(0)
    expect(power.ehp).toBeGreaterThan(power.life)
    expect(power.fireRes).toBeLessThanOrEqual(75)
    expect(power.supportCap).toBe(2)
  })

  it('suportes de dano no golpe principal aumentam o DPS', () => {
    const { equipped } = starterEquipped()
    const withSupports = aggregate({ equipped, allocated: ['s0'], sockets: { [MAIN_SKILL_ID]: ['s_blood', 's_brutal'] } })
    const without = aggregate({ equipped, allocated: ['s0'], sockets: { [MAIN_SKILL_ID]: [] } })

    expect(withSupports.dps).toBeGreaterThan(without.dps)
  })

  it('o nó Estrategista concede +1 soquete', () => {
    const { equipped } = starterEquipped()
    const base = aggregate({ equipped, allocated: ['s0'], sockets: defaultSockets })
    const withNode = aggregate({ equipped, allocated: ['s0', 'u3'], sockets: defaultSockets })

    expect(withNode.supportCap).toBe(base.supportCap + 1)
  })

  it('equipar o anel de fogo eleva a resistência a fogo', () => {
    const { equipped } = starterEquipped()
    const withoutRing = aggregate({ equipped, allocated: ['s0'], sockets: defaultSockets })
    const flame = makeUnique('u_flameguard')
    const withRing = aggregate({ equipped: [...equipped, flame], allocated: ['s0'], sockets: defaultSockets })

    expect(withRing.fireRes).toBeGreaterThan(withoutRing.fireRes)
  })
})

describe('dungeonOutcome', () => {
  it('mais DPS reduz o tempo estimado', () => {
    const dungeon = DUNGEONS[0]
    const slow = dungeonOutcome(dungeon, { ...basePower(), dps: 200 })
    const fast = dungeonOutcome(dungeon, { ...basePower(), dps: 800 })
    expect(fast.seconds).toBeLessThan(slow.seconds)
  })

  it('resistência a fogo insuficiente torna a dungeon ígnea insobrevivível', () => {
    const igneous = DUNGEONS.find((d) => d.fireThreat)!
    const weak = dungeonOutcome(igneous, { ...basePower(), fireRes: 0 })
    const strong = dungeonOutcome(igneous, { ...basePower(), fireRes: igneous.fireReq })
    expect(weak.survivable).toBe(false)
    expect(strong.survivable).toBe(true)
  })
})

describe('dungeonOutcome — composição / bestiário', () => {
  const glacier = DUNGEONS.find((d) => d.id === 'd-glacier')!

  it('acusa a camada de dano que quebrou (não só fogo)', () => {
    // Glacial aplica frio+raio; falha na res. de frio deficitária.
    const outcome = dungeonOutcome(glacier, { ...basePower(), coldRes: 0, litRes: 70, dps: 5000 })
    expect(outcome.survivable).toBe(false)
    expect(outcome.reason).toBe('damage-type')
    expect(outcome.breakingType).toBe('cold')
    expect(outcome.cause).toContain('frio')
  })

  it('escolhe o maior déficit entre múltiplos tipos', () => {
    // Raio mais deficitário que frio → causa deve ser raio.
    const outcome = dungeonOutcome(glacier, { ...basePower(), coldRes: 40, litRes: 0, dps: 5000 })
    expect(outcome.breakingType).toBe('lightning')
  })

  it('com todas as resistências cobertas e DPS alto, sobrevive', () => {
    const outcome = dungeonOutcome(glacier, {
      ...basePower(), coldRes: 75, litRes: 75, dps: 8000,
    })
    expect(outcome.survivable).toBe(true)
    expect(outcome.reason).toBe('none')
  })

  it('voadores + DPS baixo causam stall (não limpa)', () => {
    const outcome = dungeonOutcome(glacier, {
      ...basePower(), coldRes: 75, litRes: 75, dps: 50,
    })
    expect(outcome.survivable).toBe(false)
    expect(outcome.reason).toBe('stall')
    expect(outcome.cause).toContain('ar')
  })

  it('dungeon legada (sem composição) mantém o gate de fogo', () => {
    const legacy = { ...glacier, composition: undefined, fireThreat: true, fireReq: 50 }
    const weak = dungeonOutcome(legacy, { ...basePower(), fireRes: 0 })
    const ok = dungeonOutcome(legacy, { ...basePower(), fireRes: 60 })
    expect(weak.reason).toBe('damage-type')
    expect(weak.breakingType).toBe('fire')
    expect(ok.survivable).toBe(true)
  })
})

describe('dungeonReplay (minimapa)', () => {
  const crypt = DUNGEONS.find((d) => d.id === 'd-crypt')!

  it('é determinístico: mesma seed → mesmo replay', () => {
    const outcome = dungeonOutcome(crypt, basePower())
    const a = dungeonReplay(crypt, outcome, 42)
    const b = dungeonReplay(crypt, outcome, 42)
    expect(a).toEqual(b)
  })

  it('inclui o herói na origem e marcadores dentro do mapa (0–100)', () => {
    const outcome = dungeonOutcome(crypt, basePower())
    const replay = dungeonReplay(crypt, outcome, 7)
    const player = replay.markers.find((m) => m.kind === 'player')
    expect(player).toBeTruthy()
    expect(player!.at).toBe(0)
    for (const m of replay.markers) {
      expect(m.x).toBeGreaterThanOrEqual(0)
      expect(m.x).toBeLessThanOrEqual(100)
      expect(m.y).toBeGreaterThanOrEqual(0)
      expect(m.y).toBeLessThanOrEqual(100)
    }
  })

  it('gera marcador de chefe e de loot a partir da composição', () => {
    const outcome = dungeonOutcome(crypt, basePower())
    const replay = dungeonReplay(crypt, outcome, 3)
    expect(replay.markers.some((m) => m.kind === 'boss')).toBe(true)
    expect(replay.markers.some((m) => m.kind === 'loot')).toBe(true)
  })

  it('vitória percorre até o fim; derrota termina antes', () => {
    const win = dungeonReplay(crypt, { ...dungeonOutcome(crypt, basePower()), survivable: true }, 5)
    const lose = dungeonReplay(crypt, { ...dungeonOutcome(crypt, basePower()), survivable: false }, 5)
    expect(win.endsAt).toBe(1)
    expect(win.win).toBe(true)
    expect(lose.endsAt).toBeLessThan(1)
    expect(lose.win).toBe(false)
  })

  it('funciona para dungeon sem composição (encontro genérico)', () => {
    const legacy = { ...crypt, composition: undefined }
    const replay = dungeonReplay(legacy, dungeonOutcome(legacy, basePower()), 9)
    expect(replay.markers.some((m) => m.kind === 'boss')).toBe(true)
    expect(replay.path.length).toBeGreaterThan(1)
  })
})

describe('fingerprint (números descobertos)', () => {
  const loadout = ['sk_wave', 'sk_strike']

  it('muda quando um item equipado troca de instância', () => {
    const { map } = starterEquipped()
    const a = fingerprint(map, ['s0'], defaultSockets, loadout)
    const b = fingerprint({ ...map, weapon: 'outro_uid' }, ['s0'], defaultSockets, loadout)
    expect(a).not.toBe(b)
  })

  it('é estável para a mesma build (ordem de alocação não importa)', () => {
    const { map } = starterEquipped()
    expect(fingerprint(map, ['s0', 'o1'], defaultSockets, loadout)).toBe(
      fingerprint(map, ['o1', 's0'], defaultSockets, loadout),
    )
  })

  it('muda quando a ORDEM do loadout muda (a rotação faz parte da build)', () => {
    const { map } = starterEquipped()
    const a = fingerprint(map, ['s0'], defaultSockets, ['sk_wave', 'sk_strike'])
    const b = fingerprint(map, ['s0'], defaultSockets, ['sk_strike', 'sk_wave'])
    expect(a).not.toBe(b)
  })
})

describe('crafting (orbes / corrupção)', () => {
  const rng = makeRng(12345)

  it('transmutação leva comum → mágico com 1 afixo e novo uid', () => {
    const common: ItemInstance = {
      uid: 'x', baseId: 'plate_chest', rarity: 'common', itemLevel: 60, affixes: [], corrupted: false, name: 'Peitoral de Placas',
    }
    const result = craft('transmutation', common, rng)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.item.rarity).toBe('magic')
      expect(result.item.affixes.length).toBe(1)
      expect(result.item.uid).not.toBe(common.uid)
    }
  })

  it('não permite craftar item corrompido', () => {
    const corrupted: ItemInstance = {
      uid: 'c', baseId: 'ruby_ring', rarity: 'rare', itemLevel: 70, affixes: [], corrupted: true, name: 'x',
    }
    expect(canCraft('chaos', corrupted)).toBe(false)
    expect(craft('chaos', corrupted, rng).ok).toBe(false)
  })

  it('vaal sempre corrompe o resultado', () => {
    const item: ItemInstance = {
      uid: 'v', baseId: 'plate_chest', rarity: 'rare', itemLevel: 60,
      affixes: [{ groupId: 'flat_life', kind: 'prefix', tier: 3, values: { flatLife: 90 }, text: '+90 vida máxima' }],
      corrupted: false, name: 'x',
    }
    const result = craft('vaal', item, rng)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.item.corrupted).toBe(true)
  })

  it('não muta o item de entrada', () => {
    const starter = makeStarter()
    const rare = starter.inventory.find((i) => i.rarity === 'rare')!
    const before = JSON.stringify(rare)
    craft('divine', rare, rng)
    expect(JSON.stringify(rare)).toBe(before)
  })
})

describe('resolveItemMods', () => {
  it('soma implícito da base com os afixos', () => {
    const item: ItemInstance = {
      uid: 'r', baseId: 'ruby_ring', rarity: 'magic', itemLevel: 60,
      affixes: [{ groupId: 'fire_res', kind: 'suffix', tier: 4, values: { fireRes: 20 }, text: '+20% resistência a fogo' }],
      corrupted: false, name: 'x',
    }
    // implícito do anel de rubi = +20 fireRes, afixo = +20 → 40
    expect(resolveItemMods(item).fireRes).toBe(40)
  })
})

describe('connectedToStart', () => {
  it('rejeita conjunto desconectado da origem', () => {
    expect(connectedToStart(new Set(['s0', 'o1', 'o2']), 's0')).toBe(true)
    expect(connectedToStart(new Set(['s0', 'o3']), 's0')).toBe(false)
  })
})

describe('simulateRotation (simulador de rotação — fatia do M5)', () => {
  const supportsOf = (id: string) => SKILLS.find((s) => s.id === id)!.defaultSockets.slice()

  it('reduz ao DPS do aggregate para a skill principal sozinha, sem armadura', () => {
    const { equipped } = starterEquipped()
    const mainSupports = supportsOf(MAIN_SKILL_ID)
    const power = aggregate({ equipped, allocated: ['s0'], sockets: { [MAIN_SKILL_ID]: mainSupports } })
    const sim = simulateRotation({
      equipped,
      allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: mainSupports }],
      target: { armour: 0 },
      seconds: 8,
    })
    // Mesma matemática por golpe × velocidade → mesmo DPS (a menos de arredondamento).
    expect(Math.abs(sim.dps - power.dps)).toBeLessThanOrEqual(1)
    expect(sim.resourceUptime).toBe(1) // strike sozinho não estoura recurso na janela
  })

  it('a ordem da rotação importa: setup antes do payoff rende mais DPS e mantém o combo', () => {
    const { equipped } = starterEquipped()
    const wave = { skillId: 'sk_wave', supports: supportsOf('sk_wave') }
    const strike = { skillId: 'sk_strike', supports: supportsOf('sk_strike') }
    const cfg = { equipped, allocated: ['s0'], target: { armour: 0 }, seconds: 10 }

    const good = simulateRotation({ ...cfg, loadout: [wave, strike] }) // setup primeiro
    const bad = simulateRotation({ ...cfg, loadout: [strike, wave] }) // fura o setup

    expect(good.dps).toBeGreaterThan(bad.dps)
    expect(good.comboUptime).toBeGreaterThan(0.7)
    expect(bad.comboUptime).toBeLessThan(0.05) // Onda nunca é usada → Exposição nunca abre
  })

  it('rotação gulosa estoura o recurso: aponta o gargalo "recurso"', () => {
    const { equipped } = starterEquipped()
    const starve = simulateRotation({
      equipped,
      allocated: ['s0'],
      loadout: [
        { skillId: 'sk_wave', supports: supportsOf('sk_wave') },
        { skillId: 'sk_strike', supports: supportsOf('sk_strike') },
      ],
      target: { armour: 0 },
      seconds: 60,
    })
    expect(starve.resourceUptime).toBeLessThan(1)
    expect(starve.bottleneck).toBe('recurso')
  })

  it('mais armadura no alvo derruba o DPS (armadura dependente do tamanho do golpe)', () => {
    const { equipped } = starterEquipped()
    const loadout = [{ skillId: MAIN_SKILL_ID, supports: supportsOf(MAIN_SKILL_ID) }]
    const soft = simulateRotation({ equipped, allocated: ['s0'], loadout, target: { armour: 0 }, seconds: 8 })
    const hard = simulateRotation({ equipped, allocated: ['s0'], loadout, target: { armour: 5000 }, seconds: 8 })
    expect(hard.dps).toBeLessThan(soft.dps)
    expect(hard.dps).toBeGreaterThan(0)
  })

  it('é determinístico: mesma entrada → mesma saída', () => {
    const { equipped } = starterEquipped()
    const cfg = {
      equipped,
      allocated: ['s0'],
      loadout: [
        { skillId: 'sk_wave', supports: supportsOf('sk_wave') },
        { skillId: 'sk_strike', supports: supportsOf('sk_strike') },
      ],
      target: { armour: 800 },
      seconds: 12,
    }
    expect(simulateRotation(cfg)).toEqual(simulateRotation(cfg))
  })

  it('o STARTER_LOADOUT padrão é uma boa rotação (combo em uptime alto, DPS canônico > 0)', () => {
    const { equipped } = starterEquipped()
    const slots = STARTER_LOADOUT.map((id) => ({ skillId: id, supports: supportsOf(id) }))
    const r = measuredRotation(equipped, ['s0'], slots) // mesmo caminho do selectPower/boneco
    expect(r.dps).toBeGreaterThan(0)
    expect(r.comboUptime).toBeGreaterThan(0.7)
  })

  it('ignora skills utilitárias (damageMult 0) na medição de DPS, caindo no básico', () => {
    const { equipped } = starterEquipped()
    const sim = simulateRotation({
      equipped,
      allocated: ['s0'],
      loadout: [{ skillId: 'sk_stance', supports: supportsOf('sk_stance') }],
      target: { armour: 0 },
      seconds: 6,
    })
    expect(sim.dps).toBeGreaterThan(0)
    expect(sim.perSkill.every((s) => s.skillId === 'sk_basic')).toBe(true)
    expect(sim.comboUptime).toBe(0)
  })
})

describe('simulateDungeon (combate: corrida limpar×morrer, CC, poções)', () => {
  const crypt = DUNGEONS.find((d) => d.id === 'd-crypt')!
  const glacier = DUNGEONS.find((d) => d.id === 'd-glacier')!
  // Tank: pouco DPS, muito EHP/res. Glass cannon: muito DPS, pouca vida/defesa.
  const tank = () => ({
    ...basePower(), dps: 1500, life: 20000, ehp: 30000, armour: 4000,
    fireRes: 75, coldRes: 75, litRes: 75, chaosRes: 75,
  })
  const glass = () => ({
    ...basePower(), dps: 4000, life: 800, ehp: 900, armour: 100,
    fireRes: 0, coldRes: 0, litRes: 0, chaosRes: 0,
  })

  it('o tank sobrevive onde o glass cannon morre — o eixo tank×DPS', () => {
    const t = simulateDungeon(crypt, tank())
    const g = simulateDungeon(crypt, glass())
    expect(t.survivable).toBe(true)
    expect(g.survivable).toBe(false)
    expect(t.report.enemiesDefeated).toBe(t.report.totalMonsters)
    expect(g.report.enemiesDefeated).toBeLessThan(g.report.totalMonsters)
  })

  it('quem morre gasta poções antes de cair', () => {
    const g = simulateDungeon(crypt, glass())
    expect(g.report.potionsUsed).toBeGreaterThan(0)
  })

  it('dungeon com frio impõe controle (tempo sob CC > 0)', () => {
    const t = simulateDungeon(glacier, tank())
    expect(t.report.timeControlled).toBeGreaterThan(0)
  })

  it('morrer durante o controle vira causa própria (reason: control)', () => {
    // Frio + ameaça enorme → morte no primeiro instante, que é janela de controle.
    const trap = { ...glacier, diff: 200000 }
    const r = simulateDungeon(trap, glass())
    expect(r.survivable).toBe(false)
    expect(r.reason).toBe('control')
  })
})

function basePower() {
  return {
    dps: 300, ehp: 8000, life: 6000, armour: 500, block: 20, attackSpeed: 1.4,
    critChance: 20, critMulti: 180, fireRes: 40, coldRes: 40, litRes: 40, chaosRes: 40,
    strength: 200, dexterity: 40, intelligence: 40, supportCap: 2,
    resourceMax: 100, resourceRegen: 10,
  }
}
