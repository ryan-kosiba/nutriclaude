interface Props {
  label: string
  value: number
  unit: string
  target: string
  status: 'on-track' | 'over' | 'under'
  color: 'green' | 'purple' | 'yellow' | 'orange'
}

const colorMap = {
  green: 'text-accent-green',
  purple: 'text-accent-purple',
  yellow: 'text-accent-yellow',
  orange: 'text-accent-orange',
}

const statusLabel = {
  'on-track': { text: 'On track', cls: 'text-accent-green' },
  over: { text: 'Over', cls: 'text-accent-yellow' },
  under: { text: 'Below', cls: 'text-accent-purple' },
}

export default function MacroCard({ label, value, unit, target, status, color }: Props) {
  const s = statusLabel[status]
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorMap[color]}`}>
        {value.toLocaleString()}
        {unit && <span className="text-lg">{unit}</span>}
      </p>
      <div className="flex justify-between items-center mt-2 text-xs">
        <span className="text-text-muted">{target}</span>
        <span className={s.cls}>{s.text}</span>
      </div>
    </div>
  )
}
