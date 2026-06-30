import type { BuildId, BuildPreset } from '../app/types'
import { Panel } from '../components/Panel'

interface CharacterPageProps {
  activeBuild: BuildPreset
  builds: BuildPreset[]
  onSelectBuild: (buildId: BuildId) => void
}
const statLabels: Array<[keyof BuildPreset['stats'], string, string]> = [
  ['life', 'Vida', 'pontos'],
  ['resource', 'Recurso', 'pontos'],
  ['attackPower', 'Poder de ataque', 'pontos'],
  ['armor', 'Armadura', 'pontos'],
  ['blockChance', 'Bloqueio', '%'],
  ['fireResistance', 'Resistência a fogo', '%'],
  ['attackSpeed', 'Velocidade de ataque', '%'],
]

export function CharacterPage({ activeBuild, builds, onSelectBuild }: CharacterPageProps) {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="section-kicker">Arquivo da companhia</p>
        <h1>Personagem e builds</h1>
        <p>Escolha um plano de combate para alterar atributos e prioridades da personagem.</p>
      </div>

      <Panel title="Planos disponíveis" eyebrow="Três abordagens para o mesmo desafio">
        <div className="build-selector">
          {builds.map((build) => {
            const isActive = build.id === activeBuild.id
            return (
              <button
                type="button"
                key={build.id}
                className={isActive ? 'build-card is-active' : 'build-card'}
                aria-pressed={isActive}
                onClick={() => onSelectBuild(build.id)}
              >
                <span className="build-card__state">{isActive ? 'Selecionada' : 'Selecionar'}</span>
                <strong>{build.name}</strong>
                <small>{build.title}</small>
                <p>{build.summary}</p>
              </button>
            )
          })}
        </div>
      </Panel>

      <div className="two-column-grid">
        <Panel title="Atributos atuais" eyebrow={activeBuild.name}>
          <dl className="stat-list">
            {statLabels.map(([key, label, suffix]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  {activeBuild.stats[key]} {suffix}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Leitura tática" eyebrow={activeBuild.title}>
          <div className="tactical-reading">
            <div>
              <span>Proposta</span>
              <p>{activeBuild.summary}</p>
            </div>
            <div>
              <span>Risco conhecido</span>
              <p>{activeBuild.warning}</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
