# Bestiário, Composição de Dungeon e Balanceamento por Ameaça

- **Pergunta que este doc responde:** o que falta para uma dungeon **não ser só um número de dificuldade + resistência a fogo**? Resposta: um **bestiário** (arquétipos, forças/fraquezas, elites, chefes), **tipos de dano físico e mágico** (não só resistência elemental), **composição do encontro** (hordas × poucos-porém-fortes, inimigos aéreos, exigência de mobilidade) e um **relatório de resultado detalhado** que explica *o que aconteceu e por que falhou* — tudo isso entrando no balanceamento para forçar **builds diversas**.
- **Data:** 01 de julho de 2026
- **Relacionados:** [Motor & Balanceamento](./COMBAT_AND_ARCHETYPES.md) · [Pesquisa de Gênero](./ARPG_RESEARCH.md) · [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md) · [Visão do MVP](./MVP.md)
- **Método:** varredura avançada de wikis, guias e bancos de dados de PoE2, Diablo 4 e Last Epoch (fontes em §9). Onde números divergem, fica a descrição qualitativa.

> **Estado atual (o que este doc corrige).** Hoje a dungeon é um `diff` (número de poder) + `fireThreat`/`fireReq` (uma resistência única). O resultado é binário e o único jeito de "falhar" é ter pouca resistência a fogo. Isso **não gera diversidade de build** — qualquer build com DPS alto e 55% de res. a fogo passa em tudo. Este doc especifica o modelo de **bestiário + composição + multi-dano** que transforma cada dungeon num **teste diferente**, premiando builds diferentes.

---

## 1. Resumo executivo — o que cada líder ensina sobre monstros e dungeons

| Jogo | O que copiar sobre **monstros/dungeons** | O que evitar |
|---|---|---|
| **PoE2** | **5 tipos de dano** (físico/fogo/frio/raio/caos), cada um com defesa e ailment próprios; **modificadores de mapa/monstro** que mudam a ameaça (`X% do dano como fogo extra`, `+vida do monstro`, pack size); rares com 2–4 afixos, magic com 1 | modificadores ilegíveis; "morte por dano não telegrafado" |
| **Diablo 4** | **famílias de monstro** com **arquétipos de papel** (swarmer, bruiser, ranged, caster, support/shaman); **elites com afixos** (Suppressor, Waller, Teleporter, *X* Enchanted); packs mistos que combinam papéis | sobrecarga de afixos sem leitura; CC frustrante sem contrajogo |
| **Last Epoch** | **armadura mitiga tudo** (com 70% de eficiência vs. não-físico) e é **mais forte contra golpes pequenos**; res. **linear e por tipo**; **camadas** (vida/ward/dodge/block/endurance) — nenhuma sozinha salva; densidade de mob **ajustável por timeline** | escalar **um só tipo de dano** é punido; mono-defesa morre |

**Insight central para o BuildsWar.** As três dores que os jogadores mais reclamam — "só resistência a fogo importa", "toda build é igual", "não sei por que morri" — somem quando a **dungeon tem uma assinatura de ameaça** (que dano ela aplica, com que composição) e o **relatório explica a causa**. Nosso modelo assíncrono + números descobertos é o lugar perfeito para isso: o servidor simula, lê o bestiário, e devolve um **relatório com causa**.

---

## 2. Tipos de dano — de "resistência elemental" para físico + mágico completo

Hoje o motor só conhece **dano físico** (no ataque) e **três resistências** (fogo/frio/raio) do lado defensivo, mas **nenhum monstro aplica frio/raio de verdade** — só fogo, via `fireThreat`. Precisamos do modelo completo do gênero: **o inimigo também tem um perfil de dano**, e a defesa que o para depende do tipo.

### 2.1 Os cinco tipos e sua defesa (consenso PoE2/LE)

| Tipo de dano | Categoria | Defesa que **mitiga** | Ailment que aplica | Observação de design |
|---|---|---|---|---|
| **Físico** | físico | **Armadura** (depende do tamanho do golpe) + bloqueio | **Sangramento** (DoT físico) | sem "resistência a físico" comum; armadura é a resposta |
| **Fogo** | mágico/elemental | **Res. a fogo** (+ armadura parcial, à la LE) | **Queimadura / ignite** (DoT de fogo) | dano de pico ("burst") clássico de chefe |
| **Frio** | mágico/elemental | **Res. a frio** | **Chill / freeze** (lentidão → congela) | ameaça de **controle**: te trava e a horda alcança |
| **Raio** | mágico/elemental | **Res. a raio** | **Shock** (alvo recebe +dano) | picos altos e erráticos; some com o shock em cima |
| **Caos** | mágico | **Res. a caos** (rara) — **ignora escudo de energia**; se houver ES, remove o dobro | **Veneno** (DoT de caos/físico) | contorna a camada de ES; pune builds que dependem só de ES |

