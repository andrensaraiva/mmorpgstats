# Handoff de Sessão — Consolidação dos Protótipos

- **Data:** 01 de julho de 2026
- **Objetivo desta fase:** juntar os dois protótipos existentes em **um único** protótipo novo e evoluí-lo conforme o feedback do dono.
- **Status:** decisões tomadas e plano definido. **A consolidação ainda NÃO foi iniciada** (nenhum código novo escrito ainda). Ponto seguro para retomar.

> Para o próximo assistente/sessão: leia este arquivo inteiro antes de continuar. Depois siga a seção "Próximos passos".

---

## 1. Onde estamos (estado do repositório)

Existem **dois protótipos** hoje:

1. **App React/Vite/TypeScript (raiz)** — o protótipo original.
   - Código em `src/` (App.tsx, types.ts, components/, pages/, data/prototype.ts, features/talents/…).
   - Tema `abyssal-anime` (variáveis CSS) em `src/themes/abyssal-anime.css` + `src/styles/global.css`.
   - Tem: presets de build (Equilibrada/Ofensiva/Defensiva), ficha, equipamento simples, habilidades, árvore passiva + ascendência, dungeon demonstrativa. Tem testes (vitest) e contratos em TS.
   - Rodar: `npm install` (já feito) e `npm run dev` → http://localhost:5173/.

2. **Protótipo POE vanilla (pasta `prototype-claude/`)** — a "minha" versão (HTML/CSS/JS puro, sem build, abre via `file://`).
   - Arquivos: `index.html`, `styles.css`, `data.js`, `app.js`, `README.md`.
   - Estética: **cliente de ARPG estilo POE**, full-width, com tempero nostálgico de portal de MMORPG (MU/WYD).
   - Tem: **manequim POE (paperdoll)** de 9 slots, **árvore com zoom/pan**, **soquetes de suporte nas habilidades**, **modelo de poder** (DPS/Vida efetiva/Res.Fogo derivado da build), **mercado**, dungeons com **tempo que escala com a força do char**, e o loop derrota→ajuste→vitória (morte por fogo → equipar anel → vencer).
   - Verificado com smoke test em jsdom (0 erros de runtime).

Git: branch `main`, remote `origin` = github.com/andrensaraiva/mmorpgstats. Só `prototype-claude/` era novo; a memória do agente foi movida para fora do repo.

---

## 2. Decisão do dono (feedback desta rodada)

O dono comparou os dois e decidiu **criar uma base nova do zero juntando os dois**, mantendo o que está mais avançado, e **deixar apenas 1 protótipo**. Stack escolhido para o novo: **React + TypeScript + Vite na raiz** (é o que os docs pedem — "TypeScript de ponta a ponta" — e o toolchain já está instalado), portando a UX/estética POE do `prototype-claude` e a disciplina de contratos/tema do app React.

Feedback item a item (vira requisito):

1. **Remover as "Abordagens/Planos" (Equilibrada/Ofensiva/Defensiva).** A build é **100% decisão do player**. O poder deve sair **só** do que ele **equipa + aloca na árvore + socketa** — não de um arquétipo pré-pronto.
2. **Equipamento é o carro-chefe.** Fazer estilo POE de verdade:
   - mostrar **todos os itens dropados** (inventário/baú);
   - **equipar/desequipar/trocar** itens;
   - tooltips ricos como POE;
   - **crafting**: **orbes** (transmutação, alteração, regal, exalt, caos, divino…) e **corrupção** (Vaal) — "as coisas que fazem a diferença".
3. **Árvore:** manter a do `prototype-claude` (zoom/pan) — ficou melhor.
4. **Dungeons:** manter **leve** por ora. É MVP para dar o *feeling* de "the crims" — algo que o jogador de ARPG joga relaxando. Mexeremos muito depois.
5. **Mercado:** manter (só o `prototype-claude` tem). Rumo certo, tipo POE onde o que vale é a **divine**; refinar depois.
6. **Números descobertos:** trazer **muitos números**, mas conforme o player descobre. Para acessar o **número real** (DPS real), ele **deve testar numa dungeon**. Antes disso, mostrar estimativa/qualitativo.
7. **Consolidar em 1** protótipo e **atualizar os documentos**.

---

## 3. Plano de implementação (todos)

