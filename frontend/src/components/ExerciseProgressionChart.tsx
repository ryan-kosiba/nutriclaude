import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ExerciseHistoryPoint } from '../api'

interface Props {
  data: ExerciseHistoryPoint[]
}

export default function ExerciseProgressionChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: d.sets * d.reps * d.weight_lbs,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
        <YAxis
          domain={['dataMin - 10', 'dataMax + 10']}
          stroke="#666"
          style={{ fontSize: '12px' }}
          width={45}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
          formatter={(value) => [`${value} lbs`, 'Weight']}
        />
        <Line
          type="monotone"
          dataKey="weight_lbs"
          stroke="#4FC3F7"
          strokeWidth={3}
          dot={{ fill: '#4FC3F7', r: 4 }}
          activeDot={{ r: 6 }}
          name="Weight (lbs)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
