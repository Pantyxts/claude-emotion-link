# Setup Guide — claude-emotion-link

## Prerequisites

- **Node.js** ≥ 18 (check with `node --version`)
- A modern browser with WebGL support
- Claude Code (for automatic hook integration)

## Step 1: Start the Bridge Server

```bash
cd claude-emotion-link
node server/index.js
```

Expected output:

```
  ╭──────────────────────────────────────╮
  │      ✦ claude-emotion-link ✦         │
  │      Live2D Emotion Bridge           │
  ├──────────────────────────────────────┤
  │  🌐  Viewer  : http://localhost:3456 │
  │  📡  SSE     : http://localhost:3456/events │
  │  📮  API     : POST /emotion         │
  │  📊  Status  : http://localhost:3456/status │
  ╰──────────────────────────────────────╯
```

The server is now listening on port 3456.
**Do not close this terminal** — keep it running.

## Step 2: Open the Live2D Viewer

Open **http://localhost:3456** in your browser.

You should see:
1. A loading spinner while the Live2D model loads
2. The Hiyori character appears with a neutral expression
3. A small emotion indicator at the bottom shows "😊 平常"
4. The top-right status dot turns blue, confirming SSE connection

## Step 3: Connect Claude Code

### Automatic (postMessage hook)

Create (or edit) `.claude/settings.local.json` in your project root:

```json
{
  "hooks": {
    "postMessage": "node .claude/hooks/claude-emotion-hook.js"
  }
}
```

> ⚠️ **Important:** Claude Code reads hook configuration **at startup only**.
> Restart your Claude Code session for the change to take effect.

### Manual test

Run the hook directly with sample text:

```bash
# Using piped input
echo "好开心啊，太棒了！" | node hooks/claude-emotion-hook.js

# Using the --text argument
node hooks/claude-emotion-hook.js --text "呜呜好难过..."
```

Check the current emotion on the server:

```bash
curl http://localhost:3456/status
```

## Step 4: Replace the Live2D Model (Optional)

The project ships with the **Hiyori Free** sample model (Cubism 4).
To use a different model:

1. Place your model files in `public/models/your-model-name/`
2. Update `MODEL_PATH` in `public/js/viewer.js`:

```javascript
const MODEL_PATH = 'models/your-model-name/your-model.model3.json';
```

3. Ensure the model's parameters match the `EXPRESSIONS` mapping in `viewer.js`.
   Adjust parameter values if your model uses different naming conventions.

## Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Model doesn't load | CORS or network issue | Check browser console; ensure server is running on port 3456 |
| Hook doesn't trigger | Config not loaded | Restart Claude Code session |
| Wrong expression displayed | Parameter mismatch | Check model parameter IDs via `cdi3.json` |
| White canvas instead of model | WebGL not available | Use a WebGL-compatible browser |
| "Cannot find module" errors | Wrong working directory | Run from the project root (`claude-emotion-link/`) |
