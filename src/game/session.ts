/* =========================================================
   BuildsWar :: sessão (conta + roster de personagens)
   Camada de entrada do app: autenticação e seleção/criação de
   personagem ANTES do jogo. Mockada e persistida em localStorage
   (protótipo — sem backend). O jogo em si continua em store.ts.

   Fluxo de telas:  auth → select → create → game
   ========================================================= */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { classById } from './content'

export type AppPhase = 'auth' | 'select' | 'create' | 'game'
export type ClassId = 'martial' | 'precision' | 'arcane'

export interface Account {
  username: string
  createdAt: number
}

export interface CharacterSummary {
  id: string
  name: string
  classId: ClassId
  level: number
  league: string
  createdAt: number
  lastPlayed: number
}

const LS_ACCOUNT = 'bw.account'
const LS_ROSTER = 'bw.roster'
const LS_ACTIVE = 'bw.activeChar'
const MAX_CHARS = 3 // paridade com o MVP (3 personagens por liga)

/* ---------- persistência segura ---------- */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignora quota/modo privado */
  }
}
function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

let seq = Date.now()
function newId(): string {
  seq += 1
  return `ch_${seq.toString(36)}`
}

/* ---------- validações (usadas pela UI para feedback inline) ---------- */

export function validateUsername(name: string): string | null {
  const v = name.trim()
  if (v.length < 3) return 'Use ao menos 3 caracteres.'
  if (v.length > 16) return 'No máximo 16 caracteres.'
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Apenas letras, números e _.'
  return null
}
export function validatePassword(pw: string): string | null {
  if (pw.length < 6) return 'Senha de ao menos 6 caracteres.'
  return null
}
export function validateCharName(name: string, roster: CharacterSummary[]): string | null {
  const v = name.trim()
  if (v.length < 2) return 'Nome muito curto.'
  if (v.length > 18) return 'No máximo 18 caracteres.'
  if (roster.some((c) => c.name.toLowerCase() === v.toLowerCase())) return 'Já existe um herói com esse nome.'
  return null
}

/* ---------- hook de sessão ---------- */

export function useSession() {
  const [account, setAccount] = useState<Account | null>(() => read<Account | null>(LS_ACCOUNT, null))
  const [roster, setRoster] = useState<CharacterSummary[]>(() => read<CharacterSummary[]>(LS_ROSTER, []))
  const [activeId, setActiveId] = useState<string | null>(() => read<string | null>(LS_ACTIVE, null))

  // Fase inicial derivada do que já está salvo.
  const [phase, setPhase] = useState<AppPhase>(() => {
    const acc = read<Account | null>(LS_ACCOUNT, null)
    const active = read<string | null>(LS_ACTIVE, null)
    const chars = read<CharacterSummary[]>(LS_ROSTER, [])
    if (!acc) return 'auth'
    if (active && chars.some((c) => c.id === active)) return 'game'
    return 'select'
  })

  useEffect(() => write(LS_ROSTER, roster), [roster])
  useEffect(() => (activeId ? write(LS_ACTIVE, activeId) : remove(LS_ACTIVE)), [activeId])

  const activeCharacter = useMemo(
    () => roster.find((c) => c.id === activeId) ?? null,
    [roster, activeId],
  )

  /** Login/registro mockado: aceita qualquer credencial válida e "loga". */
  const authenticate = useCallback((username: string) => {
    const acc: Account = { username: username.trim(), createdAt: Date.now() }
    setAccount(acc)
    write(LS_ACCOUNT, acc)
    setPhase('select')
  }, [])

  const logout = useCallback(() => {
    setAccount(null)
    setActiveId(null)
    remove(LS_ACCOUNT)
    remove(LS_ACTIVE)
    setPhase('auth')
  }, [])

  const goToCreate = useCallback(() => setPhase('create'), [])
  const goToSelect = useCallback(() => setPhase('select'), [])

  const createCharacter = useCallback(
    (name: string, classId: ClassId, league: string): CharacterSummary | null => {
      if (roster.length >= MAX_CHARS) return null
      const now = Date.now()
      const ch: CharacterSummary = {
        id: newId(),
        name: name.trim(),
        classId,
        level: 1,
        league,
        createdAt: now,
        lastPlayed: now,
      }
      setRoster((r) => [...r, ch])
      return ch
    },
    [roster.length],
  )

  const enterGame = useCallback((id: string) => {
    setActiveId(id)
    setRoster((r) => r.map((c) => (c.id === id ? { ...c, lastPlayed: Date.now() } : c)))
    setPhase('game')
  }, [])

  const deleteCharacter = useCallback(
    (id: string) => {
      setRoster((r) => r.filter((c) => c.id !== id))
      if (activeId === id) setActiveId(null)
    },
    [activeId],
  )

  /** Volta do jogo para a seleção de herói (troca de personagem). */
  const leaveGame = useCallback(() => {
    setActiveId(null)
    setPhase('select')
  }, [])

  return {
    phase,
    account,
    roster,
    activeCharacter,
    maxChars: MAX_CHARS,
    className: (id: ClassId) => classById[id]?.name ?? id,
    authenticate,
    logout,
    goToCreate,
    goToSelect,
    createCharacter,
    enterGame,
    deleteCharacter,
    leaveGame,
  }
}

export type Session = ReturnType<typeof useSession>
