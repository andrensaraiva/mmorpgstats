# Handoff de Sessão — Consolidação dos Protótipos

- **Criado:** 01 de julho de 2026 · **Atualizado:** 03 de julho de 2026
- **Objetivo desta fase:** juntar os dois protótipos existentes em **um único** protótipo novo e evoluí-lo conforme o feedback do dono.
- **Status:** consolidação concluída; **Polish A–E** + F1/F2/F3 (resta só a **F, arte/áudio**); **combate R1–R4** (rotação/boneco/dungeon tank×DPS); e o **MOTOR COMPLETO — M1 (multi-tipo), M2 (evasão/ES/armadura por golpe), M3 (ailments/DoT), M4 (minions/totens) CONCLUÍDOS; M5 (execução por ticks) fechado via R1–R4 + M1–M4**. Fontes: [COMBAT_AND_ARCHETYPES §A4](./COMBAT_AND_ARCHETYPES.md), [COMBAT_ROTATION_AND_DUMMY §7](./COMBAT_ROTATION_AND_DUMMY.md). O que resta é **tuning de balanceamento** e as trilhas de **conteúdo/persistência/online** — não novo sistema de motor.
- **Último commit:** `b7a9212` (M4 — fontes múltiplas). Branch `main`, origin = github.com/andrensaraiva/mmorpgstats.

> Para o próximo assistente/sessão: leia este arquivo inteiro. Comece pela **§5 — Ponto de partida** (é onde a fase de Polish parou). O fluxo de trabalho do dono: **commite cada etapa, atualize os docs, push perto do fim da sessão** (typecheck+test+build verdes a cada passo).

---

## 1. O que foi decidido (feedback do dono) e como foi atendido

O dono comparou os dois protótipos e pediu uma base nova unindo os dois, mantendo o mais avançado, e **um só** protótipo. Stack: **React + TypeScript + Vite na raiz**. Cada item do feedback virou requisito e foi implementado:

1. **Sem "Abordagens/Planos" (Equilibrada/Ofensiva/Defensiva).** ✅ Removidos. A build sai **100% do que o player equipa + aloca na árvore + socketa**. Nenhum arquétipo pré-pronto.
2. **Equipamento como carro-chefe.** ✅ Inventário/baú com todos os drops, equipar/desequipar/trocar, tooltips ricos e **crafting real**: orbes (transmutação, alteração, régio, exaltado, caos, divino) e **corrupção Vaal**.
3. **Árvore com zoom/pan.** ✅ Portada do `prototype-claude` (SVG, roda para zoom, arraste para mover, limite de pontos, conexão obrigatória à origem).
4. **Dungeons leves.** ✅ Cards + tentativa assíncrona; tempo escala com o DPS; sobrevivência por res. a fogo.
5. **Mercado.** ✅ Mantido (tabela de anúncios por preço fixo).
6. **Números descobertos.** ✅ Antes de testar, o DPS aparece como **estimativa em faixa (±15%)**; o **DPS real** só é revelado ao **rodar uma dungeon**, e vale apenas para o *fingerprint* daquela build. Trocar item, craftar ou mexer na árvore invalida o número e exige novo teste. (Vida efetiva e resistências são exibidas exatas.)
7. **Consolidar em 1 + atualizar docs.** ✅ Feito.

---

## 2. Estado atual (arquitetura implementada)

Tudo vive no app React da raiz. Núcleo de jogo separado da UI, em `src/game/`:

