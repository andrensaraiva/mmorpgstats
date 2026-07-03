# Documento de Visão do MVP

- **Nome do projeto:** BuildsWar (provisório)
- **Gênero de trabalho:** MMO sazonal assíncrono de loot e builds
- **Plataforma inicial:** aplicação web responsiva e instalável (PWA)
- **Status:** visão em evolução; protótipo consolidado
- **Versão do documento:** 0.2
- **Data:** 30 de junho de 2026 (revisado em 01 de julho de 2026)

> O desenvolvimento e os testes da primeira versão jogável estão detalhados em [Planejamento do Protótipo — BuildsWar](./PROTOTYPE_PLAN.md). A taxonomia de classes, habilidades, suportes, itens, crafting, endgame e temporadas está detalhada em [Referência de Conteúdo e Arquitetura Inspirada em Path of Exile 2](./POE2_REFERENCE_ARCHITECTURE.md).

> **Revisão 0.2 (01/07/2026) — decisões incorporadas.** A partir do protótipo consolidado, de referências de Path of Exile 2 e de uma [pesquisa de gênero](./ARPG_RESEARCH.md) (PoE2, Diablo 4, Last Epoch), o MVP adota:
> - **Build 100% do jogador** — sem arquétipos pré-prontos; poder derivado de equipamento + árvore + suportes.
> - **Habilidades por arma e classe** — a arma equipada define o leque de skills (estilo PoE2); suportes sem restrição de classe (só atributo/tag).
> - **Equipamento profundo** — slots completos (cinto, frascos, set de armas), **baú/stash em grade**, descrições ricas (qualidade, defesas, requisitos, mais afixos, corrompido).
> - **Crafting em dois trilhos** — gamble (orbes + corrupção Vaal) **e** determinístico (bancada/runas), mais um **afixo excepcional que só dropa**.
> - **Números descobertos** — o DPS real só é revelado ao testar a build numa dungeon.
> - **Mercado assíncrono com compra imediata** e busca avançada, sem fricção de sussurro/golpes (vantagem nativa do nosso modelo assíncrono).
> - **Facções farmar × negociar** — não obrigar o trade (inspirado em Last Epoch).
> - **QoL central desde cedo** — loot filter e comparação de itens.
> - **UI/UX** — estética nostálgica mantida como identidade; **arquitetura e posição de botões seguem as convenções modernas de ARPG** (ver [UX & Arquitetura de Informação](./UX_IA.md)).

## 1. Resumo executivo

O projeto é um RPG online assíncrono no qual o jogador não controla diretamente o personagem durante o combate. A principal habilidade do jogador é construir uma boa build: escolher classe, atributos, habilidades, prioridades de ação, equipamentos e modificadores capazes de superar cada desafio.

O personagem é enviado para dungeons simuladas pelo servidor. A tentativa leva tempo, pode terminar em vitória ou derrota e continua mesmo com o jogo fechado. Ao retornar, o jogador recebe o resultado, um relatório de combate e, quando aplicável, experiência, recursos e equipamentos. Esses equipamentos alimentam novas builds, crafting, trocas entre jogadores e novas tentativas.

A progressão acontece dentro de ligas sazonais, com economia e rankings reiniciados periodicamente. Além da liga oficial, jogadores podem criar ligas privadas ou públicas com regras próprias, como proibir classes, habilidades, raridades ou categorias de equipamentos. Cada liga criada possui personagens, inventários, mercado e rankings isolados.

O conceito pode ser resumido pela frase:

> Monte sua build, envie seu herói para a dungeon e descubra se sua teoria sobrevive.

## 2. Proposta de valor

O jogo pretende entregar a profundidade de builds, loot, crafting, economia e temporadas encontrada em ARPGs, mas sem exigir que o jogador controle o personagem em tempo real ou passe horas repetindo manualmente o mesmo conteúdo.

A experiência deve atender especialmente quem:

- gosta de Diablo, Path of Exile, auto-battlers e jogos incrementais;
- prefere decisões estratégicas a reflexos e precisão mecânica;
- gosta de testar builds, comparar números e perseguir itens raros;
- tem pouco tempo disponível, mas quer participar de uma economia e comunidade persistentes;
- gosta de temporadas, desafios com regras especiais e rankings;
- quer jogar pelo computador ou celular usando a mesma conta.

## 3. Fantasia central

A fantasia do jogador não é ser a mão que executa cada golpe, mas o estrategista que constrói uma máquina de combate.

> Você não controla os golpes; você constrói a máquina que vence.

