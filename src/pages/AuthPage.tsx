import { useState } from 'react'
import type { Session } from '../game/session'
import { validatePassword, validateUsername } from '../game/session'

type Mode = 'login' | 'register'

/**
 * Porta de entrada: login/registro mockado (protótipo, sem backend).
 * Segue as boas práticas de UX de auth 2025 — coluna única, campos mínimos,
 * mostrar/ocultar senha, validação inline, CTA claro e acesso de convidado.
 */
export function AuthPage({ session }: { session: Session }) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [touched, setTouched] = useState(false)

  const userErr = touched ? validateUsername(username) : null
  const pwErr = touched ? validatePassword(password) : null
  const canSubmit = !validateUsername(username) && !validatePassword(password)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    session.authenticate(username)
  }

  return (
    <div className="gate">
      <div className="gate__bg" aria-hidden="true" />
      <div className="gate__panel">
        <div className="gate__brand">
          <span className="brand__mark">BuildsWar</span>
          <span className="brand__sub">O Portal dos Estrategistas</span>
        </div>

        <div className="seg" role="tablist" aria-label="Entrar ou criar conta">
          <button
            role="tab"
            aria-selected={mode === 'login'}
            className={`seg__btn${mode === 'login' ? ' is-active' : ''}`}
            onClick={() => setMode('login')}
          >
            Entrar
          </button>
          <button
            role="tab"
            aria-selected={mode === 'register'}
            className={`seg__btn${mode === 'register' ? ' is-active' : ''}`}
            onClick={() => setMode('register')}
          >
            Criar conta
          </button>
        </div>

        <form className="gate__form" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">Usuário</span>
            <input
              className={`field__input${userErr ? ' has-error' : ''}`}
              type="text"
              autoComplete="username"
              placeholder="seu_nome"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
            {userErr ? <span className="field__err">{userErr}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Senha</span>
            <div className="field__pw">
              <input
                className={`field__input${pwErr ? ' has-error' : ''}`}
                type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
              />
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPw ? 'ocultar' : 'mostrar'}
              </button>
            </div>
            {pwErr ? <span className="field__err">{pwErr}</span> : null}
            {mode === 'login' ? (
              <button type="button" className="field__link">
                Esqueci minha senha
              </button>
            ) : null}
          </label>

          <button type="submit" className="btn btn--blood btn--lg btn--full" disabled={!canSubmit}>
            {mode === 'login' ? 'Entrar no portal' : 'Criar conta e entrar'}
          </button>
        </form>

        <div className="gate__or"><span>ou</span></div>

        <button className="btn btn--full" onClick={() => session.authenticate('convidado')}>
          Entrar como convidado
        </button>

        <p className="gate__note tiny muted">
          Protótipo: nenhuma senha é enviada a um servidor. A conta e os heróis ficam salvos apenas neste navegador.
        </p>
      </div>
    </div>
  )
}
