# Roadmap de Polimento — Visual & UX

- **Objetivo:** levar o protótipo funcional a um nível de acabamento de produto, com foco em **experiência e apresentação** — sem quebrar o motor de dados nem a filosofia "build 100% do jogador".
- **Foco desta fase:** Visual & UX. As trilhas de motor determinístico, online/contas e conteúdo/balanceamento correm em paralelo (ver §8) mas **não** são o alvo aqui.
- **Data:** 01 de julho de 2026
- **Documentos relacionados:** [Visão do MVP](./MVP.md) · [Planejamento do Protótipo](./PROTOTYPE_PLAN.md) · [Handoff da consolidação](./HANDOFF.md) · [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md) · [Pesquisa de Gênero](./ARPG_RESEARCH.md) · [UX & Arquitetura de Informação](./UX_IA.md)

> **Nota (paridade PoE2).** Por direção do dono, o alvo de acabamento inclui **equipamento/baú/descrições e habilidades no padrão Path of Exile 2** — inclusive habilidades disponíveis **conforme classe e arma equipada**. Isso adiciona uma trilha de **paridade de sistemas** (modelo em `src/game/`) que alimenta a apresentação rica desta fase. O design e o faseamento (S1–S6) estão em [EQUIPMENT_SKILLS_DESIGN.md](./EQUIPMENT_SKILLS_DESIGN.md); a comparação de item (Fase B) e os ícones/molduras (Fase A) deste roadmap se encaixam nele.

---

## 1. Onde estamos (diagnóstico honesto)

O protótipo comunica o jogo, mas o acabamento ainda é de "wireframe bonito":

- **Ícones são placeholders** — item e habilidade usam a primeira letra da base ou um glifo unicode. Para um ARPG, ícone legível é o coração da leitura de loot.
- **Sem comparação de item** — o pilar "loot que muda decisões" exige comparar equipado × candidato. Hoje não existe.
- **Tooltips só no hover** — quebram no toque (mobile) e no teclado; podem cortar nas bordas.
- **Feedback pobre** — craftar, equipar e revelar o DPS real acontecem sem microinteração; a "descoberta" do número (o momento mais legal) passa batida.
- **Sem onboarding** — o loop montar → testar → ajustar não é ensinado; a mecânica de "números descobertos" não se explica sozinha.
- **Inventário sem ferramentas** — não há filtro, ordenação nem busca de afixo, previstos no MVP.
- **Acessibilidade parcial** — faltam foco visível consistente, navegação por teclado na árvore/soquetes e rótulos ARIA.
- **Retrato/arte** — silhueta em CSS; serve, mas não vende a fantasia.

Nada disso é regressão: são as lacunas naturais entre "prova de loop" e "produto". A base técnica (núcleo em `src/game/` separado da UI) permite polir a interface sem tocar nas regras.

## 2. Princípios do polimento

1. **Acabamento não muda regras.** Toda melhora vive em `src/ui/`, `src/pages/` e `src/styles/`; o motor (`src/game/engine.ts`) permanece puro e intocado.
2. **Legibilidade antes de enfeite.** Ícone claro > animação bonita. Hierarquia visual antes de partículas.
3. **Toque e teclado são cidadãos de primeira classe.** Se não funciona no dedo e no Tab, não está pronto.
4. **Movimento com propósito e opt-out.** Toda animação respeita `prefers-reduced-motion` e serve para comunicar (mudou / descobriu / equipou), não para decorar.
5. **Sem regressão de identidade.** Mantém a estética POE dark-fantasy + nostalgia de portal de MMORPG. Nada de reaproveitar arte/nomes de PoE.
6. **Arte é uma trilha própria** (produção assíncrona), desacoplada da engenharia de UI por um contrato de assets (ids → arquivos).

## 3. Fundações de design (pré-requisito, faça primeiro)

Antes das fases visíveis, consolidar o alicerce para não retrabalhar:

- **F1. Camada de design tokens.** Extrair de `global.css` um bloco único de tokens semânticos: escala de espaçamento (4/8/12/16/24…), escala tipográfica, raios, sombras, durações/curvas de motion, além das cores/raridades que já existem. Documentar num pequeno **manifesto de tema** (chave semântica → uso), como o MVP pede.
- **F2. Contrato de assets.** Definir um mapa `iconId → SVG` para bases de item e gemas de habilidade (hoje o glifo sai de `content.ts`/`engine.itemGlyph`). Assim a arte entra por dados, sem mexer em componente.
- **F3. Galeria de componentes.** Uma rota/página interna (`?dev=gallery`) que renderiza todos os átomos (Panel, PowerBar, ItemTooltip, botões, chips, slots, cards de dungeon) em todos os estados. Vira o "chão de fábrica" do polimento e base para regressão visual.

**Critério de saída:** tokens centralizados e usados por ao menos um componente refeito; manifesto de tema no repo; galeria abrindo com todos os átomos.

## 4. Fases de Visual & UX

Cada fase é entregável e testável de forma independente. Ordem = maior retorno de percepção primeiro.

### Fase A — Sistema de ícones e molduras de raridade
O maior salto de percepção para um ARPG.

- Conjunto de **ícones SVG inline** para os ~12 tipos-base (arma, elmo, luvas, torso, botas, escudo, amuleto, anel…) e para as 4 gemas de habilidade (atk/spell/def/aura), legíveis a 28–52px.
- Molduras/`frames` por raridade (comum/mágico/raro/único) com brilho e cantoneira, aplicados a slot, linha de inventário, tooltip e célula de mercado.
- Estados: vazio, hover, selecionado, corrompido (selo Vaal), equipado.
- Ícones da bancada de orbes (hoje só a sigla "Trans/Regal…").

**Saída:** nenhuma tela usa mais a "primeira letra"; loot é legível num relance.

### Fase B — Comparação de itens + tooltip que funciona no toque
Pilar de produto, não só cosmético.

- **Comparação equipado × candidato**: ao inspecionar um item do baú, mostrar delta contra o que está no slot equivalente (ex.: `Vida ef. 8.240 → 8.900 (+660)`, resistências, DPS estimado). Verde/vermelho por sinal.
- **Sistema de tooltip acessível**: flutuante, posicionado sem cortar, **fixável por toque/clique** no mobile, fechável por Esc, com `aria`.
- Realce do **afixo que mudou** após um craft (diff visual: novo/alterado/removido).

**Saída:** dá para decidir "equipo ou não?" sem sair da tela; tooltip usável no dedo.

### Fase C — Microinterações e o momento "número descoberto"
Onde o jogo ganha alma.

- **Contagem animada (count-up)** do DPS quando ele é revelado no relatório da dungeon, com um floreio de "DESCOBERTO"; e transição suave estimativa↔real na PowerBar.
- Feedback de **equipar** (encaixe), **craftar** (fumaça/brilho do orbe; **confirmação obrigatória para Vaal**, por ser irreversível) e de moedas decrementando.
- Realce sutil de por que um número está oculto: tooltip "este DPS é estimado — teste numa dungeon" ligado ao conceito de fingerprint.
- Entradas de painel/lista com stagger leve; hover-elevation coerente.
- Tudo sob `prefers-reduced-motion`.

**Saída:** as três ações centrais (equipar, craftar, testar) têm resposta tátil e a "descoberta" é memorável.

### Fase D — Inventário, filtros e onboarding
Tira o atrito e ensina o loop.

- **Ferramentas de inventário**: filtro por tipo-base e raridade, busca por afixo, ordenação; contadores; estados vazios bem escritos.
- **Onboarding de primeira sessão**: sequência curta e pulável ensinando o loop montar → testar → ajustar e a mecânica de números descobertos; dicas contextuais nos primeiros hovers.
- **Toasts/notice** unificados (hoje `notice` é texto solto) para "item mágico!", "sem moedas", "DPS descoberto".

**Saída:** um jogador novo entende o que fazer sem explicação externa (meta do PROTOTYPE_PLAN §9).

### Fase E — Acessibilidade e mobile de verdade
Requisito do MVP: tudo funciona no celular e por teclado.