- **`src/game/types.ts`** — contratos do domínio (itens/afixos/orbes/árvore/habilidades/dungeons/poder).
- **`src/game/content.ts`** — dados: bases de item, pool de afixos com tiers/faixas, orbes, habilidades + suportes, árvore (nós/arestas), dungeons, mercado, únicos e o inventário/equipamento iniciais.
- **`src/game/engine.ts`** — **motor puro**: `aggregate` (deriva DPS/EHP/resistências de equipado + árvore + suportes), `craft`, `fingerprint` (agora inclui **loadout+ordem**), `estimateRange`, utilidades da árvore. **Combate (R1–R4):** `simulateRotation` (laço de ticks: recurso/cooldown/cast + combo Exposição + ataque básico → DPS medido + diagnóstico), `measuredRotation` (janela `MEASURE_WINDOW=12s`, alvo neutro = DPS-âncora do `measured`), `simulateDungeon` (corrida limpar×morrer, CC, poções, `DungeonReport`). Aleatoriedade só no `craft` (`Rng` mulberry32); a sim é **determinística** (crítico em valor esperado, sem RNG).
- **`src/game/store.ts`** — estado React (`useReducer` + seletores): inventário, equipado, alocação, soquetes, **`loadout`** (rotação: skillIds em ordem de prioridade), moedas, dungeon selecionada, `measured`/`knownDps`. Ações de combate: `moveLoadout`/`toggleLoadout` (editar rotação), `measure`/`measureDummy` (bater no boneco grava o measured). Seletor `selectLoadoutSlots`; `selectPower` devolve o DPS **da rotação**.
- **`src/ui/`** — `format.ts`, `atoms.tsx` (Panel, PageHead, PowerBar, **HeroBoard/HeroPortrait/PowerDetails/ResistRow**, ItemTooltip/ItemTooltipBody), **`icons.tsx`** (ItemIcon/OrbIcon SVG — Fase A), **`tooltip.tsx`** (tooltip flutuante acessível — Fase B), **`CountUp.tsx`** (contagem animada — Fase C), **`craftDiff.ts`** (diff puro de afixos antes×depois de um craft — Fase C), **`inventoryFilter.ts`** (filtro/busca/ordenação pura do baú — Fase D), **`Toasts.tsx`** (canal de toasts efêmeros — Fase D), **`Onboarding.tsx`** (tutorial de 1ª sessão — Fase D), **`TrainingDummy.tsx`** (Boneco de Treino — R2: roda `simulateRotation` contra alvo modificável, mostra DPS/diagnóstico, "bater no boneco" grava o measured).
- **`src/pages/GalleryPage.tsx`** — galeria de componentes (F3), aberta em `?dev=gallery` (fora do fluxo de jogo). **`src/styles/global.css`** ganhou os **tokens semânticos** (F1) no `:root`; o mapa está em [THEME.md](./THEME.md).
- **`src/pages/`** — Portal (**hub de mundo vivo**), Personagem (**dashboard**), **Habilidades (R3: Boneco de Treino no topo + editor de Rotação de combate — loadout em ordem de prioridade com custo/cooldown/cast, selos de combo, suportes e ↑/↓/✕; pool "Adicionar à rotação"; painel de utilitárias & auras)**, Equipamento (manequim + inventário + crafting + comparação), Árvore (zoom/pan/teclado), Masmorra (**R4: run usa `simulateDungeon` → relatório completo tank×DPS/CC/poções**), Mercado, e o shell de Auth/roster/criação.
- **`src/App.tsx`** — shell (top bar, nav, footer) + `ItemTipProvider` (contexto do tooltip) e roteamento por estado.
- **`src/styles/global.css`** — visual POE full-width portado do `prototype-claude/styles.css`.

### Validação técnica (verde a cada commit)
- `npm run typecheck` sem erros · `npm test` — **69 testes** aprovados · `npm run build` (tsc + vite) concluído.
- Núcleo do **motor** (`engine.ts`) segue **puro e determinístico**: durante o polish (A–F) ficou intocado; a trilha de combate R1–R4 **adicionou** `simulateRotation`/`simulateDungeon` como novas funções puras cobertas por testes (mesma filosofia do `aggregate` — sem estado, sem RNG no número oficial). O `store.ts` (React) orquestra loadout/measured/toasts.

---

## 3. Como rodar

- `npm install` (já feito)
- `npm run dev` → http://localhost:5173/
- `npm test` · `npm run typecheck` · `npm run build`

Existe **um só** protótipo agora; o `prototype-claude/` e a antiga `src/` (App.tsx com 3 builds, features/talents, data/prototype.ts, tema `abyssal-anime.css`) foram removidos.

---

