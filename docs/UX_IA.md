# UX & Arquitetura de Informação — navegação, telas e convenções

- **Objetivo:** deixar o projeto intuitivo para o jogador de ARPG entrar e navegar, usando telas e posições de botão que o público já reconhece; e decidir o rumo visual (a "vibe antiga" continua ou moderniza?).
- **Data:** 01 de julho de 2026
- **Relacionados:** [Pesquisa de Gênero](./ARPG_RESEARCH.md) · [Roadmap de Polimento](./POLISH_ROADMAP.md) · [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md) · [Visão do MVP](./MVP.md)

---

## 1. Veredito sobre a "vibe antiga" (portal clássico de MMORPG)

**Recomendação: manter a *estética*, modernizar a *arquitetura*.** Não jogue a identidade fora — refine onde ela custa usabilidade.

Separe dois conceitos que hoje estão misturados:

- **Identidade (o que dá alma):** paleta dark-fantasy, molduras, tipografia, o "portal de herói". Isso é atemporal e diferencia — **manter**.
- **Convenção (o que dá intuição):** onde ficam os botões, como se navega, o que cada tela mostra. ARPGs convergiram em padrões testados por milhões de jogadores; fugir deles **sem motivo** custa retenção (foi o erro de QoL da D4, ver [pesquisa](./ARPG_RESEARCH.md)). Aqui, **seguir a convenção**.

Concretamente: o **portal nostálgico** (notícias, liga, ladder) é ótimo como **hub/lobby** — a "cara" do jogo. Mas as telas do **loop central** (personagem, equipamento, habilidades, masmorra, mercado) devem seguir o layout que o jogador de ARPG já tem na memória muscular. Nostalgia na moldura; modernidade no fluxo.

> Regra prática: se a nostalgia atrapalha achar um botão ou entender um número, a nostalgia perde.

## 2. Princípios de UX

1. **Convenção antes de originalidade.** Slot de arma onde se espera arma; tooltip de item ao passar/tocar; comparar com o equipado sempre à mão.
2. **Uma ação primária por tela.** No nosso loop, a estrela é **"Enviar Herói"** — deve ser o botão mais evidente e estar sempre a poucos cliques.
3. **Progressão legível.** O jogador deve sempre saber "o que fazer agora" (evitar o "vagar sem direção" do PoE2).
4. **Leia, não afogue.** Loot e números chegam **filtráveis e comparáveis**, não em enxurrada (corrige a dor da D4).
5. **Toque = clique.** Tudo funciona no dedo; nada depende de hover.
6. **Consistência de posição.** Navegação, recursos e moedas sempre nos mesmos lugares.

## 3. Mapa de telas (arquitetura de informação)

Dois planos, com fronteira clara:

```
HUB / PORTAL (a "cara" nostálgica — lobby da liga)
  ├─ Portal: notícias, liga, ladder, estado do servidor, CTA "continuar"
  ├─ Personagem(ns): seleção/criação (até 3 por liga)
  └─ Mercado & Baú (compartilhados por liga)

PERSONAGEM / LOOP (convenção ARPG moderna)
  ├─ Ficha (atributos, defesas, poder)         [tecla C]
  ├─ Inventário + Equipamento (manequim)        [tecla I]
  ├─ Habilidades (por arma/classe + suportes)   [tecla S]
  ├─ Árvore passiva (foco/tela cheia, zoom/pan) [tecla P/T]
  ├─ Masmorra (escolher destino → Enviar Herói) [tecla D]
  └─ Relatório (resultado, DPS real, loot)
```

Hoje as 7 abas são planas e no mesmo nível. Proposta: **agrupar** "hub" (Portal, Mercado, Baú) e "personagem" (Ficha, Inventário, Habilidades, Árvore, Masmorra), deixando a hierarquia óbvia.

## 4. Convenções de layout por tela (onde ficam os botões)

**Barra superior (persistente):** marca à esquerda; chip de liga/temporada ao centro; **moedas/orbes** e conta/herói à direita. Moeda sempre visível (o jogador precisa saber o que tem para craftar/comprar).

**Navegação (persistente):** abas horizontais no topo (desktop) / barra inferior fixa com ícones (mobile). Item ativo destacado. Atalhos de teclado padrão (C/I/S/P/D).

