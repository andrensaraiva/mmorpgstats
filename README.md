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

O planejamento do protótipo está em [docs/PROTOTYPE_PLAN.md](./docs/PROTOTYPE_PLAN.md). O plano de acabamento rumo ao produto final está em [docs/POLISH_ROADMAP.md](./docs/POLISH_ROADMAP.md), o design de equipamento/baú/habilidades (paridade PoE2) em [docs/EQUIPMENT_SKILLS_DESIGN.md](./docs/EQUIPMENT_SKILLS_DESIGN.md), a pesquisa de gênero (PoE2/Diablo 4/Last Epoch) com o redesenho do market em [docs/ARPG_RESEARCH.md](./docs/ARPG_RESEARCH.md), a arquitetura de informação/UX em [docs/UX_IA.md](./docs/UX_IA.md), e a evolução do motor + balanceamento + mix de classes/builds em [docs/COMBAT_AND_ARCHETYPES.md](./docs/COMBAT_AND_ARCHETYPES.md).
