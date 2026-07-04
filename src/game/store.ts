/* =========================================================
   BuildsWar :: estado da aplicação (React)
   Guarda inventário, equipado, árvore, soquetes, moedas e o
   DPS medido. Ações que sorteiam (crafting) criam o novo item
   fora do reducer, mantendo o reducer previsível.
   ========================================================= */

import { useCallback, useMemo, useReducer } from 'react'
import {
  CAMPAIGN,
  MAIN_SKILL_ID,
  SKILLS,
  STARTER_CURRENCY,
  STARTER_LOADOUT,
  TREE,
  getBase,
  makeStarter,
} from './content'
import {
  aggregate,
  connectedToStart,
  craft as craftItem,
  fingerprint,
  levelForXp,
  levelProgress,
  makeRng,
  measuredRotation,
  skillMasteryLevel,
  slotAccepts,
  talentPoints,
  treeAdjacency,
} from './engine'
import type { LootDrop } from './engine'
import type {
  CurrencyPouch,
  DamageType,
  EquipSlot,
  FailReason,
  ItemInstance,
  Measured,
  OrbId,
  Power,
  SkillSlot,
  SystemId,
  ViewId,
} from './types'

export type AttemptPhase = 'idle' | 'running' | 'report'

export interface AttemptResult {
  dungeonId: string
  win: boolean
  dps: number
  seconds: number
  fireRes: number
  fireReq: number
  /** Causa detalhada da tentativa (relatório causal). */
  cause: string
  reason: FailReason
  breakingType?: DamageType
  /** Métricas do combate (relatório completo — MVP §10.4). */
  enemiesDefeated: number
  totalMonsters: number
  damageTaken: number
  potionsUsed: number
  timeControlled: number
  peakDps: number
  incomingDps: number
  /** XP concedido por esta tentativa (P1). */
  xpGained: number
}

/**
 * Registro do último craft, para a UI diffar os afixos (novo/alterado/removido)
 * e disparar o brilho do item alterado. `orb` também dá o realce do orbe usado.
 */
export interface LastCraft {
  /** uid da nova instância gerada — a que agora está no inventário. */
  uid: string
  orb: OrbId
  /** Afixos do item ANTES do craft, para o diff visual. */
  before: ItemInstance
  /** Selo de unicidade: some ao selecionar outro item ou craftar de novo. */
  seq: number
}

/** Tom de um toast — colore o realce lateral e o ícone. */
export type ToastTone = 'good' | 'warn' | 'info' | 'loot'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

export interface GameState {
  page: ViewId
  /** XP acumulado do herói (P1) — nível deriva daqui via engine.levelForXp. */
  xp: number
  /** Nós da campanha concluídos (P1). */
  completedNodes: string[]
  /** Sistemas destravados pela campanha (P2). */
  unlockedSystems: SystemId[]
  /** XP de maestria por skillId (SK1) — sobe usando a skill em vitórias. */
  skillXp: Record<string, number>
  /** Sinal de subida de nível a exibir no painel de recompensa (LVLUP). */
  levelUp: { from: number; to: number } | null
  inventory: ItemInstance[]
  equipped: Partial<Record<EquipSlot, string>>
  allocated: Set<string>
  sockets: Record<string, string[]>
  /** Rotação: skillIds de dano em ordem de prioridade (a reordenar no R3). */
  loadout: string[]
  currency: CurrencyPouch
  selectedDungeon: string
  selectedItemUid: string | null
  measured: Measured | null
  attemptPhase: AttemptPhase
  attemptResult: AttemptResult | null
  notice: string | null
  /** Último craft aplicado — dirige o realce do diff/orbe (Fase C). */
  lastCraft: LastCraft | null
  /** Último equipar — dirige o pulso de encaixe no slot (Fase C). */
  lastEquip: { slot: EquipSlot; seq: number } | null
  /** Fila de toasts efêmeros (Fase D) — eventos transientes unificados. */
  toasts: Toast[]
}

