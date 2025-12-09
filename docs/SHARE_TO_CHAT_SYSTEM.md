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
- ✅ **Visualización de documentos en modal PDFViewerModal** (comprobantes, facturas, contratos, certificados)
- ✅ Previsualización de adjuntos con botones para abrir en modal
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
| `platform` | 💻 | Credenciales de plataformas | Empresa, Plataforma, Usuario, Contraseña, Link | ❌ |
| `client` | 👤 | Clientes | Nombre, Email, Teléfono, Salas asociadas (lista), Administradores (lista) | ❌ |
| `administrator` | 👨‍💼 | Administradores/Encargados | Nombre, Email, Teléfono, Salas a cargo (lista) | ❌ |
| `sala` | 🎮 | Salas | Empresa, Nombre, Ubicación, Dirección, Propietario, Proveedor, Contactos, Máquinas, Estado | ❌ |
| `company_with_salas` | 🏢 | Empresa con todas sus salas | Nombre empresa, Total salas, Lista de salas (nombre, ciudad, estado) | ❌ |
| `empleado` | 👤 | Empleados | Nombre, Documento, Email, Teléfono, Empresa, Contrato, Datos bancarios | ✅ Doc. Identidad + Contrato + Certif. Bancario |

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
🏢 *Empresa:* DR Group
👤 *Beneficiario:* Empresa de Servicios
💰 *Monto:* $ 850,000
📅 *Fecha:* 26/11/2025
💳 *Método:* Transferencia
🔢 *Referencia:* TRF-2025-001
🏦 *Banco Origen:* Bancolombia
💳 *Cuenta Origen:* 123456789
💬 *Notas:* Pago puntual mes de noviembre

[Adjunto: Comprobante_pago.pdf]
```

---

## ✅ Páginas Implementadas

### **Estado General del Sistema:**

**Páginas completadas:** 8 de 9 páginas principales  
**Tipos de entidad:** 10 tipos diferentes soportados  
**Última actualización:** 8 de Diciembre, 2025

---

### **1. CommitmentsList.jsx** ✅

**Estado:** COMPLETAMENTE IMPLEMENTADO

**Ubicación:** `src/components/commitments/CommitmentsList.jsx`

**Ubicaciones del botón:**
- ✅ Vista de tabla (columna de acciones)
- ✅ Vista de cards (menu de acciones - 3 puntos)
- ✅ Modal de detalle (toolbar superior)

**Campos mostrados en vista previa del modal:**
- 📋 Descripción
- 🏢 Empresa
- 👤 Beneficiario
- 💰 Monto
- 📅 Vence
- 📌 Estado (Pagado/Pendiente)
- 📎 Ver factura (si existe)
- 📎 Ver comprobante (si existe)

**Adjuntos incluidos:**
- ✅ Factura (si existe `invoiceUrl` o `invoices[0].url`)
- ✅ Comprobante (si existe `receiptUrl` o `receiptUrls[0]`)

**Implementado:** 26 de Noviembre, 2025

---

### **2. PaymentsPage.jsx** ✅

**Estado:** COMPLETAMENTE IMPLEMENTADO

**Ubicación:** `src/pages/PaymentsPage.jsx`

**Implementación:**
```javascript
// Estados
const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [paymentToShare, setPaymentToShare] = useState(null);

// Handlers
const handleSharePayment = (payment) => {
  setPaymentToShare(payment);
  setShareDialogOpen(true);
  handleActionMenuClose();
};

const handleCloseShareDialog = () => {
  setShareDialogOpen(false);
  setPaymentToShare(null);
};

// Botón en tabla (columna de acciones)
<Tooltip title="Compartir en chat" arrow>
  <IconButton
    size="small"
    onClick={() => handleSharePayment(payment)}
    sx={{ 
      color: 'info.main',
      '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) }
    }}
  >
    <Share fontSize="small" />
  </IconButton>
</Tooltip>

// Dialog
<ShareToChat
  open={shareDialogOpen}
  onClose={handleCloseShareDialog}
  entity={paymentToShare}
  entityType="payment"
  entityName="pago"
