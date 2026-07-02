import type { ReactNode } from 'react'
import { classById, getBase } from '../game/content'
import { itemGlyph, resolveItemMods } from '../game/engine'
import type { ItemInstance, Power } from '../game/types'
import type { CharacterSummary } from '../game/session'
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

/* ---------- resistências (todas, não só fogo) ---------- */

/** Tom por risco: negativo = crítico, abaixo de 45% = baixo, senão adequado. */
function resTone(v: number): string {
  if (v < 0) return 'res--crit'
  if (v < 45) return 'res--warn'
  return 'res--ok'
}

export function ResistRow({ power }: { power: Power }) {
  const items: Array<[string, number, string]> = [
    ['Fogo', power.fireRes, 'res-fire'],
    ['Frio', power.coldRes, 'res-cold'],
    ['Raio', power.litRes, 'res-lit'],
    ['Caos', power.chaosRes, 'res-chaos'],
  ]
  return (
    <div className="resrow">
      {items.map(([k, v, c]) => (
        <div className={`res ${c} ${resTone(v)}`} key={k}>
          <span className="res__k">{k}</span>
          <span className="res__v">{v}%</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- retrato do herói (reutilizável) ---------- */

export function HeroPortrait({ hero }: { hero?: CharacterSummary | null }) {
  const cls = hero ? classById[hero.classId] : null
  return (
    <div>
      <div className={`portrait${cls ? ` portrait--${cls.accent}` : ''}`}>
        <div className="fig" />
        {cls ? <div className="portrait__glyph">{cls.glyph}</div> : null}
        <div className="frame-name">{hero?.name ?? '—'}</div>
      </div>
      <div className="charmeta mt10">
        <div className="charmeta__cls">{cls?.name ?? '—'}</div>
        <div className="tiny muted">Nível {hero?.level ?? 1}</div>
      </div>
    </div>
  )
}

/* ---------- detalhes de poder: DPS + vida + resistências + defesa ---------- */

export function PowerDetails({ power, knownDps }: { power: Power; knownDps: number | null }) {
  const [lo, hi] = estimateRange(power.dps)
  const chips: Array<[string, string]> = [
    ['Armadura', fmtInt(power.armour)],
    ['Bloqueio', `${power.block}%`],
    ['Crítico', `${power.critChance}% · x${(power.critMulti / 100).toFixed(2)}`],
    ['Vel. ataque', `${power.attackSpeed.toFixed(2)}/s`],
    ['Soquetes', `${power.supportCap}/hab.`],
  ]
  return (
    <div>
      <div className="hb-head">
        {knownDps != null ? (
          <PStat k="DPS (medido)" cls="dmg" v={fmtInt(knownDps)} sub="testado em dungeon" />
        ) : (
          <PStat k="DPS (estimado)" cls="dmg est" v={`≈ ${fmtInt(lo)}–${fmtInt(hi)}`} sub="teste numa dungeon p/ o real" />
        )}
        <PStat k="Vida efetiva" cls="def" v={fmtInt(power.ehp)} sub="sobrevivência" />
      </div>
      <div className="eyebrow mt10">
        Resistências <span className="tiny muted">· teto 75%</span>
      </div>
      <ResistRow power={power} />
      <div className="eyebrow mt10">Defesa & crítico</div>
      <div className="statchips">
        {chips.map(([k, v]) => (
          <div className="statchip" key={k}>
            <span className="sc-k">{k}</span>
            <span className="sc-v">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- quadro do herói: retrato + poder (usado no Portal) ---------- */

export function HeroBoard({
  power,
  knownDps,
  hero,
}: {
  power: Power
  knownDps: number | null
  hero?: CharacterSummary | null
}) {
  return (
    <div className="sheet">
      <HeroPortrait hero={hero} />
      <PowerDetails power={power} knownDps={knownDps} />
    </div>
  )
}

/* ---------- tooltip de item ---------- */

/** Conteúdo do tooltip de item (sem o contêiner), reutilizável no tooltip flutuante. */
export function ItemTooltipBody({ item }: { item: ItemInstance }) {
  const base = getBase(item.baseId)
  return (
    <>
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
            <span className="t">{a.kind === 'prefix' ? 'P' : 'S'}·T{a.tier}</span> {a.text}
          </div>
        ),
      )}
      {item.flavor ? <div className="it-uniq it-flavor">{item.flavor}</div> : null}
    </>
  )
}

export function ItemTooltip({ item }: { item: ItemInstance }) {
  return (
    <div className="itip">
      <ItemTooltipBody item={item} />
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
