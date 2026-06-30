import type { BuildPreset, ViewId } from '../app/types'
import { Panel } from '../components/Panel'

interface OverviewPageProps {
  build: BuildPreset
  onNavigate: (view: ViewId) => void
}

export function OverviewPage({ build, onNavigate }: OverviewPageProps) {
  return (
    <div className="page-stack">
      <section className="welcome-banner">
        <p className="section-kicker">Salão dos estrategistas</p>
        <h1>Prepare a build antes de atravessar o Limiar</h1>
        <p>
          Aveline aguarda suas ordens. Revise equipamentos e prioridades antes de enviá-la para a Forja Abandonada.
        </p>
        <div className="welcome-banner__actions">
          <button className="button button--primary" type="button" onClick={() => onNavigate('dungeon')}>
            Preparar expedição
          </button>
          <button className="button button--secondary" type="button" onClick={() => onNavigate('character')}>
            Revisar personagem
          </button>
        </div>
      </section>

      <div className="summary-grid">
        <article className="summary-card">
          <span>Build ativa</span>
          <strong>{build.name}</strong>
          <p>{build.title}</p>
        </article>
        <article className="summary-card">
          <span>Próximo desafio</span>
          <strong>Forja Abandonada</strong>
          <p>Dificuldade de teste 12</p>
        </article>
        <article className="summary-card">
          <span>Último registro</span>
          <strong>Sem resultado</strong>
          <p>Inicie a primeira tentativa</p>
        </article>
      </div>

      <Panel title="Preparação recomendada" eyebrow="Relatório do intendente">
        <div className="notice-grid">
          <div>
            <h3>Ameaça principal</h3>
            <p>O Guardião da Forja alterna golpes físicos e uma descarga intensa de fogo na segunda fase.</p>
          </div>
          <div>
            <h3>Estado da build</h3>
            <p>{build.summary}</p>
          </div>
          <div>
            <h3>Ponto de atenção</h3>
            <p>{build.warning}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Progresso do protótipo" eyebrow="Registro de desenvolvimento">
        <div className="development-table" role="table" aria-label="Progresso do protótipo">
          <div className="development-table__row" role="row">
            <span role="cell">Estrutura visual</span>
            <strong role="cell" className="status-text status-text--ready">Disponível</strong>
          </div>
          <div className="development-table__row" role="row">
            <span role="cell">Dados demonstrativos</span>
            <strong role="cell" className="status-text status-text--ready">Disponível</strong>
          </div>
          <div className="development-table__row" role="row">
            <span role="cell">Árvore e Ascendência</span>
            <strong role="cell" className="status-text status-text--ready">Funcional</strong>
          </div>
          <div className="development-table__row" role="row">
            <span role="cell">Motor determinístico</span>
            <strong role="cell" className="status-text">Planejado</strong>
          </div>
          <div className="development-table__row" role="row">
            <span role="cell">Persistência online</span>
            <strong role="cell" className="status-text">Planejada</strong>
          </div>
        </div>
      </Panel>
    </div>
  )
}
