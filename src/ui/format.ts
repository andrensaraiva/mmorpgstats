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