function initState(): GameState {
  const starter = makeStarter()
  return {
    page: 'campanha',
    xp: 0,
    completedNodes: [],
    unlockedSystems: [],
    skillXp: {},
    levelUp: null,
    inventory: starter.inventory,
    equipped: starter.equipped,
    // Começa só na origem: os pontos de talento são ganhos e gastos pelo jogador (PT).
    allocated: new Set(['s0']),
    sockets: Object.fromEntries(SKILLS.map((s) => [s.id, s.defaultSockets.slice()])),
    loadout: [...STARTER_LOADOUT],
    currency: { ...STARTER_CURRENCY },
    selectedDungeon: 'd-crypt',
    selectedItemUid: starter.inventory[0]?.uid ?? null,
    measured: null,
    attemptPhase: 'idle',
    attemptResult: null,
    notice: null,
    lastCraft: null,
    lastEquip: null,
    toasts: [],
  }
}

let craftSeq = 0
let equipSeq = 0
let toastSeq = 0

type Action =
  | { type: 'navigate'; page: ViewId }
  | { type: 'selectItem'; uid: string | null }
  | { type: 'equip'; uid: string; slot: EquipSlot }
  | { type: 'unequip'; slot: EquipSlot }
  | { type: 'toggleNode'; nodeId: string }
  | { type: 'resetTree' }
  | { type: 'toggleSocket'; skillId: string; supportId: string }
  | { type: 'moveLoadout'; skillId: string; dir: -1 | 1 }
  | { type: 'toggleLoadout'; skillId: string }
  | { type: 'replaceItem'; before: ItemInstance; item: ItemInstance; orb: OrbId; notice: string }
  | { type: 'selectDungeon'; id: string }
  | { type: 'attemptRun' }
  | { type: 'attemptFinish'; result: AttemptResult; measured: Measured | null }
  | { type: 'measure'; measured: Measured }
  | { type: 'attemptReset' }
  | { type: 'notice'; message: string | null }
  | { type: 'pushToast'; tone: ToastTone; message: string }
  | { type: 'dismissToast'; id: number }
  | { type: 'completeCampaignNode'; nodeId: string }
  | { type: 'campaignReward'; xpGained: number; measured: Measured | null; win: boolean }
  | { type: 'addItem'; item: ItemInstance; toast?: string; tone?: ToastTone }
  | { type: 'applyLoot'; loot: LootDrop }
  | { type: 'dismissLevelUp' }

const adjacency = treeAdjacency()

/** XP de maestria concedido a cada skill do loadout numa vitória (SK1). */
const MASTERY_XP_WIN = 60

const skillNameById = Object.fromEntries(SKILLS.map((s) => [s.id, s.name]))
function skillName(id: string): string {
  return skillNameById[id] ?? id
}

/** Rótulo dos sistemas destravados pela campanha (P2). */
const SYSTEM_LABEL: Record<SystemId, string> = {
  equipamento: 'Equipamento & Crafting',
  arvore: 'Árvore Passiva',
  habilidades: 'Habilidades',
  mercado: 'Mercado',
  masmorra: 'Masmorra livre',
}

function pointsUsed(allocated: Set<string>): number {
  return allocated.size - 1 // origem não conta
}

const MAX_TOASTS = 4

/** Empilha um toast, mantendo no máximo os últimos MAX_TOASTS. */
function withToast(toasts: Toast[], tone: ToastTone, message: string): Toast[] {
  const next = [...toasts, { id: ++toastSeq, tone, message }]
  return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
}

/**
 * XP de maestria (SK1) distribuído às skills de dano do loadout numa vitória.
 * Devolve o novo mapa skillXp e as skills que subiram de maestria (p/ toast).
 */
function awardMastery(state: GameState, amount: number): { skillXp: Record<string, number>; leveled: string[] } {
  const skillXp = { ...state.skillXp }
  const leveled: string[] = []
  for (const id of state.loadout) {
    const before = skillMasteryLevel(skillXp[id] ?? 0)
    skillXp[id] = (skillXp[id] ?? 0) + amount
    const after = skillMasteryLevel(skillXp[id])
    if (after > before) leveled.push(id)
  }
  return { skillXp, leveled }
}