## 4. Notas de design do motor (como está)

- **Poder por golpe (`aggregate`):** dano físico da arma-base + afixos/implícitos → golpe médio × vel. de ataque × fator de crítico × multiplicador do golpe × (1+more) × (1−less). Vida = (base + Força + vida plana) × (1+vida%); EHP acrescenta mitigação de armadura. Resistências com teto de 75.
- **DPS da build (R1–R3):** não é mais só a `sk_strike`. `simulateRotation` sequencia o **loadout** no tempo (recurso/cooldown/cast + combo Exposição setup→payoff + ataque básico de fallback) e devolve o DPS medido + diagnóstico. `selectPower.dps` e o `measured` vêm dessa sim (janela neutra de 12s = âncora). **Ordem da rotação importa.**
- **Dano multi-tipo (M1):** o passo de dano soma por tipo (físico/fogo/frio/raio/caos): `added{Tipo}` + `inc{Tipo}`/`incElemental`. **Físico** é mitigado pela armadura do alvo (dependente do tamanho do golpe); **elementais/caos** pela resistência do alvo **menos a penetração** do herói (`firePen` etc.). Skills têm `damageType`/`baseDamage` (magias elementais não escalam com a arma). O boneco tem sliders de resistência por tipo e mostra o **dano por tipo**.
- **Defesa em camadas (M2):** o **EHP** do herói = **pool (vida + escudo de energia)** ÷ dano-físico-efetivo, onde o físico passa por **armadura por tamanho de golpe × evasão (valor esperado, teto 95%) × bloqueio**. Na dungeon, o **ES absorve antes da vida** (buffer). `Power.evasion`/`energyShield` são exibidos exatos. Ainda determinístico (evasão em valor esperado).
- **Ailments/DoT (M3):** golpes com `ailment` geram **dano ao longo do tempo** do tipo do ailment (sangramento=físico, queimadura=fogo, veneno=caos), mitigado pela resistência do alvo no tick. **Veneno empilha** (escala com a cadência); sangramento/queimadura **refrescam** (uptime pleno). Entra no `dps` e no breakdown como fonte `dot` (`RotationResult.dotDps`). Escala com `incDot`.
- **Fontes múltiplas (M4):** skills com `source` (minion/totém) têm **orçamento próprio** e somam **DPS contínuo fora da rotação** (`sourceDps`), mitigado pela defesa do alvo. Escalam com `incMinion`/`incTotem`. Entram no pool da rotação apesar de `damageMult 0`. Assim `dpsTotal = golpe + DoT + minions/totens` — habilita summoner/totem.
- **Números descobertos:** `measured = { fingerprint, dps }`; o DPS real só aparece se `measured.fingerprint === fingerprint(atual)`. O `fingerprint` inclui equipado + árvore + soquetes **+ loadout/ordem**. Grava o measured: **bater no boneco** (R2, grátis) ou **rodar a dungeon** (R4).
- **Crafting:** cada orbe respeita as regras de raridade (mágico ≤1 prefixo/1 sufixo; raro ≤3/3). Divino reroda valores; Vaal corrompe e trava. `craft` nunca muta a entrada — devolve nova instância com uid novo.
- **Dungeon (R4, `simulateDungeon`):** corrida **tempo-para-limpar** (`diff/DPS×12`) × **tempo-para-morrer** (EHP ÷ dano recebido mitigado); **CC** (frio/caster) pausa a limpeza → `reason:'control'`; **poções** (4 cargas) curam; devolve `DungeonReport` completo. Constantes de balanceamento provisórias no topo da seção (`INCOMING_K` etc.) — dependem do M2 (camadas reais) para dano recebido 100% fiel.

## 5. Ponto de partida da PRÓXIMA SESSÃO (retomar aqui)

O protótipo está consolidado e funcional; a fase seguинte é **evoluir rumo ao produto final**. Todo o planejamento está escrito. **Leia estes docs antes de codar:**

