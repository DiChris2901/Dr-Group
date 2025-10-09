# 🔍 AUDITORÍA COMPLETA DE PERMISOS EN PÁGINAS CRUD

## 📊 RESUMEN EJECUTIVO

**Fecha**: 9 de octubre de 2025
**Alcance**: Revisión de detección de admin y restricciones UI en todas las páginas CRUD del sistema

### 🎯 HALLAZGOS PRINCIPALES

| Página | isAdmin Detectado | Usado en UI | Firestore Protegido | Estado |
|--------|-------------------|-------------|---------------------|---------|
| **Compromisos** | ❌ NO | ❌ NO | ❌ NO | 🔴 CRÍTICO |
| **Compromisos Por Vencer** | ✅ SÍ | ❌ NO | ❌ NO | 🟡 PARCIAL |
| **Pagos** | ✅ SÍ | ❌ NO | ❌ NO | 🟡 PARCIAL |
| **Empresas** | ✅ SÍ | ❌ NO | ❌ NO | 🟡 PARCIAL |
| **Salas** | ✅ SÍ | ❌ NO | ❌ NO | 🟡 PARCIAL |
| **Liquidaciones** | ❌ NO | ❌ NO | ❌ NO | 🔴 CRÍTICO |
| **Liquidaciones por Sala** | ❌ NO | ❌ NO | ❌ NO | 🔴 CRÍTICO |
| **Liquidaciones Historial** | ✅ SÍ (propio) | ❌ NO | ❌ NO | 🟡 PARCIAL |
| **Ingresos** | ✅ SÍ | ❌ NO | ❌ NO | 🟡 PARCIAL |
| **Historial Ingresos** | ✅ SÍ | ❌ NO | ❌ NO | 🟡 PARCIAL |
| **Nuevo Compromiso** | ❌ NO | ❌ NO | ❌ NO | 🔴 CRÍTICO |
| **Nuevo Pago** | ❌ NO | ❌ NO | ❌ NO | 🔴 CRÍTICO |
| **Gestión Usuarios** | ❌ NO | ❌ NO | ❌ NO | 🔴 CRÍTICO |

---

## 📋 ANÁLISIS DETALLADO POR PÁGINA

### 1️⃣ **CommitmentsPage.jsx** - PÁGINA PRINCIPAL DE COMPROMISOS
**Ruta**: `/compromisos`

#### ❌ ESTADO ACTUAL: CRÍTICO
- **isAdmin detectado**: ❌ NO
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ❌ NO TIENE:
import { isAdminUser } from '../utils/permissions';
const isAdmin = isAdminUser(currentUser, userProfile);

// ❌ NO RESTRINGE: Botón "Nuevo Compromiso"
<Button onClick={() => navigate('/compromisos/nuevo')}>
  <Add /> Nuevo Compromiso
</Button>
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Importar** `isAdminUser` desde `../utils/permissions`
2. **Calcular** `isAdmin` con `currentUser` y `userProfile`
3. **Condicionar botón** "Nuevo Compromiso":
   ```jsx
   {isAdmin && (
     <Button onClick={() => navigate('/compromisos/nuevo')}>
       <Add /> Nuevo Compromiso
     </Button>
   )}
   ```
4. **Considerar**: ¿Los usuarios normales deberían poder crear compromisos para sus empresas asignadas?

---

### 2️⃣ **DueCommitmentsPage.jsx** - COMPROMISOS POR VENCER
**Ruta**: `/compromisos/por-vencer`

#### 🟡 ESTADO ACTUAL: PARCIAL
- **isAdmin detectado**: ✅ SÍ (implementación propia dentro de `confirmDelete`)
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ✅ TIENE detección (pero solo en función de delete):
const confirmDelete = async () => {
  const isAdmin = (() => {
    const normalizedRole = userProfile?.role?.toUpperCase();
    const isSystemUser = (email) => systemUsers.includes(email?.toLowerCase());
    return normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || isSystemUser(currentUser?.email);
  })();
  
  // ...logs con performedByIsAdmin: isAdmin
};

