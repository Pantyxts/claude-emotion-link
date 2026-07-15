/**
 * popup-viewer.js — 独立 Live2D 角色悬浮窗
 * =============================================
 *
 * 从主窗口通过 URL 参数接收模型路径和视角状态，
 * 独立渲染 Live2D 角色，透明背景，无 UI。
 * 支持拖拽平移 + 滚轮缩放 + 双击重置。
 *
 * URL 参数:
 *   ?model=models/hiyori_free_t08/hiyori_free_t08.model3.json
 *   &scale=0.22&x=0&y=0&zoom=1.00
 */

// ── 读取 URL 参数 ──
const params = new URLSearchParams(window.location.search);
const MODEL_PATH = params.get('model') || 'models/hiyori_free_t08/hiyori_free_t08.model3.json';
const MODEL_SCALE = parseFloat(params.get('scale')) || 0.22;
let modelOffsetX = parseFloat(params.get('x')) || 0;
let modelOffsetY = parseFloat(params.get('y')) || 0;
let modelZoom = parseFloat(params.get('zoom')) || 1.0;

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 0.06;

// ── 表情参数映射（和主 viewer.js 保持一致）──
const EXPRESSIONS = {
  neutral: {
    params: {
      ParamAngleX:0, ParamAngleY:0, ParamAngleZ:0, ParamCheek:0,
      ParamEyeLOpen:1, ParamEyeROpen:1, ParamEyeLSmile:0, ParamEyeRSmile:0,
      ParamEyeBallX:0, ParamEyeBallY:0,
      ParamBrowLForm:0, ParamBrowRForm:0,
      ParamMouthForm:0, ParamMouthOpenY:0,
      ParamBodyAngleX:0, ParamBodyAngleY:0, ParamBodyAngleZ:0, ParamBreath:0.5,
      ParamArmLA:0, ParamArmRA:0,
    },
  },
  happy: {
    params: {
      ParamAngleX:0, ParamAngleY:2, ParamAngleZ:0, ParamCheek:0.15,
      ParamEyeLOpen:0.75, ParamEyeROpen:0.75, ParamEyeLSmile:0.7, ParamEyeRSmile:0.7,
      ParamEyeBallX:0, ParamEyeBallY:0,
      ParamBrowLForm:0.35, ParamBrowRForm:0.35,
      ParamMouthForm:0.5, ParamMouthOpenY:0,
      ParamBodyAngleX:0, ParamBodyAngleY:1, ParamBodyAngleZ:0, ParamBreath:0.6,
      ParamArmLA:0.05, ParamArmRA:0.05,
    },
  },
  veryHappy: {
    params: {
      ParamAngleX:2, ParamAngleY:4, ParamAngleZ:1, ParamCheek:0.35,
      ParamEyeLOpen:0.5, ParamEyeROpen:0.5, ParamEyeLSmile:1, ParamEyeRSmile:1,
      ParamEyeBallX:0, ParamEyeBallY:0,
      ParamBrowLForm:0.6, ParamBrowRForm:0.6,
      ParamMouthForm:0.8, ParamMouthOpenY:0.15,
      ParamBodyAngleX:1, ParamBodyAngleY:3, ParamBodyAngleZ:0, ParamBreath:0.7,
      ParamArmLA:0.15, ParamArmRA:0.15,
    },
  },
  sad: {
    params: {
      ParamAngleX:0, ParamAngleY:-3, ParamAngleZ:0, ParamCheek:0,
      ParamEyeLOpen:0.65, ParamEyeROpen:0.65, ParamEyeLSmile:0, ParamEyeRSmile:0,
      ParamEyeBallX:0, ParamEyeBallY:-0.15,
      ParamBrowLForm:-0.35, ParamBrowRForm:-0.35,
      ParamMouthForm:-0.35, ParamMouthOpenY:0,
      ParamBodyAngleX:0, ParamBodyAngleY:-2, ParamBodyAngleZ:0, ParamBreath:0.4,
      ParamArmLA:-0.05, ParamArmRA:-0.05,
    },
  },
  surprised: {
    params: {
      ParamAngleX:0, ParamAngleY:2, ParamAngleZ:0, ParamCheek:0,
      ParamEyeLOpen:1, ParamEyeROpen:1, ParamEyeLSmile:0, ParamEyeRSmile:0,
      ParamEyeBallX:0, ParamEyeBallY:0,
      ParamBrowLForm:0.8, ParamBrowRForm:0.8,
      ParamMouthForm:0.1, ParamMouthOpenY:0.6,
      ParamBodyAngleX:0, ParamBodyAngleY:2, ParamBodyAngleZ:0, ParamBreath:0.6,
      ParamArmLA:0.2, ParamArmRA:0.2,
    },
  },
  thinking: {
    params: {
      ParamAngleX:-3, ParamAngleY:-1, ParamAngleZ:1, ParamCheek:0,
      ParamEyeLOpen:0.6, ParamEyeROpen:0.8, ParamEyeLSmile:0, ParamEyeRSmile:0,
      ParamEyeBallX:0.3, ParamEyeBallY:0.1,
      ParamBrowLForm:-0.2, ParamBrowRForm:0.3,
      ParamMouthForm:-0.1, ParamMouthOpenY:0,
      ParamBodyAngleX:-2, ParamBodyAngleY:-1, ParamBodyAngleZ:0, ParamBreath:0.5,
      ParamArmLA:0.1, ParamArmRA:0,
    },
  },
  angry: {
    params: {
      ParamAngleX:0, ParamAngleY:-1, ParamAngleZ:0, ParamCheek:0.05,
      ParamEyeLOpen:0.8, ParamEyeROpen:0.8, ParamEyeLSmile:0, ParamEyeRSmile:0,
      ParamEyeBallX:0, ParamEyeBallY:0,
      ParamBrowLForm:-0.7, ParamBrowRForm:-0.7,
      ParamMouthForm:-0.3, ParamMouthOpenY:0.1,
      ParamBodyAngleX:0, ParamBodyAngleY:-1, ParamBodyAngleZ:0, ParamBreath:0.7,
      ParamArmLA:0.15, ParamArmRA:0.15,
    },
  },
  embarrassed: {
    params: {
      ParamAngleX:-5, ParamAngleY:-4, ParamAngleZ:2, ParamCheek:0.9,
      ParamEyeLOpen:0.85, ParamEyeROpen:0.85, ParamEyeLSmile:0.3, ParamEyeRSmile:0.3,
      ParamEyeBallX:-0.2, ParamEyeBallY:-0.1,
      ParamBrowLForm:0.2, ParamBrowRForm:0.2,
      ParamMouthForm:0.2, ParamMouthOpenY:0,
      ParamBodyAngleX:-3, ParamBodyAngleY:-2, ParamBodyAngleZ:1, ParamBreath:0.6,
      ParamArmLA:0.05, ParamArmRA:0.05,
    },
  },
  sleepy: {
    params: {
      ParamAngleX:2, ParamAngleY:0, ParamAngleZ:2, ParamCheek:0,
      ParamEyeLOpen:0.15, ParamEyeROpen:0.15, ParamEyeLSmile:0, ParamEyeRSmile:0,
      ParamEyeBallX:0, ParamEyeBallY:-0.1,
      ParamBrowLForm:-0.05, ParamBrowRForm:-0.05,
      ParamMouthForm:0, ParamMouthOpenY:0.05,
      ParamBodyAngleX:1, ParamBodyAngleY:0, ParamBodyAngleZ:0, ParamBreath:0.35,
      ParamArmLA:-0.1, ParamArmRA:-0.1,
    },
  },
  tipsy: {
    params: {
      ParamAngleX:5, ParamAngleY:3, ParamAngleZ:3, ParamCheek:0.7,
      ParamEyeLOpen:0.55, ParamEyeROpen:0.55, ParamEyeLSmile:0.45, ParamEyeRSmile:0.45,
      ParamEyeBallX:0.1, ParamEyeBallY:-0.05,
      ParamBrowLForm:0.15, ParamBrowRForm:0.15,
      ParamMouthForm:0.35, ParamMouthOpenY:0.05,
      ParamBodyAngleX:3, ParamBodyAngleY:2, ParamBodyAngleZ:1, ParamBreath:0.55,
      ParamArmLA:0, ParamArmRA:0,
    },
  },
};

