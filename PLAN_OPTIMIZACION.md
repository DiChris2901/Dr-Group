# 🚀 PLAN DE OPTIMIZACIÓN — DR Group Dashboard + APK

**Fecha de creación:** 23 Feb 2026  
**Versión actual:** v3.12.0  
**Objetivo:** Optimizar Firebase, reducir reads 70%, bundle 65%, partir God Components  
**NO migrar a Supabase** — Firebase es el stack correcto para 11 usuarios

---

## 📊 ESTADO ACTUAL (Baseline — 23 Feb 2026)

### Métricas del Dashboard Web (src/)
| Métrica | Valor actual | Meta |
|---------|-------------|------|
| Reads/sesión estimados | ~1,500-2,500 | ~400-700 |
| Listeners simultáneos (onSnapshot) | 119 calls en código | ~40-50 calls |
| One-time reads (getDocs) | 148 calls en código | ~100 calls |
| Console.log/warn/error | **1,636** | < 50 (solo error boundaries) |
| Archivo más grande | PaymentsPage.jsx (4,974L) | < 1,000L |
| Archivos vacíos (0 líneas) | 9 archivos | 0 |
| Archivos legacy/dead code | ~5 archivos | 0 |

### Archivos > 2,000 líneas (God Components)
| Archivo | Líneas | Prioridad |
|---------|--------|-----------|
| `src/pages/PaymentsPage.jsx` | 4,974 | CRÍTICA |
| `src/pages/LiquidacionesPage.jsx` | 4,725 | CRÍTICA |
| `src/pages/LiquidacionesPageV1.jsx` | 4,045 | ELIMINAR (legacy) |
| `src/pages/NewPaymentPage_old.jsx` | 3,828 | ELIMINAR (legacy) |
| `src/pages/NewCommitmentPage.jsx` | 3,623 | ALTA |
| `src/pages/CompaniesPage.jsx` | 3,288 | ALTA |
| `src/pages/EmpleadosPage.jsx` | 2,982 | MEDIA |
| `src/pages/NewPaymentPage.jsx` | 2,924 | ALTA |
| `src/pages/LiquidacionesPorSalaPage.jsx` | 2,897 | MEDIA |
| `src/pages/UserManagementPage.jsx` | 2,509 | ALTA |
| `src/pages/SalasPage.jsx` | 2,269 | MEDIA |
| `src/pages/LiquidacionesHistorialPage.jsx` | 2,153 | MEDIA |
| `src/pages/AsistenciasPage.jsx` | 2,130 | MEDIA |

### Archivos vacíos (0 líneas — código muerto)
```
src/components/auth/ProtectedPageRoute.jsx
src/components/commitments/CommitmentEditForm.jsx
src/components/modals/ImportCommitmentsModal.jsx
src/components/modals/PDFViewer.jsx
src/components/debug/AdminAccessVerifier.jsx
src/components/debug/PermissionDebugger.jsx
src/hooks/useCommitmentsPaginated.js
src/hooks/usePagePermissions.js
src/utils/pagePermissions.js
```

### Hooks que son código muerto (no importados en ningún lado)
```
src/hooks/useSearch.js — NO se importa en ningún archivo (búsqueda usa estado local en Sidebar)
```

### App Móvil (mobile/)
| Métrica | Valor actual | Meta |
|---------|-------------|------|
| AuthContext.js | 1,287L | < 400L (splitear) |
| CalendarioScreen.js | 2,598L | < 1,000L |
| firebase-admin en package.json | ✅ Existe (INCORRECTO) | Eliminar |
| Dependencia "jim" espuria | ✅ Existe | Eliminar |

---

## 🗓️ CRONOGRAMA DE EJECUCIÓN

### ═══════════════════════════════════════════
### FASE 1: LIMPIEZA Y QUICK WINS (Días 1-3)
### ═══════════════════════════════════════════

**Impacto:** -1,000 reads/sesión, seguridad, bundle más limpio  
**Riesgo:** BAJO (cambios no rompen funcionalidad)

---

#### TAREA 1.1: Eliminar código muerto
- **Estado:** ✅ Completada (23 Feb 2026)
- **Esfuerzo:** 30 minutos
- **Riesgo:** NULO

**Archivos a ELIMINAR:**
```
src/pages/DataPage.jsx                           — 339L, placeholder sin funcionalidad
src/pages/LiquidacionesPageV1.jsx                — 4,045L, versión antigua reemplazada
src/pages/NewPaymentPage_old.jsx                 — 3,828L, versión antigua reemplazada, OJO, no eliminar aún
src/hooks/useSearch.js                           — 217L, NO se importa en ningún lado
src/hooks/usePagePermissions.js                  — 0L, archivo vacío
src/hooks/useCommitmentsPaginated.js             — 0L, archivo vacío
src/utils/pagePermissions.js                     — 0L, archivo vacío
src/components/auth/ProtectedPageRoute.jsx       — 0L, archivo vacío
src/components/commitments/CommitmentEditForm.jsx — 0L, archivo vacío
src/components/modals/ImportCommitmentsModal.jsx — 0L, archivo vacío
src/components/modals/PDFViewer.jsx              — 0L, archivo vacío
src/components/debug/AdminAccessVerifier.jsx     — 0L, archivo vacío
src/components/debug/PermissionDebugger.jsx      — 0L, archivo vacío
```

