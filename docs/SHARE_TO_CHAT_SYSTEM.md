# 🔗 Sistema de Compartir al Chat - Documentación Técnica

## 📋 Descripción General

Sistema unificado para compartir registros de diferentes módulos del dashboard a conversaciones del chat interno de DR Group. Permite enviar compromisos, pagos, liquidaciones, empresas, clientes, salas, etc. con formato profesional y adjuntos automáticos.

---

## 🏗️ Arquitectura del Sistema

### **Componentes Principales:**

```
src/
├── hooks/
│   └── useShareToChat.js                    ← Lógica de negocio y formateo
├── components/
│   └── common/
│       └── ShareToChat.jsx                  ← Dialog modal unificado
└── [páginas implementadas]
    └── CommitmentsList.jsx                  ← ✅ IMPLEMENTADO
```

---

## 🔧 Recursos y Dependencias

### **1. Hook Principal: `useShareToChat.js`**

**Ubicación:** `src/hooks/useShareToChat.js`

**Responsabilidades:**
- ✅ Formatear mensajes según tipo de entidad
- ✅ Gestionar adjuntos (comprobantes, facturas, PDFs)
- ✅ Enviar mensajes a Firestore (`messages` collection)
- ✅ Cargar conversaciones disponibles (grupos + DMs)
- ✅ Cargar lista de usuarios para crear nuevos DMs

**Funciones Exportadas:**
```javascript
const {
  shareToChat,              // Función principal para compartir
  availableConversations,   // Lista de conversaciones disponibles
  availableUsers,           // Lista de usuarios para DMs
  loading,                  // Estado de carga
  error                     // Errores
} = useShareToChat();
```

**Estructura del Mensaje en Firestore:**
```javascript
{
  conversationId: "xyz123",
  senderId: "uid_usuario",
  senderName: "Diego Rueda",
  senderPhoto: "url_foto",
  text: "🚨 *💼 Compromiso Compartido*\n\n📋 *Descripción:* ...",
  createdAt: serverTimestamp(),
  status: { sent: true, delivered: false, read: false },
  metadata: {
    isSharedEntity: true,
    entityType: "commitment",
    entityId: "abc456",
    entityUrl: "https://...",
    sharedBy: { uid, name, timestamp }
  },
  attachments: [
    {
      type: "application/pdf",
      url: "https://firebasestorage.../comprobante.pdf",
      name: "Comprobante.pdf",
      size: 0,
      uploadedAt: "2025-11-26T..."
    }
  ]
}
```

---

### **2. Componente Modal: `ShareToChat.jsx`**

**Ubicación:** `src/components/common/ShareToChat.jsx`

**Props:**
```javascript
<ShareToChat
  open={boolean}                    // Abrir/cerrar dialog
  onClose={() => void}              // Callback al cerrar
  entity={object}                   // Datos del registro a compartir
  entityType={string}               // Tipo: 'commitment', 'payment', etc.
  entityName={string}               // Nombre para UI (ej: "compromiso")
/>
```

**Características:**
- ✅ Resumen visual del registro a compartir
- ✅ Selector de destino (conversación existente o nuevo DM)
- ✅ Campo de mensaje personalizado opcional
- ✅ Previsualización de adjuntos (comprobantes/facturas)
- ✅ Validaciones de campos requeridos
- ✅ Feedback visual (loading, success, error)
- ✅ Diseño Spectacular con gradientes y animaciones

**Flujo de Usuario:**
1. Usuario hace clic en botón "Compartir" (📤 Share icon)
2. Se abre modal con resumen del registro
3. Usuario selecciona destino (conversación o usuario)
4. Usuario escribe mensaje opcional
5. Usuario confirma y envía
6. Mensaje aparece en el chat con formato profesional

---

## 📊 Tipos de Entidad Soportados

### **Entidades Implementadas:**

