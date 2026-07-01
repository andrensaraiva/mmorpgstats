/* =========================================================
   BuildsWar :: motor puro
   Agrega stats de equipado + árvore + suportes, deriva
   DPS/EHP/resistências, executa crafting (orbes/corrupção),
   calcula tempo/sobrevivência de dungeon e o fingerprint da
   build (mecânica de "números descobertos").

   Sem estado global; toda aleatoriedade entra por um Rng.
   ========================================================= */

import {
  AFFIX_GROUPS,
  MAIN_SKILL_ID,
  SKILLS,
  SUPPORTS,
  TREE,
  getBase,
} from './content'
import type {
  AffixGroup,
  AffixKind,
  Dungeon,
  DungeonOutcome,
  EquipSlot,
  ItemBase,
  ItemInstance,
  Power,
  Rarity,
  RolledAffix,
  StatKey,
  StatMods,
  TreeNode,
} from './types'

/* ---------- RNG ---------- */

export type Rng = () => number

/** Mulberry32 — RNG determinístico por seed (testes e reprodutibilidade). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const rint = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1))
const pick = <T,>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)]

/* ---------- mods ---------- */

export function addMods(target: StatMods, src?: StatMods): StatMods {
  if (!src) return target
  for (const k of Object.keys(src) as StatKey[]) {
    target[k] = (target[k] ?? 0) + (src[k] ?? 0)
  }
  return target
}

/** Implícito da base + valores de todos os afixos rolados. */
export function resolveItemMods(item: ItemInstance): StatMods {
  const base = getBase(item.baseId)
  const total: StatMods = {}
  addMods(total, base.implicit)
  for (const a of item.affixes) addMods(total, a.values)
  return total
}

export function itemGlyph(item: ItemInstance): string {
  const base = getBase(item.baseId)
  return (base.name || '?').trim().charAt(0).toUpperCase()
}

/* ---------- equip ---------- */

const RING_SLOTS: EquipSlot[] = ['ring1', 'ring2']

export function slotAccepts(base: ItemBase, slot: EquipSlot): boolean {
  if (base.kind === 'ring') return RING_SLOTS.includes(slot)
  return base.kind === slot
}

/* ===================== POWER MODEL ===================== */

const supportById = Object.fromEntries(SUPPORTS.map((s) => [s.id, s]))
const nodeById = Object.fromEntries(TREE.nodes.map((n) => [n.id, n])) as Record<string, TreeNode>
const mainSkill = SKILLS.find((s) => s.id === MAIN_SKILL_ID)!

const BASE_LIFE = 500
const ARMOUR_K = 1500
const RES_CAP = 75
const RES_FLOOR = -60

export interface AggregateInput {
  equipped: ItemInstance[]
  allocated: Set<string> | string[]
  sockets: Record<string, string[]>
}

