/* =========================================================
   BuildsWar :: galeria de componentes (F3 — fundação)
   Rota interna de desenvolvimento (?dev=gallery) que renderiza
   os átomos em todos os estados. Serve de "chão de fábrica" do
   polimento e base para regressão visual. Não faz parte do
   fluxo de jogo — dispensa sessão/motor.
   ========================================================= */

import { useState } from 'react'
import { ORBS, makeStarter } from '../game/content'
import type { OrbId, Power, Rarity } from '../game/types'
import { ItemTooltipBody, PageHead, Panel, PowerBar, ResistRow } from '../ui/atoms'
import { ItemIcon, OrbIcon } from '../ui/icons'
import { CountUp } from '../ui/CountUp'
import { RARITY_LABEL } from '../ui/format'
import { ToastHost } from '../ui/Toasts'
import type { Toast } from '../game/store'

const RARITIES: Rarity[] = ['common', 'magic', 'rare', 'unique']

const DEMO_POWER: Power = {
  dps: 24500, ehp: 8900, life: 4200, armour: 1240, block: 20,
  attackSpeed: 1.35, critChance: 42, critMulti: 310,
  fireRes: 75, coldRes: 61, litRes: 48, chaosRes: -20,
  strength: 210, dexterity: 84, intelligence: 60, supportCap: 3,
  resourceMax: 100, resourceRegen: 10,
  firePen: 0, coldPen: 0, lightningPen: 0, chaosPen: 0,
}

const sample = makeStarter().inventory

export function GalleryPage() {
  const [countKey, setCountKey] = useState(0)
  const demoToasts: Toast[] = [
    { id: 1, tone: 'good', message: 'Item tornou-se mágico!' },
    { id: 2, tone: 'warn', message: 'Sem moedas suficientes desse orbe.' },
    { id: 3, tone: 'info', message: 'DPS real descoberto: 24.500' },
    { id: 4, tone: 'loot', message: 'Raro forjado: Couraça das Cinzas' },
  ]

  return (
    <div className="app">
      <main className="app-main gallery">
        <PageHead title="Galeria de Componentes" crumb="dev · regressão visual (F3)" />

        <Panel title="Botões">
          <div className="gal-row">
            <button className="btn">Padrão</button>
            <button className="btn btn--sm">Pequeno</button>
            <button className="btn btn--lg">Grande</button>
            <button className="btn btn--blood">Perigo</button>
            <button className="btn" disabled>
              Desabilitado
            </button>
            <button className="link-btn">link</button>
          </div>
        </Panel>

        <Panel title="Chips de filtro (Fase D)">
          <div className="gal-row">
            <button className="fchip">Armas</button>
            <button className="fchip is-on">Ativa</button>
            {RARITIES.map((r) => (
              <button key={r} className={`fchip fchip--${r} is-on`}>
                {RARITY_LABEL[r]}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="PowerBar (estimado × medido)">
          <div className="eyebrow mb6">Estimado (sem DPS medido)</div>
          <PowerBar power={DEMO_POWER} knownDps={null} />
          <div className="eyebrow mt10 mb6">Medido (revelado)</div>
          <PowerBar power={DEMO_POWER} knownDps={DEMO_POWER.dps} />
          <div className="eyebrow mt10 mb6">Resistências</div>
          <ResistRow power={DEMO_POWER} />
        </Panel>

        <Panel title="Ícones de item por raridade">
          <div className="gal-row">
            {sample.slice(0, 6).map((it) => (
              <div key={it.uid} className={`ic ${`rar-${it.rarity}`}`} title={it.name}>
                <ItemIcon baseId={it.baseId} />
                {it.corrupted ? <span className="corrupt-seal" /> : null}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Orbes de crafting">
          <div className="gal-row">
            {ORBS.map((orb) => (
              <div key={orb.id} className="gal-orb" title={orb.description}>
                <OrbIcon id={orb.id as OrbId} />
                <span className="tiny">{orb.short}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Tooltip de item (conteúdo)">
          <div className="gal-tips">
            {sample.slice(0, 3).map((it) => (
              <div className="itip" key={it.uid} style={{ position: 'static', display: 'block' }}>
                <ItemTooltipBody item={it} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Momento “descoberto” (count-up)">
          <div className="discovery" key={countKey}>
            <span className="discovery__tag">◈ DPS real descoberto ◈</span>
            <CountUp to={DEMO_POWER.dps} className="discovery__val" />
            <span className="discovery__sub">medido em combate</span>
          </div>
          <button className="btn btn--sm mt8" onClick={() => setCountKey((k) => k + 1)}>
            Repetir animação
          </button>
        </Panel>

        <Panel title="Toasts (todos os tons)">
          <div className="tiny muted">Renderizados fixos no canto inferior direito →</div>
        </Panel>
      </main>

      <ToastHost toasts={demoToasts} onDismiss={() => {}} />
    </div>
  )
}
