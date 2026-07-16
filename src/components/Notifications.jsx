const relTime = (iso) => {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Notifications({ items, onOpenProject, onClose }) {
  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-panel">
        <div className="notif-head">Notifications</div>
        <div className="notif-list">
          {items.length === 0 && <div className="notif-empty">You're all caught up.</div>}
          {items.map((n) => (
            <button
              key={n.id}
              className={'notif-item' + (n.read ? '' : ' unread')}
              onClick={() => { if (n.project_id) onOpenProject(n.project_id); onClose() }}
            >
              <div className="notif-text">{n.body}</div>
              <div className="notif-time">{relTime(n.created_at)}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
