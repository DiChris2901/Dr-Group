@echo off
echo 🔥 Configurando Cloud Functions para DR Group Dashboard...

cd functions

echo 📦 Instalando dependencias de Cloud Functions...
call npm install

echo ✅ Cloud Functions configuradas correctamente!
echo.
echo Para usar las funciones:
echo   - Desarrollo: npm run functions:serve
echo   - Deploy: npm run functions:deploy
echo.
pause
