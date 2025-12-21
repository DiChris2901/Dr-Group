# auto-version.ps1 - Versionado automático antes de compilar APK
# Consulta EAS Build para última versión y auto-incrementa

Write-Host ""
Write-Host "🔍 Consultando última versión en EAS Build..." -ForegroundColor Cyan
Write-Host ""

try {
    # Consultar EAS Build API
    $projectId = "169f6749-ebbd-4386-9359-b60f7afe299d"
    $apiUrl = "https://api.expo.dev/v2/projects/$projectId/builds?platform=android&status=finished&limit=1"
    
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction Stop

    if ($response.Count -eq 0) {
        Write-Host "⚠️ No se encontraron builds en EAS. Usando versión local." -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }

    $easVersion = $response[0].appVersion
    $buildChannel = $response[0].channel
    
    Write-Host "📱 Última versión en EAS Build: $easVersion" -ForegroundColor Green
    Write-Host "📡 Canal: $buildChannel" -ForegroundColor Gray
    Write-Host ""

    # Leer app.json
    $appJsonPath = "app.json"
    if (-not (Test-Path $appJsonPath)) {
        Write-Host "❌ Error: No se encontró app.json en el directorio actual" -ForegroundColor Red
        Write-Host "   Asegúrate de estar en el directorio mobile/" -ForegroundColor Yellow
        exit 1
    }

    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    $currentLocalVersion = $appJson.expo.version

    Write-Host "💻 Versión local actual: $currentLocalVersion" -ForegroundColor Cyan

    # Incrementar versión minor (1.0.0 → 1.1.0)
    $parts = $easVersion.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    
    # Incrementar minor (cambio estándar)
    $minor++
    
    $newVersion = "$major.$minor.$patch"

    Write-Host ""
    Write-Host "🚀 Nueva versión calculada: $newVersion" -ForegroundColor Magenta
    Write-Host ""

    # Confirmar con el usuario
    $confirmation = Read-Host "¿Deseas actualizar app.json a la versión $newVersion? (s/n)"
    
    if ($confirmation -ne 's' -and $confirmation -ne 'S') {
        Write-Host ""
        Write-Host "❌ Operación cancelada por el usuario" -ForegroundColor Yellow
        exit 0
    }

    # Actualizar app.json
    $appJson.expo.version = $newVersion
    $appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath -Encoding UTF8

    Write-Host ""
    Write-Host "✅ app.json actualizado exitosamente a versión $newVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📦 LISTO PARA COMPILAR" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ejecuta ahora:" -ForegroundColor Cyan
    Write-Host "   eas build --platform android --profile production" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error consultando EAS Build API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  - Tienes conexión a internet" -ForegroundColor Gray
    Write-Host "  - El Project ID es correcto: 169f6749-ebbd-4386-9359-b60f7afe299d" -ForegroundColor Gray
    Write-Host "  - Tienes acceso al proyecto en Expo" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
