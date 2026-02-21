import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
        <YAxis stroke="#666" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
        />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="intake" stroke="#A2FF00" strokeWidth={3} dot={{ r: 4 }} name="Intake" />
        <Line type="monotone" dataKey="burned" stroke="#E91E63" strokeWidth={3} dot={{ r: 4 }} name="Burned" />
        <Line type="monotone" dataKey="net" stroke="#4FC3F7" strokeWidth={3} dot={{ r: 4 }} name="Net" />
      </LineChart>
    </ResponsiveContainer>
  )
}
