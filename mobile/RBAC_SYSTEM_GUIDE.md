# 🔐 Sistema de Permisos Granulares (RBAC) - App Móvil

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Estado:** ✅ Implementado

---

## 📋 Resumen Ejecutivo

Sistema de **Control de Acceso Basado en Roles (RBAC)** implementado para la app móvil de DR Group. Permite gestión granular de permisos independiente del dashboard web, con 35 permisos distribuidos en 10 categorías.

---

## 🏗️ Arquitectura

### **1. Estructura de Datos**

#### **Colección: `PermissionsApp/{uid}`**
```javascript
{
  uid: string,               // UID del usuario (coincide con users/{uid})
  permissions: string[],     // Array de 1-35 permisos activos
  updatedAt: Timestamp,      // Última actualización
  updatedBy: string          // UID del SUPERADMIN que editó
}
```

#### **Campo Nuevo en `users/{uid}`**
```javascript
{
  role: 'ADMIN',             // ← Dashboard Web (NO TOCAR)
  appRole: 'USER',           // ← App Móvil (NUEVO - independiente)
  name: 'Diego Rueda',
  email: 'daruedagu@gmail.com',
  // ... otros campos existentes
}
```

**IMPORTANTE:** El campo `role` del dashboard web **NO se modifica**. El sistema RBAC usa `appRole` exclusivamente.

---

## 🎭 Roles y Permisos

### **Roles de la App Móvil**

| Rol | Permisos | Descripción | Cálculo |
|-----|----------|-------------|---------|
| **USER** | 1-7 | Usuario básico (empleado) | `permCount <= 7` |
| **ADMIN** | 8-34 | Administrador con permisos personalizados | `8 <= permCount <= 34` |
| **SUPERADMIN** | 35 | Acceso total + gestión de permisos | `permCount === 35` |

**Auto-upgrade/downgrade:** Al editar permisos, `appRole` se actualiza automáticamente según la cantidad.

---

### **📦 35 Permisos Disponibles (10 Categorías)**

#### **1. Dashboard (3 permisos)**
- `dashboard.view` - Ver dashboard
- `dashboard.stats` - Ver estadísticas
- `dashboard.charts` - Ver gráficos

#### **2. Asistencias (5 permisos)**
- `asistencias.view` - Ver historial
- `asistencias.registro` - Registrar entrada/salida
- `asistencias.break` - Tomar breaks
- `asistencias.almuerzo` - Registrar almuerzo
- `asistencias.export` - Exportar Excel

#### **3. Reportes (4 permisos)**
- `reportes.view` - Ver reportes
- `reportes.stats` - Ver estadísticas avanzadas
- `reportes.charts` - Ver gráficos
- `reportes.export` - Exportar reportes

#### **4. Calendario (3 permisos)**
- `calendario.view` - Ver calendario
- `calendario.eventos` - Crear/editar eventos
- `calendario.festivos` - Gestionar festivos

#### **5. Novedades (4 permisos)**
- `novedades.view` - Ver novedades
- `novedades.create` - Crear novedades
- `novedades.edit` - Editar novedades
- `novedades.delete` - Eliminar novedades

#### **6. Usuarios (4 permisos)**
- `usuarios.view` - Ver lista de usuarios
- `usuarios.permissions` - **🔑 CRÍTICO: Gestionar permisos (solo SUPERADMIN)**
- `usuarios.create` - Crear usuarios
- `usuarios.edit` - Editar usuarios

#### **7. Configuración (3 permisos)**
- `config.view` - Ver configuración
- `config.theme` - Personalizar tema
- `config.app` - Configuración avanzada

#### **8. Perfil (3 permisos)**
- `perfil.view` - Ver perfil
- `perfil.edit` - Editar perfil
- `perfil.photo` - Cambiar foto

#### **9. Notificaciones (3 permisos)**
- `notificaciones.view` - Ver notificaciones
- `notificaciones.manage` - Gestionar preferencias
- `notificaciones.send` - Enviar notificaciones

#### **10. Avanzado (3 permisos)**
- `storage.view` - Ver almacenamiento
- `logs.view` - Ver logs del sistema
- `admin.tools` - Herramientas de administrador

---

## 🎯 Permisos por Defecto

### **USER (9 permisos básicos)**
```javascript
[
  'dashboard.view',
  'asistencias.view',
  'asistencias.registro',
  'asistencias.break',
  'asistencias.almuerzo',
  'calendario.view',
  'perfil.view',
  'perfil.edit',
  'perfil.photo',
]
```

