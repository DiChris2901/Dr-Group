# increment-version.ps1 - Versionado Semantico DR Group
# Ubicacion: mobile/android/app/increment-version.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VERSIONADO APK - DR GROUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Rutas de archivos
$appJsonPath = "..\..\app.json"
$buildGradlePath = ".\build.gradle"

# Validar que existen los archivos
if (-not (Test-Path $appJsonPath)) {
    Write-Host "ERROR: No se encontro app.json en $appJsonPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $buildGradlePath)) {
    Write-Host "ERROR: No se encontro build.gradle en $buildGradlePath" -ForegroundColor Red
    exit 1
}

# Leer version actual de app.json
try {
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    $currentVersion = $appJson.expo.version
    $currentVersionCode = $appJson.expo.android.versionCode
} catch {
    Write-Host "ERROR leyendo app.json: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Version actual:" -ForegroundColor Yellow
Write-Host "   Version:     $currentVersion" -ForegroundColor White
Write-Host "   VersionCode: $currentVersionCode`n" -ForegroundColor White

# Parsear version actual
$parts = $currentVersion.Split('.')
if ($parts.Length -ne 3) {
    Write-Host "ERROR: Formato de version invalido. Debe ser X.Y.Z (ej: 3.7.1)" -ForegroundColor Red
    exit 1
}

$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

# Analizar commits recientes para sugerir tipo de version
Write-Host "Analizando commits recientes..." -ForegroundColor Cyan
$suggestedType = 2  # Default: MINOR
$suggestion = ""

try {
    # Obtener ultimos 5 commits
    $recentCommits = git log -5 --pretty=format:"%s" 2>$null
    
    if ($recentCommits) {
        $commitText = $recentCommits -join " "
        
        # Detectar MAJOR (cambios importantes)
        if ($commitText -match "BREAKING|major:|rewrite|reescritura|v\d+\.0\.0") {
            $suggestedType = 3
            $suggestion = "MAJOR - Detectados cambios importantes/incompatibles"
        }
        # Detectar PATCH (correcciones)
        elseif ($commitText -match "fix:|bugfix:|hotfix:|correccion|correction") {
            $suggestedType = 1
            $suggestion = "PATCH - Detectadas correcciones de bugs"
        }
        # Detectar MINOR (nuevas funcionalidades)
        elseif ($commitText -match "feat:|feature:|nueva|mejora|improvement") {
            $suggestedType = 2
            $suggestion = "MINOR - Detectadas nuevas funcionalidades"
        }
        else {
            $suggestedType = 2
            $suggestion = "MINOR - Tipo por defecto (no se detectaron patrones especificos)"
        }
        
        Write-Host "Analisis: $suggestion" -ForegroundColor Yellow
    } else {
        Write-Host "No se pudieron analizar commits (git no disponible)" -ForegroundColor Gray
    }
} catch {
    Write-Host "No se pudo analizar historial de commits" -ForegroundColor Gray
}

Write-Host ""

# Menu de seleccion
Write-Host "Selecciona el tipo de actualizacion:" -ForegroundColor Cyan
Write-Host "   [1] PATCH   - Correcciones de bugs       ($major.$minor.$patch -> $major.$minor.$($patch+1))" -ForegroundColor $(if ($suggestedType -eq 1) {"Green"} else {"White"})
Write-Host "   [2] MINOR   - Nuevas caracteristicas     ($major.$minor.$patch -> $major.$($minor+1).0)" -ForegroundColor $(if ($suggestedType -eq 2) {"Yellow"} else {"White"})
Write-Host "   [3] MAJOR   - Cambios importantes        ($major.$minor.$patch -> $($major+1).0.0)" -ForegroundColor $(if ($suggestedType -eq 3) {"Red"} else {"White"})

if ($suggestion) {
    Write-Host "`n   SUGERIDO: Opcion [$suggestedType] - $suggestion" -ForegroundColor Cyan
}

Write-Host ""

$choice = Read-Host "Elige una opcion (1, 2 o 3) [Sugerido: $suggestedType]"

# Si el usuario presiona Enter sin escribir, usar la sugerencia
if ([string]::IsNullOrWhiteSpace($choice)) {
    $choice = $suggestedType.ToString()
    Write-Host "Usando sugerencia: $suggestedType" -ForegroundColor Cyan
}

# Calcular nueva version segun eleccion
switch ($choice) {
    "1" {
        $patch++
        $versionType = "PATCH (Bug Fix)"
        $versionColor = "Green"
    }
    "2" {
        $minor++
        $patch = 0
        $versionType = "MINOR (Nueva Funcionalidad)"
        $versionColor = "Yellow"
    }
    "3" {
        $major++
        $minor = 0
        $patch = 0
        $versionType = "MAJOR (Cambio Importante)"
        $versionColor = "Red"
    }
    default {
        Write-Host "Opcion invalida. Proceso cancelado." -ForegroundColor Red
        exit 1
    }
}

$newVersion = "$major.$minor.$patch"
$newVersionCode = $currentVersionCode + 1

# Mostrar resumen de cambios
Write-Host "`nCambios a aplicar:" -ForegroundColor Green
Write-Host "   Tipo:        $versionType" -ForegroundColor $versionColor
Write-Host "   Version:     $currentVersion -> $newVersion" -ForegroundColor White
Write-Host "   VersionCode: $currentVersionCode -> $newVersionCode`n" -ForegroundColor White

$confirm = Read-Host "Confirmas estos cambios? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Proceso cancelado por el usuario." -ForegroundColor Red
    exit 0
}

Write-Host "`nActualizando archivos..." -ForegroundColor Cyan

# Actualizar app.json
try {
    $appJson.expo.version = $newVersion
    $appJson.expo.android.versionCode = $newVersionCode
    
    $appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath -Encoding UTF8
    Write-Host "   OK app.json actualizado" -ForegroundColor Green
} catch {
    Write-Host "   ERROR actualizando app.json: $_" -ForegroundColor Red
    exit 1
}

# Actualizar build.gradle
try {
    $gradleContent = Get-Content $buildGradlePath -Raw
    
    # Actualizar versionCode
    $gradleContent = $gradleContent -replace "versionCode \d+", "versionCode $newVersionCode"
    
    # Actualizar versionName
    $gradleContent = $gradleContent -replace 'versionName "[\d\.]+"', "versionName `"$newVersion`""
    
    # CRITICO: Usar UTF8NoBOM para evitar BOM que causa errores en Gradle
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($buildGradlePath, $gradleContent, $utf8NoBom)
    Write-Host "   OK build.gradle actualizado" -ForegroundColor Green
} catch {
    Write-Host "   ERROR actualizando build.gradle: $_" -ForegroundColor Red
    exit 1
}

# Resumen final
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  VERSIONADO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Nueva version: $newVersion (Build $newVersionCode)" -ForegroundColor White
Write-Host "Archivos actualizados:" -ForegroundColor Yellow
Write-Host "   - app.json" -ForegroundColor White
Write-Host "   - build.gradle`n" -ForegroundColor White

Write-Host "Siguiente paso:" -ForegroundColor Cyan
Write-Host "   Compilar APK en Android Studio:" -ForegroundColor White
Write-Host '   Build -> Generate Signed Bundle/APK -> APK -> Release' -ForegroundColor Gray
Write-Host ""

Write-Host "Despues distribuir con:" -ForegroundColor Cyan
Write-Host "   cd mobile" -ForegroundColor White
Write-Host "   .\distribute-apk.ps1" -ForegroundColor White
Write-Host ""
