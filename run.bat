@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js/npm is not installed or is not available in PATH.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dependencies are missing. Installing them first...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting Mầm Lab. Press Ctrl+C to stop the development server.
call npm run dev
