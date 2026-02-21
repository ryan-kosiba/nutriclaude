import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function AuthCallback() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      setError('No token provided')
      return
    }

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token expired or invalid')
        return res.json()
      })
      .then((data) => {
        login(data.session_token, data.user)
        navigate('/', { replace: true })
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
        <p className="text-accent-red text-lg mb-2">Login failed</p>
        <p className="text-text-muted text-sm">{error}</p>
        <p className="text-text-muted text-sm mt-4">
          Send <code className="text-text">/login</code> to the bot to get a fresh link.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-text-muted">Logging you in...</p>
    </div>
  )
}