// ❌ NO RESTRINGE: Botones de editar/eliminar en la UI
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Mover detección al top-level** del componente usando `isAdminUser`
2. **Deshabilitar botones** de editar/eliminar para no-admin:
   ```jsx
   <IconButton
     disabled={!isAdmin}
     onClick={() => handleEditCommitment(commitment)}
   >
     <Edit />
   </IconButton>
   ```
3. **Agregar Tooltip** explicativo: "Solo administradores pueden editar/eliminar"
4. **Considerar**: Permisos granulares por empresa (`companiesWrite`)

---

### 3️⃣ **PaymentsPage.jsx** - GESTIÓN DE PAGOS
**Ruta**: `/pagos`

#### 🟡 ESTADO ACTUAL: PARCIAL
- **isAdmin detectado**: ✅ SÍ
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ✅ TIENE:
import { isAdminUser } from '../utils/permissions';
const { currentUser, userProfile } = useAuth();
const isAdmin = isAdminUser(currentUser, userProfile);

// ✅ USA en logs:
performedByIsAdmin: isAdmin

// ❌ NO RESTRINGE: Botones de editar/eliminar pagos
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Deshabilitar botones** de editar/eliminar/crear para no-admin
2. **Agregar lógica granular**: ¿Usuario puede editar pagos de sus empresas?
   ```jsx
   const canEditPayment = (payment) => {
     if (isAdmin) return true;
     if (!userProfile?.companiesWrite) return false;
     return userProfile.companiesWrite.includes(payment.companyId);
   };
   ```
3. **Mostrar feedback visual** (tooltips) cuando botones estén deshabilitados

---

### 4️⃣ **CompaniesPage.jsx** - GESTIÓN DE EMPRESAS
**Ruta**: `/empresas`

#### 🟡 ESTADO ACTUAL: PARCIAL
- **isAdmin detectado**: ✅ SÍ
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO (CRÍTICO)

#### 🔍 ANÁLISIS:
```jsx
// ✅ TIENE:
import { isAdminUser } from '../utils/permissions';
const isAdmin = isAdminUser(currentUser, userProfile);

// ❌ NO RESTRINGE: Botones crear/editar/eliminar empresas
<IconButton onClick={() => handleEditCompany(company)}>
  <Edit />
</IconButton>
<IconButton onClick={() => handleDeleteCompany(company)}>
  <Delete />
</IconButton>
```

#### 🎯 ACCIONES REQUERIDAS:
1. **URGENTE**: Deshabilitar botones para no-admin:
   ```jsx
   <IconButton
     disabled={!isAdmin}
     onClick={() => handleEditCompany(company)}
   >
     <Edit />
   </IconButton>
   ```
2. **CRÍTICO**: Agregar validación al inicio de `handleSaveCompany`:
   ```jsx
   const handleSaveCompany = async () => {
     if (!isAdmin) {
       addNotification('No tienes permisos para editar empresas', 'error');
       return;
     }
     // ...resto del código
   };
   ```
3. **Considerar**: ¿Permitir editar solo empresas asignadas? (`companiesWrite`)

---

### 5️⃣ **SalasPage.jsx** - GESTIÓN DE SALAS
**Ruta**: `/facturacion/salas`

#### 🟡 ESTADO ACTUAL: PARCIAL
- **isAdmin detectado**: ✅ SÍ
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO (CRÍTICO)

#### 🔍 ANÁLISIS:
```jsx
// ✅ TIENE:
import { isAdminUser } from '../utils/permissions';
const isAdmin = isAdminUser(currentUser, userProfile);

// ❌ NO RESTRINGE: Botones crear/editar/eliminar salas
```

#### 🎯 ACCIONES REQUERIDAS:
1. **URGENTE**: Implementar `canEditSala()`:
   ```jsx
   const canEditSala = useCallback((sala) => {
     if (isAdmin) return true;
     if (!userProfile?.companiesWrite) return false;
     return userProfile.companiesWrite.includes(sala.companyId);
   }, [isAdmin, userProfile]);
   ```
2. **Deshabilitar botones** condicionalmente:
   ```jsx
   disabled={!canEditSala(sala)}
   ```
3. **Agregar tooltips** explicativos cuando disabled

---

### 6️⃣ **LiquidacionesPage.jsx** - PROCESAMIENTO DE LIQUIDACIONES
**Ruta**: `/liquidaciones`

