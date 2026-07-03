# Design — Rotação real (recurso + cooldown), Combo e Boneco de Treino

- **Pergunta que este doc responde:** como transformar a **tela de habilidades** de uma lista fixa (onde só a `sk_strike` gera DPS) em um **loadout escolhido pelo jogador com combo/rotação de impacto real**, e como introduzir um **Boneco de Treino** que mede o DPS na hora — complementando (não substituindo) a dungeon.
- **Data:** 03 de julho de 2026
- **Decisões do dono (03/jul):** (1) o boneco **complementa** a dungeon — medição grátis e instantânea do DPS real; a dungeon segue como teste "de verdade" (sobrevivência + loot). (2) O combo vai a **rotação real** — skills com **custo de recurso e cooldown**, simuladas no tempo (reescreve o cálculo de DPS). (3) Escrever **este doc primeiro**; após aprovação, codar.
- **Relacionados:** [Motor & Arquétipos](./COMBAT_AND_ARCHETYPES.md) (trilha M) · [Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md) (trilha S) · [Handoff](./HANDOFF.md) · [Pesquisa de Gênero](./ARPG_RESEARCH.md)

> **Onde encaixa no que já existe:** o [COMBAT_AND_ARCHETYPES §A4](./COMBAT_AND_ARCHETYPES.md) já prevê **M5 — Execução por ticks** (a simulação determinística no tempo) como "o grande risco técnico do MVP", planejado por último. **Esta iniciativa antecipa uma fatia vertical do M5** — um simulador de rotação sobre a matemática física atual (single-type) —, priorizando a rotação/combo agora e deixando o pipeline **largo** (multi-tipo/ailments) do M1–M4 entrar depois **sem reescrever a rotação**. Ou seja: não é sistema novo paralelo, é o M5 começando cedo e estreito.

---

## 1. Pesquisa do gênero (o que embasa as decisões)

**DPS aparece — como estimativa.** No PoE2 o tooltip da gema mostra DPS/"Dano médio", mas o próprio jogo avisa que **não é o DPS real** (ignora DoT, dano secundário, etc.). Confirma a filosofia de **"números descobertos"** que já temos (estimativa ±15% até medir).

**O boneco de treino é um pilar do gênero.** O **Training Grounds** do Lost Ark deixa o jogador **testar a build contra um boneco**, trocar skills/atributos/engravings à vontade e **medir o dano**, inclusive invocando tipos de inimigo e chefes. PoE/PoE2 têm bonecos no esconderijo com a mesma função. É o lugar canônico do "bater no boneco pra ver quanto sai".

**Combo/rotação é o coração do build moderno.** Last Epoch usa **poucos slots de propósito**, pra forçar sinergia ("tudo na barra importa"). Diablo 4 gira em **setup → payoff**: uma skill aplica um bônus/marca e a próxima **consome** pra multiplicar (ex.: Ground Stomp → Charge; rotação de elementos do Sorcerer). A skill primária define a rotação; as outras a habilitam.

**Tradução para o BuildsWar:**
- Boneco = a **estação de medição** diegética do "número descoberto" (o measured), grátis e instantânea.
- Rotação = **poucas ativas com sinergia forte**, com **recurso e cooldown** que punem a "sopa de botões" e recompensam a ordem certa.
- Impacto forte = uma rotação boa (combo em uptime + recurso não estourado) rende **bem mais DPS** que apertar a skill mais forte no vácuo.

