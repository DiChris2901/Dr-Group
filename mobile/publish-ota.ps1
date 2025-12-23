# publish-ota.ps1 - Actualización OTA con incremento de versión (Patch)

Write-Host "🚀 Iniciando proceso de publicación OTA..." -ForegroundColor Cyan

# 1. Leer versión actual
$appJsonPath = "app.json"
$appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
$currentVersion = $appJson.expo.version

Write-Host "📱 Versión actual: $currentVersion" -ForegroundColor Yellow

# 2. Incrementar versión (Patch: 1.0.5 -> 1.0.6)
$parts = $currentVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

$patch++
$newVersion = "$major.$minor.$patch"

Write-Host "✨ Nueva versión OTA: $newVersion" -ForegroundColor Green

# 3. Actualizar app.json
$appJson.expo.version = $newVersion
$appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath

Write-Host "✅ app.json actualizado." -ForegroundColor Green

# 4. Solicitar mensaje de actualización
$message = Read-Host "📝 Ingresa una descripción breve de los cambios (para el historial)"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Actualización OTA v$newVersion"
}

# 5. Ejecutar EAS Update
Write-Host "☁️ Publicando a Expo Cloud..." -ForegroundColor Cyan
eas update --branch production --message "$message"

Write-Host "🎉 ¡Actualización OTA completada! Versión $newVersion disponible." -ForegroundColor Magenta
