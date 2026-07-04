/* =========================================================
   BuildsWar :: conteúdo demonstrativo (dados)
   Bases, afixos, orbes, drops, habilidades, suportes,
   árvore, dungeons e mercado. Ids/versões estáveis.
   ========================================================= */

import type {
  AffixGroup,
  CampaignNode,
  Dungeon,
  ItemBase,
  ItemInstance,
  MarketListing,
  Monster,
  NavItem,
  OrbDefinition,
  PassiveTree,
  Rarity,
  RolledAffix,
  SkillDefinition,
  StatMods,
  SupportDefinition,
  UniqueTemplate,
} from './types'

export const META = { league: 'Cinzas do Abismo', engine: 'sim-0.2.0', seed: '0x9F3C-AB12' }

export const CHARACTER = {
  name: 'Vheyra, a Cinza',
  className: 'Marcial — Rompe-Ferro',
  level: 42,
}

/**
 * As 3 classes do MVP (ver docs/CONTENT_CATALOG.md §2). Cada uma alcança
 * vários arquétipos por arma + árvore + suportes. `glyph`/`accent` alimentam
 * as telas de seleção e criação de personagem.
 */
export interface ClassOption {
  id: 'martial' | 'precision' | 'arcane'
  name: string
  primaryAttr: 'Força' | 'Destreza' | 'Inteligência'
  glyph: string
  accent: 'blood' | 'teal' | 'spectral'
  tagline: string
  fantasy: string
  weapons: string
  archetypes: string[]
  ascendancies: string[]
}

export const CLASSES: ClassOption[] = [
  {
    id: 'martial',
    name: 'Marcial',
    primaryAttr: 'Força',
    glyph: '⚔',
    accent: 'blood',
    tagline: 'Resolve na força e no aço.',
    fantasy: 'Estar na cara do inimigo: impacto físico, sangramento e a muralha que não cede.',
    weapons: 'Machado · Maça · Espada · Escudo',
    archetypes: ['Investida / sangramento', 'Guardião / bloqueio'],
    ascendancies: ['Furioso', 'Baluarte'],
  },
  {
    id: 'precision',
    name: 'Precisão',
    primaryAttr: 'Destreza',
    glyph: '➹',
    accent: 'teal',
    tagline: 'Reflexo e cálculo; nenhuma flecha erra duas vezes.',
    fantasy: 'Velocidade, crítico e explosões em cadeia — ou armadilhas que decidem a luta antes dela.',
    weapons: 'Arco · Besta · Adaga · Armadilha',
    archetypes: ['Arqueiro crítico (raio)', 'Explosões / AoE', 'Assassino / armadilha'],
    ascendancies: ['Perseguidor', 'Engenhoso'],
  },
  {
    id: 'arcane',
    name: 'Arcano',
    primaryAttr: 'Inteligência',
    glyph: '✶',
    accent: 'spectral',
    tagline: 'A chama e a praga obedecem à mesma voz.',
    fantasy: 'Limpar a tela com fogo, frio e raio — ou plantar a semente e ver o inimigo derreter.',
    weapons: 'Cajado · Foco (varinha/orbe)',
    archetypes: ['Elementalista (screen-clear)', 'Pestilência / DoT'],
    ascendancies: ['Elementalista', 'Pestilento'],
  },
]

export const classById: Record<string, ClassOption> = Object.fromEntries(
  CLASSES.map((c) => [c.id, c]),
)

/** Habilidade que dita o DPS agregado (soquetes dela multiplicam o dano). */
export const MAIN_SKILL_ID = 'sk_strike'

export const NAV: NavItem[] = [
  { id: 'portal', label: 'Portal' },
  { id: 'campanha', label: 'Campanha', tag: 'NOVO' },
  { id: 'personagem', label: 'Personagem' },
  { id: 'habilidades', label: 'Habilidades' },
  { id: 'equipamento', label: 'Equipamento', tag: 'CRAFT' },
  { id: 'arvore', label: 'Árvore' },
  { id: 'masmorra', label: 'Masmorra', tag: 'HOT' },
  { id: 'mercado', label: 'Mercado' },
]

/* ===================== BASES ===================== */

export const ITEM_BASES: ItemBase[] = [
  {
    id: 'war_axe',
    name: 'Machado de Guerra',
    kind: 'weapon',
    itemClass: 'weapon',
    weaponType: 'axe',
    icon: 'axe',
    weapon: { physMin: 22, physMax: 41, attackSpeed: 1.25 },
    requires: { level: 32, str: 60, dex: 30 },
    implicit: { incPhys: 18 },
    implicitText: '+18% dano físico aumentado',
    baseItemLevel: 40,
  },
  {
    id: 'great_sword',
    name: 'Espada Longa',
    kind: 'weapon',
    itemClass: 'weapon',
    weaponType: 'sword',
    icon: 'sword',
    weapon: { physMin: 28, physMax: 52, attackSpeed: 1.1 },
    requires: { level: 40, str: 50, dex: 50 },
    implicit: { critMulti: 20 },
    implicitText: '+20% multiplicador de crítico',
    baseItemLevel: 44,
  },
  {
    id: 'cinder_dagger',
    name: 'Adaga de Brasa',
    kind: 'weapon',
    itemClass: 'weapon',
    weaponType: 'dagger',
    icon: 'dagger',
    weapon: { physMin: 11, physMax: 23, attackSpeed: 1.5 },
    requires: { level: 24, dex: 45, int: 35 },
    implicit: { critChance: 8 },
    implicitText: '+8% chance de crítico',
    baseItemLevel: 38,
  },
  {
    id: 'kite_shield',
    name: 'Escudo Pavês',
    kind: 'offhand',
    itemClass: 'armour',
    implicit: { block: 20, armour: 80 },
    implicitText: '+20% bloqueio, +80 armadura',
    baseItemLevel: 40,
  },
  {
    id: 'plate_helm',
    name: 'Elmo de Placas',
    kind: 'head',
    itemClass: 'armour',
    implicit: { armour: 120 },
    implicitText: '+120 armadura',
    baseItemLevel: 44,
  },
  {
    id: 'plate_gloves',
    name: 'Manoplas de Placas',
    kind: 'gloves',
    itemClass: 'armour',
    implicit: { armour: 64 },
    implicitText: '+64 armadura',
    baseItemLevel: 40,
  },
  {
    id: 'plate_chest',
    name: 'Peitoral de Placas',
    kind: 'chest',
    itemClass: 'armour',
    defences: { armour: 220 },
    requires: { level: 45, str: 100 },
    baseItemLevel: 48,
  },
  {
    id: 'mail_greaves',
    name: 'Grevas de Malha',
    kind: 'boots',
    itemClass: 'armour',
    implicit: { armour: 80 },
    implicitText: '+80 armadura',
    baseItemLevel: 40,
  },
  // ---- M2: bases de evasão e escudo de energia ----
  {
    id: 'shadow_garb',
    name: 'Traje das Sombras',
    kind: 'chest',
    itemClass: 'armour',
    defences: { evasion: 240 },
    requires: { level: 44, dex: 100 },
    baseItemLevel: 46,
  },
  {
    id: 'arcane_vestment',
    name: 'Vestes Arcanas',
    kind: 'chest',
    itemClass: 'armour',
    defences: { energyShield: 120 },
    requires: { level: 46, int: 100 },
    baseItemLevel: 48,
  },
  {
    id: 'silk_hood',
    name: 'Capuz de Seda',
    kind: 'head',
    itemClass: 'armour',
    defences: { evasion: 90, energyShield: 40 },
    requires: { level: 40, dex: 50, int: 50 },
    baseItemLevel: 42,
  },
  {
    id: 'amber_amulet',
    name: 'Amuleto de Âmbar',
    kind: 'amulet',
    itemClass: 'jewellery',
    implicit: { strength: 24 },
    implicitText: '+24 Força',
    baseItemLevel: 46,
  },
  {
    id: 'iron_ring',
    name: 'Anel de Ferro',
    kind: 'ring',
    itemClass: 'jewellery',
    implicit: { addedPhysMin: 1, addedPhysMax: 3 },
    implicitText: 'Adiciona 1–3 dano físico aos ataques',
    baseItemLevel: 36,
  },
  {
    id: 'ruby_ring',
    name: 'Anel de Rubi',
    kind: 'ring',
    itemClass: 'jewellery',
    implicit: { fireRes: 20 },
    implicitText: '+20% resistência a fogo',
    baseItemLevel: 42,
  },
  {
    id: 'copper_ring',
    name: 'Anel de Cobre',
    kind: 'ring',
    itemClass: 'jewellery',
    implicit: { fireRes: 6, coldRes: 6, litRes: 6 },
    implicitText: '+6% a todas as resistências elementais',
    baseItemLevel: 20,
  },
]

const baseIndex: Record<string, ItemBase> = Object.fromEntries(
  ITEM_BASES.map((b) => [b.id, b]),
)
export function getBase(id: string): ItemBase {
  const b = baseIndex[id]
  if (!b) throw new Error(`Base desconhecida: ${id}`)
  return b
}

/* ===================== AFIXOS ===================== */

