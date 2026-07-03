# Handoff de Sessão — Consolidação dos Protótipos

- **Criado:** 01 de julho de 2026 · **Atualizado:** 03 de julho de 2026
- **Objetivo desta fase:** juntar os dois protótipos existentes em **um único** protótipo novo e evoluí-lo conforme o feedback do dono.
- **Status:** consolidação concluída (um só protótipo React na raiz) **e Polish Visual & UX concluído** — Fases **A–E entregues** + fundações **F1/F2/F3**. Resta só a **Fase F (arte/áudio)**, que depende de produção de assets. Próximo valor vem das **trilhas paralelas de produto** (motor determinístico, online/persistência, conteúdo). Ver o log granular em [POLISH_ROADMAP.md §10](./POLISH_ROADMAP.md).
- **Último commit:** `f3c2d60` (Fase D; Fase E + F1 + F3 entram no commit desta sessão) — branch `main`, origin = github.com/andrensaraiva/mmorpgstats.

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
- **`src/game/engine.ts`** — **motor puro**: `aggregate` (deriva DPS/EHP/resistências de equipado + árvore + suportes), `craft` (orbes/corrupção, sempre gera nova instância → invalida o fingerprint), `fingerprint`, `estimateRange`, `dungeonOutcome`, utilidades da árvore. Aleatoriedade entra por um `Rng` (mulberry32 seedável).
- **`src/game/store.ts`** — estado React (`useReducer` + seletores): inventário, equipado, alocação, soquetes, moedas, dungeon selecionada, `measured` (DPS medido) e `knownDps` (só quando o fingerprint bate).
- **`src/ui/`** — `format.ts`, `atoms.tsx` (Panel, PageHead, PowerBar, **HeroBoard/HeroPortrait/PowerDetails/ResistRow**, ItemTooltip/ItemTooltipBody), **`icons.tsx`** (ItemIcon/OrbIcon SVG — Fase A), **`tooltip.tsx`** (tooltip flutuante acessível — Fase B), **`CountUp.tsx`** (contagem animada — Fase C), **`craftDiff.ts`** (diff puro de afixos antes×depois de um craft — Fase C), **`inventoryFilter.ts`** (filtro/busca/ordenação pura do baú — Fase D), **`Toasts.tsx`** (canal de toasts efêmeros — Fase D), **`Onboarding.tsx`** (tutorial de 1ª sessão — Fase D).
- **`src/pages/GalleryPage.tsx`** — galeria de componentes (F3), aberta em `?dev=gallery` (fora do fluxo de jogo). **`src/styles/global.css`** ganhou os **tokens semânticos** (F1) no `:root`; o mapa está em [THEME.md](./THEME.md).
- **`src/pages/`** — Portal (**hub de mundo vivo**: temporada, mecânica sazonal coletiva, eventos, feed ao vivo, pulso econômico, ladder), Personagem (**dashboard**: progressão, build atual real, loadouts, histórico, recordes, conquistas), Habilidades, Equipamento (manequim + inventário + crafting + **comparação equipado×candidato**), Árvore (zoom/pan), Masmorra (tentativa → revela DPS real), Mercado, e o shell de Auth/roster/criação.
- **`src/App.tsx`** — shell (top bar, nav, footer) + `ItemTipProvider` (contexto do tooltip) e roteamento por estado.
- **`src/styles/global.css`** — visual POE full-width portado do `prototype-claude/styles.css`.

### Validação técnica (verde a cada commit)
- `npm run typecheck` sem erros · `npm test` — **41 testes** aprovados · `npm run build` (tsc + vite) concluído.
- Núcleo do **motor** (`engine.ts`/`content.ts`/`types.ts`) **puro e intocado** durante o polish. O `store.ts` (estado React) ganhou canais de UI (lastCraft/lastEquip/toasts) — não é o motor puro; regras de agregação/craft/dungeon seguem só no `engine.ts`.

---

## 3. Como rodar

- `npm install` (já feito)
- `npm run dev` → http://localhost:5173/
- `npm test` · `npm run typecheck` · `npm run build`

Existe **um só** protótipo agora; o `prototype-claude/` e a antiga `src/` (App.tsx com 3 builds, features/talents, data/prototype.ts, tema `abyssal-anime.css`) foram removidos.

---

## 4. Notas de design do motor (como está)

- **Poder:** dano físico da arma-base + afixos/implícitos → golpe médio × vel. de ataque × fator de crítico × multiplicador do golpe × (1+more) × (1−less). Suportes do **golpe principal** (`sk_strike`) multiplicam o DPS. Vida = (base + Força + vida plana) × (1+vida%); EHP acrescenta mitigação de armadura. Resistências com teto de 75.
- **Números descobertos:** `measured = { fingerprint, dps }`. O DPS real só é exibido se `measured.fingerprint === fingerprint(atual)`. Rodar dungeon grava o measured.
- **Crafting:** cada orbe respeita as regras de raridade (mágico ≤1 prefixo/1 sufixo; raro ≤3/3). Divino reroda valores; Vaal corrompe e trava. `craft` nunca muta a entrada — devolve nova instância com uid novo.
- **Dungeon:** `seconds = clamp(45..900, diff/dps × 12)`; sobrevive se `!fireThreat || fireRes ≥ fireReq`.

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

