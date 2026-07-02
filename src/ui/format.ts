import type { Rarity } from '../game/types'

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

export function fmtTime(sec: number): string {
  const s = Math.round(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m <= 0) return `${r}s`
  return `${m}m ${r < 10 ? '0' + r : r}s`
}

/** Contagem regressiva com dias/horas/min (para timers do Portal). */
export function fmtCountdown(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${ss < 10 ? '0' + ss : ss}s`
  return `${ss}s`
}

export function rarClass(r: Rarity): string {
  return `rar-${r}`
}

export function borderClass(r: Rarity): string {
  return `b-${r}`
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Comum',
  magic: 'Mágico',
  rare: 'Raro',
  unique: 'Único',
}
