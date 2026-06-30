import { useMemo, useState } from 'react'
import type {
  AscendancyId,
  AscendancyPath,
  TalentConnection,
  TalentNode,
} from '../app/types'
import { Panel } from '../components/Panel'
import {
  ASCENDANCY_ORIGIN_ID,
  ASCENDANCY_POINT_LIMIT,
  PASSIVE_ORIGIN_ID,
  PASSIVE_POINT_LIMIT,
  ascendancyConnections,
  ascendancyNodes,
  ascendancyPaths,
  isNodeAvailable,
  passiveConnections,
  passiveNodes,
} from '../features/talents/talentData'

type TreeTab = 'passive' | 'ascendancy'

interface TalentTreePageProps {
  passiveAllocations: ReadonlySet<string>
  ascendancyAllocations: ReadonlySet<string>
  selectedAscendancy: AscendancyId | null
  onTogglePassive: (nodeId: string) => void
  onToggleAscendancy: (nodeId: string) => void
  onSelectAscendancy: (ascendancyId: AscendancyId) => void
  onResetPassive: () => void
  onResetAscendancy: () => void
}

interface TreeCanvasProps {
  nodes: TalentNode[]
  connections: TalentConnection[]
  allocations: ReadonlySet<string>
  pointLimit: number
  selectedNodeId: string
  allowedNodeIds?: ReadonlySet<string>
  onSelectNode: (nodeId: string) => void
  onToggleNode: (nodeId: string) => void
}

