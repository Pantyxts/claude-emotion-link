/**
 * claude-emotion-link — Live2D Emotion Viewer (Hiyori Edition)
 * =============================================================
 *
 * Renders a Live2D model (Hiyori, Cubism 4) whose expressions
 * react to emotion data received via SSE from the bridge server.
 *
 * Dependencies (CDN in index.html):
 *   • Live2D Cubism Core (npm live2dcubismcore v4.2.2)
 *   • pixi.js v7
 *   • pixi-live2d-display
 *
 * ─── Hiyori Parameter Map (28 params) ───
 * Face     : AngleX/Y/Z, Cheek
 * Eyes     : EyeLOpen/ROpen, EyeLSmile/RSmile
 * Eyeballs : EyeBallX, EyeBallY
 * Brows    : BrowLForm, BrowRForm  (−1 furrow … 0 neutral … +1 arch)
 * Mouth    : MouthForm (−1 frown … +1 smile), MouthOpenY (0→1)
 * Body     : BodyAngleX/Y/Z, Breath
 * Arms     : ArmLA, ArmRA
 * Sway     : BustY, Hair(Front/Side/Back/Ahoge/SideUp), Ribbon, Skirt, SideUpRibbon
 */

// ──────────────────────────────────────────────
// Emotion ↔ Parameter Mapping (Hiyori — 28 params)
// ──────────────────────────────────────────────
//
// Hiyori is a Cubism 4 free model. While simpler than Mao Pro's 128
// parameters, its core facial rig (eyes, brows, mouth, cheeks, head/body
// angle) is enough for expressive emotional display.
//
// Parameter conventions:
//   EyeLOpen / EyeROpen   : 0 (closed) → 1 (open)
//   EyeLSmile / EyeRSmile : 0 (normal) → 1 (^_^ shaped)
//   BrowLForm / BrowRForm : -1 (furrow ↓↓) → 0 (neutral) → 1 (arch ↑↑)
//   MouthForm             : -1 (frown) → 0 (neutral) → 1 (smile)
//   MouthOpenY            : 0 (closed) → 1 (wide open)
//   Cheek                 : 0 (none)    → 1 (full blush)
//   BodyAngleX            : -30…+30 (lean left/right)
//   BodyAngleY            : -30…+30 (lean forward/back)
//   BodyAngleZ            : -30…+30 (tilt)

