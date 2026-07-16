import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function UpdatePassword({ onDone }) {
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (pass.length < 8) return setMsg({ kind: 'err', text: 'Use at least 8 characters.' })
    if (pass !== pass2) return setMsg({ kind: 'err', text: 'The two passwords do not match.' })
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ password: pass })
    setBusy(false)
    if (error) return setMsg({ kind: 'err', text: error.message })
    setMsg({ kind: 'ok', text: 'Password updated. Taking you in…' })
    setTimeout(onDone, 900)
  }

  return (
    <div className="auth-view">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="logo-chip"><img src="/hope365-logo.png" alt="Hope365" /></div>
          <span className="wordmark">Hope365 Workspace</span>
        </div>
        <h1>Set a new password</h1>
        <p className="sub">Choose a new password for your account.</p>
        {msg && <div className={`msg ${msg.kind}`}>{msg.text}</div>}
        <div className="field">
          <label>New password</label>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoFocus />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="••••••••" />
        </div>
        <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
      </div>
    </div>
  )
}
