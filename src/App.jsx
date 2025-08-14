import React, { useState, useEffect } from 'react'
import MeetingScheduler from './components/MeetingScheduler'
import SimpleAuth from './components/SimpleAuth'

function App() {
  const [userToken, setUserToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if running in development mode
    const devMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'
    if (devMode) {
      setUserToken('myapp2025')
    }
    setLoading(false)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('app-token')
    setUserToken(null)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!userToken) {
    return <SimpleAuth onAuthSuccess={(token) => setUserToken(token)} />
  }

  return (
    <div className="App">
      <div className="app-header">
        <h1>Meeting Scheduler</h1>
        <div className="user-info">
          <span>Personal Schedule</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Lock App
          </button>
        </div>
      </div>
      <MeetingScheduler userToken={userToken} />
    </div>
  )
}

export default App
