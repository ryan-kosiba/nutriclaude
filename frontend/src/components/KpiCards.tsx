import type { KpiData } from '../api'

interface Props {
  data: KpiData
}

function KpiCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {value}
        {unit && <span className="text-sm text-text-muted ml-1">{unit}</span>}
      </p>
    </div>
  )
}

export default function KpiCards({ data }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <KpiCard label="Avg Calories" value={data.avg_daily_calories.toLocaleString()} unit="/day" color="text-accent-green" />
      <KpiCard label="Avg Protein" value={`${data.avg_daily_protein}g`} unit="/day" color="text-accent-purple" />
      <KpiCard label="Weight" value={data.current_weight != null ? `${data.current_weight}` : '—'} unit="lbs" color="text-accent-blue" />
      <KpiCard
        label="Cal Balance"
        value={data.calorie_balance >= 0 ? `+${data.calorie_balance.toLocaleString()}` : data.calorie_balance.toLocaleString()}
        unit="7d"
        color={data.calorie_balance >= 0 ? 'text-accent-green' : 'text-accent-red'}
      />
      <KpiCard label="Avg Fatigue" value={data.avg_fatigue != null ? `${data.avg_fatigue}` : '—'} unit="/10" color="text-accent-yellow" />
      <KpiCard label="Avg Performance" value={data.avg_performance != null ? `${data.avg_performance}` : '—'} unit="/10" color="text-accent-blue" />
    </div>
  )
}
