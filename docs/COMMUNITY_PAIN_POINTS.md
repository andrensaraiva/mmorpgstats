# Análise de Comunidade — dores ainda não cobertas e como o BuildsWar responde

- **Pergunta que este doc responde:** varrendo as **comunidades** de ARPG (Reddit, fóruns oficiais, Steam, imprensa), **o que mais os jogadores reclamam** — além do que já mapeamos — que possamos **adicionar/melhorar**? E: **esse público acharia o BuildsWar interessante?**
- **Data:** 01 de julho de 2026
- **Relacionados:** [Pesquisa de Gênero](./ARPG_RESEARCH.md) *(dores já cobertas)* · [Progressão](./PROGRESSION_AND_STORY.md) · [Endgame](./ENDGAME.md) · [Bestiário & Dungeons](./BESTIARY_AND_DUNGEONS.md) · [Catálogo de Conteúdo](./CONTENT_CATALOG.md) · [MVP](./MVP.md)
- **Método:** discussões de comunidade (Reddit/forums Blizzard e GGG/Steam/ResetEra) e imprensa (fontes em §5). Onde há divergência, fica a descrição qualitativa.

> **Escopo.** [ARPG_RESEARCH §4](./ARPG_RESEARCH.md) já cobriu: fricção de trade, sobrecarga/loot filter, itemização rasa, endgame sem direção, crafting (gamble × determinismo). **Este doc só traz o que é NOVO** — dores que ainda não têm resposta nos nossos docs — e verifica se o nosso modelo assíncrono as resolve.

---

## 1. As dores novas (o que a comunidade mais repete)

| # | Dor da comunidade | Jogo(s) | O que o jogador sente |
|---|---|---|---|
| **D1** | **Reset sazonal & FOMO** — progresso "apagado" a cada temporada; passe com prazo; re-grind obrigatório | D4, PoE1/2 | "não vou reinvestir tudo a cada 3 meses"; burnout; sensação de trabalho perdido |
| **D2** | **Rejogar a campanha toda temporada** é uma **tarefa** | D4, PoE1/2 | "a história é longa demais depois da 1ª vez; vira CHORE e me faz não querer jogar" |
| **D3** | **Morte injusta / one-shot / on-death** — morrer sem entender; explosões pós-morte; **tela poluída** esconde a ameaça | PoE2, D4 | "morri e não sei por quê"; defesa parece inútil; só glass-cannon anda rápido |
| **D4** | **Meta-slaving & build "bricada"** — 1–2 builds dominam; errar a build/respec caro "estraga" o personagem | todos | "ou copio o meta ou fico pra trás"; medo de experimentar |
| **D5** | **Always-online & instabilidade** — filas de login, quedas, rubberbanding; sem jogar offline | D4, LE (launch) | "paguei e não consigo entrar"; progresso travado por servidor |
| **D6** | **Monetização/estabilidade de confiança** — MTX caro, ansiedade de "cash shop predatório", abas de baú pagas | PoE1/2, D4 | "pricing ridículo"; medo de pay-to-win/pressão de loja |

---

## 2. O que dá para ADICIONAR/MELHORAR (resposta por dor)

### D1 — Reset sazonal sem apagar o esforço → **"legado de conta" + ligas eternas**
O que a comunidade quer é **recomeço justo sem sensação de trabalho jogado fora**. Proposta:
- **Liga Eterna (Standard) sempre disponível:** quem não quer o ciclo sazonal joga num mundo que **não reseta** (como o "Standard" do PoE, mas de primeira classe, não um depósito esquecido). O [MVP](./MVP.md) já isola ligas — basta uma ser **permanente e cuidada**.
- **Legado de conta permanente:** títulos, conquistas, **coleção de únicos vistos (codex)**, marcos de história — **não** dão poder competitivo (regra do MVP §7.1), mas **persistem** entre temporadas. O jogador vê que **nada do que descobriu se perdeu**.
- **Herança opcional ao fim da liga:** ao encerrar, o personagem/itens **migram para a Eterna** (nunca some), preservando a memória do esforço.
- **Sem FOMO de prazo:** recompensas de temporada viram **desbloqueáveis permanentes de cosmético/título** — o passe **não expira o conteúdo**, só marca **quando** você o fez.

### D2 — Rejogar campanha → **já resolvido pelo nosso modelo (e podemos ir além)**
Nossa [campanha](./PROGRESSION_AND_STORY.md) é uma **trilha de dungeons assíncronas** — decisão de build, não execução manual de horas. Ainda assim, para o **veterano** que já viu a história:
- **Pular relato por conta** (D4 fez isso): personagens novos podem **saltar a narrativa** e ir direto aos **marcos de poder/desbloqueio** — sobem do zero, mas **sem re-ler** o que já viram.
- **Campanha = minutos de decisão, não horas de grind** — a dor "CHORE" praticamente evapora no assíncrono.
- **Injeção sazonal** entra **na trilha existente** (não uma campanha nova inteira), então o veterano reencontra o familiar com um tempero novo.

