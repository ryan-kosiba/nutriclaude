import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ExerciseHistoryPoint } from '../api'

interface Props {
  data: ExerciseHistoryPoint[]
}

function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export default function ExerciseProgressionChart({ data }: Props) {
  // Aggregate by date: sum volume, best e1RM
  const byDate = new Map<string, { volume: number; e1rm: number }>()
  for (const d of data) {
    const existing = byDate.get(d.date) ?? { volume: 0, e1rm: 0 }
    existing.volume += d.sets * d.reps * d.weight_lbs
    const e1rm = epley1RM(d.weight_lbs, d.reps)
    if (e1rm > existing.e1rm) existing.e1rm = e1rm
    byDate.set(d.date, existing)
  }

  const formatted = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: vals.volume,
      e1rm: vals.e1rm,
    }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
          <YAxis
            yAxisId="left"
            stroke="#4FC3F7"
            style={{ fontSize: '12px' }}
            width={55}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#66BB6A"
            style={{ fontSize: '12px' }}
            width={50}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
            formatter={(value, name) => {
              const v = Number(value)
              if (name === 'Volume') return [`${v.toLocaleString()} lbs`, name]
              return [`${v} lbs`, name]
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="volume"
            stroke="#4FC3F7"
            strokeWidth={2}
            dot={{ fill: '#4FC3F7', r: 3 }}
            activeDot={{ r: 5 }}
            name="Volume"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="e1rm"
            stroke="#66BB6A"
            strokeWidth={2}
            dot={{ fill: '#66BB6A', r: 3 }}
            activeDot={{ r: 5 }}
            name="Est. 1RM"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-1 text-xs text-text-dim">
        <p><span className="text-[#4FC3F7] font-medium">Volume</span> — total weight moved (weight x sets x reps), summed across all sets for the day</p>
        <p><span className="text-[#66BB6A] font-medium">Est. 1RM</span> — estimated one-rep max using the Epley formula, best set of the day</p>
      </div>
    </div>
  )
}
