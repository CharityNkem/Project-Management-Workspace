import { useState } from 'react'
import { initials, avatarColor } from '../lib/helpers'

export default function MembersModal({ members, invites, meId, isAdmin, onClose, onAdd, onRemove, onChangeRole, onCancelInvite }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const add = async () => {
    const target = email.trim().toLowerCase()
    if (!target) return setMsg({ kind: 'err', text: 'Enter an email address.' })
    setBusy(true)
    const res = await onAdd(target, role)
    setBusy(false)
    if (res.error) return setMsg({ kind: 'err', text: res.error })
    setEmail('')
    if (res.status === 'invited') setMsg({ kind: 'ok', text: `Invitation email sent to ${target}. They'll join once they sign up.` })
    else if (res.status === 'already_member') setMsg({ kind: 'ok', text: 'That person is already a member.' })
    else setMsg({ kind: 'ok', text: 'Added to the project.' })
  }

  const remove = async (userId, name) => {
    if (!window.confirm(`Remove ${name || 'this person'} from the project?`)) return
    const { error } = await onRemove(userId)
    if (error) setMsg({ kind: 'err', text: error })
  }

  const cancel = async (id, who) => {
    if (!window.confirm(`Cancel the invitation to ${who}?`)) return
    const { error } = await onCancelInvite(id)
    if (error) setMsg({ kind: 'err', text: error })
  }

  const toggleRole = async (m) => {
    const next = m.role === 'admin' ? 'member' : 'admin'
    const { error } = await onChangeRole(m.user_id, next)
    if (error) setMsg({ kind: 'err', text: error })
  }

  return (
    <div className="overlay" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="modal">
        <h3>Project members</h3>
        {msg && <div className={'msg ' + msg.kind}>{msg.text}</div>}

        <div className="roster">
          {members.map((m) => {
            const isSelf = m.user_id === meId
            return (
              <div key={m.user_id} className="member-row">
                <div className="avatar sm" style={{ background: avatarColor(m.user_id) }}>{initials(m.profile?.full_name)}</div>
                <div className="member-meta">
                  <div>{m.profile?.full_name}{isSelf ? ' (you)' : ''}</div>
                  <div className="em">{m.profile?.email}</div>
                </div>
                {isAdmin && !isSelf ? (
                  <div className="member-actions">
                    <button className="role-btn" onClick={() => toggleRole(m)} title="Tap to change role">{m.role === 'admin' ? 'Admin' : 'Member'}</button>
                    <button className="remove-btn" onClick={() => remove(m.user_id, m.profile?.full_name)} title="Remove from project">×</button>
                  </div>
                ) : (
                  <span className="role">{m.role}</span>
                )}
              </div>
            )
          })}
        </div>

        {invites && invites.length > 0 && (
          <div className="pending-invites">
            <div className="pending-head">Pending invitations</div>
            {invites.map((iv) => (
              <div key={iv.id} className="member-row">
                <div className="avatar sm invite-avatar">✉</div>
                <div className="member-meta">
                  <div>{iv.email}</div>
                  <div className="em">Invited · {iv.role} · hasn't signed up yet</div>
                </div>
                {isAdmin && <button className="remove-btn" onClick={() => cancel(iv.id, iv.email)} title="Cancel invitation">×</button>}
              </div>
            ))}
          </div>
        )}

        <div className="field">
          <label>Add or invite by email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@hope365network.org" />
        </div>
        <div className="field">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Done</button>
          <button className="btn-go" onClick={add} disabled={busy}>{busy ? 'Sending…' : 'Add / invite'}</button>
        </div>
        <p className="hint">If they already have an account they're added right away. If not, they get an email with a link to sign up — and the project is waiting for them when they do.</p>
      </div>
    </div>
  )
}