Uma build deve ser avaliada por mais do que seu dano máximo. Ela precisa sobreviver, administrar recursos, reagir a situações, eliminar grupos, derrotar chefes e adaptar-se aos modificadores da dungeon.

## 4. Pilares do produto

### 4.1 Build acima de execução

O resultado deve ser determinado principalmente pelas decisões tomadas antes da tentativa: equipamentos, habilidades, prioridades, resistências, sinergias e estratégia.

### 4.2 Derrotas compreensíveis

O jogador pode perder uma dungeon, mas precisa entender por quê. Toda derrota relevante deve gerar informação suficiente para permitir uma nova decisão.

### 4.3 Loot que muda decisões

Itens não devem representar apenas números maiores. Um bom drop deve poder criar, completar ou transformar uma build.

### 4.4 Economia social

Um item ruim para uma build pode ser valioso para outra. O mercado entre jogadores é parte da progressão, e não apenas uma conveniência.

### 4.5 Competição para diferentes perfis

O jogo não terá apenas um ranking geral. Builds de dano, velocidade, sobrevivência, progressão infinita, Hardcore e ligas restritas devem ter espaços próprios de competição.

### 4.6 Temporadas com recomeço justo

As temporadas renovam a economia, abrem espaço para novas estratégias e permitem que jogadores novos compitam sem enfrentar anos de vantagem acumulada.

### 4.7 Acesso em qualquer dispositivo

Todas as funções competitivas devem funcionar tanto no celular quanto no desktop. O celular não será uma versão reduzida do jogo.

## 5. O que o MVP não será

Para manter o projeto viável, o MVP não incluirá:

- combate de ação em tempo real;
- movimentação manual por mapas 2D ou 3D;
- mundo aberto explorável visualmente;
- PvP em tempo real;
- guildas, guerras de guilda ou raids cooperativas;
- grupos de personagens lutando simultaneamente;
- árvores com centenas de habilidades;
- crafting tão complexo quanto o de Path of Exile;
- criação livre de itens, habilidades ou scripts por jogadores;
- transferência de itens, moedas ou personagens entre ligas;
- apostas, entrada em dinheiro ou premiações financiadas pelos jogadores;
- blockchain, NFTs ou itens convertíveis em dinheiro real;
- clientes nativos diferentes para web, Android e iOS.

Esses limites não impedem expansões futuras. Eles definem a menor versão capaz de validar o diferencial do produto.

## 6. Loop principal

```text
Criar personagem
      ↓
Montar build e estratégia
      ↓
Escolher dungeon ou nó do mapa
      ↓
Iniciar tentativa assíncrona
      ↓
Servidor simula o combate
      ↓
Vitória, derrota ou morte
      ↓
Analisar relatório e drops
      ↓
Equipar, fabricar, vender ou comprar
      ↓
Modificar a build
      ↓
Enfrentar conteúdo mais difícil ou melhorar um recorde
```

O jogador deve conseguir realizar uma sessão útil em poucos minutos, mas encontrar profundidade suficiente para passar períodos maiores estudando itens, mercado, relatórios e possibilidades de build.

## 7. Estrutura de conta e progressão

### 7.1 Conta

A conta é permanente e concentra:

- identidade e perfil do jogador;
- cosméticos;
- títulos, medalhas e histórico de temporadas;
- conquistas permanentes sem bônus competitivo de poder;
- ligas criadas e participações anteriores;
- configurações e preferências.

### 7.2 Personagens

No MVP, cada jogador poderá criar até três personagens em cada liga.

Cada personagem possuirá:

- classe;
- nível e experiência;
- atributos;
- habilidades e regras de ativação;
- equipamentos;
- progresso na campanha;
- mapa infinito próprio;
- histórico de tentativas e recordes.

Personagens da mesma conta e liga compartilham o baú e as moedas daquela liga. Eles não compartilham progresso de campanha nem posição individual nos rankings.

Cada personagem pode manter uma tentativa ativa, permitindo que personagens diferentes da mesma conta realizem atividades em paralelo. O limite igual para todas as contas faz parte do balanceamento competitivo.

### 7.3 Isolamento por liga

Cada personagem pertence a exatamente uma liga. Itens, moedas, crafting, mercado e progresso nunca atravessam os limites da liga.

Isso evita que uma liga com regras facilitadas ou população antiga contamine outra competição.

## 8. Classes, atributos e builds

### 8.1 Classes iniciais

O MVP terá três classes-base, representando inicialmente:

- combate corpo a corpo;
- combate à distância;
- magia.