const EXPRESSIONS = {
  neutral: {
    label: '平常',
    icon: '😊',
    params: {
      // Head
      ParamAngleX: 0, ParamAngleY: 0, ParamAngleZ: 0,
      ParamCheek: 0,
      // Eyes
      ParamEyeLOpen: 1.0, ParamEyeROpen: 1.0,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      // Eyeballs
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      // Brows
      ParamBrowLForm: 0, ParamBrowRForm: 0,
      // Mouth
      ParamMouthForm: 0, ParamMouthOpenY: 0,
      // Body
      ParamBodyAngleX: 0, ParamBodyAngleY: 0, ParamBodyAngleZ: 0,
      ParamBreath: 0.5,
      // Arms
      ParamArmLA: 0, ParamArmRA: 0,
    },
    effects: ['✦'],
    tail: { sway: 0.3, speed: 0.8, color: '#64b5f6' },
  },

  happy: {
    label: '开心',
    icon: '😄',
    params: {
      ParamAngleX: 0, ParamAngleY: 2, ParamAngleZ: 0,
      ParamCheek: 0.15,
      ParamEyeLOpen: 0.75, ParamEyeROpen: 0.75,
      ParamEyeLSmile: 0.7, ParamEyeRSmile: 0.7,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: 0.35, ParamBrowRForm: 0.35,
      ParamMouthForm: 0.5, ParamMouthOpenY: 0,
      ParamBodyAngleX: 0, ParamBodyAngleY: 1, ParamBodyAngleZ: 0,
      ParamBreath: 0.6,
      ParamArmLA: 0.05, ParamArmRA: 0.05,
    },
    effects: ['✿', '♥', '★', '✨'],
    tail: { sway: 0.6, speed: 1.5, color: '#ffd700' },
  },

  veryHappy: {
    label: '超开心',
    icon: '🌟',
    params: {
      ParamAngleX: 2, ParamAngleY: 4, ParamAngleZ: 1,
      ParamCheek: 0.35,
      ParamEyeLOpen: 0.5, ParamEyeROpen: 0.5,
      ParamEyeLSmile: 1.0, ParamEyeRSmile: 1.0,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: 0.6, ParamBrowRForm: 0.6,
      ParamMouthForm: 0.8, ParamMouthOpenY: 0.15,
      ParamBodyAngleX: 1, ParamBodyAngleY: 3, ParamBodyAngleZ: 0,
      ParamBreath: 0.7,
      ParamArmLA: 0.15, ParamArmRA: 0.15,
    },
    effects: ['🌟', '✨', '🎉', '♥', '★', '✿'],
    tail: { sway: 0.9, speed: 2.0, color: '#ff6b9d' },
  },

  sad: {
    label: '难过',
    icon: '😢',
    params: {
      ParamAngleX: 0, ParamAngleY: -3, ParamAngleZ: 0,
      ParamCheek: 0,
      ParamEyeLOpen: 0.65, ParamEyeROpen: 0.65,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: -0.15,
      ParamBrowLForm: -0.35, ParamBrowRForm: -0.35,
      ParamMouthForm: -0.35, ParamMouthOpenY: 0,
      ParamBodyAngleX: 0, ParamBodyAngleY: -2, ParamBodyAngleZ: 0,
      ParamBreath: 0.4,
      ParamArmLA: -0.05, ParamArmRA: -0.05,
    },
    effects: ['💧', '。'],
    tail: { sway: 0.1, speed: 0.4, color: '#5c6bc0' },
  },

  surprised: {
    label: '惊讶',
    icon: '😮',
    params: {
      ParamAngleX: 0, ParamAngleY: 2, ParamAngleZ: 0,
      ParamCheek: 0,
      ParamEyeLOpen: 1.0, ParamEyeROpen: 1.0,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: 0.8, ParamBrowRForm: 0.8,
      ParamMouthForm: 0.1, ParamMouthOpenY: 0.6,
      ParamBodyAngleX: 0, ParamBodyAngleY: 2, ParamBodyAngleZ: 0,
      ParamBreath: 0.6,
      ParamArmLA: 0.2, ParamArmRA: 0.2,
    },
    effects: ['❕', '❗', '✦'],
    tail: { sway: 0.5, speed: 1.8, color: '#ab47bc' },
  },

  thinking: {
    label: '思考',
    icon: '🤔',
    params: {
      ParamAngleX: -3, ParamAngleY: -1, ParamAngleZ: 1,
      ParamCheek: 0,
      ParamEyeLOpen: 0.6, ParamEyeROpen: 0.8,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0.3, ParamEyeBallY: 0.1,
      ParamBrowLForm: -0.2, ParamBrowRForm: 0.3,
      ParamMouthForm: -0.1, ParamMouthOpenY: 0,
      ParamBodyAngleX: -2, ParamBodyAngleY: -1, ParamBodyAngleZ: 0,
      ParamBreath: 0.5,
      ParamArmLA: 0.1, ParamArmRA: 0,
    },
    effects: ['❓', '❔', '⋯'],
    tail: { sway: 0.2, speed: 0.6, color: '#7e57c2' },
  },

  angry: {
    label: '生气',
    icon: '😣',
    params: {
      ParamAngleX: 0, ParamAngleY: -1, ParamAngleZ: 0,
      ParamCheek: 0.05,
      ParamEyeLOpen: 0.8, ParamEyeROpen: 0.8,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: -0.7, ParamBrowRForm: -0.7,
      ParamMouthForm: -0.3, ParamMouthOpenY: 0.1,
      ParamBodyAngleX: 0, ParamBodyAngleY: -1, ParamBodyAngleZ: 0,
      ParamBreath: 0.7,
      ParamArmLA: 0.15, ParamArmRA: 0.15,
    },
    effects: ['💢', '🔥'],
    tail: { sway: 0.5, speed: 3.0, color: '#ef5350' },
  },

  embarrassed: {
    label: '害羞',
    icon: '😳',
    params: {
      ParamAngleX: -5, ParamAngleY: -4, ParamAngleZ: 2,
      ParamCheek: 0.9,
      ParamEyeLOpen: 0.85, ParamEyeROpen: 0.85,
      ParamEyeLSmile: 0.3, ParamEyeRSmile: 0.3,
      ParamEyeBallX: -0.2, ParamEyeBallY: -0.1,
      ParamBrowLForm: 0.2, ParamBrowRForm: 0.2,
      ParamMouthForm: 0.2, ParamMouthOpenY: 0,
      ParamBodyAngleX: -3, ParamBodyAngleY: -2, ParamBodyAngleZ: 1,
      ParamBreath: 0.6,
      ParamArmLA: 0.05, ParamArmRA: 0.05,
    },
    effects: ['💕', '〜', '♡'],
    tail: { sway: 0.4, speed: 1.2, color: '#ff80ab' },
  },

  sleepy: {
    label: '困倦',
    icon: '😴',
    params: {
      ParamAngleX: 2, ParamAngleY: 0, ParamAngleZ: 2,
      ParamCheek: 0,
      ParamEyeLOpen: 0.15, ParamEyeROpen: 0.15,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: -0.1,
      ParamBrowLForm: -0.05, ParamBrowRForm: -0.05,
      ParamMouthForm: 0, ParamMouthOpenY: 0.05,
      ParamBodyAngleX: 1, ParamBodyAngleY: 0, ParamBodyAngleZ: 0,
      ParamBreath: 0.35,
      ParamArmLA: -0.1, ParamArmRA: -0.1,
    },
    effects: ['💤', 'z', 'Z'],
    tail: { sway: 0.1, speed: 0.3, color: '#90a4ae' },
  },

  tipsy: {
    label: '微醺',
    icon: '🍷',
    params: {
      ParamAngleX: 5, ParamAngleY: 3, ParamAngleZ: 3,
      ParamCheek: 0.7,
      ParamEyeLOpen: 0.55, ParamEyeROpen: 0.55,
      ParamEyeLSmile: 0.45, ParamEyeRSmile: 0.45,
      ParamEyeBallX: 0.1, ParamEyeBallY: -0.05,
      ParamBrowLForm: 0.15, ParamBrowRForm: 0.15,
      ParamMouthForm: 0.35, ParamMouthOpenY: 0.05,
      ParamBodyAngleX: 3, ParamBodyAngleY: 2, ParamBodyAngleZ: 1,
      ParamBreath: 0.55,
      ParamArmLA: 0, ParamArmRA: 0,
    },
    effects: ['🍷', '✦', '♡', '〜'],
    tail: { sway: 0.6, speed: 1.0, color: '#ff8a65' },
  },
};

