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
  // Amplified v3 — all parameter values pushed ~1.5-2x for more vivid, readable expressions.
  // Hiyori's 28 params are subtle by default; these exaggerated targets make emotions pop.
  neutral: {
    label: '平常',
    icon: '😊',
    params: {
      ParamAngleX: 0, ParamAngleY: 0, ParamAngleZ: 0,
      ParamCheek: 0,
      ParamEyeLOpen: 1.0, ParamEyeROpen: 1.0,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: 0, ParamBrowRForm: 0,
      ParamMouthForm: 0, ParamMouthOpenY: 0,
      ParamBodyAngleX: 0, ParamBodyAngleY: 0, ParamBodyAngleZ: 0,
      ParamBreath: 0.5,
      ParamArmLA: 0, ParamArmRA: 0,
    },
    effects: ['✦'],
    tail: { sway: 0.3, speed: 0.8, color: '#64b5f6' },
  },

  happy: {
    label: '开心',
    icon: '😄',
    params: {
      ParamAngleX: 0, ParamAngleY: 3, ParamAngleZ: 0,
      ParamCheek: 0.3,
      ParamEyeLOpen: 0.7, ParamEyeROpen: 0.7,
      ParamEyeLSmile: 0.95, ParamEyeRSmile: 0.95,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: 0.5, ParamBrowRForm: 0.5,
      ParamMouthForm: 0.75, ParamMouthOpenY: 0,
      ParamBodyAngleX: 0, ParamBodyAngleY: 3, ParamBodyAngleZ: 0,
      ParamBreath: 0.6,
      ParamArmLA: 0.08, ParamArmRA: 0.08,
    },
    effects: ['✿', '♥', '★', '✨'],
    tail: { sway: 0.7, speed: 1.8, color: '#ffd700' },
  },

  veryHappy: {
    label: '超开心',
    icon: '🌟',
    params: {
      ParamAngleX: 3, ParamAngleY: 6, ParamAngleZ: 2,
      ParamCheek: 0.55,
      ParamEyeLOpen: 0.4, ParamEyeROpen: 0.4,
      ParamEyeLSmile: 1.0, ParamEyeRSmile: 1.0,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: 0.85, ParamBrowRForm: 0.85,
      ParamMouthForm: 1.0, ParamMouthOpenY: 0.3,
      ParamBodyAngleX: 2, ParamBodyAngleY: 5, ParamBodyAngleZ: 0,
      ParamBreath: 0.75,
      ParamArmLA: 0.2, ParamArmRA: 0.2,
    },
    effects: ['🌟', '✨', '🎉', '♥', '★', '✿'],
    tail: { sway: 0.95, speed: 2.5, color: '#ff6b9d' },
  },

  sad: {
    label: '难过',
    icon: '😢',
    params: {
      ParamAngleX: 0, ParamAngleY: -5, ParamAngleZ: 0,
      ParamCheek: 0,
      ParamEyeLOpen: 0.45, ParamEyeROpen: 0.45,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: -0.25,
      ParamBrowLForm: -0.65, ParamBrowRForm: -0.65,
      ParamMouthForm: -0.6, ParamMouthOpenY: 0,
      ParamBodyAngleX: 0, ParamBodyAngleY: -5, ParamBodyAngleZ: 0,
      ParamBreath: 0.35,
      ParamArmLA: -0.1, ParamArmRA: -0.1,
    },
    effects: ['💧', '。'],
    tail: { sway: 0.08, speed: 0.3, color: '#5c6bc0' },
  },

  surprised: {
    label: '惊讶',
    icon: '😮',
    params: {
      ParamAngleX: 0, ParamAngleY: 4, ParamAngleZ: 0,
      ParamCheek: 0,
      ParamEyeLOpen: 1.0, ParamEyeROpen: 1.0,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: 1.0, ParamBrowRForm: 1.0,
      ParamMouthForm: 0.1, ParamMouthOpenY: 0.9,
      ParamBodyAngleX: 0, ParamBodyAngleY: 4, ParamBodyAngleZ: 0,
      ParamBreath: 0.65,
      ParamArmLA: 0.25, ParamArmRA: 0.25,
    },
    effects: ['❕', '❗', '✦'],
    tail: { sway: 0.6, speed: 2.2, color: '#ab47bc' },
  },

  thinking: {
    label: '思考',
    icon: '🤔',
    params: {
      ParamAngleX: -6, ParamAngleY: -2, ParamAngleZ: 2,
      ParamCheek: 0,
      ParamEyeLOpen: 0.55, ParamEyeROpen: 0.75,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0.35, ParamEyeBallY: 0.15,
      ParamBrowLForm: -0.45, ParamBrowRForm: 0.55,
      ParamMouthForm: -0.15, ParamMouthOpenY: 0,
      ParamBodyAngleX: -3, ParamBodyAngleY: -2, ParamBodyAngleZ: 0,
      ParamBreath: 0.5,
      ParamArmLA: 0.15, ParamArmRA: 0,
    },
    effects: ['❓', '❔', '⋯'],
    tail: { sway: 0.15, speed: 0.5, color: '#7e57c2' },
  },

  angry: {
    label: '生气',
    icon: '😣',
    params: {
      ParamAngleX: 0, ParamAngleY: -3, ParamAngleZ: 0,
      ParamCheek: 0.1,
      ParamEyeLOpen: 0.9, ParamEyeROpen: 0.9,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: 0,
      ParamBrowLForm: -0.95, ParamBrowRForm: -0.95,
      ParamMouthForm: -0.55, ParamMouthOpenY: 0.15,
      ParamBodyAngleX: 0, ParamBodyAngleY: -3, ParamBodyAngleZ: 0,
      ParamBreath: 0.75,
      ParamArmLA: 0.2, ParamArmRA: 0.2,
    },
    effects: ['💢', '🔥', '⚡'],
    tail: { sway: 0.6, speed: 3.5, color: '#ef5350' },
  },

  embarrassed: {
    label: '害羞',
    icon: '😳',
    params: {
      ParamAngleX: -10, ParamAngleY: -6, ParamAngleZ: 3,
      ParamCheek: 1.0,
      ParamEyeLOpen: 0.8, ParamEyeROpen: 0.8,
      ParamEyeLSmile: 0.4, ParamEyeRSmile: 0.4,
      ParamEyeBallX: -0.35, ParamEyeBallY: -0.15,
      ParamBrowLForm: 0.3, ParamBrowRForm: 0.3,
      ParamMouthForm: 0.3, ParamMouthOpenY: 0,
      ParamBodyAngleX: -5, ParamBodyAngleY: -3, ParamBodyAngleZ: 2,
      ParamBreath: 0.6,
      ParamArmLA: 0.08, ParamArmRA: 0.08,
    },
    effects: ['💕', '〜', '♡'],
    tail: { sway: 0.5, speed: 1.4, color: '#ff80ab' },
  },

  sleepy: {
    label: '困倦',
    icon: '😴',
    params: {
      ParamAngleX: 3, ParamAngleY: 0, ParamAngleZ: 3,
      ParamCheek: 0,
      ParamEyeLOpen: 0.06, ParamEyeROpen: 0.06,
      ParamEyeLSmile: 0, ParamEyeRSmile: 0,
      ParamEyeBallX: 0, ParamEyeBallY: -0.15,
      ParamBrowLForm: -0.08, ParamBrowRForm: -0.08,
      ParamMouthForm: 0, ParamMouthOpenY: 0.08,
      ParamBodyAngleX: 2, ParamBodyAngleY: 0, ParamBodyAngleZ: 0,
      ParamBreath: 0.3,
      ParamArmLA: -0.15, ParamArmRA: -0.15,
    },
    effects: ['💤', 'z', 'Z'],
    tail: { sway: 0.05, speed: 0.2, color: '#90a4ae' },
  },

  tipsy: {
    label: '微醺',
    icon: '🍷',
    params: {
      ParamAngleX: 10, ParamAngleY: 5, ParamAngleZ: 6,
      ParamCheek: 0.85,
      ParamEyeLOpen: 0.4, ParamEyeROpen: 0.4,
      ParamEyeLSmile: 0.6, ParamEyeRSmile: 0.6,
      ParamEyeBallX: 0.15, ParamEyeBallY: -0.08,
      ParamBrowLForm: 0.2, ParamBrowRForm: 0.2,
      ParamMouthForm: 0.5, ParamMouthOpenY: 0.08,
      ParamBodyAngleX: 5, ParamBodyAngleY: 3, ParamBodyAngleZ: 2,
      ParamBreath: 0.55,
      ParamArmLA: 0, ParamArmRA: 0,
    },
    effects: ['🍷', '✦', '♡', '〜'],
    tail: { sway: 0.7, speed: 1.2, color: '#ff8a65' },
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

// ── Model pan & zoom state ──
let modelOffsetX = 0;     // drag X offset from center
let modelOffsetY = 0;     // drag Y offset from center
let modelZoom = 1.0;      // extra zoom multiplier on top of MODEL_SCALE
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartModelX = 0;
let dragStartModelY = 0;

const ZOOM_MIN = 0.3;     // minimum zoom
const ZOOM_MAX = 3.0;     // maximum zoom
const ZOOM_STEP = 0.08;   // scroll wheel step

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

  // Notify popup window if open
  if (popupWindow && !popupWindow.closed) {
    try { popupWindow.postMessage({ type: 'set-emotion', emotion: emotionId }, '*'); } catch {}
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
// Popup window (standalone character overlay)
// ──────────────────────────────────────────────

let popupWindow = null;

function openPopup() {
  if (popupWindow && !popupWindow.closed) {
    popupWindow.focus();
    return;
  }
  const url = '/popup.html?model=' + encodeURIComponent(MODEL_PATH)
    + '&scale=' + MODEL_SCALE
    + '&x=' + Math.round(modelOffsetX)
    + '&y=' + Math.round(modelOffsetY)
    + '&zoom=' + modelZoom.toFixed(2);
  popupWindow = window.open(url, 'live2d-overlay', 'width=520,height=680,menubar=no,toolbar=no,status=no,resizable=yes');
  if (els.popupBtn) els.popupBtn.textContent = '📌 已弹出';
}

// Listen for popup-ready message
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'popup-ready') {
    // Send current emotion + view state to popup
    if (popupWindow && !popupWindow.closed) {
      popupWindow.postMessage({
        type: 'set-emotion',
        emotion: currentEmotion,
      }, '*');
      popupWindow.postMessage({
        type: 'view-state',
        x: Math.round(modelOffsetX),
        y: Math.round(modelOffsetY),
        zoom: modelZoom,
      }, '*');
    }
  }
});

