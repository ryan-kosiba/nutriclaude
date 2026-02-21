import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { MealDetail } from '../api'

interface Props {
  meals: MealDetail[]
}

function mealLabel(ts: string): string {
  const hour = new Date(ts).getHours()
  if (hour < 11) return 'Morning'
  if (hour < 15) return 'Midday'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}

export default function MealBreakdownChart({ meals }: Props) {
  const buckets: Record<string, { calories: number; protein_g: number }> = {}
  const order = ['Morning', 'Midday', 'Afternoon', 'Evening']

  for (const m of meals) {
    const label = mealLabel(m.timestamp)
    if (!buckets[label]) buckets[label] = { calories: 0, protein_g: 0 }
    buckets[label].calories += m.calories
    buckets[label].protein_g += m.protein_g
  }

  const data = order.filter((l) => buckets[l]).map((label) => ({ label, ...buckets[label] }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
        <YAxis stroke="#666" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Bar dataKey="calories" fill="#A2FF00" radius={[4, 4, 0, 0]} name="Calories" />
        <Bar dataKey="protein_g" fill="#4FC3F7" radius={[4, 4, 0, 0]} name="Protein (g)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