Os nomes e a identidade temática serão definidos posteriormente. A classe oferece uma direção inicial, mas não deve determinar uma única build correta. O plano de **misturar os arquétipos mais amados do gênero** (investida, invocador, elemental, arqueiro, DoT, transformação, totem) e a evolução do motor para suportá-los estão em [Motor, Balanceamento e Mix de Classes/Builds](./COMBAT_AND_ARCHETYPES.md).

### 8.2 Atributos

O conjunto inicial deverá cobrir pelo menos:

- vida;
- recurso de habilidade, como mana ou energia;
- força ou poder físico;
- destreza ou velocidade;
- inteligência ou poder mágico;
- armadura;
- evasão;
- bloqueio;
- resistências elementais;
- chance e multiplicador de crítico;
- velocidade de ataque e conjuração;
- regeneração e recuperação.

Os nomes finais dependerão do tema escolhido.

### 8.3 Árvore passiva

O MVP terá uma árvore pequena em formato de grafo, com aproximadamente 45 nós compartilhados, três regiões iniciais e três keystones capazes de alterar regras da build. A classe determina a origem, mas o jogador poderá avançar em direção a outras regiões pagando o custo do caminho.

Nós, conexões e efeitos serão definidos por dados para permitir expansão sem reconstruir a interface ou o motor de combate.

### 8.4 Habilidades e comportamento

Cada personagem poderá equipar habilidades ativas, persistentes e suportes. Além dessas escolhas, o jogador configurará regras simples de comportamento.

O **leque de habilidades disponíveis depende da arma equipada e da classe** (padrão inspirado em Path of Exile 2): equipar uma arma de um tipo libera as habilidades daquele tipo; as skills também liberam por faixas de nível. Isso amarra loot ↔ build ↔ forma de lutar. Ver [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md).

Exemplos:

```text
Se vida estiver abaixo de 40% → usar poção de vida
Se houver três ou mais inimigos → usar habilidade em área
Se o inimigo for chefe → aplicar maldição
Se mana estiver abaixo de 20% → usar ataque básico
Ao bloquear um ataque → usar contra-ataque
```

O MVP não terá uma linguagem de programação livre. O jogador escolherá gatilhos, condições e ações em listas controladas pela interface. Suportes modificarão habilidades compatíveis por meio de tags, **sem restrição de classe** (basta atender ao requisito de atributo/tag) — a liberdade de combinação que o público de ARPG valoriza. O limite de suportes por habilidade cresce com nível/árvore.

### 8.5 Loadouts

O jogador poderá salvar configurações de build para alternar entre, por exemplo:

- limpeza rápida de grupos;
- chefes;
- sobrevivência;
- teste de DPS;
- dungeon com dano elemental específico.

Alterações feitas depois do início de uma tentativa não afetam a tentativa em andamento. O servidor registra um snapshot completo da build no momento da entrada.

Como não há execução manual de combate, **respec da árvore e troca de habilidades são baratos** e **não exigem rejogar a campanha** para experimentar outra build — atacando diretamente o cansaço de "refazer tudo para testar uma ideia" apontado como dor em ARPGs concorrentes.

## 9. Equipamentos e loot

### 9.1 Slots iniciais

Para paridade com o padrão do gênero, o MVP usará (evolução dos nove iniciais):

- arma e mão secundária (com **set de armas alternável** — dois conjuntos);
- cabeça, torso, luvas, botas;
- amuleto, anel 1, anel 2;
- **cinto**;
- **dois frascos** (vida e mana).

Armas de duas mãos desativam o slot de mão secundária. Um **baú (stash) em grade, com abas**, compartilhado por liga, guarda o excedente; o inventário do corpo é do personagem. Ver [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md).

### 9.2 Estrutura do item

Cada item será composto por:

```text
Tipo-base
+ nível do item
+ raridade
+ qualidade (0–20%)
+ defesas da base (armadura / evasão / escudo de energia)
+ requisitos (nível, força, destreza, inteligência)
+ atributo implícito opcional
+ prefixos
+ sufixos
+ valores sorteados dentro de faixas
```

As raridades iniciais serão:

- comum;
- mágico;
- raro;
- único.

### 9.3 Filosofia dos drops

Os drops devem permitir três reações diferentes:

1. equipar porque o item melhora a build atual;
2. guardar porque o item inspira outra build ou personagem;
3. vender porque o item é mais valioso para outro jogador.

O jogo precisa oferecer **filtros de loot e comparação clara entre item equipado e item encontrado desde cedo** — QoL central, não remendo (a ausência disso foi a principal dor de itemização em concorrentes). Para garantir caça a *gear* (e não só a moeda), haverá um **afixo excepcional que só dropa** — uma versão mais forte de um modificador, impossível de craftar.

