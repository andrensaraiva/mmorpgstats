import { describe, expect, it } from 'vitest'
import {
  AFFIX_GROUPS,
  DUNGEONS,
  MAIN_SKILL_ID,
  SKILLS,
  STARTER_LOADOUT,
  makeStarter,
  makeUnique,
} from './content'
import {
  aggregate,
  availableSkills,
  canCraft,
  connectedToStart,
  craft,
  dungeonOutcome,
  dungeonReplay,
  dungeonXp,
  EXCEPTIONAL_MULT,
  fingerprint,
  levelForXp,
  levelProgress,
  makeRewardItem,
  makeRng,
  masteryDamageBonus,
  measuredRotation,
  MAX_MASTERY,
  resolveItemMods,
  rollExceptionalAffix,
  simulateDungeon,
  skillMasteryLevel,
  simulateRotation,
  skillAvailability,
  talentPoints,
  unmetRequirements,
  xpForLevel,
} from './engine'
import type { ItemInstance, Power, SkillDefinition } from './types'

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

  /* ---------- M2: camadas de defesa (evasão, ES, EHP) ---------- */

  it('nós de evasão/ES elevam evasão, escudo de energia e o EHP', () => {
    const { equipped } = starterEquipped()
    const base = aggregate({ equipped, allocated: ['s0', 'd1', 'd2'], sockets: defaultSockets })
    // d7 (+120 evasão) e d8 (+25% evasão, +80 ES) exigem o caminho d1→d2→d7→d8.
    const layered = aggregate({ equipped, allocated: ['s0', 'd1', 'd2', 'd7', 'd8'], sockets: defaultSockets })

    expect(layered.evasion).toBeGreaterThan(base.evasion)
    expect(layered.energyShield).toBeGreaterThan(base.energyShield)
    expect(layered.ehp).toBeGreaterThan(base.ehp)
  })

  it('escudo de energia soma ao pool do EHP (buffer antes da vida)', () => {
    const { equipped } = starterEquipped()
    // Vestes Arcanas (implícito +120 ES) + afixo de ES, montado à mão.
    const arcane: ItemInstance = {
      uid: 'test-es', baseId: 'arcane_vestment', rarity: 'magic', itemLevel: 60, corrupted: false,
      name: 'Vestes de Teste',
      affixes: [{ groupId: 'flat_es', kind: 'prefix', tier: 2, values: { energyShield: 200 }, text: '+200 escudo de energia' }],
    }
    const withoutEs = aggregate({ equipped, allocated: ['s0'], sockets: defaultSockets })
    const withEs = aggregate({ equipped: [...equipped, arcane], allocated: ['s0'], sockets: defaultSockets })

    expect(withEs.energyShield).toBeGreaterThan(withoutEs.energyShield)
    expect(withEs.ehp).toBeGreaterThan(withoutEs.ehp)
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

  /* ---------- M1: dano multi-tipo, resistência e penetração ---------- */

  // A Bola de Fogo é magia de fogo (baseDamage próprio); mede-se pela parcela de
  // fogo do breakdown, isolando o ataque básico físico do fallback de recurso.
  const fireOnly = (target: { armour: number; fireRes?: number }, supports: string[] = []) => {
    const { equipped } = starterEquipped()
    const r = simulateRotation({
      equipped,
      allocated: ['s0'],
      loadout: [{ skillId: 'sk_fireball', supports }],
      target,
      seconds: 8,
    })
    return { r, fire: r.damageByType.fire ?? 0 }
  }

  it('skill de fogo gera dano de fogo próprio (breakdown tem fogo)', () => {
    const { fire } = fireOnly({ armour: 0 })
    expect(fire).toBeGreaterThan(0) // a Bola de Fogo contribui dano de fogo real
    // Sem a skill de fogo, não há parcela de fogo — confirma a origem.
    const { equipped } = starterEquipped()
    const physOnly = simulateRotation({
      equipped,
      allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: [] }],
      target: { armour: 0 },
      seconds: 8,
    })
    expect(physOnly.damageByType.fire ?? 0).toBe(0)
  })

  it('resistência a fogo do alvo reduz a parcela de fogo (≈ 40% com 60% de res.)', () => {
    const bare = fireOnly({ armour: 0 }).fire
    const resisted = fireOnly({ armour: 0, fireRes: 60 }).fire
    expect(resisted).toBeGreaterThan(0)
    expect(resisted).toBeCloseTo(bare * 0.4, -1)
  })

  it('a armadura do alvo não afeta a parcela de dano de fogo (só a resistência)', () => {
    const soft = fireOnly({ armour: 0 }).fire
    const armoured = fireOnly({ armour: 9000 }).fire
    expect(armoured).toBe(soft)
  })

  it('penetração recupera parte do dano de fogo perdido para a resistência', () => {
    const withPen = fireOnly({ armour: 0, fireRes: 60 }, ['s_pierce']).fire // +8% pen.
    const noPen = fireOnly({ armour: 0, fireRes: 60 }).fire
    expect(withPen).toBeGreaterThan(noPen)
  })

  it('dano físico ainda passa pela armadura, não pela resistência elemental', () => {
    const { equipped } = starterEquipped()
    const loadout = [{ skillId: MAIN_SKILL_ID, supports: supportsOf(MAIN_SKILL_ID) }]
    const bare = simulateRotation({ equipped, allocated: ['s0'], loadout, target: { armour: 0 }, seconds: 8 })
    const resOnly = simulateRotation({ equipped, allocated: ['s0'], loadout, target: { armour: 0, fireRes: 75 }, seconds: 8 })
    expect(resOnly.dps).toBe(bare.dps) // resistência elemental não toca o físico
  })

  /* ---------- M3: ailments / DoT ---------- */

  it('skill de sangramento adiciona DoT ao DPS (dotDps > 0)', () => {
    const { equipped } = starterEquipped()
    const r = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_rend', supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    expect(r.dotDps).toBeGreaterThan(0)
    expect(r.dps).toBeGreaterThan(0)
    // o breakdown expõe a fonte 'dot'
    expect(r.perSkill.some((s) => s.skillId === 'dot')).toBe(true)
  })

  it('+incDot (suporte/nó) aumenta a parcela de DoT', () => {
    const { equipped } = starterEquipped()
    const base = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_rend', supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    const boosted = simulateRotation({
      equipped, allocated: ['s0', 'o1', 'o6', 'o3', 'o7', 'o8'], // ramo de DoT (+60%)
      loadout: [{ skillId: 'sk_rend', supports: ['s_dot'] }], // +25%
      target: { armour: 0 }, seconds: 8,
    })
    expect(boosted.dotDps).toBeGreaterThan(base.dotDps)
  })

  it('veneno (empilha) escala com a cadência; DoT de caos sofre res. de caos', () => {
    const { equipped } = starterEquipped()
    const bare = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_plague', supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    const resisted = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_plague', supports: [] }],
      target: { armour: 0, chaosRes: 50 }, seconds: 8,
    })
    expect(bare.dotDps).toBeGreaterThan(0)
    expect(resisted.dotDps).toBeLessThan(bare.dotDps) // resistência a caos reduz o veneno
    expect((resisted.damageByType.chaos ?? 0)).toBeGreaterThan(0)
  })

  /* ---------- M4: fontes externas (minions / totens) ---------- */

  it('minion no loadout contribui DPS contínuo (sourceDps > 0), fora da rotação', () => {
    const { equipped } = starterEquipped()
    const r = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_skeletons', supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    expect(r.sourceDps).toBeGreaterThan(0)
    expect(r.dps).toBeGreaterThan(0)
    expect(r.perSkill.some((s) => s.skillId === 'sk_skeletons')).toBe(true)
  })

  it('somar um minion à rotação aumenta o DPS total', () => {
    const { equipped } = starterEquipped()
    const alone = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    const withMinion = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: [] }, { skillId: 'sk_skeletons', supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    expect(withMinion.dps).toBeGreaterThan(alone.dps)
    expect(withMinion.sourceDps).toBeGreaterThan(0)
  })

  it('+dano de minion (suporte/nó) escala a fonte; e a fonte sofre a defesa do alvo', () => {
    const { equipped } = starterEquipped()
    const base = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_skeletons', supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    const boosted = simulateRotation({
      equipped, allocated: ['s0', 'u1', 'u2', 'u3', 'u8', 'u9'], // ramo minion (+55%)
      loadout: [{ skillId: 'sk_skeletons', supports: ['s_minion'] }], // +30%
      target: { armour: 0 }, seconds: 8,
    })
    const armoured = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_skeletons', supports: [] }],
      target: { armour: 6000 }, seconds: 8,
    })
    expect(boosted.sourceDps).toBeGreaterThan(base.sourceDps)
    expect(armoured.sourceDps).toBeLessThan(base.sourceDps) // minion físico sofre armadura
  })

  /* ---------- SK2: selo elemental (converte o tipo de dano) ---------- */

  it('selo de fogo converte um golpe físico para fogo (passa a sofrer res. a fogo, não armadura)', () => {
    const { equipped } = starterEquipped()
    const plain = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    const sealed = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: ['seal_fire'] }],
      target: { armour: 0 }, seconds: 8,
    })
    // O dano vira FOGO: some parcela física, aparece parcela de fogo.
    expect(sealed.damageByType.fire ?? 0).toBeGreaterThan(0)
    expect(sealed.damageByType.phys ?? 0).toBe(0)
    expect(plain.damageByType.phys ?? 0).toBeGreaterThan(0)

    // Contra armadura, o físico é mitigado mas o fogo selado não.
    const plainArmoured = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: [] }],
      target: { armour: 6000 }, seconds: 8,
    })
    const sealedArmoured = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: ['seal_fire'] }],
      target: { armour: 6000 }, seconds: 8,
    })
    expect(sealedArmoured.dps).toBeGreaterThan(plainArmoured.dps) // fogo ignora armadura
  })

  it('selo de fogo faz o golpe aplicar queimadura (DoT surge)', () => {
    const { equipped } = starterEquipped()
    const noSeal = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    const sealed = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: MAIN_SKILL_ID, supports: ['seal_fire'] }],
      target: { armour: 0 }, seconds: 8,
    })
    expect(noSeal.dotDps).toBe(0) // Golpe Rompedor não tem ailment próprio
    expect(sealed.dotDps).toBeGreaterThan(0) // o selo adicionou queimadura
  })

  it('golpe selado de fogo sofre a resistência a fogo do alvo', () => {
    const { equipped } = starterEquipped()
    const loadout = [{ skillId: MAIN_SKILL_ID, supports: ['seal_fire'] }]
    const bare = simulateRotation({ equipped, allocated: ['s0'], loadout, target: { armour: 0 }, seconds: 8 })
    const resisted = simulateRotation({ equipped, allocated: ['s0'], loadout, target: { armour: 0, fireRes: 60 }, seconds: 8 })
    expect(resisted.dps).toBeLessThan(bare.dps)
  })

  it('totém de raio contribui e sofre resistência a raio do alvo', () => {
    const { equipped } = starterEquipped()
    const bare = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_ballista', supports: [] }],
      target: { armour: 0 }, seconds: 8,
    })
    const resisted = simulateRotation({
      equipped, allocated: ['s0'],
      loadout: [{ skillId: 'sk_ballista', supports: [] }],
      target: { armour: 0, litRes: 60 }, seconds: 8,
    })
    expect(bare.sourceDps).toBeGreaterThan(0)
    expect(resisted.sourceDps).toBeLessThan(bare.sourceDps)
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

  /* ---------- M2: evasão e escudo de energia no lado recebido ---------- */

  it('evasão reduz o dano físico recebido na dungeon', () => {
    const noEvasion = simulateDungeon(crypt, { ...glass(), evasion: 0 })
    const evasive = simulateDungeon(crypt, { ...glass(), evasion: 4000 })
    // Com esquiva alta, cada segundo de físico recebido pesa menos → dura mais.
    expect(evasive.report.enemiesDefeated).toBeGreaterThan(noEvasion.report.enemiesDefeated)
  })

  it('escudo de energia estende a sobrevivência (absorve antes da vida)', () => {
    const bare = simulateDungeon(crypt, glass())
    const shielded = simulateDungeon(crypt, { ...glass(), energyShield: 3000 })
    // O ES é um pool extra: absorve dano antes da vida → limpa mais do encontro.
    expect(shielded.report.enemiesDefeated).toBeGreaterThan(bare.report.enemiesDefeated)
  })
})

