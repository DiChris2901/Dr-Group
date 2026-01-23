# DR Group Mobile - App Distribution Script
# Distribuye APK compilado a usuarios via Firebase App Distribution

param(
    [string]$Version = "",
    [string]$ReleaseNotes = "",
    [string]$Testers = ""
)

$APP_ID = "1:526970184316:android:4e55364c1a1794daf41ff9"
$APK_PATH = "android\app\build\outputs\apk\release\app-release.apk"
$TESTERS_FILE = "firebase-testers.txt"

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

# Si no se especificaron testers, cargar desde archivo
if ([string]::IsNullOrEmpty($Testers) -and (Test-Path $TESTERS_FILE)) {
    $testersArray = Get-Content $TESTERS_FILE | Where-Object { $_.Trim() -ne "" }
    $Testers = $testersArray -join ","
    Write-Host "Verificadores cargados desde $TESTERS_FILE" -ForegroundColor Green
    Write-Host "Total: $($testersArray.Count) usuarios" -ForegroundColor Green
}

if ([string]::IsNullOrEmpty($Version)) {
    $appJsonPath = "app.json"
    if (Test-Path $appJsonPath) {
        $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
        $Version = $appJson.expo.version
        $versionCode = $appJson.expo.android.versionCode
        Write-Host "Version detectada: $Version (Build $versionCode)" -ForegroundColor Green
        
        # ========================================
        # SINCRONIZAR BUILD.GRADLE CON APP.JSON
        # ========================================
        $buildGradlePath = "android\app\build.gradle"
        if (Test-Path $buildGradlePath) {
            Write-Host "Sincronizando build.gradle..." -ForegroundColor Yellow
            
            $buildGradle = Get-Content $buildGradlePath -Raw
            
            # Actualizar versionCode
            $buildGradle = $buildGradle -replace 'versionCode \d+', "versionCode $versionCode"
            
            # Actualizar versionName
            $buildGradle = $buildGradle -replace 'versionName "[^"]+"', "versionName `"$Version`""
            
            $buildGradle | Out-File $buildGradlePath -Encoding UTF8 -NoNewline
            
            Write-Host "build.gradle actualizado: v$Version (Build $versionCode)" -ForegroundColor Green
        } else {
            Write-Host "Advertencia: No se encontro build.gradle" -ForegroundColor Yellow
        }
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
    $testersCount = ($Testers -split ",").Count
    Write-Host "Testers: $testersCount verificadores" -ForegroundColor White
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
    
    # ========================================
    # ACTUALIZAR FIRESTORE AUTOMATICAMENTE
    # ========================================
    Write-Host "Actualizando version en Firestore..." -ForegroundColor Yellow
    
    try {
        $firestoreUrl = "https://firestore.googleapis.com/v1/projects/dr-group-cd21b/databases/(default)/documents/appConfig/latestVersion"
        $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        
        $body = @{
            fields = @{
                version = @{
                    stringValue = $Version
                }
                releaseNotes = @{
                    stringValue = $ReleaseNotes
                }
                isCritical = @{
                    booleanValue = $false
                }
                updatedAt = @{
                    stringValue = $timestamp
                }
            }
        } | ConvertTo-Json -Depth 10
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $firestoreUrl -Method Patch -Body $body -Headers $headers -ErrorAction Stop
        
        Write-Host "Version $Version configurada en Firestore" -ForegroundColor Green
        Write-Host "Las apps con versiones anteriores detectaran esta actualizacion automaticamente" -ForegroundColor Cyan
        Write-Host ""
    } catch {
        Write-Host "Advertencia: No se pudo actualizar Firestore automaticamente" -ForegroundColor Yellow
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Puedes actualizar manualmente en:" -ForegroundColor Yellow
        Write-Host "file:///$PWD/update-version-firestore.html" -ForegroundColor Blue
        Write-Host ""
    }
    
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
