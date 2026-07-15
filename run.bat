@echo off
title Asia University AI Consultant - Startup Manager
cls
echo ========================================================
echo   Asia University AI Consultant - STARTUP SYSTEM
echo ========================================================
echo.
echo Select startup mode:
echo [1] Run Offline (Localhost - For development/coding)
echo [2] Run Online (Internet - Share link with others)
echo.
set /p mode="Enter your choice (1 or 2) and press Enter: "

if "%mode%"=="1" goto run_offline
if "%mode%"=="2" goto run_online

echo Invalid choice.
pause
exit

:run_offline
echo.
echo Installing Python requirements...
start /b cmd /c "cd /d %~dp0backend && py -m pip install -r requirements.txt -q"
timeout /t 5 >nul
echo Starting Backend (Python)...
start cmd /k "cd /d %~dp0backend && py server.py"
echo Starting Frontend...
start cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo [OK] Startup complete! Please visit http://localhost:5173
pause
exit

:run_online
echo.
echo 1. Building Frontend to run on the same port as Backend...
cd /d "%~dp0frontend"
call npm run build

echo.
echo 2. Installing Python requirements...
cd /d "%~dp0backend"
call py -m pip install -r requirements.txt -q

echo.
echo 3. Starting Backend (Python) and Static Server (Port 5000)...
start cmd /k "cd /d %~dp0backend && py server.py"

echo.
echo 4. Creating Ultra-Stable Internet sharing link (Cloudflare)...
echo ========================================================
echo ONLINE INSTRUCTIONS:
echo - A new window will open and generate a Cloudflare Tunnel.
echo - Look for the URL ending with .trycloudflare.com in the box.
echo - That is your permanent link for this session. NO PASSWORD REQUIRED!
echo ========================================================
echo.
timeout /t 3
start cmd /k "echo Starting Cloudflare Tunnel... && echo. && npx -y cloudflared tunnel --url http://localhost:5000"

echo.
echo [OK] Online mode startup complete!
echo Please copy the link from the Cloudflare window to share with others.
pause
exit
