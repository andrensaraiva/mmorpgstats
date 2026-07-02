# Progressão & Narrativa — da campanha ao endgame

- **Pergunta que este doc responde:** como o jogador **entra** no BuildsWar? Antes de existir "endgame infinito", precisa haver uma **jornada** que ensina os sistemas, entrega itens e XP, conta uma história e **desemboca** no endgame. Este doc especifica essa **progressão narrativa** — adaptada ao nosso modelo **assíncrono** (o jogador **envia** o herói, não o pilota).
- **Data:** 01 de julho de 2026
- **Relacionados:** [Endgame](./ENDGAME.md) · [Bestiário & Dungeons](./BESTIARY_AND_DUNGEONS.md) · [Motor & Balanceamento](./COMBAT_AND_ARCHETYPES.md) · [Pesquisa de Gênero](./ARPG_RESEARCH.md) · [Visão do MVP](./MVP.md) · [Referência PoE2](./POE2_REFERENCE_ARCHITECTURE.md)
- **Método:** pesquisa avançada de campanha/leveling de PoE2, Diablo 4 e Last Epoch (fontes em §8).

> **Escopo.** Aqui trata-se do **início ao endgame**: a **campanha** (atos/capítulos), o **leveling** (XP, atributos, árvore, ascendência), o **onboarding** dos sistemas (equipamento, crafting, mercado, dungeons) e o **handoff** para o endgame. O loop infinito pós-campanha está em [ENDGAME.md](./ENDGAME.md).

---

## 1. Como os líderes estruturam a jornada (o que copiar)

| Jogo | Campanha | Leveling | Handoff para endgame | Lição para nós |
|---|---|---|---|---|
| **PoE2** | **4 atos + 3 interlúdios**, ~12–30h, até nível ~59–65 | "dois jogos colados": campanha (lvl 1–60) e depois otimização de XP (60–100) | ao fim, abre o **Atlas** (mapas/waystones) | a campanha **ensina** a build; o endgame **otimiza** — separar as duas fases |
| **Diablo 4** | campanha pode ser **pulada** em personagens novos; foco em subir e desbloquear sistemas | nível + **Paragon** (pós-cap) | nível ~50+ abre Nightmare/Helltide; depois **Torment 1–12** | não obrigar rejogar campanha; **guiar** com uma jornada de temporada |
| **Last Epoch** | **9 capítulos**; o **Cap. 3** já abre o endgame (Monolith) | XP + árvore + **maestria** cedo | portal no hub "End of Time" leva ao **Monolith** | **fantasia/poder cedo** e endgame **acessível já no meio da campanha** |

**Insight central.** Os três concordam em três coisas: (1) a **campanha ensina** e dá a primeira build funcional; (2) **não se deve reobrigar** a campanha inteira para trocar de build/classe; (3) há um **momento de handoff** claro em que o jogo "abre". No BuildsWar, como o combate é **assíncrono**, a campanha é uma **sequência de dungeons narrativas** que o jogador **envia** o herói para vencer — cada vitória avança a história, dá XP/loot e **desbloqueia o próximo sistema**.

---

## 2. Modelo de progressão do BuildsWar

### 2.1 A campanha como "trilha de dungeons narrativas"

Em vez de zonas exploráveis em tempo real, a campanha é uma **trilha ordenada de encontros** (usa o mesmo motor de [dungeon assíncrona + bestiário](./BESTIARY_AND_DUNGEONS.md)). Cada nó da trilha:

- tem **texto narrativo** (setup + desfecho lido no relatório), um **encontro** (composição/bestiário) e uma **recompensa garantida** (item/XP/moeda/desbloqueio);
- é **balanceado como um tutorial de mecânica**: o primeiro ensina *golpe*, o próximo *resistência a fogo*, depois *AoE contra enxame*, *dano-no-ar contra voadores*, etc. — a curva do bestiário vira a **didática**;
- ao vencer, **avança a história** e pode **desbloquear um sistema** (crafting, mercado, árvore, ascendência).

> **Por que assíncrono ajuda aqui.** A "campanha" não exige horas de execução manual: o jogador **monta a build**, **envia**, lê o **relatório causal** (o que aconteceu e por quê), ajusta e avança. A decisão de build **é** o gameplay — exatamente o pilar do projeto.

### 2.2 Os eixos de poder que sobem na campanha