| Tipo | Emoji | Descripción | Campos Incluidos | Adjuntos |
|------|-------|-------------|------------------|----------|
| `commitment` | 💼 | Compromisos financieros | Descripción, Empresa, Beneficiario, Monto, Vencimiento, Estado | ✅ Factura + Comprobante |
| `payment` | 💸 | Pagos realizados | Concepto, Monto, Fecha, Empresa | ✅ Comprobante |
| `liquidacion` | 📊 | Liquidaciones por sala | Sala, Total, Período | ❌ |
| `invoice` | 🧾 | Cuentas de cobro | Número, Cliente, Monto, Fecha | ❌ |
| `income` | 💵 | Ingresos | Descripción, Monto, Fecha, Empresa | ❌ |
| `company` | 🏢 | Empresas | Nombre, NIT, Representante, Teléfono | ❌ |
| `client` | 👤 | Clientes | Nombre, Email, Teléfono, Empresa | ❌ |
| `sala` | 🎮 | Salas | Nombre, Ubicación, Tarifa, Capacidad | ❌ |

---

## 🎯 Formato del Mensaje Compartido

### **Ejemplo: Compromiso**

```
🚨 *💼 Compromiso Compartido*

📋 *Descripción:* Pago arriendo oficina principal
🏢 *Empresa:* DR Group
👤 *Beneficiario:* Propietario Local
💰 *Monto:* $ 2,500,000
📅 *Vence:* 30/11/2025
📌 *Estado:* ⏳ Pendiente

💬 *Mensaje:*
Urgente: Confirmar pago antes del viernes

[Adjunto: Comprobante.pdf]
```

### **Ejemplo: Pago**

```
🚨 *💸 Pago Compartido*

📋 *Concepto:* Pago servicios públicos noviembre
💰 *Monto:* $ 850,000
📅 *Fecha:* 26/11/2025
🏢 *Empresa:* DR Group

[Adjunto: Comprobante_pago.pdf]
```

---

## ✅ Páginas Implementadas

### **1. CommitmentsList.jsx** ✅

**Estado:** COMPLETAMENTE IMPLEMENTADO

**Ubicación:** `src/components/commitments/CommitmentsList.jsx`

**Implementación:**
```javascript
// Estados
const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [commitmentToShare, setCommitmentToShare] = useState(null);

// Handler
const handleShareCommitment = (commitment) => {
  setCommitmentToShare(commitment);
  setShareDialogOpen(true);
};

// Botón en acciones
<Tooltip title="Compartir en chat" arrow>
  <IconButton 
    size="small" 
    onClick={() => handleShareCommitment(commitment)}
    sx={{ color: 'info.main' }}
  >
    <Share />
  </IconButton>
</Tooltip>

// Dialog
<ShareToChat
  open={shareDialogOpen}
  onClose={handleCloseShareDialog}
  entity={commitmentToShare}
  entityType="commitment"
  entityName="compromiso"
/>
```

**Ubicaciones del botón:**
- ✅ Vista de tabla (columna de acciones)
- ✅ Vista de cards (menu de acciones - 3 puntos)
- ✅ Modal de detalle (toolbar superior)

**Adjuntos incluidos:**
- ✅ Factura (si existe `invoiceUrl` o `invoices[0].url`)
- ✅ Comprobante (si existe `receiptUrl` o `receiptUrls[0]`)

---

## 📋 Páginas Pendientes de Implementación

### **Prioridad Alta:**

1. **PaymentsPage.jsx** 🔴
   - **Ruta:** `src/pages/PaymentsPage.jsx`
   - **Tipo:** `payment`
   - **Adjuntos:** Comprobante de pago
   - **Ubicación sugerida:** Botón en cada fila de la tabla

2. **LiquidacionesPorSalaPage.jsx** 🔴
   - **Ruta:** `src/pages/LiquidacionesPorSalaPage.jsx`
   - **Tipo:** `liquidacion`
   - **Adjuntos:** Ninguno
   - **Ubicación sugerida:** Botón en card de cada sala

3. **IncomePage.jsx** 🔴
   - **Ruta:** `src/pages/IncomePage.jsx`
   - **Tipo:** `income`
   - **Adjuntos:** Ninguno
   - **Ubicación sugerida:** Botón en cada fila de la tabla

### **Prioridad Media:**

