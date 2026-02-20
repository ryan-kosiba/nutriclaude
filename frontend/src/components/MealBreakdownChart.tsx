import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
  // Group meals by time-of-day bucket
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
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <XAxis dataKey="label" tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#7a8a7a', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
        <Tooltip
          contentStyle={{ background: '#111a11', border: '1px solid #1e2e1e', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e8f0e8' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="calories" fill="#4ade80" radius={[4, 4, 0, 0]} name="Calories" />
        <Bar dataKey="protein_g" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Protein (g)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
