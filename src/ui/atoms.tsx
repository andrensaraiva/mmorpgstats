import type { ReactNode } from 'react'
import { getBase } from '../game/content'
import { itemGlyph, resolveItemMods } from '../game/engine'
import type { ItemInstance, Power } from '../game/types'
import { estimateRange } from '../game/engine'
import { RARITY_LABEL, fmtInt, rarClass } from './format'

/* ---------- estrutura ---------- */

export function Panel({
  title,
  right,
  children,
}: {
  title: ReactNode
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="panel">
      <div className="panel__head">
        <span className="ph-l">{title}</span>
        {right ? <span>{right}</span> : null}
      </div>
      <div className="panel__body">{children}</div>
    </section>
  )
}

export function PageHead({ title, crumb }: { title: string; crumb: string }) {
  return (
    <div className="page-head">
      <div className="crumb">BuildsWar / {crumb}</div>
      <h2>{title}</h2>
    </div>
  )
}

/* ---------- leitura de poder ---------- */

function PStat({ k, cls, v, sub }: { k: string; cls?: string; v: ReactNode; sub: string }) {
  return (
    <div className="pstat">
      <div className="pk">{k}</div>
      <div className={`pv ${cls ?? ''}`}>{v}</div>
      <div className="psub">{sub}</div>
    </div>
  )
}

/**
 * Números descobertos: o DPS real só aparece quando `knownDps` (medido para o
 * fingerprint atual) existe; antes disso mostramos uma estimativa em faixa.
 */
export function PowerBar({ power, knownDps }: { power: Power; knownDps: number | null }) {
  const fireWarn = power.fireRes < 45
  const [lo, hi] = estimateRange(power.dps)
  return (
    <div className="powerbar">
      {knownDps != null ? (
        <PStat k="DPS (medido)" cls="dmg" v={fmtInt(knownDps)} sub="testado em dungeon" />
      ) : (
        <PStat k="DPS (estimado)" cls="dmg est" v={`≈ ${fmtInt(lo)}–${fmtInt(hi)}`} sub="teste numa dungeon p/ o real" />
      )}
      <PStat k="Vida efetiva" cls="def" v={fmtInt(power.ehp)} sub="sobrevivência" />
      <PStat
        k="Res. Fogo"
        cls={fireWarn ? 'warn' : 'fire'}
        v={`${power.fireRes}%`}
        sub={fireWarn ? 'baixa — risco ígneo' : 'adequada'}
      />
      <PStat k="Soquetes" v={`${power.supportCap}/hab.`} sub="suportes por habilidade" />
    </div>
  )
}

/* ---------- tooltip de item ---------- */

export function ItemTooltip({ item }: { item: ItemInstance }) {
  const base = getBase(item.baseId)
  return (
    <div className="itip">
      <div className={`it-name ${rarClass(item.rarity)}`}>
        {item.name}
        {item.corrupted ? <span className="it-corrupt"> · CORROMPIDO</span> : null}
      </div>
      <div className="it-base">
        {base.name} · {RARITY_LABEL[item.rarity]} · nv item {item.itemLevel}
      </div>
      {base.implicitText || item.affixes.length ? <div className="it-sep" /> : null}
      {base.implicitText ? <div className="it-impl">{base.implicitText}</div> : null}
      {item.affixes.map((a, i) =>
        item.rarity === 'unique' ? (
          <div className="it-uniq" key={i}>
            {a.text}
          </div>
        ) : (
          <div className="it-aff" key={i}>
            <span className="t">{`P·T${a.tier}`.replace('P·', a.kind === 'prefix' ? 'P·' : 'S·')}</span> {a.text}
          </div>
        ),
      )}
      {item.flavor ? <div className="it-uniq it-flavor">{item.flavor}</div> : null}
    </div>
  )
}

/** Glifo (primeira letra da base) usado nos ícones de item. */
export function itemIconGlyph(item: ItemInstance): string {
  return itemGlyph(item)
}

/** Soma legível dos mods do item, para inspeção rápida. */
export function itemHasFire(item: ItemInstance): boolean {
  return (resolveItemMods(item).fireRes ?? 0) > 0
}
