import { useState } from 'react'
import DailyView from './components/DailyView'
import OverviewView from './components/OverviewView'

type Tab = 'overview' | 'daily'

function App() {
  const [tab, setTab] = useState<Tab>('daily')

  return (
    <div className="min-h-screen bg-bg px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-center mb-1">Health Tracking Dashboard</h1>
      <p className="text-text-muted text-sm text-center mb-4">Nutriclaude</p>

      {/* Tab bar */}
      <div className="flex justify-center gap-2 mb-6">
        {(['overview', 'daily'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-accent-green text-bg'
                : 'bg-card text-text-muted hover:bg-card-hover'
            }`}
          >
            {t === 'overview' ? 'Overview' : 'Daily'}
          </button>
        ))}
      </div>

      {tab === 'daily' ? <DailyView /> : <OverviewView />}
    </div>
  )
}

export default App
