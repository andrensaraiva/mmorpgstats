/* =========================================================
   BuildsWar :: diff de afixos após um craft (Fase C)
   Compara os afixos de ANTES × DEPOIS para realçar no preview
   quais mods são novos, quais mudaram de valor/tier e quais
   saíram. Pura e isolada da UI/motor — só lê ItemInstance.
   ========================================================= */

import type { ItemInstance, RolledAffix } from '../game/types'

export type AffixChange = 'new' | 'changed' | 'same'

/** Um afixo do item DEPOIS, anotado com o que mudou vs. o item ANTES. */
export interface AffixDiffEntry {
  affix: RolledAffix
  change: AffixChange
}

/** Chave de identidade de um afixo: mesmo grupo + tipo = "o mesmo slot de mod". */
function affixKey(a: RolledAffix): string {
  return `${a.groupId}:${a.kind}`
}

/** Dois afixos do mesmo grupo são idênticos se texto e tier baterem. */
function sameAffix(a: RolledAffix, b: RolledAffix): boolean {
  return a.tier === b.tier && a.text === b.text
}

/**
 * Diff dos afixos: para cada afixo do item novo, decide se é novo, alterado ou
 * inalterado em relação ao item antigo. Também devolve os afixos removidos
 * (presentes só no antigo) para exibir como "riscados".
 */
export function diffAffixes(
  before: ItemInstance | null,
  after: ItemInstance,
): { entries: AffixDiffEntry[]; removed: RolledAffix[] } {
  if (!before) {
    return { entries: after.affixes.map((affix) => ({ affix, change: 'same' })), removed: [] }
  }

  // Consome os afixos antigos por chave, para casar 1:1 (lida com grupos repetidos).
  const oldPool = new Map<string, RolledAffix[]>()
  for (const a of before.affixes) {
    const list = oldPool.get(affixKey(a)) ?? []
    list.push(a)
    oldPool.set(affixKey(a), list)
  }

  const entries: AffixDiffEntry[] = after.affixes.map((affix) => {
    const pool = oldPool.get(affixKey(affix))
    if (!pool || pool.length === 0) return { affix, change: 'new' }
    const old = pool.shift()!
    return { affix, change: sameAffix(old, affix) ? 'same' : 'changed' }
  })

  // O que sobrou no pool antigo foi removido pelo craft.
  const removed: RolledAffix[] = []
  for (const list of oldPool.values()) removed.push(...list)

  return { entries, removed }
}
