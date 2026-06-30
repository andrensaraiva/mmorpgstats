interface StatusBarProps {
  label: string
  value: number
  max: number
  tone: 'life' | 'resource' | 'progress'
}
export function StatusBar({ label, value, max, tone }: StatusBarProps) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)))

  return (
    <div className="status-bar">
      <div className="status-bar__labels">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div
        className="status-bar__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <span
          className={`status-bar__fill status-bar__fill--${tone}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
