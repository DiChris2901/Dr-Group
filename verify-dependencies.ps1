# Script de Verificación de Dependencias - DR Group Dashboard
# Ejecutar: powershell -ExecutionPolicy Bypass -File .\verify-dependencies.ps1

Write-Host ""
Write-Host "🔍 VERIFICADOR DE DEPENDENCIAS - DR GROUP DASHBOARD" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "1️⃣  Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
        
        $npmVersion = npm --version 2>$null
        Write-Host "   ✅ npm: v$npmVersion" -ForegroundColor Green
        
        $npxVersion = npx --version 2>$null
        Write-Host "   ✅ npx: v$npxVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
}
catch {
    Write-Host "   ❌ Node.js NO instalado o no accesible" -ForegroundColor Red
    Write-Host "   📖 Ver: INSTALACION_NODE.md" -ForegroundColor Cyan
    $nodeInstalled = $false
}

# Verificar carpetas node_modules
Write-Host ""
Write-Host "2️⃣  Verificando node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ Dashboard Web: node_modules existe" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Dashboard Web: node_modules NO existe" -ForegroundColor Red
    Write-Host "      Ejecutar: npm install" -ForegroundColor White
}

if (Test-Path "mobile\node_modules") {
    Write-Host "   ✅ App Móvil: node_modules existe" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  App Móvil: node_modules NO existe" -ForegroundColor Red
    Write-Host "      Ejecutar: Set-Location mobile; npx expo install" -ForegroundColor White
}

if (Test-Path "functions\node_modules") {
    Write-Host "   ✅ Firebase Functions: node_modules existe" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Firebase Functions: node_modules NO existe" -ForegroundColor Red
    Write-Host "      Ejecutar: cd functions; npm install" -ForegroundColor White
}

# Verificar archivos .env
Write-Host ""
Write-Host "3️⃣  Verificando archivos .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ Dashboard Web: .env existe" -ForegroundColor Green
    
    # Verificar que no sean placeholders
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "tu-api-key-aqui" -or $envContent -match "tu-project-id") {
        Write-Host "   ⚠️  Contiene valores placeholder - configurar con valores reales" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ⚠️  Dashboard Web: .env NO existe" -ForegroundColor Red
    Write-Host "      Copiar: copy .env.example .env" -ForegroundColor White
}

if (Test-Path "mobile\.env") {
    Write-Host "   ✅ App Móvil: .env existe" -ForegroundColor Green
}
else {
    Write-Host "   ❌ App Móvil: .env NO existe" -ForegroundColor Red
    Write-Host "      Ya fue creado automáticamente" -ForegroundColor White
}

# Verificar versiones en package.json
Write-Host ""
Write-Host "4️⃣  Verificando versiones críticas..." -ForegroundColor Yellow

$dashboardPkg = Get-Content "package.json" -Raw | ConvertFrom-Json
Write-Host "   Dashboard Web:" -ForegroundColor White
Write-Host "      React: $($dashboardPkg.dependencies.react)" -ForegroundColor White
Write-Host "      Vite: $($dashboardPkg.devDependencies.vite)" -ForegroundColor White
Write-Host "      Firebase: $($dashboardPkg.dependencies.firebase)" -ForegroundColor White

$mobilePkg = Get-Content "mobile\package.json" -Raw | ConvertFrom-Json
Write-Host "   App Móvil:" -ForegroundColor White
Write-Host "      React: $($mobilePkg.dependencies.react)" -ForegroundColor White
Write-Host "      Expo: $($mobilePkg.dependencies.expo)" -ForegroundColor White
Write-Host "      Firebase: $($mobilePkg.dependencies.firebase)" -ForegroundColor White

# Resumen final
Write-Host ""
Write-Host "📊 RESUMEN:" -ForegroundColor Cyan
if ($nodeInstalled -eq $false) {
    Write-Host "   🔴 CRÍTICO: Instalar Node.js v20 LTS" -ForegroundColor Red
    Write-Host "      https://nodejs.org/" -ForegroundColor White
}
else {
    Write-Host "   🟢 Sistema listo para desarrollo" -ForegroundColor Green
}

Write-Host ""
Write-Host "📖 Documentación:" -ForegroundColor Cyan
Write-Host "   - INSTALACION_NODE.md (Guía de instalación)" -ForegroundColor White
Write-Host "   - CAMBIOS_APLICADOS.md (Resumen de cambios)" -ForegroundColor White
Write-Host "   - README.md (Documentación general)" -ForegroundColor White
Write-Host "   - SETUP_README.md (Setup completo)" -ForegroundColor White

Write-Host ""
