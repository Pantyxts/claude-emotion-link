# claude-emotion-link ✦ Live2D 情绪联动

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)

一个轻量级的 Live2D 情绪显示系统。给一段文字 → 自动分析情绪 → 角色表情实时变化。

核心场景：**配合猫娘 AI 使用**，AI 输出的文字实时驱动 Live2D 角色的表情。也可以用于直播、OBS 捕获、聊天机器人等。

---

## 效果展示

启动后浏览器里会显示一个 **Hiyori**（Cubism 4）角色，她能做出 10 种表情：

| 😊 平常 | 😄 开心 | 🌟 超开心 | 😢 难过 | 😮 惊讶 |
|---------|---------|-----------|---------|---------|
| 🤔 思考 | 😣 生气 | 😳 害羞 | 😴 困倦 | 🍷 微醺 |

角色背后有一条"能量尾巴"，颜色和摆动幅度跟着情绪一起变。页面上方有**置顶情绪指示器**，录屏或直播时观众也能看到当前状态。

---

## 快速开始

### 一键启动

- **Windows**：双击 `start.bat`
- **Mac / Linux**：运行 `./start.sh`

脚本会自动检查 Node.js、启动服务、打开浏览器。

### 手动启动

```bash
node server/index.js
# 浏览器打开 http://localhost:3456
```

服务端**零依赖**，Node.js 18+ 就能跑。浏览器端通过 CDN 加载 pixi.js 和 pixi-live2d-display，不需要安装。

---

## 操作指南

### 鼠标

| 操作 | 效果 |
|------|------|
| 拖拽画布 | 平移角色位置 |
| 滚轮 | 缩放（30% ~ 300%） |
| 双击画布 | 重置视角 |

缩放时右上角会短暂显示百分比，所有视角参数会保存到 URL 里，刷新不丢失。

### 键盘

| 按键 | 效果 |
|------|------|
| `0` ~ `9` | 直接切换 10 种表情 |
| 空格键 | 开启/关闭演示模式（自动循环切换表情） |

### 弹出角色窗口

点击 **📌 弹出角色** 按钮，会打开一个独立的透明背景窗口。适合：

- **OBS 直播捕获**：窗口捕获模式，背景透明，把人像叠在画面上
- **桌面悬浮**：把窗口拖到角落，始终可见

弹窗支持独立的拖拽、缩放、双击重置。窗口大小可自由调整。

### 切换模型

点击 **📁 切换模型** 按钮，可以：
- 从 `public/models/` 下的模型列表中选择
- 手动输入路径加载其他模型
- 模型切换后页面会自动刷新

---

## 与猫娘 AI 联动（自动模式）

猫娘 AI 输出自带情绪标签（如 `[开心]`、`[害羞]`），`emotion-watch` 脚本会自动监听并推送。

```bash
# 猫娘 AI 的输出实时驱动表情
catgirl-ai | node hooks/emotion-watch.js

# 监视聊天日志
tail -f chat.log | node hooks/emotion-watch.js

# 单次测试
echo "[开心] 喵~ 主人早上好！" | node hooks/emotion-watch.js --once
```

AI 输出的文字中包含以下内容时会自动触发对应表情：

| 方式 | 示例 |
|------|------|
| 显式标签（最强，必命中） | `[开心]` `[难过]` `（害羞）` `【生气】` `[surprised]` |
| 中文关键词 | 开心、好耶、难过、伤心、惊讶、思考、气死… |
| 猫娘语气词 | 喵~、呜喵、QAQ、嘤嘤、嘻嘻、嗷呜、哼！ |
| 英语关键词 | happy、sad、angry、surprised、blush… |

`emotion-watch.js` 的所有参数：

```
--once      只处理一行就退出
--port N    指定服务器端口（默认 3456）
--raw       直接透传情绪名（跳过文本分析）
--debug     打印分析详情
```

### 没有猫娘 AI 时的手动测试

```bash
# 方式 1：直接指定情绪
curl -X POST http://localhost:3456/emotion \
  -H "Content-Type: application/json" \
  -d '{"emotion":"happy"}'

# 方式 2：给文字让它分析
curl -X POST http://localhost:3456/emotion \
  -H "Content-Type: application/json" \
  -d '{"text":"好开心啊！[超开心] 太棒了喵~"}'

# 方式 3：只分析不推送（调试用）
curl -X POST http://localhost:3456/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"呜…[难过] 又失败了喵…"}'
```

---

## 项目结构