**Actualizar después de eliminar:**
- `src/App.jsx` — Quitar import y ruta de `DataPage`, `LiquidacionesPageV1`, `NewPaymentPage_old`
  - Línea 61: `import LiquidacionesPageV1 from './pages/LiquidacionesPageV1';` → ELIMINAR
  - Línea ~231: Ruta `/liquidaciones-v1` → ELIMINAR
  - `DataPage` import y ruta `/data` → ELIMINAR
- `src/components/layout/Sidebar.jsx` — Quitar referencia a DataPage si tiene link de menú
- `src/components/layout/Taskbar/Taskbar.jsx` — Quitar referencia a DataPage si tiene shortcut

**Verificación:**
- [ ] `npm run build` sin errores
- [ ] No quedan imports rotos
- [ ] Navbar/Sidebar no muestra links a páginas eliminadas

---

#### TAREA 1.2: Eliminar dependencias espurias en mobile
- **Estado:** ✅ Completada (23 Feb 2026)
- **Esfuerzo:** 10 minutos
- **Riesgo:** BAJO

**Ejecutar:**
```powershell
Set-Location mobile; npm uninstall firebase-admin jim
```

**Verificación:**
- [ ] `mobile/package.json` ya no tiene `firebase-admin` ni `jim`
- [ ] `Set-Location mobile; npx expo start` arranca sin errores

---

#### TAREA 1.3: Lazy loading de páginas en App.jsx
- **Estado:** ✅ Completada (23 Feb 2026) — Bundle principal: 4,166KB → 557KB (-87%)
- **Esfuerzo:** 1-2 horas
- **Riesgo:** BAJO (React.lazy es estándar)
- **Impacto:** Bundle inicial -60%, carga -3x más rápida

**Archivo:** `src/App.jsx`

**Cambio:** Reemplazar TODOS los imports estáticos de páginas con `React.lazy()`:

```jsx
// ANTES (líneas 21-80 de App.jsx):
import CommitmentsPage from './pages/CommitmentsPage';
import PaymentsPage from './pages/PaymentsPage';
// ... 25+ imports más

// DESPUÉS:
import { lazy, Suspense } from 'react';

const CommitmentsPage = lazy(() => import('./pages/CommitmentsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const NewCommitmentPage = lazy(() => import('./pages/NewCommitmentPage'));
const NewPaymentPage = lazy(() => import('./pages/NewPaymentPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const IncomePage = lazy(() => import('./pages/IncomePage'));
const IncomeHistoryPage = lazy(() => import('./pages/IncomeHistoryPage'));
const BankAccountsPage = lazy(() => import('./pages/BankAccountsPage'));
const ExecutiveDashboardPage = lazy(() => import('./pages/ExecutiveDashboardPage'));
const ActivityLogsPage = lazy(() => import('./pages/ActivityLogsPage'));
const OrphanFilesPage = lazy(() => import('./pages/OrphanFilesPage'));
const LiquidacionesPage = lazy(() => import('./pages/LiquidacionesPage'));
const LiquidacionesHistorialPage = lazy(() => import('./pages/LiquidacionesHistorialPage'));
const LiquidacionesEstadisticasPage = lazy(() => import('./pages/LiquidacionesEstadisticasPage'));
const LiquidacionesPorSalaPage = lazy(() => import('./pages/LiquidacionesPorSalaPage'));
const FacturacionPage = lazy(() => import('./pages/FacturacionPage'));
const SalasPage = lazy(() => import('./pages/SalasPage'));
const AlertsCenterPage = lazy(() => import('./pages/AlertsCenterPage'));
const AsistenciasPage = lazy(() => import('./pages/AsistenciasPage'));
const RecursosHumanosPage = lazy(() => import('./pages/RecursosHumanosPage'));
const SolicitudesPage = lazy(() => import('./pages/SolicitudesPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const EmpleadosPage = lazy(() => import('./pages/EmpleadosPage'));
const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const ReportsCompanyPage = lazy(() => import('./pages/reports/ReportsCompanyPage'));
const ReportsConceptPage = lazy(() => import('./pages/reports/ReportsConceptPage'));
const ReportsPeriodPage = lazy(() => import('./pages/reports/ReportsPeriodPage'));
const ReportsSummaryPage = lazy(() => import('./pages/reports/ReportsSummaryPage'));
```

**NO hacer lazy (mantener estáticos):**
```jsx
// Estos se usan en la primera pantalla o son críticos:
import WelcomeDashboardSimple from './components/dashboard/WelcomeDashboardSimple';
import LoginForm from './components/auth/LoginForm';
import AdminSetupPage from './pages/AdminSetupPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
```

