@echo off
echo.
echo ========================================
echo    REINSTALACION COMPLETA DE VS CODE
echo ========================================
echo.
echo ADVERTENCIA: Esto eliminara TODAS las configuraciones,
echo extensiones, cache y datos de VS Code.
echo.
set /p confirm="¿Estas seguro? (S/N): "
if /i not "%confirm%"=="S" (
    echo Operacion cancelada.
    pause
    exit /b
)

echo.
echo [1/8] Cerrando todas las instancias de VS Code...
taskkill /f /im Code.exe /t 2>nul
taskkill /f /im code.exe /t 2>nul
taskkill /f /im "Code - Insiders.exe" /t 2>nul
wmic process where "name like '%%code%%'" delete 2>nul
echo VS Code cerrado completamente.
timeout /t 3 /nobreak >nul

echo.
echo [2/8] Desinstalando VS Code actual...
echo Buscando desinstalador en Programs...
if exist "%ProgramFiles%\Microsoft VS Code\unins000.exe" (
    "%ProgramFiles%\Microsoft VS Code\unins000.exe" /SILENT /NORESTART
    echo Desinstalacion desde Program Files completada.
) else (
    echo No se encontro en Program Files.
)

echo Buscando desinstalador en Program Files (x86)...
if exist "%ProgramFiles(x86)%\Microsoft VS Code\unins000.exe" (
    "%ProgramFiles(x86)%\Microsoft VS Code\unins000.exe" /SILENT /NORESTART
    echo Desinstalacion desde Program Files (x86) completada.
) else (
    echo No se encontro en Program Files (x86).
)

echo Buscando desinstalador en AppData Local...
if exist "%LocalAppData%\Programs\Microsoft VS Code\unins000.exe" (
    "%LocalAppData%\Programs\Microsoft VS Code\unins000.exe" /SILENT /NORESTART
    echo Desinstalacion desde AppData completada.
) else (
    echo No se encontro en AppData.
)

timeout /t 5 /nobreak >nul

echo.
echo [3/8] Eliminando directorios de instalacion...
if exist "%ProgramFiles%\Microsoft VS Code" (
    rmdir /s /q "%ProgramFiles%\Microsoft VS Code" 2>nul
    echo Eliminado: Program Files\Microsoft VS Code
)
if exist "%ProgramFiles(x86)%\Microsoft VS Code" (
    rmdir /s /q "%ProgramFiles(x86)%\Microsoft VS Code" 2>nul
    echo Eliminado: Program Files (x86)\Microsoft VS Code
)
if exist "%LocalAppData%\Programs\Microsoft VS Code" (
    rmdir /s /q "%LocalAppData%\Programs\Microsoft VS Code" 2>nul
    echo Eliminado: LocalAppData\Programs\Microsoft VS Code
)

echo.
echo [4/8] Eliminando datos de usuario y configuraciones...
if exist "%AppData%\Code" (
    rmdir /s /q "%AppData%\Code" 2>nul
    echo Eliminado: AppData\Roaming\Code
)
if exist "%LocalAppData%\Microsoft\vscode-cpptools" (
    rmdir /s /q "%LocalAppData%\Microsoft\vscode-cpptools" 2>nul
    echo Eliminado: Cache de vscode-cpptools
)

echo.
echo [5/8] Eliminando cache y datos temporales...
if exist "%AppData%\Code - Insiders" (
    rmdir /s /q "%AppData%\Code - Insiders" 2>nul
    echo Eliminado: Code - Insiders
)
if exist "%LocalAppData%\Microsoft\vscode-eslint" (
    rmdir /s /q "%LocalAppData%\Microsoft\vscode-eslint" 2>nul
    echo Eliminado: Cache de ESLint
)
if exist "%LocalAppData%\Microsoft\vscode-typescript" (
    rmdir /s /q "%LocalAppData%\Microsoft\vscode-typescript" 2>nul
    echo Eliminado: Cache de TypeScript
)

echo Limpiando cache del sistema...
del /f /s /q "%LocalAppData%\Temp\vscode-*" 2>nul
del /f /s /q "%Temp%\vscode-*" 2>nul
echo Cache temporal eliminado.

echo.
echo [6/8] Limpiando registro de Windows...
echo Eliminando entradas del registro...
reg delete "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\{771FD6B0-FA20-440A-A002-3B3BAC16DC50}_is1" /f 2>nul
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{EA457B21-F73E-494C-ACAB-524FDE069978}_is1" /f 2>nul
reg delete "HKEY_CURRENT_USER\SOFTWARE\Classes\Applications\Code.exe" /f 2>nul
reg delete "HKEY_CURRENT_USER\SOFTWARE\Classes\vscode" /f 2>nul
reg delete "HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.js\OpenWithList" /va /f 2>nul
echo Registro limpiado.

echo.
echo [7/8] Descargando VS Code desde Microsoft...
echo Descargando la version mas reciente...
powershell -Command "& {Invoke-WebRequest -Uri 'https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user' -OutFile 'VSCodeUserSetup-x64.exe'}"

if not exist "VSCodeUserSetup-x64.exe" (
    echo ERROR: No se pudo descargar VS Code.
    echo Descarga manual desde: https://code.visualstudio.com/
    pause
    exit /b 1
)

echo Descarga completada.

echo.
echo [8/8] Instalando VS Code...
echo Instalando con configuracion limpia...
VSCodeUserSetup-x64.exe /SILENT /MERGETASKS=!runcode,addcontextmenufiles,addcontextmenufolders,associatewithfiles,addtopath

echo Esperando finalizacion de la instalacion...
timeout /t 10 /nobreak >nul

echo.
echo [LIMPIEZA] Eliminando archivos de instalacion...
del VSCodeUserSetup-x64.exe 2>nul

echo.
echo ========================================
echo     REINSTALACION COMPLETADA
echo ========================================
echo.
echo ✅ VS Code ha sido reinstalado completamente
echo ✅ Todas las configuraciones eliminadas
echo ✅ Cache y datos temporales limpiados
echo ✅ Registro de Windows limpiado
echo ✅ Instalacion fresca sin datos previos
echo.
echo 📋 PROXIMOS PASOS:
echo 1. Reinicia el sistema (recomendado)
echo 2. Abre VS Code
echo 3. Reinstala las extensiones necesarias
echo 4. Reconfigura tus preferencias
echo.
echo ⚠️  NOTA: Todas las extensiones y configuraciones
echo    se han eliminado. Tendras que configurar
echo    VS Code desde cero.
echo.
pause
