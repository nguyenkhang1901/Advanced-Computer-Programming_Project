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
echo Starting Backend...
start cmd /k "cd /d %~dp0backend && npm run dev"
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
echo 2. Getting your Public IP address for Localtunnel password...
for /f "delims=" %%i in ('powershell -ExecutionPolicy Bypass -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"') do set MY_IP=%%i

echo.
echo 3. Starting Backend and Static Server (Port 5000)...
start cmd /k "cd /d %~dp0backend && npm start"

echo.
echo 4. Creating Internet sharing link (Localtunnel)...
echo ========================================================
echo ONLINE INSTRUCTIONS:
echo - A Localtunnel window will open and provide a link like: https://xxxx.loca.lt
echo - When accessing the link for the first time, you need a security password.
echo - Use this IP address as the password: %MY_IP%
echo ========================================================
echo.
timeout /t 5
start cmd /k "echo Your Public IP (Copy here): %MY_IP% && echo. && npx -y localtunnel --port 5000"

echo.
echo [OK] Online mode startup complete!
echo Please copy the link from the Localtunnel window and enter IP: %MY_IP% when prompted.
pause
exit
