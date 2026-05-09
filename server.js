/**
 * Petshrow — Local LAN Server
 * Serves the dashboard and exposes a JSON-backed Job Tickets API
 * so any device on the same Wi-Fi can use the system.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(JOBS_FILE)) {
  fs.writeFileSync(JOBS_FILE, '[]', 'utf8');
}

const app = express();

// Better LAN compatibility
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Helpers ----------
function readJobs() {
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('readJobs failed:', e.message);
    return [];
  }
}

function writeJobs(jobs) {
  const tmp = JOBS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(jobs, null, 2), 'utf8');
  fs.renameSync(tmp, JOBS_FILE);
}

function newId() {
  return 'job_' + crypto.randomBytes(6).toString('hex');
}

// ---------- API ----------
app.get('/api/jobs', (_req, res) => {
  res.json(readJobs());
});

app.get('/api/jobs/:id', (req, res) => {
  const job = readJobs().find(j => j.id === req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(job);
});

app.post('/api/jobs', (req, res) => {
  const jobs = readJobs();

  const job = {
    id: newId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };

  jobs.unshift(job);

  writeJobs(jobs);

  res.status(201).json(job);
});

app.put('/api/jobs/:id', (req, res) => {
  const jobs = readJobs();

  const idx = jobs.findIndex(j => j.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  jobs[idx] = {
    ...jobs[idx],
    ...req.body,
    id: jobs[idx].id,
    updatedAt: new Date().toISOString()
  };

  writeJobs(jobs);

  res.json(jobs[idx]);
});

app.delete('/api/jobs/:id', (req, res) => {
  const jobs = readJobs();

  const next = jobs.filter(j => j.id !== req.params.id);

  if (next.length === jobs.length) {
    return res.status(404).json({ error: 'Not found' });
  }

  writeJobs(next);

  res.json({ ok: true });
});

// ---------- Health ----------
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString()
  });
});

// ---------- Network ----------
function getLanAddresses() {
  const out = [];
  const ifaces = os.networkInterfaces();

  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name] || []) {
      if (i.family === 'IPv4' && !i.internal) {
        out.push({
          iface: name,
          address: i.address
        });
      }
    }
  }

  return out;
}

// ---------- Start Server ----------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║         PETSHROW — Local Server         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log(`Local:   http://localhost:${PORT}`);

  for (const a of getLanAddresses()) {
    console.log(`Network: http://${a.address}:${PORT} (${a.iface})`);
  }

  console.log('\nShare a Network URL with devices on the same Wi-Fi.\n');
});

// Improve mobile/LAN stability
server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;