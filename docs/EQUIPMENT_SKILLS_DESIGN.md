# Design — Equipamento, Baú, Descrições e Habilidades (paridade PoE2)

- **Objetivo:** aproximar equipamento, baú, descrição de item e habilidades do padrão de Path of Exile 2, mantendo identidade e ids próprios (sem reusar arte/nomes de PoE).
- **Origem:** direção do dono a partir de 4 referências — manequim, stash, tooltip de item e tela de gemas por arma.
- **Data:** 01 de julho de 2026
- **Relacionados:** [Roadmap de Polimento](./POLISH_ROADMAP.md) · [Visão do MVP](./MVP.md) · [Handoff](./HANDOFF.md)

> **Importante:** isto expande além de "polish visual". Há duas trilhas entrelaçadas: **(1) Paridade de sistemas** (modelo de equipamento/habilidades/itens em `src/game/`) e **(2) Apresentação** (ícones, molduras, tooltip, tela de baú). A apresentação rica depende do modelo rico — por isso os sistemas vêm um passo à frente.

---

## 1. Princípio central: equipamento comanda as habilidades

A grande decisão dos prints: **a arma equipada (e a classe) determina quais habilidades ficam disponíveis.** Equipar uma besta libera as skills de besta; trocar para espada troca o leque de opções. Isso amarra loot ↔ build ↔ como você luta — exatamente "ter as opções de acordo com a classe e equipamento".

```
Classe  ─┐
          ├─►  pool de habilidades disponíveis  ─►  slots de skill ativa  ─►  soquetes de suporte
Arma    ─┘        (filtrado por arma+classe+nível)
```

---

## 2. Equipamento — slots com paridade PoE2

Slots atuais (9): arma, secundária, cabeça, luvas, torso, amuleto, 2 anéis, botas.

**Adicionar para paridade:**
- **Cinto** (belt) — novo slot, afixos de vida/resistência/frasco.
- **Frascos** — 2 slots (vida, mana), com efeito ativo (poção) e afixos próprios.
- **Amuleto de amuleto/charm** (opcional, fase posterior).
- **Set de armas / troca (weapon swap):** dois conjuntos de arma+secundária alternáveis. No protótipo pode começar como **um segundo par de slots** (arma II / secundária II) e depois virar "troca de set" real.

Cada slot valida a base por `kind`/`weaponType` (já temos `slotAccepts` em `engine.ts`; estender para cinto/frasco/weaponType).

## 3. Baú (Stash) em grade

- Tela/painel de **baú separado** do inventário-do-corpo, em **grade** com células (como o print 2), com **abas** (ex.: Geral, Moedas, Únicos).
- Mover item entre baú e inventário (clique para transferir no protótipo; drag-and-drop depois).
- Baú e moedas são **compartilhados por liga** (já previsto no MVP §7.2). Inventário-do-corpo é do personagem.
- Modelo: hoje `state.inventory` é uma lista única. Passa a haver **`inventory` (corpo)** e **`stash` (baú, por abas)**; o equipado referencia uids do inventário do corpo.

## 4. Item — modelo e descrição ricos (como o print 3)

O tooltip de PoE2 tem muito mais que hoje. Estender o modelo e o layout:

**Novos campos de base/instância:**
- **Qualidade** (`quality`, 0–20%) — amplifica defesas/dano da base.
- **Defesas da base:** `armour`, `evasion`, `energyShield` (uma base pode ter mais de uma).
- **Requisitos:** `reqLevel`, `reqStr`, `reqDex`, `reqInt` (a base define; afixos não mudam requisito).

**Novos afixos (famílias) para cobrir o print:**
- % velocidade de movimento (botas), +mana máxima, % evasão/ES aumentada(o), **raridade de itens encontrados**, **limiar de atordoamento (stun threshold)**, +atributos (Força/Destreza/Inteligência), resistências (já temos fogo/frio/raio), etc.

**Layout do tooltip (espelhando o print):**
```
NOME DO ITEM              ← cor da raridade (nome gerado + base)
Base (ex.: Botas)
──────────────────────
Qualidade: +20%
Evasão: 183   Escudo de energia: 70   ← defesas presentes
Requer: Nível 75, 71 Des, 71 Int      ← em cinza; vermelho se não atende
──────────────────────
+12% resistência a raio               ← implícito (bloco separado)
──────────────────────
35% velocidade de movimento aumentada ← explícitos (prefixos/sufixos)
+62 mana máxima
+45% resistência a frio
...
CORROMPIDO                            ← rodapé, quando aplicável
"flavor"                              ← únicos
```

