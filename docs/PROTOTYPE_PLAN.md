# Planejamento do Protótipo — BuildsWar

- **Nome provisório:** BuildsWar
- **Objetivo:** validar o loop de montar uma build, falhar de forma compreensível, ajustar a estratégia e vencer
- **Plataforma:** aplicação web responsiva com interface presente desde o primeiro marco
- **Versão planejada:** protótipo 0.1
- **Status:** Marco 0 parcialmente concluído; interface demonstrativa disponível
- **Data:** 30 de junho de 2026
- **Documento relacionado:** [Documento de Visão do MVP](./MVP.md)

## 1. Resultado esperado

O protótipo não tentará provar mercado, temporadas, ligas privadas ou escala de conteúdo. Ele deverá responder uma pergunta:

> Analisar um resultado, modificar uma build e superar uma dungeon é divertido o bastante para o jogador querer tentar novamente?

Ao final do protótipo, uma pessoa deverá conseguir:

1. abrir o jogo pelo computador ou celular em uma interface inspirada em portais clássicos de MMORPG;
2. escolher uma das três builds demonstrativas;
3. inspecionar atributos, habilidades e equipamentos;
4. iniciar uma dungeon assíncrona;
5. receber uma vitória ou derrota determinística;
6. compreender o principal motivo do resultado;
7. trocar equipamento, habilidade ou prioridade de ação;
8. tentar novamente e observar a diferença;
9. receber, comparar e equipar um item encontrado.

## 2. Hipóteses a validar

### H1 — Decisão antes do combate

O jogador percebe que suas escolhas, e não sorte ou execução manual, determinaram o resultado.

### H2 — Derrota compreensível

O relatório permite identificar ao menos um problema real da build sem entregar uma solução pronta.

### H3 — Mudança com impacto visível

Trocar resistência, dano, habilidade ou regra de comportamento produz uma diferença perceptível na tentativa seguinte.

### H4 — Loot gera uma nova decisão

Ao menos parte dos itens encontrados provoca comparação e dúvida, em vez de ser apenas aumento automático de poder.

### H5 — O loop merece repetição

Depois de concluir a dungeon, o jogador demonstra interesse em testar outra build, item ou desafio.

## 3. Escopo jogável do protótipo 0.1

### 3.1 Personagem

- uma personagem feminina com apresentação provisória de fantasia sombria;
- um arquétipo marcial identificado internamente por id neutro e estável;
- nível fixo, sem experiência ou progressão de campanha;
- atributos essenciais: vida, recurso, dano físico, velocidade, armadura, bloqueio e resistência a fogo;
- três builds iniciais: equilibrada, ofensiva e defensiva.

Os nomes, a ilustração e a fantasia da personagem pertencem ao pacote de apresentação. As fórmulas de combate não dependerão do tema.

### 3.2 Habilidades e comportamento

- ataque básico de alvo único;
- habilidade de dano em área;
- habilidade defensiva com cooldown;
- três suportes ou modificadores simples;
- uma poção de vida;
- regras controladas de comportamento, como:
  - usar defesa abaixo de uma porcentagem de vida;
  - usar área quando houver vários inimigos;
  - usar ataque básico quando faltar recurso.

### 3.3 Árvore passiva e Ascendência

- árvore passiva visual e interativa presente desde a primeira interface;
- aproximadamente 18 nós divididos entre caminhos ofensivo, defensivo e utilitário;
- nó inicial, nós menores, notáveis e keystones visualmente distintos;
- conexões obrigatórias e limite inicial de oito pontos;
- alocação e reembolso sem permitir caminhos desconectados;
- bônus refletidos nos atributos demonstrativos da personagem;
- área separada de Ascendência;
- três caminhos provisórios de Ascendência ligados ao mesmo arquétipo;
- escolha de um caminho por vez e dois pontos de Ascendência para teste;
- reset gratuito durante o protótipo.

A árvore reduzida não pretende validar o balanceamento de 45 nós. Ela deverá validar se navegar, planejar caminhos e observar atributos mudarem é uma atividade interessante por si mesma.

### 3.4 Equipamentos e loot

