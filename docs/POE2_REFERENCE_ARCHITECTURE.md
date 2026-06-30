# Referência de Conteúdo e Arquitetura Inspirada em Path of Exile 2

- **Projeto:** BuildsWar (nome provisório)
- **Documento relacionado:** [Documento de Visão do MVP](./MVP.md)
- **Objetivo:** reduzir os principais sistemas de Path of Exile 2 para um MMO sazonal assíncrono
- **Versão do documento:** 0.1
- **Referência observada:** Path of Exile 2 Early Access 0.4.x
- **Data da pesquisa:** 30 de junho de 2026

## 1. Objetivo

Este documento transforma Path of Exile 2 em uma referência de arquitetura de conteúdo. O objetivo não é reproduzir seu combate de ação ou todo o seu volume, mas entender como suas partes se conectam e construir versões pequenas dessas partes no MVP.

O produto deve nascer com pouco conteúdo, mas com estruturas capazes de receber posteriormente:

- novas classes e especializações;
- novas habilidades e suportes;
- novas bases, modificadores e itens únicos;
- novos tipos de crafting;
- novos biomas, dungeons e chefes;
- novas mecânicas sazonais;
- novas regras de liga;
- novas categorias de ranking;
- novos sistemas de endgame.

## 2. Limite de propriedade intelectual

Path of Exile 2 será referência de organização e profundidade, não uma biblioteca de conteúdo a ser copiada.

Podemos usar como referência:

- separação entre classe, habilidade, suporte e item;
- itens gerados a partir de bases e modificadores;
- raridades e itens que transformam builds;
- árvore de passivas;
- economias sazonais isoladas;
- modos Trade, Solo e Hardcore;
- endgame procedural com modificadores;
- mecânicas sazonais modulares;
- crafting por ações consumíveis;
- conteúdo e recompensas específicas de chefes;
- ligas privadas com ladder própria.

Não devemos copiar:

- nomes de personagens, classes, habilidades, itens ou moedas;
- textos, ícones, modelos, sons, mapas, chefes ou animações;
- história, mundo ou identidade visual;
- valores, fórmulas ou tabelas de drop exatas;
- árvore passiva, layouts ou interfaces;
- descrições ou combinações exclusivas reconhecíveis.

Toda nomenclatura usada neste documento para o nosso jogo é funcional ou provisória.

## 3. De onde vem a profundidade

A profundidade não vem de um sistema isolado. Ela surge da multiplicação entre camadas:

```text
Classe
× árvore passiva
× habilidades
× suportes
× equipamentos
× modificadores
× crafting
× comportamento
× conteúdo enfrentado
× regras da liga
```

O MVP não precisa de centenas de opções em cada camada. Ele precisa provar que as camadas pequenas já produzem decisões diferentes.

## 4. Taxonomia da referência

### 4.1 Ligas e economias

Uma liga é uma fronteira de personagens, itens, economia e ranking. Uma liga sazonal permite que todos recomecem e pode introduzir uma mecânica própria.

Variações importantes:

- **Trade:** economia compartilhada entre jogadores;
- **Solo Self-Found:** sem comércio ou itens de outros jogadores;
- **Hardcore:** a morte encerra ou remove o personagem da competição;
- **Standard:** ambiente permanente para personagens antigos;
- **Privada:** competição temporária com capacidade e ladder próprias;
- **Sazonal:** economia nova acompanhada de conteúdo exclusivo.

No nosso produto, cada liga isola personagem, baú, moedas, mercado, progresso, regras e rankings.

### 4.2 Personagem, classe e especialização

A classe oferece identidade, atributos e origem na árvore, mas habilidades e equipamentos produzem grande parte da build.

```text
Classe-base
├── atributos iniciais
├── origem na árvore passiva
├── afinidades e tags
├── equipamentos iniciais
└── especializações futuras
```

A classe não deve proibir arbitrariamente uma habilidade quando requisitos de atributo, arma ou recurso puderem representar a afinidade.

