# publish-ota.ps1 - OBSOLETO - NO SE USA EN ESTE PROYECTO
# Este proyecto usa compilación local en Android Studio + Firebase App Distribution
# NO hay actualizaciones OTA porque no usamos EAS Build

Write-Host ""
Write-Host "⚠️  SCRIPT OBSOLETO" -ForegroundColor Red
Write-Host ""
Write-Host "Este proyecto NO usa actualizaciones OTA." -ForegroundColor Yellow
Write-Host "Todas las actualizaciones requieren:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Incrementar versión manualmente en:" -ForegroundColor Cyan
Write-Host "   - app.json (version)" -ForegroundColor White
Write-Host "   - android/app/build.gradle (versionCode, versionName)" -ForegroundColor White
Write-Host ""
Write-Host "2. Compilar APK en Android Studio:" -ForegroundColor Cyan
Write-Host "   Build > Generate Signed Bundle/APK > APK > Release" -ForegroundColor White
Write-Host ""
Write-Host "3. Distribuir APK compilado:" -ForegroundColor Cyan
Write-Host "   .\distribute-apk.ps1 -Version 'X.X.X' -ReleaseNotes 'Descripción'" -ForegroundColor White
Write-Host ""
Write-Host "RAZÓN: Compilación local (no EAS Build) = No OTA" -ForegroundColor Yellow
Write-Host "VENTAJA: Sin colas de 30+ minutos, compilación en 2-5 min" -ForegroundColor Green
Write-Host ""
