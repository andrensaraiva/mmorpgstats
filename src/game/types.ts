/* =========================================================
   BuildsWar :: contratos do domínio (protótipo único)
   A build sai 100% do que o jogador equipa + aloca + socketa.
   Nada aqui é balanceamento final; ids/versões são estáveis.
   ========================================================= */

export type ViewId =
  | 'portal'
  | 'campanha'
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

/* ---------- progressão / campanha (P1) ---------- */

/** Sistemas que a campanha destrava, um por marco. Ver PROGRESSION_AND_STORY §2.4. */
export type SystemId =
  | 'equipamento'
  | 'arvore'
  | 'habilidades'
  | 'mercado'
  | 'masmorra'

/**
 * Um nó da campanha (P1): um encontro narrativo que reusa uma dungeon existente,
 * dá XP/loot garantidos ao vencer e pode desbloquear um sistema.
 */
export interface CampaignNode {
  id: string
  act: number
  order: number
  title: string
  /** Texto de abertura (setup lido antes de enviar). */
  intro: string
  /** Texto de desfecho (lido no relatório de vitória). */
  outcome: string
  /** A mecânica que este nó ensina (uma linha). */
  teaches: string
  /** Dungeon reusada como encontro. */
  dungeonId: string
  /** Nível mínimo sugerido para o encontro. */
  levelReq: number
  /** Sistema destravado ao concluir (opcional). */
  unlocks?: SystemId
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
  // Dano plano adicionado por tipo elemental/caos (M1).
  | 'addedFireMin'
  | 'addedFireMax'
  | 'addedColdMin'
  | 'addedColdMax'
  | 'addedLightningMin'
  | 'addedLightningMax'
  | 'addedChaosMin'
  | 'addedChaosMax'
  // Dano aumentado (aditivo) por tipo e o guarda-chuva elemental (M1).
  | 'incFire'
  | 'incCold'
  | 'incLightning'
  | 'incChaos'
  | 'incElemental'
  // Dano de DoT/ailment aumentado (M3) — guarda-chuva de sangramento/queimadura/veneno.
  | 'incDot'
  // Dano de fontes externas aumentado (M4): minions e totens/balista.
  | 'incMinion'
  | 'incTotem'
  // Penetração da resistência do alvo por tipo (M1).
  | 'firePen'
  | 'coldPen'
  | 'lightningPen'
  | 'chaosPen'
  | 'incAttackSpeed'
  | 'critChance'
  | 'critMulti'
  | 'flatLife'
  | 'incLife'
  | 'armour'
  // Camadas de defesa reais (M2): evasão e escudo de energia (plano + aumentado).
  | 'evasion'
  | 'incEvasion'
  | 'energyShield'
  | 'incEnergyShield'
  | 'block'
  | 'fireRes'
  | 'coldRes'
  | 'litRes'
  | 'chaosRes'
  | 'strength'
  | 'dexterity'
  | 'intelligence'
  | 'supportCap'
  | 'moreDamage'
  | 'lessDamage'
  // Famílias de afixo do item rico (S1).
  | 'moveSpeed'
  | 'flatMana'
  | 'stunThreshold'

export type StatMods = Partial<Record<StatKey, number>>

/* ---------- bases de item ---------- */

/** Tipos de arma (S3): governam quais habilidades ficam disponíveis. */
export type WeaponType =
  | 'axe'
  | 'mace'
  | 'sword'
  | 'dagger'
  | 'bow'
  | 'crossbow'
  | 'staff'
  | 'wand'

/** Defesas base de um item (S1) — antes de afixos/qualidade. */
export interface BaseDefences {
  armour?: number
  evasion?: number
  energyShield?: number
}

/** Requisitos da base para equipar (S1). Afixos não mudam requisito. */
export interface ItemRequirements {
  level?: number
  str?: number
  dex?: number
  int?: number
}

export interface ItemBase {
  id: string
  name: string
  kind: BaseKind
  itemClass: ItemClass
  /** Tipo de arma (S3) — só armas; decide o pool de habilidades. */
  weaponType?: WeaponType
  /** Contrato de assets: id do ícone (Fase A). Ausente = deriva de `kind`. */
  icon?: string
  /** Dano físico base + velocidade de ataque (só armas). */
  weapon?: { physMin: number; physMax: number; attackSpeed: number }
  /** Defesas base (S1) — armadura/evasão/ES; qualidade as amplifica. */
  defences?: BaseDefences
  /** Requisitos para equipar (S1). */
  requires?: ItemRequirements
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
  /**
   * Afixo EXCEPCIONAL (só-dropa): ~1.5× o topo do normal, NÃO craftável — só cai
   * de encontros (a camada aspiracional de caça a gear). Ver ARPG_RESEARCH §8.5.
   */
  exceptional?: boolean
}

/* ---------- instância de item ---------- */

export interface ItemInstance {
  uid: string
  baseId: string
  rarity: Rarity
  itemLevel: number
  /** Qualidade 0–20% (S1) — amplifica as defesas/dano da base. */
  quality?: number
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

/** Marca/exposição temporária aplicada ao alvo — a moeda do combo setup→payoff. */
export type MarkId = 'exposure'

/**
 * Ailments/DoT (M3). Cada um é um dano ao longo do tempo derivado do golpe:
 * sangramento (físico), queimadura (fogo), veneno (caos). Veneno **empilha**
 * (soma as aplicações); sangramento/queimadura **refrescam** (vale a mais forte
 * recente). Ver COMBAT_AND_ARCHETYPES §A2. Mapa tipo/comportamento no engine.
 */
export type AilmentId = 'bleed' | 'ignite' | 'poison'

/**
 * Requisito de uma habilidade (S3): a arma equipada e/ou o nível mínimo.
 * Sem `weapon` = serve para qualquer arma. Ver EQUIPMENT_SKILLS §5.
 */
export interface SkillRequirement {
  /** Tipos de arma que liberam a skill (qualquer um deles). Ausente = todas. */
  weapon?: WeaponType[]
  /** Nível mínimo do herói. */
  level?: number
}

/**
 * Fonte de dano externa (M4): não é o golpe próprio do herói, luta por conta.
 * Minions (esqueletos/feras) e totens/balista têm orçamento de dano próprio e
 * contribuem um DPS contínuo, independente da rotação ("posiciona e esquece").
 */
export type SourceKind = 'minion' | 'totem'

export interface SkillDefinition {
  id: string
  name: string
  type: SkillType
  glyph: string
  tags: string[]
  meta: string
  desc: string
  /** Multiplicador de dano da habilidade (0 = utilitária, ignorada pela sim de DPS). */
  damageMult: number
  /**
   * Tipo do dano da skill (M1). Default `phys`. Ataques físicos escalam com o
   * dano da arma; skills de tipo elemental/caos usam `baseDamage` próprio e não
   * herdam o físico da arma (mas ainda somam o `added{Tipo}` de afixos).
   */
  damageType?: DamageType
  /**
   * Dano-base próprio da skill por conjuração (min/max), para skills que NÃO
   * escalam com a arma física (ex.: magias elementais). Ausente = usa a arma.
   */
  baseDamage?: { min: number; max: number }
  /** Custo de recurso por uso (0 = grátis). */
  cost: number
  /** Recarga em segundos (0 = sem cooldown). */
  cooldown: number
  /**
   * Tempo base de execução (s). `0` = ataque guiado pela velocidade de ataque
   * da build (o motor usa 1/vel.ataque); `>0` = conjuração de duração fixa.
   */
  castTime: number
  /** Combo (setup): marca que a skill aplica no alvo ao ser usada. */
  applies?: MarkId
  /** Duração (s) da marca aplicada por `applies`. */
  appliesDuration?: number
  /** Combo (payoff): marca que empodera esta skill enquanto estiver ativa no alvo. */
  empoweredBy?: MarkId
  /** % de `more` de dano ganho enquanto a marca de `empoweredBy` está ativa. */
  comboMore?: number
  /** Ailment/DoT que os golpes desta skill aplicam (M3). */
  ailment?: AilmentId
  /** Fração do dano do golpe (do tipo do ailment) que vira dano-por-segundo de DoT. */
  ailmentMult?: number
  /** Duração (s) do ailment aplicado. */
  ailmentDuration?: number
  /** Requisito de arma/nível (S3): decide se a skill está disponível. */
  requires?: SkillRequirement
  /** Fonte externa (M4): minion/totém. Contribui DPS contínuo, fora da rotação. */
  source?: SourceKind
  /** Dano por golpe da fonte (min/max). */
  sourceDamage?: { min: number; max: number }
  /** Golpes por segundo da fonte. */
  sourceRate?: number
  /** Tipo do dano da fonte (default `phys`). */
  sourceDamageType?: DamageType
  /** Suportes iniciais equipados. */
  defaultSockets: string[]
}

/**
 * Uma ativa no loadout de combate: a skill + seus suportes soquetados.
 * A ordem no array é a **prioridade** da rotação (o motor escolhe a primeira
 * que estiver pronta a cada ação).
 */
export interface SkillSlot {
  skillId: string
  supports: string[]
}

/** O boneco de treino: as defesas do alvo contra as quais o DPS é medido. */
export interface TargetProfile {
  /** Armadura do alvo — mitiga físico (dependente do tamanho do golpe). */
  armour: number
  /** Resistências do alvo por tipo (prontas para o M1; hoje o dano é só físico). */
  fireRes?: number
  coldRes?: number
  litRes?: number
  chaosRes?: number
}

/** O limitador dominante do DPS de uma rotação (diagnóstico do boneco). */
export type RotationBottleneck = 'recurso' | 'cooldown' | 'combo' | 'nenhum'

/** Um evento na linha do tempo da simulação (opcional, p/ debug/visual). */
export interface TickEvent {
  t: number
  skillId: string
  damage: number
  empowered: boolean
  /** Caiu no ataque básico por falta de recurso. */
  starved: boolean
}

/** Saída do simulador de rotação — o DPS medido + o diagnóstico exibido no boneco. */
export interface RotationResult {
  /** DPS medido pela simulação (alimenta a mecânica de números descobertos). */
  dps: number
  /** Segundos efetivamente simulados. */
  window: number
  /** Dano e usos por skill (inclui o ataque básico de fallback), maior→menor. */
  perSkill: Array<{ skillId: string; casts: number; damage: number; share: number }>
  /** Fração do tempo (0–1) com a marca de combo ativa. */
  comboUptime: number
  /** Fração das ações (0–1) que não caíram no básico por falta de recurso. */
  resourceUptime: number
  /** O limitador dominante do DPS. */
  bottleneck: RotationBottleneck
  /** DPS por tipo de dano (M1) — para a leitura elemental/físico do boneco. */
  damageByType: DamageByType
  /** DPS de DoT/ailment (M3), já incluído no `dps`. Parcela contínua. */
  dotDps: number
  /** DPS de fontes externas (M4): minions + totens/balista, já incluído no `dps`. */
  sourceDps: number
  /** Linha do tempo (opcional). */
  timeline?: TickEvent[]
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

/* ---------- tipos de dano ---------- */

/**
 * Os cinco tipos do gênero (PoE2/LE). `phys` é parado por armadura;
 * fire/cold/lightning por resistências; `chaos` fura o escudo de energia.
 * Ver docs/BESTIARY_AND_DUNGEONS.md §2.
 */
export type DamageType = 'phys' | 'fire' | 'cold' | 'lightning' | 'chaos'

export type DamageProfile = Partial<Record<DamageType, number>>

/* ---------- bestiário ---------- */

/** Papel do inimigo no encontro (arquétipos, à la Diablo 4). */
export type MonsterRole = 'swarmer' | 'bruiser' | 'ranged' | 'caster' | 'support' | 'aerial'

/** Categoria de poder do inimigo. */
export type MonsterRank = 'normal' | 'elite' | 'boss'

/** Tamanho do golpe — interage com a armadura (grande fura, pequeno é mitigado). */
export type HitSize = 'small' | 'medium' | 'huge'

/** Afixo de elite (à la Diablo 4): muda o contrajogo, pode somar um tipo de dano. */
export interface MonsterAffix {
  id: string
  name: string
  effect: string
  addsDamageType?: DamageType
}

/** Fase de chefe: seu próprio perfil de dano e um ponteiro de leitura. */
export interface BossPhase {
  damage: DamageProfile
  note: string
}

export interface Monster {
  id: string
  name: string
  role: MonsterRole
  rank: MonsterRank
  /** Perfil de dano do inimigo → define quais defesas o herói precisa. */
  damage: DamageProfile
  hitSize: HitSize
  life: number
  /** Tipos contra os quais este inimigo é vulnerável / resistente. */
  weakTo?: DamageType[]
  resistant?: DamageType[]
  /** Presente quando rank === 'elite'. */
  affixes?: MonsterAffix[]
  /** Presente quando rank === 'boss'. */
  phases?: BossPhase[]
  /** Voa: imune a dano de chão; exige dano que atinge o ar. */
  aerial?: boolean
}

/* ---------- dungeons ---------- */

/** Densidade de pacotes (esparso → enxame). */
export type Density = 'sparse' | 'medium' | 'swarm'

/** Perfil de força do encontro. */
export type ForceProfile = 'weak-horde' | 'mixed' | 'few-strong'

/** Quanto o encontro exige mobilidade (kite, dash, fechar distância). */
export type MobilityDemand = 'low' | 'medium' | 'high'

/** A "receita" do encontro — o preview que o jogador vê antes de enviar o herói. */
export interface DungeonComposition {
  density: Density
  forceProfile: ForceProfile
  /** Tipos de dano presentes → quais resistências/defesas são obrigatórias. */
  damageMix: DamageType[]
  /** Há inimigos voadores? Derruba builds de chão. */
  hasAerial: boolean
  mobilityDemand: MobilityDemand
  /** Arquétipos presentes no encontro. */
  roles: MonsterRole[]
  /** Ondas para preview: qual monstro e quantos. */
  waves: Array<{ monsterId: string; count: number }>
}

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
  /** Composição/bestiário do encontro (preview + balanceamento por ameaça). */
  composition?: DungeonComposition
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
  /** Evasão total (M2) — vira chance de esquiva pelo tamanho do golpe do alvo. */
  evasion: number
  /** Escudo de energia (M2) — buffer que absorve antes da vida. */
  energyShield: number
  block: number
  attackSpeed: number
  critChance: number
  critMulti: number
  fireRes: number
  coldRes: number
  litRes: number
  chaosRes: number
  strength: number
  dexterity: number
  intelligence: number
  supportCap: number
  /** Recurso máximo (mana/energia) que custeia as skills da rotação. */
  resourceMax: number
  /** Regeneração de recurso por segundo. */
  resourceRegen: number
  /** Penetração de resistência por tipo (M1) — reduz a res. efetiva do alvo. */
  firePen: number
  coldPen: number
  lightningPen: number
  chaosPen: number
}

/** Distribuição do DPS por tipo de dano (M1) — para o diagnóstico do boneco. */
export type DamageByType = Partial<Record<DamageType, number>>

/** DPS medido para um fingerprint específico (mecânica de números descobertos). */
export interface Measured {
  fingerprint: string
  dps: number
}

/** Por que a tentativa terminou como terminou — "o que aconteceu e por quê". */
export type FailReason =
  | 'none'
  | 'damage-type' // uma camada quebrou contra um tipo de dano
  | 'attrition' // não morreu de golpe, mas o tempo/dano acumulado venceu
  | 'stall' // não conseguiu limpar (ex.: voadores sem dano-no-ar)
  | 'control' // ficou imobilizado (CC) e perdeu a corrida limpar×morrer

export interface DungeonOutcome {
  seconds: number
  survivable: boolean
  /** Causa da falha (para o relatório causal — ver docs/BESTIARY_AND_DUNGEONS.md §6). */
  reason: FailReason
  /** Tipo de dano que quebrou a defesa, quando reason === 'damage-type'. */
  breakingType?: DamageType
  /** Frase pronta explicando a causa e um delta acionável. */
  cause: string
}

/**
 * Métricas completas da tentativa (o checklist do MVP §10.4). Saem todas da
 * simulação de combate por ticks — o lado defensivo do motor (R4).
 */
export interface DungeonReport {
  enemiesDefeated: number
  totalMonsters: number
  /** Dano total recebido (mitigado) durante a tentativa. */
  damageTaken: number
  potionsUsed: number
  /** Segundos que o herói passou imobilizado por controle. */
  timeControlled: number
  avgDps: number
  /** Pico de DPS (estimado a partir do combo). */
  peakDps: number
  /** Dano recebido por segundo (mitigado). */
  incomingDps: number
  /** Tempo-para-limpar (base) e tempo-para-morrer (Infinity se sobrevive). */
  tClear: number
  tDie: number
}

/** Resultado do combate simulado da dungeon: o outcome + o relatório rico. */
export interface DungeonRun extends DungeonOutcome {
  report: DungeonReport
}

/* ---------- replay / minimapa da tentativa ---------- */

/** O que um marcador do minimapa representa. */
export type MarkerKind =
  | 'player'
  | 'enemy' // pack de inimigos comuns
  | 'elite'
  | 'boss'
  | 'loot' // drop notável (raro/único)

/**
 * Marcador estático no minimapa: uma posição (0–100 em x/y) e o momento
 * (0–1 do progresso) em que passa a ser "alcançado/ativo" na animação.
 */
export interface ReplayMarker {
  id: string
  kind: MarkerKind
  x: number
  y: number
  /** Progresso (0–1) em que o marcador é revelado/resolvido. */
  at: number
  /** Rótulo curto para tooltip (nome do monstro/loot). */
  label: string
  /** Só para loot: raridade, para colorir. */
  rarity?: Rarity
}

/**
 * Replay leve e determinístico de uma tentativa: a rota do herói pelos
 * marcadores. A UI interpola a posição do herói ao longo de `path` conforme
 * o progresso, "acendendo" os marcadores cujo `at` já passou.
 * Ver docs/DUNGEON_REPLAY.md.
 */
export interface DungeonReplay {
  /** Todos os marcadores (inclui o player como origem). */
  markers: ReplayMarker[]
  /** Sequência de pontos {x,y} que o herói percorre (a "rota"). */
  path: Array<{ x: number; y: number }>
  /** Progresso (0–1) em que a tentativa termina (morte antecipada < 1). */
  endsAt: number
  /** Vitória? (espelha o outcome; morte para a rota antes do fim.) */
  win: boolean
}