**Fontes:** [PoE2 — como ver DPS (Escorenews)](https://escorenews.com/en/article/64680-how-to-see-dps-in-poe-2-how-to-display-real-effective-damage-using-dps-calculator-in-path-of-exile-2) · [PoE2 — Damage Scaling (Maxroll)](https://maxroll.gg/poe2/getting-started/damage-scaling) · [Lost Ark Training Room (Fiction Horizon)](https://fictionhorizon.com/lost-ark-training-room/) · [PoE — pedido de Training Dummies (fórum)](https://www.pathofexile.com/forum/view-thread/3418709) · [Last Epoch review — poucos slots por sinergia (PC Gamer)](https://www.pcgamer.com/last-epoch-is-everything-i-wished-diablo-4-was-and-the-first-arpg-to-drag-me-away-from-path-of-exile-in-over-a-decade/) · [Diablo 4 — rotações setup→payoff (Maxroll)](https://maxroll.gg/d4/build-guides)

---

## 2. Diagnóstico do estado atual

O que **já existe** e vira alicerce:
- **`aggregate`** ([engine.ts](../src/game/engine.ts)) deriva o DPS de golpe único com crítico em **valor esperado** (`critFactor`). Isso é ouro: um simulador por ticks que usa valor esperado é **determinístico sem RNG** → mantém "mesma build → mesmo número".
- **`fingerprint` + `measured`** já implementam "números descobertos": o DPS real só é exibido quando o fingerprint bate; trocar item/craftar/mexer na árvore invalida.
- **Suportes por tags** ([content.ts](../src/game/content.ts)) já funcionam por soquete.

O que **não tem impacto hoje** (a lacuna que o dono sentiu):
- **Só a `sk_strike` (`MAIN_SKILL_ID`) gera DPS.** As outras 3 skills são decorativas no motor.
- As **"Regras de comportamento"** (`BEHAVIOR`, when→then) são puramente ilustrativas — nada é simulado.
- **Não há recurso, cooldown, cast time nem combo.** Não existe "montar a rotação".

Conclusão: temos a **matemática de um golpe**; falta o **motor que sequencia vários golpes no tempo** e a **UI que deixa montar essa sequência**.

---

## 3. Visão do sistema (as três peças, unificadas)

```
  ┌─────────────────────────┐     ┌──────────────────────────┐     ┌───────────────────────┐
  │  TELA DE HABILIDADES     │     │  MOTOR — SIMULADOR        │     │  BONECO DE TREINO      │
  │  (montar o combo)        │     │  (execução por ticks)     │     │  (medir o resultado)   │
  │                          │     │                           │     │                        │
  │  • escolher ativas do    │──►  │  simulateRotation(build,  │──►  │  • roda a sim contra   │
  │    pool (estilo árvore)  │     │    target, seconds)       │     │    um alvo modificável │
  │  • ordenar prioridade    │     │  → DPS medido +           │     │  • mostra DPS medido + │
  │  • encaixar suportes     │     │    diagnóstico            │     │    diagnóstico         │
  │  • marcar combos         │     │  (determinístico)         │     │  • grava `measured`    │
  └─────────────────────────┘     └──────────────────────────┘     └───────────────────────┘
              ▲                                                                │
              └───────────── invalida measured ao mudar a rotação ────────────┘
                         (fingerprint passa a incluir loadout+ordem)
```

A sacada de coesão: **o boneco é onde o simulador roda**, e rodar o boneco **é** o ato de "descobrir o número" (grava `measured`, igualzinho a dungeon faz hoje). Um lugar só para: montar → testar → ver o impacto.

---

## 4. Motor — o simulador de rotação (fatia vertical do M5)

### 4.1 Contrato (função pura, testável)

```ts
simulateRotation(input: {
  build: AggregateInput            // equipado + árvore + soquetes (já existe)
  loadout: SkillSlot[]             // ativas escolhidas, em ordem de prioridade
  target: TargetProfile            // o boneco: armadura + (futuro) resistências por tipo
  seconds: number                  // janela de medição (ex.: 8s)
}): RotationResult
```

```ts
interface SkillSlot {
  skillId: string
  supports: string[]               // suportes soquetados (sistema atual)
}

interface TargetProfile {
  armour: number                   // reduz físico pela fórmula de armadura
  // Prontos para M1 (hoje ignorados no cálculo físico):
  fireRes?: number; coldRes?: number; litRes?: number; chaosRes?: number
  // Presets: 'sem-defesa' | 'elite' | 'chefe'
}

interface RotationResult {
  dps: number                      // DPS medido (alimenta `measured`)
  window: number                   // segundos simulados
  perSkill: Array<{ skillId: string; casts: number; damage: number; share: number }>
  comboUptime: number              // % do tempo com a marca/exposição ativa (0..1)
  resourceUptime: number           // % de ações sem estar sem-recurso (0..1)
  bottleneck: 'recurso' | 'cooldown' | 'combo' | 'nenhum'  // o gargalo dominante
  timeline?: TickEvent[]           // opcional, p/ debug/visual
}
```

### 4.2 Novos campos de habilidade

Estender `SkillDefinition` ([types.ts](../src/game/types.ts)) com o que uma rotação exige (valores hoje só existem como texto em `meta`):

```ts
interface SkillDefinition {
  // ...campos atuais...
  cost: number                     // recurso consumido por uso (0 = grátis)
  cooldown: number                 // segundos de recarga (0 = sem cooldown)
  castTime: number                 // segundos ocupados pela execução
  // Combo (setup → payoff):
  applies?: MarkId                 // marca/exposição que a skill aplica no alvo
  appliesDuration?: number         // duração da marca (s)
  empoweredBy?: MarkId             // marca que empodera esta skill enquanto ativa
  comboMore?: number               // % de `more` ganho enquanto a marca está ativa (ex.: 40)
}
```

> **Modelo de marca (implementado no R1):** a marca é um **debuff com duração** — o setup a **abre** no alvo; o payoff ganha `comboMore` **enquanto ela estiver ativa** (não é removida a cada golpe). Assim, "manter o combo" = recastar o setup antes de expirar, e `comboUptime` = fração do tempo com a marca ativa. (Preferimos "empoderar enquanto ativo" a "consumir e apagar" por ser o sinal mais legível num medidor de DPS.)

Recurso do herói (pool + regen) entra no `Power` como o [COMBAT §A0](./COMBAT_AND_ARCHETYPES.md) já prevê ("recurso de habilidade" ⏳): `resourceMax`, `resourceRegen` (derivados de atributos/afixos; começam com constantes simples).

### 4.3 O laço de simulação (determinístico)

Passo fixo `dt` (ex.: 100 ms). A cada tick:

1. **Escolher ação** pela **lista de prioridade** (a rotação): a primeira skill cuja condição é satisfeita — **fora de cooldown**, **recurso suficiente**, e (se for payoff) **marca presente**. Se nenhuma ativa serve, cai no **ataque básico** (grátis, mult baixo) — nunca trava.
2. **Executar:** ocupa `castTime`; debita `cost`; põe em cooldown; se `applies`, acende a marca por `appliesDuration`; se `consumes` e a marca está ativa, aplica `comboMore` e apaga a marca.
3. **Dano do golpe:** reaproveita a matemática de `aggregate` **por skill** — `avgHit × critFactor × skill.damageMult × (1+more)/… `, com `more` incluindo os suportes **daquela** skill + o `comboMore` quando o combo dispara; aplica **armadura do alvo** (fórmula dependente do tamanho do golpe do [COMBAT §A2](./COMBAT_AND_ARCHETYPES.md), já que agora há um alvo).
4. **Recurso:** regenera `resourceRegen × dt`; satura em `resourceMax`.
5. **Timers:** decrementa cooldowns e a marca.

Ao fim: `dps = danoTotal / seconds`; deriva `comboUptime`, `resourceUptime` e o `bottleneck` (o recurso que mais custou DPS).

**Determinismo:** como o crítico é valor esperado (já é hoje), **não há RNG** — a mesma build+rotação+alvo dá sempre o mesmo número. Preserva o contrato `measured`. (Se um dia quisermos variância, entra um `seed` opcional; o número "oficial" continua o de valor esperado.)

### 4.4 O impacto forte (o lever de balanceamento)

O ganho de uma boa rotação sobre uma ruim precisa **importar sem exigir perfeição**. Alvo de design:
- **Combo em uptime alto** (marca quase sempre ativa) vs. combo caído: diferença de **~25–40% DPS** via `comboMore`.
- **Recurso bem administrado** vs. estourado (caindo no básico direto): diferença de **~20–35% DPS**.
- Uma rotação **ótima** rende na ordem de **+50–80%** sobre "spammar a skill mais forte ignorando recurso/combo" — forte o bastante pra ser o miolo da build, sem punir quem erra por um triz.

Isso realiza o "poucas ativas, muita sinergia" do [COMBAT §B3](./COMBAT_AND_ARCHETYPES.md) e o "setup→payoff" do gênero.

---

## 5. UI — tela de Habilidades (montar o combo) + Boneco

### 5.1 Seleção de skills (o "escolher como na árvore")

- **Pool de habilidades** à esquerda (estilo rail do print de gemas do [EQUIPMENT_SKILLS §5](./EQUIPMENT_SKILLS_DESIGN.md)). No protótipo, o pool atual (4) cresce; futuramente **filtrado por arma+classe+nível** (trilha S3) — o contrato já fica pronto.
- Jogador **arrasta/escolhe ativas** para a **barra de rotação** (limite pequeno de slots, ex.: 4–5 — reforça sinergia). Escolher quais skills levar **é** a "árvore de habilidades" que o dono pediu.

### 5.2 Editor de rotação (a prioridade)

- A barra é uma **lista ordenada de prioridade** (arrastar p/ reordenar; setas ↑/↓ no teclado — segue a a11y da Fase E). Reaproveita e **substitui** as "Regras de comportamento": vira **rotação de verdade**, ainda **sem texto livre** (dropdowns controlados de gatilho/condição), fiel à filosofia atual.
- Cada slot mostra: ícone/gema, **custo/cooldown/cast**, tags, os **suportes** encaixados (sistema atual) e os **selos de combo** (▶ aplica *Exposição* · ◀ consome *Exposição*).
- **Prévia de Δ DPS** ao reordenar/soquetar, via a mesma sim (número em faixa até medir no boneco).

### 5.3 Boneco de Treino

- Botão **"Testar no boneco"** roda `simulateRotation` e revela o **DPS medido** com o count-up "DPS real descoberto" (reusa [CountUp](../src/ui/CountUp.tsx) e o momento da Fase C).
- **Alvo modificável:** presets **Sem defesa / Elite / Chefe** + sliders de **armadura** (ativo já) e **resistências por tipo** (stub, ligados quando o M1 entrar). Mostrar o DPS *contra aquela defesa* ensina por que "golpe grande vs. armadura" e (futuro) "penetração vs. resistência" importam.
- **Diagnóstico** (o que dá o "aha"): barras de **uptime do combo**, **aproveitamento de recurso**, **DPS por skill** e o **gargalo** apontado ("recurso estourando: +regen ou uma skill mais barata na rotação").
- Rodar o boneco **grava `measured`** (mesmo mecanismo da dungeon). O boneco é grátis/instantâneo; **a dungeon continua sendo o teste com sobrevivência + loot** (decisão do dono).

### 5.4 Efeito no fingerprint

O `fingerprint` ([engine.ts](../src/game/engine.ts)) passa a incluir o **loadout + a ordem de prioridade** (hoje inclui equipado + árvore + soquetes). Assim, **mudar a rotação invalida o DPS medido** — coerente com "números descobertos": mexeu no combo, precisa medir de novo.

---

## 6. Impacto no código (mapa de mudanças)

| Área | Arquivo | Mudança |
|---|---|---|
| Tipos | `src/game/types.ts` | campos de skill (`cost`/`cooldown`/`castTime`/combo), `SkillSlot`, `TargetProfile`, `RotationResult`, recurso no `Power` |
| Conteúdo | `src/game/content.ts` | preencher custo/cooldown/cast/combo das skills; ataque básico; presets de alvo; constantes de recurso |
| Motor | `src/game/engine.ts` | `simulateRotation` (o laço de ticks), fórmula de armadura dependente do golpe, `fingerprint` incluindo loadout+ordem |
| Estado | `src/game/store.ts` | `loadout` (ativas + ordem), medir pelo boneco grava `measured`, canais de UI |
| UI | `src/pages/SkillsPage.tsx` + nova seção/página Boneco | pool + editor de rotação + boneco com diagnóstico e alvo modificável |
| Testes | `src/game/*.test.ts` | sim determinística, combo uptime, starvation de recurso, invalidação de fingerprint |

**O motor puro continua puro:** `simulateRotation` é função sem estado, coberta por testes, alimentando o measured — exatamente como o `aggregate`/`dungeonOutcome` hoje.

---

## 7. Faseamento (iniciativa "R", ancorada no M5)

> Nomeada **R** (rotação) para não colidir com M/S, mas é **o M5 começando cedo e estreito**. Cada fase fecha verde (typecheck+test+build), no fluxo do dono.

- ✅ **R1 — Simulador (motor, puro + testes). CONCLUÍDO.** `simulateRotation` ([engine.ts](../src/game/engine.ts)) sobre a matemática física atual: recurso + cooldown + cast + **um par de combo** (Exposição setup→payoff) + ataque básico de fallback. Saída: DPS medido + diagnóstico (`comboUptime`, `resourceUptime`, `bottleneck`, `perSkill`). Fórmula de armadura por tamanho de golpe (`A/(A+12×golpe)`, teto 90%). Constantes R1: recurso `max 100`/`regen 10` (placeholder, `deriveResource`); Exposição `4s`, `comboMore 40%`; ataque básico `mult 0.5`. `aggregate` refatorado com `buildContext` compartilhado (mesma matemática; a sim reduz ao DPS do `aggregate` para a skill única). **6 testes novos** (equivalência, ordem importa, starvation→gargalo, armadura, determinismo, utilitária ignorada). Ainda **não** toca `fingerprint`/store/UI (é R2).
- ✅ **R2 — Boneco de Treino (UI). CONCLUÍDO.** [`TrainingDummy.tsx`](../src/ui/TrainingDummy.tsx) no topo da tela de Habilidades: roda a sim contra um **alvo modificável** (presets Sem defesa/Elite/Chefe + slider de armadura; res. por tipo stub p/ M1), mostra o **DPS contra o alvo** + **diagnóstico** (uptime do combo, aproveitamento de recurso, gargalo, dano por skill) e a **rotação** (ordem = prioridade, com selos de combo, read-only até o R3). Botão **"Bater no boneco"** grava o `measured` canônico (rotação vs alvo neutro) → o PowerBar em todas as telas troca estimativa→medido. **Mudanças de fundo:** `fingerprint` inclui loadout+ordem; `selectPower` passa a devolver `dps` da rotação (estimativa/medido/dungeon/compare agora falam a mesma língua); `measuredRotation` (janela 12s, alvo neutro) é o DPS-âncora. Ação `measure` + `measureDummy` no store; `loadout` no estado (default `STARTER_LOADOUT` = boa ordem). **+1 teste** (integração do default), 49 no total.
- ✅ **R3 — Tela de Habilidades com combo (UI). CONCLUÍDO.** [`SkillsPage.tsx`](../src/pages/SkillsPage.tsx) reescrita: painel **Rotação de combate** = o loadout em ordem de prioridade, cada slot com custo/cooldown/cast, **selos de combo**, **suportes** (banca reaproveitada) e controles **↑/↓/✕** (reordenar/remover, com a11y e guarda de mínimo 1); **pool "Adicionar à rotação"** para as skills de dano fora do loadout; painel **Utilitárias & auras** (damageMult 0, socketáveis, entram no cálculo defensivo do R4). **Regras de comportamento** decorativas aposentadas. A **prévia de Δ DPS** vem de graça: editar o loadout muda o estado → o **boneco acima re-simula na hora** (e o `fingerprint` re-esconde o medido). Store: ações `moveLoadout`/`toggleLoadout`. Sem novos testes (o impacto já é coberto por "ordem importa" e "fingerprint muda com a ordem"); typecheck+build verdes, 49 testes.
- ✅ **R4 — Motor de combate da dungeon (o lado defensivo da sim). CONCLUÍDO (fatia mínima).** `simulateDungeon` ([engine.ts](../src/game/engine.ts)): laço por ticks com **tempo-para-limpar** (`diff/DPS×12`) × **tempo-para-morrer** (EHP ÷ dano recebido mitigado por camada), **controle** (frio/caster pausam a limpeza → morte por controle `reason:'control'`), **poções** (4 cargas, curam quando a vida cai) e **relatório** (`DungeonReport`: inimigos derrotados, dano recebido, poções, tempo sob controle, DPS médio/pico, incoming). A dungeon (cards + run + relatório) passa a usar a sim; textos "fogo-específicos" generalizados. **4 testes** (tank sobrevive × glass cannon morre; poções; CC; morte por controle), 53 no total. **Balanceamento provisório** (constantes `INCOMING_K`/poções/CC no topo da seção) — para afinar com testes. Magnitude vem do `diff` (já calibrado); bestiário informa tipos/CC/contagem. Depende do M2 (camadas reais) para o dano recebido ser 100% fiel; até lá, o piso já entrega a corrida. Mantém **loot** como o extra sobre o boneco.
- **R5 — Alargar com M1+ (depois).** Quando multi-tipo/penetração/ailments (M1–M3) entrarem, só o **passo de dano** da sim cresce; rotação/combo/boneco **não mudam**. O boneco liga os sliders de resistência.

**Primeira fatia recomendada:** **R1 + R2** — o simulador testado e o boneco que o exibe. Entrega o "bater no boneco e ver o DPS" com impacto real, e destrava a tela de habilidades (R3) em cima de uma base sólida.

### 7.1 R4 em detalhe — a corrida limpar × morrer, CC e o relatório

O que faz a dungeon **parecer um ARPG de verdade** e dar lugar a **todo tipo de build** (a preocupação do dono, 03/jul). O mesmo laço de ticks do R1 ganha um **relógio de dois ponteiros**:

- **Tempo-para-limpar** = `vida_do_encontro / DPS_efetivo` (a sim ofensiva que já temos; `DPS_efetivo` penaliza falta de AoE vs. horda e de single-target vs. chefe — [BESTIARY §4.3](./BESTIARY_AND_DUNGEONS.md)).
- **Tempo-para-morrer** = `EHP / dano_recebido_por_segundo`, onde o dano recebido vem do **perfil de dano de cada monstro/onda** passado pelas **camadas de defesa** (res. por tipo → armadura/evasão/bloqueio → ES → vida) e **descontado pela poção** quando a regra de comportamento dispara.

**Quem zera primeiro decide.** Isso realiza, sem número mágico, exatamente o que o dono pediu:

| Build | Tempo-para-limpar | Tempo-para-morrer | Resultado típico |
|---|---|---|---|
| **DPS / glass cannon** | curto | curto | vence encontros rápidos; **morre** nos lentos/tanky (perde a corrida) |
| **Tank** | longo | longo | **completa mais devagar, porém vivo** — o que você descreveu |
| **Equilibrada** | médio | médio | passa na maioria, sem recordes |

**Controle (CC) como causa própria** (`reason: 'control'`): chill/freeze/atordoamento **pausam o ponteiro de limpar** (o herói não age) enquanto o de morrer segue correndo. Se a build não tem **redução de duração de CC** nem EHP para aguentar a janela travado, é **morte por controle** — "tomou o controle de grupo e o DPS não tankou". Contrajogo: reduzir duração de CC, mais EHP, ou **priorizar matar o aplicador** (a rotação/target-priority importa).

**Cooldown, itens, status e mana já contam** — vêm do R1 (rotação) e do `aggregate` (equip+árvore). O R4 só adiciona o **lado recebido**.

**Relatório completo** (a lista integral do [MVP §10.4](./MVP.md)), tudo saído da mesma sim determinística: duração; DPS médio **e pico**; **dano causado e recebido**; dano por habilidade e tipo; cura/regen/mitigação; **poções/frascos usados**; uso e falta de recursos; **inimigos derrotados**; tempo por área; **tempo sob controle** e o efeito que mais custou; causa da morte; loot; deltas acionáveis. É o "mostrar ao jogador tudo o que aconteceu na masmorra".

**Rankings para todos os perfis** já estão especificados ([MVP §4.5 e §15](./MVP.md)): dano, velocidade, sobrevivência, progressão infinita, Hardcore — cada um seu ladder, sempre comparados pelo **tempo interno da simulação** (não o do aparelho). O R4 gera as **métricas** que alimentam cada um desses ladders (o tank compete em sobrevivência/profundidade; o DPS em dano/velocidade).

**Novos dados que o R4 pede** (aterrado no [BESTIARY §7](./BESTIARY_AND_DUNGEONS.md)): `Monster.damage`/`hitSize`/`cc`; `FailReason` ganha `'control'`; herói ganha **redução de duração de CC** e **frascos** (vida/mana, já slot em [EQUIPMENT_SKILLS](./EQUIPMENT_SKILLS_DESIGN.md)). Depende das camadas de defesa reais (M2) para o `dano_recebido` ser fiel; até lá, um piso simplificado já dá a corrida limpar×morrer.

---

## 8. Riscos e decisões registradas

- **Escopo do M5 antecipado.** Fazemos a fatia física agora; o pipeline largo (M1–M4) entra depois **sem tocar na rotação**. Registrar no [COMBAT §A4](./COMBAT_AND_ARCHETYPES.md) que o M5 começou cedo por decisão de produto.
- **Determinismo mantido.** Valor esperado no crítico → sem RNG no número oficial; "mesma build → mesmo DPS" segue valendo. Variância seedada fica como opção futura.
- **Orçamento de complexidade.** Poucas ativas (≤5) e **um ou dois** mecanismos de combo (Exposição + recurso) para evitar "sopa de botões" ([COMBAT §B3](./COMBAT_AND_ARCHETYPES.md)). Crescer com parcimônia.
- **Sem texto livre na rotação.** Prioridade por dropdowns controlados (gatilho/condição/ação), como as regras atuais — o servidor "obedece" à prioridade.
- **Boneco não prevê sobrevivência** (decisão: complementa, mede só o dano de saída). A **sobrevivência** (dano recebido, CC, poções, a corrida limpar×morrer) é simulada na **dungeon**, no **R4** (§7.1); EHP/resistências seguem exibidos exatos no boneco enquanto isso.

## 9. Fora de escopo por ora

- Simulação de **dano recebido**/sobrevivência no boneco (seria o "boneco completo" — descartado por ora).
- **Recurso/reserva avançados** (Spirit/reserva de auras) — o pool simples basta para R1–R4.
- Filtro do pool por **arma/classe/nível** (trilha S3) — o contrato fica pronto, a UI de filtro vem com S3.
- Multi-tipo/ailments no dano da sim — chegam com M1–M3 (R5 liga).
