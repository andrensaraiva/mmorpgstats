/* =========================================================
   BuildsWar :: sistema de ícones (Fase A do POLISH_ROADMAP)
   SVG inline, "vetor sem raster". A arte final entra por dados
   (contrato iconId → SVG) sem mexer em componente. Ícones em
   currentColor: quem consome define a cor (tile de raridade).
   ========================================================= */

import type { ReactNode } from 'react'
import { getBase } from '../game/content'
import type { BaseKind, OrbId } from '../game/types'

export type IconId =
  | 'axe'
  | 'sword'
  | 'dagger'
  | 'shield'
  | 'helm'
  | 'gloves'
  | 'chest'
  | 'boots'
  | 'amulet'
  | 'ring'

const KIND_FALLBACK: Record<BaseKind, IconId> = {
  weapon: 'sword',
  offhand: 'shield',
  head: 'helm',
  gloves: 'gloves',
  chest: 'chest',
  boots: 'boots',
  amulet: 'amulet',
  ring: 'ring',
}

/** Silhuetas simples, legíveis de 24 a 52px. fill/stroke = currentColor. */
const ITEM_ICONS: Record<IconId, ReactNode> = {
  sword: (
    <>
      <polygon points="11,2.5 13,2.5 13,14 12,16 11,14" />
      <rect x="8" y="14" width="8" height="1.7" rx="0.4" />
      <rect x="11.2" y="15.7" width="1.6" height="4.3" rx="0.4" />
      <circle cx="12" cy="20.6" r="1.3" />
    </>
  ),
  axe: (
    <>
      <rect x="11.1" y="3" width="1.7" height="18" rx="0.5" transform="rotate(12 12 12)" />
      <path d="M12 3.5c-3 .2-5.4 1.6-6.6 3.6C7 8.7 9.4 9.4 12.4 9.1 13 7 12.9 5 12 3.5Z" />
    </>
  ),
  dagger: (
    <>
      <polygon points="11.1,3 12.9,3 12.9,11 12,12.8 11.1,11" />
      <rect x="9" y="12.6" width="6" height="1.5" rx="0.4" />
      <rect x="11.2" y="14.1" width="1.6" height="4" rx="0.4" />
      <circle cx="12" cy="18.8" r="1.1" />
    </>
  ),
  shield: <path d="M6 4.5 12 3l6 1.5v6.2c0 4.3-3.1 6.9-6 8.3-2.9-1.4-6-4-6-8.3V4.5Z" />,
  helm: (
    <>
      <path d="M6 14a6 6 0 0 1 12 0v2.6H6V14Z" />
      <rect x="11.3" y="8.5" width="1.5" height="7.5" rx="0.4" />
      <rect x="5.4" y="16.4" width="13.2" height="2.2" rx="0.6" />
    </>
  ),
  gloves: (
    <>
      <path d="M9 4h4.2v5.3H16V16H9V4Z" />
      <path d="M8.2 8.3 6.4 10l1.4 1.6 1.6-1.4V8.3Z" />
      <rect x="8.6" y="16" width="7" height="2.4" rx="0.6" />
    </>
  ),
  chest: (
    <>
      <path d="M5 6.2 8 5l4 2 4-2 3 1.2-1 8.6-6 3.2-6-3.2-1-8.6Z" />
      <path d="M12 7v10.8" stroke="currentColor" strokeWidth="0.9" fill="none" opacity="0.35" />
    </>
  ),
  boots: <path d="M9 3.5h3.2v9.3H17v3.4H9V3.5Z" />,
  amulet: (
    <>
      <path d="M7 4.2 12 10l5-5.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="14.4" r="4.4" />
      <circle cx="12" cy="14.4" r="1.7" fill="#000" opacity="0.28" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="14.6" r="5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <rect x="10.1" y="3.4" width="3.8" height="3.8" rx="0.6" transform="rotate(45 12 5.3)" />
    </>
  ),
}

export function ItemIcon({ baseId, className }: { baseId: string; className?: string }) {
  const base = getBase(baseId)
  const id = ((base.icon as IconId | undefined) ?? KIND_FALLBACK[base.kind]) satisfies IconId
  return (
    <svg
      className={`item-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {ITEM_ICONS[id] ?? ITEM_ICONS.ring}
    </svg>
  )
}

/* ---------- orbes de crafting (coloridos, identidade por moeda) ---------- */

const ORB_ACCENT: Record<OrbId, string> = {
  transmutation: '#5a8fc4',
  alteration: '#4fb3a6',
  regal: '#e6d34a',
  exalt: '#ecd085',
  chaos: '#8fc46a',
  divine: '#ffe6a0',
  vaal: '#d8453b',
}

export function OrbIcon({ id, className }: { id: OrbId; className?: string }) {
  const accent = ORB_ACCENT[id] ?? '#c8a44d'
  return (
    <svg
      className={`orb-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ color: accent }}
    >
      <circle cx="12" cy="12" r="8" fill="currentColor" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="1" />
      <ellipse cx="9.6" cy="9" rx="3" ry="1.9" fill="#fff" opacity="0.45" />
      <circle cx="12" cy="12" r="8" fill="#000" opacity="0.06" />
    </svg>
  )
}
