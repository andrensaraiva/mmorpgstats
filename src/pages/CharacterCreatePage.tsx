import { useState } from 'react'
import { CLASSES, META } from '../game/content'
import type { ClassOption } from '../game/content'
import type { Session } from '../game/session'
import { validateCharName } from '../game/session'

/**
 * Criação de personagem: escolher classe (as 3 do MVP), ler a fantasia e
 * arquétipos que ela alcança, nomear e criar. Layout de duas colunas —
 * lista de classes à esquerda, detalhe + nome à direita.
 */
export function CharacterCreatePage({ session }: { session: Session }) {
  const [classId, setClassId] = useState<ClassOption['id']>(CLASSES[0].id)
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)

  const chosen = CLASSES.find((c) => c.id === classId)!
  const nameErr = touched ? validateCharName(name, session.roster) : null
  const canCreate = !validateCharName(name, session.roster)

  const create = () => {
    setTouched(true)
    if (!canCreate) return
    const ch = session.createCharacter(name, classId, META.league)
    if (ch) session.enterGame(ch.id)
  }

  return (
    <div className="gate gate--wide">
      <div className="gate__bg" aria-hidden="true" />
      <div className="create">
        <header className="create__head">
          <button className="btn btn--sm btn--ghost" onClick={session.goToSelect}>
            ‹ Voltar
          </button>
          <h2 className="create__title">Criar herói</h2>
          <span className="tiny muted">{META.league}</span>
        </header>

        <div className="create__body">
          <div className="create__classes">
            {CLASSES.map((c) => (
              <button
                key={c.id}
                className={`classcard classcard--${c.accent}${c.id === classId ? ' is-active' : ''}`}
                onClick={() => setClassId(c.id)}
              >
                <span className="classcard__glyph">{c.glyph}</span>
                <span className="classcard__name">{c.name}</span>
                <span className="classcard__attr">{c.primaryAttr}</span>
              </button>
            ))}
          </div>

          <div className={`create__detail detail--${chosen.accent}`}>
            <div className="detail__glyph">{chosen.glyph}</div>
            <div className="detail__name">{chosen.name}</div>
            <div className="detail__tag">{chosen.tagline}</div>
            <p className="detail__fantasy">{chosen.fantasy}</p>

            <div className="detail__row">
              <span className="detail__k">Atributo</span>
              <span className="detail__v">{chosen.primaryAttr}</span>
            </div>
            <div className="detail__row">
              <span className="detail__k">Armas</span>
              <span className="detail__v">{chosen.weapons}</span>
            </div>
            <div className="detail__block">
              <span className="detail__k">Arquétipos</span>
              <div className="chips">
                {chosen.archetypes.map((a) => (
                  <span className="chip" key={a}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="detail__block">
              <span className="detail__k">Ascendências</span>
              <div className="chips">
                {chosen.ascendancies.map((a) => (
                  <span className="chip chip--gold" key={a}>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <label className="field mt10">
              <span className="field__label">Nome do herói</span>
              <input
                className={`field__input${nameErr ? ' has-error' : ''}`}
                type="text"
                placeholder="Ex.: Vheyra, a Cinza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                maxLength={18}
              />
              {nameErr ? <span className="field__err">{nameErr}</span> : null}
            </label>

            <button className="btn btn--blood btn--lg btn--full mt10" disabled={!canCreate} onClick={create}>
              Forjar herói e entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
