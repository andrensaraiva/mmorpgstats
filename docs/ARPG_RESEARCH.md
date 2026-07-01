# Pesquisa de Gênero — ARPG (PoE2, Diablo 4, Last Epoch) e implicações para o BuildsWar

- **Objetivo:** pesquisa ampla e profunda do mundo ARPG para orientar o produto final — o que os líderes fazem, o que os jogadores amam, o que reclamam, e como o modelo assíncrono do BuildsWar pode virar isso a nosso favor. Inclui o **redesenho do Market**.
- **Data:** 01 de julho de 2026
- **Relacionados:** [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md) · [Roadmap de Polimento](./POLISH_ROADMAP.md) · [Visão do MVP](./MVP.md)
- **Método:** varredura de guias, wikis, imprensa especializada e discussões de comunidade (fontes em §10). Onde números divergem entre fontes, mantemos a descrição qualitativa.

---

## 1. Resumo executivo (o que aprender de cada um)

| Jogo | Força que copiar | Fraqueza que evitar |
|---|---|---|
| **Path of Exile 2** | profundidade de build, trade-offs (o item é uma peça de quebra-cabeça, não só número maior), suportes sem restrição de classe, **market oficial assíncrono com compra imediata** | endgame repetitivo e sem direção, empolgação vem de moeda e não de gear, **trade praticamente obrigatório** para o topo, burnout, performance |
| **Diablo 4** | leitura simples (Item Power), acessibilidade | **itemização rasa**, **ausência histórica de loot filter**, sobrecarga de loot (25 itens "épicos" de uma vez), QoL atrás dos rivais |
| **Last Epoch** | **crafting determinístico** (você mira o item), **loot filter excelente**, **sistema de facções de trade** que respeita quem quer farmar e quem quer negociar, gifting, amigável a novatos | crafting "determinístico demais" tira a emoção para parte do público |

**Insight central:** o diferencial do BuildsWar — combate assíncrono com **autoridade do servidor** e loot lido em **relatório**, não catado no chão — **neutraliza nativamente as três maiores dores do gênero**: fricção de trade, sobrecarga/filtro de loot e escândalos de mercado. Isso deve ser explorado como vantagem competitiva, não escondido. Ver §5.

---

## 2. Como funcionam os líderes (paridade e referência)

### 2.1 Path of Exile 2 — sistemas
- **Gemas de habilidade:** soquetes saíram do equipamento e foram para as **gemas**. Cada skill aceita até **5 suportes**. Skills não dropam prontas: você acha **gemas não-lapidadas** e escolhe em que transformar.
- **Armas definem o jogo:** bestas, focos, cetros etc.; a **arma equipada libera o leque de habilidades** (base do nosso design em [EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md)).
- **Árvore passiva gigante** com **dupla especialização de arma** (passivas engajam conforme a arma/tipo de skill usados).
- **Classes + ascendências** desbloqueadas por provas estilo labirinto.
- **Crafting:** orbes (caos reroda raro, exaltado adiciona mod, divino reroda valores) **+ runas** soquetáveis (traços locais **determinísticos**) **+ bancada**. Ou seja, PoE2 mistura gamble (orbes) com determinismo (runas/bancada).
- **Endgame:** Atlas com **waystones** (níveis de mapa), árvore do Atlas (300+ nós), chefes pináculo, sistemas de crafting próprios por linha.

### 2.2 Diablo 4 — a reforma de itemização (2024–2025)
Depois de muita crítica, a D4 reformou a itemização e ficou "mais amigável que nunca":
- **Tempering:** escolhe-se o afixo desejado de uma receita (menos RNG).
- **Greater Affixes:** versões ~1,5× mais fortes, só dropam.
- **Masterworking:** refina a base (dano/armadura/res.) e pode elevar um afixo a "greater".
Lição: o público **recompensa determinismo e agência** ("craftar o que quero em vez de rezar pro RNG").

