# Endgame — o loop infinito pós-campanha

- **Pergunta que este doc responde:** terminada a [campanha](./PROGRESSION_AND_STORY.md), **o que o jogador faz para sempre?** Este doc especifica o **endgame** do BuildsWar: o loop de progressão infinita, a dificuldade escalável por recompensa, os chefes-pináculo e a **direção** (para não virar o "vagar sem objetivo" que os jogadores mais criticam) — tudo no nosso modelo **assíncrono**.
- **Data:** 01 de julho de 2026
- **Relacionados:** [Progressão & Narrativa](./PROGRESSION_AND_STORY.md) · [Bestiário & Dungeons](./BESTIARY_AND_DUNGEONS.md) · [Pesquisa de Gênero](./ARPG_RESEARCH.md) · [Motor & Balanceamento](./COMBAT_AND_ARCHETYPES.md) · [Visão do MVP](./MVP.md) · [Referência PoE2](./POE2_REFERENCE_ARCHITECTURE.md)
- **Método:** pesquisa avançada dos endgames de PoE2 (Atlas), Diablo 4 (Torment/Pit/Paragon) e Last Epoch (Monolith) — fontes em §9.

---

## 1. Os três endgames de referência (dissecados)

| Jogo | Loop | Escala de dificuldade | Direção / escolha | Recompensa | Dor a evitar |
|---|---|---|---|---|---|
| **PoE2 — Atlas** | rodar **mapas** (waystones) num tabuleiro de nós que se expande; **Torres + Tabuletas** buffam regiões; **árvore do Atlas** aumenta perigo→recompensa | tier da waystone + nós do Atlas | escolher rota, mecânicas (Breach/Ritual…), quando ir no **pináculo** | loot, moeda, waystones sustentadas, chefes-pináculo | **repetitivo/sem direção**; **1 morte = mapa perdido**; empolgação vinda de moeda, não de gear |
| **Diablo 4 — Torment/Pit** | subir **Torment 1–12**; **The Pit** empurra tiers; **Paragon**; Nightmare/Helltide/Infernal Hordes; chefes por materiais | Torment + nível do Pit (gates de drop) | **Season Journey** (7 capítulos) dá objetivos guiados | materiais, Paragon, uniques míticos, masterworking | QoL/loot filter tardios; farmar **tier baixo** é mais eficiente (anti-clímax) |
| **Last Epoch — Monolith** | **echoes** (runs curtas) em **timelines**; **Echo Web**; **estabilidade** abre chefes; **Blessings** (buffs permanentes escolhidos); **Corrupção** escala via Shade of Orobyss; **Empowered** | corrupção (vida/dano do monstro ↑, recompensa ↑) | **escolher o echo/modificador/recompensa antes de correr**; Blessings mirados | blessings, uniques exclusivos de timeline, XP/raridade | escalar 1 tipo de dano é punido |

**O que puxar de cada um (a mistura BuildsWar):**
- **De Last Epoch:** o **echo assíncrono** — runs **curtas**, com **modificador e recompensa escolhidos ANTES** de enviar. É o encaixe perfeito para "enviar o herói": o jogador **compõe o desafio** e a **recompensa** e então despacha.
- **De PoE2:** o **mapa que se expande** com **nós/regiões buffáveis** (nossas "Tabuletas") e a **árvore de endgame** que troca **perigo por recompensa** — a fonte de profundidade de longo prazo.
- **De Diablo 4:** a **jornada de temporada** (objetivos guiados por capítulo) que **dá direção** — a cura para o "vagar sem objetivo" do PoE2.

---

## 2. O endgame do BuildsWar — "O Atlas das Fendas"

Nome provisório: **Atlas das Fendas** (identidade original). É um **mapa de nós** que o jogador desbloqueia ao terminar a campanha e **nunca esgota**.

### 2.1 O loop central (assíncrono)

```
1. escolher um NÓ do mapa (bioma + bestiário/composição — ver BESTIARY_AND_DUNGEONS)
2. compor o desafio: aplicar TABULETAS/modificadores (perigo ↑ → recompensa ↑)
3. escolher a RECOMPENSA-ALVO (loot/moeda/fragmento/XP/blessing) — como o echo de LE
4. ENVIAR o herói (assíncrono; continua com o jogo fechado)
5. ler o RELATÓRIO CAUSAL (o que aconteceu e por quê — números descobertos)
6. loot/XP entram no baú; a vitória EXPANDE o mapa e dá pontos de Atlas
7. repetir, subindo tiers/corrupção, rumo aos CHEFES-PINÁCULO
```

Cada volta é **curta e decidida** (não é execução manual), e **cada decisão importa**: a composição do nó, os modificadores e a recompensa-alvo definem **qual build** você precisa — reforçando a diversidade de builds do [bestiário](./BESTIARY_AND_DUNGEONS.md).

### 2.2 Componentes

