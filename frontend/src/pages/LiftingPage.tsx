import { useState, useEffect } from 'react'
import { api } from '../api'
import type { ExerciseEntry, ExerciseHistoryPoint, ExercisePR } from '../api'
import ExerciseProgressionChart from '../components/ExerciseProgressionChart'

export default function LiftingPage() {
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
      if (names.length > 0) setSelectedExercise(names[0])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedExercise) return
    api.exerciseHistory(selectedExercise, '90d').then(setHistory)
  }, [selectedExercise])

  if (loading) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-text mb-1">Lifting</h1>
        <p className="text-text-muted">Track your strength progression</p>
      </div>

      {exerciseNames.length === 0 ? (
        <div className="text-center text-text-muted py-16">
          <p className="text-lg mb-2">No exercises logged yet</p>
          <p className="text-sm">Log lifts via Telegram to see your progression!</p>
          <p className="text-xs mt-2 text-text-dim">Example: "Deadlift 200lbs 3x5"</p>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
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
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <h2 className="text-lg font-medium text-text mb-4">{selectedExercise} Progression</h2>
              <ExerciseProgressionChart data={history} />
            </div>
          )}

          {/* Personal Records */}
          {prs.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <h2 className="text-lg font-medium text-text mb-4">Personal Records</h2>
              <div className="space-y-3">
                {prs.map((pr) => (
                  <div key={pr.exercise_name} className="flex justify-between items-center">
                    <span className="text-text font-medium">{pr.exercise_name}</span>
                    <div className="text-right">
                      <span className="text-accent-green font-bold">{pr.weight_lbs} lbs</span>
                      <span className="text-text-muted ml-2">{pr.sets}x{pr.reps}</span>
                      <span className="text-text-dim text-xs ml-2">
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
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 lg:px-6 py-4 border-b border-border">
                <h2 className="text-lg font-medium text-text">Recent Sessions (30d)</h2>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {recentExercises.map((ex, i) => (
                  <div key={i} className="px-4 lg:px-6 py-3 flex justify-between items-center">
                    <div>
                      <span className="text-text font-medium">{ex.exercise_name}</span>
                      <span className="text-text-dim text-xs ml-2">
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
        </>
      )}
    </div>
  )
}