### 2.3 Last Epoch — o "meio-termo" querido
- **Crafting determinístico, transparente e recompensador** — mira-se o item final.
- **Loot filter de classe mundial** (recolore/oculta no chão por base/afixo/idol).
- **Facções de item** (ver §6) resolvendo a briga farmar × negociar.
- Considerado onde o jogador "cai" quando D4 é raso demais e PoE punitivo demais.

---

## 3. O que os jogadores AMAM (sinais a perseguir)

1. **Decisão de build com trade-off**, não upgrade linear — "achar a peça certa do quebra-cabeça".
2. **Crafting com agência** — mirar o resultado, com alguma emoção (mix determinismo + gamble).
3. **Loot que muda decisão** e é **legível** (cor/ícone/filtro), não uma enxurrada.
4. **Liberdade de build** — suportes/skills sem amarras artificiais de classe (só requisito de atributo/arma).
5. **Endgame acessível e com direção**, com QoL (o abandono da D4 veio de QoL atrás dos rivais).
6. **Comparação clara** equipado × candidato.

## 4. O que os jogadores RECLAMAM (armadilhas a evitar)

**Trade (a maior dor do PoE):**
- Sussurrar vendedor **offline**; vasculhar **400 listagens** irrelevantes; perder 15–20 min/sessão em trades ruins.
- **Golpes**: "bait and switch" (troca o item na janela), **price-fixing** em sites terceiros.
- **Live search / sniping** e dependência de **overlays de terceiros** — o mercado oficial sozinho não resolve tudo.
- **Trade obrigatório** para o topo afasta quem prefere solo.

**Loot / itemização:**
- **Sobrecarga** (D4 despejando dezenas de itens) sem **loot filter** → tempo jogado no lixo.
- Empolgação vindo de **moeda/craft** e não de **gear** (crítica ao PoE2).
- Itemização **rasa** (só "Item Power") entedia.

**Endgame:**
- **Repetitivo, sem direção nem payoff**; grind longo até o conteúdo difícil; **burnout**.
- Rejogar campanha inteira para trocar de classe cansa.

**Crafting:**
- Gamble puro frustra (rezar pro RNG); mas **determinismo demais** tira a graça para parte do público → **precisa de ambos os modos**.

## 5. A vantagem estrutural do BuildsWar (nosso modelo vira solução)

O combate assíncrono + autoridade do servidor + loot por relatório **resolve de graça** o que os líderes penam para consertar:

- **Fricção de trade → quase zero.** Sem combate em tempo real e com servidor autoritativo, um **market oficial 100% assíncrono, com compra imediata** é natural: **sem sussurro, sem status online, sem bait-and-switch**. A dor nº1 do PoE simplesmente não existe aqui. **É o nosso maior diferencial — destacar, não esconder.**
- **Sobrecarga/loot filter → nativo.** O jogador **lê drops numa lista**, não cata no chão. Filtros, ordenação e **comparação** entram por padrão, cobrindo a lacuna histórica da D4 desde o dia 1.
- **Manipulação de mercado → auditável.** Servidor como autoridade + ids únicos de item + registro de transações (já no MVP §21) tornam price-fixing e duplicação rastreáveis.
- **"Números descobertos" (já temos)** casa com "loot que muda decisão": o valor real emerge do teste, não de um número inflado no chão.

## 6. Recomendações por sistema (para o produto final)

### 6.1 Itemização
- Manter a filosofia **trade-off > número maior** (PoE), com **defesas/qualidade/requisitos** ricos (paridade PoE2, já em [EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md)).
- Adotar um equivalente a **greater affixes** (afixo "excepcional") como topo aspiracional que **só dropa** — dá caça a gear, não só a moeda (corrige a crítica ao PoE2).

### 6.2 Crafting — dois trilhos (agrada os dois públicos)
- **Trilho gamble** (já temos): orbes + corrupção Vaal (emoção/topo).
- **Trilho determinístico** (adicionar): uma **bancada/runas** para mirar afixos específicos (ao estilo Last Epoch/tempering). Assim cobrimos "quero mirar" e "quero arriscar".

### 6.3 Habilidades
- Seguir o design por **arma + classe + tier de nível** (print do PoE2), com **suportes sem restrição de classe** (só atributo/tag) — a liberdade que os jogadores elogiam.

