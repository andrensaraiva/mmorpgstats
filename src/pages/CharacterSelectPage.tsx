import { useState } from 'react'
import { META, classById } from '../game/content'
import type { CharacterSummary, Session } from '../game/session'

/**
 * Seleção de herói: o roster da conta (até 3). Escolher entra no jogo;
 * há slots vazios para criar e ação de excluir com confirmação.
 */
export function CharacterSelectPage({ session }: { session: Session }) {
  const { roster, maxChars } = session
  const [selected, setSelected] = useState<string | null>(roster[0]?.id ?? null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const emptySlots = Math.max(0, maxChars - roster.length)

  return (
    <div className="gate gate--wide">
      <div className="gate__bg" aria-hidden="true" />
      <div className="roster">
        <header className="roster__head">
          <div className="gate__brand gate__brand--row">
            <span className="brand__mark">BuildsWar</span>
            <span className="league-chip">
              <span className="dot dot--on" />
              <span className="league-chip__name">{META.league}</span>
            </span>
          </div>
          <div className="roster__acct">
            <span className="tiny muted">conectado como</span>
            <b>{session.account?.username ?? '—'}</b>
            <button className="btn btn--sm" onClick={session.logout}>
              Sair
            </button>
          </div>
        </header>

        <h2 className="roster__title">Escolha seu herói</h2>

        <div className="roster__grid">
          {roster.map((ch) => (
            <CharacterCard
              key={ch.id}
              ch={ch}
              active={selected === ch.id}
              onSelect={() => setSelected(ch.id)}
              onEnter={() => session.enterGame(ch.id)}
              onDelete={() => setConfirmDelete(ch.id)}
            />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <button key={`empty-${i}`} className="charslot charslot--empty" onClick={session.goToCreate}>
              <span className="charslot__plus">+</span>
              <span className="charslot__emptylabel">Criar herói</span>
            </button>
          ))}
        </div>

        <div className="roster__foot">
          <button
            className="btn btn--blood btn--lg"
            disabled={!selected}
            onClick={() => selected && session.enterGame(selected)}
          >
            Entrar no jogo
          </button>
          <span className="tiny muted">
            {roster.length}/{maxChars} heróis nesta liga
          </span>
        </div>
      </div>

      {confirmDelete ? (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__box">
            <div className="modal__title">Excluir herói?</div>
            <p className="small">
              Esta ação é permanente. O herói{' '}
              <b>{roster.find((c) => c.id === confirmDelete)?.name}</b> e seu progresso serão perdidos.
            </p>
            <div className="modal__actions">
              <button className="btn" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                className="btn btn--blood"
                onClick={() => {
                  session.deleteCharacter(confirmDelete)
                  if (selected === confirmDelete) setSelected(null)
                  setConfirmDelete(null)
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CharacterCard({
  ch,
  active,
  onSelect,
  onEnter,
  onDelete,
}: {
  ch: CharacterSummary
  active: boolean
  onSelect: () => void
  onEnter: () => void
  onDelete: () => void
}) {
  const cls = classById[ch.classId]
  return (
    <div
      className={`charslot charslot--${cls?.accent ?? 'blood'}${active ? ' is-active' : ''}`}
      onClick={onSelect}
      onDoubleClick={onEnter}
    >
      <div className="charslot__portrait">
        <span className="charslot__glyph">{cls?.glyph ?? '⚔'}</span>
      </div>
      <div className="charslot__name">{ch.name}</div>
      <div className="charslot__cls">{cls?.name ?? ch.classId}</div>
      <div className="charslot__lvl">Nível {ch.level}</div>
      <div className="charslot__actions">
        <button
          className="btn btn--sm btn--blood"
          onClick={(e) => {
            e.stopPropagation()
            onEnter()
          }}
        >
          Jogar
        </button>
        <button
          className="btn btn--sm btn--ghost"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Excluir herói"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
