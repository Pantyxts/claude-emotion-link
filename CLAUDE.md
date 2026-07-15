# claude-emotion-link

Live2D 情绪联动项目。v3.0 — 当前最新版本。

**仓库**: https://github.com/Pantyxts/claude-emotion-link.git
**本地**: D:\claudework\claude-emotion-link

## 这是什么

文字 → 情绪分析 → SSE 推送 → 浏览器 Live2D Hiyori 角色自动切表情。

核心场景：猫娘 AI 输出实时驱动角色表情。支持 10 种情绪，28 个 Live2D 参数。

## 启动

```bash
cd D:\claudework\claude-emotion-link
node server/index.js
# 浏览器 → http://localhost:3456
```

或双击 `start.bat`。

## 技术栈

- 服务端：Node.js 零依赖 HTTP + SSE（端口 3456）
- 前端：pixi.js v7 + pixi-live2d-display v0.4.0 + Cubism 4 Core v4.2.2 (npm live2dcubismcore)
- 模型：Hiyori (Cubism 4, 28 params, moc3 v4)
- 情绪分析：三层关键词引擎（显式标签 10x + 关键词 + 语气词/标点增强）

## 关键文件

| 文件 | 作用 |
|------|------|
| `server/index.js` | HTTP/SST 服务 + 情绪分析引擎 |
| `public/js/viewer.js` | 核心前端：EXPRESSIONS 映射、模型控制、拖拽缩放、尾巴动画 |
| `public/js/popup-viewer.js` | 弹窗版 viewer（独立窗口，透明背景） |
| `public/popup.html` | 弹窗页面 |
| `hooks/emotion-watch.js` | stdin 自动监听脚本（猫娘 AI 管道下游） |
| `config.json` | 端口/模型/演示模式配置 |
| `start.bat` / `start.sh` | 一键启动 |

## 表情系统

参数映射在 `viewer.js` 的 `EXPRESSIONS` 对象里。v3 版本参数幅度已翻倍（~1.5-2x），表情更鲜明。

10 种情绪：neutral, happy, veryHappy, sad, surprised, thinking, angry, embarrassed, sleepy, tipsy。

## 用户交互

- 拖拽画布：平移角色
- 滚轮：缩放 30%-300%
- 双击：重置视角
- 键盘 0-9：直接切表情
- 空格：演示模式
- 📌 弹出角色：独立窗口
- 📁 切换模型：模型列表 + 手动输入

## 自动监听模式

```bash
catgirl-ai | node hooks/emotion-watch.js
```

AI 输出带 `[开心]` `[难过]` 等标签时自动触发对应表情。

## 已知问题

- Cubism 5 Core WASM 不可用，Mao Pro (v5) 无法加载
- GitHub 偶尔连接超时（push 重试几次即可）

## 贡献者

Pantyxts
