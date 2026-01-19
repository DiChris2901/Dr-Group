# 📱 SISTEMA DE VISOR DE BACKUPS DE WHATSAPP

## 🎯 OBJETIVO DEL PROYECTO

Crear una herramienta de **consulta y visualización** de conversaciones históricas de WhatsApp exportadas como backups, integrada al Dashboard Web de DR Group. 

**Características principales:**
- ✅ **Solo lectura** (no es un sistema de chat activo)
- ✅ **Importación de backups** semanales/mensuales
- ✅ **Visualización tipo WhatsApp** (burbujas, timeline)
- ✅ **Búsqueda y filtros avanzados**
- ✅ **Soporte multimedia** (imágenes, audios, PDFs, contactos)
- ✅ **Fusión incremental** de backups sin duplicados

---

## 📊 CONTEXTO DEL NEGOCIO

### **Problema a Resolver:**
- Todo el negocio se maneja por WhatsApp con clientes
- Necesidad de consultar conversaciones históricas
- Backups de WhatsApp ocupan espacio en el dispositivo
- No hay forma de buscar/filtrar eficientemente en backups

### **Solución Propuesta:**
Sistema web que permita:
1. Subir backups exportados de WhatsApp (ZIP con TXT + multimedia)
2. Visualizar conversaciones como si fuera WhatsApp
3. Buscar mensajes por texto, fecha, tipo de archivo
4. Actualizar histórico con importaciones semanales
5. Liberar espacio del celular manteniendo histórico accesible

---

## 🏗️ ARQUITECTURA TÉCNICA

### **OPCIÓN A: IMPLEMENTACIÓN CON FIRESTORE (MVP Rápido)**

#### **Stack Tecnológico:**
```
Frontend (Dashboard Web):
├── React 18 + Vite
├── Material-UI (diseño sobrio existente)
├── Firebase Firestore (base de datos)
├── Firebase Storage (archivos multimedia)
└── Firebase Auth (autenticación compartida)

Backend:
├── Cloud Functions (opcional - para procesamiento pesado)
└── Reglas de seguridad Firestore
```

#### **Estructura Firestore:**
```javascript
// Collection: conversaciones
conversaciones/{clienteId}/
├── nombre: "Juan Pérez"
├── telefono: "+573001234567"
├── empresa: "DR Group"
├── ultimoMensaje: "Hola, ¿cómo estás?"
├── ultimaFecha: Timestamp
├── totalMensajes: 5000
├── createdAt: Timestamp
└── updatedAt: Timestamp

// Collection: mensajes
mensajes/{clienteId}_{timestamp}_{hash}/
├── conversacionId: "clienteId"
├── fecha: Timestamp
├── autor: "Juan Pérez" | "Yo"
├── texto: "Mensaje de texto..."
├── tipoAdjunto: "imagen" | "audio" | "pdf" | "vcf" | null
├── nombreArchivo: "IMG-20260112-WA0001.jpg"
├── rutaArchivo: "chats/{clienteId}/IMG-20260112-WA0001.jpg"
└── hash: "md5(timestamp+autor+texto)" // Para evitar duplicados
```

#### **Storage Firebase:**
```
storage/
└── chats/
    └── {clienteId}/
        ├── IMG-20260112-WA0001.jpg
        ├── PTT-20260112-WA0001.opus
        ├── DOC-20260112-WA0001.pdf
        └── VCF-20260112-WA0001.vcf
```

#### **Costos Estimados (Firestore):**
```
Escenario Conservador:
- 50 conversaciones
- 5,000 mensajes por conversación (250,000 total)
- 50 mensajes mostrados por carga (paginación)
- 10 consultas/día por usuario
- 3 GB multimedia total

Firestore Lecturas:     10 usuarios × 10 consultas × 50 mensajes × 30 días = 150,000 lecturas/mes → $0.45 USD/mes
Firestore Escrituras:   5,000 mensajes × 4 semanas (importaciones) = 20,000 escrituras/mes → $0.60 USD/mes
Storage:                3 GB → $0.078 USD/mes
Descargas:              10 GB/mes → $1.20 USD/mes

TOTAL: ~$2.35 USD/mes
```

#### **Ventajas Firestore:**
- ✅ Setup inmediato (3-4 días)
- ✅ Sin servidor adicional que mantener
- ✅ Escalabilidad automática
- ✅ Integración nativa con dashboard
- ✅ Real-time opcional (listeners)
- ✅ Backup automático de Google

