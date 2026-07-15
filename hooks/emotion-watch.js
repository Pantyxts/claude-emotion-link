/**
 * emotion-watch.js — stdin 情绪自动守卫
 * ==========================================
 *
 * 从标准输入逐行读取文字，自动分析情绪并推送到 Live2D 显示。
 * 适合作为猫娘 AI 输出的管道下游，实现实时表情同步。
 *
 * ─── 使用方式 ───
 *   catgirl-ai | node hooks/emotion-watch.js
 *   tail -f chat.log | node hooks/emotion-watch.js
 *   echo "喵~ 今天真开心！" | node hooks/emotion-watch.js --once
 *
 * ─── 选项 ───
 *   --once    只处理一行就退出
 *   --port N  指定服务器端口（默认 3456）
 *   --raw     直接透传情绪名（不经过文本分析）
 *   --debug   打印分析详情
 *
 * ─── 示例输出 ───
 *   📥 "喵~ 今天真开心！[开心]" → 😄 开心
 *   📥 "呜…又失败了…"        → 😢 难过
 */

const http = require('http');
const readline = require('readline');

// ── 解析参数 ──
const args = process.argv.slice(2);
const ONCE   = args.includes('--once');
const RAW    = args.includes('--raw');
const DEBUG  = args.includes('--debug');

let PORT = 3456;
const portIdx = args.indexOf('--port');
if (portIdx !== -1 && args[portIdx + 1]) {
  PORT = parseInt(args[portIdx + 1], 10) || 3456;
}

const EMOTION_ICONS = {
  neutral: '😊', happy: '😄', veryHappy: '🌟', sad: '😢',
  surprised: '😮', thinking: '🤔', angry: '😣',
  embarrassed: '😳', sleepy: '😴', tipsy: '🍷',
};

// ── HTTP helpers ──
function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'localhost', port: PORT,
      path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch { resolve({ raw: buf }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function handleLine(line, idx) {
  const text = line.trim();
  if (!text) return;

  let emotion = 'neutral';

  if (RAW) {
    // Raw mode: the line itself is the emotion ID
    const raw = text.toLowerCase();
    if (EMOTION_ICONS[raw]) {
      emotion = raw;
    } else {
      // Try to find an emotion keyword in the raw text
      for (const e of Object.keys(EMOTION_ICONS)) {
        if (raw.includes(e)) { emotion = e; break; }
      }
    }
  } else {
    // Analyze mode: send text to /analyze for keyword detection
    try {
      const result = await postJSON('/analyze', { text });
      emotion = result.emotion || 'neutral';
      if (DEBUG) console.log('  [debug] scores →', emotion);
    } catch (err) {
      if (DEBUG) console.error('  [analyze error]', err.message);
      return;
    }
  }

  // Push emotion to server (also broadcasts via SSE)
  try {
    await postJSON('/emotion', { emotion, text: text.slice(0, 200), source: 'watch' });
    const icon = EMOTION_ICONS[emotion] || '❓';
    const prefix = idx !== undefined ? `[#${idx}]` : '';
    console.log(`${prefix} ${icon} ${emotion}  ←  ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`);
  } catch (err) {
    if (DEBUG) console.error('  [push error]', err.message);
  }
}

// ── Main ──
async function main() {
  console.log('🐾 emotion-watch 已就绪 (port ' + PORT + ')');
  console.log('   等待 stdin 输入…\n');

  if (ONCE) {
    // Single-shot mode: read one line and exit
    const rl = readline.createInterface({ input: process.stdin });
    const it = rl[Symbol.asyncIterator]();
    const { value } = await it.next();
    rl.close();
    if (value) {
      await handleLine(value);
    }
    process.exit(0);
  } else {
    // Continuous mode: process lines sequentially via queue
    let idx = 0;
    let draining = false;
    let processing = false;
    const queue = [];

    async function pump() {
      if (processing) return;
      processing = true;
      while (queue.length > 0) {
        const { line, i } = queue.shift();
        await handleLine(line, i).catch(() => {});
      }
      processing = false;
      if (draining) {
        console.log('\n🐾 emotion-watch 已停止');
        process.exit(0);
      }
    }

    process.stdin.resume();
    const rl = readline.createInterface({ input: process.stdin });

    rl.on('line', line => {
      idx++;
      queue.push({ line, i: idx });
      pump();
    });

    rl.on('close', () => {
      draining = true;
      if (!processing && queue.length === 0) {
        console.log('\n🐾 emotion-watch 已停止');
        process.exit(0);
      }
    });
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