/>
```

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

**Campos mostrados en vista previa del modal:**
- 📋 Concepto
- 🏢 Empresa (con carga asíncrona si solo hay companyId)
- 👤 Beneficiario/Proveedor
- 💰 Monto (formato COP)
- 📅 Fecha
- 💳 Método de pago (Transferencia, PSE, Efectivo, etc.)
- 🔢 Referencia (condicional - solo si existe)
- 🏦 Banco Origen (condicional - solo si existe)
- 💳 Cuenta Origen (condicional - solo si existe)
- 💬 Notas (condicional - solo si existe)
- 📎 Ver comprobante (condicional - botón para abrir PDF)

**Ubicación del botón:**
- ✅ Vista de tabla: Botón directo en cada fila (junto a Ver, Editar, Más opciones)
- ✅ Color: `info.main` con hover effect

**Adjuntos incluidos:**
- ✅ Comprobante (prioridad: `attachments[0]` > `receiptUrl` > `receiptUrls[0]`)

**Ubicaciones del botón (Compromisos):**
- ✅ Vista de tabla (columna de acciones)
- ✅ Vista de cards (menu de acciones - 3 puntos)
- ✅ Modal de detalle (toolbar superior)

**Adjuntos incluidos (Compromisos):**
- ✅ Factura (si existe `invoiceUrl` o `invoices[0].url`)
- ✅ Comprobante (si existe `receiptUrl` o `receiptUrls[0]`)

---

## 📋 Páginas Pendientes de Implementación

### **Prioridad Alta:**

1. **PaymentsPage.jsx** ✅ **IMPLEMENTADO**
   - **Ruta:** `src/pages/PaymentsPage.jsx`
   - **Tipo:** `payment`
   - **Adjuntos:** Comprobante de pago
   - **Ubicación:** Botón directo en cada fila de la tabla (junto a Ver, Editar, Más opciones)
   - **Implementado:** 8 de Diciembre, 2025
   - **Estado:** Sistema de compartir pagos completamente funcional

2. **LiquidacionesPorSalaPage.jsx** ✅ **IMPLEMENTADO**
   - **Ruta:** `src/pages/LiquidacionesPorSalaPage.jsx`
   - **Tipo:** `liquidacion`
   - **Adjuntos:** Ninguno
   - **Ubicación:** Botón directo en cada fila de la tabla (junto a Ver, Info, Editar)
   - **Implementado:** 8 de Diciembre, 2025
   - **Estado:** Sistema de compartir liquidaciones completamente funcional

**Campos compartidos (Liquidaciones):**
- 🏢 Empresa
- 🎮 Sala
- 📅 Período (formato: "Noviembre 2025")
- 🎰 Máquinas (cantidad total)
- 💰 Producción (formato COP)
- 💸 Impuestos (formato COP)

3. **IncomePage.jsx** 🔴 **OMITIDO**
   - **Ruta:** `src/pages/IncomePage.jsx`
   - **Tipo:** `income`
   - **Motivo:** No tiene interfaz de lista, es un formulario de entrada único
   - **Estado:** No aplica para Share to Chat
   - **Decisión:** 8 de Diciembre, 2025
   - **Razón técnica:** La página solo tiene un formulario de registro de ingresos sin lista de ingresos previos. No hay registros individuales para compartir desde esta página.

### **Prioridad Media:**

4. **CompaniesPage.jsx** ✅ **IMPLEMENTADO COMPLETO**
   - **Ruta:** `src/pages/CompaniesPage.jsx`
   - **Tipo:** `company` + `platform` (credenciales)
   - **Adjuntos:** Ninguno
   - **Ubicación:** Botón en card de cada empresa (entre Ver y Editar)
   - **Implementado:** 8 de Diciembre, 2025
   - **Estado:** Sistema de compartir empresas y credenciales de plataformas completamente funcional

**Campos compartidos (Empresa Completa):**
- 🏢 Nombre
- 🆔 NIT
- 📧 Email (condicional)
- 👤 Representante Legal (condicional)
- 🪪 Cédula Rep. Legal (condicional)
- 📋 Número de Contrato (condicional)
- 🏦 Banco (condicional)
- 💳 Cuenta Bancaria (condicional)
- 📊 Tipo de Cuenta (condicional)

**✨ NUEVA FUNCIONALIDAD: Compartir Credenciales de Plataforma**

Se agregó la capacidad de compartir credenciales individuales de plataformas (Coljuegos, Houndoc, DIAN, Supersalud) desde el modal de vista de empresas.

**Implementación de Credenciales:**
- **Tipo de entidad:** `platform`
- **Ubicación:** Botón "Compartir" en cada tarjeta de plataforma dentro del modal de vista de empresa
- **Estados adicionales:** 
  ```javascript
  const [platformShareDialogOpen, setPlatformShareDialogOpen] = useState(false);
  const [platformCredentials, setPlatformCredentials] = useState(null);
  ```

**Campos compartidos (Credenciales de Plataforma):**
- 🏢 Empresa
- 💻 Plataforma (Coljuegos/DIAN/Supersalud/Houndoc)
- 👤 Usuario o NIT
- 🪪 Cédula (condicional)
- 🔒 Contraseña (mostrada completa en el mensaje)
- 🔗 Link* (URL clickeable)

**Características especiales:**
- ✅ Modal de vista previa: Muestra contraseña como `••••••••` por seguridad
- ✅ Mensaje en chat: Muestra contraseña real para que pueda ser copiada
- ✅ URL clickeable: El enlace es completamente clickeable directamente desde el mensaje
- ✅ ID único generado: `{empresa}_{plataforma}` (ej: `casinos_montecarlo_sas_dian`)
- ✅ Cierre automático: Al compartir, cierra tanto el modal de compartir como el modal de vista de empresa
- ✅ Apertura automática del chat: Después de compartir, abre el drawer del chat con la conversación seleccionada

5. **ClientesPage.jsx** ✅ **IMPLEMENTADO COMPLETO**
   - **Ruta:** `src/pages/ClientesPage.jsx`
   - **Tipos:** `client` + `administrator`
   - **Adjuntos:** Ninguno
   - **Ubicación:** Botón en cada fila de clientes + Botón en cada fila de administradores (filas expandibles)
   - **Implementado:** 8 de Diciembre, 2025
   - **Estado:** Sistema de compartir clientes y administradores completamente funcional

**Campos compartidos (Cliente):**
- 👤 Nombre
- 📧 Email
- 📞 Teléfono
- 🎮 Salas Asociadas (lista numerada con ciudad y estado)
- 👨‍💼 Administradores (lista numerada con teléfonos)

**✨ NUEVA FUNCIONALIDAD: Compartir Administradores/Encargados**

Se agregó la capacidad de compartir administradores individuales con su información de contacto y las salas que tienen a cargo.

**Implementación de Administradores:**
- **Tipo de entidad:** `administrator`
- **Ubicación:** Botón "Compartir" en cada fila de administrador dentro de la sección expandible de clientes
- **Estados adicionales:**
  ```javascript
  const [shareAdminDialogOpen, setShareAdminDialogOpen] = useState(false);
  const [adminToShare, setAdminToShare] = useState(null);
  ```

**Handler de ID único:**
```javascript
const handleShareAdmin = (admin) => {
  // Agregar ID único basado en el nombre (para metadata de Firestore)
  const adminWithId = {
    ...admin,
    id: admin.nombre.toLowerCase().replace(/\s+/g, '_')
  };
  setAdminToShare(adminWithId);
  setShareAdminDialogOpen(true);
};
```

**Campos compartidos (Administrador):**
- 👤 Nombre
- 📧 Email (o "No especificado")
- 📞 Teléfono (o "No especificado")
- 🎮 Salas a Cargo (lista numerada):
  * Formato: `1. Casino Tiger Golden`
  * Lista completa de salas asignadas
  * Mensaje alternativo si no tiene salas: "Sin salas asignadas"

**Características especiales:**
- ✅ ID único generado automáticamente basado en nombre
- ✅ Vista previa en modal con lista completa de salas
- ✅ Mensaje formateado con lista numerada en chat
- ✅ Botón de compartir solo en filas de administradores expandibles
- ✅ Cierre automático al compartir
- ✅ Apertura automática del chat con conversación seleccionada

6. **SalasPage.jsx** ✅ **IMPLEMENTADO COMPLETO**
   - **Ruta:** `src/pages/SalasPage.jsx`
   - **Tipos:** `sala` + `company_with_salas`
   - **Adjuntos:** Ninguno
   - **Ubicación:** Botón en card de cada sala + Botón en card de cada empresa
   - **Implementado:** 8 de Diciembre, 2025

**Campos compartidos (Sala Individual):**
- 🏢 Empresa
- 🎮 Nombre
- 📍 Ubicación (ciudad + departamento consolidado)
- 🗺️ Dirección
- 👤 Propietario
- 💻 Proveedor
- 📋 Contrato (fecha de inicio)
- 👨‍💼 Contacto Principal (nombre - teléfono - email consolidado)
- 👨‍💼 Contacto Secundario (condicional, consolidado)
- 🎰 Máquinas
- ✅ Estado (Activa/Retirada)

**✨ NUEVA FUNCIONALIDAD: Compartir Empresa con Todas sus Salas**

Se agregó la capacidad de compartir una empresa junto con la lista completa de todas sus salas en un solo mensaje agregado.

**Implementación de Empresa con Salas:**
- **Tipo de entidad:** `company_with_salas`
- **Ubicación:** Botón "Compartir" en cada tarjeta de empresa (panel izquierdo)
- **Estados adicionales:**
  ```javascript
  const [shareCompanyDialogOpen, setShareCompanyDialogOpen] = useState(false);
  const [companyToShare, setCompanyToShare] = useState(null);
  ```

**Handler de filtrado:**
```javascript
const handleShareCompany = (company) => {
  const salasDeEmpresa = salas.filter(sala => sala.companyId === company.id);
  setCompanyToShare({
    ...company,
    salas: salasDeEmpresa,
    salasCount: salasDeEmpresa.length
  });
  setShareCompanyDialogOpen(true);
};
```

**Campos compartidos (Empresa con Salas):**
- 🏢 Empresa (nombre)
- 📊 Total de Salas (cantidad)
- 🎮 Salas (lista numerada):
  * Formato: `1. Casino Tiger Golden - Barranquilla (Activa)`
  * Cada sala incluye: nombre, ciudad, estado
  * Lista completa automática
  * Mensaje alternativo si no hay salas: "No hay salas registradas"

**Características especiales:**
- ✅ Filtrado automático de salas por `companyId`
- ✅ Vista previa en modal con lista completa renderizada
- ✅ Mensaje formateado con lista numerada en chat
- ✅ Diseño sobrio en EntitySummary con scroll si hay muchas salas
- ✅ Cierre automático al compartir
- ✅ Apertura automática del chat con conversación seleccionada

7. **LiquidacionesHistorialPage.jsx** ✅ **IMPLEMENTADO COMPLETO**
   - **Ruta:** `src/pages/LiquidacionesHistorialPage.jsx`
   - **Tipo:** `liquidacion`
   - **Adjuntos:** Ninguno
   - **Ubicación:** MenuItem en el menú de acciones de cada liquidación (MoreVert icon)
   - **Implementado:** 8 de Diciembre, 2025
   - **Estado:** Sistema de compartir liquidaciones del historial completamente funcional

**Campos compartidos:**
- 🏢 Empresa
- 📅 Período
- 🏛️ Establecimientos
- 🎰 Máquinas
- 💰 Producción Total (formato COP)
- 🏦 Derechos de Explotación (formato COP)
- 📋 Gastos de Administración (formato COP)
- 💸 Total Impuestos (formato COP)

**Características especiales:**
- ✅ Integrado en el menú de acciones existente (Ver detalle, Cargar, Descargar, Eliminar)
- ✅ Botón con icono ShareIcon y texto "Compartir en chat"
- ✅ Cierra automáticamente el menú al compartir
- ✅ Vista previa en modal con todos los campos formateados
- ✅ Mensaje formateado con emoji 📊 "Liquidación Compartida"
- ✅ Template y EntitySummary ya existían del sistema anterior
- ✅ Apertura automática del chat tras compartir

**Implementación:**
```javascript
// Estados
const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [liquidacionToShare, setLiquidacionToShare] = useState(null);

