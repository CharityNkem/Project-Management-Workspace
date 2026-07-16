import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { STATUSES, isOverdue } from '../lib/helpers'

const GOLD = '#E9B43A'
const axisTick = { fill: '#9A8E92', fontSize: 12 }
const tipStyle = {
  contentStyle: { background: '#2A1E23', border: '1px solid #4A3640', borderRadius: 10, color: '#F4ECEE', fontSize: 13 },
  labelStyle: { color: '#C9BCC0' }, itemStyle: { color: '#F4ECEE' },
}

export default function Dashboard({ tasks, members }) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const pct = total ? Math.round((done / total) * 100) : 0
  const overdue = tasks.filter((t) => t.status !== 'done' && isOverdue(t.due_date)).length
  const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7)
  const dueSoon = tasks.filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) <= weekAhead && !isOverdue(t.due_date)).length

  const statusData = STATUSES.map((s) => ({ name: s.label, value: tasks.filter((t) => t.status === s.key).length, color: s.color }))

  const byAssignee = {}
  tasks.forEach((t) => {
    const name = t.assignee_id ? (members.find((m) => m.user_id === t.assignee_id)?.profile?.full_name || 'Member') : 'Unassigned'
    byAssignee[name] = (byAssignee[name] || 0) + 1
  })
  const assigneeData = Object.entries(byAssignee).map(([name, value]) => ({ name, value }))

  if (total === 0) return <div className="empty-state"><div className="big">No data yet</div><p>Add some tasks to see charts here.</p></div>

  return (
    <div className="dash">
      <div className="stat-row">
        <div className="stat-card"><div className="stat-num">{total}</div><div className="stat-lbl">Total tasks</div></div>
        <div className="stat-card"><div className="stat-num">{pct}%</div><div className="stat-lbl">Complete</div></div>
        <div className="stat-card"><div className={'stat-num' + (overdue ? ' danger' : '')}>{overdue}</div><div className="stat-lbl">Overdue</div></div>
        <div className="stat-card"><div className="stat-num">{dueSoon}</div><div className="stat-lbl">Due this week</div></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Tasks by status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none">
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip {...tipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {statusData.map((d) => <span key={d.name} className="legend-item"><span className="dot" style={{ background: d.color }} />{d.name} ({d.value})</span>)}
          </div>
        </div>

        <div className="chart-card">
          <h3>Tasks by assignee</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assigneeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} interval={0} angle={-20} textAnchor="end" height={52} />
              <YAxis allowDecimals={false} tick={axisTick} />
              <Tooltip {...tipStyle} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
              <Bar dataKey="value" fill={GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
