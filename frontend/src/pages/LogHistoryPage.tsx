import { useState, useEffect, useMemo } from 'react'
import { Utensils, Dumbbell, Scale, Heart } from 'lucide-react'
import { api } from '../api'
import type { LogHistoryEntry } from '../api'

type FilterType = 'all' | 'meal' | 'workout' | 'exercise' | 'weight' | 'wellness'

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'meal', label: 'Meals' },
  { value: 'workout', label: 'Workouts' },
  { value: 'exercise', label: 'Exercises' },
  { value: 'weight', label: 'Bodyweight' },
  { value: 'wellness', label: 'Wellness' },
]

const typeConfig: Record<string, { icon: React.ElementType; colorClass: string }> = {
  meal: { icon: Utensils, colorClass: 'text-accent-blue bg-accent-blue/10' },
  workout: { icon: Dumbbell, colorClass: 'text-accent-green bg-accent-green/10' },
  exercise: { icon: Dumbbell, colorClass: 'text-accent-purple bg-accent-purple/10' },
  weight: { icon: Scale, colorClass: 'text-accent-orange bg-accent-orange/10' },
  wellness: { icon: Heart, colorClass: 'text-accent-pink bg-accent-pink/10' },
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function LogHistoryPage() {
  const [entries, setEntries] = useState<LogHistoryEntry[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.logHistory('30d', 'all').then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return entries
    return entries.filter((e) => e.type === activeFilter)
  }, [entries, activeFilter])

  const counts = useMemo(() => ({
    total: entries.length,
    meals: entries.filter((e) => e.type === 'meal').length,
    workouts: entries.filter((e) => e.type === 'workout').length + entries.filter((e) => e.type === 'exercise').length,
    weighIns: entries.filter((e) => e.type === 'weight').length,
  }), [entries])

  if (loading) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-text mb-1">Activity & Log History</h1>
        <p className="text-text-muted">All entries synced from your tracking sources</p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === filter.value
                ? 'bg-accent-green text-bg font-medium'
                : 'bg-card text-text-muted border border-border hover:border-card-hover hover:text-text'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table — desktop */}
      <div className="hidden lg:block bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Timestamp</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Description</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Value</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Macros</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const config = typeConfig[entry.type] || typeConfig.workout
                const Icon = config.icon
                return (
                  <tr key={entry.id} className="border-b border-border hover:bg-card-hover/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-text-secondary">{formatTimestamp(entry.timestamp)}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.colorClass}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">{entry.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text">{entry.description}</td>
                    <td className="px-6 py-4 text-text font-medium">{entry.value}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {entry.type === 'meal' && entry.protein != null ? (
                        <div className="space-y-0.5">
                          <div><span className="text-accent-blue">P:</span> {entry.protein}g</div>
                          <div><span className="text-accent-green">C:</span> {entry.carbs}g</div>
                          <div><span className="text-accent-orange">F:</span> {entry.fat}g</div>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-dim">No entries found for this filter.</div>
        )}
      </div>

      {/* Card list — mobile */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-text-dim">No entries found for this filter.</div>
        ) : (
          filtered.map((entry) => {
            const config = typeConfig[entry.type] || typeConfig.workout
            const Icon = config.icon
            return (
              <div key={entry.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${config.colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium capitalize">{entry.type}</span>
                  </div>
                  <span className="text-text-dim text-xs">{formatTimestamp(entry.timestamp)}</span>
                </div>
                <p className="text-text font-medium">{entry.description}</p>
                <p className="text-text-secondary text-sm mt-1">{entry.value}</p>
                {entry.type === 'meal' && entry.protein != null && (
                  <p className="text-text-muted text-xs mt-2">
                    <span className="text-accent-blue">P:{entry.protein}g</span>{' '}
                    <span className="text-accent-green">C:{entry.carbs}g</span>{' '}
                    <span className="text-accent-orange">F:{entry.fat}g</span>
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Total Entries</div>
          <div className="text-2xl text-text font-medium">{counts.total}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Meals Logged</div>
          <div className="text-2xl text-text font-medium">{counts.meals}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Workouts</div>
          <div className="text-2xl text-text font-medium">{counts.workouts}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Weigh-Ins</div>
          <div className="text-2xl text-text font-medium">{counts.weighIns}</div>
        </div>
      </div>
    </div>
  )
}
