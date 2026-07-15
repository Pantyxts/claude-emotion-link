# D:\claudework\claude-emotion-link

Live2D 情绪联动项目。文字输入 → 情绪分析 → SSE 推送 → Live2D 模型表情切换。

当前使用 Hiyori (Cubism 4) 模型，28 参数，10 种表情。

## 启动

```bash
node server/index.js
# 浏览器打开 http://localhost:3456
```

## 技术栈

- 服务端：Node.js 零依赖 HTTP + SSE
- 前端：pixi.js v7 + pixi-live2d-display + Cubism 4 Core
- 情绪分析：关键词匹配打分

## 已知限制

- Cubism 5 Core WASM 不可用，Mao Pro 模型暂时无法加载
- Hiyori 只有 28 参数，表情细腻度有限
