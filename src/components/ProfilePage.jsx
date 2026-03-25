import { useState } from 'react'
import { useDisciplines } from '../hooks/useDisciplines'

function ProfilePage({ profile, onSave, getHeaders }) {
  const { disciplines, loading: disciplinesLoading } = useDisciplines(getHeaders)
  const [selected, setSelected]       = useState(new Set(profile?.disciplines ?? []))
  const [heightCm, setHeightCm]       = useState(profile?.heightCm ?? '')
  const [weightKg, setWeightKg]       = useState(profile?.weightKg ?? '')
  const [units, setUnits]             = useState(profile?.preferredUnits ?? 'km')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)

  const toggle = (code) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const handleSave = async () => {
    if (selected.size === 0) {
      setError('Please select at least one sport.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        disciplineCodes: [...selected],
        heightCm: heightCm ? parseInt(heightCm, 10) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        preferredUnits: units,
      })
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="profile-setup" style={{ minHeight: 'auto', padding: '0' }}>
      <div className="profile-setup-card fade-in" style={{ maxWidth: '640px' }}>
        <h2 className="profile-setup-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
          Edit profile
        </h2>
        <p className="profile-setup-subtitle">
          Update your sports and personal stats.
        </p>

        <div className="profile-setup-section">
          <span className="profile-setup-label">Your sports *</span>
          {disciplinesLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading sports...</p>
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

        <div className="profile-setup-section">
          <span className="profile-setup-label">Distance units</span>
          <div className="units-toggle">
            <button
              className={`units-btn ${units === 'km' ? 'active' : ''}`}
              onClick={() => setUnits('km')}
            >
              Kilometres (km)
            </button>
            <button
              className={`units-btn ${units === 'mi' ? 'active' : ''}`}
              onClick={() => setUnits('mi')}
            >
              Miles (mi)
            </button>
          </div>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: '16px' }}>{error}</div>}

        <button
          className="btn-primary"
          disabled={saving || disciplinesLoading}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export default ProfilePage