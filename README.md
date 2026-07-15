# claude-emotion-link ✦ Live2D Emotion Bridge for Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)

**claude-emotion-link** bridges Claude Code's conversational output with a
real-time Live2D character display.  Every message your AI assistant writes is
analysed for emotional tone and reflected instantly as a facial expression on a
Live2D model — bringing your assistant to life.

---

## ✨ Features

- **Real-time emotion detection** — keyword-based analysis of Claude Code output
- **Live2D rendering** — powered by `pixi-live2d-display` with smooth parameter interpolation
- **10 distinct expressions** — neutral, happy, very happy, sad, surprised, thinking, angry, embarrassed, sleepy, tipsy
- **Zero-dependency server** — pure Node.js, no `npm install` required
- **SSE-based push** — lightweight Server-Sent Events for instant browser updates
- **Hot-reload** — no page refresh needed when emotion changes
- **Clip & play** — works with any Live2D Cubism 4 model (Hiyori Free sample included)

## 🖼️ Architecture

```
┌─────────────────────┐     POST /emotion     ┌──────────────────┐
│  Claude Code         │──────────────────────→│  Emotion Bridge  │
│  (postMessage hook)  │                       │  Server (3456)   │
│                     │                        │                  │
│  "好开心喵～！"      │                        │  ┌─ SSE stream  ─┤
└─────────────────────┘                        └────────┬─────────┘
                                                        │
                                                   EventSource
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │  Browser Viewer  │
                                              │  ┌────────────┐  │
                                              │  │  Live2D    │  │
                                              │  │  Model     │  │
                                              │  │  😊→😄→😢  │  │
                                              │  └────────────┘  │
                                              └──────────────────┘
```

## 🚀 Quick Start

### 1. Start the server

```bash
node server/index.js
```

### 2. Open the viewer

Navigate to **http://localhost:3456** in your browser.

The Hiyori Free Live2D model will load and display with a neutral expression.

### 3. Connect Claude Code (automatic)

Add the following to your project's `.claude/settings.local.json`:

```json
{
  "hooks": {
    "postMessage": "node .claude/hooks/claude-emotion-hook.js"
  }
}
```

The hook activates on the **next Claude Code session** start.
After restarting, every response will automatically update the Live2D model's expression.

### 4. Or test manually

```bash
echo "太好了，好开心！" | node hooks/claude-emotion-hook.js
```

## 🎭 Expression Reference

| Emotion | Trigger keywords | Live2D Model Response |
|---------|-----------------|----------------------|
| 😊 neutral | — (default) | Eyes fully open, gentle expression |
| 😄 happy | "开心", "厉害", "nice" | Eyes smile (^_^), mouth open |
| 🌟 veryHappy | "超开心", "最高", "amazing" | Eyes closed smile, big smile, blush |
| 😢 sad | "难过", "伤心", "cry" | Downturned brows, slight frown |
| 😮 surprised | "真的?", "惊讶", "wow" | Eyes wide, mouth open, brows raised |
| 🤔 thinking | "嗯…", "想想", "hmm" | Half-closed eyes, head tilt |
| 😣 angry | "生气", "可恶", "angry" | Angry brows, frown |
| 😳 embarrassed | "害羞", "不好意思" | Blush, averted gaze, nervous smile |
| 😴 sleepy | "困", "累", "zzz" | Heavy-lidded eyes, slightly open mouth |
| 🍷 tipsy | "干杯", "酒", "微醺" | Rosy cheeks, relaxed eyes, slight sway |

## 📦 Project Structure

```
claude-emotion-link/
├── server/
│   └── index.js                  # HTTP + SSE server (zero deps)
├── hooks/
│   └── claude-emotion-hook.js    # Claude Code postMessage hook
├── public/
│   ├── index.html                # Live2D viewer page
│   ├── css/style.css             # Viewer styles
│   ├── js/viewer.js              # Viewer logic & expression engine
│   └── models/                   # Live2D model assets
│       └── hiyori_free_t08/      # Hiyori Free (Cubism 4) sample model
├── docs/
│   ├── setup.md                  # Detailed setup guide
│   ├── architecture.md           # Architecture documentation
│   └── expressions.md            # Expression mapping reference
├── package.json
├── .gitignore
└── README.md
```

## 🔧 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Live2D emotion viewer (HTML) |
| `/events` | GET | SSE event stream (emotion updates) |
| `/emotion` | POST | Submit emotion data |
| `/analyze` | POST | Analyse text without broadcast |
| `/status` | GET | Server health + current state |

### POST /emotion

```json
// Explicit emotion
{ "emotion": "happy" }

// Automatic text analysis
{ "text": "好开心啊！" }

// Full payload
{ "emotion": "happy", "text": "好开心啊！", "source": "claude" }
```

## 📋 Requirements

- **Node.js** ≥ 18 (no npm dependencies)
- **Browser** with WebGL support (Chrome, Firefox, Edge, Safari)
- **Claude Code** (for automatic hook integration)

## 📜 License

MIT — see [LICENSE](LICENSE).

## 🙏 Credits

- Live2D sample model **Hiyori** © Live2D Inc. (Free Material)
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) by guansss
- [PixiJS](https://pixijs.com/)
