import { useState, useEffect } from 'react'
import { api } from '../api'
import type { KpiData, WeightEntry, CalorieBalanceEntry, WellnessEntry, DailyMeal } from '../api'
import KpiCards from './KpiCards'
import WeightChart from './WeightChart'
import CalorieBalanceChart from './CalorieBalanceChart'
import FatigueChart from './FatigueChart'
import MacroTrendChart from './MacroTrendChart'
import AiSummary from './AiSummary'

export default function OverviewView() {
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [weight, setWeight] = useState<WeightEntry[]>([])
  const [calorieBalance, setCalorieBalance] = useState<CalorieBalanceEntry[]>([])
  const [wellness, setWellness] = useState<WellnessEntry[]>([])
  const [meals, setMeals] = useState<DailyMeal[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.kpis('7d'),
      api.weight('30d'),
      api.calorieBalance('7d'),
      api.wellness('7d'),
      api.meals('7d'),
    ]).then(([k, w, cb, wl, m]) => {
      setKpis(k)
      setWeight(w)
      setCalorieBalance(cb)
      setWellness(wl)
      setMeals(m)
      setLoading(false)
    })

    // Load summary separately (it's slower due to Claude call)
    api.summary().then((s) => {
      setSummary(s.summary)
      setSummaryLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="text-center text-text-muted py-12">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {kpis && <KpiCards data={kpis} />}

      <AiSummary summary={summary} loading={summaryLoading} />

      {meals.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Daily Macros (7d)</h3>
          <MacroTrendChart data={meals} />
        </div>
      )}

      {calorieBalance.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Calorie Balance (7d)</h3>
          <CalorieBalanceChart data={calorieBalance} />
        </div>
      )}

      {weight.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Weight Trend (30d)</h3>
          <WeightChart data={weight} />
        </div>
      )}

      {wellness.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Fatigue Score (7d)</h3>
          <FatigueChart data={wellness} />
        </div>
      )}
    </div>
  )
}
