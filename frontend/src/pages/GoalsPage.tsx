import { useState, useEffect } from 'react'
import { Target, Save } from 'lucide-react'
import { api } from '../api'
import type { Goals } from '../api'

const fields = [
  { key: 'target_weight_lbs', label: 'Target Weight', unit: 'lbs' },
  { key: 'daily_calories', label: 'Daily Calories', unit: 'kcal' },
  { key: 'daily_protein_g', label: 'Daily Protein', unit: 'g' },
  { key: 'max_carbs_g', label: 'Max Carbs', unit: 'g' },
  { key: 'max_fat_g', label: 'Max Fat', unit: 'g' },
] as const

export default function GoalsPage() {
  const [form, setForm] = useState<Goals>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api.getGoals()
      .then(setForm)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key: keyof Goals, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value === '' ? null : Number(value),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.updateGoals(form)
      setMessage({ type: 'success', text: 'Goals saved successfully' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save goals' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text flex items-center gap-3">
          <Target className="w-7 h-7 text-accent-green" />
          Goals
        </h1>
        <p className="text-text-muted mt-1">Set your daily nutrition and fitness targets</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        {fields.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="block text-text-secondary text-sm mb-1.5">{label}</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
                placeholder="Not set"
                className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-text placeholder-text-dim focus:outline-none focus:border-accent-green transition-colors"
              />
              <span className="text-text-muted text-sm w-10">{unit}</span>
            </div>
          </div>
        ))}

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-accent-green' : 'text-red-400'}`}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-accent-green text-bg font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>
    </div>
  )
}
