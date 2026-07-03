import { useEffect, useMemo, useState } from 'react'
import { ORBS, getBase } from '../game/content'
import { aggregate, canCraft, measuredRotation } from '../game/engine'
import { itemByUid, selectEquippedItems, selectLoadoutSlots } from '../game/store'
import type { Game, LastCraft } from '../game/store'
import type { BaseKind, EquipSlot, ItemInstance, OrbId, Rarity } from '../game/types'
import { RARITY_LABEL, fmtInt, rarClass } from '../ui/format'
import { ItemTooltipBody, PageHead, Panel, PowerBar } from '../ui/atoms'
import { ItemIcon, OrbIcon } from '../ui/icons'
import { tipProps, useItemTip } from '../ui/tooltip'
import { diffAffixes } from '../ui/craftDiff'
import {
  KIND_LABEL,
  applyInventoryFilter,
  emptyFilter,
  type InvSort,
} from '../ui/inventoryFilter'

const DOLL: EquipSlot[][] = [
  ['weapon', 'head', 'offhand'],
  ['gloves', 'chest', 'amulet'],
  ['ring2', 'boots', 'ring1'],
]

const SLOT_LABEL: Record<EquipSlot, string> = {
  weapon: 'Arma',
  head: 'Cabeça',
  offhand: 'Secundária',
  gloves: 'Luvas',
  chest: 'Torso',
  amulet: 'Amuleto',
  ring2: 'Anel II',
  boots: 'Botas',
  ring1: 'Anel I',
}

export function EquipmentPage({ game }: { game: Game }) {
  const { state } = game
  const tip = useItemTip()
  const byUid = new Map(state.inventory.map((i) => [i.uid, i]))
  const selected = itemByUid(state, state.selectedItemUid)

  return (
    <>
      <PageHead title="Equipamento" crumb="Manequim · inventário · crafting" />
      <div className="doll-wrap">
        <section className="panel">
          <div className="panel__head">
            <span className="ph-l">Manequim</span>
            <span className="tiny">9 slots · clique para inspecionar/craftar</span>
          </div>
          <div className="panel__body">
            <div className="doll">
              <div className="doll__fig" />
              <div className="doll__grid">
                {DOLL.flatMap((row) =>
                  row.map((slot) => {
                    const uid = state.equipped[slot]
                    const item = uid ? byUid.get(uid) : undefined
                    if (!item) {
                      return (
                        <div className="slot empty" key={slot}>
                          <div className="slot__type">{SLOT_LABEL[slot]}</div>
                          <div className="slot__icon">—</div>
                          <div className="slot__name">vazio</div>
                        </div>
                      )
                    }
                    const isSel = item.uid === state.selectedItemUid
                    const justEquipped = state.lastEquip?.slot === slot
                    return (
                      <button
                        className={`slot ${rarClass(item.rarity)} b-${item.rarity}${isSel ? ' is-sel' : ''}${
                          justEquipped ? ' just-equipped' : ''
                        }`}
                        key={justEquipped ? `${slot}-${state.lastEquip!.seq}` : slot}
                        aria-label={`${SLOT_LABEL[slot]}: ${item.name}`}
                        onClick={() => game.selectItem(item.uid)}
                        {...tipProps(tip, <ItemTooltipBody item={item} />)}
                      >
                        <div className="slot__type">{SLOT_LABEL[slot]}</div>
                        <div className="slot__icon">
                          <ItemIcon baseId={item.baseId} />
                        </div>
                        <div className="slot__name">{item.name}</div>
                        {item.corrupted ? <span className="corrupt-seal" title="Corrompido" /> : null}
                      </button>
                    )
                  }),
                )}
              </div>
            </div>
          </div>
        </section>

        <div>
          <Panel title="Poder de combate">
            <PowerBar power={game.power} knownDps={game.knownDps} />
          </Panel>

          <CraftPanel game={game} selected={selected} />
        </div>
      </div>

      <InventorySection game={game} />
    </>
  )
}

/* ---------- inventário com filtros/busca/ordenação (Fase D) ---------- */

const SORT_OPTIONS: Array<[InvSort, string]> = [
  ['recent', 'Recentes'],
  ['rarity', 'Raridade'],
  ['name', 'Nome'],
  ['kind', 'Categoria'],
]

const RARITY_OPTIONS: Rarity[] = ['common', 'magic', 'rare', 'unique']

/** Categorias mostradas na barra de filtro (ordem de leitura do manequim). */
const KIND_ORDER: BaseKind[] = ['weapon', 'offhand', 'head', 'chest', 'gloves', 'boots', 'amulet', 'ring']