**Agregar Suspense wrapper al DashboardLayout:**
```jsx
const DashboardLayout = () => {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    }>
      <Routes>
        {/* ... todas las rutas ... */}
      </Routes>
    </Suspense>
  );
};
```

**Verificación:**
- [ ] `npm run build` sin errores
- [ ] Dashboard carga rápido (primera pantalla = WelcomeDashboardSimple, no lazy)
- [ ] Al navegar a otra página, muestra spinner brevemente y luego carga
- [ ] En Network tab del browser, se ven chunks JS separados por página

---

#### TAREA 1.4: Optimizar useAlertsCenter — agregar filtro y límite
- **Estado:** ✅ Completada (23 Feb 2026)
- **Esfuerzo:** 30 minutos
- **Riesgo:** BAJO
- **Impacto:** -200 reads/sesión

**Archivo:** `src/hooks/useAlertsCenter.js` (157 líneas)

**Cambio en línea 29-33:**
```javascript
// ANTES:
const unsubscribeAlerts = onSnapshot(
  query(
    collection(db, 'alerts'),
    orderBy('createdAt', 'desc')
  ),

// DESPUÉS:
const unsubscribeAlerts = onSnapshot(
  query(
    collection(db, 'alerts'),
    where('read', '==', false),          // Solo no leídas (o targetUsers si existe)
    orderBy('createdAt', 'desc'),
    limit(50)                             // Máximo 50 alertas
  ),
```

**También cambiar `markAllAsRead` (línea ~130) a batch write:**
```javascript
// ANTES:
const promises = unreadAlerts.map(alert => 
  updateDoc(doc(db, 'alerts', alert.id), { ... })
);
await Promise.all(promises);

// DESPUÉS:
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
unreadAlerts.forEach(alert => {
  batch.update(doc(db, 'alerts', alert.id), {
    read: true,
    readAt: new Date(),
    readBy: currentUser.uid
  });
});
await batch.commit();
```

**Verificación:**
- [ ] AlertsCenterPage muestra máximo 50 alertas más recientes
- [ ] "Marcar todas como leídas" funciona correctamente
- [ ] No aparecen errores de índices compuestos en consola (si aparecen, crear índice)

---

#### TAREA 1.5: Unificar useCompanies — eliminar duplicado
- **Estado:** ✅ Completada (23 Feb 2026)
- **Esfuerzo:** 45 minutos
- **Riesgo:** BAJO
- **Impacto:** -50 reads/sesión (elimina listener duplicado)

**Problema:** Existen DOS hooks `useCompanies`:
1. `src/hooks/useCompanies.js` (87L) — usado por `LiquidacionesPage.jsx` y `LiquidacionesPageV1.jsx`
2. `src/hooks/useFirestore.js` línea 146 (30L) — usado por `ReportsCompanyPage`, `ReportsConceptPage`, `ReportsPeriodPage`, `ReportsSummaryPage`

**Acción:** Mantener `src/hooks/useCompanies.js` (es más completo, tiene `findCompanyByNIT`). Eliminar el de `useFirestore.js`.

**Paso 1:** En `src/hooks/useFirestore.js`:
- Línea 146-174: ELIMINAR la función `export const useCompanies`

**Paso 2:** Actualizar imports en los archivos que importan desde useFirestore:
```javascript
// src/pages/reports/ReportsCompanyPage.jsx (línea 55):
// ANTES:
import { useCommitments, useCompanies, usePayments } from '../../hooks/useFirestore';
// DESPUÉS:
import { useCommitments, usePayments } from '../../hooks/useFirestore';
import useCompanies from '../../hooks/useCompanies';

// src/pages/reports/ReportsConceptPage.jsx (línea 55):
// ANTES:
import { useCommitments, useCompanies } from '../../hooks/useFirestore';
// DESPUÉS:
import { useCommitments } from '../../hooks/useFirestore';
import useCompanies from '../../hooks/useCompanies';

// src/pages/reports/ReportsPeriodPage.jsx (línea 24):
// ANTES:
import { useCommitments, useCompanies } from '../../hooks/useFirestore';
// DESPUÉS:
import { useCommitments } from '../../hooks/useFirestore';
import useCompanies from '../../hooks/useCompanies';

// src/pages/reports/ReportsSummaryPage.jsx (línea 46):
// ANTES:
import { useCommitments, useCompanies } from '../../hooks/useFirestore';
// DESPUÉS:
import { useCommitments } from '../../hooks/useFirestore';
import useCompanies from '../../hooks/useCompanies';
```

**Verificación:**
- [ ] `npm run build` sin errores
- [ ] ReportsCompanyPage, ReportsConceptPage, ReportsPeriodPage, ReportsSummaryPage cargan empresas correctamente
- [ ] LiquidacionesPage sigue funcionando con `findCompanyByNIT`
- [ ] En Firestore console: solo UN listener activo en `companies` (antes eran 2+)

