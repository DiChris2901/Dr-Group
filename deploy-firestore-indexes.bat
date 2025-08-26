@echo off
echo 🔥 Desplegando índices de Firestore para cuotas pendientes...
echo.

REM Verificar si Firebase CLI está instalado
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Firebase CLI no está instalado
    echo    Ejecute setup-firebase-cli.bat primero
    pause
    exit /b 1
)

echo ✅ Firebase CLI encontrado
echo.

REM Verificar si estamos en el directorio correcto
if not exist "firebase.json" (
    echo ❌ ERROR: No se encontró firebase.json
    echo    Asegúrese de estar en el directorio correcto del proyecto
    pause
    exit /b 1
)

echo 📋 Verificando configuración de índices...
type firestore.indexes.json

echo.
echo 🚀 Desplegando índices a Firebase...
firebase deploy --only firestore:indexes

if errorlevel 1 (
    echo ❌ ERROR: No se pudieron desplegar los índices
    echo    Verifique su conexión y permisos del proyecto
    pause
    exit /b 1
)

echo.
echo ✅ ¡Índices desplegados exitosamente!
echo.
echo 📝 Índice creado para cuotas pendientes:
echo    - Colección: payments
echo    - Campos: isInstallment (ASC), status (ASC), dueDate (ASC)
echo.
echo 🎉 El sistema de cuotas ahora funcionará completamente!
echo.
pause
