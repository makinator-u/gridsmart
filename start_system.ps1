# GridSmart Application Launcher Script for PowerShell
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "           Starting GridSmart Full-Stack Application" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Python FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; python -m uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 2

Write-Host "Starting React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "GridSmart is starting up!" -ForegroundColor Green
Write-Host "Web Application URL: http://localhost:5173" -ForegroundColor BrightWhite
Write-Host "API Documentation:   http://127.0.0.1:8000/docs" -ForegroundColor BrightWhite
Write-Host "======================================================================" -ForegroundColor Cyan
