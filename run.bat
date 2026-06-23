@echo off
title Asia University AI Consultant - Startup Manager
cls
echo ========================================================
echo   Asia University AI Consultant - HE THONG KHOI DONG
echo ========================================================
echo.
echo Chon che do khoi dong:
echo [1] Chay Offline (Localhost - Danh cho lap trinh, sua code)
echo [2] Chay Online (Internet - Chia se link cho nguoi khac vao)
echo.
set /p mode="Nhap lua chon (1 hoac 2) roi an Enter: "

if "%mode%"=="1" goto run_offline
if "%mode%"=="2" goto run_online

echo Lua chon khong hop le.
pause
exit

:run_offline
echo.
echo Dang khoi dong Backend...
start cmd /k "cd /d %~dp0backend && npm run dev"
echo Dang khoi dong Frontend...
start cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo [OK] Khoi dong hoan tat! Vui long vao link http://localhost:5173
pause
exit

:run_online
echo.
echo 1. Dang bien dich Frontend de chay chung cong voi Backend...
cd /d "%~dp0frontend"
call npm run build

echo.
echo 2. Dang lay dia chi IP Public cua ban de lam mat khau Localtunnel...
for /f "delims=" %%i in ('powershell -ExecutionPolicy Bypass -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"') do set MY_IP=%%i

echo.
echo 3. Dang khoi dong Backend va Server tinh (Port 5000)...
start cmd /k "cd /d %~dp0backend && npm start"

echo.
echo 4. Dang tao duong dan chia se qua Internet (Localtunnel)...
echo ========================================================
echo HUONG DAN ONLINE:
echo - Cua so Localtunnel se mo ra va cung cap 1 duong link co dang: https://xxxx.localtunnel.me
echo - Khi truy cap link do lan dau tren trinh duyet, ban can nhap mat khau bao mat.
echo - Hay dung dia chi IP nay lam mat khau: %MY_IP%
echo ========================================================
echo.
timeout /t 5
start cmd /k "echo IP Public cua ban (Copy o day): %MY_IP% && echo. && npx -y localtunnel --port 5000"

echo.
echo [OK] Khoi dong che do Online hoan tat!
echo Vui long copy link tu cua so Localtunnel va nhap IP: %MY_IP% khi duoc yeu cau.
pause
exit
