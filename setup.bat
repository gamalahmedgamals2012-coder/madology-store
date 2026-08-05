@echo off
REM MADOLOGY - Quick Setup Script for Windows

echo.
echo ========================================
echo   MADOLOGY - E-Commerce Store
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed: 
node --version
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo ========================================
echo   How to run the server:
echo ========================================
echo.
echo Option 1: Simple Server (NO DATABASE REQUIRED - RECOMMENDED)
echo   Command: node server-simple.js
echo.
echo Option 2: Full Server with MongoDB
echo   Command: node index.js
echo   (Requires MongoDB running on localhost:27017)
echo.
echo Then open: http://localhost:3000
echo.
echo ========================================
echo.
pause