describe('S — item rico (qualidade, requisitos) e skills por arma', () => {
  const skillById = (id: string) => SKILLS.find((s) => s.id === id) as SkillDefinition

  it('qualidade amplia o dano físico da arma (mais DPS)', () => {
    const { equipped } = starterEquipped()
    // A arma do starter (war_axe) tem quality 20; zerar deve baixar o DPS.
    const wpnIdx = equipped.findIndex((i) => i.baseId === 'war_axe')
    const noQ = equipped.map((i, k) => (k === wpnIdx ? { ...i, quality: 0 } : i))
    const withQ = aggregate({ equipped, allocated: ['s0'], sockets: {} })
    const without = aggregate({ equipped: noQ, allocated: ['s0'], sockets: {} })
    expect(withQ.dps).toBeGreaterThan(without.dps)
  })

  it('qualidade amplia as defesas da base (mais EHP)', () => {
    // Peitoral de placas: defences.armour 220; qualidade sobe a armadura.
    const plain: ItemInstance = {
      uid: 'q0', baseId: 'plate_chest', rarity: 'common', itemLevel: 60, corrupted: false,
      name: 'Peitoral', affixes: [], quality: 0,
    }
    const qual: ItemInstance = { ...plain, uid: 'q20', quality: 20 }
    expect((resolveItemMods(qual).armour ?? 0)).toBeGreaterThan(resolveItemMods(plain).armour ?? 0)
  })

  it('requisitos: aponta os atributos que o herói não atende', () => {
    const axe: ItemInstance = {
      uid: 'r1', baseId: 'war_axe', rarity: 'common', itemLevel: 40, corrupted: false, name: 'Machado', affixes: [],
    }
    // war_axe requer nível 32, 60 For, 30 Des.
    const weak = unmetRequirements(axe, { level: 10, str: 10, dex: 10, int: 10 })
    expect(weak).toContain('level')
    expect(weak).toContain('str')
    const strong = unmetRequirements(axe, { level: 40, str: 80, dex: 40, int: 40 })
    expect(strong).toHaveLength(0)
  })

  it('skillAvailability: skill de arco fica travada com machado equipado', () => {
    const { equipped } = starterEquipped() // machado (axe)
    const arrow = skillById('sk_shock_arrow') // requires bow/crossbow
    const strike = skillById('sk_strike') // requires axe/mace/sword
    expect(skillAvailability(arrow, equipped, 99).available).toBe(false)
    expect(skillAvailability(arrow, equipped, 99).reason).toBe('weapon')
    expect(skillAvailability(strike, equipped, 99).available).toBe(true)
  })

  it('availableSkills filtra o catálogo pela arma equipada', () => {
    const { equipped } = starterEquipped()
    const ids = availableSkills(SKILLS, equipped, 99).map((s) => s.id)
    expect(ids).toContain('sk_strike') // corpo-a-corpo, ok com machado
    expect(ids).not.toContain('sk_shock_arrow') // arco, travada
    expect(ids).not.toContain('sk_fireball') // cajado/varinha, travada
  })
})

