# 📱 DISTRIBUCIÓN DE APK - FIREBASE APP DISTRIBUTION

Sistema de distribución profesional para DR Group Asistencia Mobile usando Firebase App Distribution.

---

## 🎯 FLUJO COMPLETO DE DEPLOYMENT

### **1. DESARROLLO (Día a día)**
```powershell
cd mobile
npx expo start
# Escanear QR con Expo Go → Cambios en vivo
```

### **2. COMPILAR APK (Android Studio)**

#### **Paso 1: Incrementar versión**
```powershell
cd mobile\android\app
.\increment-version.ps1

# Selecciona tipo de actualización:
# [1] PATCH - Correcciones de bugs (3.0.0 → 3.0.1)
# [2] MINOR - Nuevas características (3.0.0 → 3.1.0)
# [3] MAJOR - Cambios importantes (3.0.0 → 4.0.0)
```

#### **Paso 2: Compilar en Android Studio**
1. Abrir proyecto en Android Studio
2. `Build > Generate Signed Bundle/APK`
3. Seleccionar **APK**
4. Seleccionar **release**
5. Firmar con keystore
6. Esperar compilación (~2-5 minutos)

**APK generado en:**
```
mobile\android\app\build\outputs\apk\release\app-release.apk
```

### **3. DISTRIBUIR A USUARIOS (App Distribution)**

#### **Opción A: Script automático (Recomendado)** ⭐
```powershell
cd mobile
.\distribute-apk.ps1

# El script:
# - Detecta versión automáticamente
# - Pide notas de release
# - Sube APK a Firebase
# - Notifica a todos los usuarios
```

#### **Opción B: Script con parámetros**
```powershell
cd mobile
.\distribute-apk.ps1 -Version "3.1.0" -ReleaseNotes "Nueva funcionalidad: Reportes de asistencia"
```

#### **Opción C: Comando manual**
```powershell
cd mobile\android\app\build\outputs\apk\release

firebase appdistribution:distribute app-release.apk `
  --app "1:526970184316:android:4e55364c1a1794daf41ff9" `
  --release-notes "Versión 3.1.0: Descripción de cambios"
```

---

## 👥 GESTIÓN DE USUARIOS (Testers)

### **Agregar usuarios manualmente:**

1. Firebase Console → App Distribution
2. Tab "Vínculos de invitación"
3. Click "Invitar verificadores"
4. Agregar emails:
   ```
   daruedagu@gmail.com
   usuario2@drgroup.com
   contador@drgroup.com
   ```
5. Los usuarios reciben email con link de descarga

### **Crear grupos (Opcional):**

```powershell
# Crear grupo de administradores
firebase appdistribution:testers:add --group "admins" --emails "daruedagu@gmail.com,admin2@drgroup.com"

# Crear grupo de contadores
firebase appdistribution:testers:add --group "contadores" --emails "contador1@drgroup.com,contador2@drgroup.com"

# Distribuir solo a un grupo específico
firebase appdistribution:distribute app-release.apk `
  --app "1:526970184316:android:4e55364c1a1794daf41ff9" `
  --groups "admins" `
  --release-notes "Versión beta solo para admins"
```

---

## 📊 MONITOREO Y CONTROL

### **Ver dashboard de distribución:**
```
https://console.firebase.google.com/project/dr-group-cd21b/appdistribution
```

**Dashboard muestra:**
- ✅ Versiones disponibles
- ✅ Quién descargó cada versión
- ✅ Cuántos usuarios activos
- ✅ Historial de releases

---

## 🔄 ACTUALIZAR LA APP (Para usuarios finales)

### **Primera instalación:**
1. Usuario recibe email de invitación
2. Click en "Aceptar invitación"
3. Login con cuenta Google
4. Click en "Descargar"
5. Aceptar "Fuentes desconocidas" (Android)
6. Instalar APK

### **Actualizaciones posteriores:**
1. Usuario recibe email automático: "Nueva versión disponible"
2. Click en link del email
3. Click en "Descargar nueva versión"
4. Android pregunta si quiere actualizar
5. Click en "Actualizar"

---

## ⚠️ LIMITACIONES Y NOTAS

### **NO es Google Play Store:**
- Solo para usuarios invitados (hasta 200 gratis)
- No es distribución pública
- Perfecto para equipos internos

### **"Fuentes desconocidas" siempre:**
- Android pide activar instalación de apps desconocidas
- Esto NO se puede evitar sin subir a Play Store
- Es normal, no es un problema

### **Sin OTA Updates:**
- Esta APK NO soporta `eas update` (OTA)
- Todas las actualizaciones requieren instalar APK completo
- Razón: Compilamos local en Android Studio (no EAS Build)

---

## 🛠️ TROUBLESHOOTING

### **Error: "Firebase CLI not authenticated"**
```powershell
firebase login
```

### **Error: "You don't have permissions"**
- Verifica que tu cuenta tenga rol "Editor" o "Owner" en Firebase
- Ir a: Firebase Console → Project Settings → Users and permissions

### **APK no encontrado:**
- Verifica que compilaste en Android Studio
- Ubicación correcta: `mobile\android\app\build\outputs\apk\release\app-release.apk`

### **Usuarios no reciben email:**
- Verificar que el email esté agregado en App Distribution
- Revisar carpeta de spam
- Verificar que aceptaron la invitación inicial

---

## 📋 COMPARACIÓN: MANUAL vs. APP DISTRIBUTION

| Aspecto | Manual (Anterior) | App Distribution (Actual) |
|---------|-------------------|---------------------------|
| **Distribución** | WhatsApp/Drive | Link automático |
| **Notificaciones** | Manual | Automáticas |
| **Control** | No sabes quién tiene qué | Dashboard completo |
| **Tiempo** | 10-15 min | 2 min |
| **Profesional** | ❌ | ✅ |

---

## 🎯 FLUJO RECOMENDADO COMPLETO

```powershell
# 1. Incrementar versión
cd mobile\android\app
.\increment-version.ps1

# 2. Compilar en Android Studio
# (Build > Generate Signed Bundle/APK > APK > Release)

# 3. Distribuir automáticamente
cd ..\..
.\distribute-apk.ps1

# ✅ LISTO - Usuarios notificados automáticamente
```

---

## 📞 CONTACTO Y SOPORTE

- **Dashboard:** https://console.firebase.google.com/project/dr-group-cd21b/appdistribution
- **Documentación:** https://firebase.google.com/docs/app-distribution
- **App ID:** `1:526970184316:android:4e55364c1a1794daf41ff9`
