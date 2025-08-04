@echo off
echo 🚀 Optimizando VS Code y limpiando proyecto...
echo.

REM Limpiar caché de Node.js
echo 📦 Limpiando caché de NPM...
npm cache clean --force 2>nul

REM Limpiar carpetas temporales
echo 🗑️ Eliminando archivos temporales...
if exist "dist" rmdir /s /q "dist" 2>nul
if exist "build" rmdir /s /q "build" 2>nul
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul
if exist ".cache" rmdir /s /q ".cache" 2>nul
if exist ".temp" rmdir /s /q ".temp" 2>nul
if exist ".tmp" rmdir /s /q ".tmp" 2>nul

REM Limpiar logs
echo 📋 Eliminando archivos de log...
del /q "*.log" 2>nul
del /q "npm-debug.log*" 2>nul
del /q "yarn-debug.log*" 2>nul
del /q "yarn-error.log*" 2>nul
del /q "pnpm-debug.log*" 2>nul

REM Limpiar caché de VS Code
echo 💻 Limpiando caché de VS Code...
if exist ".vscode\chrome-debug-profile" rmdir /s /q ".vscode\chrome-debug-profile" 2>nul
del /q ".vscode\*.log" 2>nul

REM Verificar espacio liberado
echo.
echo ✅ Limpieza completada!
echo.

REM Reinstalar dependencias de forma optimizada
echo 📚 Reinstalando dependencias...
npm ci --prefer-offline --no-audit --no-fund

echo.
echo 🎉 ¡Optimización completada!
echo 💡 Para aplicar todos los cambios, reinicia VS Code
echo.
pause
