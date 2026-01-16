# 📋 Plan de Integración: Microsoft Teams en Dashboard

**Objetivo:** Integrar Microsoft Teams dentro del dashboard para que se sienta como una funcionalidad nativa, manteniendo el diseño sobrio empresarial.

---

## 🎯 Visión General

### ¿Qué vamos a lograr?
- Chat de Teams dentro del dashboard sin salir de la aplicación
- Diseño consistente con el resto del dashboard (sobrio empresarial)
- Notificaciones integradas en el sistema existente
- Búsqueda global que incluya mensajes de Teams
- Experiencia de usuario unificada

### ¿Qué NO vamos a hacer?
- ❌ Abrir Teams en ventana externa
- ❌ Usar iframe simple (perdemos control del diseño)
- ❌ Crear otro sistema de chat desde cero

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
```
Frontend:
- React 18
- Microsoft Graph Toolkit (@microsoft/mgt-react)
- Microsoft Graph SDK (@microsoft/microsoft-graph-client)
- MSAL React (@azure/msal-react) - Autenticación

Backend/Services:
- Azure AD (ya existente)
- Microsoft Graph API
- Firebase (mantener para otros datos)
```

### Flujo de Autenticación
```
1. Usuario inicia sesión en Dashboard (Firebase Auth)
2. Dashboard obtiene token de Azure AD (MSAL)
3. Token se usa para Microsoft Graph API
4. Graph API devuelve datos de Teams
5. Renderizamos con nuestro diseño
```

---

## 📦 Dependencias a Instalar

```bash
npm install @azure/msal-react @azure/msal-browser
npm install @microsoft/microsoft-graph-client
npm install @microsoft/mgt-react @microsoft/mgt-msal2-provider
npm install @microsoft/teams-js
```

---

## 🔑 Configuración Azure AD

### Paso 1: Crear App Registration en Azure Portal

1. Ir a [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations → New registration
3. Configurar:
   - **Name:** DR Group Dashboard
   - **Supported account types:** Single tenant
   - **Redirect URI:** 
     - Type: Single-page application (SPA)
     - URI: `http://localhost:5173` (dev)
     - URI: `https://dr-group-cd21b.web.app` (prod)

### Paso 2: Configurar API Permissions

Permisos necesarios (Delegated):
- `User.Read` - Leer perfil del usuario
- `Chat.Read` - Leer chats del usuario
- `Chat.ReadWrite` - Enviar mensajes
- `ChannelMessage.Read.All` - Leer mensajes de canales
- `ChannelMessage.Send` - Enviar mensajes a canales
- `Files.Read.All` - Leer archivos compartidos
- `Presence.Read` - Ver estado de usuarios (online/offline)

**Importante:** Después de agregar permisos, hacer clic en "Grant admin consent"

### Paso 3: Obtener Credentials

Guardar estos valores (los necesitarás):
- **Application (client) ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## 📁 Estructura de Archivos a Crear

```
src/
├── config/
│   └── msalConfig.js                    # Configuración MSAL
├── contexts/
│   └── TeamsContext.jsx                 # Context para Teams
├── hooks/
│   ├── useTeamsAuth.js                  # Hook autenticación Teams
│   ├── useTeamsChats.js                 # Hook obtener chats
│   └── useTeamsMessages.js              # Hook obtener mensajes
├── components/
│   └── teams/
│       ├── TeamsProvider.jsx            # Provider principal
│       ├── ChatList.jsx                 # Lista de conversaciones
│       ├── ChatWindow.jsx               # Ventana de chat
│       ├── MessageBubble.jsx            # Burbuja de mensaje
│       ├── UserPresence.jsx             # Indicador online/offline
│       └── FileAttachment.jsx           # Vista previa de archivos
├── pages/
│   └── ConversationsPage.jsx            # Página principal de chat
└── utils/
    ├── graphClient.js                   # Cliente Microsoft Graph
    └── teamsHelpers.js                  # Funciones helper
```

---

## 🔄 Fases de Implementación

### **FASE 1: Setup y Autenticación** (1 día)
- [ ] Configurar Azure AD App Registration
- [ ] Instalar dependencias
- [ ] Crear archivo `msalConfig.js`
- [ ] Implementar `TeamsProvider.jsx`
- [ ] Crear hook `useTeamsAuth.js`
- [ ] Probar autenticación básica

### **FASE 2: Obtener Datos de Teams** (1 día)
- [ ] Crear `graphClient.js` (cliente Graph API)
- [ ] Implementar hook `useTeamsChats.js`
- [ ] Implementar hook `useTeamsMessages.js`
- [ ] Probar obtención de chats
- [ ] Probar obtención de mensajes

### **FASE 3: UI - Lista de Chats** (1 día)
- [ ] Crear componente `ChatList.jsx`
- [ ] Aplicar diseño sobrio empresarial
- [ ] Implementar búsqueda de conversaciones
- [ ] Mostrar últimos mensajes
- [ ] Indicadores de no leídos

### **FASE 4: UI - Ventana de Chat** (2 días)
- [ ] Crear componente `ChatWindow.jsx`
- [ ] Crear componente `MessageBubble.jsx`
- [ ] Implementar envío de mensajes
- [ ] Implementar carga de historial
- [ ] Scroll automático a nuevos mensajes
- [ ] Vista previa de archivos

### **FASE 5: Integración con Dashboard** (1 día)
- [ ] Crear página `ConversationsPage.jsx`
- [ ] Agregar ruta en `App.jsx`
- [ ] Agregar item en Sidebar
- [ ] Integrar notificaciones con sistema existente
- [ ] Agregar badge de mensajes no leídos

### **FASE 6: Features Avanzados** (1 día)
- [ ] Indicador de presencia (online/offline)
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda global de mensajes
- [ ] Compartir archivos desde Dashboard a Teams
- [ ] Estados de escritura ("Usuario está escribiendo...")

### **FASE 7: Testing y Ajustes** (1 día)
- [ ] Probar flujo completo de autenticación
- [ ] Probar envío/recepción de mensajes
- [ ] Probar con múltiples usuarios
- [ ] Ajustes de diseño
- [ ] Optimización de performance
- [ ] Manejo de errores

---

## 🎨 Guía de Diseño

### Paleta de Colores (del Dashboard)
```javascript
// Usar theme.palette existente
primary: '#667eea'
secondary: '#764ba2'
background: {
  paper: '#ffffff',
  default: '#f5f5f5'
}
text: {
  primary: 'rgba(0, 0, 0, 0.87)',
  secondary: 'rgba(0, 0, 0, 0.6)'
}
```

### Componentes a Usar
- `Paper` con `borderRadius: 2` (16px)
- `Typography` con variantes estándar
- Sombras: `boxShadow: '0 2px 8px rgba(0,0,0,0.06)'`
- Transiciones: `transition: 'all 0.2s ease'`

### Layout
```
┌─────────────────────────────────────────────────┐
│  Header (Gradient sobrio)                       │
├──────────────┬──────────────────────────────────┤
│              │                                   │
│  Chat List   │      Chat Window                 │
│  (30%)       │      (70%)                       │
│              │                                   │
│  - Chat 1    │  ┌─────────────────────────────┐│
│  - Chat 2    │  │ Mensajes                    ││
│  - Chat 3    │  │                             ││
│              │  └─────────────────────────────┘│
│              │  ┌─────────────────────────────┐│
│              │  │ Input de mensaje            ││
│              │  └─────────────────────────────┘│
└──────────────┴──────────────────────────────────┘
```

---

## 🔒 Seguridad

### Consideraciones
1. **Tokens:** Nunca exponer tokens en localStorage sin cifrar
2. **Permisos:** Solo solicitar permisos necesarios
3. **CORS:** Configurar correctamente en Azure AD
4. **Rate Limiting:** Implementar throttling en llamadas a Graph API
5. **Error Handling:** Manejar expiración de tokens gracefully

### Almacenamiento de Tokens
```javascript
// MSAL maneja tokens automáticamente
// Pero si necesitas almacenar algo:
- Usar sessionStorage (mejor que localStorage)
- Cifrar datos sensibles
- Limpiar al cerrar sesión
```

---

## 📊 Monitoreo y Logs

### Eventos a Registrar
- Inicio de sesión en Teams
- Envío de mensaje
- Recepción de mensaje
- Errores de autenticación
- Errores de Graph API

### Integración con Activity Logs
```javascript
// Usar el sistema existente de activity logs
logActivity({
  action: 'teams_message_sent',
  userId: currentUser.uid,
  details: { chatId, messageLength }
});
```

---

## 🚀 Deployment

### Variables de Entorno
```env
# .env.local (desarrollo)
VITE_MSAL_CLIENT_ID=your-client-id
VITE_MSAL_TENANT_ID=your-tenant-id
VITE_MSAL_REDIRECT_URI=http://localhost:5173

# .env.production
VITE_MSAL_CLIENT_ID=your-client-id
VITE_MSAL_TENANT_ID=your-tenant-id
VITE_MSAL_REDIRECT_URI=https://dr-group-cd21b.web.app
```

### Checklist Pre-Deploy
- [ ] Verificar permisos en Azure AD
- [ ] Confirmar redirect URIs en producción
- [ ] Probar flujo de autenticación en prod
- [ ] Verificar CORS configurado
- [ ] Documentar proceso para equipo

---

## 📚 Recursos Útiles

- [Microsoft Graph Documentation](https://learn.microsoft.com/en-us/graph/)
- [MSAL React Guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Microsoft Graph Toolkit](https://learn.microsoft.com/en-us/graph/toolkit/overview)
- [Teams JavaScript SDK](https://learn.microsoft.com/en-us/javascript/api/overview/msteams-client)

---

## ⏱️ Timeline Estimado

| Fase | Duración | Acumulado |
|------|----------|-----------|
| Setup y Autenticación | 1 día | 1 día |
| Obtener Datos | 1 día | 2 días |
| UI - Lista de Chats | 1 día | 3 días |
| UI - Ventana de Chat | 2 días | 5 días |
| Integración Dashboard | 1 día | 6 días |
| Features Avanzados | 1 día | 7 días |
| Testing y Ajustes | 1 día | 8 días |

**Total:** ~1.5 semanas de desarrollo

---

## ❓ Preguntas Frecuentes

**¿Los usuarios necesitan licencia de Teams?**
Sí, necesitan Microsoft 365 con Teams incluido.

**¿Funciona con cuentas personales de Microsoft?**
No, solo con cuentas organizacionales (Azure AD).

**¿Se pueden ver videollamadas?**
Sí, pero requiere integración adicional con Teams JavaScript SDK.

**¿Los mensajes se guardan en Firebase?**
No, se guardan en Teams. El dashboard solo los consulta.

**¿Qué pasa si un usuario no tiene Teams?**
Se mostrará un mensaje indicando que necesita Teams activado.

---

## 🎯 Próximos Pasos

1. ✅ Crear esta documentación
2. ⏳ Configurar Azure AD App Registration
3. ⏳ Comenzar Fase 1: Setup y Autenticación
