# Catálogo de Conteúdo — Starter Set da Liga 1

- **Pergunta que este doc responde:** que **conteúdo concreto** o jogo lança na **primeira liga**? Classes, personagens, tipos de arma, bases de item, famílias de afixo, **runas**, **amuletos/joalheria**, **poções/frascos** e **únicos** — um **starter set** pensado para dar suporte às **builds/arquétipos que já escolhemos**, e um **começo** ao qual novas ligas somam.
- **Data:** 01 de julho de 2026
- **Escopo (decidido):** **3 classes do MVP** (Marcial · Precisão · Arcano), cada uma alcançando vários arquétipos por **arma + árvore + suportes**. O roster completo de 6 classes fica registrado como **plano pós-liga** (§10).
- **Relacionados:** [Motor & Arquétipos](./COMBAT_AND_ARCHETYPES.md) · [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md) · [Bestiário & Dungeons](./BESTIARY_AND_DUNGEONS.md) · [Progressão](./PROGRESSION_AND_STORY.md) · [Endgame](./ENDGAME.md) · [Pesquisa de Gênero](./ARPG_RESEARCH.md) · [Referência PoE2](./POE2_REFERENCE_ARCHITECTURE.md) · [MVP](./MVP.md)

> **Princípio de continuidade.** Este catálogo é um **superconjunto** do que já está em [`src/game/content.ts`](../src/game/content.ts) — não uma invenção paralela. Ids existentes (`war_axe`, `great_sword`, `cinder_dagger`, `ruby_ring`, `sk_strike`…) são **mantidos**; o resto **estende** o mesmo modelo (`ItemBase`, `AffixGroup`, `SkillDefinition`, `UniqueTemplate`, `DamageType`). Novos campos (weaponType, runas, frascos) já estão previstos em [EQUIPMENT_SKILLS_DESIGN §6](./EQUIPMENT_SKILLS_DESIGN.md).

> **Filosofia de balanceamento (dos líderes):** *poucas ativas com sinergia forte*, *trade-off > número maior*, *fantasia forte cedo*, *um arquétipo de DoT e um de minions desde cedo*. Ver [COMBAT_AND_ARCHETYPES §B3](./COMBAT_AND_ARCHETYPES.md).

---

## 1. Mapa arquétipo → conteúdo (a espinha do catálogo)

Cada arquétipo amado (de [COMBAT_AND_ARCHETYPES §B1](./COMBAT_AND_ARCHETYPES.md)) recebe **arma + skills + afixos + runa + único** que o tornam jogável **na Liga 1**. As 3 classes cobrem estes arquétipos:

| Arquétipo (Liga 1) | Classe | Arma-chave | Dano | Runa temática | Único âncora |
|---|---|---|---|---|---|
| **Investida / sangramento** | Marcial | machado/maça 2H | físico + sangramento | Runa de Sangue | Fome-de-Ferro (§8) |
| **Guardião / bloqueio** | Marcial | maça 1H + escudo | físico + cura | Runa de Ferro | Baluarte Imóvel |
| **Arqueiro crítico (raio)** | Precisão | arco | físico→raio + crítico | Runa de Tempestade | Olho da Tempestade |
| **Explosões / AoE** | Precisão | besta | físico/fogo em área | Runa de Estilhaço | Estopim Gêmeo |
| **Assassino / armadilha** | Precisão | adaga | físico/caos + veneno | Runa de Presa | Beijo da Víbora |
| **Elementalista (screen-clear)** | Arcano | cajado/foco | fogo/frio/raio | Runa de Cinza / Geada / Fagulha | Coração do Vulcão (§8) |
| **Pestilência / DoT** | Arcano | foco + adaga | caos/veneno (DoT) | Runa de Praga | Sopro Pútrido |

> **Cobertura de tipos de dano** ([BESTIARY §2](./BESTIARY_AND_DUNGEONS.md)): a Liga 1 já entrega **físico, fogo, frio, raio e caos** — nenhuma dungeon será vencível só com um tipo, e cada classe tem caminho para ≥2 tipos. **Minions/totens** ficam para a classe **Invocador/Feral** (pós-liga, §10) — respeitando "um DoT desde cedo" (Pestilência) e adiando minions sem quebrar o motor (M4).

---

## 2. Classes & personagens

### 2.1 As 3 classes (identidade, atributo, arma inicial, ascendências)

| Classe | Fantasia | Atributo primário | Proficiência inicial | Ascendências (marco da campanha) |
|---|---|---|---|---|
| **Marcial** | guerreiro que resolve na força e no aço | **Força** | machado, maça, espada, escudo | **Furioso** (investida/sangramento) · **Baluarte** (bloqueio/cura) |
| **Precisão** | caçador de reflexo e cálculo | **Destreza** | arco, besta, adaga, armadilha | **Perseguidor** (arco crítico de raio) · **Engenhoso** (besta/armadilha/AoE) |
| **Arcano** | conjurador dos elementos e da praga | **Inteligência** | cajado, foco (varinha/orbe) | **Elementalista** (fogo/frio/raio) · **Pestilento** (caos/veneno DoT) |

Cada classe: **origem própria na árvore passiva** (a árvore atual é a da Marcial — ganha dois novos "braços" de origem), **tendência de atributos**, e **2 ascendências** desbloqueadas nos marcos da campanha ([PROGRESSION §2.4](./PROGRESSION_AND_STORY.md)). **Suportes não têm restrição de classe** (só tag/atributo) — a liberdade que os jogadores elogiam.

### 2.2 Personagens pré-fabricados (onboarding)

Um personagem-exemplo por classe (nome/flavor, não "build pronta" — o poder ainda sai do que o jogador equipa). O protótipo já tem **Vheyra, a Cinza** (Marcial). Adicionar:

- **Marcial — Vheyra, a Cinza** *(já existe)* — "Rompe-Ferro".
- **Precisão — Ryn, o Fio** — "Conta cada flecha; nenhuma erra duas vezes."
- **Arcano — Móira das Brumas** — "A chama e a praga obedecem à mesma voz."

---

## 3. Tipos de arma (weaponType) e o leque de skills

Introduz `weaponType` nas bases (previsto em [EQUIPMENT_SKILLS_DESIGN §5.1](./EQUIPMENT_SKILLS_DESIGN.md)). **A arma equipada abre o leque de skills.** Liga 1:

| weaponType | Classe natural | Mão | Papel | Tipo de dano típico |
|---|---|---|---|---|
| `axe` | Marcial | 1H/2H | físico + sangramento | físico |
| `mace` | Marcial | 1H/2H | físico + atordoamento | físico |
| `sword` | Marcial | 1H | físico + crítico | físico |
| `shield` (offhand) | Marcial | off | bloqueio/armadura | — |
| `bow` | Precisão | 2H | projétil crítico | físico→raio |
| `crossbow` | Precisão | 2H | explosões/AoE, recarga | físico/fogo |
| `dagger` | Precisão | 1H | burst/veneno/esquiva | físico/caos |
| `staff` | Arcano | 2H | conjuração elemental | fogo/frio/raio |
| `focus` (varinha/orbe) | Arcano | 1H/off | conjuração + escudo de energia | elemental/caos |

Cada skill declara `requires: { weapon?: weaponType[]; class?; level }` e libera por **tier de nível** (linhas I/IV/VII… do print de gemas). Abaixo do requisito, aparece **travada**.

---

## 4. Bases de item (ItemBase)

### 4.1 Existentes (mantidas) — [content.ts](../src/game/content.ts)
`war_axe`, `great_sword`, `cinder_dagger`, `kite_shield`, `plate_helm`, `plate_gloves`, `plate_chest`, `mail_greaves`, `amber_amulet`, `iron_ring`, `ruby_ring`, `copper_ring`.

### 4.2 Novas bases para cobrir as 3 classes e os slots de paridade

**Armas (por weaponType e defesa/dano):**

| Base (novo id) | weaponType | Implícito sugerido | Serve ao arquétipo |
|---|---|---|---|
| `battle_mace` | mace (2H) | +18% dano físico; chance de atordoar | Investida/Guardião |
| `heavy_maul` | mace (2H) | +tamanho de golpe (dano vs bruiser) | Investida |
| `recurve_bow` | bow (2H) | +8% chance de crítico | Arqueiro crítico |
| `siege_crossbow` | crossbow (2H) | adiciona 5–10 dano de fogo | Explosões/AoE |
| `venom_dagger` | dagger (1H) | +chance de veneno | Assassino/DoT |
| `ember_staff` | staff (2H) | adiciona X dano de fogo às magias | Elementalista |
| `frost_focus` | focus (off/1H) | +escudo de energia; +res. a frio | Elementalista/Pestilento |

**Armaduras por classe (peso Str/Dex/Int, à la PoE2 armour/evasion/energyShield):**

| Base | Slot | Defesa base | Classe alvo |
|---|---|---|---|
| `hide_vest` / `hide_boots` / `hide_cap` / `hide_grips` | chest/boots/head/gloves | **evasão** | Precisão |
| `silk_robe` / `silk_slippers` / `silk_hood` / `silk_wraps` | chest/boots/head/gloves | **escudo de energia** | Arcano |
| (placas existentes) | — | **armadura** | Marcial |
| `buckler` | offhand | evasão + bloqueio menor | Precisão |

**Slots de paridade novos** ([EQUIPMENT_SKILLS_DESIGN §2](./EQUIPMENT_SKILLS_DESIGN.md)): **cinto** (`heavy_belt`, `utility_sash`) e **2 frascos** (§7).

> **Campos ricos** (de [EQUIPMENT_SKILLS_DESIGN §4](./EQUIPMENT_SKILLS_DESIGN.md)) a adicionar às bases: `armour`/`evasion`/`energyShield`, `quality` (0–20%), `reqLevel`/`reqStr`/`reqDex`/`reqInt`.

---

## 5. Famílias de afixo (AffixGroup)

### 5.1 Existentes (mantidas)
`added_phys`, `inc_phys`, `flat_life`, `inc_life`, `inc_armour`, `attack_speed`, `crit_multi`, `crit_chance`, `fire_res`, `cold_res`, `lit_res`, `strength`, `block_suffix`.

### 5.2 Novas famílias (para cobrir tipos de dano, defesas e QoL do print)

**Ofensivas (destravam elemental/caos/DoT — dependem de M1/M3 do motor):**
- `added_fire` / `added_cold` / `added_lightning` — "Adiciona X–Y dano de fogo/frio/raio" (armas + anéis).
- `added_chaos` — "Adiciona X–Y dano de caos".
- `inc_elemental` / `inc_spell` — "+% dano elemental / de magia aumentado".
- `inc_dot` / `inc_ailment` — "+% dano de DoT / de sangramento-veneno-queimadura".
- `penetration` — "Ignora X% de resistência elemental do inimigo" (suffix aspiracional).
- `cast_speed` — "+% velocidade de conjuração".

**Defensivas (camadas de EHP — dependem de M2):**
- `chaos_res` — "+% resistência a caos" (o tipo que fura ES — ver [BESTIARY §2](./BESTIARY_AND_DUNGEONS.md)).
- `inc_evasion` / `flat_evasion` / `inc_es` / `flat_es` — evasão e escudo de energia.
- `all_res` — "+% a todas as resistências elementais" (já existe implícito no `copper_ring`; virar família).
- `stun_threshold` — "+% limiar de atordoamento".

**Atributos & QoL:**
- `dexterity` / `intelligence` — (já existe `strength`; espelhar).
- `move_speed` — "+% velocidade de movimento" (botas) → alimenta a **mobilidade** exigida por dungeons ([BESTIARY §4](./BESTIARY_AND_DUNGEONS.md)).
- `max_mana` / `inc_mana` — recurso do Arcano.
- `item_rarity` — "+% raridade de itens encontrados".

### 5.3 Afixo excepcional (só dropa) — de [ARPG_RESEARCH §6.1](./ARPG_RESEARCH.md)
Uma camada de topo: versão ~1,5× mais forte de uma família, marcada `exceptional: true`, que **não pode ser craftada** — só cai no endgame. Dá **caça a gear**, não só a moeda. Ex.: `added_phys` excepcional na arma.

---

## 6. Runas (trilho determinístico de crafting)

Novo sistema (de [EQUIPMENT_SKILLS_DESIGN §8.5](./EQUIPMENT_SKILLS_DESIGN.md) + [ARPG_RESEARCH §6.2](./ARPG_RESEARCH.md)): **runas soquetáveis** com traço **local e determinístico** — o jogador **mira** o afixo. Complementa o gamble dos orbes já existentes.

| Runa (Liga 1) | Soquete em | Efeito determinístico | Arquétipo servido |
|---|---|---|---|
| **Runa de Ferro** | arma/armadura | +armadura / +dano físico | Marcial/Guardião |
| **Runa de Sangue** | arma | +chance/dano de sangramento | Investida |
| **Runa de Cinza** | arma/foco | adiciona dano de fogo | Elementalista |
| **Runa de Geada** | arma/foco | adiciona dano de frio + chance de chill | Elementalista |
| **Runa de Fagulha** | arma/foco | adiciona dano de raio + chance de shock | Arqueiro/Elementalista |
| **Runa de Praga** | arma/adaga | +chance/dano de veneno | Pestilência/Assassino |
| **Runa de Tempestade** | arco | converte parte do físico em raio | Arqueiro crítico |
| **Runa de Estilhaço** | besta | +dano em área | Explosões/AoE |
| **Runa da Rocha** | armadura/cinto | +res. a todos os elementos (menor) | qualquer (camada) |

