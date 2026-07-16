import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { initials, avatarColor } from '../lib/helpers'
import Board from './Board'
import List from './List'
import Dashboard from './Dashboard'
import Timeline from './Timeline'
import Home from './Home'
import MyTasks from './MyTasks'
import Search from './Search'
import TaskModal from './TaskModal'
import NewProjectModal from './NewProjectModal'
import EditProjectModal from './EditProjectModal'
import MembersModal from './MembersModal'
import ProfileModal from './ProfileModal'
import Notifications from './Notifications'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
  </svg>
)
const TasksIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
)

const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
function Bell({ count, onClick, className }) {
  return (
    <button className={'bell ' + (className || '')} onClick={onClick} aria-label="Notifications">
      <BellIcon />
      {count > 0 && <span className="bell-badge">{count > 9 ? '9+' : count}</span>}
    </button>
  )
}

export default function Workspace({ session }) {
  const me = session.user
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [route, setRoute] = useState('home')
  const [activeId, setActiveId] = useState(null)
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [tasks, setTasks] = useState([])
  const [view, setView] = useState('board')
  const [loadingProject, setLoadingProject] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [showNewProject, setShowNewProject] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [showProjMenu, setShowProjMenu] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [taskEditing, setTaskEditing] = useState(undefined)
  const [taskFocus, setTaskFocus] = useState(null)
  const [taskMeta, setTaskMeta] = useState({ sub: {}, com: {} })

  const active = projects.find((p) => p.id === activeId) || null
  const myRole = members.find((m) => m.user_id === me.id)?.role || 'member'
  const canDeleteTask = !!taskEditing && (myRole === 'admin' || taskEditing.created_by === me.id)

  const activeProjects = projects.filter((p) => !p.archived)
  const archivedProjects = projects.filter((p) => p.archived)
  const archivedIds = new Set(archivedProjects.map((p) => p.id))
  const activeTasks = allTasks.filter((t) => !archivedIds.has(t.project_id))

  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: true })
    setProjects(data || [])
  }, [])

  const loadAllTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('id, project_id, title, status, priority, due_date, assignee_id, created_by, projects(name)')
      .order('due_date', { ascending: true })
    setAllTasks(data || [])
  }, [])

  const loadTaskMeta = useCallback(async (pid) => {
    if (!pid) return
    const [{ data: subs }, { data: cms }] = await Promise.all([
      supabase.from('subtasks').select('task_id, done').eq('project_id', pid),
      supabase.from('task_comments').select('task_id').eq('project_id', pid),
    ])
    const sub = {}
    ;(subs || []).forEach((x) => { const m = sub[x.task_id] || { total: 0, done: 0 }; m.total++; if (x.done) m.done++; sub[x.task_id] = m })
    const com = {}
    ;(cms || []).forEach((x) => { com[x.task_id] = (com[x.task_id] || 0) + 1 })
    setTaskMeta({ sub, com })
  }, [])

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', me.id).order('created_at', { ascending: false }).limit(50)
    setNotifications(data || [])
  }, [me.id])

  useEffect(() => {
    ;(async () => {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', me.id).single()
      setProfile(prof || { id: me.id, email: me.email, full_name: me.email })
      await Promise.all([loadProjects(), loadAllTasks()])
      loadNotifications()
    })()
  }, [me.id, me.email, loadProjects, loadAllTasks, loadNotifications])

  useEffect(() => {
    const ch = supabase
      .channel('notif-' + me.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.id}` },
        (payload) => setNotifications((prev) => [payload.new, ...prev]))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [me.id])

  useEffect(() => {
    if (route === 'home' || route === 'mytasks' || route === 'search') loadAllTasks()
  }, [route, loadAllTasks])

  useEffect(() => {
    if (route !== 'project' || !activeId) return
    let cancelled = false
    setLoadingProject(true)
    ;(async () => {
      const [{ data: mem }, { data: tk }] = await Promise.all([
        supabase.from('project_members').select('user_id, role, profiles(id, full_name, email)').eq('project_id', activeId),
        supabase.from('tasks').select('*').eq('project_id', activeId).order('created_at', { ascending: true }),
      ])
      if (cancelled) return
      setMembers((mem || []).map((m) => ({ user_id: m.user_id, role: m.role, profile: m.profiles })))
      setTasks(tk || [])
      setLoadingProject(false)
      loadTaskMeta(activeId)
      const { data: inv } = await supabase.from('invitations').select('*').eq('project_id', activeId).eq('status', 'pending').order('created_at')
      if (!cancelled) setInvites(inv || [])
    })()

    const channel = supabase
      .channel('tasks-' + activeId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${activeId}` },
        async () => {
          const { data } = await supabase.from('tasks').select('*').eq('project_id', activeId).order('created_at', { ascending: true })
          setTasks(data || [])
        })
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [route, activeId])

  const refreshTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').eq('project_id', activeId).order('created_at', { ascending: true })
    setTasks(data || [])
    loadAllTasks()
  }
  const refreshMembers = async () => {
    const { data } = await supabase.from('project_members').select('user_id, role, profiles(id, full_name, email)').eq('project_id', activeId)
    setMembers((data || []).map((m) => ({ user_id: m.user_id, role: m.role, profile: m.profiles })))
  }
  const refreshInvites = async () => {
    const { data } = await supabase.from('invitations').select('*').eq('project_id', activeId).eq('status', 'pending').order('created_at')
    setInvites(data || [])
  }
  const cancelInvite = async (id) => {
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (error) return { error: error.message }
    await refreshInvites()
    return {}
  }

  const openProject = (id) => { setActiveId(id); setRoute('project'); setView('board'); setShowProjMenu(false); setSidebarOpen(false) }
  const openTask = (task, focus = null) => { setTaskFocus(focus); setTaskEditing(task) }
  const closeTask = () => { setTaskEditing(undefined); setTaskFocus(null); loadTaskMeta(activeId) }
  const unreadCount = notifications.filter((n) => !n.read).length
  const openNotifs = () => {
    setNotifOpen(true)
    if (unreadCount > 0) {
      supabase.from('notifications').update({ read: true }).eq('user_id', me.id).eq('read', false).then(() => {})
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  const onSearchChange = (v) => {
    setSearchQuery(v)
    if (v.trim()) setRoute('search')
    else if (route === 'search') setRoute('home')
  }

  const createProject = async ({ name, description }) => {
    const { error } = await supabase.from('projects').insert({ name, description: description || null, owner_id: me.id })
    if (error) return { error: error.message }
    await loadProjects()
    return {}
  }

  const updateProject = async ({ name, description }) => {
    const { error } = await supabase.from('projects').update({ name, description: description || null }).eq('id', activeId)
    if (error) return { error: error.message }
    await loadProjects()
    return {}
  }

  const setArchived = async (val) => {
    setShowProjMenu(false)
    const { error } = await supabase.from('projects').update({ archived: val }).eq('id', activeId)
    if (error) { alert(error.message); return }
    await loadProjects()
    if (val) { setActiveId(null); setRoute('home') }
  }

  const deleteProject = async () => {
    setShowProjMenu(false)
    if (!window.confirm('Permanently delete this project? All of its tasks and member access will be removed. This cannot be undone. (Tip: Archive keeps it without deleting.)')) return
    const { error } = await supabase.from('projects').delete().eq('id', activeId)
    if (error) { alert(error.message); return }
    setActiveId(null)
    setRoute('home')
    await Promise.all([loadProjects(), loadAllTasks()])
  }

  const updateProfile = async (fullName) => {
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', me.id)
    if (error) return { error: error.message }
    setProfile((p) => ({ ...(p || {}), full_name: fullName }))
    return {}
  }

  const moveTask = async (taskId, status) => {
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, status } : t)))
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) { alert(error.message); refreshTasks() } else { loadAllTasks() }
  }

  const saveTask = async (payload, taskId) => {
    let error
    if (taskId) ({ error } = await supabase.from('tasks').update(payload).eq('id', taskId))
    else ({ error } = await supabase.from('tasks').insert({ ...payload, project_id: activeId, created_by: me.id }))
    if (error) return { error: error.message }
    await refreshTasks()
    return {}
  }

  const deleteTask = async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) return { error: error.message }
    setTasks((ts) => ts.filter((t) => t.id !== taskId))
    loadAllTasks()
    return {}
  }

  const addMember = async (email, role) => {
    const { data, error } = await supabase.rpc('invite_to_project', { pid: activeId, member_email: email, member_role: role })
    if (error) return { error: error.message }
    if (data?.error) return { error: data.error }
    await Promise.all([refreshMembers(), refreshInvites()])
    return { status: data?.status }
  }

  const removeMember = async (userId) => {
    const { error } = await supabase.from('project_members').delete().eq('project_id', activeId).eq('user_id', userId)
    if (error) return { error: error.message }
    await refreshMembers()
    return {}
  }

  const changeMemberRole = async (userId, role) => {
    const { error } = await supabase.from('project_members').update({ role }).eq('project_id', activeId).eq('user_id', userId)
    if (error) return { error: error.message }
    await refreshMembers()
    return {}
  }

  const signOut = () => supabase.auth.signOut()

  const deleteAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return { error: 'Your session has expired. Please sign in again.' }
    let res
    try {
      res = await fetch('/.netlify/functions/delete-account', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    } catch {
      return { error: 'Network error. Please try again.' }
    }
    if (res.ok) { await supabase.auth.signOut(); return { ok: true } }
    let body = {}
    try { body = await res.json() } catch {}
    if (body.error === 'sole_admin') return { soleAdmin: true, projects: body.projects || [] }
    return { error: body.error || 'Could not delete your account. Please try again.' }
  }

  return (
    <div className="shell">
      <aside className={'sidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="side-brand">
          <div className="logo-chip"><img src="/hope365-logo.png" alt="Hope365" /></div>
          <span className="wordmark">Hope365</span>
          <Bell count={unreadCount} onClick={openNotifs} className="bell-desktop" />
        </div>

        <div className="side-search">
          <input placeholder="Search tasks…" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
        </div>

        <div className="side-nav">
          <button className={'nav-item' + (route === 'home' ? ' active' : '')} onClick={() => { setRoute('home'); setSidebarOpen(false) }}>
            <HomeIcon /> Home
          </button>
          <button className={'nav-item' + (route === 'mytasks' ? ' active' : '')} onClick={() => { setRoute('mytasks'); setSidebarOpen(false) }}>
            <TasksIcon /> My Tasks
          </button>
        </div>

        <div className="side-label">
          Projects
          <button title="New project" onClick={() => setShowNewProject(true)}>+</button>
        </div>
        <div className="proj-list">
          {activeProjects.map((p) => (
            <div key={p.id} className={'proj-item' + (route === 'project' && p.id === activeId ? ' active' : '')} onClick={() => openProject(p.id)}>
              <span className="pdot" /><span>{p.name}</span>
            </div>
          ))}
          {activeProjects.length === 0 && <div className="side-empty">No projects yet</div>}

          {archivedProjects.length > 0 && (
            <>
              <button className="archived-toggle" onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? '▾' : '▸'} Archived ({archivedProjects.length})
              </button>
              {showArchived && archivedProjects.map((p) => (
                <div key={p.id} className={'proj-item archived' + (route === 'project' && p.id === activeId ? ' active' : '')} onClick={() => openProject(p.id)}>
                  <span className="pdot" /><span>{p.name}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="side-foot">
          <div className="side-user clickable" onClick={() => setShowProfile(true)} title="Edit your profile">
            <div className="avatar" style={{ background: avatarColor(me.id) }}>{initials(profile?.full_name)}</div>
            <div className="meta">
              <div className="nm">{profile?.full_name || me.email}</div>
              <div className="em">{me.email}</div>
            </div>
          </div>
          <button className="signout" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <main className="main">
        <div className="mobile-topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <div className="mobile-brand"><div className="logo-chip sm"><img src="/hope365-logo.png" alt="Hope365" /></div><span>Hope365</span></div>
          <Bell count={unreadCount} onClick={openNotifs} className="bell-mobile" />
        </div>
        {route === 'home' && (
          <Home
            profile={profile} projects={activeProjects} allTasks={activeTasks} me={me}
            onOpenProject={openProject} onNewProject={() => setShowNewProject(true)} onGoMyTasks={() => setRoute('mytasks')}
          />
        )}

        {route === 'mytasks' && <MyTasks allTasks={activeTasks} me={me} onOpenProject={openProject} />}

        {route === 'search' && <Search allTasks={allTasks} query={searchQuery} onOpenProject={openProject} />}

        {route === 'project' && !active && (
          <div className="empty-state">
            <div className="big">Project not found</div>
            <p>It may have been removed.</p>
            <button className="btn-add" onClick={() => setRoute('home')}>Back to Home</button>
          </div>
        )}

        {route === 'project' && active && (
          <>
            <div className="topbar">
              <div className="proj-head">
                <div>
                  <div className="crumb">Project</div>
                  <h2>{active.name}{active.archived && <span className="archived-badge">Archived</span>}</h2>
                  {active.description && <p className="desc">{active.description}</p>}
                </div>
                <div className="proj-head-actions">
                  <div className="members">
                    {members.slice(0, 6).map((m) => (
                      <div key={m.user_id} className="avatar" title={m.profile?.full_name} style={{ background: avatarColor(m.user_id) }}>
                        {initials(m.profile?.full_name)}
                      </div>
                    ))}
                    {myRole === 'admin' && (
                      <button className="add-member-btn" title="Manage members" onClick={() => setShowMembers(true)}>+</button>
                    )}
                  </div>
                  {myRole === 'admin' && (
                    <div className="proj-menu-wrap">
                      <button className="icon-btn" title="Project options" onClick={() => setShowProjMenu((v) => !v)}>⋯</button>
                      {showProjMenu && (
                        <>
                          <div className="menu-backdrop" onClick={() => setShowProjMenu(false)} />
                          <div className="menu">
                            <button onClick={() => { setShowProjMenu(false); setShowEditProject(true) }}>Edit project</button>
                            {!active.archived
                              ? <button onClick={() => setArchived(true)}>Archive project</button>
                              : <button onClick={() => setArchived(false)}>Unarchive project</button>}
                            <button className="danger" onClick={deleteProject}>Delete project</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="tabs">
              <button className={'tab' + (view === 'board' ? ' active' : '')} onClick={() => setView('board')}>Board</button>
              <button className={'tab' + (view === 'list' ? ' active' : '')} onClick={() => setView('list')}>List</button>
              <button className={'tab' + (view === 'timeline' ? ' active' : '')} onClick={() => setView('timeline')}>Timeline</button>
              <button className={'tab' + (view === 'dashboard' ? ' active' : '')} onClick={() => setView('dashboard')}>Dashboard</button>
              <div className="tab-actions">
                <button className="btn-add" onClick={() => openTask(null)}>+ Add task</button>
              </div>
            </div>

            <div className="content">
              {loadingProject ? (
                <div className="loading">Loading project…</div>
              ) : view === 'dashboard' ? (
                <Dashboard tasks={tasks} members={members} />
              ) : view === 'timeline' ? (
                <Timeline tasks={tasks} onOpenTask={openTask} />
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="big">No tasks yet</div>
                  <p>Add the first task and assign it to a teammate.</p>
                  <button className="btn-add" onClick={() => openTask(null)}>+ Add task</button>
                </div>
              ) : view === 'board' ? (
                <Board tasks={tasks} members={members} taskMeta={taskMeta} onOpenTask={openTask} onMoveTask={moveTask} />
              ) : (
                <List tasks={tasks} members={members} taskMeta={taskMeta} onOpenTask={openTask} />
              )}
            </div>
          </>
        )}
      </main>

      {notifOpen && <Notifications items={notifications} onOpenProject={openProject} onClose={() => setNotifOpen(false)} />}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={createProject} />}
      {showEditProject && active && <EditProjectModal project={active} onClose={() => setShowEditProject(false)} onSave={updateProject} />}
      {showProfile && <ProfileModal profile={profile} email={me.email} onClose={() => setShowProfile(false)} onSave={updateProfile} onDeleteAccount={deleteAccount} />}
      {showMembers && (
        <MembersModal
          members={members} invites={invites} meId={me.id} isAdmin={myRole === 'admin'}
          onClose={() => setShowMembers(false)} onAdd={addMember} onRemove={removeMember} onChangeRole={changeMemberRole} onCancelInvite={cancelInvite}
        />
      )}
      {taskEditing !== undefined && (
        <TaskModal task={taskEditing} members={members} canDelete={canDeleteTask} projectId={activeId} meId={me.id} isAdmin={myRole === 'admin'} focus={taskFocus} onClose={closeTask} onSave={saveTask} onDelete={deleteTask} />
      )}
    </div>
  )
}