// Handlers
const handleShareLiquidacion = () => {
  setLiquidacionToShare(selectedLiquidacion);
  setShareDialogOpen(true);
  handleMenuClose();
};

const handleCloseShareDialog = () => {
  setShareDialogOpen(false);
  setLiquidacionToShare(null);
};

// MenuItem en Menu (después de Descargar, antes de Eliminar)
<MenuItem onClick={handleShareLiquidacion}>
  <ShareIcon sx={{ mr: 1 }} /> Compartir en chat
</MenuItem>

// Modal al final del componente
<ShareToChat
  open={shareDialogOpen}
  onClose={handleCloseShareDialog}
  entity={liquidacionToShare}
  entityType="liquidacion"
  entityName="liquidación"
/>
```

8. **EmpleadosPage.jsx** ✅ **IMPLEMENTADO COMPLETO**
   - **Ruta:** `src/pages/EmpleadosPage.jsx`
   - **Tipo:** `empleado`
   - **Adjuntos:** Documento de Identidad, Contrato Laboral, Certificado Bancario
   - **Ubicación:** IconButton en el header de cada card de empleado (primer botón)
   - **Implementado:** 8 de Diciembre, 2025
   - **Estado:** Sistema de compartir empleados completamente funcional con todos los datos del modal de vista

**Campos compartidos:**
- 👤 Nombre Completo
- 🌎 Nacionalidad
- 🪪 Documento (Tipo + Número)
- 🔗 Documento de Identidad* (enlace si existe)
- 📧 Email Corporativo
- 📞 Teléfono
- 🎂 Fecha de Nacimiento
- 📅 Edad
- 🏢 Empresa Contratante
- 📄 Tipo de Vigencia
- 📆 Inicio de Contrato
- 🔄 Renovación (Automática/Sin renovación)
- 🔗 Contrato Laboral* (enlace si existe)
- 🏦 Banco
- 💳 Tipo de Cuenta
- 🔢 Número de Cuenta
- 🔗 Certificado Bancario* (enlace si existe)

**Características especiales:**
- ✅ Botón de compartir (ShareIcon) en color verde con hover effect
- ✅ Tooltip "Compartir al Chat"
- ✅ Enlaces marcados con asterisco (*) disponibles en modal de vista
- ✅ Filtrado automático de campos vacíos (excepto enlaces)
- ✅ Mensaje con nota sobre disponibilidad de enlaces
- ✅ Vista previa completa en modal con todos los datos
- ✅ Diseño sobrio consistente con el resto del sistema

**Implementación:**
```javascript
// Import del hook
import { useShareToChat } from '../hooks/useShareToChat';
import ShareToChat from '../components/common/ShareToChat';

