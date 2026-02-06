# 🚀 MEJORAS TÉCNICAS - SISTEMA DE TAREAS

## 📋 RESUMEN EJECUTIVO

Este documento detalla las especificaciones técnicas para implementar 6 mejoras críticas en TasksPage:

1. **Subtareas (UI completa)** - Checklist interactivo
2. **Etiquetas (UI completa)** - Tags con colores personalizables
3. **Time Tracking** - Registro de tiempo trabajado
4. **Recordatorios automáticos** - Notificaciones inteligentes
5. **Drag & Drop Kanban** - Arrastrar y soltar entre columnas
6. **Ordenar Por (Sort)** - Control de ordenamiento de tareas

**Tiempo estimado total:** 8.5-9.5 días de desarrollo  
**Impacto:** Alto - Mejora productividad 40-60%

---

## 1. SUBTAREAS (CHECKLIST INTERACTIVO) ✅

### 📊 ESTADO ACTUAL
- ✅ **Estructura de datos existe**: `checklistItems: []` en useDelegatedTasks.js
- ❌ **No hay UI para crear subtareas**
- ❌ **No se visualizan en las cards**
- ❌ **No se visualizan en el modal de detalles**

### 🎯 OBJETIVO
Permitir al usuario desglosar tareas complejas en pasos accionables con checkboxes.

### 📐 ESPECIFICACIÓN TÉCNICA

#### **A. Estructura de Datos (Ya existe, solo agregar campos adicionales)**
```javascript
// Firestore: delegated_tasks/{taskId}
{
  checklistItems: [
    {
      id: "sub1",                    // UUID único
      texto: "Revisar facturas",     // Descripción del paso
      completado: true,              // Estado
      orden: 0,                      // Para reordenar
      creadoPor: {
        uid: "user123",
        nombre: "Juan Pérez",
        fecha: Timestamp
      },
      completadoPor: {               // Quién lo marcó
        uid: "user456",
        nombre: "María García",
        fecha: Timestamp
      }
    }
  ],
  
  // Auto-calculado al guardar:
  subtareasTotal: 5,
  subtareasCompletadas: 2,
  porcentajeSubtareas: 40  // (2/5) * 100
}
```

#### **B. Componente: SubtaskManager.jsx (NUEVO)**

**Ubicación:** `src/components/tasks/SubtaskManager.jsx`

**Props:**
- `taskId` (string) - ID de la tarea padre
- `subtasks` (array) - Lista de subtareas
- `onUpdate` (function) - Callback al actualizar
- `readOnly` (boolean) - Solo lectura o editable

**Funcionalidades:**
- ✅ Agregar nueva subtarea (input + botón)
- ✅ Marcar/desmarcar completado (checkbox)
- ✅ Editar texto (inline edit con Enter/Escape)
- ✅ Eliminar subtarea (icono X)
- ✅ Reordenar (drag & drop opcional)
- ✅ Mostrar quién completó y cuándo
- ✅ Barra de progreso visual

**Diseño:**
```
┌────────────────────────────────────────────┐
│ SUBTAREAS (3 de 5 completadas)     60%    │
│ ━━━━━━━━━━━━━░░░░░░░                      │
├────────────────────────────────────────────┤
│ ☑ Revisar facturas recibidas       ✓ Juan │
│ ☑ Validar horas de servicio        ✓ Juan │
│ ☐ Calcular total a cobrar                 │
│ ☐ Generar reporte en Excel                │
│ ☐ Enviar a contabilidad                   │
│                                            │
│ [+ Agregar subtarea]                       │
└────────────────────────────────────────────┘
```

#### **C. Modificaciones en Archivos Existentes**

**C.1 - TaskDialog.jsx (Modal de Creación/Edición)**

**Ubicación:** Después del campo "Descripción", agregar:

```jsx
{/* Sección de Subtareas */}
<Box sx={{ mt: 3 }}>
  <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary' }}>
    SUBTAREAS (OPCIONAL)
  </Typography>
  <SubtaskManager
    taskId={task?.id}
    subtasks={formData.checklistItems || []}
    onUpdate={(updatedSubtasks) => {
      setFormData({ ...formData, checklistItems: updatedSubtasks });
    }}
  />
</Box>
```

**C.2 - TaskDetailDialog.jsx (Modal de Detalles)**

**Ubicación:** Después de la sección de "Descripción", agregar:

```jsx
{/* Mostrar subtareas si existen */}
{task.checklistItems && task.checklistItems.length > 0 && (
  <Box sx={{ mt: 3 }}>
    <SubtaskManager
      taskId={task.id}
      subtasks={task.checklistItems}
      onUpdate={handleSubtaskUpdate}
      readOnly={!canEdit}
    />
  </Box>
)}
```

**C.3 - TasksPage.jsx (Cards en Grid/Kanban)**

**Ubicación:** Dentro del CardContent, después de la barra de progreso:

```jsx
{/* Indicador de subtareas */}
{task.subtareasTotal > 0 && (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.5,
    mt: 1
  }}>
    <CheckBoxIcon sx={{ fontSize: 14, color: 'primary.main' }} />
    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
      {task.subtareasCompletadas}/{task.subtareasTotal} completadas
    </Typography>
  </Box>
)}
```

#### **D. Funciones del Hook (useDelegatedTasks.js)**

**Agregar función:**