export function aggregate({ equipped, allocated, sockets }: AggregateInput): Power {
  const alloc = Array.isArray(allocated) ? allocated : Array.from(allocated)

  // Mods globais: equipamento + árvore.
  const global: StatMods = {}
  let weaponPhysMin = 2
  let weaponPhysMax = 6
  let weaponAps = 1.2
  for (const item of equipped) {
    const base = getBase(item.baseId)
    if (base.weapon) {
      weaponPhysMin = base.weapon.physMin
      weaponPhysMax = base.weapon.physMax
      weaponAps = base.weapon.attackSpeed
    }
    addMods(global, resolveItemMods(item))
  }
  for (const id of alloc) addMods(global, nodeById[id]?.mods)

  // Mods específicos do golpe principal (suportes só valem na habilidade).
  // `more`/`less` são multiplicativos e ficam à parte; skillMods só carrega os
  // aditivos (phys/crit/vel) usados no cálculo do golpe médio.
  const skillMods: StatMods = { ...global }
  let moreDamage = global.moreDamage ?? 0
  const lessDamage = global.lessDamage ?? 0
  const mainSockets = sockets[MAIN_SKILL_ID] ?? []
  for (const sid of mainSockets) {
    const sup = supportById[sid]
    if (!sup) continue
    addMods(skillMods, sup.mods)
    moreDamage += sup.mods.moreDamage ?? 0
  }

  const physMin = weaponPhysMin + (skillMods.addedPhysMin ?? 0)
  const physMax = weaponPhysMax + (skillMods.addedPhysMax ?? 0)
  const avgHit = ((physMin + physMax) / 2) * (1 + (skillMods.incPhys ?? 0) / 100)
  const attackSpeed = weaponAps * (1 + (skillMods.incAttackSpeed ?? 0) / 100)
  const critChance = clamp(5 + (skillMods.critChance ?? 0), 0, 100)
  const critMulti = 150 + (skillMods.critMulti ?? 0)
  const critFactor = 1 + (critChance / 100) * (critMulti / 100 - 1)

  const dps =
    avgHit *
    attackSpeed *
    critFactor *
    mainSkill.damageMult *
    (1 + moreDamage / 100) *
    (1 - lessDamage / 100)

  const strength = global.strength ?? 0
  const life = Math.round((BASE_LIFE + strength + (global.flatLife ?? 0)) * (1 + (global.incLife ?? 0) / 100))
  const armour = global.armour ?? 0
  const armourMit = armour / (armour + ARMOUR_K)
  const ehp = Math.round(life * (1 + armourMit))

  return {
    dps: Math.round(dps),
    ehp,
    life,
    armour,
    block: clamp(global.block ?? 0, 0, RES_CAP),
    attackSpeed: Math.round(attackSpeed * 100) / 100,
    critChance: Math.round(critChance),
    critMulti: Math.round(critMulti),
    fireRes: clamp(global.fireRes ?? 0, RES_FLOOR, RES_CAP),
    coldRes: clamp(global.coldRes ?? 0, RES_FLOOR, RES_CAP),
    litRes: clamp(global.litRes ?? 0, RES_FLOOR, RES_CAP),
    strength,
    dexterity: global.dexterity ?? 0,
    intelligence: global.intelligence ?? 0,
    supportCap: 2 + (global.supportCap ?? 0),
  }
}

/** Dano relativo de uma habilidade dada sua lista de suportes. */
export function skillRelativeDamage(skillId: string, sockets: Record<string, string[]>): number {
  const skill = SKILLS.find((s) => s.id === skillId)
  if (!skill || skill.damageMult === 0) return 0
  let more = 0
  for (const sid of sockets[skillId] ?? []) more += supportById[sid]?.mods.moreDamage ?? 0
  return skill.damageMult * (1 + more / 100)
}

/* ===================== NÚMEROS DESCOBERTOS ===================== */

/**
 * Fingerprint estável da build. Trocar item, craftar (novo uid), alocar
 * nó ou mexer em soquete muda o hash — invalidando o DPS medido.
 */
export function fingerprint(
  equipped: Partial<Record<EquipSlot, string>>,
  allocated: Set<string> | string[],
  sockets: Record<string, string[]>,
): string {
  const eq = Object.keys(equipped)
    .sort()
    .map((slot) => `${slot}:${equipped[slot as EquipSlot] ?? '-'}`)
    .join('|')
  const alloc = (Array.isArray(allocated) ? allocated : Array.from(allocated)).slice().sort().join(',')
  const sk = Object.keys(sockets)
    .sort()
    .map((k) => `${k}:${(sockets[k] ?? []).join('+')}`)
    .join('|')
  return `${eq}#${alloc}#${sk}`
}

/** Faixa de estimativa exibida enquanto o DPS real não foi medido (±15%). */
export function estimateRange(dps: number): [number, number] {
  return [Math.round(dps * 0.85), Math.round(dps * 1.15)]
}

/* ===================== DUNGEON ===================== */

const DUNGEON_TIME_K = 12

export function dungeonOutcome(dungeon: Dungeon, power: Power): DungeonOutcome {
  const seconds = clamp((dungeon.diff / Math.max(1, power.dps)) * DUNGEON_TIME_K, 45, 900)
  const survivable = !dungeon.fireThreat || power.fireRes >= dungeon.fireReq
  return { seconds: Math.round(seconds), survivable }
}

/* ===================== CRAFTING ===================== */

let craftSeq = 1000
function nextUid(): string {
  craftSeq += 1
  return `cr_${craftSeq}`
}

function affixText(template: string, values: StatMods): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key as StatKey] ?? '?'))
}

