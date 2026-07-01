import { useEffect, useRef, useState } from 'react'
import { DUNGEONS, getBase } from '../game/content'
import { dungeonOutcome } from '../game/engine'
import type { AttemptResult, Game } from '../game/store'
import { fmtInt, fmtTime, rarClass } from '../ui/format'
import { PageHead, Panel, PowerBar } from '../ui/atoms'

export function DungeonPage({ game }: { game: Game }) {
  const { state, power } = game
  const dungeon = DUNGEONS.find((d) => d.id === state.selectedDungeon)!
  const outcome = dungeonOutcome(dungeon, power)

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
        }
        // Rodar a dungeon "descobre" o DPS real do fingerprint atual.
        game.dispatch({
          type: 'attemptFinish',
          result,
          measured: { fingerprint: game.currentFingerprint, dps: power.dps },
        })
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
            const info = dungeonOutcome(d, power)
            const etaCls = info.survivable ? '' : 'eta-warn'
            return (
              <button
                key={d.id}
                className={`dcard${d.id === state.selectedDungeon ? ' sel' : ''}`}
                onClick={() => game.selectDungeon(d.id)}
              >
                {d.fireThreat ? <span className="badge-risk">ÍGNEO · res≥{d.fireReq}%</span> : null}
                <div className="dbiome">
                  {d.biome} · Nv {d.lvl}
                  {d.season ? ' · SAZONAL' : ''}
                </div>
                <div className="dname">{d.name}</div>
                <div className="dmods">
                  {d.mods.map((m) => (
                    <span className="dmod" key={m}>
                      {m}
                    </span>
                  ))}
                </div>
                <div className="ddesc">{d.desc}</div>
                <div className="dcard__eta">
                  <span className={`etak ${etaCls}`}>
                    {info.survivable ? 'Tempo estimado' : 'Tempo — mas você morre no fogo'}
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
                {outcome.survivable ? '' : <b className="blood"> · mas morte provável por fogo</b>}
              </div>
              <div className="attempt-actions">
                <button className="btn btn--blood btn--lg" onClick={run}>
                  Enviar Herói
                </button>
              </div>
              {outcome.survivable ? (
                <div className="tiny muted">O servidor cria um snapshot imutável e simula. Espera de teste reduzida.</div>
              ) : (
                <div className="tiny blood">
                  Aviso: res. a fogo {power.fireRes}% &lt; exigido {dungeon.fireReq}%. Alto risco de morte.
                </div>
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
  const dur = r.win ? r.seconds : r.seconds * 0.68
  const rewardBase = getBase(dungeon.reward.baseId)

  const stats: Array<[string, string]> = [
    ['Duração (simulada)', fmtTime(dur)],
    ['DPS real (medido)', fmtInt(r.dps)],
    ['Res. a fogo', `${r.fireRes}%`],
    ['Resultado', r.win ? 'Dungeon concluída' : 'Herói tombou'],
  ]

  return (
    <div className="report">
      <div className={`report__banner ${r.win ? 'win' : 'lose'}`}>
        {r.win ? 'VITÓRIA' : 'DERROTA — MORTE POR FOGO'}
      </div>
      <div className="report__cause">
        {r.win
          ? `Concluído em ${fmtTime(dur)} com res. a fogo de ${r.fireRes}%. O DPS real medido foi ${fmtInt(r.dps)}.`
          : `Você chegou ao chefe, mas recebeu o pico como FOGO com apenas ${r.fireRes}% de resistência (a dungeon exige ${r.fireReq}%). Ainda assim, o DPS real foi medido: ${fmtInt(r.dps)}.`}
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
                <li>Res. a fogo {r.fireRes}% (exigido {r.fireReq}%) evitou a morte.</li>
                <li>Trocar item, craftar ou mexer na árvore volta a esconder o DPS real.</li>
              </>
            ) : (
              <>
                <li>Dano não foi o problema: o DPS real é {fmtInt(r.dps)}.</li>
                <li>Morte na fase ígnea — res. a fogo {r.fireRes}% abaixo do exigido {r.fireReq}%.</li>
                <li>Equipe o "Guarda-Chama" (baú) ou aloque "Cerne Térmico" e tente de novo.</li>
              </>
            )}
          </ul>
          {r.win ? (
            <>
              <div className="eyebrow mt10 mb6">Loot obtido</div>
              <div className={`loot-row ${rarClass(dungeon.reward.rarity)}`}>
                <div className={`ic ${rarClass(dungeon.reward.rarity)}`}>{rewardBase.name.charAt(0)}</div>
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