### 6.4 Loot & filtros
- **Loot filter de primeira classe** por base/raridade/afixo/tier, com presets — desde cedo, como QoL central (não como remendo).
- **Comparação** equipado × candidato embutida em relatório, inventário e market.

### 6.5 Trade / Market — ver redesenho detalhado em §7.

### 6.6 Escolha farmar × negociar (facções, de Last Epoch)
- Oferecer **dois caminhos**: **Autossuficiente** (drops melhores + "profecias"/direcionamento, sem market) vs **Mercador** (acesso ao market/bazaar). Respeita solo e trader sem forçar trade — resolve a crítica "trade obrigatório" do PoE2. Casa com a estrutura de ligas do MVP.

### 6.7 Endgame & retenção
- Dar **direção e payoff** (evitar o "vagar sem objetivo" do PoE2): objetivos claros, progressão de dificuldade legível, e **derrota compreensível** (já é nosso pilar).
- **Sem obrigar rejogar campanha** para experimentar outra build: como não há execução manual, permitir **respec/loadouts** baratos é barato para nós e ataca o cansaço de rejogar.

## 7. Redesenho do Market (com busca avançada, no padrão do print)

Alvo: um mercado que os jogadores de ARPG reconheçam como "completo", **sem** herdar a fricção do PoE.

### 7.1 Modelo
- **Market oficial assíncrono, isolado por liga** (já no MVP), com **Compra Imediata (Instant Buyout)** como padrão — **sem sussurro, sem status online, sem negociação manual**. Compra confirma na hora; item entra no baú; moeda debita. (É o que o PoE2 correu atrás; para nós é nativo.)
- **Sem live-search/sniping como cultura**: buyout assíncrono remove a corrida de quem sussurra primeiro.
- **Anti-abuso:** taxa de anúncio/venda (sumidouro), **moeda de favor ganha jogando** (de Last Epoch) para limitar bots/manipulação, e ids/transações auditáveis.

### 7.2 Painel de busca avançada (espelhando o print do PoE2)
- **Busca por texto** + "somente compra imediata".
- **Filtros de tipo:** categoria do item, raridade, **nível do item**, **qualidade**.
- **Filtros de equipamento/stat (min–max):** dano, chance de crítico, **DPS físico**, **DPS elemental**, ataques por segundo, tempo de recarga (armas de recarga), **armadura**, **evasão**, **escudo de energia**, bloqueio, **recurso/"spirit"**, **soquetes de runa**.
- **Requisitos (min–max):** nível, Força, Destreza, Inteligência.
- **Filtros de endgame:** nosso equivalente às *waystones* (nível/tier de mapa, quantidade/raridade de itens, tamanho de pacote, modificadores de fragmento sazonal).
- **Por afixo:** buscar por família de modificador (ex.: "res. a fogo ≥ 30") e por **tier**.
- **Ordenação:** preço ↑/↓, data; **buscas salvas**.

### 7.3 UX que passa à frente do PoE
- **Comparação inline** com o item equipado no slot equivalente (delta verde/vermelho) — decidir sem sair da listagem.
- **Histórico de preço** por base/afixo para ancorar valor (mata o "pago o primeiro preço que vejo").
- **Zero telas de golpe:** como não há troca manual, **bait-and-switch é impossível** por construção. Comunicar isso como recurso.
- **Mobile e teclado** desde o início (o MVP exige paridade mobile).

### 7.4 Estado atual × alvo (no código)
Hoje `MarketPage` é uma tabela estática com filtros decorativos. Evolução:
1. Filtros **funcionais** (tipo/raridade/afixo/ordenar) sobre `MARKET` em `content.ts`.
2. **Compra imediata** movendo o item para o baú e debitando moeda (liga a S4/baú do design).
3. Painel de **busca avançada** (min–max de stats) quando o modelo de item rico (S1) existir.
4. **Comparação** e **histórico de preço**.

## 8. Riscos e armadilhas (não repetir os erros deles)

