import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { WellnessEntry } from '../api'

interface Props {
  data: WellnessEntry[]
}

export default function FatigueChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted}>
        <XAxis dataKey="label" tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 10]} tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip
          contentStyle={{ background: '#111a11', border: '1px solid #1e2e1e', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e8f0e8' }}
        />
        <Line type="monotone" dataKey="fatigue_score" stroke="#facc15" strokeWidth={2} dot={{ fill: '#facc15', r: 3 }} name="Fatigue" />
      </LineChart>
    </ResponsiveContainer>
  )
}
