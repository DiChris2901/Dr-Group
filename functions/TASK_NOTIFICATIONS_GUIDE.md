# 📬 GUÍA DE IMPLEMENTACIÓN: NOTIFICACIONES AUTOMÁTICAS PARA TAREAS

## 🎯 Objetivo

Implementar notificaciones automáticas cuando:
- Se asigna una tarea a un usuario
- Una tarea está próxima a vencer (24h antes)
- Una tarea fue completada por el asignado
- Se solicita un traslado de tarea

---

## 📋 PASO 1: Agregar Cloud Functions

Agregar las siguientes funciones a `functions/index.js`:

```javascript
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');

/**
 * Notificación cuando se asigna una tarea
 */
exports.onTaskAssigned = onDocumentUpdated('delegated_tasks/{taskId}', async (event) => {
  const { before, after } = event.data;
  const newData = after.data();
  const oldData = before.data();

  // Verificar si cambió el asignado
  if (!oldData.asignadoA && newData.asignadoA) {
    // Nueva asignación
    await createNotification(newData.asignadoA.uid, {
      type: 'task_assigned',
      title: 'Nueva tarea asignada',
      message: `Se te ha asignado la tarea: ${newData.titulo}`,
      taskId: event.params.taskId,
      priority: newData.prioridad
    });
  } else if (oldData.asignadoA?.uid !== newData.asignadoA?.uid) {
    // Reasignación
    await createNotification(newData.asignadoA.uid, {
      type: 'task_reassigned',
      title: 'Tarea reasignada a ti',
      message: `Se te ha reasignado la tarea: ${newData.titulo}`,
      taskId: event.params.taskId,
      priority: newData.prioridad
    });
  }
});

/**
 * Notificación cuando se completa una tarea
 */
exports.onTaskCompleted = onDocumentUpdated('delegated_tasks/{taskId}', async (event) => {
  const { before, after } = event.data;
  const newData = after.data();
  const oldData = before.data();

  // Verificar si cambió a estado completada
  if (oldData.estadoActual !== 'completada' && newData.estadoActual === 'completada') {
    // Notificar al creador
    await createNotification(newData.creadoPor.uid, {
      type: 'task_completed',
      title: 'Tarea completada',
      message: `${newData.asignadoA.nombre} completó la tarea: ${newData.titulo}`,
      taskId: event.params.taskId,
      completedBy: newData.asignadoA.nombre
    });
  }
});

/**
 * Notificación cuando se solicita traslado
 */
exports.onTransferRequested = onDocumentUpdated('delegated_tasks/{taskId}', async (event) => {
  const { before, after } = event.data;
  const newData = after.data();
  const oldData = before.data();

  // Verificar si se solicitó traslado
  if (!oldData.traslado && newData.traslado?.estado === 'solicitud_pendiente') {
    // Notificar al creador de la tarea
    await createNotification(newData.creadoPor.uid, {
      type: 'transfer_requested',
      title: 'Solicitud de traslado de tarea',
      message: `${newData.traslado.solicitadoPor.nombre} solicita trasladar la tarea "${newData.titulo}" a ${newData.traslado.nuevoAsignado.nombre}`,
      taskId: event.params.taskId,
      requestedBy: newData.traslado.solicitadoPor.nombre,
      reason: newData.traslado.solicitadoPor.razon
    });
  }
});

/**
 * Helper: Crear notificación en Firestore
 */
async function createNotification(userId, data) {
  const db = getFirestore();
  
  await db.collection('notifications').add({
    uid: userId,
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId || null,
    priority: data.priority || 'media',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    ...data
  });
  
  console.log(`✅ Notificación creada para usuario ${userId}: ${data.title}`);
}
```

---

## 📋 PASO 2: Scheduled Function para Tareas Próximas a Vencer

Agregar a `functions/index.js`:

```javascript
/**
 * Ejecutar diariamente a las 9:00 AM
 * Verificar tareas que vencen en 24 horas
 */
exports.notifyUpcomingTasks = onSchedule('0 9 * * *', async (event) => {
  const db = getFirestore();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Buscar tareas que vencen en las próximas 24 horas
  const tasksSnapshot = await db.collection('delegated_tasks')
    .where('estadoActual', 'not-in', ['completada', 'cancelada'])
    .where('fechaVencimiento', '<=', tomorrow)
    .where('fechaVencimiento', '>', now)
    .get();

  for (const taskDoc of tasksSnapshot.docs) {
    const task = taskDoc.data();
    
    if (task.asignadoA?.uid) {
      await createNotification(task.asignadoA.uid, {
        type: 'task_due_soon',
        title: 'Tarea próxima a vencer',
        message: `La tarea "${task.titulo}" vence mañana`,
        taskId: taskDoc.id,
        priority: 'urgente',
        dueDate: task.fechaVencimiento.toDate().toISOString()
      });
    }
  }

  console.log(`✅ Notificaciones de vencimiento enviadas: ${tasksSnapshot.size} tareas`);
});
```

---

## 📋 PASO 3: Desplegar Cloud Functions

```bash
# Navegar a la carpeta functions
cd functions

# Instalar dependencias (si no están instaladas)
npm install

# Desplegar todas las funciones
firebase deploy --only functions

# O desplegar funciones específicas
firebase deploy --only functions:onTaskAssigned,functions:onTaskCompleted,functions:onTransferRequested,functions:notifyUpcomingTasks
```

---

## 📋 PASO 4: Mostrar Notificaciones en el Dashboard

El dashboard ya tiene el componente `AlertsCenter` que puede usarse para mostrar estas notificaciones.

Modificar `src/hooks/useAlertsCenter.js` para incluir las notificaciones de tareas:

```javascript
// Agregar query de notificaciones de tareas
const tasksNotificationsQuery = query(
  collection(db, 'notifications'),
  where('uid', '==', currentUser.uid),
  where('type', 'in', ['task_assigned', 'task_completed', 'transfer_requested', 'task_due_soon']),
  where('read', '==', false),
  orderBy('createdAt', 'desc'),
  limit(50)
);

// Agregar listener
const unsubscribeTasksNotifs = onSnapshot(tasksNotificationsQuery, (snapshot) => {
  const notifs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().createdAt?.toDate() || new Date()
  }));
  
  // Combinar con otras alertas
  setAlerts(prev => [...prev, ...notifs]);
});
```

---

## 📋 PASO 5: Emails Opcionales (Usar SendGrid o similar)

Si deseas enviar emails además de notificaciones en la app:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmailNotification(userEmail, subject, htmlContent) {
  const msg = {
    to: userEmail,
    from: 'notifications@drgroup.com',
    subject: subject,
    html: htmlContent
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email enviado a ${userEmail}`);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

// Usar en las Cloud Functions:
const userDoc = await db.collection('users').doc(userId).get();
const userEmail = userDoc.data().email;

await sendEmailNotification(
  userEmail,
  'Nueva tarea asignada',
  `<h2>Se te ha asignado una nueva tarea</h2><p>${taskTitle}</p>`
);
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Cloud Functions creadas en `functions/index.js`
- [ ] Helper `createNotification` implementado
- [ ] Scheduled function `notifyUpcomingTasks` configurada
- [ ] Functions desplegadas (`firebase deploy --only functions`)
- [ ] Hook `useAlertsCenter` actualizado para leer notificaciones de tareas
- [ ] Probado: Asignación de tarea genera notificación
- [ ] Probado: Completar tarea notifica al creador
- [ ] Probado: Scheduled function ejecuta a las 9 AM
- [ ] (Opcional) Emails configurados con SendGrid

---

## 🔄 TESTING

1. **Asignar tarea:**
   - Crear tarea y asignar a un usuario
   - Verificar que aparece notificación en AlertsCenter

2. **Completar tarea:**
   - Usuario asignado completa tarea
   - Verificar que el creador recibe notificación

3. **Traslado:**
   - Solicitar traslado de tarea
   - Verificar que el creador recibe notificación

4. **Vencimiento:**
   - Crear tarea con vencimiento mañana
   - Esperar a las 9 AM o ejecutar manualmente:
     ```bash
     firebase functions:shell
     > notifyUpcomingTasks()
     ```

---

## 📊 MONITOREO

Ver logs en Firebase Console:
```
https://console.firebase.google.com/project/dr-group-cd21b/functions/logs
```

O usar CLI:
```bash
firebase functions:log
```

---

**NOTA:** Esta implementación es opcional y requiere Cloud Functions activas. El sistema de tareas funciona completamente sin notificaciones, pero estas mejoran significativamente la experiencia del usuario.
