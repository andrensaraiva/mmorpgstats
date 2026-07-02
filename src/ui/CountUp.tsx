/* =========================================================
   BuildsWar :: contagem animada (Fase C — momento "descoberto")
   Anima um número de 0 até o alvo (easeOutCubic). Respeita
   prefers-reduced-motion: se ativo, mostra o valor final direto.
   ========================================================= */

import { useEffect, useRef, useState } from 'react'
import { fmtInt } from './format'

function reduceMotion(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
}

export function CountUp({
  to,
  duration = 1000,
  className,
}: {
  to: number
  duration?: number
  className?: string
}) {
  const [val, setVal] = useState(() => (reduceMotion() ? to : 0))
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (reduceMotion()) {
      setVal(to)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setVal(to * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [to, duration])

  return <span className={className}>{fmtInt(val)}</span>
}