// ── Global state ──
let app = null;
let model = null;
let currentEmotion = 'neutral';

// ── Set emotion ──
function setEmotion(emotionId) {
  const expr = EXPRESSIONS[emotionId];
  if (!expr || !model || !model.internalModel) return;

  const core = model.internalModel.coreModel;
  if (!core) return;

  currentEmotion = emotionId;
  const target = expr.params;

  for (const [k, v] of Object.entries(target)) {
    try { core.setParameterValueById(k, v); } catch {}
  }
}

// ── Apply model transform ──
function applyModelTransform() {
  if (!model || !app) return;
  const sw = app.screen.width;
  const sh = app.screen.height;
  model.x = sw / 2 + modelOffsetX;
  model.y = sh / 2 + modelOffsetY;
  model.scale.set(MODEL_SCALE * modelZoom);
}

// ── Pan & Zoom ──
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartOffX = 0, dragStartOffY = 0;

function initPanZoom() {
  const canvas = document.getElementById('live2d-canvas');
  if (!canvas) return;

  canvas.style.cursor = 'grab';

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOffX = modelOffsetX;
    dragStartOffY = modelOffsetY;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    modelOffsetX = dragStartOffX + (e.clientX - dragStartX);
    modelOffsetY = dragStartOffY + (e.clientY - dragStartY);
    applyModelTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    if (canvas) canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;

    const oldZoom = modelZoom;
    if (e.deltaY < 0) {
      modelZoom = Math.min(ZOOM_MAX, modelZoom + ZOOM_STEP);
    } else {
      modelZoom = Math.max(ZOOM_MIN, modelZoom - ZOOM_STEP);
    }

    const ratio = modelZoom / oldZoom;
    modelOffsetX = cx + (modelOffsetX - cx) * ratio;
    modelOffsetY = cy + (modelOffsetY - cy) * ratio;

    applyModelTransform();
  }, { passive: false });

  canvas.addEventListener('dblclick', () => {
    modelOffsetX = 0;
    modelOffsetY = 0;
    modelZoom = 1.0;
    applyModelTransform();
  });

  // Touch support
  let tsDist = 0, tsZoom = 1, tsMidX = 0, tsMidY = 0, tsOffX = 0, tsOffY = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragStartOffX = modelOffsetX;
      dragStartOffY = modelOffsetY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      tsDist = Math.sqrt(dx * dx + dy * dy);
      tsZoom = modelZoom;
      tsMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      tsMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      tsOffX = modelOffsetX;
      tsOffY = modelOffsetY;
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      modelOffsetX = dragStartOffX + (e.touches[0].clientX - dragStartX);
      modelOffsetY = dragStartOffY + (e.touches[0].clientY - dragStartY);
      applyModelTransform();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = tsDist > 0 ? dist / tsDist : 1;
      modelZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, tsZoom * scale));
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      modelOffsetX = tsOffX + (midX - tsMidX);
      modelOffsetY = tsOffY + (midY - tsMidY);
      applyModelTransform();
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', () => { isDragging = false; });

  window.addEventListener('resize', () => { applyModelTransform(); });
}