#### 🔴 ESTADO ACTUAL: CRÍTICO
- **isAdmin detectado**: ❌ NO
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ❌ NO TIENE detección de admin
const { currentUser, userProfile } = useAuth();
// No calcula isAdmin

// ❌ NO RESTRINGE: Botón guardar liquidación, exportar, eliminar
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Importar y detectar** admin:
   ```jsx
   import { isAdminUser } from '../utils/permissions';
   const isAdmin = isAdminUser(currentUser, userProfile);
   ```
2. **Definir estrategia**: ¿Quién puede procesar/guardar liquidaciones?
   - Opción A: Solo admins
   - Opción B: Admins + usuarios con permisos en la empresa de la liquidación
3. **Deshabilitar botón guardar** si no tiene permisos
4. **Validar en backend**: Firestore rules para `liquidaciones` collection

---

### 7️⃣ **LiquidacionesPorSalaPage.jsx** - EDICIÓN DE LIQUIDACIONES POR SALA
**Ruta**: `/liquidaciones-por-sala`

#### 🔴 ESTADO ACTUAL: CRÍTICO
- **isAdmin detectado**: ❌ NO
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ❌ NO TIENE:
const { currentUser, userProfile } = useAuth();
// No usa isAdminUser

// ❌ NO RESTRINGE: Edición de máquinas, eliminación de liquidaciones editadas
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Agregar detección** de admin
2. **Restringir función** `eliminarLiquidacionEditada`:
   ```jsx
   const eliminarLiquidacionEditada = async (liquidacionEditada) => {
     if (!isAdmin) {
       addNotification('No tienes permisos para eliminar liquidaciones editadas', 'error');
       return;
     }
     // ...resto del código
   };
   ```
3. **Deshabilitar botón** de eliminar liquidación si no es admin
4. **Considerar**: ¿Permitir editar liquidaciones de salas de su empresa?

---

### 8️⃣ **LiquidacionesHistorialPage.jsx** - HISTORIAL DE LIQUIDACIONES
**Ruta**: `/liquidaciones-historial`

#### 🟡 ESTADO ACTUAL: PARCIAL
- **isAdmin detectado**: ✅ SÍ (implementación propia, sin `isAdminUser`)
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ✅ TIENE (implementación propia):
const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || isSystemUser(currentUser?.email);

// ❌ NO RESTRINGE: Acceso a ver liquidaciones (solo filtra por empresa del usuario)
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Migrar a** `isAdminUser` para consistencia
2. **Evaluar**: ¿Restricción actual es suficiente? (usuarios ven solo liquidaciones de su empresa)
3. **Posible mejora**: Agregar botón de eliminar liquidación (solo para admin)

---

### 9️⃣ **IncomePage.jsx** - REGISTRO DE INGRESOS
**Ruta**: `/ingresos`

#### 🟡 ESTADO ACTUAL: PARCIAL
- **isAdmin detectado**: ✅ SÍ
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ✅ TIENE:
import { isAdminUser } from '../utils/permissions';
const isAdmin = isAdminUser(currentUser, userProfile);

// ✅ USA en logs:
performedByIsAdmin: isAdmin

// ❌ NO RESTRINGE: Botones crear/editar/eliminar ingresos
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Definir estrategia**: ¿Quién puede registrar ingresos?
   - Opción A: Solo admins
   - Opción B: Admins + usuarios con permisos en la empresa del ingreso
2. **Deshabilitar botón** "Guardar" si no tiene permisos
3. **Validar al guardar**:
   ```jsx
   const handleSaveIncome = async () => {
     if (!isAdmin && !userProfile?.companiesWrite?.includes(formData.companyId)) {
       addNotification('No tienes permisos para registrar ingresos en esta empresa', 'error');
       return;
     }
     // ...resto
   };
   ```

---

### 🔟 **IncomeHistoryPage.jsx** - HISTORIAL DE INGRESOS
**Ruta**: `/ingresos/historial`

#### 🟡 ESTADO ACTUAL: PARCIAL
- **isAdmin detectado**: ✅ SÍ
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ✅ TIENE:
import { isAdminUser } from '../utils/permissions';
const isAdmin = isAdminUser(currentUser, userProfile);

