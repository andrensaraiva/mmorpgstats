export type ViewId =
  | 'overview'
  | 'character'
  | 'equipment'
  | 'skills'
  | 'talents'
  | 'dungeon'

export type BuildId = 'balanced' | 'offensive' | 'defensive'

export type AttemptState = 'idle' | 'running' | 'complete'

export type ItemSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'amulet'
  | 'ring'

export type ItemRarity = 'common' | 'magic' | 'rare' | 'unique'

export interface NavigationItem {
  id: ViewId
  label: string
}

export interface CharacterStats {
  life: number
  resource: number
  attackPower: number
  armor: number
  blockChance: number
  fireResistance: number
  attackSpeed: number
}

export interface SkillDefinition {
  id: string
  name: string
  kind: 'Ataque' | 'Área' | 'Defesa'
  cost: number
  cooldown: string
  description: string
}

export interface BuildPreset {
  id: BuildId
  name: string
  title: string
  summary: string
  warning: string
  stats: CharacterStats
  skillIds: string[]
  behavior: string[]
}

export interface ItemDefinition {
  id: string
  name: string
  slot: ItemSlot
  slotLabel: string
  rarity: ItemRarity
  itemLevel: number
  rating: number
  modifiers: string[]
}

export type EquipmentState = Record<ItemSlot, string>

export interface DungeonReport {
  result: 'Vitória' | 'Derrota'
  duration: string
  damageDealt: number
  averageDps: number
  physicalDamageTaken: number
  fireDamageTaken: number
  healing: number
  enemiesDefeated: number
  headline: string
  analysis: string
  reward?: string
}

export type TalentNodeKind = 'origin' | 'minor' | 'notable' | 'keystone' | 'ascendancy'

export type AscendancyId = 'crimson-executioner' | 'ash-sentinel' | 'veil-weaver'

export interface TalentNode {
  id: string
  name: string
  description: string
  kind: TalentNodeKind
  x: number
  y: number
  effects: string[]
  bonuses: Partial<CharacterStats>
  branch?: AscendancyId
}

export interface TalentConnection {
  from: string
  to: string
}

export interface AscendancyPath {
  id: AscendancyId
  name: string
  title: string
  summary: string
}
