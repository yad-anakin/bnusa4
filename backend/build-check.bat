@echo off
echo Starting build check for Bnusa Backend API...

rem Install dependencies
echo Installing dependencies...
call npm ci
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    exit /b 1
)

rem Check if MongoDB connection variables are set
echo Checking environment variables...
if "%MONGODB_URI%"=="" (
    echo WARNING: MONGODB_URI is not set. Using default localhost connection.
)

rem Run a quick test
echo Testing server startup...
node check-env.js
if %ERRORLEVEL% neq 0 (
    echo Environment check failed
    exit /b 1
)

echo Build check completed successfully!
echo The API is ready to be deployed with Coolify.

rem Optional: Run a quick test of the API
echo You can test the API locally with: npm start

exit /b 0 