Modelo: base ganha `runeSockets: number`; runa é um item consumível que aplica `StatMods` fixos ao ser encaixada. **Encaixar é reversível/custoso** (decisão de meta a afinar).

---

## 7. Amuletos, anéis e joalheria (jewellery)

Joalheria carrega **implícitos temáticos** + afixos de qualquer eixo — é onde a build **fecha resistências** e **adiciona dano elemental**.

| Base (id) | Tipo | Implícito | Papel |
|---|---|---|---|
| `amber_amulet` *(existe)* | amuleto | +Força | Marcial |
| `jade_amulet` | amuleto | +Destreza | Precisão |
| `lapis_amulet` | amuleto | +Inteligência | Arcano |
| `citrine_amulet` | amuleto | +Str e +Dex | híbrido |
| `agate_amulet` | amuleto | +% dano elemental | caster |
| `iron_ring` *(existe)* | anel | adiciona dano físico | físico |
| `ruby_ring` *(existe)* | anel | +res. a fogo | anti-fogo |
| `sapphire_ring` | anel | +res. a frio | anti-frio |
| `topaz_ring` | anel | +res. a raio | anti-raio |
| `amethyst_ring` | anel | +res. a **caos** | anti-caos (fura-ES) |
| `copper_ring` *(existe)* | anel | +6% todas as res. elementais | flex |
| `two_stone_ring` | anel | +res. a 2 elementos | fecha 2 resistências |

> **Charm/talismã** (slot extra opcional de [EQUIPMENT_SKILLS_DESIGN §2](./EQUIPMENT_SKILLS_DESIGN.md)) fica para fase posterior.

---

## 8. Poções / Frascos (flasks)

2 slots de frasco ([EQUIPMENT_SKILLS_DESIGN §2](./EQUIPMENT_SKILLS_DESIGN.md)): efeito **ativo** consumido por carga + **afixos próprios**. No modelo assíncrono, o uso é regido pelas **regras de comportamento** que já existem (`BEHAVIOR`: "SE vida < 40% → usar Poção de Vida").

**Frascos base (Liga 1):**

| Frasco | Efeito | Regra de uso típica |
|---|---|---|
| **Poção de Vida** | recupera X vida ao longo de Ns | vida < 40% |
| **Poção de Mana** | recupera recurso | recurso < 20% |
| **Frasco de Granito** | +armadura por Ns | contra bruiser/golpe grande |
| **Frasco de Quartzo** | +evasão / +velocidade por Ns | contra ranged/aéreo (mobilidade) |
| **Frasco de Rubi/Safira/Topázio** | +res. a fogo/frio/raio por Ns | fases elementais de chefe |
| **Frasco de Prata** | +velocidade de movimento por Ns | dungeons de mobilidade alta |

**Afixos de frasco:** duração aumentada, recuperação instantânea, "remove sangramento/queimadura/veneno ao usar", carga extra. Isso liga frasco à **defesa por tipo** e à **composição** da dungeon ([BESTIARY §4](./BESTIARY_AND_DUNGEONS.md)).

---

## 9. Únicos (UniqueTemplate) — um por arquétipo

Únicos são o **gancho de build**: afixos fixos que **viabilizam ou distorcem** um arquétipo (trade-off, não só número maior). O protótipo já tem **Guarda-Chama** (`u_flameguard`) e cita **Coração do Vulcão** no mercado — formalizar e expandir:

| Único | Base | Efeito âncora (trade-off) | Habilita |
|---|---|---|---|
| **Guarda-Chama** *(existe)* | ruby_ring | +49% res. a fogo, +40 vida | camada anti-fogo |
| **Coração do Vulcão** | agate_amulet | dano de fogo alto; **converte parte da vida em risco de queimadura** | Elementalista de fogo |
| **Fome-de-Ferro** | heavy_maul | golpe enorme vs bruiser; **−velocidade de ataque** | Investida single-target |
| **Baluarte Imóvel** | kite_shield | +bloqueio/armadura enormes; **−velocidade de movimento** | Guardião |
| **Olho da Tempestade** | recurve_bow | converte físico→raio, +crítico; **sem dano físico residual** | Arqueiro de raio |
| **Estopim Gêmeo** | siege_crossbow | +projétil/AoE; **recarga mais lenta** | Explosões |
| **Beijo da Víbora** | venom_dagger | veneno empilha mais rápido; **menos dano de golpe** | Assassino/DoT |
| **Sopro Pútrido** | frost_focus | +dano de caos/DoT; **−vida máxima** | Pestilência |
| **Passo de Névoa** | hide_boots | +velocidade/evasão; **−armadura** | mobilidade (anti-aéreo/ranged) |

