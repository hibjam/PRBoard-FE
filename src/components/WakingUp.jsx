import { useEffect, useState } from 'react'

function WakingUp({ message = 'Hang tight, PRBoard is just waking up...' }) {
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
        <p style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          marginTop: '16px'
        }}>
          {message}
        </p>
      )}
    </div>
  )
}

export default WakingUp