// ──────────────────────────────────────────────
// Global state
// ──────────────────────────────────────────────

let app = null;           // PIXI.Application
let model = null;         // PIXI.live2d.Live2DModel
let currentEmotion = 'neutral';
let targetParams = {};
let animFrame = null;
let animating = false;

// Tail animation state
let tailCtx = null;
let tailCanvas = null;
let tailAnimFrame = null;
let tailTime = 0;
let tailState = { sway: 0.3, speed: 0.8, color: '#64b5f6' };

// DOM references (set on init)
const els = {};

// ──────────────────────────────────────────────
// Parameter interpolation
// ──────────────────────────────────────────────

/** Smoothly interpolate from current → target over `duration` ms */
function animateToParams(target, duration = 400) {
  if (!model || !model.internalModel) return;

  const core = model.internalModel.coreModel;
  if (!core) return;

  // If already animating, cancel
  if (animFrame) cancelAnimationFrame(animFrame);

  const start = {};
  const keys = Object.keys(target);

  // Read current values
  for (const k of keys) {
    try { start[k] = core.getParameterValueById(k); }
    catch { start[k] = 0; }
  }

  const t0 = performance.now();

  function step(now) {
    const t = Math.min((now - t0) / duration, 1);
    // Ease-out cubic
    const e = 1 - Math.pow(1 - t, 3);

    for (const k of keys) {
      const v = start[k] + (target[k] - start[k]) * e;
      try { core.setParameterValueById(k, v); } catch {}
    }

    if (t < 1) {
      animFrame = requestAnimationFrame(step);
    } else {
      animFrame = null;
      animating = false;
    }
  }

  animating = true;
  animFrame = requestAnimationFrame(step);
}

