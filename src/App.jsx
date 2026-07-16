import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Landing from './components/Landing'
import Auth from './components/Auth'
import Workspace from './components/Workspace'
import UpdatePassword from './components/UpdatePassword'

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const [authMode, setAuthMode] = useState(null) // null = landing; 'signin' | 'signup' = auth screen
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const inv = new URLSearchParams(window.location.search).get('invite')
    if (inv) {
      setInviteEmail(inv)
      setAuthMode('signup')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (!ready) return <div className="boot">Loading…</div>
  if (recovery) return <UpdatePassword onDone={() => setRecovery(false)} />
  if (session) return <Workspace session={session} />
  if (authMode) return <Auth initialMode={authMode} initialEmail={inviteEmail} onBack={() => setAuthMode(null)} />
  return <Landing onSignIn={() => setAuthMode('signin')} onSignUp={() => setAuthMode('signup')} />
}
