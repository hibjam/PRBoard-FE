function PrivacyPolicy({ onBack }) {
  return (
    <div className="privacy-page">
      <div className="privacy-content">
        <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '32px' }}>
          ← Back
        </button>

        <div className="logo" style={{ marginBottom: '32px' }}>
          <span className="logo-pr">PR</span>
          <span className="logo-board">BOARD</span>
        </div>

        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: March 2026</p>

        <h2>Who we are</h2>
        <p>PRBoard is a personal training dashboard that aggregates fitness data from connected services.</p>

        <h2>What data we collect</h2>
        <p>When you use PRBoard, we collect and store:</p>
        <ul>
          <li><strong>Account information</strong> — your email address, provided via Auth0 authentication</li>
          <li><strong>Profile information</strong> — height, weight, preferred units, and selected sports, which you provide voluntarily</li>
          <li><strong>Fitness activity data</strong> — activities, distances, durations, heart rate, elevation, and pace data imported from connected services such as Strava</li>
          <li><strong>Personal records</strong> — calculated from your activity data</li>
        </ul>
        <p>We do not collect payment information or any data beyond what is necessary to provide the service.</p>

        <h2>How we use your data</h2>
        <p>Your data is used solely to display your fitness statistics, trends, and personal records. We do not sell your data. We do not use your data for advertising.</p>

        <h2>Third-party services</h2>
        <ul>
          <li><strong>Auth0</strong> — handles authentication</li>
          <li><strong>Strava</strong> — activity data is read with your explicit authorisation. We only request read access.</li>
          <li><strong>Neon</strong> — database provider</li>
          <li><strong>Render</strong> — backend hosting provider</li>
        </ul>

        <h2>Data retention</h2>
        <p>Your data is retained for as long as you have an account. You can request deletion by contacting us.</p>

        <h2>Your rights</h2>
        <p>You have the right to access, correct, or delete your data, and to disconnect any integrated service at any time.</p>

        <h2>Security</h2>
        <p>We use HTTPS for all data transmission. Access requires authentication via Auth0. We do not store passwords.</p>
      </div>
    </div>
  )
}

export default PrivacyPolicy
