import { useState, useEffect } from 'react'
import { Flame, Beef, Weight, TrendingDown, Zap, Activity } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { api } from '../api'
import type { KpiData, WeightEntry, CalorieBalanceEntry, DailyMeal } from '../api'
import { useAuth } from '../AuthContext'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  icon: React.ElementType
  accentColor?: 'green' | 'blue'
}

function KPICard({ title, value, unit, icon: Icon, accentColor = 'green' }: KPICardProps) {
  const colorClass = accentColor === 'green' ? 'text-accent-green' : 'text-accent-blue'
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-card-hover transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-text-muted text-sm">{title}</span>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl text-text font-medium">{value}</span>
        {unit && <span className="text-text-dim text-sm">{unit}</span>}
      </div>
    </div>
  )
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00')
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const tooltipStyle = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#fff',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<7 | 14 | 30>(7)
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [weight, setWeight] = useState<WeightEntry[]>([])
  const [calorieBalance, setCalorieBalance] = useState<CalorieBalanceEntry[]>([])
  const [meals, setMeals] = useState<DailyMeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const range = `${dateRange}d`
    Promise.all([
      api.kpis(range),
      api.weight('30d'),
      api.calorieBalance(range),
      api.meals(range),
    ]).then(([k, w, cb, m]) => {
      setKpis(k)
      setWeight(w)
      setCalorieBalance(cb)
      setMeals(m)
      setLoading(false)
    })
  }, [dateRange])

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const displayName = user?.display_name?.split(' ')[0] || 'there'

  if (loading) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  // Transform meals for stacked bar chart (protein*4, carbs*4, fat*9 as calorie contributions)
  const calorieBreakdown = meals.map((m) => ({
    date: m.date,
    protein: m.protein_g * 4,
    carbs: m.carbs_g * 4,
    fat: m.fat_g * 9,
  }))

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-text mb-1">
            Welcome back, {displayName}
          </h1>
          <p className="text-text-muted">{formattedDate}</p>
        </div>

        <div className="flex gap-2 bg-card border border-border rounded-lg p-1">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-2 rounded-md transition-colors ${
                dateRange === days
                  ? 'bg-accent-green text-bg font-medium'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard title="Avg Daily Calories" value={kpis.avg_daily_calories} unit="kcal" icon={Flame} accentColor="green" />
          <KPICard title="Avg Daily Protein" value={kpis.avg_daily_protein} unit="g" icon={Beef} accentColor="blue" />
          <KPICard title="Current Weight" value={kpis.current_weight ?? '—'} unit="lbs" icon={Weight} accentColor="blue" />
          <KPICard
            title="Calorie Balance"
            value={kpis.calorie_balance > 0 ? `+${kpis.calorie_balance}` : kpis.calorie_balance}
            unit="kcal"
            icon={TrendingDown}
            accentColor="green"
          />
          <KPICard title="Avg Fatigue" value={kpis.avg_fatigue ?? '—'} unit="/10" icon={Zap} accentColor="blue" />
          <KPICard title="Workout Performance" value={kpis.avg_performance ?? '—'} unit="/10" icon={Activity} accentColor="green" />
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Bar Chart - Daily Calorie Breakdown */}
        {calorieBreakdown.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
            <h2 className="text-lg font-medium text-text mb-4">Daily Calorie Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calorieBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#666" style={{ fontSize: '12px' }} />
                <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Date: ${formatDate(l)}`} />
                <Legend wrapperStyle={{ fontSize: '14px' }} iconType="square" />
                <Bar dataKey="protein" stackId="a" fill="#4FC3F7" name="Protein (g x 4)" />
                <Bar dataKey="carbs" stackId="a" fill="#A2FF00" name="Carbs (g x 4)" />
                <Bar dataKey="fat" stackId="a" fill="#FF9800" name="Fat (g x 9)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weight Trend */}
        {weight.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
            <h2 className="text-lg font-medium text-text mb-4">Weight Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weight.map(w => ({ ...w, label: formatDate(w.date) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
                <YAxis stroke="#666" style={{ fontSize: '12px' }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value} lbs`, 'Weight']}
                />
                <Line type="monotone" dataKey="weight_lbs" stroke="#4FC3F7" strokeWidth={3} dot={{ fill: '#4FC3F7', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Daily Net Balance */}
      {calorieBalance.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
          <h2 className="text-lg font-medium text-text mb-4">Daily Net Balance (Surplus/Deficit)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={calorieBalance.map(cb => ({ ...cb, label: formatDate(cb.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => {
                  const v = Number(value) || 0
                  return [`${v > 0 ? '+' : ''}${v} kcal`, v > 0 ? 'Surplus' : 'Deficit']
                }}
              />
              <Line type="monotone" dataKey="net" stroke="#A2FF00" strokeWidth={3} dot={{ fill: '#A2FF00', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
