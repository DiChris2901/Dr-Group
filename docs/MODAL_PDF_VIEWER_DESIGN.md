# 🎨 MODAL VISOR PDF - DISEÑO SPECTACULAR EMPRESARIAL

## 📋 Documento de Referencia - IMPLEMENTACIÓN AVANZADA COMPLETA

**Fecha:** 28 de Agosto, 2025  
**Estado:** ✅ IMPLEMENTADO Y FUNCIONANDO COMPLETAMENTE  
**Archivo:** `src/components/commitments/CommitmentsList.jsx`  
**Versión:** V2.0 - Con Panel de Información Avanzado

---

## 🚀 IMPLEMENTACIÓN REFERENCE - USAR COMO EJEMPLO PRINCIPAL

**⚠️ IMPORTANTE: Este es el MODAL PDF VIEWER DE REFERENCIA para toda la aplicación**

Este modal representa la **implementación más avanzada y completa** para visualización de documentos en DR Group Dashboard. Incluye:

✅ **Panel de información expandible con metadatos reales de Firebase**  
✅ **Integración completa con Firebase Storage getMetadata**  
✅ **Ajuste dinámico de altura según contenido**  
✅ **Layout responsivo con CSS Grid**  
✅ **Manejo inteligente de tipos MIME**  
✅ **Sistema de scroll optimizado**  
✅ **Estados de carga y error manejados**

---

##  Características Implementadas OBLIGATORIAS

### **1. Header Empresarial Premium CON PANEL INFORMACIÓN**
```jsx
<DialogTitle sx={{ 
  p: 3,
  pb: 2,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
}}>
  <Box display="flex" justifyContent="space-between" alignItems="center">
    {/* SECCIÓN IZQUIERDA - Avatar + Información */}
    <Box display="flex" alignItems="center" gap={2.5}>
      <motion.div>
        <Avatar sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          width: 40,
          height: 40
        }}>
          {/* ICONO DINÁMICO SEGÚN TIPO */}
        </Avatar>
      </motion.div>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {/* NOMBRE LIMPIO DEL ARCHIVO */}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2">
            {/* TIPO • TAMAÑO CON FORMATEO INTELIGENTE */}
          </Typography>
          <Typography variant="body2">
            {/* FECHA DE SUBIDA FORMATEADA */}
          </Typography>
        </Box>
      </Box>
    </Box>
    
    {/* SECCIÓN DERECHA - Controles Avanzados */}
    <Box display="flex" gap={1}>
      {/* BOTÓN INFO CON ESTADO ACTIVO */}
      <Tooltip title="Información del documento">
        <IconButton
          onClick={handleToggleDocumentInfo}
          sx={{ 
            color: theme.palette.text.primary,
            background: documentInfoOpen 
              ? alpha(theme.palette.info.main, 0.15) 
              : alpha(theme.palette.info.main, 0.08),
            '&:hover': { 
              background: alpha(theme.palette.info.main, 0.2),
              transform: 'scale(1.05)'
            }
          }}
        >
          <Info sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      {/* OTROS CONTROLES... */}
    </Box>
  </Box>
</DialogTitle>
```

### **2. PANEL INFORMACIÓN EXPANDIBLE AVANZADO**
```jsx
{/* PANEL INFORMACIÓN FIREBASE METADATOS */}
{documentInfo && documentInfoOpen && (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    style={{ overflow: 'hidden' }}
  >
    <Box sx={{
      px: 3,
      py: 2,
      background: alpha(theme.palette.info.main, 0.04),
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
      maxHeight: '50vh',           // ALTURA CONTROLADA
      overflowY: 'auto',           // SCROLL INTERNO
      minHeight: 'auto'
    }}>
      {/* GRID RESPONSIVO PRINCIPAL */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 2, 
        mb: 2
      }}>
        {/* UBICACIÓN */}
        <Box display="flex" alignItems="start" gap={1}>
          <FolderOpen sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500,
              display: 'block'
            }}>
              Ubicación
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.primary,
              fontSize: '0.8rem',
              wordBreak: 'break-word'
            }}>
              {documentInfo.path || 'Firebase Storage'}
            </Typography>
          </Box>
        </Box>
        
        {/* TIPO CON FORMATEO INTELIGENTE */}
        <Box display="flex" alignItems="start" gap={1}>
          <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption">Tipo</Typography>
            <Typography variant="body2">
              {formatDocumentType(documentInfo.type)}  {/* MIME → AMIGABLE */}
            </Typography>
          </Box>
        </Box>
        
        {/* FECHA REAL DE FIREBASE */}
        <Box display="flex" alignItems="start" gap={1}>
          <Schedule sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption">Fecha de subida</Typography>
            <Typography variant="body2">
              {/* FORMATO DD/MM/YYYY HH:MM DESDE FIREBASE */}
            </Typography>
          </Box>
        </Box>
        
        {/* TAMAÑO REAL DE FIREBASE */}
        <Box display="flex" alignItems="start" gap={1}>
          <GetApp sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption">Tamaño</Typography>
            <Typography variant="body2">
              {formatFileSize(documentInfo.size, documentInfo.isEstimated)}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* INFORMACIÓN TÉCNICA DETALLADA */}
      {documentInfo.url && (
        <Box sx={{ pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
          <Typography variant="caption">Ruta completa del documento</Typography>
          <Typography variant="body2" sx={{ 
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            background: alpha(theme.palette.grey[500], 0.1),
            p: 1.5,
            borderRadius: 1,
            wordBreak: 'break-all',
            mb: 2
          }}>
            {documentInfo.fullPath || documentInfo.path || documentInfo.url}
          </Typography>

          {/* METADATOS FIREBASE AVANZADOS */}
          {(documentInfo.bucket || documentInfo.updatedAt) && (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minWidth(250px, 1fr))',
              gap: 2,
              mt: 2
            }}>
              {documentInfo.bucket && (
                <Box>
                  <Typography variant="caption">Bucket de almacenamiento</Typography>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    wordBreak: 'break-word'
                  }}>
                    {documentInfo.bucket}
                  </Typography>
                </Box>
              )}
              
              {documentInfo.updatedAt && (
                <Box>
                  <Typography variant="caption">Última modificación</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {format(documentInfo.updatedAt, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  </motion.div>
)}
```