export const AFFIX_GROUPS: AffixGroup[] = [
  {
    id: 'added_phys',
    name: 'Dano Físico Adicionado',
    kind: 'prefix',
    classes: ['weapon'],
    tiers: [
      { tier: 5, ranges: { addedPhysMin: [4, 7], addedPhysMax: [10, 16] }, text: 'Adiciona {addedPhysMin}–{addedPhysMax} dano físico', minItemLevel: 1 },
      { tier: 3, ranges: { addedPhysMin: [12, 18], addedPhysMax: [26, 38] }, text: 'Adiciona {addedPhysMin}–{addedPhysMax} dano físico', minItemLevel: 40 },
      { tier: 1, ranges: { addedPhysMin: [24, 33], addedPhysMax: [48, 66] }, text: 'Adiciona {addedPhysMin}–{addedPhysMax} dano físico', minItemLevel: 66 },
    ],
  },
  {
    id: 'inc_phys',
    name: 'Dano Físico Aumentado',
    kind: 'prefix',
    classes: ['weapon'],
    tiers: [
      { tier: 4, ranges: { incPhys: [20, 34] }, text: '+{incPhys}% dano físico aumentado', minItemLevel: 1 },
      { tier: 2, ranges: { incPhys: [50, 68] }, text: '+{incPhys}% dano físico aumentado', minItemLevel: 44 },
    ],
  },
  // ---- M1: dano elemental/caos adicionado (armas) ----
  {
    id: 'added_fire',
    name: 'Dano de Fogo Adicionado',
    kind: 'prefix',
    classes: ['weapon'],
    tiers: [
      { tier: 5, ranges: { addedFireMin: [3, 6], addedFireMax: [9, 14] }, text: 'Adiciona {addedFireMin}–{addedFireMax} dano de fogo', minItemLevel: 1 },
      { tier: 3, ranges: { addedFireMin: [10, 16], addedFireMax: [24, 34] }, text: 'Adiciona {addedFireMin}–{addedFireMax} dano de fogo', minItemLevel: 40 },
      { tier: 1, ranges: { addedFireMin: [22, 30], addedFireMax: [44, 60] }, text: 'Adiciona {addedFireMin}–{addedFireMax} dano de fogo', minItemLevel: 66 },
    ],
  },
  {
    id: 'added_cold',
    name: 'Dano de Frio Adicionado',
    kind: 'prefix',
    classes: ['weapon'],
    tiers: [
      { tier: 5, ranges: { addedColdMin: [3, 6], addedColdMax: [8, 13] }, text: 'Adiciona {addedColdMin}–{addedColdMax} dano de frio', minItemLevel: 1 },
      { tier: 3, ranges: { addedColdMin: [9, 15], addedColdMax: [22, 31] }, text: 'Adiciona {addedColdMin}–{addedColdMax} dano de frio', minItemLevel: 40 },
      { tier: 1, ranges: { addedColdMin: [20, 28], addedColdMax: [40, 55] }, text: 'Adiciona {addedColdMin}–{addedColdMax} dano de frio', minItemLevel: 66 },
    ],
  },
  {
    id: 'added_lightning',
    name: 'Dano de Raio Adicionado',
    kind: 'prefix',
    classes: ['weapon'],
    tiers: [
      { tier: 5, ranges: { addedLightningMin: [1, 2], addedLightningMax: [14, 22] }, text: 'Adiciona {addedLightningMin}–{addedLightningMax} dano de raio', minItemLevel: 1 },
      { tier: 3, ranges: { addedLightningMin: [2, 4], addedLightningMax: [38, 52] }, text: 'Adiciona {addedLightningMin}–{addedLightningMax} dano de raio', minItemLevel: 40 },
      { tier: 1, ranges: { addedLightningMin: [3, 6], addedLightningMax: [70, 98] }, text: 'Adiciona {addedLightningMin}–{addedLightningMax} dano de raio', minItemLevel: 66 },
    ],
  },
  {
    id: 'added_chaos',
    name: 'Dano de Caos Adicionado',
    kind: 'prefix',
    classes: ['weapon'],
    tiers: [
      { tier: 3, ranges: { addedChaosMin: [6, 10], addedChaosMax: [16, 24] }, text: 'Adiciona {addedChaosMin}–{addedChaosMax} dano de caos', minItemLevel: 44 },
      { tier: 1, ranges: { addedChaosMin: [16, 22], addedChaosMax: [34, 48] }, text: 'Adiciona {addedChaosMin}–{addedChaosMax} dano de caos', minItemLevel: 68 },
    ],
  },
  {
    id: 'inc_elemental',
    name: 'Dano Elemental Aumentado',
    kind: 'prefix',
    classes: ['jewellery', 'weapon'],
    tiers: [
      { tier: 4, ranges: { incElemental: [12, 20] }, text: '+{incElemental}% dano elemental aumentado', minItemLevel: 1 },
      { tier: 2, ranges: { incElemental: [30, 42] }, text: '+{incElemental}% dano elemental aumentado', minItemLevel: 50 },
    ],
  },
  {
    id: 'inc_dot',
    name: 'Dano de DoT Aumentado',
    kind: 'prefix',
    classes: ['weapon', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { incDot: [14, 24] }, text: '+{incDot}% dano de DoT aumentado', minItemLevel: 1 },
      { tier: 2, ranges: { incDot: [34, 48] }, text: '+{incDot}% dano de DoT aumentado', minItemLevel: 50 },
    ],
  },
  // ---- M4: dano de fontes (minions/totens) ----
  {
    id: 'inc_minion',
    name: 'Dano de Minions Aumentado',
    kind: 'prefix',
    classes: ['jewellery', 'armour'],
    tiers: [
      { tier: 4, ranges: { incMinion: [16, 26] }, text: '+{incMinion}% dano de minions', minItemLevel: 1 },
      { tier: 2, ranges: { incMinion: [36, 52] }, text: '+{incMinion}% dano de minions', minItemLevel: 50 },
    ],
  },
  {
    id: 'inc_totem',
    name: 'Dano de Totens Aumentado',
    kind: 'prefix',
    classes: ['jewellery', 'weapon'],
    tiers: [
      { tier: 4, ranges: { incTotem: [16, 26] }, text: '+{incTotem}% dano de totens', minItemLevel: 1 },
      { tier: 2, ranges: { incTotem: [36, 52] }, text: '+{incTotem}% dano de totens', minItemLevel: 50 },
    ],
  },
  // ---- S1: famílias de afixo do item rico ----
  {
    id: 'move_speed',
    name: 'Velocidade de Movimento',
    kind: 'suffix',
    classes: ['armour'],
    tiers: [
      { tier: 3, ranges: { moveSpeed: [10, 15] }, text: '+{moveSpeed}% velocidade de movimento', minItemLevel: 1 },
      { tier: 1, ranges: { moveSpeed: [20, 30] }, text: '+{moveSpeed}% velocidade de movimento', minItemLevel: 50 },
    ],
  },
  {
    id: 'flat_mana',
    name: 'Mana Máxima',
    kind: 'prefix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { flatMana: [20, 39] }, text: '+{flatMana} mana máxima', minItemLevel: 1 },
      { tier: 2, ranges: { flatMana: [55, 89] }, text: '+{flatMana} mana máxima', minItemLevel: 50 },
    ],
  },
  {
    id: 'attr_dex',
    name: 'Destreza',
    kind: 'suffix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { dexterity: [12, 23] }, text: '+{dexterity} Destreza', minItemLevel: 1 },
      { tier: 2, ranges: { dexterity: [30, 45] }, text: '+{dexterity} Destreza', minItemLevel: 50 },
    ],
  },
  {
    id: 'attr_int',
    name: 'Inteligência',
    kind: 'suffix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { intelligence: [12, 23] }, text: '+{intelligence} Inteligência', minItemLevel: 1 },
      { tier: 2, ranges: { intelligence: [30, 45] }, text: '+{intelligence} Inteligência', minItemLevel: 50 },
    ],
  },
  {
    id: 'stun_threshold',
    name: 'Limiar de Atordoamento',
    kind: 'suffix',
    classes: ['armour'],
    tiers: [
      { tier: 3, ranges: { stunThreshold: [12, 20] }, text: '+{stunThreshold}% limiar de atordoamento', minItemLevel: 1 },
    ],
  },
  {
    id: 'elem_pen',
    name: 'Penetração Elemental',
    kind: 'suffix',
    classes: ['jewellery'],
    tiers: [
      { tier: 3, ranges: { firePen: [4, 7], coldPen: [4, 7], lightningPen: [4, 7] }, text: 'Penetra {firePen}% das resistências elementais', minItemLevel: 40 },
      { tier: 1, ranges: { firePen: [8, 12], coldPen: [8, 12], lightningPen: [8, 12] }, text: 'Penetra {firePen}% das resistências elementais', minItemLevel: 68 },
    ],
  },
  {
    id: 'flat_life',
    name: 'Vida Máxima',
    kind: 'prefix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 5, ranges: { flatLife: [30, 59] }, text: '+{flatLife} vida máxima', minItemLevel: 1 },
      { tier: 3, ranges: { flatLife: [80, 129] }, text: '+{flatLife} vida máxima', minItemLevel: 44 },
      { tier: 1, ranges: { flatLife: [160, 219] }, text: '+{flatLife} vida máxima', minItemLevel: 66 },
    ],
  },
  {
    id: 'inc_life',
    name: 'Vida Aumentada',
    kind: 'prefix',
    classes: ['armour'],
    tiers: [
      { tier: 4, ranges: { incLife: [6, 11] }, text: '+{incLife}% vida máxima', minItemLevel: 1 },
      { tier: 2, ranges: { incLife: [14, 20] }, text: '+{incLife}% vida máxima', minItemLevel: 50 },
    ],
  },
  {
    id: 'inc_armour',
    name: 'Armadura Aumentada',
    kind: 'prefix',
    classes: ['armour'],
    tiers: [
      { tier: 4, ranges: { armour: [40, 79] }, text: '+{armour} armadura', minItemLevel: 1 },
      { tier: 2, ranges: { armour: [120, 199] }, text: '+{armour} armadura', minItemLevel: 48 },
    ],
  },
  // ---- M2: evasão e escudo de energia ----
  {
    id: 'flat_evasion',
    name: 'Evasão',
    kind: 'prefix',
    classes: ['armour'],
    tiers: [
      { tier: 4, ranges: { evasion: [40, 79] }, text: '+{evasion} evasão', minItemLevel: 1 },
      { tier: 2, ranges: { evasion: [120, 199] }, text: '+{evasion} evasão', minItemLevel: 48 },
    ],
  },
  {
    id: 'inc_evasion',
    name: 'Evasão Aumentada',
    kind: 'suffix',
    classes: ['armour'],
    tiers: [
      { tier: 4, ranges: { incEvasion: [8, 14] }, text: '+{incEvasion}% evasão aumentada', minItemLevel: 1 },
      { tier: 2, ranges: { incEvasion: [18, 26] }, text: '+{incEvasion}% evasão aumentada', minItemLevel: 50 },
    ],
  },
  {
    id: 'flat_es',
    name: 'Escudo de Energia',
    kind: 'prefix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { energyShield: [16, 30] }, text: '+{energyShield} escudo de energia', minItemLevel: 1 },
      { tier: 2, ranges: { energyShield: [50, 84] }, text: '+{energyShield} escudo de energia', minItemLevel: 48 },
    ],
  },
  {
    id: 'inc_es',
    name: 'Escudo de Energia Aumentado',
    kind: 'suffix',
    classes: ['armour'],
    tiers: [
      { tier: 4, ranges: { incEnergyShield: [8, 14] }, text: '+{incEnergyShield}% escudo de energia aumentado', minItemLevel: 1 },
      { tier: 2, ranges: { incEnergyShield: [18, 26] }, text: '+{incEnergyShield}% escudo de energia aumentado', minItemLevel: 50 },
    ],
  },
  {
    id: 'attack_speed',
    name: 'Velocidade de Ataque',
    kind: 'suffix',
    classes: ['weapon'],
    tiers: [
      { tier: 4, ranges: { incAttackSpeed: [5, 8] }, text: '+{incAttackSpeed}% velocidade de ataque', minItemLevel: 1 },
      { tier: 2, ranges: { incAttackSpeed: [11, 16] }, text: '+{incAttackSpeed}% velocidade de ataque', minItemLevel: 46 },
    ],
  },
  {
    id: 'crit_multi',
    name: 'Multiplicador de Crítico',
    kind: 'suffix',
    classes: ['weapon', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { critMulti: [12, 20] }, text: '+{critMulti}% multiplicador de crítico', minItemLevel: 1 },
      { tier: 2, ranges: { critMulti: [26, 36] }, text: '+{critMulti}% multiplicador de crítico', minItemLevel: 52 },
    ],
  },
  {
    id: 'crit_chance',
    name: 'Chance de Crítico',
    kind: 'suffix',
    classes: ['weapon'],
    tiers: [
      { tier: 4, ranges: { critChance: [8, 14] }, text: '+{critChance}% chance de crítico', minItemLevel: 1 },
      { tier: 2, ranges: { critChance: [18, 27] }, text: '+{critChance}% chance de crítico', minItemLevel: 50 },
    ],
  },
  {
    id: 'fire_res',
    name: 'Resistência a Fogo',
    kind: 'suffix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { fireRes: [12, 23] }, text: '+{fireRes}% resistência a fogo', minItemLevel: 1 },
      { tier: 2, ranges: { fireRes: [30, 41] }, text: '+{fireRes}% resistência a fogo', minItemLevel: 48 },
    ],
  },
  {
    id: 'cold_res',
    name: 'Resistência a Frio',
    kind: 'suffix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { coldRes: [12, 23] }, text: '+{coldRes}% resistência a frio', minItemLevel: 1 },
      { tier: 2, ranges: { coldRes: [30, 41] }, text: '+{coldRes}% resistência a frio', minItemLevel: 48 },
    ],
  },
  {
    id: 'lit_res',
    name: 'Resistência a Raio',
    kind: 'suffix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { litRes: [12, 23] }, text: '+{litRes}% resistência a raio', minItemLevel: 1 },
      { tier: 2, ranges: { litRes: [30, 41] }, text: '+{litRes}% resistência a raio', minItemLevel: 48 },
    ],
  },
  {
    id: 'strength',
    name: 'Força',
    kind: 'suffix',
    classes: ['armour', 'jewellery'],
    tiers: [
      { tier: 4, ranges: { strength: [12, 23] }, text: '+{strength} Força', minItemLevel: 1 },
      { tier: 2, ranges: { strength: [30, 45] }, text: '+{strength} Força', minItemLevel: 50 },
    ],
  },
  {
    id: 'block_suffix',
    name: 'Bloqueio',
    kind: 'suffix',
    classes: ['armour'],
    tiers: [
      { tier: 3, ranges: { block: [3, 6] }, text: '+{block}% chance de bloqueio', minItemLevel: 1 },
    ],
  },
]

