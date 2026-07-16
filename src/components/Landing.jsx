const ProjectIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)
const TrackIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
)
const AlignIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export default function Landing({ onSignIn, onSignUp }) {
  return (
    <div className="landing">
      <div className="deco-ring" />

      <header className="landing-nav">
        <div className="landing-brand">
          <div className="logo-chip"><img src="/hope365-logo.png" alt="Hope365" /></div>
          <span className="wordmark">Hope365 Workspace</span>
        </div>
        <div className="landing-nav-actions">
          <button className="ln-ghost" onClick={onSignIn}>Sign in</button>
          <button className="ln-solid" onClick={onSignUp}>Create account</button>
        </div>
      </header>

      <main className="landing-hero">
        <div className="hero-logo"><img src="/hope365-logo.png" alt="Hope365" /></div>
        <h1>The shared workspace for <span className="hl">Hope365</span> teams</h1>
        <p className="hero-sub">Plan projects, assign tasks, and move work forward together — one calm place for every ministry, event, and team.</p>
        <div className="hero-cta">
          <button className="ln-solid lg" onClick={onSignUp}>Get started</button>
          <button className="ln-ghost lg" onClick={onSignIn}>Sign in</button>
        </div>
      </main>

      <section className="landing-features">
        <div className="feature">
          <div className="feature-icon"><ProjectIcon /></div>
          <h3>Organize by project</h3>
          <p>Group work into projects for each ministry, event, or initiative — and see them all in one place.</p>
        </div>
        <div className="feature">
          <div className="feature-icon"><TrackIcon /></div>
          <h3>Assign &amp; track tasks</h3>
          <p>Give every task an owner, a due date, and a clear status on a board or a list.</p>
        </div>
        <div className="feature">
          <div className="feature-icon"><AlignIcon /></div>
          <h3>Stay aligned</h3>
          <p>Comments, subtasks, and a shared view keep everyone on the same page.</p>
        </div>
      </section>

      <footer className="landing-foot">
        <span>Hope365 Network</span>
        <span className="dot">·</span>
        <a href="https://hope365network.org" target="_blank" rel="noreferrer">hope365network.org</a>
      </footer>
    </div>
  )
}
