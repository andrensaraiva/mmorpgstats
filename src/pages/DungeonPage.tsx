import type { AttemptState, BuildPreset, DungeonReport } from '../app/types'
import { Panel } from '../components/Panel'

interface DungeonPageProps {
  build: BuildPreset
  attemptState: AttemptState
  report: DungeonReport | null
  onStart: () => void
  onReset: () => void
}
const numberFormatter = new Intl.NumberFormat('pt-BR')

export function DungeonPage({ build, attemptState, report, onStart, onReset }: DungeonPageProps) {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="section-kicker">Contrato de expedição</p>
        <h1>Forja Abandonada</h1>
        <p>Uma instalação esquecida onde sentinelas de ferro ainda protegem o coração da forja.</p>
      </div>

      <div className="dungeon-layout">
        <Panel title="Informações da dungeon" eyebrow="Dificuldade de teste 12">
          <dl className="dungeon-facts">
            <div>
              <dt>Encontros</dt>
              <dd>Dois grupos, uma elite e um chefe</dd>
            </div>
            <div>
              <dt>Tipos de dano</dt>
              <dd>Físico e fogo</dd>
            </div>
            <div>
              <dt>Seed</dt>
              <dd>BW-0017</dd>
            </div>
            <div>
              <dt>Build registrada</dt>
              <dd>{build.name}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Preparação atual" eyebrow={build.title}>
          <div className="readiness-block">
            <div>
              <span>Resistência a fogo</span>
              <strong>{build.stats.fireResistance}%</strong>
            </div>
            <div>
              <span>Poder de ataque</span>
              <strong>{build.stats.attackPower}</strong>
            </div>
            <p>{build.warning}</p>
          </div>
        </Panel>
      </div>

      {attemptState === 'idle' ? (
        <section className="attempt-console">
          <div>
            <span className="attempt-console__label">Personagem disponível</span>
            <h2>Registrar snapshot e iniciar tentativa</h2>
            <p>Esta primeira versão usa um resultado demonstrativo para validar o fluxo da interface.</p>
          </div>
          <button className="button button--primary" type="button" onClick={onStart}>
            Iniciar tentativa
          </button>
        </section>
      ) : null}

      {attemptState === 'running' ? (
        <section className="attempt-console attempt-console--running" aria-live="polite">
          <div>
            <span className="attempt-console__label">Tentativa em andamento</span>
            <h2>Simulando encontros</h2>
            <p>O protótipo está preparando o relatório da build {build.name.toLowerCase()}.</p>
          </div>
          <div className="simulation-meter" aria-hidden="true">
            <span />
          </div>
        </section>
      ) : null}

      {attemptState === 'complete' && report ? (
        <Panel
          title={`Resultado: ${report.result}`}
          eyebrow={`Duração ${report.duration}`}
          className={report.result === 'Vitória' ? 'result-panel result-panel--victory' : 'result-panel result-panel--defeat'}
          action={
            <button className="button button--secondary" type="button" onClick={onReset}>
              Preparar nova tentativa
            </button>
          }
        >
          <div className="report-headline">
            <h3>{report.headline}</h3>
            <p>{report.analysis}</p>
          </div>

          <div className="report-grid">
            <div>
              <span>Dano causado</span>
              <strong>{numberFormatter.format(report.damageDealt)}</strong>
            </div>
            <div>
              <span>DPS médio</span>
              <strong>{report.averageDps}</strong>
            </div>
            <div>
              <span>Dano físico recebido</span>
              <strong>{numberFormatter.format(report.physicalDamageTaken)}</strong>
            </div>
            <div>
              <span>Dano de fogo recebido</span>
              <strong>{numberFormatter.format(report.fireDamageTaken)}</strong>
            </div>
            <div>
              <span>Cura total</span>
              <strong>{numberFormatter.format(report.healing)}</strong>
            </div>
            <div>
              <span>Inimigos derrotados</span>
              <strong>{report.enemiesDefeated}</strong>
            </div>
          </div>

          {report.reward ? (
            <div className="reward-block">
              <span>Recompensa demonstrativa</span>
              <strong>{report.reward}</strong>
            </div>
          ) : (
            <div className="reward-block reward-block--empty">
              <span>Recompensa</span>
              <strong>O chefe não foi derrotado</strong>
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  )
}