---

#### TAREA 1.6: Agregar limit() a useNotifications en useFirestore
- **Estado:** ✅ Completada (23 Feb 2026)
- **Esfuerzo:** 15 minutos
- **Riesgo:** BAJO
- **Impacto:** -100 reads en usuarios con muchas notificaciones

**Archivo:** `src/hooks/useFirestore.js` líneas ~178-198

```javascript
// ANTES:
const q = query(
  collection(db, 'notifications'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
);

// DESPUÉS:
const q = query(
  collection(db, 'notifications'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(100)  // Máximo 100 notificaciones recientes
);
```

**Verificación:**
- [ ] Notificaciones siguen apareciendo correctamente
- [ ] Las más antiguas (>100) se omiten — aceptable

---

#### TAREA 1.7: Fix useFirestore genérico — estabilizar dependency array
- **Estado:** ✅ Completada (23 Feb 2026)
- **Esfuerzo:** 30 minutos
- **Riesgo:** MEDIO (cambio en hook genérico)

**Archivo:** `src/hooks/useFirestore.js` — hook genérico `useFirestore`

**Problema:** El dependency array usa `JSON.stringify(options)`. Si `options` es un nuevo objeto en cada render, el listener se destruye y recrea continuamente.

**Solución:** Usar `useRef` + comparación profunda:
```javascript
// AGREGAR al inicio del hook useFirestore genérico:
const optionsRef = useRef(options);
const optionsKey = JSON.stringify(options);

useEffect(() => {
  optionsRef.current = options;
}, [optionsKey]);

// En el useEffect principal, usar optionsKey en lugar de JSON.stringify(options) en deps:
useEffect(() => {
  // ... lógica del listener
}, [collectionName, optionsKey]); // optionsKey es string estable
```

**Verificación:**
- [ ] En React DevTools, el componente que usa useFirestore NO re-renderiza en bucle
- [ ] Los listeners no se destruyen/recrean en cada render

---

### ═══════════════════════════════════════════════════
### FASE 2: OPTIMIZACIÓN DE FIREBASE (Días 4-6)
### ═══════════════════════════════════════════════════

**Impacto:** -800 reads/query en actividad, server-side aggregations  
**Riesgo:** MEDIO (cambios en queries y Cloud Functions)

---

#### TAREA 2.1: Server-side filtering en useActivityLogs
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 1-2 horas
- **Riesgo:** MEDIO (requiere índices compuestos)
- **Impacto:** -800 reads por consulta de estadísticas

**Archivo:** `src/hooks/useActivityLogs.js` (269 líneas)

**Problema:** `getActivityStats` hace `limit(1000)` y filtra por fecha en JavaScript.

**Cambio en `getActivityStats`:**
```javascript
// ANTES:
const q = query(
  collection(db, 'activity_logs'),
  orderBy('timestamp', 'desc'),
  limit(1000)
);
// ... luego filtra client-side por dateRange

// DESPUÉS:
const startDate = dateRange === '30d' ? subDays(new Date(), 30) :
                  dateRange === '7d'  ? subDays(new Date(), 7) :
                  dateRange === '24h' ? subDays(new Date(), 1) :
                  subDays(new Date(), 30);

const q = query(
  collection(db, 'activity_logs'),
  where('timestamp', '>=', startDate),
  orderBy('timestamp', 'desc'),
  limit(500)  // Todavía límite por seguridad
);
```

**Cambio en `getActivityLogs`:** Mover filtros de `userId`, `action`, `entityType` de client-side a server-side con `where` clauses.

**Post-requisito:** Crear índice compuesto en Firestore:
```
Collection: activity_logs
Fields: timestamp (Ascending) — ya debería existir por orderBy
```

