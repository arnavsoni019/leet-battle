@echo off
title LeetCode Battle Dashboard
echo ==========================================
echo   LeetCode Battle Dashboard - Starting...
echo ==========================================
echo.

cd /d a:\Python\leetcode-compare

:: Start API server in background
start "LeetCode API Server" /min cmd /c "python api.py"

:: Start HTTP file server in background
start "LeetCode File Server" /min cmd /c "python -m http.server 8000"

:: Wait for servers to start
echo Starting servers...
timeout /t 3 /nobreak >nul

:: Open dashboard directly (default users are hardcoded in dashboard.js)
echo Opening dashboard...
start http://localhost:8000/dashboard.html

echo.
echo Servers are running! Close this window when done.
echo To stop: close the two minimized command windows.
pause
