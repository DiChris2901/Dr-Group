# auto-version.ps1 - Versionado automático

Write-Host "Consultando última versión en EAS Build..." -ForegroundColor Cyan

try {
    $projectId = "169f6749-ebbd-4386-9359-b60f7afe299d"
    $url = "https://api.expo.dev/v2/projects/{0}/builds?platform=android&status=finished&limit=1" -f $projectId
    
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    
    if ($response.data.count -gt 0) {
        $easVersion = $response.data.builds[0].appVersion
        Write-Host "Última versión en EAS Build: $easVersion" -ForegroundColor Green
    } else {
        Write-Host "No se encontraron builds previos. Usando versión local." -ForegroundColor Yellow
        $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
        $easVersion = $appJson.expo.version
    }
} catch {
    Write-Host "Error consultando EAS. Usando versión local." -ForegroundColor Red
    $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
    $easVersion = $appJson.expo.version
}

$appJsonPath = "app.json"
$appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
$currentVersion = $appJson.expo.version

Write-Host "Versión local actual: $currentVersion"

$baseVersion = if ([System.Version]$currentVersion -gt [System.Version]$easVersion) { $currentVersion } else { $easVersion }

$parts = $baseVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

$minor++
$patch = 0
$newVersion = "$major.$minor.$patch"

Write-Host "Nueva versión para Build Nativo: $newVersion" -ForegroundColor Magenta

$appJson.expo.version = $newVersion

if ($appJson.expo.android.versionCode) {
    $appJson.expo.android.versionCode++
    Write-Host "Nuevo versionCode: $($appJson.expo.android.versionCode)" -ForegroundColor Cyan
} else {
    $appJson.expo.android = @{ versionCode = 1 }
    Write-Host "versionCode no encontrado. Iniciando en 1." -ForegroundColor Yellow
}

$appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath

Write-Host "app.json actualizado exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "Listo para compilar con:" -ForegroundColor Cyan
Write-Host "  eas build --platform android --profile production" -ForegroundColor White