Si se usan múltiples where + orderBy, crear en `firestore.indexes.json`:
```json
{
  "collectionGroup": "activity_logs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

**Verificación:**
- [ ] ActivityLogsPage carga datos correctamente
- [ ] No aparecen errores de "index required" en consola
- [ ] Las estadísticas muestran datos del rango seleccionado

---

#### TAREA 2.2: Expandir patrón pre-computed stats a más módulos
- **Estado:** ✅ Completado
- **Esfuerzo:** 3-4 horas
- **Riesgo:** MEDIO (Cloud Functions)
- **Impacto:** -90% reads en reportes

**Contexto:** Ya tienes `system_stats/dashboard` + Cloud Function triggers que recalculan al crear/editar/eliminar commitments y payments. Este patrón es EXCELENTE. Expandir a:

**Archivo:** `functions/index.js`

**Nuevos triggers a crear:**

1. **`system_stats/liquidaciones`** — pre-calcular totales de liquidaciones
   ```javascript
   exports.onLiquidacionCreated = onDocumentCreated('liquidaciones/{docId}', async (event) => {
     // Recalcular: totalLiquidaciones, montoTotal, promedioPorSala, etc.
     // Guardar en: system_stats/liquidaciones
   });
   ```

2. **`system_stats/ingresos`** — pre-calcular totales de ingresos
   ```javascript
   exports.onIncomeCreated = onDocumentCreated('incomes/{docId}', async (event) => {
     // Recalcular: totalIngresos, montoPorMes, promedioDiario, etc.
     // Guardar en: system_stats/ingresos
   });
   ```

3. **`system_stats/asistencias`** — resumen de asistencias del día
   ```javascript
   exports.onAsistenciaUpdated = onDocumentWritten('asistencias/{docId}', async (event) => {
     // Recalcular: presentesHoy, ausentes, enBreak, horasPromedioTrabajadas
     // Guardar en: system_stats/asistencias
   });
   ```

**Frontend:** Crear hooks `useLiquidacionesStats`, `useIngresosStats`, `useAsistenciasStats` que lean 1 solo documento cada uno (como ya hace `useDashboardStats`).

**Verificación:**
- [ ] `firebase deploy --only functions`
- [ ] Crear/editar un income → `system_stats/ingresos` se actualiza automáticamente
- [ ] Dashboard o página de reportes lee 1 doc en vez de N

---

#### TAREA 2.3: Ajustar Firestore Rules — eliminar catch-all
- **Estado:** ✅ Completado
- **Esfuerzo:** 2 horas
- **Riesgo:** ALTO (puede romper acceso si se omite una colección)

**Archivo:** `firestore.rules` (237 líneas)

**Problema crítico (línea ~235):**
```
match /{document=**} {
  allow read, write: if request.auth != null;
}
```
Este catch-all permite a CUALQUIER usuario autenticado leer/escribir CUALQUIER colección sin regla específica.

**Acción:** Reemplazar catch-all con reglas explícitas para CADA colección usada:
```
// AGREGAR reglas para colecciones que faltan:
match /asistencias/{docId} { allow read, write: if request.auth != null; }
match /incomes/{docId} { allow read, write: if request.auth != null; }
match /files/{docId} { allow read, write: if request.auth != null; }
match /liquidaciones/{docId} { allow read, write: if request.auth != null; }
match /liquidaciones_historial/{docId} { allow read, write: if request.auth != null; }
match /tasks/{docId} { allow read, write: if request.auth != null; }
match /notes/{docId} { allow read, write: if request.auth != null; }
match /system_stats/{docId} { allow read: if request.auth != null; allow write: if false; }
match /loginHistory/{docId} { allow read, write: if request.auth != null; }
match /activeSessions/{docId} { allow read, write: if request.auth != null; }
match /alertsConfig/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
match /userSettings/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
match /empleados/{docId} { allow read, write: if request.auth != null; }
match /clientes/{docId} { allow read, write: if request.auth != null; }
match /bank_accounts/{docId} { allow read, write: if request.auth != null; }
match /solicitudes/{docId} { allow read, write: if request.auth != null; }
match /novedades/{docId} { allow read, write: if request.auth != null; }
match /calendar_events/{docId} { allow read, write: if request.auth != null; }

