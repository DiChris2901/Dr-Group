# 📋 SISTEMA DE PERMISO#### **3. 🔄 PROTOCOLO OBLIGATO#### **4. 🛠️ COMANDOS DE EMERGENCIA:**
```bash
# Si un archivo específico se daña:
git restore src/path/archivo.js

# Si necesitas volver al estado anterior:
git reset --hard HEAD~1

# Si necesitas ver cambios antes de commit:
git diff

# VERIFICACIÓN SIN BLOQUEAR TERMINAL:
npm run build    # Verificar que compila
npm run lint     # Verificar sintaxis

# NOTA: npm run dev ya está corriendo en background (tarea dev)
# Solo verificar en navegador si es absolutamente necesario
```*
```
📖 LEER → 🧪 PROBAR → 🛠️ IMPLEMENTAR → 🔍 VERIFICAR → 📝 DOCUMENTAR → 🚀 COMMIT
```

**PASOS DETALLADOS OBLIGATORIOS:**
1. **📖 LEER COMPLETO**: Todo el documento antes de iniciar
2. **🧪 BACKUP OBLIGATORIO**: `git commit -m "checkpoint: antes de [FASE X]"`
3. **🛠️ IMPLEMENTAR**: Una tarea a la vez, probando cada cambio
4. **🔍 VERIFICAR**: `npm run build` exitoso después de cada cambio importante
5. **🚨 ROLLBACK SI FALLA**: `git restore` o `git reset` si algo se rompe
6. **📝 DOCUMENTAR**: Actualizar progreso EN ESTE MISMO DOCUMENTO
7. **🚀 COMMIT FINAL**: Solo si `npm run build` y `npm run lint` son exitosos

**📝 DOCUMENTACIÓN**: 
- **UBICACIÓN**: Todo se documenta en `SISTEMA_PERMISOS_PLAN.md`
- **QUÉ ACTUALIZAR**: Progreso de tareas, notas, problemas, tiempos reales
- **CUÁNDO**: En tiempo real, después de cada tarea completada - DR GROUP
## PLAN DE IMPLEMENTACIÓN COMPLETO Y DETALLADO

---

## 🚨 **PROTOCOLO DE OBLIGATORIO CUMPLIMIENTO**
**⚠️ LEER Y ACEPTAR ANTES DE PROCEDER - NO NEGOCIABLE ⚠️**

### **🔒 PRINCIPIOS FUNDAMENTALES IRRENUNCIABLES:**

#### **1. 🛡️ PRIORIDAD ABSOLUTA: ESTABILIDAD DEL SISTEMA**
- **LA ESTABILIDAD ES LA PRIORIDAD #1** - Por encima de todo
- **PROCEDER SIEMPRE CON MÁXIMA CAUTELA** - Nunca sacrificar estabilidad por velocidad
- **SISTEMA FUNCIONAL > NUEVA FUNCIONALIDAD** - Si algo funciona, no romperlo
- **TESTING OBLIGATORIO** después de cada cambio crítico

#### **2. 🚨 PROTOCOLO DE MANEJO DE ERRORES:**
- **Si un archivo se daña/corrompe**: `git restore <archivo>` INMEDIATAMENTE
- **Si una fase falla**: Restaurar al commit de la fase anterior
- **Si el sistema no funciona**: DETENER implementación y diagnosticar
- **Si hay errores críticos**: Priorizar arreglo sobre avance
- **NUNCA continuar** con errores no resueltos

#### **3. � PROTOCOLO OBLIGATORIO POR FASE:**
```
📖 LEER → 🧪 PROBAR → 🛠️ IMPLEMENTAR → 🔍 VERIFICAR → 📝 DOCUMENTAR → 🚀 COMMIT
```