| Doc | O que traz |
|---|---|
| [MVP.md](./MVP.md) (v0.2) | visão atualizada com todas as decisões novas |
| [UX_IA.md](./UX_IA.md) | arquitetura de telas, navegação, convenções (nostalgia na moldura, convenção no fluxo) |
| [EQUIPMENT_SKILLS_DESIGN.md](./EQUIPMENT_SKILLS_DESIGN.md) | equipamento/baú/descrições e habilidades por arma+classe; faseamento **S1–S6** |
| [COMBAT_AND_ARCHETYPES.md](./COMBAT_AND_ARCHETYPES.md) | evolução do motor (balanceamento real do gênero) e o mix de classes/builds; faseamento **M1–M5** |
| [ARPG_RESEARCH.md](./ARPG_RESEARCH.md) | pesquisa PoE2/Diablo4/Last Epoch + redesenho do market |
| [POLISH_ROADMAP.md](./POLISH_ROADMAP.md) | fases de acabamento visual & UX |

O dono escolheu começar a virada pelo **Polish Visual & UX** ([POLISH_ROADMAP.md](./POLISH_ROADMAP.md)). Progresso (log detalhado no §10 do roadmap):

- ✅ **Fase A — ícones & molduras.** `src/ui/icons.tsx` (ItemIcon/OrbIcon SVG), contrato `icon` nas bases (F2), glow de raridade, selo de corrompido. Fim dos placeholders de letra.
- ✅ **Fase B — comparação + tooltip acessível.** `ComparePanel` (delta equipado×candidato) e `src/ui/tooltip.tsx` (flutuante, hover+foco+toque, fixável, Esc/fora/×, sem cortar, aria).
- ✅ **Fase C — microinterações (concluída).** Confirmação obrigatória do Vaal; momento "DPS real descoberto" (count-up); **realce do afixo alterado após craft** (`craftDiff.ts` + `lastCraft` no store); **feedback de craftar** (brilho/sheen do preview, pulso do orbe, moeda "−1" subindo); **feedback de equipar** (pulso de encaixe no slot via `lastEquip`); **transição estimativa→medido na PowerBar** (`PStat reveal`). Tudo sob `prefers-reduced-motion`.
- ✅ **Fase D — inventário, filtros e onboarding (concluída).** Barra de **filtro/busca/ordenação** do baú (`inventoryFilter.ts` puro + `InventorySection`) com contadores e estados vazios; **toasts unificados** (`Toasts.tsx` + canal no store) para craft/sem-moedas/slot-inválido/DPS-descoberto; **onboarding** de 1ª sessão pulável (`Onboarding.tsx`, flag em localStorage, botão "?" reabre). Testes em `faseD.test.ts`.
- ✅ **Fase E — acessibilidade & mobile (concluída).** **Teclado** na árvore (roving tabindex + setas + Enter/Espaço) e foco visível em soquetes/nav; **skip-link**; **ARIA** no minimapa/relatório/orbes/count-up; **mobile** (pinch-zoom + pan por toque na árvore, nav rolável, alvos ≥44px); **contraste** revisado (AA nos textos secundários/erro).
- ✅ **Fundações — F1 (tokens semânticos + [THEME.md](./THEME.md)), F2 (contrato de assets `icon`, já existia), F3 (galeria `?dev=gallery`).**
- ⏳ **Fase F — arte & áudio (aberta, assíncrona).** Depende de produção de assets; o contrato F2 já deixa a arte final entrar por dados, sem mexer em componente.

### ▶ RETOMAR AQUI — MOTOR COMPLETO (M1–M5); escolher a próxima trilha
Fechados: **Polish** (A–E + F1/F2/F3; resta só a F), **combate R1–R4**, e o **motor inteiro — M1 (multi-tipo), M2 (evasão/ES/armadura por golpe), M3 (ailments/DoT), M4 (minions/totens), M5 (execução por ticks via R1–R4)** — ver [COMBAT_AND_ARCHETYPES §A4](./COMBAT_AND_ARCHETYPES.md). Tudo verde (69 testes). Não há mais sistema de motor pendente; o que resta é **tuning** e as trilhas de produto (maior valor primeiro):