/* ===================== ORBES ===================== */

export const ORBS: OrbDefinition[] = [
  { id: 'transmutation', name: 'Orbe de Transmutação', short: 'Trans', description: 'Aprimora um item comum para mágico (1 afixo).' },
  { id: 'alteration', name: 'Orbe de Alteração', short: 'Alt', description: 'Reroda os afixos de um item mágico.' },
  { id: 'regal', name: 'Orbe Régio', short: 'Regal', description: 'Aprimora um item mágico para raro, somando 1 afixo.' },
  { id: 'exalt', name: 'Orbe Exaltado', short: 'Exalt', description: 'Adiciona um novo afixo a um item raro com espaço.' },
  { id: 'chaos', name: 'Orbe do Caos', short: 'Chaos', description: 'Reroda todos os afixos de um item raro.' },
  { id: 'divine', name: 'Orbe Divino', short: 'Div', description: 'Reroda os valores dentro das faixas, mantendo os afixos.' },
  { id: 'vaal', name: 'Orbe Vaal', short: 'Vaal', description: 'Corrompe o item: resultado imprevisível e irreversível.' },
]

/* ===================== HABILIDADES ===================== */

export const SKILLS: SkillDefinition[] = [
  {
    id: 'sk_strike',
    name: 'Golpe Rompedor',
    type: 'atk',
    glyph: '⚔',
    tags: ['ataque', 'corpo-a-corpo', 'físico'],
    meta: 'ATIVA · custo 8 · guiado pela vel. de ataque',
    desc: 'Ataque pesado de alvo único que ignora parte da armadura. Enche os intervalos da rotação e potencializa com a Exposição.',
    damageMult: 1,
    requires: { weapon: ['axe', 'mace', 'sword'] },
    cost: 8,
    cooldown: 0,
    castTime: 0, // guiado pela velocidade de ataque (1/aps)
    empoweredBy: 'exposure',
    comboMore: 40,
    defaultSockets: ['s_blood', 's_brutal'],
  },
  {
    id: 'sk_wave',
    name: 'Onda Sísmica',
    type: 'spell',
    glyph: '◈',
    tags: ['ataque', 'área', 'físico', 'atordoamento'],
    meta: 'ATIVA · custo 20 · rec 3.5s · aplica Exposição',
    desc: 'Fende o solo à frente, dano em área e abre a Exposição no alvo — mantê-la ativa potencializa o Golpe Rompedor.',
    damageMult: 0.8,
    cost: 20,
    cooldown: 3.5,
    castTime: 0.6,
    applies: 'exposure',
    appliesDuration: 4,
    defaultSockets: ['s_aoe'],
  },
  {
    id: 'sk_stance',
    name: 'Postura de Ferro',
    type: 'def',
    glyph: '◉',
    tags: ['defesa', 'persistente', 'bloqueio'],
    meta: 'ATIVA · rec 9s · dur 4s',
    desc: 'Reduz o dano recebido e eleva o bloqueio por um curto período.',
    damageMult: 0,
    cost: 0,
    cooldown: 9,
    castTime: 0.4,
    defaultSockets: ['s_fort'],
  },
  {
    id: 'sk_banner',
    name: 'Estandarte do Bastião',
    type: 'aura',
    glyph: '†',
    tags: ['persistente', 'reserva', 'aura', 'defesa'],
    meta: 'RESERVA · reserva 55',
    desc: 'Efeito persistente: concede armadura e regeneração enquanto ativo.',
    damageMult: 0,
    cost: 0,
    cooldown: 0,
    castTime: 0,
    defaultSockets: [],
  },
  // ---- M1: ativas elementais (arquétipos elementalista / arqueiro de raio) ----
  {
    id: 'sk_fireball',
    name: 'Bola de Fogo',
    type: 'spell',
    glyph: '🔥',
    tags: ['conjuração', 'projétil', 'área', 'fogo', 'elemental'],
    meta: 'ATIVA · custo 14 · conj. 0.55s · aplica Exposição',
    desc: 'Lança uma bola de fogo que explode no impacto. Dano de FOGO próprio (não escala com a arma física) e abre a Exposição no alvo.',
    damageMult: 1,
    damageType: 'fire',
    requires: { weapon: ['staff', 'wand'], level: 6 },
    baseDamage: { min: 34, max: 58 },
    cost: 14,
    cooldown: 0,
    castTime: 0.55,
    applies: 'exposure',
    appliesDuration: 4,
    defaultSockets: [],
  },
  {
    id: 'sk_shock_arrow',
    name: 'Flecha Trovejante',
    type: 'atk',
    glyph: '⚡',
    tags: ['ataque', 'projétil', 'raio', 'elemental'],
    meta: 'ATIVA · custo 9 · guiado pela vel. de ataque',
    desc: 'Dispara uma flecha carregada de RAIO. Dano elemental próprio, veloz — enche os intervalos da rotação e potencializa com a Exposição.',
    damageMult: 0.9,
    damageType: 'lightning',
    requires: { weapon: ['bow', 'crossbow'], level: 8 },
    baseDamage: { min: 20, max: 62 },
    cost: 9,
    cooldown: 0,
    castTime: 0,
    empoweredBy: 'exposure',
    comboMore: 40,
    defaultSockets: [],
  },
  // ---- M3: ativas de ailment/DoT (arquétipos sangramento / veneno) ----
  {
    id: 'sk_rend',
    name: 'Dilacerar',
    type: 'atk',
    glyph: '🩸',
    tags: ['ataque', 'corpo-a-corpo', 'físico', 'sangramento', 'dot'],
    meta: 'ATIVA · custo 10 · guiado pela vel. de ataque · aplica Sangramento',
    desc: 'Um talho profundo que faz o alvo SANGRAR: além do golpe, causa dano físico ao longo do tempo (refresca a cada golpe).',
    damageMult: 0.85,
    requires: { weapon: ['axe', 'sword', 'dagger'], level: 4 },
    cost: 10,
    cooldown: 0,
    castTime: 0,
    ailment: 'bleed',
    ailmentMult: 0.6,
    ailmentDuration: 4,
    defaultSockets: [],
  },
  {
    id: 'sk_plague',
    name: 'Toque Pestilento',
    type: 'spell',
    glyph: '☣',
    tags: ['conjuração', 'caos', 'veneno', 'dot'],
    meta: 'ATIVA · custo 12 · conj. 0.5s · aplica Veneno (empilha)',
    desc: 'Inocula uma praga de CAOS que EMPILHA: cada aplicação soma um novo foco de veneno — escala com a cadência de golpes.',
    damageMult: 0.5,
    damageType: 'chaos',
    requires: { weapon: ['staff', 'wand', 'dagger'], level: 12 },
    baseDamage: { min: 18, max: 30 },
    cost: 12,
    cooldown: 0,
    castTime: 0.5,
    ailment: 'poison',
    ailmentMult: 0.5,
    ailmentDuration: 3,
    defaultSockets: [],
  },
  // ---- M4: fontes externas (minions e totens/balista) ----
  {
    id: 'sk_skeletons',
    name: 'Guarda de Ossos',
    type: 'spell',
    glyph: '💀',
    tags: ['minion', 'invocação', 'persistente', 'físico'],
    meta: 'FONTE · minions · dano contínuo por conta própria',
    desc: 'Ergue esqueletos que lutam por você: dano FÍSICO contínuo, independente da sua rotação. Escala com “dano de minion”.',
    damageMult: 0, // não é golpe da rotação — contribui via fonte
    requires: { level: 10 },
    source: 'minion',
    sourceDamage: { min: 40, max: 70 },
    sourceRate: 2.4,
    sourceDamageType: 'phys',
    cost: 0,
    cooldown: 0,
    castTime: 0,
    defaultSockets: [],
  },
  {
    id: 'sk_ballista',
    name: 'Totem Balista',
    type: 'spell',
    glyph: '🏹',
    tags: ['totem', 'projétil', 'raio', 'persistente', 'elemental'],
    meta: 'FONTE · totém · dispara sozinho',
    desc: 'Finca uma balista totêmica que dispara RAIO sozinha: dano contínuo, independente da rotação. Escala com “dano de totém”.',
    damageMult: 0,
    requires: { level: 14 },
    source: 'totem',
    sourceDamage: { min: 30, max: 90 },
    sourceRate: 1.6,
    sourceDamageType: 'lightning',
    cost: 0,
    cooldown: 0,
    castTime: 0,
    defaultSockets: [],
  },
]

