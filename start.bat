@echo off

title GoFit Protein

echo.
echo ====================================
echo        GOFIT PROTEIN APP
echo ====================================
echo.

echo Starting Backend...

start "GoFit Backend" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend...

start "GoFit Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0"

timeout /t 5 /nobreak >nul

echo.
echo GoFit is running.
echo.
echo Laptop:
echo http://localhost:5173
echo.

start "" "http://localhost:5173"

echo.
echo ====================================
echo       GOFIT STARTED SUCCESSFULLY
echo ====================================
echo.

pause   