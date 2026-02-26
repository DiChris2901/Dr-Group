# 🔧 IMPLEMENTACIÓN REACT QUERY — DR GROUP DASHBOARD

> **Versión:** 1.0.0  
> **Fecha:** Febrero 2026  
> **Proyecto:** DR Group Dashboard v3.16.2  
> **Objetivo:** Reducir lecturas de Firestore ~70-75% mediante cache inteligente con React Query (TanStack Query)

---

## 📋 TABLA DE CONTENIDOS

1. [Diagnóstico Actual](#1-diagnóstico-actual)
2. [Arquitectura Propuesta](#2-arquitectura-propuesta)
3. [Fase 0: Instalación y Configuración Base](#3-fase-0-instalación-y-configuración-base)
4. [Fase 1: QueryClient Provider](#4-fase-1-queryclient-provider)
5. [Fase 2: Hooks Centralizados de Firestore](#5-fase-2-hooks-centralizados-de-firestore)
6. [Fase 3: Eliminar Listeners Duplicados de `companies`](#6-fase-3-eliminar-listeners-duplicados-de-companies)
7. [Fase 4: Migrar Hooks Principales](#7-fase-4-migrar-hooks-principales)
8. [Fase 5: Migrar Páginas Pesadas](#8-fase-5-migrar-páginas-pesadas)
9. [Fase 6: Resolver Patrón N+1](#9-fase-6-resolver-patrón-n1)
10. [Fase 7: Persistencia en localStorage](#10-fase-7-persistencia-en-localstorage)
11. [Fase 8: Debounce en Búsqueda Global](#11-fase-8-debounce-en-búsqueda-global)
12. [Mapa de Archivos Afectados](#12-mapa-de-archivos-afectados)
13. [Testing y Validación](#13-testing-y-validación)
14. [Métricas de Éxito](#14-métricas-de-éxito)

---

## 1. DIAGNÓSTICO ACTUAL

### 1.1 Resumen de Operaciones Firestore

| Métrica | Valor Actual |
|---------|-------------|
| **Colecciones Firestore accedidas** | 30 únicas |
| **Listeners activos (onSnapshot)** | ~52 en total, ~5 siempre activos por sesión |
| **Lecturas one-time (getDocs/getDoc)** | ~80+ puntos de acceso |
| **Total puntos de acceso Firestore** | ~264 (web 167 + mobile 67 + functions 30) |
| **Cache actual (localStorage)** | 6 claves (solo Settings, Auth, Favorites, Storage, Notifications) |

### 1.2 Problemas Críticos Identificados

#### 🔴 P1: 10+ Listeners DUPLICADOS en `companies`

La colección `companies` tiene **1 listener legítimo** en `CompaniesContext.jsx` (L39) y **9+ listeners duplicados** en:

| Archivo | Línea | Tipo | Impacto |
|---------|-------|------|---------|
| `CompaniesPage.jsx` | L295 | `onSnapshot` | Duplicado exacto del Context |
| `IncomePage.jsx` | L254 | `onSnapshot` | Duplicado exacto del Context |
| `BankAccountsPage.jsx` | L139 | `onSnapshot` | Duplicado exacto del Context |
| `IncomeHistoryPage.jsx` | L154 | `onSnapshot` | Duplicado exacto del Context |
| `EmpleadosPage.jsx` | L209 | `onSnapshot` | Duplicado exacto del Context |
| `SalasPage.jsx` | L206 | `onSnapshot` | Duplicado exacto del Context |
| `NewCommitmentPage.jsx` | L304 | `onSnapshot` | Duplicado exacto del Context |
| `PaymentsPage.jsx` | L614 | `managedOnSnapshot` | Duplicado exacto del Context |
| `useContractExpirationAlerts.js` | L37 | `onSnapshot` | Duplicado + lee TODA la colección |
| `CommitmentsFilters.jsx` | L73 | `getDocs` | Lectura one-time redundante |

**Costo:** Cada vez que un usuario visita estas páginas, Firebase cobra por un nuevo listener idéntico. Con 10 páginas abiertas en una sesión → 10× el costo necesario para `companies`.

#### 🔴 P2: Patrón N+1 en PaymentsPage

```
PaymentsPage.jsx L251:
- getDocs(payments) → obtiene N pagos
- POR CADA pago: getDoc(commitments/{commitmentId})
- Con 100 pagos = 101 lecturas (1 + 100)
```

#### 🔴 P3: Patrón N+1 en useCommitmentPaymentStatus

```
useCommitmentPaymentStatus.js L33:
- Crea 1 onSnapshot POR commitment visible
- Con 50 compromisos en pantalla = 50 listeners activos simultáneos
```

#### 🔴 P4: Búsqueda Global sin Debounce

```
DashboardHeader.jsx L214-285:
- getDocs en 4 colecciones (commitments, companies, payments, users)
- Se dispara en CADA tecla presionada
- Escribir "factura" = 7 caracteres × 4 colecciones = 28 lecturas
```

#### 🟡 P5: Hook Duplicado useCommitments

Existen DOS versiones del mismo hook:
- `src/hooks/useFirestore.js` → `useCommitments` con `onSnapshot` (real-time)
- `src/hooks/useCommitments.js` → `useCommitments` con `getDocs` (one-time)

Esto puede causar confusión y comportamiento inconsistente.

#### 🟡 P6: SettingsContext con 2 Listeners

`SettingsContext.jsx` abre 2 listeners separados por usuario:
- L613: `onSnapshot(doc(db,'users',uid))` — solo para colores
- L625: `onSnapshot(doc(db,'userSettings',uid))` — configuraciones

Podrían consolidarse en 1 listener con merge client-side.

### 1.3 Cache Existente (Ya Funcional — NO Tocar)

Estos patrones **ya están bien implementados** y NO necesitan migración a React Query:

| Fuente | Clave localStorage | TTL | Estrategia |
|--------|-------------------|-----|-----------|
| `AuthContext.jsx` | `drgroup-userProfile` | Sesión | Cache → Firestore → Actualizar cache |
| `SettingsContext.jsx` | `drgroup-settings` | Sesión | Inicializar desde cache → listener actualiza |
| `useStorageStats.js` | `drgroup-storage-stats` | 30 min | TTL + guard contra concurrent fetches |
| `useFavorites.js` | `taskbar_favorites_{uid}` | Manual | Cache → Firestore → Sync |
| `NotificationsContext.jsx` | `dr_group_resolved_alerts` | N/A | Persistencia de estado descartado |
| `NotificationsContext.jsx` | `dr_group_dismissed_notifications` | 24h cleanup | Trim a 500 máximo |

### 1.4 Infraestructura Existente (Reutilizar)

| Componente | Archivo | Uso |
|-----------|---------|-----|
| `enableIndexedDbPersistence` | `src/config/firebase.js` L50 | Firestore SDK ya cachea en IndexedDB |
| `ListenerManager` | `src/utils/listenerManager.js` | Gestión global de listeners (solo usado por PaymentsPage) |
| `CompaniesContext` | `src/context/CompaniesContext.jsx` | Patrón de listener compartido (modelo correcto) |
| Lazy Loading | `src/App.jsx` L30-60 | Code splitting ya implementado con `React.lazy()` |

---

## 2. ARQUITECTURA PROPUESTA

### 2.1 Estrategia de 3 Niveles

```
┌─────────────────────────────────────────────────────┐
│                    NIVEL 3                          │
│         localStorage (persistQueryClient)           │
│     Datos sobreviven cierre de pestaña/refresh      │
│             TTL configurable por query              │
│                 (24h por defecto)                    │
├─────────────────────────────────────────────────────┤
│                    NIVEL 2                          │
│          React Query In-Memory Cache                │
│       staleTime + gcTime por tipo de dato           │
│        Deduplicación automática de queries          │
│     Navegación entre páginas = 0 lecturas           │
├─────────────────────────────────────────────────────┤
│                    NIVEL 1                          │
│       Firestore IndexedDB Persistence               │
│    (Ya existente - enableIndexedDbPersistence)      │
│    Cache offline automático del SDK de Firebase     │
└─────────────────────────────────────────────────────┘
```

### 2.2 Decisión: ¿Qué Migrar a React Query y Qué NO?

#### ✅ MIGRAR a React Query (datos que se leen frecuentemente):

| Tipo de Dato | Colecciones | Patrón Actual | Patrón Nuevo |
|-------------|-------------|--------------|-------------|
| **Datos de referencia** | `companies`, `salas`, `providers`, `users` (lista) | onSnapshot duplicados | `useQuery` + staleTime largo |
| **Datos de trabajo** | `commitments`, `payments`, `incomes` | onSnapshot/getDocs | `useQuery` + invalidación en mutaciones |
| **Datos de configuración** | `system_config`, `calendar_events` | getDoc/getDocs | `useQuery` + staleTime largo |
| **Datos bajo demanda** | `activity_logs`, `novedades`, `sala_changes` | getDocs manual | `useQuery` + enabled flag |

#### ❌ NO MIGRAR (mantener onSnapshot real-time):

| Tipo de Dato | Colecciones | Razón |
|-------------|-------------|-------|
| **Perfil del usuario** | `users/{uid}` | Ya tiene cache en localStorage + necesita real-time para cambios de permisos |
| **Settings del usuario** | `userSettings/{uid}` | Ya tiene cache en localStorage + real-time para sincronización entre pestañas |
| **Notificaciones** | `notifications` | Necesita real-time para alertas inmediatas |
| **Alertas** | `alerts`, `alertsConfig` | Necesita real-time para alertas críticas |
| **Presencia** | RTDB `/status/{uid}` | Real-time Database, no Firestore |

### 2.3 Tiempos de Cache por Tipo de Dato

```javascript
// Datos de referencia (cambian raramente)
const REFERENCE_DATA = {
  staleTime: 10 * 60 * 1000,  // 10 min → no refetch si datos tienen <10 min
  gcTime: 30 * 60 * 1000,     // 30 min → mantener en memoria 30 min sin uso
};

// Datos de trabajo (cambian con frecuencia moderada)
const WORK_DATA = {
  staleTime: 2 * 60 * 1000,   // 2 min → datos "frescos" por 2 min
  gcTime: 10 * 60 * 1000,     // 10 min → mantener 10 min sin uso
};

// Datos de configuración (casi nunca cambian)
const CONFIG_DATA = {
  staleTime: 30 * 60 * 1000,  // 30 min
  gcTime: 60 * 60 * 1000,     // 1 hora
};

// Datos bajo demanda (solo cuando usuario lo solicita)
const ON_DEMAND_DATA = {
  staleTime: 5 * 60 * 1000,   // 5 min
  gcTime: 15 * 60 * 1000,     // 15 min
  enabled: false,              // No cargar automáticamente
};
```

---

## 3. FASE 0: INSTALACIÓN Y CONFIGURACIÓN BASE

### 3.1 Instalar Dependencia

```powershell
npm install @tanstack/react-query
```

**Paquete único necesario.** No instalar `@tanstack/react-query-devtools` en producción.

Para desarrollo (opcional, muy útil para debugging):
```powershell
npm install -D @tanstack/react-query-devtools
```

### 3.2 Verificación Post-Instalación

```powershell
npm ls @tanstack/react-query
```

Debe mostrar versión `^5.x.x`. React Query v5 requiere React 18+ (ya lo tenemos: `react: "^18.3.1"`).

---

## 4. FASE 1: QUERYCLIENT PROVIDER

### 4.1 Crear archivo: `src/config/queryClient.js`

```javascript
import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración global de React Query para DR Group Dashboard.
 * 
 * ESTRATEGIA:
 * - staleTime: 5 min (datos "frescos" por 5 min → no se refetch)
 * - gcTime: 30 min (datos sin uso se eliminan de memoria tras 30 min)
 * - refetchOnWindowFocus: false (no refetch al volver a la pestaña)
 * - retry: 1 (un solo reintento en error, evita spam a Firestore)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutos
      gcTime: 30 * 60 * 1000,           // 30 minutos (antes "cacheTime")
      refetchOnWindowFocus: false,       // NO refetch al cambiar de pestaña
      refetchOnReconnect: true,          // SÍ refetch al reconectar internet
      refetchOnMount: false,             // NO refetch si datos están fresh
      retry: 1,                          // 1 reintento en caso de error
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 0,                          // No reintentar mutaciones
    },
  },
});

/**
 * Constantes de tiempo reutilizables para staleTime/gcTime.
 * Importar estas constantes en hooks en lugar de hardcodear números.
 */
export const CACHE_TIMES = {
  /** Datos de referencia: companies, salas, providers, users list */
  REFERENCE: {
    staleTime: 10 * 60 * 1000,  // 10 minutos
    gcTime: 30 * 60 * 1000,     // 30 minutos
  },
  /** Datos de trabajo: commitments, payments, incomes */
  WORK: {
    staleTime: 2 * 60 * 1000,   // 2 minutos
    gcTime: 10 * 60 * 1000,     // 10 minutos
  },
  /** Datos de config: system_config, calendar_events */
  CONFIG: {
    staleTime: 30 * 60 * 1000,  // 30 minutos
    gcTime: 60 * 60 * 1000,     // 1 hora
  },
  /** Datos bajo demanda: activity_logs, orphan scan */
  ON_DEMAND: {
    staleTime: 5 * 60 * 1000,   // 5 minutos
    gcTime: 15 * 60 * 1000,     // 15 minutos
  },
};

/**
 * Query Keys centralizadas.
 * REGLA: Todas las queryKey deben estar aquí para evitar colisiones
 * y facilitar invalidación cruzada.
 * 
 * Patrón: ['entidad', ...filtros]
 * Ejemplo: ['commitments', { company: 'abc', status: 'active' }]
 */
export const QUERY_KEYS = {
  // ─── Datos de Referencia ───
  companies: ['companies'],
  salas: ['salas'],
  salasWithChanges: (salaId) => ['salas', 'changes', salaId],
  providers: ['providers'],
  usersList: ['users', 'list'],
  usersWithFilter: (filter) => ['users', 'list', filter],
  
  // ─── Datos de Trabajo ───
  commitments: (filters) => ['commitments', filters ?? {}],
  commitmentsAll: ['commitments'],
  payments: (filters) => ['payments', filters ?? {}],
  paymentsAll: ['payments'],
  paymentsForCommitment: (commitmentId) => ['payments', 'commitment', commitmentId],
  incomes: (filters) => ['incomes', filters ?? {}],
  incomesAll: ['incomes'],
  personalAccounts: ['personalAccounts'],
  
  // ─── Datos de RRHH ───
  empleados: ['empleados'],
  solicitudes: (filters) => ['solicitudes', filters ?? {}],
  asistencias: (filters) => ['asistencias', filters ?? {}],
  novedades: (filters) => ['novedades', filters ?? {}],
  
  // ─── Liquidaciones ───
  liquidaciones: (filters) => ['liquidaciones', filters ?? {}],
  liquidacionesPorSala: (filters) => ['liquidaciones_por_sala', filters ?? {}],
  liquidacionDoc: (docId) => ['liquidaciones_por_sala', 'doc', docId],
  
  // ─── Datos de Config ───
  systemConfig: ['system_config'],
  calendarEvents: ['calendar_events'],
  
  // ─── Datos Bajo Demanda ───
  activityLogs: (filters) => ['activity_logs', filters ?? {}],
  salaChanges: (salaId) => ['sala_changes', salaId],
  pendingAuthUsers: ['pending_auth_users'],
  
  // ─── Delegated Tasks ───
  delegatedTasks: (filters) => ['delegated_tasks', filters ?? {}],
  delegatedTaskDoc: (taskId) => ['delegated_tasks', 'doc', taskId],
  
  // ─── Búsqueda Global ───
  globalSearch: (term) => ['search', 'global', term],
};
```

### 4.2 Integrar en `src/App.jsx`

**Cambios necesarios en App.jsx:**

```jsx
// AGREGAR estos imports al inicio del archivo:
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';

// OPCIONAL (solo desarrollo): Devtools para inspeccionar cache
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

**Modificar la función `App()`:**

```jsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <CustomThemeProvider>
          <CssBaseline />
          <AuthProvider>
            <CompaniesProvider>
            <NotificationsProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </NotificationsProvider>
            </CompaniesProvider>
          </AuthProvider>
        </CustomThemeProvider>
      </SettingsProvider>
      {/* OPCIONAL: Descomentar para desarrollo */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
```

**¿Por qué `QueryClientProvider` va ENCIMA de todo?**  
Porque React Query no depende de ningún otro provider (no necesita Auth, Theme, etc.), pero otros componentes sí necesitan React Query. El orden es: React Query → Settings → Theme → Auth → Companies → Notifications → Toast.

---

## 5. FASE 2: HOOKS CENTRALIZADOS DE FIRESTORE

### 5.1 Crear archivo: `src/hooks/useFirestoreQuery.js`

Este es el **hook fundacional** que reemplaza los patrones repetidos de `onSnapshot` y `getDocs` con React Query.

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  startAfter,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CACHE_TIMES, QUERY_KEYS } from '../config/queryClient';

// ═══════════════════════════════════════════════════════
// HELPER: Construir query de Firestore desde opciones
// ═══════════════════════════════════════════════════════

/**
 * Construye un Firestore query a partir de opciones declarativas.
 * 
 * @param {string} collectionPath - Ruta de la colección (e.g., 'commitments')
 * @param {Object} options
 * @param {Array<{field, op, value}>} [options.filters] - Array de condiciones where
 * @param {Array<{field, direction?}>} [options.orderByFields] - Ordenamiento
 * @param {number} [options.limitCount] - Límite de documentos
 * @param {*} [options.startAfterDoc] - Cursor para paginación
 */
function buildQuery(collectionPath, options = {}) {
  const { filters = [], orderByFields = [], limitCount, startAfterDoc } = options;

  let q = collection(db, collectionPath);
  const constraints = [];

  filters.forEach(({ field, op, value }) => {
    if (value !== undefined && value !== null && value !== '') {
      constraints.push(where(field, op, value));
    }
  });

  orderByFields.forEach(({ field, direction }) => {
    constraints.push(orderBy(field, direction || 'asc'));
  });

  if (startAfterDoc) {
    constraints.push(startAfter(startAfterDoc));
  }

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  return constraints.length > 0 ? query(q, ...constraints) : q;
}

// ═══════════════════════════════════════════════════════
// HOOK: useFirestoreQuery (reemplaza getDocs + useState)
// ═══════════════════════════════════════════════════════

/**
 * Hook genérico para leer una colección de Firestore con cache de React Query.
 * Reemplaza el patrón: useState + useEffect + getDocs.
 * 
 * @param {string|Array} queryKey - Clave para React Query (usar QUERY_KEYS)
 * @param {string} collectionPath - Ruta de la colección
 * @param {Object} [options] - Opciones de query y cache
 * @param {Array} [options.filters] - [{field, op, value}]
 * @param {Array} [options.orderByFields] - [{field, direction?}]
 * @param {number} [options.limitCount] - Límite de docs
 * @param {Function} [options.transform] - Transformar cada documento
 * @param {number} [options.staleTime] - Override de staleTime
 * @param {number} [options.gcTime] - Override de gcTime
 * @param {boolean} [options.enabled] - Si false, no ejecuta la query
 * 
 * @returns {{ data: Array, isLoading: boolean, error: Error|null, refetch: Function, isFetching: boolean }}
 * 
 * @example
 * // Obtener todas las empresas (dato de referencia, cache largo)
 * const { data: companies, isLoading } = useFirestoreQuery(
 *   QUERY_KEYS.companies,
 *   'companies',
 *   {
 *     orderByFields: [{ field: 'name', direction: 'asc' }],
 *     ...CACHE_TIMES.REFERENCE,
 *   }
 * );
 */
export function useFirestoreQuery(queryKey, collectionPath, options = {}) {
  const {
    filters = [],
    orderByFields = [],
    limitCount,
    startAfterDoc,
    transform,
    staleTime,
    gcTime,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const q = buildQuery(collectionPath, {
        filters,
        orderByFields,
        limitCount,
        startAfterDoc,
      });

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const document = { id: docSnap.id, ...data };
        return transform ? transform(document, docSnap) : document;
      });

      return docs;
    },
    staleTime,
    gcTime,
    enabled,
  });
}

// ═══════════════════════════════════════════════════════
// HOOK: useFirestoreDoc (reemplaza getDoc + useState)
// ═══════════════════════════════════════════════════════

/**
 * Hook para leer un documento individual de Firestore con cache.
 * 
 * @param {string|Array} queryKey - Clave para React Query
 * @param {string} collectionPath - Ruta de la colección
 * @param {string} docId - ID del documento
 * @param {Object} [options] - Opciones de cache
 * 
 * @returns {{ data: Object|null, isLoading: boolean, error: Error|null }}
 * 
 * @example
 * const { data: config } = useFirestoreDoc(
 *   QUERY_KEYS.systemConfig,
 *   'system_config',
 *   'general',
 *   CACHE_TIMES.CONFIG
 * );
 */
export function useFirestoreDoc(queryKey, collectionPath, docId, options = {}) {
  const { transform, staleTime, gcTime, enabled = true } = options;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const docRef = doc(db, collectionPath, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = { id: docSnap.id, ...docSnap.data() };
      return transform ? transform(data) : data;
    },
    staleTime,
    gcTime,
    enabled: enabled && !!docId,
  });
}

// ═══════════════════════════════════════════════════════
// HOOK: useFirestoreMutation (reemplaza add/update/delete)
// ═══════════════════════════════════════════════════════

/**
 * Hook para mutaciones (crear, actualizar, eliminar) con invalidación de cache.
 * 
 * @param {string} collectionPath - Colección a mutar
 * @param {Object} [options]
 * @param {Array<string|Array>} [options.invalidateKeys] - Query keys a invalidar tras mutación
 * @param {Function} [options.onSuccess] - Callback tras éxito
 * @param {Function} [options.onError] - Callback en error
 * 
 * @returns {{ addDocument, updateDocument, deleteDocument }}
 * 
 * @example
 * const { addDocument, updateDocument, deleteDocument } = useFirestoreMutation(
 *   'commitments',
 *   { invalidateKeys: [QUERY_KEYS.commitmentsAll, QUERY_KEYS.paymentsAll] }
 * );
 * 
 * // Crear
 * await addDocument({ name: 'Nuevo', amount: 1000 });
 * 
 * // Actualizar
 * await updateDocument({ id: 'abc123', name: 'Editado' });
 * 
 * // Eliminar
 * await deleteDocument('abc123');
 */
export function useFirestoreMutation(collectionPath, options = {}) {
  const qc = useQueryClient();
  const { invalidateKeys = [], onSuccess, onError } = options;

  const invalidateRelated = () => {
    invalidateKeys.forEach((key) => {
      qc.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
    });
  };

  const addMutation = useMutation({
    mutationFn: async (data) => {
      const docRef = await addDoc(collection(db, collectionPath), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    },
    onSuccess: (id, variables) => {
      invalidateRelated();
      onSuccess?.('add', id, variables);
    },
    onError: (error) => {
      console.error(`Error adding to ${collectionPath}:`, error);
      onError?.(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const docRef = doc(db, collectionPath, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
      return id;
    },
    onSuccess: (id, variables) => {
      invalidateRelated();
      onSuccess?.('update', id, variables);
    },
    onError: (error) => {
      console.error(`Error updating ${collectionPath}:`, error);
      onError?.(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await deleteDoc(doc(db, collectionPath, id));
      return id;
    },
    onSuccess: (id) => {
      invalidateRelated();
      onSuccess?.('delete', id);
    },
    onError: (error) => {
      console.error(`Error deleting from ${collectionPath}:`, error);
      onError?.(error);
    },
  });

  return {
    addDocument: addMutation.mutateAsync,
    updateDocument: updateMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### 5.2 Crear archivo: `src/hooks/useCompaniesQuery.js`

Este hook reemplaza **TODOS** los listeners duplicados de `companies`.

```javascript
import { useFirestoreQuery } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';
import { useCallback, useMemo } from 'react';

/**
 * Hook para acceder a la lista de empresas con cache.
 * 
 * ⚠️ REGLA: Este hook (o CompaniesContext) es la ÚNICA fuente de datos
 * para la colección `companies`. NUNCA crear un onSnapshot local para companies.
 * 
 * Reemplaza:
 * - onSnapshot en CompaniesPage (L295)
 * - onSnapshot en IncomePage (L254)
 * - onSnapshot en BankAccountsPage (L139)
 * - onSnapshot en IncomeHistoryPage (L154)
 * - onSnapshot en EmpleadosPage (L209)
 * - onSnapshot en SalasPage (L206)
 * - onSnapshot en NewCommitmentPage (L304)
 * - managedOnSnapshot en PaymentsPage (L614)
 * - onSnapshot en useContractExpirationAlerts (L37)
 * - getDocs en CommitmentsFilters (L73)
 * 
 * @returns {{ companies, isLoading, error, findCompanyByNIT, findCompanyById }}
 */
export function useCompaniesQuery() {
  const { data: companies = [], isLoading, error, refetch } = useFirestoreQuery(
    QUERY_KEYS.companies,
    'companies',
    {
      orderByFields: [{ field: 'name', direction: 'asc' }],
      transform: (doc) => ({
        ...doc,
        createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt || Date.now()),
      }),
      ...CACHE_TIMES.REFERENCE,
    }
  );

  // NIT normalization helper (compatible con CompaniesContext)
  const normalizeNIT = useCallback((nit) => {
    if (!nit) return '';
    return nit.toString().replace(/[.\-\s]/g, '').trim().toUpperCase();
  }, []);

  const findCompanyByNIT = useCallback((nit) => {
    if (!nit || !companies.length) return 'No encontrado';
    const normalizedSearchNIT = normalizeNIT(nit);

    let company = companies.find((c) => normalizeNIT(c.nit) === normalizedSearchNIT);

    if (!company) {
      company = companies.find((c) => {
        const cNIT = normalizeNIT(c.nit);
        const cWithoutDV = cNIT.slice(0, -1);
        const sWithoutDV =
          normalizedSearchNIT.length > 9
            ? normalizedSearchNIT.slice(0, -1)
            : normalizedSearchNIT;
        return cWithoutDV === sWithoutDV || cNIT.startsWith(normalizedSearchNIT);
      });
    }

    return company ? company.name || 'No encontrado' : 'No encontrado';
  }, [companies, normalizeNIT]);

  const findCompanyById = useCallback((companyId) => {
    if (!companyId || !companies.length) return null;
    return companies.find((c) => c.id === companyId) || null;
  }, [companies]);

  // Mapa de ID → name para lookups O(1) (útil en tablas grandes)
  const companiesMap = useMemo(() => {
    const map = new Map();
    companies.forEach((c) => map.set(c.id, c));
    return map;
  }, [companies]);

  return {
    companies,
    companiesMap,
    isLoading,
    loading: isLoading, // alias de compatibilidad
    error: error?.message || null,
    refetch,
    findCompanyByNIT,
    findCompanyById,
  };
}
```

---

## 6. FASE 3: ELIMINAR LISTENERS DUPLICADOS DE `companies`

### 6.1 Patrón de Migración por Página

Para cada página que tiene un listener duplicado de `companies`, el cambio es:

**ANTES (mal — listener propio):**
```jsx
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

// Dentro del componente:
const [companies, setCompanies] = useState([]);
useEffect(() => {
  const q = query(collection(db, 'companies'), orderBy('name', 'asc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCompanies(data);
  });
  return () => unsubscribe();
}, []);
```

**DESPUÉS (bien — hook compartido con cache):**
```jsx
import { useCompaniesQuery } from '../hooks/useCompaniesQuery';

// Dentro del componente:
const { companies, isLoading: companiesLoading } = useCompaniesQuery();
```

### 6.2 Archivos a Modificar (10 archivos)

**IMPORTANTE:** En cada archivo, eliminar:
1. El `import` de Firestore (`collection`, `query`, `onSnapshot`, `orderBy`) SI ya no se usa para otra cosa
2. El `useState` de companies
3. El `useEffect` con `onSnapshot` en companies
4. El `return () => unsubscribe()` correspondiente

**Archivos en orden de impacto:**

| # | Archivo | Qué Eliminar | Qué Agregar |
|---|---------|-------------|-------------|
| 1 | `pages/BankAccountsPage.jsx` | `onSnapshot` companies (L139-155) + state | `useCompaniesQuery()` |
| 2 | `pages/IncomePage.jsx` | `onSnapshot` companies (L254-275) + state | `useCompaniesQuery()` |
| 3 | `pages/IncomeHistoryPage.jsx` | `onSnapshot` companies (L154-175) + state | `useCompaniesQuery()` |
| 4 | `pages/EmpleadosPage.jsx` | `onSnapshot` companies (L209-230) + state | `useCompaniesQuery()` |
| 5 | `pages/SalasPage.jsx` | `onSnapshot` companies (L206-225) + state | `useCompaniesQuery()` |
| 6 | `pages/CompaniesPage.jsx` | `onSnapshot` companies (L295-315) + state | `useCompaniesQuery()` |
| 7 | `pages/NewCommitmentPage.jsx` | `onSnapshot` companies (L304-340) + state | `useCompaniesQuery()` |
| 8 | `pages/PaymentsPage.jsx` | `managedOnSnapshot` companies (L614-640) + state | `useCompaniesQuery()` |
| 9 | `hooks/useContractExpirationAlerts.js` | `onSnapshot` companies completo (L37-80) | Recibir `companies` como parámetro |
| 10 | `components/commitments/CommitmentsFilters.jsx` | `getDocs` companies (L73-95) + state | `useCompaniesQuery()` |

### 6.3 Caso Especial: `useContractExpirationAlerts.js`

Este hook crea su **propio onSnapshot de TODA la colección companies** solo para calcular alertas de contratos. La solución es recibirlo como parámetro:

**ANTES:**
```javascript
export const useContractExpirationAlerts = () => {
  const [companies, setCompanies] = useState([]);
  
  useEffect(() => {
    const q = query(collection(db, 'companies'));
    const unsubscribe = onSnapshot(q, (snapshot) => { ... });
    return () => unsubscribe();
  }, []);
  
  // ... calcular alertas con companies
};
```

**DESPUÉS:**
```javascript
export const useContractExpirationAlerts = (companies = []) => {
  // Eliminar useState y useEffect de companies
  // Usar directamente el parámetro companies para calcular alertas
  
  const alerts = useMemo(() => {
    if (!companies.length) return [];
    // ... cálculos de alertas
  }, [companies]);
  
  return alerts;
};
```

**En el componente que lo consume:**
```jsx
const { companies } = useCompaniesQuery();
const contractAlerts = useContractExpirationAlerts(companies);
```

---

## 7. FASE 4: MIGRAR HOOKS PRINCIPALES

### 7.1 Crear: `src/hooks/useCommitmentsQuery.js`

```javascript
import { useFirestoreQuery, useFirestoreMutation } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para compromisos financieros con cache.
 * 
 * Reemplaza: useCommitments de useFirestore.js (onSnapshot)
 * Reemplaza: useCommitments de useCommitments.js (getDocs)
 * 
 * @param {Object} filters - { company, status, startDate, endDate, shouldLoadData }
 */
export function useCommitmentsQuery(filters = {}) {
  const { company, status, startDate, endDate, shouldLoadData = true } = filters;

  // Construir filtros dinámicos
  const queryFilters = [];
  if (company) queryFilters.push({ field: 'companyId', op: '==', value: company });
  if (status) queryFilters.push({ field: 'status', op: '==', value: status });
  if (startDate && endDate) {
    queryFilters.push({ field: 'dueDate', op: '>=', value: startDate });
    queryFilters.push({ field: 'dueDate', op: '<=', value: endDate });
  }

  const { data: commitments = [], isLoading, error, refetch, isFetching } = useFirestoreQuery(
    QUERY_KEYS.commitments({ company, status, startDate, endDate }),
    'commitments',
    {
      filters: queryFilters,
      orderByFields: [{ field: 'dueDate', direction: 'asc' }],
      enabled: shouldLoadData,
      ...CACHE_TIMES.WORK,
    }
  );

  const { addDocument, updateDocument, deleteDocument, isAdding, isUpdating, isDeleting } =
    useFirestoreMutation('commitments', {
      invalidateKeys: [QUERY_KEYS.commitmentsAll],
    });

  return {
    commitments,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    isFetching,
    addCommitment: addDocument,
    updateCommitment: (id, updates) => updateDocument({ id, ...updates }),
    deleteCommitment: deleteDocument,
    isAdding,
    isUpdating,
    isDeleting,
  };
}
```

### 7.2 Crear: `src/hooks/usePaymentsQuery.js`

```javascript
import { useFirestoreQuery, useFirestoreMutation } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para pagos con cache.
 * 
 * Reemplaza: usePayments de useFirestore.js (onSnapshot)
 * 
 * @param {Object} filters - { company, status, shouldLoadData }
 */
export function usePaymentsQuery(filters = {}) {
  const { company, status, shouldLoadData = true } = filters;

  const queryFilters = [];
  if (company) queryFilters.push({ field: 'companyName', op: '==', value: company });
  if (status) queryFilters.push({ field: 'status', op: '==', value: status });

  const { data: rawPayments = [], isLoading, error, refetch, isFetching } = useFirestoreQuery(
    QUERY_KEYS.payments({ company, status }),
    'payments',
    {
      filters: queryFilters,
      orderByFields: [{ field: 'date', direction: 'desc' }],
      limitCount: shouldLoadData ? undefined : 50,
      transform: (doc) => ({
        ...doc,
        date: doc.date?.toDate ? doc.date.toDate() : new Date(doc.date),
        amount: parseFloat(doc.amount) || 0,
      }),
      enabled: true,
      ...CACHE_TIMES.WORK,
    }
  );

  // Filtrar registros automáticos (4x1000 y automatic) client-side
  const payments = rawPayments.filter((p) => !p.is4x1000Tax && !p.isAutomatic);

  const { addDocument, updateDocument, deleteDocument } = useFirestoreMutation('payments', {
    invalidateKeys: [QUERY_KEYS.paymentsAll],
  });

  return {
    payments,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    isFetching,
    addPayment: (data) =>
      addDocument({
        ...data,
        date: data.date instanceof Date ? data.date : new Date(data.date),
        amount: parseFloat(data.amount),
      }),
    updatePayment: (id, updates) =>
      updateDocument({
        id,
        ...updates,
        amount: updates.amount ? parseFloat(updates.amount) : undefined,
        date: updates.date instanceof Date ? updates.date : updates.date ? new Date(updates.date) : undefined,
      }),
    deletePayment: deleteDocument,
  };
}
```

### 7.3 Crear: `src/hooks/useIncomesQuery.js`

```javascript
import { useFirestoreQuery, useFirestoreMutation } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para ingresos/consignaciones con cache.
 */
export function useIncomesQuery(filters = {}) {
  const queryFilters = [];
  if (filters.company) {
    queryFilters.push({ field: 'companyId', op: '==', value: filters.company });
  }

  const { data: incomes = [], isLoading, error, refetch } = useFirestoreQuery(
    QUERY_KEYS.incomes(filters),
    'incomes',
    {
      filters: queryFilters,
      orderByFields: [{ field: 'date', direction: 'desc' }],
      ...CACHE_TIMES.WORK,
    }
  );

  const { addDocument, updateDocument, deleteDocument } = useFirestoreMutation('incomes', {
    invalidateKeys: [QUERY_KEYS.incomesAll],
  });

  return {
    incomes,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    addIncome: addDocument,
    updateIncome: (id, updates) => updateDocument({ id, ...updates }),
    deleteIncome: deleteDocument,
  };
}
```

### 7.4 Crear: `src/hooks/usePersonalAccountsQuery.js`

```javascript
import { useFirestoreQuery, useFirestoreMutation } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para cuentas bancarias personales con cache.
 * 
 * Reemplaza los onSnapshot en:
 * - BankAccountsPage (L204)
 * - IncomePage (L283)
 * - NewPaymentPage (L469)
 */
export function usePersonalAccountsQuery() {
  const { data: accounts = [], isLoading, error, refetch } = useFirestoreQuery(
    QUERY_KEYS.personalAccounts,
    'personal_accounts',
    {
      orderByFields: [{ field: 'name', direction: 'asc' }],
      ...CACHE_TIMES.REFERENCE,
    }
  );

  const { addDocument, updateDocument, deleteDocument } = useFirestoreMutation(
    'personal_accounts',
    { invalidateKeys: [QUERY_KEYS.personalAccounts] }
  );

  return {
    accounts,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    addAccount: addDocument,
    updateAccount: (id, updates) => updateDocument({ id, ...updates }),
    deleteAccount: deleteDocument,
  };
}
```

### 7.5 Crear: `src/hooks/useSalasQuery.js`

```javascript
import { useFirestoreQuery } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para salas con cache.
 * 
 * Reemplaza onSnapshot en ClientesPage y SalasPage.
 */
export function useSalasQuery() {
  const { data: salas = [], isLoading, error, refetch } = useFirestoreQuery(
    QUERY_KEYS.salas,
    'salas',
    {
      orderByFields: [{ field: 'name', direction: 'asc' }],
      ...CACHE_TIMES.REFERENCE,
    }
  );

  return {
    salas,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
```

### 7.6 Crear: `src/hooks/useEmpleadosQuery.js`

```javascript
import { useFirestoreQuery, useFirestoreMutation } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para empleados con cache.
 */
export function useEmpleadosQuery() {
  const { data: empleados = [], isLoading, error, refetch } = useFirestoreQuery(
    QUERY_KEYS.empleados,
    'empleados',
    {
      orderByFields: [{ field: 'nombre', direction: 'asc' }],
      ...CACHE_TIMES.REFERENCE,
    }
  );

  const { addDocument, updateDocument, deleteDocument } = useFirestoreMutation('empleados', {
    invalidateKeys: [QUERY_KEYS.empleados],
  });

  return {
    empleados,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    addEmpleado: addDocument,
    updateEmpleado: (id, updates) => updateDocument({ id, ...updates }),
    deleteEmpleado: deleteDocument,
  };
}
```

### 7.7 Crear: `src/hooks/useUsersListQuery.js`

```javascript
import { useFirestoreQuery } from './useFirestoreQuery';
import { QUERY_KEYS, CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para obtener la lista de usuarios del sistema con cache.
 * 
 * Reemplaza getDocs de users en:
 * - UserManagementPage (L187, L207)
 * - AsistenciasPage (L138)
 * - TaskDialog (L89)
 * - TaskReassignDialog (L50)
 * - ActivityFilters (L105)
 * - DashboardHeader global search (L285)
 * - LiquidacionesHistorialPage (L105)
 * 
 * @param {Object} [options]
 * @param {string} [options.role] - Filtrar por rol ('ADMIN', 'OPERADOR', etc.)
 * @param {boolean} [options.enabled] - Si false, no cargar
 */
export function useUsersListQuery(options = {}) {
  const { role, enabled = true } = options;

  const filters = [];
  if (role) filters.push({ field: 'role', op: '==', value: role });

  const { data: users = [], isLoading, error, refetch } = useFirestoreQuery(
    role ? QUERY_KEYS.usersWithFilter(role) : QUERY_KEYS.usersList,
    'users',
    {
      filters,
      orderByFields: [{ field: 'name', direction: 'asc' }],
      enabled,
      ...CACHE_TIMES.REFERENCE,
    }
  );

  return { users, loading: isLoading, error: error?.message || null, refetch };
}
```

---

## 8. FASE 5: MIGRAR PÁGINAS PESADAS

### 8.1 Patrón General de Migración por Página

Para cada página, el patrón de migración es:

1. **Reemplazar imports** de Firestore por imports de hooks Query
2. **Eliminar useState** de datos que ahora vienen del hook
3. **Eliminar useEffect** con onSnapshot/getDocs
4. **Usar el hook Query** directamente en el componente
5. **Mantener los writes (addDoc, updateDoc, deleteDoc)** usando `useFirestoreMutation` o directamente
6. **Verificar** que `loading` y `error` se mapean correctamente

### 8.2 Ejemplo Completo: `BankAccountsPage.jsx`

**ANTES (4 listeners simultáneos):**
```jsx
// 4 estados + 4 useEffects con onSnapshot
const [companies, setCompanies] = useState([]);
const [incomes, setIncomes] = useState([]);
const [payments, setPayments] = useState([]);
const [personalAccounts, setPersonalAccounts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  // onSnapshot companies (DUPLICADO)
  // onSnapshot incomes
  // onSnapshot payments
  // onSnapshot personal_accounts
  // → 4 listeners activos
}, []);
```

**DESPUÉS (0 listeners, 100% cache):**
```jsx
import { useCompaniesQuery } from '../hooks/useCompaniesQuery';
import { useIncomesQuery } from '../hooks/useIncomesQuery';
import { usePaymentsQuery } from '../hooks/usePaymentsQuery';
import { usePersonalAccountsQuery } from '../hooks/usePersonalAccountsQuery';

// Dentro del componente:
const { companies, isLoading: companiesLoading } = useCompaniesQuery();
const { incomes, loading: incomesLoading } = useIncomesQuery();
const { payments, loading: paymentsLoading } = usePaymentsQuery();
const { accounts: personalAccounts, loading: accountsLoading } = usePersonalAccountsQuery();

const loading = companiesLoading || incomesLoading || paymentsLoading || accountsLoading;
```

**Resultado:**
- Primera visita: 4 getDocs (una sola vez)
- Visitas posteriores (dentro del staleTime): **0 lecturas** ← datos en cache
- Si el usuario fue a PaymentsPage primero, `payments` y `companies` ya están en cache → **solo 2 lecturas** para `incomes` y `personal_accounts`

### 8.3 Orden de Migración por Impacto

| Prioridad | Página | Listeners Eliminados | Lecturas Ahorradas |
|-----------|--------|---------------------|-------------------|
| 🔴 1 | `BankAccountsPage` | 4 → 0 | ~4 listeners continuos |
| 🔴 2 | `IncomePage` | 3 → 0 | ~3 listeners (1 dup companies) |
| 🔴 3 | `RecursosHumanosPage` | 4 → 0 | ~4 listeners continuos |
| 🔴 4 | `PaymentsPage` | 3 → 0 | ~3 listeners + N+1 |
| 🟡 5 | `NewPaymentPage` | 3 → 0 | ~3 listeners |
| 🟡 6 | `NewCommitmentPage` | 1 → 0 | ~1 listener dup + 3 getDocs |
| 🟡 7 | `IncomeHistoryPage` | 2 → 0 | ~2 listeners (1 dup) |
| 🟡 8 | `CompaniesPage` | 1 → 0 | ~1 listener dup |
| 🟡 9 | `EmpleadosPage` | 2 → 0 | ~2 listeners (1 dup) |
| 🟡 10 | `SalasPage` | 2 → 0 | ~2 listeners |
| 🟢 11 | `AsistenciasPage` | 2 → 1* | ~1 listener dup (asistencias mantiene real-time) |
| 🟢 12 | `CommitmentsPage` | 1 → 0 | ~1 listener |
| 🟢 13 | `FacturacionPage` | 1 → 0 | ~1 listener + getDocs |
| 🟢 14 | `SolicitudesPage` | 2 → 0 | ~2 listeners |
| 🟢 15 | `TasksPage` | via hook | Migración del hook |

*`AsistenciasPage` necesita real-time para ver entradas/salidas en vivo. Considerar mantener `onSnapshot` solo para `asistencias` del día actual.

---

## 9. FASE 6: RESOLVER PATRÓN N+1

### 9.1 PaymentsPage — N+1 en getDoc(commitments/{id})

**Problema:** Por cada pago, hace `getDoc(doc(db, 'commitments', payment.commitmentId))` para obtener el nombre del compromiso. Con 100 pagos → 100 getDoc individuales.

**Solución:** Hacer un JOIN client-side usando datos ya cacheados.

```javascript
import { useCompaniesQuery } from '../hooks/useCompaniesQuery';
import { useCommitmentsQuery } from '../hooks/useCommitmentsQuery';
import { usePaymentsQuery } from '../hooks/usePaymentsQuery';

// En el componente:
const { commitments } = useCommitmentsQuery(); // Ya cacheado
const { payments } = usePaymentsQuery();

// JOIN client-side O(1) con Map
const commitmentsMap = useMemo(() => {
  const map = new Map();
  commitments.forEach(c => map.set(c.id, c));
  return map;
}, [commitments]);

// Enriquecer pagos con datos del compromiso
const enrichedPayments = useMemo(() => {
  return payments.map(payment => ({
    ...payment,
    commitmentName: commitmentsMap.get(payment.commitmentId)?.name || 'Sin compromiso',
    commitmentCompany: commitmentsMap.get(payment.commitmentId)?.companyId || null,
  }));
}, [payments, commitmentsMap]);
```

**Resultado:** De 101 lecturas → **0 lecturas adicionales** (datos ya en cache).

### 9.2 useCommitmentPaymentStatus — onSnapshot por commitment

**Problema:** Crea 1 listener por commitment visible. Con 50 en pantalla = 50 listeners.

**Solución:** Reemplazar con una query batch que obtiene todos los pagos y los agrupa.

```javascript
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CACHE_TIMES } from '../config/queryClient';

/**
 * Hook para obtener estado de pago de MÚLTIPLES compromisos de una vez.
 * 
 * Reemplaza: useCommitmentPaymentStatus (1 listener por commitment)
 * Ahora: 1 sola query para TODOS los commitmentIds.
 * 
 * @param {string[]} commitmentIds - Array de IDs de compromisos
 */
export function useCommitmentsPaymentStatusBatch(commitmentIds = []) {
  return useQuery({
    queryKey: ['payments', 'batch-status', ...commitmentIds.sort()],
    queryFn: async () => {
      if (!commitmentIds.length) return {};

      // Firestore limita 'in' a 30 valores. Dividir en chunks.
      const CHUNK_SIZE = 30;
      const chunks = [];
      for (let i = 0; i < commitmentIds.length; i += CHUNK_SIZE) {
        chunks.push(commitmentIds.slice(i, i + CHUNK_SIZE));
      }

      const allPayments = [];
      for (const chunk of chunks) {
        const q = query(
          collection(db, 'payments'),
          where('commitmentId', 'in', chunk)
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          allPayments.push({ id: doc.id, ...doc.data() });
        });
      }

      // Agrupar pagos por commitmentId
      const paymentsByCommitment = {};
      allPayments.forEach(payment => {
        const cid = payment.commitmentId;
        if (!paymentsByCommitment[cid]) paymentsByCommitment[cid] = [];
        paymentsByCommitment[cid].push(payment);
      });

      return paymentsByCommitment;
    },
    enabled: commitmentIds.length > 0,
    ...CACHE_TIMES.WORK,
  });
}
```

**Resultado:** De 50 listeners → **1-2 getDocs** (agrupados por chunks de 30).

---

## 10. FASE 7: PERSISTENCIA EN localStorage

### 10.1 Agregar Persistencia Opcional

React Query v5 soporta persistencia nativa con `@tanstack/query-sync-storage-persister`. Esto permite que los datos sobrevivan al cierre de pestaña.

**Instalar:**
```powershell
npm install @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister
```

### 10.2 Actualizar `src/config/queryClient.js`

Agregar al final del archivo:

```javascript
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Persister para localStorage.
 * Los datos del cache se guardan en localStorage y se restauran al recargar.
 * 
 * maxAge: 24 horas → datos mayores a 24h se descartan automáticamente.
 */
export const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'drgroup-react-query-cache',
  // Serializar de forma segura (manejar Dates, etc.)
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});
```

### 10.3 Actualizar `src/App.jsx` para Persistencia

```jsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, localStoragePersister } from './config/queryClient';

// Reemplazar QueryClientProvider con PersistQueryClientProvider:
function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: localStoragePersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        // Solo persistir queries con staleTime >= 5 min (no datos volátiles)
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return query.state.status === 'success' && query.gcTime > 0;
          },
        },
      }}
    >
      <SettingsProvider>
        <CustomThemeProvider>
          <CssBaseline />
          <AuthProvider>
            <CompaniesProvider>
            <NotificationsProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </NotificationsProvider>
            </CompaniesProvider>
          </AuthProvider>
        </CustomThemeProvider>
      </SettingsProvider>
    </PersistQueryClientProvider>
  );
}
```

**Efecto:** Al recargar el navegador (Ctrl+R), los datos se restauran INSTANTÁNEAMENTE desde localStorage. Firebase no se llama hasta que expire el `staleTime`.

---

## 11. FASE 8: DEBOUNCE EN BÚSQUEDA GLOBAL

### 11.1 Problema: DashboardHeader.jsx

La búsqueda global en `DashboardHeader.jsx` (L214-285) hace `getDocs` en 4 colecciones **en cada tecla**. Por ejemplo, escribir "factura" genera ~28 lecturas.

### 11.2 Solución con React Query + Debounce

```javascript
import { useQuery } from '@tanstack/react-query';
import { useState, useDeferredValue } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { QUERY_KEYS } from '../../config/queryClient';

/**
 * Hook para búsqueda global con debounce y cache.
 * Solo busca cuando el término tiene >= 2 caracteres.
 * 
 * @param {string} searchTerm - Término de búsqueda (raw, sin debounce)
 */
export function useGlobalSearch(searchTerm) {
  // useDeferredValue de React 18 actúa como debounce natural
  const deferredTerm = useDeferredValue(searchTerm);
  const normalizedTerm = deferredTerm.trim().toLowerCase();

  return useQuery({
    queryKey: QUERY_KEYS.globalSearch(normalizedTerm),
    queryFn: async () => {
      if (normalizedTerm.length < 2) return { commitments: [], companies: [], payments: [], users: [] };

      // Ejecutar las 4 búsquedas en paralelo (1 Promise.all = 4 getDocs)
      const [commitmentsSnap, companiesSnap, paymentsSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'commitments'), orderBy('name'), limit(10))),
        getDocs(query(collection(db, 'companies'), orderBy('name'), limit(10))),
        getDocs(query(collection(db, 'payments'), orderBy('date', 'desc'), limit(10))),
        getDocs(query(collection(db, 'users'), orderBy('name'), limit(10))),
      ]);

      // Filtrar client-side por término (Firestore no soporta LIKE/contains)
      const filterByTerm = (docs) =>
        docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) =>
            Object.values(item).some(
              (val) => typeof val === 'string' && val.toLowerCase().includes(normalizedTerm)
            )
          );

      return {
        commitments: filterByTerm(commitmentsSnap.docs),
        companies: filterByTerm(companiesSnap.docs),
        payments: filterByTerm(paymentsSnap.docs),
        users: filterByTerm(usersSnap.docs),
      };
    },
    enabled: normalizedTerm.length >= 2,
    staleTime: 30 * 1000,        // 30 segundos — búsquedas idénticas no se repiten
    gcTime: 2 * 60 * 1000,       // 2 minutos en cache
  });
}
```

**Uso en DashboardHeader:**
```jsx
const [searchTerm, setSearchTerm] = useState('');
const { data: searchResults, isLoading: isSearching } = useGlobalSearch(searchTerm);
```

**Resultado:** De ~28 lecturas por palabra → **4 lecturas por búsqueda** (y 0 si se repite la misma búsqueda dentro de 30 segundos).

---

## 12. MAPA DE ARCHIVOS AFECTADOS

### 12.1 Archivos NUEVOS a Crear (9 archivos)

| Archivo | Propósito |
|---------|-----------|
| `src/config/queryClient.js` | QueryClient + CACHE_TIMES + QUERY_KEYS |
| `src/hooks/useFirestoreQuery.js` | Hooks fundacionales genéricos |
| `src/hooks/useCompaniesQuery.js` | Empresas (reemplaza 10 listeners dup) |
| `src/hooks/useCommitmentsQuery.js` | Compromisos con cache |
| `src/hooks/usePaymentsQuery.js` | Pagos con cache |
| `src/hooks/useIncomesQuery.js` | Ingresos con cache |
| `src/hooks/usePersonalAccountsQuery.js` | Cuentas bancarias |
| `src/hooks/useSalasQuery.js` | Salas |
| `src/hooks/useEmpleadosQuery.js` | Empleados |
| `src/hooks/useUsersListQuery.js` | Lista de usuarios del sistema |

### 12.2 Archivos a MODIFICAR (25+ archivos)

#### Modificaciones Mayores (eliminar listeners, usar hooks Query):

| Archivo | Cambio |
|---------|--------|
| `src/App.jsx` | Agregar QueryClientProvider / PersistQueryClientProvider |
| `src/pages/BankAccountsPage.jsx` | Eliminar 4 onSnapshot → 4 hooks Query |
| `src/pages/IncomePage.jsx` | Eliminar 3 onSnapshot → 3 hooks Query |
| `src/pages/RecursosHumanosPage.jsx` | Eliminar 4 onSnapshot → hooks Query |
| `src/pages/PaymentsPage.jsx` | Eliminar 3 listeners + N+1 → hooks Query + JOIN |
| `src/pages/NewPaymentPage.jsx` | Eliminar 3 listeners → hooks Query |
| `src/pages/NewCommitmentPage.jsx` | Eliminar dup companies + getDocs → hooks Query |
| `src/pages/IncomeHistoryPage.jsx` | Eliminar 2 onSnapshot → hooks Query |
| `src/pages/EmpleadosPage.jsx` | Eliminar 2 onSnapshot → hooks Query |
| `src/pages/SalasPage.jsx` | Eliminar 2 onSnapshot → hooks Query |
| `src/pages/CompaniesPage.jsx` | Eliminar dup onSnapshot → useCompaniesQuery |
| `src/pages/CommitmentsPage.jsx` | Eliminar getDocs + hook → useCommitmentsQuery |
| `src/pages/SolicitudesPage.jsx` | Eliminar 2 onSnapshot → hooks Query |
| `src/pages/AsistenciasPage.jsx` | Reemplazar getDocs users + dup companies |
| `src/pages/TasksPage.jsx` | getDocs companies → useCompaniesQuery |
| `src/pages/UserManagementPage.jsx` | getDocs users/companies → hooks Query |
| `src/pages/FacturacionPage.jsx` | Eliminar listener + getDocs → hooks Query |
| `src/pages/ClientesPage.jsx` | onSnapshot salas → useSalasQuery |
| `src/pages/LiquidacionesPorSalaPage.jsx` | Parcial: config + getDoc → hooks Query |
| `src/pages/LiquidacionesEstadisticasPage.jsx` | getDocs → hooks Query |
| `src/pages/LiquidacionesHistorialPage.jsx` | getDocs users/companies → hooks Query |

#### Modificaciones Menores (imports y renaming):

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useContractExpirationAlerts.js` | Recibir companies como parámetro |
| `src/hooks/useCommitmentPaymentStatus.js` | Reemplazar con versión batch |
| `src/components/commitments/CommitmentsFilters.jsx` | getDocs companies → useCompaniesQuery |
| `src/components/dashboard/DashboardHeader.jsx` | Búsqueda global con debounce |
| `src/components/tasks/TaskDialog.jsx` | getDocs users/companies → hooks Query |
| `src/components/tasks/TaskReassignDialog.jsx` | getDocs users → useUsersListQuery |
| `src/components/admin/ActivityFilters.jsx` | getDocs users → useUsersListQuery |

### 12.3 Archivos que NO se Tocan

| Archivo | Razón |
|---------|-------|
| `src/context/AuthContext.jsx` | Ya tiene cache óptimo en localStorage |
| `src/context/SettingsContext.jsx` | Ya tiene cache óptimo en localStorage |
| `src/context/NotificationsContext.jsx` | In-memory only, no usa Firestore |
| `src/context/ThemeContext.jsx` | Derivado de Settings, no usa Firestore |
| `src/context/ToastContext.jsx` | UI only |
| `src/hooks/useAlertsCenter.js` | Mantiene real-time (alertas críticas) |
| `src/hooks/useUserPresence.js` | RTDB real-time, no Firestore |
| `src/hooks/useNotificationSystem.js` | No hace reads |
| `src/hooks/usePermissions.js` | No hace reads |
| `src/hooks/useFavorites.js` | Ya tiene localStorage cache |
| `src/hooks/useStorageStats.js` | Ya tiene localStorage cache con TTL |
| `src/config/firebase.js` | Sin cambios |
| `src/utils/listenerManager.js` | Se puede deprecar gradualmente |

---

## 13. TESTING Y VALIDACIÓN

### 13.1 Checklist de Validación por Fase

#### Fase 0: Instalación
- [ ] `npm install @tanstack/react-query` sin errores
- [ ] `npm run build` compila sin errores
- [ ] `npm run dev` arranca sin errores

