import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { STATUSES } from '../lib/helpers'

const GREEN = '#3FB27F'
const GOLD = '#E9B43A'
const axisTick = { fill: '#9A8E92', fontSize: 12 }
const tipStyle = {
  contentStyle: { background: '#2A1E23', border: '1px solid #4A3640', borderRadius: 10, color: '#F4ECEE', fontSize: 13 },
  labelStyle: { color: '#C9BCC0' }, itemStyle: { color: '#F4ECEE' },
}

export default function OrgReport({ allTasks, projects }) {
  if (!allTasks || allTasks.length === 0) return null

  const statusData = STATUSES.map((s) => ({ name: s.label, value: allTasks.filter((t) => t.status === s.key).length, color: s.color }))
  const perProject = projects
    .map((p) => {
      const ts = allTasks.filter((t) => t.project_id === p.id)
      return { name: p.name, Done: ts.filter((t) => t.status === 'done').length, Open: ts.filter((t) => t.status !== 'done').length }
    })
    .filter((d) => d.Done + d.Open > 0)

  return (
    <div className="panel">
      <div className="panel-head"><h3>Reporting overview</h3></div>
      <div className="chart-grid">
        <div className="chart-card">
          <h4>All tasks by status</h4>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={84} paddingAngle={2} stroke="none">
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
          <h4>Progress by project</h4>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={perProject} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} interval={0} angle={-20} textAnchor="end" height={52} />
              <YAxis allowDecimals={false} tick={axisTick} />
              <Tooltip {...tipStyle} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#C9BCC0' }} />
              <Bar dataKey="Done" stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Open" stackId="a" fill={GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