// ──────────────────────────────────────────────
// Magic Energy Tail — Canvas-drawn tail overlay
// ──────────────────────────────────────────────

function initTailCanvas() {
  tailCanvas = document.getElementById('tail-canvas');
  if (!tailCanvas) return;

  tailCtx = tailCanvas.getContext('2d');

  // Match tail canvas size to wrap
  function resizeTail() {
    if (!tailCanvas) return;
    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) return;
    tailCanvas.width = wrap.offsetWidth;
    tailCanvas.height = wrap.offsetHeight;
  }
  resizeTail();
  window.addEventListener('resize', resizeTail);

  // Start animation loop
  cancelAnimationFrame(tailAnimFrame);
  animateTail();
}

function animateTail() {
  if (!tailCtx || !tailCanvas) {
    tailAnimFrame = requestAnimationFrame(animateTail);
    return;
  }

  tailTime += 0.016; // ~60fps step

  const ctx = tailCtx;
  const w = tailCanvas.width;
  const h = tailCanvas.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Tail parameters driven by emotion
  const swayAmount = tailState.sway;
  const speed = tailState.speed;
  const color = tailState.color;

  // Tail base position (lower center, slightly above bottom)
  const baseX = w / 2 + 40;
  const baseY = h - 60;

  // Number of tail segments
  const segments = 12;
  const segLen = 22;

  // Calculate tail curve points
  const points = [];
  let angle = Math.PI / 2; // start pointing down

  // Oscillation: sine wave offset that propagates along the tail
  const oscPhase = tailTime * speed;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Base direction: gravity pulls down, slight curve
    const gravityPull = 0.15;
    // Oscillation amplitude increases toward tip
    const amp = swayAmount * (0.5 + t * 0.8);
    const osc = Math.sin(oscPhase + i * 0.7) * amp * 0.8;

    // Subtle S-curve in the neutral tail
    const sCurve = Math.sin(t * Math.PI * 0.8) * 0.15;

    angle = Math.PI / 2 + sCurve + osc;

    const px = i === 0 ? baseX : points[i - 1].x + Math.cos(angle - Math.PI / 2) * segLen * (1 - t * 0.3);
    const py = i === 0 ? baseY : points[i - 1].y + Math.sin(angle - Math.PI / 2) * segLen * (1 - t * 0.15);

    points.push({ x: px, y: py });
  }

  // Draw the tail as a smooth curve
  if (points.length < 2) {
    tailAnimFrame = requestAnimationFrame(animateTail);
    return;
  }

  // Parse color to add glow
  const parsedColor = parseColor(color);

  // Draw tail glow (outer)
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2;
    const yc = (points[i - 1].y + points[i].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

  ctx.strokeStyle = `rgba(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b}, 0.3)`;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw main tail body
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2;
    const yc = (points[i - 1].y + points[i].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

  // Gradient tail color
  const grad = ctx.createLinearGradient(
    points[0].x, points[0].y,
    points[points.length - 1].x, points[points.length - 1].y
  );
  grad.addColorStop(0, `rgba(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b}, 0.9)`);
  grad.addColorStop(0.5, `rgba(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b}, 0.7)`);
  grad.addColorStop(1, `rgba(${Math.min(255, parsedColor.r + 60)}, ${Math.min(255, parsedColor.g + 60)}, ${Math.min(255, parsedColor.b + 60)}, 0.4)`);

  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw tail tip accent (small sparkle)
  const tip = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw energy sparkles along the tail
  for (let i = 1; i < points.length - 1; i += 2) {
    const sparkleSize = 1.5 + Math.sin(tailTime * 3 + i) * 1.5;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, Math.max(0.5, sparkleSize), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(tailTime * 2 + i) * 0.2})`;
    ctx.fill();
  }

  tailAnimFrame = requestAnimationFrame(animateTail);
}

function parseColor(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 100, g: 180, b: 255 };
}

// ──────────────────────────────────────────────
// Set emotion
// ──────────────────────────────────────────────

function setEmotion(emotionId, source) {
  const expr = EXPRESSIONS[emotionId];
  if (!expr) return;

  const isNew = emotionId !== currentEmotion;
  currentEmotion = emotionId;
  targetParams = { ...expr.params };

  // Animate model parameters
  animateToParams(targetParams, 380);

  // Update UI
  updateUI(expr);

  // Spawn floating effects (only on change, not on initial load burst)
  if (isNew) spawnEffects(expr.effects);

  // Update tail state
  if (expr.tail) {
    tailState = { ...expr.tail };
  }
}

// ──────────────────────────────────────────────
// UI updates
// ──────────────────────────────────────────────

function updateUI(expr) {
  // Canvas-area overlay
  if (els.icon) {
    els.icon.textContent = expr.icon;
    els.icon.classList.remove('changed');
    void els.icon.offsetWidth;
    els.icon.classList.add('changed');
  }
  if (els.name) els.name.textContent = expr.label;

  // Always-on-top badge
  if (els.badgeIcon) {
    els.badgeIcon.textContent = expr.icon;
    els.badgeIcon.classList.remove('pulse');
    void els.badgeIcon.offsetWidth;
    els.badgeIcon.classList.add('pulse');
  }
  if (els.badgeText) els.badgeText.textContent = expr.label;
  if (els.badge && currentEmotion) {
    // Remove old emotion class, add new one for glow color
    els.badge.className = els.badge.className.replace(/emotion-badge-top\s+\S+/, 'emotion-badge-top');
    els.badge.classList.add(currentEmotion);
  }
}

function spawnEffects(effects) {
  if (!els.effects) return;
  const container = els.effects;

  // Clear old
  container.innerHTML = '';

  const count = Math.min(effects.length * 3, 12);
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'float-item';
    el.textContent = effects[i % effects.length];
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.top = (25 + Math.random() * 55) + '%';
    el.style.fontSize = (18 + Math.random() * 16) + 'px';
    el.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    el.style.animationDelay = (Math.random() * 0.6) + 's';
    container.appendChild(el);
  }

  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ──────────────────────────────────────────────
// SSE connection (with exponential backoff)
// ──────────────────────────────────────────────

let sseRetries = 0;
const SSE_MAX_RETRIES = 10;
let sseReconnectTimer = null;

function connectSSE() {
  const es = new EventSource('/events');

  es.onmessage = function (e) {
    try {
      const d = JSON.parse(e.data);
      if (d.emotion && EXPRESSIONS[d.emotion]) {
        setEmotion(d.emotion, d.source || 'sse');
      }
    } catch {}
  };

  es.onopen = function () {
    sseRetries = 0;
    if (els.dot) els.dot.className = 'status-dot connected';
    if (els.label) els.label.textContent = '✦ Live';
  };

  es.onerror = function () {
    es.close();
    sseRetries++;

    if (sseRetries <= SSE_MAX_RETRIES) {
      // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
      const delay = Math.min(1000 * Math.pow(2, sseRetries - 1), 30000);
      if (els.dot) els.dot.className = 'status-dot error';
      if (els.label) els.label.textContent = '重连中 (' + sseRetries + '/' + SSE_MAX_RETRIES + ')...';

      clearTimeout(sseReconnectTimer);
      sseReconnectTimer = setTimeout(connectSSE, delay);
    } else {
      if (els.dot) els.dot.className = 'status-dot error';
      if (els.label) els.label.textContent = '连接失败';
    }
  };
}

// ──────────────────────────────────────────────
// Demo mode — auto-cycle emotions
// ──────────────────────────────────────────────

let demoMode = false;
let demoTimer = null;
let demoIndex = 0;
let demoInterval = 3000;
const DEMO_EMOTIONS = ['happy', 'surprised', 'thinking', 'veryHappy', 'embarrassed', 'sad', 'angry', 'sleepy', 'tipsy', 'neutral'];

function toggleDemo() {
  demoMode = !demoMode;

  if (demoMode) {
    demoIndex = 0;
    if (els.demoBtn) els.demoBtn.textContent = '⏸ 停止演示';
    if (els.demoIndicator) els.demoIndicator.style.display = 'flex';
    cycleDemo();
  } else {
    if (els.demoBtn) els.demoBtn.textContent = '▶ 演示模式';
    if (els.demoIndicator) els.demoIndicator.style.display = 'none';
    clearTimeout(demoTimer);
    demoTimer = null;
    setEmotion('neutral', 'demo-stop');
  }
}

function cycleDemo() {
  if (!demoMode) return;
  const emotion = DEMO_EMOTIONS[demoIndex % DEMO_EMOTIONS.length];
  setEmotion(emotion, 'demo');
  demoIndex++;
  demoTimer = setTimeout(cycleDemo, demoInterval);
}

// ──────────────────────────────────────────────
// Keyboard shortcuts
// ──────────────────────────────────────────────

const KEY_EMOTION_MAP = {
  '0': 'neutral',
  '1': 'happy',
  '2': 'veryHappy',
  '3': 'sad',
  '4': 'surprised',
  '5': 'thinking',
  '6': 'angry',
  '7': 'embarrassed',
  '8': 'sleepy',
  '9': 'tipsy',
};

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Space to toggle demo mode
    if (e.code === 'Space') {
      e.preventDefault();
      toggleDemo();
      return;
    }

    // Digit keys 0-9 for emotions
    if (KEY_EMOTION_MAP[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (demoMode) toggleDemo(); // Exit demo mode when manually selecting
      setEmotion(KEY_EMOTION_MAP[e.key], 'keyboard');
    }
  });
}

// ──────────────────────────────────────────────
// Model loading
// ──────────────────────────────────────────────

async function loadModel() {
  // Hiyori (Cubism 4) — 28 parameters, compatible with Core v4.2.2
  const MODEL_PATH = 'models/hiyori_free_t08/hiyori_free_t08.model3.json';

  try {
    // Check if PIXI and Live2DModel are available
    if (typeof PIXI === 'undefined') throw new Error('PIXI.js not loaded');
    if (!PIXI.live2d || !PIXI.live2d.Live2DModel) throw new Error('pixi-live2d-display not loaded');

    const { Live2DModel } = PIXI.live2d;

    // Create PIXI application
    app = new PIXI.Application({
      view: els.canvas,
      width: 480,
      height: 600,
      transparent: true,
      backgroundColor: 0x0a0e27,
      resizeTo: els.canvasWrap,
      antialias: true,
    });

    // Load the model
    model = await Live2DModel.from(MODEL_PATH, {
      autoInteract: false,
    });

    // Center and scale — Hiyori needs much smaller scale than Mao
    model.x = sw / 2;
    model.y = sh / 2;
    model.scale.set(0.28);
    model.anchor.set(0.5, 0.5);

    app.stage.addChild(model);

    // Enable auto-blinking (EyeBlink group defined in model3.json)
    model.internalModel.coreModel.setParameterValueById('ParamBreath', 0.5);

    // Set initial expression
    setEmotion('neutral', 'init');

    // Hide loading screen
    if (els.loading) els.loading.classList.add('hidden');

  } catch (err) {
    console.error('[claude-emotion-link] Model load failed:', err);
    if (els.loading) {
      els.loading.querySelector('.loading-text').textContent = '模型加载失败';
      els.loading.querySelector('.loading-sub').textContent = err.message;
      // Add a retry hint
      const retryHint = document.createElement('div');
      retryHint.style.cssText = 'margin-top:16px;font-size:12px;color:#3a5080;cursor:pointer;text-decoration:underline';
      retryHint.textContent = '点击此处重试';
      retryHint.onclick = () => {
        els.loading.querySelector('.loading-text').textContent = '正在加载 Live2D 模型…';
        els.loading.querySelector('.loading-sub').textContent = 'Hiyori (Cubism 4) · 28 Parameters';
        if (retryHint.parentNode) retryHint.parentNode.removeChild(retryHint);
        loadModel().catch(() => {});
      };
      els.loading.appendChild(retryHint);
    }
    throw err;
  }
}

// ──────────────────────────────────────────────
// Initialisation
// ──────────────────────────────────────────────

function init() {
  // Cache DOM refs
  els.canvas = document.getElementById('live2d-canvas');
  els.canvasWrap = document.getElementById('canvas-wrap');
  els.icon = document.getElementById('emotion-icon');
  els.name = document.getElementById('emotion-name');
  els.dot = document.getElementById('status-dot');
  els.label = document.getElementById('status-label');
  els.effects = document.getElementById('float-effects');
  els.loading = document.getElementById('loading');
  els.badge = document.getElementById('emotion-badge-top');
  els.badgeIcon = document.getElementById('badge-icon');
  els.badgeText = document.getElementById('badge-text');
  els.demoBtn = document.getElementById('demo-btn');
  els.demoIndicator = document.getElementById('demo-indicator');

  if (!els.canvas) {
    console.error('[claude-emotion-link] Canvas element not found');
    return;
  }

  // Demo button click handler
  if (els.demoBtn) {
    els.demoBtn.addEventListener('click', toggleDemo);
  }

  // Expose setEmotion globally for SSE injection script
  window.setEmotion = setEmotion;

  // Expose demo toggle globally
  window.toggleDemo = toggleDemo;

  // Expose SSE connected callback
  window.onSSEConnected = function () {
    if (els.dot) els.dot.className = 'status-dot connected';
    if (els.label) els.label.textContent = '✦ Live';
  };

  // Load server config (demo settings)
  fetch('/config')
    .then(r => r.json())
    .then(cfg => {
      if (cfg.demo) {
        demoInterval = cfg.demo.intervalMs || 3000;
        // Auto-start demo if configured
        if (cfg.demo.enabled) toggleDemo();
      }
    })
    .catch(() => {});

  // Check URL param for demo mode
  if (window.location.search.includes('demo')) {
    setTimeout(() => toggleDemo(), 1500); // Delay to let model load first
  }

  // Init keyboard shortcuts
  initKeyboard();

  // Start loading
  loadModel().catch(() => {});

  // Connect SSE
  connectSSE();

  // Initialise magic tail canvas
  initTailCanvas();

  console.log('[claude-emotion-link] Viewer v2.2 initialised (Hiyori C4, 28 params + Magic Tail + Demo + KB shortcuts)');
}

// ──────────────────────────────────────────────
// Boot
// ──────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
