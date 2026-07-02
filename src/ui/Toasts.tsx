/* =========================================================
   BuildsWar :: toasts efêmeros (Fase D)
   Canal único para eventos transientes (craft, sem moedas,
   DPS descoberto). Cada toast some sozinho após um tempo, ou
   ao clicar. Acessível (aria-live) e sob prefers-reduced-motion
   (a animação de entrada é neutralizada pelo reset global).
   ========================================================= */

import { useEffect } from 'react'
import type { Toast, ToastTone } from '../game/store'

const TONE_GLYPH: Record<ToastTone, string> = {
  good: '✦',
  warn: '⚠',
  info: '◈',
  loot: '◆',
}

/** Tempo de vida do toast (ms). Avisos ficam um pouco mais. */
function lifespan(tone: ToastTone): number {
  return tone === 'warn' ? 4200 : 3200
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), lifespan(toast.tone))
    return () => window.clearTimeout(t)
  }, [toast.id, toast.tone, onDismiss])

  return (
    <button
      className={`toast toast--${toast.tone}`}
      onClick={() => onDismiss(toast.id)}
      aria-label={`Dispensar aviso: ${toast.message}`}
    >
      <span className="toast__glyph" aria-hidden="true">
        {TONE_GLYPH[toast.tone]}
      </span>
      <span className="toast__msg">{toast.message}</span>
    </button>
  )
}

export function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