/**
 * Loadout inicial: a rotação padrão, em ordem de **prioridade**. A Onda Sísmica
 * vem antes do Golpe Rompedor de propósito — ela abre a Exposição no cooldown e
 * o Golpe enche os intervalos já potencializado. Reordenar (chega no R3) muda o
 * DPS e invalida o número medido. Só skills de dano entram; utilitárias são
 * ignoradas pela medição.
 */
export const STARTER_LOADOUT: string[] = ['sk_wave', 'sk_strike']

/**
 * Ataque básico de retaguarda: entra quando nenhuma ativa da rotação está
 * pronta (em cooldown) ou o recurso não paga a próxima. Grátis, mult baixo —
 * é o piso que garante que a simulação nunca trava e o sinal de "sem recurso".
 * Não é escolhível no loadout; o motor o usa como fallback.
 */
export const BASIC_ATTACK: SkillDefinition = {
  id: 'sk_basic',
  name: 'Ataque Básico',
  type: 'atk',
  glyph: '·',
  tags: ['ataque', 'corpo-a-corpo', 'físico'],
  meta: 'BÁSICO · grátis',
  desc: 'Golpe simples sem custo, usado quando as ativas da rotação não podem ser lançadas.',
  damageMult: 0.5,
  cost: 0,
  cooldown: 0,
  castTime: 0,
  defaultSockets: [],
}

export const SUPPORTS: SupportDefinition[] = [
  { id: 's_blood', name: 'Sede de Sangue', match: ['ataque'], note: '+15% dano', mods: { moreDamage: 15 } },
  { id: 's_brutal', name: 'Impacto Brutal', match: ['físico'], note: '+20% dano físico', mods: { moreDamage: 20 } },
  { id: 's_crit', name: 'Precisão Mortal', match: ['ataque'], note: '+crítico', mods: { critChance: 8, critMulti: 15 } },
  { id: 's_concuss', name: 'Concussão', match: ['ataque', 'atordoamento'], note: '+6% dano', mods: { moreDamage: 6 } },
  { id: 's_aoe', name: 'Alcance Ampliado', match: ['área'], note: '+4% dano', mods: { moreDamage: 4 } },
  { id: 's_cleave', name: 'Fenda Profunda', match: ['área', 'físico'], note: '+14% dano', mods: { moreDamage: 14 } },
  { id: 's_dur', name: 'Duração Estendida', match: ['persistente', 'defesa'], note: '+4% vida', mods: { incLife: 4 } },
  { id: 's_fort', name: 'Reforço', match: ['defesa'], note: '+8% vida', mods: { incLife: 8 } },
  // ---- M1: suportes elementais ----
  { id: 's_elem', name: 'Foco Elemental', match: ['elemental'], note: '+18% dano elemental', mods: { incElemental: 18 } },
  { id: 's_pierce', name: 'Ruptura Arcana', match: ['elemental'], note: '+8% penetração elem.', mods: { firePen: 8, coldPen: 8, lightningPen: 8 } },
  { id: 's_proj', name: 'Projétil Veloz', match: ['projétil'], note: '+12% dano', mods: { moreDamage: 12 } },
  // ---- M2: suporte defensivo (evasão/ES) ----
  { id: 's_ward', name: 'Salvaguarda', match: ['defesa', 'persistente'], note: '+15% evasão e ES', mods: { incEvasion: 15, incEnergyShield: 15 } },
  // ---- M3: suporte de DoT ----
  { id: 's_dot', name: 'Corrosão', match: ['dot'], note: '+25% dano de DoT', mods: { incDot: 25 } },
  // ---- M4: suportes de fonte (minion/totém) ----
  { id: 's_minion', name: 'Comando Feroz', match: ['minion'], note: '+30% dano de minions', mods: { incMinion: 30 } },
  { id: 's_totem', name: 'Ancoragem', match: ['totem'], note: '+30% dano de totens', mods: { incTotem: 30 } },
  // ---- SK2: SELOS ELEMENTAIS — convertem o tipo de dano da skill ----
  { id: 'seal_fire', name: 'Selo de Brasa', match: ['ataque', 'conjuração'], note: 'converte p/ FOGO + queimadura', mods: {}, convertsTo: 'fire', addsAilment: 'ignite' },
  { id: 'seal_cold', name: 'Selo de Gelo', match: ['ataque', 'conjuração'], note: 'converte p/ FRIO', mods: {}, convertsTo: 'cold' },
  { id: 'seal_lightning', name: 'Selo de Tempestade', match: ['ataque', 'conjuração'], note: 'converte p/ RAIO', mods: {}, convertsTo: 'lightning' },
  { id: 'seal_chaos', name: 'Selo Pestilento', match: ['ataque', 'conjuração'], note: 'converte p/ CAOS + veneno', mods: {}, convertsTo: 'chaos', addsAilment: 'poison' },
]