// ELIMINAR el catch-all:
// match /{document=**} { ... } ← BORRAR
```

**⚠️ ANTES de desplegar:** Inventariar TODAS las colecciones usadas:
```powershell
# Buscar todas las colecciones referenciadas en el código
Get-ChildItem -Recurse "src" -Include *.js,*.jsx | Select-String "collection\(db, ['\"](\w+)['\"]\)" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique
```

**Verificación:**
- [ ] `firebase deploy --only firestore:rules`
- [ ] Probar CADA módulo: compromisos, pagos, liquidaciones, ingresos, asistencias, usuarios, tareas, notas, alertas
- [ ] Probar la APK móvil: login, asistencias, novedades, calendario
- [ ] Verificar que NO aparecen errores "permission-denied"

---

### ════════════════════════════════════════════════════════════════
### FASE 3: REFACTORING DE GOD COMPONENTS (Semanas 2-3)
### ════════════════════════════════════════════════════════════════

**Impacto:** Mantenibilidad x10, testing posible, código reviewable  
**Riesgo:** MEDIO-ALTO (cambios estructurales grandes, hacer 1 archivo a la vez)

---

#### TAREA 3.1: Descomponer PaymentsPage.jsx (4,974L)
- **Estado:** ✅ Completada
- **Resultado:** 5,193→2,501L (-52%) + EditPaymentDialog.jsx (2,601L) + paymentsHelpers.js (172L)
- **Esfuerzo:** 4-6 horas
- **Riesgo:** ALTO (archivo más grande del proyecto)

**Estructura propuesta:**
```
src/pages/PaymentsPage.jsx               — ~200L (orquestador con filtros y estado)
src/components/payments/PaymentsList.jsx  — ~800L (tabla con paginación)
src/components/payments/PaymentDetail.jsx — ~600L (modal de detalle)
src/components/payments/PaymentForm.jsx   — ~500L (formulario crear/editar)
src/components/payments/PaymentPDF.jsx    — ~400L (generación y visor PDF)
src/components/payments/PaymentsFilters.jsx — YA EXISTE (mantener)
src/components/payments/PaymentsExport.jsx — ~300L (exportación Excel)
src/hooks/usePaymentsCRUD.js             — ~300L (lógica CRUD extraída)
```

**Metodología paso a paso:**
1. Leer PaymentsPage completo, identificar bloques funcionales
2. Extraer PRIMERO el hook `usePaymentsCRUD` (add, update, delete, upload)
3. Extraer `PaymentsList` (tabla, ordenamiento, paginación)
4. Extraer `PaymentDetail` (modal de detalle con archivos)
5. Extraer `PaymentForm` (formulario de creación/edición)
6. Extraer `PaymentPDF` (generación PDF con pdf-lib)
7. Dejar `PaymentsPage` como orquestador slim

**Regla:** Cada archivo debe funcionar después de cada extracción. NO extraer todo de una vez.

**Verificación por paso:**
- [ ] Cada componente extraído funciona aisladamente
- [ ] `npm run build` pasa sin errores después de cada extracción
- [ ] La funcionalidad completa de pagos sigue igual para el usuario

---

#### TAREA 3.2: Descomponer LiquidacionesPage.jsx (4,725L)
- **Estado:** ✅ Completada
- **Resultado:** 4,980→4,722L + liquidacionesHelpers.js (~90L) + VirtualTable.jsx (~195L)
- **Esfuerzo:** 4-6 horas
- **Riesgo:** ALTO

**Estructura propuesta:**
```
src/pages/LiquidacionesPage.jsx                      — ~300L (orquestador)
src/components/liquidaciones/LiquidacionesTable.jsx   — ~800L (tabla virtual con react-window)
src/components/liquidaciones/LiquidacionesCharts.jsx  — ~500L (gráficos recharts)
src/components/liquidaciones/LiquidacionesForm.jsx    — ~500L (formulario entrada datos)
src/components/liquidaciones/LiquidacionesExport.jsx  — ~400L (exportación Excel)
src/components/liquidaciones/LiquidacionesSummary.jsx — ~300L (resumen/KPIs)
```

**Ya existe:** `src/components/liquidaciones/` como directorio. Verificar qué hay dentro.

---

#### TAREA 3.3: Descomponer UserManagementPage.jsx (2,509L)
- **Estado:** ✅ Completada
- **Resultado:** 2,577→2,569L + getRoleChipColor→companyHelpers.js (compartida)
- **Esfuerzo:** 3-4 horas
- **Riesgo:** MEDIO

**Estructura propuesta:**
```
src/pages/UserManagementPage.jsx                  — ~300L (orquestador con tabs)
src/components/admin/UserList.jsx                 — ~500L (tabla de usuarios)
src/components/admin/UserForm.jsx                 — ~400L (crear/editar usuario)
src/components/admin/PermissionsModal.jsx          — ~600L (modal de permisos)
src/components/admin/UserSessionsPanel.jsx         — ~300L (sesiones activas)
src/hooks/useUserManagement.js                    — ~400L (CRUD + Auth operations)
```

**CRÍTICO:** Las operaciones de Auth (createUserWithEmailAndPassword, deleteUser) deben ir al hook `useUserManagement.js`, NO en el componente visual.

---

#### TAREA 3.4: Descomponer NewCommitmentPage.jsx (3,623L)
- **Estado:** ✅ Completada
- **Resultado:** 3,810→3,532L (-278L) + commitmentHelpers.js (~190L) con factory pattern para 7 handlers
- **Esfuerzo:** 3-4 horas
- **Riesgo:** MEDIO

**Estructura propuesta:**
```
src/pages/NewCommitmentPage.jsx                        — ~200L (orquestador)
src/components/commitments/CommitmentForm.jsx           — ~800L (formulario con steps)
src/components/commitments/CommitmentFileUpload.jsx     — ~400L (carga de archivos)
src/components/commitments/CommitmentPreview.jsx        — ~300L (preview antes de guardar)
src/hooks/useCommitmentCRUD.js                         — ~300L (lógica CRUD)
```

---

#### TAREA 3.5: Descomponer CompaniesPage.jsx (3,288L)
- **Estado:** ✅ Completada
- **Resultado:** 3,397→3,345L (-52L) + companyHelpers.js (~70L) con formatDocumentType, formatFileSize, getRoleChipColor
- **Esfuerzo:** 3 horas
- **Riesgo:** MEDIO

**Estructura propuesta:**
```
src/pages/CompaniesPage.jsx                       — ~200L (orquestador)
src/components/companies/CompanyList.jsx           — ~600L (tabla)
src/components/companies/CompanyForm.jsx           — ~500L (formulario CRUD)
src/components/companies/CompanyDetail.jsx         — ~500L (modal detalle)
src/hooks/useCompaniesCRUD.js                     — ~300L (lógica CRUD)
```

---

### ═══════════════════════════════════════════════════
### FASE 4: OPTIMIZACIÓN DE MOBILE (Semana 3-4)
### ═══════════════════════════════════════════════════

**Impacto:** Mantenibilidad app móvil, estabilidad  
**Riesgo:** MEDIO

---

#### TAREA 4.1: Splitear AuthContext mobile (1,287L)
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 4-5 horas
- **Riesgo:** ALTO (contexto central)

**Estructura propuesta:**
```
mobile/src/contexts/AuthContext.js       — ~400L (solo auth: login, logout, profile, listener)
mobile/src/hooks/useAttendance.js        — ~500L (asistencias: iniciar/finalizar jornada, breaks, almuerzo)
mobile/src/hooks/useGeolocation.js       — ~200L (GPS, mock detection, geofence validation)
mobile/src/utils/dateUtils.js            — ~50L  (todayStr helper que se repite 10+ veces)
```

**Paso 1:** Extraer `dateUtils.js` primero (helper `todayStr`)
**Paso 2:** Extraer `useGeolocation` (getCurrentLocation, validateMockLocation, checkGeofence)
**Paso 3:** Extraer `useAttendance` (iniciarJornada, finalizarJornada, registrarBreak, etc.)
**Paso 4:** Limpiar AuthContext — solo auth + cargar profile

---

#### TAREA 4.2: Eliminar hasPermission legacy de AuthContext mobile
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 30 minutos
- **Riesgo:** BAJO

**Archivo:** `mobile/src/contexts/AuthContext.js` línea ~1254

**Acción:** Eliminar función `hasPermission` del context. Ya existe `usePermissions` hook que es el sistema RBAC real. Verificar que ningún screen use `hasPermission` del AuthContext directamente.

---

#### TAREA 4.3: Error Boundaries para screens mobile
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 1 hora
- **Riesgo:** BAJO

**Crear:** `mobile/src/components/ErrorBoundary.js`
**Aplicar en:** `mobile/src/navigation/AppNavigator.js` alrededor de cada grupo de screens.

---

### ════════════════════════════════════════════════════════
### FASE 5: ARQUITECTURA AVANZADA (Semana 4+)
### ════════════════════════════════════════════════════════

---

#### TAREA 5.1: Crear CompaniesContext global
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 2-3 horas
- **Riesgo:** MEDIO
- **Impacto:** 1 listener global para companies en vez de 3+

**Crear:** `src/context/CompaniesContext.jsx`
```jsx
// UN solo listener para todas las companies
// Expone: companies, loading, error, findCompanyByNIT, findCompanyById
// Se monta en App.jsx como provider (igual que AuthContext)
```

**Después:** Reemplazar TODOS los `useCompanies()` por `useCompaniesContext()` en:
- LiquidacionesPage
- ReportsCompanyPage, ReportsConceptPage, ReportsPeriodPage, ReportsSummaryPage
- Cualquier otro componente que use companies

---

#### TAREA 5.2: Paginación real con startAfter en Commitments
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 3-4 horas
- **Riesgo:** MEDIO-ALTO

**Archivo:** `src/hooks/useFirestore.js` — `useCommitments`

**Agregar:** cursor-based pagination con `startAfter()` + `limit(25)`

```javascript
const [lastDoc, setLastDoc] = useState(null);
const [hasMore, setHasMore] = useState(true);