#### Fase 1: QueryClient Provider
- [ ] App.jsx renderiza sin errores
- [ ] Login funciona normalmente
- [ ] Navegación entre páginas sin crashear

#### Fase 2: Hooks Centralizados
- [ ] `useFirestoreQuery` funciona con colección simple
- [ ] `useFirestoreDoc` funciona con documento individual
- [ ] `useFirestoreMutation` crea, actualiza y elimina correctamente
- [ ] Cache funciona: segunda llamada con misma queryKey no hace fetch

#### Fase 3: Eliminar Listeners Duplicados companies
- [ ] Todas las páginas que antes tenían listener propio de companies ahora usan `useCompaniesQuery()`
- [ ] La lista de empresas aparece correctamente en todas las páginas
- [ ] Al crear una nueva empresa, se ve reflejada en todas las páginas (verificar invalidación)
- [ ] `useContractExpirationAlerts` funciona recibiendo companies como parámetro

#### Fase 4: Hooks Principales
- [ ] `useCommitmentsQuery` filtra por empresa, estado y fechas correctamente
- [ ] `usePaymentsQuery` excluye `is4x1000Tax` y `isAutomatic`
- [ ] `useIncomesQuery` filtra por empresa
- [ ] `usePersonalAccountsQuery` retorna cuentas bancarias
- [ ] Crear un elemento → aparece sin recargar (invalidación funciona)
- [ ] Editar un elemento → se actualiza sin recargar
- [ ] Eliminar un elemento → desaparece sin recargar