// ✅ USA en logs:
performedByIsAdmin: isAdmin

// ❌ NO RESTRINGE: Botones editar/eliminar ingresos del historial
```

#### 🎯 ACCIONES REQUERIDAS:
1. **Deshabilitar botones** editar/eliminar para no-admin:
   ```jsx
   <IconButton
     disabled={!canEditIncome(income)}
     onClick={() => handleEditClick(income)}
   >
     <Edit />
   </IconButton>
   ```
2. **Función helper**:
   ```jsx
   const canEditIncome = (income) => {
     if (isAdmin) return true;
     if (!userProfile?.companiesWrite) return false;
     return userProfile.companiesWrite.includes(income.companyId);
   };
   ```

---

### 1️⃣1️⃣ **NewCommitmentPage.jsx** - CREAR NUEVO COMPROMISO
**Ruta**: `/compromisos/nuevo`

#### 🔴 ESTADO ACTUAL: CRÍTICO
- **isAdmin detectado**: ❌ NO
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO
- **Protección de ruta**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ❌ NO TIENE:
import { isAdminUser } from '../utils/permissions';

// ❌ NO VALIDA: Si el usuario tiene permisos para crear compromisos
```

#### 🎯 ACCIONES REQUERIDAS:
1. **CRÍTICO**: Agregar validación al inicio:
   ```jsx
   import { isAdminUser } from '../utils/permissions';
   const { currentUser, userProfile } = useAuth();
   const isAdmin = isAdminUser(currentUser, userProfile);
   
   useEffect(() => {
     if (!isAdmin && !userProfile?.companiesWrite?.length) {
       addNotification('No tienes permisos para crear compromisos', 'error');
       navigate('/compromisos');
     }
   }, [isAdmin, userProfile, navigate]);
   ```
2. **Restringir empresas disponibles**:
   ```jsx
   const availableCompanies = useMemo(() => {
     if (isAdmin) return companies;
     return companies.filter(c => userProfile?.companiesWrite?.includes(c.id));
   }, [companies, isAdmin, userProfile]);
   ```
3. **Agregar ProtectedRoute** en router con `requireAdmin` o `requireCompanyPermissions`

---

### 1️⃣2️⃣ **NewPaymentPage.jsx** - REGISTRAR NUEVO PAGO
**Ruta**: `/pagos/nuevo`

#### 🔴 ESTADO ACTUAL: CRÍTICO
- **isAdmin detectado**: ❌ NO
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO
- **Protección de ruta**: ❌ NO

#### 🔍 ANÁLISIS:
```jsx
// ❌ NO TIENE:
const { user } = useAuth(); // Solo usa 'user', no 'userProfile' ni 'currentUser'

// ❌ NO VALIDA: Si el usuario tiene permisos para registrar pagos
```

#### 🎯 ACCIONES REQUERIDAS:
1. **URGENTE**: Agregar validación de permisos
2. **Restringir compromisos disponibles** según empresa:
   ```jsx
   const availableCommitments = useMemo(() => {
     if (isAdmin) return commitments;
     return commitments.filter(c => 
       userProfile?.companiesWrite?.includes(c.companyId)
     );
   }, [commitments, isAdmin, userProfile]);
   ```
3. **Validar al guardar**:
   ```jsx
   const handleSavePayment = async () => {
     if (!isAdmin && !userProfile?.companiesWrite?.includes(selectedCommitment.companyId)) {
       addNotification('No tienes permisos para registrar pagos en esta empresa', 'error');
       return;
     }
     // ...resto
   };
   ```

---

### 1️⃣3️⃣ **UserManagementPage.jsx** - GESTIÓN DE USUARIOS
**Ruta**: `/admin/usuarios`

#### 🔴 ESTADO ACTUAL: CRÍTICO
- **isAdmin detectado**: ❌ NO
- **Restricciones UI**: ❌ NO
- **Firestore protegido**: ❌ NO
- **Protección de ruta**: ⚠️ DESCONOCIDO

#### 🔍 ANÁLISIS:
```jsx
// ❌ NO TIENE:
const { currentUser, userProfile } = useAuth();
// No detecta si es admin

// ❌ NO VALIDA: Si el usuario actual es admin antes de permitir CRUD de usuarios
```

