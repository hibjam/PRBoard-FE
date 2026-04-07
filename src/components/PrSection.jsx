import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

const DISCIPLINE_LABEL = {
  RUN: 'Running', TRAIL_RUN: 'Trail running', BIKE: 'Cycling',
  SWIM: 'Swimming', ROW: 'Rowing', HIKE: 'Hiking',
  WEIGHTLIFT: 'Weightlifting', POWERLIFTING: 'Powerlifting', OLYMPIC_LIFT: 'Olympic lifting',
}

const PR_TYPE_LABEL = {
  FASTEST_DISTANCE: 'Fastest',
  LONGEST_ACTIVITY: 'Longest',
  BEST_POWER:       'Best power',
  HEAVIEST_SESSION: 'Heaviest session',
}

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

const KM_TO_MILES = 0.621371

function convertFormattedValue(formattedValue, prType, preferredUnits) {
  if (preferredUnits !== 'mi') return formattedValue
  if (prType === 'LONGEST_ACTIVITY' && formattedValue?.endsWith(' km')) {
    const km = parseFloat(formattedValue)
    const miles = (km * KM_TO_MILES).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    return `${miles} mi`
  }
  return formattedValue
}

function PrCard({ pr, onDelete, preferredUnits }) {
  const typeLabel    = PR_TYPE_LABEL[pr.prType] ?? pr.prType
  const targetLabel  = pr.targetLabel ? ` — ${pr.targetLabel}` : ''
  const canDelete    = pr.targetId && !pr.preset
  const displayValue = convertFormattedValue(pr.formattedValue, pr.prType, preferredUnits)

  return (
    <div className="pr-card" data-discipline={pr.discipline}>
      <div className="pr-card-type">
        {typeLabel}{targetLabel}
        {canDelete && (
          <button
            className="pr-card-delete"
            onClick={() => onDelete(pr.targetId)}
            title="Remove custom target"
          >×</button>
        )}
      </div>
      <div className="pr-card-value">{displayValue}</div>
      <div className="pr-card-meta">
        <span className="pr-card-activity" title={pr.activityName}>{pr.activityName}</span>
        <span className="pr-card-date">{formatDate(pr.achievedAt)}</span>
      </div>
    </div>
  )
}

function AddTargetForm({ disciplines, getHeaders, onAdded }) {
  const [disciplineCode, setDisciplineCode] = useState(() => disciplines[0] ?? '')
  const [distance, setDistance]             = useState('')
  const [unit, setUnit]                     = useState('km')
  const [label, setLabel]                   = useState('')
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState(null)

  const handleAdd = async () => {
    const parsed = parseFloat(distance)
    if (!distance || isNaN(parsed)) {
      setError('Enter a valid distance.')
      return
    }
    if (!Number.isInteger(parsed)) {
      setError('Distance must be a whole number (e.g. 14, not 14.5).')
      return
    }
    if (parsed < 1) {
      setError('Distance must be at least 1.')
      return
    }
    const metres = unit === 'km' ? parsed * 1000 : parsed

    setSaving(true)
    setError(null)
    try {
      const headers = await getHeaders()
      await axios.post(`${API_BASE}/stats/prs/targets`, {
        disciplineCode,
        distanceMetres: metres,
        label: label || null,
      }, { headers })
      await axios.post(`${API_BASE}/stats/prs/recalculate`, {}, { headers })
      setDistance('')
      setLabel('')
      onAdded()
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pr-add-form">
      <select
        className="pr-add-select"
        value={disciplineCode}
        onChange={e => setDisciplineCode(e.target.value)}
      >
        {disciplines.map(d => (
          <option key={d} value={d}>{DISCIPLINE_LABEL[d] ?? d}</option>
        ))}
      </select>

      <input
        type="number"
        className="pr-add-input"
        placeholder="Distance"
        value={distance}
        onChange={e => setDistance(e.target.value)}
        min={1}
        step={1}
      />

      <select
        className="pr-add-select"
        value={unit}
        onChange={e => setUnit(e.target.value)}
      >
        <option value="km">km</option>
        <option value="m">m</option>
      </select>

      <input
        type="text"
        className="pr-add-input"
        placeholder="Label (optional)"
        value={label}
        onChange={e => setLabel(e.target.value)}
        maxLength={30}
      />

      <button className="pr-add-btn" onClick={handleAdd} disabled={saving}>
        {saving ? '...' : '+ Add'}
      </button>

      {error && <span className="pr-add-error">{error}</span>}
    </div>
  )
}

function PrSection({ prs, getHeaders, onRefresh, preferredUnits = 'km' }) {
  const [showAdd, setShowAdd] = useState(false)

  const handleDelete = async (targetId) => {
    try {
      const headers = await getHeaders()
      await axios.delete(`${API_BASE}/stats/prs/targets/${targetId}`, { headers })
      onRefresh()
    } catch (e) {
      console.error('Failed to delete target', e)
    }
  }

  const grouped = prs.reduce((acc, pr) => {
    const key = pr.discipline
    if (!acc[key]) acc[key] = []
    acc[key].push(pr)
    return acc
  }, {})

  Object.values(grouped).forEach(records => {
    records.sort((a, b) => {
      const aD = a.targetDistanceMetres ?? Infinity
      const bD = b.targetDistanceMetres ?? Infinity
      return aD - bD
    })
  })

  const disciplines  = Object.keys(grouped)
  const hasStrava    = prs.some(pr => pr.source === 'STRAVA')

  return (
    <div className="pr-section fade-in" style={{ position: 'relative', paddingBottom: '30px' }}>
      <div className="pr-section-header">
        <span className="panel-title">Personal records</span>
        <button
          className="btn-secondary"
          style={{ fontSize: '0.72rem', padding: '4px 12px' }}
          onClick={() => setShowAdd(v => !v)}
        >
          {showAdd ? 'Cancel' : '+ Custom distance'}
        </button>
      </div>

      {showAdd && (
        <AddTargetForm
          disciplines={disciplines}
          getHeaders={getHeaders}
          onAdded={() => { setShowAdd(false); onRefresh() }}
        />
      )}

      <div className="pr-scroll">
        <div className="pr-track">
          {Object.entries(grouped).map(([discipline, records]) => (
            <div key={discipline} className="pr-discipline-group">
              <div className="pr-discipline-label" data-discipline={discipline}>
                <span className="sport-nav-dot" />
                {DISCIPLINE_LABEL[discipline] ?? discipline}
              </div>
              <div className="pr-cards-row">
                {records.map((pr, i) => (
                  <PrCard
                    key={`${pr.prType}-${pr.targetLabel ?? ''}-${i}`}
                    pr={pr}
                    onDelete={handleDelete}
                    preferredUnits={preferredUnits}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasStrava && (
        <img
          src="/api_logo_pwrdBy_strava_horiz_white.png"
          alt="Powered by Strava"
          title="Powered by Strava"
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '16px',
            height: '14px',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  )
}

export default PrSection