```javascript
/**
 * Actualizar subtareas de una tarea
 */
const updateSubtasks = useCallback(async (taskId, subtasks) => {
  if (!taskId) return;

  const subtareasCompletadas = subtasks.filter(s => s.completado).length;
  const subtareasTotal = subtasks.length;
  const porcentajeSubtareas = subtareasTotal > 0 
    ? Math.round((subtareasCompletadas / subtareasTotal) * 100) 
    : 0;

  await updateDoc(doc(db, 'delegated_tasks', taskId), {
    checklistItems: subtasks,
    subtareasTotal,
    subtareasCompletadas,
    porcentajeSubtareas,
    ultimaActividad: serverTimestamp()
  });
}, []);
```

#### **E. Validaciones y Reglas de Negocio**

1. ✅ **Límite de subtareas:** Máximo 20 por tarea (evitar complejidad excesiva)
2. ✅ **Longitud de texto:** Máximo 200 caracteres por subtarea
3. ✅ **No permitir duplicados:** Validar que no existan 2 subtareas con el mismo texto
4. ✅ **Permisos:** Solo el asignado o creador puede marcar completado
5. ✅ **Progreso general:** Si porcentajeSubtareas === 100%, sugerir cambiar tarea a "completada"

---

## 2. ETIQUETAS (TAGS CON COLORES) 🏷️

### 📊 ESTADO ACTUAL
- ✅ **Estructura existe**: `tags: []` en TasksMenu.jsx (archivo no usado)
- ❌ **No hay UI para agregar etiquetas**
- ❌ **No se visualizan en cards**
- ❌ **No hay filtro por etiqueta**

### 🎯 OBJETIVO
Categorizar tareas con etiquetas personalizables (por sala, tipo, urgencia, etc.)

### 📐 ESPECIFICACIÓN TÉCNICA

#### **A. Estructura de Datos**

```javascript
// Firestore: delegated_tasks/{taskId}
{
  etiquetas: [
    {
      id: "tag1",
      nombre: "Villavicencio",
      color: "#2196f3"  // Azul
    },
    {
      id: "tag2",
      nombre: "Cobros",
      color: "#f44336"  // Rojo
    },
    {
      id: "tag3",
      nombre: "Urgente",
      color: "#ff9800"  // Naranja
    }
  ]
}

// Firestore: task_tags (Colección global - catálogo de etiquetas)
{
  nombre: "Villavicencio",
  color: "#2196f3",
  categoria: "sala",
  usoTotal: 15,  // Cuántas tareas tienen esta etiqueta
  creadoPor: "uid123",
  fechaCreacion: Timestamp
}
```

#### **B. Componente: TagSelector.jsx (NUEVO)**

**Ubicación:** `src/components/tasks/TagSelector.jsx`

**Props:**
- `selectedTags` (array) - Etiquetas actuales de la tarea
- `onChange` (function) - Callback al cambiar
- `maxTags` (number) - Máximo 5 etiquetas por tarea

**Funcionalidades:**
- ✅ Autocompletar de etiquetas existentes
- ✅ Crear nueva etiqueta con selector de color
- ✅ Eliminar etiqueta (X en chip)
- ✅ Mostrar chips con colores
- ✅ Sugerencias basadas en etiquetas populares

**Diseño:**
```
┌────────────────────────────────────────────┐
│ ETIQUETAS (máx. 5)                         │
├────────────────────────────────────────────┤
│ [Villavicencio] [Cobros] [Urgente]        │
│     (azul)       (rojo)    (naranja)       │
│                                            │
│ Agregar etiqueta:                          │
│ [🔍 Buscar o crear nueva...]               │
│                                            │
│ Sugerencias:                               │
│ • Bogotá       • Liquidación              │
│ • Medellín     • Revisión                 │
└────────────────────────────────────────────┘
```

#### **C. Modificaciones en Archivos Existentes**

**C.1 - TaskDialog.jsx**

**Ubicación:** Después de la sección "Empresa", agregar:

```jsx
{/* Etiquetas */}
<Box sx={{ mt: 3 }}>
  <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary' }}>
    ETIQUETAS (OPCIONAL)
  </Typography>
  <TagSelector
    selectedTags={formData.etiquetas || []}
    onChange={(newTags) => setFormData({ ...formData, etiquetas: newTags })}
    maxTags={5}
  />
</Box>
```

**C.2 - TasksPage.jsx (Cards)**

**Ubicación:** Después del título de la tarea, agregar:

```jsx
{/* Etiquetas */}
{task.etiquetas && task.etiquetas.length > 0 && (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
    {task.etiquetas.slice(0, 3).map((etiqueta) => (
      <Chip
        key={etiqueta.id}
        label={etiqueta.nombre}
        size="small"
        sx={{
          height: 20,
          fontSize: '0.65rem',
          fontWeight: 600,
          bgcolor: alpha(etiqueta.color, 0.1),
          color: etiqueta.color,
          border: `1px solid ${alpha(etiqueta.color, 0.3)}`,
          borderRadius: 1
        }}
      />
    ))}
    {task.etiquetas.length > 3 && (
      <Chip
        label={`+${task.etiquetas.length - 3}`}
        size="small"
        sx={{ height: 20, fontSize: '0.65rem' }}
      />
    )}
  </Box>
)}
```

**C.3 - TasksFilters.jsx**

**Agregar nuevo filtro:**

```jsx
{/* Filtro por Etiqueta */}
<Autocomplete
  multiple
  options={availableTags}
  getOptionLabel={(option) => option.nombre}
  value={selectedTags}
  onChange={(e, newValue) => onTagsChange(newValue)}
  renderInput={(params) => (
    <TextField {...params} label="Filtrar por etiqueta" size="small" />
  )}
  renderTags={(value, getTagProps) =>
    value.map((option, index) => (
      <Chip
        label={option.nombre}
        size="small"
        sx={{ bgcolor: alpha(option.color, 0.1), color: option.color }}
        {...getTagProps({ index })}
      />
    ))
  }
/>
```