**Regra prática (do gênero):** *físico* é parado por **armadura**, *elemental* por **resistências**, *caos* **fura o ES**. Nenhuma defesa cobre tudo → **camadas obrigatórias** (§5).

### 2.2 Armadura dependente do tamanho do golpe (troca importante)

Consenso PoE2/LE: **armadura é ótima contra muitos golpes pequenos e fraca contra um golpe enorme.** Isso é o que cria o trade-off "swarm × boss":

```
redução_física = Armadura / (Armadura + K × dano_do_golpe)   (teto ~90%)
```

Hoje usamos `armour/(armour+1500)`, que **ignora o tamanho do golpe** → armadura vira número mágico universal. **Trocar** por esta fórmula (já sinalizado em [COMBAT_AND_ARCHETYPES §A2](./COMBAT_AND_ARCHETYPES.md)) faz uma **horda de golpes fracos** (swarmer) e um **golpe de chefe** exigirem defesas diferentes → duas builds diferentes.

### 2.3 Penetração e shred (do lado do jogador)

- **Penetração:** reduz a resistência **efetiva** do inimigo no cálculo do hit (`res_efetiva = res − penetração`). Deixa builds elementais viáveis contra dungeons de "monstros resistentes".
- **Shred (LE):** stacks que reduzem a resistência do alvo ao longo do tempo — casa com builds de DoT/acúmulo.

---

## 3. Bestiário — arquétipos, forças e fraquezas

Espinha dorsal vinda de **Diablo 4** (famílias divididas em papéis) + **elites/afixos** e **chefes**. Cada monstro tem um **papel** (como ameaça), um **perfil de dano** (§2) e **forças/fraquezas** que uma build explora ou sofre.

### 3.1 Arquétipos de papel (o "role" do inimigo)

| Arquétipo | Papel no encontro | Como ameaça o herói | Build que **conta bem** | Build que **sofre** |
|---|---|---|---|---|
| **Swarmer** (enxame) | muitos, fracos, rápidos | te cerca; muitos golpes pequenos; CC em cadeia | **AoE**, armadura (golpes pequenos), knockback | single-target puro, pouca AoE |
| **Bruiser** (brutamontes) | poucos, muita vida, golpe pesado | um golpe enorme (fura armadura); knockdown | **single-target** alto, mitigação de golpe grande (bloqueio/EHP), **DoT** | AoE espalhada sem burst |
| **Ranged** (atirador) | dano à distância, projéteis | dano inevitável se não fechar distância; te obriga a andar | **mobilidade** (fechar gap), projétil-destruição, alta sobrevivência | build lenta e imóvel |
| **Caster** (conjurador) | magia/elemento à distância, invoca/buffa | pico elemental; ressuscita/reforça a horda | **burst/priority-kill**, res. elemental, interrupção | dano lento (o caster reforça antes de morrer) |
| **Support / Shaman** | buffa e cura aliados | escala **toda** a horda; precisa morrer primeiro | **burst de prioridade**, alcance | dano espalhado sem foco |
| **Aéreo / Voador** | flutua, ignora chão, mergulha | **imune a efeitos de chão** (poças/totens no solo); força mira aérea | **projétil/hitscan**, dano que **atinge o ar**, AoE sem depender de chão | build de **chão** (nova/poça/trap no solo), corpo-a-corpo sem alcance |

> **O caso "aéreo" que o usuário levantou** entra aqui como uma **flag de composição** (`hasAerial`) e uma **tag de skill** (`ground` × `hits-air`). Uma dungeon com voadores **derruba** builds que só aplicam dano no chão (poças, totens, trap) e **premia** builds de projétil/mobilidade. Isso é balanceamento real, não cosmético.

### 3.2 Elites (afixos que mudam o contrajogo) — de Diablo 4

Elite = monstro comum + **2–4 afixos** que exigem contrajogo. Amostra para adaptar (nomes provisórios/originais):