/** Tom do toast conforme a raridade resultante de um craft. */
function craftTone(item: ItemInstance): ToastTone {
  if (item.corrupted) return 'warn'
  if (item.rarity === 'unique' || item.rarity === 'rare') return 'loot'
  return 'good'
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'navigate':
      return { ...state, page: action.page, notice: null }

    case 'selectItem':
      // Trocar de item apaga o realce do craft anterior (só o item recém-craftado brilha).
      return { ...state, selectedItemUid: action.uid, lastCraft: null }

    case 'equip': {
      const equipped = { ...state.equipped }
      // Se o item já estava em outro slot, libera o antigo.
      for (const s of Object.keys(equipped) as EquipSlot[]) {
        if (equipped[s] === action.uid) delete equipped[s]
      }
      equipped[action.slot] = action.uid
      return { ...state, equipped, notice: null, lastEquip: { slot: action.slot, seq: ++equipSeq } }
    }

    case 'unequip': {
      const equipped = { ...state.equipped }
      delete equipped[action.slot]
      return { ...state, equipped }
    }

    case 'toggleNode': {
      const node = TREE.nodes.find((n) => n.id === action.nodeId)
      if (!node || node.type === 'start') return state
      const allocated = new Set(state.allocated)
      if (allocated.has(action.nodeId)) {
        const test = new Set(allocated)
        test.delete(action.nodeId)
        if (!connectedToStart(test, 's0')) {
          return { ...state, notice: 'Reembolso quebraria o caminho até outro nó alocado.' }
        }
        return { ...state, allocated: test, notice: null }
      }
      const adjacentAllocated = (adjacency[action.nodeId] ?? []).some((nb) => allocated.has(nb))
      if (!adjacentAllocated) return { ...state, notice: 'Nó desconectado: aloque primeiro um vizinho.' }
      const total = talentPoints(levelForXp(state.xp), state.completedNodes.length)
      if (pointsUsed(allocated) >= total) {
        return { ...state, notice: `Sem pontos de talento. Suba de nível ou vença marcos para ganhar mais.` }
      }
      allocated.add(action.nodeId)
      return { ...state, allocated, notice: null }
    }

    case 'resetTree':
      return { ...state, allocated: new Set(['s0']), notice: null }

    case 'toggleSocket': {
      const cap = 2 + sumSupportCap(state.allocated)
      const current = state.sockets[action.skillId] ?? []
      const idx = current.indexOf(action.supportId)
      let next: string[]
      if (idx >= 0) {
        next = current.filter((s) => s !== action.supportId)
      } else {
        if (current.length >= cap) return { ...state, notice: `Limite de ${cap} soquetes nesta habilidade.` }
        next = [...current, action.supportId]
      }
      return { ...state, sockets: { ...state.sockets, [action.skillId]: next }, notice: null }
    }

    case 'moveLoadout': {
      const idx = state.loadout.indexOf(action.skillId)
      const j = idx + action.dir
      if (idx < 0 || j < 0 || j >= state.loadout.length) return state
      const loadout = state.loadout.slice()
      ;[loadout[idx], loadout[j]] = [loadout[j], loadout[idx]]
      return { ...state, loadout, notice: null }
    }

    case 'toggleLoadout': {
      if (state.loadout.includes(action.skillId)) {
        if (state.loadout.length <= 1) {
          return { ...state, notice: 'A rotação precisa de ao menos uma habilidade de dano.' }
        }
        return { ...state, loadout: state.loadout.filter((id) => id !== action.skillId), notice: null }
      }
      return { ...state, loadout: [...state.loadout, action.skillId], notice: null }
    }

    case 'replaceItem': {
      const oldUid = action.before.uid
      const inventory = state.inventory.map((i) => (i.uid === oldUid ? action.item : i))
      const equipped = { ...state.equipped }
      for (const s of Object.keys(equipped) as EquipSlot[]) {
        if (equipped[s] === oldUid) equipped[s] = action.item.uid
      }
      const currency = { ...state.currency, [action.orb]: state.currency[action.orb] - 1 }
      return {
        ...state,
        inventory,
        equipped,
        currency,
        selectedItemUid: action.item.uid,
        notice: action.notice,
        lastCraft: { uid: action.item.uid, orb: action.orb, before: action.before, seq: ++craftSeq },
        toasts: withToast(state.toasts, craftTone(action.item), action.notice),
      }
    }

    case 'selectDungeon':
      return { ...state, selectedDungeon: action.id, attemptPhase: 'idle', attemptResult: null }

    case 'attemptRun':
      return { ...state, attemptPhase: 'running', attemptResult: null }

    case 'attemptFinish': {
      // Progressão (P1): a tentativa concede XP; subir de nível dispara toast.
      const gained = action.result.xpGained
      const xp = state.xp + gained
      const before = levelForXp(state.xp)
      const after = levelForXp(xp)
      let toasts = state.toasts
      if (gained > 0) toasts = withToast(toasts, 'good', `+${gained.toLocaleString('pt-BR')} XP`)
      if (after > before) toasts = withToast(toasts, 'loot', `⬆ Nível ${after}!`)
      if (action.measured) {
        toasts = withToast(
          toasts,
          'info',
          `DPS real descoberto: ${Math.round(action.measured.dps).toLocaleString('pt-BR')}`,
        )
      }
      // Maestria de skill (SK1): vencer treina as skills do loadout.
      let skillXp = state.skillXp
      if (action.result.win) {
        const m = awardMastery(state, MASTERY_XP_WIN)
        skillXp = m.skillXp
        for (const id of m.leveled) toasts = withToast(toasts, 'good', `★ Maestria: ${skillName(id)} subiu`)
      }
      return {
        ...state,
        xp,
        skillXp,
        attemptPhase: 'report',
        attemptResult: action.result,
        measured: action.measured ?? state.measured,
        toasts,
        levelUp: after > before ? { from: before, to: after } : state.levelUp,
      }
    }

    case 'measure':
      return {
        ...state,
        measured: action.measured,
        toasts: withToast(
          state.toasts,
          'info',
          `DPS real registrado: ${Math.round(action.measured.dps).toLocaleString('pt-BR')}`,
        ),
      }

    case 'attemptReset':
      return { ...state, attemptPhase: 'idle', attemptResult: null }

    case 'notice':
      return { ...state, notice: action.message }

    case 'pushToast':
      return { ...state, toasts: withToast(state.toasts, action.tone, action.message) }

    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    case 'dismissLevelUp':
      return { ...state, levelUp: null }

    case 'campaignReward': {
      // Concede XP + mede o DPS SEM mexer no relatório global da Masmorra
      // (a campanha tem seu próprio relatório local).
      const gained = action.xpGained
      const xp = state.xp + gained
      const before = levelForXp(state.xp)
      const after = levelForXp(xp)
      let toasts = state.toasts
      if (gained > 0) toasts = withToast(toasts, 'good', `+${gained.toLocaleString('pt-BR')} XP`)
      if (after > before) toasts = withToast(toasts, 'loot', `⬆ Nível ${after}!`)
      let skillXp = state.skillXp
      if (action.win) {
        const m = awardMastery(state, MASTERY_XP_WIN)
        skillXp = m.skillXp
        for (const id of m.leveled) toasts = withToast(toasts, 'good', `★ Maestria: ${skillName(id)} subiu`)
      }
      return {
        ...state,
        xp,
        skillXp,
        measured: action.measured ?? state.measured,
        toasts,
        levelUp: after > before ? { from: before, to: after } : state.levelUp,
      }
    }

    case 'addItem': {
      const toasts = action.toast ? withToast(state.toasts, action.tone ?? 'loot', action.toast) : state.toasts
      return { ...state, inventory: [action.item, ...state.inventory], toasts }
    }

    case 'applyLoot': {
      const { items, orbs } = action.loot
      const inventory = [...items, ...state.inventory]
      const currency = { ...state.currency }
      for (const [orb, n] of Object.entries(orbs) as [OrbId, number][]) {
        currency[orb] = (currency[orb] ?? 0) + n
      }
      let toasts = state.toasts
      // Resumo do loot: um toast por item notável + um dos orbes.
      const notable = items.filter((i) => i.rarity === 'rare' || i.rarity === 'unique' || i.affixes.some((a) => a.exceptional))
      for (const it of notable) {
        const tone: ToastTone = it.affixes.some((a) => a.exceptional) ? 'loot' : it.rarity === 'unique' ? 'loot' : 'good'
        toasts = withToast(toasts, tone, `${it.affixes.some((a) => a.exceptional) ? '✦ ' : ''}Loot: ${it.name}`)
      }
      const orbCount = Object.values(orbs).reduce((s, n) => s + (n ?? 0), 0)
      const commonItems = items.length - notable.length
      const extras: string[] = []
      if (commonItems > 0) extras.push(`${commonItems} item(ns)`)
      if (orbCount > 0) extras.push(`${orbCount} orbe(s)`)
      if (extras.length) toasts = withToast(toasts, 'good', `Também caiu: ${extras.join(' + ')}`)
      return { ...state, inventory, currency, toasts }
    }

    case 'completeCampaignNode': {
      if (state.completedNodes.includes(action.nodeId)) return state
      const node = CAMPAIGN.find((n) => n.id === action.nodeId)
      const completedNodes = [...state.completedNodes, action.nodeId]
      let unlockedSystems = state.unlockedSystems
      let toasts = state.toasts
      if (node?.unlocks && !unlockedSystems.includes(node.unlocks)) {
        unlockedSystems = [...unlockedSystems, node.unlocks]
        toasts = withToast(toasts, 'loot', `✦ Sistema liberado: ${SYSTEM_LABEL[node.unlocks]}`)
      }
      return { ...state, completedNodes, unlockedSystems, toasts }
    }

    default:
      return state
  }
}