#### Fase 5: Páginas Migradas
- [ ] Cada página muestra datos correctamente
- [ ] Loading states funcionan (spinner mientras carga)
- [ ] Error states muestran mensaje al usuario
- [ ] Navegación rápida entre páginas = datos instantáneos (cache hit)

#### Fase 6: Resolución N+1
- [ ] PaymentsPage muestra nombre del compromiso asociado (JOIN client-side)
- [ ] CommitmentsList muestra estado de pago sin N listeners

#### Fase 7: Persistencia
- [ ] Al recargar (Ctrl+R), los datos aparecen inmediatamente
- [ ] Al cerrar y reabrir pestaña, los datos se restauran
- [ ] Datos mayores a 24h se refetchean automáticamente

#### Fase 8: Búsqueda Global
- [ ] Escribir una palabra: la búsqueda espera hasta que el usuario termina de escribir
- [ ] Buscar el mismo término 2 veces: solo 1 fetch (cache hit)
- [ ] Resultados correctos de commitments, companies, payments, users

### 13.2 Métricas a Medir

Usar la pestaña **Network** de Chrome DevTools, filtrar por `firestore.googleapis.com`:

| Escenario | ANTES (esperado) | DESPUÉS (esperado) |
|-----------|-----------------|-------------------|
| **Login → Dashboard** | ~5-8 requests | ~5-8 requests (sin cambio, son listeners base) |
| **Dashboard → Commitments** | ~3-5 requests | **0-2 requests** (cache hit) |
| **Commitments → Payments** | ~5-8 requests | **0-2 requests** (cache hit) |
| **Payments → BankAccounts** | ~6-10 requests | **0-1 requests** (todo en cache) |
| **Ctrl+R en BankAccounts** | ~10-15 requests | **0 requests** (localStorage restore) |
| **Búsqueda "factura"** | ~28 requests | **4 requests** (debounce + cache) |