- **Teclado**: navegar e alocar nós da árvore, encaixar soquetes, foco visível consistente em todos os interativos.
- **ARIA/leitor de tela**: rótulos em ícones, slots, orbes, resultado da dungeon; regiões e headings corretos.
- **Mobile**: alvos de toque ≥44px no manequim, pinch-zoom na árvore, painéis de detalhe como bottom-sheet, nav com rolagem confortável.
- **Contraste** revisado (texto de raridade sobre fundo escuro; cores AA onde possível).

**Saída:** auditoria de acessibilidade básica passando; loop completo jogável por toque e por teclado.

### Fase F — Arte e áudio (trilha paralela, entra quando pronta)
Produção assíncrona, plugada pelo contrato de assets (F2).

- Ilustração principal da heroína (dark fantasy, anime semirrealista) para retrato e relatório.
- Ícones de tipo-base e gemas em arte final (substituem os SVG utilitários da Fase A sem mudar código).
- Fundos sutis de dungeon/relatório.
- SFX opcionais e discretos (craft, equipar, vitória/derrota) com toggle; nada de música obrigatória.
- Pequeno **guia de estilo** (proporção, enquadramento, iluminação, paleta, nomenclatura) antes de produzir volume.

**Saída:** primeira impressão "vende" a fantasia; assets trocáveis sem alterar ids.

## 5. Sequência recomendada

```
Fundações (F1–F3)
   → Fase A (ícones/raridade)      ← maior salto de percepção
   → Fase B (comparação + tooltip) ← pilar de produto
   → Fase C (microinterações/descoberta)
   → Fase D (inventário + onboarding)
   → Fase E (acessibilidade + mobile)
Fase F (arte/áudio) corre em paralelo desde as Fundações e “aterrissa” quando pronta.
```

Regra: **A → B → C** na ordem (retorno percebido decrescente e dependências); D e E podem intercalar; F é assíncrona.

## 6. Como vamos trabalhar (qualidade)

- Cada fase vira uma branch/PR pequeno com antes/depois na galeria (F3).
- `npm run typecheck`, `npm test` e `npm run build` verdes a cada PR; smoke tests de UI acompanham (ex.: comparação mostra delta, tooltip fixa no toque, count-up dispara).
- Sem novas dependências pesadas sem necessidade clara; ícones como SVG inline mantêm o princípio "vetor, sem raster" até a arte final.
- Nenhuma mudança pode alterar saída do motor (`src/game/`), exceto adicionar `iconId` a dados via contrato de assets.

## 7. Critérios de "polido o suficiente"

O produto estará visualmente pronto para um teste aberto quando:

- loot é legível por ícone/moldura em qualquer tela, sem placeholders de letra;
- dá para comparar equipado × candidato e decidir na hora;
- equipar, craftar e testar têm feedback claro, e a descoberta do DPS é um momento;
- um jogador novo completa o loop sem orientação;
- o loop inteiro funciona por toque e por teclado, com contraste adequado;
- há um retrato/arte principal que comunica a fantasia.

## 8. Encaixe no produto final (trilhas paralelas, fora desta fase)

Registrado para não perder de vista o todo — cada uma tem seu próprio marco depois/junto:

- **Motor de combate determinístico por ticks** (o risco técnico central: hoje o DPS é fórmula agregada). Alimenta relatórios reais e rankings.
- **Online, contas e persistência** (backend, snapshots imutáveis, tentativas assíncronas de verdade, autoridade do servidor).
- **Conteúdo & balanceamento** (mais itens/únicos/afixos, dungeons, nós, classes; tuning).

A UI polida nesta fase foi desenhada para receber essas trilhas sem retrabalho: dados dirigem o visual, e a camada de apresentação é isolada do motor.

## 9. Primeiros passos concretos

1. Extrair tokens e criar o manifesto de tema (F1).
2. Definir o contrato de assets `iconId → SVG` e ligar em `content.ts`/`engine.itemGlyph` (F2).
3. Subir a galeria de componentes (F3).
4. Iniciar a **Fase A**: primeiro lote de ícones de tipo-base + molduras de raridade em slot e inventário.
