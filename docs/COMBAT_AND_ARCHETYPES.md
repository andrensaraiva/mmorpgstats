# Motor, Balanceamento e Mix de Classes/Builds

- **Pergunta que este doc responde:** com base na pesquisa, **devemos mudar o motor?** Sim. E como **usar o balanceamento dos líderes** e **misturar as classes/builds mais amadas** do gênero.
- **Data:** 01 de julho de 2026
- **Relacionados:** [Pesquisa de Gênero](./ARPG_RESEARCH.md) · [Design de Equipamento & Habilidades](./EQUIPMENT_SKILLS_DESIGN.md) · [Visão do MVP](./MVP.md)

> **Escopo:** este documento especifica a **matemática** (pipeline de dano/defesa, puro, testável) e o **conteúdo** (classes/arquétipos). A **execução por ticks** (a simulação determinística no tempo — o grande risco técnico pendente) consome esta matemática, mas é uma etapa própria.

---

# Parte A — Motor & Balanceamento

## A0. Atributos & recursos do personagem (denominador comum dos ARPGs)

Mantemos **o conjunto que aparece em PoE2, Diablo 4 e Last Epoch** — a base legível para conteúdo e balanceamento (o herói tem que fazer sentido para quem vem do gênero). Hoje o `aggregate` já entrega um subconjunto; o resto entra nas fases M1–M3. **Regra:** não inventar atributo que não exista no gênero.

**Recursos (pools):**
- **Vida** — pool principal. ✅ implementado.
- **Recurso de habilidade (mana/energia)** — custo das skills + regeneração. ⏳ custos já existem nas skills; o pool/regen entra com o consumo real (M3/M5).
- **Reserva (tipo Spirit)** — orçamento para auras/efeitos persistentes. ⏳ planejado (ver POE2_REFERENCE).

**Atributos primários:** Força / Destreza / Inteligência — ✅ já no `Power`; viram gate de requisitos e escalas por atributo.

**Camadas de defesa (ordem: resistência → mitigação → pool):**
- **Resistências** fogo/frio/raio/caos (teto 75%, elevável). ✅
- **Armadura** — mitiga físico; passará a **depender do tamanho do golpe**. ✅ (simplificada) → refino em **M2**.
- **Evasão** — chance de o inimigo errar o golpe (teto 95%). ⏳ **M2**.
- **Escudo de energia / buffer** — absorve **antes** da vida (exceto DoT de sangramento/veneno). ⏳ **M2**.
- **Bloqueio** (teto 75%). ✅
- **Regeneração / recuperação** de vida e recurso. ⏳ M2/M3.

**Ofensa:** crítico (chance × multi) ✅ · velocidade de ataque/conjuração ✅ (ataque) · **penetração** ⏳ M1 · **ailments/DoT** ⏳ M3.

> Ou seja: **outros atributos entram sim** — evasão/ES e o refino de armadura em **M2**, recurso/reserva junto do consumo real. A UI de Personagem (dashboard) já reserva espaço para exibi-los quando o motor os calcular.

## A1. Diagnóstico: o que já bate e o que falta

Boa notícia: a **estrutura** do nosso motor já segue o padrão PoE (adicionado → aumentado → mais). Falta **largura**.

| Já temos (alinhado) | Falta (para paridade) |
|---|---|
| dano plano **adicionado** (addedPhys) | **tipos de dano** além de físico: fogo, frio, raio, caos |
| **aumentado** aditivo (incPhys, incVel) | **penetração** de resistência |
| **mais/menos** multiplicativo (moreDamage/lessDamage) | **ailments / DoT**: sangramento, queimadura, veneno |
| crítico (chance × multi) | **chill/shock/freeze** (frio/raio como controle) |
| **teto de resistência 75%** | **evasão** e **escudo de energia** (camadas de defesa) |
| mitigação de armadura | armadura **dependente do tamanho do golpe** |
| bloqueio (teto 75%) | **fontes de dano além do golpe próprio**: minions, totens/balista, DoT |

**Conclusão: evoluir, não reconstruir.** Ampliamos o pipeline para multi-tipo + ailments + mais camadas de defesa, mantendo funções puras e testáveis.

## A2. Balanceamento emprestado (constantes reais do gênero)

Adotar as fórmulas consagradas (fonte: PoE/PoE2 — ver §Fontes):

**Pipeline de dano por hit (por tipo de dano):**
```
base (arma/skill) + adicionado_plano
  × (1 + Σ aumentado%/100)         ← ADITIVO entre si (retorno decrescente)
  × Π (1 + mais%/100)              ← MULTIPLICATIVO (vem de suportes/keystones)
  → aplica crítico  (1 + chance×(multi−1))
  → aplica resistência do alvo
```

**Resistência do alvo** (por tipo elemental/caos):
```
mult = max(0, 1 − (resistência − penetração)/100)
```
Teto de resistência do jogador **75%** (elevável a 90% por nós/únicos); penetração reduz a resistência **efetiva** do inimigo.

**Armadura (dano físico) — dependente do tamanho do golpe:**
```
redução = Armadura / (Armadura + 12 × dano_do_golpe)   (teto 90%)
```
Consequência de design (importante): armadura é ótima contra **muitos golpes pequenos** e fraca contra **um golpe enorme** — cria trade-off real (hoje usamos `armour/(armour+1500)`, que ignora o tamanho do golpe; **trocar por esta**).

**Evasão:** teto 95% (chance mínima de acerto do inimigo 5%), sistema por entropia (previsível — bom para nosso modelo determinístico).

**Escudo de energia (ES):** buffer que absorve **antes** da vida, contra tudo **exceto DoT de sangramento/veneno**.

**Bloqueio:** teto 75%.

**Ailments / DoT** (durações e comportamento do gênero):
- **Sangramento** — DoT **físico** baseado no golpe; empilha; ~4s.
- **Queimadura (ignite)** — DoT de **fogo** baseado no hit de fogo; empilha; ~3s.
- **Veneno** — DoT de **caos/físico**; empilha; ~3s; cada stack reduz um pouco a resistência.
- **Frio → chill/freeze** (lentidão/congela) e **raio → shock** (alvo recebe +dano) como **controle/escala**, não dano direto.

## A3. Modelo alvo (o que o `aggregate` passa a calcular)

Estender o motor puro para:
1. **Somar por tipo de dano** (físico/fogo/frio/raio/caos) o pipeline acima → **DPS de golpe** por tipo.
2. **DPS de ailment/DoT** derivado dos hits (queimadura/sangramento/veneno).
3. **Fontes múltiplas:** `dpsTotal = golpe_próprio + minions + totens/balista + DoT`. Cada fonte é um "orçamento" agregado próprio (minion tem seus próprios add/inc/more).
4. **Defesa em camadas (EHP):** resistências → (armadura|evasão|bloqueio) → pool (vida + ES). EHP vira um número derivado dessas camadas, não só vida×armadura.
5. **Tags** governam suportes e escala (ataque/projétil/área/minion/fogo/… — já começamos com tags).

Tudo continua **puro** e alimenta a mecânica de **números descobertos** (DPS real revelado no teste) que já existe.

## A4. Faseamento do motor (do atual ao alvo)

- ✅ **M1 — Multi-tipo + penetração + resistências por tipo. CONCLUÍDO (03/jul).** O pipeline de dano (antes só físico) foi generalizado para os 5 tipos em `engine.ts`: `avgHitByType`/`prepareSkill` somam `added{Tipo}` + `inc{Tipo}`/`incElemental` por tipo; `mitigateHit` aplica **armadura ao físico** e **resistência do alvo − penetração** aos elementais/caos (teto 75, piso −60). `aggregate` e `simulateRotation` compartilham a mesma matemática (a equivalência física ficou intacta — 53 testes seguiram verdes ao refatorar). Skills ganharam `damageType`/`baseDamage` (magias elementais não escalam com a arma física). Conteúdo: **Bola de Fogo** (fogo) e **Flecha Trovejante** (raio); afixos `added fire/cold/lightning/chaos`, `inc elemental`, penetração elemental; nós `Faísca`/`Convergência Elemental`; suportes `Foco Elemental`/`Ruptura Arcana`/`Projétil Veloz`. UI: boneco com **sliders de resistência por tipo** + **breakdown de dano por tipo**; selo de tipo nas skills. **+5 testes** (58 no total). Ver COMBAT_ROTATION_AND_DUMMY (R5 liga os sliders — feito aqui).
- **M2 — Armadura por tamanho de golpe + evasão + ES + bloqueio** como camadas reais de EHP (troca a mitigação simplificada atual).
- **M3 — Ailments/DoT** (sangramento/queimadura/veneno) e chill/shock/freeze como escala/controle. Habilita builds de DoT (muito amadas).
- **M4 — Fontes múltiplas** (minions, totens/balista) somando ao DPS. Habilita summoner/totem.
- **M5 — Execução por ticks** (simulação determinística no tempo) que roda o combate real e gera o relatório — o grande risco técnico do MVP, agora com a matemática pronta. Tem **dois lados**:
  - **Ofensa (já iniciado):** a rotação por ticks — recurso/cooldown/cast/combo — já existe como a **trilha R** ([COMBAT_ROTATION_AND_DUMMY](./COMBAT_ROTATION_AND_DUMMY.md)), que é o M5 começando cedo e estreito. Mede o **tempo-para-limpar**.
  - **Defesa (R4/M5 pleno):** o mesmo laço passa a simular **dano recebido por tick, controle (CC), uso de poção e EHP** → o **tempo-para-morrer**. O resultado da dungeon vira a **corrida limpar × morrer** (o eixo tank × DPS: tank completa devagar porém vivo; glass cannon morre em encontros lentos) e habilita a **morte por controle** (`reason: 'control'`). Daí sai, de graça, o **relatório completo** que o [MVP §10.4](./MVP.md) pede (inimigos derrotados, dano causado/recebido, poções, tempo sob controle, causa). Ver [BESTIARY §4.3](./BESTIARY_AND_DUNGEONS.md).