### **ADMIN (18 permisos por defecto)**
```javascript
[
  ...USER_PERMISSIONS, // 9 permisos base
  'dashboard.stats',
  'dashboard.charts',
  'asistencias.export',
  'reportes.view',
  'reportes.stats',
  'reportes.charts',
  'calendario.eventos',
  'novedades.view',
  'config.view',
]
```

### **SUPERADMIN (35 permisos - todos)**
Acceso completo a todas las funcionalidades de la app, incluyendo gestión de permisos de otros usuarios.

---

## 🛠️ Implementación Técnica

### **Archivos Creados**

```
mobile/src/
├── constants/
│   └── permissions.js              # 35 permisos + configuración
├── hooks/
│   └── usePermissions.js           # Hook de permisos (listener real-time)
├── components/
│   └── ProtectedButton.js          # Componente protegido por permisos
├── screens/
│   └── admin/
│       └── UsersScreen.js          # Pantalla de gestión de usuarios
└── navigation/
    ├── AppNavigator.js             # Ruta Users agregada
    └── BottomTabNavigator.js       # Tab Usuarios (solo SUPERADMIN)
```

### **Script de Migración**

```
public/migrate-permissions-app.html
```

**Ejecutar UNA VEZ antes del deploy:** Inicializa `PermissionsApp` y agrega `appRole` a usuarios existentes.

---

## 📖 Uso del Hook `usePermissions`

### **Importación**
```javascript
import { usePermissions } from '../hooks/usePermissions';
```

### **Ejemplo Básico**
```javascript
const { can, isSuperAdmin, permissions } = usePermissions();

// Verificar permiso único
if (can('asistencias.export')) {
  // Mostrar botón de exportar
}

// Verificar rol
if (isSuperAdmin) {
  // Acciones exclusivas de SUPERADMIN
}

// Obtener permisos activos
console.log('Permisos:', permissions); // ['dashboard.view', 'asistencias.view', ...]
```

### **Helpers Disponibles**

```javascript
const {
  // Datos
  permissions,          // Array de permisos activos
  appRole,             // 'SUPERADMIN' | 'ADMIN' | 'USER'
  loading,             // Estado de carga
  
  // Roles
  isSuperAdmin,        // true si SUPERADMIN
  isAdmin,             // true si ADMIN o SUPERADMIN
  isUser,              // true si USER
  
  // Verificación
  can,                 // can('asistencias.view')
  canAll,              // canAll(['asistencias.view', 'reportes.view'])
  canAny,              // canAny(['asistencias.view', 'reportes.view'])
  cannot,              // cannot('usuarios.permissions')
  
  // Estadísticas
  permissionCount,     // Número de permisos activos
  permissionPercentage, // Porcentaje de permisos (0-100)
  hasPermissions,      // true si tiene al menos 1 permiso
} = usePermissions();
```

---

## 🔒 Uso de `ProtectedButton`

### **Ejemplo 1: Ocultar botón si no tiene permiso**
```javascript
<ProtectedButton
  permission="asistencias.export"
  hideIfDenied={true}
  mode="contained"
  onPress={exportarExcel}
>
  Exportar Excel
</ProtectedButton>
```

### **Ejemplo 2: Deshabilitar botón si no tiene permiso**
```javascript
<ProtectedButton
  permission="novedades.create"
  mode="outlined"
  onPress={crearNovedad}
>
  Crear Novedad
</ProtectedButton>
```

### **Ejemplo 3: Solo SUPERADMIN**
```javascript
<ProtectedButton
  requireSuperAdmin={true}
  hideIfDenied={true}
  icon="account-group"
  onPress={() => navigation.navigate('Users')}
>
  Gestionar Usuarios
</ProtectedButton>
```

### **Ejemplo 4: Cualquiera de estos permisos (OR)**
```javascript
<ProtectedButton
  anyPermissions={['reportes.view', 'reportes.stats']}
  mode="contained"
  onPress={verReportes}
>
  Ver Reportes
</ProtectedButton>
```

### **Ejemplo 5: Todos estos permisos (AND)**
```javascript
<ProtectedButton
  allPermissions={['novedades.create', 'novedades.edit']}
  mode="contained"
  onPress={administrarNovedades}
>
  Administrar Novedades
</ProtectedButton>
```

---

## 🚀 Flujo de Uso

### **1. Migración Inicial (UNA VEZ)**

```bash
# Abrir en navegador:
http://localhost:5173/migrate-permissions-app.html

# 1. Clic en "Ejecutar Migración"
# 2. Esperar a que finalice (crea PermissionsApp + agrega appRole)
# 3. Verificar en Firebase Console
```

