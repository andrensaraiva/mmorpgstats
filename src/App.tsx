import { META, NAV, classById } from './game/content'
import { useSession } from './game/session'
import { useGame } from './game/store'
import type { ViewId } from './game/types'
import { AuthPage } from './pages/AuthPage'
import { CampaignPage } from './pages/CampaignPage'
import { CharacterCreatePage } from './pages/CharacterCreatePage'
import { CharacterPage } from './pages/CharacterPage'
import { CharacterSelectPage } from './pages/CharacterSelectPage'
import { DungeonPage } from './pages/DungeonPage'
import { EquipmentPage } from './pages/EquipmentPage'
import { GalleryPage } from './pages/GalleryPage'
import { MarketPage } from './pages/MarketPage'
import { PortalPage } from './pages/PortalPage'
import { SkillsPage } from './pages/SkillsPage'
import { TreePage } from './pages/TreePage'
import { useState } from 'react'
import { ItemTipProvider } from './ui/tooltip'
import { ToastHost } from './ui/Toasts'
import { Onboarding, hasSeenOnboarding } from './ui/Onboarding'

export function App() {
  const session = useSession()

  // Rota interna de dev: galeria de componentes (F3). Fora do fluxo de jogo.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === 'gallery') {
    return (
      <ItemTipProvider>
        <div className="vignette" aria-hidden="true" />
        <GalleryPage />
      </ItemTipProvider>
    )
  }

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

/** Abas sempre disponíveis; as demais são liberadas pela campanha (P2). */
const ALWAYS_OPEN: ViewId[] = ['portal', 'campanha', 'personagem', 'habilidades']

/** O jogo em si (após entrar com um herói). Mantém o motor/estado atual. */
function GameShell({ session }: { session: ReturnType<typeof useSession> }) {
  const game = useGame()
  const { page, unlockedSystems } = game.state
  const hero = session.activeCharacter
  const cls = hero ? classById[hero.classId] : null
  // Onboarding aparece na primeira sessão; o "?" na top bar reabre.
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding())

  // Uma aba está liberada se é sempre-aberta ou seu sistema foi destravado (P2).
  const isOpen = (id: ViewId) => ALWAYS_OPEN.includes(id) || unlockedSystems.includes(id as never)
  const visibleNav = NAV.filter((n) => isOpen(n.id as ViewId))

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
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
            className="help-btn"
            onClick={() => setShowOnboarding(true)}
            title="Como jogar"
            aria-label="Como jogar"
          >
            ?
          </button>
          <button
            className="acct acct--btn"
            onClick={session.leaveGame}
            title="Trocar de herói"
          >
            <span className="acct__glyph">{cls?.glyph ?? '⚔'}</span>
            <span className="acct__col">
              <span className="acct__hero">{hero?.name ?? 'Herói'}</span>
              <span className="acct__lvl">
                {cls?.name ?? ''} · Nv {game.level}
              </span>
              <span
                className="xp-bar"
                title={`Nível ${game.level} · ${Math.round(game.progress.into)}/${game.progress.span} XP`}
                aria-label={`Nível ${game.level}, ${Math.round(game.progress.frac * 100)}% para o próximo`}
              >
                <span className="xp-bar__fill" style={{ width: `${game.progress.frac * 100}%` }} />
              </span>
            </span>
          </button>
          <span className="online">
            online <b>2.481</b>
          </span>
        </div>
      </header>

      <nav className="app-nav" aria-label="Navegação principal">
        {visibleNav.map((n) => (
          <button
            key={n.id}
            className={`navbtn${n.id === page ? ' is-active' : ''}`}
            aria-current={n.id === page ? 'page' : undefined}
            onClick={() => game.navigate(n.id as ViewId)}
          >
            {n.label}
            {n.tag ? <span className="nb-tag">{n.tag}</span> : null}
          </button>
        ))}
      </nav>

      <main className="app-main" id="main-content" tabIndex={-1}>
        {page === 'portal' && <PortalPage game={game} hero={hero} />}
        {page === 'campanha' && <CampaignPage game={game} />}
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

      <ToastHost toasts={game.state.toasts} onDismiss={game.dismissToast} />
      {showOnboarding ? <Onboarding onClose={() => setShowOnboarding(false)} /> : null}
    </div>
  )
}