| Afixo (D4-like) | Efeito | Contrajogo que premia certa build |
|---|---|---|
| **Suppressor** | bolha que **bloqueia dano à distância** de fora | melee/entrar na bolha; ou dano em área que nasce dentro |
| **Waller** | ergue **paredes** que prendem o herói | mobilidade/dash; dano que atravessa |
| **Teleporter** | teleporta em cima do herói (pico de raio) | reação/EHP; não depende de kite puro |
| **X Enchanted** (Cold/Fire/Poison/Lightning) | **adiciona um tipo de dano** ao pacote | força a **camada de resistência** correspondente |
| **Shielded / Barrier** | ganha **escudo** periódico | burst para quebrar; DoT ignora parcialmente |
| **Fast** | move/ataca **muito rápido** | CC (chill/freeze), mitigação de golpes pequenos |

Elite carrega um **perfil de dano próprio** (pode somar um tipo via *Enchanted*) e **minions herdam** parte do buff (como em D4) — isso torna o encontro **misto** e a build precisa cobrir mais de um eixo.

### 3.3 Chefes (Boss) — fases e mecânica, distintos do trash

Consenso dos três jogos: chefe tem **mais vida/armadura/resistência**, **movesets únicos** e **fases**. Modelo:

- **Perfil de dano por fase:** ex. fase 1 físico (golpe grande → testa EHP/bloqueio), fase 2 **incendeia a arena** (fogo → testa res. a fogo, já é o gancho da Cripta), fase 3 invoca (testa AoE).
- **Janela de dano:** chefe com muita vida **pune DPS baixo** por tempo (a tentativa arrasta e o dano acumulado do chefe mata) → cria o piso de DPS.
- **Resistências altas:** mitigar armadura/res. do chefe "aumenta muito seu dano" (PoE2) → **penetração/shred** ganham valor exatamente nos chefes.

---

## 4. Composição da dungeon — hordas × poucos-fortes, densidade, aéreos, mobilidade

A dungeon deixa de ser um `diff` e passa a ter uma **composição declarada** (o *preview* que o usuário pediu). Isso é o que diferencia "muitas hordas" de "poucos monstros muito fortes".

### 4.1 Eixos de composição (o "preview" da dungeon)

| Eixo | Faixa | O que muda no balanceamento |
|---|---|---|
| **Densidade / pack size** | esparso ↔ enxame | alta densidade → **AoE** e **clear-speed** dominam; baixa → **single-target** |
| **Perfil de força** | horda-fraca ↔ poucos-fortes | horda-fraca favorece armadura (golpes pequenos) + AoE; poucos-fortes favorece **burst** + mitigação de **golpe grande** |
| **Mix de dano** | quais tipos o encontro aplica | define **quais resistências/defesas** são obrigatórias (não só fogo) |
| **Aéreo** | tem voadores? (sim/não/quantos) | derruba builds de **chão**; exige dano que **atinge o ar** + mobilidade |
| **Exigência de mobilidade** | baixa ↔ alta | ranged/waller/telégrafo forte → **mobilidade** vira requisito, não luxo |
| **Papéis presentes** | quais arquétipos (§3.1) | a "receita" do encontro (ex.: 70% swarmer + 1 caster + boss) |

> **Ex. de leitura de preview:** *"Fornalha Rachada — poucos-porém-fortes, dano de **fogo** intenso, **1 elite Fire-Enchanted**, chefe de 2 fases, mobilidade média, sem voadores."* Já se sabe: precisa de **res. a fogo + mitigação de golpe grande + single-target**. Uma build de AoE/chão de veneno sofre; uma de burst físico com res. a fogo passa.

### 4.2 Modificadores de dungeon (de PoE2 waystones)

Modificadores que **escalam a ameaça** e **giram o meta** (sazonais):
- **Ofensivos:** `monstros causam X% do dano como fogo/frio/raio/caos extra`, `+X% dano do monstro`, `+velocidade de ataque/conjuração`.
- **Defensivos (do monstro):** `+X% vida do monstro`, `monstros têm +res. elemental`, `monstros evitam ailments`, `hexproof` (imune a maldições).
- **Densidade:** `+pack size`, `pacote extra de rares`.

Cada modificador **muda que build passa** — é o que mantém a caça viva por temporada.

### 4.3 Como a composição entra no cálculo (motor)

O `dungeonOutcome` deixa de olhar só `dps` e `fireRes`. Passa a rodar, por **fase/onda**, uma checagem de:

1. **Vazão (clear):** `tempo = f(vida_total_do_encontro / dpsEfetivo)`, onde `dpsEfetivo` **penaliza** falta de AoE contra alta densidade e falta de single-target contra bruiser/boss.
2. **Sobrevivência por tipo:** para **cada tipo de dano** presente, checa a **camada** correspondente (armadura vs físico dependente do golpe; res. vs elemental; ES/res.caos vs caos). Falha na **camada mais fraca** = causa da morte.
3. **Composição:** aéreo sem dano-no-ar → **stall** (não limpa) → morte por atrito; mobilidade baixa vs ranged/waller → dano inevitável acumulado.

