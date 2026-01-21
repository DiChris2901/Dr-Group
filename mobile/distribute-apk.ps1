# DR Group Mobile - App Distribution Script
# Distribuye APK compilado a usuarios via Firebase App Distribution

param(
    [string]$Version = "",
    [string]$ReleaseNotes = "",
    [string]$Testers = ""
)

$APP_ID = "1:526970184316:android:4e55364c1a1794daf41ff9"
$APK_PATH = "android\app\build\outputs\apk\release\app-release.apk"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  FIREBASE APP DISTRIBUTION" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if (-Not (Test-Path $APK_PATH)) {
    Write-Host "ERROR: APK no encontrado" -ForegroundColor Red
    Write-Host "Ruta: $APK_PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Compila primero en Android Studio" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrEmpty($Version)) {
    $appJsonPath = "app.json"
    if (Test-Path $appJsonPath) {
        $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
        $Version = $appJson.expo.version
        Write-Host "Version detectada: $Version" -ForegroundColor Green
    } else {
        $Version = "Unknown"
    }
}

if ([string]::IsNullOrEmpty($ReleaseNotes)) {
    Write-Host ""
    Write-Host "Ingresa las notas de release (Enter para saltar):" -ForegroundColor Cyan
    $ReleaseNotes = Read-Host "   "
    if ([string]::IsNullOrEmpty($ReleaseNotes)) {
        $ReleaseNotes = "Version $Version - Actualizacion disponible"
    }
}

Write-Host ""
Write-Host "App ID:  $APP_ID" -ForegroundColor White
Write-Host "APK:     $APK_PATH" -ForegroundColor White
Write-Host "Version: $Version" -ForegroundColor White
Write-Host "Notas:   $ReleaseNotes" -ForegroundColor White
if (-Not [string]::IsNullOrEmpty($Testers)) {
    Write-Host "Testers: $Testers" -ForegroundColor White
}
Write-Host ""
Write-Host "Subiendo APK..." -ForegroundColor Yellow
Write-Host ""

if (-Not [string]::IsNullOrEmpty($Testers)) {
    firebase appdistribution:distribute $APK_PATH --app $APP_ID --release-notes "$ReleaseNotes" --testers $Testers
} else {
    firebase appdistribution:distribute $APK_PATH --app $APP_ID --release-notes "$ReleaseNotes"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "DISTRIBUCION COMPLETADA" -ForegroundColor Green
    Write-Host ""
    Write-Host "Los usuarios recibiran notificacion por email" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Dashboard:" -ForegroundColor White
    Write-Host "https://console.firebase.google.com/project/dr-group-cd21b/appdistribution" -ForegroundColor Blue
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR EN LA DISTRIBUCION" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "1. firebase login" -ForegroundColor White
    Write-Host "2. Permisos de App Distribution" -ForegroundColor White
    Write-Host "3. App ID correcto" -ForegroundColor White
    Write-Host ""
    exit 1
}
