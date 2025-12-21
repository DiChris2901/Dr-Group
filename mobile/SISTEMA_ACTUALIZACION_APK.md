# 🔄 Sistema de Actualización Automática de APKs desde EAS Build

## ✅ Implementación Completa

El sistema ahora verifica **AMBOS** tipos de actualizaciones al iniciar la app:
1. **OTA (Over-The-Air)**: Actualizaciones de código JS instantáneas (Expo Updates)
2. **APK Completo**: Nuevas versiones compiladas en **EAS Build**

---

## 🎯 Flujo de Actualización

### Al iniciar la app:
1. Verifica actualizaciones OTA (Expo Updates)
2. **Consulta API de EAS Build** por último APK de producción
3. Compara versión actual vs versión del último build
4. Si encuentra nueva versión:
   - Muestra alerta al usuario
   - **Descarga APK directamente desde EAS Build**
   - Solicita al usuario instalarla
   - Abre instalador de Android

---

## 🏗️ ¿Cómo funciona?

### Expo Go vs EAS Build:

- **Expo Go**: App de desarrollo (solo para testing con código JS)
- **EAS Build**: Servicio de compilación que genera APKs nativos completos
- **EAS Updates**: Servicio OTA para actualizaciones JS

Cuando ejecutas:
```powershell
Set-Location mobile; eas build --platform android --profile production
```

EAS Build:
1. Compila tu app en la nube
2. Genera el APK firmado
3. **Lo hospeda en sus servidores**
4. Te da un link de descarga

**Tu app consulta directamente EAS Build** para obtener el último APK disponible.

---

## 📦 Publicar Nueva Versión APK

### Método 1: Script Automático (Recomendado) ⚡

```powershell
# Paso 1: Ir al directorio mobile
Set-Location mobile

# Paso 2: Ejecutar script de versionado automático
.\auto-version.ps1

# El script:
# - Consulta última versión en EAS Build (ej: 1.0.0)
# - Incrementa automáticamente (1.0.0 → 1.1.0)
# - Actualiza app.json
# - Te pregunta si deseas continuar

# Paso 3: Compilar con nueva versión
eas build --platform android --profile production
```

### Método 2: Manual (Alternativo) 🔧

```powershell
# Paso 1: Verificar última versión
# Ir a: https://expo.dev/accounts/[tu-cuenta]/projects/drgroup-mobile/builds
# Ver última versión compilada (ej: 1.0.0)

# Paso 2: Editar app.json manualmente
# Cambiar: "version": "1.0.0" → "1.1.0"

# Paso 3: Compilar
Set-Location mobile
eas build --platform android --profile production
```

---

## 🎯 Flujo Completo Recomendado

```powershell
# 1. Hacer cambios en el código de la app
# 2. Probar localmente
npx expo start

# 3. Cuando estés listo para compilar:
Set-Location mobile
.\auto-version.ps1

# 4. Confirmar versionado y compilar
eas build --platform android --profile production

# 5. Esperar compilación (~10-15 min)

# 6. ¡Listo! Los usuarios recibirán notificación automática
```

---

## 🔐 API de EAS Build

La app consulta:
```
https://api.expo.dev/v2/projects/169f6749-ebbd-4386-9359-b60f7afe299d/builds
?platform=android
&status=finished
&limit=1
```

Respuesta:
```json
[
  {
    "appVersion": "1.1.0",
    "channel": "production",
    "artifacts": {
      "buildUrl": "https://expo.dev/artifacts/eas/[...].apk"
    },
    "createdAt": "2025-12-20T...",
    "status": "finished"
  }
]
```

---

## 🚀 Ventajas de esta Solución

### ✅ Automático
- No necesitas subir APK manualmente a otro servidor
- EAS Build ya lo hospeda

### ✅ Seguro
- URLs de EAS son seguras y temporales
- Solo tu app puede acceder a builds de producción

### ✅ Simple
- Compilas con `eas build`
- Los usuarios automáticamente reciben notificación

### ✅ Sin Firestore
- No necesita configurar documentos en Firestore
- La API de EAS es la fuente de verdad

---

## 📝 Ejemplo de Uso Real

```
1. Diego compila nueva versión:
   Set-Location mobile
   # Edita app.json → version: "1.1.0"
   eas build --platform android --profile production
   
2. EAS Build genera APK y lo hospeda

3. María abre la app (tiene v1.0.0 instalada)
   App: ✅ Verifica OTA → No hay actualizaciones
   App: 🔍 Consulta EAS Build API
   App: 🚀 Encuentra v1.1.0 en producción
   
4. María recibe alerta:
   "🚀 Nueva Versión Disponible
   Versión 1.1.0 disponible.
   ¿Deseas descargarla ahora?"
   
   [Más tarde]  [Descargar]

5. María presiona "Descargar"
   App: 📥 Descarga desde EAS (15 MB)
   App: ✅ "Descarga Completa. ¿Instalar?"
   
6. María presiona "Instalar"
   App: 📱 Abre instalador de Android
   
7. María confirma instalación
   App: ✨ Actualizada a v1.1.0
```