#### **Desventajas Firestore:**
- ⚠️ Costos pueden crecer con escala
- ⚠️ Límites de lecturas/escrituras
- ⚠️ Storage facturado por descarga
- ⚠️ Requiere optimización estricta (paginación)

---

### **OPCIÓN B: IMPLEMENTACIÓN CON XAMPP + SQLITE (Control Total)**

#### **Stack Tecnológico:**
```
Frontend (Dashboard Web):
├── React 18 + Vite
├── Material-UI (diseño sobrio existente)
├── Firebase Auth (autenticación compartida)
└── Axios (consumir API REST)

Backend (Servidor Remoto):
├── XAMPP (Apache + PHP 7.4+)
├── SQLite 3 (base de datos)
├── Storage local (archivos multimedia)
└── API REST (PHP endpoints)
```

#### **Estructura SQLite:**
```sql
-- Tabla: conversaciones
CREATE TABLE conversaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    empresa TEXT,
    ultimo_mensaje TEXT,
    ultima_fecha DATETIME,
    total_mensajes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: mensajes
CREATE TABLE mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversacion_id INTEGER NOT NULL,
    hash TEXT UNIQUE NOT NULL,
    fecha DATETIME NOT NULL,
    autor TEXT NOT NULL,
    texto TEXT,
    tipo_adjunto TEXT,
    nombre_archivo TEXT,
    ruta_archivo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id)
);

-- Índices para performance
CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id);
CREATE INDEX idx_mensajes_fecha ON mensajes(fecha);
CREATE INDEX idx_mensajes_hash ON mensajes(hash);
CREATE INDEX idx_conversaciones_cliente ON conversaciones(cliente_id);
```

#### **API REST Endpoints:**
```
GET  /api/get-conversations.php       → Lista de conversaciones (paginada)
GET  /api/get-messages.php            → Mensajes de una conversación (paginados)
GET  /api/search-messages.php         → Búsqueda global por texto
POST /api/import-backup.php           → Importar ZIP de WhatsApp
GET  /api/get-attachment.php          → Descargar archivo multimedia
GET  /api/get-statistics.php          → Estadísticas de conversación
```

#### **Estructura de Carpetas (Servidor):**
```
/var/www/html/chat-viewer-api/  (Linux)
O
C:\xampp\htdocs\chat-viewer-api\  (Windows Server)

chat-viewer-api/
├── api/
│   ├── get-conversations.php
│   ├── get-messages.php
│   ├── search-messages.php
│   ├── import-backup.php
│   └── get-attachment.php
├── config/
│   └── cors.php                    ← Configuración CORS
├── database/
│   ├── init.php                    ← Script creación BD
│   └── conversaciones.db           ← SQLite database
├── storage/
│   ├── temp/                       ← Uploads temporales
│   └── chats/
│       ├── cliente1/
│       │   ├── IMG-xxx.jpg
│       │   └── PTT-xxx.opus
│       └── cliente2/
└── .htaccess                       ← Configuración Apache
```

#### **Costos Estimados (XAMPP):**
```
Servidor XAMPP remoto:    $15 USD/mes (fijo)
Firebase Auth:            GRATIS (hasta 10k usuarios)
SQLite Database:          GRATIS (ilimitado)
Storage local:            Incluido en servidor
Ancho de banda:           Incluido en hosting

TOTAL: ~$15 USD/mes (fijo, no escala con uso)
```

#### **Ventajas XAMPP:**
- ✅ Costos fijos ($15/mes)
- ✅ Sin límites de lecturas/escrituras
- ✅ Sin límites de storage
- ✅ Performance local excelente
- ✅ Control total de datos
- ✅ Escalable a MySQL fácilmente

#### **Desventajas XAMPP:**
- ⚠️ Setup inicial (1-2 semanas)
- ⚠️ Requiere mantener servidor
- ⚠️ Backups manuales
- ⚠️ Requiere conocimientos PHP (básicos)

---

## 📋 COMPARATIVA: FIRESTORE VS XAMPP

| Aspecto | Firestore (MVP) | XAMPP (Control) |
|---------|----------------|-----------------|
| **Tiempo de setup** | 3-4 días | 1-2 semanas |
| **Costo mensual** | $2-5 USD (escala) | $15 USD (fijo) |
| **Experiencia requerida** | React (ya tienes) | React + PHP básico |
| **Escalabilidad** | Automática | Manual (pero previsible) |
| **Límites** | 50k lecturas gratis/día | Sin límites |
| **Backup** | Automático | Manual |
| **Velocidad** | Excelente | Excelente (local) |
| **Migración futura** | Difícil | Fácil (SQL estándar) |

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### **FASE 1: MVP CON FIRESTORE (RECOMENDADO INICIAR AQUÍ)**

