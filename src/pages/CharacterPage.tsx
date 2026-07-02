import {
  ACHIEVEMENTS,
  ATTEMPT_HISTORY,
  LIFETIME,
  LOADOUTS,
  META,
  PROGRESSION,
  RECORDS,
  SEASON,
  SKILLS,
  SUPPORTS,
  TREE,
} from '../game/content'
import type { CharacterSummary } from '../game/session'
import type { Game } from '../game/store'
import type { EquipSlot } from '../game/types'
import { fmtInt, rarClass } from '../ui/format'
import { HeroPortrait, PageHead, Panel, PowerDetails } from '../ui/atoms'

const SLOT_LABEL: Record<string, string> = {
  weapon: 'Arma',
  offhand: 'Secundária',
  head: 'Cabeça',
  chest: 'Torso',
  gloves: 'Luvas',
  boots: 'Botas',
  amulet: 'Amuleto',
  ring1: 'Anel I',
  ring2: 'Anel II',
}

export function CharacterPage({ game, hero }: { game: Game; hero?: CharacterSummary | null }) {
  const p = game.power
  const st = game.state

  // ---- build ATUAL (dados reais do estado) ----
  const pointsUsed = Math.max(0, st.allocated.size - 1)
  const mainSkill = SKILLS.find((s) => s.id === game.mainSkillId)
  const mainSockets = st.sockets[game.mainSkillId] ?? []
  const supportName = (id: string) => SUPPORTS.find((s) => s.id === id)?.name ?? id
  const equippedPairs = (Object.entries(st.equipped) as Array<[EquipSlot, string | undefined]>)
    .filter((e): e is [EquipSlot, string] => Boolean(e[1]))
    .map(([slot, uid]) => ({ slot, item: st.inventory.find((i) => i.uid === uid) }))
    .filter((e) => e.item)

  const winRate = Math.round((LIFETIME.wins / LIFETIME.attempts) * 100)

  return (
    <>
      <PageHead title="Personagem" crumb="Dashboard do herói" />

      {/* identidade + progressão */}
      <Panel title={`${hero?.name ?? 'Herói'} — visão geral`} right={<span className="tiny muted">{META.league}</span>}>
        <div className="sheet">
          <HeroPortrait hero={hero} />
          <div className="dash-prog">
            <div className="eyebrow">Progressão</div>
            <div className="prog-line">
              <div className="prog-line__top">
                <span>Nível {hero?.level ?? 1}</span>
                <span>{PROGRESSION.xpLabel}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill progress-fill--xp" style={{ width: `${PROGRESSION.xpPct}%` }} />
              </div>
            </div>
            <div className="dash-stats mt10">
              <div className="dashcell">
                <div className="dc-v">
                  {PROGRESSION.campaignAct}/{PROGRESSION.campaignActs}
                </div>
                <div className="dc-k">Campanha</div>
                <div className="dc-sub">{PROGRESSION.campaignPct}% concluída</div>
              </div>
              <div className="dashcell">
                <div className="dc-v">{PROGRESSION.depthRecord}</div>
                <div className="dc-k">Profundidade</div>
                <div className="dc-sub">recorde no mapa</div>
              </div>
              <div className="dashcell">
                <div className="dc-v">{PROGRESSION.playtime}</div>
                <div className="dc-k">Tempo de jogo</div>
                <div className="dc-sub">nesta liga</div>
              </div>
              <div className="dashcell">
                <div className="dc-v">{PROGRESSION.daysInLeague}</div>
                <div className="dc-k">Dias na liga</div>
                <div className="dc-sub">de {SEASON.totalDays} da temporada</div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* poder + build atual */}
      <div className="grid-2">
        <Panel title="Poder & resistências atuais">
          <PowerDetails power={p} knownDps={game.knownDps} />
          {p.fireRes < 45 || p.coldRes < 45 || p.litRes < 45 ? (
            <div className="tiny warn-text mt10">
              Alguma resistência abaixo de 45% — dungeons daquele elemento podem te matar independentemente do dano.
            </div>
          ) : (
            <div className="tiny good-text mt10">Resistências adequadas para os elementos atuais.</div>
          )}
        </Panel>

        <Panel
          title="Build atual"
          right={<span className="tiny muted">{pointsUsed}/{TREE.maxPoints} pontos passivos</span>}
        >
          <div className="eyebrow">Habilidade principal</div>
          <div className="buildsum__main">
            <span className="bs-skill">{mainSkill?.name ?? '—'}</span>
            <span className="tiny muted">
              {mainSockets.length}/{p.supportCap} soquetes
            </span>
          </div>
          <div className="chips mb8">
            {mainSockets.length ? (
              mainSockets.map((id) => (
                <span className="chip" key={id}>
                  {supportName(id)}
                </span>
              ))
            ) : (
              <span className="tiny muted">sem suportes encaixados</span>
            )}
          </div>
          <div className="eyebrow">Equipado ({equippedPairs.length} itens)</div>
          <div className="eqlist">
            {equippedPairs.map(({ slot, item }) => (
              <div className="eq-slot" key={slot}>
                <span className="eq-slot__k">{SLOT_LABEL[slot] ?? slot}</span>
                <span className={`eq-slot__v ${item ? rarClass(item.rarity) : ''}`}>{item?.name ?? '—'}</span>
              </div>
            ))}
          </div>
          <div className="tiny muted mt8">
            Salvar e alternar loadouts (limpeza, chefe, sobrevivência) entra no MVP — abaixo, um preview.
          </div>
        </Panel>
      </div>

      {/* loadouts / builds */}
      <Panel title="Loadouts salvos" right={<span className="tiny muted">builds da heroína</span>}>
        <div className="loadouts">
          {LOADOUTS.map((l) => (
            <div className={`loadout${l.active ? ' is-active' : ''}`} key={l.id}>
              <div className="loadout__name">
                {l.name}
                {l.active ? <span className="tag-active">ATUAL</span> : null}
              </div>
              <div className="loadout__focus">{l.focus}</div>
              <div className="loadout__meta">
                <span className="loadout__wpn">{l.weapon}</span>
                <span className="loadout__dps">
                  {l.measuredDps != null ? `${fmtInt(l.measuredDps)} DPS` : 'não testado'}
                </span>
              </div>
              <div className="loadout__foot">
                <span className="tiny muted">atualizado {l.updated}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* histórico de tentativas */}
      <Panel title="Histórico de tentativas" right={<span className="tiny muted">demonstrativo</span>}>
        <div className="attempt-log">
          {ATTEMPT_HISTORY.map((a) => (
            <div className="alog" key={a.id}>
              <span className={`alog__res ${a.result === 'win' ? 'win' : 'loss'}`}>
                {a.result === 'win' ? 'VITÓRIA' : 'DERROTA'}
              </span>
              <span className="alog__dgn">
                <b>{a.dungeon}</b> <span className="tiny muted">· {a.detail}</span>
              </span>
              <span className="alog__when">{a.when}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* recordes + conquistas */}
      <div className="grid-2">
        <Panel title="Recordes" right={<span className="tiny muted">verificáveis</span>}>
          <div className="reclist">
            {RECORDS.map((r) => (
              <div className="recrow" key={r.label}>
                <span className="rec-k">{r.label}</span>
                <span className="rec-right">
                  <span className="rec-v">{r.value}</span>
                  <span className="rec-rank">{r.rank}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Conquistas">
          <div className="achlist">
            {ACHIEVEMENTS.map((a) => (
              <div className={`ach${a.done ? '' : ' is-todo'}`} key={a.id}>
                <span className="ach__mark">{a.done ? '✦' : '·'}</span>
                <div>
                  <div className="ach__name">{a.name}</div>
                  <div className="ach__desc">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* estatísticas na liga */}
      <Panel title="Estatísticas na liga" right={<span className="tiny muted">demonstrativo</span>}>
        <div className="dash-stats stats-6">
          <div className="dashcell">
            <div className="dc-v">{fmtInt(LIFETIME.attempts)}</div>
            <div className="dc-k">Tentativas</div>
          </div>
          <div className="dashcell">
            <div className="dc-v">{winRate}%</div>
            <div className="dc-k">Vitórias</div>
            <div className="dc-sub">{LIFETIME.wins} vitórias</div>
          </div>
          <div className="dashcell">
            <div className="dc-v">{LIFETIME.deaths}</div>
            <div className="dc-k">Mortes</div>
          </div>
          <div className="dashcell">
            <div className="dc-v">{LIFETIME.bossKills}</div>
            <div className="dc-k">Chefes</div>
          </div>
          <div className="dashcell">
            <div className="dc-v">{fmtInt(LIFETIME.itemsFound)}</div>
            <div className="dc-k">Itens achados</div>
          </div>
          <div className="dashcell">
            <div className="dc-v dc-v--sm">{LIFETIME.favoriteSkill}</div>
            <div className="dc-k">Skill favorita</div>
          </div>
        </div>
      </Panel>
    </>
  )
}