### 9.4 Crafting inicial

O crafting do MVP terá **dois trilhos**, cobrindo os dois perfis de jogador (quem gosta de arriscar e quem gosta de mirar), lição direta da [pesquisa de gênero](./ARPG_RESEARCH.md):

- **Trilho gamble** — orbes (transmutação, alteração, régio, exaltado, caos, divino) e **corrupção Vaal**. Emoção e topo; já implementado no protótipo.
- **Trilho determinístico** — uma **bancada/runas** para *mirar* um afixo específico, melhorar valores dentro das faixas e adicionar um modificador quando houver espaço (ao estilo Last Epoch / tempering da D4).
- Além disso: **desmontar itens** para obter materiais.

Receitas muito complexas e criação determinística profunda de topo ficam para versões posteriores; a combinação gamble + determinístico já cobre os dois públicos.

## 10. Simulação de combate

### 10.1 Autoridade do servidor

Todo combate competitivo será calculado pelo servidor. O cliente apenas envia a configuração e exibe o resultado.

O motor deverá ser:

- determinístico quando executado com a mesma versão, build e seed;
- dividido em ticks discretos;
- versionado por temporada;
- reproduzível para auditoria;
- capaz de gerar um log resumido e um log técnico detalhado.

### 10.2 Tempo da tentativa

Ao iniciar uma dungeon, o personagem fica ocupado até a conclusão. O jogador pode fechar a aplicação e retornar posteriormente.

O tempo usado nos rankings é o tempo interno da simulação, não a velocidade do aparelho, da conexão ou da animação exibida.

O tempo real de espera terá uma escala global definida pelo balanceamento e nunca poderá ser reduzido mediante pagamento. No MVP, a meta é que tentativas comuns durem minutos, não horas.

Não haverá uma barra de energia impedindo todo o jogo. Dungeons básicas permanecem disponíveis; conteúdos especiais e alguns nós do endgame poderão consumir mapas, chaves ou outros recursos obtidos dentro da própria liga.

### 10.3 Vitória e derrota

Uma tentativa pode terminar por:

- conclusão da dungeon;
- morte do personagem;
- esgotamento do tempo máximo;
- incapacidade de avançar;
- abandono manual.

Em uma derrota normal:

- a chave ou custo de entrada é consumido, quando existir;
- a recompensa final e o drop do chefe não são recebidos;
- experiência e recursos de checkpoints anteriores podem ser preservados;
- o relatório completo continua disponível;
- o personagem não é permanentemente perdido, exceto em regras Hardcore.

O balanceamento dos ganhos parciais deverá impedir que perder intencionalmente seja a melhor forma de farmar.

### 10.4 Relatório de combate

Cada tentativa deverá informar:

- duração;
- DPS médio e pico de DPS;
- dano total causado e recebido;
- dano separado por habilidade e tipo;
- cura, regeneração e mitigação;
- **poções/frascos usados** (quantos e quando — sinal de sobrevivência apertada);
- uso e falta de recursos;
- quantidade de inimigos derrotados;
- tempo gasto em cada área;
- causa da morte ou falha;
- efeitos negativos mais perigosos, incluindo **tempo sob controle** (atordoado/congelado) e qual efeito mais custou;
- loot obtido;
- sugestões factuais, sem montar a build pelo jogador.

Exemplo de diagnóstico:

> Você chegou ao chefe em 3m42s, mas recebeu 68% do dano final como fogo e possuía somente 38% de resistência a fogo.

### 10.5 Números descobertos

Para dar profundidade de números "conforme o jogador descobre", o **DPS real** de uma build só é conhecido depois de **testá-la numa dungeon**. Antes disso, a interface mostra uma **estimativa em faixa**. O valor real fica atrelado à assinatura (*fingerprint*) da build; trocar item, craftar ou mexer na árvore invalida o número e exige novo teste. Vida efetiva e resistências continuam exatas. (Já implementado no protótipo.)

## 11. Conteúdo PvE

### 11.1 Campanha

O MVP terá seis dungeons de campanha, organizadas em uma progressão linear inicial. Cada dungeon introduz ao menos uma nova exigência de build, como:

- grupos numerosos;
- inimigos resistentes a um tipo de dano;
- dano elemental elevado;
- efeitos de controle;
- chefe com fases;
- necessidade de dano sustentado ou explosivo.

A campanha ensina os sistemas e libera o endgame.

### 11.2 Tentativa cronometrada da campanha

Depois de concluir a história, o jogador libera uma prova que executa todas as dungeons da campanha em sequência usando uma build registrada.

