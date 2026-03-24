@echo off
REM Friendship Call - Quick Start Script for Windows
REM Handles building and running the application with SFU topology

setlocal enabledelayedexpansion

echo.
echo 🚀 VidyaX - Starting in SFU Mode
echo ========================================
echo.

REM Check if Node.js is installed
where /q node
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Go is installed
where /q go
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Go is not installed. Please install Go 1.21+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('go version') do set GO_VERSION=%%i

echo ✅ Node.js %NODE_VERSION%
echo ✅ %GO_VERSION%
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    call npm install
)

REM Build frontend
echo 🔨 Building frontend assets...
call npm run build

REM Run server with SFU enabled
echo.
echo 🎬 Starting Friendship Call server (SFU mode)...
echo 📍 Server running at http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.

set PEERCALLS_CONFIG=config.yml
go run main.go --config config.yml

pause
