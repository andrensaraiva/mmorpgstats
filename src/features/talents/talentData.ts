import type {
  AscendancyPath,
  CharacterStats,
  TalentConnection,
  TalentNode,
} from '../../app/types'

export const PASSIVE_ORIGIN_ID = 'passive-origin'
export const ASCENDANCY_ORIGIN_ID = 'ascendancy-origin'
export const PASSIVE_POINT_LIMIT = 8
export const ASCENDANCY_POINT_LIMIT = 2

export const passiveNodes: TalentNode[] = [
  {
    id: PASSIVE_ORIGIN_ID,
    name: 'Origem da Vanguarda',
    description: 'O ponto inicial da árvore compartilhada.',
    kind: 'origin',
    x: 500,
    y: 560,
    effects: ['Ponto inicial'],
    bonuses: {},
  },
  {
    id: 'martial-foundation',
    name: 'Fundamento Marcial',
    description: 'Treinamento básico que abre os três caminhos da Vanguarda.',
    kind: 'minor',
    x: 500,
    y: 470,
    effects: ['+6 de poder de ataque', '+25 de vida máxima'],
    bonuses: { attackPower: 6, life: 25 },
  },
  {
    id: 'tempered-body',
    name: 'Corpo Temperado',
    description: 'Início do caminho voltado para resistência física.',
    kind: 'minor',
    x: 310,
    y: 395,
    effects: ['+45 de armadura'],
    bonuses: { armor: 45 },
  },
  {
    id: 'reinforced-plates',
    name: 'Placas Reforçadas',
    description: 'Ajustes de equipamento aumentam a absorção de impactos.',
    kind: 'minor',
    x: 190,
    y: 315,
    effects: ['+65 de armadura'],
    bonuses: { armor: 65 },
  },
  {
    id: 'vital-reserve',
    name: 'Reserva Vital',
    description: 'Condicionamento para sobreviver a encontros prolongados.',
    kind: 'minor',
    x: 355,
    y: 275,
    effects: ['+55 de vida máxima'],
    bonuses: { life: 55 },
  },
  {
    id: 'shield-drill',
    name: 'Treino de Escudo',
    description: 'Rotinas defensivas melhoram o tempo de resposta ao bloqueio.',
    kind: 'minor',
    x: 115,
    y: 225,
    effects: ['+3% de chance de bloqueio'],
    bonuses: { blockChance: 3 },
  },
  {
    id: 'iron-discipline',
    name: 'Disciplina de Ferro',
    description: 'Um notável defensivo que combina vida, armadura e bloqueio.',
    kind: 'notable',
    x: 275,
    y: 155,
    effects: ['+80 de vida máxima', '+90 de armadura', '+2% de bloqueio'],
    bonuses: { life: 80, armor: 90, blockChance: 2 },
  },
  {
    id: 'unbroken-stance',
    name: 'Postura Inquebrável',
    description: 'Keystone defensiva para enfrentar golpes que encerrariam a tentativa.',
    kind: 'keystone',
    x: 120,
    y: 75,
    effects: ['+180 de armadura', '-8% de velocidade de ataque'],
    bonuses: { armor: 180, attackSpeed: -8 },
  },
  {
    id: 'resource-focus',
    name: 'Foco Interior',
    description: 'Início do caminho de recurso e controle do ritmo.',
    kind: 'minor',
    x: 500,
    y: 355,
    effects: ['+18 de recurso máximo'],
    bonuses: { resource: 18 },
  },
  {
    id: 'deep-reservoir',
    name: 'Reservatório Profundo',
    description: 'Mais recurso para sustentar sequências de habilidades.',
    kind: 'minor',
    x: 430,
    y: 245,
    effects: ['+26 de recurso máximo'],
    bonuses: { resource: 26 },
  },
  {
    id: 'measured-pace',
    name: 'Ritmo Medido',
    description: 'Uma cadência controlada melhora ataque e preservação de recurso.',
    kind: 'minor',
    x: 575,
    y: 245,
    effects: ['+4% de velocidade de ataque', '+10 de recurso máximo'],
    bonuses: { attackSpeed: 4, resource: 10 },
  },
  {
    id: 'threshold-mastery',
    name: 'Maestria do Limiar',
    description: 'Notável de adaptação para builds que combinam ataque e defesa.',
    kind: 'notable',
    x: 500,
    y: 145,
    effects: ['+35 de vida máxima', '+10 de poder de ataque', '+12 de recurso máximo'],
    bonuses: { life: 35, attackPower: 10, resource: 12 },
  },
  {
    id: 'perfect-reserve',
    name: 'Reserva Perfeita',
    description: 'Keystone utilitária que troca parte da vida por maior capacidade de recurso.',
    kind: 'keystone',
    x: 500,
    y: 50,
    effects: ['+60 de recurso máximo', '-60 de vida máxima'],
    bonuses: { resource: 60, life: -60 },
  },
  {
    id: 'keen-edge',
    name: 'Fio Afiado',
    description: 'Início do caminho dedicado a dano e velocidade.',
    kind: 'minor',
    x: 690,
    y: 395,
    effects: ['+8 de poder de ataque'],
    bonuses: { attackPower: 8 },
  },
  {
    id: 'forceful-strikes',
    name: 'Golpes Vigorosos',
    description: 'Movimentos treinados aumentam a força de cada ataque.',
    kind: 'minor',
    x: 810,
    y: 315,
    effects: ['+12 de poder de ataque'],
    bonuses: { attackPower: 12 },
  },
  {
    id: 'combat-flow',
    name: 'Fluxo de Combate',
    description: 'Transições mais rápidas entre ações ofensivas.',
    kind: 'minor',
    x: 645,
    y: 275,
    effects: ['+6% de velocidade de ataque'],
    bonuses: { attackSpeed: 6 },
  },
  {
    id: 'relentless-edge',
    name: 'Fio Incansável',
    description: 'Notável ofensivo para builds que precisam encerrar o encontro rapidamente.',
    kind: 'notable',
    x: 725,
    y: 155,
    effects: ['+18 de poder de ataque', '+5% de velocidade de ataque'],
    bonuses: { attackPower: 18, attackSpeed: 5 },
  },
  {
    id: 'glass-cannon',
    name: 'Doutrina do Vidro',
    description: 'Keystone ofensiva de alto risco que sacrifica defesa por dano.',
    kind: 'keystone',
    x: 880,
    y: 75,
    effects: ['+35 de poder de ataque', '-130 de armadura', '-40 de vida máxima'],
    bonuses: { attackPower: 35, armor: -130, life: -40 },
  },
]