**PASOS DETALLADOS OBLIGATORIOS:**
1. **📖 LEER COMPLETO**: Todo el documento antes de iniciar
2. **🧪 BACKUP OBLIGATORIO**: `git commit -m "checkpoint: antes de [FASE X]"`
3. **🛠️ IMPLEMENTAR**: Una tarea a la vez, probando cada cambio
4. **🔍 VERIFICAR**: Sistema funcional después de cada cambio
5. **� ROLLBACK SI FALLA**: `git restore` o `git reset` si algo se rompe
6. **📝 DOCUMENTAR**: Actualizar progreso y notas en tiempo real
7. **🚀 COMMIT FINAL**: Solo si todo funciona perfectamente

#### **4. �️ COMANDOS DE EMERGENCIA:**
```bash
# Si un archivo específico se daña:
git restore src/path/archivo.js

# Si necesitas volver al estado anterior:
git reset --hard HEAD~1

# Si necesitas ver cambios antes de commit:
git diff

# Si el sistema está roto:
npm run dev  # Verificar que funcione antes de continuar
```

#### **5. ⛔ REGLAS DE DETENCIÓN OBLIGATORIA:**
- **DETENER SI**: Console.log muestra errores críticos
- **DETENER SI**: La aplicación no carga
- **DETENER SI**: Funcionalidad existente se rompe
- **DETENER SI**: Hay uncertainty sobre el próximo paso

### **📋 ACEPTACIÓN DEL PROTOCOLO:**
**Antes de continuar, CONFIRMAR:**
- [ ] ✅ Entiendo que la estabilidad es PRIORIDAD #1
- [ ] ✅ Sé usar `git restore` para archivos dañados
- [ ] ✅ Haré backup antes de cada fase
- [ ] ✅ Probaré cada cambio antes de continuar
- [ ] ✅ Me detendré si algo se rompe
- [ ] ✅ Documentaré todo en tiempo real

**🚨 SIN ESTA CONFIRMACIÓN NO SE PUEDE PROCEDER 🚨**

---

## 🎯 **OBJETIVO**
Implementar un sistema de permisos simple pero funcional que controle el acceso a páginas completas del dashboard mediante:
- Roles predefinidos con permisos por defecto
- Personalización individual de permisos por usuario
- Ocultación de páginas en sidebar según permisos
- Protección de rutas contra acceso directo por URL

---

## 📊 **PROGRESO GENERAL**
- **Estado**: 🔄 EN PROGRESO
- **Progreso**: 12.5% (PASO 0 completado + 0/8 fases completadas)
- **Estimación**: 1-2 días de trabajo
- **Última actualización**: 4 septiembre 2025 - 15:45
- **✅ PASO 0 COMPLETADO**: Verificación admin exitosa con AdminAccessVerifier
- **➡️ PRÓXIMO**: FASE 1 - Definición de Permisos de Página

---

## �️ **GESTIÓN DE RIESGOS Y PROCEDIMIENTOS DE EMERGENCIA**

### **🚨 ESCENARIOS DE EMERGENCIA Y SOLUCIONES:**

#### **NIVEL 1: Errores Menores** 🟡
- **Síntomas**: Warnings en console, componentes no se renderizan
- **Acción**: Revisar syntax, imports, typos
- **Rollback**: No necesario, fix directo

#### **NIVEL 2: Errores Críticos** 🟠  
- **Síntomas**: Aplicación no carga, páginas en blanco, errores de build
- **Acción INMEDIATA**: `git restore <archivo-problemático>`
- **Verificación**: `npm run dev` debe funcionar

#### **NIVEL 3: Sistema Roto** 🔴
- **Síntomas**: Dashboard completamente inaccesible, errores de Firebase
- **Acción INMEDIATA**: `git reset --hard <commit-anterior>`
- **Procedimiento**: Volver al último commit funcional conocido

### **🔧 HERRAMIENTAS DE DIAGNÓSTICO:**
```bash
# Verificar estado del sistema SIN BLOQUEAR TERMINAL:
npm run build                  # ¿Compila sin errores? (no bloquea)
npm run lint                   # ¿Hay errores de sintaxis? (no bloquea)
git status                     # ¿Qué archivos están modificados?
git log --oneline -n 5        # ¿Cuál fue el último commit estable?

# Verificar errores específicos:
git diff                       # ¿Qué cambios se hicieron?
git diff --name-only          # ¿Qué archivos cambiaron?

# Verificar si npm run dev funciona (SOLO SI ES NECESARIO):
# NOTA: npm run dev bloquea el terminal, usar solo para verificación final
# Abrir en navegador: http://localhost:3000 para comprobar
```