Cada único ecoa a regra de ouro: **dá e tira**. O **afixo excepcional** (§5.3) e os únicos sustentam a caça longa do endgame ([ENDGAME §5](./ENDGAME.md)).

---

## 10. O que fica para novas ligas (registrado)

O catálogo é um **começo**; ligas futuras **somam** sem quebrar o que existe:

- **Classes 4–6:** **Invocador** (minions — motor M4), **Feral** (transformação/totens), **Lâmina** (adagas/vazio) — de [COMBAT_AND_ARCHETYPES §B2](./COMBAT_AND_ARCHETYPES.md).
- **Arquétipos que pedem motor novo:** minions/totens (M4), mais DoT/ailments (M3 aprofundado).
- **Mais weaponTypes:** lança (`spear`), bastão (`quarterstaff`), mangual (`flail`), desarmado.
- **Únicos sazonais** e **afixos excepcionais** novos por temporada.
- **Runas avançadas** (conversão, gatilhos) e **charm/talismã**.
- **Bases de tier alto** e **implícitos corrompidos** (Vaal) exclusivos.

**Regra:** toda liga nova adiciona ids **novos**; nunca remove/renumera os da Liga 1 (personagens e mercado dependem de ids estáveis).

---

## 11. Modelo de dados (encaixe no que existe)

Reusa e estende os contratos de [`types.ts`](../src/game/types.ts) (nada é reescrito):

```ts
// bases ganham (de EQUIPMENT_SKILLS_DESIGN):
interface ItemBase {
  /* …atual… */
  weaponType?: WeaponType
  armour?: number; evasion?: number; energyShield?: number
  quality?: number
  reqLevel?: number; reqStr?: number; reqDex?: number; reqInt?: number
  runeSockets?: number
}

type WeaponType = 'axe'|'mace'|'sword'|'shield'|'bow'|'crossbow'|'dagger'|'staff'|'focus'
type ClassId = 'martial'|'precision'|'arcane'

interface ClassDefinition {
  id: ClassId; name; primaryAttr: 'strength'|'dexterity'|'intelligence'
  weaponProficiency: WeaponType[]
  ascendancies: Array<{ id; name; unlocksAtAct: number }>
}

interface Rune { id; name; slots: WeaponType[]|ItemClass[]; mods: StatMods; note }

interface FlaskBase {
  id; name; kind: 'life'|'mana'|'utility'
  effect: StatMods & { restore?: number; durationS?: number }
  charges: number
}

// StatKey ganha as chaves novas: addedFireMin/Max, addedColdMin/Max,
// addedLightningMin/Max, addedChaosMin/Max, incElemental, incSpell, incDot,
// penetration, castSpeed, chaosRes, evasion, energyShield, dexterity,
// intelligence, moveSpeed, maxMana, itemRarity, stunThreshold.
// (chaosRes já foi adicionada no trabalho do bestiário.)
```

Skills ganham `requires` (weapon/class/level) e a UI de habilidades passa a filtrar por `availableSkills(equipped, classId, level)` — já especificado em [EQUIPMENT_SKILLS_DESIGN §5.4](./EQUIPMENT_SKILLS_DESIGN.md).

### 11.1 Faseamento de implementação (encaixa em S1–S6 do design de equipamento)
- **C1 (com S1):** novas **bases** (armas por weaponType + armaduras evasão/ES) e **afixos** de tipo de dano/defesa. Sem UI nova.
- **C2:** **classes** (Precisão/Arcano) com proficiência/atributo + origens da árvore.
- **C3 (com S3):** catálogo de **skills por arma** com requisitos/tiers, por arquétipo.
- **C4:** **runas** + **frascos** (slots de S4) + **únicos** por arquétipo.
- **C5:** **afixo excepcional** (só-dropa) e ganchos de **endgame/liga**.

---

## 12. Resumo (a Liga 1 em uma frase)

**3 classes** (Marcial/Precisão/Arcano) × **9 weaponTypes** abrindo **7 arquétipos jogáveis** cobrindo **os 5 tipos de dano**, com **crafting em dois trilhos** (orbes existentes + **runas** novas), **frascos** ligados à defesa por tipo, **joalheria** que fecha resistências, e **um único por arquétipo** com trade-off — tudo como **superconjunto** do `content.ts` atual e **base** para novas ligas somarem.
</content>