1. **Tuning de balanceamento** — as constantes provisórias no topo das seções de `engine.ts` (`INCOMING_K`/`EVASION_K`/`EHP_REF_HIT_FRAC`/`ARMOUR_HIT_K`/poções/CC + os multiplicadores de ailment/fonte no `content.ts`). Testar os arquétipos (elementalista, arqueiro, sangramento, veneno, summoner, totém) no boneco e ajustar até o equilíbrio ficar bom. **É o passo mais valioso agora** — o motor está largo, falta afinar.
2. **Persistência** ([abaixo](#trilhas-paralelas-depoisjunto-do-polish)): gravar runs/loadout/measured no `store` + localStorage torna histórico/recordes/loadouts do dashboard reais (hoje demonstrativos).
3. **S1+ — modelo de item rico** ([EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md)): qualidade, requisitos, novos afixos; e **habilidades por arma/classe** (hoje o pool de skills é global).
4. **Bestiário ativo no lado recebido** — hoje o `simulateDungeon` usa a magnitude do `diff` para o dano recebido; ligar o **golpe real por onda** do bestiário (com chill/shock/freeze ativos e ES vs. DoT recebido) fecha o realismo do relatório.

Notas do motor para quem seguir: o pipeline de **dano** vive em `engine.ts` (`avgHitByType`/`prepareSkill`/`preparedHit`/`mitigateHit`) e é compartilhado por `aggregate` + `simulateRotation` — mudanças entram uma vez e valem nos dois. O **DPS total** = golpe (rotação) + **DoT** (`sk.ailment`) + **fontes** (`sk.source` minion/totém), tudo somado no `simulateRotation` e exposto em `dotDps`/`sourceDps`/`damageByType`/`perSkill`. A **defesa em camadas** (M2) está no `aggregate` (EHP) e no `mitigatedIncoming`/loop do `simulateDungeon` (ES como buffer). O `fingerprint` inclui equipado+árvore+soquetes+**loadout/ordem**.

Notas: a **galeria** (`?dev=gallery`) mostra os átomos; o **manifesto de tema** ([THEME.md](./THEME.md)) rege os tokens (componentes novos consomem tokens; migração do CSS legado é incremental). O `fingerprint` agora inclui **loadout+ordem** — mexer na rotação esconde o DPS medido (coerente com "números descobertos").

### ▶ ROTEIRO DE TESTE MANUAL (próxima sessão)
`npm run dev` → http://localhost:5173/. Entre com um herói (auth mockada) e percorra:

**Galeria primeiro (visão rápida de tudo):** abra **http://localhost:5173/?dev=gallery** — botões, chips, PowerBar (estimado×medido), ícones por raridade, orbes, tooltip, count-up e toasts, todos num lugar só. É a forma mais rápida de bater o olho no acabamento.

1. **Equipamento — inventário (Fase D):** buscar por afixo (ex.: "fogo"), filtrar por categoria/raridade nas chips, trocar a ordenação; conferir o contador "N de M" e o estado vazio (filtro sem resultado → "limpar filtros").
2. **Equipamento — craft (Fases C+D):** selecionar um item, aplicar orbes; ver **brilho/sheen no preview**, **pulso do orbe**, **"−1" subindo** no contador, **realce novo/alterado/removido** nos afixos, e o **toast** do resultado. Testar **sem moedas** (toast de aviso) e a **confirmação do Vaal** (irreversível).
3. **Equipamento — equipar (Fase C):** equipar um item do baú → **pulso de encaixe** no slot do manequim.
4. **Habilidades — Boneco de Treino (R2):** clicar **"Bater no boneco"** → count-up do DPS medido; a **PowerBar** em todas as telas passa a mostrar o medido. Trocar preset **Sem defesa/Elite/Chefe** e o slider de **armadura** → o "DPS contra este alvo" cai conforme a armadura sobe. Conferir o **diagnóstico** (uptime do combo, aproveitamento de recurso, gargalo) e o **dano por skill**.
5. **Habilidades — editor de Rotação (R3):** reordenar o loadout com **↑/↓**, remover com **✕**, **adicionar** uma skill do pool; ver o **boneco re-simular na hora** e o DPS medido **voltar a esconder** (fingerprint mudou). Confirmar que a **ordem importa** (combo/uptime muda o DPS).
6. **Habilidades — MOTOR COMPLETO (M1–M4), tudo no boneco:**
   - **M1 multi-tipo:** adicione **Bola de Fogo** (fogo) ou **Flecha Trovejante** (raio) à rotação; mexa nos **sliders de resistência por tipo** do alvo → o DPS cai; veja o **"Dano por tipo"** mudar de físico p/ elemental. Compare com o alvo só-armadura (não afeta elemental).
   - **M3 ailments/DoT:** adicione **Dilacerar** (sangramento) ou **Toque Pestilento** (veneno, empilha) → surge a fonte **"DoT (contínuo)"** no diagnóstico; suba os nós/suporte de **DoT** (Corrosão) e veja a parcela crescer. Veneno escala com a cadência.
   - **M4 minions/totens:** adicione **Guarda de Ossos** (minion) ou **Totem Balista** (raio) — selo "Minion/Totém"; eles aparecem no breakdown como fonte contínua; suba os nós/suporte (Comando Feroz/Ancoragem/Legião) e veja o DPS subir. Minion físico sofre a **armadura** do alvo; totém de raio sofre a **resistência a raio**.
   - **M2 defesas:** no dashboard de **Personagem**, confira **Armadura/Evasão/Esc. energia**; equipe **Traje das Sombras** (evasão) ou **Vestes Arcanas** (ES) e veja a **Vida efetiva** mudar; na comparação de item, as linhas de Evasão/Esc. energia.
7. **Masmorra (R4 + Fase C):** enviar o herói e ver o **relatório completo** (inimigos derrotados, dano recebido, poções, tempo sob controle, DPS médio/pico) + count-up "DPS real descoberto". Testar um build **glass cannon** (morre nos encontros lentos) vs. **tank** (completa devagar, vivo); ver a **morte por controle** quando faltar EHP contra CC.
8. **Árvore (Fase E — teclado):** dar **Tab** até a árvore, navegar com **setas**, **Enter/Espaço** para alocar/reembolsar; foco visível no anel do nó. (A árvore ganhou ramos novos: elemental, DoT, evasão/ES e invocação.)
9. **Mobile (Fase E):** no DevTools em modo dispositivo — **pinch-zoom** na árvore, **nav rolável**, alvos de toque grandes; tooltip de item fixável por toque.
10. **Onboarding (Fase D):** o modal de 4 passos aparece na 1ª sessão (limpe `localStorage` p/ revê-lo, ou clique no **"?"** na barra de topo).
11. **Acessibilidade geral (Fase E):** **Tab** no topo mostra o **skip-link**; `prefers-reduced-motion` (config do SO/DevTools) deve neutralizar as animações.

Se algo estiver fora do esperado, anote a fase/tela e me passe — a lista de trocas entra numa branch de ajustes.

### Trilhas paralelas (depois/junto do polish)
- **S1+ (conteúdo/item)** — modelo de item rico (qualidade, defesas evasão/ES, requisitos, novos afixos): [EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md).
- **M1 (motor multi-tipo)** — dano físico/fogo/frio/raio/caos + penetração/resistências por tipo: [COMBAT_AND_ARCHETYPES](./COMBAT_AND_ARCHETYPES.md). Ver também a nova seção **A0** (atributos & recursos, denominador comum dos ARPGs, com o que está implementado vs planejado — evasão/ES em M2, recurso/pool depois).
- **Tornar real (persistência)** — hoje o estado reinicia ao recarregar; histórico/recordes/loadouts do dashboard são demonstrativos. Gravar runs no `store` + persistir em localStorage os tornaria reais.

## 6. Observações

- Node v22.12.0; jsdom/Vite avisam `EBADENGINE` (querem ≥22.13) — inofensivo.
- O DPS é um número absoluto (golpe/s), não mais "M" como no protótipo vanilla; a escala de `diff` das dungeons foi calibrada para isso.
