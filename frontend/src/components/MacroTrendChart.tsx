import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
        <YAxis stroke="#666" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} iconType="square" />
        <Bar dataKey="Protein" stackId="a" fill="#4FC3F7" />
        <Bar dataKey="Carbs" stackId="a" fill="#A2FF00" />
        <Bar dataKey="Fat" stackId="a" fill="#FF9800" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
