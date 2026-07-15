/**
 * claude-emotion-link — Live2D Emotion Viewer
 * ============================================
 *
 * Renders a Live2D model whose facial expressions react
 * to emotion data received via Server-Sent Events (SSE)
 * from the claude-emotion-link server.
 *
 * Dependencies (loaded via CDN in index.html):
 *   • Live2D Cubism Core (live2dcubismcore.min.js)
 *   • pixi.js v7
 *   • pixi-live2d-display
 *
 * ─── Expression Mapping ───
 * Each emotion is defined as a set of Live2D parameter
 * values.  The viewer smoothly interpolates between them.
 */

// ──────────────────────────────────────────────
// Emotion ↔ Parameter Mapping
// ──────────────────────────────────────────────
//
// Parameter ranges (typical for Cubism 4 models):
//   EyeLOpen / EyeROpen   : 0 (closed) → 1 (open)
//   EyeLSmile / EyeRSmile : 0 (normal)  → 1 (^_^)
//   BrowLForm / BrowRForm : -1 (down)   → 0 (neutral) → 1 (up)
//   MouthForm             : -1 (frown)  → 0 (neutral) → 1 (smile)
//   MouthOpenY            : 0 (closed)  → 1 (open)
//   Cheek                 : 0 (none)    → 1 (full blush)
//   AngleX                : -30 (left)  → 0 → 30 (right)
//   AngleY                : -30 (down)  → 0 → 30 (up)

