import { useState } from 'react'

export default function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (!name.trim()) return setMsg('Give the project a name.')
    setBusy(true)
    const { error } = await onCreate({ name: name.trim(), description: description.trim() })
    setBusy(false)
    if (error) setMsg(error)
    else onClose()
  }

  return (
    <div className="overlay" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="modal">
        <h3>New project</h3>
        {msg && <div className="msg err">{msg}</div>}
        <div className="field">
          <label>Project name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Recalibrate 2026" autoFocus />
        </div>
        <div className="field">
          <label>Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-go" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create project'}</button>
        </div>
      </div>
    </div>
  )
}