**Equipamento & Inventário (a tela mais usada):**
- **Manequim à esquerda/centro**, com os slots nas posições canônicas (arma nas laterais, elmo em cima, botas embaixo, anéis/amuleto à direita, cinto abaixo do torso, frascos na base).
- **Inventário/baú à direita** (grade), com **filtro/busca** no topo da grade.
- **Tooltip do item** ao passar/tocar; **comparação com o equipado** lado a lado (delta verde/vermelho).
- **Bancada de crafting** acessível a partir do item selecionado (painel lateral ou modal), com moedas visíveis.

**Habilidades:** rail de **categorias por arma** à esquerda (como o print do PoE2); skills liberadas por tier; à direita, os **slots ativos + suportes**. A arma equipada filtra o que aparece.

**Árvore:** **modo foco/tela cheia**, zoom/pan, nomes só no nó em foco, painel de detalhe embaixo. Botões de zoom/centralizar/reembolsar agrupados num HUD.

**Masmorra:** cards de destino; **"Enviar Herói"** como CTA primário grande e consistente; aviso de risco (ex.: res. a fogo) antes de enviar.

**Relatório:** vitória/derrota no topo, causa em uma frase, números à esquerda, fatos/loot à direita, ações (nova tentativa / ajustar) embaixo. Momento de **revelar o DPS real** com destaque.

**Mercado:** busca + filtros avançados à esquerda/topo (ver [ARPG_RESEARCH §7](./ARPG_RESEARCH.md)); resultados com **comparação inline**; compra imediata.

## 5. Onboarding (primeira sessão)

O loop **montar → testar → ajustar** e a mecânica de **números descobertos** precisam ser ensinados sem texto longo:

1. **Fluxo guiado curto e pulável:** equipar um item → ver o poder mudar → enviar à masmorra → ler o relatório → ajustar → reenviar.
2. **Dicas contextuais** nos primeiros hovers/toques (por que o DPS está "estimado", o que um orbe faz).
3. **Estados vazios** que orientam ("selecione um item para craftar").
4. **Meta:** um jogador novo completa o loop sem explicação externa (métrica do [PROTOTYPE_PLAN §9](./PROTOTYPE_PLAN.md)).

## 6. Navegação e atalhos

- **Persistência:** nav e barra superior nunca somem; "voltar" previsível.
- **Atalhos de teclado** convencionais (C/I/S/P/D + Esc para fechar overlays) — memória muscular do público.
- **Deep-link** por URL para cada tela (já existe base) — compartilhar personagem/item/mercado.
- **Estado da tentativa** sempre visível (o herói está ocupado numa dungeon?).

## 7. Mobile

- Barra de navegação **inferior** com ícones; alvos de toque ≥44px.
- Manequim e árvore adaptados a toque (tap para inspecionar, pinch-zoom na árvore, bottom-sheet para detalhes).
- Filtros de mercado em interface compacta (drawer).
- Nada de ação essencial dependente de hover/teclado.

## 8. O que mudar no protótipo atual (ações)

1. **Agrupar a navegação** em "hub" e "personagem" (hierarquia clara) e adicionar **atalhos de teclado**.
2. **Moedas/orbes na barra superior** (hoje só aparecem na bancada).
3. **Comparação equipado × candidato** no inventário e no mercado.
4. **Filtro/busca** no topo do inventário e do baú.
5. **Onboarding** de primeira sessão + dicas contextuais + estados vazios.
6. **CTA "Enviar Herói"** consistente e destacado onde fizer sentido (inclusive atalho a partir da ficha).
7. **Barra inferior** no mobile.

Isso não briga com o roadmap de polimento — é a **camada de arquitetura** que ordena onde as melhorias visuais (ícones, molduras, microinterações) vão morar.

## 9. Resumo da decisão

- **Estética antiga: fica** (é diferencial e identidade).
- **Arquitetura e posição de botões: modernizam** para as convenções de ARPG que o público já domina.
- **Fronteira clara** entre o **hub nostálgico** e o **loop de convenção moderna**.
- Reversível: se um teste observado mostrar que a nostalgia agrada mais que atrapalha em alguma tela, reequilibramos — mas o default passa a ser a convenção.
