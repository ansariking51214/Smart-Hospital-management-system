@echo off
title Smart Hospital Management System Launcher
echo ========================================================
echo   Launching Smart Hospital Management System (HMS)
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================================

REM 1. Start Backend in separate window
echo [1/3] Starting Backend Server (Port 5000)...
start "HMS Backend Server" cmd /k "cd /d %~dp0server && node src/server.js"

REM 2. Start Frontend in separate window
echo [2/3] Starting Frontend Vite Server (Port 5173)...
start "HMS Frontend Server" cmd /k "cd /d %~dp0client && node ./node_modules/vite/bin/vite.js --port 5173 --host"

REM 3. Wait and open browser
echo [3/3] Opening HMS Dashboard in your browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo ========================================================
echo   HMS is now running! Keep server windows open while using.
echo ========================================================
