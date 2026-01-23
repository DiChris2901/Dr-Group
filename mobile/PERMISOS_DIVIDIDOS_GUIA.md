# 🔀 GUÍA DE IMPLEMENTACIÓN: PERMISOS DIVIDIDOS

## 🎯 CONCEPTO CRÍTICO

**EL ROL NO CONTROLA EL ACCESO - EL PERMISO SÍ**

- **ROL** → Etiqueta visual (USER/ADMIN/SUPERADMIN) - Solo identificación
- **PERMISO** → Control real de acceso (lo que determina qué puede ver/hacer)

**Ejemplo:**
- Un usuario con ROL "USER" puede tener permiso `reportes.todos` si se lo asignas manualmente
- Un usuario con ROL "ADMIN" podría solo tener `asistencias.propias` si decides restringirlo

---

## 📱 PÁGINAS CON PERMISOS DIVIDIDOS

### 1. **AsistenciasScreen** (Ver registros de asistencia)

**Permiso:** `asistencias.propias` vs `asistencias.todos`

**Lógica esperada:**

```javascript
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';

export default function AsistenciasScreen() {
  const { can } = usePermissions();
  
  // ✅ CORRECTO: Verificar permisos, NO roles
  const puedeVerTodos = can(APP_PERMISSIONS.ASISTENCIAS_TODOS);
  const puedeVerPropias = can(APP_PERMISSIONS.ASISTENCIAS_PROPIAS);
  
  // Si no tiene ninguno de los dos permisos, denegar acceso
  if (!puedeVerTodos && !puedeVerPropias) {
    return <AccessDenied />;
  }
  
  // Cargar datos según permiso
  const cargarAsistencias = async () => {
    if (puedeVerTodos) {
      // Cargar asistencias de TODOS los usuarios
      const q = query(collection(db, 'asistencias'));
      const querySnapshot = await getDocs(q);
      // ...procesar
    } else {
      // Cargar SOLO asistencias del usuario actual
      const q = query(
        collection(db, 'asistencias'),
        where('uid', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      // ...procesar
    }
  };
  
  return (
    <View>
      {puedeVerTodos && (
        <Text>Viendo asistencias de TODOS los usuarios</Text>
      )}
      {!puedeVerTodos && puedeVerPropias && (
        <Text>Viendo solo TUS asistencias</Text>
      )}
      {/* Renderizar lista de asistencias */}
    </View>
  );
}
```

---

### 2. **NovedadesScreen** (Reportar incidentes)

**Permiso:** `novedades.reportar` vs `novedades.gestionar`

**Lógica esperada:**

```javascript
export default function NovedadesScreen() {
  const { can } = usePermissions();
  
  const puedeGestionar = can(APP_PERMISSIONS.NOVEDADES_GESTIONAR);
  const puedeReportar = can(APP_PERMISSIONS.NOVEDADES_REPORTAR);
  
  // Si no tiene ninguno de los dos permisos, denegar acceso
  if (!puedeGestionar && !puedeReportar) {
    return <AccessDenied />;
  }
  
  const cargarNovedades = async () => {
    if (puedeGestionar) {
      // Cargar TODAS las novedades (de todos los usuarios)
      // Mostrar acciones: aprobar, rechazar, comentar
      const q = query(collection(db, 'novedades'));
      // ...
    } else {
      // Cargar SOLO novedades reportadas por este usuario
      // Mostrar solo visualización (sin acciones de gestión)
      const q = query(
        collection(db, 'novedades'),
        where('reportadoPor', '==', currentUser.uid)
      );
      // ...
    }
  };
  
  return (
    <View>
      {puedeGestionar && (
        <>
          <Button onPress={aprobarNovedad}>Aprobar</Button>
          <Button onPress={rechazarNovedad}>Rechazar</Button>
        </>
      )}
      {puedeReportar && !puedeGestionar && (
        <Button onPress={reportarNuevaNovedad}>Reportar Incidente</Button>
      )}
      {/* Renderizar lista de novedades */}
    </View>
  );
}
```

---

### 3. **ReportesScreen** (Ver reportes generados)

**Permiso:** `reportes.propios` vs `reportes.todos`

**Lógica esperada:**

