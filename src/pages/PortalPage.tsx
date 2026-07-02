import { useEffect, useState } from 'react'
import {
  ECONOMY,
  LADDER,
  META,
  SEASON,
  SEASON_MECHANIC,
  WORLD_EVENTS,
  WORLD_FEED_POOL,
  WORLD_FEED_SEED,
  classById,
} from '../game/content'
import type { FeedEntry, FeedKind, WorldEventKind } from '../game/content'
import type { CharacterSummary } from '../game/session'
import type { Game } from '../game/store'
import { HeroBoard, PageHead, Panel } from '../ui/atoms'
import { fmtCountdown } from '../ui/format'

const NEWS = [
  {
    date: '01 JUL',
    cat: 'Temporada',
    title: 'Cinzas do Abismo começou!',
    body: 'A liga oficial reiniciou economia e rankings. A mecânica "Fenda das Cinzas" concede fragmentos e um chefe com tabela de drop própria.',
  },
  {
    date: '28 JUN',
    cat: 'Motor',
    title: 'DPS real agora é descoberto na dungeon',
    body: 'Antes de testar, você vê apenas uma estimativa. Rode a build numa dungeon para conhecer o número real — trocar item, craftar ou mexer na árvore volta a esconder o DPS.',
  },
  {
    date: '25 JUN',
    cat: 'Crafting',
    title: 'Orbes e corrupção liberados',
    body: 'Transmutação, alteração, régio, exaltado, caos, divino e Vaal já podem ser aplicados aos seus itens no baú.',
  },
]

const FEED_META: Record<FeedKind, { cls: string; label: string }> = {
  drop: { cls: 'fd-drop', label: 'DROP' },
  record: { cls: 'fd-record', label: 'RECORDE' },
  boss: { cls: 'fd-boss', label: 'CHEFE' },
  sale: { cls: 'fd-sale', label: 'MERCADO' },
  mechanic: { cls: 'fd-mech', label: 'FENDA' },
  league: { cls: 'fd-league', label: 'LIGA' },
}

const EVENT_CLS: Record<WorldEventKind, string> = {
  drop: 'ev-drop',
  danger: 'ev-danger',
  boss: 'ev-boss',
}

