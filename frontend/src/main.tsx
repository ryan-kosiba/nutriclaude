import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import AuthCallback from './components/AuthCallback'
import { AuthProvider } from './AuthContext'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const DailyPage = lazy(() => import('./pages/DailyPage'))
const LogHistoryPage = lazy(() => import('./pages/LogHistoryPage'))
const LiftingPage = lazy(() => import('./pages/LiftingPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))

function PageLoader() {
  return <div className="p-8 text-text-muted">Loading...</div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<AuthCallback />} />
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/daily" element={<DailyPage />} />
              <Route path="/history" element={<LogHistoryPage />} />
              <Route path="/lifting" element={<LiftingPage />} />
              <Route path="/goals" element={<GoalsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
