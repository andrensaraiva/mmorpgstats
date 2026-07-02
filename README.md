# BuildsWar

Protótipo web de um RPG assíncrono centrado em builds, loot e relatórios de combate.

## Estado atual

- protótipo único (React + TypeScript + Vite), estética POE dark-fantasy full-width;
- **build 100% do jogador**: poder derivado de equipamento + árvore + suportes, sem arquétipos pré-prontos;
- equipamento como carro-chefe: 9 slots, inventário/baú, afixos com tiers e **crafting por orbes + corrupção Vaal**;
- **números descobertos**: o DPS real só é revelado ao testar a build numa dungeon;
- árvore passiva com zoom/pan, habilidades com soquetes de suporte, masmorra assíncrona e mercado;
- núcleo de jogo puro em `src/game/` (separado da UI);
- motor determinístico de combate por ticks e persistência ainda pendentes.

## Executar localmente

```bash
npm install
npm run dev
```

## Verificações

```bash
npm run typecheck
npm test
npm run build
```

O planejamento do protótipo está em [docs/PROTOTYPE_PLAN.md](./docs/PROTOTYPE_PLAN.md). O plano de acabamento rumo ao produto final está em [docs/POLISH_ROADMAP.md](./docs/POLISH_ROADMAP.md), o design de equipamento/baú/habilidades (paridade PoE2) em [docs/EQUIPMENT_SKILLS_DESIGN.md](./docs/EQUIPMENT_SKILLS_DESIGN.md), a pesquisa de gênero (PoE2/Diablo 4/Last Epoch) com o redesenho do market em [docs/ARPG_RESEARCH.md](./docs/ARPG_RESEARCH.md), a arquitetura de informação/UX em [docs/UX_IA.md](./docs/UX_IA.md), a evolução do motor + balanceamento + mix de classes/builds em [docs/COMBAT_AND_ARCHETYPES.md](./docs/COMBAT_AND_ARCHETYPES.md), o **bestiário + composição de dungeon + dano físico/mágico + relatório causal** (pesquisa avançada PoE2/D4/Last Epoch) em [docs/BESTIARY_AND_DUNGEONS.md](./docs/BESTIARY_AND_DUNGEONS.md), a **progressão/campanha narrativa (da história ao handoff do endgame)** em [docs/PROGRESSION_AND_STORY.md](./docs/PROGRESSION_AND_STORY.md), o **endgame (loop infinito "Atlas das Fendas", dificuldade escalável e direção)** em [docs/ENDGAME.md](./docs/ENDGAME.md), o **catálogo de conteúdo da Liga 1 (classes, bases, afixos, runas, joalheria, frascos e únicos por arquétipo)** em [docs/CONTENT_CATALOG.md](./docs/CONTENT_CATALOG.md), a **análise de comunidade (dores ainda não cobertas: reset sazonal/FOMO, one-shots, meta-slaving, always-online, monetização) com as respostas do modelo assíncrono** em [docs/COMMUNITY_PAIN_POINTS.md](./docs/COMMUNITY_PAIN_POINTS.md), e o **minimapa/replay leve da tentativa (ícones de herói, inimigos, elite, chefe e loot raro que acendem com a progressão)** em [docs/DUNGEON_REPLAY.md](./docs/DUNGEON_REPLAY.md).
