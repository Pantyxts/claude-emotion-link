# 架构说明

## 三件套

整个系统分成三块：

```
 发文字 → HTTP POST → 桥接服务器 → SSE 推送 → 浏览器 (Live2D)
```

### 1. 桥接服务器 (server/index.js)

一个 Node.js 写的 HTTP 服务，没有任何第三方依赖。干这几件事：

- 提供 Live2D 的前端页面（`GET /`）
- 接收外部的情绪推送（`POST /emotion`）
- 维护 SSE 客户端列表，情绪变了就群发
- 内置一个简单的关键词情绪分析，文字丢进来能自动判断情绪

选 SSE 而不是 WebSocket 的原因是：场景是服务端单向推送给浏览器，不需要双向通信。SSE 协议更简单，浏览器原生支持，断了自动重连，没有握手开销。

### 2. 浏览器端 (public/)

前端三件套：`index.html` 搭框架，`viewer.js` 处理所有逻辑，`style.css` 管样式。

viewer.js 里核心的东西：

- **表情映射表 (EXPRESSIONS)**：定义每种情绪对应的模型参数值。每个参数都是手动调的——0 到 1 之间反复试，找到最自然的面部组合
- **参数插值器 (animateToParams)**：表情切换不是硬切，而是 380ms 的三次缓出过渡，看着比较自然
- **能量尾巴 (animateTail)**：Canvas 2D 画的 12 段贝塞尔曲线，颜色、摆幅、速度跟着情绪走
- **SSE 客户端 (connectSSE)**：连 `/events`，收到消息就调 setEmotion

依赖库通过 CDN 加载（不需要本地装）：
1. `live2dcubismcore.min.js`（本地，npm 的 v4.2.2）
2. PixiJS v7（jsDelivr CDN）
3. pixi-live2d-display（jsDelivr CDN）

### 3. Hook (hooks/claude-emotion-hook.js)

可以从 Claude Code 的 postMessage hook 调用，也可以单独跑。支持三种输入方式：

- `--text` 命令行参数
- 环境变量 `CLAUDE_MESSAGE_TEXT`
- 标准输入（管道）

拿到文字后跑一遍和服务器同款的关键词分析，然后 POST 到 `/emotion`。

## 情绪分析怎么做的

没用任何 ML 库，纯关键词匹配：

1. 10 种情绪各有一组关键词（中文 + 英文）
2. 把输入文字和关键词做子串匹配，命中就加分
3. 长关键词（3 字以上）权重比短的略高，因为更精确
4. 否定词处理："不开心" → 虽然命中了"开心"，但前面的"不"会让分数扣掉
5. 标点放大：连续感叹号会放大 happy/angry/surprised 的分值，问号会加 thinking 的分
6. 所有情绪里取最高分，低于 0.5 的阈值就返回 neutral

为什么不用 NLP 模型？主要考虑：

- 这个场景要求实时性，延迟越低越好
- 零依赖，clone 下来就能跑
- 行为完全可预期，不会有"为什么这个句子被判断成生气"的困惑
- 想加新情绪直接在数组里加关键词就行

当然代价是准确率比不上真正的 NLP，复杂句式（反讽、双关）会判断错。这个作为以后的改进方向。

## SSE 协议

`GET /events` 返回的流：

```
data: {"emotion":"happy","text":"...","source":"api","timestamp":1712345678000}

: heartbeat

```

- 连接建立时先发一条当前状态
- 每 15 秒一个心跳注释行（`: heartbeat`），保持连接不断
- 客户端断线后 EventSource 会自动重连

## 模型参数插值

情绪切换不是瞬间完成的。流程是：

1. 收到新情绪 → 从 EXPRESSIONS 表里查出目标参数值
2. 从 Live2D 模型里读出当前所有参数值作为起点
3. 用三次缓出函数（`1 - (1-t)³`）在 380ms 内从起点过渡到终点
4. 每帧通过 requestAnimationFrame 更新

这样面部切换看起来是"流动"的，不是突然变脸。

## 模型遇到的那些坑

最初计划用虹色まお（Cubism 5, 128 参数，moc3 v5）。表情表现力确实强很多——眉毛有 8 个独立参数，翅膀可以展开，还有 aura 特效。但是：

- Cubism 5 的 Web Core 编译成 WASM（`_em_module.wasm`）
- 这个 WASM 文件在 Live2D 的 CDN 上全部 404
- npm 上的 `live2dcubismcore` 只更新到 v4.2.2，不支持 moc3 v5
- Live2D 官网下载的 SDK zip 里也没有 WASM 文件

猜测 Live2D 对 Cubism 5 的 WebAssembly Core 控制比较严，可能只给商业授权用户。所以目前退回到 Cubism 4 + Hiyori 的组合，28 个参数虽然比 128 少很多，但基本表情都能表达清楚。

等以后 Live2D 放开 v5 的 Web SDK，或者社区有人逆向出来，可以再考虑升级。
