# BuildsWar — Protótipo de Visão (versão do Claude)

> Uma releitura do BuildsWar como **portal de MMORPG clássico** (a cara dos sites
> oficiais/fãs de MU Online e WYD nos anos 2000) envolvendo a **profundidade de
> builds do Path of Exile 2** descrita em `../docs`.
>
> É um protótipo **de aparência** — feito para você *ver como pode ficar*.
> Independente e sem relação com o protótipo React da raiz do repositório.

## Como abrir

Não precisa instalar nada. Abra o arquivo direto no navegador:

```
prototype-claude/index.html
```

(dois cliques no `index.html`, ou arraste para uma aba do Chrome/Firefox/Edge).
HTML/CSS/JavaScript puro, sem build, sem servidor.

## A visão / direção estética

**Cliente de ARPG (cara de POE) com resolução moderna full-width, temperado com
nostalgia de portal de MMORPG.** Layout de largura total (até 1600px), tipo
cliente de jogo — não mais o "site" fixo de 1024px.

Da estética POE / dark fantasy:
- top bar de cliente com chip da **liga**, painéis escuros grafite com títulos dourados;
- **manequim (paperdoll)** com a personagem ao centro e os 9 slots ao redor;
- **árvore passiva** grande com zoom/pan, nós que brilham quando alocados e keystones;
- **soquetes de gema**: encaixe suportes nas habilidades e veja o dano mudar;
- cores de raridade POE (comum/mágico/raro/único), vinheta e leve scanline.

Tempero nostálgico mantido (mais sutil): logo em **blackletter**, ladder,
ticker de "últimos drops", contador de "online", rodapé "como nos velhos tempos".

Sobre isso, a **arquitetura de conteúdo do POE2** dos docs:
classe × árvore passiva × habilidades × suportes × equipamentos × afixos ×
comportamento × dungeon × relatório × liga.

## Modelo de poder (o que é novo)

Existe agora um **poder de combate** derivado ao vivo da build:

```
DPS  = dps-base(build) × (1 + Σ nós ofensivos + Σ suportes de dano) × (1 − penalidades)
Vida efetiva = ehp-base(build) × (1 + Σ nós defensivos)
Res. Fogo    = base(build) + Σ nós de fogo + (anel de fogo? +49%)
```

Tudo recalcula quando você troca de build, aloca na árvore ou socketa um suporte —
e aparece nos cartões "Poder de combate" (DPS / Vida efetiva / Res. Fogo / Soquetes).

## O que dá para navegar (8 páginas)

| Página | O que mostra |
|---|---|
| **Portal** | notícias, troca de loadout de build, poder de combate, ladder/ticker |
| **Personagem** | ficha + poder derivado (muda com a build), atributos, resistências |
| **Habilidades** | **soquete suportes nas skills** e veja o DPS subir; regras de comportamento |
| **Equipamento** | **manequim POE** (9 slots ao redor da personagem) com tooltip de afixos/tiers |
| **Árvore** | grafo com **zoom/pan**; aloque/reembolse (limite 8 pts) e veja o poder mudar |
| **Masmorra** | **tempo escala com a força**; tentativa assíncrona → relatório de combate |
| **Ranking** | ladders (profundidade, DPS, hardcore) + regras de integridade |
| **Mercado** | anúncios por preço fixo, filtros, raridades |

## Dois momentos que valem ver

**1. O tempo da dungeon escala com a força do char** (Masmorra):
- olhe o **tempo estimado** em cada dungeon;
- vá em **Árvore** e aloque nós ofensivos (ou em **Habilidades** sockete suportes
  de dano) → o DPS sobe → volte à Masmorra e o tempo **caiu**;
- troque a build para **Defensiva** (Portal) → menos DPS → tempos **maiores**
  (ex.: Cripta ~1m45s na Ofensiva vs ~3m13s na Defensiva).

**2. O loop central dos docs — perder, entender, ajustar, vencer** (Masmorra):
1. build **Ofensiva**, res. fogo 22% → **Enviar Herói** → **DERROTA: morte por fogo**;
2. o **relatório** explica *por quê* e aponta o culpado (o anel "Elo Trincado");
3. **"Equipar Guarda-Chama e tentar de novo"** (ou suba res. fogo na árvore) → **VITÓRIA**.

Defesa e dano são decisões separadas: mais DPS deixa tudo mais rápido, mas res. a
fogo insuficiente mata no chefe ígneo por mais dano que você tenha.

## Arquivos

- `index.html` — casca do portal (masthead, nav, colunas, footer)
- `styles.css` — toda a estética, sem imagens (gradientes, molduras, texturas CSS)
- `data.js` — conteúdo demonstrativo (`DB`): personagem, skills, itens, árvore, dungeons, ranking, mercado
- `app.js` — renderização das páginas e interações (árvore, tentativa, tooltips)

Verificado com um smoke test em jsdom: as 8 páginas renderizam, a árvore
aloca/reembolsa/reseta, o loop derrota→ajuste→vitória funciona, zero erros de runtime.

## Não é (ainda)

Sem motor de combate real (os números são roteirizados para demonstrar o loop),
sem persistência, sem backend. É a camada visual/UX — a "cara" — para validar a
direção antes de ligar no motor determinístico.
