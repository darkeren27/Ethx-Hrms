@echo off
echo ===================================================
echo Launching ETHX Enterprise HRMS on Port 7080
echo Connected Backend: http://45.195.159.86:8280
echo ===================================================

set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
npm run dev