describe('P1 — progressão (XP / nível)', () => {
  it('xpForLevel cresce monotonicamente; nível 1 = 0', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBeGreaterThan(0)
    for (let n = 2; n <= 30; n++) expect(xpForLevel(n)).toBeGreaterThan(xpForLevel(n - 1))
  })

  it('levelForXp é o inverso de xpForLevel', () => {
    for (let lvl = 1; lvl <= 20; lvl++) {
      expect(levelForXp(xpForLevel(lvl))).toBe(lvl)
      expect(levelForXp(xpForLevel(lvl) - 1)).toBe(Math.max(1, lvl - 1))
    }
  })

  it('levelProgress dá fração 0..1 dentro do nível', () => {
    const start = levelProgress(xpForLevel(5))
    expect(start.level).toBe(5)
    expect(start.frac).toBeCloseTo(0, 5)
    const mid = levelProgress(xpForLevel(5) + Math.floor((xpForLevel(6) - xpForLevel(5)) / 2))
    expect(mid.frac).toBeGreaterThan(0.4)
    expect(mid.frac).toBeLessThan(0.6)
  })

  it('vencer dá mais XP que perder; XP escala com o nível da dungeon', () => {
    expect(dungeonXp(10, true)).toBeGreaterThan(dungeonXp(10, false, 1))
    expect(dungeonXp(20, true)).toBeGreaterThan(dungeonXp(5, true))
    expect(dungeonXp(10, false, 0)).toBe(0) // perdeu sem limpar nada
  })

  it('pontos de talento: 1 por nível (a partir do 2) + bônus por marco', () => {
    expect(talentPoints(1, 0)).toBe(0)
    expect(talentPoints(5, 0)).toBe(4) // 4 níveis acima do 1
    expect(talentPoints(1, 2)).toBe(4) // 2 marcos × 2
    expect(talentPoints(10, 3)).toBe(9 + 6)
  })
})