| Componente | Inspiração | O que faz |
|---|---|---|
| **Mapa de nós** | Atlas (PoE2) | tabuleiro que **se expande** ao vencer; nós têm bioma + composição |
| **Tier / Corrupção** | waystone (PoE2) + corrupção (LE) | escala **nível/vida/dano** do monstro → **XP/raridade/quantidade** de loot |
| **Tabuletas** | Precursor Tablets (PoE2) | item consumível que **modifica uma região** por N runs (perigo↑/recompensa↑) |
| **Árvore do Atlas** | Atlas passive tree (PoE2) | pontos ganhos no endgame; **especializa** o farm (mais chefes, mais loot, mais X) |
| **Recompensa-alvo** | echo reward (LE) | escolher **o que caçar** antes de enviar → farm **direcionado**, não RNG cego |
| **Bênçãos** | Blessings (LE) | buffs **permanentes** escolhidos ao vencer marcos → poder que **só o endgame dá** |
| **Chefes-pináculo** | Arbiter/pinnacle (PoE2), uber (D4) | topo aspiracional; pedem **penetração/burst/camadas** (ver bestiário) |
| **Jornada da Fenda** | Season Journey (D4) | **objetivos guiados** por capítulo → **direção** e recompensa |

### 2.3 Dificuldade escalável por recompensa (a curva sem fim)

Adotamos o consenso **"perigo ⇆ recompensa"**:
- subir **tier/corrupção** aumenta **nível, vida e dano** dos monstros (todos os tipos — ver [multi-dano](./BESTIARY_AND_DUNGEONS.md)) e, na mesma medida, **XP, raridade, quantidade** e **chance de afixo excepcional**;
- a **árvore do Atlas** e as **Tabuletas** deixam o jogador **empilhar perigo** por **recompensa dirigida** (mais chefe, mais um tipo de mecânica, mais loot de uma família);
- **teto móvel:** sempre há um tier acima que a build atual **ainda não vence** — o motivo para caçar o próximo upgrade.

> **Cuidado com a armadilha do D4** (farmar tier baixo é mais eficiente): o balanceamento deve fazer o **tier mais alto que você aguenta** ser o **mais eficiente** — recompensa cresce **mais rápido** que o tempo de clear, dentro do que a build sobrevive.

---

## 3. Direção — a cura do "vagar sem objetivo"

A maior crítica ao endgame de PoE2 é **falta de direção/payoff**. Copiamos de Diablo 4 a **Jornada** e de Last Epoch os **alvos de farm**:

- **Jornada da Fenda:** capítulos de objetivos ("vença um nó de corrupção 50", "derrote o chefe X", "colete N fragmentos") que **guiam** o jogador do endgame inicial ao pináculo, com **recompensa por capítulo**.
- **Farm direcionado:** a **recompensa-alvo** (§2.1) e as **Bênçãos**/uniques por região dão **motivo específico** para cada run — nunca "rodar por rodar".
- **Objetivo legível sempre visível:** o próximo marco e o que ele dá aparecem na tela do Atlas (o jogador sabe **por que** está enviando o herói).

---

## 4. Vantagem estrutural do modelo assíncrono no endgame

O nosso modelo **resolve de graça** as duas maiores dores dos endgames de referência:

- **"1 morte = mapa perdido" (PoE2) → derrota compreensível.** Como o combate é simulado pelo servidor e devolve **relatório causal**, a derrota não é um susto injusto: ela **explica a lacuna** e dá **delta acionável**. Podemos ter regras de risco (Hardcore, corrupção que consome a run) **como escolha**, não como frustração opaca.
- **Repetição braçal (todos) → decisão, não execução.** O endgame não é "moer" com as mãos: é **compor o desafio + a recompensa + a build** e **enviar**. A profundidade está na **decisão**, que é o pilar do projeto. Sessões úteis em minutos (MVP §6), progressão persistente com o jogo fechado.
- **Trade/loot filter (dores do gênero) já nativos** (ver [ARPG_RESEARCH](./ARPG_RESEARCH.md)): o loot do endgame chega **em relatório/lista filtrável**, e o mercado é **compra imediata assíncrona**.

---

## 5. Retenção sazonal (encaixe nas ligas do MVP)

- **Liga sazonal** injeta uma **mecânica de endgame** nova (nós/Tabuletas/chefe sazonais) — o [MVP](./MVP.md) e a [referência PoE2](./POE2_REFERENCE_ARCHITECTURE.md) já preveem economia/ranking reiniciados e mecânica sazonal modular.
- **Rankings por perfil** (MVP §4.5): dano, velocidade, sobrevivência, **progressão infinita** (maior corrupção/tier), Hardcore, ligas restritas — cada um com seu ladder.
- **Sumidouros** (taxa de mercado, custo de Tabuletas/entrada em tiers altos) seguram a economia sazonal.
- **Afixo excepcional que só dropa** no endgame (de [ARPG_RESEARCH §6.1](./ARPG_RESEARCH.md)) garante **caça a gear**, não só a moeda.

---

## 6. Anti-padrões (não repetir os erros deles)

