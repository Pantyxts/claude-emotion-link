@echo off
chcp 65001 >nul
title claude-emotion-link

echo.
echo   ╭──────────────────────────────────────╮
echo   │      ✦ claude-emotion-link ✦         │
echo   │    Live2D 情绪联动 — 一键启动         │
echo   ╰──────────────────────────────────────╯
echo.

:: ── 检查 Node.js ──
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [✗] 没有找到 Node.js，请先安装：
    echo       https://nodejs.org （选 LTS 版本就行）
    echo       装完之后重新双击这个脚本即可。
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo   [✓] Node.js 已找到：%NODE_VER%

:: ── 检查端口是否被占用 ──
netstat -ano 2>nul | findstr ":3456 " >nul
if %errorlevel% equ 0 (
    echo   [!] 端口 3456 已被占用，可能之前的服务还在跑
    echo       正在尝试释放端口...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3456 "') do (
        taskkill /F /PID %%a >nul 2>nul
    )
    timeout /t 2 /nobreak >nul
    echo   [✓] 端口已释放
)

:: ── 启动服务 ──
echo   [→] 正在启动服务...
echo.
start "" http://localhost:3456

node server\index.js

pause