#### **Semana 1: Backend Firestore**
- [ ] Crear collections `conversaciones` y `mensajes`
- [ ] Configurar reglas de seguridad
- [ ] Implementar estructura de Storage
- [ ] Crear índices compuestos

#### **Semana 2: Parser de WhatsApp**
- [ ] Crear hook `useWhatsAppParser`
- [ ] Implementar RegEx para TXT de Android
- [ ] Detectar adjuntos (IMG, PTT, DOC, VCF)
- [ ] Crear lógica de deduplicación (hashing)

#### **Semana 3: Frontend - Importación**
- [ ] Página `/chat-viewer`
- [ ] Componente `ChatImporter` (upload ZIP)
- [ ] Barra de progreso de importación
- [ ] Componente `ConversationList`

#### **Semana 4: Frontend - Visualización**
- [ ] Componente `ChatTimeline` (burbujas)
- [ ] Scroll infinito con paginación
- [ ] Lazy loading de multimedia
- [ ] Visor de imágenes (lightbox)
- [ ] Reproductor de audio (.opus)

#### **Semana 5: Búsqueda y Filtros**
- [ ] Búsqueda global en conversación
- [ ] Filtros (solo audios, solo imágenes, solo docs)
- [ ] Rango de fechas (desde - hasta)
- [ ] Highlight de términos buscados

#### **Semana 6: Features Avanzadas**
- [ ] Exportar conversación a PDF
- [ ] Estadísticas (total audios, imágenes, duración)
- [ ] Agregar permiso `chat_viewer` al sistema
- [ ] Testing completo

**Tiempo Total: 6 semanas (MVP funcional)**

---

### **FASE 2: MIGRACIÓN A XAMPP (SI ES NECESARIO)**

Solo migrar si:
- Costos de Firestore superan $10 USD/mes
- Más de 100 conversaciones activas
- Más de 10 GB de multimedia
- Necesitas control total de datos

#### **Semana 1: Setup Servidor**
- [ ] Configurar XAMPP en servidor remoto
- [ ] Crear estructura de carpetas
- [ ] Ejecutar `init.php` para crear BD SQLite
- [ ] Configurar CORS y .htaccess

#### **Semana 2: API REST (PHP)**
- [ ] Implementar `get-conversations.php`
- [ ] Implementar `get-messages.php`
- [ ] Implementar `search-messages.php`
- [ ] Implementar `import-backup.php`
- [ ] Implementar `get-attachment.php`

#### **Semana 3: Migración de Datos**
- [ ] Script de exportación desde Firestore
- [ ] Script de importación a SQLite
- [ ] Migración de multimedia a Storage local
- [ ] Validación de integridad de datos

#### **Semana 4: Adaptación Frontend**
- [ ] Crear hook `useChatViewerAPI` (REST)
- [ ] Adaptar componentes existentes
- [ ] Testing de integración
- [ ] Rollout gradual

**Tiempo Total: 4 semanas (migración completa)**

---

## 💻 ESTRUCTURA DE CÓDIGO PROPUESTA

### **Frontend (React + MUI)**

#### **Hooks Principales:**

