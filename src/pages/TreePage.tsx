import { useCallback, useEffect, useRef, useState } from 'react'
import { TREE } from '../game/content'
import { treeAdjacency } from '../game/engine'
import type { Game } from '../game/store'
import type { TreeNode } from '../game/types'
import { fmtInt } from '../ui/format'
import { PageHead } from '../ui/atoms'

const adjacency = treeAdjacency()

interface Transform {
  scale: number
  tx: number
  ty: number
}

export function TreePage({ game }: { game: Game }) {
  const { allocated } = game.state
  const [t, setT] = useState<Transform>({ scale: 1, tx: 0, ty: 0 })
  const [detail, setDetail] = useState<string | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 })

  const used = allocated.size - 1

  const zoom = useCallback((factor: number) => {
    setT((prev) => ({ ...prev, scale: Math.max(0.5, Math.min(2.4, prev.scale * factor)) }))
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [zoom])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return
      const dx = e.clientX - drag.current.sx
      const dy = e.clientY - drag.current.sy
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
      setT((prev) => ({ ...prev, tx: drag.current.ox + dx, ty: drag.current.oy + dy }))
    }
    const onUp = () => {
      drag.current.active = false
      stageRef.current?.classList.remove('grabbing')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const onDown = (e: React.MouseEvent) => {
    drag.current = { active: true, moved: false, sx: e.clientX, sy: e.clientY, ox: t.tx, oy: t.ty }
    stageRef.current?.classList.add('grabbing')
  }

  const clickNode = (id: string) => {
    if (drag.current.moved) return
    game.toggleNode(id)
    setDetail(id)
  }

  const detailNode = detail ? TREE.nodes.find((n) => n.id === detail) ?? null : null

  return (
    <>
      <PageHead
        title="Árvore Passiva"
        crumb={`Zoom com a roda, arraste para mover · limite de ${TREE.maxPoints} pontos`}
      />
      <section className="panel">
        <div className="panel__head">
          <span className="ph-l">Planejamento de Build</span>
          <span className="tiny">
            DPS ≈ {fmtInt(game.power.dps)} · Vida ef. {fmtInt(game.power.ehp)} · Fogo {game.power.fireRes}%
          </span>
        </div>
        <div className="panel__body">
          <div className="tree-hud">
            <div className="tree-points">
              Pontos: <b>{used}</b> / {TREE.maxPoints}
            </div>
            <div>
              <button className="btn btn--sm" onClick={() => zoom(1 / 1.2)}>
                –
              </button>{' '}
              <button className="btn btn--sm" onClick={() => zoom(1.2)}>
                +
              </button>{' '}
              <button className="btn btn--sm" onClick={() => setT({ scale: 1, tx: 0, ty: 0 })}>
                Centralizar
              </button>{' '}
              <button className="btn btn--sm" onClick={() => game.resetTree()}>
                Reembolsar tudo
              </button>
            </div>
          </div>

          <div className="tree-stage" ref={stageRef} onMouseDown={onDown}>
            <svg className="tree-svg" viewBox="0 0 860 470" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="goldgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f0d288" />
                  <stop offset="1" stopColor="#8a6524" />
                </linearGradient>
              </defs>
              <g className="tree-view" transform={`translate(${t.tx},${t.ty}) scale(${t.scale})`}>
                {TREE.edges.map(([a, b], i) => {
                  const na = TREE.nodes.find((n) => n.id === a)!
                  const nb = TREE.nodes.find((n) => n.id === b)!
                  const on = allocated.has(a) && allocated.has(b)
                  return (
                    <line
                      key={i}
                      className={`tree-edge${on ? ' on' : ''}`}
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                    />
                  )
                })}
                {TREE.nodes.map((n) => (
                  <TreeNodeShape
                    key={n.id}
                    node={n}
                    isAlloc={allocated.has(n.id)}
                    canAlloc={
                      !allocated.has(n.id) &&
                      (adjacency[n.id] ?? []).some((nb) => allocated.has(nb)) &&
                      used < TREE.maxPoints
                    }
                    onEnter={() => setDetail(n.id)}
                    onClick={() => clickNode(n.id)}
                  />
                ))}
              </g>
            </svg>
          </div>

          <div className="tree-legend">
            <span className="lg">
              <span className="sw sw--off" />
              Ofensivo
            </span>
            <span className="lg">
              <span className="sw sw--def" />
              Defensivo
            </span>
            <span className="lg">
              <span className="sw sw--util" />
              Utilitário
            </span>
            <span className="lg">
              <span className="sw sw--key" />
              Keystone
            </span>
          </div>

          <div className="tree-detail">
            {detailNode ? (
              <TreeDetail node={detailNode} allocated={allocated.has(detailNode.id)} />
            ) : game.state.notice ? (
              <span className="warn-text">{game.state.notice}</span>
            ) : (
              <span className="muted">
                Passe o mouse ou clique num nó. Só é possível alocar nós conectados aos já alocados.
              </span>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function TreeNodeShape({
  node,
  isAlloc,
  canAlloc,
  onEnter,
  onClick,
}: {
  node: TreeNode
  isAlloc: boolean
  canAlloc: boolean
  onEnter: () => void
  onClick: () => void
}) {
  const cls = ['tnode', `${node.path}-path`]
  if (node.type === 'notable') cls.push('notable')
  if (node.type === 'keystone') cls.push('keystone')
  if (isAlloc) cls.push('alloc')
  if (canAlloc) cls.push('can')

  const glyph = node.path === 'off' ? '⚔' : node.path === 'def' ? '⛊' : node.path === 'util' ? '✦' : '◆'
  const labelY = node.y + (node.type === 'keystone' || node.type === 'notable' ? 34 : 27)
  const gsize = node.type === 'notable' ? 14 : node.type === 'keystone' ? 13 : 11

  return (
    <g className={cls.join(' ')} onMouseEnter={onEnter} onClick={onClick}>
      {node.type === 'keystone' ? (
        <rect
          className="kd"
          x={node.x - 15}
          y={node.y - 15}
          width={30}
          height={30}
          transform={`rotate(45 ${node.x} ${node.y})`}
        />
      ) : (
        <circle
          className="ring"
          cx={node.x}
          cy={node.y}
          r={node.type === 'notable' ? 18 : node.type === 'start' ? 16 : 12}
        />
      )}
      <text className="glyph" x={node.x} y={node.y} style={{ fontSize: gsize }}>
        {glyph}
      </text>
      <text className="lbl" x={node.x} y={labelY}>
        {node.type === 'keystone' ? '◆ ' : ''}
        {node.name}
      </text>
    </g>
  )
}

function TreeDetail({ node, allocated }: { node: TreeNode; allocated: boolean }) {
  return (
    <>
      <span className="tdn">{node.name}</span> —{' '}
      {allocated ? <span className="gold-text">ALOCADO</span> : <span className="muted">não alocado</span>}
      <br />
      <span className="small">{node.stat}</span>
    </>
  )
}
