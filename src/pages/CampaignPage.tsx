/* =========================================================
   BuildsWar :: Campanha (P1)
   A trilha narrativa de dungeons que ensina os sistemas, dá XP
   e níveis, e destrava o jogo passo a passo. Reusa o motor de
   dungeon (simulateDungeon) — enviar o herói num nó vence o
   encontro, concede XP e desbloqueia o sistema do marco.
   Ver docs/PROGRESSION_AND_STORY.md.
   ========================================================= */

import { useState } from 'react'
import { CAMPAIGN, DUNGEONS } from '../game/content'
import { dungeonXp, makeRewardItem, makeRng, simulateDungeon } from '../game/engine'
import type { AttemptResult, Game } from '../game/store'
import type { CampaignNode, Dungeon } from '../game/types'
import { PageHead, Panel } from '../ui/atoms'
import { CountUp } from '../ui/CountUp'

/**
 * A campanha reusa as dungeons endgame (nível ~44+), mas as escala pelo nível
 * sugerido do marco: o prólogo roda uma versão fraca da Cripta. Assim a jornada
 * é vencível na progressão e endurece a cada ato. Ver PROGRESSION_AND_STORY §2.3.
 */
function scaledCampaignDungeon(dungeon: Dungeon, node: CampaignNode): Dungeon {
  const ratio = Math.min(1, node.levelReq / dungeon.lvl)
  return {
    ...dungeon,
    lvl: Math.max(1, node.levelReq),
    diff: Math.max(200, Math.round(dungeon.diff * ratio * ratio)),
    fireReq: Math.round(dungeon.fireReq * ratio),
  }
}

type NodeStatus = 'done' | 'current' | 'locked'

function statusOf(node: CampaignNode, completed: string[]): NodeStatus {
  if (completed.includes(node.id)) return 'done'
  // O "atual" é o primeiro não-concluído; os demais ficam travados.
  const firstOpen = CAMPAIGN.find((n) => !completed.includes(n.id))
  if (firstOpen?.id !== node.id) return 'locked'
  return 'current'
}

