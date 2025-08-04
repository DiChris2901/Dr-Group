@echo off
echo.
echo ========================================
echo    REINSTALACION POWERSHELL COMPLETA
echo ========================================
echo.

echo [1/6] Verificando version actual de PowerShell...
powershell -Command "Get-Host | Select-Object Version"
echo.

echo [2/6] Cerrando todas las instancias de PowerShell...
taskkill /f /im powershell.exe /t 2>nul
taskkill /f /im pwsh.exe /t 2>nul
echo PowerShell cerrado completamente.
echo.

echo [3/6] Descargando la ultima version de PowerShell 7...
powershell -Command "& {Invoke-WebRequest -Uri 'https://api.github.com/repos/PowerShell/PowerShell/releases/latest' -OutFile 'latest.json'}"
echo.

echo [4/6] Descargando PowerShell 7 desde GitHub...
powershell -Command "& {$release = Get-Content 'latest.json' | ConvertFrom-Json; $downloadUrl = ($release.assets | Where-Object {$_.name -like '*win-x64.msi'}).browser_download_url; Invoke-WebRequest -Uri $downloadUrl -OutFile 'PowerShell-latest-win-x64.msi'}"
echo.

echo [5/6] Instalando PowerShell 7...
msiexec /i "PowerShell-latest-win-x64.msi" /quiet /norestart
echo Instalacion completada.
echo.

echo [6/6] Limpiando archivos temporales...
del latest.json 2>nul
del PowerShell-latest-win-x64.msi 2>nul
echo.

echo ========================================
echo     REINSTALACION COMPLETADA
echo ========================================
echo.
echo PowerShell ha sido reinstalado exitosamente.
echo Reinicia la terminal para usar la nueva version.
echo.
pause