// Estados
const { shareToConversation } = useShareToChat();
const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [empleadoToShare, setEmpleadoToShare] = useState(null);

// Handler
const handleOpenShareDialog = (empleado) => {
  setEmpleadoToShare(empleado);
  setShareDialogOpen(true);
};

// Botón en card (antes del botón Ver Detalles)
<Tooltip title="Compartir al Chat">
  <IconButton 
    size="small" 
    onClick={() => handleOpenShareDialog(empleado)}
    sx={{ 
      mr: 1,
      color: 'success.main',
      '&:hover': {
        backgroundColor: alpha(theme.palette.success.main, 0.1)
      }
    }}
  >
    <ShareIcon fontSize="small" />
  </IconButton>
</Tooltip>

// Modal al final
{empleadoToShare && (
  <ShareToChat
    open={shareDialogOpen}
    onClose={() => {
      setShareDialogOpen(false);
      setEmpleadoToShare(null);
    }}
    entityType="empleado"
    entityData={empleadoToShare}
    onShare={shareToConversation}
  />
)}
```

9. **FacturacionPage.jsx** 🟡
   - **Ruta:** `src/pages/FacturacionPage.jsx`
   - **Tipo:** `invoice`
   - **Adjuntos:** PDF de la cuenta de cobro (si existe)
   - **Ubicación sugerida:** Botón en cada fila de la tabla

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

## 🆕 Mejoras Recientes (Diciembre 2025)

### **1. Apertura Automática del Chat** ✅
**Implementado:** 8 de Diciembre, 2025

Cuando se comparte un registro, el sistema ahora:
- ✅ Cierra el modal de compartir
- ✅ Cierra cualquier modal de vista (ej: detalles de empresa)
- ✅ Dispara evento `openChat` con el `conversationId`
- ✅ Abre automáticamente el drawer del chat flotante
- ✅ Selecciona la conversación donde se compartió

**Implementación técnica:**
```javascript
// En ShareToChat.jsx
window.dispatchEvent(new CustomEvent('openChat', { 
  detail: { conversationId: targetId } 
}));