function TreeCanvas({
  nodes,
  connections,
  allocations,
  pointLimit,
  selectedNodeId,
  allowedNodeIds,
  onSelectNode,
  onToggleNode,
}: TreeCanvasProps) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

  return (
    <div className="talent-canvas" aria-label="Mapa de talentos">
      <svg className="talent-connections" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
        {connections.map((connection) => {
          const from = nodeMap.get(connection.from)
          const to = nodeMap.get(connection.to)
          if (!from || !to) return null

          const isActive = allocations.has(connection.from) && allocations.has(connection.to)
          const isReachable =
            (allocations.has(connection.from) && isNodeAvailable(connection.to, allocations, connections, pointLimit, allowedNodeIds)) ||
            (allocations.has(connection.to) && isNodeAvailable(connection.from, allocations, connections, pointLimit, allowedNodeIds))

          return (
            <line
              key={`${connection.from}-${connection.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={isActive ? 'is-active' : isReachable ? 'is-reachable' : ''}
            />
          )
        })}
      </svg>

      {nodes.map((node) => {
        const isActive = allocations.has(node.id)
        const isAvailable = isNodeAvailable(node.id, allocations, connections, pointLimit, allowedNodeIds)
        const isSelected = selectedNodeId === node.id
        const stateClass = isActive ? 'is-active' : isAvailable ? 'is-available' : 'is-locked'

        return (
          <button
            type="button"
            key={node.id}
            className={`talent-node talent-node--${node.kind} ${stateClass} ${isSelected ? 'is-selected' : ''}`}
            style={{ left: `${node.x / 10}%`, top: `${node.y / 6.2}%` }}
            aria-label={`${node.name}. ${isActive ? 'Alocado' : isAvailable ? 'Disponível' : 'Bloqueado'}`}
            aria-pressed={isActive}
            onClick={() => {
              onSelectNode(node.id)
              if (isActive || isAvailable) onToggleNode(node.id)
            }}
          >
            <span className="talent-node__core">{node.kind === 'origin' ? 'I' : node.kind === 'keystone' ? 'K' : node.kind === 'notable' ? 'N' : node.kind === 'ascendancy' ? 'A' : ''}</span>
            <span className="talent-node__name">{node.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function TalentDetails({ node }: { node: TalentNode }) {
  const kindLabels: Record<TalentNode['kind'], string> = {
    origin: 'Origem',
    minor: 'Talento menor',
    notable: 'Talento notável',
    keystone: 'Keystone',
    ascendancy: 'Talento de Ascendência',
  }

  return (
    <aside className="talent-details" aria-live="polite">
      <span>{kindLabels[node.kind]}</span>
      <h3>{node.name}</h3>
      <p>{node.description}</p>
      <ul>
        {node.effects.map((effect) => (
          <li key={effect}>{effect}</li>
        ))}
      </ul>
    </aside>
  )
}

function AscendancySelector({
  paths,
  selected,
  onSelect,
}: {
  paths: AscendancyPath[]
  selected: AscendancyId | null
  onSelect: (id: AscendancyId) => void
}) {
  return (
    <div className="ascendancy-selector">
      {paths.map((path) => {
        const isSelected = selected === path.id
        return (
          <button
            type="button"
            key={path.id}
            className={isSelected ? 'ascendancy-card is-active' : 'ascendancy-card'}
            aria-pressed={isSelected}
            onClick={() => onSelect(path.id)}
          >
            <span>{path.title}</span>
            <strong>{path.name}</strong>
            <p>{path.summary}</p>
          </button>
        )
      })}
    </div>
  )
}

export function TalentTreePage({
  passiveAllocations,
  ascendancyAllocations,
  selectedAscendancy,
  onTogglePassive,
  onToggleAscendancy,
  onSelectAscendancy,
  onResetPassive,
  onResetAscendancy,
}: TalentTreePageProps) {
  const [activeTab, setActiveTab] = useState<TreeTab>('passive')
  const [selectedPassiveNode, setSelectedPassiveNode] = useState(PASSIVE_ORIGIN_ID)
  const [selectedAscendancyNode, setSelectedAscendancyNode] = useState(ASCENDANCY_ORIGIN_ID)

  const selectedNode =
    activeTab === 'passive'
      ? passiveNodes.find((node) => node.id === selectedPassiveNode) ?? passiveNodes[0]
      : ascendancyNodes.find((node) => node.id === selectedAscendancyNode) ?? ascendancyNodes[0]

  const allowedAscendancyNodes = useMemo(() => {
    const allowed = new Set<string>([ASCENDANCY_ORIGIN_ID])
    if (selectedAscendancy) {
      ascendancyNodes
        .filter((node) => node.branch === selectedAscendancy)
        .forEach((node) => allowed.add(node.id))
    }
    return allowed
  }, [selectedAscendancy])

  const passivePointsUsed = passiveAllocations.size - 1
  const ascendancyPointsUsed = ascendancyAllocations.size - 1

  return (
    <div className="page-stack">
      <div className="page-heading page-heading--talents">
        <p className="section-kicker">Círculo de formação</p>
        <h1>Árvore de talentos</h1>
        <p>Construa um caminho conectado, compare especializações e transforme a função da personagem antes da dungeon.</p>
      </div>

      <div className="tree-tabs" role="tablist" aria-label="Tipos de árvore">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'passive'}
          className={activeTab === 'passive' ? 'is-active' : ''}
          onClick={() => setActiveTab('passive')}
        >
          Árvore passiva
          <span>{passivePointsUsed} de {PASSIVE_POINT_LIMIT} pontos</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ascendancy'}
          className={activeTab === 'ascendancy' ? 'is-active' : ''}
          onClick={() => setActiveTab('ascendancy')}
        >
          Ascendência
          <span>{ascendancyPointsUsed} de {ASCENDANCY_POINT_LIMIT} pontos</span>
        </button>
      </div>

      {activeTab === 'passive' ? (
        <Panel
          title="Árvore compartilhada"
          eyebrow={`${PASSIVE_POINT_LIMIT - passivePointsUsed} pontos disponíveis`}
          action={
            <button className="button button--secondary" type="button" onClick={onResetPassive}>
              Reembolsar todos
            </button>
          }
        >
          <div className="tree-legend" aria-label="Legenda da árvore">
            <span><i className="legend-node legend-node--minor" /> Menor</span>
            <span><i className="legend-node legend-node--notable" /> Notável</span>
            <span><i className="legend-node legend-node--keystone" /> Keystone</span>
            <span><i className="legend-node legend-node--active" /> Alocado</span>
          </div>
          <div className="tree-workspace">
            <div className="talent-canvas-scroll">
              <TreeCanvas
                nodes={passiveNodes}
                connections={passiveConnections}
                allocations={passiveAllocations}
                pointLimit={PASSIVE_POINT_LIMIT}
                selectedNodeId={selectedPassiveNode}
                onSelectNode={setSelectedPassiveNode}
                onToggleNode={onTogglePassive}
              />
            </div>
            <TalentDetails node={selectedNode} />
          </div>
        </Panel>
      ) : (
        <div className="page-stack">
          <Panel title="Escolha de Ascendência" eyebrow="Uma especialização por personagem">
            <AscendancySelector
              paths={ascendancyPaths}
              selected={selectedAscendancy}
              onSelect={(ascendancyId) => {
                setSelectedAscendancyNode(ASCENDANCY_ORIGIN_ID)
                onSelectAscendancy(ascendancyId)
              }}
            />
          </Panel>

          <Panel
            title={selectedAscendancy ? ascendancyPaths.find((path) => path.id === selectedAscendancy)?.name ?? 'Ascendência' : 'Rito de Ascensão'}
            eyebrow={`${ASCENDANCY_POINT_LIMIT - ascendancyPointsUsed} pontos disponíveis`}
            action={
              <button className="button button--secondary" type="button" onClick={onResetAscendancy}>
                Reembolsar Ascendência
              </button>
            }
          >
            {!selectedAscendancy ? (
              <p className="tree-instruction">Escolha uma Ascendência para liberar um dos caminhos avançados.</p>
            ) : null}
            <div className="tree-workspace">
              <div className="talent-canvas-scroll">
                <TreeCanvas
                  nodes={ascendancyNodes}
                  connections={ascendancyConnections}
                  allocations={ascendancyAllocations}
                  pointLimit={ASCENDANCY_POINT_LIMIT}
                  selectedNodeId={selectedAscendancyNode}
                  allowedNodeIds={allowedAscendancyNodes}
                  onSelectNode={setSelectedAscendancyNode}
                  onToggleNode={onToggleAscendancy}
                />
              </div>
              <TalentDetails node={selectedNode} />
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