4. **CompaniesPage.jsx** 🟡
   - **Ruta:** `src/pages/CompaniesPage.jsx`
   - **Tipo:** `company`
   - **Adjuntos:** Ninguno
   - **Ubicación sugerida:** Botón en card de cada empresa

5. **ClientesPage.jsx** 🟡
   - **Ruta:** `src/pages/ClientesPage.jsx`
   - **Tipo:** `client`
   - **Adjuntos:** Ninguno
   - **Ubicación sugerida:** Botón en cada fila de la tabla

6. **SalasPage.jsx** 🟡
   - **Ruta:** `src/pages/SalasPage.jsx`
   - **Tipo:** `sala`
   - **Adjuntos:** Ninguno
   - **Ubicación sugerida:** Botón en card de cada sala

7. **FacturacionPage.jsx** 🟡
   - **Ruta:** `src/pages/FacturacionPage.jsx`
   - **Tipo:** `invoice`
   - **Adjuntos:** PDF de la cuenta de cobro (si existe)
   - **Ubicación sugerida:** Botón en cada fila de la tabla

### **Prioridad Baja:**

8. **LiquidacionesHistorialPage.jsx** 🟢
   - **Ruta:** `src/pages/LiquidacionesHistorialPage.jsx`
   - **Tipo:** `liquidacion`
   - **Adjuntos:** Ninguno
   - **Ubicación sugerida:** Botón en cada fila del historial

---

## 🚀 Guía de Implementación Rápida

### **Paso 1: Importar dependencias**

```javascript
import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Share } from '@mui/icons-material';
import ShareToChat from '../common/ShareToChat';
```

### **Paso 2: Crear estados**

```javascript
const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [itemToShare, setItemToShare] = useState(null);
```

### **Paso 3: Crear handlers**

```javascript
const handleShareItem = (item) => {
  setItemToShare(item);
  setShareDialogOpen(true);
};

const handleCloseShareDialog = () => {
  setShareDialogOpen(false);
  setItemToShare(null);
};
```

### **Paso 4: Agregar botón en la UI**

```javascript
<Tooltip title="Compartir en chat" arrow>
  <IconButton 
    size="small" 
    onClick={() => handleShareItem(registro)}
    sx={{ color: 'info.main' }}
  >
    <Share />
  </IconButton>
</Tooltip>
```

### **Paso 5: Agregar dialog modal**

```javascript
{/* Dialog para compartir al chat */}
<ShareToChat
  open={shareDialogOpen}
  onClose={handleCloseShareDialog}
  entity={itemToShare}
  entityType="payment" // Cambiar según el tipo
  entityName="pago"    // Nombre para UI
/>
```

---

## 🎨 Comportamiento del Sistema

### **Adjuntos Automáticos:**

El sistema detecta automáticamente los adjuntos según el tipo de entidad:

**Compromisos (`commitment`):**
```javascript
// Prioridad de búsqueda:
1. entityData.invoiceUrl           → Factura
2. entityData.receiptUrl           → Comprobante
3. entityData.receiptUrls[0]       → Primer comprobante
4. entityData.invoices[0].url      → Primera factura
```

**Pagos (`payment`):**
```javascript
// Prioridad de búsqueda:
1. entityData.receiptUrl           → Comprobante
2. entityData.receiptUrls[0]       → Primer comprobante
```

**Otros tipos:**
- No incluyen adjuntos automáticos por defecto

### **Formato de Adjuntos:**

```javascript
{
  type: 'application/pdf',              // ✅ Tipo MIME correcto
  url: 'https://firebasestorage...',    // URL completa
  name: 'Comprobante.pdf',              // Nombre con extensión
  size: 0,                              // Tamaño en bytes
  uploadedAt: '2025-11-26T...'          // Timestamp ISO
}
```

**IMPORTANTE:** El campo `type` debe ser `'application/pdf'` para que `MessageBubble.jsx` lo detecte como PDF y muestre el visor profesional.

### **Mensajes Formateados:**

- ✅ Markdown con negritas (`*texto*`)
- ✅ Emojis descriptivos por campo
- ✅ Formato de moneda colombiana (COP)
- ✅ Fechas en formato `dd/mm/yyyy`
- ✅ Mensaje personalizado opcional al final
- ✅ Adjuntos como enlaces clickeables

