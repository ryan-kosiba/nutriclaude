import { useState, useEffect } from 'react'
import { Flame, Beef, Weight, Zap, Activity } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { api } from '../api'
import type { KpiData, WeightEntry, CalorieBalanceEntry, DailyMeal, WellnessEntry, PerformanceEntry, Goals } from '../api'
import { useAuth } from '../AuthContext'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  icon: React.ElementType
  accentColor?: 'green' | 'blue'
  trendData?: { value: number }[]
  goalValue?: number
}

function KPICard({ title, value, unit, icon: Icon, accentColor = 'green', trendData, goalValue }: KPICardProps) {
  const [hovered, setHovered] = useState(false)
  const colorClass = accentColor === 'green' ? 'text-accent-green' : 'text-accent-blue'
  const lineColor = accentColor === 'green' ? '#A2FF00' : '#4FC3F7'
  return (
    <div
      className="relative bg-card border border-border rounded-lg p-4 hover:border-card-hover transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-text-muted text-sm">{title}</span>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl text-text font-medium">{value}</span>
        {unit && <span className="text-text-dim text-sm">{unit}</span>}
      </div>
      {hovered && trendData && trendData.length > 1 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-card border border-border rounded-lg p-2 shadow-lg">
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={trendData}>
              <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={false} />
              {goalValue != null && (
                <ReferenceLine y={goalValue} stroke="#888" strokeDasharray="4 3" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
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
  const [wellness, setWellness] = useState<WellnessEntry[]>([])
  const [performance, setPerformance] = useState<PerformanceEntry[]>([])
  const [goals, setGoals] = useState<Goals>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const range = `${dateRange}d`
    Promise.all([
      api.kpis(range),
      api.weight('30d'),
      api.calorieBalance(range),
      api.meals('30d'),
      api.wellness('30d'),
      api.performance('30d'),
      api.getGoals(),
    ]).then(([k, w, cb, m, wel, perf, g]) => {
      setKpis(k)
      setWeight(w)
      setCalorieBalance(cb)
      setMeals(m)
      setWellness(wel)
      setPerformance(perf)
      setGoals(g)
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
  const chartMeals = meals.slice(-dateRange)
  const calorieBreakdown = chartMeals.map((m) => ({
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <KPICard
            title="Weight" value={kpis.current_weight ?? '—'} unit="lbs" icon={Weight} accentColor="blue"
            trendData={weight.slice(-14).map(w => ({ value: w.weight_lbs }))}
            goalValue={goals.target_weight_lbs ?? undefined}
          />
          <KPICard
            title="Avg Daily Calories" value={kpis.avg_daily_calories} unit="kcal" icon={Flame} accentColor="green"
            trendData={meals.slice(-14).map(m => ({ value: m.calories }))}
            goalValue={goals.daily_calories ?? undefined}
          />
          <KPICard
            title="Avg Daily Protein" value={kpis.avg_daily_protein} unit="g" icon={Beef} accentColor="blue"
            trendData={meals.slice(-14).map(m => ({ value: m.protein_g }))}
            goalValue={goals.daily_protein_g ?? undefined}
          />
          <KPICard
            title="Avg Fatigue" value={kpis.avg_fatigue ?? '—'} unit="/10" icon={Zap} accentColor="blue"
            trendData={wellness.slice(-14).map(w => ({ value: w.fatigue_score }))}
          />
          <KPICard
            title="Avg Performance" value={kpis.avg_performance ?? '—'} unit="/10" icon={Activity} accentColor="green"
            trendData={performance.slice(-14).map(p => ({ value: p.performance_score }))}
          />
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
      {calorieBalance.length > 0 && (() => {
        const hasGoal = goals.daily_calories != null
        if (!hasGoal) {
          // Fallback: original line chart when no calorie goal is set
          return (
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
          )
        }

        const dailyGoal = goals.daily_calories!
        const isBulking = goals.target_weight_lbs != null && kpis?.current_weight != null && goals.target_weight_lbs > kpis.current_weight

        const goalData = calorieBalance.map(cb => {
          const diff = cb.intake - dailyGoal
          const isGood = isBulking ? diff >= 0 : diff <= 0
          return {
            label: formatDate(cb.date),
            diff,
            intake: cb.intake,
            fill: isGood ? '#4ade80' : '#f87171',
          }
        })

        return (
          <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
            <h2 className="text-lg font-medium text-text mb-4">
              Daily Intake vs Goal {isBulking ? '(Bulking)' : '(Cutting)'}
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={goalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="label" stroke="#666" style={{ fontSize: '12px' }} />
                <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    const sign = d.diff > 0 ? '+' : ''
                    return (
                      <div style={tooltipStyle} className="p-3 text-sm">
                        <p>Intake: {d.intake} kcal</p>
                        <p>Goal: {dailyGoal} kcal</p>
                        <p style={{ color: d.fill }}>Diff: {sign}{d.diff} kcal</p>
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" label={{ value: `Goal: ${dailyGoal}`, position: 'right', fill: '#888', fontSize: 12 }} />
                <Bar dataKey="diff" radius={[4, 4, 4, 4]}>
                  {goalData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      })()}
    </div>
  )
}