### **2. Gestión de Permisos (SUPERADMIN)**

#### **Desde la App Móvil:**
1. Login como SUPERADMIN (daruedagu@gmail.com)
2. Ir al tab **"Usuarios"** (bottom navigation)
3. Buscar usuario
4. Tap en el usuario → Modal de edición
5. Expandir categorías y activar/desactivar permisos
6. Guardar cambios

**Auto-upgrade/downgrade:**
- Si seleccionas 35 permisos → Usuario se convierte en SUPERADMIN
- Si seleccionas 8-34 permisos → Usuario se convierte en ADMIN
- Si seleccionas ≤7 permisos → Usuario se convierte en USER

### **3. Verificación de Permisos en Código**

```javascript
// En cualquier componente:
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { can, isSuperAdmin } = usePermissions();

  return (
    <View>
      {can('asistencias.export') && (
        <Button onPress={exportar}>Exportar</Button>
      )}
      
      {isSuperAdmin && (
        <Button onPress={administrar}>Panel Admin</Button>
      )}
    </View>
  );
}
```

---

## 🔐 Reglas de Seguridad (Firestore)

**Agregar a `firestore.rules`:**

```javascript
// PermissionsApp: Solo lectura para el propio usuario, escritura solo para SUPERADMIN
match /PermissionsApp/{uid} {
  // Lectura: Solo el propio usuario
  allow read: if request.auth != null && request.auth.uid == uid;
  
  // Escritura: Solo SUPERADMIN (usuarios con appRole === 'SUPERADMIN')
  allow write: if request.auth != null && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.appRole == 'SUPERADMIN';
}
```

---

## 📊 Monitoreo y Auditoría

### **Tracking de Cambios**

Cada vez que se editan permisos, se registra en `PermissionsApp/{uid}`:

```javascript
{
  uid: 'abc123',
  permissions: [...],
  updatedAt: Timestamp,      // Fecha del cambio
  updatedBy: 'xyz789'        // UID del SUPERADMIN que lo editó
}
```

### **Logs Recomendados (Futuro)**

Implementar colección `audit_logs` para registrar:
- Cambios de permisos (quién, cuándo, qué cambió)
- Intentos de acceso denegado
- Upgrades/downgrades de roles

---

## ❓ FAQ

### **¿Puedo tener SUPERADMIN en app pero USER en dashboard web?**
✅ **Sí.** Los roles son completamente independientes:
- `users/{uid}.role` → Dashboard Web
- `users/{uid}.appRole` → App Móvil

### **¿Qué pasa si elimino el documento de PermissionsApp/{uid}?**
El hook `usePermissions` asignará permisos vacíos `[]` por defecto (equivalente a USER sin permisos).

### **¿Puedo editar mis propios permisos?**
❌ **No.** Solo SUPERADMIN puede editar permisos de cualquier usuario (incluyendo otros SUPERADMIN).

### **¿Cómo agrego un permiso nuevo?**
1. Agregar a `mobile/src/constants/permissions.js` (APP_PERMISSIONS)
2. Agregar a la categoría correspondiente (PERMISSION_CATEGORIES)
3. Actualizar `SUPERADMIN_PERMISSIONS` (debe ser 36 total ahora)
4. Actualizar `calculateAppRole` si cambia la lógica de roles

### **¿Cómo sincronizo permisos con el dashboard web?**
Actualmente **no hay sincronización automática**. Para implementarla:
1. Agregar listener en dashboard web a `PermissionsApp/{uid}`
2. Crear pantalla de gestión de permisos en `localhost:5173/users`
3. Leer/escribir desde ambas plataformas a la misma colección

---

## 🎯 Roadmap Futuro

- [ ] Sincronización bidireccional con dashboard web
- [ ] Logs de auditoría detallados
- [ ] Notificaciones cuando cambien permisos
- [ ] Permisos temporales (expiración automática)
- [ ] Grupos de permisos (presets personalizados)
- [ ] Exportación de configuración de permisos
- [ ] Historial de cambios de permisos por usuario

---

## 📞 Soporte

**Desarrollador:** Copilot AI + Diego Rueda  
**Versión:** 1.0.0  
**Última actualización:** Enero 2026

Para problemas o preguntas, revisar este README primero. Si el problema persiste, verificar logs en Firebase Console y revisar implementación del hook `usePermissions`.

---

**🎉 Sistema RBAC implementado exitosamente. Disfruta de la gestión granular de permisos!**