```javascript
// src/hooks/useWhatsAppParser.js
export function useWhatsAppParser() {
  const parseWhatsAppTXT = (txtContent) => {
    // RegEx para formato Android:
    // [18/01/2026, 14:35:42] Juan Pérez: Mensaje...
    const messageRegex = /\[(\d{2}\/\d{2}\/\d{4}),\s(\d{2}:\d{2}:\d{2})\]\s(.+?):\s(.+)/g;
    
    const mensajes = [];
    let match;
    
    while ((match = messageRegex.exec(txtContent)) !== null) {
      const [, fecha, hora, autor, texto] = match;
      
      // Detectar adjuntos
      let tipoAdjunto = null;
      let nombreArchivo = null;
      
      if (texto.includes('IMG-')) {
        tipoAdjunto = 'imagen';
        nombreArchivo = texto.match(/IMG-[\w-]+\.(jpg|jpeg|png)/)?.[0];
      } else if (texto.includes('PTT-')) {
        tipoAdjunto = 'audio';
        nombreArchivo = texto.match(/PTT-[\w-]+\.opus/)?.[0];
      } else if (texto.includes('DOC-')) {
        tipoAdjunto = 'documento';
        nombreArchivo = texto.match(/DOC-[\w-]+\.(pdf|doc|docx)/)?.[0];
      } else if (texto.includes('.vcf')) {
        tipoAdjunto = 'contacto';
        nombreArchivo = texto.match(/[\w-]+\.vcf/)?.[0];
      }
      
      mensajes.push({
        fecha: new Date(`${fecha} ${hora}`),
        autor,
        texto: nombreArchivo ? texto.replace(nombreArchivo, '').trim() : texto,
        tipoAdjunto,
        nombreArchivo,
        hash: md5(`${fecha}${hora}${autor}${texto}`)
      });
    }
    
    return mensajes;
  };
  
  return { parseWhatsAppTXT };
}
```

```javascript
// src/hooks/useChatViewer.js (Firestore)
export function useChatViewer(conversacionId) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  
  const loadMessages = async (reset = false) => {
    setLoading(true);
    
    try {
      let q = query(
        collection(db, 'mensajes'),
        where('conversacionId', '==', conversacionId),
        orderBy('fecha', 'desc'),
        limit(50)
      );
      
      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      
      const newMensajes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (reset) {
        setMensajes(newMensajes);
      } else {
        setMensajes(prev => [...prev, ...newMensajes]);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 50);
      
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { mensajes, loading, hasMore, loadMessages };
}
```

#### **Componentes Principales:**

```javascript
// src/components/chat-viewer/ChatTimeline.jsx
export default function ChatTimeline({ conversacion }) {
  const { mensajes, loading, hasMore, loadMessages } = useChatViewer(conversacion.id);
  
  useEffect(() => {
    loadMessages(true); // Reset al cambiar conversación
  }, [conversacion.id]);
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
      <InfiniteScroll
        dataLength={mensajes.length}
        next={loadMessages}
        hasMore={hasMore}
        loader={<CircularProgress />}
        scrollableTarget="scrollableDiv"
        inverse={true}
      >
        {mensajes.map(mensaje => (
          <MessageBubble key={mensaje.id} mensaje={mensaje} />
        ))}
      </InfiniteScroll>
    </Box>
  );
}

function MessageBubble({ mensaje }) {
  const isOwn = mensaje.autor === 'Yo';
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 1,
        px: 2
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          bgcolor: isOwn ? 'primary.main' : 'grey.100',
          color: isOwn ? 'white' : 'text.primary',
          borderRadius: 2,
          p: 1.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {/* Adjunto multimedia */}
        {mensaje.tipoAdjunto && (
          <AttachmentPreview mensaje={mensaje} />
        )}
        
        {/* Texto del mensaje */}
        {mensaje.texto && (
          <Typography variant="body2">{mensaje.texto}</Typography>
        )}
        
        {/* Timestamp */}
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
          {format(mensaje.fecha, 'HH:mm')}
        </Typography>
      </Box>
    </Box>
  );
}
```

---

## 🛡️ SEGURIDAD Y VALIDACIONES

### **Reglas de Firestore:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Conversaciones: Solo lectura para usuarios autenticados
    match /conversaciones/{conversacionId} {
      allow read: if request.auth != null && 
                     request.auth.token.permissions.chat_viewer == true;
      allow write: if false; // Solo escritura desde Cloud Functions
    }
    
    // Mensajes: Solo lectura para usuarios autenticados
    match /mensajes/{mensajeId} {
      allow read: if request.auth != null && 
                     request.auth.token.permissions.chat_viewer == true;
      allow write: if false; // Solo escritura desde Cloud Functions
    }
  }
}
```

### **Reglas de Storage:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Archivos de chat: Solo lectura para usuarios autenticados
    match /chats/{clienteId}/{fileName} {
      allow read: if request.auth != null && 
                     request.auth.token.permissions.chat_viewer == true;
      allow write: if false; // Solo escritura desde Cloud Functions
    }
  }
}
```

### **Validaciones en Importación:**