#### **D. Catálogo Global de Etiquetas**

**Crear hook:** `src/hooks/useTaskTags.js`

```javascript
/**
 * Hook para gestión de etiquetas globales
 * - Cargar etiquetas existentes
 * - Crear nueva etiqueta
 * - Sugerencias de etiquetas populares
 */
export const useTaskTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar etiquetas desde task_tags
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'task_tags'), orderBy('usoTotal', 'desc')),
      (snapshot) => {
        const tagsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTags(tagsData);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Crear nueva etiqueta
  const createTag = async (nombre, color, categoria = 'general') => {
    const tagRef = await addDoc(collection(db, 'task_tags'), {
      nombre,
      color,
      categoria,
      usoTotal: 0,
      creadoPor: currentUser.uid,
      fechaCreacion: serverTimestamp()
    });
    return { id: tagRef.id, nombre, color };
  };

  return { tags, loading, createTag };
};
```

#### **E. Colores Predefinidos**

```javascript
const TAG_COLORS = [
  { nombre: 'Azul', valor: '#2196f3' },
  { nombre: 'Rojo', valor: '#f44336' },
  { nombre: 'Verde', valor: '#4caf50' },
  { nombre: 'Naranja', valor: '#ff9800' },
  { nombre: 'Púrpura', valor: '#9c27b0' },
  { nombre: 'Cyan', valor: '#00bcd4' },
  { nombre: 'Lima', valor: '#cddc39' },
  { nombre: 'Rosa', valor: '#e91e63' }
];
```

---

## 3. TIME TRACKING (REGISTRO DE TIEMPO) ⏱️

### 📊 ESTADO ACTUAL
- ❌ **No existe estructura de datos**
- ❌ **No hay cronómetro**
- ❌ **No se registra tiempo trabajado**

### 🎯 OBJETIVO
Medir tiempo real invertido en cada tarea para optimización de procesos.

### 📐 ESPECIFICACIÓN TÉCNICA

#### **A. Estructura de Datos**

```javascript
// Firestore: delegated_tasks/{taskId}
{
  // Estimación inicial
  horasEstimadas: 4,  // Cuántas horas se espera que tome
  
  // Registro de sesiones de trabajo
  tiempoRegistrado: [
    {
      id: "session1",
      usuario: {
        uid: "user123",
        nombre: "Juan Pérez"
      },
      inicio: Timestamp,         // 2026-02-05 09:00:00
      fin: Timestamp,            // 2026-02-05 11:30:00
      duracionMinutos: 150,      // Calculado automáticamente
      comentario: "Cliente no respondía llamadas"  // Opcional
    },
    {
      id: "session2",
      usuario: { uid: "user123", nombre: "Juan Pérez" },
      inicio: Timestamp,
      fin: Timestamp,
      duracionMinutos: 90
    }
  ],
  
  // Totales calculados automáticamente
  totalMinutosTrabajados: 240,  // Suma de todas las sesiones
  totalHorasTrabajadas: 4.0,    // 240 / 60
  desviacionTiempo: 0,           // 4 estimadas - 4 reales = 0
  desviacionPorcentaje: 0,       // 0%
  
  // Estado del timer
  timerActivo: false,            // Si hay un cronómetro corriendo
  timerInicio: null,             // Timestamp del inicio actual
  timerUsuario: null             // Quién está trabajando ahora
}
```

#### **B. Componente: TimeTracker.jsx (NUEVO)**

**Ubicación:** `src/components/tasks/TimeTracker.jsx`

**Props:**
- `taskId` (string)
- `task` (object) - Datos completos de la tarea
- `canStart` (boolean) - Permiso para iniciar timer

**Estados internos:**
```javascript
const [tiempoActual, setTiempoActual] = useState(0); // Segundos transcurridos
const [isRunning, setIsRunning] = useState(false);
const [sesiones, setSesiones] = useState([]);
```

**Funcionalidades:**
- ✅ Botón "Iniciar" → Crea sesión y empieza contador
- ✅ Botón "Pausar" → Guarda sesión parcial
- ✅ Botón "Detener" → Finaliza sesión y guarda en Firestore
- ✅ Contador en vivo (actualización cada segundo)
- ✅ Historial de sesiones con totales
- ✅ Gráfico simple de estimado vs real

**Diseño:**
```
┌────────────────────────────────────────────┐
│ ⏱️ TIME TRACKING                            │
├────────────────────────────────────────────┤
│ Estimado: 4 horas                          │
│ Real: 3.5 horas                            │
│ Desviación: -12.5% ✅                       │
│                                            │
│ ┌────────────────────────────────────┐    │
│ │  02:15:34  ⏸️ Pausar  ⏹️ Detener   │    │
│ └────────────────────────────────────┘    │
│                                            │
│ HISTORIAL DE SESIONES:                    │
│ • 05 Feb, 9:00 - 11:30  (2.5h)  Juan      │
│ • 05 Feb, 14:00 - 15:00 (1h)    Juan      │
│                                            │
│ Total: 3.5 horas                           │
└────────────────────────────────────────────┘
```

#### **C. Modificaciones en Archivos Existentes**

**C.1 - TaskDialog.jsx**

**Ubicación:** Después del campo "Fecha de vencimiento":

```jsx
{/* Estimación de tiempo */}
<TextField
  label="Horas estimadas (opcional)"
  type="number"
  value={formData.horasEstimadas || ''}
  onChange={(e) => setFormData({ ...formData, horasEstimadas: parseFloat(e.target.value) })}
  InputProps={{
    endAdornment: <InputAdornment position="end">horas</InputAdornment>
  }}
  helperText="Tiempo esperado para completar esta tarea"
  fullWidth
/>
```

