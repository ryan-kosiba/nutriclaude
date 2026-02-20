import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { CalorieBalanceEntry } from '../api'

interface Props {
  data: CalorieBalanceEntry[]
}

export default function CalorieBalanceChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted}>
        <XAxis dataKey="label" tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
        <Tooltip
          contentStyle={{ background: '#111a11', border: '1px solid #1e2e1e', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e8f0e8' }}
        />
        <ReferenceLine y={0} stroke="#1e2e1e" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="intake" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} name="Intake" />
        <Line type="monotone" dataKey="burned" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} name="Burned" />
        <Line type="monotone" dataKey="net" stroke="#facc15" strokeWidth={2} dot={{ r: 3 }} name="Net" />
      </LineChart>
    </ResponsiveContainer>
  )
}
