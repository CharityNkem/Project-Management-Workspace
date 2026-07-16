import nodemailer from 'nodemailer'

const BRAND_HEAD = (title) => `<tr><td style="background:#9B2242;padding:20px 28px;"><span style="color:#ffffff;font-size:18px;font-weight:bold;">Hope365 Workspace</span></td></tr>`
const FOOT = `<tr><td style="padding:18px 28px;border-top:1px solid #eeeeee;"><span style="font-size:12px;color:#aaaaaa;">Hope365 Network &middot; This is an automated message from Hope365 Workspace.</span></td></tr>`

function shell(inner) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f1f2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f2;padding:24px 0;"><tr><td align="center">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06);">
      ${BRAND_HEAD()}<tr><td style="padding:28px;">${inner}</td></tr>${FOOT}
    </table></td></tr></table></body></html>`
}

function button(url, label) {
  return `<a href="${url}" style="display:inline-block;background:#E9B43A;color:#2A1A0E;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 26px;border-radius:9px;">${label}</a>`
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const secret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret']
  if (!secret || secret !== process.env.WEBHOOK_SECRET) return { statusCode: 401, body: 'Unauthorized' }

  let payload
  try { payload = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Bad JSON' } }

  const table = payload.table
  const rec = payload.record || payload.new || null
  if (!rec) return { statusCode: 200, body: 'Ignored' }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const APP_URL = process.env.APP_URL || 'https://hope365-workspace.netlify.app'
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

  const projectName = async (pid) => {
    if (!pid) return 'a project'
    const r = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${pid}&select=name`, { headers })
    const j = await r.json()
    return (Array.isArray(j) && j[0] && j[0].name) ? j[0].name : 'a project'
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })
  const send = (to, subject, html, text) => transporter.sendMail({
    from: `"Hope365 Workspace" <${process.env.GMAIL_USER}>`, to, subject, html, text,
  })

  try {
    // ---- Invitation to someone who doesn't have an account yet ----
    if (table === 'invitations') {
      const name = await projectName(rec.project_id)
      const link = `${APP_URL}/?invite=${encodeURIComponent(rec.email)}`
      const inner = `
        <p style="font-size:16px;color:#1f1418;margin:0 0 14px;">You've been invited</p>
        <p style="font-size:15px;color:#444444;line-height:1.6;margin:0 0 22px;">You've been invited to join the project <strong style="color:#9B2242;">${name}</strong> on Hope365 Workspace. Create your account with this email address and the project will be waiting for you.</p>
        ${button(link, 'Create your account')}
        <p style="font-size:13px;color:#888888;line-height:1.6;margin:24px 0 0;">Or paste this link into your browser:<br><a href="${link}" style="color:#9B2242;">${link}</a></p>`
      const text = `You've been invited to join the project "${name}" on Hope365 Workspace.\n\nCreate your account (with this email address) to get started: ${link}\n\n— Hope365 Workspace`
      await send(rec.email, `You're invited to ${name} on Hope365 Workspace`, shell(inner), text)
      return { statusCode: 200, body: 'Invite sent' }
    }

    // ---- Existing member added to a project ----
    if (table === 'notifications') {
      if (rec.type !== 'added_to_project') return { statusCode: 200, body: 'Ignored' }
      const pr = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${rec.user_id}&select=email,full_name`, { headers })
      const profiles = await pr.json()
      const profile = Array.isArray(profiles) ? profiles[0] : null
      if (!profile || !profile.email) return { statusCode: 200, body: 'No recipient email' }
      const name = await projectName(rec.project_id)
      const firstName = (profile.full_name || '').split(' ')[0] || 'there'
      const inner = `
        <p style="font-size:16px;color:#1f1418;margin:0 0 14px;">Hi ${firstName},</p>
        <p style="font-size:15px;color:#444444;line-height:1.6;margin:0 0 22px;">You've been added to the project <strong style="color:#9B2242;">${name}</strong> on Hope365 Workspace. You can now view its tasks, add updates, and collaborate with the team.</p>
        ${button(APP_URL, 'Open the workspace')}
        <p style="font-size:13px;color:#888888;line-height:1.6;margin:24px 0 0;">If the button doesn't work, paste this link:<br><a href="${APP_URL}" style="color:#9B2242;">${APP_URL}</a></p>`
      const text = `Hi ${firstName},\n\nYou've been added to the project "${name}" on Hope365 Workspace.\n\nOpen the workspace: ${APP_URL}\n\n— Hope365 Workspace`
      await send(profile.email, `You've been added to ${name}`, shell(inner), text)
      return { statusCode: 200, body: 'Sent' }
    }
  } catch (e) {
    return { statusCode: 500, body: 'Send failed: ' + (e && e.message ? e.message : 'unknown') }
  }

  return { statusCode: 200, body: 'Ignored' }
}
