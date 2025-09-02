---
title: Plan Estricto de Implementación del Sistema de Permisos
version: 1.0.0
date: 2025-09-02
status: draft
authors: ["Arquitectura de Seguridad"]
related_spec: ./permissions-spec-v1.md
---

# Plan Estricto de Implementación del Sistema de Permisos

Documento operacional derivado de la especificación (`permissions-spec-v1.md`). Optimizado para minimizar riesgo y habilitar rollback rápido.

## Índice
1. Alcance y Objetivo
2. Principios de Seguridad y Riesgo
3. Fases (0–13) con Objetivo, Acciones, Validación y Rollback
4. Controles de Calidad (Quality Gates)
5. Scripts Requeridos
6. Orden de Commits Sugerido
7. Estrategia de Rollback en Producción
8. Métricas de Éxito y Monitoreo
9. Anexos (Plantillas de Scripts)

---
## 1. Alcance y Objetivo
Implementar un sistema RBAC+ABAC (rol + ámbito por empresa + overrides) sin interrupción de operaciones ni pérdida de datos, con auditoría y capacidad de revertir cualquier fase en <15 minutos.

## 2. Principios de Seguridad y Riesgo
| Principio | Aplicación |
|-----------|------------|
| Deny por defecto | Reglas Firestore/Storage sólo permiten si `can()` |
| Observación antes de enforcement | Hook en modo `observe` recolecta métricas |
| Cambios reversibles | Snapshot reglas, export Firestore, branch aislado |
| Mínimo blast radius | Gate UI gradual por tipo de acción |
| Auditoría inmutable | `auditLogs` sin update/delete |
| Rollback rápido | Scripts preparados (rules y env) |

Riesgos mayores: bloqueo masivo (reglas), datos inconsistentes (migración users), sobreexposición (error en matriz). Mitigados por pruebas en emulador + modo observación.

---
## 3. Fases Detalladas
Formato por fase: Objetivo / Acciones / Validación / Rollback.

### Fase 0: Preparación y Backups
- Objetivo: Punto seguro de retorno.
- Acciones:
  1. `firebase firestore:export ./backups/<fecha>`
  2. Script listado Storage → `backups/storage-inventory-<fecha>.csv`
  3. Verificar `package-lock.json` commit.
- Validación: Carpeta backups con export + CSV >0KB.
- Rollback: Import (gcloud) + restaurar reglas previas.

### Fase 1: Rama y Aislamiento
- Objetivo: Encapsular cambios.
- Acciones: `git checkout -b feature/permissions-system`
- Validación: Rama activa.
- Rollback: `git checkout main` + delete branch.

### Fase 2: Ampliar Modelo de Datos (Non-Disruptive)
- Objetivo: Añadir campos sin alterar lógica UI.
- Acciones:
  1. Script `backfillUsers.js` agrega faltantes: `companyIds: []`, `customPermissions: {}`, `isActive: true`.
  2. Log de usuarios modificados -> `logs/backfill-users.json`.
- Validación: 100% usuarios tienen campos (muestreo + conteo). 
- Rollback: Script inverso elimina campos añadidos (si se detecta issue grave antes de avanzar).

### Fase 3: Matriz de Permisos (Estática Local)
- Objetivo: Fuente única centralizada.
- Acciones: Crear `src/config/roleMatrix.js` con objeto roles→acciones.
- Validación: Import sin error en dev build.
- Rollback: Borrar archivo + referencias.

### Fase 4: Hook `usePermission` (Modo Observación) + Dashboard
- Objetivo: Medir impacto potencial sin bloquear + visualización.
- Acciones:
  1. Crear `src/hooks/usePermission.js`.
  2. Parametrizar por env `PermissionsMode=observe`.
  3. Registrar cada `wouldDeny` en consola + colección `auditLogs` con `logType: 'permissions'`.
  4. Extender `ActivityLogsPage` existente con filtro "Permission Monitoring".
  5. Crear componente `PermissionStats` (reutiliza patrón `ActivityStats`).
  6. Añadir columnas específicas: Recurso, Acción, Empresa, Decisión, Modo.
- Validación: UI intacta; logs generados; dashboard muestra % would-deny.
- Rollback: Eliminar hook + revertir cambios ActivityLogsPage.

### Fase 5: Instrumentación de Logging
- Objetivo: Cobertura de puntos críticos.
- Acciones: En funciones de crear/editar/eliminar/aprobar/exportar insertar `logPermissionCheck()`.
- Validación: Al ejecutar cada acción se registra evento (sample manual + script reconteo).
- Rollback: Revert commit con wrappers.

### Fase 6: Migración Completa de Usuarios
- Objetivo: Normalizar roles / overrides inválidos.
- Acciones: `migrateUsersRoles.js` (valida roles ∈ set permitido, limpia claves desconocidas en `customPermissions`).
- Validación: Reporte final sin entradas "invalidRole".
- Rollback: Restaurar snapshot usuarios (subset) desde export fase 0.

### Fase 7: Reglas Firestore/Storage (Draft Paralelo)
- Objetivo: Preparar reglas sin afectar producción.
- Acciones:
  1. Crear `firestore.rules.next`, `storage.rules.next`.
  2. Ajustar helpers y minimizar `get()`.
  3. Ejecutar emulador.
- Validación: Sin errores lint/sintaxis; tests iniciales manuales pasan.
- Rollback: Borrar `.next`.

### Fase 8: Suite de Pruebas (Unit + Integration Emulator)
- Objetivo: Garantizar comportamiento esperado.
- Acciones:
  1. Tests unit permisos (casos C1–C8).
  2. Tests integration rules (IR1–IR5).
  3. Cobertura: asegurar ≥90% ramas clave.
- Validación: Suite verde; cobertura objetivo.
- Rollback: Ajustar matriz/hook hasta verde; no avanzar sin cumplir.

### Fase 9: Gate UI Gradual
- Objetivo: Activar enforcement progresivo.
- Acciones (orden): delete → approve → edit/create → export → users/orphan.
- Al finalizar cada sub-paso, switch parcial del hook (para esas acciones aplicar realidad, resto observar).
- Validación: 24h sin falsos denies críticos tras cada sub-paso.
- Rollback: Reset `PermissionsMode=observe`.

### Fase 10: Auditoría (`auditLogs`)
- Objetivo: Trazabilidad.
- Acciones: Crear `utils/auditLogger.js` + llamadas post-éxito.
- Validación: Documentos con esquema correcto, índice `(companyId,timestamp)` funcionando.
- Rollback: Flag `AUDIT_ENABLED=false`.

### Fase 11: Staging Deploy + Canary
- Objetivo: Validar en entorno casi real.
- Acciones: Deploy reglas `.next` a staging → UI build.
- Canary: 1 admin, 1 editor, 1 viewer ejecutan checklist.
- Validación: Checklist 100% OK.
- Rollback: Reaplicar reglas previas staging.

### Fase 12: Producción (Ventana Controlada)
- Objetivo: Activar en vivo con bajo riesgo.
- Acciones:
  1. Congelar merges.
  2. Deploy reglas a prod.
  3. Set `PermissionsMode=enforce`.
  4. Monitor 30 min (denies rate / logs).
- Validación: Error rate permisos <1% total.
- Rollback (≤30 min): Revert reglas previas + `PermissionsMode=observe`.

### Fase 13: Post-Deploy y Endurecimiento
- Objetivo: Optimizar y cerrar riesgos residuales.
- Acciones: Analizar denies, eliminar overrides temporales, activar pruning TTL logs.
- Validación: Métricas estables día 7.
- Rollback: N/A (tuning incremental).

---
## 4. Controles de Calidad (Quality Gates)
| Gate | Fase | Criterio | Bloqueante |
|------|------|----------|-----------|
| Q1 | 2 | 100% usuarios con campos nuevos | Sí |
| Q2 | 4 | 0 errores runtime hook | Sí |
| Q3 | 8 | Suite verde + ≥90% cobertura | Sí |
| Q4 | 9 | ≤2 falsos deny/24h por sub-paso | Sí |
| Q5 | 11 | Checklist canary 100% | Sí |
| Q6 | 12 | Error rate <1% primeras 24h | Sí |

