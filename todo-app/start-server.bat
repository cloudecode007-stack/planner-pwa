@echo off
echo ========================================
echo   Планер-Органайзер - Локальный сервер
echo ========================================
echo.
echo Откройте в браузере: http://localhost:8000
echo.
echo Для остановки нажмите Ctrl+C
echo.
python -m http.server 8000
pause
