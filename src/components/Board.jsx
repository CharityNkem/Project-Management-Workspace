import { useState } from 'react'
import { STATUSES, initials, avatarColor, fmtDate, isOverdue } from '../lib/helpers'
import { CheckIcon, CommentIcon } from './icons'

export default function Board({ tasks, members, taskMeta, onOpenTask, onMoveTask }) {
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const meta = taskMeta || { sub: {}, com: {} }

  return (
    <div className="board">
      {STATUSES.map((s) => {
        const colTasks = tasks.filter((t) => t.status === s.key)
        return (
          <div
            key={s.key}
            className={'col' + (overCol === s.key ? ' drag-over' : '')}
            onDragOver={(e) => { e.preventDefault(); setOverCol(s.key) }}
            onDragLeave={() => setOverCol((c) => (c === s.key ? null : c))}
            onDrop={(e) => {
              e.preventDefault(); setOverCol(null)
              if (dragId) { const t = tasks.find((x) => x.id === dragId); if (t && t.status !== s.key) onMoveTask(dragId, s.key) }
              setDragId(null)
            }}
          >
            <div className="col-head">
              <span className="sdot" style={{ background: s.color }} />{s.label}
              <span className="badge">{colTasks.length}</span>
            </div>
            <div className="col-body">
              {colTasks.map((t) => {
                const m = members.find((x) => x.user_id === t.assignee_id)
                const sub = meta.sub[t.id]
                const cc = meta.com[t.id] || 0
                return (
                  <div key={t.id} className="card" draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)} onClick={() => onOpenTask(t)}>
                    <div className="card-title">{t.title}</div>
                    <div className="card-meta">
                      <span className={'pill ' + t.priority}>{t.priority}</span>
                      {t.due_date && (<span className={'due' + (isOverdue(t.due_date) && t.status !== 'done' ? ' over' : '')}>{fmtDate(t.due_date)}</span>)}
                      {m && (<div className="who"><div className="avatar sm" title={m.profile?.full_name} style={{ background: avatarColor(m.user_id) }}>{initials(m.profile?.full_name)}</div></div>)}
                    </div>
                    {(sub || cc > 0) && (
                      <div className="card-subline">
                        {sub && (
                          <button className={'chip-btn' + (sub.done === sub.total ? ' complete' : '')} onClick={(e) => { e.stopPropagation(); onOpenTask(t, 'subtasks') }}>
                            <CheckIcon /> {sub.done}/{sub.total}
                          </button>
                        )}
                        {cc > 0 && (
                          <button className="chip-btn" onClick={(e) => { e.stopPropagation(); onOpenTask(t, 'comments') }}>
                            <CommentIcon /> {cc}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {colTasks.length === 0 && <div className="empty-col">Drop tasks here</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