- **Não** deixar o endgame **sem direção** — Jornada + recompensa-alvo desde o primeiro nó.
- **Não** premiar farmar **tier baixo** — recompensa cresce mais rápido que o tempo de clear (dentro da sobrevivência).
- **Não** fazer a empolgação vir **só de moeda/craft** — gear caçável (afixo excepcional).
- **Não** punir com **morte opaca** — relatório causal sempre explica.
- **Não** exigir **rejogar campanha** para experimentar build no endgame — respec/loadouts baratos.
- **Não** despejar todos os sistemas de endgame de uma vez — a **Jornada** os libera em ritmo.

---

## 7. Modelo de dados (esboço — reusa dungeon/bestiário)

```ts
interface AtlasNode {
  id; biome; tier: number
  composition: DungeonComposition        // reusa o bestiário/multi-dano
  neighbors: string[]                    // expande ao vencer
  completed: boolean
}

interface Tablet {                       // "Precursor Tablet" do BuildsWar
  id; name
  region: string                         // afeta um grupo de nós
  runsLeft: number
  dangerMods: string[]                   // perigo ↑
  rewardMods: string[]                   // recompensa ↑
}

interface EndgameRun {
  nodeId; tier; corruption: number
  tablets: string[]
  targetReward: 'loot'|'currency'|'fragment'|'xp'|'blessing'
}

interface AtlasProgress {
  unlockedNodes: string[]
  atlasPoints: number; atlasTree: string[]   // árvore de endgame
  blessings: string[]                        // buffs permanentes escolhidos
  journeyChapter: number                     // direção (à la Season Journey)
  maxCorruption: number                      // ranking de progressão infinita
}
```

O `DungeonOutcome` do endgame é o **mesmo** do bestiário (com `cause`/`reason`/`breakingType`), acrescido de `xpGained`, `loot[]` e `atlasPointsGained`. **Corrupção/tier** entram no cálculo escalando `diff`, `life` dos monstros e as **resistências exigidas** (ver [BESTIARY §4.3](./BESTIARY_AND_DUNGEONS.md)).

### 7.1 Faseamento (depende das fases do motor)
- **E1:** nó único de endgame com **tier/corrupção** escalando o `dungeonOutcome` atual (perigo↑/recompensa↑). Baixo risco.
- **E2:** **mapa de nós** que se expande + recompensa-alvo (echo-like).
- **E3:** **Tabuletas** (modificadores de região) + **árvore do Atlas**.
- **E4:** **Bênçãos** permanentes + **chefes-pináculo** (multi-fase, do bestiário).
- **E5:** **Jornada da Fenda** (objetivos guiados) + injeção **sazonal** + rankings por perfil.

---

## 8. Sequência recomendada (com a campanha)

1. Fechar a [campanha](./PROGRESSION_AND_STORY.md) (P1–P2) para haver **handoff**.
2. **E1** (tier/corrupção sobre o dungeonOutcome) — dá o loop infinito mínimo já testável.
3. **E2/E3** (mapa + recompensa-alvo + Tabuletas + árvore) — a profundidade de longo prazo.
4. **E4** (bênçãos + pináculos) — o topo aspiracional.
5. **E5** (Jornada + sazonal + rankings) — direção e retenção.

Motor: as fases M1–M3 de [COMBAT_AND_ARCHETYPES](./COMBAT_AND_ARCHETYPES.md) (multi-dano, camadas, ailments) sustentam a escala de corrupção; M5 (ticks) fecha o relatório real.

---

## 9. Fontes

**PoE2 — Atlas/endgame**
- [PoE2 Endgame Overview (Mobalytics)](https://mobalytics.gg/poe-2/guides/endgame-overview)
- [PoE2 Atlas Endgame Explained (TheGamer)](https://www.thegamer.com/path-of-exile-2-atlas-endgame-explained/)
- [PoE2 Endgame Progression (Mobalytics)](https://mobalytics.gg/poe-2/guides/endgame-progression-asmodeus)
- [PoE2 Atlas Progression (Imperial Boost)](https://imperial-boost.com/blog/path-of-exile-2-atlas-progression-guide)

**Diablo 4 — Torment/Pit/Journey**
- [D4 Endgame Progression (Maxroll)](https://maxroll.gg/d4/meta/endgame-progression)
- [D4 Torment Tiers (Wowhead)](https://www.wowhead.com/diablo-4/guide/gameplay/difficulty-torment-levels)
- [D4 Season Journey (Wowhead)](https://www.wowhead.com/diablo-4/guide/gameplay/season-journey)

**Last Epoch — Monolith**
- [LE Monolith Beginner Guide (Maxroll)](https://maxroll.gg/last-epoch/monolith/beginner-guide)
- [LE Monolith of Fate (LastEpochTools)](https://www.lastepochtools.com/endgame/monolith)
- [LE Monolith Guide (dving.net)](https://dving.net/guides/last-epoch/monolith-beginner-guide)
</content>
