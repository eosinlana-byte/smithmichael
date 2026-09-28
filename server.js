require('dotenv').config();
const express = require('express');
const path = require('path');
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

function adminAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const expected = 'Basic ' + Buffer.from(`merlin:${process.env.ADMIN_PASSWORD || ''}`).toString('base64');
  if (auth !== expected) { res.set('WWW-Authenticate', 'Basic realm="Smith Michael Admin"'); return res.status(401).send('Login required'); }
  next();
}

app.get('/admin', adminAuth, async (req, res) => {
  if (!pool) return res.send('<h1>Admin</h1><p>DATABASE_URL is not configured.</p>');
  const { rows } = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Smith Michael Admin</title><style>body{font:16px system-ui;background:#0b0d10;color:#f2f4f7;padding:32px}table{border-collapse:collapse;width:100%}td,th{padding:12px;border-bottom:1px solid #30343c;text-align:left;vertical-align:top}th{color:#9ba4b1}a{color:#7fa6ff}</style></head><body><h1>Enquiries</h1><p>${rows.length} saved enquiries</p><table><tr><th>Date</th><th>Name</th><th>Email</th><th>Project</th><th>Budget</th><th>Message</th></tr>${rows.map(r => `<tr><td>${new Date(r.created_at).toLocaleString()}</td><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.project_type)}</td><td>${esc(r.budget)}</td><td>${esc(r.message)}</td></tr>`).join('')}</table></body></html>`);
});
function esc(v) { return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

initDb().then(() => app.listen(port, '0.0.0.0', () => console.log(`Smith Michael site listening on ${port}`))).catch(err => { console.error(err); process.exit(1); });
