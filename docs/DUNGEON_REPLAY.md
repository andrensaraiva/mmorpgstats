# Minimapa — replay leve da tentativa

- **Pergunta que este doc responde:** dá para **ver** o personagem progredindo na dungeon, de forma simples e satisfatória? **Sim.** Este doc descreve o **minimapa animado** que roda durante a fase "Simulando combate…": ícones de herói, inimigos, elite, chefe e **loot raro** que **acendem** conforme a tentativa avança — e o herói **tomba** onde a ameaça vence.
- **Data:** 01 de julho de 2026
- **Relacionados:** [Bestiário & Dungeons](./BESTIARY_AND_DUNGEONS.md) · [Comunidade](./COMMUNITY_PAIN_POINTS.md) · [MVP](./MVP.md)

> **Por que encaixa no modelo assíncrono.** O servidor já **simula** a tentativa de forma **determinística** (mesma build → mesmo resultado). Então o replay é apenas uma **leitura visual** dessa simulação — não um combate em tempo real. Isso dá o **payoff satisfatório** que a [análise de comunidade](./COMMUNITY_PAIN_POINTS.md) apontou como necessário para vender a fantasia "você é o mestre da build, não o piloto", sem custo de execução.

---

## 1. O que o jogador vê

Durante o envio, no lugar (acima) da barra de progresso:

- um **minimapa** em grade (SVG), com a **rota do herói** traçada da origem ao chefe;
- **marcadores** posicionados ao longo da rota: `•` inimigo, `✦` elite, `☠` chefe, `◆` **loot raro** (dourado se raro, laranja se único);
- o **herói** (`◈`) desliza pela rota conforme o progresso; cada marcador **acende** quando o herói chega nele;
- em **derrota**, o herói vira **`✝`** no ponto em que a ameaça venceu (a rota **não** chega ao fim);
- uma **legenda** curta explica os ícones.

É deliberadamente **simples e legível** — sem arte pesada, só glifos coloridos e uma trilha. Satisfatório por mostrar **progressão**, não por detalhe gráfico.

---

## 2. Como é gerado (determinístico e puro)

`dungeonReplay(dungeon, outcome, seed)` em [`src/game/engine.ts`](../src/game/engine.ts) — função **pura**:

1. **Estações:** as `waves` da [composição](./BESTIARY_AND_DUNGEONS.md) são ordenadas por rank (normal → elite → boss). Cada estação vira um marcador; elites/chefes **deixam loot notável**, packs comuns às vezes.
2. **Rota:** a origem do herói fica na esquerda-baixo; a rota **serpenteia** para a direita (x monotônico, y em senoide), com um leve jitter do RNG por seed.
3. **Momento (`at`):** cada marcador recebe um progresso (0–1) em que é **alcançado** — a UI acende os que já passaram.
4. **Fim (`endsAt`):** vitória percorre até `1`; derrota **para antes** (0,4–0,9), onde a rota "morre".

Sem composição, gera um encontro genérico (horda + chefe). A **seed** vem de `dungeonId + fingerprint da build` ([`DungeonPage`](../src/pages/DungeonPage.tsx)), então **a mesma build vê o mesmo replay** — coerente com "números descobertos".

### Contrato (tipos em [`types.ts`](../src/game/types.ts))
```ts
type MarkerKind = 'player' | 'enemy' | 'elite' | 'boss' | 'loot'
interface ReplayMarker { id; kind; x; y; at; label; rarity? }
interface DungeonReplay { markers; path; endsAt; win }
```

---

## 3. Animação (UI)

`DungeonMinimap` em [`DungeonPage.tsx`](../src/pages/DungeonPage.tsx): lê o `progress` (0–100) que o loop de envio já anima. `heroPosition` **interpola** a posição do herói ao longo de `path` (respeitando `endsAt`). Marcadores acendem via classe `.is-on` quando `t ≥ marker.at`. Estilos em [`global.css`](../src/styles/global.css) (`.minimap*`, `.mk--*`).

---

## 4. O que dá para evoluir depois (registrado)

- **Eventos com timestamp real** (M5/ticks do motor): sincronizar o acender dos marcadores com o **relatório causal** — o herói "morre" exatamente na fase/tipo de dano que quebrou.
- **Contagem de mortes de inimigos** e barra de vida do chefe no minimapa.
- **Replay no relatório** (não só durante o envio): rever a tentativa concluída.
- **Marcadores de mecânica** (voadores, poças de chão) refletindo a composição.
- **Densidade real:** número de pontos `enemy` proporcional a `density`/`pack size`.

Tudo isso são extensões do mesmo `DungeonReplay` — nada exige reescrever o motor.
</content>
