import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts'
import { statusMeta } from '../lib/helpers'

const DAY = 86400000
const GOLD = '#E9B43A'
const axisTick = { fill: '#9A8E92', fontSize: 12 }
const fmt = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

function TimelineTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const r = payload[0].payload
  return (
    <div className="tl-tip">
      <div className="tl-tip-name">{r.name}</div>
      <div className="tl-tip-dates">{fmt(r.range[0])} → {fmt(r.range[1])}</div>
    </div>
  )
}

export default function Timeline({ tasks, onOpenTask }) {
  const [hideDone, setHideDone] = useState(false)

  const visible = tasks.filter((t) => !hideDone || t.status !== 'done')
  const doneHidden = hideDone ? tasks.filter((t) => t.status === 'done').length : 0

  const rows = visible
    .filter((t) => t.due_date)
    .map((t) => {
      const end = new Date(t.due_date + 'T00:00').getTime()
      let start = t.start_date ? new Date(t.start_date + 'T00:00').getTime() : new Date(t.created_at).getTime()
      if (start > end - DAY) start = end - DAY // guarantee a visible bar
      return { id: t.id, name: t.title, range: [start, end], color: statusMeta(t.status).color, _t: t }
    })
    .sort((a, b) => a.range[0] - b.range[0])

  const unscheduled = visible.filter((t) => !t.due_date)

  const Toggle = (
    <label className="tl-toggle">
      <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
      Hide done tasks{doneHidden > 0 ? ` (${doneHidden})` : ''}
    </label>
  )

  if (rows.length === 0) {
    return (
      <div className="timeline">
        <div className="tl-bar">{Toggle}</div>
        <div className="empty-state">
          <div className="big">{hideDone ? 'No open tasks to show' : "Nothing to place on a timeline yet"}</div>
          <p>{hideDone ? 'Every dated task here is done. Untick "Hide done tasks" to see them.' : "Give tasks a due date and they'll appear here, laid out by time."}</p>
        </div>
      </div>
    )
  }

  const minD = Math.min(...rows.map((r) => r.range[0])) - DAY * 2
  const maxD = Math.max(...rows.map((r) => r.range[1])) + DAY * 2
  const height = Math.max(rows.length * 44 + 50, 180)

  return (
    <div className="timeline">
      <div className="tl-bar">{Toggle}</div>

      <div className="chart-card">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart layout="vertical" data={rows} margin={{ top: 8, right: 24, left: 8, bottom: 8 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false} />
            <XAxis type="number" scale="time" domain={[minD, maxD]} tickFormatter={fmt} tick={axisTick} />
            <YAxis type="category" dataKey="name" width={150} tick={axisTick} tickFormatter={(v) => (v.length > 20 ? v.slice(0, 19) + '…' : v)} />
            <Tooltip content={<TimelineTip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
            <ReferenceLine x={Date.now()} stroke={GOLD} strokeDasharray="4 3" label={{ value: 'Today', fill: GOLD, fontSize: 11, position: 'top' }} />
            <Bar dataKey="range" radius={[5, 5, 5, 5]} cursor="pointer" onClick={(d) => d && d._t && onOpenTask(d._t)}>
              {rows.map((r, i) => <Cell key={i} fill={r.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {unscheduled.length > 0 && (
        <div className="chart-card">
          <h4>Unscheduled — no due date ({unscheduled.length})</h4>
          <div className="unsched-list">
            {unscheduled.map((t) => (
              <button key={t.id} className="unsched-chip" onClick={() => onOpenTask(t)}>
                <span className="dot" style={{ background: statusMeta(t.status).color }} />{t.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
