@echo off
cd /d "%~dp0"
title claude-emotion-link

echo.
echo   ======================================
echo         claude-emotion-link
echo         Live2D 情绪联动 — 一键启动
echo   ======================================
echo.

:: ── 检查 Node.js ──
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [X] 没有找到 Node.js
    echo.
    echo   请先安装 Node.js：
    echo   https://nodejs.org
    echo   选左边的 LTS 版本下载安装即可
    echo   装完重新双击 start.bat
    echo.
    pause
    exit
)

for /f "tokens=*" %%v in ('node -v') do echo   [OK] Node.js %%v

:: ── 释放端口 ──
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3456 " 2^>nul') do (
    echo   [→] 释放端口 3456...
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 /nobreak >nul

:: ── 启动 ──
echo   [→] 正在启动...
echo.
echo   浏览器打开后稍等几秒让模型加载
echo   看到 Hiyori 出现就说明跑通了
echo.
echo   按空格键 = 演示模式
echo   按 0-9   = 切换表情
echo   ======================================
echo.

:: 先启动服务，再打开浏览器
start "" /b node server\index.js
timeout /t 2 /nobreak >nul
start "" http://localhost:3456

echo   服务已在后台运行，可以关闭此窗口
echo.

:: 等待一下确认服务启动成功再退出
timeout /t 3 /nobreak >nul
exit
