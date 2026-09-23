const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const PIN = process.env.APP_PIN || '2468';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const sessions = new Map();

const starter = {
  posts: [
    { id: crypto.randomUUID(), type: 'Faith', status: 'Draft', scheduled: '', text: "God didn't bring me through the storm just to leave me standing in the rain. I'm still here, still growing, and still covered." },
    { id: crypto.randomUUID(), type: 'Deep', status: 'Draft', scheduled: '', text: "I stopped explaining myself when I realized some people only listen for something to twist—not something to understand." },
    { id: crypto.randomUUID(), type: 'Funny', status: 'Draft', scheduled: '', text: "Some folks check my page more faithfully than they check on their own business. I appreciate the attendance. 😂" }
  ],
  reels: [
    { id: crypto.randomUUID(), title: 'Protect Your Peace', hook: "Everybody doesn't deserve access to the healed version of you.", script: "I learned that protecting my peace doesn't make me cold. It means I finally stopped handing people the same weapon they used to hurt me.", duration: 30 }
  ]
};

function ensureData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(starter, null, 2));
}
function readData() { ensureData(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeData(data) { ensureData(); fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function json(res, code, body, extra = {}) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(body));
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => v.trim().split('=').map(decodeURIComponent)));
}
function authorized(req) {
  const token = parseCookies(req).maino_session;
  return token && sessions.has(token) && sessions.get(token) > Date.now();
}
async function body(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error('Request too large'); }
  return raw ? JSON.parse(raw) : {};
}
function serveFile(res, file) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript' };
  fs.readFile(file, (err, data) => {
    if (err) return json(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const input = await body(req);
      if (String(input.pin) !== PIN) return json(res, 401, { error: 'That PIN is not correct.' });
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, Date.now() + 7 * 86400000);
      return json(res, 200, { ok: true }, { 'set-cookie': `maino_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800` });
    }
    if (url.pathname.startsWith('/api/')) {
      if (!authorized(req)) return json(res, 401, { error: 'Please unlock the studio.' });
      if (req.method === 'GET' && url.pathname === '/api/data') return json(res, 200, readData());
      if (req.method === 'PUT' && url.pathname === '/api/data') {
        const input = await body(req);
        if (!Array.isArray(input.posts) || !Array.isArray(input.reels)) return json(res, 400, { error: 'Invalid data' });
        writeData(input); return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'Not found' });
    }
    const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.normalize(path.join(PUBLIC_DIR, requested));
    if (!file.startsWith(PUBLIC_DIR)) return json(res, 403, { error: 'Forbidden' });
    serveFile(res, file);
  } catch (error) { json(res, 500, { error: error.message }); }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Main'O Content Studio running on port ${PORT}`));
