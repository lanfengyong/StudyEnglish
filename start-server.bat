@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 英语打卡 - iPad 家庭服务
cls

echo ========================================
echo   英语打卡小助手 - 家庭 iPad 访问
echo ========================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [提示] 未检测到 Python，正在尝试用 py 启动...
    where py >nul 2>&1
    if errorlevel 1 (
        echo.
        echo [错误] 请先安装 Python：https://www.python.org/downloads/
        echo 安装时勾选 "Add python.exe to PATH"
        echo.
        pause
        exit /b 1
    )
    set PY_CMD=py -3
) else (
    set PY_CMD=python
)

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169' } | Select-Object -First 1).IPAddress"`) do set LOCAL_IP=%%i

if not defined LOCAL_IP set LOCAL_IP=请查看ipconfig

echo  第1步：确保 iPad 和本电脑连接同一个 WiFi
echo  第2步：在 iPad Safari 地址栏输入下面的网址
echo.
echo      http://%LOCAL_IP%:8080
echo.
echo  第3步：Safari 点「分享」-「添加到主屏幕」
echo.
echo  [重要] 学习时请保持本窗口开启，关闭后 iPad 无法访问
echo ========================================
echo.
echo 正在启动服务...
echo.

%PY_CMD% -m http.server 8080 --bind 0.0.0.0

pause