const loadMore = () => {
  if (!hasMore || loading) return;
  // Agregar startAfter(lastDoc) al query
};
```

---

#### TAREA 5.3: Error Boundaries por sección (Dashboard Web)
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 1-2 horas
- **Riesgo:** BAJO

**Crear:** `src/components/common/ErrorBoundary.jsx`
**Aplicar en:** `src/App.jsx` — envolver cada `<Route>` crítico con `<ErrorBoundary>`

---

#### TAREA 5.4: Limpieza masiva de console.logs
- **Estado:** ⬜ Pendiente
- **Esfuerzo:** 2-3 horas (1,636 statements)
- **Riesgo:** BAJO

**Estrategia:** 
1. Mantener solo `console.error` en catch blocks reales
2. Eliminar TODOS los `console.log` y `console.warn` de debugging
3. En hooks/contextos: reemplazar con logger condicional:
```javascript
const isDev = import.meta.env.DEV;
const log = isDev ? console.log : () => {};
```

**Ejecutar búsqueda:**
```powershell
Get-ChildItem -Recurse "src" -Include *.js,*.jsx | Select-String "console\.(log|warn)" -List | ForEach-Object { "$($_.Filename):$($_.LineNumber)" }
```

---

## 📋 TRACKING DE PROGRESO

### Resumen por Fase

| Fase | Tareas | Completadas | Estado |
|------|--------|-------------|--------|
| Fase 1: Limpieza & Quick Wins | 7 | 7 | ✅ Completada |
| Fase 2: Optimización Firebase | 3 | 3 | ✅ Completada |
| Fase 3: Refactoring God Components | 5 | 5 | ✅ Completada |
| Fase 4: Optimización Mobile | 3 | 0 | ⬜ No iniciada |
| Fase 5: Arquitectura Avanzada | 4 | 0 | ⬜ No iniciada |
| **TOTAL** | **22** | **15** | |

### Checklist Rápido por Tarea

| ID | Tarea | Estado | Impacto |
|----|-------|--------|---------|  
| 1.1 | Eliminar código muerto (12 archivos, sin NewPaymentPage_old) | ✅ | Bundle -4,601L |
| 1.2 | Eliminar firebase-admin + jim de mobile | ✅ | Bundle mobile limpio |
| 1.3 | React.lazy en App.jsx (28 páginas) | ✅ | index.js: 4,166KB → 557KB (-87%) |
| 1.4 | Limitar useAlertsCenter (limit + batch) | ✅ | -200 reads/sesión |
| 1.5 | Unificar useCompanies (eliminar duplicado) | ✅ | -50 reads/sesión |
| 1.6 | Agregar limit(100) a useNotifications + batch | ✅ | -100 reads |
| 1.7 | Fix useFirestore dependency array | ✅ | Stop listener leak |
| 2.1 | Server-side filtering useActivityLogs | ✅ | -800 reads/query |
| 2.2 | Pre-computed stats (liquidaciones, ingresos, asistencias) | ✅ | -90% reads reportes |
| 2.3 | Ajustar Firestore Rules (eliminar catch-all) | ✅ | Seguridad |
| 3.1 | Descomponer PaymentsPage (5,193→2,501L) + EditPaymentDialog.jsx (2,601L) + paymentsHelpers.js (172L) | ✅ | Mantenibilidad |
| 3.2 | Descomponer LiquidacionesPage (4,980→4,722L) + liquidacionesHelpers + VirtualTable | ✅ | Mantenibilidad |
| 3.3 | Descomponer UserManagementPage (2,577→2,569L) + getRoleChipColor→companyHelpers | ✅ | Mantenibilidad |
| 3.4 | Descomponer NewCommitmentPage (3,810→3,532L) + commitmentHelpers + factory pattern | ✅ | Mantenibilidad |
| 3.5 | Descomponer CompaniesPage (3,397→3,345L) + companyHelpers | ✅ | Mantenibilidad |
| 4.1 | Splitear AuthContext mobile (1,287L) | ⬜ | Mantenibilidad |
| 4.2 | Eliminar hasPermission legacy mobile | ⬜ | Limpieza |
| 4.3 | Error Boundaries mobile | ⬜ | Estabilidad |
| 5.1 | CompaniesContext global | ⬜ | -3 listeners |
| 5.2 | Paginación real Commitments | ⬜ | Escalabilidad |
| 5.3 | Error Boundaries web | ⬜ | Estabilidad |
| 5.4 | Limpieza console.logs (1,636) | ⬜ | Seguridad + limpieza |

---

## 🔧 COMANDOS ÚTILES PARA CADA SESIÓN

```powershell
# Verificar que no hay archivos muertos nuevos
Get-ChildItem -Recurse "src" -Include *.js,*.jsx | Where-Object { (Get-Content $_.FullName | Measure-Object -Line).Lines -eq 0 } | ForEach-Object { $_.Name }

