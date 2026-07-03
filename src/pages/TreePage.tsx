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

/**
 * Dado um nó e uma direção de seta, acha o vizinho conectado "mais alinhado"
 * com essa direção (para mover o foco por teclado na árvore).
 */
function neighborInDirection(fromId: string, key: string): string | null {
  const from = TREE.nodes.find((n) => n.id === fromId)
  if (!from) return null
  const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key]
  if (!dir) return null
  let best: string | null = null
  let bestScore = -Infinity
  for (const nbId of adjacency[fromId] ?? []) {
    const nb = TREE.nodes.find((n) => n.id === nbId)
    if (!nb) continue
    const dx = nb.x - from.x
    const dy = nb.y - from.y
    const len = Math.hypot(dx, dy) || 1
    // Projeção na direção da seta, penalizando o desvio lateral.
    const along = (dx * dir[0] + dy * dir[1]) / len
    if (along <= 0.2) continue // não está minimamente naquela direção
    if (along > bestScore) {
      bestScore = along
      best = nbId
    }
  }
  return best
}

export function TreePage({ game }: { game: Game }) {
  const { allocated } = game.state
  const [t, setT] = useState<Transform>({ scale: 1, tx: 0, ty: 0 })
  const [detail, setDetail] = useState<string | null>(null)
  // Roving tabindex: qual nó recebe o Tab (ponto de entrada da navegação).
  const [focusId, setFocusId] = useState<string>('s0')
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
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

  // Toque: 1 dedo faz pan, 2 dedos fazem pinch-zoom (mobile — Fase E).
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let lastDist = 0
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastDist = dist(e.touches)
      } else if (e.touches.length === 1) {
        drag.current = {
          active: true,
          moved: false,
          sx: e.touches[0].clientX,
          sy: e.touches[0].clientY,
          ox: t.tx,
          oy: t.ty,
        }
      }
    }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const d = dist(e.touches)
        if (lastDist > 0) zoom(d / lastDist)
        lastDist = d
      } else if (e.touches.length === 1 && drag.current.active) {
        const dx = e.touches[0].clientX - drag.current.sx
        const dy = e.touches[0].clientY - drag.current.sy
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
        setT((prev) => ({ ...prev, tx: drag.current.ox + dx, ty: drag.current.oy + dy }))
      }
    }
    const onEnd = () => {
      drag.current.active = false
      lastDist = 0
    }
    stage.addEventListener('touchstart', onStart, { passive: false })
    stage.addEventListener('touchmove', onMove, { passive: false })
    stage.addEventListener('touchend', onEnd)
    return () => {
      stage.removeEventListener('touchstart', onStart)
      stage.removeEventListener('touchmove', onMove)
      stage.removeEventListener('touchend', onEnd)
    }
    // t.tx/t.ty são lidos no início do gesto; zoom é estável (useCallback).
  }, [zoom, t.tx, t.ty])

  const onDown = (e: React.MouseEvent) => {
    drag.current = { active: true, moved: false, sx: e.clientX, sy: e.clientY, ox: t.tx, oy: t.ty }
    stageRef.current?.classList.add('grabbing')
  }

  const clickNode = (id: string) => {
    if (drag.current.moved) return
    game.toggleNode(id)
    setDetail(id)
  }

  // Move o foco de teclado para outro nó e o rola/foca no DOM.
  const moveFocus = useCallback((id: string) => {
    setFocusId(id)
    setDetail(id)
    const el = svgRef.current?.querySelector<SVGGElement>(`[data-node="${id}"]`)
    el?.focus()
  }, [])

  const onNodeKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      game.toggleNode(id)
      setDetail(id)
      return
    }
    const next = neighborInDirection(id, e.key)
    if (next) {
      e.preventDefault()
      moveFocus(next)
    }
  }

  const detailNode = detail ? TREE.nodes.find((n) => n.id === detail) ?? null : null

  return (
    <>
      <PageHead
        title="Árvore Passiva"
        crumb="Gaste pontos de talento para esculpir a build · ganha 1 por nível + bônus por marco"
      />
      {game.talent.available > 0 ? (
        <div className="talent-hint">
          ✦ Você tem <b>{game.talent.available}</b> ponto{game.talent.available > 1 ? 's' : ''} de talento para gastar —
          clique num nó conectado para alocá-lo.
        </div>
      ) : null}
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
              Pontos: <b>{game.talent.used}</b> gastos ·{' '}
              <b className={game.talent.available > 0 ? 'teal' : ''}>{game.talent.available}</b> disponíveis
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
            <svg
              className="tree-svg"
              ref={svgRef}
              viewBox="0 0 860 470"
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label={`Árvore passiva — ${game.talent.used} pontos alocados, ${game.talent.available} disponíveis. Use Tab para focar um nó, setas para navegar, Enter para alocar ou reembolsar.`}
            >
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
                      game.talent.available > 0
                    }
                    isFocus={n.id === focusId}
                    onEnter={() => setDetail(n.id)}
                    onClick={() => clickNode(n.id)}
                    onFocus={() => setFocusId(n.id)}
                    onKeyDown={(e) => onNodeKeyDown(e, n.id)}
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
  isFocus,
  onEnter,
  onClick,
  onFocus,
  onKeyDown,
}: {
  node: TreeNode
  isAlloc: boolean
  canAlloc: boolean
  isFocus: boolean
  onEnter: () => void
  onClick: () => void
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const cls = ['tnode', `${node.path}-path`]
  if (node.type === 'notable') cls.push('notable')
  if (node.type === 'keystone') cls.push('keystone')
  if (isAlloc) cls.push('alloc')
  if (canAlloc) cls.push('can')

  const glyph = node.path === 'off' ? '⚔' : node.path === 'def' ? '⛊' : node.path === 'util' ? '✦' : '◆'
  const labelY = node.y + (node.type === 'keystone' || node.type === 'notable' ? 34 : 27)
  const gsize = node.type === 'notable' ? 14 : node.type === 'keystone' ? 13 : 11

  const state = isAlloc ? 'alocado' : canAlloc ? 'alocável' : 'bloqueado'

  return (
    <g
      className={cls.join(' ')}
      data-node={node.id}
      role="button"
      aria-label={`${node.name}: ${node.stat}. ${state}.`}
      aria-pressed={isAlloc}
      // Roving tabindex: só o nó "em foco" entra na ordem de Tab (começa na
      // origem s0). Setas movem o foco; os demais ficam com tabIndex -1.
      tabIndex={isFocus ? 0 : -1}
      onMouseEnter={onEnter}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
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