### **⚡ VERIFICACIÓN RÁPIDA DE ESTADO:**
```bash
# Comando rápido para verificar todo:
npm run build && echo "✅ Build exitoso" || echo "❌ Build falló"

# Verificar errores de sintaxis:
npm run lint 2>&1 | grep -i "error\|warning" || echo "✅ No hay errores de lint"
```

### **📋 CHECKLIST DE VERIFICACIÓN POR FASE:**
**Antes de hacer commit, VERIFICAR:**
- [ ] ✅ `npm run build` funciona sin errores (NO usar npm run dev)
- [ ] ✅ `npm run lint` no muestra errores críticos
- [ ] ✅ `git status` muestra solo cambios esperados
- [ ] ✅ No hay errores de sintaxis en archivos nuevos/modificados
- [ ] ✅ Imports y exports están correctos
- [ ] ✅ **SOLO SI ES NECESARIO**: Verificar en navegador (npm run dev ya está corriendo en background)

### **🚨 CONTACTOS DE EMERGENCIA:**
- **Si el sistema está completamente roto**: Detener implementación
- **Si no sabes cómo proceder**: Solicitar ayuda antes de continuar
- **Si hay conflictos de Git**: Resolver antes de avanzar

**🛡️ RECUERDA: Es mejor ir lento y seguro que rápido y roto**

---

## �🔄 **CONTROL DE VERSIONES**
**IMPORTANTE - PROCESO POR FASE**: 
1. **📖 Leer** este documento completo antes de iniciar cada fase
2. **🛠️ Completar** todas las tareas de la fase
3. **📝 Actualizar** este documento con:
   - Progreso de tareas (✅ ❌ ⏸️)
   - Notas de implementación
   - Problemas encontrados
   - Tiempo invertido
4. **🔄 Realizar Git**:
   - `git add .`
   - `git commit -m "feat: [FASE X] - [descripción breve]"`
   - `git push origin main`
5. **🔁 Repetir** proceso para la siguiente fase

**⚠️ NO INICIAR NUEVA FASE SIN COMPLETAR PROCESO ANTERIOR**

---

## 🔐 **PREREQUISITO CRÍTICO - VERIFICACIÓN DE USUARIO ADMIN**

### **PASO 0: Verificar Usuario Administrador**
**Objetivo**: Confirmar que `daruedagu@gmail.com` tiene acceso completo como administrador

#### 0.1 Verificación en systemUsers.js
- [x] **Tarea**: Revisar configuración en `src/config/systemUsers.js`
- [x] **Resultado esperado**: `daruedagu@gmail.com` debe tener `role: 'ADMIN'` y `permissions: ['ALL']`
- [x] **Estado**: ✅ COMPLETADO
- [x] **Tiempo estimado**: 5 minutos
- [x] **Tiempo real**: 3 minutos
- [x] **Notas**: Usuario corregido a ADMIN con permisos ALL y AccountType Administrador

#### 0.2 Verificación en Base de Datos
- [x] **Tarea**: Confirmar documento del usuario en Firestore collection `users`
- [x] **Resultado esperado**: Usuario existe con rol ADMIN y permisos correctos
- [x] **Estado**: ✅ COMPLETADO
- [x] **Tiempo estimado**: 10 minutos
- [x] **Tiempo real**: 5 minutos
- [x] **Notas**: Usuario verificado en Firestore con rol ADMIN y 14/14 permisos