Essa prova gera o ranking de menor tempo para completar a história. O tempo considerado é a soma do tempo de simulação, eliminando vantagens de aparelho, conexão ou horário de login.

### 11.3 Mapa infinito procedural

O endgame será um grafo de nós gerado por seed no servidor. Cada nó combina:

- profundidade;
- bioma;
- família de inimigos;
- tipo de encontro;
- modificadores;
- chefe opcional;
- recompensa;
- conexões com próximos nós.

Exemplo:

```text
Dungeon comum ── Evento ── Chefe
       │                     │
       └── Mercador ── Dungeon corrompida
```

A dificuldade aumenta continuamente por fórmulas de escala. A geração pode continuar indefinidamente, embora os elementos sejam combinações de um conjunto finito de conteúdo criado.

O ranking registra a maior profundidade concluída, e não apenas alcançada.

### 11.4 Desafios padronizados

O MVP terá encontros com seed e condições fixas para comparar builds de forma justa. Eles serão usados para rankings como DPS, tempo contra chefe e sobrevivência.

### 11.5 Mecânica sazonal inicial

A primeira liga oficial terá uma mecânica pequena e opcional: o jogador aceita fortalecer um encontro, recebe fragmentos e um material de crafting exclusivo e, após acumular progresso, libera um chefe com tabela de drop própria.

O tema será original e definido posteriormente. A função dessa mecânica no MVP é validar que encontros, recompensas e crafting sazonais podem ser ativados ou removidos pelo pacote de conteúdo da liga.

## 12. Mercado e economia

### 12.1 Mercado por liga

Cada liga possui mercado e moeda isolados. O MVP usará **anúncios com preço fixo e compra imediata (buyout) assíncrona** — sem leilão por lances e **sem negociação manual**. Como o combate é assíncrono e o servidor é autoridade, a compra confirma na hora, o item entra no baú e a moeda é debitada, **sem sussurrar vendedor, sem status online e sem golpes de "troca na janela"**. Isto transforma a maior dor do gênero (fricção de trade do PoE) em vantagem nativa nossa — ver [pesquisa de gênero](./ARPG_RESEARCH.md).

O mercado deverá permitir:

- anunciar e comprar item (buyout imediato);
- cancelar anúncio;
- **busca avançada**: por tipo-base, raridade, nível e qualidade; por **stats em faixa min–max** (dano, crítico, DPS físico/elemental, armadura, evasão, escudo de energia, bloqueio, recurso, soquetes); por **requisitos** (nível, força, destreza, inteligência); e por **família de afixo/tier**;
- ordenar por preço e data; salvar buscas;
- **comparar o item com o equipado** (delta inline);
- consultar histórico básico de preço.

### 12.2 Troca direta

A troca direta entre jogadores não fará parte do MVP. Concentrar transações no mercado reduz golpes, duplicação, comércio externo e complexidade de suporte.

### 12.3 Escolha entre farmar e negociar (facções)

Para não **obrigar** o trade (crítica recorrente ao PoE) sem tirar o mercado de quem gosta dele, o jogador escolherá entre dois caminhos, inspirados nas facções de Last Epoch:

- **Autossuficiente** — sem acesso ao mercado, em troca de **drops melhores e direcionamento** de loot;
- **Mercador** — acesso pleno ao mercado da liga.

A escolha é por personagem/liga e mantém o item hunt íntegro para ambos os perfis. A troca acarreta um pequeno custo (moeda de favor ganha jogando), que também limita bots e manipulação.

### 12.4 Sumidouros econômicos

Para controlar inflação e excesso de itens, o MVP terá:

- taxa de anúncio ou venda;
- crafting consumindo materiais e moeda;
- desmontagem permanente de equipamentos;
- custos de entrada em conteúdos especiais;
- encerramento econômico ao final da temporada.

## 13. Liga oficial

O jogo terá uma liga oficial ativa por vez no MVP.

Características iniciais propostas:

- duração de seis semanas;
- economia iniciada do zero;
- até três personagens por conta;
- conjunto completo de classes, habilidades e itens do MVP;
- mercado habilitado;
- rankings globais e por classe;
- regras e versão de balanceamento congeladas durante a competição, salvo correções críticas.

Ao final, personagens e resultados são arquivados. Uma futura versão poderá transferir personagens oficiais para um reino eterno, mas esse reino não faz parte do MVP.

## 14. Ligas criadas por jogadores

### 14.1 Objetivo

As ligas criadas por jogadores funcionam como campeonatos privados ou comunitários. O organizador escolhe regras a partir de opções seguras oferecidas pelo sistema, convida participantes e acompanha rankings exclusivos.

