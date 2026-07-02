/* =========================================================
   BuildsWar :: estado da aplicação (React)
   Guarda inventário, equipado, árvore, soquetes, moedas e o
   DPS medido. Ações que sorteiam (crafting) criam o novo item
   fora do reducer, mantendo o reducer previsível.
   ========================================================= */

import { useCallback, useMemo, useReducer } from 'react'
import {
  MAIN_SKILL_ID,
  SKILLS,
  STARTER_CURRENCY,
  TREE,
  getBase,
  makeStarter,
} from './content'
import {
  aggregate,
  connectedToStart,
  craft as craftItem,
  fingerprint,
  makeRng,
  slotAccepts,
  treeAdjacency,
} from './engine'
import type {
  CurrencyPouch,
  DamageType,
  EquipSlot,
  FailReason,
  ItemInstance,
  Measured,
  OrbId,
  Power,
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

export interface GameState {
  page: ViewId
  inventory: ItemInstance[]
  equipped: Partial<Record<EquipSlot, string>>
  allocated: Set<string>
  sockets: Record<string, string[]>
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
}

function initState(): GameState {
  const starter = makeStarter()
  return {
    page: 'portal',
    inventory: starter.inventory,
    equipped: starter.equipped,
    allocated: new Set(TREE.preAlloc),
    sockets: Object.fromEntries(SKILLS.map((s) => [s.id, s.defaultSockets.slice()])),
    currency: { ...STARTER_CURRENCY },
    selectedDungeon: 'd-crypt',
    selectedItemUid: starter.inventory[0]?.uid ?? null,
    measured: null,
    attemptPhase: 'idle',
    attemptResult: null,
    notice: null,
    lastCraft: null,
    lastEquip: null,
  }
}

let craftSeq = 0
let equipSeq = 0

type Action =
  | { type: 'navigate'; page: ViewId }
  | { type: 'selectItem'; uid: string | null }
  | { type: 'equip'; uid: string; slot: EquipSlot }
  | { type: 'unequip'; slot: EquipSlot }
  | { type: 'toggleNode'; nodeId: string }
  | { type: 'resetTree' }
  | { type: 'toggleSocket'; skillId: string; supportId: string }
  | { type: 'replaceItem'; before: ItemInstance; item: ItemInstance; orb: OrbId; notice: string }
  | { type: 'selectDungeon'; id: string }
  | { type: 'attemptRun' }
  | { type: 'attemptFinish'; result: AttemptResult; measured: Measured | null }
  | { type: 'attemptReset' }
  | { type: 'notice'; message: string | null }

const adjacency = treeAdjacency()

function pointsUsed(allocated: Set<string>): number {
  return allocated.size - 1 // origem não conta
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
      if (pointsUsed(allocated) >= TREE.maxPoints) {
        return { ...state, notice: `Sem pontos: limite de ${TREE.maxPoints} atingido.` }
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
      }
    }

    case 'selectDungeon':
      return { ...state, selectedDungeon: action.id, attemptPhase: 'idle', attemptResult: null }

    case 'attemptRun':
      return { ...state, attemptPhase: 'running', attemptResult: null }

    case 'attemptFinish':
      return {
        ...state,
        attemptPhase: 'report',
        attemptResult: action.result,
        measured: action.measured ?? state.measured,
      }

    case 'attemptReset':
      return { ...state, attemptPhase: 'idle', attemptResult: null }

    case 'notice':
      return { ...state, notice: action.message }

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

export function selectPower(state: GameState): Power {
  return aggregate({
    equipped: selectEquippedItems(state),
    allocated: state.allocated,
    sockets: state.sockets,
  })
}

export function selectFingerprint(state: GameState): string {
  return fingerprint(state.equipped, state.allocated, state.sockets)
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
      dispatch({ type: 'notice', message: `${base.name} não vai no slot ${target}.` })
      return
    }
    dispatch({ type: 'equip', uid: item.uid, slot: target })
  }, [])

  const unequip = useCallback((slot: EquipSlot) => dispatch({ type: 'unequip', slot }), [])
  const toggleNode = useCallback((nodeId: string) => dispatch({ type: 'toggleNode', nodeId }), [])
  const resetTree = useCallback(() => dispatch({ type: 'resetTree' }), [])
  const toggleSocket = useCallback(
    (skillId: string, supportId: string) => dispatch({ type: 'toggleSocket', skillId, supportId }),
    [],
  )
  const selectDungeon = useCallback((id: string) => dispatch({ type: 'selectDungeon', id }), [])
  const resetAttempt = useCallback(() => dispatch({ type: 'attemptReset' }), [])

  const applyCraft = useCallback(
    (orb: OrbId) => {
      const item = itemByUid(state, state.selectedItemUid)
      if (!item) return
      if (state.currency[orb] <= 0) {
        dispatch({ type: 'notice', message: 'Sem moedas suficientes desse orbe.' })
        return
      }
      const rng = makeRng((Date.now() ^ (item.uid.length * 2654435761)) >>> 0)
      const result = craftItem(orb, item, rng)
      if (!result.ok) {
        dispatch({ type: 'notice', message: result.message })
        return
      }
      dispatch({ type: 'replaceItem', before: item, item: result.item, orb, notice: result.message })
    },
    [state],
  )

  return {
    state,
    power,
    knownDps,
    currentFingerprint,
    mainSkillId: MAIN_SKILL_ID,
    navigate,
    selectItem,
    equip,
    unequip,
    toggleNode,
    resetTree,
    toggleSocket,
    selectDungeon,
    resetAttempt,
    applyCraft,
    dispatch,
  }
}

export type Game = ReturnType<typeof useGame>
