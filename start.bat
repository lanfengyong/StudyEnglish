@echo off
chcp 65001 >nul
title 英语打卡小助手
echo 正在启动英语打卡小助手...
echo.
start "" "%~dp0index.html"
echo 已在默认浏览器中打开。若未打开，请手动双击 index.html
echo.
pause
