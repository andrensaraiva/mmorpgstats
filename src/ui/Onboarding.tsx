/* =========================================================
   BuildsWar :: onboarding de primeira sessão (Fase D)
   Sequência curta e pulável que ensina o loop
   montar → testar → ajustar e a mecânica de "números
   descobertos". Aparece uma vez (flag em localStorage) e pode
   ser reaberta. Acessível: modal com foco, Esc fecha, aria.
   ========================================================= */

import { useCallback, useEffect, useState } from 'react'

const SEEN_KEY = 'bw.onboarding.v1'

/** Já viu o onboarding? (tolerante a modo privado/quota.) */
export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* ignora quota/modo privado */
  }
}

interface Step {
  glyph: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    glyph: '⚔',
    title: 'A build é 100% sua',
    body: 'Não existem classes prontas nem planos. O seu poder sai só do que você equipa, aloca na árvore de talentos e socketa de suportes. Cada escolha é uma decisão.',
  },
  {
    glyph: '⚒',
    title: 'Monte no Equipamento',
    body: 'No baú, todo item nasce de uma base + raridade + afixos sorteados. Equipe, compare com o que já está no slot e use os orbes na bancada para craftar. A corrupção Vaal é irreversível.',
  },
  {
    glyph: '◈',
    title: 'Os números são descobertos',
    body: 'Antes de testar, o DPS aparece como estimativa em faixa. O DPS real só é revelado ao rodar uma dungeon — e vale apenas para aquela build exata. Trocar item, craftar ou mexer na árvore esconde o número de novo.',
  },
  {
    glyph: '☠',
    title: 'Teste na Masmorra e ajuste',
    body: 'Envie o herói: o tempo escala com o seu DPS, mas defesas erradas (ex.: pouca resistência a fogo) matam por mais dano que você tenha. Leia a causa, ajuste a build e tente de novo. Esse é o loop.',
  },
]

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const last = i === STEPS.length - 1
  const step = STEPS[i]

  const finish = useCallback(() => {
    markSeen()
    onClose()
  }, [onClose])

  // Esc fecha (e marca como visto) — acessibilidade de modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  return (
    <div className="onb-backdrop" onClick={finish}>
      <div
        className="onb"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onb-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="onb__skip" onClick={finish}>
          Pular ✕
        </button>

        <div className="onb__glyph" aria-hidden="true">
          {step.glyph}
        </div>
        <div className="eyebrow">
          Passo {i + 1} de {STEPS.length}
        </div>
        <h3 className="onb__title" id="onb-title">
          {step.title}
        </h3>
        <p className="onb__body">{step.body}</p>

        <div className="onb__dots" aria-hidden="true">
          {STEPS.map((_, k) => (
            <span key={k} className={`onb__dot${k === i ? ' is-on' : ''}`} />
          ))}
        </div>

        <div className="onb__actions">
          {i > 0 ? (
            <button className="btn btn--sm" onClick={() => setI((n) => n - 1)}>
              Voltar
            </button>
          ) : (
            <span />
          )}
          {last ? (
            <button className="btn btn--blood" onClick={finish}>
              Começar
            </button>
          ) : (
            <button className="btn btn--blood" onClick={() => setI((n) => n + 1)}>
              Próximo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