// En CompaniesPage.jsx (ejemplo de cierre de modal)
React.useEffect(() => {
  const handleChatOpened = () => {
    setViewDialogOpen(false);
    setSelectedCompany(null);
  };

  window.addEventListener('openChat', handleChatOpened);
  return () => window.removeEventListener('openChat', handleChatOpened);
}, []);
```

### **2. URLs Clickeables en Mensajes** ✅
**Implementado:** 8 de Diciembre, 2025

Los enlaces en los mensajes del chat ahora son completamente clickeables:
- ✅ Detección automática de URLs (http:// y https://)
- ✅ Renderizado como enlaces con estilo primary
- ✅ Apertura en nueva pestaña con `target="_blank"`
- ✅ Hover effect con cambio de color
- ✅ Preserva formato completo de la URL

**Implementación técnica:**
```javascript
// En MessageBubble.jsx
const renderPlatformLinks = (text, theme) => {
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  // ... detecta y convierte URLs en enlaces <a>
};
```

### **3. Compartir Credenciales de Plataforma** ✅
**Implementado:** 8 de Diciembre, 2025

Nueva funcionalidad para compartir credenciales individuales de plataformas desde el modal de vista de empresas.

**Características:**
- ✅ Botones de compartir en cada tarjeta de plataforma (Coljuegos, DIAN, Supersalud, Houndoc)
- ✅ Modal dedicado con tipo de entidad `platform`
- ✅ Contraseña visible en el mensaje del chat (pero oculta en preview por seguridad)
- ✅ URL clickeable directamente desde el mensaje
- ✅ ID único generado: `{empresa}_{plataforma}`

**Plataformas soportadas:**
- Coljuegos
- DIAN
- Supersalud
- Houndoc

### **4. Diseño Sobrio Mejorado** ✅
**Implementado:** 8 de Diciembre, 2025

Mejoras visuales en el modal de vista previa:
- ✅ Campos con separadores divisorios
- ✅ Labels en uppercase con letter-spacing
- ✅ Valores en negrita con color primary
- ✅ Espaciado vertical mejorado (1.5 spacing units)
- ✅ Última fila sin borde inferior
- ✅ Emojis más grandes para mejor legibilidad
- ✅ Botón chip para enlaces de plataforma en lugar de texto largo

**Estilos aplicados:**
```javascript
const renderField = (label, value, emoji = '📌') => (
  <Box sx={{ 
    display: 'flex', 
    gap: 2, 
    mb: 1.5,
    pb: 1.5,
    borderBottom: '1px solid',
    borderColor: 'divider',
    '&:last-of-type': {
      borderBottom: 'none',
      mb: 0,
      pb: 0
    }
  }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 200 }}>
      <Typography variant="body2" sx={{ mr: 1, fontSize: '1.1rem' }}>
        {emoji}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ 
        fontWeight: 600, 
        textTransform: 'uppercase', 
        fontSize: '0.75rem', 
        letterSpacing: 0.5 
      }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, color: 'text.primary' }}>
      {value || 'No especificado'}
    </Typography>
  </Box>
);
```

---

## ✅ Checklist de Implementación

### **Para cada página nueva:**

- [ ] Importar `ShareToChat` y `Share` icon
- [ ] Crear estados `shareDialogOpen` y `itemToShare`
- [ ] Crear handlers `handleShareItem` y `handleCloseShareDialog`
- [ ] Agregar botón en UI (Tabla, Card, o Modal)
- [ ] Agregar dialog modal con props correctas
- [ ] Definir `entityType` apropiado en useShareToChat.js
- [ ] Crear template de mensaje en useShareToChat.js
- [ ] Crear EntitySummary en ShareToChat.jsx
- [ ] Verificar que los adjuntos se detectan correctamente
- [ ] Probar compartir a grupo
- [ ] Probar compartir a DM
- [ ] Verificar formato del mensaje en el chat
- [ ] Verificar apertura automática del chat
- [ ] Verificar URLs clickeables si aplica
- [ ] Documentar en SHARE_TO_CHAT_SYSTEM.md

### **Para credenciales de plataforma (opcional):**

- [ ] Crear estados `platformShareDialogOpen` y `platformCredentials`
- [ ] Crear handler `handleSharePlatformCredentials`
- [ ] Agregar botones de compartir en cada tarjeta de plataforma
- [ ] Pasar datos con estructura: `{ id, platformName, username, password, link, companyName }`
- [ ] Agregar listener de evento `openChat` para cerrar modales automáticamente
- [ ] Probar compartir a grupo
- [ ] Probar compartir a DM
- [ ] Verificar formato del mensaje en el chat
- [ ] Verificar que adjuntos se abren correctamente
- [ ] Documentar ubicación del botón en esta guía

### **Para entidades agregadas (opcional):**

- [ ] Crear estados para entidad agregada (ej: `companyToShare`)
- [ ] Crear handler que filtre/agrupe datos (ej: `handleShareCompany`)
- [ ] Pasar array de entidades relacionadas (ej: `{ ...company, salas: [...] }`)
- [ ] Crear template con mapeo de array en useShareToChat.js
- [ ] Crear EntitySummary con renderizado de lista en ShareToChat.jsx
- [ ] Verificar que lista se muestra completa en preview
- [ ] Verificar que lista se formatea correctamente en chat (numerada)
- [ ] Probar con 0 items (mensaje alternativo: "No hay X registrados")
- [ ] Documentar funcionalidad agregada

### **Estado General del Sistema (8 Diciembre 2025):**

**Páginas Implementadas:**
- ✅ CommitmentsList.jsx (Compromisos)
- ✅ PaymentsPage.jsx (Pagos)
- ✅ LiquidacionesPorSalaPage.jsx (Liquidaciones)
- ✅ CompaniesPage.jsx (Empresas + Credenciales de Plataformas)
- ✅ SalasPage.jsx (Salas Individuales + Empresas con Salas)
- ✅ ClientesPage.jsx (Clientes + Administradores)
- ✅ LiquidacionesHistorialPage.jsx (Historial de Liquidaciones)
- ✅ EmpleadosPage.jsx (Empleados con documentos)

**Páginas Omitidas:**
- 🔴 IncomePage.jsx (sin lista de registros)

**Páginas Pendientes:**
- 🟡 FacturacionPage.jsx (facturas/cuentas de cobro)

**Tipos de Entidad Creados:**
1. `commitment` ✅
2. `payment` ✅
3. `liquidacion` ✅
4. `company` ✅
5. `platform` ✅
6. `sala` ✅
7. `company_with_salas` ✅
8. `client` ✅
9. `administrator` ✅
10. `invoice` 🟡

**Funcionalidades Avanzadas:**
- ✅ Adjuntos automáticos (comprobantes, facturas)
- ✅ URLs clickeables en mensajes
- ✅ Markdown completo (*bold*, _italic_, __underline__, ~~strikethrough~~)
- ✅ Apertura automática del chat tras compartir
- ✅ Cierre automático de modales al abrir chat
- ✅ Entidades agregadas (empresa con lista de salas)
- ✅ Credenciales de plataformas con contraseñas visibles
- ✅ Diseño sobrio empresarial en modales
- ✅ Vista previa con scroll para entidades grandes

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

## 🆕 Mejoras Más Recientes (Diciembre 8, 2025)

### **5. Compartir Empresa con Todas sus Salas** ✅
**Implementado:** 8 de Diciembre, 2025

Nueva funcionalidad que permite compartir una empresa junto con la lista completa de todas sus salas en un mensaje agregado.

**Características:**
- ✅ Botón de compartir en cada tarjeta de empresa en SalasPage
- ✅ Tipo de entidad dedicado: `company_with_salas`
- ✅ Filtrado automático de salas por `companyId`
- ✅ Vista previa en modal con lista numerada completa
- ✅ Mensaje en chat con formato:
  ```
  🚨 *🏢 Empresa con Salas*
  
  🏢 *Empresa:* Casinos Montecarlo SAS
  📊 *Total de Salas:* 6 salas
  🎮 *Salas:*
  1. Casino Tiger Golden - Barranquilla (Activa)
  2. Casino y Refresquería - Cartagena (Activa)
  3. ... (resto de salas)
  ```

**Implementación técnica:**
```javascript
// Handler en SalasPage.jsx
const handleShareCompany = (company) => {
  const salasDeEmpresa = salas.filter(sala => sala.companyId === company.id);
  setCompanyToShare({
    ...company,
    salas: salasDeEmpresa,
    salasCount: salasDeEmpresa.length
  });
  setShareCompanyDialogOpen(true);
};