```javascript
export default function ReportesScreen() {
  const { can } = usePermissions();
  
  const puedeVerTodos = can(APP_PERMISSIONS.REPORTES_TODOS);
  const puedeVerPropios = can(APP_PERMISSIONS.REPORTES_PROPIOS);
  
  // Si no tiene ninguno de los dos permisos, denegar acceso
  if (!puedeVerTodos && !puedeVerPropios) {
    return <AccessDenied />;
  }
  
  const cargarReportes = async () => {
    if (puedeVerTodos) {
      // Cargar reportes de TODOS los usuarios
      const q = query(collection(db, 'reportes'));
      const querySnapshot = await getDocs(q);
      // ...procesar
    } else {
      // Cargar SOLO reportes generados por este usuario
      const q = query(
        collection(db, 'reportes'),
        where('creadoPor', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      // ...procesar
    }
  };
  
  return (
    <View>
      {puedeVerTodos && (
        <Text>Viendo reportes de TODOS los usuarios</Text>
      )}
      {!puedeVerTodos && puedeVerPropios && (
        <Text>Viendo solo TUS reportes</Text>
      )}
      {/* Renderizar lista de reportes */}
    </View>
  );
}
```

---

## ❌ ERRORES COMUNES A EVITAR

### ❌ **ERROR 1: Verificar rol en lugar de permiso**

```javascript
// ❌ INCORRECTO
if (isAdmin) {
  // Mostrar todos los reportes
}

// ✅ CORRECTO
if (can(APP_PERMISSIONS.REPORTES_TODOS)) {
  // Mostrar todos los reportes
}
```

---

### ❌ **ERROR 2: Asumir que ADMIN siempre tiene acceso**

```javascript
// ❌ INCORRECTO
if (isAdmin || isSuperAdmin) {
  // Ver asistencias de todos
}

// ✅ CORRECTO
if (can(APP_PERMISSIONS.ASISTENCIAS_TODOS)) {
  // Ver asistencias de todos
}
```

**Razón:** Un ADMIN podría tener `asistencias.propias` pero NO `asistencias.todos` si el SUPERADMIN decide restringirlo.

---

### ❌ **ERROR 3: No manejar el caso donde no tiene ningún permiso**

```javascript
// ❌ INCORRECTO (crashea si no tiene ningún permiso)
if (can(APP_PERMISSIONS.REPORTES_TODOS)) {
  cargarTodos();
} else {
  cargarPropios(); // ¿Qué pasa si no tiene reportes.propios tampoco?
}

// ✅ CORRECTO
if (!can(APP_PERMISSIONS.REPORTES_TODOS) && !can(APP_PERMISSIONS.REPORTES_PROPIOS)) {
  return <AccessDenied message="No tienes permiso para ver reportes" />;
}

if (can(APP_PERMISSIONS.REPORTES_TODOS)) {
  cargarTodos();
} else {
  cargarPropios();
}
```

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

Para cada pantalla con permisos divididos:

- [ ] **Importar** `usePermissions` y `APP_PERMISSIONS`
- [ ] **Verificar permisos** con `can()`, NO con `isAdmin` o `isSuperAdmin`
- [ ] **Manejar caso sin permisos** → Mostrar `<AccessDenied />`
- [ ] **Cargar datos según permiso:**
  - `asistencias.todos` → Cargar de todos los usuarios
  - `asistencias.propias` → Cargar solo del usuario actual
- [ ] **Mostrar UI según permiso:**
  - Botones de acción solo si tiene el permiso adecuado
  - Mensajes claros: "Viendo TUS asistencias" vs "Viendo asistencias de TODOS"
- [ ] **Testing:**
  - Probar usuario con `asistencias.propias` → Debe ver solo las suyas
  - Probar usuario con `asistencias.todos` → Debe ver todas
  - Probar usuario sin ningún permiso → Debe ver "Acceso Denegado"

---

## 🚀 PRÓXIMOS PASOS

1. **NO implementar aún** - Esta guía es referencia para cuando estés listo
2. **Confirmar** que entiendes la lógica de permisos vs roles
3. **Cuando estés listo**, implementar primero `AsistenciasScreen`
4. **Testear exhaustivamente** antes de pasar a la siguiente pantalla
5. **Replicar patrón** en `ReportesScreen` y `NovedadesScreen`

---

## 💡 NOTAS FINALES

- **El usuario ve lo que el PERMISO dice**, no lo que el ROL sugiere
- **Un USER podría tener acceso completo** si le das todos los permisos manualmente
- **Un ADMIN podría tener acceso limitado** si le quitas permisos específicos
- **La flexibilidad es total** - tú decides qué permiso darle a cada quien

**Ejemplo extremo pero válido:**
```
Usuario: Juan Pérez
ROL: USER (porque no tiene admin.dashboard ni usuarios.gestionar)
Permisos: [
  'dashboard',
  'calendario',
  'historial',
  'perfil',
  'asistencias.todos',    ← Ve asistencias de todos (raro para un USER, pero válido)
  'reportes.todos',       ← Ve reportes de todos
  'novedades.gestionar'   ← Gestiona novedades de todos
]
```

Esto es **100% válido** según la arquitectura actual. El ROL dice "USER" pero tiene permisos de nivel ADMIN en áreas específicas.