// Check if popup closed
setInterval(() => {
  if (popupWindow && popupWindow.closed) {
    popupWindow = null;
    if (els.popupBtn) els.popupBtn.textContent = '📌 弹出角色';
  }
}, 1000);

// ──────────────────────────────────────────────
// Model switching
// ──────────────────────────────────────────────

let MODEL_PATH = 'models/hiyori_free_t08/hiyori_free_t08.model3.json';
let MODEL_SCALE = 0.28;

async function loadModelList() {
  if (!els.modelList) return;
  try {
    const r = await fetch('/models');
    const data = await r.json();
    if (data.models && data.models.length > 0) {
      els.modelList.innerHTML = data.models.map(m => {
        const isActive = MODEL_PATH === m.path;
        return '<div class="model-list-item' + (isActive ? ' active' : '') + '" data-path="' + m.path + '">' + m.name + '</div>';
      }).join('');
      // Click handlers
      els.modelList.querySelectorAll('.model-list-item').forEach(el => {
        el.addEventListener('click', () => switchModel(el.dataset.path));
      });
    } else {
      els.modelList.innerHTML = '<div style="font-size:11px;color:#5a70a0;">未找到其他模型</div>';
    }
  } catch {
    els.modelList.innerHTML = '<div style="font-size:11px;color:#ff6b6b;">加载失败</div>';
  }
}