---

## 🔐 Permisos Agregados

```json
// mobile/app.json
"permissions": [
  "REQUEST_INSTALL_PACKAGES",  // ⬅️ Instalar APKs
  "INTERNET",                  // ⬅️ Descargar APK
  "WRITE_EXTERNAL_STORAGE"     // ⬅️ Guardar APK temporalmente
]
```

---

## 🚀 Ventajas del Sistema

### OTA (Actualizaciones Rápidas)
- ⚡ Instantánea (1-2 min)
- 📱 Sin descarga de APK
- 🔄 Rollback inmediato
- 💾 Solo cambios de código

### APK (Actualizaciones Completas)
- 🏗️ Cambios nativos (permisos, plugins)
- 📦 Una sola instalación
- 🔔 Notificación automática
- 📥 Descarga inteligente en segundo plano

---

## 📋 Ejemplo de Uso Real

```
Usuario: Diego abre la app
Sistema: ✅ Verifica OTA → No hay actualizaciones
Sistema: ✅ Consulta Firestore
Sistema: 🚀 Encuentra versión 1.1.0 (actual: 1.0.0)
Sistema: 📣 Muestra alerta:

   "🚀 Nueva Versión Disponible
   
   Versión 1.1.0 disponible.
   
   ✨ Nuevas funcionalidades:
   - Fix ubicación de salida
   - Mejoras de rendimiento
   
   ¿Deseas descargarla ahora?"
   
   [Más tarde]  [Descargar]

Usuario: Presiona "Descargar"
Sistema: 📥 Descarga APK (15 MB)
Sistema: ✅ "Descarga Completa. ¿Deseas instalarla ahora?"
Usuario: Presiona "Instalar"
Sistema: 📱 Abre instalador de Android
Usuario: Confirma instalación
Sistema: ✨ App actualizada a v1.1.0
```

---

## 🛠️ Mantenimiento

### Ver versión actual de usuarios
```javascript
// Dashboard web - Firestore Console
// Colección: users
// Campo: appVersion (se actualiza automáticamente al abrir la app)
```

### Forzar actualización obligatoria
```javascript
// Firestore → appVersions → android
{
  "forceUpdate": true,  // ⬅️ Usuario DEBE actualizar
  "minVersion": "1.1.0" // Versión mínima requerida
}
```

### Rollback si hay problemas
```javascript
// Firestore → appVersions → android
{
  "latestVersion": "1.0.0",  // ⬅️ Volver a versión anterior
  "downloadUrl": "[URL de v1.0.0]"
}
```

---

## 🚨 Troubleshooting

### "Error descargando APK"
- ✅ Verificar que URL sea accesible públicamente
- ✅ URL debe ser descarga directa (no página de descarga)
- ✅ Verificar permisos de internet en app.json

### "No se pudo abrir el instalador"
- ✅ Android 8+ requiere permiso REQUEST_INSTALL_PACKAGES
- ✅ Verificar que APK esté firmado correctamente
- ✅ Probar instalación manual desde Descargas

### "App no detecta nueva versión"
- ✅ Verificar documento en Firestore: appVersions/android
- ✅ Verificar campo latestVersion
- ✅ Forzar cierre y reabrir la app
- ✅ Verificar logs de consola

---

## 📱 Prueba del Sistema

```powershell
# 1. Compilar versión 1.0.0
Set-Location mobile
eas build --platform android --profile production

# 2. Instalar en dispositivo de prueba

# 3. Actualizar app.json → version: "1.1.0"

# 4. Compilar versión 1.1.0

# 5. Subir APK a servidor

# 6. Actualizar Firestore con v1.1.0

# 7. Abrir app en dispositivo → Debe mostrar alerta de actualización
```

---

## ✅ Checklist Pre-Publicación

- [ ] APK compilado y probado
- [ ] APK subido a servidor público
- [ ] URL de descarga directa verificada
- [ ] Firestore actualizado con nueva versión
- [ ] Release notes descriptivas
- [ ] Versión incrementada en app.json
- [ ] Probado en dispositivo real
- [ ] Permisos de instalación funcionando

---

**NOTA IMPORTANTE:** Este sistema requiere que compiles un APK completo con los cambios actuales (permisos nuevos) para que funcione correctamente. La próxima actualización OTA ya tendrá este sistema integrado.