// Template en useShareToChat.js
company_with_salas: {
  title: '🏢 Empresa con Salas',
  fields: [
    { emoji: '🏢', label: 'Empresa', value: entityData.name },
    { emoji: '📊', label: 'Total de Salas', value: `${entityData.salasCount || 0} salas` },
    { 
      emoji: '🎮', 
      label: 'Salas', 
      value: entityData.salas.map((sala, index) => 
        `\n${index + 1}. ${sala.name} - ${sala.ciudad || 'N/A'} (${sala.status === 'active' ? 'Activa' : 'Retirada'})`
      ).join('') 
    }
  ]
}

// EntitySummary en ShareToChat.jsx
company_with_salas: (
  <>
    {renderField('Empresa', entity.name, '🏢')}
    {renderField('Total de Salas', `${entity.salasCount || 0} salas`, '📊')}
    {entity.salas && entity.salas.length > 0 ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5, pb: 1.5 }}>
        {/* Lista de salas renderizada con Typography */}
        {entity.salas.map((sala, index) => (
          <Typography key={sala.id || index} variant="body2">
            {index + 1}. {sala.name} - {sala.ciudad || 'N/A'} ({sala.status === 'active' ? 'Activa' : 'Retirada'})
          </Typography>
        ))}
      </Box>
    ) : (
      {/* Mensaje alternativo */}
      <Typography>No hay salas registradas</Typography>
    )}
  </>
)
```

**Ventajas:**
- ✅ Vista agregada completa de empresa + salas
- ✅ Un solo mensaje en lugar de múltiples
- ✅ Información consolidada y organizada
- ✅ Facilita revisión rápida de estructura empresarial
- ✅ Diseño sobrio con scroll si hay muchas salas

### **6. Compartir Sala Individual con Todos los Detalles** ✅
**Implementado:** 8 de Diciembre, 2025

Implementación completa de Share to Chat para salas individuales con 11 campos consolidados.

**Campos compartidos:**
- 🏢 Empresa
- 🎮 Nombre
- 📍 Ubicación (ciudad + departamento en un solo campo)
- 🗺️ Dirección
- 👤 Propietario
- 💻 Proveedor
- 📋 Contrato (fecha de inicio)
- 👨‍💼 Contacto Principal (nombre - teléfono - email consolidado)
- 👨‍💼 Contacto Secundario (condicional, consolidado)
- 🎰 Máquinas (cantidad)
- ✅ Estado (Activa/Retirada)

**Consolidación de campos:**
- ✅ Ciudad + Departamento → "Barranquilla, Atlántico"
- ✅ Contacto + Teléfono + Email → "Edgar Ruiz - 3103432748 - edgaruiz36@gmail.com"
- ✅ Eliminados: Costos de administración y conexión (información sensible)

**Mejoras visuales:**
- ✅ EntitySummary con maxHeight 350px y scroll personalizado
- ✅ Emojis sutiles (0.9rem)
- ✅ Labels en uppercase con letter-spacing
- ✅ Valores con wordBreak para texto largo
- ✅ Gradiente dinámico (primary → secondary) en botón Share y avatar
- ✅ RadioGroup mejorado con hover states
- ✅ Autocomplete con borderRadius consistente
- ✅ TextField con minRows/maxRows

### **7. Fix de Markdown Bold en Mensajes del Chat** ✅
**Implementado:** 8 de Diciembre, 2025

Corregido problema crítico donde los labels en negritas (`*Empresa:*`) no se mostraban correctamente en los mensajes del chat.

**Problema:**
- Mensajes compartidos mostraban literalmente `*Empresa:*` en lugar de **Empresa:**
- Función `renderTextWithMentionsBasic` no procesaba markdown

**Solución:**
```javascript
// MessageBubble.jsx - Reorganización de funciones
// ANTES: processTextFormat definido después de renderTextWithMentionsBasic
// DESPUÉS: processTextFormat definido ANTES

