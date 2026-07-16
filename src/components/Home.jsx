import { initials, avatarColor, fmtDate, isOverdue } from '../lib/helpers'
import OrgReport from './OrgReport'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home({ profile, projects, allTasks, me, onOpenProject, onNewProject, onGoMyTasks }) {
  const mine = allTasks.filter((t) => t.assignee_id === me.id)
  const myOpen = mine.filter((t) => t.status !== 'done')
  const myOverdue = myOpen.filter((t) => isOverdue(t.due_date))
  const upcoming = myOpen.filter((t) => !isOverdue(t.due_date)).slice(0, 8)

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const firstName = (profile?.full_name || 'there').split(' ')[0]

  const countsFor = (pid) => {
    const ts = allTasks.filter((t) => t.project_id === pid)
    return { total: ts.length, done: ts.filter((t) => t.status === 'done').length }
  }

  return (
    <div className="home">
      <div className="home-head">
        <div className="home-date">{today}</div>
        <h1 className="greeting">{greeting()}, {firstName}</h1>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-num">{myOpen.length}</div>
          <div className="stat-lbl">My open tasks</div>
        </div>
        <div className="stat-card">
          <div className={'stat-num' + (myOverdue.length ? ' danger' : '')}>{myOverdue.length}</div>
          <div className="stat-lbl">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{projects.length}</div>
          <div className="stat-lbl">Projects</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>My Tasks</h3>
            <button className="link-btn" onClick={onGoMyTasks}>View all</button>
          </div>
          {myOpen.length === 0 ? (
            <div className="panel-empty">Nothing assigned to you right now.</div>
          ) : (
            <div className="task-list">
              {myOverdue.map((t) => (
                <div key={t.id} className="task-row" onClick={() => onOpenProject(t.project_id)}>
                  <span className="task-dot over" />
                  <div className="task-main">
                    <div className="task-title">{t.title}</div>
                    <div className="task-sub">{t.projects?.name}</div>
                  </div>
                  <span className="task-due over">{fmtDate(t.due_date)}</span>
                </div>
              ))}
              {upcoming.map((t) => (
                <div key={t.id} className="task-row" onClick={() => onOpenProject(t.project_id)}>
                  <span className="task-dot" />
                  <div className="task-main">
                    <div className="task-title">{t.title}</div>
                    <div className="task-sub">{t.projects?.name}</div>
                  </div>
                  {t.due_date && <span className="task-due">{fmtDate(t.due_date)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Projects</h3></div>
          <div className="proj-card-grid">
            <button className="create-card" onClick={onNewProject}>
              <span className="plus">+</span> Create project
            </button>
            {projects.map((p) => {
              const c = countsFor(p.id)
              return (
                <div key={p.id} className="proj-card" onClick={() => onOpenProject(p.id)}>
                  <div className="proj-card-icon" style={{ background: avatarColor(p.id) }}>{initials(p.name)}</div>
                  <div className="proj-card-name">{p.name}</div>
                  <div className="proj-card-meta">
                    {c.total} task{c.total !== 1 ? 's' : ''}{c.total ? ` · ${c.done} done` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <OrgReport allTasks={allTasks} projects={projects} />
    </div>
  )
}