export function PortalPage({ game, hero }: { game: Game; hero?: CharacterSummary | null }) {
  const cls = hero ? classById[hero.classId] : null

  // relógio do mundo: um tick por segundo alimenta as contagens regressivas
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  // feed vivo: prepende um acontecimento a cada ~4,5s
  const [feed, setFeed] = useState<FeedEntry[]>(WORLD_FEED_SEED)
  useEffect(() => {
    const iv = setInterval(() => {
      setFeed((cur) => {
        const p = WORLD_FEED_POOL[Math.floor(Math.random() * WORLD_FEED_POOL.length)]
        const entry: FeedEntry = { id: `f${Date.now()}`, kind: p.kind, who: p.who, text: p.text, ago: 'agora' }
        return [entry, ...cur].slice(0, 8)
      })
    }, 4500)
    return () => clearInterval(iv)
  }, [])

  const seasonLeft = SEASON.endsInSec - tick
  const seasonPct = Math.round((SEASON.day / SEASON.totalDays) * 100)
  const trendUp = ECONOMY.trendPct >= 0

  return (
    <>
      <PageHead title="Portal" crumb={`Notícias da Liga ${META.league}`} />

      {/* faixa de estado da temporada — o "relógio" do mundo */}
      <div className="season-strip">
        <div className="season-strip__id">
          <span className="dot dot--on" />
          <b>{SEASON.name}</b>
          <span className="season-strip__phase">{SEASON.phase}</span>
        </div>
        <div className="season-strip__day">
          <span className="season-pill">
            Dia {SEASON.day}<span className="season-pill__of">/{SEASON.totalDays}</span>
          </span>
          <div className="season-strip__bar">
            <span style={{ width: `${seasonPct}%` }} />
          </div>
        </div>
        <div className="season-strip__timer">
          encerra em <b>{fmtCountdown(seasonLeft)}</b>
        </div>
      </div>

      <div className="layout-2">
        <div>
          <Panel title="Boas-vindas, estrategista">
            <div className="small">
              Você não controla os golpes — constrói a máquina que vence. A build sai <b>100% do que você
              equipa, aloca na árvore e socketa</b>. Não há arquétipos prontos: some poder por decisão própria e
              descubra o resultado real na dungeon.
            </div>
          </Panel>

          <Panel title="Herói & poder de combate" right={<span className="tiny muted">build atual</span>}>
            <HeroBoard power={game.power} knownDps={game.knownDps} hero={hero} />
            <div className="tiny muted mt8">
              Some poder na árvore e nos suportes para as dungeons ficarem mais rápidas — e mantenha <b>todas</b> as
              resistências altas (teto 75%): cada dungeon cobra um tipo de dano diferente — fogo, frio, raio ou caos.
            </div>
          </Panel>

          {/* mecânica sazonal — objetivo coletivo do servidor */}
          <Panel title="Fenda das Cinzas — mecânica sazonal" right={<span className="tiny muted">objetivo da liga</span>}>
            <div className="small mb8">{SEASON_MECHANIC.blurb}</div>
            <div className="mech-bar">
              <div className="progress-track">
                <div className="progress-fill progress-fill--mech" style={{ width: `${SEASON_MECHANIC.collectivePct}%` }} />
              </div>
              <div className="mech-bar__labels">
                <span>
                  progresso coletivo <b className="hl">{SEASON_MECHANIC.collectivePct}%</b>
                </span>
                <span>
                  desperta: <b>{SEASON_MECHANIC.bossName}</b>
                </span>
              </div>
            </div>
            <div className="mech-foot">
              <span className="tiny muted">
                Sua contribuição: <b className="hl">{SEASON_MECHANIC.youPct}%</b> · {SEASON_MECHANIC.fragments}{' '}
                {SEASON_MECHANIC.fragmentLabel}
              </span>
              <button className="btn btn--sm" onClick={() => game.navigate('masmorra')}>
                Contribuir na Fenda
              </button>
            </div>
          </Panel>

          {/* eventos ativos com timer */}
          <Panel title="Eventos ativos" right={<span className="tiny muted">rotação atual</span>}>
            <div className="events">
              {WORLD_EVENTS.map((ev) => (
                <div className={`event ${EVENT_CLS[ev.kind]}`} key={ev.id}>
                  <div className="event__ic" />
                  <div className="event__main">
                    <div className="event__name">{ev.name}</div>
                    <div className="event__desc">{ev.desc}</div>
                  </div>
                  <div className="event__timer">
                    <span className="event__timer-k">termina em</span>
                    <span className="event__timer-v">{fmtCountdown(ev.endsInSec - tick)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Diário da Liga">
            <div className="news">
              {NEWS.map((n) => (
                <div className="news__item" key={n.title}>
                  <span className="news__date">{n.date}</span>
                  <span className="news__cat">{n.cat}</span>
                  <div className="news__title">{n.title}</div>
                  <div className="news__body">{n.body}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Herói ativo">
            <div className="attr">
              <span className="k">Nome</span>
              <span className="v">{hero?.name ?? '—'}</span>
            </div>
            <div className="attr">
              <span className="k">Classe</span>
              <span className="v">{cls?.name ?? '—'}</span>
            </div>
            <div className="attr">
              <span className="k">Nível</span>
              <span className="v">{hero?.level ?? 1}</span>
            </div>
            <button className="btn btn--full mt8" onClick={() => game.navigate('equipamento')}>
              Abrir equipamento
            </button>
          </Panel>

          {/* feed do mundo — o pulso ao vivo da liga */}
          <Panel title="Feed do mundo" right={<span className="feed-live">● AO VIVO</span>}>
            <div className="feed">
              {feed.map((f) => {
                const m = FEED_META[f.kind]
                return (
                  <div className="feed__item" key={f.id}>
                    <span className={`feed__dot ${m.cls}`} />
                    <div className="feed__body">
                      <span className="feed__who">{f.who}</span> {f.text}
                      <div className="feed__meta">
                        <span className={`feed__tag ${m.cls}`}>{m.label}</span>
                        <span className="feed__ago">{f.ago}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* pulso econômico */}
          <Panel title="Pulso econômico">
            <div className="econ">
              <div className="econ__price">
                <span className="econ__k">{ECONOMY.divineName}</span>
                <span className="econ__v">
                  {ECONOMY.divineInChaos} <span className="econ__unit">Caos</span>
                </span>
                <span className={`econ__trend ${trendUp ? 'up' : 'down'}`}>
                  {trendUp ? '▲' : '▼'} {Math.abs(ECONOMY.trendPct)}% hoje
                </span>
              </div>
              <div className="econ__hot">
                <span className="k">Base em alta</span>
                <span className="v">{ECONOMY.hotBase}</span>
              </div>
              <div className="tiny muted">{ECONOMY.hotNote}</div>
              <button className="btn btn--sm btn--full mt8" onClick={() => game.navigate('mercado')}>
                Abrir mercado
              </button>
            </div>
          </Panel>

          {/* ladder em destaque */}
          <Panel title="Ladder — Profundidade" right={<span className="tiny muted">liga oficial</span>}>
            <table className="ladder">
              <tbody>
                {LADDER.map((r) => (
                  <tr key={r.rank} className={r.you ? 'you' : ''}>
                    <td className="rk">{r.rank}</td>
                    <td>
                      <span className="nm">{r.name}</span>
                      <span className="cls"> · {r.cls}</span>
                    </td>
                    <td className="sc">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Estado do Servidor">
            <div className="attr">
              <span className="k">
                <span className="dot dot--on" /> Liga
              </span>
              <span className="v">ONLINE</span>
            </div>
            <div className="attr">
              <span className="k">Motor</span>
              <span className="v">{META.engine}</span>
            </div>
            <div className="attr">
              <span className="k">Tentativas hoje</span>
              <span className="v">18.402</span>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
