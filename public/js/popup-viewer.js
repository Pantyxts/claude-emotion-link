/**
 * popup-viewer.js — 独立 Live2D 角色悬浮窗
 * =============================================
 *
 * 从主窗口通过 URL 参数接收模型路径，独立渲染 Live2D 角色，
 * 透明背景，无 UI，专门用于 OBS 窗口捕获或桌面悬浮。
 *
 * URL 参数:
 *   ?model=models/hiyori_free_t08/hiyori_free_t08.model3.json
 *   ?scale=0.28  (可选，默认 0.28)
 */

// ── 读取 URL 参数 ──
const params = new URLSearchParams(window.location.search);
const MODEL_PATH = params.get('model') || 'models/hiyori_free_t08/hiyori_free_t08.model3.json';
const MODEL_SCALE = parseFloat(params.get('scale')) || 0.28;

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

  // Direct set (no interpolation for popup — keep it simple)
  for (const [k, v] of Object.entries(target)) {
    try { core.setParameterValueById(k, v); } catch {}
  }
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

  app = new PIXI.Application({
    view: canvas,
    width: 500,
    height: 600,
    transparent: true,
    backgroundAlpha: 0,
    antialias: true,
  });

  model = await Live2DModel.from(MODEL_PATH, { autoInteract: false });

  const sw = app.screen.width;
  const sh = app.screen.height;
  model.x = sw / 2;
  model.y = sh / 2;
  model.scale.set(MODEL_SCALE);
  model.anchor.set(0.5, 0.42);

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
  if (e.data && e.data.type === 'set-emotion' && e.data.emotion) {
    setEmotion(e.data.emotion);
  }
  if (e.data && e.data.type === 'set-model' && e.data.path) {
    window.location.search = '?model=' + encodeURIComponent(e.data.path);
  }
});

// ── Boot ──
(async () => {
  try {
    await loadModel();
    connectSSE();
  } catch (err) {
    document.getElementById('status').textContent = 'error: ' + err.message;
    console.error('Popup load failed:', err);
  }
})();
