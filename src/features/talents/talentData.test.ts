import { describe, expect, it } from 'vitest'
import {
  ASCENDANCY_ORIGIN_ID,
  ASCENDANCY_POINT_LIMIT,
  PASSIVE_ORIGIN_ID,
  PASSIVE_POINT_LIMIT,
  applyTalentBonuses,
  ascendancyConnections,
  passiveConnections,
  toggleConnectedNode,
} from './talentData'

describe('regras da árvore de talentos', () => {
  it('permite alocar apenas nós conectados', () => {
    const initial = new Set([PASSIVE_ORIGIN_ID])
    const blocked = toggleConnectedNode(
      initial,
      'iron-discipline',
      passiveConnections,
      PASSIVE_ORIGIN_ID,
      PASSIVE_POINT_LIMIT,
    )
    const connected = toggleConnectedNode(
      initial,
      'martial-foundation',
      passiveConnections,
      PASSIVE_ORIGIN_ID,
      PASSIVE_POINT_LIMIT,
    )

    expect(blocked.has('iron-discipline')).toBe(false)
    expect(connected.has('martial-foundation')).toBe(true)
  })

  it('não reembolsa um nó necessário para manter o caminho conectado', () => {
    let allocations = new Set([PASSIVE_ORIGIN_ID])
    for (const nodeId of ['martial-foundation', 'tempered-body', 'reinforced-plates']) {
      allocations = toggleConnectedNode(
        allocations,
        nodeId,
        passiveConnections,
        PASSIVE_ORIGIN_ID,
        PASSIVE_POINT_LIMIT,
      )
    }

    const result = toggleConnectedNode(
      allocations,
      'tempered-body',
      passiveConnections,
      PASSIVE_ORIGIN_ID,
      PASSIVE_POINT_LIMIT,
    )

    expect(result.has('tempered-body')).toBe(true)
    expect(result.has('reinforced-plates')).toBe(true)
  })

  it('restringe a Ascendência ao caminho escolhido', () => {
    const initial = new Set([ASCENDANCY_ORIGIN_ID])
    const allowed = new Set([ASCENDANCY_ORIGIN_ID, 'forge-skin', 'immortal-ember'])
    const blocked = toggleConnectedNode(
      initial,
      'crimson-oath',
      ascendancyConnections,
      ASCENDANCY_ORIGIN_ID,
      ASCENDANCY_POINT_LIMIT,
      allowed,
    )
    const selected = toggleConnectedNode(
      initial,
      'forge-skin',
      ascendancyConnections,
      ASCENDANCY_ORIGIN_ID,
      ASCENDANCY_POINT_LIMIT,
      allowed,
    )

    expect(blocked.has('crimson-oath')).toBe(false)
    expect(selected.has('forge-skin')).toBe(true)
  })

  it('aplica os bônus alocados aos atributos da personagem', () => {
    const stats = applyTalentBonuses(
      {
        life: 800,
        resource: 150,
        attackPower: 100,
        armor: 300,
        blockChance: 10,
        fireResistance: 20,
        attackSpeed: 100,
      },
      new Set([PASSIVE_ORIGIN_ID, 'martial-foundation']),
      new Set([ASCENDANCY_ORIGIN_ID, 'forge-skin']),
    )

    expect(stats.life).toBe(825)
    expect(stats.attackPower).toBe(106)
    expect(stats.armor).toBe(425)
  })
})
