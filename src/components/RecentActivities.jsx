function formatDuration(seconds) {
  if (!seconds) return '—'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function formatDayLabel(isoString) {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return { main: 'Today', sub: null }
  if (date.toDateString() === yesterday.toDateString()) return { main: 'Yesterday', sub: null }

  return {
    main: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    sub: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }
}

function groupByDay(activities) {
  const groups = []
  const seen = {}

  activities.forEach(activity => {
    const date = new Date(activity.startTime)
    const key = date.toDateString()

    if (!seen[key]) {
      seen[key] = { key, label: formatDayLabel(activity.startTime), activities: [] }
      groups.push(seen[key])
    }

    seen[key].activities.push(activity)
  })

  return groups
}

const DISCIPLINE_SHORT = {
  RUN:          'RUN',
  TRAIL_RUN:    'TRAIL',
  BIKE:         'RIDE',
  SWIM:         'SWIM',
  ROW:          'ROW',
  HIKE:         'HIKE',
  WEIGHTLIFT:   'LIFT',
  POWERLIFTING: 'PLift',
  OLYMPIC_LIFT: 'OLIS',
}

const KM_TO_MILES = 0.621371

function formatActivityDistance(km, units) {
  if (km == null || km === 0) return null
  if (units === 'mi') {
    const miles = parseFloat(km) * KM_TO_MILES
    return { value: miles.toFixed(1), unit: 'mi' }
  }
  return { value: parseFloat(km).toFixed(1), unit: 'km' }
}

function ActivityCard({ activity, preferredUnits }) {
  const shortLabel      = DISCIPLINE_SHORT[activity.discipline] ?? activity.discipline
  const isWeightlifting = ['WEIGHTLIFT', 'POWERLIFTING', 'OLYMPIC_LIFT'].includes(activity.discipline)
  const distDisplay     = !isWeightlifting && !activity.indoor
    ? formatActivityDistance(activity.distanceKm, preferredUnits)
    : null

  return (
    <div
      className="timeline-activity"
      data-discipline={activity.discipline}
    >
      <div className="timeline-activity-top">
        <span className="timeline-pill">
          {shortLabel}
        </span>
        {activity.indoor && !isWeightlifting && (
          <span className="timeline-indoor">Indoor</span>
        )}
      </div>

      <div className="timeline-activity-name">
        {activity.name || activity.discipline.toLowerCase()}
      </div>

      <div className="timeline-activity-stats">
        {distDisplay && (
          <span className="timeline-stat-primary">
            {distDisplay.value}
            <span className="timeline-stat-unit">{distDisplay.unit}</span>
          </span>
        )}
        {activity.pacePerKm && (
          <span className="timeline-stat-pace">{activity.pacePerKm}</span>
        )}
        <span className="timeline-stat-duration">{formatDuration(activity.durationSeconds)}</span>
      </div>
    </div>
  )
}

function RecentActivities({ activities, preferredUnits = 'km' }) {
  const days = groupByDay(activities)

  if (days.length === 0) {
    return (
      <div className="timeline-panel fade-in" style={{ animationDelay: '160ms' }}>
        <div className="panel-header">
          <span className="panel-title">Recent Activities</span>
        </div>
        <p className="empty" style={{ padding: '32px 0' }}>No activities yet.</p>
      </div>
    )
  }

  return (
    <div className="timeline-panel fade-in" style={{ animationDelay: '160ms' }}>
      <div className="panel-header">
        <span className="panel-title">Recent Activities</span>
      </div>

      <div className="timeline-scroll">
        <div className="timeline-track">
          {days.map(day => (
            <div key={day.key} className="timeline-day">
              <div className="timeline-day-label">
                <span className="timeline-day-main">{day.label.main}</span>
                {day.label.sub && (
                  <span className="timeline-day-sub">{day.label.sub}</span>
                )}
              </div>
              <div className="timeline-day-activities">
                {day.activities.map(activity => (
                  <ActivityCard key={activity.externalId} activity={activity} preferredUnits={preferredUnits} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecentActivities