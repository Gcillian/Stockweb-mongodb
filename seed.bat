@echo off
REM Seed database with test data

cd /d "C:\Users\Awir\Documents\KULIAH\TA-BigData\StockWeb"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║      NusaTrade - Database Seeding                     ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo This will create test accounts and sample stocks
echo.

npm run seed
pause