1. **Tipos + conteúdo do jogo** (`src/game/types.ts`, `src/game/content.ts`): itens como instâncias (base + raridade + afixos por tier), pool de afixos, orbes/moedas, inventário de drops, skills + suportes, nós/arestas da árvore, dungeons, mercado. **Sem arquétipos de build.**
2. **Motor puro** (`src/game/engine.ts`): agregação de stats a partir de `equipado + árvore + suportes`; derivar DPS/EHP/resistências; **operações de crafting** (orbes/corrupção) que geram novos itens; **números descobertos** via *fingerprint* da build (o DPS real só é "conhecido" para o fingerprint testado numa dungeon); tempo de dungeon = f(dps, dificuldade) + checagem de sobrevivência (res. fogo vs exigência).
3. **UI React**: shell/nav; páginas Personagem, Habilidades (soquetes), **Equipamento** (inventário + manequim + painel de crafting — a estrela), Árvore (zoom/pan em SVG), Masmorra (tentativa → **revela DPS real**), Mercado, Portal.
4. **`src/styles/global.css`**: portar o visual POE full-width do `prototype-claude/styles.css` para o app React (reaproveitar variáveis do tema quando fizer sentido).
5. **Consolidar em 1**: reescrever `src/` como a base nova; **remover `prototype-claude/`**; deixar só o app da raiz.
6. **Atualizar `/docs`** (MVP.md, POE2_REFERENCE_ARCHITECTURE.md, PROTOTYPE_PLAN.md): build 100% do player (remover linguagem de 3 builds demonstrativas como escolha de arquétipo), equipamento profundo com orbes/corrupção, mecânica de **números descobertos**, decisão de protótipo único.
7. **Verificar**: `npm run typecheck`, `npm run build`, `npm run dev` e um smoke test.

---

## 4. Notas de design do motor (rascunho combinado)

- **Modelo de poder** (portar do `prototype-claude/app.js` → `computeStats`, mas agora a partir de ITENS reais, não de base por build):
  - agregar de itens equipados: `addedPhysMin/Max`, `incPhys%`, `incAttackSpeed%`, `critChance/Multi`, `flatLife`, `incLife%`, `armour`, `block`, `fireRes/coldRes/litRes`;
  - somar árvore (nós ofensivos/defensivos/fogo/`supportCap`) e suportes socketados (multiplicador de dano);
  - derivar: `avgHit → dps = avgHit × attackSpeed × (1+support)`, `ehp = life×(1+mitig(armour))`, `fireRes` (cap 75).
- **Números descobertos:** guardar `measured = { fingerprint, dps }`. `fingerprint` = hash de `equipado + alloc + sockets + afixos`. Se o fingerprint atual == measured, mostra DPS real; senão mostra **estimativa** (faixa ~±15% do real) ou "?". Rodar dungeon grava o measured. Trocar build/craftar invalida → precisa testar de novo. (EHP e resistências podem ser exibidos exatos; o "descoberto" é o desempenho/DPS.)
- **Crafting (subset POE):** transmutação (comum→mágico), alteração (rerola mágico), regal (mágico→raro), exalt (add mod ao raro se houver espaço), caos (rerola raro), divino (rerola valores nas faixas), Vaal (corrompe: resultado aleatório, trava o item). Consome de contadores de moeda. Aplicar ao item selecionado (inventário ou equipado) e recomputar poder ao vivo. Pool de ~12–14 afixos com tiers/faixas e mods numéricos.
- **Dungeons (leve):** manter cards + tentativa assíncrona; tempo escala com dps; sobrevivência por res. fogo. Ao concluir, **revela o DPS real** do fingerprint atual.

## 5. Como rodar cada protótipo

- **React (raiz):** `npm run dev` → http://localhost:5173/  · testes: `npm test` · tipos: `npm run typecheck`
- **POE vanilla:** abrir `prototype-claude/index.html` no navegador (ou `Start-Process .\prototype-claude\index.html`).

## 6. Próximos passos (retomar aqui)

1. Confirmar o plano acima ainda vale (nada mudou desde 01/07).
2. Implementar na ordem dos todos (§3): tipos/conteúdo → motor → UI → estilo → consolidar → docs → verificar.
3. Só remover `prototype-claude/` e reescrever `src/` **depois** que a nova base estiver rodando (typecheck+build+dev OK), para não ficar sem protótipo funcional no meio do caminho.

## 7. Observações

- Node é v22.12.0; jsdom/Vite avisam `EBADENGINE` (querem ≥22.13) — inofensivo.
- Pode haver um `npm run dev` rodando em background de uma sessão anterior — se a porta 5173 estiver ocupada, é isso; pode encerrar o processo Node e subir de novo.