**C.2 - TaskDetailDialog.jsx**

**Ubicación:** Agregar nueva sección después de "Archivos adjuntos":

```jsx
{/* Time Tracking */}
<Divider sx={{ my: 3 }} />
<TimeTracker
  taskId={task.id}
  task={task}
  canStart={task.asignadoA?.uid === currentUser?.uid}
/>
```

**C.3 - TasksPage.jsx (Cards - Indicador visual)**

**Ubicación:** Junto a otros metadatos:

```jsx
{/* Indicador de tiempo */}
{task.horasEstimadas && (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
    <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
      {task.totalHorasTrabajadas || 0}h / {task.horasEstimadas}h
    </Typography>
    {task.desviacionPorcentaje > 20 && (
      <Chip 
        label={`+${task.desviacionPorcentaje}%`} 
        size="small" 
        color="warning" 
        sx={{ height: 16, fontSize: '0.6rem' }}
      />
    )}
  </Box>
)}
```

#### **D. Funciones del Hook**

**useDelegatedTasks.js - Agregar:**

```javascript
/**
 * Iniciar sesión de tiempo
 */
const startTimer = useCallback(async (taskId) => {
  const taskRef = doc(db, 'delegated_tasks', taskId);
  await updateDoc(taskRef, {
    timerActivo: true,
    timerInicio: serverTimestamp(),
    timerUsuario: {
      uid: currentUser.uid,
      nombre: userProfile.name || userProfile.displayName
    }
  });
}, [currentUser, userProfile]);

/**
 * Detener sesión y guardar
 */
const stopTimer = useCallback(async (taskId, comentario = '') => {
  const taskRef = doc(db, 'delegated_tasks', taskId);
  const taskSnap = await getDoc(taskRef);
  const taskData = taskSnap.data();
  
  const inicio = taskData.timerInicio.toDate();
  const fin = new Date();
  const duracionMinutos = Math.round((fin - inicio) / 60000);
  
  const nuevaSesion = {
    id: `session_${Date.now()}`,
    usuario: taskData.timerUsuario,
    inicio: taskData.timerInicio,
    fin: Timestamp.fromDate(fin),
    duracionMinutos,
    comentario
  };
  
  const sesionesActualizadas = [...(taskData.tiempoRegistrado || []), nuevaSesion];
  const totalMinutos = sesionesActualizadas.reduce((sum, s) => sum + s.duracionMinutos, 0);
  const totalHoras = (totalMinutos / 60).toFixed(1);
  const desviacion = taskData.horasEstimadas ? totalHoras - taskData.horasEstimadas : 0;
  const desviacionPorcentaje = taskData.horasEstimadas 
    ? Math.round((desviacion / taskData.horasEstimadas) * 100) 
    : 0;
  
  await updateDoc(taskRef, {
    timerActivo: false,
    timerInicio: null,
    timerUsuario: null,
    tiempoRegistrado: sesionesActualizadas,
    totalMinutosTrabajados: totalMinutos,
    totalHorasTrabajadas: parseFloat(totalHoras),
    desviacionTiempo: desviacion,
    desviacionPorcentaje
  });
}, []);
```

#### **E. Validaciones**

1. ✅ **Solo 1 timer activo por usuario:** No permitir iniciar si ya tiene otra tarea en curso
2. ✅ **Máximo 12 horas por sesión:** Auto-detener si pasa de 12h (probablemente olvidó detener)
3. ✅ **Solo asignado puede trackear:** Validar permisos
4. ✅ **Alertar si desviación > 50%:** Mostrar warning si la tarea está tomando mucho más

---

## 4. RECORDATORIOS AUTOMÁTICOS 🔔

### 📊 ESTADO ACTUAL
- ✅ **useNotificationSystem.js existe**
- ❌ **No hay integración con TasksPage**
- ❌ **No se envían notificaciones automáticas**

### 🎯 OBJETIVO
Alertas automáticas para fechas de vencimiento y cambios en tareas.

### 📐 ESPECIFICACIÓN TÉCNICA

#### **A. Tipos de Notificaciones**

```javascript
// 1. Tarea próxima a vencer (24 horas antes)
{
  tipo: 'task_due_soon',
  prioridad: 'media',
  titulo: 'Tarea vence mañana',
  mensaje: 'Tu tarea "Cobro Compromiso ABC" vence mañana a las 5 PM',
  icono: '⏰',
  link: '/tasks?id=task123'
}

// 2. Tarea vencida
{
  tipo: 'task_overdue',
  prioridad: 'alta',
  titulo: 'Tarea vencida',
  mensaje: 'Tienes 2 tareas vencidas sin completar',
  icono: '🔴',
  link: '/tasks?filter=overdue'
}

// 3. Nueva tarea asignada
{
  tipo: 'task_assigned',
  prioridad: 'media',
  titulo: 'Nueva tarea asignada',
  mensaje: 'María te asignó: "Liquidar Sala Bogotá"',
  icono: '📋',
  link: '/tasks?id=task456'
}

// 4. Progreso actualizado
{
  tipo: 'task_progress',
  prioridad: 'baja',
  titulo: 'Tarea actualizada',
  mensaje: 'Juan completó 3 de 5 subtareas en "Revisión mensual"',
  icono: '✅',
  link: '/tasks?id=task789'
}

// 5. Tarea completada (para el creador)
{
  tipo: 'task_completed',
  prioridad: 'media',
  titulo: 'Tarea completada',
  mensaje: 'Pedro completó la tarea "Cobro Cliente X" que le asignaste',
  icono: '🎉',
  link: '/tasks?id=task012'
}
```

#### **B. Cloud Function: checkTaskDueDates (NUEVO)**

