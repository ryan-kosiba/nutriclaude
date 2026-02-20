import { useState, useEffect } from 'react'
import { api } from '../api'
import type { DailyData } from '../api'
import MacroCard from './MacroCard'
import MealBreakdownChart from './MealBreakdownChart'
import MacroDonut from './MacroDonut'

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DailyView() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [data, setData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dates('7d').then((d) => {
      setDates(d)
      if (d.length > 0) {
        setSelectedDate(d[d.length - 1])
      } else {
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    api.daily(selectedDate).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [selectedDate])

  if (!loading && dates.length === 0) {
    return (
      <div className="text-center text-text-muted py-16">
        <p className="text-lg mb-2">No data yet</p>
        <p className="text-sm">Start logging meals and workouts via Telegram!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Date selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDate === d
                ? 'bg-accent-green text-bg'
                : 'bg-card text-text-muted hover:bg-card-hover'
            }`}
          >
            {formatDateLabel(d)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-text-muted py-12">Loading...</div>
      ) : data ? (
        <>
          {/* Macro cards grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MacroCard
              label="Calories"
              value={data.calories}
              unit=""
              target="2,000–2,400"
              status={data.calories >= 2000 && data.calories <= 2400 ? 'on-track' : data.calories > 2400 ? 'over' : 'under'}
              color="green"
            />
            <MacroCard
              label="Protein"
              value={data.protein_g}
              unit="g"
              target="100–200"
              status={data.protein_g >= 100 && data.protein_g <= 200 ? 'on-track' : data.protein_g > 200 ? 'over' : 'under'}
              color="purple"
            />
            <MacroCard
              label="Carbs"
              value={data.carbs_g}
              unit="g"
              target="150–200"
              status={data.carbs_g >= 150 && data.carbs_g <= 200 ? 'on-track' : data.carbs_g > 200 ? 'over' : 'under'}
              color="yellow"
            />
            <MacroCard
              label="Fat"
              value={data.fat_g}
              unit="g"
              target="60–80"
              status={data.fat_g >= 60 && data.fat_g <= 80 ? 'on-track' : data.fat_g > 80 ? 'over' : 'under'}
              color="orange"
            />
          </div>

          {/* Workout card */}
          {data.workout && (
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-accent-blue font-bold text-xl">
                  {data.performance ?? '—'}
                </span>
                <div className="text-sm text-text-muted">
                  <span className="text-text">{data.workout.description}</span>
                  {data.workout.calories_burned > 0 && (
                    <span className="ml-2">· {data.workout.calories_burned} cal burned</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {data.meals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-muted mb-3">Calories & Protein</h3>
                <MealBreakdownChart meals={data.meals} />
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-muted mb-3">Macro Split</h3>
                <MacroDonut protein={data.protein_g} carbs={data.carbs_g} fat={data.fat_g} />
              </div>
            </div>
          )}

          {/* Meal list */}
          {data.meals.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-medium text-text-muted mb-3">Meals</h3>
              <div className="space-y-2">
                {data.meals.map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-text truncate mr-3">{m.description}</span>
                    <span className="text-text-muted whitespace-nowrap">
                      {m.calories} cal · {m.protein_g}p · {m.carbs_g}c · {m.fat_g}f
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