### D3 — Morte injusta/one-shot/tela poluída → **nosso maior trunfo: relatório causal**
Esta é a dor que o **modelo assíncrono resolve como nenhum outro jogo pode**:
- **Não há "tela poluída":** o combate é **simulado pelo servidor** e lido em **relatório**. Nunca se perde a ameaça no meio de efeitos.
- **Sempre há "death recap":** o [relatório causal](./BESTIARY_AND_DUNGEONS.md#6-relatório-de-resultado--o-que-aconteceu-e-por-que-falhou) já diz **qual camada quebrou, contra qual tipo/arquétipo, e o delta acionável**. "Morri e não sei por quê" é **impossível** aqui.
- **Defesa importa e é legível:** as **camadas por tipo de dano** ([BESTIARY §5](./BESTIARY_AND_DUNGEONS.md)) fazem EHP/mitigação **decidirem** o resultado — o oposto do "só glass-cannon serve". **Melhoria a adotar:** um **medidor de "maior golpe recebido" e "% de EHP por tipo"** no relatório, para o jogador ver a margem contra one-shots **antes** de subir de tier.
- **Sem on-death explosions injustas:** se adotarmos mecânicas de risco, elas são **declaradas no preview** da dungeon ([BESTIARY §4](./BESTIARY_AND_DUNGEONS.md)) — nunca uma surpresa fatal.

### D4 — Meta-slaving & build bricada → **respec barato + "sandbox" de teste + diversidade forçada**
- **Respec/loadouts baratos** (já é nossa política, [PROGRESSION §4](./PROGRESSION_AND_STORY.md)): trocar de build **não pune**, porque não há execução manual a refazer. Mata o medo de "bricar".
- **Simulador de build antes de enviar (novo):** como o motor é **puro** e o DPS é "número descoberto", podemos oferecer um **modo de teste** (ex.: uma dungeon-treino de resultado imediato) que mostra a estimativa **sem consumir a run real** — o jogador **experimenta sem medo**.
- **Diversidade é obrigatória por design:** o [bestiário multi-tipo](./BESTIARY_AND_DUNGEONS.md) já garante que **nenhuma build única passa em tudo** — o "meta" vira **um conjunto de builds** (uma por composição), não uma só. Isso ataca a raiz do meta-slaving.
- **Rankings por perfil** (MVP §4.5) dão glória a builds **não-meta** (sobrevivência, velocidade, restrições) — há palco para o criativo, não só para o DPS-topo.

### D5 — Always-online/instabilidade → **o assíncrono é naturalmente tolerante**
- **A tentativa continua com o jogo fechado** (pilar do projeto): uma **queda de conexão não perde progresso** — o herói já foi enviado e o servidor resolve; o jogador lê o relatório quando voltar.
- **Sem filas de ação em tempo real:** não há rubberbanding/lag de combate porque **não há combate em tempo real** do lado do cliente.
- **Sessão útil em minutos** (MVP §6) e **web + mobile na mesma conta** reduzem a dependência de "estar online no momento certo".
- **Melhoria a registrar:** fila de envios **resiliente** (o cliente enfileira o envio; se cair, reenvia) e **estado sempre recuperável** do servidor autoritativo. *(Um modo offline completo conflita com mercado/ranking/autoridade do servidor — então a resposta é robustez, não offline.)*

### D6 — Monetização/confiança → **política explícita anti-predatória**
O MVP já **proíbe** pay-to-win, NFTs e conversão em dinheiro real. Formalizar como **promessa de marca**:
- **Zero poder à venda** — só cosmético/conveniência **não-competitiva**.
- **Sem paywall de QoL essencial:** **loot filter, comparação e abas de baú suficientes** entram **de graça** (a aba de baú paga foi mágoa histórica do PoE). Baú generoso por padrão.
- **Preços honestos e comunicados** — evitar a percepção de "cash shop predatório".
- **Economia auditável** (servidor autoritativo, ids únicos, transações registradas — MVP) → **confiança** vira diferencial contra os escândalos de mercado dos rivais.

---

## 3. Este público acharia o BuildsWar interessante? (leitura honesta)

**Para quem é um "sim" forte:**
- **O ARPG-enthusiast sem tempo** — ama build/loot/economia mas não aguenta grind manual: é **exatamente** o alvo do MVP. O assíncrono entrega a **fantasia de build** em **sessões de minutos**.
- **O teórico de build / theorycrafter** — "números descobertos" + motor puro + simulador de teste é um **paraíso** para quem gosta de otimizar planilha.
- **O que odeia trade/loot-spam** — o mercado de compra imediata e o loot-por-relatório **removem** as duas dores que o fizeram largar PoE/D4.
- **O queimado de reset sazonal** — a **Liga Eterna + legado de conta** dá um lar sem FOMO.
- **Mobile/casual estratégico** — a mesma conta no PC e celular, decisão > reflexo.

**Para quem é um "talvez/não" (e como mitigar):**
- **Quem ama a execução mecânica** (o "dodge no momento certo", o clique satisfatório): o assíncrono **não** entrega isso. **Mitigação:** vender a fantasia certa — "**você é o mestre da build, não o piloto**" — e caprichar no **relatório/animação de resultado** para dar dopamina de payoff.
- **Quem quer socializar em tempo real** (co-op, matar chefe junto): **Mitigação:** social **assíncrono** — ligas privadas, rankings, **presentear/negociar**, competições de build, talvez **duelos de build** (simulação build×build) e chefes de guilda cooperativos por contribuição.
- **O cético de "idle/auto-battler é raso"**: **Mitigação:** provar profundidade — o bestiário multi-tipo, o crafting em dois trilhos e o relatório causal mostram que **a decisão é densa**, mesmo sem execução.

**Veredito:** o BuildsWar **não compete de frente** com PoE2/D4/LE na fantasia de execução — ele **abre um nicho adjacente** ("ARPG de decisão, assíncrono") que **resolve nativamente** as dores que fazem esse mesmo público reclamar. O risco não é "eles não vão gostar do gênero"; é **comunicar que profundidade existe sem execução manual**. Por isso o **relatório causal** e o **simulador de build** não são features — são o **argumento de venda**.

---

## 4. Recomendações acionáveis (para os docs/roadmap)

1. **Liga Eterna de primeira classe + legado de conta permanente** (codex de únicos, títulos, história) — anexar ao [MVP](./MVP.md) e à estrutura de ligas. *(resolve D1)*
2. **Pular-relato por conta** para veteranos na campanha — anexar a [PROGRESSION](./PROGRESSION_AND_STORY.md) §5. *(resolve D2)*
3. **Enriquecer o relatório:** "maior golpe recebido", "% de EHP por tipo", **margem contra one-shot** — anexar a [BESTIARY §6](./BESTIARY_AND_DUNGEONS.md). *(resolve D3)*
4. **Modo de teste/simulador de build** (estimativa sem consumir run) — feature de UX; casa com "números descobertos". *(resolve D4)*
5. **Fila de envios resiliente** e estado recuperável — nota de arquitetura no MVP. *(resolve D5)*
6. **Promessa anti-predatória explícita:** zero poder à venda, QoL/baú grátis, preços honestos — seção de princípios no [MVP](./MVP.md). *(resolve D6)*
7. **Social assíncrono** (duelos de build, chefes de guilda por contribuição, presentear) — registrar como direção pós-MVP. *(mitiga o "talvez")*
8. **Comunicação de produto:** posicionar como **"ARPG de decisão"** e usar **relatório causal + simulador** como prova de profundidade. *(mitiga o "talvez")*

Nada aqui exige reescrever o motor: são **extensões** do que já existe (relatório, ligas, campanha, rankings). Encaixam no faseamento dos docs correspondentes.

---

## 5. Fontes

**Reset sazonal / FOMO / burnout**
- [Why D4 players keep having the same ARPG debate — Icy Veins](https://www.icy-veins.com/d4/news/diablo-4-arpg-grind-seasonal-debate/)
- ["The ARPG genre is cooked w/ seasonal models" — Blizzard Forums](https://us.forums.blizzard.com/en/d4/t/the-arpg-genre-is-cooked-w-seasonal-models/226840)
- [I finally like D4 by embracing laziness — PC Gamer](https://www.pcgamer.com/games/rpg/i-finally-like-diablo-4-now-and-its-because-i-embraced-laziness/)

**Rejogar campanha**
- ["I am NOT replaying the campaign every season" — Blizzard Forums](https://us.forums.blizzard.com/en/d4/t/i-am-not-replaying-the-campaign-every-freaking-season/77757)
- [D4 campaign skip; time for PoE to do the same — PoE Forums](https://www.pathofexile.com/forum/view-thread/3380124/page/3)

**One-shots / on-death / clareza de morte / balance**
- [PoE2 EA feedback — design direction & nerfs — PoE Forums](https://www.pathofexile.com/forum/view-post/26294752)
- [PoE2 Patch 0.1.1 breakdown (on-death removed, one-shots) — itemd2r](https://www.itemd2r.com/en/blog/poe-2/Path-of-Exile-2-Patch-011-Breakdown-Key-Changes-and-Player-Insights)
- [PoE2 performance & boring endgame — TheGamer](https://www.thegamer.com/path-of-exile-2-performance-issues/)

**Always-online / offline / servidores**
- [Last Epoch Offline Mode — SSEGold](https://www.ssegold.com/last-epoch-offline-mode)
- [Can you play D4 offline? — D4Dead](https://d4dead.com/can-you-play-diablo-4-offline/)

**Monetização / confiança**
- ["MTX pricing is pitifully laughable" — Steam (PoE2)](https://steamcommunity.com/app/2694490/discussions/0/598522350980339610/)
- [Alleged D4 survey concerning question — MMORPG.com](https://forums.mmorpg.com/discussion/503389/alleged-diablo-4-survey-asks-players-a-very-concerning-question-mmorpg-com)

**Diversidade de build / meta**
- [Lack of build diversity after an ARPG binge — ESO Forums](https://forums.elderscrollsonline.com/en/discussion/578368/hard-to-get-back-into-the-game-after-an-arpg-binge-lack-of-build-diversity)
</content>
