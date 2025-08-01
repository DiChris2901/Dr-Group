@echo off
echo ========================================
echo   DR Group Dashboard - Servidor Desarrollo
echo ========================================
echo.
echo Iniciando servidor de desarrollo...
echo Puerto predeterminado: 3000
echo Si esta ocupado, se usara el siguiente disponible
echo.
echo Para detener el servidor: Ctrl+C
echo Para abrir navegador: http://localhost:3000 o el puerto mostrado
echo.
echo ========================================
echo.

cd /d "%~dp0"
npm run dev

echo.
echo Servidor detenido.
pause