Exemplos:

- apenas personagens corpo a corpo;
- sem itens únicos;
- somente itens mágicos;
- uma classe específica proibida;
- determinadas habilidades removidas;
- modo sem comércio;
- apenas um personagem por conta;
- morte permanente;
- competição entre amigos durante sete dias.

### 14.2 Configuração disponível no MVP

O criador poderá definir:

- nome e descrição;
- visibilidade pública, não listada ou privada;
- código ou convite de entrada;
- data de início;
- duração predefinida de 7, 14, 30 ou 42 dias;
- limite de participantes, até o teto inicial de 50;
- quantidade permitida de personagens por conta;
- classes permitidas ou proibidas;
- habilidades permitidas ou proibidas;
- raridades permitidas ou proibidas;
- categorias de arma e equipamento permitidas ou proibidas;
- mercado habilitado ou modo sem comércio;
- morte normal ou Hardcore;
- rankings ativos para aquela liga.

Antes da confirmação, todos os participantes poderão consultar um resumo imutável das regras. A interface também mostrará quais classes, habilidades e itens deixam de existir naquela economia.

### 14.3 Limites da personalização

No MVP, o criador não poderá:

- escrever scripts ou regras livres;
- alterar fórmulas de combate;
- criar classes, habilidades ou equipamentos;
- aumentar taxa de drop, experiência ou poder;
- conceder itens ou moedas;
- importar personagens;
- oferecer premiação em dinheiro dentro do sistema;
- modificar as regras depois do início.

As opções iniciais privilegiam restrições, e não benefícios. Isso reduz exploits e permite que todas as combinações usem o mesmo motor validado.

O sistema deverá impedir configurações impossíveis, como remover todas as classes, todas as habilidades iniciais ou todos os equipamentos capazes de permitir o avanço. Restrições aplicadas a equipamentos também filtram suas tabelas de drop, recompensas e opções de crafting.

Cada liga nasce vinculada a uma versão específica de conteúdo e balanceamento. Novas classes, itens ou alterações de balanceamento não serão injetadas depois do início, exceto correções críticas de segurança ou integridade.

### 14.4 Ciclo de vida

```text
Rascunho
→ inscrições abertas
→ regras e participantes confirmados
→ liga iniciada e regras congeladas
→ competição
→ encerramento
→ resultados arquivados e compartilháveis
```

O organizador poderá remover participantes por violação, mas toda remoção durante a competição ficará registrada no histórico público da liga.

No início, o servidor registra uma versão e uma assinatura das regras. Essa assinatura acompanha tentativas, itens e recordes, permitindo comprovar sob quais restrições cada resultado foi obtido.

### 14.5 Isolamento e recompensas

Ligas criadas possuem:

- personagens próprios;
- baú e moedas próprios;
- drops próprios;
- mercado próprio, quando habilitado;
- rankings próprios;
- página de resultados própria.

Nenhum recurso competitivo sai da liga. A conta pode receber apenas registros permanentes sem poder, como participação, troféus visuais e histórico.

## 15. Rankings

O MVP oferecerá rankings globais, por classe e por liga.

### 15.1 Rankings iniciais

- maior profundidade concluída no mapa infinito;
- menor tempo na prova completa da campanha;
- menor tempo em cada dungeon ou chefe padronizado;
- maior DPS em um encontro padronizado com duração fixa;
- maior sobrevivência em desafio de dificuldade crescente;
- primeira conclusão da campanha;
- ranking Hardcore, quando a regra estiver ativa.

### 15.2 Regras de integridade

Todo recorde deverá armazenar:

- personagem;
- snapshot da build;
- versão do motor de combate;
- seed do encontro;
- log verificável;
- data e liga;
- regras aplicáveis.

Empates usarão critérios explícitos, como menor tempo, menor nível de item ou data anterior do recorde, dependendo da categoria.

Não haverá um único ranking abstrato de “melhor build”. Cada ranking mede uma capacidade específica.

## 16. Recursos sociais do MVP

O MVP incluirá:

- perfil público;
- inspeção de personagem, respeitando opção de privacidade da build;
- histórico de recordes;
- páginas compartilháveis de personagem, item, liga e ranking;
- convites para ligas;
- mercado entre jogadores;
- feed simples de acontecimentos da liga;
- chat ou mural restrito à liga, sujeito à capacidade de moderação.

Guildas e conteúdo cooperativo serão avaliados depois que o loop individual, o mercado e as ligas personalizadas estiverem validados.

## 17. Experiência web e mobile

O produto será uma aplicação web responsiva e instalável.

Princípios:

