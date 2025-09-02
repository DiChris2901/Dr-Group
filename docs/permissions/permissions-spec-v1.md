---
title: Especificación del Sistema de Permisos y Seguridad
version: 1.0.0
date: 2025-09-02
status: draft
authors: ["Arquitectura de Seguridad"]
stack_detected: ["React 18", "Vite", "MUI v5", "Firebase (Auth/Firestore/Storage)", "Framer Motion"]
---

# Especificación del Sistema de Permisos y Seguridad

## Tabla de Contenido
1. [Inventario del Proyecto](#1-inventario-del-proyecto)
2. [Modelo de Dominio de Permisos](#2-modelo-de-dominio-de-permisos)
3. [Modelo de Datos en Firestore](#3-modelo-de-datos-en-firestore)
4. [Controles en el Front-End](#4-controles-en-el-front-end)
5. [Reglas de Seguridad en Firebase](#5-reglas-de-seguridad-en-firebase)
6. [Mapeo de Páginas y Componentes a Permisos](#6-mapeo-de-páginas-y-componentes-a-permisos)
7. [Riesgos y Mitigaciones](#7-riesgos-y-mitigaciones)
8. [Auditoría y Trazabilidad](#8-auditoría-y-trazabilidad)
9. [Plan de Implementación](#9-plan-de-implementación)
10. [Plan de Pruebas](#10-plan-de-pruebas)
11. [Apéndices](#11-apéndices)

---
## 1. Inventario del Proyecto
### 1.1 Estructura (resumida)
```
/docs
  MODAL_DESIGN_SYSTEM.md
  ...
/src
  components/{auth,commitments,common,dashboard,layout,payments,reports,users,...}
  context/{AuthContext.jsx,ThemeContext.jsx,NotificationsContext.jsx,...}
  hooks/{useUserPermissions.js,useCommitmentsPaginated.js,...}
  pages/{CommitmentsPage.jsx,UserManagementPage.jsx,OrphanFilesPage.jsx,...}
  utils/userPermissions.js
  config/{firebase.js,systemUsers.js}
functions/index.js (Cloud Functions placeholder)
```
### 1.2 Stack Detectado
| Capa | Tecnología | Uso principal |
|------|------------|---------------|
| UI | React 18 + MUI v5 + Framer Motion | SPA y animaciones |
| Build | Vite | Dev/Build rápido |
| Backend BaaS | Firebase Auth | Identidad |
| Base de Datos | Firestore | Datos operacionales |
| Almacenamiento | Firebase Storage | Comprobantes / archivos |
| Funciones | (Posible) Cloud Functions | Lógica privilegiada (pendiente) |

### 1.3 Rutas Principales (Inferidas)
| Ruta | Propósito | Estado |
|------|----------|--------|
| /login | Autenticación | Público |
| / | Dashboard | Protegido |
| /commitments | Compromisos | Protegido |
| /users | Gestión usuarios | Protegido (rol alto) |
| /reports | Reportes | Protegido |
| /orphan-files | Limpieza Storage | Protegido (alto) |
| /profile | Perfil | Protegido |

### 1.4 Contextos y Hooks Clave
| Archivo | Función |
|---------|---------|
| context/AuthContext.jsx | Carga perfil usuario, roles básicos, estado sesión |
| hooks/useUserPermissions.js | Evaluación permission-by-permission actual (sin ámbito empresa) |
| utils/userPermissions.js | Enum permisos, roles predefinidos estáticos |
| config/systemUsers.js | Usuarios de sistema con 'ALL' |
| OrphanFilesPage.jsx | Ejemplo de limpieza de Storage (requiere privilegio) |

### 1.5 Colecciones Observadas / Referencias (algunas inferidas)
| Colección | Uso | Estado |
|-----------|-----|--------|
| users | Perfiles y permisos | Implementada (estructura inconsistente) |
| commitments | Compromisos financieros | Implementada |
| payments | Pagos asociados | Parcial (inferido) |
| companies | Empresas | Referenciada en docs, no vista aún (Información requerida) |
| notifications | Centro notificaciones | Presente |
| files o receipts | Metadatos comprobantes (Información requerida) | No claro |
| activeSessions | Sesiones activas | Implementada |
| auditLogs | Auditoría (Información requerida) | No implementado |

### 1.6 Brechas Detectadas
- Ausencia de un modelo consistente de ámbito por empresa en permisos.
- Mezcla de permisos booleanos simples y listas (ej. `permissions: { commitments: true/false }` vs granular).
- Falta de auditoría formal.
- Reglas de Firestore y Storage aún no alineadas al modelo propuesto (no vistas en detalle en este análisis -> se propone reemplazo completo).

---
## 2. Modelo de Dominio de Permisos
### 2.1 Principios
1. Capas: Rol (RBAC) + Atributos (ABAC por empresas) + Lista de acciones.
2. Denegar por defecto (frontend y reglas).
3. Minimizar superficie: sólo exponer datos de empresas asignadas.
4. Permisos escalables: recursos × acciones.

### 2.2 Roles Base
| Rol | Descripción | Alcance |
|-----|-------------|---------|
| super_admin | Control global / multi-empresa | Global |
| admin | Administración dentro de empresas asignadas | Por empresa |
| editor | Operación (crear/editar) sin administración de usuarios | Por empresa |
| viewer | Solo lectura | Por empresa |

### 2.3 Recursos y Acciones
| Recurso | Acciones Estándar |
|---------|-------------------|
| companies | view, create, edit, delete |
| commitments | view, create, edit, delete |
| payments | view, create, edit, delete, approve |
| receipts (comprobantes) | view, upload, download, delete |
| reports | view, export, view_financial |
| users | view_list, create, edit, delete, assign_roles |
| system (utilidades) | orphan_scan, audit_view |

### 2.4 Matriz Rol × Recurso × Acción (✔ permitido / ✖ negado / * condicionado a empresa asignada)
| Recurso / Acción | super_admin | admin | editor | viewer |
|------------------|-------------|-------|--------|--------|
| companies.view | ✔ | * | * | * |
| companies.create | ✔ | ✖ | ✖ | ✖ |
| companies.edit | ✔ | * | ✖ | ✖ |
| companies.delete | ✔ | ✖ | ✖ | ✖ |
| commitments.view | ✔ | * | * | * |
| commitments.create | ✔ | * | * | ✖ |
| commitments.edit | ✔ | * | * | ✖ |
| commitments.delete | ✔ | * | ✖ | ✖ |
| payments.view | ✔ | * | * | * |
| payments.create | ✔ | * | * | ✖ |
| payments.edit | ✔ | * | * | ✖ |
| payments.delete | ✔ | * | ✖ | ✖ |
| payments.approve | ✔ | * | ✖ | ✖ |
| receipts.view | ✔ | * | * | * |
| receipts.upload | ✔ | * | * | ✖ |
| receipts.download | ✔ | * | * | * |
| receipts.delete | ✔ | * | ✖ | ✖ |
| reports.view | ✔ | * | * | * |
| reports.export | ✔ | * | * | ✖ |
| reports.view_financial | ✔ | * | ✖ | ✖ |
| users.view_list | ✔ | * | ✖ | ✖ |
| users.create | ✔ | * (sólo roles <= editor) | ✖ | ✖ |
| users.edit | ✔ | * (sólo roles <= editor) | ✖ | ✖ |
| users.delete | ✔ | ✖ | ✖ | ✖ |
| users.assign_roles | ✔ | ✖ | ✖ | ✖ |
| system.orphan_scan | ✔ | ✖ | ✖ | ✖ |
| system.audit_view | ✔ | * | ✖ | ✖ |

### 2.5 Atributos de Usuario (Firestore `users/{uid}`)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| uid | string | UID Auth |
| email | string | Único, login |
| displayName | string | Nombre completo |
| role | string | Rol base (super_admin/admin/editor/viewer) |
| companyIds | string[] | Empresas asignadas |
| customPermissions | object | Overrides (opcional) |
| isActive | boolean | Activo / suspendido |
| preferences | object | Tema, idioma |
| createdAt / updatedAt | timestamp | Auditoría |
| lastLogin | timestamp | Último acceso |
| department | string | (opcional) |
| metadata | object | lastPasswordReset, createdBy, etc. |

### 2.6 Evaluación de Permisos (Resolución)
Orden de chequeo:
1. Si `role === super_admin` => allow.
2. Verificar acción en matriz del rol.
3. Si requiere empresa => validar `companyId in companyIds`.
4. Aplicar overrides de `customPermissions` (puede reforzar deny o conceder adicional). Denegar tiene precedencia.

### 2.7 Ejemplo de Documento Usuario
```json
{
  "uid": "abc123",
  "email": "user@empresa.com",
  "displayName": "Usuario Ejemplo",
  "role": "admin",
  "companyIds": ["comp_a", "comp_b"],
  "customPermissions": {
    "reports.view_financial": true,
    "payments.approve": false
  },
  "isActive": true,
  "preferences": { "theme": "dark", "language": "es" },
  "createdAt": {"_seconds": 1693600000},
  "updatedAt": {"_seconds": 1693700000},
  "lastLogin": {"_seconds": 1694000000}
}
```

---
## 3. Modelo de Datos en Firestore
### 3.1 Colecciones Principales
| Colección | Clave Primaria | Descripción |
|-----------|---------------|-------------|
| users | uid | Perfiles y permisos |
| companies | auto-id / slug | Empresas |
| commitments | auto-id | Compromisos (empresa) |
| payments | auto-id | Pagos asociados a compromisos |
| receipts | auto-id | Metadatos de comprobantes (Información requerida) |
| notifications | auto-id | Notificaciones dirigidas |
| auditLogs | auto-id | Eventos de auditoría |
| activeSessions | auto-id | Tracking sesiones |

### 3.2 Esquemas (Requeridos / Recomendados)
#### companies
```json
{
  "name": "Empresa SA",
  "nit": "900123456-7",
  "status": "active", // active|suspended
  "plan": {"tier": "pro", "maxCommitments": 1000},
  "stats": {"activeCommitments": 120, "pendingAmount": 50000000},
  "createdAt": TS, "createdBy": "uid1",
  "updatedAt": TS, "updatedBy": "uid2"
}
```
Índices sugeridos: `(status, name)`, `(nit)` único.

#### commitments
```json
{
  "companyId": "comp_a",
  "type": "fixed", // fixed|variable
  "category": "rent",
  "description": "Arriendo sede norte",
  "amount": 2500000,
  "currency": "COP",
  "frequency": "monthly",
  "nextDueDate": TS,
  "status": "active", // active|completed|cancelled
  "lastPaymentDate": TS|null,
  "createdAt": TS, "createdBy": "uid",
  "updatedAt": TS, "updatedBy": "uid"
}
```
Índices: `(companyId, status)`, `(companyId, nextDueDate)`.

#### payments
```json
{
  "companyId": "comp_a",
  "commitmentId": "comm_123",
  "amount": 2500000,
  "currency": "COP",
  "paymentDate": TS,
  "status": "approved", // pending|approved|rejected
  "method": "transfer",
  "receiptId": "rcp_1" , // opcional
  "createdAt": TS, "createdBy": "uid",
  "approvedAt": TS, "approvedBy": "uidAdmin"
}
```
Índices: `(companyId, status)`, `(commitmentId, status)`, `(companyId, paymentDate)`.

#### receipts (Información requerida)
Opción A (colección plana): `receipts/{receiptId}` con `companyId`, `paymentId|commitmentId`, `storagePath`.
Opción B (subcolección): `payments/{paymentId}/receipts/{receiptId}`.
| Opción | Ventaja | Desventaja |
|--------|---------|------------|
| A | Búsqueda global más simple | Reglas más complejas para filtrar empresa |
| B | Encapsula ciclo de vida del pago | Más lecturas para listados globales |
Recomendado: Opción B para locality semántica.

#### auditLogs
```json
{
  "userId": "uid",
  "userEmail": "u@corp.com",
  "action": "commitment.create",
  "resource": "commitments",
  "resourceId": "comm_123",
  "companyId": "comp_a",
  "severity": "info", // info|warning|error|critical
  "ip": "187.x.x.x",
  "userAgent": "Mozilla/..",
  "details": {"amount": 2500000},
  "timestamp": TS,
  "expiresAt": TS // TTL
}
```
Índices: `(companyId, timestamp)`, `(userId, timestamp)`, `(resource, timestamp)`.

### 3.3 Relaciones
| Relación | Tipo | Nota |
|----------|------|------|
| payment.commitmentId -> commitments.id | N:1 | Validar existencia en reglas (get) |
| commitment.companyId -> companies.id | N:1 | Central para filtrado |
| payment.companyId -> companies.id | Redundante para queries |
| receipt.paymentId -> payments.id | 1:N | Subcolección recomendada |
| user.companyIds[] -> companies.id | M:N | Controlado por asignación |

### 3.4 Campos Obligatorios Mínimos
| Colección | Campos requeridos |
|-----------|------------------|
| users | uid,email,role,companyIds,isActive,createdAt |
| companies | name,status,createdAt |
| commitments | companyId,amount,status,nextDueDate,createdAt |
| payments | companyId,commitmentId,amount,status,paymentDate,createdAt |
| receipts | storagePath,companyId,createdAt |
| auditLogs | action,resource,timestamp |

### 3.5 Reglas de Integridad (lógicas)
- `payments.companyId == commitments.companyId` (validar en Cloud Function onCreate).
- Eliminación lógica: marcar `status` en vez de borrar para compromisos críticos.
- Evitar montos negativos.

---
## 4. Controles en el Front-End
### 4.1 Estrategia General
- Capa de guard: `<PrivateRoute>` para auth.
- Hook `usePermission(resource, action, companyId?)`.
- Patrón: Render condicional + disabled + tooltip.
- Fallback 403 centralizado.

### 4.2 Hook Propuesto
```ts
interface PermissionContextUser {
  uid: string; role: string; companyIds: string[]; customPermissions?: Record<string, boolean>; isActive: boolean;
}

function usePermission() {
  const { currentUser } = useAuth();
  const roleMatrix = {/* tabla resumida en memoria */};

  function has(resource: string, action: string, companyId?: string): boolean {
    if (!currentUser || !currentUser.isActive) return false;
    if (currentUser.role === 'super_admin') return true;
    const key = `${resource}.${action}`;
    // 1. Matriz
    const allowedByRole = roleMatrix[currentUser.role]?.[key] === true;
    if (!allowedByRole) return false;
    // 2. Empresa
    if (companyId && !currentUser.companyIds?.includes(companyId)) return false;
    // 3. Overrides
    if (currentUser.customPermissions?.[key] === false) return false; // deny explícito
    if (currentUser.customPermissions?.[key] === true) return true;
    return allowedByRole;
  }

  return { has };
}
```

### 4.3 Ejemplos UI
```jsx
<ActionButton disabled={!perm.has('commitments','edit', row.companyId)}>Editar</ActionButton>
{perm.has('payments','approve', pay.companyId) && <ApprovePaymentButton />}
{!perm.has('reports','view_financial', activeCompany) && <FinancialUpgradeBanner />}
```

### 4.4 Dashboard de Observación de Permisos
- Reutilizar página existente `/admin/activity-logs` (ActivityLogsPage).
- Extensión con filtro adicional `logType: 'permissions'`.
- Nuevas columnas: Recurso, Acción, Empresa, Decisión (Allow/Deny), Modo (Observe/Enforce).
- Stats específicos: % would-deny por recurso, top acciones restrictivas.
- Componente `PermissionStats` similar a `ActivityStats` existente.

### 4.5 Fallbacks
| Situación | Respuesta UI |
|-----------|--------------|
| Sin auth | Redirigir a /login |
| Sin permiso recurso | Página 403 dedicada |
| Sin empresas asignadas | Empty-state con mensaje y soporte |
| Datos vacíos legítimos | Empty-state semántico (íconos) |

### 4.6 Prevención de Filtraciones
- Nunca construir queries sin filtrar por `companyId` (excepto super_admin).
- Sanitizar `companyId` activo provisto por selector UI.

---
## 5. Reglas de Seguridad en Firebase
### 5.1 Principios
- Deny by default.
- Validación multi-condición: auth + activo + empresa + permiso granular.
- Minimizar `get()` secundarios en reglas (usar estructura plana eficiente).

### 5.2 Helpers (Pseudocódigo Rules)
```js
function isAuth() { return request.auth != null; }
function userDoc() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
function isActive() { return userDoc().isActive == true; }
function isSuper() { return userDoc().role == 'super_admin'; }
function inCompany(c) { return isSuper() || (c in userDoc().companyIds); }
function roleAllows(resource, action) { return get(/databases/$(database)/documents/roleMatrix/$(userDoc().role)).data[resource + '.' + action] == true; }
function customOverride(resource, action) {
  let key = resource + '.' + action;
  return (key in userDoc().customPermissions) ? userDoc().customPermissions[key] : null;
}
function can(resource, action, companyId) {
  if (!isAuth() || !isActive()) return false;
  if (isSuper()) return true;
  let base = roleAllows(resource, action);
  if (!base) return false;
  if (companyId != null && !inCompany(companyId)) return false;
  let ov = customOverride(resource, action);
  if (ov == false) return false; if (ov == true) return true; return base;
}
```

### 5.3 Firestore Rules (Fragmentos Clave)
```js
match /users/{uid} {
  allow read: if isAuth() && (request.auth.uid == uid || isSuper() || userDoc().role == 'admin');
  allow create: if isSuper();
  allow update: if isSuper() || (request.auth.uid == uid && request.resource.data.role == resource.data.role);
  allow delete: if isSuper();
}

match /companies/{cid} {
  allow read: if can('companies','view', cid);
  allow create: if can('companies','create', null);
  allow update: if can('companies','edit', cid);
  allow delete: if can('companies','delete', cid);
}

match /commitments/{id} {
  allow read: if can('commitments','view', resource.data.companyId);
  allow create: if can('commitments','create', request.resource.data.companyId);
  allow update: if can('commitments','edit', resource.data.companyId) && request.resource.data.companyId == resource.data.companyId;
  allow delete: if can('commitments','delete', resource.data.companyId);
}

match /payments/{pid} {
  allow read: if can('payments','view', resource.data.companyId);
  allow create: if can('payments','create', request.resource.data.companyId);
  allow update: if can('payments','edit', resource.data.companyId);
  allow delete: if can('payments','delete', resource.data.companyId);
}

match /payments/{pid}/receipts/{rid} {
  allow read: if can('receipts','view', resource.data.companyId);
  allow create: if can('receipts','upload', request.resource.data.companyId);
  allow delete: if can('receipts','delete', resource.data.companyId);
}

match /auditLogs/{logId} {
  allow create: if isAuth();
  allow read: if isSuper() || (userDoc().role == 'admin' && resource.data.companyId in userDoc().companyIds);
  allow update, delete: if false;
}
```

### 5.4 Storage Rules (Fragmentos)
Estructura recomendada Storage:
```
/invoices/{companyId}/{paymentId}/{fileName}
/avatars/{uid}/avatar.jpg
/exports/{companyId}/{fileName}
```
```js
match /invoices/{companyId}/{paymentId}/{fileName} {
  allow read: if can('receipts','download', companyId);
  allow write: if can('receipts','upload', companyId) && request.resource.size < 10 * 1024 * 1024 && request.resource.contentType.matches('application/pdf|image/.*');
  allow delete: if can('receipts','delete', companyId);
}
match /avatars/{uid}/{fileName} {
  allow write: if isAuth() && request.auth.uid == uid && request.resource.size < 2*1024*1024 && request.resource.contentType.matches('image/.*');
  allow read: if isAuth();
  allow delete: if isAuth() && (request.auth.uid == uid || isSuper());
}
match /exports/{companyId}/{fileName} {
  allow read: if can('reports','export', companyId);
  allow write: if isSuper() || userDoc().role == 'admin';
  allow delete: if false;
}
```

### 5.5 Queries Seguras
- Siempre limitar: `limit(50)` máximo y paginación con `startAfter`.
- Filtrar por `companyId` antes de ordenar.
- Evitar `where in` con >10 ids (dividir lotes).

---
## 6. Mapeo de Páginas y Componentes a Permisos
| Página / Componente | Permiso(s) | Observaciones |
|---------------------|-----------|---------------|
| Dashboard KPIs | commitments.view + payments.view | Filtrar por empresas asignadas |
| CommitmentsPage | commitments.view | Botones condicionales create/edit/delete |
| Modal Crear Compromiso | commitments.create | Validar company activa |
| Modal Editar Compromiso | commitments.edit | - |
| Botón Eliminar Compromiso | commitments.delete | Confirmación + auditoría |
| PaymentsSection | payments.view | - |
| Registrar Pago | payments.create | - |
| Aprobar Pago | payments.approve | Sólo admin/editor con override (editor normalmente no) |
| ReportsPage | reports.view | Export requiere reports.export |
| Reporte Financiero | reports.view_financial | Admin+ override |
| UsersPage | users.view_list | - |
| Crear Usuario | users.create | Admin (empresas asignadas) |
| Editar Usuario | users.edit | Admin; no elevar a super_admin |
| Eliminar Usuario | users.delete | Solo super_admin |
| Limpieza Orphan Files | system.orphan_scan | Solo super_admin |
| Auditoría UI | system.audit_view | Super / Admin limitado |
| PDFPreviewDialog | receipts.download | Validar empresa |
| UploadReceiptButton | receipts.upload | - |
| DeleteReceipt | receipts.delete | Admin/Super |

---
## 7. Riesgos y Mitigaciones
| Riesgo | Descripción | Mitigación Técnica |
|--------|-------------|--------------------|
| Escalada privilegios | Cambiar rol vía client | Reglas + funciones Cloud firmadas para role change |
| IDOR | Acceso a docs de otra empresa | `can()` + filtro companyId obligatorio |
| Fuga URL Storage | Compartir link largo | Usar download tokens rotables / URLs firmadas caducidad corta |
| Lecturas masivas | Scraping datos | Límites + paginación + Cloud Functions para export |
| Datos huérfanos | Files sin metadatos | Proceso OrphanFiles con permiso exclusivo |
| Auditoría incompleta | Falta de trazabilidad | Colección auditLogs inmutable |
| Manipulación overrides | set customPermissions | Reglas bloquean updates no autorizados |
| Dos usuarios mismos cambios | Race conditions pagos | Transacciones Firestore en aprobaciones |

---
## 8. Auditoría y Trazabilidad
### 8.1 Eventos a Registrar
| Acción | Formato action | Severidad | Retención |
|--------|----------------|----------|-----------|
| Login exitoso | auth.login | info | 90d |
| Logout | auth.logout | info | 30d |
| Creación compromiso | commitment.create | info | 365d |
| Edición compromiso | commitment.update | info | 365d |
| Eliminación compromiso | commitment.delete | warning | 730d |
| Registro pago | payment.create | info | 730d |
| Aprobación pago | payment.approve | info | 730d |
| Rechazo pago | payment.reject | warning | 730d |
| Subir comprobante | receipt.upload | info | 365d |
| Descargar comprobante | receipt.download | info | 90d |
| Eliminar comprobante | receipt.delete | warning | 730d |
| Crear usuario | user.create | info | 730d |
| Cambiar rol | user.role_change | warning | 730d |
| Limpieza orphan | system.orphan_clean | info | 365d |

### 8.2 Estructura auditLogs
```json
{
  "action": "payment.approve",
  "resource": "payments",
  "resourceId": "pay_123",
  "companyId": "comp_a",
  "userId": "uid_admin",
  "userEmail": "admin@corp.com",
  "severity": "info",
  "ip": "x.x.x.x",
  "userAgent": "Mozilla/5.0",
  "details": {"amount": 2500000},
  "timestamp": TS,
  "expiresAt": TS
}
```

### 8.3 TTL / Retención
| Severidad | Días |
|-----------|------|
| info | 365 |
| warning | 730 |
| error | 1095 |
| critical | 1825 |

---
## 9. Plan de Implementación
### 9.1 Orden Recomendado
1. Definir documentos `roleMatrix` (si se opta por almacenar matriz en Firestore).  
2. Migrar estructura `users` (añadir `companyIds`, `customPermissions`).  
3. Implementar Cloud Function para cambios de rol y asignación de empresas.  
4. Escribir reglas Firestore y Storage nuevas en staging.  
5. Crear hook `usePermission` y `<PrivateRoute>`.  
6. Refactor UI para condicionar botones.  
7. Implementar `auditLogs` + wrapper de logging.  
8. Añadir limpieza OrphanFiles con permiso dedicado.  
9. Pruebas unitarias y de integración (rules emulator).  
10. Deploy progresivo (staging -> producción).  

### 9.2 Checklist Detallado
| Paso | Ítem | Estado |
|------|------|--------|
| 1 | Documento roleMatrix | Pending |
| 2 | Migración usuarios script | Pending |
| 3 | Function cambio rol | Pending |
| 4 | Nuevas Firestore Rules | Pending |
| 5 | Nuevas Storage Rules | Pending |
| 6 | Hook usePermission | Pending |
| 7 | Guard de rutas | Pending |
| 8 | Refactor componentes críticos | Pending |
| 9 | Implementar auditLogs | Pending |
| 10 | Ensayos emulator | Pending |
| 11 | Monitoreo error rate post deploy | Pending |

### 9.3 Dependencias
| Tarea | Depende de |
|-------|------------|
| Reglas Firestore | roleMatrix + esquema usuarios |
| Hook permisos | Migración usuarios |
| Auditoría | Reglas + hook |
| Limpieza orphan segura | Reglas Storage |

---
## 10. Plan de Pruebas
### 10.1 Casos Unitarios (Permisos)
| Caso | Usuario | Acción | companyId | Esperado |
|------|---------|--------|-----------|----------|
| C1 | super_admin | commitments.delete | comp_a | allow |
| C2 | admin con comp_a | commitments.delete | comp_a | allow |
| C3 | admin sin comp_b | commitments.delete | comp_b | deny |
| C4 | editor comp_a | payments.approve | comp_a | deny |
| C5 | viewer comp_a | commitments.view | comp_a | allow |
| C6 | viewer comp_a | commitments.create | comp_a | deny |
| C7 | override deny | receipts.download | comp_a | deny |
| C8 | override allow | reports.view_financial | comp_a | allow |

### 10.2 Integración (Rules Emulator)
| Caso | Secuencia | Resultado |
|------|-----------|-----------|
| IR1 | Crear compromiso fuera de empresa asignada | deny |
| IR2 | Editor edita compromiso empresa asignada | allow |
| IR3 | Viewer intenta subir comprobante | deny |
| IR4 | Admin cambia rol a super_admin | deny (no permitido) |
| IR5 | Super admin elimina usuario | allow |

### 10.3 E2E (Cypress / Playwright)
| Escenario | Pasos | Resultado |
|-----------|-------|-----------|
| E2E1 Crear y aprobar pago | Login editor -> crea pago -> login admin -> aprueba | Flujo exitoso + logs |
| E2E2 Descarga comprobante | Login viewer -> ver comprobante -> descargar | Permitido |
| E2E3 Intento acceso /users sin permiso | Login viewer -> /users | 403 |
| E2E4 Exportar reporte sin permiso | Login viewer -> export | Bloque UI |

### 10.4 Métricas Aceptación
| Métrica | Umbral |
|---------|--------|
| Cobertura unit tests permisos | >= 90% ramas críticas |
| Falsos positivos (deny erróneo) | 0 en suite integración |
| Tiempo respuesta reglas | < 300ms P95 |
| Incidencias post-deploy (7d) | 0 bloqueantes |

---
## 11. Apéndices
### 11.1 Ejemplo roleMatrix (Documento Firestore opcional)
```json
// roleMatrix/super_admin
{ "*": true }
// roleMatrix/admin
{ "companies.view": true, "commitments.create": true, "commitments.edit": true, "commitments.delete": true, "payments.approve": true, "reports.export": true, "users.view_list": true, "users.create": true, "users.edit": true }
// roleMatrix/editor
{ "commitments.create": true, "commitments.edit": true, "payments.create": true, "payments.edit": true, "receipts.upload": true, "receipts.download": true, "reports.view": true }
// roleMatrix/viewer
{ "commitments.view": true, "payments.view": true, "receipts.download": true, "reports.view": true }
```

### 11.2 Hook `usePermission` (Versión con Dashboard ActivityLogsPage)
```js
export function usePermission() {
  const { userProfile } = useAuth();
  const { logActivity } = useActivityLogs();
  const matrix = useMemo(()=>buildMatrix(userProfile.role),[userProfile.role]);
  const MODE = import.meta.env.VITE_PERMISSIONS_MODE || 'observe';
  
  function has(res, act, companyId) {
    if(!userProfile?.isActive) return false;
    if(userProfile.role==='super_admin') return true;
    const key = `${res}.${act}`;
    if(!matrix[key]) return false;
    if(companyId && !userProfile.companyIds?.includes(companyId)) return false;
    const ov = userProfile.customPermissions?.[key];
    const decision = ov===false ? false : (ov===true ? true : true);
    
    // Log para dashboard en ActivityLogsPage
    logActivity({
      action: key,
      entityType: 'permissions',
      entityId: companyId,
      metadata: {
        decision: decision ? 'allow' : 'deny',
        mode: MODE,
        resource: res,
        action: act,
        overrideApplied: ov !== undefined
      }
    });
    
    if(MODE === 'observe') return true; // Permitir en modo observación
    return decision;
  }
  return { has };
}
```

### 11.3 Glosario
| Término | Definición |
|---------|------------|
| RBAC | Role-Based Access Control |
| ABAC | Attribute-Based Access Control |
| Company Scope | Restricción por empresa asignada |
| Override | Ajuste puntual a la matriz base |
| Orphan Files | Archivos en Storage sin referencia válida |
| TTL | Time To Live para expiración de logs |

### 11.4 Información Requerida Pendiente
| Área | Falta | Opción A | Opción B |
|------|-------|----------|----------|
| Estructura companies | Campos legales detallados | Añadir subcolección contactos | Mantener plano con campos básicos |
| receipts storage layout | Organización | Subcolección bajo payments | Colección plana con índice companyId |
| Auditoría IP real | Captura IP | Cloud Function reverse proxy | Servicio externo (NO recomendado) |

### 11.5 Decisiones Arquitectónicas Clave
| Decisión | Motivo | Impacto |
|----------|-------|---------|
| Matriz + overrides | Flexibilidad + simplicidad | Fácil extensión |
| Subcolección receipts | Encapsular ciclo de vida pago | Menos queries globales |
| Deny por defecto | Seguridad | Necesita mapeo exhaustivo |
| Auditoría inmutable | Evidencia cumplimiento | Storage adicional |

---
Fin del documento.