function InventorySection({ game }: { game: Game }) {
  const { inventory } = game.state
  const [filter, setFilter] = useState(emptyFilter)

  const visible = useMemo(() => applyInventoryFilter(inventory, filter), [inventory, filter])

  // Só oferece categorias/raridades que existem no baú (barra enxuta).
  const availableKinds = useMemo(() => {
    const set = new Set<BaseKind>()
    for (const it of inventory) set.add(getBase(it.baseId).kind)
    return KIND_ORDER.filter((k) => set.has(k))
  }, [inventory])

  const toggleKind = (k: BaseKind) =>
    setFilter((f) => {
      const kinds = new Set(f.kinds)
      kinds.has(k) ? kinds.delete(k) : kinds.add(k)
      return { ...f, kinds }
    })
  const toggleRarity = (r: Rarity) =>
    setFilter((f) => {
      const rarities = new Set(f.rarities)
      rarities.has(r) ? rarities.delete(r) : rarities.add(r)
      return { ...f, rarities }
    })

  const filtered = visible.length !== inventory.length
  const clearAll = () => setFilter(emptyFilter())

  return (
    <Panel
      title="Inventário & Baú"
      right={
        <span className="tiny">
          {filtered ? `${visible.length} de ${inventory.length}` : `${inventory.length}`} itens
        </span>
      }
    >
      <div className="small mb8">
        Cada item nasce de uma <b>base + raridade + afixos sorteados</b>. Selecione um item para craftar, ou equipe-o
        direto no manequim.
      </div>

      <div className="inv-tools" role="search">
        <input
          className="inv-search"
          type="search"
          value={filter.query}
          placeholder="Buscar por afixo, nome ou base…"
          aria-label="Buscar itens por afixo, nome ou base"
          onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
        />
        <label className="inv-sort">
          <span className="tiny muted">Ordenar</span>
          <select
            value={filter.sort}
            aria-label="Ordenar inventário"
            onChange={(e) => setFilter((f) => ({ ...f, sort: e.target.value as InvSort }))}
          >
            {SORT_OPTIONS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="inv-chips">
        {availableKinds.map((k) => (
          <button
            key={k}
            className={`fchip${filter.kinds.has(k) ? ' is-on' : ''}`}
            aria-pressed={filter.kinds.has(k)}
            onClick={() => toggleKind(k)}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
        <span className="fchip-sep" aria-hidden="true" />
        {RARITY_OPTIONS.map((r) => (
          <button
            key={r}
            className={`fchip fchip--${r}${filter.rarities.has(r) ? ' is-on' : ''}`}
            aria-pressed={filter.rarities.has(r)}
            onClick={() => toggleRarity(r)}
          >
            {RARITY_LABEL[r]}
          </button>
        ))}
        {filtered ? (
          <button className="fchip fchip--clear" onClick={clearAll}>
            Limpar ✕
          </button>
        ) : null}
      </div>

      {visible.length > 0 ? (
        <div className="inv-grid">
          {visible.map((item) => (
            <InventoryRow key={item.uid} item={item} game={game} />
          ))}
        </div>
      ) : (
        <div className="inv-empty">
          {inventory.length === 0 ? (
            <>
              <div className="inv-empty__title">Baú vazio</div>
              <div className="tiny muted">Vença dungeons para o loot começar a cair aqui.</div>
            </>
          ) : (
            <>
              <div className="inv-empty__title">Nenhum item bate com o filtro</div>
              <div className="tiny muted">
                Ajuste a busca ou as categorias.{' '}
                <button className="link-btn" onClick={clearAll}>
                  Limpar filtros
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Panel>
  )
}

function InventoryRow({ item, game }: { item: ItemInstance; game: Game }) {
  const tip = useItemTip()
  const base = getBase(item.baseId)
  const isSel = item.uid === game.state.selectedItemUid
  const isEquipped = Object.values(game.state.equipped).includes(item.uid)
  const body = <ItemTooltipBody item={item} />
  return (
    <div className={`loot-row ${rarClass(item.rarity)}${isSel ? ' is-sel' : ''}`}>
      <button
        className={`ic ${rarClass(item.rarity)}`}
        aria-label={`Inspecionar ${item.name}`}
        {...tipProps(tip, body)}
        onClick={(e) => tip.togglePin(body, e.currentTarget)}
      >
        <ItemIcon baseId={item.baseId} />
        {item.corrupted ? <span className="corrupt-seal" title="Corrompido" /> : null}
      </button>
      <div className="loot-main">
        <button className={`loot-name ${rarClass(item.rarity)}`} onClick={() => game.selectItem(item.uid)}>
          {item.name}
          {item.corrupted ? <span className="it-corrupt"> · corrompido</span> : null}
        </button>
        <div className="tiny muted">
          {base.name} · {RARITY_LABEL[item.rarity]}
        </div>
      </div>
      <button className="btn btn--sm" onClick={() => game.equip(item)} disabled={isEquipped}>
        {isEquipped ? 'Equipado' : 'Equipar'}
      </button>
    </div>
  )
}

function CraftPanel({ game, selected }: { game: Game; selected: ItemInstance | null }) {
  const [confirmVaal, setConfirmVaal] = useState(false)
  // Cancela a confirmação pendente ao trocar de item selecionado.
  useEffect(() => setConfirmVaal(false), [selected?.uid])

  // Realce do craft: só vale enquanto o item craftado continua selecionado.
  const lastCraft = game.state.lastCraft
  const craft: LastCraft | null = lastCraft && selected && lastCraft.uid === selected.uid ? lastCraft : null

  return (
    <Panel title="Bancada de Crafting">
      {selected ? (
        <>
          <div
            className={`craft-preview ${rarClass(selected.rarity)}${craft ? ' just-crafted' : ''}`}
            key={craft ? craft.seq : selected.uid}
          >
            <div className="craft-preview__icon">
              <ItemIcon baseId={selected.baseId} />
            </div>
            <div>
              <div className={`craft-preview__name ${rarClass(selected.rarity)}`}>{selected.name}</div>
              <div className="tiny muted">
                {getBase(selected.baseId).name} · {RARITY_LABEL[selected.rarity]}
                {selected.corrupted ? ' · CORROMPIDO' : ''}
              </div>
            </div>
            {craft ? <span className="craft-flash" aria-hidden="true" /> : null}
          </div>
          <ItemModList item={selected} craft={craft} />
          <ComparePanel game={game} item={selected} />
          <div className="orb-grid">
            {ORBS.map((orb) => {
              const count = game.state.currency[orb.id]
              const usable = count > 0 && canCraft(orb.id, selected)
              const justUsed = craft?.orb === orb.id
              return (
                <button
                  key={orb.id}
                  className={`orb-btn${orb.id === 'vaal' ? ' orb-btn--vaal' : ''}${justUsed ? ' orb-btn--used' : ''}`}
                  disabled={!usable}
                  title={orb.description}
                  aria-label={`${orb.name}: ${orb.description}. ${count} em estoque.`}
                  onClick={() => {
                    if (orb.id === 'vaal') {
                      setConfirmVaal(true)
                      return
                    }
                    game.applyCraft(orb.id as OrbId)
                  }}
                >
                  <OrbIcon id={orb.id as OrbId} />
                  <span className="orb-name">{orb.short}</span>
                  <CraftCount value={count} spend={justUsed} />
                </button>
              )
            })}
          </div>

          {confirmVaal ? (
            <div className="vaal-confirm" role="alertdialog" aria-label="Confirmar corrupção">
              <div className="tiny">
                O <b>Orbe Vaal</b> corrompe <b>{selected.name}</b> de forma <b>irreversível</b>: resultado imprevisível
                e o item fica travado para sempre (sem mais crafting).
              </div>
              <div className="vaal-confirm__actions">
                <button
                  className="btn btn--blood btn--sm"
                  onClick={() => {
                    setConfirmVaal(false)
                    game.applyCraft('vaal')
                  }}
                >
                  Corromper mesmo assim
                </button>
                <button className="btn btn--sm" onClick={() => setConfirmVaal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="tiny muted mt8">
              Craftar gera uma nova instância do item — o DPS medido é invalidado e precisa ser re-testado.
            </div>
          )}
        </>
      ) : (
        <div className="tiny muted">Selecione um item no inventário ou no manequim para craftar.</div>
      )}
    </Panel>
  )
}

/**
 * Contador de orbe que, ao gastar, mostra um "−1" flutuante subindo — o feedback
 * de "moedas decrementando" da Fase C. Respeita prefers-reduced-motion via CSS
 * (a animação global é neutralizada; o número novo aparece direto).
 */
function CraftCount({ value, spend }: { value: number; spend: boolean }) {
  return (
    <span className="orb-count">
      {value}
      {spend ? (
        <span className="orb-spend" aria-hidden="true">
          −1
        </span>
      ) : null}
    </span>
  )
}

function ItemModList({ item, craft }: { item: ItemInstance; craft?: LastCraft | null }) {
  const base = getBase(item.baseId)
  // Diff pós-craft: anota novo/alterado por afixo e lista removidos.
  const diff = craft ? diffAffixes(craft.before, item) : null
  const changeLabel: Record<string, string> = { new: 'novo', changed: 'alterado', same: '' }

  return (
    <div className="craft-mods">
      {base.implicitText ? <div className="it-impl">{base.implicitText}</div> : null}
      {item.affixes.map((a, i) => {
        const change = diff?.entries[i]?.change ?? 'same'
        const flag = change === 'new' || change === 'changed' ? change : ''
        if (item.rarity === 'unique') {
          return (
            <div className={`it-uniq${flag ? ` aff-${flag}` : ''}`} key={i}>
              {a.text}
            </div>
          )
        }
        return (
          <div className={`it-aff${flag ? ` aff-${flag}` : ''}${a.exceptional ? ' it-exc' : ''}`} key={i}>
            <span className="t">{a.exceptional ? 'EXC' : `${a.kind === 'prefix' ? 'P' : 'S'}·T${a.tier}`}</span> {a.text}
            {flag ? <span className={`aff-badge aff-badge--${flag}`}>{changeLabel[change]}</span> : null}
          </div>
        )
      })}
      {diff?.removed.map((a, i) => (
        <div className="it-aff aff-removed" key={`rm-${i}`}>
          <span className="t">{a.kind === 'prefix' ? 'P' : 'S'}·T{a.tier}</span> {a.text}
          <span className="aff-badge aff-badge--removed">removido</span>
        </div>
      ))}
      {item.affixes.length === 0 && !base.implicitText ? <div className="tiny muted">sem modificadores</div> : null}
    </div>
  )
}

/**
 * Comparação equipado × candidato: recalcula o poder com o item encaixado no
 * seu slot e mostra o delta de DPS/vida/armadura/resistências. Pilar "loot que
 * muda decisões". DPS é rotulado "est." (mecânica de números descobertos).
 */
function ComparePanel({ game, item }: { game: Game; item: ItemInstance }) {
  const base = getBase(item.baseId)
  const slot: EquipSlot = base.kind === 'ring' ? 'ring1' : (base.kind as EquipSlot)
  const st = game.state
  const curUid = st.equipped[slot]
  const equippedItems = selectEquippedItems(st)
  const candidateEquipped = equippedItems
    .filter((i) => i.uid !== curUid && i.uid !== item.uid)
    .concat([item])

  const cur = game.power
  const cand = aggregate({ equipped: candidateEquipped, allocated: st.allocated, sockets: st.sockets })
  // DPS-âncora = o da rotação (coerente com a headline); o candidato roda a mesma sim.
  const candDps = measuredRotation(candidateEquipped, st.allocated, selectLoadoutSlots(st)).dps

  const isEquipped = Object.values(st.equipped).includes(item.uid)
  const vsName = curUid ? equippedItems.find((i) => i.uid === curUid)?.name ?? 'equipado' : 'slot vazio'

  const rows: Array<[string, number, number, string]> = [
    ['DPS (est.)', Math.round(cur.dps), Math.round(candDps), ''],
    ['Vida efetiva', cur.ehp, cand.ehp, ''],
    ['Armadura', cur.armour, cand.armour, ''],
    ['Evasão', cur.evasion, cand.evasion, ''],
    ['Esc. energia', cur.energyShield, cand.energyShield, ''],
    ['Res. Fogo', cur.fireRes, cand.fireRes, '%'],
    ['Res. Frio', cur.coldRes, cand.coldRes, '%'],
    ['Res. Raio', cur.litRes, cand.litRes, '%'],
    ['Res. Caos', cur.chaosRes, cand.chaosRes, '%'],
  ]

  return (
    <div className="cmp">
      <div className="cmp__head">
        <span className="eyebrow">Comparar com o equipado</span>
        <span className="tiny muted">
          vs. {isEquipped ? 'atual (já equipado)' : vsName} · slot {SLOT_LABEL[slot]}
        </span>
      </div>
      {rows.map(([label, c, n, unit]) => (
        <DeltaRow key={label} label={label} cur={c} cand={n} unit={unit} />
      ))}
    </div>
  )
}

function DeltaRow({ label, cur, cand, unit }: { label: string; cur: number; cand: number; unit: string }) {
  const d = cand - cur
  const cls = d > 0 ? 'cmp-up' : d < 0 ? 'cmp-down' : 'cmp-flat'
  const sign = d > 0 ? '+' : ''
  return (
    <div className="cmp-row">
      <span className="cmp-k">{label}</span>
      <span className="cmp-v">
        <span className="cmp-cur">
          {fmtInt(cur)}
          {unit}
        </span>
        <span className="cmp-arrow">→</span>
        <span className="cmp-cand">
          {fmtInt(cand)}
          {unit}
        </span>
        <span className={`cmp-delta ${cls}`}>
          {d === 0 ? '—' : `${sign}${fmtInt(d)}${unit}`}
        </span>
      </span>
    </div>
  )
}