async function switchModel(newPath) {
  if (newPath === MODEL_PATH) return;
  // Pass model path via URL param so it persists across reload
  const sep = window.location.search ? '&' : '?';
  window.location.search = '?model=' + encodeURIComponent(newPath) + '&scale=' + MODEL_SCALE;
}

function initModelPanel() {
  if (!els.modelBtn || !els.modelPanel) return;

  els.modelBtn.addEventListener('click', () => {
    const visible = els.modelPanel.style.display !== 'none';
    els.modelPanel.style.display = visible ? 'none' : 'flex';
    els.modelPanel.style.flexDirection = 'column';
    if (!visible) loadModelList();
  });

  // Manual path load
  if (els.modelLoadBtn && els.modelPathInput) {
    els.modelLoadBtn.addEventListener('click', () => {
      const p = els.modelPathInput.value.trim();
      if (p) switchModel(p);
    });
    els.modelPathInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const p = els.modelPathInput.value.trim();
        if (p) switchModel(p);
      }
    });
  }

  // File import
  if (els.modelFileInput) {
    els.modelFileInput.addEventListener('change', async () => {
      const file = els.modelFileInput.files[0];
      if (!file) return;
      try {
        // Create a blob URL for the uploaded model3.json
        const blobUrl = URL.createObjectURL(file);
        MODEL_PATH = blobUrl;
        // For now, just reload — pixi-live2d-display can handle blob URLs
        // but referenced files (moc3, textures) won't resolve. Show warning.
        alert('注意：导入单个 .model3.json 文件只能切换模型描述，\n.moc3 和贴图文件需要在同目录下才能正确加载。\n\n建议把模型整个文件夹放到 public/models/ 下，\n然后从列表切换。');
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.error('Import failed:', e);
      }
    });
  }
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
// Model pan & zoom (mouse drag + scroll)
// ──────────────────────────────────────────────

/** Apply current offset + zoom to the model */
function applyModelTransform() {
  if (!model || !app) return;
  const sw = app.screen.width;
  const sh = app.screen.height;
  model.x = sw / 2 + modelOffsetX;
  model.y = sh / 2 + modelOffsetY;
  model.scale.set(MODEL_SCALE * modelZoom);
}

/** Update zoom indicator badge */
function updateZoomBadge() {
  if (els.zoomBadge) {
    const pct = Math.round(modelZoom * 100);
    els.zoomBadge.textContent = pct + '%';
    // Show badge briefly when zooming
    els.zoomBadge.style.opacity = '1';
    clearTimeout(els._zoomBadgeTimer);
    els._zoomBadgeTimer = setTimeout(() => {
      if (els.zoomBadge) els.zoomBadge.style.opacity = '0';
    }, 1500);
  }
}

let _viewURLTimer = null;
function updateViewURL() {
  // Throttle to max once per 200ms
  if (_viewURLTimer) return;
  _viewURLTimer = setTimeout(() => {
    _viewURLTimer = null;
    const url = new URL(window.location);
    url.searchParams.set('model', MODEL_PATH);
    url.searchParams.set('scale', MODEL_SCALE);
    url.searchParams.set('x', Math.round(modelOffsetX));
    url.searchParams.set('y', Math.round(modelOffsetY));
    url.searchParams.set('zoom', modelZoom.toFixed(2));
    window.history.replaceState(null, '', url.toString());
  }, 200);
}