---

## 14. MÉTRICAS DE ÉXITO

### 14.1 Reducción de Lecturas Firestore

| Métrica | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| **Listeners activos por sesión** | ~52 puntos de acceso | ~8-12 (solo real-time necesario) | **~77%** |
| **Listeners duplicados companies** | 10+ | 0 | **100%** |
| **Llamadas N+1** | ~150+ por sesión | 2-3 batch queries | **~98%** |
| **Lecturas por navegación entre páginas** | 3-8 por página | 0-2 (cache hit) | **~80%** |
| **Lecturas por búsqueda global** | ~28 por palabra | 4 por búsqueda final | **~86%** |
| **Lecturas totales estimadas por sesión (1h)** | ~500-800 | ~100-200 | **~73-75%** |

### 14.2 Mejoras de UX

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Navegación entre páginas** | 0.5-2s spinner | **Instantáneo** (cache hit) |
| **Recarga de página (Ctrl+R)** | 1-3s spinner | **<100ms** (localStorage restore) |
| **Búsqueda global** | Flash de resultados por tecla | **Resultados suaves** (debounce) |
| **Crear/Editar/Eliminar** | Esperar onSnapshot | **Actualización inmediata** (invalidación) |

### 14.3 Impacto en Costos Firebase

Para un escenario de **1 usuario activo, 8h/día:**