#### 🎯 ACCIONES REQUERIDAS:
1. **CRÍTICO**: Agregar guard al inicio:
   ```jsx
   import { isAdminUser } from '../utils/permissions';
   const isAdmin = isAdminUser(currentUser, userProfile);
   
   useEffect(() => {
     if (!isAdmin) {
       addNotification('Acceso denegado: Solo administradores', 'error');
       navigate('/');
     }
   }, [isAdmin, navigate]);
   ```
2. **ProtectedRoute** con `requireAdmin={true}`
3. **Firestore rules** para `users` collection restringidas a admin
4. **UI feedback**: Mostrar warning si intenta acceder sin permisos

---

## 🎯 PLAN DE IMPLEMENTACIÓN COMPLETO

### **FASE 1: CRÍTICOS - Implementar AHORA (Prioridad Máxima)** ⏱️ ~180 min

#### 1.1 Firestore Rules (BACKEND) - 30 min
```javascript
// firestore.rules
function isAdmin() {
  return request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'SUPER_ADMIN'];
}

function hasCompanyPermission(companyId) {
  return request.auth != null && (
    isAdmin() ||
    companyId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companiesWrite
  );
}

match /companies/{companyId} {
  allow read: if request.auth != null;
  allow create: if isAdmin();
  allow update, delete: if hasCompanyPermission(companyId);
}

match /salas/{salaId} {
  allow read: if request.auth != null;
  allow create: if isAdmin();
  allow update, delete: if hasCompanyPermission(resource.data.companyId);
}

match /commitments/{commitmentId} {
  allow read: if request.auth != null;
  allow create: if isAdmin() || hasCompanyPermission(request.resource.data.companyId);
  allow update, delete: if isAdmin() || hasCompanyPermission(resource.data.companyId);
}

match /payments/{paymentId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin() || hasCompanyPermission(resource.data.companyId);
}

match /incomes/{incomeId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin() || hasCompanyPermission(resource.data.companyId);
}

match /liquidaciones/{liquidacionId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin();
}

match /liquidaciones_por_sala/{liquidacionId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin();
}

match /users/{userId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin();
}
```

**Deploy**: `firebase deploy --only firestore:rules`

#### 1.2 UserManagementPage.jsx - 15 min
```jsx
import { isAdminUser } from '../utils/permissions';

// Al inicio del componente:
const isAdmin = isAdminUser(currentUser, userProfile);

useEffect(() => {
  if (!isAdmin) {
    addNotification('Acceso denegado: Solo administradores', 'error');
    navigate('/');
  }
}, [isAdmin, navigate]);
```

#### 1.3 CompaniesPage.jsx - 20 min
```jsx
// Deshabilitar botones
<IconButton
  disabled={!isAdmin}
  onClick={() => handleEditCompany(company)}
>
  <Edit />
</IconButton>

// Validar en handleSaveCompany
const handleSaveCompany = async () => {
  if (!isAdmin) {
    addNotification('No tienes permisos para editar empresas', 'error');
    return;
  }
  // ...resto
};
```

#### 1.4 SalasPage.jsx - 25 min
```jsx
const canEditSala = useCallback((sala) => {
  if (isAdmin) return true;
  if (!userProfile?.companiesWrite) return false;
  return userProfile.companiesWrite.includes(sala.companyId);
}, [isAdmin, userProfile]);

// Deshabilitar botones condicionalmente
disabled={!canEditSala(sala)}

// Agregar tooltips
<Tooltip title={!canEditSala(sala) ? "No tienes permisos para editar esta sala" : ""}>
  <span>
    <IconButton disabled={!canEditSala(sala)} onClick={() => handleEdit(sala)}>
      <Edit />
    </IconButton>
  </span>
</Tooltip>
```

#### 1.5 NewCommitmentPage.jsx - 25 min
```jsx
import { isAdminUser } from '../utils/permissions';

const isAdmin = isAdminUser(currentUser, userProfile);

useEffect(() => {
  if (!isAdmin && !userProfile?.companiesWrite?.length) {
    addNotification('No tienes permisos para crear compromisos', 'error');
    navigate('/compromisos');
  }
}, [isAdmin, userProfile, navigate]);

const availableCompanies = useMemo(() => {
  if (isAdmin) return companies;
  return companies.filter(c => userProfile?.companiesWrite?.includes(c.id));
}, [companies, isAdmin, userProfile]);
```