**Ubicación:** `functions/taskNotifications.js`

```javascript
/**
 * Cloud Function que se ejecuta diariamente a las 8 AM
 * Revisa todas las tareas y envía notificaciones según corresponda
 */
exports.checkTaskDueDates = functions.pubsub
  .schedule('0 8 * * *')  // Cron: Todos los días a las 8 AM
  .timeZone('America/Bogota')
  .onRun(async (context) => {
    const ahora = new Date();
    const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
    
    // Buscar tareas que vencen mañana
    const tasksVencenManana = await db.collection('delegated_tasks')
      .where('fechaVencimiento', '>=', Timestamp.fromDate(ahora))
      .where('fechaVencimiento', '<=', Timestamp.fromDate(manana))
      .where('estadoActual', 'in', ['asignada', 'en_progreso'])
      .get();
    
    // Buscar tareas vencidas
    const tasksVencidas = await db.collection('delegated_tasks')
      .where('fechaVencimiento', '<', Timestamp.fromDate(ahora))
      .where('estadoActual', 'in', ['asignada', 'en_progreso'])
      .get();
    
    // Enviar notificaciones...
  });
```

#### **C. Hook: useTaskReminders.js (NUEVO)**

**Ubicación:** `src/hooks/useTaskReminders.js`

```javascript
/**
 * Hook para gestión de recordatorios locales
 * Detecta cambios en tareas y envía notificaciones en tiempo real
 */
export const useTaskReminders = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!currentUser) return;

    // Listener para tareas asignadas al usuario
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'delegated_tasks'),
        where('participantes', 'array-contains', currentUser.uid)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const task = { id: change.doc.id, ...change.doc.data() };
          
          // Nueva tarea asignada
          if (change.type === 'added' && task.asignadoA?.uid === currentUser.uid) {
            addNotification({
              tipo: 'task_assigned',
              titulo: 'Nueva tarea asignada',
              mensaje: `${task.creadoPor.nombre} te asignó: "${task.titulo}"`,
              link: `/tasks?id=${task.id}`
            });
          }
          
          // Tarea completada (si soy el creador)
          if (change.type === 'modified' && 
              task.estadoActual === 'completada' && 
              task.creadoPor.uid === currentUser.uid) {
            addNotification({
              tipo: 'task_completed',
              titulo: 'Tarea completada',
              mensaje: `${task.asignadoA.nombre} completó "${task.titulo}"`,
              link: `/tasks?id=${task.id}`
            });
          }
        });
      }
    );

    return unsubscribe;
  }, [currentUser]);
};
```

#### **D. Integración con useNotificationSystem**

**Modificar:** `src/context/NotificationsContext.jsx`

**Agregar función:**

```javascript
/**
 * Agregar notificación de tarea
 */
const addTaskNotification = useCallback((taskNotification) => {
  const notificacion = {
    id: `task_${Date.now()}`,
    fecha: new Date(),
    leida: false,
    tipo: 'tarea',
    ...taskNotification
  };
  
  setNotifications(prev => [notificacion, ...prev]);
  
  // Mostrar toast si el usuario está activo
  if (document.visibilityState === 'visible') {
    showToast(notificacion.mensaje, 'info');
  }
}, []);
```

#### **E. Badge de Notificaciones en Sidebar**

**Modificar:** `src/components/layout/Sidebar.jsx`

**Agregar badge en menú de Tareas:**

```jsx
{
  title: 'Tareas',
  icon: Assignment,
  path: '/tasks',
  color: theme.palette.primary.main,
  permission: 'tareas',
  badge: taskNotificationsCount  // Número de notificaciones de tareas no leídas
}
```

---

## 5. DRAG & DROP KANBAN 🎯

### 📊 ESTADO ACTUAL
- ✅ **Vista Kanban existe** (código en líneas 687-1008 de TasksPage.jsx)
- ✅ **Columnas por estado se muestran**
- ❌ **No hay drag & drop funcional**
- ❌ **No se puede arrastrar entre columnas**

### 🎯 OBJETIVO
Permitir arrastrar tareas entre columnas para cambiar su estado visualmente.

### 📐 ESPECIFICACIÓN TÉCNICA

#### **A. Librería Recomendada**

**Opción 1: @dnd-kit/core (Recomendada)**
- ✅ Moderna, ligera, bien mantenida
- ✅ Accesible (a11y compliant)
- ✅ Touch-friendly (funciona en tablets)
- ✅ TypeScript nativo

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Opción 2: react-beautiful-dnd (Alternativa)**
- ✅ Muy popular, estable
- ⚠️ Más pesada (80kb vs 30kb)
- ⚠️ Menos mantenida activamente

#### **B. Estructura de Columnas**

```javascript
const KANBAN_COLUMNS = [
  {
    id: 'pendiente',
    titulo: 'Sin Asignar',
    color: '#0288d1',  // Azul info
    estadosAceptados: ['pendiente']
  },
  {
    id: 'asignada',
    titulo: 'Asignada',
    color: '#ed6c02',  // Naranja warning
    estadosAceptados: ['asignada']
  },
  {
    id: 'en_progreso',
    titulo: 'En Progreso',
    color: '#9c27b0',  // Púrpura secondary
    estadosAceptados: ['en_progreso']
  },
  {
    id: 'en_revision',
    titulo: 'En Revisión',
    color: '#1976d2',  // Azul primary
    estadosAceptados: ['en_revision']
  },
  {
    id: 'completada',
    titulo: 'Completada',
    color: '#2e7d32',  // Verde success
    estadosAceptados: ['completada']
  }
];
```

#### **C. Componente: KanbanColumn.jsx (NUEVO)**

