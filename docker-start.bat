@echo off
echo ===================================================
echo Starting ETHX HRMS via Docker Compose
echo Frontend Port: 7080
echo ERPNext Backend Target: http://45.195.159.86:8280
echo ===================================================

docker compose up --build -d

echo.
echo Application started in Docker!
echo Access the HRMS at: http://localhost:7080
pause