- seis slots habilitados: arma, mão secundária, cabeça, torso, amuleto e anel;
- aproximadamente 10 tipos-base;
- três raridades: comum, mágico e raro;
- aproximadamente 12 famílias de modificadores;
- dois itens únicos manuais que alteram uma decisão de build;
- comparação entre item equipado e item selecionado;
- inventário pequeno, sem baú, crafting, venda ou mercado;
- ícone compartilhado por tipo-base e arte própria opcional para item único.

### 3.5 Dungeon

Uma dungeon com:

- dois grupos de inimigos comuns;
- um encontro de elite;
- um chefe;
- dano físico e dano de fogo;
- pressão de recurso;
- seed registrada;
- três a cinco minutos fictícios de duração;
- tempo de espera reduzido para testes internos.

O chefe será desenhado para que uma build excessivamente ofensiva morra por dano de fogo. O relatório deverá expor o problema, e uma troca coerente de equipamento ou estratégia deverá permitir vencer, ainda que mais lentamente.

### 3.6 Relatório

O relatório exibirá:

- vitória ou derrota;
- duração simulada;
- dano total e DPS médio;
- dano causado por habilidade;
- dano recebido por tipo;
- cura e mitigação;
- momentos de falta de recurso;
- causa da morte, quando houver;
- dois ou três fatos relevantes da tentativa;
- loot obtido.

O log técnico completo será usado no desenvolvimento, mas não será mostrado como interface principal ao jogador.

## 4. Fora do protótipo

Ficam explicitamente adiados:

- cadastro obrigatório e recuperação de conta;
- múltiplos personagens;
- experiência e progressão de nível;
- campanha completa;
- mapa infinito;
- crafting;
- mercado;
- rankings;
- temporadas e ligas;
- chat e recursos sociais;
- notificações push;
- monetização;
- animação completa do combate;
- geração de arte diferente para cada instância de item.

Esses sistemas só devem entrar quando o loop central atingir os critérios de validação deste documento.

## 5. Arquitetura inicial

```text
apps/
└── web/                 interface React e PWA futura

packages/
├── simulation/          motor determinístico sem dependência da interface
├── content/             personagem, habilidades, itens e dungeon
├── contracts/           schemas e tipos compartilhados
├── ui/                  componentes visuais reutilizáveis
└── themes/
    └── abyssal-anime/   tema inicial substituível

supabase/
├── migrations/          banco do teste online
└── functions/           início e resgate de tentativas
```

### 5.1 Decisões técnicas

- TypeScript de ponta a ponta;
- interface React criada no primeiro marco e alimentada inicialmente por dados demonstrativos;
- estrutura visual inspirada em sites clássicos de MMORPG, com cabeçalho, navegação, painéis laterais e área central;
- nenhum texto da interface usará emojis;
- a primeira versão usará formas, tipografia, bordas e cores em CSS, sem depender de imagens;
- dados demonstrativos e motor real usarão os mesmos contratos para evitar reconstruir a interface;
- motor como função pura: snapshot + encontro + seed = resultado;
- gerador pseudoaleatório próprio e seed explícita;
- valores percentuais em inteiros ou pontos-base para evitar arredondamentos acidentais;
- nenhum uso de `Math.random()`, horário local ou estado global no motor;
- conteúdo definido por dados com ids e versões estáveis;
- interface incapaz de conceder item, moeda ou resultado;
- logs resumidos persistidos; logs detalhados podem ser regenerados pela seed;
- nenhuma fila de trabalhos no protótipo.

### 5.2 Fluxo assíncrono do teste online

```text
Jogador inicia
    ↓
Servidor valida e cria snapshot
    ↓
Servidor simula imediatamente
    ↓
Resultado fica privado até available_at
    ↓
Jogador retorna e solicita o resultado
    ↓
Servidor entrega recompensa uma única vez
```

O tempo fictício da dungeon não representa tempo de processamento. Durante testes, a espera poderá ser configurada para zero, dez ou trinta segundos.

## 6. Marcos de desenvolvimento

As estimativas consideram uma pessoa desenvolvendo com escopo congelado. Os critérios de saída importam mais do que o calendário.

### Marco 0 — Fundação técnica

**Estimativa:** 1 a 2 dias.

**Status em 30 de junho de 2026:** parcialmente concluído. Estrutura web, tema, navegação, dados demonstrativos e testes foram implementados. Validação formal dos contratos e integração contínua ainda estão pendentes.

Entregas:

- estrutura do repositório;
- TypeScript, lint, formatação e testes;
- aplicação React executável no navegador;
- estrutura responsiva com cabeçalho, navegação principal, painel da personagem, conteúdo central e painel de atividade;
- navegação inicial entre visão geral, personagem, equipamentos, habilidades e dungeon;
- navegação e estrutura inicial da árvore passiva e da Ascendência;
- dados demonstrativos isolados atrás dos contratos do projeto;
- contratos básicos de personagem, habilidade, item e encontro;
- ids e versões de conteúdo;
- tema inicial com tokens semânticos;
- integração contínua executando validação e testes.

Critérios de saída:

- projeto instala e executa com comandos documentados;
- a interface pode ser aberta e navegada desde o primeiro marco;
- o layout continua utilizável em desktop e celular;
- nenhuma tela depende de imagem para comunicar sua função;
- uma alteração inválida falha na validação automatizada;
- nenhuma regra de jogo depende de componente visual.

### Marco 1 — Motor headless

**Estimativa:** 5 a 7 dias.

**Status em 30 de junho de 2026:** não iniciado. A interface ainda utiliza resultados demonstrativos.

Entregas:

- atributos e modificadores;
- habilidades, custo, cooldown e prioridade;
- inimigos e encontros em ticks;
- dano, defesa, resistência, cura e morte;
- seed determinística;
- três builds e uma dungeon em dados;
- relatório técnico;
- comando local que executa milhares de simulações em lote.
- integração progressiva do motor com a interface já existente, substituindo os resultados demonstrativos.

Critérios de saída:

- a mesma entrada produz exatamente o mesmo resultado;
- as três builds produzem resultados intencionalmente diferentes;
- a build ofensiva perde pelo motivo esperado;
- a mudança defensiva prevista permite vencer;
- nenhuma simulação produz `NaN`, valores negativos impossíveis ou loop infinito;
- uma simulação individual termina bem abaixo do limite planejado para a função do servidor.

### Marco 2 — Vertical slice local

**Estimativa:** 5 a 8 dias.

**Status em 30 de junho de 2026:** parcialmente antecipado. O fluxo visual, as builds, os equipamentos, as habilidades, a árvore e a dungeon demonstrativa já podem ser testados, mas ainda não estão conectados ao motor determinístico.

Entregas:

- conexão funcional do painel da personagem ao motor;
- seleção funcional das três builds;
- árvore passiva com alocação, reembolso, conexões e bônus de atributos;
- escolha e alocação inicial de Ascendência;
- equipamentos, inventário e comparação de itens funcionais;
- configuração de comportamento aplicada à simulação;
- início e estado da dungeon conectados ao motor;
- resultado, relatório, loot e nova tentativa reais;
- persistência local para desenvolvimento;
- layout responsivo para celular e desktop.

Critérios de saída:

- o loop completo funciona sem editar arquivos manualmente;
- recarregar a página não destrói o teste local;
- todas as ações essenciais funcionam por toque;
- outra pessoa consegue concluir uma tentativa sem explicação do desenvolvedor;
- o visual pode ser trocado alterando o pacote de tema, sem mudar o motor.

### Marco 3 — Protótipo online fechado

**Estimativa:** 4 a 6 dias.

**Status em 30 de junho de 2026:** não iniciado.

Entregas:

- hospedagem da interface;
- banco e funções server-side;
- login por Discord ou código de acesso para testadores;
- snapshots e resultados privados;
- bloqueio de resgate duplicado;
- eventos mínimos de telemetria;
- tratamento de erros e estados de carregamento;
- instruções para publicar e restaurar o ambiente.

Critérios de saída:

- alterar o cliente não permite fabricar vitórias ou itens;
- o resultado não pode ser lido antes de `available_at`;
- duas solicitações simultâneas não duplicam recompensa;
- uma tentativa iniciada continua válida após fechar a página;
- o protótipo funciona em ao menos um navegador desktop e dois navegadores móveis atuais.

### Marco 4 — Rodadas de playtest

**Estimativa:** duas ou mais rodadas curtas.

**Status em 30 de junho de 2026:** não iniciado. Houve inspeção técnica e visual, mas ainda não houve sessão observada com jogadores externos.

Entregas:

- observação de jogadores sem orientação durante a primeira partida;
- formulário curto após a sessão;
- correções dos problemas mais recorrentes;
- comparação das métricas entre rodadas;
- decisão documentada de avançar, alterar o loop ou interromper a expansão.

Critérios de saída:

- as metas provisórias da seção 9 foram medidas;
- cada problema recorrente possui evidência e prioridade;
- nenhuma funcionalidade grande do MVP é adicionada apenas para compensar um loop central confuso.

## 7. Estratégia de testes

### 7.1 Testes automatizados do motor

- determinismo com snapshot, versão e seed iguais;
- alteração da seed sem violar limites do encontro;
- ordem correta de adições, aumentos e multiplicadores;
- custo de recurso e cooldown;
- armadura, bloqueio e resistência;
- cura limitada pela vida máxima;
- morte encerrando ações futuras;
- geração de item respeitando raridade, tags e grupos de exclusão;
- soma do relatório compatível com os eventos da simulação;
- limite máximo de ticks;
- serialização e reexecução do snapshot.

### 7.2 Cenários dourados

O repositório manterá cenários versionados com resultados esperados:

1. build equilibrada conclui a dungeon;
2. build ofensiva chega rapidamente ao chefe e morre por fogo;
3. build com resistência conclui mais lentamente;
4. falta de recurso reduz o DPS de uma configuração inadequada;
5. o item único altera uma regra sem criar resultado impossível.

Mudanças nesses resultados exigirão revisão explícita, evitando que balanceamento ou refatoração alterem silenciosamente o jogo.

### 7.3 Testes de integração online

- criação de tentativa com snapshot imutável;
- tentativa ocupando a personagem;
- resultado indisponível antes do horário;
- resgate idempotente;
- item entregue pertencendo ao jogador correto;
- falha no meio da operação sem recompensa parcial;
- autorização impedindo leitura de outra conta.

### 7.4 Testes da interface

- selecionar build;
- equipar e desequipar;
- comparar item;
- iniciar tentativa;
- fechar e reabrir;
- visualizar relatório;
- receber loot;
- repetir a dungeon;
- executar o fluxo em largura de celular.

## 8. Plano de playtest

### Rodada interna

- desenvolvedor e até três pessoas próximas;
- foco em bugs, textos ausentes e fluxo bloqueado;
- explicações são permitidas, mas devem ser registradas.

### Rodada observada

- cinco a dez jogadores que gostam de RPG, ARPG ou jogos incrementais;
- primeira sessão sem tutorial falado;
- observar onde param, o que tentam clicar e como interpretam a derrota;
- entrevista de até dez minutos depois da sessão.

### Rodada fechada online

- 15 a 30 jogadores convidados;
- acesso durante alguns dias;
- telemetria do funil e formulário opcional;
- uma pequena atualização entre grupos, evitando mudar tudo ao mesmo tempo.

Perguntas principais:

1. Por que sua personagem venceu ou perdeu?
2. Qual mudança você fez e o que esperava que acontecesse?
3. O relatório ajudou ou pareceu uma planilha confusa?
4. Algum item criou uma decisão interessante?
5. Você tentaria outra dungeon ou build sem receber recompensa externa?
6. O que pareceu lento, injusto ou desnecessário?

## 9. Métricas e metas provisórias

Estas metas servem como sinal para decidir o próximo investimento, não como promessa comercial.

- 80% iniciam a primeira tentativa sem ajuda;
- 70% identificam corretamente a causa principal da derrota;
- 60% fazem uma alteração coerente depois de perder;
- 50% iniciam espontaneamente uma nova tentativa;
- 40% demonstram interesse em mais conteúdo após concluir o protótipo;
- menos de 10% abandonam por não entender o relatório;
- zero divergência nos testes de determinismo;
- zero recompensa duplicada nos testes de concorrência.

Eventos mínimos:

```text
prototype_opened
build_selected
item_equipped
behavior_changed
attempt_started
attempt_result_viewed
report_detail_opened
loot_equipped
retry_started
feedback_submitted
```

Não serão armazenados cada tick de combate ou dados pessoais desnecessários. Seed, snapshot, versão e resumo permitem investigar resultados com custo menor.

## 10. Tema e produção visual

O tema inicial terá o id provisório `abyssal-anime`. A primeira estrutura será construída sem imagens e deverá comunicar o jogo usando:

- paleta dark fantasy;
- tokens de fundo, superfície, texto, destaque e raridade;
- tipografia de título e corpo;
- molduras de painel, item e retrato produzidas em CSS;
- espaços reservados textuais para personagem, habilidades e itens;
- barras de vida, recurso e progresso produzidas em CSS;
- organização inspirada em portais e sites de MMORPG antigos;
- manifesto relacionando chaves semânticas a arquivos.

Depois que a estrutura e o loop estiverem validados, o mesmo tema poderá receber:

- uma ilustração principal da personagem;
- ícones das habilidades;
- ícones transparentes dos tipos-base;
- fundos da dungeon e do relatório.

Direção inicial:

- fantasia sombria gótica;
- personagens femininas anime semirrealistas;
- ambientes mais texturizados e sombrios que as personagens;
- silhuetas de item legíveis em tamanho pequeno;
- dourado envelhecido, vermelho profundo e azul espectral como acentos;
- identidade original, sem reutilizar nomes, símbolos, interface ou arte de Path of Exile.

Antes de produzir muitas imagens, será criado um pequeno guia com proporção, enquadramento, iluminação, paleta, fundo e nomenclatura. Arte provisória poderá ser substituída sem alterar ids de conteúdo.

## 11. Backlog priorizado

### P0 — Necessário para validar

- contratos e validação de conteúdo;
- RNG determinístico;
- motor de atributos e modificadores;
- combate e comportamento;
- dungeon e três builds;
- relatório;
- inventário e comparação;
- fluxo de tentativa e nova tentativa;
- árvore passiva e Ascendência interativas;
- responsividade;
- testes automatizados;
- publicação fechada e telemetria mínima.

### P1 — Adicionar somente se P0 estiver claro

- segundo encontro;
- mais itens únicos;
- animações leves no relatório;
- tutorial contextual;
- salvamento de dois loadouts personalizados;
- compartilhamento de um relatório por link.

### P2 — Depois da validação

- novas classes;
- crafting;
- campanha;
- ranking;
- liga oficial;
- mercado;
- mapa infinito;
- ligas criadas por jogadores.

## 12. Riscos principais

| Risco | Sinal | Resposta |
|---|---|---|
| Combate correto, mas sem graça | jogador não tenta novamente | melhorar decisões antes de criar mais conteúdo |
| Relatório excessivamente técnico | jogador não sabe o que mudar | priorizar fatos, comparação e hierarquia visual |
| Vitória parece aleatória | resultados surpreendem sem explicação | registrar seed e atribuir cada efeito à fonte |
| Escopo cresce cedo | mercado ou ligas entram antes do teste | manter P0 congelado até a primeira rodada |
| Arte demora mais que o jogo | muitas imagens antes do loop funcionar | usar um conjunto pequeno de assets provisórios |
| Tema fica preso ao domínio | nomes e cores aparecem no motor | resolver apresentação por ids, tokens e manifests |
| Logs lotam o banco gratuito | crescimento rápido por tentativa | persistir resumo e regenerar detalhes quando possível |

## 13. Definição de pronto do protótipo

O protótipo 0.1 estará pronto quando:

- o loop completo puder ser jogado em celular e desktop;
- o servidor for autoridade no teste online;
- a mesma seed e snapshot produzirem o mesmo resultado;
- existir uma derrota intencional solucionável por decisão de build;
- o relatório comunicar essa causa para jogadores sem orientação;
- loot puder ser comparado, equipado e percebido na tentativa seguinte;
- a árvore permitir planejar, alocar e reembolsar pontos sem quebrar conexões;
- pelo menos uma rodada observada tiver sido concluída;
- métricas e feedback estiverem registrados;
- houver uma decisão explícita sobre avançar para o alpha.

## 14. Primeira sequência de trabalho

1. criar a estrutura TypeScript e os comandos do projeto;
2. criar a interface base e o sistema de tema sem imagens;
3. montar a navegação e os painéis com dados demonstrativos;
4. implementar a árvore passiva reduzida e a Ascendência;
5. definir os contratos mínimos e validar os dados;
6. implementar RNG com seed;
7. implementar atributos, modificadores e cálculo de dano;
8. executar um duelo simples pelo terminal e pela interface;
9. adicionar habilidades, recursos, cooldowns e comportamento;
10. montar a dungeon e os cenários dourados;
11. gerar e exibir o relatório técnico.

