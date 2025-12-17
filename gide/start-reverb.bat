@echo off
echo Starting Laravel Reverb WebSocket Server...
echo.
echo Make sure you have run the following commands first:
echo   composer install
echo   npm install
echo   npm run build
echo.
echo Starting Reverb server on localhost:8080...
php artisan reverb:start --host=0.0.0.0 --port=8080
pause