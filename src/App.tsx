import { CHARACTER, META, NAV } from './game/content'
import { useGame } from './game/store'
import type { ViewId } from './game/types'
import { CharacterPage } from './pages/CharacterPage'
import { DungeonPage } from './pages/DungeonPage'
import { EquipmentPage } from './pages/EquipmentPage'
import { MarketPage } from './pages/MarketPage'
import { PortalPage } from './pages/PortalPage'
import { SkillsPage } from './pages/SkillsPage'
import { TreePage } from './pages/TreePage'

export function App() {
  const game = useGame()
  const { page } = game.state

  return (
    <>
      <div className="vignette" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      <div className="app">
        <header className="app-top">
          <div className="brand">
            <span className="brand__mark">BuildsWar</span>
            <span className="brand__sub">O Portal dos Estrategistas</span>
          </div>
          <div className="app-top__center">
            <div className="league-chip">
              <span className="dot dot--on" />
              <span className="league-chip__name">{META.league}</span>
              <span className="league-chip__meta">Trade · Softcore</span>
              <span className="league-chip__timer">39d 14h</span>
            </div>
          </div>
          <div className="app-top__right">
            <span className="acct">
              <span className="acct__hero">{CHARACTER.name.split(',')[0]}</span>
              <span className="acct__lvl">Nv {CHARACTER.level}</span>
            </span>
            <span className="online">
              online <b>2.481</b>
            </span>
          </div>
        </header>

        <nav className="app-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`navbtn${n.id === page ? ' is-active' : ''}`}
              onClick={() => game.navigate(n.id as ViewId)}
            >
              {n.label}
              {n.tag ? <span className="nb-tag">{n.tag}</span> : null}
            </button>
          ))}
        </nav>

        <main className="app-main" id="main-content">
          {page === 'portal' && <PortalPage game={game} />}
          {page === 'personagem' && <CharacterPage game={game} />}
          {page === 'habilidades' && <SkillsPage game={game} />}
          {page === 'equipamento' && <EquipmentPage game={game} />}
          {page === 'arvore' && <TreePage game={game} />}
          {page === 'masmorra' && <DungeonPage game={game} />}
          {page === 'mercado' && <MarketPage game={game} />}
        </main>

        <footer className="app-foot">
          <span>BuildsWar Online — protótipo não-comercial</span>
          <span className="sep">·</span>
          <span>Motor: autoridade do servidor</span>
          <span className="sep">·</span>
          <span>© 2026 Mayouma Studio</span>
          <span className="sep">·</span>
          <span className="foot-nostalgia">um portal de herói, como nos velhos tempos</span>
        </footer>
      </div>
    </>
  )
}
