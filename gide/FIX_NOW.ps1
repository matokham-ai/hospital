Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Vite Dev Server Issue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Node processes stopped!" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
    Write-Host "Vite cache cleared!" -ForegroundColor Green
} else {
    Write-Host "No Vite cache found." -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 3: Starting dev server..." -ForegroundColor Yellow
Write-Host "Please wait for 'ready in' message..." -ForegroundColor Gray
Write-Host ""
npm run dev