- **Não** deixar a empolgação vir só de moeda/craft — garantir **gear caçável** (afixo excepcional que só dropa).
- **Não** lançar sem **loot filter** e **comparação** — foi o pecado da D4.
- **Não** tornar o **market obrigatório** para progredir — oferecer o caminho autossuficiente (facções).
- **Não** criar endgame sem direção/payoff — objetivo e recompensa legíveis.
- **Cuidado com determinismo total** no crafting — manter um trilho de gamble para o topo/emoção.
- **Economia sazonal** e sumidouros desde cedo para evitar inflação (já no MVP §12.3).

## 9. Próximos passos sugeridos (encaixe nos docs)

1. Incorporar **facções (farmar × negociar)** e **afixo excepcional** ao [EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md) e ao MVP.
2. Priorizar **loot filter + comparação** no [POLISH_ROADMAP](./POLISH_ROADMAP.md) (elevam de "protótipo" a "produto").
3. Evoluir o Market conforme §7 — começando pelos **filtros funcionais + compra imediata** e, com o modelo de item rico (S1), a **busca avançada min–max**.
4. Adicionar o **trilho de crafting determinístico** (bancada/runas) ao lado do gamble já existente.

## 10. Fontes

- [Path of Exile 2 — PoE Wiki](https://www.poewiki.net/wiki/Path_of_Exile_2)
- [PoE2 Systems Guide — MMOJUGG](https://www.mmojugg.com/news/poe2-every-confirmed-feature-and-changes.html)
- [PoE2 Crafting Guide — EarlyGuides](https://earlyguides.com/path-of-exile-2/crafting)
- [PoE2 Trade Site Guide — Mobalytics](https://mobalytics.gg/poe-2/guides/poe2-trade-site)
- [PoE2 Trading Guide 2026 — Switchblade Gaming](https://www.switchbladegaming.com/path-of-exile-2/trading-guide-3/)
- [PoE2 performance & boring endgame — TheGamer](https://www.thegamer.com/path-of-exile-2-performance-issues/)
- [PoE2 devs respond to unpopular update — GameSpot](https://www.gamespot.com/articles/path-of-exile-2-devs-respond-to-unpopular-update-there-were-some-blatant-f-ups/1100-6530736/)
- [D4 vs PoE2 vs Last Epoch — Gamers Decide](https://www.gamersdecide.com/articles/last-epoch-vs-diablo-4-vs-path-exile-2)
- [Diablo 4 outgunned by PoE2 and Last Epoch — PCGamesN](https://www.pcgamesn.com/diablo-4/lord-of-hatred-learns-from-rival-arpgs)
- [D4 Itemization Rework — GameLeap](https://www.gameleap.com/articles/diablo-4-itemization-rework-breakdown-full-list-of-changes)
- [D4 Tempering & Masterworking — Icy Veins](https://www.icy-veins.com/d4/news/why-diablo-4s-tempering-masterworking-rework-is-game-changer/)
- [Last Epoch trade factions (dev blog)](https://forum.lastepoch.com/t/trade-development-update-introducing-merchants-guild-and-circle-of-fortune-factions/51994)
- [Circle of Fortune vs Merchant's Guild — GameSpot](https://www.gamespot.com/articles/last-epoch-should-you-choose-the-merchants-guild-or-circle-of-fortune/1100-6521329/)
- [Last Epoch crafting could learn from PoE2 — zLeague](https://www.zleague.gg/theportal/last-epoch-crafting-why-players-think-it-could-learn-from-poe-2/)
- [Last Epoch — golden age of ARPGs — PC Gamer](https://www.pcgamer.com/games/rpg/last-epochs-excellent-new-update-proves-were-in-a-golden-age-of-arpgs-and-theres-something-here-for-everyone/)
- [Understanding Loot Filters — Maxroll (Last Epoch)](https://maxroll.gg/last-epoch/resources/understanding-maxroll-loot-filters)
- [Beginner mistakes in D4, PoE, Last Epoch — Fextralife](https://fextralife.com/mistakes-almost-every-new-arpg-player-makes/)