Isto é continuidade natural do que já existe em `ItemTooltip` (`src/ui/atoms.tsx`) — só cresce em campos e hierarquia.

## 5. Habilidades — sistema por arma/classe (o coração dos prints)

### 5.1 Estrutura
- **Tipos de arma:** `axe, mace, sword, dagger, spear, quarterstaff, bow, crossbow, flail, unarmed` (+ escolas de magia por tag: `elemental, occult, primal`). Cada base de arma ganha um `weaponType`.
- **Categorias de skill** = rail esquerdo do print 4 (por arma + escolas). Cada skill declara `requires: { weapon?: weaponType[]; class?: classId[]; level: number }`.
- **Tiers por nível:** skills liberam em faixas de nível (as linhas I, IV, VII… do print). Abaixo do nível/arma exigidos, aparecem **travadas/acinzentadas**.

### 5.2 Como o jogador usa
1. Equipa uma arma → o **pool de habilidades** disponíveis muda.
2. Escolhe **habilidades ativas** para slots de skill (limite por nível).
3. Em cada ativa, encaixa **suportes** compatíveis por tags (sistema que já existe).
4. Configura regras de comportamento (já existe) para o servidor priorizar as ativas.

### 5.3 Papel da classe
- A classe dá **proficiência inicial de arma**, tendência de atributos, origem da árvore e **ascendências** (fase posterior).
- No protótipo: manter a classe marcial e povoar skills de **corpo a corpo** (axe/mace/sword). Ranged (bow/crossbow) e magia entram como novos leques quando houver as classes.

### 5.4 Mudança no motor
- `engine.availableSkills(equipped, classId, level)` → filtra o catálogo por arma equipada + classe + nível.
- O DPS agregado passa a usar a **skill ativa selecionada** (hoje é fixa em `sk_strike`), coerente com a arma.

## 6. Impacto no código (mapa de mudanças)

| Área | Arquivo | Mudança |
|---|---|---|
| Tipos | `src/game/types.ts` | `weaponType`, defesas (evasion/energyShield), `quality`, requisitos; `SkillCategory`, `SkillRequirement`; slots `belt`/`flask`; abas de stash |
| Conteúdo | `src/game/content.ts` | armas com `weaponType`; novas famílias de afixo; catálogo de skills por arma com tiers; classe(s) com proficiência; cinto/frascos; itens do baú |
| Motor | `src/game/engine.ts` | `availableSkills`, requisitos atendidos, qualidade nas defesas, `slotAccepts` p/ cinto/frasco/weaponType, DPS pela skill ativa |
| Estado | `src/game/store.ts` | `stash` + abas, transferir corpo↔baú, skill ativa selecionada por slot |
| UI | `src/pages/*`, `src/ui/*` | tela de Baú em grade; tooltip rico; tela de Habilidades por categoria/arma com travas de tier; slots de cinto/frasco no manequim |

## 7. Sequência (encaixe no roadmap de polimento)

Ordem que entrega valor sem virar tudo de cabeça para baixo:

1. ✅ **S1 — Modelo de item rico. CONCLUÍDO (03/jul).** `ItemBase` ganhou `weaponType`, `defences` (armadura/evasão/ES), `requires` (nível/For/Des/Int); `ItemInstance` ganhou `quality`. No engine: `resolveItemMods` soma as defesas-base **amplificadas pela qualidade**, `buildContext` amplia o dano físico da arma pela qualidade, e `unmetRequirements(item, hero)` diz o que o herói não atende. Novas famílias de afixo: velocidade de movimento, +mana, +Destreza, +Inteligência, limiar de atordoamento. Bases migradas para `defences`+`requires` (peitoral, trajes de evasão/ES); armas ganharam `weaponType`+`requires`. **+3 testes.**
2. ✅ **S2 — Tooltip/descrição PoE2. CONCLUÍDO (03/jul).** `ItemTooltipBody` refeito na hierarquia do print: nome/base → **Qualidade** → **Defesas** (resolvidas com qualidade) → **Requisitos** (cinza; vermelho quando `hero` é passado e não atende) → implícito → afixos → flavor. A comparação equipado × candidato já existia (Fase B) e agora inclui Evasão/Esc. energia (M2).
3. ✅ **S3 — Habilidades por arma. CONCLUÍDO (03/jul).** `SkillDefinition.requires` (`weapon[]`/`level`); no engine `skillAvailability(skill, equipped, level)` e `availableSkills(...)` filtram o catálogo pela arma equipada. Skills receberam requisito de arma (corpo-a-corpo: axe/mace/sword/dagger; elementais: staff/wand; arco: bow/crossbow). A tela de Habilidades **trava** (🔒 + cinza) as skills cuja arma não está equipada e explica o motivo; trocar a arma libera o leque. **+2 testes.** Pendente (fase posterior): tiers por nível na UI, catálogo organizado por categoria (rail do print 4), e ignorar no motor skills do loadout que ficaram sem a arma.
4. **S4 — Slots novos + Baú:** cinto e frascos no manequim; tela de baú em grade com abas; transferir corpo↔baú.
5. **S5 — Ícones e molduras** (Fase A do roadmap) aplicados a tudo acima, encerrando os placeholders de letra.
6. **S6 — Weapon swap / troca de set** e ascendências (posterior).