| Eixo | O que sobe | Onde no doc |
|---|---|---|
| **Nível & XP** | XP vem de dungeons vencidas; nível libera atributos e requisitos de item | §2.3 |
| **Atributos** | Força/Destreza/Inteligência — habilitam armas/skills e escalam (já em [types](../src/game/types.ts)) | §2.3 |
| **Árvore passiva** | pontos por nível; esculpe o arquétipo (já existe no protótipo) | [tree] |
| **Habilidades + suportes** | novas skills por arma/classe; soquetes de suporte | [EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md) |
| **Ascendência** | especialização desbloqueada por um **marco** da campanha (à la prova/labirinto) | §2.4 |
| **Equipamento & crafting** | loot da trilha + orbes/bancada liberados por capítulo | [ARPG_RESEARCH](./ARPG_RESEARCH.md) |

### 2.3 Curva de XP e nível (emprestada do gênero)

- **Campanha lvl 1 → ~60** (piso do gênero: PoE2 ~59–65 ao fim da campanha; endgame leva a 100).
- XP por dungeon escala com **nível do encontro** e **corrupção/dificuldade** (ver [ENDGAME](./ENDGAME.md) §penalidade/bônus).
- **Sem "moer" manual:** como o combate é enviado, a campanha avança por **decisão + tentativa**, não por repetição braçal. A repetição opcional (re-enviar para farmar XP/loot) existe, mas **não é obrigatória** para progredir a história.
- **Atributos** liberam armas/skills (requisito) e dão escala leve (Força→vida/físico; Destreza→precisão/velocidade; Inteligência→ES/mana) — já modelado em `Power`.

### 2.4 Marcos da campanha (os "beats" que abrem sistemas)

Sequência sugerida (nomes provisórios), cada marco = uma dungeon-chefe narrativa que **abre um sistema**:

1. **Prólogo — O Golpe.** Ensina golpe/DPS. Abre: **inventário/equipar**.
2. **Ato I — A Cripta.** Ensina res. a fogo + horda. Abre: **árvore passiva** + primeiros orbes de **crafting**.
3. **Ato II — A Fornalha.** Ensina "poucos-fortes" + mitigação de golpe grande. Abre: **mercado** (compra imediata assíncrona).
4. **Interlúdio — A Prova.** Desafio de build restrita. Abre: **1ª ascendência** (especialização).
5. **Ato III — A Geleira.** Ensina frio/controle + **voadores** (dano-no-ar). Abre: **bancada determinística** de crafting.
6. **Ato IV — A Fenda.** Chefe multi-fase com **caos** (fura ES). Abre: **2ª ascendência** e o **endgame** (o "Atlas" do BuildsWar).

Cada marco entrega **poder legível** (uma peça, um ponto de ascendência, um sistema) — a lição de Last Epoch: **fantasia forte cedo**.

---

## 3. Onboarding — a campanha como tutorial dos sistemas

O maior erro a evitar (Diablo 4/PoE2): **despejar sistemas** de uma vez. A campanha **libera um sistema por vez**, no momento em que ele resolve um problema recém-apresentado:

- o jogador **morre de fogo** → o marco seguinte abre **res. a fogo** e ensina a craftar por ela;
- o jogador **não limpa a horda** → abre **AoE/suportes** e a árvore relevante;
- os **voadores** o travam → abre uma skill que **atinge o ar** e ensina a ler o **preview** da dungeon.

Isso transforma o **relatório causal** ([BESTIARY §6](./BESTIARY_AND_DUNGEONS.md)) no **professor** do jogo: cada derrota é uma lição com **delta acionável**.

---

## 4. O handoff — quando o jogo "abre"

Ao vencer o **Ato IV**, o personagem:

- atinge ~nível 60, tem **build funcional**, **ambas as ascendências** e todos os sistemas destravados;
- ganha acesso ao **endgame** (ver [ENDGAME.md](./ENDGAME.md)): o mapa/loop infinito com dificuldade escalável e recompensa crescente;
- **nunca precisa rejogar a campanha** para trocar de build: **respec barato** e **loadouts** (é barato para nós porque não há execução manual) — ataca diretamente o cansaço de "rejogar para trocar de classe".

**Regra de ouro do handoff:** o endgame deve estar **visível** (o jogador sabe que existe e o que ganha lá) **antes** de terminar a campanha — como o Monolith de Last Epoch, acessível já no capítulo 3, dá **direção**.

