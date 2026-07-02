import { META, NAV, classById } from './game/content'
import { useSession } from './game/session'
import { useGame } from './game/store'
import type { ViewId } from './game/types'
import { AuthPage } from './pages/AuthPage'
import { CharacterCreatePage } from './pages/CharacterCreatePage'
import { CharacterPage } from './pages/CharacterPage'
import { CharacterSelectPage } from './pages/CharacterSelectPage'
import { DungeonPage } from './pages/DungeonPage'
import { EquipmentPage } from './pages/EquipmentPage'
import { MarketPage } from './pages/MarketPage'
import { PortalPage } from './pages/PortalPage'
import { SkillsPage } from './pages/SkillsPage'
import { TreePage } from './pages/TreePage'
import { ItemTipProvider } from './ui/tooltip'

export function App() {
  const session = useSession()

  return (
    <ItemTipProvider>
      <div className="vignette" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      {session.phase === 'auth' && <AuthPage session={session} />}
      {session.phase === 'select' && <CharacterSelectPage session={session} />}
      {session.phase === 'create' && <CharacterCreatePage session={session} />}
      {session.phase === 'game' && <GameShell session={session} />}
    </ItemTipProvider>
  )
}

/** O jogo em si (após entrar com um herói). Mantém o motor/estado atual. */
function GameShell({ session }: { session: ReturnType<typeof useSession> }) {
  const game = useGame()
  const { page } = game.state
  const hero = session.activeCharacter
  const cls = hero ? classById[hero.classId] : null

  return (
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
          <button
            className="acct acct--btn"
            onClick={session.leaveGame}
            title="Trocar de herói"
          >
            <span className="acct__glyph">{cls?.glyph ?? '⚔'}</span>
            <span className="acct__col">
              <span className="acct__hero">{hero?.name ?? 'Herói'}</span>
              <span className="acct__lvl">
                {cls?.name ?? ''} · Nv {hero?.level ?? 1}
              </span>
            </span>
          </button>
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
        {page === 'portal' && <PortalPage game={game} hero={hero} />}
        {page === 'personagem' && <CharacterPage game={game} hero={hero} />}
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
      </footer>
    </div>
  )
}