describe('IT — afixo excepcional (só-dropa)', () => {
  const lifeGroup = AFFIX_GROUPS.find((g) => g.id === 'flat_life')!

  it('excepcional é ~1.5× o topo do melhor tier e vem marcado', () => {
    const exc = rollExceptionalAffix(lifeGroup, 80)
    const best = lifeGroup.tiers.reduce((a, b) => (b.tier < a.tier ? b : a))
    const topNormal = best.ranges.flatLife![1]
    expect(exc.exceptional).toBe(true)
    expect(exc.values.flatLife).toBe(Math.round(topNormal * EXCEPTIONAL_MULT))
    expect(exc.text).toMatch(/✦/) // selo de excepcional
  })

  it('o crafting nunca gera afixo excepcional', () => {
    // Rerolla um item raro muitas vezes; nenhum afixo deve sair excepcional.
    const rng = makeRng(12345)
    let item = makeRewardItem('plate_chest', 'rare', 'Teste', 60, rng, false)
    for (let i = 0; i < 40; i++) {
      const r = craft('chaos', item, rng)
      if (r.ok) item = r.item
      expect(item.affixes.some((a) => a.exceptional)).toBe(false)
    }
  })

  it('makeRewardItem com excepcional injeta um afixo excepcional; sem, nenhum', () => {
    const rng = makeRng(999)
    const plain = makeRewardItem('plate_chest', 'rare', 'Comum', 60, rng, false)
    const fancy = makeRewardItem('plate_chest', 'rare', 'Excepcional', 60, rng, true)
    expect(plain.affixes.some((a) => a.exceptional)).toBe(false)
    expect(fancy.affixes.some((a) => a.exceptional)).toBe(true)
  })

  it('o divine preserva o afixo excepcional (não reroda seus valores)', () => {
    const rng = makeRng(7)
    const item = makeRewardItem('plate_chest', 'rare', 'Exc', 60, rng, true)
    const excBefore = item.affixes.find((a) => a.exceptional)!
    const divined = craft('divine', item, rng)
    expect(divined.ok).toBe(true)
    if (divined.ok) {
      const excAfter = divined.item.affixes.find((a) => a.exceptional)
      expect(excAfter).toBeTruthy()
      expect(excAfter!.values).toEqual(excBefore.values) // valores intactos
    }
  })
})

