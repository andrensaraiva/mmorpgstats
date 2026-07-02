# Manifesto de Tema — BuildsWar

- **Criado:** 02 de julho de 2026 · **Fase:** F1 (fundação do POLISH_ROADMAP)
- **Fonte da verdade:** o bloco `:root` em [`src/styles/global.css`](../src/styles/global.css). Este documento é o **mapa semântico** (chave → uso), não uma segunda cópia dos valores.

> Regra: componentes novos e refeitos consomem **tokens semânticos**, não valores mágicos. Arte final e ajustes de marca mudam só o `:root`.

## 1. Cor

### Superfícies
| Token | Uso |
|---|---|
| `--bg` / `--bg2` | fundo da página / faixas |
| `--panel` / `--panel2` / `--panel3` | fundos de painel (do mais escuro ao mais claro) |
| `--line` / `--line2` | bordas sutis / bordas de destaque |

### Texto
| Token | Uso | Contraste |
|---|---|---|
| `--text` | corpo principal | AA+ |
| `--text-dim` | secundário | AA |
| `--text-mut` | terciário/labels (clareado p/ AA na Fase E) | ~5:1 |
| `--parch` | destaque quente (títulos claros) | AA+ |

### Marca / acento
`--gold*` (identidade, ações primárias), `--blood*` (perigo/erro/Vaal), `--teal*` (defesa/positivo), `--spectral*` (implícitos/frio). Sufixos `-hi`/`-lo`/`-deep` = variações de brilho.

### Raridade (loot)
`--r-common` `--r-magic` `--r-rare` `--r-unique`. Usados em molduras, nomes de item, chips de filtro e no realce de comparação. Todos passam AA sobre os painéis (ver §5).

### Recursos
`--hp` `--mp` `--reserve` — barras de vida/mana/reserva.

## 2. Espaçamento
Escala em múltiplos de 4: `--sp-1: 4` · `--sp-2: 8` · `--sp-3: 12` · `--sp-4: 16` · `--sp-5: 24` · `--sp-6: 32`. Padding/margin/gap saem daqui.

## 3. Raios
`--radius-sm: 2` · `--radius: 3` (padrão) · `--radius-lg: 6` · `--radius-round: 999` (pílulas/círculos).

## 4. Elevação (sombra)
`--shadow-1` (cards/hover) · `--shadow-2` (popovers/toasts) · `--shadow-3` (modais/onboarding).

## 5. Movimento
Durações: `--dur-fast: .12s` · `--dur: .2s` · `--dur-slow: .85s`. Curvas: `--ease-out` (padrão), `--ease-snap` (encaixe/equip). **Todo movimento é neutralizado por `@media (prefers-reduced-motion: reduce)`** (reset global) — os tokens só afetam quem tem movimento habilitado.

## 6. Tipografia
`--font-display` = 'Cinzel' (títulos, números de poder, eyebrows). `--font-body` = 'EB Garamond' (corpo). Nostalgia na moldura, legibilidade no fluxo.

## 7. Acessibilidade
`--touch-min: 44px` (alvo mínimo de toque em mobile — Fase E) · `--focus-ring: 2px solid var(--gold-hi)` (anel de foco visível, aplicado via `:focus-visible`).

## 8. Estado de adoção
- **Consomem tokens:** `.toast` (refeito na F1). Novos componentes devem seguir.
- **Legado:** a maior parte do `global.css` ainda usa valores diretos — a migração é incremental (não retroativa em massa, para não arriscar regressão visual). Ao **tocar** num bloco, troque os valores por tokens.
- **Verificação de contraste:** rode o cálculo WCAG dos pares raridade/texto × superfícies antes de mudar cores (feito na Fase E; `--text-mut` e `--blood-hi` foram clareados para passar AA).
