/* =========================================================
   BuildsWar :: Boneco de Treino (R2)
   Roda o simulador de rotação contra um alvo modificável e
   revela o DPS real + diagnóstico. Bater no boneco registra o
   DPS canônico (rotação vs alvo neutro) como "medido" — a mesma
   mecânica de números descobertos da dungeon, grátis e na hora.
   A dungeon continua sendo o teste com sobrevivência + loot.
   Ver docs/COMBAT_ROTATION_AND_DUMMY.md §5.3.
   ========================================================= */

import { useMemo, useState } from 'react'
import { BASIC_ATTACK, SKILLS } from '../game/content'
import { MEASURE_WINDOW, simulateRotation } from '../game/engine'
import { selectEquippedItems, selectLoadoutSlots, type Game } from '../game/store'
import type { RotationBottleneck } from '../game/types'
import { Panel, PowerBar } from './atoms'
import { fmtInt } from './format'

const skillName = (id: string) =>
  id === BASIC_ATTACK.id ? BASIC_ATTACK.name : SKILLS.find((s) => s.id === id)?.name ?? id

const PRESETS: Array<{ id: string; label: string; armour: number; hint: string }> = [
  { id: 'none', label: 'Sem defesa', armour: 0, hint: 'dano bruto' },
  { id: 'elite', label: 'Elite', armour: 1500, hint: 'armadura média' },
  { id: 'boss', label: 'Chefe', armour: 6000, hint: 'muito blindado' },
]

const BOTTLENECK_HINT: Record<RotationBottleneck, string> = {
  recurso: 'Recurso estourando: uma skill mais barata na rotação ou +regeneração ajuda.',
  combo: 'Exposição caindo: priorize a Onda (setup) para manter o combo ativo.',
  cooldown: 'Muito tempo no ataque básico: falta uma ativa spammable entre os cooldowns.',
  nenhum: 'Rotação fluida — sem gargalo dominante.',
}

function Meter({ label, pct, tone }: { label: string; pct: number; tone: 'teal' | 'gold' }) {
  const p = Math.round(pct * 100)
  return (
    <div className="meter">
      <div className="meter__top">
        <span className="tiny muted">{label}</span>
        <span className="tiny">{p}%</span>
      </div>
      <div
        className="meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`meter__fill mf--${tone}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}

export function TrainingDummy({ game }: { game: Game }) {
  const [armour, setArmour] = useState(0)
  const equipped = useMemo(() => selectEquippedItems(game.state), [game.state])
  const slots = useMemo(() => selectLoadoutSlots(game.state), [game.state])

  const result = useMemo(
    () =>
      simulateRotation({
        equipped,
        allocated: game.state.allocated,
        loadout: slots,
        target: { armour },
        seconds: MEASURE_WINDOW,
      }),
    [equipped, game.state.allocated, slots, armour],
  )

  const measuredHere = game.knownDps != null

  return (
    <Panel title="Boneco de Treino">
      <p className="tiny muted mb8">
        Bata no boneco para medir o <b>DPS real</b> da sua rotação — grátis e na hora. A dungeon fica para o teste com
        sobrevivência e loot.
      </p>

      <PowerBar power={game.power} knownDps={game.knownDps} />

      <div className="dummy-actions">
        <button
          className="btn btn--blood btn--lg"
          onClick={game.measureDummy}
          disabled={measuredHere}
          aria-live="polite"
        >
          {measuredHere ? 'DPS real registrado ✓' : '⚔ Bater no boneco — registrar DPS real'}
        </button>
        <span className="tiny muted">
          Registra o DPS <b>sem defesa</b> do alvo (número comparável). Trocar item, craftar, mexer na árvore ou
          reordenar a rotação esconde o número de novo.
        </span>
      </div>

      <div className="eyebrow mt10 mb6">Alvo do boneco</div>
      <div className="dummy-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={`dummy-preset${armour === p.armour ? ' on' : ''}`}
            onClick={() => setArmour(p.armour)}
            aria-pressed={armour === p.armour}
          >
            <span className="dp-lbl">{p.label}</span>
            <span className="dp-hint tiny muted">{p.hint}</span>
          </button>
        ))}
      </div>
      <label className="dummy-slider">
        <span className="tiny muted">
          Armadura do alvo: <b className="teal">{fmtInt(armour)}</b>
        </span>
        <input
          type="range"
          min={0}
          max={8000}
          step={250}
          value={armour}
          onChange={(e) => setArmour(Number(e.target.value))}
          aria-label="Armadura do alvo"
        />
      </label>
      <div className="tiny muted">
        Resistências por tipo entram com o motor multi-tipo (M1). Hoje o dano é físico e a armadura manda — golpe grande
        fura, golpe pequeno é mitigado.
      </div>

      <div className="dummy-readout">
        <span className="dr-k">DPS contra este alvo</span>
        <span className="dr-v teal">{fmtInt(result.dps)}</span>
        <span className="dr-note tiny muted">janela de {MEASURE_WINDOW}s simulados</span>
      </div>

      <div className="eyebrow mt10 mb6">Diagnóstico da rotação</div>
      <div className="diag">
        <Meter label="Uptime do combo (Exposição ativa)" pct={result.comboUptime} tone="teal" />
        <Meter label="Aproveitamento de recurso" pct={result.resourceUptime} tone="gold" />
      </div>
      <div className={`diag-bottleneck bn--${result.bottleneck}`}>
        <span className="bn-k">Gargalo</span>
        <span className="bn-v">{result.bottleneck}</span>
        <span className="bn-hint tiny muted">{BOTTLENECK_HINT[result.bottleneck]}</span>
      </div>

      <div className="eyebrow mt10 mb6">Dano por habilidade</div>
      <div className="per-skill">
        {result.perSkill.map((s) => {
          const pct = Math.round(s.share * 100)
          return (
            <div className="ps-row" key={s.skillId}>
              <span className="ps-name">{skillName(s.skillId)}</span>
              <span className="ps-bar">
                <span className="ps-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="ps-val tiny muted">
                {pct}% · {s.casts}×
              </span>
            </div>
          )
        })}
      </div>
      <div className="tiny muted mt6">Monte a rotação logo abaixo — o número aqui reage na hora.</div>
    </Panel>
  )
}
