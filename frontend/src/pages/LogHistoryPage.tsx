import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { Utensils, Dumbbell, Scale, Heart, Pencil, Trash2, X, Check } from 'lucide-react'
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

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'datetime-local'
}

const editableFields: Record<string, FieldDef[]> = {
  meal: [
    { key: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'calories', label: 'Calories', type: 'number' },
    { key: 'protein_g', label: 'Protein (g)', type: 'number' },
    { key: 'carbs_g', label: 'Carbs (g)', type: 'number' },
    { key: 'fat_g', label: 'Fat (g)', type: 'number' },
  ],
  workout: [
    { key: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'estimated_calories_burned', label: 'Calories Burned', type: 'number' },
  ],
  exercise: [
    { key: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
    { key: 'exercise_name', label: 'Exercise', type: 'text' },
    { key: 'sets', label: 'Sets', type: 'number' },
    { key: 'reps', label: 'Reps', type: 'number' },
    { key: 'weight_lbs', label: 'Weight (lbs)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ],
  weight: [
    { key: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
    { key: 'weight_lbs', label: 'Weight (lbs)', type: 'number' },
  ],
  wellness: [
    { key: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
    { key: 'symptom_score', label: 'Symptom Score', type: 'number' },
    { key: 'symptom', label: 'Symptom', type: 'text' },
  ],
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToISO(local: string): string {
  // Assume Eastern time offset: determine from the date itself
  const d = new Date(local)
  const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset()
  const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset()
  const isDST = d.getTimezoneOffset() < Math.max(jan, jul)
  const offset = isDST ? '-04:00' : '-05:00'
  return `${local}:00${offset}`
}

function getInitialValues(entry: LogHistoryEntry): Record<string, string> {
  const t = entry.type
  const ts = isoToDatetimeLocal(entry.timestamp)
  if (t === 'meal') {
    const calMatch = entry.value.match(/^(\d+)/)
    return {
      timestamp: ts,
      description: entry.description,
      calories: calMatch?.[1] ?? '0',
      protein_g: String(entry.protein ?? 0),
      carbs_g: String(entry.carbs ?? 0),
      fat_g: String(entry.fat ?? 0),
    }
  }
  if (t === 'workout') {
    const calMatch = entry.value.match(/^(\d+)/)
    return {
      timestamp: ts,
      description: entry.description,
      estimated_calories_burned: calMatch?.[1] ?? '0',
    }
  }
  if (t === 'exercise') {
    const m = entry.value.match(/^(\d+)x(\d+)\s*@\s*([\d.]+)/)
    return {
      timestamp: ts,
      exercise_name: entry.description,
      sets: m?.[1] ?? '0',
      reps: m?.[2] ?? '0',
      weight_lbs: m?.[3] ?? '0',
      notes: '',
    }
  }
  if (t === 'weight') {
    const m = entry.value.match(/([\d.]+)/)
    return { timestamp: ts, weight_lbs: m?.[1] ?? '0' }
  }
  if (t === 'wellness') {
    const m = entry.value.match(/^(\d+)/)
    return { timestamp: ts, symptom_score: m?.[1] ?? '0', symptom: entry.description !== 'Symptom Score' ? entry.description : '' }
  }
  return {}
}

function rebuildDisplayFields(entry: LogHistoryEntry, vals: Record<string, string>): Partial<LogHistoryEntry> {
  const t = entry.type
  const tsUpdate = vals.timestamp ? { timestamp: datetimeLocalToISO(vals.timestamp) } : {}
  if (t === 'meal') return {
    ...tsUpdate,
    description: vals.description,
    value: `${vals.calories} kcal`,
    protein: Number(vals.protein_g),
    carbs: Number(vals.carbs_g),
    fat: Number(vals.fat_g),
  }
  if (t === 'workout') return {
    ...tsUpdate,
    description: vals.description,
    value: `${vals.estimated_calories_burned} kcal burned`,
  }
  if (t === 'exercise') return {
    ...tsUpdate,
    description: vals.exercise_name,
    value: `${vals.sets}x${vals.reps} @ ${vals.weight_lbs} lbs`,
  }
  if (t === 'weight') return { ...tsUpdate, value: `${vals.weight_lbs} lbs` }
  if (t === 'wellness') return {
    ...tsUpdate,
    description: vals.symptom || 'Symptom Score',
    value: `${vals.symptom_score}/10`,
  }
  return {}
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

const inputClass = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-accent-green transition-colors"

export default function LogHistoryPage() {
  const [entries, setEntries] = useState<LogHistoryEntry[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  const startEdit = useCallback((entry: LogHistoryEntry) => {
    setEditingId(entry.id)
    setEditValues(getInitialValues(entry))
    setConfirmDeleteId(null)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditValues({})
    setConfirmDeleteId(null)
  }, [])

  const handleSave = useCallback(async (entry: LogHistoryEntry) => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      const fields = editableFields[entry.type] || []
      for (const f of fields) {
        const val = editValues[f.key]
        if (f.type === 'datetime-local') {
          payload[f.key] = datetimeLocalToISO(val)
        } else {
          payload[f.key] = f.type === 'number' ? Number(val) : val
        }
      }
      await api.updateLog(entry.type, entry.id, payload)
      const updates = rebuildDisplayFields(entry, editValues)
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, ...updates } : e))
      setEditingId(null)
      setEditValues({})
    } finally {
      setSaving(false)
    }
  }, [editValues])

  const handleDelete = useCallback(async (entry: LogHistoryEntry) => {
    setSaving(true)
    try {
      await api.deleteLog(entry.type, entry.id)
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
      setEditingId(null)
      setConfirmDeleteId(null)
    } finally {
      setSaving(false)
    }
  }, [])

  const renderEditForm = (entry: LogHistoryEntry) => {
    const fields = editableFields[entry.type] || []
    return (
      <div className="mt-3 pt-3 border-t border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-text-muted mb-1 block">{f.label}</label>
              <input
                type={f.type}
                className={inputClass}
                value={editValues[f.key] ?? ''}
                onChange={(e) => setEditValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleSave(entry)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-green text-bg rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={cancelEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-text-muted rounded-lg text-sm hover:text-text transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <div className="flex-1" />
          {confirmDeleteId === entry.id ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete this entry?</span>
              <button
                onClick={() => handleDelete(entry)}
                disabled={saving}
                className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-text-muted text-sm hover:text-text transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(entry.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    )
  }

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
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const config = typeConfig[entry.type] || typeConfig.workout
                const Icon = config.icon
                const isEditing = editingId === entry.id
                return (
                  <Fragment key={entry.id}>
                    <tr className={`border-b border-border transition-colors ${isEditing ? 'bg-card-hover/30' : 'hover:bg-card-hover/50'}`}>
                      <td className="px-6 py-4 text-sm text-text-secondary align-top">{formatTimestamp(entry.timestamp)}</td>
                      <td className="px-6 py-4 align-top">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.colorClass}`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium capitalize">{entry.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text align-top">{entry.description}</td>
                      <td className="px-6 py-4 text-text font-medium align-top">{entry.value}</td>
                      <td className="px-6 py-4 text-sm text-text-muted align-top">
                        {entry.type === 'meal' && entry.protein != null ? (
                          <div className="space-y-0.5">
                            <div><span className="text-accent-blue">P:</span> {entry.protein}g</div>
                            <div><span className="text-accent-green">C:</span> {entry.carbs}g</div>
                            <div><span className="text-accent-orange">F:</span> {entry.fat}g</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 align-top">
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1.5 text-text-dim hover:text-text rounded-lg hover:bg-card-hover transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-card-hover/30">
                        <td colSpan={6} className="px-6 pb-4">
                          {renderEditForm(entry)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
            const isEditing = editingId === entry.id
            return (
              <div key={entry.id} className={`bg-card border border-border rounded-lg p-4 ${isEditing ? 'ring-1 ring-accent-green/30' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${config.colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium capitalize">{entry.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim text-xs">{formatTimestamp(entry.timestamp)}</span>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1 text-text-dim hover:text-text rounded-lg hover:bg-card-hover transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                {isEditing && renderEditForm(entry)}
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
