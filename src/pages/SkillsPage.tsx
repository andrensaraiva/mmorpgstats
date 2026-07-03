import { BEHAVIOR, SKILLS, SUPPORTS } from '../game/content'
import { skillRelativeDamage } from '../game/engine'
import type { Game } from '../game/store'
import { PageHead, Panel } from '../ui/atoms'
import { TrainingDummy } from '../ui/TrainingDummy'

export function SkillsPage({ game }: { game: Game }) {
  const cap = game.power.supportCap

  return (
    <>
      <PageHead title="Habilidades" crumb="Monte a rotação e meça o DPS no boneco" />
      <TrainingDummy game={game} />

      <Panel title="Habilidades equipadas">
        {SKILLS.map((sk) => {
          const socketed = game.state.sockets[sk.id] ?? []
          const isDmg = sk.damageMult > 0
          const compat = SUPPORTS.filter((s) => s.match.some((t) => sk.tags.includes(t)))
          const boxes = Array.from({ length: cap }, (_, i) => socketed[i] ?? null)

          return (
            <div className="skill-card" key={sk.id}>
              <div className="skill-card__top">
                <div className={`skill-gem gem--${sk.type}`}>{sk.glyph}</div>
                <div className="skill-main">
                  <div className="nm">{sk.name}</div>
                  <div className="meta">{sk.meta}</div>
                  <div className="desc">{sk.desc}</div>
                  <div className="tags">
                    {sk.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="skill-dps">
                  <div className="sd-k">{isDmg ? 'Dano relativo' : 'Tipo'}</div>
                  <div className="sd-v" style={isDmg ? undefined : { color: 'var(--teal-hi)', fontSize: 14 }}>
                    {isDmg ? skillRelativeDamage(sk.id, game.state.sockets).toFixed(2) : 'apoio'}
                  </div>
                </div>
              </div>

              <div className="socket-area">
                <div className="socket-row">
                  <span className="socket-lbl">Suportes</span>
                  {boxes.map((sid, i) => {
                    if (sid) {
                      const sup = SUPPORTS.find((s) => s.id === sid)!
                      return (
                        <button
                          className="socket filled"
                          key={i}
                          onClick={() => game.toggleSocket(sk.id, sid)}
                          title="Clique para remover"
                        >
                          <span className="s-gem" />
                          {sup.name} <span className="sd-note">{sup.note}</span>
                        </button>
                      )
                    }
                    return (
                      <div className="socket empty" key={i}>
                        soquete vazio
                      </div>
                    )
                  })}
                </div>
                <div className="palette">
                  <div className="pal-lbl">Banca de suportes compatíveis (clique para encaixar/remover)</div>
                  {compat.map((s) => {
                    const on = socketed.includes(s.id)
                    const full = !on && socketed.length >= cap
                    return (
                      <button
                        key={s.id}
                        className={`pal-chip${on ? ' on' : ''}${full ? ' off-limit' : ''}`}
                        onClick={() => game.toggleSocket(sk.id, s.id)}
                        disabled={full}
                      >
                        <span className="s-gem" />
                        {s.name} <span className="pd">{s.note}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </Panel>

      <Panel title="Regras de comportamento">
        <div className="tiny muted mb8">
          Sem linguagem livre: você escolhe gatilhos, condições e ações em listas controladas. O servidor obedece a
          estas prioridades.
        </div>
        {BEHAVIOR.map((b, i) => (
          <div className="rule" key={i}>
            <span className="when">{b.when}</span>
            <span className="arrow">⟶</span>
            <span className="then">{b.then}</span>
          </div>
        ))}
      </Panel>
    </>
  )
}
