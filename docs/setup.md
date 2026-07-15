# 搭建指南

## 环境要求

- Node.js 18 及以上
- 支持 WebGL 的浏览器（Chrome / Firefox / Edge 都行）
- 不需要装任何 npm 依赖（服务端零依赖）

## 第一步：启动服务

```bash
cd claude-emotion-link
node server/index.js
```

应该看到：

```
  ╭──────────────────────────────────────╮
  │      ✦ claude-emotion-link ✦         │
  │    Hiyori C4 · 28 params · Magic Tail │
  ├──────────────────────────────────────┤
  │  🌐  Viewer  : http://localhost:3456     │
  │  📡  SSE     : http://localhost:3456/events│
  │  📮  API     : POST /emotion          │
  │  📊  Status  : http://localhost:3456/status│
  ╰──────────────────────────────────────╯
```

服务跑在 3456 端口，终端别关。

## 第二步：浏览器打开

访问 **http://localhost:3456**。

正常情况下会看到：
1. 先显示一个加载动画
2. Hiyori 模型加载出来，默认"平常"表情
3. 背后有一条蓝色的能量尾巴在飘
4. 右下角显示当前表情名和图标
5. 右上角状态灯变蓝色（说明 SSE 连上了）

如果一直卡在加载画面，打开浏览器控制台看报错。大概率是某个 CDN 资源加载失败（网络问题），或者模型文件路径不对。

## 第三步：测试情绪推送

最简单的测试方法——用 curl：

```bash
# 直接指定情绪
curl -X POST http://localhost:3456/emotion \
  -H "Content-Type: application/json" \
  -d '{"emotion":"happy"}'
```

浏览器里的 Hiyori 应该会变成笑脸，尾巴变金色、摆得快起来。

```bash
# 丢文字让它自己猜
curl -X POST http://localhost:3456/emotion \
  -H "Content-Type: application/json" \
  -d '{"text":"呜呜好难过……"}'
```

再看看当前状态：

```bash
curl http://localhost:3456/status
```

## 第四步：配 Hook（可选）

如果想把 LLM 的输出自动推给 Live2D，把 `hooks/claude-emotion-hook.js` 挂到 postMessage hook 上。

在项目目录下创建或编辑 `.claude/settings.local.json`：

```json
{
  "hooks": {
    "postMessage": "node .claude/hooks/claude-emotion-hook.js"
  }
}
```

配完之后重启 Claude Code 会话才会生效。之后每次 LLM 回复完，hook 会自动跑一遍情绪分析然后推送。

也可以手动测试 hook：

```bash
echo "好开心啊太棒了！" | node hooks/claude-emotion-hook.js
```

## 换模型

想用自己的 Live2D 模型：

1. 把模型文件放到 `public/models/你的模型名/`
2. 至少要有的文件：`.model3.json`、`.moc3`、贴图 png
3. 打开 `public/js/viewer.js`，改 `MODEL_PATH` 指向新模型的 model3.json
4. 看新模型的 `.cdi3.json` 文件（如果有的话），确认参数名
5. 重写 `EXPRESSIONS` 对象里的参数映射——每个模型参数不一样，不能直接用 Hiyori 的配置

参数调优建议：
- 先设一个 neutral（全部默认值）
- 再逐个调每种情绪，浏览器开着边调边看效果
- EyeLOpen/EyeROpen 控制闭眼程度，EyeLSmile/EyeRSmile 控制笑眼弧度
- BrowLForm/BrowRForm 负数是皱眉，正数是挑眉
- MouthForm 负数是撇嘴，正数是微笑

## 常见问题

| 现象 | 可能原因 | 怎么解决 |
|------|---------|---------|
| 模型不加载 | CDN 资源下载失败或服务没跑 | 检查控制台报错，确认 3456 端口 |
| 白屏 | WebGL 不可用 | 换个浏览器试试 |
| Hook 没反应 | 配置没生效 | 重启 Claude Code 会话 |
| 表情不对 | 参数和模型不匹配 | 用 cdi3.json 检查参数列表 |
| 尾巴不显示 | Canvas 2D 没跑起来 | 控制台看看有没有 JS 报错 |
| 中文乱码 | 无——服务端已处理 UTF-8 分包 | 如果还有问题提 issue |