function sumSupportCap(allocated: Set<string>): number {
  let cap = 0
  for (const id of allocated) {
    const node = TREE.nodes.find((n) => n.id === id)
    cap += node?.mods.supportCap ?? 0
  }
  return cap
}

/* ---------- seletores ---------- */

export function selectEquippedItems(state: GameState): ItemInstance[] {
  const byUid = new Map(state.inventory.map((i) => [i.uid, i]))
  const out: ItemInstance[] = []
  for (const uid of Object.values(state.equipped)) {
    if (!uid) continue
    const item = byUid.get(uid)
    if (item) out.push(item)
  }
  return out
}

/** A rotação como SkillSlot[] (skill + suportes), na ordem de prioridade. */
export function selectLoadoutSlots(state: GameState): SkillSlot[] {
  return state.loadout.map((skillId) => ({ skillId, supports: state.sockets[skillId] ?? [] }))
}

/** Nível de maestria por skillId (SK1), derivado do skillXp. */
export function selectMastery(state: GameState): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, xp] of Object.entries(state.skillXp)) out[id] = skillMasteryLevel(xp)
  return out
}

/** Pontos de talento: total ganho, gastos e disponíveis (PT). */
export function selectTalent(state: GameState): { total: number; used: number; available: number } {
  const total = talentPoints(levelForXp(state.xp), state.completedNodes.length)
  const used = state.allocated.size - 1 // origem não conta
  return { total, used, available: Math.max(0, total - used) }
}