**Ubicación:** `src/components/tasks/KanbanColumn.jsx`

```jsx
import { useDroppable } from '@dnd-kit/core';

export const KanbanColumn = ({ columna, tareas, onDrop }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columna.id
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minWidth: 300,
        maxWidth: 350,
        bgcolor: isOver ? alpha(columna.color, 0.05) : 'background.paper',
        borderRadius: 2,
        border: `2px solid ${isOver ? columna.color : alpha(theme.palette.divider, 0.2)}`,
        transition: 'all 0.2s ease',
        p: 2
      }}
    >
      {/* Header de columna */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="overline" sx={{ fontWeight: 600, color: columna.color }}>
          {columna.titulo}
        </Typography>
        <Chip 
          label={tareas.length} 
          size="small" 
          sx={{ ml: 1, bgcolor: alpha(columna.color, 0.1) }}
        />
      </Box>

      {/* Lista de tareas */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tareas.map((tarea) => (
          <KanbanCard key={tarea.id} tarea={tarea} />
        ))}
      </Box>
    </Box>
  );
};
```

#### **D. Componente: KanbanCard.jsx (NUEVO)**

**Ubicación:** `src/components/tasks/KanbanCard.jsx`

```jsx
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export const KanbanCard = ({ tarea }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tarea.id,
    data: tarea
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Contenido igual al grid view */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {tarea.titulo}
        </Typography>
        {/* ... resto del contenido ... */}
      </CardContent>
    </Card>
  );
};
```

#### **E. Modificar TasksPage.jsx**

**Ubicación:** Sección de Vista Kanban (línea ~687)

**Reemplazar con:**

```jsx
import { DndContext, DragOverlay } from '@dnd-kit/core';

// Estados
const [activeTask, setActiveTask] = useState(null);

// Handler de drag end
const handleDragEnd = async (event) => {
  const { active, over } = event;
  
  if (!over) return;
  
  const taskId = active.id;
  const nuevoEstado = over.id;
  const task = tasks.find(t => t.id === taskId);
  
  if (task.estadoActual === nuevoEstado) return;
  
  // Actualizar estado en Firestore
  try {
    await changeStatus(taskId, nuevoEstado, 'Movido desde vista Kanban');
    showToast('Tarea actualizada exitosamente', 'success');
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    showToast('Error al actualizar tarea', 'error');
  }
  
  setActiveTask(null);
};

// Renderizado
<DndContext 
  onDragStart={(event) => setActiveTask(event.active.data.current)}
  onDragEnd={handleDragEnd}
>
  <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
    {KANBAN_COLUMNS.map((columna) => {
      const tareasColumna = filteredTasks.filter(
        t => columna.estadosAceptados.includes(t.estadoActual)
      );
      
      return (
        <KanbanColumn
          key={columna.id}
          columna={columna}
          tareas={tareasColumna}
        />
      );
    })}
  </Box>
  
  {/* Overlay al arrastrar */}
  <DragOverlay>
    {activeTask ? <KanbanCard tarea={activeTask} /> : null}
  </DragOverlay>
</DndContext>
```

#### **F. Validaciones**

1. ✅ **Permisos:** Solo el asignado o creador puede mover tareas
2. ✅ **Estados válidos:** No permitir mover a "completada" si progreso < 100%
3. ✅ **Confirmación:** Si mueve a "completada", confirmar con dialog
4. ✅ **Logging:** Registrar en `historialEstados` el movimiento

---

## 6. ORDENAR POR (SORT) ⬆️⬇️

### 📊 ESTADO ACTUAL
- ❌ **No hay control de ordenamiento**
- ❌ **Siempre ordenado por fechaCreacion desc (fijo en hook)**
- ❌ **No hay UI para cambiar el orden**

### 🎯 OBJETIVO
Permitir al usuario ordenar tareas según diferentes criterios para mejorar organización y priorización visual.

### 📐 ESPECIFICACIÓN TÉCNICA

#### **A. Criterios de Ordenamiento**

```javascript
const SORT_OPTIONS = [
  {
    id: 'fechaCreacion_desc',
    label: 'Más recientes primero',
    campo: 'fechaCreacion',
    direccion: 'desc',
    icono: '🆕'
  },
  {
    id: 'fechaCreacion_asc',
    label: 'Más antiguas primero',
    campo: 'fechaCreacion',
    direccion: 'asc',
    icono: '📅'
  },
  {
    id: 'fechaVencimiento_asc',
    label: 'Vencimiento próximo',
    campo: 'fechaVencimiento',
    direccion: 'asc',
    icono: '⏰'
  },
  {
    id: 'fechaVencimiento_desc',
    label: 'Vencimiento lejano',
    campo: 'fechaVencimiento',
    direccion: 'desc',
    icono: '📆'
  },
  {
    id: 'prioridad_desc',
    label: 'Prioridad alta primero',
    campo: 'prioridad',
    direccion: 'desc',
    icono: '🔴'
  },
  {
    id: 'prioridad_asc',
    label: 'Prioridad baja primero',
    campo: 'prioridad',
    direccion: 'asc',
    icono: '🟢'
  },
  {
    id: 'progreso_asc',
    label: 'Menor progreso primero',
    campo: 'porcentajeCompletado',
    direccion: 'asc',
    icono: '📊'
  },
  {
    id: 'progreso_desc',
    label: 'Mayor progreso primero',
    campo: 'porcentajeCompletado',
    direccion: 'desc',
    icono: '📈'
  }
];
```

#### **B. Función de Ordenamiento**