Continua **puro e determinístico** e alimenta os **números descobertos** (o DPS/EHP reais só aparecem no teste).

---

## 5. Camadas de defesa — por que "só res. a fogo" morre

De Last Epoch: **nenhuma defesa isolada salva; é preciso empilhar** (multiplicativo, com retornos decrescentes). O motor passa a modelar as camadas na ordem do gênero:

```
resistências (por tipo)  →  armadura|evasão|bloqueio  →  ward/ES  →  vida
```

- **Armadura** mitiga **tudo** com eficiência menor para não-físico (LE: ~70%) e **decai contra golpes grandes** (§2.2).
- **Resistências** por tipo, **teto 75%**, escala **linear** (LE) — logo cobrir **vários** tipos importa mais que estourar um.
- **Ward/ES** buffer que absorve **antes** da vida; **caos fura ES** (§2.1).
- **Bloqueio/evasão/endurance** como reduções extra, todas multiplicativas.

**Consequência de balanceamento:** uma dungeon com **mix de dano** (físico + fogo + caos) exige **três camadas diferentes** → mata a build mono-defesa e premia a build que **investiu em largura**. É exatamente o que gera diversidade.

---

## 6. Relatório de resultado — "o que aconteceu e por que falhou"

O relatório atual só diz "morte por fogo". Com o bestiário, o servidor devolve uma **narrativa causal** (o pilar "derrota compreensível" do MVP):

- **Causa primária:** a camada que quebrou e **contra qual tipo/arquétipo**. Ex.: *"Sobreviveu ao físico (armadura ok), mas o **pico de raio do elite Teleporter** passou com res. a raio 12% (exigido ~40%)."*
- **Fase/onda:** em que momento caiu (onda de swarmers, fase 2 do chefe, elite específico).
- **Gargalo de vazão:** se não foi morte, foi **atrito** — *"os voadores não foram atingidos (build de chão): DPS efetivo aéreo ~0, o tempo estourou"*.
- **Deltas acionáveis:** o que mudaria o resultado — *"+28% res. a raio OU +1 camada (bloqueio) resolve"; "uma skill que atinge o ar limpa os morcegos"*.
- **DPS/EHP reais medidos** (números descobertos) por **tipo** — não só um DPS único, mas **DPS físico/elemental/DoT** e **EHP por tipo de dano**.

Isso fecha o loop: o jogador **entende a lacuna**, ajusta a build (item/árvore/skill), e a **próxima** dungeon com composição diferente volta a testar outra coisa → **builds diversas por necessidade**.

---

## 7. Modelo de dados (o que muda no código)

Extensões de tipo (ver `src/game/types.ts`), mantendo tudo **puro e testável**:

```ts
type DamageType = 'phys' | 'fire' | 'cold' | 'lightning' | 'chaos'
type MonsterRole = 'swarmer' | 'bruiser' | 'ranged' | 'caster' | 'support' | 'aerial'
type MonsterRank = 'normal' | 'elite' | 'boss'

interface MonsterAffix { id; name; effect; addsDamageType?: DamageType }   // elites

interface Monster {
  id; name; role: MonsterRole; rank: MonsterRank
  damage: Partial<Record<DamageType, number>>   // perfil de dano
  hitSize: 'small' | 'medium' | 'huge'          // interage com armadura (§2.2)
  life: number
  weakTo?: DamageType[]; resistant?: DamageType[]
  affixes?: MonsterAffix[]                       // se elite
  phases?: Array<{ damage; note }>               // se boss
  aerial?: boolean
}

interface DungeonComposition {
  density: 'sparse' | 'medium' | 'swarm'
  forceProfile: 'weak-horde' | 'mixed' | 'few-strong'
  damageMix: DamageType[]                         // tipos presentes → defesas exigidas
  hasAerial: boolean
  mobilityDemand: 'low' | 'medium' | 'high'
  roles: MonsterRole[]                            // "receita" do encontro
  waves: Array<{ monsterId; count }>             // preview
  mods: string[]                                  // modificadores (waystone-like)
}
```