function initPanZoom() {
  if (!els.canvas) return;

  const canvas = els.canvas;

  // Cursor style
  canvas.style.cursor = 'grab';

  // ── Mouse down: start drag ──
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Left button only
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartModelX = modelOffsetX;
    dragStartModelY = modelOffsetY;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  });

  // ── Mouse move: drag model ──
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    modelOffsetX = dragStartModelX + dx;
    modelOffsetY = dragStartModelY + dy;
    applyModelTransform();
    updateViewURL();
  });

  // ── Mouse up: end drag ──
  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  // ── Scroll wheel: zoom ──
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Zoom toward cursor position
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;  // cursor pos relative to center
    const cy = e.clientY - rect.top - rect.height / 2;

    const oldZoom = modelZoom;
    if (e.deltaY < 0) {
      modelZoom = Math.min(ZOOM_MAX, modelZoom + ZOOM_STEP);
    } else {
      modelZoom = Math.max(ZOOM_MIN, modelZoom - ZOOM_STEP);
    }

    // Adjust offset so the point under cursor stays in place
    const zoomRatio = modelZoom / oldZoom;
    modelOffsetX = cx + (modelOffsetX - cx) * zoomRatio;
    modelOffsetY = cy + (modelOffsetY - cy) * zoomRatio;

    applyModelTransform();
    updateZoomBadge();
    updateViewURL();
  }, { passive: false });

  // ── Double-click: reset view ──
  canvas.addEventListener('dblclick', () => {
    modelOffsetX = 0;
    modelOffsetY = 0;
    modelZoom = 1.0;
    applyModelTransform();
    updateZoomBadge();
    updateViewURL();
    if (els.zoomBadge) {
      els.zoomBadge.textContent = '已重置';
      els.zoomBadge.style.opacity = '1';
      clearTimeout(els._zoomBadgeTimer);
      els._zoomBadgeTimer = setTimeout(() => {
        if (els.zoomBadge) els.zoomBadge.style.opacity = '0';
      }, 1200);
    }
  });

  // Touch support
  let touchStartDist = 0;
  let touchStartZoom = 1;
  let touchStartMidX = 0;
  let touchStartMidY = 0;
  let touchStartOffX = 0;
  let touchStartOffY = 0;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragStartModelX = modelOffsetX;
      dragStartModelY = modelOffsetY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.sqrt(dx * dx + dy * dy);
      touchStartZoom = modelZoom;
      touchStartMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchStartMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchStartOffX = modelOffsetX;
      touchStartOffY = modelOffsetY;
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      modelOffsetX = dragStartModelX + (e.touches[0].clientX - dragStartX);
      modelOffsetY = dragStartModelY + (e.touches[0].clientY - dragStartY);
      applyModelTransform();
      updateViewURL();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = touchStartDist > 0 ? dist / touchStartDist : 1;
      modelZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, touchStartZoom * scale));
      // Pan along with pinch center
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      modelOffsetX = touchStartOffX + (midX - touchStartMidX);
      modelOffsetY = touchStartOffY + (midY - touchStartMidY);
      applyModelTransform();
      updateZoomBadge();
      updateViewURL();
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Re-apply transform when window resizes (PIXI resizeTo changes screen size)
  window.addEventListener('resize', () => {
    applyModelTransform();
  });
}

// ──────────────────────────────────────────────
// Model loading
// ──────────────────────────────────────────────

async function loadModel() {
  // Read model path, scale, position from URL params (for model switching + view state)
  const urlParams = new URLSearchParams(window.location.search);
  const modelFromUrl = urlParams.get('model');
  if (modelFromUrl) MODEL_PATH = modelFromUrl;
  const scaleFromUrl = parseFloat(urlParams.get('scale'));
  if (scaleFromUrl) MODEL_SCALE = scaleFromUrl;
  const xFromUrl = parseFloat(urlParams.get('x'));
  if (!isNaN(xFromUrl)) modelOffsetX = xFromUrl;
  const yFromUrl = parseFloat(urlParams.get('y'));
  if (!isNaN(yFromUrl)) modelOffsetY = yFromUrl;
  const zoomFromUrl = parseFloat(urlParams.get('zoom'));
  if (!isNaN(zoomFromUrl)) modelZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomFromUrl));

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

    // Position model — anchor (0.5, 0.42) to favor upper body / face
    model.anchor.set(0.5, 0.42);
    applyModelTransform();

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
  els.popupBtn = document.getElementById('popup-btn');
  els.modelBtn = document.getElementById('model-btn');
  els.modelPanel = document.getElementById('model-panel');
  els.modelList = document.getElementById('model-list');
  els.modelLoadBtn = document.getElementById('model-load-btn');
  els.modelPathInput = document.getElementById('model-path-input');
  els.modelFileInput = document.getElementById('model-file-input');
  els.zoomBadge = document.getElementById('zoom-badge');

  if (!els.canvas) {
    console.error('[claude-emotion-link] Canvas element not found');
    return;
  }

  // Demo button click handler
  if (els.demoBtn) {
    els.demoBtn.addEventListener('click', toggleDemo);
  }

  // Popup button — open standalone character window
  if (els.popupBtn) {
    els.popupBtn.addEventListener('click', openPopup);
  }

  // Model panel — init toggle + file import handlers
  initModelPanel();

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

  // Init pan/zoom mouse interactions
  initPanZoom();

  // Start loading
  loadModel().catch(() => {});

  // Connect SSE
  connectSSE();

  // Initialise magic tail canvas
  initTailCanvas();

  console.log('[claude-emotion-link] Viewer v2.4 initialised (Hiyori C4, 28 params + Pan/Zoom + Popup + Demo)');
}

// ──────────────────────────────────────────────
// Boot
// ──────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
