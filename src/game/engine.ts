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
  BASIC_ATTACK,
  BESTIARY,
  MAIN_SKILL_ID,
  SKILLS,
  SUPPORTS,
  TREE,
  getBase,
} from './content'
import type {
  AffixGroup,
  AffixKind,
  AilmentId,
  DamageByType,
  DamageType,
  Dungeon,
  DungeonOutcome,
  DungeonReplay,
  DungeonReport,
  DungeonRun,
  EquipSlot,
  FailReason,
  ItemBase,
  ItemInstance,
  MarkerKind,
  MarkId,
  Monster,
  Power,
  Rarity,
  ReplayMarker,
  RolledAffix,
  RotationBottleneck,
  RotationResult,
  SkillDefinition,
  SkillSlot,
  StatKey,
  StatMods,
  TargetProfile,
  TickEvent,
  TreeNode,
  WeaponType,
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

/**
 * Implícito da base + defesas-base (amplificadas pela qualidade) + afixos.
 * Qualidade (S1) amplia só a **base local** (defesas da base e dano da arma),
 * não os afixos — fiel ao gênero.
 */
export function resolveItemMods(item: ItemInstance): StatMods {
  const base = getBase(item.baseId)
  const total: StatMods = {}
  addMods(total, base.implicit)
  // Defesas da base, escaladas pela qualidade.
  if (base.defences) {
    const q = 1 + (item.quality ?? 0) / 100
    if (base.defences.armour) total.armour = (total.armour ?? 0) + Math.round(base.defences.armour * q)
    if (base.defences.evasion) total.evasion = (total.evasion ?? 0) + Math.round(base.defences.evasion * q)
    if (base.defences.energyShield)
      total.energyShield = (total.energyShield ?? 0) + Math.round(base.defences.energyShield * q)
  }
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

/** Requisitos de um item para equipar (S1) — atributos do herói + nível. */
export interface HeroReqStats {
  level: number
  str: number
  dex: number
  int: number
}

/** Quais requisitos do item o herói NÃO atende (vazio = pode equipar). */
export function unmetRequirements(item: ItemInstance, hero: HeroReqStats): Array<'level' | 'str' | 'dex' | 'int'> {
  const req = getBase(item.baseId).requires
  if (!req) return []
  const out: Array<'level' | 'str' | 'dex' | 'int'> = []
  if (req.level && hero.level < req.level) out.push('level')
  if (req.str && hero.str < req.str) out.push('str')
  if (req.dex && hero.dex < req.dex) out.push('dex')
  if (req.int && hero.int < req.int) out.push('int')
  return out
}

/** Tipos de arma atualmente equipados (S3). */
export function equippedWeaponTypes(equipped: ItemInstance[]): WeaponType[] {
  const out: WeaponType[] = []
  for (const it of equipped) {
    const wt = getBase(it.baseId).weaponType
    if (wt) out.push(wt)
  }
  return out
}

/**
 * Uma skill está disponível (S3) se a arma equipada casa com `requires.weapon`
 * (ou a skill não exige arma) e o herói atende ao nível. Devolve por que está
 * travada, quando estiver.
 */
export function skillAvailability(
  skill: SkillDefinition,
  equipped: ItemInstance[],
  level: number,
): { available: boolean; reason?: 'weapon' | 'level' } {
  const req = skill.requires
  if (!req) return { available: true }
  if (req.level && level < req.level) return { available: false, reason: 'level' }
  if (req.weapon && req.weapon.length > 0) {
    const wts = equippedWeaponTypes(equipped)
    if (!req.weapon.some((w) => wts.includes(w))) return { available: false, reason: 'weapon' }
  }
  return { available: true }
}

/** Catálogo filtrado: as skills disponíveis para a arma+nível atuais (S3). */
export function availableSkills(
  skills: SkillDefinition[],
  equipped: ItemInstance[],
  level: number,
): SkillDefinition[] {
  return skills.filter((s) => skillAvailability(s, equipped, level).available)
}

/* ===================== PROGRESSÃO (XP / NÍVEL) ===================== */
/*
   Curva de XP inspirada no gênero: cada nível pede mais que o anterior. Puro e
   determinístico. XP vem de dungeons vencidas, escalado pelo nível do encontro.
   Ver docs/PROGRESSION_AND_STORY.md §2.3.
*/

export const MAX_LEVEL = 60

/** XP total acumulado necessário para ATINGIR um dado nível (nível 1 = 0). */
export function xpForLevel(level: number): number {
  const l = clamp(level, 1, MAX_LEVEL)
  // Soma de um custo por nível que cresce ~quadraticamente (piso do gênero).
  let total = 0
  for (let n = 1; n < l; n++) total += 100 + n * n * 8
  return total
}

/** Nível correspondente a um XP total acumulado. */
export function levelForXp(xp: number): number {
  let lvl = 1
  while (lvl < MAX_LEVEL && xp >= xpForLevel(lvl + 1)) lvl++
  return lvl
}

/** Progresso (0–1) dentro do nível atual, e XP faltando p/ o próximo. */
export function levelProgress(xp: number): { level: number; into: number; span: number; frac: number } {
  const level = levelForXp(xp)
  const cur = xpForLevel(level)
  const next = level >= MAX_LEVEL ? cur : xpForLevel(level + 1)
  const span = Math.max(1, next - cur)
  const into = xp - cur
  return { level, into, span, frac: level >= MAX_LEVEL ? 1 : clamp(into / span, 0, 1) }
}

/**
 * XP concedido por uma tentativa de dungeon. Vitória dá cheio; derrota dá uma
 * fração pelo que limpou (não punir demais — o jogador aprendeu algo). Escala
 * com o nível do encontro.
 */
export function dungeonXp(dungeonLevel: number, win: boolean, clearedFraction = 0): number {
  const base = 40 + dungeonLevel * dungeonLevel * 2
  return Math.round(win ? base : base * 0.25 * clamp(clearedFraction, 0, 1))
}

/** Pontos de talento ganhos: 1 por nível (a partir do 2) + bônus por marco. */
export const TALENT_PER_MARK = 2
export function talentPoints(level: number, marksCompleted: number): number {
  return Math.max(0, level - 1) + marksCompleted * TALENT_PER_MARK
}

/* ===================== MAESTRIA DE SKILL (SK1) ===================== */
/*
   Cada skill ganha XP ao ser levada numa dungeon vencida e sobe de maestria
   (1..MAX). Cada nível concede +MASTERY_BONUS% de dano ÀQUELA skill — usar a
   skill a evolui (à la árvore de skill do Last Epoch, versão enxuta e pura).
*/

export const MAX_MASTERY = 10
/** +% de `more` de dano por nível de maestria acima de 1. */
export const MASTERY_BONUS_PER_LEVEL = 4

/** Nível de maestria (1..MAX_MASTERY) para um XP de skill acumulado. */
export function skillMasteryLevel(skillXp: number): number {
  let lvl = 1
  // Cada nível pede 100 × nível de XP (curva suave).
  let need = 0
  for (let n = 1; n < MAX_MASTERY; n++) {
    need += 100 * n
    if (skillXp >= need) lvl = n + 1
    else break
  }
  return lvl
}

/** Bônus de `more` de dano (%) concedido pela maestria de uma skill. */
export function masteryDamageBonus(masteryLevel: number): number {
  return (clamp(masteryLevel, 1, MAX_MASTERY) - 1) * MASTERY_BONUS_PER_LEVEL
}

/* ===================== POWER MODEL ===================== */

const supportById = Object.fromEntries(SUPPORTS.map((s) => [s.id, s]))
const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<string, SkillDefinition>
const nodeById = Object.fromEntries(TREE.nodes.map((n) => [n.id, n])) as Record<string, TreeNode>
const mainSkill = SKILLS.find((s) => s.id === MAIN_SKILL_ID)!

const BASE_LIFE = 500
const ARMOUR_K = 1500
const RES_CAP = 75
const RES_FLOOR = -60

// Camadas de defesa (M2). Evasão vira chance de esquiva por entropia (valor
// esperado, determinístico): evade = evasão / (evasão + EVASION_K × golpe),
// teto 95%. A armadura no EHP usa um golpe de referência proporcional à vida.
const EVASION_K = 8
const EVASION_CAP = 0.95
// Golpe de referência para dimensionar armadura/evasão no EHP agregado (um
// "hit típico" que ameaça o herói ≈ fração da vida). Puramente para o número
// de EHP exibido; a dungeon usa o golpe real do encontro.
const EHP_REF_HIT_FRAC = 0.15

// Recurso do herói (mana/energia). R1: constantes (placeholder). Depois deriva
// de atributos/afixos, conforme COMBAT_AND_ARCHETYPES §A0.
const RESOURCE_MAX = 100
const RESOURCE_REGEN = 10

function deriveResource(_global: StatMods): { max: number; regen: number } {
  return { max: RESOURCE_MAX, regen: RESOURCE_REGEN }
}

export interface AggregateInput {
  equipped: ItemInstance[]
  allocated: Set<string> | string[]
  sockets: Record<string, string[]>
}

/**
 * Contexto de combate da build **sem** os suportes de skill: arma + mods
 * globais (equipamento + árvore). O `aggregate` (golpe principal) e o
 * `simulateRotation` (loadout inteiro) consomem isto e sobrepõem, cada um,
 * os suportes da sua habilidade.
 */
interface BuildContext {
  weaponPhysMin: number
  weaponPhysMax: number
  weaponAps: number
  global: StatMods
}

function buildContext(equipped: ItemInstance[], allocated: Set<string> | string[]): BuildContext {
  const alloc = Array.isArray(allocated) ? allocated : Array.from(allocated)
  const global: StatMods = {}
  let weaponPhysMin = 2
  let weaponPhysMax = 6
  let weaponAps = 1.2
  for (const item of equipped) {
    const base = getBase(item.baseId)
    if (base.weapon) {
      // Qualidade (S1) amplia o dano físico da arma.
      const q = 1 + (item.quality ?? 0) / 100
      weaponPhysMin = base.weapon.physMin * q
      weaponPhysMax = base.weapon.physMax * q
      weaponAps = base.weapon.attackSpeed
    }
    addMods(global, resolveItemMods(item))
  }
  for (const id of alloc) addMods(global, nodeById[id]?.mods)
  return { weaponPhysMin, weaponPhysMax, weaponAps, global }
}

export function aggregate({ equipped, allocated, sockets }: AggregateInput): Power {
  const ctx = buildContext(equipped, allocated)
  const { global } = ctx

  // DPS do golpe principal via o mesmo pipeline por tipo do simulador (contra
  // alvo sem defesa) — mantém `aggregate.dps` idêntico ao dano de um golpe.
  const mainSockets = sockets[MAIN_SKILL_ID] ?? []
  const prepared = prepareSkill(ctx, mainSkill, mainSockets)
  const attackSpeed = prepared.actionTime > 0 ? 1 / prepared.actionTime : ctx.weaponAps
  const dps = preparedHit(prepared, { armour: 0 }, false) * attackSpeed

  // Crítico exibido (mesma fórmula do prepareSkill).
  const skillMods: StatMods = { ...global }
  for (const sid of mainSockets) addMods(skillMods, supportById[sid]?.mods ?? {})
  const critChance = clamp(5 + (skillMods.critChance ?? 0), 0, 100)
  const critMulti = 150 + (skillMods.critMulti ?? 0)

  const strength = global.strength ?? 0
  const life = Math.round((BASE_LIFE + strength + (global.flatLife ?? 0)) * (1 + (global.incLife ?? 0) / 100))
  const armour = global.armour ?? 0
  const evasion = Math.round((global.evasion ?? 0) * (1 + (global.incEvasion ?? 0) / 100))
  const energyShield = Math.round((global.energyShield ?? 0) * (1 + (global.incEnergyShield ?? 0) / 100))
  const block = clamp(global.block ?? 0, 0, RES_CAP)

  // EHP em camadas (M2): pool = vida + ES; mitigação física por armadura+evasão
  // contra um golpe de referência; bloqueio como redução média.
  const pool = life + energyShield
  const refHit = Math.max(1, pool * EHP_REF_HIT_FRAC)
  const armourMit = Math.min(ARMOUR_MIT_CAP, armour / (armour + ARMOUR_HIT_K * refHit))
  const evadeChance = Math.min(EVASION_CAP, evasion / (evasion + EVASION_K * refHit))
  const blockMit = block / 100
  const physTaken = (1 - armourMit) * (1 - evadeChance) * (1 - blockMit)
  const ehp = Math.round(pool / Math.max(0.05, physTaken))
  const resource = deriveResource(global)

  return {
    dps: Math.round(dps),
    ehp,
    life,
    armour,
    evasion,
    energyShield,
    block,
    attackSpeed: Math.round(attackSpeed * 100) / 100,
    critChance: Math.round(critChance),
    critMulti: Math.round(critMulti),
    fireRes: clamp(global.fireRes ?? 0, RES_FLOOR, RES_CAP),
    coldRes: clamp(global.coldRes ?? 0, RES_FLOOR, RES_CAP),
    litRes: clamp(global.litRes ?? 0, RES_FLOOR, RES_CAP),
    chaosRes: clamp(global.chaosRes ?? 0, RES_FLOOR, RES_CAP),
    strength,
    dexterity: global.dexterity ?? 0,
    intelligence: global.intelligence ?? 0,
    supportCap: 2 + (global.supportCap ?? 0),
    resourceMax: resource.max,
    resourceRegen: resource.regen,
    firePen: global.firePen ?? 0,
    coldPen: global.coldPen ?? 0,
    lightningPen: global.lightningPen ?? 0,
    chaosPen: global.chaosPen ?? 0,
  }
}

/* ===================== SIMULADOR DE ROTAÇÃO (fatia do M5) ===================== */
/*
   Executa o loadout no tempo (recurso + cooldown + cast + combo setup→payoff)
   e devolve o DPS medido + diagnóstico. Determinístico: o crítico entra por
   valor esperado (sem RNG), então a mesma build+rotação+alvo dá sempre o mesmo
   número — preservando a mecânica de "números descobertos".
   Ver docs/COMBAT_ROTATION_AND_DUMMY.md §4.
*/

// COMBAT §A2: redução = Armadura / (Armadura + 12 × dano_do_golpe). Golpe grande
// fura a armadura; golpe pequeno é mitigado (trade-off real).
const ARMOUR_HIT_K = 12
const ARMOUR_MIT_CAP = 0.9

/** Os quatro tipos que a resistência do alvo mitiga (físico usa armadura). */
const ELEMENTAL_TYPES: DamageType[] = ['fire', 'cold', 'lightning', 'chaos']

// Ailments/DoT (M3). Cada golpe com ailment gera dano-ao-longo-do-tempo do tipo
// correspondente. Veneno empilha (soma as aplicações); sangramento/queimadura
// refrescam (vale o stack mais forte, uptime pleno). Ver COMBAT §A2.
const AILMENT_TYPE: Record<AilmentId, DamageType> = {
  bleed: 'phys',
  ignite: 'fire',
  poison: 'chaos',
}
const AILMENT_STACKS: Record<AilmentId, boolean> = {
  bleed: false,
  ignite: false,
  poison: true,
}

/** Faixas de `added{Tipo}` por StatKey, por tipo de dano (M1). */
const ADDED_KEYS: Record<DamageType, [StatKey, StatKey]> = {
  phys: ['addedPhysMin', 'addedPhysMax'],
  fire: ['addedFireMin', 'addedFireMax'],
  cold: ['addedColdMin', 'addedColdMax'],
  lightning: ['addedLightningMin', 'addedLightningMax'],
  chaos: ['addedChaosMin', 'addedChaosMax'],
}
const INC_KEY: Record<DamageType, StatKey> = {
  phys: 'incPhys',
  fire: 'incFire',
  cold: 'incCold',
  lightning: 'incLightning',
  chaos: 'incChaos',
}
const PEN_KEY: Record<DamageType, StatKey | null> = {
  phys: null,
  fire: 'firePen',
  cold: 'coldPen',
  lightning: 'lightningPen',
  chaos: 'chaosPen',
}
const RES_KEY: Record<DamageType, keyof TargetProfile | null> = {
  phys: null,
  fire: 'fireRes',
  cold: 'coldRes',
  lightning: 'litRes',
  chaos: 'chaosRes',
}

/**
 * Dano-médio por tipo de uma skill, antes de crítico/mult/more/less. Físico
 * vem da arma (a menos que a skill tenha `baseDamage` próprio e tipo ≠ phys);
 * cada tipo soma seu `added{Tipo}` de afixos e o aumentado (aditivo) do tipo +
 * o guarda-chuva elemental. Ver COMBAT §A2/A3.
 */
function avgHitByType(ctx: BuildContext, def: SkillDefinition, mods: StatMods): DamageByType {
  const type = def.damageType ?? 'phys'
  const incElem = mods.incElemental ?? 0
  const out: DamageByType = {}
  for (const dt of ['phys', ...ELEMENTAL_TYPES] as DamageType[]) {
    const [minK, maxK] = ADDED_KEYS[dt]
    let min = mods[minK] ?? 0
    let max = mods[maxK] ?? 0
    // O dano-base da skill entra no seu tipo primário.
    if (dt === type) {
      if (def.baseDamage && type !== 'phys') {
        min += def.baseDamage.min
        max += def.baseDamage.max
      } else if (type === 'phys') {
        min += ctx.weaponPhysMin
        max += ctx.weaponPhysMax
      }
    }
    if (min <= 0 && max <= 0) continue
    const inc = (mods[INC_KEY[dt]] ?? 0) + (dt !== 'phys' ? incElem : 0)
    out[dt] = ((min + max) / 2) * (1 + inc / 100)
  }
  return out
}

/** Uma skill do loadout já "compilada" para o loop (dano/tempo pré-calculados). */
interface PreparedSkill {
  def: SkillDefinition
  /** Tempo de uma ação (s): cast fixo, ou 1/vel.ataque para ataques. */
  actionTime: number
  /** Golpe médio por tipo SEM o `more` (avgHit × crítico × mult × (1−less)). */
  perHitByType: DamageByType
  /** `more` de global + suportes (sem o bônus de combo). */
  moreBase: number
  /** Penetração do herói por tipo elemental/caos. */
  pen: Record<DamageType, number>
  /** DoT/s que um golpe aplica (M3), já com incDot; 0 se a skill não causa ailment. */
  ailmentDpsBase: number
}

function prepareSkill(ctx: BuildContext, def: SkillDefinition, supports: string[], extraMore = 0): PreparedSkill {
  const skillMods: StatMods = { ...ctx.global }
  let moreBase = (ctx.global.moreDamage ?? 0) + extraMore
  const lessDamage = ctx.global.lessDamage ?? 0
  // Selo elemental (SK2): converte o tipo de dano / adiciona ailment.
  let convertsTo: DamageType | undefined
  let addsAilment: AilmentId | undefined
  for (const sid of supports) {
    const sup = supportById[sid]
    if (!sup) continue
    addMods(skillMods, sup.mods)
    moreBase += sup.mods.moreDamage ?? 0
    if (sup.convertsTo) convertsTo = sup.convertsTo
    if (sup.addsAilment) addsAilment = sup.addsAilment
  }
  const critChance = clamp(5 + (skillMods.critChance ?? 0), 0, 100)
  const critMulti = 150 + (skillMods.critMulti ?? 0)
  const critFactor = 1 + (critChance / 100) * (critMulti / 100 - 1)
  const attackSpeed = ctx.weaponAps * (1 + (skillMods.incAttackSpeed ?? 0) / 100)
  const actionTime = def.castTime > 0 ? def.castTime : 1 / attackSpeed
  const scale = critFactor * def.damageMult * (1 - lessDamage / 100)

  const avg = avgHitByType(ctx, def, skillMods)
  let perHitByType: DamageByType = {}
  for (const dt of Object.keys(avg) as DamageType[]) perHitByType[dt] = (avg[dt] ?? 0) * scale

  // Conversão de tipo (SK2): move TODO o dano por tipo para o tipo do selo.
  if (convertsTo) {
    let sum = 0
    for (const dt of Object.keys(perHitByType) as DamageType[]) sum += perHitByType[dt] ?? 0
    perHitByType = { [convertsTo]: sum }
  }

  const pen: Record<DamageType, number> = {
    phys: 0,
    fire: skillMods.firePen ?? 0,
    cold: skillMods.coldPen ?? 0,
    lightning: skillMods.lightningPen ?? 0,
    chaos: skillMods.chaosPen ?? 0,
  }

  // Ailment efetivo: o próprio da skill OU o adicionado por um selo (SK2/SK3).
  const effAilment = addsAilment ?? def.ailment

  // DoT/s que um golpe aplica (M3): fração do dano do golpe (do tipo do ailment)
  // × (1 + incDot). A mitigação por resistência entra no tick, como no hit.
  let ailmentDpsBase = 0
  if (effAilment) {
    const at = AILMENT_TYPE[effAilment]
    const hitOfType = (perHitByType[at] ?? 0) * (1 + moreBase / 100)
    ailmentDpsBase = hitOfType * (def.ailmentMult ?? 0.4) * (1 + (skillMods.incDot ?? 0) / 100)
  }
  const effDef = effAilment !== def.ailment ? { ...def, ailment: effAilment } : def
  return { def: effDef, actionTime, perHitByType, moreBase, pen, ailmentDpsBase }
}

/** Mitigação do alvo para um golpe de dano `raw` de um dado tipo. */
function mitigateHit(dt: DamageType, raw: number, target: TargetProfile, pen: number): number {
  if (raw <= 0) return 0
  if (dt === 'phys') {
    if (target.armour <= 0) return raw
    const reduction = Math.min(ARMOUR_MIT_CAP, target.armour / (target.armour + ARMOUR_HIT_K * raw))
    return raw * (1 - reduction)
  }
  const resKey = RES_KEY[dt]
  const res = resKey ? (target[resKey] as number | undefined) ?? 0 : 0
  const effRes = clamp(res - pen, RES_FLOOR, RES_CAP)
  return raw * (1 - effRes / 100)
}

/** Dano total de um golpe da skill contra o alvo, somando os tipos, com/sem combo. */
function preparedHit(p: PreparedSkill, target: TargetProfile, empowered: boolean): number {
  const more = p.moreBase + (empowered ? p.def.comboMore ?? 0 : 0)
  const moreFactor = 1 + more / 100
  let total = 0
  for (const dt of Object.keys(p.perHitByType) as DamageType[]) {
    const raw = (p.perHitByType[dt] ?? 0) * moreFactor
    total += mitigateHit(dt, raw, target, p.pen[dt])
  }
  return total
}

/** Dano por tipo de um golpe (para o breakdown do diagnóstico). */
function hitByType(p: PreparedSkill, target: TargetProfile, empowered: boolean): DamageByType {
  const more = p.moreBase + (empowered ? p.def.comboMore ?? 0 : 0)
  const moreFactor = 1 + more / 100
  const out: DamageByType = {}
  for (const dt of Object.keys(p.perHitByType) as DamageType[]) {
    const raw = (p.perHitByType[dt] ?? 0) * moreFactor
    out[dt] = mitigateHit(dt, raw, target, p.pen[dt])
  }
  return out
}

export interface SimulateInput {
  equipped: ItemInstance[]
  allocated: Set<string> | string[]
  /** Ativas escolhidas, em ordem de prioridade (a rotação). */
  loadout: SkillSlot[]
  /** O boneco de treino. */
  target: TargetProfile
  /** Janela de medição (s). */
  seconds: number
  /** Nível de maestria por skillId (SK1) — bônus de dano por skill. */
  mastery?: Record<string, number>
}

/**
 * Simula a rotação e mede o DPS. Puro e determinístico. Cada ação: escolhe a
 * skill de maior prioridade que esteja fora de cooldown e paga o recurso;
 * senão, cai no ataque básico (grátis) — nunca trava. Aplica combo (marca),
 * consome recurso, dispara cooldown e soma o dano; ao fim, DPS = dano/tempo.
 */
export function simulateRotation(input: SimulateInput): RotationResult {
  const { equipped, allocated, loadout, target, seconds, mastery } = input
  const ctx = buildContext(equipped, allocated)
  const { max: resMax, regen } = deriveResource(ctx.global)
  const masteryMore = (id: string) => masteryDamageBonus(mastery?.[id] ?? 1)

  // Só skills de golpe entram na rotação; utilitárias/fontes (damageMult 0) não.
  const prepared = loadout
    .map((slot) => prepareSkill(ctx, skillById[slot.skillId] ?? BASIC_ATTACK, slot.supports, masteryMore(slot.skillId)))
    .filter((p) => p.def.damageMult > 0)
  const basic = prepareSkill(ctx, BASIC_ATTACK, [])

  // Fontes externas (M4): minions/totens no loadout contribuem DPS contínuo,
  // independente da rotação. Cada uma tem orçamento próprio, mitigado pelo alvo.
  const sourceEntries: Array<{ skillId: string; dps: number; type: DamageType }> = []
  for (const slot of loadout) {
    const def = skillById[slot.skillId]
    if (!def?.source || !def.sourceDamage) continue
    const inc = def.source === 'minion' ? ctx.global.incMinion ?? 0 : ctx.global.incTotem ?? 0
    let more = ctx.global.moreDamage ?? 0
    for (const sid of slot.supports) more += supportById[sid]?.mods.moreDamage ?? 0
    const st = def.sourceDamageType ?? 'phys'
    const raw =
      ((def.sourceDamage.min + def.sourceDamage.max) / 2) *
      (def.sourceRate ?? 1) *
      (1 + inc / 100) *
      (1 + more / 100)
    const pen = st === 'phys' ? 0 : (ctx.global[PEN_KEY[st] as StatKey] ?? 0)
    sourceEntries.push({ skillId: def.id, dps: mitigateHit(st, raw, target, pen), type: st })
  }
  const sourceDpsTotal = sourceEntries.reduce((s, e) => s + e.dps, 0)

  let t = 0
  let resource = resMax
  const readyAt: Record<string, number> = {}
  const markExpiry: Partial<Record<MarkId, number>> = {}

  let total = 0
  let markActiveTime = 0
  let starvedActions = 0
  let basicActions = 0
  let actions = 0
  const per = new Map<string, { casts: number; damage: number }>()
  const byType: DamageByType = {}
  const timeline: TickEvent[] = []

  // DoT (M3): veneno empilha (soma dps×duração por aplicação); sangramento/
  // queimadura refrescam (guarda o maior dps de stack, uptime pleno).
  let poisonDamage = 0
  const refreshBestDps: Partial<Record<AilmentId, number>> = {}

  const guardMax = Math.ceil(seconds / 0.05) + 16 // trava anti-loop (toda ação tem dt>0)
  let guard = 0
  while (t < seconds && guard++ < guardMax) {
    // Escolhe a ação por prioridade (ordem do loadout).
    let chosen: PreparedSkill | null = null
    let costBlocked = false
    for (const p of prepared) {
      if (t < (readyAt[p.def.id] ?? 0)) continue // em cooldown
      if (resource < p.def.cost) {
        costBlocked = true // pronta no cooldown, mas sem recurso
        continue
      }
      chosen = p
      break
    }
    const isBasic = !chosen
    if (!chosen) chosen = basic

    const mark = chosen.def.empoweredBy
    const empowered = mark != null && (markExpiry[mark] ?? 0) > t
    const dt = chosen.actionTime
    const dmg = preparedHit(chosen, target, empowered)

    // Uptime da marca durante [t, t+dt] (antes de reaplicar).
    for (const m of Object.keys(markExpiry) as MarkId[]) {
      const exp = markExpiry[m] ?? 0
      if (exp > t) markActiveTime += Math.min(exp, t + dt) - t
    }

    // Aplica efeitos.
    total += dmg
    const parts = hitByType(chosen, target, empowered)
    for (const k of Object.keys(parts) as DamageType[]) byType[k] = (byType[k] ?? 0) + (parts[k] ?? 0)

    // DoT (M3): golpe que aplica ailment. O dps de stack já traz o `more` do
    // golpe; falta mitigar pela resistência do alvo (do tipo do ailment).
    if (chosen.def.ailment && chosen.ailmentDpsBase > 0) {
      const at = AILMENT_TYPE[chosen.def.ailment]
      const stackDps = mitigateHit(at, chosen.ailmentDpsBase, target, chosen.pen[at])
      if (AILMENT_STACKS[chosen.def.ailment]) {
        poisonDamage += stackDps * (chosen.def.ailmentDuration ?? 0) // cada stack queima full duração
      } else {
        refreshBestDps[chosen.def.ailment] = Math.max(refreshBestDps[chosen.def.ailment] ?? 0, stackDps)
      }
    }

    resource = Math.min(resMax, resource - chosen.def.cost + regen * dt)
    if (chosen.def.cooldown > 0) readyAt[chosen.def.id] = t + chosen.def.cooldown
    if (chosen.def.applies) markExpiry[chosen.def.applies] = t + (chosen.def.appliesDuration ?? 0)

    const rec = per.get(chosen.def.id) ?? { casts: 0, damage: 0 }
    rec.casts += 1
    rec.damage += dmg
    per.set(chosen.def.id, rec)
    timeline.push({ t, skillId: chosen.def.id, damage: dmg, empowered, starved: costBlocked })

    // Rebaixamento por recurso: uma skill pronta (fora de cooldown) foi pulada
    // por falta de recurso — quer tenha caído no básico, quer numa skill mais barata.
    if (costBlocked) starvedActions += 1
    if (isBasic) basicActions += 1
    actions += 1
    t += dt
  }

  const window = t

  // DoT total (M3): veneno acumulado + refresh (dps × janela). Some ao total e
  // ao breakdown por tipo do ailment.
  let dotDamage = poisonDamage
  for (const k of Object.keys(refreshBestDps) as AilmentId[]) dotDamage += (refreshBestDps[k] ?? 0) * window
  if (window > 0 && dotDamage > 0) {
    total += dotDamage
    if (poisonDamage > 0) byType.chaos = (byType.chaos ?? 0) + poisonDamage
    for (const k of Object.keys(refreshBestDps) as AilmentId[]) {
      const at = AILMENT_TYPE[k]
      byType[at] = (byType[at] ?? 0) + (refreshBestDps[k] ?? 0) * window
    }
  }
  const dotDps = window > 0 ? Math.round(dotDamage / window) : 0

  // Fontes externas (M4): DPS contínuo × janela → soma ao total e ao breakdown.
  if (window > 0 && sourceDpsTotal > 0) {
    for (const e of sourceEntries) {
      total += e.dps * window
      byType[e.type] = (byType[e.type] ?? 0) + e.dps * window
    }
  }
  const sourceDps = Math.round(sourceDpsTotal)

  const dps = window > 0 ? Math.round(total / window) : 0
  const comboUptime = window > 0 ? clamp(markActiveTime / window, 0, 1) : 0
  const resourceUptime = actions > 0 ? clamp(1 - starvedActions / actions, 0, 1) : 1

  const perEntries = Array.from(per.entries()).map(([skillId, r]) => ({
    skillId,
    casts: r.casts,
    damage: r.damage,
    share: total > 0 ? r.damage / total : 0,
  }))
  // O DoT aparece como uma "fonte" própria no breakdown por skill.
  if (dotDamage > 0) {
    perEntries.push({ skillId: 'dot', casts: 0, damage: dotDamage, share: total > 0 ? dotDamage / total : 0 })
  }
  // Fontes externas (minions/totens) também entram no breakdown.
  for (const e of sourceEntries) {
    const dmg = e.dps * window
    if (dmg > 0) perEntries.push({ skillId: e.skillId, casts: 0, damage: dmg, share: total > 0 ? dmg / total : 0 })
  }
  const perSkill = perEntries.sort((a, b) => b.damage - a.damage)

  const hasPayoff = prepared.some((p) => p.def.empoweredBy != null)
  let bottleneck: RotationBottleneck = 'nenhum'
  if (resourceUptime < 0.85) bottleneck = 'recurso'
  else if (hasPayoff && comboUptime < 0.7) bottleneck = 'combo'
  else if (prepared.length > 0 && basicActions > actions * 0.15) bottleneck = 'cooldown'

  const damageByType: DamageByType = {}
  if (window > 0) {
    for (const k of Object.keys(byType) as DamageType[]) damageByType[k] = Math.round((byType[k] ?? 0) / window)
  }

  return {
    dps,
    window,
    perSkill,
    comboUptime,
    resourceUptime,
    bottleneck,
    damageByType,
    dotDps,
    sourceDps,
    timeline,
  }
}

/** Janela (s) e alvo padrão da medição do DPS canônico (o "número descoberto"). */
export const MEASURE_WINDOW = 12
export const NEUTRAL_TARGET: TargetProfile = { armour: 0 }

/**
 * DPS canônico da build: a rotação medida contra um alvo **sem defesa** (o
 * dano bruto da rotação). É o número que flui como estimativa/medido em todas
 * as telas; o boneco também mede contra alvos com defesa, mas isso é
 * exploração — o registro oficial usa o alvo neutro para ser comparável.
 */
export function measuredRotation(
  equipped: ItemInstance[],
  allocated: Set<string> | string[],
  loadout: SkillSlot[],
  mastery?: Record<string, number>,
): RotationResult {
  return simulateRotation({ equipped, allocated, loadout, target: NEUTRAL_TARGET, seconds: MEASURE_WINDOW, mastery })
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
  loadout: string[],
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
  // A ordem do loadout é a prioridade da rotação — logo, NÃO é ordenada aqui:
  // reordenar a rotação muda a build e invalida o DPS medido.
  const lo = loadout.join('>')
  return `${eq}#${alloc}#${sk}#${lo}`
}

/** Faixa de estimativa exibida enquanto o DPS real não foi medido (±15%). */
export function estimateRange(dps: number): [number, number] {
  return [Math.round(dps * 0.85), Math.round(dps * 1.15)]
}

/* ===================== DUNGEON ===================== */

const DUNGEON_TIME_K = 12

/** Resistência do jogador para cada tipo de dano (físico não tem res.: usa armadura). */
const RES_OF_TYPE: Record<Exclude<DamageType, 'phys'>, keyof Power> = {
  fire: 'fireRes',
  cold: 'coldRes',
  lightning: 'litRes',
  chaos: 'chaosRes',
}

const TYPE_LABEL: Record<DamageType, string> = {
  phys: 'físico',
  fire: 'fogo',
  cold: 'frio',
  lightning: 'raio',
  chaos: 'caos',
}

/** Resistência mínima exigida por tipo, derivada do nível/diff da dungeon. */
function requiredResFor(dungeon: Dungeon, type: DamageType): number {
  // Físico é tratado por armadura (checagem à parte), não por resistência.
  if (type === 'phys') return 0
  if (type === 'fire' && dungeon.fireThreat) return dungeon.fireReq
  // Piso de gênero: quanto maior o nível, mais resistência a dungeon cobra.
  return clamp(20 + Math.round(dungeon.lvl / 2), 25, 75)
}

export function dungeonOutcome(dungeon: Dungeon, power: Power): DungeonOutcome {
  const comp = dungeon.composition

  // Vazão: builds sem AoE penam contra enxame; sem single-target, contra poucos-fortes.
  // (Aproximação até o motor por ondas — mantém determinístico e legível.)
  const seconds = clamp((dungeon.diff / Math.max(1, power.dps)) * DUNGEON_TIME_K, 45, 900)

  // --- Caminho legado (sem composição declarada): só a ameaça de fogo. ---
  if (!comp) {
    const survivable = !dungeon.fireThreat || power.fireRes >= dungeon.fireReq
    return {
      seconds: Math.round(seconds),
      survivable,
      reason: survivable ? 'none' : 'damage-type',
      breakingType: survivable ? undefined : 'fire',
      cause: survivable
        ? `Concluída sem lacuna de defesa aparente.`
        : `Res. a fogo ${power.fireRes}% abaixo do exigido ${dungeon.fireReq}%: a fase ígnea mata.`,
    }
  }

  // --- Camada por tipo de dano: falha na resistência mais deficitária. ---
  let worst: { type: DamageType; deficit: number; have: number; need: number } | null = null
  for (const type of comp.damageMix) {
    if (type === 'phys') continue // físico é atrito de armadura, não gate de resistência
    const have = power[RES_OF_TYPE[type as Exclude<DamageType, 'phys'>]] as number
    const need = requiredResFor(dungeon, type)
    const deficit = need - have
    if (deficit > 0 && (!worst || deficit > worst.deficit)) {
      worst = { type, deficit, have, need }
    }
  }

  if (worst) {
    return {
      seconds: Math.round(seconds),
      survivable: false,
      reason: 'damage-type',
      breakingType: worst.type,
      cause:
        `A camada de ${TYPE_LABEL[worst.type]} quebrou: res. a ${TYPE_LABEL[worst.type]} ${worst.have}% ` +
        `abaixo do exigido ~${worst.need}%. +${worst.deficit}% de res. a ${TYPE_LABEL[worst.type]} resolve.`,
    }
  }

  // --- Composição: voadores sem dano-no-ar → stall (não limpa, morre de atrito). ---
  // Sem tags de skill ainda; heurística: DPS baixo + aéreo = alto risco de stall.
  if (comp.hasAerial && power.dps < dungeon.diff / 20) {
    return {
      seconds: Math.round(seconds),
      survivable: false,
      reason: 'stall',
      cause:
        `Inimigos voadores não foram derrubados a tempo (DPS efetivo aéreo baixo): ` +
        `a tentativa estagnou e o atrito venceu. Uma skill que atinge o ar limpa a horda aérea.`,
    }
  }

  // --- Mobilidade alta exigida × DPS insuficiente → atrito de dano inevitável. ---
  if (comp.mobilityDemand === 'high' && power.dps < dungeon.diff / 12) {
    return {
      seconds: Math.round(seconds),
      survivable: false,
      reason: 'attrition',
      cause:
        `Sem fechar distância dos atiradores, o dano inevitável acumulou. ` +
        `Mais mobilidade OU mais DPS para encurtar a exposição resolve.`,
    }
  }

  return {
    seconds: Math.round(seconds),
    survivable: true,
    reason: 'none',
    cause: `Todas as camadas de defesa (${comp.damageMix.map((t) => TYPE_LABEL[t]).join(', ')}) seguraram.`,
  }
}

/* ===================== COMBATE DA DUNGEON (R4 — lado defensivo) ===================== */
/*
   A "corrida limpar × morrer": o herói tem um tempo-para-limpar (ofensa, cai
   com o DPS) e um tempo-para-morrer (EHP ÷ dano recebido). Quem zera primeiro
   decide. Glass cannon limpa rápido mas morre nos encontros lentos; tank limpa
   devagar mas ganha a corrida. Controle (CC) pausa o ponteiro de limpar
   enquanto o de morrer corre → morte por controle. Poções esticam o EHP.
   Determinístico (sem RNG). Ver docs/COMBAT_ROTATION_AND_DUMMY.md §7.1.

   Balanceamento provisório (constantes abaixo) — o dono ajusta ao testar.
*/

const INCOMING_K = 0.06 // dano recebido/s ≈ diff × isto, antes da mitigação
const POTION_CHARGES = 4
const POTION_THRESHOLD = 0.4 // usa poção quando a vida cai abaixo disto
const POTION_HEAL_FRAC = 0.35 // cada poção cura esta fração da vida máxima
const DUNGEON_CAP_SECONDS = 1200
const CC_PERIOD = 7 // a cada N s há uma janela de controle
const SIM_DT = 0.5

function heroResOfType(power: Power, type: DamageType): number {
  switch (type) {
    case 'fire':
      return power.fireRes
    case 'cold':
      return power.coldRes
    case 'lightning':
      return power.litRes
    case 'chaos':
      return power.chaosRes
    default:
      return 0
  }
}

/**
 * Dano recebido de um tipo, já pela camada de defesa. Físico (M2): armadura
 * por tamanho do golpe + evasão (valor esperado) + bloqueio. Elemental/caos:
 * resistência do herói (teto 75, piso −60).
 */
function mitigatedIncoming(type: DamageType, raw: number, power: Power): number {
  if (type === 'phys') {
    const armourMit = Math.min(ARMOUR_MIT_CAP, power.armour / (power.armour + ARMOUR_HIT_K * Math.max(1, raw)))
    const evadeChance = Math.min(EVASION_CAP, power.evasion / (power.evasion + EVASION_K * Math.max(1, raw)))
    const blockMit = clamp(power.block, 0, RES_CAP) / 100
    return raw * (1 - armourMit) * (1 - evadeChance) * (1 - blockMit)
  }
  const res = clamp(heroResOfType(power, type), RES_FLOOR, RES_CAP)
  return raw * (1 - res / 100)
}

/**
 * Simula o combate da dungeon e devolve o outcome + relatório completo.
 * Puro e determinístico. Usa `diff` como magnitude (já calibrada) e o
 * bestiário/composição para tipos de dano, controle e contagem de inimigos.
 */
export function simulateDungeon(dungeon: Dungeon, power: Power): DungeonRun {
  const comp = dungeon.composition
  const types: DamageType[] = comp?.damageMix ?? (dungeon.fireThreat ? ['phys', 'fire'] : ['phys'])
  const totalMonsters = comp ? comp.waves.reduce((s, w) => s + w.count, 0) : 10

  const dpsEff = Math.max(1, power.dps)
  const tClear = clamp((dungeon.diff / dpsEff) * DUNGEON_TIME_K, 6, DUNGEON_CAP_SECONDS)

  // Dano recebido: dividido pelos tipos presentes, cada um pela sua camada.
  const rawIncoming = dungeon.diff * INCOMING_K
  const perType = types.map((type) => ({ type, mit: mitigatedIncoming(type, rawIncoming / types.length, power) }))
  const incoming = perType.reduce((s, p) => s + p.mit, 0)
  const worst = perType.reduce((a, b) => (b.mit > a.mit ? b : a), perType[0])

  // Controle (CC): frio → chill/freeze; caster/support pressionam. Sem stat de
  // redução de CC ainda (chega depois) → atinge todos igualmente por ora.
  const hasCC =
    types.includes('cold') || Boolean(comp?.roles.includes('caster')) || Boolean(comp?.roles.includes('support'))
  const ccDur = hasCC ? clamp(1 + dungeon.lvl / 60, 1, 3) : 0

  let potions = POTION_CHARGES
  const potionHeal = POTION_HEAL_FRAC * power.life

  let t = 0
  let clearRemaining = tClear
  let hp = power.life
  let es = power.energyShield // M2: buffer que absorve antes da vida
  let potionsUsed = 0
  let timeControlled = 0
  let damageTaken = 0
  let diedControlled = false

  while (clearRemaining > 0 && hp > 0 && t < DUNGEON_CAP_SECONDS) {
    // Sob controle o herói não age: o ponteiro de limpar pausa, o de morrer corre.
    const controlled = hasCC && t % CC_PERIOD < ccDur
    if (controlled) timeControlled += SIM_DT
    else clearRemaining -= SIM_DT

    const dmg = incoming * SIM_DT
    damageTaken += dmg
    // ES absorve primeiro; o excedente vai para a vida.
    const toEs = Math.min(es, dmg)
    es -= toEs
    hp -= dmg - toEs
    if (hp <= POTION_THRESHOLD * power.life && potions > 0) {
      hp = Math.min(power.life, hp + potionHeal)
      potions -= 1
      potionsUsed += 1
    }
    if (hp <= 0) {
      diedControlled = controlled
      break
    }
    t += SIM_DT
  }

  const survivable = clearRemaining <= 0 && hp > 0
  const seconds = Math.round(t)
  const clearedFrac = clamp(1 - clearRemaining / tClear, 0, 1)
  const enemiesDefeated = survivable ? totalMonsters : Math.floor(totalMonsters * clearedFrac)

  let reason: FailReason = 'none'
  let breakingType: DamageType | undefined
  let cause: string
  if (survivable) {
    cause =
      `Encontro limpo em ${seconds}s.` +
      (potionsUsed > 0 ? ` ${potionsUsed} poção(ões) usada(s).` : '') +
      (timeControlled > 0 ? ` ${Math.round(timeControlled)}s sob controle, mas o EHP aguentou.` : '')
  } else if (diedControlled) {
    reason = 'control'
    cause =
      `Imobilizado por controle no momento fatal — você não pôde agir enquanto o dano corria. ` +
      `Reduzir duração de CC, +EHP, ou matar o aplicador (caster) antes resolve.`
  } else if (worst && worst.type !== 'phys' && worst.mit >= incoming * 0.45) {
    reason = 'damage-type'
    breakingType = worst.type
    cause =
      `A camada de ${TYPE_LABEL[worst.type]} foi a que mais passou (~${Math.round(worst.mit)}/s recebidos). ` +
      `Mais res. a ${TYPE_LABEL[worst.type]} — ou +EHP — segura a corrida.`
  } else {
    reason = 'attrition'
    cause =
      `Limpou ${Math.round(clearedFrac * 100)}% antes de cair: o dano recebido acumulou mais rápido que a vazão. ` +
      `Mais DPS (limpa antes) OU mais EHP/poções (aguenta mais) resolve.`
  }

  const report: DungeonReport = {
    enemiesDefeated,
    totalMonsters,
    damageTaken: Math.round(damageTaken),
    potionsUsed,
    timeControlled: Math.round(timeControlled * 10) / 10,
    avgDps: Math.round(dpsEff),
    peakDps: Math.round(dpsEff * 1.3),
    incomingDps: Math.round(incoming),
    tClear: Math.round(tClear),
    tDie: hp > 0 ? Infinity : seconds,
  }

  return { seconds, survivable, reason, breakingType, cause, report }
}

/* ===================== REPLAY / MINIMAPA ===================== */

const monsterById = Object.fromEntries(BESTIARY.map((m) => [m.id, m])) as Record<string, Monster>

/** Ordena as ondas por rank para o herói avançar do trivial ao chefe. */
const RANK_ORDER: Record<Monster['rank'], number> = { normal: 0, elite: 1, boss: 2 }

/**
 * Gera um replay leve e determinístico da tentativa: uma rota de marcadores
 * (player → packs → elites → boss) com drops de loot notável após limpar
 * packs. Em derrota, a rota termina no marcador onde a ameaça venceu.
 *
 * Puro: a mesma seed produz o mesmo replay (casa com "números descobertos").
 */
export function dungeonReplay(dungeon: Dungeon, outcome: DungeonOutcome, seed: number): DungeonReplay {
  const rng = makeRng(seed >>> 0)
  const comp = dungeon.composition

  // Estações do encontro, do mais fraco ao chefe. Sem composição, um encontro genérico.
  const stations: Array<{ kind: MarkerKind; label: string; drops: boolean }> = []
  if (comp) {
    const waves = comp.waves
      .map((w) => ({ w, mon: monsterById[w.monsterId] }))
      .filter((x): x is { w: typeof x.w; mon: Monster } => Boolean(x.mon))
      .sort((a, b) => RANK_ORDER[a.mon.rank] - RANK_ORDER[b.mon.rank])
    for (const { w, mon } of waves) {
      const kind: MarkerKind = mon.rank === 'boss' ? 'boss' : mon.rank === 'elite' ? 'elite' : 'enemy'
      const label = w.count > 1 ? `${mon.name} ×${w.count}` : mon.name
      // Elites e chefes deixam loot notável; packs comuns, às vezes.
      stations.push({ kind, label, drops: mon.rank !== 'normal' })
    }
  } else {
    stations.push({ kind: 'enemy', label: 'Horda', drops: false })
    stations.push({ kind: 'boss', label: dungeon.name, drops: true })
  }

  const markers: ReplayMarker[] = []
  const path: Array<{ x: number; y: number }> = []

  // Origem do herói (esquerda-baixo), rota serpenteando até a direita.
  const start = { x: 8, y: 78 }
  path.push(start)
  markers.push({ id: 'player', kind: 'player', x: start.x, y: start.y, at: 0, label: 'Herói' })

  const n = stations.length
  let markerSeq = 0
  stations.forEach((st, i) => {
    // Fração do avanço em que esta estação é alcançada.
    const at = (i + 1) / (n + 1)
    // x cresce monotônico; y serpenteia para dar vida ao traçado.
    const x = 14 + at * 74 + (rng() - 0.5) * 4
    const y = 30 + Math.sin((i + 1) * 1.3) * 26 + (rng() - 0.5) * 8
    const cx = clamp(x, 6, 94)
    const cy = clamp(y, 10, 86)
    path.push({ x: cx, y: cy })
    markers.push({ id: `mk_${markerSeq++}`, kind: st.kind, x: cx, y: cy, at, label: st.label })

    // Loot notável cai um pouco depois de limpar a estação, ao lado dela.
    const dropsRare = st.drops || (comp && rng() < 0.35)
    if (dropsRare) {
      const isFinal = i === n - 1
      markers.push({
        id: `mk_${markerSeq++}`,
        kind: 'loot',
        x: clamp(cx + 5, 6, 96),
        y: clamp(cy - 8, 6, 90),
        at: Math.min(0.999, at + 0.03),
        label: isFinal ? dungeon.reward.name : 'Loot raro',
        rarity: isFinal ? dungeon.reward.rarity : 'rare',
      })
    }
  })

  // Em derrota, a rota morre onde a ameaça venceu: um pouco antes do fim.
  const endsAt = outcome.survivable ? 1 : clamp(0.55 + rng() * 0.25, 0.4, 0.9)

  return { markers, path, endsAt, win: outcome.survivable }
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

/** Multiplicador de um afixo excepcional sobre o topo do tier normal (só-dropa). */
export const EXCEPTIONAL_MULT = 1.5

/**
 * Afixo EXCEPCIONAL de um grupo: valores no topo do melhor tier × EXCEPTIONAL_MULT,
 * marcado `exceptional`. Não é craftável — só o gerador de drop o cria. O texto
 * ganha um selo ✦ para leitura imediata. Ver ARPG_RESEARCH §8.5.
 */
export function rollExceptionalAffix(group: AffixGroup, itemLevel: number): RolledAffix {
  const tiers = group.tiers.filter((t) => t.minItemLevel <= itemLevel)
  const best = tiers.reduce((a, b) => (b.tier < a.tier ? b : a), tiers[0]) // menor tier = mais forte
  const values: StatMods = {}
  for (const key of Object.keys(best.ranges) as StatKey[]) {
    const [, hi] = best.ranges[key]!
    values[key] = Math.round(hi * EXCEPTIONAL_MULT)
  }
  return {
    groupId: group.id,
    kind: group.kind,
    tier: 0,
    values,
    text: `✦ ${affixText(best.text, values)}`,
    exceptional: true,
  }
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

/**
 * Gera um item de recompensa (drop) a partir de uma base. Com `withExceptional`,
 * injeta um afixo EXCEPCIONAL (só-dropa) elegível — a camada aspiracional que o
 * crafting não alcança. Puro/determinístico via Rng. Ver ARPG_RESEARCH §8.5.
 */
export function makeRewardItem(
  baseId: string,
  rarity: Rarity,
  name: string,
  itemLevel: number,
  rng: Rng,
  withExceptional = false,
): ItemInstance {
  const base = getBase(baseId)
  const affixes: RolledAffix[] = []
  const cap = RARITY_CAP[rarity]
  for (let i = 0; i < cap; i++) addAffixOfKind(affixes, base, itemLevel, 'prefix', rng)
  for (let i = 0; i < cap; i++) addAffixOfKind(affixes, base, itemLevel, 'suffix', rng)

  if (withExceptional) {
    // Substitui um afixo por sua versão excepcional (ou adiciona, se houver espaço).
    const used = new Set(affixes.map((a) => a.groupId))
    const candidates = AFFIX_GROUPS.filter(
      (g) => g.classes.includes(base.itemClass) && g.tiers.some((t) => t.minItemLevel <= itemLevel),
    )
    const group = candidates.find((g) => used.has(g.id)) ?? candidates[0]
    if (group) {
      const exc = rollExceptionalAffix(group, itemLevel)
      const idx = affixes.findIndex((a) => a.groupId === group.id)
      if (idx >= 0) affixes[idx] = exc
      else affixes.push(exc)
    }
  }

  return { uid: nextUid(), baseId, rarity, itemLevel, affixes, corrupted: false, name }
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