export function CampaignPage({ game }: { game: Game }) {
  const { completedNodes } = game.state
  const current = CAMPAIGN.find((n) => !completedNodes.includes(n.id)) ?? null
  const done = completedNodes.length
  const [selected, setSelected] = useState<string | null>(current?.id ?? null)
  const node = CAMPAIGN.find((n) => n.id === selected) ?? current

  return (
    <>
      <PageHead title="Campanha" crumb="A jornada que ensina, dá XP e abre o jogo" />

      <Panel
        title="Trilha das Cinzas"
        right={<span className="tiny">{done}/{CAMPAIGN.length} marcos</span>}
      >
        <p className="tiny muted mb8">
          Envie o herói a cada marco: vencer avança a história, concede <b>XP</b> e <b>desbloqueia um sistema</b>. Um
          passo por vez — a campanha ensina, não despeja.
        </p>
        <ol className="camp-trail">
          {CAMPAIGN.map((n) => {
            const st = statusOf(n, completedNodes)
            const isSel = n.id === node?.id
            return (
              <li key={n.id}>
                <button
                  className={`camp-node camp-node--${st}${isSel ? ' is-sel' : ''}`}
                  onClick={() => (st === 'locked' ? undefined : setSelected(n.id))}
                  disabled={st === 'locked'}
                  aria-current={st === 'current' ? 'step' : undefined}
                >
                  <span className="camp-node__badge">{st === 'done' ? '✓' : st === 'locked' ? '🔒' : n.act || '★'}</span>
                  <span className="camp-node__main">
                    <span className="camp-node__title">{n.title}</span>
                    <span className="tiny muted">Nível sug. {n.levelReq}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </Panel>

      {node ? (
        <CampaignEncounter
          key={node.id}
          game={game}
          node={node}
          status={statusOf(node, completedNodes)}
          onAdvance={() => {
            const nextOpen = CAMPAIGN.find((n) => !game.state.completedNodes.includes(n.id))
            setSelected(nextOpen?.id ?? node.id)
          }}
        />
      ) : (
        <Panel title="Campanha concluída">
          <p>
            Você venceu todos os marcos. O endgame (o <b>Atlas das Fendas</b>) é o próximo horizonte — mas isso fica para
            outra jornada.
          </p>
        </Panel>
      )}
    </>
  )
}

function CampaignEncounter({
  game,
  node,
  status,
  onAdvance,
}: {
  game: Game
  node: CampaignNode
  status: NodeStatus
  onAdvance: () => void
}) {
  const baseDungeon = DUNGEONS.find((d) => d.id === node.dungeonId)!
  const dungeon = scaledCampaignDungeon(baseDungeon, node)
  const [phase, setPhase] = useState<'idle' | 'report'>('idle')
  const [result, setResult] = useState<AttemptResult | null>(null)
  const underLevelled = game.level < node.levelReq

  const send = () => {
    const run = simulateDungeon(dungeon, game.power)
    const xpGained = dungeonXp(
      dungeon.lvl,
      run.survivable,
      run.report.totalMonsters > 0 ? run.report.enemiesDefeated / run.report.totalMonsters : 0,
    )
    const res: AttemptResult = {
      dungeonId: dungeon.id, win: run.survivable, dps: game.power.dps, seconds: run.seconds,
      fireRes: game.power.fireRes, fireReq: dungeon.fireReq, cause: run.cause, reason: run.reason,
      breakingType: run.breakingType, enemiesDefeated: run.report.enemiesDefeated,
      totalMonsters: run.report.totalMonsters, damageTaken: run.report.damageTaken,
      potionsUsed: run.report.potionsUsed, timeControlled: run.report.timeControlled,
      peakDps: run.report.peakDps, incomingDps: run.report.incomingDps, xpGained,
    }
    // Concede XP + descobre o DPS sem poluir o relatório da Masmorra; ao vencer,
    // conclui o marco (desbloqueia o sistema) e concede o loot garantido.
    game.dispatch({
      type: 'campaignReward',
      xpGained,
      measured: { fingerprint: game.currentFingerprint, dps: game.power.dps },
      win: run.survivable,
    })
    if (run.survivable) {
      game.completeCampaignNode(node.id)
      // Loot garantido do marco. O ato final (sem `unlocks`) sempre traz um
      // afixo EXCEPCIONAL só-dropa; os demais, com chance crescente.
      const rng = makeRng((node.order + 1) * 2654435761 + Math.floor(Date.now() / 1000))
      const isFinale = !node.unlocks
      const withExc = isFinale || rng() < 0.15 + node.order * 0.1
      const reward = makeRewardItem(
        baseDungeon.reward.baseId,
        baseDungeon.reward.rarity,
        baseDungeon.reward.name,
        Math.max(1, node.levelReq),
        rng,
        withExc,
      )
      game.dispatch({
        type: 'addItem',
        item: reward,
        tone: withExc ? 'loot' : 'good',
        toast: withExc ? `✦ Loot excepcional: ${reward.name}!` : `Loot: ${reward.name}`,
      })
    }
    setResult(res)
    setPhase('report')
  }

  const alreadyDone = status === 'done'

  return (
    <Panel title={node.title}>
      <div className="camp-teaches tiny">
        <span className="eyebrow">Ensina</span> {node.teaches}
      </div>

      {phase === 'idle' ? (
        <>
          <p className="camp-narr">{node.intro}</p>
          <div className="camp-meta tiny muted">
            Encontro: <b>{dungeon.name}</b> · {dungeon.biome} · Nv {dungeon.lvl}
            {node.unlocks ? <> · Recompensa: <b className="gold-text">destrava um sistema</b></> : null}
          </div>
          {underLevelled && !alreadyDone ? (
            <div className="tiny blood mt6">
              Abaixo do nível sugerido ({node.levelReq}). Pode tentar mesmo assim — perder ainda dá um pouco de XP.
            </div>
          ) : null}
          <div className="attempt-actions mt8">
            <button className="btn btn--blood btn--lg" onClick={send}>
              {alreadyDone ? 'Repetir encontro' : 'Enviar Herói'}
            </button>
          </div>
        </>
      ) : (
        <CampaignReport
          node={node}
          result={result!}
          onReset={() => setPhase('idle')}
          onAdvance={() => {
            setPhase('idle')
            onAdvance()
          }}
        />
      )}
    </Panel>
  )
}

function CampaignReport({
  node,
  result,
  onReset,
  onAdvance,
}: {
  node: CampaignNode
  result: AttemptResult
  onReset: () => void
  onAdvance: () => void
}) {
  return (
    <div className="report">
      <h3 className={`report__banner ${result.win ? 'win' : 'lose'}`} aria-live="polite">
        {result.win ? 'MARCO CONCLUÍDO' : 'DERROTA'}
      </h3>
      <div className="report__cause">{result.win ? node.outcome : result.cause}</div>

      <div className="discovery" aria-label={`${result.xpGained} XP ganho`}>
        <span className="discovery__tag" aria-hidden="true">✦ XP ganho ✦</span>
        <CountUp to={result.xpGained} className="discovery__val" aria-hidden />
        <span className="discovery__sub" aria-hidden="true">
          {result.win ? 'marco vencido — sistema pode ter sido liberado' : 'não venceu, mas aprendeu algo'}
        </span>
      </div>

      <div className="report__actions">
        {!result.win ? (
          <button className="btn" onClick={onReset}>Ajustar e tentar de novo</button>
        ) : null}
        <button className="btn" onClick={result.win ? onAdvance : onReset}>
          {result.win ? 'Continuar' : 'Voltar'}
        </button>
      </div>
    </div>
  )
}