```
claude-emotion-link/
├── server/index.js               # 服务端：静态文件 + SSE + 情绪分析引擎
├── hooks/
│   ├── claude-emotion-hook.js    # LLM CLI hook 示例
│   └── emotion-watch.js          # stdin 自动监听守护脚本
├── public/
│   ├── index.html                # 主页面
│   ├── popup.html                # 独立弹窗页面（透明背景）
│   ├── test.html                 # Live2D Core 加载诊断页
│   ├── css/style.css             # 样式
│   ├── js/
│   │   ├── viewer.js             # 核心：表情映射 + 模型控制 + 尾巴动画 + 拖拽缩放
│   │   └── popup-viewer.js       # 弹窗版 viewer（独立 SSE + postMessage 同步）
│   ├── lib/live2dcubismcore.min.js  # Cubism 4 Core v4.2.2
│   └── models/
│       ├── hiyori_free_t08/      # Hiyori (Cubism 4, 28 参数)
│       └── mao_pro/              # 虹色まお Pro (Cubism 5, 备用)
├── docs/                         # 文档
│   ├── architecture.md           # 架构说明
│   ├── setup.md                  # 详细部署指南
│   └── expressions.md            # 表情参数对照表
├── config.json                   # 端口、模型、演示模式配置
├── start.bat / start.sh          # 一键启动脚本
└── package.json
```

---

## API 参考

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | Live2D 显示页面 |
| `/popup.html` | GET | 独立弹窗（支持 `?model=` `?scale=` `?x=` `?y=` `?zoom=`） |
| `/events` | GET | SSE 事件流，实时推送情绪变化 |
| `/emotion` | POST | 提交情绪或文字，广播给所有客户端 |
| `/analyze` | POST | 分析文字情绪，只返回不广播 |
| `/status` | GET | 服务状态 JSON |
| `/config` | GET | 当前配置 JSON |
| `/models` | GET | 可用模型列表 |

### POST /emotion

```json
// 直接指定情绪
{ "emotion": "happy" }

// 给文字让它分析
{ "text": "太好了好开心！[超开心] 喵~" }

// 完整参数
{ "emotion": "happy", "text": "太好了！", "source": "catgirl-ai" }
```

### GET /events

SSE 推送格式（`text/event-stream`）：

```
data: {"emotion":"happy","text":"太好了！","source":"watch","timestamp":1712345678000}
```

每 15 秒心跳保活，断了会自动重连（指数退避 1s→2s→4s… 最多 10 次）。

---

## 架构

```
猫娘 AI / CLI Hook / curl → POST /emotion → 关键词匹配 → SSE 广播 → 浏览器角色
                                                    ↑
                                          stdin 自动监听 (emotion-watch.js)
```

1. 文字进入 `server/index.js` 的 `analyzeEmotion()` 函数
2. 三层检测：显式表情标签（10x 权重）→ 关键词（1-2x）→ 语气词/标点增强
3. 通过 SSE 推送给所有连接的浏览器
4. `viewer.js` 用三次缓出插值（380ms）平滑过渡表情参数
5. 同时更新置顶指示器、能量尾巴、弹窗（postMessage）

---

## 换模型

1. 把模型文件夹放到 `public/models/你模型名/`
2. 页面里点 **📁 切换模型** → 从列表选
3. 或者在 URL 里加 `?model=models/你模型名/xxx.model3.json`
4. 如果新模型的参数名不同，需要修改 `viewer.js` 里的 `EXPRESSIONS` 映射表

目前只支持 Cubism 4 模型（`.moc3` v4 格式）。Cubism 5 的 WASM Core 暂未公开，Mao Pro（v5）暂时无法加载。

---

## 开发

### 技术栈

- 服务端：Node.js 零依赖 HTTP + SSE
- 渲染：pixi.js v7 + pixi-live2d-display v0.4.0 + Cubism 4 Core v4.2.2
- 动画：Canvas 2D 贝塞尔曲线"能量尾巴" + 60fps requestAnimationFrame
- 情绪分析：三层关键词打分引擎（标签 + 关键词 + 语气词）

### 配置文件

`config.json`：

```json
{
  "port": 3456,
  "model": { "path": "models/hiyori_free_t08/...", "name": "Hiyori", "scale": 0.22 },
  "demo": { "enabled": false, "intervalMs": 3000 }
}
```

---

## 许可

MIT。

## 贡献者

- [**Pantyxts**](https://github.com/Pantyxts) — 设计、开发、维护