Cada fase é coberta por testes (o `engine.test.ts` já cobre o núcleo atual).

---

# Parte B — Classes & Builds (a mistura do que é mais divertido)

## B1. Os arquétipos mais amados (o que puxar de cada jogo)

Da pesquisa, os arquétipos que o público **repete e adora** em PoE2, Diablo 4 e Last Epoch:

| Arquétipo | Exemplos amados | O que o torna divertido | Arma/recurso |
|---|---|---|---|
| **Investida corpo-a-corpo** | Whirlwind Barb (D4), Forge Guard/Void Knight (LE), Wolfman (PoE2) | impacto físico + sangramento, "estar na cara do inimigo" | machado/maça/2 mãos |
| **Invocador / minions** | Blood Wave Necro (D4), Necromancer/Beastmaster (LE), minions (PoE2) | um exército luta por você; comandar, não mirar | cetro/varinha + secundária |
| **Mago elemental** | Firewall Sorc (D4), Runemaster/Sorcerer (LE), Bloodmage Fireball (PoE2) | limpar a tela com fogo/frio/raio + ignite/chill/shock | cajado/foco |
| **Arqueiro crítico** | Deadeye Lightning Arrow / Explosive Shot (PoE2), Marksman (LE), Rogue (D4) | velocidade, crítico, explosões em cadeia | arco/besta |
| **Transformação / feras** | Druid Werebear/Shred (D4/LE), Primalist (LE), Shaman Bear (PoE2) | virar a fera; tanque veloz e implacável | garras/cajado/desarmado |
| **DoT / veneno / chamas** | Warlock poison-RF (LE), Pestilence Spiritborn (D4), Pathfinder (PoE2) | plantar a semente e ver derreter; escala por acúmulo | híbrido |
| **Totem / balista** | Shaman/Storm Totem (LE), balista (PoE) | posicionar torres remotas; jogo mais "relax" | qualquer + totem |
| **Assassino / armadilha** | Bladedancer (LE), Death Trap Rogue (D4) | burst, esquiva, armadilhas | adaga/arco |

**Padrão comum ao que dá certo:** poucas ativas com **sinergia forte** ("tudo na barra importa"), fantasia clara, e **risco/recompensa** (você vira um deus depois de resolver o quebra-cabeça).

## B2. Como misturar no BuildsWar (sem virar cópia)

Nosso sistema de **habilidades por arma/classe** ([EQUIPMENT_SKILLS_DESIGN](./EQUIPMENT_SKILLS_DESIGN.md)) é o encaixe perfeito: **a classe dá identidade + ascendências; a arma abre o leque; a árvore e os suportes esculpem o arquétipo.** Assim um mesmo personagem alcança vários arquétipos amados sem "menu de build pronta".

### MVP (3 classes já previstas, cada uma alcançando vários arquétipos)
- **Marcial (corpo-a-corpo):** com machado/maça → **investida/sangramento**; com escudo → **guardião** (bloqueio/físico + cura).
- **Precisão (à distância):** com arco → **arqueiro crítico** (raio); com besta → **explosões/AoE**; com armadilhas → **assassino**.
- **Arcano (mago):** cajado/foco → **elementalista** (fogo/frio/raio); com foco em veneno/caos → **DoT/pestilência**.