#### 1.6 NewPaymentPage.jsx - 25 min
```jsx
import { isAdminUser } from '../utils/permissions';

const { currentUser, userProfile } = useAuth(); // Cambiar 'user' por 'currentUser' y agregar 'userProfile'
const isAdmin = isAdminUser(currentUser, userProfile);

// Similar a NewCommitmentPage
```

#### 1.7 LiquidacionesPage.jsx - 20 min
```jsx
import { isAdminUser } from '../utils/permissions';

const isAdmin = isAdminUser(currentUser, userProfile);

// Deshabilitar botón guardar si no es admin
<Button
  disabled={!isAdmin || guardandoLiquidacion}
  onClick={handleGuardarLiquidacion}
>
  Guardar Liquidación
</Button>
```

#### 1.8 LiquidacionesPorSalaPage.jsx - 20 min
```jsx
import { isAdminUser } from '../utils/permissions';

const isAdmin = isAdminUser(currentUser, userProfile);

const eliminarLiquidacionEditada = async (liquidacionEditada) => {
  if (!isAdmin) {
    addNotification('No tienes permisos para eliminar liquidaciones', 'error');
    return;
  }
  // ...resto
};

// Deshabilitar botón de eliminar
<Button
  disabled={!isAdmin}
  onClick={() => eliminarLiquidacionEditada(liquidacion)}
>
  Eliminar
</Button>
```

---

### **FASE 2: IMPORTANTES - Completar restricciones UI** ⏱️ ~120 min

#### 2.1 CommitmentsPage.jsx - 15 min
```jsx
import { isAdminUser } from '../utils/permissions';
const isAdmin = isAdminUser(currentUser, userProfile);

// Condicionar botón nuevo
{(isAdmin || userProfile?.companiesWrite?.length > 0) && (
  <Button onClick={() => navigate('/compromisos/nuevo')}>
    <Add /> Nuevo Compromiso
  </Button>
)}
```

#### 2.2 DueCommitmentsPage.jsx - 25 min
```jsx
// Mover isAdmin al top-level usando isAdminUser
import { isAdminUser } from '../utils/permissions';
const isAdmin = useMemo(() => isAdminUser(currentUser, userProfile), [currentUser, userProfile]);

// Función helper para permisos granulares
const canEditCommitment = useCallback((commitment) => {
  if (isAdmin) return true;
  if (!userProfile?.companiesWrite) return false;
  return userProfile.companiesWrite.includes(commitment.companyId);
}, [isAdmin, userProfile]);

// Deshabilitar botones
<IconButton
  disabled={!canEditCommitment(commitment)}
  onClick={() => handleEditCommitment(commitment)}
>
  <Edit />
</IconButton>
```

#### 2.3 PaymentsPage.jsx - 25 min
```jsx
const canEditPayment = useCallback((payment) => {
  if (isAdmin) return true;
  if (!userProfile?.companiesWrite) return false;
  return userProfile.companiesWrite.includes(payment.companyId);
}, [isAdmin, userProfile]);

// Deshabilitar botones edit/delete
disabled={!canEditPayment(payment)}
```

#### 2.4 IncomePage.jsx - 20 min
```jsx
const handleSaveIncome = async () => {
  if (!isAdmin && !userProfile?.companiesWrite?.includes(formData.companyId)) {
    addNotification('No tienes permisos para registrar ingresos en esta empresa', 'error');
    return;
  }
  // ...resto
};

// Filtrar empresas disponibles en el dropdown
const availableCompanies = useMemo(() => {
  if (isAdmin) return companies;
  return companies.filter(c => userProfile?.companiesWrite?.includes(c.id));
}, [companies, isAdmin, userProfile]);
```

#### 2.5 IncomeHistoryPage.jsx - 20 min
```jsx
const canEditIncome = useCallback((income) => {
  if (isAdmin) return true;
  if (!userProfile?.companiesWrite) return false;
  return userProfile.companiesWrite.includes(income.companyId);
}, [isAdmin, userProfile]);

// Deshabilitar botones
disabled={!canEditIncome(income)}
```

