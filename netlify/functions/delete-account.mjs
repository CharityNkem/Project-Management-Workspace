// Lets a signed-in user permanently delete their OWN account.
// Identity is proven by the caller's access token; this function can only
// ever delete the account that token belongs to. Blocks deletion if the
// user is the sole admin of any project. Uses the Supabase service-role key.

function resp(code, obj) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return resp(405, { error: 'Method not allowed' })

  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return resp(401, { error: 'No auth token' })

  const SUPABASE_URL = process.env.SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const svc = { apikey: KEY, Authorization: `Bearer ${KEY}` }

  // 1. Identify the caller from their own token.
  const ures = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } })
  if (!ures.ok) return resp(401, { error: 'Invalid session' })
  const user = await ures.json()
  const userId = user && user.id
  if (!userId) return resp(401, { error: 'Invalid session' })

  // 2. Block if they are the only admin of any project.
  const amres = await fetch(`${SUPABASE_URL}/rest/v1/project_members?user_id=eq.${userId}&role=eq.admin&select=project_id`, { headers: svc })
  const adminMems = await amres.json()
  const blocking = []
  if (Array.isArray(adminMems)) {
    for (const m of adminMems) {
      const cres = await fetch(`${SUPABASE_URL}/rest/v1/project_members?project_id=eq.${m.project_id}&role=eq.admin&select=user_id`, { headers: svc })
      const admins = await cres.json()
      if (Array.isArray(admins) && admins.length <= 1) {
        const pres = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${m.project_id}&select=name`, { headers: svc })
        const p = await pres.json()
        blocking.push((Array.isArray(p) && p[0] && p[0].name) ? p[0].name : 'a project')
      }
    }
  }
  if (blocking.length) return resp(409, { error: 'sole_admin', projects: blocking })

  // 3. Delete the auth user. The database cascades clean up their data.
  const dres = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: svc })
  if (!dres.ok) {
    const t = await dres.text()
    return resp(500, { error: t || 'Delete failed' })
  }
  return resp(200, { ok: true })
}
