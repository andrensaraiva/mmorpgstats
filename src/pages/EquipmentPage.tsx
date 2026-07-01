import { ORBS, getBase } from '../game/content'
import { canCraft } from '../game/engine'
import { itemByUid } from '../game/store'
import type { Game } from '../game/store'
import type { EquipSlot, ItemInstance, OrbId } from '../game/types'
import { RARITY_LABEL, rarClass } from '../ui/format'
import { ItemTooltip, PageHead, Panel, PowerBar, itemIconGlyph } from '../ui/atoms'

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
                    return (
                      <button
                        className={`slot ${rarClass(item.rarity)} b-${item.rarity}${isSel ? ' is-sel' : ''}`}
                        key={slot}
                        onClick={() => game.selectItem(item.uid)}
                      >
                        <div className="slot__type">{SLOT_LABEL[slot]}</div>
                        <div className="slot__icon">{itemIconGlyph(item)}</div>
                        <div className="slot__name">{item.name}</div>
                        <ItemTooltip item={item} />
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

      <Panel title="Inventário & Baú" right={<span className="tiny">{state.inventory.length} itens</span>}>
        <div className="small mb8">
          Cada item nasce de uma <b>base + raridade + afixos sorteados</b>. Selecione um item para craftar, ou equipe-o
          direto no manequim.
        </div>
        <div className="inv-grid">
          {state.inventory.map((item) => (
            <InventoryRow key={item.uid} item={item} game={game} />
          ))}
        </div>
      </Panel>
    </>
  )
}

function InventoryRow({ item, game }: { item: ItemInstance; game: Game }) {
  const base = getBase(item.baseId)
  const isSel = item.uid === game.state.selectedItemUid
  const isEquipped = Object.values(game.state.equipped).includes(item.uid)
  return (
    <div className={`loot-row ${rarClass(item.rarity)}${isSel ? ' is-sel' : ''}`}>
      <button className={`ic ${rarClass(item.rarity)}`} onClick={() => game.selectItem(item.uid)}>
        {itemIconGlyph(item)}
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
      <button
        className="btn btn--sm"
        onClick={() => game.equip(item)}
        disabled={isEquipped}
      >
        {isEquipped ? 'Equipado' : 'Equipar'}
      </button>
      <ItemTooltip item={item} />
    </div>
  )
}

function CraftPanel({ game, selected }: { game: Game; selected: ItemInstance | null }) {
  return (
    <Panel title="Bancada de Crafting">
      {selected ? (
        <>
          <div className={`craft-preview ${rarClass(selected.rarity)}`}>
            <div className="craft-preview__icon">{itemIconGlyph(selected)}</div>
            <div>
              <div className={`craft-preview__name ${rarClass(selected.rarity)}`}>{selected.name}</div>
              <div className="tiny muted">
                {getBase(selected.baseId).name} · {RARITY_LABEL[selected.rarity]}
                {selected.corrupted ? ' · CORROMPIDO' : ''}
              </div>
            </div>
          </div>
          <ItemModList item={selected} />
          <div className="orb-grid">
            {ORBS.map((orb) => {
              const count = game.state.currency[orb.id]
              const usable = count > 0 && canCraft(orb.id, selected)
              return (
                <button
                  key={orb.id}
                  className="orb-btn"
                  disabled={!usable}
                  title={orb.description}
                  onClick={() => game.applyCraft(orb.id as OrbId)}
                >
                  <span className="orb-name">{orb.short}</span>
                  <span className="orb-count">{count}</span>
                </button>
              )
            })}
          </div>
          {game.state.notice ? <div className="tiny craft-notice mt8">{game.state.notice}</div> : (
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

function ItemModList({ item }: { item: ItemInstance }) {
  const base = getBase(item.baseId)
  return (
    <div className="craft-mods">
      {base.implicitText ? <div className="it-impl">{base.implicitText}</div> : null}
      {item.affixes.map((a, i) =>
        item.rarity === 'unique' ? (
          <div className="it-uniq" key={i}>
            {a.text}
          </div>
        ) : (
          <div className="it-aff" key={i}>
            <span className="t">{a.kind === 'prefix' ? 'P' : 'S'}·T{a.tier}</span> {a.text}
          </div>
        ),
      )}
      {item.affixes.length === 0 && !base.implicitText ? <div className="tiny muted">sem modificadores</div> : null}
    </div>
  )
}