const processTextFormat = (text) => {
  const boldRegex = /(\*([^*\n]+)\*)/gm;
  // ... procesamiento de markdown
  return (
    <strong style={{ fontWeight: 700 }}>
      {match[2]}
    </strong>
  );
};

// Ahora renderTextWithMentionsBasic puede llamar a processTextFormat
const renderTextWithMentionsBasic = (text) => {
  // ... detección de menciones
  segments.push(...processTextFormat(beforeText)); // ✅ Ahora funciona
  // ...
};
```

**Resultado:**
- ✅ Labels en negrita funcionan correctamente
- ✅ Markdown completo procesado: `*bold*`, `_italic_`, `__underline__`, `~~strikethrough~~`
- ✅ Funciona con menciones (@usuario) y URLs clickeables
- ✅ fontWeight: 700 explícito para asegurar visibilidad

---

### **8. Compartir Clientes con Salas y Administradores** ✅
**Implementado:** 8 de Diciembre, 2025

Implementación completa de Share to Chat para clientes con lista de salas asociadas y administradores con sus contactos.

**Campos compartidos (Cliente):**
- 👤 Nombre
- 📧 Email
- 📞 Teléfono
- 🎮 Salas Asociadas (lista numerada):
  * Formato: `1. Casino Tiger Golden - Barranquilla (Activa)`
  * Cada sala incluye: nombre, ciudad, estado
- 👨‍💼 Administradores (lista numerada):
  * Formato: `1. Juan Esteban Márquez - 3161752058`
  * Cada administrador incluye: nombre y teléfono

**Mensaje de ejemplo:**
```
🚨 *👤 Cliente Compartido*

