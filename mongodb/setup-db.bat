@echo off
REM MongoDB Setup Script for Windows
REM This script initializes the Plaid Financcer database

echo ====================================
echo Plaid Financcer - Database Setup
echo ====================================
echo.

REM Check if mongosh is installed
where mongosh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: mongosh is not installed or not in PATH
    echo Please install MongoDB Shell from: https://www.mongodb.com/try/download/shell
    echo.
    pause
    exit /b 1
)

echo MongoDB Shell found!
echo.

echo Step 1: Initializing database...
echo Running init-db.js...
mongosh plaid-financcer < mongodb\init-db.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to initialize database
    pause
    exit /b 1
)
echo.

:ASK_SAMPLE_DATA
echo ====================================
set /p LOAD_SAMPLE="Do you want to load sample data for testing? (Y/N): "
if /i "%LOAD_SAMPLE%"=="Y" goto LOAD_DATA
if /i "%LOAD_SAMPLE%"=="N" goto SKIP_DATA
echo Invalid input. Please enter Y or N.
goto ASK_SAMPLE_DATA

:LOAD_DATA
echo.
echo Step 2: Loading sample data...
echo Running sample-data.js...
mongosh plaid-financcer < mongodb\sample-data.js
echo.
goto FINISH

:SKIP_DATA
echo.
echo Skipping sample data...
echo.

:FINISH
echo ====================================
echo Database Setup Complete!
echo ====================================
echo.
echo Your database is ready to use.
echo.
echo Next steps:
echo 1. Update your .env file with MongoDB URI and Plaid credentials
echo 2. Run: yarn install
echo 3. Run: yarn start:dev
echo.
echo To view your data:
echo - MongoDB Compass: mongodb://localhost:27017/plaid-financcer
echo - Or run: mongosh plaid-financcer
echo.
pause