export const passiveConnections: TalentConnection[] = [
  { from: PASSIVE_ORIGIN_ID, to: 'martial-foundation' },
  { from: 'martial-foundation', to: 'tempered-body' },
  { from: 'martial-foundation', to: 'resource-focus' },
  { from: 'martial-foundation', to: 'keen-edge' },
  { from: 'tempered-body', to: 'reinforced-plates' },
  { from: 'tempered-body', to: 'vital-reserve' },
  { from: 'reinforced-plates', to: 'shield-drill' },
  { from: 'shield-drill', to: 'iron-discipline' },
  { from: 'vital-reserve', to: 'iron-discipline' },
  { from: 'iron-discipline', to: 'unbroken-stance' },
  { from: 'vital-reserve', to: 'deep-reservoir' },
  { from: 'resource-focus', to: 'deep-reservoir' },
  { from: 'resource-focus', to: 'measured-pace' },
  { from: 'deep-reservoir', to: 'threshold-mastery' },
  { from: 'measured-pace', to: 'threshold-mastery' },
  { from: 'threshold-mastery', to: 'perfect-reserve' },
  { from: 'measured-pace', to: 'combat-flow' },
  { from: 'keen-edge', to: 'forceful-strikes' },
  { from: 'keen-edge', to: 'combat-flow' },
  { from: 'forceful-strikes', to: 'relentless-edge' },
  { from: 'combat-flow', to: 'relentless-edge' },
  { from: 'relentless-edge', to: 'glass-cannon' },
]

export const ascendancyPaths: AscendancyPath[] = [
  {
    id: 'crimson-executioner',
    name: 'Carrasca Carmesim',
    title: 'Ascendência ofensiva',
    summary: 'Converte segurança em pressão constante contra elites e chefes.',
  },
  {
    id: 'ash-sentinel',
    name: 'Sentinela de Cinzas',
    title: 'Ascendência defensiva',
    summary: 'Especializa a Vanguarda em armadura e resistência elemental.',
  },
  {
    id: 'veil-weaver',
    name: 'Tecelã do Véu',
    title: 'Ascendência tática',
    summary: 'Amplia recurso e estabilidade para comportamentos condicionais.',
  },
]

