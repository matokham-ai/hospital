@echo off
echo ========================================
echo Fixing Vite Dev Server Issue
echo ========================================
echo.

echo Step 1: Stopping Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found.
)
echo.

echo Step 3: Starting dev server...
echo Please wait for "ready in" message...
echo.
npm run dev
