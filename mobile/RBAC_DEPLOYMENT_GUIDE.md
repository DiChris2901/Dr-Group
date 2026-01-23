# 🚀 DEPLOYMENT RÁPIDO - SISTEMA RBAC

## ⚡ PASOS PARA DESPLEGAR (10 minutos)

### **1️⃣ Migración de Datos (UNA VEZ)**

```bash
# Abrir script de migración en navegador:
http://localhost:5173/migrate-permissions-app.html

# Clic en "🚀 Ejecutar Migración"
# Esperar mensaje: "✅ Migración completada exitosamente"
```

**Resultado esperado:**
- ✅ Colección `PermissionsApp` creada con documentos para cada usuario
- ✅ Campo `appRole` agregado a todos los usuarios en `users/{uid}`
- ✅ daruedagu@gmail.com → SUPERADMIN (35 permisos)
- ✅ Usuarios ADMIN → ADMIN en app (18 permisos)
- ✅ Usuarios EMPLEADO → USER en app (9 permisos)

---

### **2️⃣ Desplegar Reglas de Firestore**

```bash
# Desde la raíz del proyecto (Dr-Group/)
firebase deploy --only firestore:rules

# Verificar mensaje: "✔ Deploy complete!"
```

**Reglas actualizadas:**
```javascript
match /PermissionsApp/{uid} {
  allow read: if request.auth.uid == uid;
  allow write: if get(...).data.appRole == 'SUPERADMIN';
}
```

---

### **3️⃣ Verificar en Firebase Console**

1. **Ir a:** https://console.firebase.google.com
2. **Seleccionar proyecto:** dr-group-cd21b
3. **Firestore Database:**
   - ✅ Verificar colección `PermissionsApp/` existe
   - ✅ Verificar usuarios tienen campo `appRole`

**Ejemplo de documento:**
```javascript
PermissionsApp/Pyygp3fXZmh... (daruedagu@gmail.com)
{
  uid: "Pyygp3fXZmh...",
  permissions: [35 permisos],  // Array completo
  updatedAt: Timestamp,
  updatedBy: "migration-script"
}

users/Pyygp3fXZmh...
{
  role: "ADMIN",           // Dashboard web (NO tocado)
  appRole: "SUPERADMIN",   // App móvil (NUEVO)
  name: "Diego Rueda",
  email: "daruedagu@gmail.com"
}
```

---

### **4️⃣ Probar en la App Móvil**

```bash
# Terminal en Dr-Group/mobile
Set-Location mobile; npx expo start --clear

# Escanear QR con Expo Go
```

**Pruebas a realizar:**

#### **A. Login como SUPERADMIN**
```
Email: daruedagu@gmail.com
Password: [tu contraseña]

✅ Verificar que aparece tab "Usuarios" en bottom navigation
✅ Tap en tab "Usuarios"
✅ Debe mostrar lista de usuarios con sus roles
```

#### **B. Gestionar Permisos**
```
1. Tap en un usuario de la lista
2. Modal de edición se abre
3. Expandir categorías (10 categorías)
4. Activar/desactivar switches de permisos
5. Tap en "Guardar"
6. Verificar mensaje: "✅ Permisos Actualizados"
7. Verificar que el contador de permisos cambió (ej: 18/35 → 22/35)
```

#### **C. Auto-upgrade/downgrade**
```
Test 1 - Upgrade a SUPERADMIN:
- Seleccionar todos los permisos (35/35)
- Guardar
- Verificar que el chip del usuario cambió a "SUPERADMIN"

Test 2 - Downgrade a USER:
- Deseleccionar casi todos (dejar solo 5 permisos)
- Guardar
- Verificar que el chip cambió a "USER"

Test 3 - ADMIN normal:
- Seleccionar 15 permisos
- Guardar
- Verificar que el chip muestra "ADMIN"
```

#### **D. Verificar en SettingsScreen**
```
1. Ir a Settings (perfil)
2. Scroll hasta sección "PERMISOS"
3. Verificar:
   ✅ Muestra rol actual (SUPERADMIN/ADMIN/USER)
   ✅ Muestra contador de permisos (ej: 35/35)
   ✅ Solo SUPERADMIN ve botón "Gestionar Usuarios"
```

