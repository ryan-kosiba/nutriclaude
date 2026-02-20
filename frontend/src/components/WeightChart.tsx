import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { WeightEntry } from '../api'

interface Props {
  data: WeightEntry[]
}

export default function WeightChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted}>
        <XAxis dataKey="label" tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          domain={['dataMin - 2', 'dataMax + 2']}
          tick={{ fill: '#7a8a7a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{ background: '#111a11', border: '1px solid #1e2e1e', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e8f0e8' }}
        />
        <Line type="monotone" dataKey="weight_lbs" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} name="Weight (lbs)" />
      </LineChart>
    </ResponsiveContainer>
  )
}
