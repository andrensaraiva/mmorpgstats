import { useEffect, useMemo, useRef, useState } from 'react'
import { DUNGEONS, getBase } from '../game/content'
import { dungeonReplay, dungeonXp, makeRng, rollLoot, simulateDungeon } from '../game/engine'
import type { AttemptResult, Game } from '../game/store'
import type { DamageType } from '../game/types'
import { fmtInt, fmtTime, rarClass } from '../ui/format'
import { PageHead, Panel, PowerBar } from '../ui/atoms'
import { ItemIcon } from '../ui/icons'
import { CountUp } from '../ui/CountUp'
import { DungeonMinimap, EncounterPreview, TYPE_LABEL, replaySeed } from '../ui/encounter'

export function DungeonPage({ game }: { game: Game }) {
  const { state, power } = game
  const dungeon = DUNGEONS.find((d) => d.id === state.selectedDungeon)!
  const outcome = simulateDungeon(dungeon, power)
  const replay = useMemo(
    () => dungeonReplay(dungeon, outcome, replaySeed(dungeon.id, game.currentFingerprint)),
    [dungeon, outcome, game.currentFingerprint],
  )

  const [progress, setProgress] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearInterval(timer.current), [])

  const run = () => {
    game.dispatch({ type: 'attemptRun' })
    setProgress(0)
    const realMs = Math.max(900, Math.min(2600, outcome.seconds * 7))
    const stepMs = 40
    const steps = Math.max(6, Math.round(realMs / stepMs))
    let i = 0
    timer.current = window.setInterval(() => {
      i += 1
      setProgress(Math.min(100, (i / steps) * 100))
      if (i >= steps) {
        window.clearInterval(timer.current)
        const result: AttemptResult = {
          dungeonId: dungeon.id,
          win: outcome.survivable,
          dps: power.dps,
          seconds: outcome.seconds,
          fireRes: power.fireRes,
          fireReq: dungeon.fireReq,
          cause: outcome.cause,
          reason: outcome.reason,
          breakingType: outcome.breakingType,
          enemiesDefeated: outcome.report.enemiesDefeated,
          totalMonsters: outcome.report.totalMonsters,
          damageTaken: outcome.report.damageTaken,
          potionsUsed: outcome.report.potionsUsed,
          timeControlled: outcome.report.timeControlled,
          peakDps: outcome.report.peakDps,
          incomingDps: outcome.report.incomingDps,
          xpGained: dungeonXp(
            dungeon.lvl,
            outcome.survivable,
            outcome.report.totalMonsters > 0
              ? outcome.report.enemiesDefeated / outcome.report.totalMonsters
              : 0,
          ),
        }
        // Rodar a dungeon "descobre" o DPS real do fingerprint atual.
        game.dispatch({
          type: 'attemptFinish',
          result,
          measured: { fingerprint: game.currentFingerprint, dps: power.dps },
        })
        // Loot da run (itens + orbes) — só na vitória.
        if (outcome.survivable) {
          const lootRng = makeRng((dungeon.lvl * 40503 + Date.now()) >>> 0)
          game.dispatch({ type: 'applyLoot', loot: rollLoot(dungeon.lvl, true, lootRng, { luck: 0.25 }) })
        }
      }
    }, stepMs)
  }

  return (
    <>
      <PageHead title="Masmorra" crumb="Tentativa assíncrona — o tempo escala com a força do herói" />
      <Panel title="Poder de combate">
        <PowerBar power={power} knownDps={game.knownDps} />
        <div className="tiny muted mt8">
          O tempo estimado cai conforme seu DPS sobe. Mas se a res. a fogo ficar abaixo do exigido, a tentativa termina
          em morte, por mais dano que você tenha. <b>Concluir a dungeon revela o DPS real.</b>
        </div>
      </Panel>

      <Panel title="Escolher destino">
        <div className="dsel">
          {DUNGEONS.map((d) => {
            const info = simulateDungeon(d, power)
            const etaCls = info.survivable ? '' : 'eta-warn'
            return (
              <button
                key={d.id}
                className={`dcard${d.id === state.selectedDungeon ? ' sel' : ''}`}
                onClick={() => game.selectDungeon(d.id)}
              >
                <div className="dbiome">
                  {d.biome} · Nv {d.lvl}
                  {d.season ? ' · SAZONAL' : ''}
                </div>
                <div className="dname">{d.name}</div>
                <EncounterPreview dungeon={d} />
                <div className="ddesc">{d.desc}</div>
                <div className="dcard__eta">
                  <span className={`etak ${etaCls}`}>
                    {info.survivable ? 'Tempo estimado' : 'Tempo — mas o herói tomba'}
                  </span>
                  <span className={`etav ${etaCls}`}>{fmtTime(info.seconds)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </Panel>

      <section className="panel">
        <div className="panel__head">
          <span className="ph-l">Enviar Herói</span>
        </div>
        <div className="panel__body">
          {state.attemptPhase === 'running' ? (
            <div className="attempt-box">
              <div className="progress-label">Simulando combate…</div>
              <DungeonMinimap replay={replay} progress={progress} />
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="snap">
                tempo simulado {fmtTime((progress / 100) * outcome.seconds)} · {dungeon.name}
              </div>
            </div>
          ) : state.attemptPhase === 'report' && state.attemptResult ? (
            <Report game={game} />
          ) : (
            <div className="attempt-box">
              <div className="eyebrow">Destino selecionado</div>
              <div className="attempt-title">{dungeon.name}</div>
              <div className="snap">
                DPS estimado {fmtInt(power.dps)} · res.fogo {power.fireRes}% · seed 0x9F3C
              </div>
              <div className="snap mt4">
                tempo estimado: <b className="teal">{fmtTime(outcome.seconds)}</b>
                {outcome.survivable ? '' : <b className="blood"> · mas morte provável</b>}
              </div>
              <div className="attempt-actions">
                <button className="btn btn--blood btn--lg" onClick={run}>
                  Enviar Herói
                </button>
              </div>
              {outcome.survivable ? (
                <div className="tiny muted">O servidor cria um snapshot imutável e simula. Espera de teste reduzida.</div>
              ) : (
                <div className="tiny blood">Aviso: {outcome.cause}</div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function Report({ game }: { game: Game }) {
  const r = game.state.attemptResult!
  const dungeon = DUNGEONS.find((d) => d.id === r.dungeonId)!
  const dur = r.seconds
  const rewardBase = getBase(dungeon.reward.baseId)

  const stats: Array<[string, string]> = [
    ['Duração (simulada)', fmtTime(dur)],
    ['Inimigos derrotados', `${r.enemiesDefeated}/${r.totalMonsters}`],
    ['DPS real (medido)', fmtInt(r.dps)],
    ['Pico de DPS (est.)', fmtInt(r.peakDps)],
    ['Dano recebido', fmtInt(r.damageTaken)],
    ['Poções usadas', String(r.potionsUsed)],
    ...(r.timeControlled > 0
      ? ([['Tempo sob controle', `${r.timeControlled}s`]] as Array<[string, string]>)
      : []),
    ['Resultado', r.win ? 'Dungeon concluída' : 'Herói tombou'],
  ]

  const loseBanner =
    r.reason === 'control'
      ? 'DERROTA — IMOBILIZADO POR CONTROLE'
      : r.reason === 'stall'
        ? 'DERROTA — TENTATIVA ESTAGNOU'
        : r.reason === 'attrition'
          ? 'DERROTA — MORTE POR ATRITO'
          : r.breakingType
            ? `DERROTA — CAMADA DE ${TYPE_LABEL[r.breakingType].toUpperCase()} QUEBROU`
            : 'DERROTA'

  return (
    <div className="report" role="region" aria-label="Relatório da tentativa">
      <h3 className={`report__banner ${r.win ? 'win' : 'lose'}`} aria-live="polite">
        {r.win ? 'VITÓRIA' : loseBanner}
      </h3>
      <div className="report__cause">
        {r.win
          ? `Concluído em ${fmtTime(dur)}. ${r.cause}`
          : `${r.cause} Ainda assim, o combate mediu o seu dano real.`}
      </div>
      <div className="discovery" aria-label={`DPS real descoberto: ${fmtInt(r.dps)}, medido em combate.`}>
        <span className="discovery__tag" aria-hidden="true">
          ◈ DPS real descoberto ◈
        </span>
        <CountUp to={r.dps} className="discovery__val" aria-hidden />
        <span className="discovery__sub" aria-hidden="true">
          medido em combate · válido só para esta build exata
        </span>
      </div>
      <div className="report__grid">
        <div className="report__col">
          <div className="eyebrow mb6">Resumo</div>
          {stats.map(([k, v]) => (
            <div className="stat-big" key={k}>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
            </div>
          ))}
        </div>
        <div className="report__col">
          <div className="eyebrow mb6">Fatos da tentativa</div>
          <ul className="facts">
            {r.win ? (
              <>
                <li>DPS real de {fmtInt(r.dps)} conhecido — agora exibido em todas as telas.</li>
                <li>Todas as camadas de defesa exigidas seguraram.</li>
                <li>Trocar item, craftar ou mexer na árvore volta a esconder o DPS real.</li>
              </>
            ) : (
              <>
                <li>Dano bruto não foi (só) o problema: o DPS real é {fmtInt(r.dps)}.</li>
                <li>{r.cause}</li>
                <li>Ajuste a camada/composição apontada acima e tente de novo.</li>
              </>
            )}
          </ul>
          {r.win ? (
            <>
              <div className="eyebrow mt10 mb6">Loot obtido</div>
              <div className={`loot-row ${rarClass(dungeon.reward.rarity)}`}>
                <div className={`ic ${rarClass(dungeon.reward.rarity)}`}>
                  <ItemIcon baseId={dungeon.reward.baseId} />
                </div>
                <div className="loot-main">
                  <div className={`loot-name ${rarClass(dungeon.reward.rarity)}`}>{dungeon.reward.name}</div>
                  <div className="tiny muted">{rewardBase.name}</div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="report__actions">
        {!r.win ? (
          <button className="btn" onClick={() => game.navigate('equipamento')}>
            Ajustar equipamento
          </button>
        ) : null}
        <button className="btn" onClick={() => game.resetAttempt()}>
          {r.win ? 'Nova tentativa' : 'Voltar'}
        </button>
      </div>
    </div>
  )
}

