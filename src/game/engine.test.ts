import { describe, expect, it } from 'vitest'
import {
  DUNGEONS,
  MAIN_SKILL_ID,
  SKILLS,
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
  resolveItemMods,
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
  it('muda quando um item equipado troca de instância', () => {
    const { map } = starterEquipped()
    const a = fingerprint(map, ['s0'], defaultSockets)
    const b = fingerprint({ ...map, weapon: 'outro_uid' }, ['s0'], defaultSockets)
    expect(a).not.toBe(b)
  })

  it('é estável para a mesma build', () => {
    const { map } = starterEquipped()
    expect(fingerprint(map, ['s0', 'o1'], defaultSockets)).toBe(
      fingerprint(map, ['o1', 's0'], defaultSockets),
    )
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

function basePower() {
  return {
    dps: 300, ehp: 8000, life: 6000, armour: 500, block: 20, attackSpeed: 1.4,
    critChance: 20, critMulti: 180, fireRes: 40, coldRes: 40, litRes: 40, chaosRes: 40,
    strength: 200, dexterity: 40, intelligence: 40, supportCap: 2,
  }
}
