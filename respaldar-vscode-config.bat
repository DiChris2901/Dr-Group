@echo off
echo.
echo ========================================
echo   RESPALDO DE CONFIGURACIONES VS CODE
echo ========================================
echo.

set BACKUP_DIR="%~dp0VSCode_Backup_%date:~6,4%_%date:~3,2%_%date:~0,2%_%time:~0,2%_%time:~3,2%_%time:~6,2%"
set BACKUP_DIR=%BACKUP_DIR: =0%
set BACKUP_DIR=%BACKUP_DIR::=%

echo Creando directorio de respaldo: %BACKUP_DIR%
mkdir %BACKUP_DIR% 2>nul

echo.
echo [1/5] Respaldando configuraciones de usuario...
if exist "%AppData%\Code\User\settings.json" (
    copy "%AppData%\Code\User\settings.json" %BACKUP_DIR%\settings.json >nul
    echo ✅ settings.json respaldado
) else (
    echo ❌ settings.json no encontrado
)

if exist "%AppData%\Code\User\keybindings.json" (
    copy "%AppData%\Code\User\keybindings.json" %BACKUP_DIR%\keybindings.json >nul
    echo ✅ keybindings.json respaldado
) else (
    echo ❌ keybindings.json no encontrado
)

echo.
echo [2/5] Respaldando lista de extensiones...
if exist "%LocalAppData%\Programs\Microsoft VS Code\bin\code.cmd" (
    "%LocalAppData%\Programs\Microsoft VS Code\bin\code.cmd" --list-extensions > %BACKUP_DIR%\extensions-list.txt
    echo ✅ Lista de extensiones respaldada
) else if exist "%ProgramFiles%\Microsoft VS Code\bin\code.cmd" (
    "%ProgramFiles%\Microsoft VS Code\bin\code.cmd" --list-extensions > %BACKUP_DIR%\extensions-list.txt
    echo ✅ Lista de extensiones respaldada
) else (
    echo ❌ No se pudo encontrar VS Code para listar extensiones
)

echo.
echo [3/5] Respaldando snippets personalizados...
if exist "%AppData%\Code\User\snippets" (
    xcopy "%AppData%\Code\User\snippets" %BACKUP_DIR%\snippets\ /e /i /h /y >nul
    echo ✅ Snippets respaldados
) else (
    echo ❌ No se encontraron snippets personalizados
)

echo.
echo [4/5] Respaldando configuraciones del workspace...
if exist ".vscode" (
    xcopy ".vscode" %BACKUP_DIR%\workspace-vscode\ /e /i /h /y >nul
    echo ✅ Configuraciones del workspace respaldadas
) else (
    echo ❌ No se encontraron configuraciones del workspace
)

echo.
echo [5/5] Creando script de restauracion...
(
echo @echo off
echo echo Restaurando configuraciones de VS Code...
echo echo.
echo if not exist "%%AppData%%\Code\User" mkdir "%%AppData%%\Code\User"
echo if exist "settings.json" copy "settings.json" "%%AppData%%\Code\User\settings.json"
echo if exist "keybindings.json" copy "keybindings.json" "%%AppData%%\Code\User\keybindings.json"
echo if exist "snippets" xcopy "snippets" "%%AppData%%\Code\User\snippets\" /e /i /h /y
echo if exist "workspace-vscode" xcopy "workspace-vscode" ".vscode\" /e /i /h /y
echo echo.
echo echo Instalando extensiones...
echo if exist "extensions-list.txt" ^(
echo     for /f %%%%i in ^(extensions-list.txt^) do ^(
echo         echo Instalando extension: %%%%i
echo         code --install-extension %%%%i
echo     ^)
echo ^)
echo echo.
echo echo ✅ Restauracion completada
echo pause
) > %BACKUP_DIR%\restaurar-configuraciones.bat

echo ✅ Script de restauración creado

echo.
echo ========================================
echo     RESPALDO COMPLETADO
echo ========================================
echo.
echo 📁 Respaldo guardado en: %BACKUP_DIR%
echo.
echo 📋 Archivos respaldados:
echo   - settings.json (configuraciones generales)
echo   - keybindings.json (atajos de teclado)
echo   - snippets (fragmentos de código personalizados)
echo   - extensions-list.txt (lista de extensiones)
echo   - workspace-vscode (configuraciones del proyecto)
echo   - restaurar-configuraciones.bat (script de restauración)
echo.
echo 🔄 Para restaurar después de la reinstalación:
echo   1. Abre VS Code
echo   2. Ve al directorio de respaldo
echo   3. Ejecuta 'restaurar-configuraciones.bat'
echo.
echo ⚠️  Ahora puedes ejecutar 'reinstalar-vscode-completo.bat'
echo    para hacer la reinstalación completa.
echo.
pause
