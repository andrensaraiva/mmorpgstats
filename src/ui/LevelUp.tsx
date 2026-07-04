/* =========================================================
   BuildsWar :: painel de subida de nível (LVLUP)
   Ao upar, mostra o que o jogador GANHOU (pontos de talento,
   habilidades novas) e para ONDE IR — o guia da progressão.
   Torna a progressão legível, não só mecânica.
   ========================================================= */

import { SKILLS } from '../game/content'
import { TALENT_PER_MARK } from '../game/engine'
import type { Game } from '../game/store'
import type { ViewId } from '../game/types'

export function LevelUpModal({ game }: { game: Game }) {
  const lu = game.state.levelUp
  if (!lu) return null

  const gainedLevels = lu.to - lu.from
  // Pontos de talento ganhos: 1 por nível subido (o bônus de marco é à parte).
  const talentGained = gainedLevels

  // Habilidades que passaram a estar disponíveis por NÍVEL nesta subida.
  const unlockedSkills = SKILLS.filter((s) => {
    const req = s.requires?.level
    return req != null && req > lu.from && req <= lu.to
  })

  const go = (page: ViewId) => {
    game.dismissLevelUp()
    game.navigate(page)
  }

  return (
    <div className="lvlup-backdrop" onClick={game.dismissLevelUp}>
      <div
        className="lvlup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lvlup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lvlup__glyph" aria-hidden="true">
          ⬆
        </div>
        <div className="eyebrow">Subiu de nível</div>
        <h3 className="lvlup__title" id="lvlup-title">
          Nível {lu.to}
          {gainedLevels > 1 ? <span className="tiny muted"> (+{gainedLevels})</span> : null}
        </h3>

        <ul className="lvlup__gains">
          <li>
            <b className="teal">
              +{talentGained} ponto{talentGained > 1 ? 's' : ''} de talento
            </b>{' '}
            para gastar na Árvore
            {game.talent.available > 0 ? (
              <span className="tiny muted"> · {game.talent.available} disponíveis no total</span>
            ) : null}
          </li>
          {game.state.completedNodes.length > 0 ? (
            <li className="tiny muted">
              (marcos de campanha dão +{TALENT_PER_MARK} pontos extras cada)
            </li>
          ) : null}
          {unlockedSkills.length ? (
            <li>
              <b className="gold-text">Novas habilidades liberadas:</b>{' '}
              {unlockedSkills.map((s) => s.name).join(', ')} — equipe uma arma compatível para usá-las.
            </li>
          ) : null}
        </ul>

        <div className="lvlup__actions">
          <button className="btn btn--sm" onClick={() => go('arvore')}>
            Ir para a Árvore
          </button>
          <button className="btn btn--sm" onClick={() => go('habilidades')}>
            Ver Habilidades
          </button>
          <button className="btn btn--blood btn--sm" onClick={game.dismissLevelUp}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