### **Integridad de Datos:**

⚠️ **CRÍTICO:** Los archivos compartidos NO se eliminan de Storage al borrar el mensaje del chat.

**Razón:**
- Los comprobantes/facturas son documentos originales
- Pueden estar referenciados en múltiples lugares
- Solo se eliminan desde su módulo original (Pagos, Compromisos, etc.)
- El mensaje del chat solo contiene un **hipervínculo** al archivo

**Comportamiento al eliminar conversación:**
- ✅ Se eliminan mensajes de Firestore
- ✅ Se eliminan adjuntos de `chat_attachments/` (fotos/PDFs subidos directamente al chat)
- ❌ NO se eliminan archivos de `payments/`, `commitments/`, etc.

---

## 📊 Casos de Uso

### **Caso 1: Compartir compromiso pendiente**

**Escenario:** Administrador necesita recordar a contabilidad sobre un pago urgente

**Pasos:**
1. Abre página de Compromisos
2. Localiza el compromiso pendiente
3. Click en botón "Compartir" (📤)
4. Selecciona grupo "💼 Contabilidad"
5. Escribe: "Urgente: Confirmar antes del viernes"
6. Envía

**Resultado:**
- Mensaje aparece en chat de Contabilidad con formato profesional
- Comprobante adjunto como PDF clickeable
- Notificación push a todos los miembros del grupo

### **Caso 2: Compartir pago realizado**

**Escenario:** Contador confirma pago a gerente

**Pasos:**
1. Abre página de Pagos
2. Localiza el pago recién registrado
3. Click en "Compartir"
4. Selecciona DM con Diego Rueda
5. Escribe: "Pago realizado exitosamente"
6. Envía

**Resultado:**
- Mensaje directo al gerente con detalles del pago
- Comprobante adjunto para verificación
- Registro en metadata del mensaje para auditoría

---

## 🔍 Debugging y Logs

### **Logs de Consola:**

```javascript
// En useShareToChat.js
console.log('📤 Subiendo archivo: foto.jpg');          // Al compartir con adjunto
console.log('✅ Archivo subido: foto.jpg');            // Upload exitoso
console.error('❌ Error subiendo archivo:', error);    // Error en upload

// En ShareToChat.jsx
console.log('🚀 Compartiendo entidad:', entityType);   // Al iniciar compartir
console.log('✅ Compartido exitosamente');             // Compartir exitoso
console.error('❌ Error compartiendo:', error);        // Error al compartir
```

### **Errores Comunes:**

1. **"Usuario no autenticado"**
   - **Causa:** `currentUser` es `null`
   - **Solución:** Verificar `useAuth()` está disponible

2. **"Debe seleccionar un destino"**
   - **Causa:** No se seleccionó conversación ni usuario
   - **Solución:** Validar que `targetConversationId` existe

3. **"Archivo ya no existe en Storage"**
   - **Causa:** URL del adjunto apunta a archivo eliminado
   - **Solución:** No crítico, el mensaje se envía sin adjunto

---

## 📈 Métricas y Analytics

### **Datos Rastreados:**

```javascript
metadata: {
  isSharedEntity: true,              // Flag para identificar mensajes compartidos
  entityType: "commitment",          // Tipo de entidad compartida
  entityId: "abc123",                // ID del registro original
  entityUrl: "https://...",          // URL directa al adjunto
  sharedBy: {
    uid: "xyz",                      // ID del usuario que compartió
    name: "Diego Rueda",             // Nombre del usuario
    timestamp: "2025-11-26T..."      // Momento exacto
  }
}
```

**Posibles análisis:**
- Tipos de entidad más compartidos
- Usuarios más activos compartiendo
- Conversaciones con más contenido compartido
- Horarios de mayor actividad

---

## 🔒 Consideraciones de Seguridad

### **Validaciones Implementadas:**

✅ **Usuario autenticado:** Solo usuarios con sesión activa pueden compartir  
✅ **Destino válido:** Debe seleccionar conversación o usuario existente  
✅ **Datos sanitizados:** Mensajes escapan caracteres especiales  
✅ **URLs verificadas:** Solo URLs de Firebase Storage permitidas  
✅ **Permisos de chat:** Solo puede compartir a conversaciones donde participa  

