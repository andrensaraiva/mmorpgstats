import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivitySidebar } from '../components/ActivitySidebar'
import { CharacterSidebar } from '../components/CharacterSidebar'
import { GameHeader } from '../components/GameHeader'
import {
  buildPresets,
  dungeonReports,
  initialEquipment,
  items,
  navigationItems,
  skills,
} from '../data/prototype'
import { CharacterPage } from '../pages/CharacterPage'
import { DungeonPage } from '../pages/DungeonPage'
import { EquipmentPage } from '../pages/EquipmentPage'
import { OverviewPage } from '../pages/OverviewPage'
import { SkillsPage } from '../pages/SkillsPage'
import { TalentTreePage } from '../pages/TalentTreePage'
import {
  ASCENDANCY_ORIGIN_ID,
  ASCENDANCY_POINT_LIMIT,
  PASSIVE_ORIGIN_ID,
  PASSIVE_POINT_LIMIT,
  applyTalentBonuses,
  ascendancyConnections,
  ascendancyNodes,
  passiveConnections,
  toggleConnectedNode,
} from '../features/talents/talentData'
import type {
  AscendancyId,
  AttemptState,
  BuildId,
  DungeonReport,
  EquipmentState,
  ItemDefinition,
  ViewId,
} from './types'

function getInitialView(): ViewId {
  const requestedView = new URLSearchParams(window.location.search).get('view')
  return navigationItems.some((item) => item.id === requestedView)
    ? (requestedView as ViewId)
    : 'overview'
}

export function App() {
  const [activeView, setActiveView] = useState<ViewId>(getInitialView)
  const [activeBuildId, setActiveBuildId] = useState<BuildId>('balanced')
  const [equipment, setEquipment] = useState<EquipmentState>(initialEquipment)
  const [attemptState, setAttemptState] = useState<AttemptState>('idle')
  const [report, setReport] = useState<DungeonReport | null>(null)
  const [passiveAllocations, setPassiveAllocations] = useState<Set<string>>(
    () => new Set([PASSIVE_ORIGIN_ID]),
  )
  const [ascendancyAllocations, setAscendancyAllocations] = useState<Set<string>>(
    () => new Set([ASCENDANCY_ORIGIN_ID]),
  )
  const [selectedAscendancy, setSelectedAscendancy] = useState<AscendancyId | null>(null)
  const attemptTimer = useRef<number | undefined>(undefined)

  const activeBuild = useMemo(
    () => {
      const baseBuild = buildPresets.find((build) => build.id === activeBuildId) ?? buildPresets[0]
      return {
        ...baseBuild,
        stats: applyTalentBonuses(baseBuild.stats, passiveAllocations, ascendancyAllocations),
      }
    },
    [activeBuildId, ascendancyAllocations, passiveAllocations],
  )

  useEffect(() => {
    return () => {
      if (attemptTimer.current !== undefined) {
        window.clearTimeout(attemptTimer.current)
      }
    }
  }, [])

  const navigate = (view: ViewId) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectBuild = (buildId: BuildId) => {
    setActiveBuildId(buildId)
    setAttemptState('idle')
    setReport(null)
    if (attemptTimer.current !== undefined) {
      window.clearTimeout(attemptTimer.current)
    }
  }

  const equipItem = (item: ItemDefinition) => {
    setEquipment((current) => ({ ...current, [item.slot]: item.id }))
  }

  const togglePassiveNode = (nodeId: string) => {
    setPassiveAllocations((current) =>
      toggleConnectedNode(
        current,
        nodeId,
        passiveConnections,
        PASSIVE_ORIGIN_ID,
        PASSIVE_POINT_LIMIT,
      ),
    )
  }

  const toggleAscendancyNode = (nodeId: string) => {
    const allowedNodes = new Set<string>([ASCENDANCY_ORIGIN_ID])
    if (selectedAscendancy) {
      ascendancyNodes
        .filter((node) => node.branch === selectedAscendancy)
        .forEach((node) => allowedNodes.add(node.id))
    }

    setAscendancyAllocations((current) =>
      toggleConnectedNode(
        current,
        nodeId,
        ascendancyConnections,
        ASCENDANCY_ORIGIN_ID,
        ASCENDANCY_POINT_LIMIT,
        allowedNodes,
      ),
    )
  }

  const selectAscendancy = (ascendancyId: AscendancyId) => {
    if (selectedAscendancy !== ascendancyId) {
      setSelectedAscendancy(ascendancyId)
      setAscendancyAllocations(new Set([ASCENDANCY_ORIGIN_ID]))
    }
  }

  const startAttempt = () => {
    setAttemptState('running')
    setReport(null)

    attemptTimer.current = window.setTimeout(() => {
      setReport(dungeonReports[activeBuildId])
      setAttemptState('complete')
    }, 1800)
  }

  const resetAttempt = () => {
    setAttemptState('idle')
    setReport(null)
  }

  const renderPage = () => {
    switch (activeView) {
      case 'character':
        return (
          <CharacterPage activeBuild={activeBuild} builds={buildPresets} onSelectBuild={selectBuild} />
        )
      case 'equipment':
        return <EquipmentPage equipment={equipment} items={items} onEquip={equipItem} />
      case 'skills':
        return <SkillsPage build={activeBuild} skills={skills} />
      case 'talents':
        return (
          <TalentTreePage
            passiveAllocations={passiveAllocations}
            ascendancyAllocations={ascendancyAllocations}
            selectedAscendancy={selectedAscendancy}
            onTogglePassive={togglePassiveNode}
            onToggleAscendancy={toggleAscendancyNode}
            onSelectAscendancy={selectAscendancy}
            onResetPassive={() => setPassiveAllocations(new Set([PASSIVE_ORIGIN_ID]))}
            onResetAscendancy={() => setAscendancyAllocations(new Set([ASCENDANCY_ORIGIN_ID]))}
          />
        )
      case 'dungeon':
        return (
          <DungeonPage
            build={activeBuild}
            attemptState={attemptState}
            report={report}
            onStart={startAttempt}
            onReset={resetAttempt}
          />
        )
      case 'overview':
      default:
        return <OverviewPage build={activeBuild} onNavigate={navigate} />
    }
  }

  return (
    <div className="site-frame" data-theme="abyssal-anime">
      <GameHeader activeView={activeView} items={navigationItems} onNavigate={navigate} />

      <div className="game-layout">
        <CharacterSidebar build={activeBuild} onNavigate={navigate} />
        <main className="main-content" id="main-content">
          {renderPage()}
        </main>
        <ActivitySidebar attemptState={attemptState} onNavigate={navigate} />
      </div>

      <footer className="site-footer">
        <span>BuildsWar, protótipo 0.1</span>
        <span>Ambiente de desenvolvimento sem monetização</span>
      </footer>
    </div>
  )
}
