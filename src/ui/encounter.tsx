/* =========================================================
   BuildsWar :: componentes de encontro (compartilhados)
   Preview de composição/bestiário e o minimapa animado do
   replay — reusados pela Masmorra e pela Campanha, para que
   ambas mostrem dificuldade, tipos de dano, mobs e o mapa.
   ========================================================= */

import { BESTIARY } from '../game/content'
import type { Density, Dungeon, DungeonReplay, ForceProfile, MarkerKind, MobilityDemand, MonsterRole, DamageType } from '../game/types'
import { rarClass } from './format'

export const TYPE_LABEL: Record<DamageType, string> = {
  phys: 'Físico', fire: 'Fogo', cold: 'Frio', lightning: 'Raio', chaos: 'Caos',
}
const DENSITY_LABEL: Record<Density, string> = {
  sparse: 'Esparso', medium: 'Densidade média', swarm: 'Enxame',
}
const FORCE_LABEL: Record<ForceProfile, string> = {
  'weak-horde': 'Horda fraca', mixed: 'Misto', 'few-strong': 'Poucos, porém fortes',
}
const MOBILITY_LABEL: Record<MobilityDemand, string> = {
  low: 'Mobilidade: baixa', medium: 'Mobilidade: média', high: 'Mobilidade: alta',
}
const ROLE_LABEL: Record<MonsterRole, string> = {
  swarmer: 'Enxame', bruiser: 'Brutamontes', ranged: 'Atirador',
  caster: 'Conjurador', support: 'Suporte', aerial: 'Aéreo',
}
const monsterById = Object.fromEntries(BESTIARY.map((m) => [m.id, m]))

/** Chips de composição + tipos de dano + bestiário de uma dungeon (preview). */
export function EncounterPreview({ dungeon }: { dungeon: Dungeon }) {
  const comp = dungeon.composition
  return (
    <div className="dcomp">
      <div className="dcomp__row">
        <span className="dchip">{dungeon.biome} · Nv {dungeon.lvl}</span>
        {dungeon.fireThreat ? <span className="dchip dchip--warn">Ígneo · res≥{dungeon.fireReq}%</span> : null}
      </div>
      {comp ? (
        <>
          <div className="dcomp__row">
            <span className="dchip">{DENSITY_LABEL[comp.density]}</span>
            <span className="dchip">{FORCE_LABEL[comp.forceProfile]}</span>
            <span className="dchip">{MOBILITY_LABEL[comp.mobilityDemand]}</span>
            {comp.hasAerial ? <span className="dchip dchip--warn">Voadores</span> : null}
          </div>
          <div className="dcomp__row">
            <span className="dcomp__k">Dano:</span>
            {comp.damageMix.map((t) => (
              <span className={`dtype dtype--${t}`} key={t}>{TYPE_LABEL[t]}</span>
            ))}
          </div>
          <div className="dcomp__row">
            <span className="dcomp__k">Bestiário:</span>
            {comp.waves.map((w) => {
              const mon = monsterById[w.monsterId]
              if (!mon) return null
              return (
                <span
                  className={`dmob dmob--${mon.rank}`}
                  key={w.monsterId}
                  title={`${ROLE_LABEL[mon.role]}${mon.aerial ? ' · aéreo' : ''}`}
                >
                  {mon.name} ×{w.count}
                </span>
              )
            })}
          </div>
        </>
      ) : null}
      {dungeon.mods.length ? (
        <div className="dmods">
          {dungeon.mods.map((m) => (
            <span className="dmod" key={m}>{m}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ---------- minimapa animado do replay ---------- */

const MARKER_GLYPH: Record<MarkerKind, string> = {
  player: '◈', enemy: '•', elite: '✦', boss: '☠', loot: '◆',
}

/** Posição do herói interpolada ao longo da rota, conforme o progresso (0–1). */
function heroPosition(replay: DungeonReplay, t: number): { x: number; y: number } {
  const pts = replay.path
  if (pts.length === 1) return pts[0]
  const walked = Math.min(t, replay.endsAt) / replay.endsAt
  const span = (pts.length - 1) * Math.max(0, Math.min(1, walked))
  const i = Math.min(pts.length - 2, Math.floor(span))
  const f = span - i
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
  }
}

export function DungeonMinimap({ replay, progress }: { replay: DungeonReplay; progress: number }) {
  const t = progress / 100
  const hero = heroPosition(replay, t)
  const died = !replay.win && t >= replay.endsAt - 0.001

  const cleared = replay.markers.filter((m) => m.kind !== 'player' && t >= m.at).length
  const total = replay.markers.filter((m) => m.kind !== 'player').length
  const label = died
    ? 'Herói tombou durante a tentativa.'
    : `Progresso da tentativa: ${Math.round(progress)}%. ${cleared} de ${total} encontros alcançados.`

  return (
    <div className="minimap" role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="minimap__svg">
        <polyline className="minimap__trail" points={replay.path.map((p) => `${p.x},${p.y}`).join(' ')} />
        {replay.markers
          .filter((m) => m.kind !== 'player')
          .map((m) => {
            const reached = t >= m.at
            const cls =
              `mk mk--${m.kind}` +
              (reached ? ' is-on' : '') +
              (m.kind === 'loot' && m.rarity ? ` ${rarClass(m.rarity)}` : '')
            return (
              <text key={m.id} x={m.x} y={m.y} className={cls} dominantBaseline="central" textAnchor="middle">
                <title>{m.label}</title>
                {MARKER_GLYPH[m.kind]}
              </text>
            )
          })}
        <text
          x={hero.x}
          y={hero.y}
          className={`mk mk--player${died ? ' is-dead' : ''}`}
          dominantBaseline="central"
          textAnchor="middle"
        >
          {died ? '✝' : MARKER_GLYPH.player}
        </text>
      </svg>
      <div className="minimap__legend tiny muted">
        <span className="mk--player">◈ herói</span>
        <span className="mk--enemy">• inimigo</span>
        <span className="mk--elite">✦ elite</span>
        <span className="mk--boss">☠ chefe</span>
        <span className="mk--loot rar-rare">◆ loot raro</span>
      </div>
    </div>
  )
}

/** Seed estável do replay: dungeon + fingerprint (mesma build → mesmo replay). */
export function replaySeed(dungeonId: string, fingerprint: string): number {
  let h = 2166136261
  const s = `${dungeonId}#${fingerprint}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
