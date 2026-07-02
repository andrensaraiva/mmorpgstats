/* =========================================================
   BuildsWar :: tooltip flutuante acessível (Fase B do polish)
   Um único popover para inspeção de item:
   - transiente no hover E no foco de teclado;
   - fixável por clique/toque (fica aberto);
   - fechável por Esc, clique fora ou botão ×;
   - posicionado sem cortar nas bordas (flip acima/abaixo + clamp).
   Conteúdo é ReactNode → serve item do baú, slot ou anúncio do mercado.
   ========================================================= */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'

interface TipState {
  content: ReactNode
  rect: DOMRect
  anchor: HTMLElement
  pinned: boolean
}

interface TipApi {
  show: (content: ReactNode, el: HTMLElement) => void
  hide: () => void
  togglePin: (content: ReactNode, el: HTMLElement) => void
  clear: () => void
}

const TipCtx = createContext<TipApi | null>(null)

/** Props prontos para um gatilho de inspeção (hover + foco + clique/fixar). */
export function useItemTip() {
  const api = useContext(TipCtx)
  if (!api) throw new Error('useItemTip fora de ItemTipProvider')
  return api
}

/** Helper: espalha os handlers num elemento focável (button). */
export function tipProps(api: TipApi, content: ReactNode) {
  return {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => api.show(content, e.currentTarget),
    onMouseLeave: () => api.hide(),
    onFocus: (e: ReactFocusEvent<HTMLElement>) => api.show(content, e.currentTarget),
    onBlur: () => api.hide(),
  }
}

export function ItemTipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<TipState | null>(null)

  const show = useCallback((content: ReactNode, el: HTMLElement) => {
    setTip((cur) => (cur?.pinned ? cur : { content, rect: el.getBoundingClientRect(), anchor: el, pinned: false }))
  }, [])

  const hide = useCallback(() => {
    setTip((cur) => (cur && !cur.pinned ? null : cur))
  }, [])

  const togglePin = useCallback((content: ReactNode, el: HTMLElement) => {
    setTip((cur) =>
      cur?.pinned && cur.anchor === el
        ? null
        : { content, rect: el.getBoundingClientRect(), anchor: el, pinned: true },
    )
  }, [])

  const clear = useCallback(() => setTip(null), [])

  // Quando fixado: Esc fecha; rolar/redimensionar invalida a âncora → fecha.
  useEffect(() => {
    if (!tip?.pinned) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clear()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', clear)
    window.addEventListener('scroll', clear, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', clear)
      window.removeEventListener('scroll', clear, true)
    }
  }, [tip?.pinned, clear])

  return (
    <TipCtx.Provider value={{ show, hide, togglePin, clear }}>
      {children}
      {tip ? <FloatingTip tip={tip} onClose={clear} /> : null}
    </TipCtx.Provider>
  )
}

function FloatingTip({ tip, onClose }: { tip: TipState; onClose: () => void }) {
  const width = 250
  const centerX = tip.rect.left + tip.rect.width / 2
  const left = Math.min(Math.max(8, centerX - width / 2), window.innerWidth - width - 8)
  const above = tip.rect.top > 240
  const style: CSSProperties = above
    ? { left, bottom: window.innerHeight - tip.rect.top + 8 }
    : { left, top: tip.rect.bottom + 8 }

  return (
    <>
      {tip.pinned ? <div className="tip-backdrop" onClick={onClose} aria-hidden="true" /> : null}
      <div
        className={`itip floating-tip${tip.pinned ? ' is-pinned' : ''}`}
        style={style}
        role={tip.pinned ? 'dialog' : 'tooltip'}
        aria-label="Detalhes do item"
      >
        {tip.pinned ? (
          <button className="tip-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        ) : null}
        {tip.content}
      </div>
    </>
  )
}