---

## 5. Progressão de conta × de personagem (encaixe no MVP)

O [MVP §7](./MVP.md) já separa **conta** (permanente: títulos, conquistas, histórico) de **personagem** (por liga: classe, nível, XP, baú). A campanha vive no **personagem**:

- **Liga sazonal:** cada liga recomeça a campanha (economia/ranking novos) — a campanha é **rejogável por temporada**, com **mecânica sazonal** injetada nos encontros.
- **Conta:** guarda o **progresso narrativo já visto** (permite pular cutscenes/relatos em personagens novos, à la D4 "pular campanha") **sem** pular o **poder** (o novo personagem ainda sobe do zero).
- **3 personagens por liga** (MVP): cada um pode trilhar a campanha com um arquétipo diferente.

---

## 6. Diretrizes de design (dos líderes, para o nosso modelo)

- **Ensinar, não despejar:** um sistema por marco, no momento em que resolve um problema.
- **Fantasia/poder cedo** (Last Epoch): a primeira ascendência e a primeira skill "que limpa a tela" chegam **no meio**, não no fim.
- **Nunca reobrigar a campanha** para trocar build (D4/PoE2): respec + loadouts baratos.
- **Endgame visível cedo** (Last Epoch): direção desde o começo.
- **Campanha = decisão de build**, não execução manual: cada nó é um **puzzle de build**, lido no relatório causal.
- **Recompensa garantida por marco:** o jogador **sempre** sai mais forte de um beat da história (não depende só de RNG de drop).

---

## 7. Modelo de dados (esboço — encaixa no motor atual)

Extensões previstas (a detalhar quando implementar; mantêm tudo **puro/testável**):

```ts
interface CampaignNode {
  id; act: number; order: number
  title; narrativeIntro; narrativeOutcome   // texto lido no relatório
  encounter: DungeonComposition             // reusa o bestiário/composição
  levelReq: number
  guaranteedReward: { xp; loot?; unlock?: SystemId }  // XP + item + sistema
  unlocksSystem?: 'inventory'|'tree'|'crafting'|'market'|'ascendancy'|'bench'|'endgame'
  teaches?: string                          // a mecânica que o nó ensina
}

interface CharacterProgress {
  level; xp; act; completedNodes: string[]
  ascendancy?: string[]                     // marcos de especialização
  unlockedSystems: SystemId[]
  endgameUnlocked: boolean
}
```

O `XP` entra no `DungeonOutcome`/relatório (hoje o outcome já tem `seconds`/`survivable`/`cause`; ganha `xpGained`). O **desbloqueio de sistema** é um efeito do reducer ao concluir um `CampaignNode`.

### 7.1 Faseamento
- **P1:** estrutura de `CampaignNode[]` + trilha ordenada + XP/nível no outcome (reusa dungeon/bestiário).
- **P2:** desbloqueio progressivo de sistemas (inventário→árvore→crafting→mercado→ascendência→bench→endgame).
- **P3:** ascendência por marco + respec/loadouts baratos.
- **P4:** injeção sazonal na campanha + "pular relato" por conta.

---

## 8. Fontes

**PoE2 — campanha/leveling**
- [PoE2 Leveling Guide (Grindout)](https://grindout.com/poe-2/guides/leveling)
- [PoE2 Campaign Leveling & Endgame (domistae)](https://domistae.github.io/poe2-leveling/)
- [PoE2 Endgame Overview (Mobalytics)](https://mobalytics.gg/poe-2/guides/endgame-overview)

**Diablo 4 — progressão/jornada**
- [D4 Endgame Progression (Maxroll)](https://maxroll.gg/d4/meta/endgame-progression)
- [D4 Season Journey (Wowhead)](https://www.wowhead.com/diablo-4/guide/gameplay/season-journey)
- [D4 Season Journey (Fextralife)](https://diablo4.wiki.fextralife.com/Season+Journey)
- [D4 Difficulty/Torment (Wowhead)](https://www.wowhead.com/diablo-4/guide/gameplay/difficulty-torment-levels)

**Last Epoch — campanha/timelines**
- [LE Campaign and Timelines Overview (Icy Veins)](https://www.icy-veins.com/last-epoch/campaign-and-timelines-overview)
- [LE Monolith Beginner Guide (Maxroll)](https://maxroll.gg/last-epoch/monolith/beginner-guide)
</content>
