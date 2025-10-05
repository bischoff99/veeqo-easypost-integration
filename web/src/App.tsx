import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import GoogleAuth from './auth/GoogleAuth'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import RateComparison from './pages/RateComparison'
import History from './pages/History'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      setIsAuthenticated(true)
      const userData = localStorage.getItem('user_data')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setIsAuthenticated(false)
    setUser(null)
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  if (!isAuthenticated) {
    return <GoogleAuth onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="app">
        <Header user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rates" element={<RateComparison />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
