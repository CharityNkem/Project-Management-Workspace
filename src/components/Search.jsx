import { statusMeta, fmtDate, isOverdue } from '../lib/helpers'

export default function Search({ allTasks, query, onOpenProject }) {
  const q = query.trim().toLowerCase()
  const results = q ? allTasks.filter((t) => (t.title || '').toLowerCase().includes(q)) : []

  return (
    <div className="mytasks">
      <div className="topbar">
        <div className="crumb">Search</div>
        <h2>{q ? `Results for "${query.trim()}"` : 'Search'}</h2>
      </div>
      <div className="content">
        {!q ? (
          <div className="empty-state"><div className="big">Type to search</div><p>Find any task across your projects by name.</p></div>
        ) : results.length === 0 ? (
          <div className="empty-state"><div className="big">No matches</div><p>No tasks match "{query.trim()}".</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>
                {results.map((t) => {
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
