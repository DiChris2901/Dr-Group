# increment-version.ps1 - Versionado Semantico DR Group
# Ubicacion: mobile/android/app/increment-version.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VERSIONADO APK - DR GROUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Rutas de archivos - Resolver a rutas ABSOLUTAS para evitar problemas con .NET
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$appJsonPath = (Resolve-Path (Join-Path $scriptDir "..\..\app.json")).Path
$buildGradlePath = (Resolve-Path (Join-Path $scriptDir "build.gradle")).Path

# Validar que existen los archivos
if (-not (Test-Path $appJsonPath)) {
    Write-Host "ERROR: No se encontro app.json en $appJsonPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $buildGradlePath)) {
    Write-Host "ERROR: No se encontro build.gradle en $buildGradlePath" -ForegroundColor Red
    exit 1
}

Write-Host "Archivos detectados:" -ForegroundColor Gray
Write-Host "   app.json:     $appJsonPath" -ForegroundColor Gray
Write-Host "   build.gradle: $buildGradlePath" -ForegroundColor Gray

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
    
    # VERIFICACION POST-ESCRITURA
    $verifyJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    if ($verifyJson.expo.version -eq $newVersion -and $verifyJson.expo.android.versionCode -eq $newVersionCode) {
        Write-Host "   OK app.json actualizado y VERIFICADO" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: app.json NO se actualizo correctamente!" -ForegroundColor Red
        Write-Host "      - version: $($verifyJson.expo.version) (esperado: $newVersion)" -ForegroundColor Red
        Write-Host "      - versionCode: $($verifyJson.expo.android.versionCode) (esperado: $newVersionCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR actualizando app.json: $_" -ForegroundColor Red
    exit 1
}

# Actualizar build.gradle
try {
    $gradleContent = Get-Content $buildGradlePath -Raw
    
    # Guardar contenido original para verificar cambios
    $originalGradleContent = $gradleContent
    
    # Actualizar versionCode
    $gradleContent = $gradleContent -replace "versionCode \d+", "versionCode $newVersionCode"
    
    # Actualizar versionName
    $gradleContent = $gradleContent -replace 'versionName "[\d\.]+"', "versionName `"$newVersion`""
    
    # Verificar que los reemplazos se aplicaron
    if ($gradleContent -eq $originalGradleContent) {
        Write-Host "   ADVERTENCIA: No se detectaron cambios en build.gradle" -ForegroundColor Yellow
        Write-Host "   Contenido actual puede no coincidir con el patron esperado" -ForegroundColor Yellow
    }
    
    # CRITICO: Usar ruta ABSOLUTA con UTF8NoBOM para evitar BOM que causa errores en Gradle
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($buildGradlePath, $gradleContent, $utf8NoBom)
    
    # VERIFICACION POST-ESCRITURA: Confirmar que los valores se escribieron correctamente
    $verifyContent = Get-Content $buildGradlePath -Raw
    $hasCorrectVersion = $verifyContent -match "versionName `"$newVersion`""
    $hasCorrectCode = $verifyContent -match "versionCode $newVersionCode"
    
    if ($hasCorrectVersion -and $hasCorrectCode) {
        Write-Host "   OK build.gradle actualizado y VERIFICADO" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: build.gradle NO se actualizo correctamente!" -ForegroundColor Red
        if (-not $hasCorrectVersion) {
            Write-Host "      - versionName no coincide (esperado: $newVersion)" -ForegroundColor Red
        }
        if (-not $hasCorrectCode) {
            Write-Host "      - versionCode no coincide (esperado: $newVersionCode)" -ForegroundColor Red
        }
        Write-Host "   Ruta usada: $buildGradlePath" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR actualizando build.gradle: $_" -ForegroundColor Red
    exit 1
}

# Resumen final con verificacion cruzada
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  VERSIONADO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Nueva version: $newVersion (Build $newVersionCode)" -ForegroundColor White

# Verificacion cruzada final: leer ambos archivos y confirmar que coinciden
$finalJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
$finalGradle = Get-Content $buildGradlePath -Raw

$jsonVersion = $finalJson.expo.version
$jsonCode = $finalJson.expo.android.versionCode
$gradleVersionMatch = [regex]::Match($finalGradle, 'versionName "([^"]+)"')
$gradleCodeMatch = [regex]::Match($finalGradle, 'versionCode (\d+)')
$gradleVersion = $gradleVersionMatch.Groups[1].Value
$gradleCode = [int]$gradleCodeMatch.Groups[1].Value

Write-Host "`nVerificacion cruzada:" -ForegroundColor Yellow
Write-Host "   app.json:     v$jsonVersion (Build $jsonCode)" -ForegroundColor White
Write-Host "   build.gradle: v$gradleVersion (Build $gradleCode)" -ForegroundColor White

if ($jsonVersion -eq $gradleVersion -and $jsonCode -eq $gradleCode) {
    Write-Host "   SINCRONIZADOS CORRECTAMENTE" -ForegroundColor Green
} else {
    Write-Host "   DESINCRONIZADOS - Corregir manualmente!" -ForegroundColor Red
    exit 1
}

Write-Host "`nArchivos actualizados:" -ForegroundColor Yellow
Write-Host "   - $appJsonPath" -ForegroundColor White
Write-Host "   - $buildGradlePath`n" -ForegroundColor White

Write-Host "Siguiente paso:" -ForegroundColor Cyan
Write-Host "   Compilar APK en Android Studio:" -ForegroundColor White
Write-Host '   Build -> Generate Signed Bundle/APK -> APK -> Release' -ForegroundColor Gray
Write-Host ""

Write-Host "Despues distribuir con:" -ForegroundColor Cyan
Write-Host "   cd mobile" -ForegroundColor White
Write-Host "   .\distribute-apk.ps1" -ForegroundColor White
Write-Host ""