```javascript
// Validar estructura del ZIP
const validateBackupZIP = (zip) => {
  const files = Object.keys(zip.files);
  
  // Debe contener al menos un .txt
  const hasTXT = files.some(f => f.endsWith('.txt'));
  if (!hasTXT) {
    throw new Error('ZIP no contiene archivo .txt de WhatsApp');
  }
  
  // Validar formatos de archivos permitidos
  const allowedExtensions = ['.txt', '.jpg', '.jpeg', '.png', '.opus', '.mp3', '.pdf', '.doc', '.docx', '.vcf'];
  const invalidFiles = files.filter(f => {
    const ext = f.substring(f.lastIndexOf('.'));
    return !allowedExtensions.includes(ext);
  });
  
  if (invalidFiles.length > 0) {
    console.warn('Archivos no soportados:', invalidFiles);
  }
  
  return true;
};

// Validar tamaño de backup
const MAX_BACKUP_SIZE = 500 * 1024 * 1024; // 500 MB

const validateBackupSize = (file) => {
  if (file.size > MAX_BACKUP_SIZE) {
    throw new Error(`Backup demasiado grande (máximo 500 MB). Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  }
};
```

---

## 📱 FORMATO DE BACKUPS DE WHATSAPP (ANDROID)

### **Formato del TXT:**

```
18/01/2026, 14:35:42 - Juan Pérez: Hola, ¿cómo estás?
18/01/2026, 14:36:15 - Yo: Bien, gracias. ¿Y tú?
18/01/2026, 14:37:03 - Juan Pérez: IMG-20260118-WA0001.jpg (archivo adjunto)
18/01/2026, 14:38:22 - Yo: PTT-20260118-WA0001.opus (archivo adjunto)
18/01/2026, 14:39:45 - Juan Pérez: Necesito el reporte de esta semana
18/01/2026, 15:10:30 - Juan Pérez: DOC-20260118-WA0001.pdf (archivo adjunto)
```

### **RegEx para Parsing:**

```javascript
// Formato: [dd/mm/yyyy, HH:MM:SS] Autor: Mensaje
const messageRegex = /\[?(\d{2}\/\d{2}\/\d{4}),?\s(\d{2}:\d{2}:\d{2})\]?\s-?\s?(.+?):\s(.+)/g;

