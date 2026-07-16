export const STATUSES = [
  { key: 'todo',  label: 'To-Do', color: '#A98E97' },
  { key: 'doing', label: 'Doing', color: '#E9B43A' },
  { key: 'done',  label: 'Done',  color: '#4FB286' },
]
export const statusMeta = (k) => STATUSES.find((s) => s.key === k) || STATUSES[0]
export const PRIORITIES = ['low', 'medium', 'high']

export const initials = (n) =>
  (n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export const avatarColor = (id) => {
  const h = [...(id || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${h} 50% 48%)`
}

export const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const isOverdue = (d) => {
  if (!d) return false
  return new Date(d + 'T23:59') < new Date()
}
