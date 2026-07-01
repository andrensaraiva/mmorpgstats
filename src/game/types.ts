/* =========================================================
   BuildsWar :: contratos do domínio (protótipo único)
   A build sai 100% do que o jogador equipa + aloca + socketa.
   Nada aqui é balanceamento final; ids/versões são estáveis.
   ========================================================= */

export type ViewId =
  | 'portal'
  | 'personagem'
  | 'habilidades'
  | 'equipamento'
  | 'arvore'
  | 'masmorra'
  | 'mercado'

export interface NavItem {
  id: ViewId
  label: string
  tag?: string
}

/* ---------- raridade e slots ---------- */

export type Rarity = 'common' | 'magic' | 'rare' | 'unique'

/** As 9 posições do manequim (paperdoll POE-style). */
export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'gloves'
  | 'chest'
  | 'amulet'
  | 'ring1'
  | 'ring2'
  | 'boots'

/** Categoria da base — decide onde pode ser equipada e o pool de afixos. */
export type BaseKind =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'gloves'
  | 'chest'
  | 'amulet'
  | 'ring'
  | 'boots'

export type ItemClass = 'weapon' | 'armour' | 'jewellery'

/* ---------- estatísticas agregáveis ---------- */

/**
 * Todos os modificadores numéricos que o motor soma para derivar poder.
 * Percentuais são pontos inteiros (ex.: incPhys 62 = +62%).
 */
export type StatKey =
  | 'addedPhysMin'
  | 'addedPhysMax'
  | 'incPhys'
  | 'incAttackSpeed'
  | 'critChance'
  | 'critMulti'
  | 'flatLife'
  | 'incLife'
  | 'armour'
  | 'block'
  | 'fireRes'
  | 'coldRes'
  | 'litRes'
  | 'strength'
  | 'dexterity'
  | 'intelligence'
  | 'supportCap'
  | 'moreDamage'
  | 'lessDamage'

export type StatMods = Partial<Record<StatKey, number>>

/* ---------- bases de item ---------- */

export interface ItemBase {
  id: string
  name: string
  kind: BaseKind
  itemClass: ItemClass
  /** Dano físico base + velocidade de ataque (só armas). */
  weapon?: { physMin: number; physMax: number; attackSpeed: number }
  /** Modificador implícito fixo da base. */
  implicit?: StatMods
  implicitText?: string
  /** Requisito de nível de item para dropar/craftar afixos altos. */
  baseItemLevel: number
}

/* ---------- afixos (prefixos/sufixos com tiers e faixas) ---------- */

export type AffixKind = 'prefix' | 'suffix'

export interface AffixTier {
  tier: number
  /** Faixas sorteáveis por stat. */
  ranges: Partial<Record<StatKey, [number, number]>>
  /** Texto com marcadores {stat} preenchidos pelo valor rolado. */
  text: string
  /** Nível mínimo de item para esse tier aparecer. */
  minItemLevel: number
}

export interface AffixGroup {
  id: string
  name: string
  kind: AffixKind
  /** Classes de item onde o afixo pode aparecer. */
  classes: ItemClass[]
  tiers: AffixTier[]
}

/** Afixo já sorteado numa instância de item. */
export interface RolledAffix {
  groupId: string
  kind: AffixKind
  tier: number
  values: StatMods
  text: string
}

/* ---------- instância de item ---------- */

export interface ItemInstance {
  uid: string
  baseId: string
  rarity: Rarity
  itemLevel: number
  affixes: RolledAffix[]
  corrupted: boolean
  /** Preenchido quando é um único (afixos fixos + flavor). */
  uniqueId?: string
  /** Nome exibido (gerado para raros, fixo para únicos). */
  name: string
  flavor?: string
}

export interface UniqueTemplate {
  id: string
  name: string
  baseId: string
  itemLevel: number
  implicit?: StatMods
  affixes: Array<{ values: StatMods; text: string }>
  flavor: string
}

/* ---------- moedas / orbes de crafting ---------- */

export type OrbId =
  | 'transmutation'
  | 'alteration'
  | 'regal'
  | 'exalt'
  | 'chaos'
  | 'divine'
  | 'vaal'

export interface OrbDefinition {
  id: OrbId
  name: string
  short: string
  description: string
}

export type CurrencyPouch = Record<OrbId, number>

/* ---------- habilidades e suportes ---------- */

export type SkillType = 'atk' | 'spell' | 'def' | 'aura'

export interface SkillDefinition {
  id: string
  name: string
  type: SkillType
  glyph: string
  tags: string[]
  meta: string
  desc: string
  /** Multiplicador de dano da habilidade (0 = utilitária). */
  damageMult: number
  /** Suportes iniciais equipados. */
  defaultSockets: string[]
}

export interface SupportDefinition {
  id: string
  name: string
  /** Compatível se compartilhar ao menos uma tag com a habilidade. */
  match: string[]
  note: string
  /** Bônus concedido quando socketado. */
  mods: StatMods
}

/* ---------- árvore passiva ---------- */

export type NodeType = 'start' | 'small' | 'notable' | 'keystone'
export type NodePath = 'start' | 'off' | 'def' | 'util'

export interface TreeNode {
  id: string
  x: number
  y: number
  type: NodeType
  path: NodePath
  name: string
  stat: string
  mods: StatMods
}

export interface PassiveTree {
  maxPoints: number
  preAlloc: string[]
  nodes: TreeNode[]
  edges: Array<[string, string]>
}

/* ---------- dungeons ---------- */

export interface Dungeon {
  id: string
  name: string
  biome: string
  lvl: number
  /** Poder exigido (quanto maior, mais tempo). */
  diff: number
  fireThreat: boolean
  /** Resistência a fogo mínima para sobreviver. */
  fireReq: number
  season?: boolean
  mods: string[]
  desc: string
  /** Item que pode cair na vitória. */
  reward: { baseId: string; rarity: Rarity; name: string }
}

/* ---------- mercado ---------- */

export interface MarketListing {
  id: string
  name: string
  baseId: string
  rarity: Rarity
  price: number
  seller: string
  lvl: number
}

/* ---------- poder derivado (saída do motor) ---------- */

export interface Power {
  /** DPS "verdadeiro" e determinístico da build. */
  dps: number
  ehp: number
  life: number
  armour: number
  block: number
  attackSpeed: number
  critChance: number
  critMulti: number
  fireRes: number
  coldRes: number
  litRes: number
  strength: number
  dexterity: number
  intelligence: number
  supportCap: number
}

/** DPS medido para um fingerprint específico (mecânica de números descobertos). */
export interface Measured {
  fingerprint: string
  dps: number
}

export interface DungeonOutcome {
  seconds: number
  survivable: boolean
}