O `Dungeon` ganha `composition: DungeonComposition` (e o `Bestiary` vira uma tabela de `Monster`). O `DungeonOutcome` ganha **causa detalhada**, **fase**, **DPS/EHP por tipo** e **deltas acionáveis**. `Power` ganha `coldRes`/`litRes`/**`chaosRes`** já usados de verdade, mais **evasão/ES/ward** conforme as fases M2/M3 do motor.

### 7.1 Faseamento (encaixa nas fases M1–M5 do motor)
- **B1 (com M1):** `DamageType` completo + `damageMix` da dungeon + res. por tipo usadas de verdade (não só fogo). *Baixo risco, destrava variedade imediata.*
- **B2 (com M2):** armadura por tamanho de golpe + `hitSize` do monstro + camadas (evasão/ES). Habilita "swarm × boss".
- **B3:** bestiário com **arquétipos e elites**; composição (`density`/`forceProfile`/`roles`) no `dungeonOutcome`; **preview**.
- **B4:** **aéreo** (`hasAerial` × tag de skill `hits-air`) e **mobilidade** como requisitos; ailments/DoT (M3) para builds de veneno/queimadura.
- **B5:** chefes com fases + **relatório causal** completo (por tipo/fase/delta). Fecha o loop com os números descobertos.

---

## 8. Diretrizes de balanceamento (para forçar builds diversas)

- **Toda dungeon aplica ≥ 2 tipos de dano** (nunca só um) → mata mono-defesa.
- **Nenhuma dungeon é vencível só com DPS** — há sempre uma **camada** e uma **composição** a resolver.
- **Cada eixo de composição tem uma build que ele premia e outra que ele pune** (aéreo pune chão; horda pune single-target; poucos-fortes punem AoE espalhada) → o **conjunto** de dungeons exige um **conjunto** de builds.
- **Elites e chefes dão o payoff** (loot) e **exigem penetração/burst/camada** — a razão para especializar.
- **Preview honesto:** o jogador vê a assinatura de ameaça **antes** de enviar o herói (assíncrono) e decide a build — a decisão vira o jogo.
- **Relatório sempre explica a causa** — derrota compreensível é pilar, não enfeite.

---

## 9. Fontes

**Tipos de dano & defesas**
- [PoE2 — Damage Types (Mobalytics)](https://mobalytics.gg/poe-2/guides/damage-types)
- [Chaos damage — PoE Wiki](https://www.poewiki.net/wiki/Chaos_damage)
- [What Resistances To Prioritize in PoE2 (GameRant)](https://gamerant.com/path-of-exile-2-poe2-best-resistances-upgrade/)
- [Damage Scaling — Maxroll PoE2](https://maxroll.gg/poe2/getting-started/damage-scaling)
- [Damage Calculations Explained — Maxroll (Last Epoch)](https://maxroll.gg/last-epoch/resources/damage-explained)
- [Defenses Explained — Maxroll (Last Epoch)](https://maxroll.gg/last-epoch/resources/defenses-explained)
- [Resistances and Mitigation — Icy Veins (Last Epoch)](https://www.icy-veins.com/last-epoch/resistances-and-mitigation)
- [Armor — Last Epoch Wiki](https://lastepoch.fandom.com/wiki/Armor)

**Bestiário, arquétipos, elites, chefes**
- [Monster Families in Diablo 4 — Maxroll](https://maxroll.gg/d4/resources/monster-families)
- [Elites and Affixes Overview — Maxroll (D4)](https://maxroll.gg/d4/resources/elites-affixes)
- [Enemies — Diablo 4 Wiki (Fextralife)](https://diablo4.wiki.fextralife.com/Enemies)
- [Elites — Diablo 4 Wiki (Fextralife)](https://diablo4.wiki.fextralife.com/Elites)
- [Monster Affixes Guide — PureDiablo (D4)](https://www.purediablo.com/diablo4/Monster_Affixes)
- [Enemies — Last Epoch Wiki](https://lastepoch.fandom.com/wiki/Enemies)

**Composição & modificadores de dungeon/mapa**
- [Monster modifiers — PoE Wiki](https://www.poewiki.net/wiki/Monster_modifiers)
- [Monster modifier — PoE2 Wiki](https://www.poe2wiki.net/wiki/Monster_modifier)
- [Waystone/Abyss Modifier Tier List — Mobalytics (PoE2)](https://mobalytics.gg/poe-2/guides/waystone-abyss-modifier-tier-list)
- [Dungeon Guide — Maxroll (Last Epoch)](https://maxroll.gg/last-epoch/dungeons/dungeon-guide)
- [Crowd Control — Diablo 4 (VHPG)](https://www.vhpg.com/diablo-4-crowd-control/)
</content>
</invoke>