const EXPRESSIONS = {
  neutral: {
    label: '平常',
    icon: '😊',
    params: {
      ParamEyeLOpen: 1.0,
      ParamEyeROpen: 1.0,
      ParamEyeLSmile: 0.0,
      ParamEyeRSmile: 0.0,
      ParamBrowLForm: 0.0,
      ParamBrowRForm: 0.0,
      ParamMouthForm: 0.0,
      ParamMouthOpenY: 0.0,
      ParamCheek: 0.0,
      ParamAngleX: 0,
      ParamAngleY: 0,
    },
    effects: ['✦'],
  },

  happy: {
    label: '开心',
    icon: '😄',
    params: {
      ParamEyeLOpen: 0.75,
      ParamEyeROpen: 0.75,
      ParamEyeLSmile: 0.8,
      ParamEyeRSmile: 0.8,
      ParamBrowLForm: 0.3,
      ParamBrowRForm: 0.3,
      ParamMouthForm: 0.6,
      ParamMouthOpenY: 0.25,
      ParamCheek: 0.0,
      ParamAngleX: 0,
      ParamAngleY: 2,
    },
    effects: ['✿', '♥', '★'],
  },

  veryHappy: {
    label: '超开心',
    icon: '🌟',
    params: {
      ParamEyeLOpen: 0.6,
      ParamEyeROpen: 0.6,
      ParamEyeLSmile: 1.0,
      ParamEyeRSmile: 1.0,
      ParamBrowLForm: 0.5,
      ParamBrowRForm: 0.5,
      ParamMouthForm: 1.0,
      ParamMouthOpenY: 0.45,
      ParamCheek: 0.2,
      ParamAngleX: 3,
      ParamAngleY: 4,
    },
    effects: ['🌟', '✨', '🎉', '♥', '★', '✿'],
  },

  sad: {
    label: '难过',
    icon: '😢',
    params: {
      ParamEyeLOpen: 0.7,
      ParamEyeROpen: 0.7,
      ParamEyeLSmile: 0.0,
      ParamEyeRSmile: 0.0,
      ParamBrowLForm: -0.3,
      ParamBrowRForm: -0.3,
      ParamMouthForm: -0.4,
      ParamMouthOpenY: 0.05,
      ParamCheek: 0.0,
      ParamAngleX: 0,
      ParamAngleY: -5,
    },
    effects: ['💧', '。'],
  },

  surprised: {
    label: '惊讶',
    icon: '😮',
    params: {
      ParamEyeLOpen: 1.0,
      ParamEyeROpen: 1.0,
      ParamEyeLSmile: 0.0,
      ParamEyeRSmile: 0.0,
      ParamBrowLForm: 0.8,
      ParamBrowRForm: 0.8,
      ParamMouthForm: 0.0,
      ParamMouthOpenY: 0.7,
      ParamCheek: 0.0,
      ParamAngleX: 0,
      ParamAngleY: 3,
    },
    effects: ['❕', '❗', '✦'],
  },

  thinking: {
    label: '思考',
    icon: '🤔',
    params: {
      ParamEyeLOpen: 0.5,
      ParamEyeROpen: 0.5,
      ParamEyeLSmile: 0.0,
      ParamEyeRSmile: 0.0,
      ParamBrowLForm: -0.2,
      ParamBrowRForm: 0.2,
      ParamMouthForm: -0.2,
      ParamMouthOpenY: 0.0,
      ParamCheek: 0.0,
      ParamAngleX: -3,
      ParamAngleY: -2,
    },
    effects: ['❓', '❔', '⋯'],
  },

  angry: {
    label: '生气',
    icon: '😣',
    params: {
      ParamEyeLOpen: 0.8,
      ParamEyeROpen: 0.8,
      ParamEyeLSmile: 0.0,
      ParamEyeRSmile: 0.0,
      ParamBrowLForm: -0.7,
      ParamBrowRForm: -0.7,
      ParamMouthForm: -0.6,
      ParamMouthOpenY: 0.1,
      ParamCheek: 0.0,
      ParamAngleX: 0,
      ParamAngleY: -2,
    },
    effects: ['💢', '🔥'],
  },

  embarrassed: {
    label: '害羞',
    icon: '😳',
    params: {
      ParamEyeLOpen: 0.9,
      ParamEyeROpen: 0.9,
      ParamEyeLSmile: 0.3,
      ParamEyeRSmile: 0.3,
      ParamBrowLForm: 0.2,
      ParamBrowRForm: 0.2,
      ParamMouthForm: 0.3,
      ParamMouthOpenY: 0.1,
      ParamCheek: 0.8,
      ParamAngleX: -8,
      ParamAngleY: -6,
    },
    effects: ['💕', '〜', '♡'],
  },

  sleepy: {
    label: '困倦',
    icon: '😴',
    params: {
      ParamEyeLOpen: 0.2,
      ParamEyeROpen: 0.2,
      ParamEyeLSmile: 0.0,
      ParamEyeRSmile: 0.0,
      ParamBrowLForm: 0.0,
      ParamBrowRForm: 0.0,
      ParamMouthForm: 0.0,
      ParamMouthOpenY: 0.05,
      ParamCheek: 0.0,
      ParamAngleX: 0,
      ParamAngleY: 2,
    },
    effects: ['💤', 'z', 'Z'],
  },

  tipsy: {
    label: '微醺',
    icon: '🍷',
    params: {
      ParamEyeLOpen: 0.6,
      ParamEyeROpen: 0.6,
      ParamEyeLSmile: 0.4,
      ParamEyeRSmile: 0.4,
      ParamBrowLForm: 0.1,
      ParamBrowRForm: 0.1,
      ParamMouthForm: 0.4,
      ParamMouthOpenY: 0.15,
      ParamCheek: 0.6,
      ParamAngleX: 5,
      ParamAngleY: 3,
    },
    effects: ['🍷', '✦', '♡', '〜'],
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
    try { start[k] = core.getParameterValue(k); }
    catch { start[k] = 0; }
  }

  const t0 = performance.now();

  function step(now) {
    const t = Math.min((now - t0) / duration, 1);
    // Ease-out cubic
    const e = 1 - Math.pow(1 - t, 3);

    for (const k of keys) {
      const v = start[k] + (target[k] - start[k]) * e;
      try { core.setParameterValue(k, v); } catch {}
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
// Set emotion
// ──────────────────────────────────────────────

function setEmotion(emotionId, source) {
  const expr = EXPRESSIONS[emotionId];
  if (!expr || emotionId === currentEmotion) return;

  currentEmotion = emotionId;
  targetParams = { ...expr.params };

  // Animate model parameters
  animateToParams(targetParams, 380);

  // Update UI
  updateUI(expr);

  // Spawn floating effects
  spawnEffects(expr.effects);
}

// ──────────────────────────────────────────────
// UI updates
// ──────────────────────────────────────────────

function updateUI(expr) {
  if (els.icon) {
    els.icon.textContent = expr.icon;
    els.icon.classList.remove('changed');
    void els.icon.offsetWidth;
    els.icon.classList.add('changed');
  }
  if (els.name) els.name.textContent = expr.label;
}

function spawnEffects(effects) {
  if (!els.effects) return;
  const container = els.effects;

  // Clear old
  container.innerHTML = '';

  const count = effects.length * 2;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'float-item';
    el.textContent = effects[i % effects.length];
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.top = (20 + Math.random() * 60) + '%';
    el.style.fontSize = (18 + Math.random() * 16) + 'px';
    el.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    el.style.animationDelay = (Math.random() * 0.6) + 's';
    container.appendChild(el);
  }

  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ──────────────────────────────────────────────
// SSE connection
// ──────────────────────────────────────────────

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
    if (els.dot) els.dot.className = 'status-dot connected';
    if (els.label) els.label.textContent = 'SSE Live';
  };

  es.onerror = function () {
    if (els.dot) els.dot.className = 'status-dot error';
    if (els.label) els.label.textContent = 'Disconnected';
  };
}

// ──────────────────────────────────────────────
// Model loading
// ──────────────────────────────────────────────

async function loadModel() {
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

    // Center and scale
    const sw = app.screen.width;
    const sh = app.screen.height;
    model.x = sw / 2;
    model.y = sh - 20;
    model.scale.set(1);
    model.anchor.set(0.5, 1);

    app.stage.addChild(model);

    // Enable the built-in auto-blinking and breathing
    model.internalModel.coreModel.setParameterValue('ParamBreath', 0.5);

    // Set initial expression
    setEmotion('neutral', 'init');

    // Hide loading screen
    if (els.loading) els.loading.classList.add('hidden');

  } catch (err) {
    console.error('[claude-emotion-link] Model load failed:', err);
    if (els.loading) {
      els.loading.querySelector('.loading-text').textContent = '加载失败';
      els.loading.querySelector('.loading-sub').textContent = err.message;
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

  if (!els.canvas) {
    console.error('[claude-emotion-link] Canvas element not found');
    return;
  }

  // Expose setEmotion globally for SSE injection script
  window.setEmotion = setEmotion;

  // Expose SSE connected callback
  window.onSSEConnected = function () {
    if (els.dot) els.dot.className = 'status-dot connected';
    if (els.label) els.label.textContent = '✦ Live';
  };

  // Start loading
  loadModel().catch(() => {});

  // Connect SSE
  connectSSE();

  console.log('[claude-emotion-link] Viewer initialised');
}

// ──────────────────────────────────────────────
// Boot
// ──────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