function eligibleGroups(base: ItemBase, itemLevel: number, kind: AffixKind, used: Set<string>): AffixGroup[] {
  return AFFIX_GROUPS.filter(
    (g) =>
      g.kind === kind &&
      g.classes.includes(base.itemClass) &&
      !used.has(g.id) &&
      g.tiers.some((t) => t.minItemLevel <= itemLevel),
  )
}

function rollAffix(group: AffixGroup, itemLevel: number, rng: Rng): RolledAffix {
  const tiers = group.tiers.filter((t) => t.minItemLevel <= itemLevel)
  const tier = pick(rng, tiers)
  const values: StatMods = {}
  for (const key of Object.keys(tier.ranges) as StatKey[]) {
    const [lo, hi] = tier.ranges[key]!
    values[key] = rint(rng, lo, hi)
  }
  return { groupId: group.id, kind: group.kind, tier: tier.tier, values, text: affixText(tier.text, values) }
}

const RARITY_CAP: Record<Rarity, number> = { common: 0, magic: 1, rare: 3, unique: 0 }

function countKind(affixes: RolledAffix[], kind: AffixKind): number {
  return affixes.filter((a) => a.kind === kind).length
}

function addAffixOfKind(
  affixes: RolledAffix[],
  base: ItemBase,
  itemLevel: number,
  kind: AffixKind,
  rng: Rng,
): boolean {
  const used = new Set(affixes.map((a) => a.groupId))
  const groups = eligibleGroups(base, itemLevel, kind, used)
  if (groups.length === 0) return false
  affixes.push(rollAffix(pick(rng, groups), itemLevel, rng))
  return true
}

function openKinds(affixes: RolledAffix[], rarity: Rarity): AffixKind[] {
  const cap = RARITY_CAP[rarity]
  const out: AffixKind[] = []
  if (countKind(affixes, 'prefix') < cap) out.push('prefix')
  if (countKind(affixes, 'suffix') < cap) out.push('suffix')
  return out
}

const RARE_PREFIXES = ['Fúria', 'Presságio', 'Ruína', 'Brasa', 'Corvo', 'Juramento', 'Cinza', 'Trovão']
const RARE_SUFFIXES = ['do Abismo', 'das Sombras', 'do Ocaso', 'do Bastião', 'da Tempestade', 'do Carrasco']

function genRareName(rng: Rng): string {
  return `${pick(rng, RARE_PREFIXES)} ${pick(rng, RARE_SUFFIXES)}`
}

export type CraftResult =
  | { ok: true; item: ItemInstance; message: string }
  | { ok: false; message: string }

/** Pode aplicar o orbe? (usado pela UI para habilitar/desabilitar). */
export function canCraft(orb: string, item: ItemInstance): boolean {
  if (item.corrupted) return false
  switch (orb) {
    case 'transmutation':
      return item.rarity === 'common'
    case 'alteration':
      return item.rarity === 'magic'
    case 'regal':
      return item.rarity === 'magic'
    case 'exalt':
      return item.rarity === 'rare' && openKinds(item.affixes, 'rare').length > 0
    case 'chaos':
      return item.rarity === 'rare'
    case 'divine':
      return item.affixes.length > 0
    case 'vaal':
      return true
    default:
      return false
  }
}

function reroll(base: ItemBase, itemLevel: number, rarity: Rarity, min: number, max: number, rng: Rng): RolledAffix[] {
  const affixes: RolledAffix[] = []
  const target = rint(rng, min, max)
  let guard = 0
  while (affixes.length < target && guard < 24) {
    guard += 1
    const kinds = openKinds(affixes, rarity)
    if (kinds.length === 0) break
    addAffixOfKind(affixes, base, itemLevel, pick(rng, kinds), rng)
  }
  return affixes
}

function divineReroll(affixes: RolledAffix[], rng: Rng): RolledAffix[] {
  return affixes.map((a) => {
    const group = AFFIX_GROUPS.find((g) => g.id === a.groupId)
    const tier = group?.tiers.find((t) => t.tier === a.tier)
    if (!group || !tier) return a
    const values: StatMods = {}
    for (const key of Object.keys(tier.ranges) as StatKey[]) {
      const [lo, hi] = tier.ranges[key]!
      values[key] = rint(rng, lo, hi)
    }
    return { ...a, values, text: affixText(tier.text, values) }
  })
}

