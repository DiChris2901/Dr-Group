# 📱 Sistema de Notificaciones - Guía Completa

## 📋 Resumen

Este sistema permite a los administradores controlar **QUÉ notificaciones recibe cada usuario**, mientras que los usuarios controlan **CÓMO las reciben** (sonido, vibración, estilo de presentación).

---

## 🎯 Arquitectura Jerárquica

```
ADMIN (AdminNotificationControlScreen)
  ↓ Controla QUÉ notificaciones recibe el usuario
  
USUARIO (NotificationPreferencesScreen)
  ↓ Controla CÓMO recibe las notificaciones (sound, vibration, presentationStyle)

NotificationsContext
  ↓ Filtra y aplica preferencias cuando llega notificación
```

---

## 🔧 Configuración en Firestore

### **Preferencias del Admin** (QUÉ)
**Ubicación:** `users/{uid}/settings/notificationPreferences`

```javascript
{
  calendar: {
    enabled: true,
    events: {
      parafiscales: true,
      coljuegos: true,
      uiaf: false,
      contratos: true,
      festivos: false,
      custom: true
    }
  },
  
  workEvents: {
    enabled: true,
    events: {
      clockIn: true,        // Inicio de jornada
      clockOut: true,       // Fin de jornada
      breakStart: false,    // Inicio de break
      lunchStart: false,    // Inicio de almuerzo
      incidents: true       // Novedades generadas
    }
  },
  
  attendance: {
    enabled: true,
    exitReminder: true,     // Recordatorio salida 6 PM
    breakReminder: true,    // Recordatorio break 4h
    lunchReminder: true     // Recordatorio almuerzo 12 PM
  },
  
  alerts: {
    enabled: true,
    general: true,          // Alertas normales
    highPriority: true,     // Alertas prioritarias
    adminOnly: true         // Alertas solo para admins
  }
}
```

### **Preferencias del Usuario** (CÓMO)
**Ubicación:** `users/{uid}/settings/notificationBehavior`

```javascript
{
  sound: true,
  vibration: true,
  badge: true,
  presentationStyle: 'full',  // 'full' | 'compact' | 'minimal'
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  }
}
```

---

## 📤 Enviar Notificaciones (Backend/Cloud Functions)

### **1. Alertas de Admin**
```javascript
// AdminCreateAlertScreen crea automáticamente
await addDoc(collection(db, 'notifications'), {
  uid: userId,
  type: 'admin_alert',
  priority: 'high',        // 'normal' o 'high'
  audience: 'all',         // 'all', 'active', 'admins', 'specific'
  title: 'Mantenimiento Programado',
  message: 'El sistema estará fuera de servicio...',
  read: false,
  createdAt: serverTimestamp()
});
```

### **2. Eventos de Calendario**
```javascript
await addDoc(collection(db, 'notifications'), {
  uid: userId,
  type: 'calendar',
  subType: 'parafiscales',  // parafiscales, coljuegos, uiaf, contratos, festivos, custom
  title: 'Parafiscales - Vencimiento',
  message: 'Los parafiscales vencen el 15 de febrero',
  read: false,
  createdAt: serverTimestamp()
});
```

### **3. Eventos de Jornada Laboral**
```javascript
// Cuando un usuario inicia jornada
await addDoc(collection(db, 'notifications'), {
  uid: adminUserId,        // Notificar al admin
  type: 'work_event',
  subType: 'clockIn',      // clockIn, clockOut, breakStart, lunchStart, incident
  title: 'Jornada Iniciada',
  message: 'Diego Rueda inició su jornada laboral a las 8:00 AM',
  read: false,
  createdAt: serverTimestamp()
});
```

### **4. Recordatorios de Asistencia**
```javascript
await addDoc(collection(db, 'notifications'), {
  uid: userId,
  type: 'attendance',
  subType: 'break',        // exit, break, lunch
  title: 'Tiempo de Break',
  message: 'Has trabajado 4 horas, considera tomar un break',
  read: false,
  createdAt: serverTimestamp()
});
```

---

## 🔍 Flujo de Filtrado (NotificationsContext)

