import { useState } from 'react'
import { useDisciplines } from '../hooks/useDisciplines'

function ProfileSetup({ onComplete, onSave, onSkip, onSignOut, getHeaders }) {
  const { disciplines, loading: disciplinesLoading } = useDisciplines(getHeaders)
  const [selected, setSelected] = useState(new Set())
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const toggle = (code) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const handleSave = async () => {
    if (selected.size === 0) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        disciplineCodes: [...selected],
        heightCm: heightCm ? parseInt(heightCm, 10) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
      })
      onComplete()
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-setup">
      <div className="profile-setup-card fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <h1 className="profile-setup-title" style={{ marginBottom: 0 }}>
            Welcome to <span>PR</span>BOARD
          </h1>
          <button className="logout-btn" onClick={onSignOut}>Sign out</button>
        </div>
        <p className="profile-setup-subtitle">
          Pick the sports you train for. You can change this any time in settings.
        </p>

        <div className="profile-setup-section">
          <span className="profile-setup-label">Your sports *</span>
          {disciplinesLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Waking up the server, this may take a moment...
            </p>
          ) : (
            <div className="sport-picker">
              {disciplines.map(({ code, displayName }) => (
                <button
                  key={code}
                  data-discipline={code}
                  className={`sport-picker-btn ${selected.has(code) ? 'selected' : ''}`}
                  onClick={() => toggle(code)}
                >
                  <span className="sport-nav-dot" />
                  {displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="profile-setup-section">
          <span className="profile-setup-label">
            Your stats{' '}
            <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: '0.7rem' }}>
              (optional — needed for Wilks score)
            </span>
          </span>
          <div className="profile-fields">
            <div className="profile-field">
              <label>Height</label>
              <input
                type="number"
                placeholder="e.g. 178"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                min={100}
                max={250}
              />
              <span className="field-hint">cm</span>
            </div>
            <div className="profile-field">
              <label>Weight</label>
              <input
                type="number"
                placeholder="e.g. 82.5"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                min={30}
                max={300}
                step={0.5}
              />
              <span className="field-hint">kg</span>
            </div>
          </div>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: '16px' }}>{error}</div>}

        <button
          className="btn-primary"
          disabled={selected.size === 0 || saving || disciplinesLoading}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : 'Get started'}
        </button>

        <button
          onClick={onSkip}
          style={{
            display: 'block', width: '100%', marginTop: '12px',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)', fontSize: '0.82rem',
            cursor: 'pointer', textAlign: 'center', padding: '8px',
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

export default ProfileSetup