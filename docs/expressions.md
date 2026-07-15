# Expression Mapping Reference — claude-emotion-link

## Overview

Each emotion is defined as a set of Live2D **parameter values** that control
the model's facial features. When an emotion is triggered, the viewer smoothly
interpolates from the current parameter values to the target values over
380ms using cubic ease-out.

## Supported Emotions (10)

| # | Emotion | Icon | Trigger Text Examples |
|---|---------|------|----------------------|
| 0 | neutral | 😊 | Default state |
| 1 | happy | 😄 | "开心", "厉害", "好耶", "nice" |
| 2 | veryHappy | 🌟 | "超开心", "最高", "amazing" |
| 3 | sad | 😢 | "难过", "伤心", "哭", "sorry" |
| 4 | surprised | 😮 | "真的?", "惊讶", "wow", "不会吧" |
| 5 | thinking | 🤔 | "嗯…", "想想", "hmm", "怎么" |
| 6 | angry | 😣 | "生气", "可恶", "烦", "angry" |
| 7 | embarrassed | 😳 | "害羞", "不好意思", "shy" |
| 8 | sleepy | 😴 | "困", "累", "zzz", "sleepy" |
| 9 | tipsy | 🍷 | "干杯", "酒", "微醺", "cheers" |

## Parameter Value Tables

The following tables document every parameter value for each emotion.
Parameter ranges are model-specific; values shown are for the **Hiyori Free**
(Cubism 4) sample model.

### Eye Parameters

| Emotion | EyeLOpen | EyeROpen | EyeLSmile | EyeRSmile |
|---------|:--------:|:--------:|:---------:|:---------:|
| neutral | 1.0      | 1.0      | 0.0       | 0.0       |
| happy | 0.75 | 0.75 | 0.8 | 0.8 |
| veryHappy | 0.6 | 0.6 | 1.0 | 1.0 |
| sad | 0.7 | 0.7 | 0.0 | 0.0 |
| surprised | 1.0 | 1.0 | 0.0 | 0.0 |
| thinking | 0.5 | 0.5 | 0.0 | 0.0 |
| angry | 0.8 | 0.8 | 0.0 | 0.0 |
| embarrassed | 0.9 | 0.9 | 0.3 | 0.3 |
| sleepy | 0.2 | 0.2 | 0.0 | 0.0 |
| tipsy | 0.6 | 0.6 | 0.4 | 0.4 |

- `EyeLOpen` / `EyeROpen`: 0 (fully closed) → 1 (fully open)
- `EyeLSmile` / `EyeRSmile`: 0 (neutral) → 1 (smiling ^_^ shape)

### Eyebrow Parameters

| Emotion | BrowLForm | BrowRForm |
|---------|:---------:|:---------:|
| neutral | 0.0 | 0.0 |
| happy | 0.3 | 0.3 |
| veryHappy | 0.5 | 0.5 |
| sad | -0.3 | -0.3 |
| surprised | 0.8 | 0.8 |
| thinking | -0.2 | 0.2 |
| angry | -0.7 | -0.7 |
| embarrassed | 0.2 | 0.2 |
| sleepy | 0.0 | 0.0 |
| tipsy | 0.1 | 0.1 |

- Negative values: brows pulled down (angry, sad)
- Positive values: brows raised (surprised, happy)
- Asymmetric values: thinking (one brow raised)

### Mouth Parameters

| Emotion | MouthForm | MouthOpenY |
|---------|:---------:|:----------:|
| neutral | 0.0 | 0.0 |
| happy | 0.6 | 0.25 |
| veryHappy | 1.0 | 0.45 |
| sad | -0.4 | 0.05 |
| surprised | 0.0 | 0.7 |
| thinking | -0.2 | 0.0 |
| angry | -0.6 | 0.1 |
| embarrassed | 0.3 | 0.1 |
| sleepy | 0.0 | 0.05 |
| tipsy | 0.4 | 0.15 |

- `MouthForm`: -1 (frown) → 0 (neutral) → 1 (wide smile)
- `MouthOpenY`: 0 (closed) → 1 (wide open)

### Special Effect Parameters

| Emotion | Cheek (blush) | AngleX (head) | AngleY (head) |
|---------|:-------------:|:-------------:|:-------------:|
| neutral | 0.0 | 0 | 0 |
| happy | 0.0 | 0 | +2 |
| veryHappy | 0.2 | +3 | +4 |
| sad | 0.0 | 0 | -5 |
| surprised | 0.0 | 0 | +3 |
| thinking | 0.0 | -3 | -2 |
| angry | 0.0 | 0 | -2 |
| embarrassed | **0.8** | **-8** | **-6** |
| sleepy | 0.0 | 0 | +2 |
| tipsy | **0.6** | **+5** | +3 |

- `Cheek`: 0 (no blush) → 1 (full blush)
- `AngleX`: -30 (tilt left) → 0 → +30 (tilt right)
- `AngleY`: -30 (looking down) → 0 → +30 (looking up)

### Floating Visual Effects

Each emotion triggers floating emoji/sparkle effects around the screen:

| Emotion | Effects |
|---------|---------|
| neutral | ✦ |
| happy | ✿ ♥ ★ |
| veryHappy | 🌟 ✨ 🎉 ♥ ★ ✿ |
| sad | 💧 。 |
| surprised | ❕ ❗ ✦ |
| thinking | ❓ ❔ ⋯ |
| angry | 💢 🔥 |
| embarrassed | 💕 〜 ♡ |
| sleepy | 💤 z Z |
| tipsy | 🍷 ✦ ♡ 〜 |

## Customising Expressions

To add a new emotion or modify an existing one, edit the `EXPRESSIONS` object
in `public/js/viewer.js`:

```javascript
myNewEmotion: {
  label: 'My Emotion',
  icon: '🤩',
  params: {
    ParamEyeLOpen: 0.8,
    ParamEyeROpen: 0.8,
    // ... all required parameters
  },
  effects: ['🌟', '✨'],
}
```

Also add corresponding keywords to the `KEYWORDS` object in
`hooks/claude-emotion-hook.js` (and optionally `server/index.js`) for
detection.

## Parameter Discovery

To find your model's available parameters, examine its `.cdi3.json` file:

```bash
cat public/models/your-model/your-model.cdi3.json | jq '.Parameters[].Id'
```

This lists every parameter ID you can control.  Map them to the appropriate
emotion categories in `viewer.js`.
