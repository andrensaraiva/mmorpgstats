import type { NavigationItem, ViewId } from '../app/types'

interface GameHeaderProps {
  activeView: ViewId
  items: NavigationItem[]
  onNavigate: (view: ViewId) => void
}

export function GameHeader({ activeView, items, onNavigate }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="server-strip">
        <span>Servidor: Protótipo</span>
        <span>Versão 0.1</span>
        <span>Ambiente de teste</span>
      </div>

      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <span>BW</span>
        </div>
        <div>
          <p className="brand-kicker">Crônicas do Limiar</p>
          <p className="brand-name">BuildsWar</p>
          <p className="brand-subtitle">Estratégia, builds e expedições assíncronas</p>
        </div>
      </div>

      <nav className="main-navigation" aria-label="Navegação principal">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={activeView === item.id ? 'main-navigation__item is-active' : 'main-navigation__item'}
            aria-current={activeView === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
