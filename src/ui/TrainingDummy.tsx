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
import { selectEquippedItems, selectLoadoutSlots, selectMastery, type Game } from '../game/store'
import type { DamageType, RotationBottleneck, TargetProfile } from '../game/types'
import { Panel, PowerBar } from './atoms'
import { fmtInt } from './format'

const skillName = (id: string) =>
  id === 'dot'
    ? 'DoT (ao longo do tempo)'
    : id === BASIC_ATTACK.id
      ? BASIC_ATTACK.name
      : SKILLS.find((s) => s.id === id)?.name ?? id

const TYPE_LABEL: Record<DamageType, string> = {
  phys: 'Físico', fire: 'Fogo', cold: 'Frio', lightning: 'Raio', chaos: 'Caos',
}

/** Presets do alvo: armadura + resistências elementais (M1). */
const PRESETS: Array<{ id: string; label: string; target: TargetProfile; hint: string }> = [
  { id: 'none', label: 'Sem defesa', target: { armour: 0 }, hint: 'dano bruto' },
  { id: 'elite', label: 'Elite', target: { armour: 1500, fireRes: 30, coldRes: 30, litRes: 30, chaosRes: 0 }, hint: 'armadura + res. média' },
  { id: 'boss', label: 'Chefe', target: { armour: 6000, fireRes: 60, coldRes: 60, litRes: 60, chaosRes: 30 }, hint: 'muito resistente' },
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

const ELEM_SLIDERS: Array<{ key: 'fireRes' | 'coldRes' | 'litRes' | 'chaosRes'; label: string }> = [
  { key: 'fireRes', label: 'Res. Fogo' },
  { key: 'coldRes', label: 'Res. Frio' },
  { key: 'litRes', label: 'Res. Raio' },
  { key: 'chaosRes', label: 'Res. Caos' },
]

export function TrainingDummy({ game }: { game: Game }) {
  const [target, setTarget] = useState<TargetProfile>({ armour: 0 })
  const equipped = useMemo(() => selectEquippedItems(game.state), [game.state])
  const slots = useMemo(() => selectLoadoutSlots(game.state), [game.state])
  const mastery = useMemo(() => selectMastery(game.state), [game.state])

  const result = useMemo(
    () =>
      simulateRotation({
        equipped,
        allocated: game.state.allocated,
        loadout: slots,
        target,
        seconds: MEASURE_WINDOW,
        mastery,
      }),
    [equipped, game.state.allocated, slots, target, mastery],
  )

  const byType = Object.entries(result.damageByType)
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)) as Array<[DamageType, number]>
  const presetId = PRESETS.find((p) => JSON.stringify(p.target) === JSON.stringify(target))?.id
  const setArmour = (armour: number) => setTarget((t) => ({ ...t, armour }))
  const setRes = (key: string, v: number) => setTarget((t) => ({ ...t, [key]: v }))

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
            className={`dummy-preset${presetId === p.id ? ' on' : ''}`}
            onClick={() => setTarget({ ...p.target })}
            aria-pressed={presetId === p.id}
          >
            <span className="dp-lbl">{p.label}</span>
            <span className="dp-hint tiny muted">{p.hint}</span>
          </button>
        ))}
      </div>
      <label className="dummy-slider">
        <span className="tiny muted">
          Armadura do alvo: <b className="teal">{fmtInt(target.armour)}</b>
        </span>
        <input
          type="range"
          min={0}
          max={8000}
          step={250}
          value={target.armour}
          onChange={(e) => setArmour(Number(e.target.value))}
          aria-label="Armadura do alvo"
        />
      </label>
      <div className="dummy-res-sliders">
        {ELEM_SLIDERS.map((s) => (
          <label className="dummy-slider dummy-slider--sm" key={s.key}>
            <span className="tiny muted">
              {s.label}: <b className="teal">{target[s.key] ?? 0}%</b>
            </span>
            <input
              type="range"
              min={-30}
              max={80}
              step={5}
              value={target[s.key] ?? 0}
              onChange={(e) => setRes(s.key, Number(e.target.value))}
              aria-label={`${s.label} do alvo`}
            />
          </label>
        ))}
      </div>
      <div className="tiny muted">
        Físico é mitigado pela <b>armadura</b> (golpe grande fura, pequeno é mitigado); os tipos elementais/caos pela{' '}
        <b>resistência</b> do alvo, reduzida pela sua <b>penetração</b>.
      </div>

      <div className="dummy-readout">
        <span className="dr-k">DPS contra este alvo</span>
        <span className="dr-v teal">{fmtInt(result.dps)}</span>
        <span className="dr-note tiny muted">janela de {MEASURE_WINDOW}s simulados</span>
      </div>

      {byType.length > 0 ? (
        <>
          <div className="eyebrow mt10 mb6">Dano por tipo</div>
          <div className="dmg-types">
            {byType.map(([t, v]) => {
              const share = result.dps > 0 ? Math.round((v / result.dps) * 100) : 0
              return (
                <div className={`dmg-type dt--${t}`} key={t}>
                  <span className="dt-k">{TYPE_LABEL[t]}</span>
                  <span className="dt-bar">
                    <span className="dt-fill" style={{ width: `${share}%` }} />
                  </span>
                  <span className="dt-v tiny muted">{share}%</span>
                </div>
              )
            })}
          </div>
        </>
      ) : null}

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
                {pct}% · {s.skillId === 'dot' ? 'contínuo' : `${s.casts}×`}
              </span>
            </div>
          )
        })}
      </div>
      <div className="tiny muted mt6">Monte a rotação logo abaixo — o número aqui reage na hora.</div>
    </Panel>
  )
}
