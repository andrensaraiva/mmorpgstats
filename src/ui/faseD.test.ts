import { describe, expect, it } from 'vitest'
import { getBase, makeStarter } from '../game/content'
import type { ItemInstance } from '../game/types'
import { applyInventoryFilter, emptyFilter } from './inventoryFilter'
import { diffAffixes } from './craftDiff'

const inventory = makeStarter().inventory

describe('applyInventoryFilter (ferramentas de inventário — Fase D)', () => {
  it('sem filtro devolve todos os itens, na ordem original', () => {
    const out = applyInventoryFilter(inventory, emptyFilter())
    expect(out).toHaveLength(inventory.length)
    expect(out.map((i) => i.uid)).toEqual(inventory.map((i) => i.uid))
  })

  it('filtra por categoria (kind) de base', () => {
    const f = { ...emptyFilter(), kinds: new Set(['weapon' as const]) }
    const out = applyInventoryFilter(inventory, f)
    expect(out.length).toBeGreaterThan(0)
    expect(out.every((i) => getBase(i.baseId).kind === 'weapon')).toBe(true)
  })

  it('filtra por raridade', () => {
    const f = { ...emptyFilter(), rarities: new Set(['rare' as const]) }
    const out = applyInventoryFilter(inventory, f)
    expect(out.length).toBeGreaterThan(0)
    expect(out.every((i) => i.rarity === 'rare')).toBe(true)
  })

  it('busca por texto de afixo (case-insensitive)', () => {
    const f = { ...emptyFilter(), query: 'RESISTÊNCIA A FOGO' }
    const out = applyInventoryFilter(inventory, f)
    expect(out.length).toBeGreaterThan(0)
    expect(
      out.every((i) => i.affixes.some((a) => a.text.toLowerCase().includes('resistência a fogo'))),
    ).toBe(true)
  })

  it('busca sem correspondência devolve lista vazia', () => {
    const out = applyInventoryFilter(inventory, { ...emptyFilter(), query: 'zzz-inexistente' })
    expect(out).toHaveLength(0)
  })

  it('ordena por nome (pt-BR)', () => {
    const out = applyInventoryFilter(inventory, { ...emptyFilter(), sort: 'name' })
    const names = out.map((i) => i.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    expect(names).toEqual(sorted)
  })

  it('ordena por raridade (único → comum)', () => {
    const out = applyInventoryFilter(inventory, { ...emptyFilter(), sort: 'rarity' })
    const rank = { unique: 0, rare: 1, magic: 2, common: 3 } as const
    for (let i = 1; i < out.length; i++) {
      expect(rank[out[i - 1].rarity]).toBeLessThanOrEqual(rank[out[i].rarity])
    }
  })

  it('não muta a entrada', () => {
    const snapshot = inventory.map((i) => i.uid)
    applyInventoryFilter(inventory, { ...emptyFilter(), sort: 'name' })
    expect(inventory.map((i) => i.uid)).toEqual(snapshot)
  })
})

describe('diffAffixes (realce pós-craft — Fase C, reusado na D)', () => {
  const base = inventory.find((i) => i.affixes.length >= 2)!

  it('sem "before" marca todos como same (sem realce)', () => {
    const { entries, removed } = diffAffixes(null, base)
    expect(entries).toHaveLength(base.affixes.length)
    expect(entries.every((e) => e.change === 'same')).toBe(true)
    expect(removed).toHaveLength(0)
  })

  it('detecta afixo novo (grupo ausente no before)', () => {
    // "before" sem o primeiro afixo → ele deve aparecer como "new".
    const before: ItemInstance = { ...base, affixes: base.affixes.slice(1) }
    const { entries } = diffAffixes(before, base)
    expect(entries[0].change).toBe('new')
  })

  it('detecta afixo alterado (mesmo grupo, tier/texto diferente)', () => {
    const changedFirst = {
      ...base.affixes[0],
      tier: base.affixes[0].tier + 1,
      text: base.affixes[0].text + ' (rerrolado)',
    }
    const before: ItemInstance = { ...base, affixes: [changedFirst, ...base.affixes.slice(1)] }
    const { entries } = diffAffixes(before, base)
    expect(entries[0].change).toBe('changed')
  })

  it('lista afixos removidos (presentes só no before)', () => {
    const extra = { ...base.affixes[0], groupId: '__extra__', text: 'afixo extra removível' }
    const before: ItemInstance = { ...base, affixes: [...base.affixes, extra] }
    const { removed } = diffAffixes(before, base)
    expect(removed.some((a) => a.groupId === '__extra__')).toBe(true)
  })
})
