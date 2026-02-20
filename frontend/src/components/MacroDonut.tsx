import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  protein: number
  carbs: number
  fat: number
}

const COLORS = ['#4ade80', '#facc15', '#fb923c']

export default function MacroDonut({ protein, carbs, fat }: Props) {
  const data = [
    { name: 'Protein', value: protein * 4 },
    { name: 'Carbs', value: carbs * 4 },
    { name: 'Fat', value: fat * 9 },
  ]

  if (protein + carbs + fat === 0) {
    return <p className="text-text-muted text-sm text-center py-8">No macro data</p>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value: string) => <span style={{ color: '#e8f0e8' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
