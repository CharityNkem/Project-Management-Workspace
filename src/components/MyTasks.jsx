import { useState } from 'react'
import { fmtDate, isOverdue, statusMeta } from '../lib/helpers'

export default function MyTasks({ allTasks, me, onOpenProject }) {
  const [tab, setTab] = useState('upcoming')
  const mine = allTasks.filter((t) => t.assignee_id === me.id)
  const upcoming = mine.filter((t) => t.status !== 'done' && !isOverdue(t.due_date))
  const overdue = mine.filter((t) => t.status !== 'done' && isOverdue(t.due_date))
  const completed = mine.filter((t) => t.status === 'done')
  const list = tab === 'upcoming' ? upcoming : tab === 'overdue' ? overdue : completed

  return (
    <div className="mytasks">
      <div className="topbar">
        <div className="crumb">Across all projects</div>
        <h2>My Tasks</h2>
      </div>
      <div className="tabs">
        <button className={'tab' + (tab === 'upcoming' ? ' active' : '')} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
        <button className={'tab' + (tab === 'overdue' ? ' active' : '')} onClick={() => setTab('overdue')}>Overdue ({overdue.length})</button>
        <button className={'tab' + (tab === 'completed' ? ' active' : '')} onClick={() => setTab('completed')}>Completed ({completed.length})</button>
      </div>
      <div className="content">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="big">Nothing here</div>
            <p>No {tab} tasks assigned to you.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>
                {list.map((t) => {
                  const sm = statusMeta(t.status)
                  return (
                    <tr key={t.id} className="row" onClick={() => onOpenProject(t.project_id)}>
                      <td className="td-title">{t.title}</td>
                      <td>{t.projects?.name}</td>
                      <td><span className="status-tag" style={{ background: sm.color + '22', color: sm.color }}><span className="sdot" style={{ background: sm.color }} />{sm.label}</span></td>
                      <td>{t.due_date ? <span className={isOverdue(t.due_date) && t.status !== 'done' ? 'due over' : ''}>{fmtDate(t.due_date)}</span> : <span className="muted">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