export const BEHAVIOR: Array<{ when: string; then: string }> = [
  { when: 'SE vida < 40%', then: 'usar Poção de Vida' },
  { when: 'SE inimigos ≥ 3', then: 'usar Onda Sísmica' },
  { when: 'SE alvo for CHEFE', then: 'manter Postura de Ferro' },
  { when: 'SE recurso < 20%', then: 'usar ataque básico' },
  { when: 'AO bloquear', then: 'usar Golpe Rompedor' },
]

/* ===================== ÁRVORE ===================== */

export const TREE: PassiveTree = {
  maxPoints: 8,
  preAlloc: ['s0', 'o1', 'o2', 'o3'],
  nodes: [
    { id: 's0', x: 400, y: 300, type: 'start', path: 'start', name: 'Origem Marcial', stat: '+10 Força', mods: { strength: 10 } },

    { id: 'o1', x: 492, y: 262, type: 'small', path: 'off', name: 'Lâmina Afiada', stat: '+12% dano físico', mods: { incPhys: 12 } },
    { id: 'o2', x: 576, y: 228, type: 'small', path: 'off', name: 'Fúria', stat: '+8% vel. de ataque', mods: { incAttackSpeed: 8 } },
    { id: 'o6', x: 582, y: 312, type: 'small', path: 'off', name: 'Precisão', stat: '+4% chance de crítico', mods: { critChance: 4 } },
    { id: 'o3', x: 664, y: 262, type: 'notable', path: 'off', name: 'Carniceiro', stat: '+28% dano físico, +6% crítico', mods: { incPhys: 28, critChance: 6 } },
    { id: 'o4', x: 748, y: 232, type: 'small', path: 'off', name: 'Impiedade', stat: '+18% multi. de crítico', mods: { critMulti: 18 } },
    { id: 'o5', x: 812, y: 276, type: 'keystone', path: 'off', name: 'Coração de Brasa', stat: 'KEYSTONE: +40% dano, mas −15% vida', mods: { moreDamage: 40, incLife: -15 } },
    // ---- M3: ramo de DoT ----
    { id: 'o7', x: 700, y: 340, type: 'small', path: 'off', name: 'Ferida Aberta', stat: '+20% dano de DoT', mods: { incDot: 20 } },
    { id: 'o8', x: 760, y: 380, type: 'notable', path: 'off', name: 'Praga Persistente', stat: '+40% dano de DoT', mods: { incDot: 40 } },

    { id: 'd1', x: 314, y: 352, type: 'small', path: 'def', name: 'Pele Dura', stat: '+140 armadura', mods: { armour: 140 } },
    { id: 'd2', x: 242, y: 394, type: 'small', path: 'def', name: 'Vigor', stat: '+80 vida máxima', mods: { flatLife: 80 } },
    { id: 'd6', x: 256, y: 318, type: 'small', path: 'def', name: 'Baluarte', stat: '+4% bloqueio', mods: { block: 4 } },
    { id: 'd3', x: 172, y: 378, type: 'notable', path: 'def', name: 'Muralha Viva', stat: '+120 armadura, +6% bloqueio', mods: { armour: 120, block: 6 } },
    { id: 'd4', x: 112, y: 414, type: 'small', path: 'def', name: 'Cerne Térmico', stat: '+16% res. a fogo', mods: { fireRes: 16 } },
    { id: 'd5', x: 52, y: 378, type: 'keystone', path: 'def', name: 'Juramento de Pedra', stat: 'KEYSTONE: +20% bloqueio, mas −30% dano', mods: { block: 20, lessDamage: 30 } },
    // ---- M2: ramo de esquiva/escudo ----
    { id: 'd7', x: 214, y: 456, type: 'small', path: 'def', name: 'Passo Leve', stat: '+120 evasão', mods: { evasion: 120 } },
    { id: 'd8', x: 158, y: 486, type: 'notable', path: 'def', name: 'Dança das Sombras', stat: '+25% evasão, +80 escudo de energia', mods: { incEvasion: 25, energyShield: 80 } },

    { id: 'u1', x: 414, y: 214, type: 'small', path: 'util', name: 'Fôlego', stat: '+40 vida máxima', mods: { flatLife: 40 } },
    { id: 'u2', x: 436, y: 140, type: 'small', path: 'util', name: 'Temperança', stat: '+8% res. a frio', mods: { coldRes: 8 } },
    { id: 'u3', x: 372, y: 96, type: 'notable', path: 'util', name: 'Estrategista', stat: '+1 soquete de suporte por habilidade', mods: { supportCap: 1 } },
    { id: 'u4', x: 456, y: 72, type: 'small', path: 'util', name: 'Presteza', stat: '+3% vel. de ataque', mods: { incAttackSpeed: 3 } },
    { id: 'u5', x: 372, y: 34, type: 'keystone', path: 'util', name: 'Mente Fria', stat: 'KEYSTONE: +5% dano', mods: { moreDamage: 5 } },
    // ---- M1: ramo elemental ----
    { id: 'u6', x: 520, y: 158, type: 'small', path: 'util', name: 'Faísca', stat: '+16% dano elemental', mods: { incElemental: 16 } },
    { id: 'u7', x: 588, y: 130, type: 'notable', path: 'util', name: 'Convergência Elemental', stat: '+30% dano elemental, +6% penetração', mods: { incElemental: 30, firePen: 6, coldPen: 6, lightningPen: 6 } },
    // ---- M4: ramo de invocação (minions/totens) ----
    { id: 'u8', x: 300, y: 60, type: 'small', path: 'util', name: 'Legião', stat: '+20% dano de minions', mods: { incMinion: 20 } },
    { id: 'u9', x: 236, y: 96, type: 'notable', path: 'util', name: 'Senhor das Hostes', stat: '+35% dano de minions e de totens', mods: { incMinion: 35, incTotem: 35 } },
  ],
  edges: [
    ['s0', 'o1'], ['o1', 'o2'], ['o2', 'o3'], ['o3', 'o4'], ['o4', 'o5'], ['o1', 'o6'], ['o6', 'o3'], ['o3', 'o7'], ['o7', 'o8'],
    ['s0', 'd1'], ['d1', 'd2'], ['d2', 'd3'], ['d3', 'd4'], ['d4', 'd5'], ['d1', 'd6'], ['d6', 'd3'], ['d2', 'd7'], ['d7', 'd8'],
    ['s0', 'u1'], ['u1', 'u2'], ['u2', 'u3'], ['u3', 'u4'], ['u4', 'u5'], ['u2', 'u6'], ['u6', 'u7'], ['u3', 'u8'], ['u8', 'u9'],
  ],
}

/* ===================== BESTIÁRIO ===================== */

/**
 * Bestiário: cada monstro tem papel (arquétipo), perfil de dano e forças/fraquezas.
 * Alimenta a composição das dungeons e o balanceamento por ameaça.
 * Ver docs/BESTIARY_AND_DUNGEONS.md §3.
 */
