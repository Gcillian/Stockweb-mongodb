@echo off
REM Quick start script for NusaTrade on Windows

cd /d "C:\Users\Awir\Documents\KULIAH\TA-BigData\StockWeb"

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║          NusaTrade - Quick Start Server               ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [Info] Make sure MongoDB is running!
echo.
echo Starting NusaTrade server on http://localhost:4000
echo.
echo Open in browser:
echo - Homepage:      http://localhost:4000/index.html
echo - User Panel:    http://localhost:4000/userdashboard.html
echo - Admin Panel:   http://localhost:4000/admindashboard.html
echo.
echo Press Ctrl+C to stop server
echo.

npm run dev
pause
