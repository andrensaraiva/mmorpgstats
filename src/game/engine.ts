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
  DamageType,
  Dungeon,
  DungeonOutcome,
  DungeonReplay,
  EquipSlot,
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
const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<string, SkillDefinition>
const nodeById = Object.fromEntries(TREE.nodes.map((n) => [n.id, n])) as Record<string, TreeNode>
const mainSkill = SKILLS.find((s) => s.id === MAIN_SKILL_ID)!

const BASE_LIFE = 500
const ARMOUR_K = 1500
const RES_CAP = 75
const RES_FLOOR = -60

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
      weaponPhysMin = base.weapon.physMin
      weaponPhysMax = base.weapon.physMax
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

  const physMin = ctx.weaponPhysMin + (skillMods.addedPhysMin ?? 0)
  const physMax = ctx.weaponPhysMax + (skillMods.addedPhysMax ?? 0)
  const avgHit = ((physMin + physMax) / 2) * (1 + (skillMods.incPhys ?? 0) / 100)
  const attackSpeed = ctx.weaponAps * (1 + (skillMods.incAttackSpeed ?? 0) / 100)
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
  const resource = deriveResource(global)

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
    chaosRes: clamp(global.chaosRes ?? 0, RES_FLOOR, RES_CAP),
    strength,
    dexterity: global.dexterity ?? 0,
    intelligence: global.intelligence ?? 0,
    supportCap: 2 + (global.supportCap ?? 0),
    resourceMax: resource.max,
    resourceRegen: resource.regen,
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

/** Uma skill do loadout já "compilada" para o loop (dano/tempo pré-calculados). */
interface PreparedSkill {
  def: SkillDefinition
  /** Tempo de uma ação (s): cast fixo, ou 1/vel.ataque para ataques. */
  actionTime: number
  /** Golpe médio SEM o `more` (avgHit × crítico × mult × (1−less)). */
  perHitBase: number
  /** `more` de global + suportes (sem o bônus de combo). */
  moreBase: number
}

function prepareSkill(ctx: BuildContext, def: SkillDefinition, supports: string[]): PreparedSkill {
  const skillMods: StatMods = { ...ctx.global }
  let moreBase = ctx.global.moreDamage ?? 0
  const lessDamage = ctx.global.lessDamage ?? 0
  for (const sid of supports) {
    const sup = supportById[sid]
    if (!sup) continue
    addMods(skillMods, sup.mods)
    moreBase += sup.mods.moreDamage ?? 0
  }
  const physMin = ctx.weaponPhysMin + (skillMods.addedPhysMin ?? 0)
  const physMax = ctx.weaponPhysMax + (skillMods.addedPhysMax ?? 0)
  const avgHit = ((physMin + physMax) / 2) * (1 + (skillMods.incPhys ?? 0) / 100)
  const critChance = clamp(5 + (skillMods.critChance ?? 0), 0, 100)
  const critMulti = 150 + (skillMods.critMulti ?? 0)
  const critFactor = 1 + (critChance / 100) * (critMulti / 100 - 1)
  const attackSpeed = ctx.weaponAps * (1 + (skillMods.incAttackSpeed ?? 0) / 100)
  const actionTime = def.castTime > 0 ? def.castTime : 1 / attackSpeed
  const perHitBase = avgHit * critFactor * def.damageMult * (1 - lessDamage / 100)
  return { def, actionTime, perHitBase, moreBase }
}

/** Dano de um golpe da skill contra a armadura do alvo, com/sem combo ativo. */
function preparedHit(p: PreparedSkill, targetArmour: number, empowered: boolean): number {
  const more = p.moreBase + (empowered ? p.def.comboMore ?? 0 : 0)
  const raw = p.perHitBase * (1 + more / 100)
  if (targetArmour <= 0 || raw <= 0) return raw
  const reduction = Math.min(ARMOUR_MIT_CAP, targetArmour / (targetArmour + ARMOUR_HIT_K * raw))
  return raw * (1 - reduction)
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
}

/**
 * Simula a rotação e mede o DPS. Puro e determinístico. Cada ação: escolhe a
 * skill de maior prioridade que esteja fora de cooldown e paga o recurso;
 * senão, cai no ataque básico (grátis) — nunca trava. Aplica combo (marca),
 * consome recurso, dispara cooldown e soma o dano; ao fim, DPS = dano/tempo.
 */
export function simulateRotation(input: SimulateInput): RotationResult {
  const { equipped, allocated, loadout, target, seconds } = input
  const ctx = buildContext(equipped, allocated)
  const { max: resMax, regen } = deriveResource(ctx.global)

  // Só skills de dano entram na rotação; utilitárias (damageMult 0) são ignoradas.
  const prepared = loadout
    .map((slot) => prepareSkill(ctx, skillById[slot.skillId] ?? BASIC_ATTACK, slot.supports))
    .filter((p) => p.def.damageMult > 0)
  const basic = prepareSkill(ctx, BASIC_ATTACK, [])

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
  const timeline: TickEvent[] = []

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
    const dmg = preparedHit(chosen, target.armour, empowered)

    // Uptime da marca durante [t, t+dt] (antes de reaplicar).
    for (const m of Object.keys(markExpiry) as MarkId[]) {
      const exp = markExpiry[m] ?? 0
      if (exp > t) markActiveTime += Math.min(exp, t + dt) - t
    }

    // Aplica efeitos.
    total += dmg
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
  const dps = window > 0 ? Math.round(total / window) : 0
  const comboUptime = window > 0 ? clamp(markActiveTime / window, 0, 1) : 0
  const resourceUptime = actions > 0 ? clamp(1 - starvedActions / actions, 0, 1) : 1

  const perSkill = Array.from(per.entries())
    .map(([skillId, r]) => ({ skillId, casts: r.casts, damage: r.damage, share: total > 0 ? r.damage / total : 0 }))
    .sort((a, b) => b.damage - a.damage)

  const hasPayoff = prepared.some((p) => p.def.empoweredBy != null)
  let bottleneck: RotationBottleneck = 'nenhum'
  if (resourceUptime < 0.85) bottleneck = 'recurso'
  else if (hasPayoff && comboUptime < 0.7) bottleneck = 'combo'
  else if (prepared.length > 0 && basicActions > actions * 0.15) bottleneck = 'cooldown'

  return { dps, window, perSkill, comboUptime, resourceUptime, bottleneck, timeline }
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