> S1→S2→S3 é a espinha (dados → descrição → habilidades). S4/S5 podem intercalar. Arte final continua como trilha paralela.

## 8. Primeira fatia recomendada

**S1 + S2:** enriquecer o modelo de item (qualidade, defesas, requisitos, +afixos) e refazer o tooltip no padrão PoE2 com comparação equipado × candidato. É a base para todo o resto e já entrega uma descrição de item de "produto".

## 8.5 Adições vindas da pesquisa de gênero

Decisões trazidas de [ARPG_RESEARCH.md](./ARPG_RESEARCH.md) que afetam este design:

- **Crafting em dois trilhos.** Além do gamble já existente (orbes + corrupção Vaal), adicionar um **trilho determinístico** — uma **bancada/runas** que permite *mirar* um afixo específico (ao estilo Last Epoch / tempering da D4). Atende quem quer controle e quem quer arriscar. No modelo: runas soquetáveis com traço local determinístico + uma bancada que força um modificador escolhido consumindo materiais.
- **Afixo excepcional (só dropa).** Uma camada de topo aspiracional: uma versão ~1,5× mais forte de um afixo, que **não** pode ser craftada — só cai. Dá **caça a gear**, não só a moeda (corrige a crítica ao PoE2 de que a empolgação vem só de currency).
- **Facções: farmar × negociar.** Oferecer ao jogador dois caminhos (inspirados no Circle of Fortune × Merchant's Guild de Last Epoch): **Autossuficiente** (drops melhores + direcionamento, sem mercado) ou **Mercador** (acesso ao market). Não obriga trade — corrige a dor "trade obrigatório" do PoE2. Encaixa na estrutura de ligas do MVP; escolha por personagem/liga.
- **Loot filter + comparação como QoL central.** Filtro por base/raridade/afixo/tier e comparação equipado × candidato **desde cedo**, não como remendo (foi o pecado da D4).

Faseamento: o **trilho determinístico** e o **afixo excepcional** entram junto/depois de S1 (modelo de item rico); as **facções** são uma decisão de meta/liga que pode vir em paralelo; **loot filter + comparação** acompanham S2 (tooltip/descrição).

## 8.6 Mecânicas-assinatura de skill (novas, baseadas no gênero)

Além do combo/rotação (R1–R3), duas mecânicas dão identidade própria às habilidades:

- ✅ **SK1 — Maestria de skill. CONCLUÍDO (03/jul).** Cada skill ganha **XP ao ser levada numa dungeon/marco vencido** e sobe de maestria (1..`MAX_MASTERY` 10); cada nível concede **+4% de dano ÀQUELA skill** (`skillMasteryLevel`/`masteryDamageBonus`, entra no `simulateRotation` via `mastery`). Usar a skill a evolui — versão enxuta e pura da árvore de skill do Last Epoch. `skillXp` no store; toast ao subir; selo na tela de Habilidades.
- ✅ **SK2 — Selo elemental. CONCLUÍDO (03/jul).** Um suporte **selo** (`SupportDefinition.convertsTo`/`addsAilment`) **converte o tipo de dano** de uma skill e pode adicionar um ailment: o `prepareSkill` move todo o dano por tipo para o tipo do selo e troca o ailment efetivo. Ex.: **Selo de Brasa** faz o Golpe Rompedor (físico) virar **fogo com queimadura** — passa a ignorar armadura e a sofrer res. a fogo. Selos de Gelo/Tempestade/Pestilento (frio/raio/caos+veneno). Cria builds novas a partir de skills existentes reusando M1 (multi-tipo) e M3 (DoT). UI: a tela de Habilidades mostra o tipo convertido + "◈ selado". **+3 testes.**

## 9. Fora de escopo por ora (registrado)

- Grade de inventário com tamanho de item (1x1, 2x2…) estilo Tetris — começamos com lista/grade simples de células iguais.
- Troca de set de armas com barras separadas — começa como par extra de slots.
- Ascendências e classes ranged/magia completas — dependem do catálogo de skills por arma amadurecer.
