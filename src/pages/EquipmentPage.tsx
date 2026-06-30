import type { EquipmentState, ItemDefinition, ItemSlot } from '../app/types'
import { Panel } from '../components/Panel'

interface EquipmentPageProps {
  equipment: EquipmentState
  items: ItemDefinition[]
  onEquip: (item: ItemDefinition) => void
}
const slots: ItemSlot[] = ['weapon', 'offhand', 'head', 'chest', 'amulet', 'ring']

export function EquipmentPage({ equipment, items, onEquip }: EquipmentPageProps) {
  const findItem = (id: string) => items.find((item) => item.id === id)
  const equippedIds = new Set(Object.values(equipment))
  const inventory = items.filter((item) => !equippedIds.has(item.id))

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="section-kicker">Arsenal da companhia</p>
        <h1>Equipamentos</h1>
        <p>Compare peças e prepare a personagem para o perfil de dano da próxima dungeon.</p>
      </div>

      <Panel title="Equipado" eyebrow="Seis slots ativos no protótipo">
        <div className="equipment-grid">
          {slots.map((slot) => {
            const item = findItem(equipment[slot])
            if (!item) return null

            return (
              <article className={`item-card item-card--${item.rarity}`} key={slot}>
                <div className="item-placeholder" aria-hidden="true">
                  {item.slotLabel.slice(0, 2).toUpperCase()}
                </div>
                <div className="item-card__content">
                  <span>{item.slotLabel}</span>
                  <h3>{item.name}</h3>
                  <p>Nível do item {item.itemLevel} · Avaliação {item.rating}</p>
                  <ul>
                    {item.modifiers.map((modifier) => (
                      <li key={modifier}>{modifier}</li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </Panel>

      <Panel title="Inventário" eyebrow="Itens demonstrativos">
        <div className="inventory-list">
          {inventory.map((item) => {
            const equippedItem = findItem(equipment[item.slot])
            const ratingDifference = item.rating - (equippedItem?.rating ?? 0)

            return (
              <article className={`inventory-row inventory-row--${item.rarity}`} key={item.id}>
                <div className="item-placeholder item-placeholder--small" aria-hidden="true">
                  {item.slotLabel.slice(0, 2).toUpperCase()}
                </div>
                <div className="inventory-row__main">
                  <span>{item.slotLabel}</span>
                  <h3>{item.name}</h3>
                  <ul>
                    {item.modifiers.map((modifier) => (
                      <li key={modifier}>{modifier}</li>
                    ))}
                  </ul>
                </div>
                <div className="inventory-row__comparison">
                  <span>Comparação</span>
                  <strong className={ratingDifference >= 0 ? 'positive-value' : 'negative-value'}>
                    {ratingDifference >= 0 ? '+' : ''}{ratingDifference} avaliação
                  </strong>
                  <button className="button button--secondary" type="button" onClick={() => onEquip(item)}>
                    Equipar
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