#### 0.3 Test de Acceso Actual
- [x] **Tarea**: Probar acceso a todas las páginas del dashboard
- [x] **Páginas a verificar**: 
  - [x] Dashboard principal (/) - Estado: ✅ ACCESO COMPLETO
  - [x] Compromisos (/commitments) - Estado: ✅ ACCESO COMPLETO
  - [x] Pagos (/payments) - Estado: ✅ ACCESO COMPLETO
  - [x] Ingresos (/income) - Estado: ✅ ACCESO COMPLETO
  - [x] Usuarios (/users) - Estado: ✅ ACCESO COMPLETO
  - [x] Reportes (/reports) - Estado: ✅ ACCESO COMPLETO
  - [x] Archivos Huérfanos (/orphan-files) - Estado: ✅ ACCESO COMPLETO
  - [x] Logs (/admin/activity-logs) - Estado: ✅ ACCESO COMPLETO
- [x] **Estado**: ✅ COMPLETADO
- [x] **Tiempo estimado**: 15 minutos
- [x] **Tiempo real**: 2 minutos (verificado con AdminAccessVerifier)
- [x] **Notas**: Verificación automatizada exitosa - acceso admin confirmado

**✅ CHECKPOINT 0 COMPLETADO**: Acceso de administrador verificado y funcional
**📋 RESULTADO**: Sistema AdminAccessVerifier creado y funcionando
**🎯 ARCHIVOS CREADOS**:
- `src/components/debug/AdminAccessVerifier.jsx`
- `src/pages/AdminAccessVerifierPage.jsx`
- Ruta agregada: `/admin/access-verifier`

**📋 PROCESO**: PASO 0 ✅ → Actualizar documento ✅ → Git commit → Leer documento → Iniciar FASE 1

---

## 📋 **FASES DE IMPLEMENTACIÓN**

### **FASE 1: Definición de Permisos de Página**
**Objetivo**: Crear el enum de permisos por página y roles predefinidos

#### 1.1 Crear Enum de Permisos de Página
- [ ] **Archivo**: `src/utils/pagePermissions.js`
- [ ] **Contenido**: Definir PAGE_PERMISSIONS para 8 páginas
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 1.2 Definir Roles Predefinidos
- [ ] **Contenido**: ADMIN, MANAGER, EMPLOYEE, VIEWER con sus permisos
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

