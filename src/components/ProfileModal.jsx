import { useState } from 'react'

export default function ProfileModal({ profile, email, onClose, onSave, onDeleteAccount }) {
  const [name, setName] = useState(profile?.full_name || '')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [delMsg, setDelMsg] = useState(null)
  const [delBusy, setDelBusy] = useState(false)

  const save = async () => {
    if (!name.trim()) return setMsg('Your name cannot be empty.')
    setBusy(true)
    const { error } = await onSave(name.trim())
    setBusy(false)
    if (error) setMsg(error)
    else onClose()
  }

  const doDelete = async () => {
    setDelBusy(true); setDelMsg(null)
    const res = await onDeleteAccount?.()
    setDelBusy(false)
    if (res?.ok) return // the app signs out and this modal unmounts
    if (res?.soleAdmin) {
      const list = res.projects.join(', ')
      const many = res.projects.length > 1
      setDelMsg(`You're currently the only admin of: ${list}. Please make someone else an admin of ${many ? 'those projects' : 'that project'} (or delete ${many ? 'them' : 'it'}) first — then you can delete your account.`)
      return
    }
    setDelMsg(res?.error || 'Could not delete your account. Please try again.')
  }

  return (
    <div className="overlay" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="modal">
        <h3>Your profile</h3>
        {msg && <div className="msg err">{msg}</div>}
        <div className="field">
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={email} disabled />
        </div>
        <p className="hint">Your email is your login and can't be changed here.</p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-go" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>

        {onDeleteAccount && (
          <div className="danger-zone">
            <div className="danger-head">Danger zone</div>
            {!confirmOpen ? (
              <>
                <p className="danger-note">Leaving the organisation? You can permanently delete your account. Your past tasks and comments stay with their projects, but your login is removed for good.</p>
                <button className="btn-danger-ghost" onClick={() => { setConfirmOpen(true); setDelMsg(null) }}>Delete my account</button>
              </>
            ) : (
              <>
                <p className="danger-note">This <strong>cannot be undone</strong>. You'll be signed out immediately and won't be able to sign in again with this email unless you're re-invited. To confirm, type <strong>DELETE</strong> below.</p>
                {delMsg && <div className="msg err">{delMsg}</div>}
                <div className="field">
                  <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm" autoFocus />
                </div>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => { setConfirmOpen(false); setConfirmText(''); setDelMsg(null) }}>Keep my account</button>
                  <button className="btn-danger" onClick={doDelete} disabled={delBusy || confirmText.trim() !== 'DELETE'}>{delBusy ? 'Deleting…' : 'Delete forever'}</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
