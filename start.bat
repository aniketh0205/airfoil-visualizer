@echo off
echo Starting Airfoil Visualizer...
echo.

cd /d "%~dp0backend"
start "Backend" cmd /c "node server.js & pause"

cd /d "%~dp0frontend"
start "Frontend" cmd /c "npx vite --host & pause"

echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Close the terminal windows to stop.
