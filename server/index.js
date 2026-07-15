/**
 * claude-emotion-link — Emotion Bridge Server
 * =============================================
 *
 * A zero-dependency Node.js server that:
 *   • Serves the Live2D emotion viewer frontend
 *   • Provides a Server-Sent Events (SSE) endpoint for real-time updates
 *   • Exposes a REST API for emotion ingestion from Claude Code hooks
 *   • Serves Live2D model assets locally
 *
 * Architecture:
 *   Claude Code (postMessage hook) ──POST /emotion──→ Server ──SSE──→ Browser
 *
 * Requirements: Node.js >= 18 (no npm dependencies)
 *
 * ─── Quick Start ───
 *   node server/index.js
 *   → http://localhost:3456
 *
 * ─── API Reference ───
 *   GET  /             → Live2D emotion viewer (HTML)
 *   POST /emotion      → Submit emotion data
 *   GET  /events       → SSE stream of emotion changes
 *   GET  /status       → Server health & current state
 *   POST /analyze      → Text-based emotion analysis (no broadcast)
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const PORT = 3456;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR    = path.join(PROJECT_ROOT, 'public');
const MODEL_DIR     = path.join(PUBLIC_DIR, 'models');

// ──────────────────────────────────────────────
// Emotion definitions
// ──────────────────────────────────────────────

const EMOTIONS = {
  neutral:     { id: 'neutral',     name: '平常',   icon: '😊' },
  happy:       { id: 'happy',       name: '开心',   icon: '😄' },
  veryHappy:   { id: 'veryHappy',   name: '超开心', icon: '🌟' },
  sad:         { id: 'sad',         name: '难过',   icon: '😢' },
  surprised:   { id: 'surprised',   name: '惊讶',   icon: '😮' },
  thinking:    { id: 'thinking',    name: '思考',   icon: '🤔' },
  angry:       { id: 'angry',       name: '生气',   icon: '😣' },
  embarrassed: { id: 'embarrassed', name: '害羞',   icon: '😳' },
  sleepy:      { id: 'sleepy',      name: '困倦',   icon: '😴' },
  tipsy:       { id: 'tipsy',       name: '微醺',   icon: '🍷' },
};

const EMOTION_KEYWORDS = {
  happy:        ['开心','高兴','好耶','太好了','棒','厉害','成功','喜欢','超','nice','great','happy','耶','哈哈','真好','真棒','完美','太棒了','好开心','最爱','万岁','恭喜','🎉'],
  veryHappy:    ['超开心','超级','最棒','太厉害了','绝了','兴奋','激动','感动','最高','yyds','amazing'],
  sad:          ['难过','伤心','哭','失败','不好','对不起','错了','sad','cry','sorry','呜呜','难受','心痛','委屈','不开心','沮丧','悲伤','😭','💔'],
  surprised:    ['真的','惊讶','意外','啥','what','really','wow','啊？','诶','咦','不会吧','假的吧','不可能','吃惊','震惊','竟然','居然','天哪','😲','😱'],
  thinking:     ['嗯','想','思考','考虑','问题','怎么','how','think','hmm','琢磨','让我想想','为什么','怎么办','🤔'],
  angry:        ['气','可恶','生气','烦','angry','mad','讨厌','烦死了','无语','真是的','过分','好气','怒','🔥','💢'],
  embarrassed:  ['害羞','不好意思','羞','blush','shy','难为情','丢人','脸红','尴尬','😳'],
  sleepy:       ['困','累','睡觉','sleepy','tired','zzz','好困','困死','累了','疲惫','晚安','😴','💤'],
  tipsy:        ['酒','喝','干杯','drink','wine','cheers','微醺','醉了','喝酒','干杯','🍺','🍷','🥂'],
};

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────

/** @type {Array<import('http').ServerResponse>} */
let sseClients = [];

let currentEmotion = 'neutral';
let currentText    = '';

// ──────────────────────────────────────────────
// SSE helpers
// ──────────────────────────────────────────────

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter(c => {
    try { c.write(payload); return true; }
    catch { return false; }
  });
}

// ──────────────────────────────────────────────
// Emotion analysis engine
// ──────────────────────────────────────────────