// Detectar adjuntos
const imageRegex = /IMG-[\w-]+\.(jpg|jpeg|png|gif)/i;
const audioRegex = /PTT-[\w-]+\.(opus|mp3|ogg)/i;
const documentRegex = /DOC-[\w-]+\.(pdf|doc|docx|xls|xlsx)/i;
const contactRegex = /[\w-]+\.vcf/i;
```

---

## 🎯 FEATURES AVANZADAS (FASE 3 - OPCIONAL)

### **1. Exportación a PDF:**
```javascript
// Generar PDF de conversación completa
const exportConversationToPDF = async (conversacion, mensajes) => {
  const doc = new jsPDF();
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Conversación con ${conversacion.nombre}`, 20, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Teléfono: ${conversacion.telefono}`, 20, 30);
  doc.text(`Total mensajes: ${conversacion.totalMensajes}`, 20, 35);
  
  // Agregar tabla de mensajes
  autoTable(doc, {
    startY: 45,
    head: [['Fecha', 'Autor', 'Mensaje']],
    body: mensajes.map(m => [
      format(m.fecha, 'dd/MM/yyyy HH:mm'),
      m.autor,
      m.texto || `[${m.tipoAdjunto}] ${m.nombreArchivo}`
    ])
  });
  
  doc.save(`conversacion_${conversacion.nombre}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
```

### **2. Estadísticas de Conversación:**
```javascript
const getConversationStats = (mensajes) => {
  return {
    totalMensajes: mensajes.length,
    mensajesPropios: mensajes.filter(m => m.autor === 'Yo').length,
    mensajesCliente: mensajes.filter(m => m.autor !== 'Yo').length,
    totalImagenes: mensajes.filter(m => m.tipoAdjunto === 'imagen').length,
    totalAudios: mensajes.filter(m => m.tipoAdjunto === 'audio').length,
    totalDocumentos: mensajes.filter(m => m.tipoAdjunto === 'documento').length,
    totalContactos: mensajes.filter(m => m.tipoAdjunto === 'contacto').length,
    primerMensaje: mensajes[mensajes.length - 1]?.fecha,
    ultimoMensaje: mensajes[0]?.fecha,
    duracionDias: Math.ceil((mensajes[0]?.fecha - mensajes[mensajes.length - 1]?.fecha) / (1000 * 60 * 60 * 24))
  };
};
```

### **3. Etiquetas y Favoritos:**
```javascript
// Agregar collection para etiquetas
etiquetas/{mensajeId}/
├── etiqueta: "importante" | "pendiente" | "resuelto" | "cotizacion"
├── color: "#ff9800"
├── createdBy: "userId"
└── createdAt: Timestamp

// Marcar mensajes como favoritos
favoritos/{userId}_{mensajeId}/
├── mensajeId: "ref"
├── conversacionId: "ref"
└── createdAt: Timestamp
```

---

## 📊 MÉTRICAS Y MONITOREO

### **KPIs del Sistema:**
- Total conversaciones importadas
- Total mensajes almacenados
- Total multimedia (GB)
- Consultas por día/usuario
- Tiempo promedio de búsqueda
- Tasa de uso del visor

### **Alertas de Costos (Firestore):**
```javascript
// Configurar alertas en Firebase Console
- Lecturas > 100k/día → Notificar
- Escrituras > 50k/día → Notificar
- Storage > 5 GB → Notificar
- Costos > $10 USD/mes → Evaluar migración a XAMPP
```

---

## ✅ CHECKLIST ANTES DE INICIAR

### **Pre-requisitos:**
- [ ] Dashboard Web funcionando en producción
- [ ] Firebase Auth configurado
- [ ] Permisos del sistema implementados
- [ ] Diseño sobrio establecido
- [ ] Componentes reutilizables disponibles

### **Decisión de Arquitectura:**
- [ ] Confirmar cantidad de conversaciones (<50 → Firestore, >100 → XAMPP)
- [ ] Confirmar tamaño de backups (<100 MB → Firestore, >500 MB → XAMPP)
- [ ] Confirmar presupuesto mensual aceptable
- [ ] Confirmar acceso a servidor XAMPP (si aplica)

### **Recursos Necesarios:**
- [ ] Backup real de WhatsApp (Android) para testing
- [ ] Fragmento del TXT (20-30 líneas) para validar parser
- [ ] Ejemplos de cada tipo de adjunto (imagen, audio, PDF, VCF)
- [ ] URL del servidor XAMPP (si aplica)

---

## 🎯 RECOMENDACIÓN FINAL

### **ESTRATEGIA RECOMENDADA:**

1. **INICIAR CON FIRESTORE (MVP - 6 semanas)**
   - Setup rápido (3-4 días)
   - Costo bajo inicial ($2-5 USD/mes)
   - Validar funcionalidad y adopción
   - Aprender sobre patrones de uso

2. **MONITOREAR DURANTE 2 MESES**
   - Métricas de uso real
   - Costos reales vs proyectados
   - Feedback de usuarios
   - Identificar puntos de optimización

3. **DECISIÓN DE MIGRACIÓN (SI ES NECESARIO)**
   - Si costos superan $10 USD/mes → Migrar a XAMPP
   - Si >100 conversaciones → Migrar a XAMPP
   - Si >10 GB multimedia → Migrar a XAMPP
   - Si necesitas control total → Migrar a XAMPP

### **Razones:**
- ✅ Validar viabilidad con inversión mínima
- ✅ Aprender sobre uso real antes de invertir en servidor
- ✅ Mantener flexibilidad para cambiar enfoque
- ✅ Reducir riesgo de sobre-ingeniería

---

## 📞 CONTACTO Y SOPORTE

**Documentos Relacionados:**
- `docs/DISENO_SOBRIO_NOTAS.md` - Sistema de diseño
- `docs/MODAL_DESIGN_SYSTEM.md` - Patrones de modales
- `docs/EXCEL_EXPORT_DESIGN_SYSTEM.md` - Exportación de datos

**Tecnologías Clave:**
- React 18 + Vite
- Material-UI v5
- Firebase (Firestore + Storage + Auth)
- ExcelJS (exportación)
- jsPDF (PDFs)

---

**Fecha de creación:** 19 de enero de 2026  
**Autor:** GitHub Copilot (Claude Sonnet 4.5)  
**Estado:** Planificación - Pendiente de implementación  
**Prioridad:** Media  

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Confirmar enfoque:** Firestore vs XAMPP
2. **Obtener backup de prueba:** TXT + multimedia
3. **Validar parser:** Probar con formato real de Android
4. **Iniciar Fase 1:** Setup backend (Firestore o XAMPP)
5. **Implementar MVP:** 6 semanas de desarrollo enfocado

**¿Listo para empezar? ¡Hagámoslo realidad! 🎯**