---
## 5. Scripts Requeridos
| Script | Archivo | Descripción |
|--------|---------|-------------|
| Backfill | `scripts/backfillUsers.js` | Añade campos iniciales faltantes |
| Migración roles | `scripts/migrateUsersRoles.js` | Normaliza roles/overrides |
| Observación | `scripts/scanPermissionLogs.js` | Analiza logs en modo observe |
| Export backup | `scripts/exportFirestore.cmd` | Backup rápido previa a deploy |
| Rollback reglas | `scripts/rollbackRules.cmd` | Reaplica reglas previas |

---
## 6. Orden de Commits Sugerido
1. feat(permissions): add roleMatrix + passive hook
2. chore(users): backfill script + fields
3. feat(logging): permission observation logs
4. feat(rules): draft next rules + emulator tests
5. test(permissions): unit + integration suite
6. feat(ui): gate delete & approvals
7. feat(audit): audit logger + indices
8. feat(ui): gate remaining actions
9. chore(release): enable enforce mode

---
## 7. Estrategia Rollback Producción
| Paso | Acción | Tiempo objetivo |
|------|--------|-----------------|
| R1 | Reaplicar `firestore.rules.prev` + `storage.rules.prev` | <5m |
| R2 | Set env `PermissionsMode=observe` y redeploy UI | <5m |
| R3 | Notificar stakeholders (canal incidentes) | <2m |
| R4 | Revisar dif logs errores vs baseline | <10m |

Prerequisitos: Guardar snapshot reglas antes de deploy (script automático en predeploy hook).

---
## 8. Métricas y Monitoreo
| Métrica | Fuente | Umbral | Acción si excede |
|---------|--------|--------|------------------|
| Denies rate | Logs Firestore | <1% | Revisar matriz / overrides |
| Override permanentes >30d | Auditoría overrides | 0 | Revisar necesidad real |
| Latencia lecturas P95 | Perf logs | <300ms | Optimizar reglas (reducir get) |
| Errores UI permisos | Sentry | 0 | Hotfix hook |
| Eventos audit faltantes | Comparación acciones críticas | 0 | Revisar instrumentación |

Dashboard inicial: tabla simple + script export logs → CSV → panel.

---
## 9. Anexos
### 9.1 Plantilla Backfill (Pseudocódigo)
```js
for each user in users:
  update missing fields (companyIds, customPermissions, isActive)
log summary counts
```

### 9.2 Plantilla Rollback Rules (Windows CMD)
```cmd
@echo off
set DATE=%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%
echo Restoring previous rules...
copy firestore.rules.prev firestore.rules /Y
copy storage.rules.prev storage.rules /Y
firebase deploy --only firestore:rules,storage:rules
```

### 9.3 Hook usePermission (Modo Dual Simplificado + Dashboard)
```js
const MODE = import.meta.env.VITE_PERMISSIONS_MODE || 'observe';
export function usePermission(){
  const user = useUserProfile();
  function check(res, act, companyId){
    const decision = internalEvaluate(user, res, act, companyId); // true/false
    
    // Registrar en auditLogs para dashboard ActivityLogsPage
    logPermissionCheck({
      action: `${res}.${act}`,
      entityType: 'permissions',
      decision: decision ? 'allow' : 'deny',
      mode: MODE,
      companyId,
      metadata: { resource: res, action: act }
    });
    
    if(MODE==='observe') return true; // permitir pero loggear si decision=false
    return decision;
  }
  return { has: check };
}
```

### 9.4 Extensiones ActivityLogsPage
**Componente PermissionStats** (similar a ActivityStats):
- % de would-deny por recurso
- Top 5 acciones más restrictivas
- Distribución por modo (observe/enforce)

**Filtros adicionales**:
- Toggle "Show Permission Checks"
- Filtro por recurso
- Filtro por decisión (allow/deny)

### 9.5 Tabla Sub-pasos Gate UI
| Orden | Acción | Permisos |
|-------|--------|----------|
| 1 | Delete compromisos/pagos | commitments.delete / payments.delete |
| 2 | Approve pagos | payments.approve |
| 3 | Edit/Create compromisos/pagos | commitments.create/edit, payments.create/edit |
| 4 | Export reportes | reports.export |
| 5 | Gestión usuarios + orphan scan | users.*, system.orphan_scan |

---
Documento operativo. Cualquier desviación debe registrarse con motivo y aprobación responsable técnico.
