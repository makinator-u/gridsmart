@echo off
echo ======================================================================
echo           Starting GridSmart Full-Stack Application
echo ======================================================================
echo.

echo Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "GridSmart Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 >nul

echo Starting React Vite Frontend on http://localhost:5173 ...
start "GridSmart Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================================
echo GridSmart is starting up!
echo Access the Web App in your browser: http://localhost:5173
echo Access API Documentation:           http://127.0.0.1:8000/docs
echo ======================================================================
pause