export const BESTIARY: Monster[] = [
  {
    id: 'm-ghoul', name: 'Carniçal em Bando', role: 'swarmer', rank: 'normal',
    damage: { phys: 40 }, hitSize: 'small', life: 220,
    weakTo: ['fire'], resistant: [],
  },
  {
    id: 'm-brute', name: 'Bruto da Cripta', role: 'bruiser', rank: 'normal',
    damage: { phys: 280 }, hitSize: 'huge', life: 1800,
    resistant: ['phys'],
  },
  {
    id: 'm-ember-archer', name: 'Arqueiro de Brasa', role: 'ranged', rank: 'normal',
    damage: { fire: 120 }, hitSize: 'medium', life: 340,
    weakTo: ['cold'],
  },
  {
    id: 'm-frost-caster', name: 'Conjurador Gélido', role: 'caster', rank: 'normal',
    damage: { cold: 160 }, hitSize: 'medium', life: 300,
    weakTo: ['fire'], resistant: ['cold'],
  },
  {
    id: 'm-bat', name: 'Morcego de Cinza', role: 'aerial', rank: 'normal',
    damage: { phys: 30, lightning: 40 }, hitSize: 'small', life: 160, aerial: true,
    weakTo: ['lightning'],
  },
  {
    id: 'm-shaman', name: 'Xamã da Brasa', role: 'support', rank: 'normal',
    damage: { fire: 60 }, hitSize: 'small', life: 420,
    weakTo: ['cold'],
  },
  {
    id: 'e-teleporter', name: 'Elite Saltador', role: 'caster', rank: 'elite',
    damage: { lightning: 260 }, hitSize: 'huge', life: 2600,
    resistant: ['lightning'],
    affixes: [
      { id: 'af-teleport', name: 'Saltador', effect: 'Teleporta em cima do herói e descarrega raio.', addsDamageType: 'lightning' },
      { id: 'af-fast', name: 'Veloz', effect: 'Move e ataca muito rápido; exige chill/freeze ou mitigação de golpes.' },
    ],
  },
  {
    id: 'e-fire-enchanted', name: 'Sentinela Fire-Enchanted', role: 'bruiser', rank: 'elite',
    damage: { phys: 180, fire: 140 }, hitSize: 'huge', life: 3200,
    resistant: ['fire', 'phys'],
    affixes: [
      { id: 'af-fire-ench', name: 'Fire-Enchanted', effect: 'Adiciona dano de fogo ao pacote; explode ao morrer.', addsDamageType: 'fire' },
      { id: 'af-shield', name: 'Barreira', effect: 'Ganha escudo periódico; premia burst para quebrar.' },
    ],
  },
  {
    id: 'b-executioner', name: 'O Carrasco Ígneo', role: 'bruiser', rank: 'boss',
    damage: { phys: 320 }, hitSize: 'huge', life: 24000,
    resistant: ['phys', 'fire'],
    phases: [
      { damage: { phys: 320 }, note: 'Fase 1 — golpe físico enorme: testa EHP/bloqueio contra golpe grande.' },
      { damage: { fire: 400 }, note: 'Fase 2 — incendeia a arena: testa res. a fogo.' },
      { damage: { phys: 120, fire: 120 }, note: 'Fase 3 — invoca carniçais: testa AoE e vazão.' },
    ],
  },
  {
    id: 'b-abyss-warden', name: 'Guardião do Fosso', role: 'caster', rank: 'boss',
    damage: { chaos: 260, cold: 140 }, hitSize: 'huge', life: 30000,
    resistant: ['chaos', 'cold'],
    phases: [
      { damage: { chaos: 260 }, note: 'Fase 1 — caos que fura escudo de energia: testa res. a caos e vida.' },
      { damage: { cold: 240, chaos: 160 }, note: 'Fase 2 — frio + caos: chill trava enquanto o caos derrete.' },
    ],
  },
]

/* ===================== DUNGEONS ===================== */

export const DUNGEONS: Dungeon[] = [
  {
    id: 'd-crypt', name: 'Cripta dos Suspiros', biome: 'Necrópole', lvl: 44, diff: 4200, fireThreat: true, fireReq: 45,
    mods: ['Grupos numerosos', 'Dano físico elevado', 'Chefe ígneo (fase 2)'],
    desc: 'Corredores estreitos e mortos-vivos em bando; o carrasco incendeia a arena na fase final.',
    composition: {
      density: 'swarm', forceProfile: 'weak-horde', damageMix: ['phys', 'fire'],
      hasAerial: false, mobilityDemand: 'low', roles: ['swarmer', 'bruiser'],
      waves: [
        { monsterId: 'm-ghoul', count: 18 },
        { monsterId: 'm-brute', count: 3 },
        { monsterId: 'b-executioner', count: 1 },
      ],
    },
    reward: { baseId: 'great_sword', rarity: 'rare', name: 'Ceifador Trovejante' },
  },
  {
    id: 'd-forge', name: 'Fornalha Rachada', biome: 'Caverna Ígnea', lvl: 46, diff: 5200, fireThreat: true, fireReq: 55,
    mods: ['Dano de fogo intenso', 'Chão em chamas', 'Elite adicional'],
    desc: 'Rios de lava e sentinelas de brasa. Poucos, porém fortes: pune quem entra com pouca res. a fogo.',
    composition: {
      density: 'sparse', forceProfile: 'few-strong', damageMix: ['fire', 'phys'],
      hasAerial: false, mobilityDemand: 'medium', roles: ['ranged', 'bruiser', 'support'],
      waves: [
        { monsterId: 'm-ember-archer', count: 5 },
        { monsterId: 'm-shaman', count: 2 },
        { monsterId: 'e-fire-enchanted', count: 1 },
      ],
    },
    reward: { baseId: 'plate_chest', rarity: 'rare', name: 'Couraça Recozida' },
  },
  {
    id: 'd-glacier', name: 'Sepulcro Glacial', biome: 'Geleira', lvl: 45, diff: 4600, fireThreat: false, fireReq: 0,
    mods: ['Lentidão', 'Dano de frio', 'Enxame aéreo'],
    desc: 'Conjuradores gélidos e morcegos que ignoram o chão. Exige mitigação de frio e dano que atinge o ar.',
    composition: {
      density: 'medium', forceProfile: 'mixed', damageMix: ['cold', 'lightning'],
      hasAerial: true, mobilityDemand: 'high', roles: ['caster', 'aerial', 'ranged'],
      waves: [
        { monsterId: 'm-frost-caster', count: 6 },
        { monsterId: 'm-bat', count: 12 },
        { monsterId: 'e-teleporter', count: 1 },
      ],
    },
    reward: { baseId: 'amber_amulet', rarity: 'rare', name: 'Selo Congelado' },
  },
  {
    id: 'd-abyss', name: 'Fenda das Cinzas', biome: 'Abismo Sazonal', lvl: 48, diff: 6400, fireThreat: true, fireReq: 60, season: true,
    mods: ['Mecânica sazonal', 'Inimigos fortalecidos', 'Dano de caos que fura ES'],
    desc: 'Encontro sazonal: caos + frio do Guardião do Fosso. Aceite o risco, colha fragmentos.',
    composition: {
      density: 'medium', forceProfile: 'few-strong', damageMix: ['chaos', 'cold', 'fire'],
      hasAerial: true, mobilityDemand: 'high', roles: ['caster', 'aerial', 'bruiser'],
      waves: [
        { monsterId: 'm-bat', count: 10 },
        { monsterId: 'e-fire-enchanted', count: 2 },
        { monsterId: 'b-abyss-warden', count: 1 },
      ],
    },
    reward: { baseId: 'war_axe', rarity: 'rare', name: 'Britadora do Fosso' },
  },
]

/* ===================== CAMPANHA (P1) ===================== */
/*
   Trilha ordenada de encontros narrativos que reusam as dungeons. Cada marco
   ensina uma mecânica e destrava um sistema — "ensinar, não despejar".
   Ver docs/PROGRESSION_AND_STORY.md §2.4.
*/

export const CAMPAIGN: CampaignNode[] = [
  {
    id: 'c-prologue', act: 0, order: 0, title: 'Prólogo — O Golpe',
    intro:
      'As Cinzas engoliram a estrada. Antes de qualquer feitiçaria, prove que sua lâmina morde: um pacote de carniçais bloqueia a descida à Cripta.',
    outcome:
      'O último carniçal tomba. Você sente o peso da arma na mão — e como cada afixo dela muda o golpe. Seu equipamento está liberado.',
    teaches: 'Golpe e DPS: a arma e os afixos definem seu dano.',
    dungeonId: 'd-crypt', levelReq: 1, unlocks: 'equipamento',
  },
  {
    id: 'c-act1', act: 1, order: 1, title: 'Ato I — A Cripta',
    intro:
      'Mais fundo, a Cripta respira fogo pelas frestas. Sem resistência, a horda ígnea vai cozinhá-la viva. Ajuste a build — e talvez a árvore de talentos ajude.',
    outcome:
      'Você aguentou as labaredas e limpou a horda. A Árvore Passiva e os primeiros orbes de crafting se abrem: agora dá para esculpir o arquétipo.',
    teaches: 'Resistência a fogo + horda (AoE). Abre a árvore e o crafting.',
    dungeonId: 'd-crypt', levelReq: 8, unlocks: 'arvore',
  },
  {
    id: 'c-act2', act: 2, order: 2, title: 'Ato II — A Fornalha',
    intro:
      'Na Fornalha Rachada, poucos inimigos — porém enormes. Golpe grande fura armadura fina. Escolha bem as habilidades da sua arma antes de descer.',
    outcome:
      'Os brutos caíram. A Masmorra assíncrona plena se abre: agora dá para enviar o herói a qualquer destino e ler o relatório causal — o campo de provas da build.',
    teaches: 'Poucos-fortes + mitigação de golpe grande. Abre a Masmorra livre.',
    dungeonId: 'd-forge', levelReq: 18, unlocks: 'masmorra',
  },
  {
    id: 'c-act3', act: 3, order: 3, title: 'Ato III — A Geleira',
    intro:
      'O Sepulcro Glacial congela o tempo: o frio impõe controle e há inimigos que atacam do alto. Sua rotação e seu EHP serão testados de verdade.',
    outcome:
      'Você quebrou o gelo e a horda aérea. Correu a notícia: o Mercado dos Estrategistas agora negocia com você — comprar a peça certa é parte da build.',
    teaches: 'Frio/controle + voadores. Abre o Mercado.',
    dungeonId: 'd-glacier', levelReq: 30, unlocks: 'mercado',
  },
  {
    id: 'c-act4', act: 4, order: 4, title: 'Ato IV — A Fenda',
    intro:
      'A Fenda das Cinzas sangra caos — e o caos fura o escudo de energia. É o chefe multi-fase que separa aprendizes de estrategistas. Traga sua melhor build.',
    outcome:
      'A Fenda se fecha atrás de você. A campanha terminou; o endgame (o Atlas das Fendas) o aguarda — mas isso é outra jornada.',
    teaches: 'Caos (fura ES) + chefe multi-fase. Conclui a campanha.',
    dungeonId: 'd-abyss', levelReq: 42,
  },
]