/**
 * Aplica um orbe a um item, retornando uma NOVA instância (uid novo, o que
 * invalida o fingerprint da build e força re-teste do DPS). Nunca muta a entrada.
 */
export function craft(orb: string, item: ItemInstance, rng: Rng): CraftResult {
  if (!canCraft(orb, item)) {
    return { ok: false, message: 'Este orbe não pode ser aplicado a este item.' }
  }
  const base = getBase(item.baseId)
  const next: ItemInstance = { ...item, uid: nextUid(), affixes: item.affixes.map((a) => ({ ...a })) }

  switch (orb) {
    case 'transmutation': {
      next.rarity = 'magic'
      next.affixes = []
      addAffixOfKind(next.affixes, base, next.itemLevel, rng() < 0.5 ? 'prefix' : 'suffix', rng)
      return { ok: true, item: next, message: `${base.name} agora é mágico.` }
    }
    case 'alteration': {
      next.affixes = reroll(base, next.itemLevel, 'magic', 1, 2, rng)
      return { ok: true, item: next, message: 'Afixos mágicos rerodados.' }
    }
    case 'regal': {
      next.rarity = 'rare'
      next.name = genRareName(rng)
      addAffixOfKind(next.affixes, base, next.itemLevel, pick(rng, openKinds(next.affixes, 'rare')), rng)
      return { ok: true, item: next, message: `Aprimorado para raro: ${next.name}.` }
    }
    case 'exalt': {
      const kinds = openKinds(next.affixes, 'rare')
      addAffixOfKind(next.affixes, base, next.itemLevel, pick(rng, kinds), rng)
      return { ok: true, item: next, message: 'Novo afixo adicionado.' }
    }
    case 'chaos': {
      next.affixes = reroll(base, next.itemLevel, 'rare', 4, 6, rng)
      next.name = genRareName(rng)
      return { ok: true, item: next, message: 'Item raro rerodado do zero.' }
    }
    case 'divine': {
      next.affixes = divineReroll(next.affixes, rng)
      return { ok: true, item: next, message: 'Valores rerodados dentro das faixas.' }
    }
    case 'vaal': {
      next.corrupted = true
      const roll = rng()
      if (roll < 0.25) {
        next.affixes = reroll(base, next.itemLevel, next.rarity === 'common' ? 'magic' : next.rarity, 1, RARITY_CAP[next.rarity] * 2 || 1, rng)
        return { ok: true, item: next, message: 'Corrompido — a sorte rerodou o item.' }
      }
      if (roll < 0.5 && openKinds(next.affixes, next.rarity).length > 0) {
        addAffixOfKind(next.affixes, base, next.itemLevel, pick(rng, openKinds(next.affixes, next.rarity)), rng)
        return { ok: true, item: next, message: 'Corrompido — um modificador implícito surgiu.' }
      }
      if (roll < 0.75) {
        next.affixes = divineReroll(next.affixes, rng)
        return { ok: true, item: next, message: 'Corrompido — valores mudaram.' }
      }
      return { ok: true, item: next, message: 'Corrompido — nada mudou, mas o item está travado.' }
    }
    default:
      return { ok: false, message: 'Orbe desconhecido.' }
  }
}

/* ---------- árvore: utilidades puras ---------- */

const adjacency: Record<string, string[]> = {}
for (const [a, b] of TREE.edges) {
  ;(adjacency[a] ||= []).push(b)
  ;(adjacency[b] ||= []).push(a)
}
export function treeAdjacency(): Record<string, string[]> {
  return adjacency
}

/** Todos os nós de `set` continuam conectados à origem? */
export function connectedToStart(set: Set<string>, start: string): boolean {
  const seen = new Set<string>()
  const stack = [start]
  while (stack.length) {
    const cur = stack.pop()!
    if (seen.has(cur)) continue
    seen.add(cur)
    for (const nb of adjacency[cur] ?? []) if (set.has(nb) && !seen.has(nb)) stack.push(nb)
  }
  return Array.from(set).every((id) => seen.has(id))
}