Especializações equivalentes a ascendências não serão liberadas no primeiro recorte, mas o modelo aceitará:

- mais de uma especialização por classe;
- árvore ou conjunto próprio de escolhas;
- habilidades e modificadores exclusivos;
- requisito de conteúdo para desbloqueio;
- proibição por regra de liga.

### 4.3 Árvore passiva

A árvore transforma pontos de progressão em direção de build. Ela possui:

- nós pequenos com atributos simples;
- nós notáveis com combinações relevantes;
- keystones que alteram regras com algum custo;
- regiões associadas a arquétipos;
- caminhos com custo de oportunidade.

No nosso jogo, a árvore será um grafo definido por dados. A interface apenas visualiza e edita esse grafo.

### 4.4 Habilidades

Categorias que a arquitetura deverá representar:

- **ativa:** ataque, defesa, controle ou utilidade;
- **persistente:** reserva recurso para manter um benefício;
- **invocação:** cria entidade com comportamento próprio;
- **meta ou gatilho:** executa outras habilidades sob condição;
- **concedida:** fornecida por item, classe ou especialização;
- **suporte:** modifica uma habilidade compatível;
- **suporte especial:** recompensa rara próxima a um item único.

Cada habilidade possui tags de compatibilidade, por exemplo:

```text
ataque, magia, corpo-a-corpo, projétil, área, físico,
fogo, frio, raio, corrupção, duração, invocação,
canalização, defesa, maldição, persistente, gatilho
```

Tags evitam programar exceções para cada combinação.

### 4.5 Suportes

Suportes modificam uma habilidade sem substituir sua identidade. Eles podem alterar:

- dano, velocidade ou custo;
- área ou quantidade de alvos;
- tipo de dano;
- chance de efeito;
- comportamento e condição de ativação;
- vantagem acompanhada de penalidade.

O MVP permitirá dois suportes por habilidade. O limite será configurável para aceitar mais no futuro.

### 4.6 Recurso de reserva

Além do recurso gasto ao usar habilidades, haverá um orçamento de reserva semelhante ao papel de Spirit na referência.

Ele será usado por:

- auras e efeitos persistentes;
- invocações permanentes;
- gatilhos automáticos;
- comportamentos poderosos ativos durante toda a tentativa.

O nome temático será definido depois. O conceito técnico será `reservation_resource`.

### 4.7 Equipamentos

Um equipamento é uma instância derivada de uma base. A base determina identidade e limites; modificadores criam variação.

```text
Categoria
→ tipo-base
→ nível do item
→ requisitos
→ raridade
→ implícito
→ prefixos e sufixos
→ qualidade futura
→ encaixes futuros
→ estado especial futuro
```

Categorias previstas:

- armas de uma e duas mãos;
- armas à distância;
- catalisadores mágicos;
- escudos e focos;
- cabeça, torso, luvas e botas;
- amuletos e anéis;
- consumíveis;
- materiais de crafting;
- chaves e itens de acesso ao endgame.

### 4.8 Raridades

O MVP manterá quatro estados:

- **comum:** base sem modificadores explícitos;
- **mágico:** poucos modificadores e identidade simples;
- **raro:** mais modificadores e maior potencial de combinação;
- **único:** conjunto manual capaz de alterar uma regra.

Um único não é automaticamente melhor. Ele deve habilitar uma interação, enquanto um raro excelente pode oferecer números superiores.

### 4.9 Modificadores

Cada afixo terá:

- id estável e versão;
- nome localizável;
- tags necessárias e proibidas;
- prefixo ou sufixo;
- grupo de exclusão;
- tiers e nível mínimo;
- peso de geração;
- intervalos de valores;
- efeitos produzidos;
- fontes permitidas.

Grupos de exclusão impedem combinações duplicadas ou incompatíveis.

### 4.10 Itens únicos

Itens únicos serão conteúdo manual sobre uma base existente. Eles podem:

- converter um tipo de dano;
- trocar defesa por ataque;
- alterar custo ou recurso;
- conceder uma habilidade;
- modificar um gatilho;
- permitir uma combinação normalmente impossível;
- impor penalidade em troca de benefício.

Cada único deve responder: “Que build nova este item torna possível?”.

### 4.11 Crafting

Materiais representam operações e também possuem valor econômico. O MVP terá quatro ações:

1. adicionar modificador quando houver espaço;
2. substituir um modificador aleatório;
3. melhorar os valores existentes;
4. desmontar o item em materiais.

O motor aceitará posteriormente:

- alterar raridade;
- remover ou garantir uma família de modificador;
- adicionar encaixe ou qualidade;
- corromper ou travar o item;
- transformar uma base;
- aplicar crafting exclusivo da temporada.

### 4.12 Comércio assíncrono

O vendedor não precisa estar conectado. O MVP usará:

- anúncios com preço fixo;
- moeda principal por liga;
- materiais negociáveis;
- filtros por base, raridade, nível, tags e afixos;
- histórico básico de preço;
- taxa econômica;
- entrega automática.

Não haverá barganha obrigatória ou troca direta no MVP.

### 4.13 Campanha

A campanha apresenta os sistemas em ordem controlada. Cada dungeon ensina ou testa algo:

- dano em área;
- dano contra alvo único;
- resistência elemental;
- administração de recurso;
- efeito negativo;
- chefe com fases;
- defesa sustentada.

Chefes opcionais e missões laterais poderão ser adicionados sem mudar a campanha principal.

### 4.14 Endgame procedural

O equivalente reduzido do Atlas será um mapa infinito em grafo.

```text
Nó = bioma
    + encontro
    + família de inimigos
    + chefe opcional
    + modificadores de área
    + tabela de recompensa
    + profundidade
    + seed
```

Estrutura, encontro, dificuldade, recompensa e mecânica sazonal serão componentes separados. Assim, novos encontros podem aparecer nos mesmos nós sem recriar o mapa.

### 4.15 Mecânicas de liga

Uma mecânica sazonal é um módulo opcional aplicado à campanha e ao endgame.

```text
Mecânica sazonal
├── condição de aparecimento
├── modificação do encontro
├── progressão do jogador
├── recurso ou moeda própria
├── tabela de recompensas
├── crafting ou decisão exclusiva
├── acesso a encontro especial
└── chefe e drops exclusivos opcionais
```

Ao terminar a temporada, o módulo pode ser removido, retornar em eventos ou entrar no jogo-base com frequência menor.

## 5. Tradução para o combate assíncrono

| Referência em ARPG de ação | Tradução no nosso produto |
|---|---|
| execução manual | estratégia configurada antes da tentativa |
| rotação de habilidades | prioridade, cooldown e gatilhos |
| esquiva manual | estatística e regra defensiva |
| posicionamento | perfil de alcance, pressão e controle |
| limpar mapas | eficiência contra grupos e velocidade |
| bossing | dano sustentado, sobrevivência e fases |
| skill gem | habilidade equipada |
| support gem | modificador conectado à habilidade |
| aura ou Spirit | efeito persistente que consome reserva |
| árvore passiva | grafo de bônus e keystones |
| item raro | base com afixos e tiers sorteados |
| item único | efeito manual que altera regras |
| mapa ou Waystone | chave de expedição com modificadores |
| Atlas | mapa infinito procedural |
| mecânica de liga | módulo de encontro e recompensa |
| trade assíncrono | mercado por preço fixo |
| private league | campeonato isolado com regras e ladder |

## 6. Modelo de cálculo

Cada estatística seguirá uma ordem declarada:

```text
valor-base
→ adições planas
→ soma dos aumentos percentuais compatíveis
→ multiplicadores independentes
→ conversões e substituições
→ limites mínimos e máximos
→ valor final
```

Um efeito interno deverá conter:

```text
stat_id
operação: flat | increased | more | override | convert | cap
valor ou fórmula
escopo: personagem | habilidade | alvo | encontro
tags-alvo
condições
fonte
prioridade
```

