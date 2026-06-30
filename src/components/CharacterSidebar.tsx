import type { BuildPreset, ViewId } from '../app/types'
import { Panel } from './Panel'
import { StatusBar } from './StatusBar'

interface CharacterSidebarProps {
  build: BuildPreset
  onNavigate: (view: ViewId) => void
}
export function CharacterSidebar({ build, onNavigate }: CharacterSidebarProps) {
  return (
    <aside className="sidebar sidebar--character" aria-label="Resumo da personagem">
      <Panel title="Personagem ativa" eyebrow="Companhia do Limiar">
        <div className="portrait-placeholder" aria-label="Retrato reservado para arte futura">
          <span className="portrait-placeholder__monogram">AV</span>
          <span>Retrato em produção</span>
        </div>

        <div className="character-identity">
          <h3>Aveline</h3>
          <p>Vanguarda do Véu</p>
          <span>Nível de teste 12</span>
        </div>

        <div className="sidebar-bars">
          <StatusBar label="Vida" value={build.stats.life} max={1100} tone="life" />
          <StatusBar label="Recurso" value={build.stats.resource} max={220} tone="resource" />
        </div>

        <dl className="compact-stats">
          <div>
            <dt>Poder</dt>
            <dd>{build.stats.attackPower}</dd>
          </div>
          <div>
            <dt>Armadura</dt>
            <dd>{build.stats.armor}</dd>
          </div>
          <div>
            <dt>Bloqueio</dt>
            <dd>{build.stats.blockChance}%</dd>
          </div>
          <div>
            <dt>Resistência a fogo</dt>
            <dd>{build.stats.fireResistance}%</dd>
          </div>
        </dl>

        <div className="active-build-block">
          <span>Build selecionada</span>
          <strong>{build.name}</strong>
          <small>{build.title}</small>
        </div>

        <button className="button button--secondary button--full" type="button" onClick={() => onNavigate('character')}>
          Gerenciar build
        </button>
      </Panel>
    </aside>
  )
}
