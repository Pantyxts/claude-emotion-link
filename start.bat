@echo off
cd /d "%~dp0"
title claude-emotion-link

echo.
echo   ======================================
echo         claude-emotion-link
echo         Live2D Emotion Viewer
echo   ======================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [X] Node.js not found
    echo.
    echo   Please install Node.js first:
    echo   https://nodejs.org
    echo   Download the LTS version, install, then run this script again.
    echo.
    pause
    exit
)

for /f "tokens=*" %%v in ('node -v') do echo   [OK] Node.js %%v

:: Kill any process on port 3456
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3456"') do (
    taskkill /F /PID %%a >nul 2>nul
)

:: Wait a moment
timeout /t 1 /nobreak >nul

:: Start
echo   [..] Starting server...
echo.
echo   Browser will open shortly. Wait for the model to load.
echo.
echo   Controls:
echo     Space = Demo mode (auto-cycle emotions)
echo     0-9   = Switch emotion directly
echo   ======================================
echo.

:: Open browser first (it will show connection error until server starts)
start "" http://localhost:3456

:: Start the server in foreground
echo   Starting server on http://localhost:3456
echo   Press Ctrl+C to stop
echo.
node server\index.js

pause