| Tipo | Antes | Después |
|------|-------|---------|
| Lecturas/día | ~4,000-6,400 | ~800-1,600 |
| Lecturas/mes (30 días) | ~120,000-192,000 | ~24,000-48,000 |

Para **50 usuarios activos:**

| Tipo | Antes | Después |
|------|-------|---------|
| Lecturas/mes | ~6M-9.6M | ~1.2M-2.4M |
| Costo estimado/mes | ~$2.16-$3.56 | ~$0.43-$0.86 |

*Nota: Los costos de Firestore son $0.36 por 100K lecturas después de las 50K/día gratis.*

### 14.4 Cronograma de Implementación

| Fase | Estimación | Descripción |
|------|-----------|-------------|
| Fase 0 | 5 minutos | Instalación npm |
| Fase 1 | 30 minutos | QueryClient + App.jsx |
| Fase 2 | 2 horas | Hooks fundacionales |
| Fase 3 | 3 horas | Eliminar 10 listeners dup companies |
| Fase 4 | 3 horas | Hooks principales (5 colecciones) |
| Fase 5 | 6 horas | Migrar 15+ páginas pesadas |
| Fase 6 | 2 horas | Resolver patrón N+1 |
| Fase 7 | 1 hora | Persistencia localStorage |
| Fase 8 | 1 hora | Debounce búsqueda global |
| **TOTAL** | **~18-20 horas** | ~3-4 días de trabajo enfocado |

