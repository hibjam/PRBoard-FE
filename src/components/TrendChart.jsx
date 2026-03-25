import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const DISCIPLINE_COLOUR = {
  RUN:          '#ff4d6d',
  TRAIL_RUN:    '#f97316',
  BIKE:         '#3b82f6',
  SWIM:         '#00d4aa',
  ROW:          '#06b6d4',
  HIKE:         '#84cc16',
  WEIGHTLIFT:   '#a855f7',
  POWERLIFTING: '#c084fc',
  OLYMPIC_LIFT: '#e879f9',
}

const DISCIPLINE_LABEL = {
  RUN:          'Running',
  TRAIL_RUN:    'Trail running',
  BIKE:         'Cycling',
  SWIM:         'Swimming',
  ROW:          'Rowing',
  HIKE:         'Hiking',
  WEIGHTLIFT:   'Weightlifting',
  POWERLIFTING: 'Powerlifting',
  OLYMPIC_LIFT: 'Olympic lifting',
}

function getColour(discipline) {
  return DISCIPLINE_COLOUR[discipline] ?? '#6b7280'
}

function CustomTooltip({ active, payload, label, type }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: '#1a1e2a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>
        {label}
      </p>
      {payload.map(entry => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e8eaf0' }}>
            {DISCIPLINE_LABEL[entry.dataKey] ?? entry.dataKey}:
          </span>
          <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            {type === 'lifting'
              ? `${entry.value} sessions`
              : `${entry.value?.toFixed(1)} km`}
          </span>
        </div>
      ))}
    </div>
  )
}

function TrendChart({ trends, disciplines, type }) {
  const isLifting = type === 'lifting'

  const periods = [...new Set(trends.map(t => t.period))].sort()

  const chartData = periods.map(period => {
    const row = { period }
    disciplines.forEach(disc => {
      const point = trends.find(t => t.period === period && t.discipline === disc)
      row[disc] = isLifting
        ? (point?.count ?? 0)
        : parseFloat(point?.totalDistanceKm ?? 0)
    })
    return row
  })

  if (chartData.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
        No data yet for this period.
      </div>
    )
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            {disciplines.map(disc => (
              <linearGradient key={disc} id={`grad-${disc}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={getColour(disc)} stopOpacity={0.15} />
                <stop offset="95%" stopColor={getColour(disc)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'Outfit' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'Outfit' }}
            axisLine={false}
            tickLine={false}
            unit={isLifting ? '' : 'km'}
          />
          <Tooltip content={<CustomTooltip type={type} />} />
          {disciplines.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={7}
              formatter={val => DISCIPLINE_LABEL[val] ?? val}
              wrapperStyle={{ fontSize: '0.72rem', fontFamily: 'Outfit', paddingTop: '8px', color: '#9ca3af' }}
            />
          )}
          {disciplines.map(disc => (
            <Area
              key={disc}
              type="monotone"
              dataKey={disc}
              stroke={getColour(disc)}
              strokeWidth={2}
              fill={`url(#grad-${disc})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendChart