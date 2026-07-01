# Handoff de Sessão — Consolidação dos Protótipos

- **Data:** 01 de julho de 2026
- **Objetivo desta fase:** juntar os dois protótipos existentes em **um único** protótipo novo e evoluí-lo conforme o feedback do dono.
- **Status:** **consolidação concluída.** Existe agora **um só** protótipo (app React na raiz). O `prototype-claude/` foi removido e a base `src/` foi reescrita em torno de um motor de dados.

> Para o próximo assistente/sessão: leia este arquivo inteiro. A seção "Estado atual" descreve o que ficou pronto; a seção "Próximos passos" indica onde continuar.

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
- **`src/ui/`** — `format.ts` e `atoms.tsx` (Panel, PageHead, PowerBar com a lógica de números descobertos, ItemTooltip).
- **`src/pages/`** — Portal, Personagem, Habilidades, Equipamento (manequim + inventário + bancada de crafting), Árvore (zoom/pan), Masmorra (tentativa → revela DPS real), Mercado.
- **`src/App.tsx`** — shell (top bar, nav, footer) e roteamento por estado.
- **`src/styles/global.css`** — visual POE full-width portado do `prototype-claude/styles.css`.

### Validação técnica concluída nesta sessão
- `npm run typecheck` sem erros.
- `npm test` — **18 testes** aprovados (`src/game/engine.test.ts` + `src/App.test.tsx`), cobrindo agregação de poder, suportes, soquetes, anel de fogo, tempo/sobrevivência de dungeon, fingerprint, crafting (transmutação, bloqueio de corrompido, Vaal, imutabilidade da entrada), o fluxo de estimativa→DPS real e um craft pela UI.
- `npm run build` (tsc + vite) concluído.

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

### Duas primeiras fatias recomendadas para codar (escolher uma para começar)

1. **Conteúdo/UX — S1+S2** ([EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md)): enriquecer o **modelo de item** (qualidade, defesas evasão/ES, requisitos, novos afixos) e refazer o **tooltip com comparação equipado × candidato**. Base para quase todo o resto; entrega uma descrição "de produto".
2. **Motor — M1** ([COMBAT_AND_ARCHETYPES](./COMBAT_AND_ARCHETYPES.md)): generalizar o pipeline de dano para **múltiplos tipos** (físico/fogo/frio/raio/caos) + penetração/resistências por tipo. Destrava os arquétipos elemental/DoT e é o passo de menor risco no motor.

> Recomendação: começar por **S1** (destrava a UI rica e a busca do market) e emendar **M1** logo em seguida. Manter `npm run typecheck`, `npm test` e `npm run build` verdes a cada passo; o núcleo `src/game/` é puro e coberto por testes.

### Itens táticos menores (quando fizer sentido)
- Refino de balanceamento dos afixos/tiers e da escala de tempo de dungeon (hoje calibrada por olho).
- Persistência local (o estado reinicia ao recarregar).
- Atualizar POE2_REFERENCE se o schema de crafting divergir (a corrupção, "desativada no schema" lá, já está ativa aqui).

## 6. Observações

- Node v22.12.0; jsdom/Vite avisam `EBADENGINE` (querem ≥22.13) — inofensivo.
- O DPS é um número absoluto (golpe/s), não mais "M" como no protótipo vanilla; a escala de `diff` das dungeons foi calibrada para isso.
