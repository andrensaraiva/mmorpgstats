import { SKILLS, SUPPORTS } from '../game/content'
import type { Game } from '../game/store'
import type { DamageType, SkillDefinition } from '../game/types'
import { PageHead, Panel } from '../ui/atoms'
import { TrainingDummy } from '../ui/TrainingDummy'

const TYPE_LABEL: Record<DamageType, string> = {
  phys: 'Físico', fire: 'Fogo', cold: 'Frio', lightning: 'Raio', chaos: 'Caos',
}

const AILMENT_LABEL: Record<string, string> = {
  bleed: 'Sangramento', ignite: 'Queimadura', poison: 'Veneno',
}

/** Selo do tipo de dano da skill (colorido por tipo — M1) + ailment (M3) + fonte (M4). */
function TypeTag({ skill }: { skill: SkillDefinition }) {
  if (skill.source) {
    const t = skill.sourceDamageType ?? 'phys'
    return (
      <>
        <span className="type-tag source-tag">{skill.source === 'minion' ? 'Minion' : 'Totém'}</span>
        <span className={`type-tag dt--${t}`}>{TYPE_LABEL[t]}</span>
      </>
    )
  }
  if (skill.damageMult === 0) return null
  const t = skill.damageType ?? 'phys'
  return (
    <>
      <span className={`type-tag dt--${t}`}>{TYPE_LABEL[t]}</span>
      {skill.ailment ? <span className="type-tag ailment-tag">☠ {AILMENT_LABEL[skill.ailment]}</span> : null}
    </>
  )
}

/** Banca de suportes compatíveis de uma skill (encaixar/remover por clique). */
function SupportPalette({ game, skill, cap }: { game: Game; skill: SkillDefinition; cap: number }) {
  const socketed = game.state.sockets[skill.id] ?? []
  const compat = SUPPORTS.filter((s) => s.match.some((t) => skill.tags.includes(t)))
  return (
    <div className="re-sockets">
      <div className="socket-lbl">
        Suportes {socketed.length}/{cap} — clique para encaixar/remover
      </div>
      <div className="palette">
        {compat.map((s) => {
          const on = socketed.includes(s.id)
          const full = !on && socketed.length >= cap
          return (
            <button
              key={s.id}
              className={`pal-chip${on ? ' on' : ''}${full ? ' off-limit' : ''}`}
              onClick={() => game.toggleSocket(skill.id, s.id)}
              disabled={full}
              aria-pressed={on}
            >
              <span className="s-gem" />
              {s.name} <span className="pd">{s.note}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SkillsPage({ game }: { game: Game }) {
  const cap = game.power.supportCap
  const { loadout } = game.state
  const byId = (id: string) => SKILLS.find((s) => s.id === id)!
  // Contribuem DPS: golpes (damageMult>0) e fontes externas (minions/totens).
  const dpsSkills = SKILLS.filter((s) => s.damageMult > 0 || s.source)
  const utilitySkills = SKILLS.filter((s) => s.damageMult === 0 && !s.source)
  const poolToAdd = dpsSkills.filter((s) => !loadout.includes(s.id))

  return (
    <>
      <PageHead title="Habilidades" crumb="Monte a rotação e meça o DPS no boneco" />
      <TrainingDummy game={game} />

      <Panel title="Rotação de combate">
        <p className="tiny muted mb8">
          A <b>ordem é a prioridade</b>: a cada ação o herói usa a primeira habilidade pronta (fora de cooldown e com
          recurso); senão, cai no ataque básico. Reordene, encaixe suportes e <b>veja o DPS mudar no boneco acima</b>.
        </p>

        {loadout.map((id, i) => {
          const sk = byId(id)
          const isFirst = i === 0
          const isLast = i === loadout.length - 1
          const canRemove = loadout.length > 1
          return (
            <div className="rota-edit" key={id}>
              <div className="re-head">
                <span className="rs-order">{i + 1}</span>
                <span className={`skill-gem gem--${sk.type}`}>{sk.glyph}</span>
                <div className="re-main">
                  <div className="rs-name">
                    {sk.name} <TypeTag skill={sk} />
                  </div>
                  <div className="rs-meta tiny muted">
                    {sk.source
                      ? 'fonte contínua · luta por conta própria (fora da prioridade)'
                      : `custo ${sk.cost} · ${sk.cooldown > 0 ? `rec ${sk.cooldown}s` : 'sem cooldown'}${
                          sk.castTime > 0 ? ` · cast ${sk.castTime}s` : ''
                        }`}
                  </div>
                  <div className="rs-combo-row">
                    {sk.applies ? (
                      <span className="combo-tag ct--setup">▶ abre Exposição ({sk.appliesDuration}s)</span>
                    ) : null}
                    {sk.empoweredBy ? (
                      <span className="combo-tag ct--payoff">◀ +{sk.comboMore}% com Exposição</span>
                    ) : null}
                  </div>
                </div>
                <div className="re-controls">
                  <button
                    className="icon-btn"
                    onClick={() => game.moveLoadout(id, -1)}
                    disabled={isFirst}
                    aria-label={`Subir prioridade de ${sk.name}`}
                  >
                    ↑
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => game.moveLoadout(id, 1)}
                    disabled={isLast}
                    aria-label={`Descer prioridade de ${sk.name}`}
                  >
                    ↓
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => game.toggleLoadout(id)}
                    disabled={!canRemove}
                    aria-label={`Remover ${sk.name} da rotação`}
                    title={canRemove ? 'Remover da rotação' : 'A rotação precisa de ao menos uma habilidade'}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <SupportPalette game={game} skill={sk} cap={cap} />
            </div>
          )
        })}

        <div className="eyebrow mt10 mb6">Adicionar à rotação</div>
        {poolToAdd.length ? (
          <div className="pool-add">
            {poolToAdd.map((sk) => (
              <button key={sk.id} className="pool-chip" onClick={() => game.toggleLoadout(sk.id)}>
                <span className={`skill-gem gem--${sk.type}`}>{sk.glyph}</span>
                <span className="pc-main">
                  <span className="rs-name">
                    {sk.name} <TypeTag skill={sk} />
                  </span>
                  <span className="tiny muted">{sk.desc}</span>
                </span>
                <span className="pc-add">+ adicionar</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="tiny muted">Todas as habilidades de dano já estão na rotação.</div>
        )}
      </Panel>

      <Panel title="Utilitárias & auras">
        <p className="tiny muted mb8">
          Não geram DPS (não entram na medição do boneco); vão contar no <b>cálculo defensivo da dungeon</b> (R4).
          Encaixe suportes de defesa/duração.
        </p>
        {utilitySkills.map((sk) => (
          <div className="rota-edit" key={sk.id}>
            <div className="re-head">
              <span className={`skill-gem gem--${sk.type}`}>{sk.glyph}</span>
              <div className="re-main">
                <div className="rs-name">{sk.name}</div>
                <div className="rs-meta tiny muted">{sk.meta}</div>
                <div className="tiny muted">{sk.desc}</div>
              </div>
            </div>
            <SupportPalette game={game} skill={sk} cap={cap} />
          </div>
        ))}
      </Panel>
    </>
  )
}
