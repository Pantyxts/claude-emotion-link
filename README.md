# claude-emotion-link ✦ Live2D 情绪联动

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)

一个让 Live2D 角色根据输入文本实时切换表情的小玩具。

原理很简单：服务端收到一段文字 → 关键词匹配猜情绪 → 通过 SSE 推给浏览器 → 浏览器上的 Live2D 模型自动切换到对应的表情。整个过程不到半秒。

## 效果

目前用的是 **Hiyori**（Cubism 4 免费模型），28 个可控参数，覆盖了 10 种基础表情。模型背后还有一条 Canvas 画的"能量尾巴"，颜色和摆动幅度会跟着情绪一起变。

支持的情绪：平常、开心、超开心、难过、惊讶、思考、生气、害羞、困倦、微醺。

## 跑起来

```bash
# 1. 启动服务
node server/index.js

# 2. 浏览器打开 http://localhost:3456
# 3. 看到 Hiyori 加载出来就说明跑通了
```

服务端零依赖，Node.js 18+ 就能跑。浏览器端用了 pixi.js 和 pixi-live2d-display 的 CDN，不需要自己装。

### 测试情绪推送

```bash
# 直接指定情绪
curl -X POST http://localhost:3456/emotion \
  -H "Content-Type: application/json" \
  -d '{"emotion":"happy"}'

# 或者丢一段文字让它自己猜
curl -X POST http://localhost:3456/emotion \
  -H "Content-Type: application/json" \
  -d '{"text":"好开心啊太棒了！"}'
```

浏览器那边应该会立刻看到 Hiyori 的表情变了。

## 怎么工作的

```
发一段文字 → POST /emotion → 关键词匹配 → SSE 广播 → 浏览器收到 → 模型表情切换
```

表情匹配用的是关键词打分，没什么高深的。每个情绪对应一组中文/英文关键词，命中就加分。长关键词权重比短的高，感叹号会放大"开心""生气"这类情绪，否定词（"不""没"）会扣分。最后哪个情绪分最高就选哪个，分数都不够就 fallback 到"平常"。

虽然简陋，但胜在零延迟、不用 GPU、不用下载模型，而且行为完全可预期。

## 项目结构

```
claude-emotion-link/
├── server/index.js          # 服务端：静态文件 + SSE + 情绪分析
├── hooks/
│   └── claude-emotion-hook.js  # CLI hook，可以从 Claude Code 调用
├── public/
│   ├── index.html            # 主页面
│   ├── test.html             # Live2D Core 加载测试页
│   ├── css/style.css         # 样式
│   ├── js/viewer.js          # 核心：表情映射 + 模型控制 + 尾巴动画 + SSE 客户端
│   ├── lib/live2dcubismcore.min.js  # Cubism 4 Core (npm live2dcubismcore)
│   └── models/
│       ├── hiyori_free_t08/  # Hiyori 模型 (Cubism 4, 28 参数)
│       └── mao_pro/          # 虹色まお Pro (Cubism 5, 备用，当前 Core 不兼容)
├── docs/                     # 文档
├── package.json
└── test_puppeteer.js         # Puppeteer 自动化测试
```

## API

| 端点 | 方法 | 作用 |
|------|------|------|
| `/` | GET | Live2D 显示页面 |
| `/events` | GET | SSE 事件流，情绪更新实时推送 |
| `/emotion` | POST | 提交情绪或文字，会广播给所有客户端 |
| `/analyze` | POST | 分析文字情绪，不广播，只返回结果 |
| `/status` | GET | 服务状态 + 当前情绪 |

### POST /emotion

```json
// 方式一：直接指定情绪
{ "emotion": "happy" }

// 方式二：给文字让它分析
{ "text": "太好了好开心！" }

// 完整参数
{ "emotion": "happy", "text": "太好了！", "source": "manual" }
```

### GET /events

SSE 推送格式：

```
data: {"emotion":"happy","text":"...","source":"api","timestamp":1712345678000}
```

浏览器用 `EventSource` 接就行，断了会自动重连。服务端每 15 秒发一个心跳保活。

## 换模型

项目目前用 Hiyori，想换别的模型的话：

1. 把模型文件放到 `public/models/你的模型/`
2. 改 `public/js/viewer.js` 里的 `MODEL_PATH`
3. 根据新模型的参数重写 `EXPRESSIONS` 映射表
4. 模型参数列表在 `.cdi3.json` 文件里能查到

之前试过换虹色まお（Cubism 5, 128 参数），表情会细腻很多，但 Cubism 5 的 Core WASM 目前拿不到，所以暂时退回 Cubism 4。等 Live2D 官方放开 v5 的 Web Core 再说。

## Hook 集成

`hooks/claude-emotion-hook.js` 可以在 Claude Code 或其他 LLM CLI 工具里当 postMessage hook 用。配置方式：

```json
{
  "hooks": {
    "postMessage": "node .claude/hooks/claude-emotion-hook.js"
  }
}
```

当然写成别的工具（tg bot、定时任务、快捷键脚本）来调 `POST /emotion` 也完全没问题，协议就是纯 HTTP + JSON。

## 开发小记

这个项目的起点是想给命令行里的 LLM 对话加一点"看得见的反馈"——屏幕上的角色能根据上下文做出表情反应，比纯文字聊天多了不少趣味。

Live2D Web SDK 的文档和生态比想象中乱不少。Cubism 4 和 5 的 Core 不互通，npm 上的 `live2dcubismcore` 只有 v4 版本，v5 的 WASM 文件在 CDN 上全是 404。折腾了一圈，最后发现老老实实用 Cubism 4 的免费模型是最稳的。

viewer.js 里的参数映射写得比较细，每个情绪都单独调过，不是随便拍的数。欢迎提 PR 改进。

## 许可

MIT。

## 贡献者

- [**Pantyxts**](https://github.com/Pantyxts) — 设计、开发、维护
