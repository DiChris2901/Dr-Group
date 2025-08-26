@echo off
echo 🔧 Instalando Firebase CLI globalmente...
echo.

REM Verificar si npm está disponible
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm no está instalado o no está en el PATH
    echo    Por favor instale Node.js primero
    pause
    exit /b 1
)

echo ✅ npm encontrado, procediendo con la instalación...
echo.

REM Instalar Firebase CLI
echo 📦 Instalando firebase-tools...
npm install -g firebase-tools

if errorlevel 1 (
    echo ❌ ERROR: No se pudo instalar Firebase CLI
    echo    Intente ejecutar como administrador
    pause
    exit /b 1
)

echo.
echo ✅ Firebase CLI instalado exitosamente!
echo.

REM Verificar la instalación
echo 🔍 Verificando instalación...
firebase --version

echo.
echo 🎉 ¡Todo listo! Ahora puede usar los comandos de Firebase.
echo.
echo 📋 Comandos útiles:
echo    firebase login          - Iniciar sesión
echo    firebase projects       - Ver proyectos
echo    firebase deploy         - Desplegar
echo.
pause
