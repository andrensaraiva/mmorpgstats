import { CHARACTER, META } from '../game/content'
import type { Game } from '../game/store'
import { fmtInt } from '../ui/format'
import { PageHead, Panel, PowerBar } from '../ui/atoms'

export function CharacterPage({ game }: { game: Game }) {
  const p = game.power

  const attrs: Array<[string, string]> = [
    ['Força', fmtInt(p.strength)],
    ['Vida', fmtInt(p.life)],
    ['Vel. de ataque', `${p.attackSpeed.toFixed(2)}/s`],
    ['Crítico', `${p.critChance}% · x${(p.critMulti / 100).toFixed(2)}`],
    ['Bloqueio', `${p.block}%`],
    ['Armadura', fmtInt(p.armour)],
  ]

  const resists: Array<[string, string, string]> = [
    ['Res. Fogo', `${p.fireRes}%`, 'res-fire'],
    ['Res. Frio', `${p.coldRes}%`, 'res-cold'],
    ['Res. Raio', `${p.litRes}%`, 'res-lit'],
    ['Vida efetiva', fmtInt(p.ehp), 'res-chaos'],
  ]

  return (
    <>
      <PageHead title="Personagem" crumb="Ficha & Atributos" />
      <Panel title="Poder derivado da build">
        <PowerBar power={p} knownDps={game.knownDps} />
      </Panel>
      <section className="panel">
        <div className="panel__head">
          <span className="ph-l">Ficha da Heroína</span>
          <span className="tiny">{META.league}</span>
        </div>
        <div className="panel__body">
          <div className="sheet">
            <div>
              <div className="portrait">
                <div className="fig" />
                <div className="frame-name">{CHARACTER.name}</div>
              </div>
              <div className="charmeta mt10">
                <div className="charmeta__cls">{CHARACTER.className}</div>
                <div className="tiny muted">
                  Nível {CHARACTER.level} · {META.league}
                </div>
              </div>
            </div>
            <div>
              <div className="eyebrow">Atributos</div>
              <div className="attrgrid">
                {attrs.map(([k, v]) => (
                  <div className="attr" key={k}>
                    <span className="k">{k}</span>
                    <span className="v">{v}</span>
                  </div>
                ))}
              </div>
              <div className="hr-orn" />
              <div className="eyebrow">Resistências & Defesa</div>
              <div className="attrgrid">
                {resists.map(([k, v, cls]) => (
                  <div className={`attr ${cls}`} key={k}>
                    <span className="k">{k}</span>
                    <span className="v">{v}</span>
                  </div>
                ))}
              </div>
              {p.fireRes < 45 ? (
                <div className="tiny warn-text mt10">
                  Res. a fogo abaixo de 45% — chefes ígneos podem matar independentemente do seu dano.
                </div>
              ) : (
                <div className="tiny good-text mt10">Res. a fogo adequada para os chefes ígneos atuais.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
