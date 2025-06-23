@echo off
echo Starting build check for Bnusa frontend...

rem Install dependencies
echo Installing dependencies...
call npm ci
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    exit /b 1
)

rem Run build
echo Building the application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Build failed
    exit /b 1
)

echo Build completed successfully!
echo The application is ready to be deployed with Coolify.

rem Optional: Run a quick test of the build
echo You can test the production build locally with: npm start

exit /b 0 