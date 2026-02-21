import { useState, useEffect } from 'react'
import { api } from '../api'
import type { ExerciseEntry, ExerciseHistoryPoint, ExercisePR } from '../api'
import ExerciseProgressionChart from './ExerciseProgressionChart'

export default function LiftingView() {
  const [exerciseNames, setExerciseNames] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [history, setHistory] = useState<ExerciseHistoryPoint[]>([])
  const [prs, setPRs] = useState<ExercisePR[]>([])
  const [recentExercises, setRecentExercises] = useState<ExerciseEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.exerciseNames(),
      api.exercisePRs(),
      api.exercises('30d'),
    ]).then(([names, p, recent]) => {
      setExerciseNames(names)
      setPRs(p)
      setRecentExercises(recent)
      if (names.length > 0) {
        setSelectedExercise(names[0])
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedExercise) return
    api.exerciseHistory(selectedExercise, '90d').then(setHistory)
  }, [selectedExercise])

  if (loading) {
    return <div className="text-center text-text-muted py-12">Loading...</div>
  }

  if (exerciseNames.length === 0) {
    return (
      <div className="text-center text-text-muted py-16">
        <p className="text-lg mb-2">No exercises logged yet</p>
        <p className="text-sm">Log lifts via Telegram to see your progression!</p>
        <p className="text-xs mt-2 opacity-60">Example: "Deadlift 200lbs 3x5"</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Exercise selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <label className="text-sm font-medium text-text-muted mb-2 block">Exercise</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Progression chart */}
      {history.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">
            {selectedExercise} Progression
          </h3>
          <ExerciseProgressionChart data={history} />
        </div>
      )}

      {/* Personal Records */}
      {prs.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Personal Records</h3>
          <div className="space-y-2">
            {prs.map((pr) => (
              <div key={pr.exercise_name} className="flex justify-between items-center text-sm">
                <span className="text-text font-medium">{pr.exercise_name}</span>
                <div className="text-right">
                  <span className="text-accent-green font-bold">{pr.weight_lbs} lbs</span>
                  <span className="text-text-muted ml-2">{pr.sets}x{pr.reps}</span>
                  <span className="text-text-muted text-xs ml-2">
                    {new Date(pr.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {recentExercises.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Recent Sessions (30d)</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentExercises.map((ex, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-text font-medium">{ex.exercise_name}</span>
                  <span className="text-text-muted text-xs ml-2">
                    {new Date(ex.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-text">{ex.weight_lbs} lbs</span>
                  <span className="text-text-muted ml-2">{ex.sets}x{ex.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