function analyzeEmotion(text) {
  if (!text?.trim()) return 'neutral';

  const lower = text.toLowerCase();
  const scores = Object.fromEntries(Object.keys(EMOTION_KEYWORDS).map(k => [k, 0]));

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const kw of keywords) {
      const lkw = kw.toLowerCase();
      let idx = lower.indexOf(lkw);
      while (idx !== -1) {
        scores[emotion] += kw.length > 2 ? 1 + kw.length * 0.1 : 1;
        idx = lower.indexOf(lkw, idx + 1);
      }
    }
  }

  // Negation handling
  for (const neg of ['不', '没', '别']) {
    for (const [emotion] of Object.entries(EMOTION_KEYWORDS)) {
      for (const kw of EMOTION_KEYWORDS[emotion]) {
        if (lower.includes(neg + kw.toLowerCase())) {
          scores[emotion] = Math.max(0, scores[emotion] - 3);
        }
      }
    }
  }

  // Punctuation amplification
  const excl = (text.match(/[！!]/g) || []).length;
  if (excl >= 2) {
    for (const e of ['happy', 'veryHappy', 'angry', 'surprised']) {
      if ((scores[e] || 0) > 0) scores[e] += excl * 0.5;
    }
  }

  const q = (text.match(/[？?]/g) || []).length;
  if (q >= 1) scores.thinking += q * 2;

  let best = 'neutral', bestScore = 0;
  for (const [e, s] of Object.entries(scores)) {
    if (s > bestScore) { bestScore = s; best = e; }
  }

  return bestScore < 0.5 ? 'neutral' : best;
}

// ──────────────────────────────────────────────
// MIME types
// ──────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.moc3': 'application/octet-stream',
};

// ──────────────────────────────────────────────
// Serve static files
// ──────────────────────────────────────────────

function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 — Not Found');
      return;
    }

    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 — Internal Server Error');
  }
}

// ──────────────────────────────────────────────
// Inject SSE script into HTML
// ──────────────────────────────────────────────

function injectSSEScript(html) {
  const sse = `
<script>
(function() {
  var es = new EventSource('/events');
  es.onmessage = function(e) {
    try {
      var d = JSON.parse(e.data);
      if (d.emotion && window.setEmotion) window.setEmotion(d.emotion, d.source);
    } catch(e) {}
  };
  es.onopen = function() {
    if (window.onSSEConnected) window.onSSEConnected();
  };
})();
</script>`;
  return html.replace('</body>', sse + '\n</body>');
}

// ──────────────────────────────────────────────
// HTTP Router
// ──────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── SSE Event Stream ──────────────────────
  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial state
    res.write(`data: ${JSON.stringify({ emotion: currentEmotion, text: currentText, source: 'connected' })}\n\n`);
    sseClients.push(res);

    // Heartbeat
    const hb = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch { clearInterval(hb); }
    }, 15000);

    req.on('close', () => {
      clearInterval(hb);
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  // ── POST /emotion ─────────────────────────
  if (pathname === '/emotion' && method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const emotion = data.emotion || analyzeEmotion(data.text || '');
        currentEmotion = emotion;
        if (data.text) currentText = data.text.slice(0, 200);

        broadcast({ emotion, text: currentText, source: data.source || 'api', timestamp: Date.now() });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, emotion }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // ── POST /analyze ─────────────────────────
  if (pathname === '/analyze' && method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const emotion = analyzeEmotion(data.text || '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ emotion }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── GET /status ───────────────────────────
  if (pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      server: 'claude-emotion-link',
      version: '1.0.0',
      clients: sseClients.length,
      currentEmotion,
      emotions: Object.keys(EMOTIONS),
    }));
    return;
  }

  // ── GET / (HTML viewer) ───────────────────
  if (pathname === '/') {
    const htmlPath = path.join(PUBLIC_DIR, 'index.html');
    try {
      let html = fs.readFileSync(htmlPath, 'utf-8');
      html = injectSSEScript(html);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end('500 — Failed to load viewer');
    }
    return;
  }

  // ── Serve static assets ───────────────────
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname)).replace(/[\\/]$/, '');
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('403 — Forbidden');
    return;
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    serveStatic(res, safePath);
  } else {
    res.writeHead(404);
    res.end('404 — 小喵找不到这个文件喵～');
  }
});

// ──────────────────────────────────────────────
// Startup
// ──────────────────────────────────────────────

server.listen(PORT, () => {
  console.log('');
  console.log('  ╭──────────────────────────────────────╮');
  console.log('  │      ✦ claude-emotion-link ✦         │');
  console.log('  │      Live2D Emotion Bridge           │');
  console.log('  ├──────────────────────────────────────┤');
  console.log(`  │  🌐  Viewer  : http://localhost:${PORT}     │`);
  console.log(`  │  📡  SSE     : http://localhost:${PORT}/events│`);
  console.log(`  │  📮  API     : POST /emotion          │`);
  console.log(`  │  📊  Status  : http://localhost:${PORT}/status│`);
  console.log('  ╰──────────────────────────────────────╯');
  console.log('');
  console.log('  💡 Open http://localhost:' + PORT + ' in your browser');
  console.log('     to see the Live2D emotion display.');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down…');
  sseClients.forEach(c => { try { c.end(); } catch {} });
  server.close(() => process.exit(0));
});
