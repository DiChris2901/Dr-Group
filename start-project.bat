@echo off
echo 🚀 Iniciando DR Group Dashboard...
echo ==========================================
echo.

REM Verificar si estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontró package.json
    echo Asegúrate de estar en el directorio raíz del proyecto
    pause
    exit /b 1
)

REM Verificar si existe .env
if not exist ".env" (
    echo ⚠️  Advertencia: No se encontró archivo .env
    echo El proyecto podría no funcionar sin configuración de Firebase
    echo.
)

REM Verificar dependencias
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    echo.
)

echo 🎯 Iniciando servidor de desarrollo...
echo 📱 La aplicación se abrirá en: http://localhost:5173
echo 🔧 Para detener el servidor presiona Ctrl+C
echo.

npm run dev

pause
