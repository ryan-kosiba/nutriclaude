import { useState, useEffect } from 'react'
import { Target, Save } from 'lucide-react'
import { api } from '../api'
import type { Goals } from '../api'

const goalFields = [
  { key: 'target_weight_lbs', label: 'Target Weight', unit: 'lbs' },
  { key: 'daily_calories', label: 'Daily Calories', unit: 'kcal' },
  { key: 'daily_protein_g', label: 'Daily Protein', unit: 'g' },
  { key: 'max_carbs_g', label: 'Max Carbs', unit: 'g' },
  { key: 'max_fat_g', label: 'Max Fat', unit: 'g' },
] as const

function calculateBMI(weightLbs: number, heightInches: number): number {
  return (weightLbs / (heightInches * heightInches)) * 703
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' }
  if (bmi < 25) return { label: 'Normal', color: 'text-accent-green' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' }
  return { label: 'Obese', color: 'text-red-400' }
}

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

  const totalInches = (form.height_feet || 0) * 12 + (form.height_inches || 0)
  const bmi = form.current_weight_lbs && totalInches > 0
    ? calculateBMI(form.current_weight_lbs, totalInches)
    : null

  if (loading) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  const inputClass = "flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-text placeholder-text-dim focus:outline-none focus:border-accent-green transition-colors"

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text flex items-center gap-3">
          <Target className="w-7 h-7 text-accent-green" />
          Goals
        </h1>
        <p className="text-text-muted mt-1">Set your daily nutrition and fitness targets</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-5 mb-6">
        <h2 className="text-lg font-medium text-text">Body Stats</h2>

        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Current Weight</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={form.current_weight_lbs ?? ''}
              onChange={e => handleChange('current_weight_lbs', e.target.value)}
              placeholder="Not set"
              className={inputClass}
            />
            <span className="text-text-muted text-sm w-10">lbs</span>
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Height</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.height_feet ?? ''}
                onChange={e => handleChange('height_feet', e.target.value)}
                placeholder="ft"
                className={inputClass}
              />
              <span className="text-text-muted text-sm w-10">ft</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.height_inches ?? ''}
                onChange={e => handleChange('height_inches', e.target.value)}
                placeholder="in"
                className={inputClass}
              />
              <span className="text-text-muted text-sm w-10">in</span>
            </div>
          </div>
        </div>

        {bmi !== null && (
          <div className="bg-bg border border-border rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-text-secondary text-sm">BMI</span>
            <div className="flex items-center gap-2">
              <span className="text-text font-medium">{bmi.toFixed(1)}</span>
              <span className={`text-sm ${getBMICategory(bmi).color}`}>
                {getBMICategory(bmi).label}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 className="text-lg font-medium text-text">Targets</h2>
        {goalFields.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="block text-text-secondary text-sm mb-1.5">{label}</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
                placeholder="Not set"
                className={inputClass}
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