Regras:

- aumentos da mesma categoria são somados;
- multiplicadores independentes são aplicados separadamente;
- a interface diferencia os dois conceitos;
- conversões não dependem da ordem acidental do banco;
- condições ativadas aparecem no log;
- o relatório atribui efeitos às fontes.

## 7. Definições e instâncias

Conteúdo e posse serão separados.

### 7.1 Base de item

```text
BaseItemDefinition
├── id e versão
├── categoria e tags
├── slot
├── nível e requisitos
├── atributos-base
├── implícitos
├── limites de afixos
├── encaixes permitidos
└── peso e fontes de drop
```

### 7.2 Modificador

```text
ModifierDefinition
├── id e versão
├── prefixo ou sufixo
├── grupo de exclusão
├── tags válidas
├── tiers e nível mínimo
├── peso de geração
├── intervalos
└── efeitos
```

### 7.3 Instância de item

```text
ItemInstance
├── id único
├── league_id
├── owner_id ou market_listing_id
├── base_definition_id e versão
├── nível e raridade
├── afixos com tiers e valores
├── qualidade futura
├── encaixes futuros
├── estado especial futuro
├── origem do drop
└── histórico mínimo de transações
```

### 7.4 Habilidade e suporte

```text
SkillDefinition
├── id, versão, categoria e tags
├── requisitos e armas compatíveis
├── custo, cooldown e tempo de execução
├── seleção de alvo
├── fórmula e efeitos
├── suportes compatíveis
└── opções de comportamento

SupportDefinition
├── id e versão
├── tags exigidas e proibidas
├── grupo de exclusão
├── custo ou penalidade
└── transformações e efeitos
```

### 7.5 Encontro e liga

```text
EncounterDefinition
├── id, versão, biomas e níveis
├── grupos de inimigos e chefe
├── fases e condições
├── modificadores possíveis
├── tabela de drop
├── custo de entrada
└── regras de sucesso e falha

RuleSetDefinition
├── id, versão e ruleset-base
├── conteúdo permitido e proibido
├── Trade ou Solo
├── Softcore ou Hardcore
├── limite de personagens e duração
├── rankings habilitados
└── assinatura imutável após o início
```

## 8. Recorte de conteúdo do MVP

### 8.1 Classes e passivas

- 3 classes-base: marcial, precisão e arcana;
- uma origem de árvore por classe;
- aproximadamente 45 nós passivos compartilhados;
- 3 keystones, uma próxima a cada origem;
- especializações modeladas, mas desativadas;
- um conjunto de armas ativo;
- segundo conjunto modelado, mas desativado.

### 8.2 Habilidades

- 18 habilidades ativas, 6 inicialmente associadas a cada arquétipo;
- 6 habilidades persistentes ou de reserva;
- 18 suportes reutilizáveis por tags;
- até 5 habilidades ativas equipadas;
- até 2 persistentes;
- até 2 suportes por habilidade;
- nível e qualidade preparados no modelo;
- meta-habilidades e suportes especiais preparados, mas desativados.

Habilidades não serão permanentemente presas a classes. Atributos, arma e recurso orientam a afinidade.

### 8.3 Combate

Tipos de dano:

- físico;
- fogo;
- frio;
- raio;
- corrupção, como tipo não elemental.

Defesas:

- armadura;
- evasão;
- barreira;
- bloqueio;
- resistências;
- vida e recuperação.

Efeitos:

- sangramento;
- queimadura;
- lentidão ou congelamento;
- choque;
- veneno ou deterioração;
- atordoamento.

Recursos:

- vida;
- recurso de habilidade;
- reserva;
- cargas de poção ou consumível.

### 8.4 Itens

- 9 slots definidos no documento principal;
- 6 famílias de arma e mão secundária;
- aproximadamente 30 tipos-base;
- 4 raridades;
- aproximadamente 40 famílias de modificadores com tiers;
- 12 itens únicos;
- requisitos de nível e atributo;
- implícitos em parte das bases;
- qualidade, encaixes e corrupção no schema, mas desativados.