- todas as ações disponíveis no desktop também existem no celular;
- telas de equipamentos e comparação devem funcionar por toque;
- filtros avançados do mercado devem possuir interface compacta;
- tentativas continuam com a página fechada;
- notificações podem avisar conclusão, venda e início de liga;
- links abrem diretamente personagens, itens, ligas e rankings;
- uma mesma conta funciona em todos os dispositivos;
- nenhum cálculo competitivo depende do dispositivo do jogador.

Uma versão para lojas poderá reutilizar a aplicação web empacotada, sem criar outro jogo ou servidor.

### 17.1 Identidade visual × convenção de interface

Decisão de rumo (detalhada em [UX & Arquitetura de Informação](./UX_IA.md)): a **estética** dark-fantasy com sabor de portal clássico de MMORPG é **mantida como identidade** — é diferencial e é atemporal. Mas a **arquitetura de informação e a posição dos botões seguem as convenções modernas de ARPG** que o público já domina (manequim, baú em grade, tooltip com comparação, painel de habilidades por arma, árvore em foco), porque fugir da convenção sem motivo custa intuição e retenção. Em resumo: **nostalgia na moldura, convenção no fluxo**, com uma fronteira clara entre o **hub/portal** (lobby da liga) e as telas do **loop de jogo**.

## 18. Telas essenciais

O MVP deverá possuir:

1. apresentação e cadastro;
2. login e recuperação de conta;
3. painel da temporada e personagens;
4. criação de personagem;
5. perfil e atributos;
6. inventário e baú;
7. equipamentos e comparação de itens;
8. configuração de habilidades e comportamento;
9. seleção de dungeon;
10. tentativa em andamento;
11. resultado e relatório de combate;
12. crafting;
13. campanha;
14. mapa infinito;
15. mercado;
16. rankings;
17. navegador de ligas;
18. criação e configuração de liga;
19. página da liga e participantes;
20. histórico de temporadas e resultados.

## 19. Escopo de conteúdo proposto

O conteúdo inicial sugerido para validação é:

- 3 classes-base;
- aproximadamente 45 nós passivos e 3 keystones;
- 18 habilidades ativas;
- 6 habilidades persistentes ou de reserva;
- 18 suportes reutilizáveis por tags;
- 9 slots de equipamento;
- 4 raridades;
- aproximadamente 30 tipos-base de item;
- aproximadamente 40 modificadores reutilizáveis;
- 10 a 15 itens únicos capazes de sugerir builds;
- 6 dungeons de campanha;
- ao menos 3 chefes principais;
- 3 famílias de dano ou elementos;
- 3 biomas para o mapa infinito;
- um conjunto inicial de modificadores de dungeon;
- uma mecânica sazonal com encontro, recurso, crafting e chefe próprios;
- 4 operações simples de crafting;
- mercado por preço fixo;
- liga oficial;
- ligas criadas por jogadores;
- até 3 personagens por conta e liga;
- rankings globais, por classe e por liga.

Esses números são metas de escopo, não decisões imutáveis de balanceamento.

## 20. Monetização

O primeiro teste poderá operar sem monetização para validar retenção e economia.

Caso seja adicionada, a monetização deverá respeitar:

- nenhum equipamento vendido por dinheiro;
- nenhuma compra de atributos, experiência ou taxa de drop;
- nenhuma redução paga do tempo de tentativa;
- nenhum consumível competitivo exclusivo;
- cosméticos, títulos visuais e pacotes de apoiador são aceitáveis;
- expansão de capacidade de ligas privadas pode ser estudada posteriormente;
- toda compra deve ser claramente separada dos rankings.

Vender poder destruiria a credibilidade das temporadas e das ligas personalizadas.

## 21. Segurança, abuso e moderação

Por possuir mercado e competição, o MVP precisa considerar desde o início:

- servidor como autoridade sobre combate, drops e moedas;
- ids únicos e rastreáveis para itens;
- registro auditável de transações;
- limitação e monitoramento de requisições;
- detecção de múltiplas contas coordenadas;
- prevenção de automação e bots;
- proteção contra manipulação de mercado;
- nomes e textos denunciáveis;
- bloqueio e denúncia de usuários;
- logs de ações administrativas;
- regras claras para organizadores de ligas.

Não é necessário construir um sistema antifraude perfeito antes do primeiro teste fechado, mas a arquitetura não pode confiar no cliente.

## 22. Princípios técnicos

Sem determinar ainda uma stack, o produto deverá seguir:

- aplicação web responsiva/PWA;
- API autenticada;
- banco de dados central;
- motor de combate independente da interface;
- fila de trabalhos para tentativas assíncronas;
- seeds e versões registradas;
- snapshots imutáveis de builds em tentativas e recordes;
- relógio do servidor como referência;
- eventos de economia e ranking auditáveis;
- capacidade de reexecutar uma simulação para investigação;
- regras de liga representadas como dados versionados, não código criado pelo usuário.

Modelo conceitual principal:

```text
Conta
├── Participação em liga
│   ├── Personagens
│   │   ├── Builds
│   │   ├── Itens
│   │   ├── Tentativas
│   │   └── Recordes
│   ├── Baú e moedas
│   └── Anúncios de mercado
└── Histórico e cosméticos

Liga
├── Regras versionadas
├── Participantes
├── Conteúdo e seeds
├── Mercado isolado
└── Rankings
```

## 23. Métricas de validação

O MVP deverá medir:

- porcentagem de cadastros que cria um personagem;
- porcentagem que conclui a primeira dungeon;
- tempo até equipar o primeiro drop;
- quantidade de alterações de build após uma derrota;
- tentativas por jogador e por dia;
- retenção no primeiro, sétimo e trigésimo dia;
- porcentagem que conclui a campanha;
- participação no mapa infinito;
- jogadores que anunciam ou compram no mercado;
- variedade real de classes, habilidades e itens usados;
- concentração das builds dominantes;
- ligas criadas e taxa de convites aceitos;
- participação e conclusão de ligas personalizadas;
- retorno de jogadores na temporada seguinte.

O principal sinal qualitativo será o jogador perder, analisar o relatório, modificar a build e tentar novamente por decisão própria.

## 24. Critérios de conclusão do MVP

O MVP será considerado funcional quando um jogador puder:

- criar uma conta pelo celular ou desktop;
- entrar na liga oficial;
- criar até três personagens;
- montar e salvar uma build;
- executar uma dungeon com o jogo fechado;
- vencer ou perder com resultado calculado pelo servidor;
- compreender a causa da derrota pelo relatório;
- receber, comparar, equipar e desmontar loot;
- fabricar uma modificação simples;
- anunciar e comprar itens no mercado da liga;
- concluir a campanha;
- avançar no mapa infinito;
- registrar resultados em rankings verificáveis;
- criar uma liga com restrições de classe, habilidade e equipamento;
- convidar jogadores para essa liga;
- competir em rankings isolados;
- encerrar e consultar o histórico da liga;
- utilizar todas essas funções essenciais em uma interface mobile.

## 25. Etapas sugeridas de entrega

### Etapa 1 — Protótipo do motor

- personagem e atributos em dados;
- equipamento e habilidade;
- uma dungeon;
- combate determinístico;
- relatório técnico.

### Etapa 2 — Vertical slice

- interface web responsiva;
- builds montadas pelo próprio jogador (sem arquétipos pré-prontos), com poder derivado de equipamento, árvore e suportes;
- drops aleatórios;
- inventário;
- uma derrota solucionável por alteração de build;
- relatório compreensível.

### Etapa 3 — Alpha fechado

- classes e campanha inicial;
- contas e múltiplos personagens;
- crafting;
- mercado;
- rankings;
- telemetria de balanceamento.

### Etapa 4 — MVP público

- campanha completa do MVP;
- mapa infinito;
- liga oficial;
- ligas criadas por jogadores;
- encerramento e histórico;
- PWA e experiência mobile completa.

## 26. Expansões após validação

Sistemas candidatos, fora do MVP:

- guildas;
- raids assíncronas;
- chefes mundiais;
- guerras de guilda;
- PvP simulado entre builds;
- reino eterno;
- árvore passiva expandida;
- novas classes e especializações;
- crafting avançado e corrupção;
- temporadas com mecânicas exclusivas;
- desafios diários de seed compartilhada;
- API pública e planner externo de builds;
- aplicativo distribuído nas lojas;
- suporte oficial a criadores de conteúdo e campeonatos.

## 27. Decisões ainda abertas

Antes da produção de conteúdo, será necessário decidir:

- nome definitivo e universo temático;
- identidade visual;
- nomes e fantasias das três classes iniciais;
- duração exata da primeira temporada de teste;
- escala entre tempo simulado e espera real;
- recompensa parcial ideal em derrotas;
- grau de visibilidade das builds nos rankings;
- política para múltiplas contas;
- existência de chat interno no primeiro teste;
- destino dos personagens após o encerramento oficial;
- limite final e custo operacional das ligas criadas por jogadores.

Essas decisões não impedem o protótipo do motor de combate, que deve ser o primeiro risco técnico e de diversão a ser validado.