#### 2.6 LiquidacionesHistorialPage.jsx - 15 min
```jsx
// Migrar a isAdminUser para consistencia
import { isAdminUser } from '../utils/permissions';
const isAdmin = isAdminUser(currentUser, userProfile);

// Reemplazar lógica propia por helper centralizado
```

---

### **FASE 3: OPTIMIZACIONES - Mejorar UX y feedback** ⏱️ ~60 min

#### 3.1 Tooltips informativos - 20 min
```jsx
// En TODAS las páginas con botones deshabilitados
<Tooltip 
  title={!canEdit ? "No tienes permisos para editar este elemento" : ""}
  arrow
>
  <span>
    <IconButton disabled={!canEdit} onClick={handleEdit}>
      <Edit />
    </IconButton>
  </span>
</Tooltip>
```

#### 3.2 Indicadores visuales - 20 min
```jsx
// Agregar badges o chips cuando botones están disabled
{!canEdit && (
  <Chip 
    label="Sin permisos" 
    size="small" 
    color="default"
    icon={<LockIcon />}
  />
)}
```

#### 3.3 Mensajes contextuales - 20 min
```jsx
// Agregar Alert en páginas cuando usuario tiene permisos limitados
{!isAdmin && userProfile?.companiesWrite?.length > 0 && (
  <Alert severity="info" sx={{ mb: 2 }}>
    Tienes permisos de edición solo para algunas empresas
  </Alert>
)}
```

---

### **FASE 4: TESTING COMPLETO** ⏱️ ~90 min

#### 4.1 Testing con Admin - 20 min
- ✅ Puede acceder a TODAS las páginas
- ✅ Puede crear/editar/eliminar en TODAS las entidades
- ✅ Ve todos los botones habilitados

#### 4.2 Testing con Usuario Normal - 25 min
- ✅ NO puede acceder a UserManagementPage
- ✅ NO ve botones de editar/eliminar en CompaniesPage, SalasPage
- ✅ NO puede crear compromisos/pagos/ingresos
- ✅ NO puede procesar/guardar liquidaciones

#### 4.3 Testing con Usuario con companiesWrite - 25 min
- ✅ Puede editar/eliminar solo salas de sus empresas
- ✅ Puede crear compromisos solo para sus empresas
- ✅ Puede registrar pagos solo para compromisos de sus empresas
- ✅ Puede registrar ingresos solo para sus empresas
- ✅ NO puede editar otras empresas o salas

#### 4.4 Testing Firestore Rules - 20 min
- ✅ Usuario normal NO puede write a `companies`
- ✅ Usuario con companiesWrite puede write solo a sus empresas
- ✅ Usuario normal NO puede write a `users`
- ✅ Reglas bloquean correctamente intentos no autorizados

---

### **FASE 5: DEPLOYMENT** ⏱️ ~15 min

```bash
# 1. Commit cambios
git add .
git commit -m "feat: Implementar sistema completo de permisos granulares en todas las páginas CRUD"

# 2. Push
git push origin main

# 3. Build
npm run build

# 4. Deploy Firestore Rules
firebase deploy --only firestore:rules

# 5. Deploy Hosting
firebase deploy --only hosting
```

---

## 📊 MATRIZ DE DEPENDENCIAS

### Data Model Requirements (Pre-requisito para todo):
1. **Verificar campo `companyId` en todas las salas**
   ```javascript
   // Script de migración si falta
   const salasSnapshot = await getDocs(collection(db, 'salas'));
   for (const salaDoc of salasSnapshot.docs) {
     const sala = salaDoc.data();
     if (!sala.companyId) {
       console.warn(`Sala ${salaDoc.id} sin companyId: ${sala.nombre}`);
       // Asignar manualmente o solicitar input
     }
   }
   ```

2. **Agregar campo `companiesWrite` a usuarios**
   ```javascript
   // Actualizar usuarios existentes
   const usersSnapshot = await getDocs(collection(db, 'users'));
   for (const userDoc of usersSnapshot.docs) {
     const user = userDoc.data();
     if (!user.companiesWrite) {
       await updateDoc(doc(db, 'users', userDoc.id), {
         companiesWrite: [] // Iniciar vacío, asignar manualmente después
       });
     }
   }
   ```

