import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, History, Dumbbell, LogOut } from 'lucide-react'
import { useAuth } from '../AuthContext'
import LoginPage from './LoginPage'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/daily', label: 'Daily', icon: Calendar },
  { to: '/history', label: 'Log History', icon: History },
  { to: '/lifting', label: 'Lifting', icon: Dumbbell },
]

export default function Layout() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  const initials = (user.display_name || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-semibold text-text flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-bg" />
            </div>
            Nutrimind
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent-green text-bg font-medium'
                    : 'text-text-secondary hover:bg-card-hover hover:text-text'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-border rounded-full flex items-center justify-center">
              <span className="text-accent-green font-medium text-sm">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text text-sm font-medium truncate">{user.display_name?.split(' ')[0] || 'User'}</p>
            </div>
            <button onClick={logout} className="text-text-muted hover:text-text transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent-green rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-bg" />
            </div>
            <span className="text-lg font-semibold text-text">Nutrimind</span>
          </div>
          <button onClick={logout} className="text-text-muted hover:text-text">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-accent-green' : 'text-text-muted'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