O primeiro entregável utilizável será uma interface navegável com a estrutura visual do BuildsWar e dados demonstrativos coerentes. Em seguida, o motor receberá uma build e uma seed, executará a dungeon e substituirá progressivamente os resultados demonstrativos por relatórios reproduzíveis. A separação entre contratos, interface e motor preserva a velocidade visual sem transformar dados provisórios em regras definitivas.

## 15. Estado implementado e validado

### 15.1 Implementado

- aplicação React e TypeScript criada com Vite;
- tema `abyssal-anime` controlado por variáveis semânticas de CSS;
- estrutura visual inspirada em portais clássicos de MMORPG;
- layout responsivo sem dependência de imagens;
- navegação entre visão geral, personagem, equipamentos, habilidades, árvore e dungeon;
- três builds demonstrativas com atributos e comportamentos diferentes;
- seis slots de equipamento e inventário com troca de itens;
- três habilidades e prioridades de comportamento apresentadas na interface;
- tentativa demonstrativa com estado de execução e relatório diferente por build;
- árvore passiva com 18 nós, conexões, notáveis e keystones;
- limite de oito pontos passivos;
- bloqueio de alocação desconectada;
- bloqueio de reembolso que quebraria um caminho já alocado;
- bônus da árvore refletidos nos atributos apresentados;
- três caminhos provisórios de Ascendência;
- limite de dois pontos de Ascendência e troca de caminho com reset;
- acesso direto a uma seção por parâmetro de URL;
- servidor local de desenvolvimento disponível para teste.

### 15.2 Validação técnica concluída

- verificação de tipos TypeScript sem erros;
- nove testes automatizados aprovados;
- testes específicos para conexão, reembolso, restrição de Ascendência e aplicação de bônus;
- build de produção concluído;
- auditoria de dependências sem vulnerabilidades conhecidas no momento da instalação;
- inspeção visual da página inicial e da árvore em dimensões de desktop e celular;
- busca automatizada sem emojis nos textos do projeto;
- `git diff --check` sem erros de whitespace.

### 15.3 Ainda não validado

- diversão do loop central com jogadores externos;
- compreensão da árvore sem orientação;
- motor de combate determinístico;
- impacto de equipamentos e talentos no resultado da dungeon;
- persistência local ou online;
- autenticação e autoridade do servidor;
- equilíbrio dos nós e das três builds;
- métricas de retenção ou repetição;
- acessibilidade completa com teclado e leitores de tela;
- comportamento em uma variedade maior de navegadores e aparelhos reais.

Resultados demonstrativos não devem ser tratados como balanceamento ou simulação final.

## 16. Próximas atualizações

### 16.1 Revisão prioritária de UX e UI da árvore

A árvore atual valida estrutura, conexões e alteração de atributos, mas ainda não está aprovada como experiência final. Os principais problemas observados são densidade visual, competição com os painéis laterais, textos pequenos e pouca distinção entre inspecionar e alocar.

Próxima iteração planejada:

1. abrir a árvore em modo de foco, usando a maior parte da tela e reduzindo distrações laterais;
2. adicionar zoom, movimentação e ação para centralizar a árvore;
3. exibir nomes completos somente no nó selecionado, destacado ou em foco;
4. diferenciar visualmente caminhos ofensivo, defensivo e utilitário;
5. separar planejamento de confirmação, com ações para aplicar ou cancelar mudanças;
6. mostrar comparação de atributos, como `112 → 118 (+6)`;
7. tornar os próximos nós disponíveis mais evidentes;
8. apresentar a escolha de Ascendência em uma etapa própria, com comparação entre caminhos;
9. usar painel inferior de detalhes e modo de tela cheia no celular;
10. criar uma orientação curta para a primeira abertura;
11. realizar um teste observado com cinco jogadores antes de considerar a árvore aprovada.

### 16.2 Sequência posterior

Depois da revisão da árvore:

1. validar os contratos de conteúdo;
2. implementar o RNG determinístico;
3. criar o primeiro duelo reproduzível;
4. aplicar equipamentos, passivas e Ascendência ao motor;
5. substituir os relatórios demonstrativos;
6. adicionar persistência local para testes prolongados;
7. preparar o protótipo online fechado.
