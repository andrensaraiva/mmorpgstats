import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  eyebrow?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}
export function Panel({ title, eyebrow, children, className = '', action }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()}>
      <header className="panel__header">
        <div>
          {eyebrow ? <p className="panel__eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className="panel__action">{action}</div> : null}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  )
}