### **Pendientes de Implementar:**

⚠️ **Permisos por rol:** Verificar que el usuario tiene permiso para ver el registro original  
⚠️ **Rate limiting:** Limitar número de mensajes compartidos por minuto  
⚠️ **Validación de tamaño:** Limitar cantidad de datos en un mensaje  

---

## 🚧 Roadmap Futuro

### **Mejoras Planificadas:**

1. **Vista previa de registros en el chat** 🎯
   - Smart cards interactivos
   - Click para abrir modal con detalles completos
   - Botones de acción rápida (Marcar pagado, Editar, etc.)

2. **Compartir múltiples registros** 🎯
   - Selección múltiple en tablas
   - Enviar lote de compromisos/pagos
   - Resumen consolidado

3. **Compartir a múltiples destinos** 🎯
   - Enviar a varios grupos/usuarios simultáneamente
   - Copia masiva de información

4. **Historial de compartidos** 🎯
   - Ver dónde se compartió un registro
   - Rastrear conversaciones relacionadas

5. **Notificaciones inteligentes** 🎯
   - Notificar cuando alguien comparte algo relevante
   - Resumen diario de registros compartidos

---

## 📚 Referencias Técnicas

### **Archivos Clave:**

```
src/
├── hooks/
│   └── useShareToChat.js                    // 290 líneas - Lógica principal
├── components/
│   └── common/
│       └── ShareToChat.jsx                  // 522 líneas - UI completa
├── components/commitments/
│   └── CommitmentsList.jsx                  // 4325 líneas - Implementación de referencia
└── config/
    └── chatGroups.js                        // Grupos predefinidos del chat
```

### **Collections de Firestore:**

- **`messages`** - Mensajes del chat (donde se guardan los compartidos)
- **`conversations`** - Conversaciones del chat
- **`users`** - Usuarios del sistema
- **`companies`** - Empresas (para obtener nombres)

### **Firebase Storage Paths:**

- **`chat_attachments/`** - Archivos subidos directamente al chat
- **`payments/`** - Comprobantes de pago (NO se eliminan al borrar mensaje)
- **`commitments/`** - Facturas de compromisos (NO se eliminan al borrar mensaje)

---

## ✅ Checklist de Implementación

### **Para cada página nueva:**

- [ ] Importar `ShareToChat` y `Share` icon
- [ ] Crear estados `shareDialogOpen` y `itemToShare`
- [ ] Crear handlers `handleShareItem` y `handleCloseShareDialog`
- [ ] Agregar botón en UI (Tabla, Card, o Modal)
- [ ] Agregar dialog modal con props correctas
- [ ] Definir `entityType` apropiado
- [ ] Verificar que los adjuntos se detectan correctamente
- [ ] Probar compartir a grupo
- [ ] Probar compartir a DM
- [ ] Verificar formato del mensaje en el chat
- [ ] Verificar que adjuntos se abren correctamente
- [ ] Documentar ubicación del botón en esta guía

---

## 🎓 Notas de Aprendizaje

### **Lecciones Clave:**

1. **Centralización es vital:** Un solo hook y componente para todo el sistema
2. **Formato consistente:** Mismo estilo de mensaje para todos los tipos
3. **Metadata es poder:** `isSharedEntity` permite filtrar y analizar
4. **Adjuntos con cuidado:** Siempre verificar URLs válidas antes de adjuntar
5. **UX primero:** Dialog modal debe ser intuitivo y rápido

### **Errores Evitados:**

❌ **No crear componentes separados por página** → Usa el unificado  
❌ **No hardcodear formatos** → Usa las templates del hook  
❌ **No olvidar validaciones** → Siempre verificar usuario y destino  
❌ **No eliminar archivos originales** → Solo enlaces en el chat  

---

**Última actualización:** 26 de Noviembre, 2025  
**Autor:** GitHub Copilot + Diego Rueda  
**Estado:** Documentación completa y actualizada