```javascript
/**
 * Función para ordenar array de tareas según criterio seleccionado
 */
const sortTasks = (tasks, sortOption) => {
  if (!sortOption || !tasks || tasks.length === 0) return tasks;

  const sorted = [...tasks];
  const { campo, direccion } = SORT_OPTIONS.find(opt => opt.id === sortOption);

  sorted.sort((a, b) => {
    let valorA, valorB;

    // Manejar campos especiales
    switch (campo) {
      case 'fechaCreacion':
      case 'fechaVencimiento':
        valorA = a[campo]?.toDate?.() || new Date(0);
        valorB = b[campo]?.toDate?.() || new Date(0);
        break;

      case 'prioridad':
        // Mapear prioridades a números para ordenar
        const prioridadMap = { urgente: 4, alta: 3, media: 2, baja: 1 };
        valorA = prioridadMap[a[campo]] || 0;
        valorB = prioridadMap[b[campo]] || 0;
        break;

      case 'porcentajeCompletado':
        valorA = a[campo] || 0;
        valorB = b[campo] || 0;
        break;

      default:
        valorA = a[campo];
        valorB = b[campo];
    }

    // Aplicar dirección
    if (direccion === 'asc') {
      return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
    } else {
      return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
    }
  });

  return sorted;
};
```

#### **C. Modificaciones en TasksPage.jsx**

**C.1 - Agregar estado de ordenamiento:**

```jsx
// Estados locales (línea ~95)
const [sortBy, setSortBy] = useState('fechaCreacion_desc'); // Default: más recientes
```

**C.2 - Aplicar ordenamiento a tareas filtradas:**

```jsx
// Reemplazar useMemo de filteredTasks (línea ~165)
const filteredTasks = useMemo(() => {
  if (!filtersApplied) {
    return [];
  }

  let tasksToFilter = tasks.filter(task => {
    // ... lógica de filtrado existente ...
  });

  // Aplicar ordenamiento
  return sortTasks(tasksToFilter, sortBy);
}, [tasks, filterPriority, filterAssignment, filterCompany, searchTerm, currentUser, filtersApplied, sortBy]);
```

**C.3 - Agregar UI de ordenamiento:**

**Ubicación:** Después de los filtros, antes de las estadísticas (línea ~440)

```jsx
{/* Control de Ordenamiento */}
<Box sx={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  mb: 3,
  px: 1
}}>
  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
    {filteredTasks.length} tareas {filtersApplied ? 'encontradas' : '(aplicar filtros para ver)'}
  </Typography>
  
  <FormControl size="small" sx={{ minWidth: 220 }}>
    <InputLabel id="sort-label">Ordenar por</InputLabel>
    <Select
      labelId="sort-label"
      value={sortBy}
      label="Ordenar por"
      onChange={(e) => setSortBy(e.target.value)}
      sx={{
        borderRadius: 1,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(theme.palette.primary.main, 0.2)
        }
      }}
    >
      {SORT_OPTIONS.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{option.icono}</span>
            <span>{option.label}</span>
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Box>
```

**C.4 - Diseño Alternativo (Más compacto):**

Si prefieres un diseño más minimalista:

```jsx
<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
  <Chip
    icon={<SortIcon />}
    label="Ordenar"
    onClick={(e) => setAnchorElSort(e.currentTarget)}
    variant="outlined"
    sx={{
      borderRadius: 1,
      fontWeight: 600,
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.08)
      }
    }}
  />
  
  <Menu
    anchorEl={anchorElSort}
    open={Boolean(anchorElSort)}
    onClose={() => setAnchorElSort(null)}
  >
    {SORT_OPTIONS.map((option) => (
      <MenuItem
        key={option.id}
        selected={sortBy === option.id}
        onClick={() => {
          setSortBy(option.id);
          setAnchorElSort(null);
        }}
      >
        <ListItemIcon>{option.icono}</ListItemIcon>
        <ListItemText>{option.label}</ListItemText>
      </MenuItem>
    ))}
  </Menu>
</Box>
```

#### **D. Persistencia de Preferencia (Opcional)**

**Guardar preferencia en localStorage:**

```javascript
// Al cambiar ordenamiento
const handleSortChange = (newSortBy) => {
  setSortBy(newSortBy);
  localStorage.setItem('tasks_sort_preference', newSortBy);
};

// Al cargar componente
useEffect(() => {
  const savedSort = localStorage.getItem('tasks_sort_preference');
  if (savedSort && SORT_OPTIONS.find(opt => opt.id === savedSort)) {
    setSortBy(savedSort);
  }
}, []);
```

#### **E. Indicador Visual de Ordenamiento Activo**

**Mostrar chip pequeño con el criterio actual:**

```jsx
{sortBy !== 'fechaCreacion_desc' && (
  <Chip
    label={SORT_OPTIONS.find(opt => opt.id === sortBy)?.label}
    onDelete={() => setSortBy('fechaCreacion_desc')}
    size="small"
    color="primary"
    variant="outlined"
    sx={{ ml: 1 }}
  />
)}
```

#### **F. Manejo de Casos Especiales**

**F.1 - Tareas sin fecha de vencimiento:**

```javascript
// Al ordenar por fechaVencimiento, las tareas sin fecha van al final
if (campo === 'fechaVencimiento') {
  // Si ambos no tienen fecha, mantener orden original
  if (!a[campo] && !b[campo]) return 0;
  // Si solo A no tiene fecha, va al final
  if (!a[campo]) return 1;
  // Si solo B no tiene fecha, va al final
  if (!b[campo]) return -1;
  
  valorA = a[campo].toDate();
  valorB = b[campo].toDate();
}
```

**F.2 - Ordenamiento secundario:**

Para evitar que tareas con el mismo valor se mezclen aleatoriamente:

```javascript
// Si los valores son iguales, ordenar secundariamente por fecha de creación
if (valorA === valorB) {
  const fechaA = a.fechaCreacion?.toDate() || new Date(0);
  const fechaB = b.fechaCreacion?.toDate() || new Date(0);
  return fechaB - fechaA; // Más recientes primero
}
```

#### **G. Validaciones y Optimización**

1. ✅ **Memorización:** Usar useMemo para evitar reordenamientos innecesarios
2. ✅ **Fallback:** Si sortBy es inválido, usar 'fechaCreacion_desc' por defecto
3. ✅ **Performance:** Para listas >100 tareas, considerar virtualización
4. ✅ **Accesibilidad:** Select debe tener label apropiado y navegable con teclado

#### **H. Integracion con Vista Kanban**

**Aplicar ordenamiento dentro de cada columna Kanban:**

```jsx
// En la vista Kanban
{KANBAN_COLUMNS.map((columna) => {
  let tareasColumna = filteredTasks.filter(
    t => columna.estadosAceptados.includes(t.estadoActual)
  );
  
  // Aplicar ordenamiento dentro de la columna
  tareasColumna = sortTasks(tareasColumna, sortBy);
  
  return (
    <KanbanColumn
      key={columna.id}
      columna={columna}
      tareas={tareasColumna}
    />
  );
})}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Subtareas (2 días)**
- [ ] Crear componente SubtaskManager.jsx
- [ ] Integrar en TaskDialog.jsx
- [ ] Integrar en TaskDetailDialog.jsx
- [ ] Mostrar indicador en cards de TasksPage
- [ ] Agregar función updateSubtasks en hook
- [ ] Probar creación, edición, eliminación
- [ ] Validar cálculo automático de porcentaje

### **Fase 2: Etiquetas (1 día)**
- [ ] Crear componente TagSelector.jsx
- [ ] Crear hook useTaskTags.js
- [ ] Integrar en TaskDialog.jsx
- [ ] Mostrar chips en cards de TasksPage
- [ ] Agregar filtro en TasksFilters.jsx
- [ ] Crear colección task_tags en Firestore
- [ ] Probar creación y filtrado

### **Fase 3: Time Tracking (2 días)**
- [ ] Crear componente TimeTracker.jsx
- [ ] Agregar campo horasEstimadas en TaskDialog
- [ ] Integrar en TaskDetailDialog.jsx
- [ ] Agregar funciones startTimer/stopTimer en hook
- [ ] Mostrar indicador en cards
- [ ] Validar cálculo de desviaciones
- [ ] Probar múltiples sesiones

### **Fase 4: Recordatorios (1 día)**
- [ ] Crear Cloud Function checkTaskDueDates
- [ ] Crear hook useTaskReminders.js
- [ ] Integrar con NotificationsContext
- [ ] Agregar badge en Sidebar
- [ ] Probar notificaciones en tiempo real
- [ ] Configurar cron job diario

### **Fase 5: Drag & Drop Kanban (2 días)**
- [ ] Instalar @dnd-kit/core
- [ ] Crear componente KanbanColumn.jsx
- [ ] Crear componente KanbanCard.jsx
- [ ] Modificar vista Kanban en TasksPage
- [ ] Implementar handleDragEnd
- [ ] Agregar validaciones de permisos
- [ ] Probar arrastrar entre columnas
- [ ] Probar en dispositivos táctiles

### **Fase 6: Ordenar Por (0.5 días)**
- [ ] Crear constante SORT_OPTIONS en TasksPage.jsx
- [ ] Implementar función sortTasks con casos especiales
- [ ] Agregar estado sortBy y control Select en UI
- [ ] Integrar ordenamiento en useMemo de filteredTasks
- [ ] Aplicar sorting en columnas Kanban
- [ ] (Opcional) Implementar persistencia en localStorage
- [ ] Probar ordenamiento con diferentes criterios

---

## 🎯 PRIORIZACIÓN RECOMENDADA

**Semana 1:**
1. Ordenar Por (Quick win, 0.5 días)
2. Subtareas (Impacto alto, complejidad media, 2 días)
3. Etiquetas (Impacto alto, complejidad baja, 1 día)

**Semana 2:**
4. Time Tracking (Impacto alto, complejidad media, 2 días)
5. Recordatorios (Impacto alto, complejidad baja, 1 día)

**Semana 3:**
6. Drag & Drop Kanban (Impacto medio, complejidad media, 2 días)

---

## 📊 MÉTRICAS DE ÉXITO

**Adopción:**
- ✅ 80% de tareas con subtareas completadas
- ✅ 70% de tareas con al menos 1 etiqueta
- ✅ 50% de tareas con tiempo registrado
- ✅ 90% de notificaciones leídas en 24h
- ✅ 60% de usuarios usando vista Kanban

**Performance:**
- ✅ Carga de página < 2 segundos
- ✅ Drag & drop fluido (60 FPS)
- ✅ Notificaciones en < 5 segundos

**Productividad:**
- ✅ Reducción 30% en tareas vencidas
- ✅ Mejora 25% en estimaciones de tiempo
- ✅ Incremento 40% en tareas completadas a tiempo

---

## 🔗 DOCUMENTOS RELACIONADOS

- `docs/MODAL_DESIGN_SYSTEM.md` - Patrones de diseño para modales
- `docs/DISENO_SOBRIO_NOTAS.md` - Sistema de diseño sobrio empresarial
- `src/hooks/useNotificationSystem.js` - Sistema de notificaciones existente
- `src/hooks/useDelegatedTasks.js` - Hook principal de tareas

---

**Última actualización:** 5 de Febrero, 2026  
**Autor:** Arquitecto Senior - DR Group Dashboard  
**Versión:** 1.0
