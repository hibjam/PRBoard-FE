import { useEffect, useState, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import ProfileSetup from './components/ProfileSetup'
import ProfilePage from './components/ProfilePage'
import PrivacyPolicy from './components/PrivacyPolicy'
import './App.css'

function WakingUp() {
  const [showMessage, setShowMessage] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowMessage(true), 4000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="loading-screen">
      <div className="loading-logo"><span>PR</span>BOARD</div>
      <div className="loading-bar" />
      {showMessage && (
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', marginTop: '16px' }}>
          Hang tight, PRBoard is just waking up...
        </p>
      )}
    </div>
  )
}

function App() {
  const { isLoading, isAuthenticated, loginWithRedirect, user, getAccessTokenSilently, logout } = useAuth0()
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'profile' | 'privacy'

  const getHeaders = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: 'https://api.prboard.app' }
    })
    return { Authorization: `Bearer ${token}` }
  }, [getAccessTokenSilently])

  const fetchProfile = useCallback(async () => {
    try {
      const headers = await getHeaders()
      const res = await axios.get(`${API_BASE}/users/profile`, {
        headers,
        timeout: 60000, // 60s timeout to allow for Render cold start
      })
      setProfile(res.data)
    } catch (e) {
      console.error('Failed to load profile', e)
      setProfile({ profileComplete: false, disciplines: [] })
    } finally {
      setProfileLoading(false)
    }
  }, [getHeaders])

  useEffect(() => {
    if (isAuthenticated) fetchProfile()
  }, [isAuthenticated, fetchProfile])

  const handleSaveProfile = async (data) => {
    const headers = await getHeaders()
    const res = await axios.patch(`${API_BASE}/users/profile`, data, { headers })
    setProfile(res.data)
  }

  const handleSignOut = () => logout({ logoutParams: { returnTo: window.location.origin } })

  // Privacy policy accessible without login
  if (view === 'privacy') {
    return <PrivacyPolicy onBack={() => setView('dashboard')} />
  }

  if (isLoading || (isAuthenticated && profileLoading)) {
    return <WakingUp />
  }

  if (!isAuthenticated) {
    return (
      <div className="loading-screen">
        <div className="loading-logo"><span>PR</span>BOARD</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontFamily: 'var(--font-body)' }}>
          Track every km. Own every PR.
        </p>
        <button className="login-btn" onClick={() => loginWithRedirect()}>
          Sign in to continue
        </button>
        <button
          onClick={() => setView('privacy')}
          style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          Privacy Policy
        </button>
      </div>
    )
  }

  if (profile && !profile.profileComplete) {
    return (
      <ProfileSetup
        onSave={handleSaveProfile}
        onComplete={() => setProfileLoading(false)}
        onSkip={() => setProfile({ ...profile, profileComplete: false, skipped: true })}
        onSignOut={handleSignOut}
        getHeaders={getHeaders}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-pr">PR</span>
          <span className="logo-board">BOARD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {user.email}
          </span>
          <button className="btn-secondary" onClick={() => setView(v => v === 'profile' ? 'dashboard' : 'profile')}>
            {view === 'profile' ? 'Back to dashboard' : 'Edit profile'}
          </button>
          <button className="logout-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      {view === 'profile' ? (
        <ProfilePage
          profile={profile}
          getHeaders={getHeaders}
          onSave={async (data) => {
            await handleSaveProfile(data)
            setView('dashboard')
          }}
        />
      ) : (
        <Dashboard
          profile={profile}
          getHeaders={getHeaders}
          onEditProfile={() => setView('profile')}
        />
      )}

      <footer className="app-footer">
        <button onClick={() => setView('privacy')}>Privacy Policy</button>
      </footer>
    </div>
  )
}

export default App