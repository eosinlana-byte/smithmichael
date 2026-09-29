require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

async function initDb() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS enquiries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT NOT NULL,
    budget TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
}

app.post('/api/enquiries', async (req, res) => {
  const { name, email, projectType, budget, message } = req.body;
  if (!name || !email || !projectType || !message) return res.status(400).json({ ok: false, error: 'Please complete the required fields.' });
  if (!pool) return res.status(503).json({ ok: false, error: 'Form is not connected to email yet.' });
  try {
    await pool.query('INSERT INTO enquiries (name, email, project_type, budget, message) VALUES ($1,$2,$3,$4,$5)', [name, email, projectType, budget || '', message]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'The enquiry could not be saved. Please try again.' });
  }
});

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || '').split(';').map(v => v.trim());
  const found = cookies.find(v => v.startsWith(name + '='));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
}
function sessionToken() {
  return crypto.createHmac('sha256', process.env.ADMIN_PASSWORD || 'missing').update('smithmichael-admin').digest('hex');
}
function loggedIn(req) { return cookieValue(req, 'smith_admin') === sessionToken(); }
function loginPage(error = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Smith Michael Admin</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#121212;color:#f4f1ea;font:16px Inter,Arial,sans-serif}.box{width:min(420px,calc(100% - 36px));background:#1b1b1b;border:1px solid rgba(244,241,234,.14);padding:34px}h1{margin:0 0 8px;font-size:28px}p{color:#a3a3a3;margin:0 0 26px}label{display:grid;gap:8px;margin:16px 0;color:#a3a3a3;font-size:13px}input{width:100%;padding:13px;background:#121212;border:1px solid #555;color:#f4f1ea;font:inherit}button{margin-top:10px;padding:13px 18px;background:#e8a54b;border:0;color:#121212;font-weight:bold;cursor:pointer}.error{color:#ef927f;font-size:14px;margin:0 0 14px}</style></head><body><main class="box"><h1>Smith Michael</h1><p>Admin login</p>${error ? `<p class="error">${error}</p>` : ''}<form method="post" action="/admin/login"><label>Username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">SIGN IN</button></form></main></body></html>`;
}

app.get('/admin', async (req, res) => {
  if (!loggedIn(req)) return res.status(200).send(loginPage());
  if (!pool) return res.send(adminShell('<p>DATABASE_URL is not configured.</p>'));
  try {
    const { rows } = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.send(adminShell(`<p>${rows.length} saved enquiries</p><table><tr><th>Date</th><th>Name</th><th>Email</th><th>Project</th><th>Budget</th><th>Message</th></tr>${rows.map(r => `<tr><td>${new Date(r.created_at).toLocaleString()}</td><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.project_type)}</td><td>${esc(r.budget)}</td><td>${esc(r.message)}</td></tr>`).join('')}</table>`));
  } catch (err) { console.error(err); res.status(500).send(adminShell('<p>Could not load enquiries.</p>')); }
});
app.post('/admin/login', (req, res) => {
  const configuredUsername = String(process.env.ADMIN_USERNAME || 'merlin').trim().toLowerCase();
  const enteredUsername = String(req.body.username || '').trim().toLowerCase();
  if (enteredUsername === configuredUsername && String(req.body.password || '').trim() === String(process.env.ADMIN_PASSWORD || '').trim()) {
    res.setHeader('Set-Cookie', `smith_admin=${encodeURIComponent(sessionToken())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    return res.redirect('/admin');
  }
  res.status(401).send(loginPage('Incorrect username or password.'));
});
app.post('/admin/logout', (req, res) => { res.setHeader('Set-Cookie', 'smith_admin=; Path=/; Max-Age=0'); res.redirect('/admin'); });
function adminShell(content) { return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Smith Michael Admin</title><style>*{box-sizing:border-box}body{font:15px Inter,Arial,sans-serif;background:#121212;color:#f4f1ea;padding:28px}h1{margin:0 0 6px}p{color:#a3a3a3}table{border-collapse:collapse;width:100%;margin-top:24px}td,th{padding:12px;border-bottom:1px solid rgba(244,241,234,.14);text-align:left;vertical-align:top}th{color:#e8a54b;font-size:12px}a{color:#3d7cff}button{background:#e8a54b;border:0;padding:10px 14px;font-weight:bold;cursor:pointer}</style></head><body><h1>Enquiries</h1>${content}<form method="post" action="/admin/logout"><button>LOG OUT</button></form></body></html>`; }
function esc(v) { return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

initDb().then(() => app.listen(port, '0.0.0.0', () => console.log(`Smith Michael site listening on ${port}`))).catch(err => { console.error(err); process.exit(1); });