---

## APÉNDICE A: CONSIDERACIONES TÉCNICAS

### A.1 Compatibilidad con Firebase IndexedDB Persistence

Firebase SDK ya tiene `enableIndexedDbPersistence(db)` activo en `src/config/firebase.js`. Esto significa que Firebase ya cachea documentos en IndexedDB para uso **offline**.

**¿Conflicto con React Query?** No. Son capas complementarias:
- **Firebase IndexedDB:** Cache a nivel del SDK. Reduce latencia de red, pero sigue contando como "lectura" y sigue ejecutando la query.
- **React Query:** Cache a nivel de aplicación. Evita ejecutar la query por completo si los datos son "frescos" (dentro del `staleTime`).

React Query actúa **antes** de que Firebase toque IndexedDB.

### A.2 ¿Qué pasa con los datos real-time que necesitan estar siempre actualizados?

Para los pocos casos que necesitan real-time absoluto:
- **Alertas, notificaciones:** Mantener `onSnapshot` (NO migrar a React Query)
- **Perfil del usuario, settings:** Ya tienen su propio cache en localStorage
- **Presencia (online/offline):** RTDB, no Firestore

Para datos de trabajo (commitments, payments, incomes):
- React Query con `staleTime: 2 min` significa que los datos podem tener hasta 2 minutos de retraso
- **Para este dashboard, 2 minutos de retraso es aceptable** (no es trading en tiempo real)
- Cualquier mutación (crear/editar/eliminar) invalida el cache inmediatamente → datos se refetchean

