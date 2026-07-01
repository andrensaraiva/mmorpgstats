import { MARKET, getBase } from '../game/content'
import type { Game } from '../game/store'
import { RARITY_LABEL, fmtInt, rarClass } from '../ui/format'
import { PageHead, Panel } from '../ui/atoms'

export function MarketPage(_props: { game: Game }) {
  return (
    <>
      <PageHead title="Mercado" crumb="Anúncios por preço fixo · economia isolada por liga" />
      <Panel title="Mercado da Liga">
        <div className="market-tools">
          <select defaultValue="all">
            <option value="all">Todos os tipos-base</option>
            <option value="ring">Anéis</option>
            <option value="weapon">Armas</option>
          </select>
          <select defaultValue="any">
            <option value="any">Qualquer raridade</option>
            <option value="unique">Único</option>
            <option value="rare">Raro</option>
          </select>
          <input placeholder="filtrar afixo (ex.: res. fogo)" className="market-filter" />
          <select defaultValue="asc">
            <option value="asc">Preço ↑</option>
            <option value="desc">Preço ↓</option>
          </select>
        </div>
        <table className="mtable">
          <thead>
            <tr>
              <th>Item</th>
              <th>Vendedor</th>
              <th>Preço</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {MARKET.map((m) => {
              const base = getBase(m.baseId)
              return (
                <tr key={m.id}>
                  <td>
                    <div className="item-cell">
                      <div className={`ic ${rarClass(m.rarity)}`}>{base.name.charAt(0)}</div>
                      <div>
                        <div className={`market-name ${rarClass(m.rarity)}`}>{m.name}</div>
                        <div className="tiny muted">
                          {base.name} · {RARITY_LABEL[m.rarity]} · nv {m.lvl}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="seller">{m.seller}</td>
                  <td className="price">
                    {fmtInt(m.price)} <span className="coin">Selos</span>
                  </td>
                  <td>
                    <button className="btn btn--sm" title="Compra demonstrativa">
                      Comprar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="tiny muted mt8">
          Rumo POE: o que vale é a moeda de topo (a "divine"). Preços e afixos serão refinados depois.
        </div>
      </Panel>
    </>
  )
}
