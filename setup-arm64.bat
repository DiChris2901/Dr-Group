@echo off
echo 🚀 DR Group Dashboard - Setup ARM64 Optimization
echo.

REM Limpiar instalaciones previas problemáticas
echo ⏳ Limpiando cache npm y node_modules...
npm cache clean --force
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM Instalar pnpm si no está disponible
echo ⏳ Verificando pnpm...
pnpm --version > nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando pnpm...
    npm install -g pnpm
)

REM Instalar dependencias con pnpm (compatible ARM64)
echo ⏳ Instalando dependencias con pnpm (ARM64 optimizado)...
pnpm install

echo.
echo ✅ Setup completado! 
echo 🔥 Ejecuta: pnpm dev
echo 🌐 URL: http://localhost:5174
echo.
pause