Ou seja, o "mix" começa no MVP **sem novas classes** — só habilitando os arquétipos via arma + árvore + suportes (depende das fases M1–M4 do motor).

### Roster completo (pós-MVP) — a mistura, com ascendências que ecoam os favoritos
Sugestão de 6 classes-base, cada uma com 2–3 ascendências que **fundem** o melhor do gênero (nomes provisórios, identidade original):

- **Marcial** → *Furioso* (investida/whirlwind + sangramento) · *Baluarte* (bloqueio/armadura + cura, à la Paladin/Forge Guard).
- **Invocador** → *Necromante* (esqueletos/onda de sangue) · *Domador* (feras persistentes, à la Beastmaster).
- **Arcano** → *Elementalista* (fogo/frio/raio, screen-clear) · *Pestilento* (veneno/caos DoT, à la Warlock/Spiritborn).
- **Precisão** → *Perseguidor* (arco crítico de raio, à la Deadeye) · *Engenhoso* (armadilhas/balista/torres).
- **Feral** → *Fera* (transformação werebear/wolf, tanque veloz) · *Xamã* (totens elementais).
- **Lâmina** → *Dançarino* (adagas/esquiva, burst) · *Vazio* (dano de "vazio" com ecos, à la Void Knight).

Cada ascendência **pede** uma peça do motor (Parte A): minions/totens (M4), DoT (M3), elemental (M1). Por isso motor e conteúdo andam juntos.

## B3. Diretrizes de balanceamento de conteúdo (dos líderes)
- **Poucas ativas, muita sinergia** — evitar a "sopa de botões"; cada skill deve importar.
- **Trade-off, não número maior** — todo ganho tem custo (keystones que dão e tiram).
- **Habilidade forte cedo** (lição de Last Epoch): a fantasia aparece já nas primeiras horas.
- **Um arquétipo de DoT e um de minions desde cedo** — são os mais "pegajosos" do gênero.
- **Afixo excepcional que só dropa** e **dois trilhos de crafting** (já decididos) sustentam a caça longa.

---

# Parte C — Próximos passos

1. **M1 do motor** (multi-tipo + penetração + resistências por tipo) — destrava elemental e é base para ailments. Cobrir com testes.
2. Em paralelo, **catalogar skills por arma** com tags de tipo de dano (fogo/frio/raio/físico/caos) e os primeiros **arquétipos jogáveis** (investida, elementalista, arqueiro).
3. **M2/M3** (camadas de defesa reais + ailments) para habilitar DoT e o trade-off armadura×golpe.
4. **M4** (minions/totens) e as ascendências de invocador/feral.
5. **M5** (ticks) fecha o relatório real — o grande risco, com a matemática já pronta e testada.

Sequência sugerida no repo: motor **M1→M2→M3** primeiro (mais variedade percebida por menos risco), conteúdo de arquétipos acompanhando, minions/totens (M4) e ticks (M5) por último.

---

## Fontes

- [PoE2 — Ordem de operações de dano e defesa (Mobalytics)](https://mobalytics.gg/poe-2/guides/damage-defence-calc-order)
- [PoE2 — Damage Scaling (Maxroll)](https://maxroll.gg/poe2/getting-started/damage-scaling)
- [Resistance — PoE Wiki](https://www.poewiki.net/wiki/Resistance)
- [PoE2 — Defence Guide (Maxroll)](https://maxroll.gg/poe2/getting-started/defence-guide)
- [PoE2 — Defesa e Resistência (Sportskeeda)](https://www.sportskeeda.com/mmo/exile-2-poe2-defense-resistance-guide-energy-shield-armor-evasion)
- [PoE2 Build Meta (Maxroll)](https://maxroll.gg/poe2/meta/the-build-meta)
- [Diablo 4 Build Guides (Maxroll)](https://maxroll.gg/d4/build-guides)
- [Diablo 4 Classes (Fextralife)](https://diablo4.wiki.fextralife.com/Classes)
- [Last Epoch — Classes e Masteries (Maxroll)](https://maxroll.gg/last-epoch/resources/class-and-mastery-introductions)
- [Last Epoch — Ailments (LastEpochTools)](https://www.lastepochtools.com/ailments/ignite)
- [Last Epoch — melhores builds de DoT (MMOPIXEL)](https://www.mmopixel.com/news/last-epoch-best-dot-builds-that-melt-bosses)