### 8.5 Crafting e mercado

- moeda principal;
- materiais negociáveis;
- quatro operações de crafting;
- desmontagem como sumidouro;
- mercado assíncrono com preço fixo;
- filtros estruturados;
- sem identificação de item ou troca direta.

### 8.6 Campanha e endgame

- 6 dungeons principais;
- 3 chefes de campanha;
- elites e encontros menores reutilizáveis;
- prova cronometrada da campanha;
- progressão garantida contra azar extremo;
- mapa infinito em grafo;
- 3 biomas e ao menos 3 famílias de inimigos;
- chaves de expedição com modificadores;
- 3 chefes de endgame;
- desafios padronizados de DPS e sobrevivência.

### 8.7 Primeira mecânica sazonal

O MVP terá uma mecânica simples, com tema a definir:

```text
encontro opcional
→ inimigos mais fortes
→ risco aceito pelo jogador
→ fragmentos e crafting exclusivo
→ progresso acumulado
→ chefe especial
→ tabela de drop própria
```

Sua principal função é validar o sistema plugável de temporadas.

### 8.8 Ligas

- uma liga oficial Trade Softcore;
- Solo e Hardcore disponíveis nas ligas criadas;
- ligas privadas com economia e ladder próprias;
- restrições por classe, habilidade, raridade e categoria;
- regras versionadas e congeladas;
- rankings selecionáveis;
- histórico arquivado.

Várias ligas oficiais no início fragmentariam a comunidade. As variações serão testadas primeiro nas ligas dos jogadores.

## 9. Preparado, mas desativado

O schema e o motor aceitarão futuramente:

- novas classes e especializações;
- segundo conjunto de armas e passivas condicionais;
- até cinco suportes por habilidade;
- meta-habilidades e gatilhos compostos;
- invocações permanentes;
- qualidade e encaixes;
- corrupção e estados irreversíveis;
- joias da árvore passiva;
- bases excepcionais;
- drops exclusivos de chefes;
- chaves compostas por fragmentos;
- árvores de endgame e de mecânicas sazonais;
- itens exclusivos de temporada;
- incorporação de temporadas ao jogo-base;
- reino permanente não competitivo;
- migração controlada entre ligas compatíveis.

Preparar significa evitar modelos que bloqueiem esses recursos, não construir todas as suas telas agora.

## 10. Motor de regras de ligas

Restrições operam sobre ids, categorias e tags:

```text
proibir class_id: arcane
proibir skill_tag: summon
permitir item_rarity: common, magic
proibir weapon_tag: two_handed
desabilitar market
ativar hardcore
limitar characters_per_account: 1
```

As mesmas regras filtram:

- criação de personagem;
- habilidades disponíveis;
- equipamento permitido;
- geração de drops;
- recompensas;
- crafting;
- mercado;
- snapshots;
- rankings.

Se uma categoria está proibida, ela não pode nascer naquela liga.

Antes da publicação, o validador confirma que ainda existe:

- uma classe jogável;
- uma habilidade inicial válida;
- progressão de equipamento;
- caminho capaz de concluir a primeira dungeon;
- fonte de recursos compatível.

## 11. Versionamento

Cada temporada aponta para um pacote imutável:

```text
content_package
├── classes e passivas
├── habilidades e suportes
├── itens e afixos
├── inimigos e encontros
├── tabelas de drop
├── crafting
└── mecânicas habilitadas
```

Durante uma liga:

- correções de segurança podem ser imediatas;
- correções do motor geram nova versão de simulação;
- balanceamento deve evitar mudanças no meio da competição;
- rankings registram a versão utilizada;
- itens mantêm a versão com a qual nasceram;
- snapshots históricos nunca mudam silenciosamente.

Ao encerrar:

- rankings são congelados;
- builds recordistas permanecem inspecionáveis;
- economia é arquivada;
- a mecânica sazonal é avaliada;
- o pacote seguinte promove, remove ou reformula módulos.

## 12. Ferramentas internas

A abordagem data-driven exige ferramentas mínimas:

- editor ou arquivos validados de bases;
- editor de tiers e modificadores;
- editor de habilidades e suportes;
- visualizador da árvore;
- editor de encontros e drops;
- simulador de build contra encontro;
- execução em lote para balanceamento;
- inspetor de seed e log;
- validador de regras de liga;
- verificador de conteúdo inalcançável;
- clonagem e versionamento de temporadas.

## 13. Critérios de conteúdo

### 13.1 Habilidade

Só é publicada com função, tags, requisitos, custos, fórmula, progressão, comportamento contra grupo e chefe, suportes compatíveis, regras de IA, logs e testes.

### 13.2 Item único

Só é publicado com build habilitada, limitação real, fonte de drop, nível de obtenção, interações conhecidas, comportamento em ligas restritas e testes multiplicativos.

### 13.3 Modificador

Só é publicado com grupo de exclusão, bases válidas, tiers, pesos, nível mínimo, efeito legível, fonte de geração e testes de empilhamento.

### 13.4 Mecânica sazonal

Só é publicada com encontro, decisão de risco, progressão, recompensa exclusiva, uso econômico, integração com campanha e endgame e plano de remoção ou incorporação.

## 14. Ordem de implementação

### Fase A — Fundação

- ids, versões e tags;
- registro de estatísticas;
- operações de modificador;
- definições, instâncias e snapshots.

### Fase B — Build e combate

- classes, habilidades e suportes;
- comportamento configurável;
- árvore passiva;
- combate determinístico;
- relatório.

### Fase C — Itens e economia

- bases, afixos e raridades;
- únicos;
- inventário e crafting;
- mercado.

### Fase D — Conteúdo

- campanha e chefes;
- mapa infinito;
- chaves modificadas;
- desafios e drops.

### Fase E — Ligas

- pacote de conteúdo;
- liga oficial;
- Trade, Solo e Hardcore;
- ligas privadas e ladders;
- encerramento e arquivo.

### Fase F — Temporada plugável

- encontro sazonal;
- progressão e recurso próprios;
- crafting exclusivo;
- chefe e drops;
- ativação por ruleset.

## 15. Decisões consolidadas

- A inspiração principal será a arquitetura de builds e conteúdo de Path of Exile 2.
- O combate continuará assíncrono e calculado pelo servidor.
- O MVP terá poucas opções por camada, mas todas as camadas essenciais.
- Itens nascerão de bases, raridades, afixos e tiers.
- Habilidades e suportes serão entidades separadas e compatíveis por tags.
- O mercado será assíncrono e isolado por liga.
- A primeira temporada terá uma mecânica exclusiva pequena.
- Ligas personalizadas reutilizarão o pacote com restrições.
- Conteúdo competitivo será versionado e auditável.
- Sistemas futuros existirão no modelo, não necessariamente na interface inicial.

## 16. Fontes de referência

Fontes oficiais:

- [Visão geral de Path of Exile 2](https://pathofexile2.com/)
- [The Third Edict: campanha, suportes, crafting, endgame e comércio assíncrono](https://pathofexile2.com/edict)
- [Atualização 0.4.0: liga, classes, habilidades, suportes, passivas e itens](https://www.pathofexile.com/forum/view-thread/3883495)
- [Ligas privadas de Path of Exile 2](https://www.pathofexile.com/forum/view-thread/3781218)
- [Criação de liga privada](https://www.pathofexile.com/private-leagues/create/poe2)

Fontes comunitárias usadas somente para conferir taxonomia, não dados de balanceamento:

- [Equipamentos](https://www.poe2wiki.net/wiki/Equipment)
- [Itens e raridades](https://www.poe2wiki.net/wiki/Item)
- [Habilidades e suportes](https://www.poe2wiki.net/wiki/Support_gem)