### A.3 ¿Qué pasa si 2 usuarios editan el mismo documento?

Con `onSnapshot`, ambos ven el cambio inmediatamente.
Con React Query, el segundo usuario verá el cambio cuando expire el `staleTime` (2 min) o cuando reenfoque la ventana (si `refetchOnWindowFocus: true`).

**Mitigación:** Para formularios de edición, SIEMPRE hacer `refetch()` antes de abrir el modal de edición:

```javascript
const { data, refetch } = useFirestoreDoc(...);

const handleEdit = async () => {
  await refetch(); // Obtener datos frescos antes de editar
  setEditModalOpen(true);
};
```

### A.4 ¿Puedo migrar gradualmente?

**SÍ.** Esta es la mayor ventaja de React Query. Puedes:
1. Instalar React Query y agregar el provider (Fase 0-1)
2. Migrar UNA página a la vez
3. Las páginas no migradas siguen funcionando con `onSnapshot`
4. No hay conflicto entre páginas migradas y no migradas

**La migración es 100% incremental y reversible.**

### A.5 Invalidación Cruzada entre Páginas

Cuando el usuario crea un pago en `NewPaymentPage`, el cache de `PaymentsPage` debe invalidarse. Esto se logra con las `invalidateKeys` en `useFirestoreMutation`:

```javascript
// En NewPaymentPage:
const { addPayment } = usePaymentsQuery();

// Crear pago → automáticamente invalida ['payments'] en toda la app
await addPayment({ amount: 1000, ... });

// Cuando el usuario navega a PaymentsPage, React Query detecta que
// ['payments'] está invalidada → refetch automático → datos frescos
```

---

## APÉNDICE B: COEXISTENCIA CON CompaniesContext

### B.1 Estrategia de Transición

`CompaniesContext` actualmente proporciona un listener compartido correcto. Hay dos opciones:

**Opción A (recomendada): Mantener CompaniesContext + usar useCompaniesQuery internamente**

Modificar `CompaniesContext` para que internamente use `useCompaniesQuery` en lugar de `onSnapshot` directo. Esto mantiene la API pública (`useCompaniesContext()`) intacta y todos los consumidores existentes siguen funcionando.

**Opción B: Eliminar CompaniesContext + usar useCompaniesQuery directamente**

Reemplazar todas las llamadas a `useCompaniesContext()` por `useCompaniesQuery()`. Requiere actualizar más archivos pero es más limpio a largo plazo.

### B.2 Implementación Opción A (Mínimo Cambio)

```jsx
// CompaniesContext.jsx modificado
import { useCompaniesQuery } from '../hooks/useCompaniesQuery';

export const CompaniesProvider = ({ children }) => {
  const { companies, isLoading: loading, error, findCompanyByNIT } = useCompaniesQuery();

  const value = { companies, loading, error, findCompanyByNIT };

  return (
    <CompaniesContext.Provider value={value}>
      {children}
    </CompaniesContext.Provider>
  );
};
```

De esta forma, `CompaniesContext` se convierte en un **thin wrapper** sobre React Query, y todos los consumidores existentes (como `useCompanies()`) siguen funcionando sin cambios.

---

## APÉNDICE C: CHECKLIST DE NO REGRESIÓN

Antes de hacer deploy, verificar que **NINGUNA** de estas funcionalidades se rompió:

- [ ] Login/Logout funciona
- [ ] Dashboard principal carga estadísticas
- [ ] Crear compromiso y verlo en la lista
- [ ] Crear pago y verlo en la lista
- [ ] Crear ingreso y verlo en la lista
- [ ] Registrar empresa nueva
- [ ] Filtrar compromisos por empresa/estado/fecha
- [ ] Búsqueda global encuentra resultados
- [ ] Exportar Excel genera archivo correctamente
- [ ] Liquidaciones por sala calcula correctamente
- [ ] Asistencias muestra registros del día
- [ ] Tareas delegadas se crean y asignan correctamente
- [ ] Alertas de contratos por vencer se generan
- [ ] Perfil de usuario se actualiza
- [ ] Cambios de permisos se reflejan inmediatamente
- [ ] Offline: App no crashea sin internet
