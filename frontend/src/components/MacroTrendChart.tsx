import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { DailyMeal } from '../api'

interface Props {
  data: DailyMeal[]
}

export default function MacroTrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Protein: d.protein_g * 4,
    Carbs: d.carbs_g * 4,
    Fat: d.fat_g * 9,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted}>
        <XAxis dataKey="label" tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: '#111a11', border: '1px solid #1e2e1e', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e8f0e8' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Protein" stackId="a" fill="#4ade80" />
        <Bar dataKey="Carbs" stackId="a" fill="#facc15" />
        <Bar dataKey="Fat" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
