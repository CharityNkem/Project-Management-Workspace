import { statusMeta, initials, avatarColor, fmtDate, isOverdue } from '../lib/helpers'
import { CheckIcon, CommentIcon } from './icons'

export default function List({ tasks, members, taskMeta, onOpenTask }) {
  const meta = taskMeta || { sub: {}, com: {} }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Task</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Due</th></tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const m = members.find((x) => x.user_id === t.assignee_id)
            const sm = statusMeta(t.status)
            const sub = meta.sub[t.id]
            const cc = meta.com[t.id] || 0
            return (
              <tr key={t.id} className="row" onClick={() => onOpenTask(t)}>
                <td className="td-title">
                  {t.title}
                  {(sub || cc > 0) && (
                    <div className="list-subline">
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
                </td>
                <td>
                  {m ? (
                    <div className="who-cell"><div className="avatar sm" style={{ background: avatarColor(m.user_id) }}>{initials(m.profile?.full_name)}</div>{m.profile?.full_name}</div>
                  ) : (<span className="muted">Unassigned</span>)}
                </td>
                <td><span className="status-tag" style={{ background: sm.color + '22', color: sm.color }}><span className="sdot" style={{ background: sm.color }} />{sm.label}</span></td>
                <td><span className={'pill ' + t.priority}>{t.priority}</span></td>
                <td>{t.due_date ? <span className={isOverdue(t.due_date) && t.status !== 'done' ? 'due over' : ''}>{fmtDate(t.due_date)}</span> : <span className="muted">—</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
