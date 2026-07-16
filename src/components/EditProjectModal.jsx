import { useState } from 'react'

export default function EditProjectModal({ project, onClose, onSave }) {
  const [name, setName] = useState(project.name || '')
  const [description, setDescription] = useState(project.description || '')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim()) return setMsg('Give the project a name.')
    setBusy(true)
    const { error } = await onSave({ name: name.trim(), description: description.trim() })
    setBusy(false)
    if (error) setMsg(error)
    else onClose()
  }

  return (
    <div className="overlay" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="modal">
        <h3>Edit project</h3>
        {msg && <div className="msg err">{msg}</div>}
        <div className="field">
          <label>Project name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-go" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}
