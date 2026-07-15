#!/usr/bin/env node
/**
 * emotion-link hook —— 情绪分析推送脚本
 * ======================================
 *
 * 从标准输入 / 环境变量 / CLI 参数读取文字，分析情绪后
 * POST 到本地的 emotion-link 服务，触发 Live2D 表情切换。
 *
 * ─── 用法 ───
 *   echo "好开心啊" | node hooks/claude-emotion-hook.js
 *   node hooks/claude-emotion-hook.js --text "呜呜好难过"
 *
 * ─── 工作流程 ───
 *   1. 读文字（stdin / LLM_MESSAGE_TEXT 环境变量 / --text 参数）
 *   2. 关键词打分判断情绪
 *   3. POST 到 http://localhost:3456/emotion
 *   4. 服务端通过 SSE 推给所有浏览器客户端
 */

const http = require('http');

const SERVER_HOST = 'localhost';
const SERVER_PORT = 3456;

// ─── Emotion Keyword Map ──────────────────────
const KEYWORDS = {
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

// ─── Emotion Analysis ─────────────────────────
function analyze(text) {
  if (!text || !text.trim()) return 'neutral';
  const lower = text.toLowerCase();
  const scores = {};
  for (const k of Object.keys(KEYWORDS)) scores[k] = 0;

  for (const [emotion, kws] of Object.entries(KEYWORDS)) {
    for (const kw of kws) {
      const lk = kw.toLowerCase();
      let i = lower.indexOf(lk);
      while (i !== -1) {
        scores[emotion] += kw.length > 2 ? 1 + kw.length * 0.1 : 1;
        i = lower.indexOf(lk, i + 1);
      }
    }
  }

  for (const neg of ['不', '没', '别']) {
    for (const [emotion, kws] of Object.entries(KEYWORDS)) {
      for (const kw of kws) {
        if (lower.includes(neg + kw.toLowerCase())) {
          scores[emotion] = Math.max(0, (scores[emotion] || 0) - 3);
        }
      }
    }
  }

  const ec = (text.match(/[！!]/g) || []).length;
  if (ec >= 2) {
    for (const e of ['happy','veryHappy','angry','surprised']) {
      if ((scores[e] || 0) > 0) scores[e] += ec * 0.5;
    }
  }
  const qc = (text.match(/[？?]/g) || []).length;
  if (qc >= 1) scores.thinking = (scores.thinking || 0) + qc * 2;

  let best = 'neutral', bestScore = 0;
  for (const [e, s] of Object.entries(scores)) {
    if (s > bestScore) { bestScore = s; best = e; }
  }
  return bestScore < 0.5 ? 'neutral' : best;
}

// ─── POST to Server ───────────────────────────
function postEmotion(emotion, text) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ emotion, text: text.slice(0, 200), source: 'hook' });
    const req = http.request({
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: '/emotion',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => { resolve(true); });
    req.on('error', () => { resolve(false); });
    req.write(data);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────
async function main() {
  let text = '';

  // CLI argument
  const args = process.argv.slice(2);
  const ti = args.indexOf('--text');
  if (ti !== -1 && args[ti + 1]) text = args[ti + 1];

  // Environment variable (some LLM tools provide message text this way)
  if (!text && process.env.LLM_MESSAGE_TEXT) text = process.env.LLM_MESSAGE_TEXT;

  // Stdin (universal hook pattern)
  if (!text) {
    try {
      const chunks = [];
      const timer = setTimeout(() => process.exit(0), 2000);
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
        clearTimeout(timer);
      }
      text = Buffer.concat(chunks).toString('utf-8');
    } catch {}
  }

  if (!text || !text.trim()) process.exit(0);

  const sample = text.slice(-500);
  if (sample.trim().length < 10) process.exit(0);

  const emotion = analyze(sample);
  await postEmotion(emotion, sample.slice(0, 100));
  process.exit(0);
}

main().catch(() => process.exit(0));
