import type { AttemptState, ViewId } from '../app/types'
import { activityEntries } from '../data/prototype'
import { Panel } from './Panel'

interface ActivitySidebarProps {
  attemptState: AttemptState
  onNavigate: (view: ViewId) => void
}
export function ActivitySidebar({ attemptState, onNavigate }: ActivitySidebarProps) {
  const attemptLabel = {
    idle: 'Nenhuma tentativa ativa',
    running: 'Simulação em andamento',
    complete: 'Relatório disponível',
  }[attemptState]

  return (
    <aside className="sidebar sidebar--activity" aria-label="Informações da expedição">
      <Panel title="Estado da expedição" eyebrow="Salão de contratos">
        <div className={`attempt-state attempt-state--${attemptState}`}>
          <span className="attempt-state__label">Dungeon atual</span>
          <strong>Forja Abandonada</strong>
          <p>{attemptLabel}</p>
        </div>
        <button className="button button--primary button--full" type="button" onClick={() => onNavigate('dungeon')}>
          Abrir dungeon
        </button>
      </Panel>

      <Panel title="Registros recentes" eyebrow="Arquivo de campo">
        <ol className="activity-list">
          {activityEntries.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ol>
      </Panel>

      <Panel title="Aviso do protótipo">
        <p className="small-copy">
          Números, nomes e recompensas ainda são demonstrativos. Esta versão existe para validar estrutura e decisões.
        </p>
      </Panel>
    </aside>
  )
}
