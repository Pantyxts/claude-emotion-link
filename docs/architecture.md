# Architecture — claude-emotion-link

## Overview

claude-emotion-link is a three-component system that bridges Claude Code's
text output with a Live2D character display:

```
 ┌──────────────┐    HTTP POST     ┌──────────────┐    SSE    ┌──────────────┐
 │  Claude Code  │ ──────────────→  │  Bridge      │ ────────→ │  Browser     │
 │  (LLM CLI)    │   /emotion       │  Server      │  events   │  Viewer      │
 │               │                  │  (Node.js)   │           │  (Live2D)    │
 └──────────────┘                  └──────────────┘           └──────────────┘
```

### Components

#### 1. Claude Code (Hook)

A `postMessage` hook (`hooks/claude-emotion-hook.js`) runs after every Claude
Code response. It:

1. Captures the assistant's output text
2. Runs keyword-based sentiment analysis
3. POSTs the detected emotion to the bridge server

The hook supports three input channels (tried in order):
- `--text` CLI argument
- `CLAUDE_MESSAGE_TEXT` environment variable
- Standard input (stdin)

#### 2. Bridge Server

A zero-dependency Node.js HTTP server (`server/index.js`) that:

- Serves the Live2D viewer frontend on `GET /`
- Accepts emotion data on `POST /emotion`
- Maintains a pool of SSE clients
- Broadcasts emotion changes to all connected browsers
- Performs text-based emotion analysis as a fallback

The server uses **Server-Sent Events (SSE)** instead of WebSocket for its
lightweight nature — no handshake overhead, automatic reconnection, and native
browser support via the `EventSource` API.

#### 3. Browser Viewer

A client-side application (`public/index.html` + `js/viewer.js`) that:

- Loads and renders a Live2D Cubism 4 model using PixiJS
- Connects to the server's SSE endpoint for real-time emotion data
- Smoothly interpolates model parameters between expression states
- Renders floating visual effects (emojis, sparkles) matching the current emotion
- Displays an emotion indicator overlay

## Data Flow

```
Claude Code Response
      │
      ▼
postMessage Hook
      │ 1. Read text
      │ 2. Analyse emotion
      ▼
POST /emotion { emotion: "happy", text: "..." }
      │
      ▼
Bridge Server
      │ 1. Update server state
      │ 2. Broadcast to SSE clients
      ▼
SSE: data: { "emotion": "happy", ... }
      │
      ▼
Browser Viewer (EventSource.onmessage)
      │ 1. Look up expression parameters
      │ 2. Animate Live2D model (cubic ease-out, 380ms)
      │ 3. Update UI overlay
      │ 4. Spawn floating effects
      ▼
Live2D Model shows happy expression 😄
```

## Emotion Analysis Engine

The analysis uses a lightweight, keyword-based scoring system:

1. **Keyword matching** — each emotion category has a list of trigger keywords
2. **Weighted scoring** — longer keywords contribute proportionally more
3. **Negation handling** — "不开心" reduces the "happy" score
4. **Punctuation amplification** — multiple exclamation marks boost intensity
5. **Question detection** — question marks increase the "thinking" score

This approach was chosen over ML-based sentiment analysis for:
- Zero external dependencies
- Deterministic, debuggable behaviour
- Sub-millisecond execution time
- No model download or GPU requirement

## Zero-Dependency Design Principle

The server deliberately avoids npm packages:

- `http` — built-in Node.js module
- `fs` — built-in Node.js module  
- `path` — built-in Node.js module

This means:
- `git clone` → `node server/index.js` — no install step
- No `node_modules` directory
- No dependency vulnerabilities
- Works in CI/CD environments without package restoration

The browser viewer loads three libraries from CDN:
1. **Live2D Cubism Core** — from live2d.com (required for model rendering)
2. **PixiJS v7** — WebGL 2D renderer
3. **pixi-live2d-display** — Live2D integration for PixiJS

## SSE Protocol

The SSE endpoint (`GET /events`) sends:

```
data: { "emotion": "happy", "text": "...", "source": "claude", "timestamp": 1712345678 }
```

- Heartbeat every 15 seconds (`: heartbeat\n\n`)
- Initial state sent on connection
- Automatic reconnection handled by the browser's `EventSource`

## Model Parameter Interpolation

When an emotion change is received, the viewer:

1. Reads current parameter values from the Live2D model
2. Calculates target values from the expression definition
3. Animates using cubic ease-out over 380ms
4. Updates per-frame via `requestAnimationFrame`

This produces smooth, natural-looking transitions between expressions.
