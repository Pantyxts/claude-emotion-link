#!/usr/bin/env bash
set -e

echo ""
echo "  ╭──────────────────────────────────────╮"
echo "  │      ✦ claude-emotion-link ✦         │"
echo "  │    Live2D 情绪联动 — 一键启动         │"
echo "  ╰──────────────────────────────────────╯"
echo ""

# ── 检查 Node.js ──
if ! command -v node &> /dev/null; then
    echo "  [✗] 没有找到 Node.js，请先安装："
    echo "      https://nodejs.org （选 LTS 版本就行）"
    echo "      装完之后重新运行此脚本即可。"
    echo ""
    exit 1
fi

echo "  [✓] Node.js 已找到：$(node -v)"

# ── 释放被占用的端口 ──
if lsof -ti:3456 &>/dev/null; then
    echo "  [!] 端口 3456 被占用，正在释放..."
    kill $(lsof -ti:3456) 2>/dev/null
    sleep 2
    echo "  [✓] 端口已释放"
fi

# ── 启动服务 ──
echo "  [→] 正在启动服务..."
echo ""

# 尝试自动打开浏览器
if command -v open &>/dev/null; then
    open "http://localhost:3456" &
elif command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:3456" &
fi

node server/index.js
