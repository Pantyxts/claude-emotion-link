# 表情参数参考

## 当前模型

**Hiyori**（Cubism 4 免费模型），28 个参数。比之前计划用的 Mao Pro（128 参数）少很多，但核心的面部控制都在。

## Hiyori 参数清单

从 `hiyori_free_t08.cdi3.json` 里导出的完整参数列表：

### 面部 (ParamGroupFace)

| 参数 ID | 说明 | 范围 |
|---------|------|------|
| ParamAngleX | 头部左右转 | -30 ~ +30 |
| ParamAngleY | 头部上下转 | -30 ~ +30 |
| ParamAngleZ | 头部倾斜 | -30 ~ +30 |
| ParamCheek | 脸颊泛红 | 0 ~ 1 |

### 眼睛 (ParamGroupEyes)

| 参数 ID | 说明 | 范围 |
|---------|------|------|
| ParamEyeLOpen | 左眼开闭 | 0（闭）~ 1（全开）|
| ParamEyeROpen | 右眼开闭 | 0 ~ 1 |
| ParamEyeLSmile | 左眼微笑弧度 | 0 ~ 1 |
| ParamEyeRSmile | 右眼微笑弧度 | 0 ~ 1 |

### 眼珠 (ParamGroupEyeballs)

| 参数 ID | 说明 | 范围 |
|---------|------|------|
| ParamEyeBallX | 眼珠水平 | -1 ~ +1 |
| ParamEyeBallY | 眼珠垂直 | -1 ~ +1 |

### 眉毛 (ParamGroupBrows)

| 参数 ID | 说明 | 范围 |
|---------|------|------|
| ParamBrowLForm | 左眉变形 | -1（皱眉）~ +1（挑眉）|
| ParamBrowRForm | 右眉变形 | -1 ~ +1 |

注意 Hiyori 的眉毛只有 Form 一个维度，没有 Mao Pro 那样的 Y 位置、X 位置、角度等独立参数。所以眉毛的表现力比 Mao 差一些，没法做"单边挑眉"之类的非对称表情（除非在 thinking 里手动把左右设成不同值）。

### 嘴 (ParamGroupMouth)

| 参数 ID | 说明 | 范围 |
|---------|------|------|
| ParamMouthForm | 嘴形 | -1（撇嘴）~ +1（微笑）|
| ParamMouthOpenY | 张嘴程度 | 0 ~ 1 |

同样比 Mao 简单。Mao 有 MouthUp、MouthDown、MouthAngry、MouthAngryLine 四个独立参数，Hiyori 只能通过 MouthForm + MouthOpenY 的组合来模拟。

### 身体 (ParamGroupBody)

| 参数 ID | 说明 | 范围 |
|---------|------|------|
| ParamBodyAngleX | 身体左右倾 | -30 ~ +30 |
| ParamBodyAngleY | 身体前后倾 | -30 ~ +30 |
| ParamBodyAngleZ | 身体旋转 | -30 ~ +30 |
| ParamBreath | 呼吸幅度 | 0 ~ 1 |

Breath 参数控制呼吸动画的幅度，默认 0.5。情绪激动时可以调高一点让角色看起来在微微喘气。

### 手臂 (ParamGroupArms)

| 参数 ID | 说明 | 范围 |
|---------|------|------|
| ParamArmLA | 左臂摆动 | -1 ~ +1 |
| ParamArmRA | 右臂摆动 | -1 ~ +1 |

### 物理摇动 (ParamGroupSway)

| 参数 ID | 说明 |
|---------|------|
| ParamBustY | 胸部摇动 |
| ParamHairAhoge | 呆毛 |
| ParamHairFront | 前发 |
| ParamHairSide | 侧发 |
| ParamHairBack | 后发 |
| ParamHairSideUp | 辫子 |
| ParamRibbon | 蝴蝶结 |
| ParamSkirt | 裙子 |
| ParamSideUpRibbon | 发饰 |

这些物理参数平时是 Live2D 物理引擎自动驱动的，代码里一般不用手动设。但如果想在特定情绪下让它们晃得更厉害（比如超开心时），可以直接写值。

## 十种表情的参数值

下面是 viewer.js 里每种表情实际用的参数值。经过多次手动微调，不是随便拍脑袋写的。

### 😊 平常 (neutral)

所有参数归零或默认，眼睛全开，表情放松。

### 😄 开心 (happy)

```
眼睛微闭（0.75）+ 笑眼弧度 0.7
眉毛挑眉 0.35
嘴角上扬 MouthForm=0.5
脸颊微红 Cheek=0.15
身体微微后仰 BodyAngleY=2
```

### 🌟 超开心 (veryHappy)

```
眼睛半闭（0.5）+ 笑眼拉满（1.0）
眉毛高挑 0.6
嘴大幅上扬 MouthForm=0.8，微张 MouthOpenY=0.15
脸颊泛红 Cheek=0.35
身体大幅后仰 BodyAngleY=3
呼吸加速 Breath=0.7
```