// ── SSE ──
function connectSSE() {
  const es = new EventSource('/events');
  es.onmessage = function(e) {
    try {
      const d = JSON.parse(e.data);
      if (d.emotion && EXPRESSIONS[d.emotion]) {
        setEmotion(d.emotion);
      }
    } catch {}
  };
  es.onopen = function() {
    document.getElementById('status').textContent = 'live';
  };
  es.onerror = function() {
    document.getElementById('status').textContent = 'reconnecting...';
    es.close();
    setTimeout(connectSSE, 3000);
  };
}

// ── Load model ──
async function loadModel() {
  const canvas = document.getElementById('live2d-canvas');

  if (typeof PIXI === 'undefined') throw new Error('PIXI.js not loaded');
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel) throw new Error('pixi-live2d-display not loaded');

  const { Live2DModel } = PIXI.live2d;

  // Dynamic canvas size: use window inner size
  const w = window.innerWidth;
  const h = window.innerHeight;

  app = new PIXI.Application({
    view: canvas,
    width: w,
    height: h,
    transparent: true,
    backgroundAlpha: 0,
    antialias: true,
  });

  model = await Live2DModel.from(MODEL_PATH, { autoInteract: false });

  model.anchor.set(0.5, 0.42);
  applyModelTransform();

  app.stage.addChild(model);

  model.internalModel.coreModel.setParameterValueById('ParamBreath', 0.5);
  setEmotion('neutral');

  // Tell main window we're ready
  if (window.opener) {
    window.opener.postMessage({ type: 'popup-ready' }, '*');
  }
}

// ── Listen for commands from main window ──
window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'set-emotion' && e.data.emotion) {
    setEmotion(e.data.emotion);
  }
  if (e.data.type === 'view-state') {
    if (typeof e.data.x === 'number') modelOffsetX = e.data.x;
    if (typeof e.data.y === 'number') modelOffsetY = e.data.y;
    if (typeof e.data.zoom === 'number') modelZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, e.data.zoom));
    applyModelTransform();
  }
  if (e.data.type === 'set-model' && e.data.path) {
    window.location.search = '?model=' + encodeURIComponent(e.data.path);
  }
});

// ── Boot ──
(async () => {
  try {
    await loadModel();
    initPanZoom();
    connectSSE();
  } catch (err) {
    document.getElementById('status').textContent = 'error: ' + err.message;
    console.error('Popup load failed:', err);
  }
})();