describe('SK1 — maestria de skill', () => {
  it('a maestria sobe de nível com XP acumulado (1..MAX)', () => {
    expect(skillMasteryLevel(0)).toBe(1)
    expect(skillMasteryLevel(100)).toBe(2)
    expect(skillMasteryLevel(1_000_000)).toBe(MAX_MASTERY) // satura no teto
    // Monotônica
    let prev = 0
    for (const xp of [0, 150, 400, 800, 1500, 3000]) {
      const lvl = skillMasteryLevel(xp)
      expect(lvl).toBeGreaterThanOrEqual(prev)
      prev = lvl
    }
  })

  it('o bônus de maestria escala o DPS da rotação', () => {
    const { equipped } = starterEquipped()
    const loadout = [{ skillId: MAIN_SKILL_ID, supports: [] }]
    const cfg = { equipped, allocated: ['s0'] as string[], loadout, target: { armour: 0 }, seconds: 8 }
    const noMastery = simulateRotation(cfg)
    const highMastery = simulateRotation({ ...cfg, mastery: { [MAIN_SKILL_ID]: MAX_MASTERY } })
    expect(highMastery.dps).toBeGreaterThan(noMastery.dps)
  })

  it('masteryDamageBonus é 0 no nível 1 e cresce', () => {
    expect(masteryDamageBonus(1)).toBe(0)
    expect(masteryDamageBonus(5)).toBeGreaterThan(0)
    expect(masteryDamageBonus(MAX_MASTERY)).toBeGreaterThan(masteryDamageBonus(2))
  })
})

function basePower(): Power {
  return {
    dps: 300, ehp: 8000, life: 6000, armour: 500, evasion: 0, energyShield: 0, block: 20, attackSpeed: 1.4,
    critChance: 20, critMulti: 180, fireRes: 40, coldRes: 40, litRes: 40, chaosRes: 40,
    strength: 200, dexterity: 40, intelligence: 40, supportCap: 2,
    resourceMax: 100, resourceRegen: 10,
    firePen: 0, coldPen: 0, lightningPen: 0, chaosPen: 0,
  }
}
