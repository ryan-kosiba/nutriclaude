import { useState, useEffect } from 'react'
import { api } from '../api'
import type { DailyData } from '../api'
import MacroDonut from '../components/MacroDonut'
import MealBreakdownChart from '../components/MealBreakdownChart'

export default function DailyPage() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [data, setData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dates('14d').then((d) => {
      setDates(d)
      if (d.length > 0) {
        setSelectedDate(d[d.length - 1])
      }
      setLoading(false)
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

  if (loading && !data) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  if (dates.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-text mb-1">Daily View</h1>
        <p className="text-text-muted mt-4">No data logged yet. Start logging via Telegram!</p>
      </div>
    )
  }

  const formatDateLabel = (d: string) => {
    const date = new Date(d + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-text mb-1">Daily View</h1>
        <p className="text-text-muted">Detailed breakdown for a single day</p>
      </div>

      {/* Date selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              d === selectedDate
                ? 'bg-accent-green text-bg font-medium'
                : 'bg-card text-text-muted border border-border hover:border-card-hover hover:text-text'
            }`}
          >
            {formatDateLabel(d)}
          </button>
        ))}
      </div>

      {data && (
        <>
          {/* Macro cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-text-muted text-sm mb-1">Calories</div>
              <div className="text-2xl font-medium text-text">{data.calories}</div>
              <div className="text-text-dim text-xs">kcal</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-text-muted text-sm mb-1">Protein</div>
              <div className="text-2xl font-medium text-accent-blue">{data.protein_g}g</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-text-muted text-sm mb-1">Carbs</div>
              <div className="text-2xl font-medium text-accent-green">{data.carbs_g}g</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-text-muted text-sm mb-1">Fat</div>
              <div className="text-2xl font-medium text-accent-orange">{data.fat_g}g</div>
            </div>
          </div>

          {/* Workout card */}
          {data.workout && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-text-muted text-sm mb-2">Workout</h3>
              <p className="text-text font-medium">{data.workout.description}</p>
              <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                <span>{data.workout.calories_burned} kcal burned</span>
                {data.workout.intensity != null && <span>Intensity: {data.workout.intensity}/10</span>}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.calories > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
                <h3 className="text-lg font-medium text-text mb-4">Macro Split</h3>
                <MacroDonut protein={data.protein_g} carbs={data.carbs_g} fat={data.fat_g} />
              </div>
            )}
            {data.meals.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
                <h3 className="text-lg font-medium text-text mb-4">Meals by Time</h3>
                <MealBreakdownChart meals={data.meals} />
              </div>
            )}
          </div>

          {/* Meals list */}
          {data.meals.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 lg:px-6 py-4 border-b border-border">
                <h3 className="text-lg font-medium text-text">Meals</h3>
              </div>
              <div className="divide-y divide-border">
                {data.meals.map((meal, i) => (
                  <div key={i} className="px-4 lg:px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-text font-medium">{meal.description}</p>
                      <p className="text-text-muted text-sm">
                        {new Date(meal.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-text font-medium">{meal.calories} kcal</p>
                      <p className="text-text-muted">
                        <span className="text-accent-blue">P:{meal.protein_g}g</span>{' '}
                        <span className="text-accent-green">C:{meal.carbs_g}g</span>{' '}
                        <span className="text-accent-orange">F:{meal.fat_g}g</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