export const ascendancyNodes: TalentNode[] = [
  {
    id: ASCENDANCY_ORIGIN_ID,
    name: 'Rito de Ascensão',
    description: 'A origem comum dos caminhos avançados da Vanguarda.',
    kind: 'origin',
    x: 500,
    y: 530,
    effects: ['Ponto inicial'],
    bonuses: {},
  },
  {
    id: 'crimson-oath',
    name: 'Juramento Carmesim',
    description: 'A primeira doutrina da Carrasca Carmesim.',
    kind: 'ascendancy',
    x: 240,
    y: 335,
    effects: ['+20 de poder de ataque'],
    bonuses: { attackPower: 20 },
    branch: 'crimson-executioner',
  },
  {
    id: 'execution-tempo',
    name: 'Ritmo de Execução',
    description: 'Acelera a ofensiva ao custo de parte da reserva vital.',
    kind: 'ascendancy',
    x: 145,
    y: 130,
    effects: ['+12% de velocidade de ataque', '-45 de vida máxima'],
    bonuses: { attackSpeed: 12, life: -45 },
    branch: 'crimson-executioner',
  },
  {
    id: 'forge-skin',
    name: 'Pele da Forja',
    description: 'O primeiro voto da Sentinela de Cinzas.',
    kind: 'ascendancy',
    x: 500,
    y: 300,
    effects: ['+125 de armadura'],
    bonuses: { armor: 125 },
    branch: 'ash-sentinel',
  },
  {
    id: 'immortal-ember',
    name: 'Brasa Imortal',
    description: 'A personagem aprende a atravessar chamas sem perder o ritmo.',
    kind: 'ascendancy',
    x: 500,
    y: 90,
    effects: ['+15% de resistência a fogo', '+45 de vida máxima'],
    bonuses: { fireResistance: 15, life: 45 },
    branch: 'ash-sentinel',
  },
  {
    id: 'controlled-flow',
    name: 'Fluxo Controlado',
    description: 'A primeira técnica da Tecelã do Véu.',
    kind: 'ascendancy',
    x: 760,
    y: 335,
    effects: ['+32 de recurso máximo'],
    bonuses: { resource: 32 },
    branch: 'veil-weaver',
  },
  {
    id: 'bound-tactics',
    name: 'Táticas Vinculadas',
    description: 'A preparação correta fortalece corpo e ofensiva ao mesmo tempo.',
    kind: 'ascendancy',
    x: 855,
    y: 130,
    effects: ['+55 de vida máxima', '+10 de poder de ataque'],
    bonuses: { life: 55, attackPower: 10 },
    branch: 'veil-weaver',
  },
]

export const ascendancyConnections: TalentConnection[] = [
  { from: ASCENDANCY_ORIGIN_ID, to: 'crimson-oath' },
  { from: 'crimson-oath', to: 'execution-tempo' },
  { from: ASCENDANCY_ORIGIN_ID, to: 'forge-skin' },
  { from: 'forge-skin', to: 'immortal-ember' },
  { from: ASCENDANCY_ORIGIN_ID, to: 'controlled-flow' },
  { from: 'controlled-flow', to: 'bound-tactics' },
]

const statKeys: Array<keyof CharacterStats> = [
  'life',
  'resource',
  'attackPower',
  'armor',
  'blockChance',
  'fireResistance',
  'attackSpeed',
]

export function applyTalentBonuses(
  baseStats: CharacterStats,
  passiveAllocations: ReadonlySet<string>,
  ascendancyAllocations: ReadonlySet<string>,
): CharacterStats {
  const result = { ...baseStats }
  const selectedNodes = [...passiveNodes, ...ascendancyNodes].filter(
    (node) => passiveAllocations.has(node.id) || ascendancyAllocations.has(node.id),
  )

  for (const node of selectedNodes) {
    for (const key of statKeys) {
      result[key] += node.bonuses[key] ?? 0
    }
  }

  return result
}
function getNeighbors(nodeId: string, connections: TalentConnection[]) {
  return connections.flatMap((connection) => {
    if (connection.from === nodeId) return [connection.to]
    if (connection.to === nodeId) return [connection.from]
    return []
  })
}

function allNodesReachOrigin(
  allocations: ReadonlySet<string>,
  connections: TalentConnection[],
  originId: string,
) {
  const visited = new Set<string>([originId])
  const queue = [originId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    for (const neighbor of getNeighbors(current, connections)) {
      if (allocations.has(neighbor) && !visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  return [...allocations].every((nodeId) => visited.has(nodeId))
}

export function toggleConnectedNode(
  current: ReadonlySet<string>,
  nodeId: string,
  connections: TalentConnection[],
  originId: string,
  pointLimit: number,
  allowedNodeIds?: ReadonlySet<string>,
) {
  if (nodeId === originId) return new Set(current)

  if (current.has(nodeId)) {
    const candidate = new Set(current)
    candidate.delete(nodeId)
    return allNodesReachOrigin(candidate, connections, originId) ? candidate : new Set(current)
  }

  const usedPoints = current.size - 1
  const isAllowed = !allowedNodeIds || allowedNodeIds.has(nodeId)
  const isConnected = getNeighbors(nodeId, connections).some((neighbor) => current.has(neighbor))

  if (usedPoints >= pointLimit || !isAllowed || !isConnected) {
    return new Set(current)
  }

  return new Set([...current, nodeId])
}

export function isNodeAvailable(
  nodeId: string,
  current: ReadonlySet<string>,
  connections: TalentConnection[],
  pointLimit: number,
  allowedNodeIds?: ReadonlySet<string>,
) {
  if (current.has(nodeId)) return true
  if (current.size - 1 >= pointLimit) return false
  if (allowedNodeIds && !allowedNodeIds.has(nodeId)) return false
  return getNeighbors(nodeId, connections).some((neighbor) => current.has(neighbor))
}