### **3. FUNCIÓN getDocumentInfo AVANZADA**
```jsx
const getDocumentInfo = async (commitment, url) => {
  // 1. BUSCAR EN ATTACHMENTS PRIMERO
  let docInfo = null;
  
  if (commitment.attachments?.length > 0) {
    const attachment = commitment.attachments.find(att => 
      att.url === url || att.type === 'invoice' || att.category === 'invoice' ||
      (att.name && att.name.toLowerCase().includes('factura'))
    );
    
    if (attachment) {
      docInfo = {
        name: attachment.name || 'Documento sin nombre',
        size: attachment.size || 0,
        type: attachment.contentType || (url.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image'),
        uploadedAt: attachment.uploadedAt || attachment.createdAt || null,
        path: attachment.path || 'Storage/compromisos/',
        url: url
      };
    }
  }
  
  // 2. SI NO ESTÁ EN ATTACHMENTS, OBTENER METADATOS REALES DE FIREBASE
  if (!docInfo) {
    try {
      // EXTRAER RUTA DEL ARCHIVO DESDE URL FIREBASE
      let filePath = null;
      
      if (url.includes('firebase') && url.includes('o/')) {
        const encodedPath = url.split('o/')[1].split('?')[0];
        filePath = decodeURIComponent(encodedPath);
      } else {
        const urlParts = url.split('/');
        filePath = urlParts[urlParts.length - 1].split('?')[0];
      }
      
      if (filePath) {
        // CREAR REFERENCIA FIREBASE STORAGE
        const fileRef = ref(storage, filePath);
        
        try {
          // ✅ OBTENER METADATOS REALES DE FIREBASE
          const metadata = await getMetadata(fileRef);
          
          // EXTRAER NOMBRE LIMPIO
          let fileName = metadata.name || filePath.split('/').pop() || 'Documento';
          
          // LIMPIAR NOMBRES LARGOS
          if (fileName.length > 50) {
            const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
            const baseName = fileName.substring(0, 40);
            fileName = baseName + '...' + extension;
          }
          
          docInfo = {
            name: fileName,
            size: parseInt(metadata.size) || 0,                    // TAMAÑO REAL
            type: metadata.contentType || 'application/octet-stream', // TIPO MIME REAL
            uploadedAt: metadata.timeCreated ? new Date(metadata.timeCreated) : null, // FECHA REAL
            updatedAt: metadata.updated ? new Date(metadata.updated) : null,         // MODIFICACIÓN
            path: filePath,                                        // RUTA COMPLETA
            url: url,
            bucket: metadata.bucket,                               // BUCKET FIREBASE
            fullPath: metadata.fullPath                            // RUTA FIREBASE COMPLETA
          };
          
        } catch (metadataError) {
          console.log('Error obteniendo metadatos de Firebase:', metadataError);
          // FALLBACK A EXTRACCIÓN DE URL
          docInfo = await extractInfoFromUrl(url, commitment);
        }
      } else {
        docInfo = await extractInfoFromUrl(url, commitment);
      }
      
    } catch (error) {
      console.log('Error procesando información del archivo:', error);
      docInfo = await extractInfoFromUrl(url, commitment);
    }
  }
  
  return docInfo;
};
```

### **4. FUNCIÓN formatDocumentType INTELIGENTE**
```jsx
// CONVERSIÓN MIME TYPES → NOMBRES AMIGABLES
const formatDocumentType = (type) => {
  if (!type) return 'Documento';
  
  const mimeToFriendly = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG', 
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'text/plain': 'Texto',
    'text/csv': 'CSV'
  };
  
  // SI ES MIME CONOCIDO, USAR VERSIÓN AMIGABLE
  if (mimeToFriendly[type]) {
    return mimeToFriendly[type];
  }
  
  // SI ES TIPO SIMPLE, DEVOLVER TAL COMO ESTÁ
  if (type.length <= 10 && !type.includes('/')) {
    return type;
  }
  
  // PARA MIMES NO RECONOCIDOS, EXTRAER SUBTIPO
  if (type.includes('/')) {
    const parts = type.split('/');
    const subtype = parts[1];
    return subtype.toUpperCase();
  }
  
  return type;
};
```