### ▶ RETOMAR AQUI — Polish concluído; escolher a próxima trilha de produto
O Polish Visual & UX (Fases A–E + F1/F2/F3) está fechado. A única fase de polish restante é a **F (arte/áudio)**, que **não é código** — é produção de assets que entram pelo contrato F2 (id → arquivo) sem mexer em componente. Portanto o próximo valor de engenharia vem das **trilhas paralelas** abaixo. Sugestão de ordem (maior risco/retorno primeiro):

1. **M1 — motor multi-tipo** ([COMBAT_AND_ARCHETYPES](./COMBAT_AND_ARCHETYPES.md)): dano físico/fogo/frio/raio/caos + penetração/resistências por tipo. É o risco técnico central e destrava relatórios/rankings reais. A UI já está pronta para exibir (ResistRow, tipos de dano nas dungeons).
2. **Persistência** ([abaixo](#trilhas-paralelas-depoisjunto-do-polish)): gravar runs no `store` + localStorage torna histórico/recordes/loadouts do dashboard reais (hoje demonstrativos).
3. **S1+ — modelo de item rico** ([EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md)): qualidade, evasão/ES, requisitos, novos afixos.

Notas para quem pegar o polish de novo: a **galeria** (`?dev=gallery`) é o lugar de conferir/adicionar átomos; o **manifesto de tema** ([THEME.md](./THEME.md)) rege os tokens — componentes novos consomem tokens, e a migração do CSS legado é incremental (troque valores por tokens ao tocar num bloco).

### ▶ ROTEIRO DE TESTE MANUAL (próxima sessão)
`npm run dev` → http://localhost:5173/. Entre com um herói (auth mockada) e percorra:

**Galeria primeiro (visão rápida de tudo):** abra **http://localhost:5173/?dev=gallery** — botões, chips, PowerBar (estimado×medido), ícones por raridade, orbes, tooltip, count-up e toasts, todos num lugar só. É a forma mais rápida de bater o olho no acabamento.

1. **Equipamento — inventário (Fase D):** buscar por afixo (ex.: "fogo"), filtrar por categoria/raridade nas chips, trocar a ordenação; conferir o contador "N de M" e o estado vazio (filtro sem resultado → "limpar filtros").
2. **Equipamento — craft (Fases C+D):** selecionar um item, aplicar orbes; ver **brilho/sheen no preview**, **pulso do orbe**, **"−1" subindo** no contador, **realce novo/alterado/removido** nos afixos, e o **toast** do resultado. Testar **sem moedas** (toast de aviso) e a **confirmação do Vaal** (irreversível).
3. **Equipamento — equipar (Fase C):** equipar um item do baú → **pulso de encaixe** no slot do manequim.
4. **Masmorra (Fase C):** enviar o herói e, no relatório, ver o **count-up "DPS real descoberto"**; voltar ao Equipamento e confirmar que a **PowerBar** troca de estimado→medido com realce, e que craftar/mexer esconde o DPS de novo.
5. **Árvore (Fase E — teclado):** dar **Tab** até a árvore, navegar com **setas**, **Enter/Espaço** para alocar/reembolsar; foco visível no anel do nó.
6. **Mobile (Fase E):** no DevTools em modo dispositivo — **pinch-zoom** na árvore, **nav rolável**, alvos de toque grandes; tooltip de item fixável por toque.
7. **Onboarding (Fase D):** o modal de 4 passos aparece na 1ª sessão (limpe `localStorage` p/ revê-lo, ou clique no **"?"** na barra de topo).
8. **Acessibilidade geral (Fase E):** **Tab** no topo mostra o **skip-link**; `prefers-reduced-motion` (config do SO/DevTools) deve neutralizar as animações.

Se algo estiver fora do esperado, anote a fase/tela e me passe — a lista de trocas entra numa branch de ajustes.

### Trilhas paralelas (depois/junto do polish)
- **S1+ (conteúdo/item)** — modelo de item rico (qualidade, defesas evasão/ES, requisitos, novos afixos): [EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md).
- **M1 (motor multi-tipo)** — dano físico/fogo/frio/raio/caos + penetração/resistências por tipo: [COMBAT_AND_ARCHETYPES](./COMBAT_AND_ARCHETYPES.md). Ver também a nova seção **A0** (atributos & recursos, denominador comum dos ARPGs, com o que está implementado vs planejado — evasão/ES em M2, recurso/pool depois).
- **Tornar real (persistência)** — hoje o estado reinicia ao recarregar; histórico/recordes/loadouts do dashboard são demonstrativos. Gravar runs no `store` + persistir em localStorage os tornaria reais.

## 6. Observações

- Node v22.12.0; jsdom/Vite avisam `EBADENGINE` (querem ≥22.13) — inofensivo.
- O DPS é um número absoluto (golpe/s), não mais "M" como no protótipo vanilla; a escala de `diff` das dungeons foi calibrada para isso.
