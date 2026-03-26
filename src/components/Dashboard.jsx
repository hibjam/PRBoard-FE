import { useEffect, useState, useCallback, useRef } from 'react'
import StatsCards from './StatsCards'
import RecentActivities from './RecentActivities'
import TrendChart from './TrendChart'
import PrSection from './PrSection'
import axios from 'axios'
import WakingUp from './WakingUp'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const MAX_SELECTED = 3

const DISCIPLINE_CONFIG = {
  RUN:          { label: 'Running' },
  TRAIL_RUN:    { label: 'Trail running' },
  BIKE:         { label: 'Cycling' },
  SWIM:         { label: 'Swimming' },
  ROW:          { label: 'Rowing' },
  HIKE:         { label: 'Hiking' },
  WEIGHTLIFT:   { label: 'Weightlifting' },
  POWERLIFTING: { label: 'Powerlifting' },
  OLYMPIC_LIFT: { label: 'Olympic lifting' },
}

const ENDURANCE_DISCIPLINES = new Set(['RUN', 'TRAIL_RUN', 'BIKE', 'SWIM', 'ROW', 'HIKE'])
const LIFTING_DISCIPLINES   = new Set(['WEIGHTLIFT', 'POWERLIFTING', 'OLYMPIC_LIFT'])

function oneMonthAgo() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().split('T')[0]
}