/* ===================== MERCADO ===================== */

export const MARKET: MarketListing[] = [
  { id: 'm1', name: 'Guarda-Chama', baseId: 'ruby_ring', rarity: 'unique', price: 420, seller: 'ashen_v', lvl: 70 },
  { id: 'm2', name: 'Ceifador Trovejante', baseId: 'great_sword', rarity: 'rare', price: 1240, seller: 'tradehall_02', lvl: 72 },
  { id: 'm3', name: 'Manto do Náufrago', baseId: 'plate_chest', rarity: 'rare', price: 860, seller: 'nyx_market', lvl: 68 },
  { id: 'm4', name: 'Elo de Safira', baseId: 'copper_ring', rarity: 'magic', price: 95, seller: 'cold_dealer', lvl: 60 },
  { id: 'm5', name: 'Coração do Vulcão', baseId: 'amber_amulet', rarity: 'unique', price: 2100, seller: 'tradehall_02', lvl: 74 },
  { id: 'm6', name: 'Grevas Ligeiras', baseId: 'mail_greaves', rarity: 'magic', price: 55, seller: 'swift_boots', lvl: 52 },
]

/* ===================== ÚNICOS ===================== */

export const UNIQUES: UniqueTemplate[] = [
  {
    id: 'u_flameguard',
    name: 'Guarda-Chama',
    baseId: 'ruby_ring',
    itemLevel: 72,
    implicit: { fireRes: 28 },
    affixes: [
      { values: { fireRes: 49 }, text: '+49% resistência a fogo' },
      { values: { flatLife: 40 }, text: '+40 vida máxima' },
    ],
    flavor: '"O fogo lembra quem o desafiou."',
  },
]

const uniqueIndex: Record<string, UniqueTemplate> = Object.fromEntries(
  UNIQUES.map((u) => [u.id, u]),
)
export function getUnique(id: string): UniqueTemplate {
  const u = uniqueIndex[id]
  if (!u) throw new Error(`Único desconhecido: ${id}`)
  return u
}

/* ===================== INVENTÁRIO / EQUIPAMENTO INICIAIS ===================== */

function aff(groupId: string, kind: 'prefix' | 'suffix', tier: number, values: StatMods, text: string): RolledAffix {
  return { groupId, kind, tier, values, text }
}

let uidSeq = 0
function inst(
  baseId: string,
  rarity: Rarity,
  name: string,
  itemLevel: number,
  affixes: RolledAffix[],
  extra?: Partial<ItemInstance>,
): ItemInstance {
  uidSeq += 1
  return { uid: `it_${uidSeq}`, baseId, rarity, name, itemLevel, affixes, corrupted: false, ...extra }
}

/** Item único a partir do template (afixos e implícito fixos). */
export function makeUnique(uniqueId: string): ItemInstance {
  const u = getUnique(uniqueId)
  uidSeq += 1
  return {
    uid: `it_${uidSeq}`,
    baseId: u.baseId,
    rarity: 'unique',
    name: u.name,
    itemLevel: u.itemLevel,
    affixes: u.affixes.map((a) => ({ groupId: 'unique', kind: 'prefix' as const, tier: 0, values: a.values, text: a.text })),
    corrupted: false,
    uniqueId: u.id,
    flavor: u.flavor,
  }
}

export interface StarterState {
  equipped: Partial<Record<import('./types').EquipSlot, string>>
  inventory: ItemInstance[]
}

export function makeStarter(): StarterState {
  const weapon = inst('war_axe', 'rare', 'Britadora do Fosso', 74, [
    aff('added_phys', 'prefix', 3, { addedPhysMin: 15, addedPhysMax: 30 }, 'Adiciona 15–30 dano físico'),
    aff('inc_phys', 'prefix', 2, { incPhys: 58 }, '+58% dano físico aumentado'),
    aff('attack_speed', 'suffix', 4, { incAttackSpeed: 7 }, '+7% velocidade de ataque'),
    aff('crit_multi', 'suffix', 4, { critMulti: 18 }, '+18% multiplicador de crítico'),
  ], { quality: 20 })
  const head = inst('plate_helm', 'magic', 'Elmo do Vigia', 66, [
    aff('flat_life', 'prefix', 3, { flatLife: 96 }, '+96 vida máxima'),
    aff('cold_res', 'suffix', 4, { coldRes: 21 }, '+21% resistência a frio'),
  ])
  const gloves = inst('plate_gloves', 'magic', 'Manoplas Rachadas', 60, [
    aff('inc_armour', 'prefix', 4, { armour: 62 }, '+62 armadura'),
    aff('strength', 'suffix', 4, { strength: 16 }, '+16 Força'),
  ])
  const chest = inst('plate_chest', 'rare', 'Couraça das Cinzas', 72, [
    aff('flat_life', 'prefix', 1, { flatLife: 172 }, '+172 vida máxima'),
    aff('inc_armour', 'prefix', 2, { armour: 148 }, '+148 armadura'),
    aff('lit_res', 'suffix', 2, { litRes: 34 }, '+34% resistência a raio'),
    aff('fire_res', 'suffix', 4, { fireRes: 14 }, '+14% resistência a fogo'),
  ])
  const amulet = inst('amber_amulet', 'rare', 'Selo do Juramento', 70, [
    aff('strength', 'suffix', 2, { strength: 38 }, '+38 Força'),
    aff('lit_res', 'suffix', 2, { litRes: 28 }, '+28% resistência a raio'),
  ])
  const boots = inst('mail_greaves', 'rare', 'Passos de Brasa', 68, [
    aff('flat_life', 'prefix', 3, { flatLife: 118 }, '+118 vida máxima'),
    aff('cold_res', 'suffix', 2, { coldRes: 30 }, '+30% resistência a frio'),
    aff('fire_res', 'suffix', 4, { fireRes: 11 }, '+11% resistência a fogo'),
  ])
  const ring1 = inst('iron_ring', 'magic', 'Aro de Ferro-Vivo', 62, [
    aff('flat_life', 'prefix', 5, { flatLife: 44 }, '+44 vida máxima'),
    aff('cold_res', 'suffix', 4, { coldRes: 22 }, '+22% resistência a frio'),
  ])
  const ring2 = inst('copper_ring', 'common', 'Elo Trincado', 40, [])

  // No baú: o anel que resolve a derrota por fogo + material para craftar.
  const flameguard = makeUnique('u_flameguard')
  const rawChest = inst('plate_chest', 'common', 'Peitoral de Placas', 60, [])
  const magicDagger = inst('cinder_dagger', 'magic', 'Adaga Afiada', 58, [
    aff('inc_phys', 'prefix', 4, { incPhys: 28 }, '+28% dano físico aumentado'),
    aff('crit_chance', 'suffix', 4, { critChance: 11 }, '+11% chance de crítico'),
  ])

  return {
    equipped: {
      weapon: weapon.uid,
      head: head.uid,
      gloves: gloves.uid,
      chest: chest.uid,
      amulet: amulet.uid,
      boots: boots.uid,
      ring1: ring1.uid,
      ring2: ring2.uid,
    },
    inventory: [
      weapon, head, gloves, chest, amulet, boots, ring1, ring2,
      flameguard, rawChest, magicDagger,
    ],
  }
}

export const STARTER_CURRENCY = {
  transmutation: 24,
  alteration: 40,
  regal: 8,
  exalt: 5,
  chaos: 12,
  divine: 3,
  vaal: 4,
}

/* ===================== MUNDO VIVO (Portal) ===================== */
/**
 * O Portal é o hub do mundo persistente. Além de notícias e status, ele mostra
 * o que está acontecendo AGORA na liga: estado da temporada, mecânica sazonal
 * coletiva, eventos rotativos com timer, pulso econômico, ladder e um feed vivo.
 * Tudo demonstrativo por ora; futuramente vem do servidor. Ver docs/UX_IA.md.
 */

export interface SeasonState {
  name: string
  day: number
  totalDays: number
  phase: string
  endsInSec: number
}
export const SEASON: SeasonState = {
  name: META.league,
  day: 38,
  totalDays: 42,
  phase: 'Corrida — economia aberta',
  endsInSec: 3 * 86400 + 14 * 3600 + 22 * 60,
}

