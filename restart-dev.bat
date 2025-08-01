@echo off
echo Reiniciando DR Group Dashboard...
echo.
echo 1. Deteniendo procesos Node.js existentes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo 2. Limpiando cache de npm...
npm cache clean --force

echo 3. Reinstalando dependencias...
npm install

echo 4. Iniciando servidor de desarrollo...
npm run dev

pause
