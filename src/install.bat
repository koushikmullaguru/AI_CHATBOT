@echo off
setlocal enabledelayedexpansion

REM AI School Chat - Installation Script (Windows)
REM This script automates the setup process

color 0A
cls

echo =========================================================
echo.
echo       AI School Chat Installation Script
echo.
echo =========================================================
echo.

REM Check if Node.js is installed
echo Checking prerequisites...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo X Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Required version: 18.0.0 or higher
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [OK] Node.js found: !NODE_VERSION!
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo X npm is not installed!
    echo.
    echo npm should come with Node.js installation
    echo Please reinstall Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [OK] npm found: v!NPM_VERSION!
)

echo.
echo ---------------------------------------------------------
echo.

REM Install dependencies
color 0E
echo Installing dependencies...
echo.
echo This may take 2-3 minutes depending on your internet speed.
echo.

call npm install

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo X Installation failed!
    echo.
    echo Try running these commands manually:
    echo   npm cache clean --force
    echo   npm install
    echo.
    pause
    exit /b 1
)

echo.
color 0A
echo [OK] Dependencies installed successfully!

echo.
echo ---------------------------------------------------------
echo.

REM Success message
color 0A
echo =========================================================
echo.
echo           Installation Complete!
echo.
echo =========================================================
echo.

color 0B
echo Next steps:
echo.
echo   1. Start the development server:
color 0E
echo      npm run dev
echo.
color 0B
echo   2. Open your browser at:
color 0E
echo      http://localhost:3000
echo.
color 0B
echo   3. Test login credentials:
color 0E
echo      Student:  student@school.com / student123
echo      Parent:   1234567890 / OTP: 123456
echo      Teacher:  teacher@school.com / teacher123
echo.
color 0B
echo Documentation:
echo    START_HERE.md       - Quick start guide
echo    GETTING_STARTED.md  - Visual walkthrough
echo    README.md           - Full documentation
echo.
color 0A
echo Happy coding! 
echo.

pause
