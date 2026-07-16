import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { STATUSES, PRIORITIES, initials, avatarColor } from '../lib/helpers'

const fmtTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function TaskModal({ task, members, canDelete, projectId, meId, isAdmin, focus, onClose, onSave, onDelete }) {
  const editing = !!task
  const t = task || {}
  const [title, setTitle] = useState(t.title || '')
  const [description, setDescription] = useState(t.description || '')
  const [assignee, setAssignee] = useState(t.assignee_id || '')
  const [start, setStart] = useState(t.start_date || '')
  const [due, setDue] = useState(t.due_date || '')
  const [status, setStatus] = useState(t.status || 'todo')
  const [priority, setPriority] = useState(t.priority || 'medium')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const [subtasks, setSubtasks] = useState([])
  const [comments, setComments] = useState([])
  const [newSub, setNewSub] = useState('')
  const [newComment, setNewComment] = useState('')
  const subRef = useRef(null)
  const comRef = useRef(null)

  useEffect(() => {
    if (!editing) return
    let cancelled = false
    ;(async () => {
      const [{ data: subs }, { data: cms }] = await Promise.all([
        supabase.from('subtasks').select('*').eq('task_id', t.id).order('created_at'),
        supabase.from('task_comments').select('id, body, created_at, author_id').eq('task_id', t.id).order('created_at'),
      ])
      if (cancelled) return
      setSubtasks(subs || [])
      setComments(cms || [])
    })()
    return () => { cancelled = true }
  }, [editing, t.id])

  useEffect(() => {
    if (!editing || !focus) return
    const el = focus === 'comments' ? comRef.current : subRef.current
    const id = setTimeout(() => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
    return () => clearTimeout(id)
  }, [editing, focus])

  const authorName = (id) => members.find((m) => m.user_id === id)?.profile?.full_name || 'Someone'

  const save = async () => {
    if (!title.trim()) return setMsg('A task needs a title.')
    setBusy(true)
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      assignee_id: assignee || null,
      start_date: start || null,
      due_date: due || null,
      status,
      priority,
    }
    const { error } = await onSave(payload, editing ? t.id : undefined)
    setBusy(false)
    if (error) setMsg(error)
    else onClose()
  }

  const remove = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    const { error } = await onDelete(t.id)
    if (error) setMsg(error)
    else onClose()
  }

  const reloadSubs = async () => {
    const { data } = await supabase.from('subtasks').select('*').eq('task_id', t.id).order('created_at')
    setSubtasks(data || [])
  }
  const addSubtask = async () => {
    const v = newSub.trim(); if (!v) return
    setNewSub('')
    const { error } = await supabase.from('subtasks').insert({ task_id: t.id, project_id: projectId, title: v })
    if (error) return alert(error.message)
    reloadSubs()
  }
  const toggleSubtask = async (s) => {
    setSubtasks((xs) => xs.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))
    await supabase.from('subtasks').update({ done: !s.done }).eq('id', s.id)
  }
  const removeSubtask = async (id) => {
    setSubtasks((xs) => xs.filter((x) => x.id !== id))
    await supabase.from('subtasks').delete().eq('id', id)
  }

  const reloadComments = async () => {
    const { data } = await supabase.from('task_comments').select('id, body, created_at, author_id').eq('task_id', t.id).order('created_at')
    setComments(data || [])
  }
  const addComment = async () => {
    const v = newComment.trim(); if (!v) return
    setNewComment('')
    const { error } = await supabase.from('task_comments').insert({ task_id: t.id, project_id: projectId, author_id: meId, body: v })
    if (error) return alert(error.message)
    reloadComments()
  }
  const removeComment = async (id) => {
    setComments((cs) => cs.filter((c) => c.id !== id))
    await supabase.from('task_comments').delete().eq('id', id)
  }

  const doneCount = subtasks.filter((s) => s.done).length

  return (
    <div className="overlay" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="modal modal-wide">
        <h3>{editing ? 'Edit task' : 'New task'}</h3>
        {msg && <div className="msg err">{msg}</div>}

        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design the welcome flyer" autoFocus />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details, links, what done looks like…" />
        </div>
        <div className="field">
          <label>Assignee</label>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (<option key={m.user_id} value={m.user_id}>{m.profile?.full_name || m.profile?.email}</option>))}
          </select>
        </div>
        <div className="row2">
          <div className="field">
            <label>Start date <span className="opt">(optional)</span></label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field">
            <label>Due date</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (<option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>))}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-go" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create task'}</button>
        </div>

        {!editing && <p className="hint">Create the task first, then reopen it to add subtasks and comments.</p>}

        {editing && (
          <>
            <div className="section" ref={subRef}>
              <div className="section-head">Subtasks {subtasks.length > 0 && <span className="count">{doneCount}/{subtasks.length}</span>}</div>
              <div className="subtask-list">
                {subtasks.map((s) => (
                  <div key={s.id} className="subtask-row">
                    <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(s)} />
                    <span className={s.done ? 'done' : ''}>{s.title}</span>
                    <button className="remove-btn sm" onClick={() => removeSubtask(s.id)} title="Remove">×</button>
                  </div>
                ))}
              </div>
              <div className="add-row">
                <input value={newSub} onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubtask()} placeholder="Add a subtask…" />
                <button className="btn-mini" onClick={addSubtask}>Add</button>
              </div>
            </div>

            <div className="section" ref={comRef}>
              <div className="section-head">Comments</div>
              <div className="comment-list">
                {comments.length === 0 && <div className="muted small">No comments yet.</div>}
                {comments.map((c) => (
                  <div key={c.id} className="comment">
                    <div className="avatar sm" style={{ background: avatarColor(c.author_id) }}>{initials(authorName(c.author_id))}</div>
                    <div className="comment-body">
                      <div className="comment-head">
                        <span className="comment-author">{authorName(c.author_id)}</span>
                        <span className="comment-time">{fmtTime(c.created_at)}</span>
                        {(c.author_id === meId || isAdmin) && <button className="remove-btn sm" onClick={() => removeComment(c.id)} title="Delete">×</button>}
                      </div>
                      <div className="comment-text">{c.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="add-row">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="Write a comment…" />
                <button className="btn-mini" onClick={addComment}>Post</button>
              </div>
            </div>
          </>
        )}

        {editing && canDelete && (
          <div className="center"><button className="btn-danger" onClick={remove}>Delete task</button></div>
        )}
      </div>
    </div>
  )
}