function Dashboard({ profile, getHeaders, onEditProfile }) {
  const [recent, setRecent]                = useState([])
  const [trends, setTrends]                = useState([])
  const [prs, setPrs]                      = useState([])
  const [groupBy, setGroupBy]              = useState('monthly')
  const [trendFrom, setTrendFrom]          = useState(oneMonthAgo())
  const [trendTo, setTrendTo]              = useState('')
  const [selectedDisciplines, setSelected] = useState(new Set())
  const [loading, setLoading]              = useState(true)
  const [syncing, setSyncing]              = useState(false)
  const [connectingStrava, setConnecting]  = useState(false)
  const [error, setError]                  = useState(null)

  const groupByRef = useRef(groupBy)
  const fromRef    = useRef(trendFrom)
  const toRef      = useRef(trendTo)

  useEffect(() => { groupByRef.current = groupBy   }, [groupBy])
  useEffect(() => { fromRef.current    = trendFrom }, [trendFrom])
  useEffect(() => { toRef.current      = trendTo   }, [trendTo])

  // Initialise selected disciplines from profile
  useEffect(() => {
    if (profile?.disciplines?.length > 0 && selectedDisciplines.size === 0) {
      setSelected(new Set([profile.disciplines[0]]))
    }
  }, [profile])

  const fetchAll = useCallback(async (silent) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const headers = await getHeaders()

      const fromParam = fromRef.current ? `&from=${new Date(fromRef.current + 'T00:00:00Z').toISOString()}` : ''
      const toParam   = toRef.current   ? `&to=${new Date(toRef.current   + 'T23:59:59Z').toISOString()}`   : ''

      const [recentRes, trendsRes, prsRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/stats/recent?limit=50`, { headers }),
        axios.get(`${API_BASE}/stats/trends?groupBy=${groupByRef.current}${fromParam}${toParam}`, { headers }),
        axios.get(`${API_BASE}/stats/prs`, { headers }),
      ])

      if (recentRes.status === 'fulfilled') setRecent(recentRes.value.data)
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data)
      if (prsRes.status    === 'fulfilled') setPrs(prsRes.value.data)
    } catch (e) {
      console.error('Dashboard fetch error:', e)
      setError('Failed to load data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [getHeaders])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    fetchAll(true)
  }, [groupBy, trendFrom, trendTo])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('stravaConnected') === 'true') {
      window.history.replaceState({}, '', '/')
      syncStrava()
    }
  }, [])

  const toggleDiscipline = (code) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(code)) {
        if (next.size === 1) return prev
        next.delete(code)
      } else {
        if (next.size >= MAX_SELECTED) return prev
        next.add(code)
      }
      return next
    })
  }

  const connectStrava = async () => {
    try {
      setConnecting(true)
      const headers = await getHeaders()
      const res = await axios.get(`${API_BASE}/auth/strava`, { headers })
      window.location.href = res.data.url
    } catch (e) {
      console.error(e)
      setError('Failed to initiate Strava connection. Please try again.')
      setConnecting(false)
    }
  }

  const syncStrava = async () => {
    try {
      setSyncing(true)
      setError(null)
      const headers = await getHeaders()
      await axios.post(`${API_BASE}/activities/sync/strava`, {}, { headers })
      await fetchAll(true)
    } catch (e) {
      console.error(e)
      setError(e.response?.status === 500
        ? 'No Strava connection found. Please connect Strava first.'
        : 'Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
      return <WakingUp message="Just waking up... Then loading your dashboard..." />
  }

  if (!profile?.disciplines?.length) {
    return (
      <div className="empty-state">
        <p>Select some sports to get started.</p>
        <button className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }} onClick={onEditProfile}>
          Set up your profile
        </button>
      </div>
    )
  }

  const selectedRecent  = recent.filter(a => selectedDisciplines.has(a.discipline))
  const selectedPrs     = prs.filter(p => selectedDisciplines.has(p.discipline))
  const enduranceTrends = trends.filter(t =>
    ENDURANCE_DISCIPLINES.has(t.discipline) && selectedDisciplines.has(t.discipline))
  const liftingTrends   = trends.filter(t =>
    LIFTING_DISCIPLINES.has(t.discipline) && selectedDisciplines.has(t.discipline))

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar">
        <button className="btn-connect-strava" onClick={connectStrava} disabled={connectingStrava}>
          {connectingStrava ? 'Connecting...' : 'Connect Strava'}
        </button>
        <button className="btn-sync" onClick={syncStrava} disabled={syncing}>
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-top-row">
        <nav className="sport-nav">
          {profile.disciplines.map(discipline => {
            const config = DISCIPLINE_CONFIG[discipline] ?? { label: discipline }
            const active = selectedDisciplines.has(discipline)
            const maxed  = !active && selectedDisciplines.size >= MAX_SELECTED
            return (
              <button
                key={discipline}
                data-discipline={discipline}
                className={`sport-nav-btn ${active ? 'active' : ''} ${maxed ? 'maxed' : ''}`}
                onClick={() => !maxed && toggleDiscipline(discipline)}
                title={maxed ? 'Maximum 3 sports selected' : undefined}
              >
                <span className="sport-nav-dot" />
                {config.label}
              </button>
            )
          })}
        </nav>
      </div>

      <StatsCards
        disciplines={[...selectedDisciplines]}
        getHeaders={getHeaders}
        preferredUnits={profile?.preferredUnits ?? 'km'}
      />

      {selectedPrs.length > 0 && (
        <PrSection
          prs={selectedPrs}
          getHeaders={getHeaders}
          onRefresh={() => fetchAll(true)}
          preferredUnits={profile?.preferredUnits ?? 'km'}
        />
      )}

      {enduranceTrends.length > 0 && (
        <div className="panel fade-in" style={{ marginBottom: '16px' }}>
          <div className="panel-header">
            <span className="panel-title">Endurance trends</span>
            <div className="chart-controls">
              <div className="trend-toggle">
                <button className={groupBy === 'weekly'  ? 'active' : ''} onClick={() => setGroupBy('weekly')}>Weekly</button>
                <button className={groupBy === 'monthly' ? 'active' : ''} onClick={() => setGroupBy('monthly')}>Monthly</button>
              </div>
              <div className="date-range">
                <input type="date" className="date-input" value={trendFrom} onChange={e => setTrendFrom(e.target.value)} />
                <span className="date-sep">—</span>
                <input type="date" className="date-input" value={trendTo} onChange={e => setTrendTo(e.target.value)} />
              </div>
            </div>
          </div>
          <TrendChart
            trends={enduranceTrends}
            disciplines={[...selectedDisciplines].filter(d => ENDURANCE_DISCIPLINES.has(d))}
            type="endurance"
          />
        </div>
      )}

      {liftingTrends.length > 0 && (
        <div className="panel fade-in" style={{ marginBottom: '16px' }}>
          <div className="panel-header">
            <span className="panel-title">Lifting trends</span>
            <div className="trend-toggle">
              <button className={groupBy === 'weekly'  ? 'active' : ''} onClick={() => setGroupBy('weekly')}>Weekly</button>
              <button className={groupBy === 'monthly' ? 'active' : ''} onClick={() => setGroupBy('monthly')}>Monthly</button>
            </div>
          </div>
          <TrendChart
            trends={liftingTrends}
            disciplines={[...selectedDisciplines].filter(d => LIFTING_DISCIPLINES.has(d))}
            type="lifting"
          />
        </div>
      )}

      <RecentActivities activities={selectedRecent} preferredUnits={profile?.preferredUnits ?? 'km'} />
    </div>
  )
}

export default Dashboard