### **5. AJUSTE DINÁMICO DE ALTURA**
```jsx
const handleToggleDocumentInfo = () => {
  const willOpen = !documentInfoOpen;
  setDocumentInfoOpen(willOpen);
  
  // AJUSTAR DIMENSIONES DEL MODAL SEGÚN ESTADO DEL PANEL
  if (willOpen) {
    // CUANDO SE ABRE EL PANEL, AUMENTAR SIGNIFICATIVAMENTE LA ALTURA
    setDocumentDimensions(prev => ({
      ...prev,
      height: 'calc(100vh - 50px)' // CASI PANTALLA COMPLETA
    }));
  } else {
    // CUANDO SE CIERRA EL PANEL, VOLVER A ALTURA NORMAL
    setDocumentDimensions(prev => ({
      ...prev,
      height: '90vh'
    }));
  }
};
```

### **6. DialogContent CON ALTURA DINÁMICA**
```jsx
<DialogContent sx={{ 
  p: 3, 
  pt: 3,
  height: documentInfoOpen ? 'calc(100% - 200px)' : '100%',  // AJUSTE DINÁMICO
  display: 'flex', 
  flexDirection: 'column',
  background: theme.palette.background.default,
  overflow: 'hidden'                                         // CONTROL OVERFLOW
}}>
```

---

## 🎯 IMPORTS OBLIGATORIOS

```jsx
// FIREBASE STORAGE AVANZADO
import { ref, deleteObject, getDownloadURL, getMetadata } from 'firebase/storage';

// ICONOS NECESARIOS
import {
  Info,           // Botón información
  FolderOpen,     // Ubicación
  InsertDriveFile, // Tipo archivo
  Schedule,       // Fecha
  GetApp,         // Tamaño/descarga
  PictureAsPdf,   // PDF icon
  Image,          // Imagen icon
  // ... otros iconos del modal
} from '@mui/icons-material';

// DATE-FNS PARA FORMATEO
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
```

---

## 🔧 ESTADOS MÍNIMOS REQUERIDOS

```jsx
// ESTADOS PRINCIPALES
const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
const [viewerSize, setViewerSize] = useState('normal');
const [invoiceUrl, setInvoiceUrl] = useState(null);

// ESTADOS INFORMACIÓN DOCUMENTO ⚠️ OBLIGATORIOS
const [documentInfo, setDocumentInfo] = useState(null);
const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
const [documentDimensions, setDocumentDimensions] = useState({ width: 'xl', height: '90vh' });
```

---

## 📋 FUNCIONES OBLIGATORIAS