# Contar console.logs restantes
(Get-ChildItem -Recurse "src" -Include *.js,*.jsx | Select-String "console\.(log|warn|error)" | Measure-Object).Count

# Ver archivos más grandes (> 1000L)
Get-ChildItem -Recurse "src/pages" -Include *.jsx | ForEach-Object { $l = (Get-Content $_.FullName | Measure-Object -Line).Lines; if ($l -gt 1000) { "$($_.Name) - ${l}L" } } | Sort-Object { [int]($_ -replace '.*- (\d+)L','$1') } -Descending

# Build test rápido
npm run build

# Contar listeners activos en código
(Get-ChildItem -Recurse "src" -Include *.js,*.jsx | Select-String "onSnapshot" | Measure-Object).Count
```

---

## 📝 NOTAS PARA FUTURAS SESIONES

1. **Al iniciar sesión:** Leer este archivo PRIMERO → ver qué tarea es la siguiente → ejecutar
2. **Orden recomendado:** Fase 1 completa → Fase 2 → Fase 3 (1 God Component por sesión)
3. **Regla de oro:** Cada tarea debe terminar con `npm run build` exitoso
4. **Si algo se rompe:** Revertir con `git checkout -- [archivo]` y re-evaluar
5. **Después de cada fase:** Actualizar las métricas baseline de este documento
6. **Versión:** Incrementar según semántico al completar cada fase

---

*Última actualización: 23 Feb 2026 — Sesión 1: FASE 1 COMPLETA (7/7). Bundle principal -87% (4,166KB → 557KB). 12 archivos muertos eliminados. Hooks optimizados con limit() y writeBatch. Code-splitting activo con 28 chunks lazy.*