---

### **5️⃣ Login como Usuario Normal (Validar Restricciones)**

```bash
# Cerrar sesión
# Login con email de EMPLEADO (no admin)

✅ Verificar que NO aparece tab "Usuarios"
✅ Ir a Settings → NO debe ver botón "Gestionar Usuarios"
✅ Intentar navegar manualmente → Debe mostrar "🔒 Acceso Denegado"
```

---

## 🔍 TROUBLESHOOTING

### **❌ Error: "No aparece tab Usuarios"**
**Solución:**
1. Verificar que estás logueado como SUPERADMIN (daruedagu@gmail.com)
2. Verificar en Firebase Console que `users/{uid}.appRole === 'SUPERADMIN'`
3. Verificar en Firebase Console que `PermissionsApp/{uid}.permissions.length === 35`
4. Reiniciar app (cerrar y abrir Expo Go)

### **❌ Error: "Cannot read property 'appRole'"**
**Solución:**
1. Ejecutar migración nuevamente (migrate-permissions-app.html)
2. Verificar que todos los usuarios tienen campo `appRole`
3. Cerrar sesión y volver a iniciar

### **❌ Error: "Permission denied" al guardar permisos**
**Solución:**
1. Verificar que desplegaste las reglas de Firestore: `firebase deploy --only firestore:rules`
2. Verificar en Firebase Console → Firestore → Rules que existe match para `PermissionsApp/{uid}`
3. Verificar que estás logueado como SUPERADMIN

### **❌ Error: "Modal no se cierra al guardar"**
**Solución:**
1. Verificar en consola si hay errores de Firestore
2. Verificar conexión a internet
3. Verificar que el usuario tiene `appRole` en Firestore

---

## ✅ CHECKLIST FINAL

- [ ] ✅ Migración ejecutada sin errores
- [ ] ✅ Firebase rules desplegadas
- [ ] ✅ Tab "Usuarios" visible para SUPERADMIN
- [ ] ✅ Modal de edición funciona correctamente
- [ ] ✅ Auto-upgrade a SUPERADMIN (35 permisos)
- [ ] ✅ Auto-downgrade a USER (≤7 permisos)
- [ ] ✅ SettingsScreen muestra información de permisos
- [ ] ✅ Usuarios normales NO ven tab "Usuarios"
- [ ] ✅ Real-time sync funciona (cambios instantáneos)
- [ ] ✅ Sin errores en consola de Expo

---

## 📊 ESTADÍSTICAS POST-DEPLOYMENT

**Usuarios esperados:**
- 1 SUPERADMIN (daruedagu@gmail.com)
- X ADMIN (usuarios con role: 'ADMIN')
- Y USER (usuarios con role: 'EMPLEADO')

**Total permisos en sistema:** 35
**Colecciones agregadas:** 1 (PermissionsApp)
**Campos agregados:** 1 (appRole en users)

---

## 🎯 SIGUIENTE PASO OPCIONAL

### **Sincronización con Dashboard Web (Futuro)**

Para implementar gestión de permisos desde el dashboard web:

1. Crear página en `src/pages/UserManagementPage.jsx`
2. Leer/escribir a `PermissionsApp/{uid}` desde web
3. Usar mismo listener `onSnapshot` para sincronización real-time
4. Implementar mismo modal de edición de permisos
5. Mismas reglas de auto-upgrade/downgrade

**Ventaja:** Gestión unificada desde web o móvil, cambios se reflejan en ambos instantáneamente.

---

## 📞 SOPORTE

**Documentación completa:** `mobile/RBAC_SYSTEM_GUIDE.md` (200+ líneas)  
**Resumen técnico:** `mobile/RBAC_IMPLEMENTATION_SUMMARY.md`  
**Ejemplos de código:** `mobile/src/examples/PermissionsExamples.js`  

**Tiempo estimado de deployment:** 10 minutos  
**Complejidad:** ⭐⭐⭐ (Media)

---

**🎉 ¡Listo para producción!**