export interface SeasonMechanic {
  name: string
  blurb: string
  bossName: string
  collectivePct: number
  youPct: number
  fragmentLabel: string
  fragments: number
}
export const SEASON_MECHANIC: SeasonMechanic = {
  name: 'Fenda das Cinzas',
  blurb:
    'A liga inteira alimenta a fenda com fragmentos. Quando encher, o Guardião do Fosso desperta para todos, com tabela de drop própria por tempo limitado.',
  bossName: 'Guardião do Fosso',
  collectivePct: 63,
  youPct: 4,
  fragmentLabel: 'Fragmentos de Cinza',
  fragments: 27,
}

export type WorldEventKind = 'drop' | 'danger' | 'boss'
export interface WorldEvent {
  id: string
  name: string
  desc: string
  kind: WorldEventKind
  endsInSec: number
}
export const WORLD_EVENTS: WorldEvent[] = [
  { id: 'ev-frag', name: 'Chuva de Fragmentos', desc: 'A Fenda das Cinzas rende +50% de fragmentos.', kind: 'drop', endsInSec: 2 * 3600 + 14 * 60 },
  { id: 'ev-invasion', name: 'Invasão nas Docas', desc: 'Elites extras nas dungeons; chance de raro aumentada.', kind: 'danger', endsInSec: 47 * 60 },
  { id: 'ev-boss', name: 'O Carrasco desperta', desc: 'Chefe mundial disponível a todos por tempo limitado.', kind: 'boss', endsInSec: 5 * 3600 + 9 * 60 },
]

export interface EconomyPulse {
  divineName: string
  divineInChaos: number
  trendPct: number
  hotBase: string
  hotNote: string
}
export const ECONOMY: EconomyPulse = {
  divineName: 'Orbe Divino',
  divineInChaos: 214,
  trendPct: 6,
  hotBase: 'Espada Longa',
  hotNote: 'procura alta por bases de crítico',
}

export interface LadderRow {
  rank: number
  name: string
  cls: string
  score: string
  you?: boolean
}
export const LADDER: LadderRow[] = [
  { rank: 1, name: 'Kaelros', cls: 'Precisão', score: 'Prof. 214' },
  { rank: 2, name: 'Vheyra, a Cinza', cls: 'Marcial', score: 'Prof. 198', you: true },
  { rank: 3, name: 'Nyx Umbral', cls: 'Arcano', score: 'Prof. 187' },
  { rank: 4, name: 'Dain Ferro-Vivo', cls: 'Marcial', score: 'Prof. 176' },
]

export type FeedKind = 'drop' | 'record' | 'boss' | 'sale' | 'mechanic' | 'league'
export interface FeedEntry {
  id: string
  kind: FeedKind
  who: string
  text: string
  ago: string
}
/** Feed inicial (com "há X min"). O Portal vai prependando novos ao vivo. */
export const WORLD_FEED_SEED: FeedEntry[] = [
  { id: 'seed1', kind: 'record', who: 'Kaelros', text: 'alcançou Profundidade 214 no mapa infinito', ago: 'há 2 min' },
  { id: 'seed2', kind: 'sale', who: 'tradehall_02', text: 'vendeu Coração do Vulcão por 9 Divinos', ago: 'há 4 min' },
  { id: 'seed3', kind: 'boss', who: 'Nyx Umbral', text: 'derrotou o Guardião do Fosso (Hardcore)', ago: 'há 7 min' },
  { id: 'seed4', kind: 'drop', who: 'ashen_v', text: 'encontrou Guarda-Chama na Fornalha Rachada', ago: 'há 9 min' },
  { id: 'seed5', kind: 'mechanic', who: 'A Fenda', text: 'chegou a 63% — o Guardião se agita', ago: 'há 12 min' },
]
/** Modelos sorteados para alimentar o feed ao vivo (ago = "agora"). */
export const WORLD_FEED_POOL: Array<{ kind: FeedKind; who: string; text: string }> = [
  { kind: 'drop', who: 'CorvoCego', text: 'encontrou um Coração do Vulcão na Cripta dos Suspiros' },
  { kind: 'record', who: 'SellaVento', text: 'bateu recorde de menor tempo na Fornalha Rachada' },
  { kind: 'sale', who: 'nyx_market', text: 'vendeu uma Britadora do Fosso por 2 Divinos' },
  { kind: 'boss', who: 'Ossian', text: 'derrotou O Carrasco Ígneo em Hardcore' },
  { kind: 'mechanic', who: 'A Fenda', text: 'recebeu 1.400 fragmentos da liga neste minuto' },
  { kind: 'drop', who: 'LiraPrateada', text: 'corrompeu um anel e revelou um implícito raro com o Vaal' },
  { kind: 'league', who: 'DainFerro', text: 'abriu uma liga privada "Só Marcial, sem únicos"' },
  { kind: 'record', who: 'Kaelros', text: 'assumiu o topo do ranking de DPS do encontro padrão' },
  { kind: 'sale', who: 'cold_dealer', text: 'listou Grevas Ligeiras por 55 Caos no mercado' },
  { kind: 'boss', who: 'A Liga', text: 'está a poucos fragmentos de despertar o Guardião do Fosso' },
]

/* ===================== DASHBOARD DO PERSONAGEM ===================== */
/**
 * Dados demonstrativos do dashboard do herói (progressão, loadouts, histórico,
 * recordes, conquistas, estatísticas). Futuramente vêm do servidor/perfil.
 * A "build atual" na tela usa o estado REAL do jogo; isto aqui é a memória
 * do personagem — o que ele já passou. Ver docs/UX_IA.md e docs/PROGRESSION_AND_STORY.md.
 */

export interface Progression {
  xpPct: number
  xpLabel: string
  campaignAct: number
  campaignActs: number
  campaignPct: number
  depthRecord: number
  playtime: string
  daysInLeague: number
}
export const PROGRESSION: Progression = {
  xpPct: 62,
  xpLabel: '1,24 M / 2,00 M XP',
  campaignAct: 3,
  campaignActs: 6,
  campaignPct: 50,
  depthRecord: 198,
  playtime: '14h 32m',
  daysInLeague: 5,
}

export interface Loadout {
  id: string
  name: string
  focus: string
  weapon: string
  measuredDps: number | null
  updated: string
  active?: boolean
}
export const LOADOUTS: Loadout[] = [
  { id: 'l1', name: 'Rompe-Ferro', focus: 'Uso geral — físico de golpe único', weapon: 'Britadora do Fosso', measuredDps: null, updated: 'agora', active: true },
  { id: 'l2', name: 'Ceifa Veloz', focus: 'Limpeza rápida de grupos', weapon: 'Adaga de Brasa', measuredDps: 312, updated: 'há 2 dias' },
  { id: 'l3', name: 'Muralha', focus: 'Sobrevivência / chefe', weapon: 'Escudo Pavês + Maça', measuredDps: 176, updated: 'há 5 dias' },
]

export interface AttemptLog {
  id: string
  dungeon: string
  result: 'win' | 'loss'
  detail: string
  when: string
}
export const ATTEMPT_HISTORY: AttemptLog[] = [
  { id: 'a1', dungeon: 'Cripta dos Suspiros', result: 'loss', detail: 'morte por fogo · fase 2', when: 'há 12 min' },
  { id: 'a2', dungeon: 'Sepulcro Glacial', result: 'win', detail: '5m10s · sem mortes', when: 'há 40 min' },
  { id: 'a3', dungeon: 'Fornalha Rachada', result: 'loss', detail: 'morte por fogo · 2m41s', when: 'há 1h' },
  { id: 'a4', dungeon: 'Cripta dos Suspiros', result: 'win', detail: '4m02s · recorde pessoal', when: 'há 2h' },
  { id: 'a5', dungeon: 'Fenda das Cinzas', result: 'win', detail: 'chefe sazonal · 7m18s', when: 'ontem' },
]

export interface RecordEntry {
  label: string
  value: string
  rank: string
}
export const RECORDS: RecordEntry[] = [
  { label: 'Maior profundidade concluída', value: 'Prof. 198', rank: '#2 na liga' },
  { label: 'Menor tempo — Cripta dos Suspiros', value: '4m 02s', rank: '#7' },
  { label: 'Maior DPS — encontro padrão', value: '3,74 M', rank: '#3' },
  { label: 'Chefe sazonal', value: 'derrotado', rank: '—' },
]

export interface Achievement {
  id: string
  name: string
  desc: string
  done: boolean
}
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'ac1', name: 'Primeira Queda', desc: 'Perca uma dungeon e leia o relatório.', done: true },
  { id: 'ac2', name: 'Ajuste Fino', desc: 'Vença após uma derrota trocando um equipamento.', done: true },
  { id: 'ac3', name: 'Ferreiro', desc: 'Aplique 10 orbes de crafting.', done: true },
  { id: 'ac4', name: 'Corruptor', desc: 'Corrompa um item com o Orbe Vaal.', done: false },
  { id: 'ac5', name: 'Explorador', desc: 'Alcance profundidade 250 no mapa infinito.', done: false },
]

export interface LifetimeStats {
  attempts: number
  wins: number
  deaths: number
  bossKills: number
  itemsFound: number
  favoriteSkill: string
}
export const LIFETIME: LifetimeStats = {
  attempts: 143,
  wins: 96,
  deaths: 47,
  bossKills: 12,
  itemsFound: 812,
  favoriteSkill: 'Golpe Rompedor',
}
