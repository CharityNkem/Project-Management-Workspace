import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth({ initialMode = 'signin', initialEmail = '', onBack }) {
  const [mode, setMode] = useState(initialMode) // 'signin' | 'signup' | 'reset'
  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail || '')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const go = (next) => { setMode(next); setMsg(null) }

  const submit = async () => {
    const e = email.trim().toLowerCase()

    if (mode === 'reset') {
      if (!e) return setMsg({ kind: 'err', text: 'Enter your email address.' })
      setBusy(true); setMsg(null)
      const { error } = await supabase.auth.resetPasswordForEmail(e, { redirectTo: window.location.origin })
      setBusy(false)
      if (error) return setMsg({ kind: 'err', text: error.message })
      return setMsg({ kind: 'ok', text: 'If an account exists for that email, a reset link is on its way. Check your inbox (and spam).' })
    }

    if (!e || !pass) return setMsg({ kind: 'err', text: 'Enter your email and password.' })
    if (mode === 'signup' && !name.trim()) return setMsg({ kind: 'err', text: 'Add your full name so teammates recognise you.' })
    setBusy(true); setMsg(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: e, password: pass, options: { data: { full_name: name.trim() } } })
        if (error) throw error
        setMsg({ kind: 'ok', text: 'Account created. Check your inbox to confirm your email, then sign in.' })
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: e, password: pass })
        if (error) throw error
      }
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'
  const sub = mode === 'signup' ? 'Set up access to your projects.' : mode === 'reset' ? "We'll email you a link to set a new password." : 'Sign in to continue.'
  const cta = mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'

  return (
    <div className="auth-view">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="logo-chip"><img src="/hope365-logo.png" alt="Hope365" /></div>
          <span className="wordmark">Hope365 Workspace</span>
        </div>
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
        {msg && <div className={`msg ${msg.kind}`}>{msg.text}</div>}

        {mode === 'signup' && (
          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Imisi Owolabi" />
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hope365network.org" />
        </div>

        {mode !== 'reset' && (
          <div className="field">
            <label>Password</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="••••••••" />
            {mode === 'signin' && (
              <div className="forgot"><a onClick={() => go('reset')}>Forgot password?</a></div>
            )}
          </div>
        )}

        <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Please wait…' : cta}</button>

        <div className="auth-toggle">
          {mode === 'signin' && <>New here? <a onClick={() => go('signup')}>Create an account</a></>}
          {mode === 'signup' && <>Already have an account? <a onClick={() => go('signin')}>Sign in</a></>}
          {mode === 'reset' && <a onClick={() => go('signin')}>Back to sign in</a>}
        </div>
        {onBack && <div className="auth-back"><a onClick={onBack}>← Back to start</a></div>}
      </div>
    </div>
  )
}