👤 *Nombre:* Cliente Ejemplo
📧 *Email:* cliente@ejemplo.com
📞 *Teléfono:* 3147821956
🎮 *Salas Asociadas:* 9 salas
1. Maquinitas El Trebol Del Sur - Santa Rosa del Sur (Activa)
2. Casino Mateo la 13 - Sabana de Torres (Activa)
3. Recreaciones Bolivar - San Pablo (Activa)
...
👨‍💼 *Administradores:* 5 administradores
1. Jhon Montoya - 3153324892
2. Juan Esteban Márquez - 3161752058
...
```

### **9. Compartir Administradores con Salas a Cargo** ✅
**Implementado:** 8 de Diciembre, 2025

Nueva funcionalidad que permite compartir administradores/encargados individuales con la lista de salas que tienen bajo su responsabilidad.

**Características:**
- ✅ Botón de compartir en filas expandibles de administradores
- ✅ Tipo de entidad dedicado: `administrator`
- ✅ ID único generado automáticamente: `nombre_en_minusculas_con_guiones`
- ✅ Fallback para entityId: `administrator_timestamp` si no existe ID
- ✅ Vista previa en modal con lista completa de salas
- ✅ Mensaje en chat con formato:
  ```
  🚨 *👨‍💼 Administrador/Encargado*
  
  👤 *Nombre:* Felipe Valencia Márquez
  📧 *Email:* pipevalenciam.22@gmail.com
  📞 *Teléfono:* 3152063192
  🎮 *Salas a Cargo:* 2 salas
  1. Casino el Gran Marquez Medellin
  2. Casino El Gran Marquez Remedios
  ```

**Implementación técnica:**
```javascript
// Handler en ClientesPage.jsx
const handleShareAdmin = (admin) => {
  const adminWithId = {
    ...admin,
    id: admin.nombre.toLowerCase().replace(/\s+/g, '_')
  };
  setAdminToShare(adminWithId);
  setShareAdminDialogOpen(true);
};

// Template en useShareToChat.js
administrator: {
  title: '👨‍💼 Administrador/Encargado',
  fields: [
    { emoji: '👤', label: 'Nombre', value: entityData.nombre },
    { emoji: '📧', label: 'Email', value: entityData.email || 'No especificado' },
    { emoji: '📞', label: 'Teléfono', value: entityData.telefono || 'No especificado' },
    { 
      emoji: '🎮', 
      label: 'Salas a Cargo', 
      value: entityData.salasAsociadas.map((sala, index) => 
        `${index + 1}. ${sala}`
      ).join('\n')
    }
  ]
}

// Fallback de entityId en useShareToChat.js
entityId: entityData.id || `${entityType}_${Date.now()}`
```

**Ventajas:**
- ✅ Información completa de administradores con responsabilidades
- ✅ Contacto directo (email y teléfono)
- ✅ Visibilidad de salas asignadas
- ✅ Facilita coordinación y seguimiento de encargados

---

**Última actualización:** 8 de Diciembre, 2025  
**Autor:** GitHub Copilot + Diego Rueda  
**Estado:** Documentación completa y actualizada con últimas funcionalidades (8 páginas implementadas, 10 tipos de entidad)
