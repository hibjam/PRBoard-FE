import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const KM_TO_MILES = 0.621371

const PERIOD_LABELS = {
  WEEK:     'Past week',
  MONTH:    'Past month',
  YEAR:     'Past 12 months',
  ALL_TIME: 'All time',
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDist(km, units) {
  if (km == null) return '—'
  const val = units === 'mi' ? parseFloat(km) * KM_TO_MILES : parseFloat(km)
  return val.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

function unitLabel(units) { return units === 'mi' ? 'mi' : 'km' }


function formatElevation(metres) {
  if (metres == null) return '—'
  return parseFloat(metres).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'm'
}

function formatVolume(kg) {
  if (kg == null) return '—'
  return parseFloat(kg).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const DISCIPLINE_CONFIG = {
  RUN:          { label: 'Running',         cssClass: 'run' },
  TRAIL_RUN:    { label: 'Trail running',   cssClass: 'trail-run' },
  BIKE:         { label: 'Cycling',         cssClass: 'bike' },
  SWIM:         { label: 'Swimming',        cssClass: 'swim' },
  ROW:          { label: 'Rowing',          cssClass: 'row' },
  HIKE:         { label: 'Hiking',          cssClass: 'hike' },
  WEIGHTLIFT:   { label: 'Weightlifting',   cssClass: 'weightlift' },
  POWERLIFTING: { label: 'Powerlifting',    cssClass: 'powerlifting' },
  OLYMPIC_LIFT: { label: 'Olympic lifting', cssClass: 'olympic-lift' },
}

function Stat({ value, label }) {
  return (
    <div className="stat-secondary">
      <span className="stat-secondary-value">{value}</span>
      <span className="stat-secondary-label">{label}</span>
    </div>
  )
}

function PeriodToggle({ period, onChange }) {
  return (
    <div className="period-filter card-period-filter">
      {[
        { key: 'WEEK',     label: '1W' },
        { key: 'MONTH',    label: '1M' },
        { key: 'YEAR',     label: '1Y' },
        { key: 'ALL_TIME', label: 'All' },
      ].map(({ key, label }) => (
        <button
          key={key}
          className={`period-btn ${period === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function EnduranceStats({ stat, units }) {
  const hasElevation = stat.totalElevationMetres != null && parseFloat(stat.totalElevationMetres) > 0
  const hasHr        = stat.avgHeartRate != null
  const ul           = unitLabel(units)

  return (
    <>
      <div className="stat-primary">
        <span className="stat-number">{formatDist(stat.totalDistanceKm, units)}</span>
        <span className="stat-unit">{ul}</span>
      </div>

      <div className="stat-grid">
        <Stat value={stat.count}                                           label="Activities" />
        <Stat value={formatDuration(stat.totalDurationSeconds)}            label="Total time" />
        <Stat value={`${formatDist(stat.longestActivityKm, units)} ${ul}`} label="Longest" />
        <Stat value={`${formatDist(stat.avgDistanceKm, units)} ${ul}`}     label="Avg distance" />
        {stat.avgPacePerKm && (
          <Stat value={stat.avgPacePerKm}                                  label="Avg pace" />
        )}
        {stat.currentWeeklyStreak > 0 && (
          <Stat value={`${stat.currentWeeklyStreak}w`}                     label="Streak" />
        )}
        {hasElevation && (
          <Stat value={formatElevation(stat.totalElevationMetres)}         label="Total elevation" />
        )}
        {hasElevation && stat.bestElevationMetres && (
          <Stat value={formatElevation(stat.bestElevationMetres)}          label="Best elevation" />
        )}
        {hasHr && (
          <Stat value={`${stat.avgHeartRate} bpm`}                         label="Avg heart rate" />
        )}
        {hasHr && stat.peakAvgHeartRate && (
          <Stat value={`${stat.peakAvgHeartRate} bpm`}                     label="Peak avg HR" />
        )}
      </div>
    </>
  )
}

function WeightliftingStats({ stat }) {
  return (
    <>
      <div className="stat-primary">
        <span className="stat-number">{formatVolume(stat.totalDistanceKm)}</span>
        <span className="stat-unit">kg</span>
      </div>

      <div className="stat-grid">
        <Stat value={stat.count}                                       label="Sessions" />
        <Stat value={formatDuration(stat.totalDurationSeconds)}        label="Total time" />
        <Stat value={`${formatVolume(stat.longestActivityKm)} kg`}     label="Heaviest session" />
        <Stat value={`${formatVolume(stat.avgDistanceKm)} kg`}         label="Avg volume" />
        {stat.currentWeeklyStreak > 0 && (
          <Stat value={`${stat.currentWeeklyStreak}w`}                 label="Streak" />
        )}
      </div>
    </>
  )
}

function StatCard({ discipline, getHeaders, index, preferredUnits }) {
  const [period, setPeriod]   = useState('MONTH')
  const [stat, setStat]       = useState(null)
  const [loading, setLoading] = useState(true)

  const config = DISCIPLINE_CONFIG[discipline] ?? {
    label:    discipline,
    cssClass: discipline.toLowerCase().replace(/_/g, '-'),
  }

  const fetchStat = useCallback(async (p) => {
    try {
      setLoading(true)
      const headers = await getHeaders()
      const res = await axios.get(`${API_BASE}/stats?period=${p}`, { headers })
      const found = res.data.find(s => s.discipline === discipline)
      setStat(found ?? null)
    } catch (e) {
      console.error('Failed to load stat for', discipline, e)
    } finally {
      setLoading(false)
    }
  }, [discipline, getHeaders])

  useEffect(() => { fetchStat('MONTH') }, [])

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    fetchStat(newPeriod)
  }

  return (
    <div
      className={`stat-card ${config.cssClass} fade-in`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="stat-card-bg-text">{config.label}</div>

      <div className="stat-card-header">
        <div className="discipline-badge">
          <span className="discipline-dot" />
          {config.label}
        </div>
        <PeriodToggle period={period} onChange={handlePeriodChange} />
      </div>

      {loading ? (
        <div className="stat-card-loading">Loading...</div>
      ) : stat ? (
        stat.disciplineType === 'WEIGHTLIFTING'
          ? <WeightliftingStats stat={stat} />
          : <EnduranceStats stat={stat} units={preferredUnits} />
      ) : (
        <div className="stat-card-loading">No data for this period.</div>
      )}
    </div>
  )
}

function StatsCards({ disciplines, getHeaders, preferredUnits = 'km' }) {
  return (
    <div className={`stats-row cards-${Math.min(disciplines.length, 3)}`}>
      {disciplines.map((discipline, i) => (
        <StatCard
          key={discipline}
          discipline={discipline}
          getHeaders={getHeaders}
          index={i}
          preferredUnits={preferredUnits}
        />
      ))}
    </div>
  )
}

export default StatsCards