### 😢 难过 (sad)

```
眼睛半开（0.65），不笑
眉毛下压皱眉 BrowForm=-0.35
嘴角下撇 MouthForm=-0.35
眼球向下看 EyeBallY=-0.15
身体前倾 BodyAngleY=-3
呼吸放缓 Breath=0.4
```

### 😮 惊讶 (surprised)

```
眼睛全开（1.0）
眉毛高挑 BrowForm=0.8
嘴大张 MouthOpenY=0.6
身体后仰 BodyAngleY=2
手臂微抬 ArmLA/R=0.2
```

### 🤔 思考 (thinking)

```
左右眼开度不对称（左 0.6 右 0.8）——模拟眯一只眼
左右眉不对称（左 -0.2 右 +0.3）
眼球向右上看 EyeBallX=0.3, EyeBallY=0.1
嘴微微下撇 MouthForm=-0.1
头微微歪 AngleX=-3
```

### 😣 生气 (angry)

```
眼睛微开（0.8）
眉毛深皱 BrowForm=-0.7
嘴角下撇 MouthForm=-0.3，微张 MouthOpenY=0.1
脸颊极淡的红 Cheek=0.05
呼吸加快 Breath=0.7
手臂紧张 ArmLA/R=0.15
```

### 😳 害羞 (embarrassed)

```
眼睛基本全开（0.85）+ 轻微笑眼（0.3）
眉毛微挑 BrowForm=0.2
嘴角微扬 MouthForm=0.2
脸颊爆红 Cheek=0.9 ← 这是关键
头大幅低垂+转向 AngleX=-5, AngleY=-4, AngleZ=2
眼球回避视线 EyeBallX=-0.2, EyeBallY=-0.1
```

### 😴 困倦 (sleepy)

```
眼睛几乎全闭 EyeOpen=0.15
眉毛无表情
嘴微张 MouthOpenY=0.05
眼球下垂 EyeBallY=-0.1
头歪着 AngleX=2, AngleZ=2
呼吸缓慢 Breath=0.35
手臂垂下 ArmLA/R=-0.1
```

### 🍷 微醺 (tipsy)

```
眼睛半闭（0.55）+ 笑眼（0.45）
眉毛微挑 BrowForm=0.15
嘴角上扬 MouthForm=0.35
脸颊泛红 Cheek=0.7
身体晃 AngleX=5, AngleY=3, AngleZ=3 ← 站不稳的感觉
```

## 尾巴参数

能量尾巴的颜色和动态也是跟着情绪走的：

| 情绪 | 摆幅 | 速度 | 颜色 |
|------|:----:|:----:|------|
| 平常 | 0.3 | 0.8 | 蓝 #64b5f6 |
| 开心 | 0.6 | 1.5 | 金 #ffd700 |
| 超开心 | 0.9 | 2.0 | 粉 #ff6b9d |
| 难过 | 0.1 | 0.4 | 靛蓝 #5c6bc0 |
| 惊讶 | 0.5 | 1.8 | 紫 #ab47bc |
| 思考 | 0.2 | 0.6 | 深紫 #7e57c2 |
| 生气 | 0.5 | 3.0 | 红 #ef5350 |
| 害羞 | 0.4 | 1.2 | 粉 #ff80ab |
| 困倦 | 0.1 | 0.3 | 灰 #90a4ae |
| 微醺 | 0.6 | 1.0 | 橙 #ff8a65 |

## 自己加新表情

在 `viewer.js` 的 `EXPRESSIONS` 对象里加一项就行：

```javascript
custom: {
  label: '自定义',
  icon: '🤩',
  params: {
    ParamAngleX: 0,
    ParamAngleY: 0,
    ParamAngleZ: 0,
    ParamCheek: 0,
    ParamEyeLOpen: 1.0,
    ParamEyeROpen: 1.0,
    ParamEyeLSmile: 0,
    ParamEyeRSmile: 0,
    ParamEyeBallX: 0,
    ParamEyeBallY: 0,
    ParamBrowLForm: 0,
    ParamBrowRForm: 0,
    ParamMouthForm: 0,
    ParamMouthOpenY: 0,
    ParamBodyAngleX: 0,
    ParamBodyAngleY: 0,
    ParamBodyAngleZ: 0,
    ParamBreath: 0.5,
    ParamArmLA: 0,
    ParamArmRA: 0,
  },
  effects: ['✨', '💫'],
  tail: { sway: 0.5, speed: 1.0, color: '#ff6b9d' },
}
```

然后在 `server/index.js` 和 `hooks/claude-emotion-hook.js` 里给新表情加对应的关键词，三个地方同步就行。

调整参数的时候建议浏览器开着 `http://localhost:3456`，改完刷新就能看到效果，不用重启服务。
