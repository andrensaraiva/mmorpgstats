import type { ReactNode } from 'react'
import { classById, getBase } from '../game/content'
import { itemGlyph, resolveItemMods, unmetRequirements } from '../game/engine'
import type { HeroReqStats } from '../game/engine'
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

function PStat({
  k,
  cls,
  v,
  sub,
  reveal,
}: {
  k: string
  cls?: string
  v: ReactNode
  sub: string
  /** Marca a troca estimativa→medido para animar a entrada do número real. */
  reveal?: boolean
}) {
  return (
    <div className={`pstat${reveal ? ' pstat--reveal' : ''}`}>
      <div className="pk">{k}</div>
      <div className={`pv ${cls ?? ''}`}>{v}</div>
      <div className="psub">{sub}</div>
    </div>
  )
}

/**
 * Números descobertos: o DPS real só aparece quando `knownDps` (medido para o
 * fingerprint atual) existe; antes disso mostramos uma estimativa em faixa.
 * A troca estimativa→medido entra com uma transição suave (`.pstat--reveal`),
 * neutralizada por prefers-reduced-motion no CSS global.
 */
export function PowerBar({ power, knownDps }: { power: Power; knownDps: number | null }) {
  const fireWarn = power.fireRes < 45
  const [lo, hi] = estimateRange(power.dps)
  return (
    <div className="powerbar">
      {knownDps != null ? (
        <PStat
          key="dps-measured"
          k="DPS (medido)"
          cls="dmg"
          v={fmtInt(knownDps)}
          sub="medido no boneco/dungeon"
          reveal
        />
      ) : (
        <PStat
          key="dps-estimated"
          k="DPS (estimado)"
          cls="dmg est"
          v={`≈ ${fmtInt(lo)}–${fmtInt(hi)}`}
          sub="bata no boneco p/ o real"
        />
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
    ['Evasão', fmtInt(power.evasion)],
    ['Esc. energia', fmtInt(power.energyShield)],
    ['Bloqueio', `${power.block}%`],
    ['Crítico', `${power.critChance}% · x${(power.critMulti / 100).toFixed(2)}`],
    ['Vel. ataque', `${power.attackSpeed.toFixed(2)}/s`],
    ['Soquetes', `${power.supportCap}/hab.`],
  ]
  return (
    <div>
      <div className="hb-head">
        {knownDps != null ? (
          <PStat k="DPS (medido)" cls="dmg" v={fmtInt(knownDps)} sub="medido no boneco/dungeon" />
        ) : (
          <PStat k="DPS (estimado)" cls="dmg est" v={`≈ ${fmtInt(lo)}–${fmtInt(hi)}`} sub="bata no boneco p/ o real" />
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

/** Conteúdo do tooltip de item (sem o contêiner), reutilizável no tooltip flutuante.
 *  Padrão PoE2 (S2): nome/base, qualidade, defesas, requisitos (vermelho se o
 *  herói não atende), implícito, afixos, flavor. */
export function ItemTooltipBody({ item, hero }: { item: ItemInstance; hero?: HeroReqStats | null }) {
  const base = getBase(item.baseId)
  const mods = resolveItemMods(item)
  const req = base.requires
  const unmet = hero ? unmetRequirements(item, hero) : []

  // Defesas resolvidas (base×qualidade), só as presentes.
  const defs: Array<[string, number]> = []
  if (mods.armour) defs.push(['Armadura', mods.armour])
  if (mods.evasion) defs.push(['Evasão', mods.evasion])
  if (mods.energyShield) defs.push(['Esc. energia', mods.energyShield])

  return (
    <>
      <div className={`it-name ${rarClass(item.rarity)}`}>
        {item.name}
        {item.corrupted ? <span className="it-corrupt"> · CORROMPIDO</span> : null}
      </div>
      <div className="it-base">
        {base.name} · {RARITY_LABEL[item.rarity]} · nv item {item.itemLevel}
      </div>

      {item.quality || defs.length || req ? <div className="it-sep" /> : null}
      {item.quality ? <div className="it-quality">Qualidade: +{item.quality}%</div> : null}
      {defs.length ? (
        <div className="it-defs">
          {defs.map(([k, v]) => (
            <span className="it-def" key={k}>
              {k}: <b>{fmtInt(v)}</b>
            </span>
          ))}
        </div>
      ) : null}
      {req ? (
        <div className="it-req">
          Requer:{' '}
          {req.level ? <ReqPart label={`Nível ${req.level}`} bad={unmet.includes('level')} /> : null}
          {req.str ? <ReqPart label={`${req.str} For`} bad={unmet.includes('str')} /> : null}
          {req.dex ? <ReqPart label={`${req.dex} Des`} bad={unmet.includes('dex')} /> : null}
          {req.int ? <ReqPart label={`${req.int} Int`} bad={unmet.includes('int')} /> : null}
        </div>
      ) : null}

      {base.implicitText ? (
        <>
          <div className="it-sep" />
          <div className="it-impl">{base.implicitText}</div>
        </>
      ) : null}

      {item.affixes.length ? <div className="it-sep" /> : null}
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

/** Um requisito no tooltip — cinza se atendido, vermelho se não. */
function ReqPart({ label, bad }: { label: string; bad: boolean }) {
  return <span className={`it-req__part${bad ? ' is-bad' : ''}`}>{label}</span>
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