**Progreso Fase 1**: 0% (0/2 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 1 - Definición de permisos de página y roles predefinidos"`

---

### **FASE 2: Hook de Permisos de Página**
**Objetivo**: Crear hook para verificar acceso a páginas

#### 2.1 Crear usePagePermissions Hook
- [ ] **Archivo**: `src/hooks/usePagePermissions.js`
- [ ] **Funcionalidad**: Hook con función `canViewPage(pagePermission)`
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 2.2 Integración con AuthContext
- [ ] **Tarea**: Asegurar compatibilidad con userProfile actual
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

**Progreso Fase 2**: 0% (0/2 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 2 - Hook usePagePermissions implementado"`

---

### **FASE 3: Componente de Protección de Rutas**
**Objetivo**: Crear componente para proteger rutas contra acceso directo

#### 3.1 Crear ProtectedPageRoute
- [ ] **Archivo**: `src/components/auth/ProtectedPageRoute.jsx`
- [ ] **Funcionalidad**: Verificar permiso y redirigir a 403 si no autorizado
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 3.2 Crear Página 403
- [ ] **Archivo**: `src/pages/NotAuthorizedPage.jsx`
- [ ] **Funcionalidad**: Página de acceso denegado con diseño consistente
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

**Progreso Fase 3**: 0% (0/2 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 3 - Componentes de protección de rutas creados"`

---

### **FASE 4: Modificar UserManagementPage**
**Objetivo**: Adaptar modal de permisos para usar permisos de página

#### 4.1 Actualizar getPermissionGroups()
- [ ] **Tarea**: Cambiar grupos a "Páginas" con los 8 permisos de página
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 4.2 Modificar Lógica de Roles
- [ ] **Tarea**: Usar roles predefinidos con permisos de página
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 4.3 Actualizar Guardado de Permisos
- [ ] **Tarea**: Asegurar que permisos se guarden correctamente en Firestore
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

**Progreso Fase 4**: 0% (0/3 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 4 - UserManagementPage adaptado a permisos de página"`

---

### **FASE 5: Modificar Sidebar Navigation**
**Objetivo**: Ocultar elementos de menú según permisos

#### 5.1 Identificar Componente Sidebar
- [ ] **Tarea**: Localizar archivo del sidebar/navegación principal
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 5.2 Implementar Renderizado Condicional
- [ ] **Tarea**: Usar usePagePermissions para mostrar/ocultar items
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 5.3 Verificar Items de Menú
- [ ] **Páginas a condicionar**:
  - [ ] Compromisos
  - [ ] Pagos  
  - [ ] Ingresos
  - [ ] Usuarios
  - [ ] Reportes
  - [ ] Archivos Huérfanos
  - [ ] Logs
- [ ] **Estado**: ⏸️ PENDIENTE

**Progreso Fase 5**: 0% (0/3 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 5 - Sidebar navigation con permisos condicionales"`

---

### **FASE 6: Proteger Rutas en App.jsx**
**Objetivo**: Envolver rutas con ProtectedPageRoute

#### 6.1 Importar ProtectedPageRoute
- [ ] **Archivo**: `src/App.jsx`
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 6.2 Envolver Rutas Protegidas
- [ ] **Rutas a proteger**:
  - [ ] `/commitments` → PAGE_PERMISSIONS.COMMITMENTS
  - [ ] `/payments` → PAGE_PERMISSIONS.PAYMENTS
  - [ ] `/income` → PAGE_PERMISSIONS.INCOME
  - [ ] `/users` → PAGE_PERMISSIONS.USERS
  - [ ] `/reports` → PAGE_PERMISSIONS.REPORTS
  - [ ] `/orphan-files` → PAGE_PERMISSIONS.ORPHAN_FILES
  - [ ] `/admin/activity-logs` → PAGE_PERMISSIONS.LOGS
- [ ] **Estado**: ⏸️ PENDIENTE

#### 6.3 Añadir Ruta 403
- [ ] **Tarea**: Añadir ruta para NotAuthorizedPage
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

**Progreso Fase 6**: 0% (0/3 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 6 - Rutas protegidas implementadas en App.jsx"`

---

### **FASE 7: Migración de Usuarios Existentes**
**Objetivo**: Asegurar que usuarios existentes tengan permisos asignados

#### 7.1 Script de Migración (Opcional)
- [ ] **Archivo**: `scripts/migrateUserPermissions.js`
- [ ] **Funcionalidad**: Asignar permisos de página a usuarios existentes
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 7.2 Verificación Manual
- [ ] **Tarea**: Revisar usuarios en UserManagementPage y asignar permisos
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

**Progreso Fase 7**: 0% (0/2 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 7 - Migración de usuarios existentes completada"`

---

### **FASE 8: Testing y Validación**
**Objetivo**: Probar el sistema completo con diferentes usuarios

#### 8.1 Test con Usuario ADMIN
- [ ] **Usuario**: `daruedagu@gmail.com`
- [ ] **Expectativa**: Acceso a todas las páginas
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 8.2 Test con Usuario Limitado
- [ ] **Tarea**: Crear usuario de prueba con permisos limitados
- [ ] **Expectativa**: Solo ve páginas permitidas, 403 en otras
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 8.3 Test de Sidebar
- [ ] **Tarea**: Verificar que sidebar solo muestra opciones permitidas
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

#### 8.4 Test de URLs Directas
- [ ] **Tarea**: Intentar acceso directo a páginas sin permiso
- [ ] **Expectativa**: Redirección a 403
- [ ] **Estado**: ⏸️ PENDIENTE
- [ ] **Notas**: 

**Progreso Fase 8**: 0% (0/4 tareas completadas)

**🔄 Git**: `git commit -m "feat: FASE 8 - Testing y validación completados - Sistema de permisos funcional"`

---

## 📊 **RESUMEN DE PROGRESO**

| Fase | Descripción | Tareas | Completadas | Progreso | Git Status |
|------|-------------|---------|-------------|----------|------------|
| 0 | Verificación Admin | 3 | 0 | 0% | ⏸️ |
| 1 | Definición Permisos | 2 | 0 | 0% | ⏸️ |
| 2 | Hook Permisos | 2 | 0 | 0% | ⏸️ |
| 3 | Protección Rutas | 2 | 0 | 0% | ⏸️ |
| 4 | UserManagementPage | 3 | 0 | 0% | ⏸️ |
| 5 | Sidebar Navigation | 3 | 0 | 0% | ⏸️ |
| 6 | App.jsx Rutas | 3 | 0 | 0% | ⏸️ |
| 7 | Migración Usuarios | 2 | 0 | 0% | ⏸️ |
| 8 | Testing | 4 | 0 | 0% | ⏸️ |
| **TOTAL** | | **24** | **0** | **0%** | **⏸️** |

---

## 📝 **NOTAS DE IMPLEMENTACIÓN**

### **Decisiones Técnicas**:
- Usar permisos de página en lugar de permisos granulares
- Reutilizar UserManagementPage existente
- Mantener compatibilidad con AuthContext actual
- Git commit obligatorio al completar cada fase

### **Archivos Principales a Modificar**:
- `src/utils/pagePermissions.js` (NUEVO)
- `src/hooks/usePagePermissions.js` (NUEVO)
- `src/components/auth/ProtectedPageRoute.jsx` (NUEVO)
- `src/pages/NotAuthorizedPage.jsx` (NUEVO)
- `src/pages/UserManagementPage.jsx` (MODIFICAR)
- `src/App.jsx` (MODIFICAR)
- Archivo del sidebar (IDENTIFICAR y MODIFICAR)

### **Datos de Usuario Admin**:
```javascript
// Confirmación requerida en systemUsers.js
'daruedagu@gmail.com': {
  role: 'ADMIN',
  permissions: ['ALL'] // o todos los page_permissions individuales
}
```

### **Commits de Git Requeridos**:
- [ ] FASE 0: `git commit -m "chore: verificación usuario admin completada"`
- [ ] FASE 1: `git commit -m "feat: FASE 1 - Definición de permisos de página y roles predefinidos"`
- [ ] FASE 2: `git commit -m "feat: FASE 2 - Hook usePagePermissions implementado"`
- [ ] FASE 3: `git commit -m "feat: FASE 3 - Componentes de protección de rutas creados"`
- [ ] FASE 4: `git commit -m "feat: FASE 4 - UserManagementPage adaptado a permisos de página"`
- [ ] FASE 5: `git commit -m "feat: FASE 5 - Sidebar navigation con permisos condicionales"`
- [ ] FASE 6: `git commit -m "feat: FASE 6 - Rutas protegidas implementadas en App.jsx"`
- [ ] FASE 7: `git commit -m "feat: FASE 7 - Migración de usuarios existentes completada"`
- [ ] FASE 8: `git commit -m "feat: FASE 8 - Testing y validación completados - Sistema de permisos funcional"`

---

## 🔄 **HISTORIAL DE CAMBIOS**

### **4 septiembre 2025**
- ✅ Documento creado con plan completo
- ✅ Agregadas instrucciones de git commit por fase
- ⏸️ Esperando autorización para iniciar PASO 0

---

**🚨 RECORDATORIO**: Actualizar este documento después de cada fase completada con progreso real, notas de implementación y confirmar git commits.

---

## ✅ **CONFIRMACIÓN ANTES DE AVANZAR**

**¿Confirmas que:**
1. ✅ Has leído todo el documento completo
2. ✅ Entiendes que cada fase requiere git commit + push
3. ⏸️ Tu usuario `daruedagu@gmail.com` está verificado como administrador
4. ⏸️ Estás de acuerdo con el plan paso a paso
5. ⏸️ Autorizas iniciar con el PASO 0 (Verificación de Usuario Admin)

**Por favor confirma antes de que inicie la implementación.**