export function selectPower(state: GameState): Power {
  const equipped = selectEquippedItems(state)
  const power = aggregate({ equipped, allocated: state.allocated, sockets: state.sockets })
  // O DPS-âncora da build é o da ROTAÇÃO (sim vs alvo neutro), não o do golpe
  // único do aggregate. Estimativa, medido e dungeon passam a falar a mesma língua.
  const rotation = measuredRotation(equipped, state.allocated, selectLoadoutSlots(state), selectMastery(state))
  return { ...power, dps: rotation.dps }
}

export function selectFingerprint(state: GameState): string {
  return fingerprint(state.equipped, state.allocated, state.sockets, state.loadout)
}

export function itemByUid(state: GameState, uid: string | null): ItemInstance | null {
  if (!uid) return null
  return state.inventory.find((i) => i.uid === uid) ?? null
}

/* ---------- hook ---------- */

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  const power = useMemo(() => selectPower(state), [state])
  const currentFingerprint = useMemo(() => selectFingerprint(state), [state])

  /** DPS "conhecido" só quando o fingerprint testado bate com o atual. */
  const knownDps = useMemo(
    () => (state.measured && state.measured.fingerprint === currentFingerprint ? state.measured.dps : null),
    [state.measured, currentFingerprint],
  )

  /** Progressão (P1): nível e barra de XP derivados do xp acumulado. */
  const level = useMemo(() => levelForXp(state.xp), [state.xp])
  const progress = useMemo(() => levelProgress(state.xp), [state.xp])
  /** Pontos de talento (PT): total/gastos/disponíveis. */
  const talent = useMemo(() => selectTalent(state), [state])

  const navigate = useCallback((page: ViewId) => {
    dispatch({ type: 'navigate', page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const selectItem = useCallback((uid: string | null) => dispatch({ type: 'selectItem', uid }), [])

  const equip = useCallback((item: ItemInstance, slot?: EquipSlot) => {
    const base = getBase(item.baseId)
    let target = slot
    if (!target) {
      if (base.kind === 'ring') {
        target = 'ring1'
      } else {
        target = base.kind as EquipSlot
      }
    }
    if (!slotAccepts(base, target)) {
      dispatch({ type: 'pushToast', tone: 'warn', message: `${base.name} não vai no slot ${target}.` })
      return
    }
    dispatch({ type: 'equip', uid: item.uid, slot: target })
  }, [])

  const pushToast = useCallback(
    (tone: ToastTone, message: string) => dispatch({ type: 'pushToast', tone, message }),
    [],
  )
  const dismissToast = useCallback((id: number) => dispatch({ type: 'dismissToast', id }), [])

  const unequip = useCallback((slot: EquipSlot) => dispatch({ type: 'unequip', slot }), [])
  const toggleNode = useCallback((nodeId: string) => dispatch({ type: 'toggleNode', nodeId }), [])
  const resetTree = useCallback(() => dispatch({ type: 'resetTree' }), [])
  const toggleSocket = useCallback(
    (skillId: string, supportId: string) => dispatch({ type: 'toggleSocket', skillId, supportId }),
    [],
  )
  const moveLoadout = useCallback((skillId: string, dir: -1 | 1) => dispatch({ type: 'moveLoadout', skillId, dir }), [])
  const toggleLoadout = useCallback((skillId: string) => dispatch({ type: 'toggleLoadout', skillId }), [])
  const selectDungeon = useCallback((id: string) => dispatch({ type: 'selectDungeon', id }), [])
  const resetAttempt = useCallback(() => dispatch({ type: 'attemptReset' }), [])

  /** Bater no boneco: registra o DPS canônico (rotação vs alvo neutro) como medido. */
  const measureDummy = useCallback(() => {
    dispatch({ type: 'measure', measured: { fingerprint: currentFingerprint, dps: power.dps } })
  }, [currentFingerprint, power.dps])

  const applyCraft = useCallback(
    (orb: OrbId) => {
      const item = itemByUid(state, state.selectedItemUid)
      if (!item) return
      if (state.currency[orb] <= 0) {
        dispatch({ type: 'pushToast', tone: 'warn', message: 'Sem moedas suficientes desse orbe.' })
        return
      }
      const rng = makeRng((Date.now() ^ (item.uid.length * 2654435761)) >>> 0)
      const result = craftItem(orb, item, rng)
      if (!result.ok) {
        dispatch({ type: 'pushToast', tone: 'warn', message: result.message })
        return
      }
      dispatch({ type: 'replaceItem', before: item, item: result.item, orb, notice: result.message })
    },
    [state],
  )

  const completeCampaignNode = useCallback(
    (nodeId: string) => dispatch({ type: 'completeCampaignNode', nodeId }),
    [],
  )
  const dismissLevelUp = useCallback(() => dispatch({ type: 'dismissLevelUp' }), [])

  return {
    state,
    power,
    knownDps,
    level,
    progress,
    talent,
    currentFingerprint,
    mainSkillId: MAIN_SKILL_ID,
    navigate,
    selectItem,
    equip,
    unequip,
    toggleNode,
    resetTree,
    toggleSocket,
    moveLoadout,
    toggleLoadout,
    selectDungeon,
    resetAttempt,
    measureDummy,
    applyCraft,
    completeCampaignNode,
    dismissLevelUp,
    pushToast,
    dismissToast,
    dispatch,
  }
}

export type Game = ReturnType<typeof useGame>
