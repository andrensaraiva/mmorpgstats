/* =========================================================
   BuildsWar :: filtro/ordenação de inventário (Fase D)
   Pura e isolada da UI/motor: recebe itens + critérios e
   devolve a lista visível. A busca por afixo casa no texto
   dos mods (e no nome/base). Ordenação estável.
   ========================================================= */

import { getBase } from '../game/content'
import type { BaseKind, ItemInstance, Rarity } from '../game/types'

/** Como ordenar a lista visível. */
export type InvSort = 'recent' | 'name' | 'rarity' | 'kind'

export interface InvFilter {
  /** Vazio = todas as categorias. */
  kinds: Set<BaseKind>
  /** Vazio = todas as raridades. */
  rarities: Set<Rarity>
  /** Busca livre: casa em nome, base ou texto de afixo (case-insensitive). */
  query: string
  sort: InvSort
}

export function emptyFilter(): InvFilter {
  return { kinds: new Set(), rarities: new Set(), query: '', sort: 'recent' }
}

const RARITY_ORDER: Record<Rarity, number> = { unique: 0, rare: 1, magic: 2, common: 3 }

/** Texto pesquisável de um item: nome + base + implícito + afixos. */
function haystack(item: ItemInstance): string {
  const base = getBase(item.baseId)
  const parts = [item.name, base.name, base.implicitText ?? '', ...item.affixes.map((a) => a.text)]
  return parts.join(' ').toLowerCase()
}

function matches(item: ItemInstance, f: InvFilter): boolean {
  const base = getBase(item.baseId)
  if (f.kinds.size > 0 && !f.kinds.has(base.kind)) return false
  if (f.rarities.size > 0 && !f.rarities.has(item.rarity)) return false
  const q = f.query.trim().toLowerCase()
  if (q && !haystack(item).includes(q)) return false
  return true
}

/**
 * Aplica o filtro e ordena. Preserva a ordem original como desempate (e como
 * ordem "recent", já que itens craftados vão para a posição do antigo — o mais
 * novo mantém o índice). Não muta a entrada.
 */
export function applyInventoryFilter(items: ItemInstance[], f: InvFilter): ItemInstance[] {
  const visible = items.filter((i) => matches(i, f))
  const indexed = visible.map((item, i) => ({ item, i }))

  indexed.sort((a, b) => {
    let d = 0
    if (f.sort === 'name') d = a.item.name.localeCompare(b.item.name, 'pt-BR')
    else if (f.sort === 'rarity') d = RARITY_ORDER[a.item.rarity] - RARITY_ORDER[b.item.rarity]
    else if (f.sort === 'kind') d = getBase(a.item.baseId).kind.localeCompare(getBase(b.item.baseId).kind)
    // 'recent' e desempates caem no índice original (estável).
    return d !== 0 ? d : a.i - b.i
  })

  return indexed.map((x) => x.item)
}

/** Rótulos das categorias de base para a barra de filtro. */
export const KIND_LABEL: Record<BaseKind, string> = {
  weapon: 'Armas',
  offhand: 'Secundária',
  head: 'Cabeça',
  gloves: 'Luvas',
  chest: 'Torso',
  boots: 'Botas',
  amulet: 'Amuletos',
  ring: 'Anéis',
}