```javascript
// Paso 1: Llega notificación desde Firestore
notification = {
  type: 'work_event',
  subType: 'clockIn',
  title: 'Jornada Iniciada',
  message: 'Diego inició su jornada'
}

// Paso 2: NotificationsContext verifica preferencias
preferences = {
  workEvents: {
    enabled: true,
    events: { clockIn: true }
  }
}

// Paso 3: shouldShowNotification() evalúa
if (notification.type === 'work_event') {
  if (!preferences.workEvents?.enabled) return false;  // ✅ true
  if (notification.subType === 'clockIn' && !preferences.workEvents.events?.clockIn) return false;  // ✅ true
  return true;
}

// Paso 4: Se programa notificación local
scheduleNotification(title, body, data)

// Paso 5: Se aplican preferencias de comportamiento
{
  sound: true,              // De notificationBehavior
  vibration: true,          // De notificationBehavior
  presentationStyle: 'full' // De notificationBehavior
}
```

---

## ✅ Checklist de Implementación Completa

### **Frontend (APK Móvil)**
- [x] **AdminNotificationControlScreen** - Control de preferencias por usuario
- [x] **NotificationPreferencesScreen** - Control de comportamiento del usuario
- [x] **NotificationsContext** - Filtrado y aplicación de preferencias
- [x] **shouldShowNotification()** - Lógica completa para 4 tipos de notificaciones
- [x] **scheduleNotification()** - Aplica sound/vibration/presentationStyle

### **Backend (Por Implementar)**
- [ ] **Cloud Function: sendCalendarNotification()** - Notificaciones de calendario automáticas
- [ ] **Cloud Function: sendWorkEventNotification()** - Notificaciones de eventos de jornada
- [ ] **Cloud Function: sendAttendanceReminder()** - Recordatorios de asistencia
- [ ] **AuthContext Listener** - Detectar clockIn/clockOut y notificar admins

---

## 🎯 Casos de Uso Reales

### **Caso 1: Admin quiere ser notificado cuando empleados inicien jornada**
1. Admin abre `AdminNotificationControlScreen`
2. Selecciona empleado
3. Habilita "Eventos de Jornada" → "Inicio de Jornada" ✅
4. Guarda preferencias

**Resultado:** Cuando empleado use `AuthContext.signIn()`, se crea:
```javascript
{
  type: 'work_event',
  subType: 'clockIn',
  uid: adminId
}
```

### **Caso 2: Usuario NO quiere sonido en notificaciones**
1. Usuario abre `NotificationPreferencesScreen`
2. Desactiva toggle "Sonido" ❌
3. Presiona "Guardar"

**Resultado:** Todas las notificaciones llegarán con `sound: false`

### **Caso 3: Admin envía alerta prioritaria solo a administradores**
1. Admin abre `AdminCreateAlertScreen`
2. Escribe mensaje
3. Selecciona:
   - Prioridad: Alta
   - Audiencia: Administradores
4. Envía

**Resultado:** Solo usuarios con `alerts.adminOnly: true` la recibirán

---

## 🐛 Debugging

### **Ver preferencias de un usuario:**
```javascript
// Console de Firebase
const docRef = doc(db, 'users', userId, 'settings', 'notificationPreferences');
const snap = await getDoc(docRef);
console.log(snap.data());
```

### **Ver comportamiento de un usuario:**
```javascript
const docRef = doc(db, 'users', userId, 'settings', 'notificationBehavior');
const snap = await getDoc(docRef);
console.log(snap.data());
```

### **Testear filtrado:**
```javascript
const notification = { type: 'work_event', subType: 'clockIn' };
const preferences = { workEvents: { enabled: true, events: { clockIn: true } } };
const shouldShow = shouldShowNotification(notification, preferences);
console.log('Mostrar notificación:', shouldShow);  // true
```

---

## 🎉 Estado Actual

✅ **Sistema completamente funcional** para:
- Alertas de Admin (AdminCreateAlertScreen)
- Control granular por usuario (AdminNotificationControlScreen)
- Personalización de comportamiento (NotificationPreferencesScreen)
- Filtrado automático (NotificationsContext)

⚠️ **Pendiente de implementar** (Backend):
- Cloud Functions para envío automático de notificaciones de calendario
- Listeners de eventos de jornada laboral
- Sistema de recordatorios de asistencia automatizados