---

## ⚠️ RIESGOS Y CONSIDERACIONES

### 🔴 RIESGO ALTO:
1. **Breaking changes**: Usuarios existentes perderán acceso si no se les asigna `companiesWrite`
   - **Mitigación**: Script de migración + comunicación previa
2. **Firestore rules demasiado restrictivas**: Podría bloquear operaciones legítimas
   - **Mitigación**: Testing exhaustivo antes de deploy
3. **Usuarios quedan "locked out"** si no son admin ni tienen companiesWrite
   - **Mitigación**: Asignar permisos antes de deploy de rules

### 🟡 RIESGO MEDIO:
1. **Performance**: Queries adicionales en rules (get user document)
   - **Mitigación**: Cacheo en cliente, evaluar reglas eficientes
2. **UX degradada**: Muchos botones deshabilitados confunde usuarios
   - **Mitigación**: Tooltips explicativos claros

### 🟢 RIESGO BAJO:
1. **Inconsistencia UI**: Algunas páginas con restricciones, otras no
   - **Mitigación**: Plan de implementación secuencial completo

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs Post-Implementación:
1. **Cobertura de permisos**: 100% de páginas CRUD con validación
2. **Zero unauthorized writes**: Firestore rules bloqueando correctamente
3. **User satisfaction**: Feedback positivo en tooltips y mensajes
4. **Audit logs**: Todos los logs incluyen `performedByIsAdmin` correctamente
5. **Security score**: 10/10 en auditoría de seguridad

---

## 🎯 RESUMEN DE ESTADO ACTUAL

### ✅ COMPLETADO (7 páginas):
- DueCommitmentsPage (parcial - solo logs)
- PaymentsPage (parcial - solo logs)
- CompaniesPage (parcial - solo logs)
- SalasPage (parcial - solo logs)
- IncomePage (parcial - solo logs)
- IncomeHistoryPage (parcial - solo logs)
- LiquidacionesHistorialPage (parcial - implementación propia)

### ❌ PENDIENTE (6 páginas):
- CommitmentsPage
- LiquidacionesPage
- LiquidacionesPorSalaPage
- NewCommitmentPage
- NewPaymentPage
- UserManagementPage

### 🔥 CRÍTICO (Firestore Rules):
- ❌ **NINGUNA** protección real en backend
- ❌ Cualquier usuario autenticado puede escribir a CUALQUIER collection
- ❌ Riesgo de seguridad extremadamente alto

---

## 💡 RECOMENDACIÓN FINAL

### **ESTRATEGIA SUGERIDA:**

#### **Día 1 (4 horas):**
1. ✅ Implementar Firestore Rules completas (Fase 1.1) - 30 min
2. ✅ Deploy rules a Firebase - 5 min
3. ✅ Testing manual básico de rules - 15 min
4. ✅ Implementar restricciones UI en páginas críticas (1.2-1.4) - 60 min
5. ✅ Testing de páginas críticas - 30 min
6. ✅ Implementar NewCommitmentPage y NewPaymentPage (1.5-1.6) - 50 min
7. ✅ Implementar LiquidacionesPage y LiquidacionesPorSalaPage (1.7-1.8) - 40 min

#### **Día 2 (3 horas):**
1. ✅ Completar todas las restricciones UI (Fase 2) - 120 min
2. ✅ Agregar tooltips y feedback visual (Fase 3) - 60 min

#### **Día 3 (2 horas):**
1. ✅ Testing completo con 3 perfiles de usuario (Fase 4) - 90 min
2. ✅ Deployment final (Fase 5) - 15 min
3. ✅ Documentación de cambios - 15 min

**TIEMPO TOTAL ESTIMADO**: ~9 horas de desarrollo + testing

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

1. **¿Empezamos con Firestore Rules (30 min)?** → Backend seguro primero
2. **¿O prefieres UI primero (UserManagementPage)?** → Más visible para testing

**MI RECOMENDACIÓN**: **Firestore Rules primero**, porque es la seguridad real. UI sin backend es solo cosmético.

¿Con cuál empezamos? 🚀
