@echo off
title Dragon Words - 龙与地下城背单词
color 0A

echo.
echo   ============================================
echo       🐉 Dragon Words
echo       龙与地下城 · 背单词冒险
echo   ============================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo   ⏳ 正在安装依赖，请稍候...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo   ❌ 安装失败！请检查 Node.js 是否正确安装
        pause
        exit /b 1
    )
    echo.
    echo   ✅ 依赖安装完成
    echo.
)

echo   🚀 启动开发服务器...
echo.
echo   📱 浏览器将自动打开，如果未自动打开请访问：
echo      http://localhost:5173
echo.
echo   ❌ 关闭此窗口即可停止游戏
echo.
echo   ============================================
echo.

REM Open browser after a short delay
start /min "" http://localhost:5173

REM Start the dev server
call npx vite --host

pause