```jsx
// 1. ABRIR MODAL CON CARGA DE INFORMACIÓN
const handleOpenPdfViewer = async (commitment) => {
  const url = commitment.facturaUrl || commitment.invoiceUrl;
  if (url) {
    setInvoiceUrl(url);
    
    // CALCULAR DIMENSIONES SEGÚN TIPO
    const dimensions = /* lógica de dimensiones */;
    setDocumentDimensions(dimensions);
    
    setPdfViewerOpen(true);
    
    // CARGAR INFORMACIÓN DEL DOCUMENTO
    const docInfo = await getDocumentInfo(commitment, url);
    setDocumentInfo(docInfo);
  }
};

// 2. CERRAR MODAL CON LIMPIEZA
const handleClosePdfViewer = () => {
  setPdfViewerOpen(false);
  setInvoiceUrl(null);
  setDocumentInfo(null);
  setDocumentInfoOpen(false);
  setViewerSize('normal');
  setDocumentDimensions({ width: 'xl', height: '90vh' });
};

// 3. TOGGLE INFORMACIÓN (OBLIGATORIO)
const handleToggleDocumentInfo = () => { /* implementación arriba */ };

// 4. OBTENER INFORMACIÓN DOCUMENTO (OBLIGATORIO)
const getDocumentInfo = async (commitment, url) => { /* implementación arriba */ };

// 5. FORMATEAR TIPO DOCUMENTO (OBLIGATORIO)
const formatDocumentType = (type) => { /* implementación arriba */ };

// 6. FORMATEAR TAMAÑO ARCHIVO
const formatFileSize = (bytes, isEstimated = false) => {
  if (!bytes || bytes === 0) return 'Tamaño no disponible';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
  
  if (isEstimated) {
    return `≈ ${size} ${sizes[i]}`;
  }
  
  return `${size} ${sizes[i]}`;
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN COMPLETA

### **📋 ESTRUCTURA MODAL**
- [ ] DialogTitle con gradiente spectacular y padding (p:3, pb:2)
- [ ] Avatar con gradiente primary→secondary y animación
- [ ] Sección información (nombre, tipo, tamaño, fecha)
- [ ] Botones de control con micro-interacciones (scale 1.05)
- [ ] **BOTÓN INFO con estado activo según documentInfoOpen**

### **📋 PANEL INFORMACIÓN AVANZADO**
- [ ] **motion.div con animación height y opacity**
- [ ] **Box container con maxHeight: 50vh y overflowY: auto**
- [ ] **CSS Grid layout responsivo (repeat(auto-fit, minWidth(200px, 1fr)))**
- [ ] **4 secciones principales: Ubicación, Tipo, Fecha, Tamaño**
- [ ] **Iconos alineados con alignItems: start y mt: 0.5**
- [ ] **wordBreak: break-word para textos largos**

### **📋 INFORMACIÓN TÉCNICA**
- [ ] **Separador con borderTop y alpha divider**
- [ ] **Ruta completa en box monospace con background**
- [ ] **Grid metadatos Firebase (bucket, última modificación)**
- [ ] **Formateo de fechas con date-fns y locale es**

### **📋 INTEGRACIÓN FIREBASE**
- [ ] **Import getMetadata de firebase/storage**
- [ ] **Función getDocumentInfo con try/catch para metadatos**
- [ ] **Extracción de filePath desde URL Firebase**
- [ ] **Manejo de errores con fallback a extractInfoFromUrl**
- [ ] **Metadatos reales: size, contentType, timeCreated, updated, bucket, fullPath**

### **📋 FUNCIONES AUXILIARES**
- [ ] **formatDocumentType con objeto mimeToFriendly completo**
- [ ] **formatFileSize con indicador isEstimated**
- [ ] **handleToggleDocumentInfo con ajuste de documentDimensions**
- [ ] **Limpieza de nombres largos (>50 chars)**

### **📋 ESTADOS Y DIMENSIONES**
- [ ] **documentInfo, documentInfoOpen, documentDimensions como estados**
- [ ] **Altura dinámica: 90vh normal, calc(100vh - 50px) expandido**
- [ ] **DialogContent con altura condicional según documentInfoOpen**
- [ ] **overflow: hidden en DialogContent para control**

### **📋 RESPONSIVE Y ACCESIBILIDAD**
- [ ] **CSS Grid auto-fit para diferentes tamaños pantalla**
- [ ] **minWidth: 0 y flex: 1 para evitar overflow**
- [ ] **Typography con variant y fontSize consistentes**
- [ ] **Colores con theme.palette y alpha values**
- [ ] **Tooltips en botones de control**

---

## 🚀 RESULTADO FINAL ESPERADO

**Este modal debe ser la REFERENCIA ABSOLUTA para cualquier implementación de visor de documentos en la aplicación.**

### **📊 Capacidades Implementadas:**
✅ **Metadatos reales de Firebase Storage**  
✅ **Panel información expandible con scroll**  
✅ **Ajuste dinámico de altura del modal**  
✅ **Formateo inteligente de tipos MIME**  
✅ **Layout responsivo con CSS Grid**  
✅ **Información técnica completa (bucket, rutas, fechas)**  
✅ **Estados de carga y error manejados**  
✅ **Animaciones spectacular con motion**  
✅ **Gradientes y micro-interacciones**  
✅ **Limpieza automática de nombres largos**  

### **📋 Casos de Uso Cubiertos:**
✅ **PDFs con iframe responsivo**  
✅ **Imágenes con object-fit contain**  
✅ **Documentos sin metadatos (fallback inteligente)**  
✅ **URLs de Firebase Storage y externas**  
✅ **Pantalla completa y ventana normal**  
✅ **Información expandible opcional**  
✅ **Descarga y apertura externa**  
✅ **Estados vacío y error**  

---

**⚠️ NO IMPLEMENTAR VERSIONES SIMPLIFICADAS DE ESTE MODAL**  
**✅ USAR ESTA IMPLEMENTACIÓN COMPLETA COMO BASE OBLIGATORIA**

*Documentación actualizada - DR Group Dashboard - Agosto 2025*

### **✅ Características Implementadas y Aprobadas**

#### **1. Header Empresarial Premium**
```jsx
// DialogTitle con gradiente suave y estructura profesional
<DialogTitle sx={{ 
  p: 3,                    // Padding exacto del design system
  pb: 2,                   // Reducido en bottom para separador
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
```

**Elementos del Header:**
- **Avatar con gradiente** (primary → secondary)
- **Título jerárquico** con subtítulo explicativo
- **Botones con micro-interacciones** (scale + background)
- **Separador sutil** con alpha divider

#### **2. Controles Interactivos Spectacular**
```jsx
// Botones con estados hover y transformaciones suaves
<IconButton
  onClick={toggleViewerSize}
  sx={{ 
    color: theme.palette.text.primary,
    background: alpha(theme.palette.primary.main, 0.08),
    '&:hover': { 
      background: alpha(theme.palette.primary.main, 0.12),
      transform: 'scale(1.05)'                              // Micro-interacción
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'    // Curva spectacular
  }}
>
```

**Controles Implementados:**
- ✅ **Fullscreen Toggle** (Fullscreen ↔ FullscreenExit)
- ✅ **Abrir en Nueva Pestaña** (OpenInNew)
- ✅ **Cerrar Modal** (Close con hover rojo)

#### **3. Contenido Envolvente con Paper**
```jsx
// DialogContent con Paper wrapper para elegancia
<DialogContent sx={{ 
  p: 3,                                           // Padding exacto
  pt: 3,                                          // Top consistente
  height: '100%', 
  display: 'flex', 
  flexDirection: 'column',
  background: theme.palette.background.default    // Fondo contrastante
}}>
  <Paper sx={{
    flex: 1,
    borderRadius: 2,                              // Border radius estándar
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    background: theme.palette.background.paper,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',     // Sombra nivel 1
    overflow: 'hidden',
    minHeight: '500px'
  }}>
```

#### **4. Estados Manejados Elegantemente**

**Estado con Contenido:**
- **PDFs**: iframe sin borders, 100% width/height
- **Imágenes**: Box wrapper con padding, object-fit contain, border radius

**Estado Vacío:**
```jsx
// Estado vacío con avatar y texto explicativo
<Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
  <Avatar sx={{ 
    width: 64, 
    height: 64, 
    background: alpha(theme.palette.grey[400], 0.1),
    margin: '0 auto 16px'
  }}>
    <Visibility sx={{ 
      fontSize: 32, 
      color: alpha(theme.palette.text.secondary, 0.7)
    }} />
  </Avatar>
  <Typography variant="h6">No hay documento disponible</Typography>
  <Typography variant="body2">Este compromiso no tiene un comprobante asociado</Typography>
</Box>
```

---

## 🎨 Especificaciones Técnicas

### **Responsive Design**
- **Tamaño Normal**: maxWidth="xl" (1536px)
- **Fullscreen**: maxWidth=false, fullScreen=true
- **Height**: 90vh normal, 100vh fullscreen

### **Animaciones y Transiciones**
- **Avatar inicial**: scale(0.8→1) + opacity(0→1) en 0.3s
- **Botones hover**: scale(1→1.05) + background change
- **Curva única**: cubic-bezier(0.4, 0, 0.2, 1)

### **Colores y Alpha Values**
```javascript
// Backgrounds
theme.palette.background.default    // DialogContent
theme.palette.background.paper      // Paper wrapper

// Alpha utilizados
alpha(theme.palette.divider, 0.12)         // Bordes suaves
alpha(theme.palette.primary.main, 0.08)    // Background normal
alpha(theme.palette.primary.main, 0.12)    // Background hover
alpha(theme.palette.error.main, 0.08)      // Close button hover
```

### **Tipografía Aplicada**
- **Título Principal**: variant="h6", fontWeight: 600
- **Subtítulo**: variant="body2", fontSize: '0.85rem'
- **Estado Vacío Título**: variant="h6", fontWeight: 500
- **Estado Vacío Descripción**: variant="body2"

---

## 📱 Funcionalidades Implementadas

### **✅ Gestión de Archivos**
```javascript
// Detección automática de tipo de archivo
{invoiceUrl.toLowerCase().includes('.pdf') ? (
  <iframe src={invoiceUrl} />
) : (
  <img src={invoiceUrl} style={{ objectFit: 'contain' }} />
)}
```

### **✅ Controles de Vista**
- **Toggle Fullscreen**: Cambia entre ventana normal y pantalla completa
- **Abrir External**: Link directo al archivo en nueva pestaña
- **Navegación**: Botones con tooltips explicativos

### **✅ Estados de Carga**
- **Documento Presente**: Visualización directa
- **Sin Documento**: Estado vacío con instrucciones
- **Error Handling**: Fallback automático para archivos no válidos

---

## 🔧 Variables de Estado Requeridas

```javascript
// Estados necesarios para el funcionamiento completo
const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
const [viewerSize, setViewerSize] = useState('normal');
const [invoiceUrl, setInvoiceUrl] = useState(null);

// Funciones de control
const handleOpenPdfViewer = (commitment) => { /* ... */ };
const handleClosePdfViewer = () => { /* ... */ };
const toggleViewerSize = () => { /* ... */ };
```

---

## 🎯 Casos de Uso Cubiertos

1. **✅ Visualización PDF**: Iframe responsivo sin borders
2. **✅ Visualización Imágenes**: Container con object-fit contain
3. **✅ Fullscreen Mode**: Toggle entre normal y pantalla completa
4. **✅ External Link**: Abrir documento en nueva pestaña
5. **✅ Estado Vacío**: Mensaje elegante cuando no hay documento
6. **✅ Responsive**: Adaptable a diferentes tamaños de pantalla
7. **✅ Dark/Light Mode**: Automático según tema del usuario

---

## 🚀 Extensiones Futuras Posibles

### **Mejoras Opcionales (No Críticas)**
- [ ] **Barra de Progreso**: Para PDFs pesados (>5MB)
- [ ] **Info del Archivo**: Tamaño y tipo en el header
- [ ] **Zoom Controls**: Para PDFs (si es necesario)
- [ ] **Historial**: Navegación entre documentos múltiples

### **Integraciones Futuras**
- [ ] **Anotaciones**: Markup sobre PDFs
- [ ] **Watermark**: Marca de agua de DR Group
- [ ] **Print**: Funcionalidad de impresión directa

---

## 📋 Checklist de Implementación

Al replicar este diseño en otros modales:

- [ ] DialogTitle con padding (p:3, pb:2)
- [ ] Background con gradientes sutiles según theme
- [ ] Avatar con gradiente primary→secondary
- [ ] Botones con micro-interacciones (scale 1.05)
- [ ] DialogContent con padding (p:3, pt:3)
- [ ] Paper wrapper con borderRadius:2
- [ ] Estados vacío con avatar + texto
- [ ] Transiciones con cubic-bezier(0.4, 0, 0.2, 1)
- [ ] Alpha colors según especificaciones
- [ ] Responsive design (xl → fullscreen)

---

## 🎉 Resultado Final

**Este modal representa el estándar de excelencia para DR Group Dashboard:**
- ✅ **Profesional**: Diseño empresarial elegante
- ✅ **Funcional**: Todos los casos de uso cubiertos
- ✅ **Accessible**: Tooltips, contraste, navegación keyboard
- ✅ **Responsive**: Adaptable a todos los dispositivos
- ✅ **Spectacular**: Siguiendo 100% el design system

**Mantener este diseño como referencia para futuros modales de visualización.**

---

## 🏗️ Estructura del Modal

### **1. Header Empresarial Avanzado**
```jsx
// ✅ Layout del Header
<DialogTitle sx={{ p: 3, pb: 2 }}>
  <Box display="flex" justifyContent="space-between" alignItems="center">
    {/* Sección Izquierda - Información */}
    <Box display="flex" alignItems="center" gap={2.5}>
      <Avatar> {/* Icono animado */}
      <Box> {/* Título + Subtítulo + Metadata */}
    </Box>
    
    {/* Sección Derecha - Controles */}
    <Box display="flex" gap={1}>
      {/* Botones de acción con tooltips */}
    </Box>
  </Box>
</DialogTitle>
```

#### **Información del Documento**
- **Título principal**: "Visualizar Comprobante"
- **Subtítulo**: Tipo de documento y contexto
- **Metadata**: Tamaño del archivo, fecha de subida
- **Avatar animado**: Con gradiente spectacular

#### **Controles Avanzados**
- **Zoom In/Out**: Botones para ampliar/reducir
- **Rotación**: Rotar documento 90° izq/der
- **Pantalla completa**: Toggle fullscreen
- **Descargar**: Descarga directa del archivo
- **Abrir en nueva pestaña**: Link externo
- **Cerrar**: Con animación de salida

### **2. Content Area - Visor Inteligente**
```jsx
<DialogContent sx={{ p: 3, pt: 3 }}>
  <Paper sx={{ 
    height: '70vh',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative'
  }}>
    {/* Toolbar de navegación */}
    <Box sx={{ p: 2, borderBottom: '1px solid divider' }}>
      {/* Controles de página, zoom, etc. */}
    </Box>
    
    {/* Área de visualización */}
    <Box sx={{ flex: 1, position: 'relative' }}>
      {/* Loading state, Error state, o Content */}
    </Box>
  </Paper>
</DialogContent>
```

### **3. Footer con Información**
```jsx
<DialogActions sx={{ p: 3, pt: 2 }}>
  <Box display="flex" justifyContent="space-between" width="100%">
    {/* Info del archivo */}
    <Box>
      <Typography variant="caption">
        {fileName} • {fileSize} • {uploadDate}
      </Typography>
    </Box>
    
    {/* Acciones principales */}
    <Box display="flex" gap={1}>
      <Button variant="outlined">Reemplazar</Button>
      <Button variant="contained">Descargar</Button>
    </Box>
  </Box>
</DialogActions>
```

---

## 🎨 Elementos Spectacular

### **1. Estados de Carga Elegantes**
```jsx
// Loading con shimmer effect
<Box sx={{ 
  display: 'flex', 
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  py: 8
}}>
  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
    <CircularProgress size={48} />
  </motion.div>
  <Typography sx={{ mt: 2 }}>Cargando documento...</Typography>
  <LinearProgress sx={{ width: 200, mt: 2 }} />
</Box>
```

### **2. Estados de Error Informativos**
```jsx
<Alert severity="error" sx={{ m: 3 }}>
  <AlertTitle>Error al cargar documento</AlertTitle>
  No se pudo cargar el archivo. 
  <Button size="small" onClick={retry}>Reintentar</Button>
</Alert>
```

### **3. Toolbar de Navegación PDF**
```jsx
<Box sx={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: 1,
  p: 1.5,
  background: alpha(theme.palette.background.paper, 0.95),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
}}>
  {/* Navegación de páginas */}
  <IconButton size="small"><NavigateBefore /></IconButton>
  <Typography variant="body2">Página {currentPage} de {totalPages}</Typography>
  <IconButton size="small"><NavigateNext /></IconButton>
  
  <Divider orientation="vertical" sx={{ mx: 1, height: 24 }} />
  
  {/* Controles de zoom */}
  <IconButton size="small"><ZoomOut /></IconButton>
  <Typography variant="body2">{zoomLevel}%</Typography>
  <IconButton size="small"><ZoomIn /></IconButton>
  
  <Divider orientation="vertical" sx={{ mx: 1, height: 24 }} />
  
  {/* Herramientas */}
  <IconButton size="small"><RotateLeft /></IconButton>
  <IconButton size="small"><RotateRight /></IconButton>
  <IconButton size="small"><FitScreen /></IconButton>
</Box>
```

---

## 🔧 Funcionalidades Avanzadas

### **1. Gestor de Estado del Visor**
```jsx
const [viewerState, setViewerState] = useState({
  loading: true,
  error: null,
  currentPage: 1,
  totalPages: 1,
  zoomLevel: 100,
  rotation: 0,
  fitMode: 'width' // 'width', 'height', 'page'
});
```

### **2. Controles de Zoom Inteligentes**
- **Zoom In/Out**: Incrementos de 25%
- **Fit to Width**: Ajustar al ancho del contenedor
- **Fit to Page**: Mostrar página completa
- **Zoom real**: 100% tamaño original

### **3. Navegación de Páginas (Solo PDF)**
- **Primera página**: Botón directo
- **Página anterior/siguiente**: Con atajos de teclado
- **Última página**: Salto directo
- **Input directo**: Ir a página específica

### **4. Rotación de Documento**
- **Rotar 90° izquierda**: Contrahorario
- **Rotar 90° derecha**: Horario
- **Resetear rotación**: Volver a 0°

---

## 🎯 Tipos de Archivo Soportados

### **1. PDFs**
```jsx
{fileType === 'pdf' && (
  <iframe
    src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=${zoomLevel}`}
    style={{ width: '100%', height: '100%', border: 'none' }}
  />
)}
```

### **2. Imágenes**
```jsx
{fileType === 'image' && (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    height: '100%',
    overflow: 'auto'
  }}>
    <img 
      src={fileUrl}
      alt="Documento"
      style={{
        maxWidth: `${zoomLevel}%`,
        transform: `rotate(${rotation}deg)`,
        transition: 'all 0.3s ease'
      }}
    />
  </Box>
)}
```

### **3. Otros Documentos**
```jsx
{fileType === 'other' && (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6">Vista previa no disponible</Typography>
    <Button 
      variant="contained" 
      startIcon={<Download />}
      onClick={downloadFile}
      sx={{ mt: 2 }}
    >
      Descargar para ver
    </Button>
  </Box>
)}
```

---

## 🚀 Animaciones Spectacular

### **1. Entrada del Modal**
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: 20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
```

### **2. Transiciones de Zoom**
```jsx
const handleZoom = (newZoom) => {
  setViewerState(prev => ({ ...prev, zoomLevel: newZoom }));
  // Animación suave del contenido
};
```

### **3. Rotación Suave**
```jsx
style={{
  transform: `rotate(${rotation}deg)`,
  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
}}
```

---

## 📱 Responsive Design

### **Mobile (xs-sm)**
- **Header compacto**: Solo iconos esenciales
- **Toolbar simplificado**: Menos controles
- **Gestos touch**: Pinch to zoom, swipe navegación

### **Tablet (md)**
- **Layout optimizado**: Balance entre funcionalidad y espacio
- **Controles tactiles**: Botones más grandes

### **Desktop (lg-xl)**
- **Funcionalidad completa**: Todos los controles disponibles
- **Atajos de teclado**: Para navegación rápida
- **Multi-monitor**: Soporte para pantallas grandes

---

## 🔒 Seguridad y Performance

### **1. Carga Progresiva**
- **Lazy loading**: Solo cargar cuando sea visible
- **Caché inteligente**: Evitar recargas innecesarias
- **Fallbacks**: Múltiples métodos de visualización

### **2. Validación de Archivos**
- **Tipo MIME**: Verificación del formato
- **Tamaño máximo**: Límites de carga
- **Sanitización**: URLs seguras

### **3. Optimización**
- **Memorización**: useCallback para funciones
- **Debounce**: En controles de zoom
- **Cleanup**: Limpiar recursos al cerrar

---

## ✅ Checklist de Implementación

- [ ] **Header con metadata del archivo**
- [ ] **Toolbar de navegación completo**
- [ ] **Estados de carga y error elegantes**
- [ ] **Zoom in/out funcional**
- [ ] **Rotación de documento**
- [ ] **Navegación de páginas (PDF)**
- [ ] **Modo pantalla completa**
- [ ] **Descarga directa**
- [ ] **Responsive design**
- [ ] **Animaciones spectacular**
- [ ] **Atajos de teclado**
- [ ] **Gestos touch (mobile)**
- [ ] **Caché y optimización**
- [ ] **Validación de seguridad**
- [ ] **Testing completo**

---

## 🎯 PROMPT ESPECÍFICO PARA IMPLEMENTACIÓN

```
📋 IMPLEMENTAR MODAL VISOR PDF AVANZADO - USAR COMO REFERENCIA EXACTA

ARCHIVO DE REFERENCIA OBLIGATORIO:
└── src/components/commitments/CommitmentsList.jsx
    ├── Líneas 3230-3620: Modal PDF Viewer completo con panel información
    ├── Líneas 930-1110: Función getDocumentInfo con Firebase getMetadata
    ├── Líneas 1150-1170: Función handleToggleDocumentInfo con ajuste altura
    ├── Líneas 1180-1220: Función formatDocumentType con conversión MIME
    └── Estados: documentInfo, documentInfoOpen, documentDimensions

⚠️ ESTE ES EL VISOR PDF DE REFERENCIA DEFINITIVO ⚠️

CARACTERÍSTICAS OBLIGATORIAS A IMPLEMENTAR:
✅ Panel información expandible con metadatos Firebase Storage
✅ Integración getMetadata() para datos reales (tamaño, fechas, tipo MIME)
✅ Ajuste dinámico altura modal según panel abierto/cerrado
✅ CSS Grid layout responsivo con auto-fit
✅ Formateo inteligente MIME types → nombres amigables
✅ Scroll interno panel con maxHeight: 50vh
✅ DialogContent con altura dinámica según estado panel
✅ Avatar con gradientes spectacular y animaciones
✅ Botones con micro-interacciones (scale 1.05 hover)
✅ Información técnica completa: bucket, rutas, última modificación
✅ Estados de carga y error con fallback inteligente

IMPORTS OBLIGATORIOS:
import { getMetadata } from 'firebase/storage';
import { Info, FolderOpen, InsertDriveFile, Schedule, GetApp } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

FUNCIONES MÍNIMAS REQUERIDAS:
1. getDocumentInfo(commitment, url) → Firebase getMetadata + fallback
2. formatDocumentType(mimeType) → MIME a texto amigable
3. handleToggleDocumentInfo() → ajuste altura modal dinámico
4. formatFileSize(bytes, isEstimated) → formato con indicador estimación

ESTADOS OBLIGATORIOS:
const [documentInfo, setDocumentInfo] = useState(null);
const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
const [documentDimensions, setDocumentDimensions] = useState({ width: 'xl', height: '90vh' });

ESTRUCTURA MODAL EXACTA:
└── Dialog (con dimensiones dinámicas)
    ├── DialogTitle (header con avatar + botón info)
    ├── motion.div (panel información expandible)
    │   └── Box (scroll interno + grid responsivo)
    └── DialogContent (altura dinámica según panel)

ESTE ES EL ESTÁNDAR DORADO - NO CREAR VERSIONES SIMPLIFICADAS
REVISAR CommitmentsList.jsx LÍNEAS 3230-3620 COMO REFERENCIA ABSOLUTA
```

---

## 🔍 REFERENCIA CÓDIGO EXACTO

**REVISAR ESTE ARCHIVO COMO EJEMPLO PRINCIPAL:**
- **Archivo:** `src/components/commitments/CommitmentsList.jsx`
- **Sección:** Líneas 3230-3620 (Modal PDF Viewer completo)
- **Funciones:** Líneas 930-1220 (getDocumentInfo, formatDocumentType, toggles)
- **Estado:** Agosto 28, 2025 - Versión con panel información avanzado

### 🎯 **Elementos Específicos a Copiar:**

#### **1. Panel Información Expandible (Líneas 3400-3580)**
```jsx
{documentInfo && documentInfoOpen && (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    style={{ overflow: 'hidden' }}
  >
    <Box sx={{
      px: 3, py: 2,
      background: alpha(theme.palette.info.main, 0.04),
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
      maxHeight: '50vh',
      overflowY: 'auto',
      minHeight: 'auto'
    }}>
      {/* Grid responsivo con 4 elementos principales */}
    </Box>
  </motion.div>
)}
```

#### **2. Función getDocumentInfo Avanzada (Líneas 930-1050)**
```jsx
const getDocumentInfo = async (commitment, url) => {
  // 1. Buscar en attachments
  // 2. Firebase getMetadata para datos reales
  // 3. Fallback a extractInfoFromUrl
  // COPIAR IMPLEMENTACIÓN COMPLETA
};
```

#### **3. Ajuste Dinámico Altura (Líneas 1150-1170)**
```jsx
const handleToggleDocumentInfo = () => {
  const willOpen = !documentInfoOpen;
  setDocumentInfoOpen(willOpen);
  
  if (willOpen) {
    setDocumentDimensions(prev => ({
      ...prev,
      height: 'calc(100vh - 50px)'
    }));
  } else {
    setDocumentDimensions(prev => ({
      ...prev,
      height: '90vh'
    }));
  }
};
```

#### **4. Formateo MIME Types (Líneas 1180-1220)**
```jsx
const formatDocumentType = (type) => {
  const mimeToFriendly = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    // ... COPIAR OBJETO COMPLETO
  };
  // COPIAR LÓGICA COMPLETA
};
```

---

## ⚠️ INSTRUCCIONES CRÍTICAS

### **📋 ANTES DE IMPLEMENTAR:**
1. **ABRIR:** `src/components/commitments/CommitmentsList.jsx`
2. **REVISAR:** Líneas 3230-3620 (Modal completo)
3. **ESTUDIAR:** Funciones getDocumentInfo, formatDocumentType, handleToggleDocumentInfo
4. **COPIAR:** Estados documentInfo, documentInfoOpen, documentDimensions
5. **ADAPTAR:** A tu contexto específico manteniendo funcionalidad

### **🚫 NO HACER:**
- ❌ Crear versiones simplificadas sin panel información
- ❌ Omitir integración Firebase getMetadata
- ❌ Usar altura fija sin ajuste dinámico
- ❌ Implementar sin CSS Grid responsivo
- ❌ Formatear tipos MIME manualmente

### **✅ SÍ HACER:**
- ✅ Copiar estructura completa del modal
- ✅ Mantener todas las funciones auxiliares
- ✅ Usar mismos estados y dimensiones dinámicas
- ✅ Integrar Firebase getMetadata real
- ✅ Implementar panel información expandible

---

**🎯 ESTE VISOR PDF ES LA REFERENCIA ABSOLUTA PARA TODA LA APLICACIÓN**

*Implementación de referencia completada - DR Group Dashboard - Agosto 2025*
