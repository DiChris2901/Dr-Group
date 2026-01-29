# 📄 PDF Viewer Design - Ultra Modern

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Referencia:** Ultra Modern Design System + Modal Design

---

## 📋 Índice
1. [Arquitectura del Viewer](#arquitectura-del-viewer)
2. [Modal Container](#modal-container)
3. [Toolbar](#toolbar)
4. [Viewer Area](#viewer-area)
5. [Estados](#estados)
6. [Implementación](#implementación)
7. [Navegación y Controles](#navegación-y-controles)

---

## 🎯 Arquitectura del Viewer

### **Concepto:**

Un visor de PDF **elegante y funcional** que se siente como una aplicación nativa de macOS/Windows. Glassmorphism en toolbar, navegación fluida, y controles intuitivos.

### **Estructura de Capas:**

```
5. Floating toolbar (z-index: 10)
4. PDF canvas/iframe (z-index: 5)
3. Loading overlay (z-index: 8)
2. Modal container (z-index: 3)
1. Backdrop (z-index: 1)
```

---

## 📦 Modal Container

### **Especificaciones:**

```css
.pdf-viewer-modal {
  width: 1200px;
  max-width: 95vw;
  height: 90vh;
  background: rgba(15, 23, 42, 0.90);
  backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 24px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.6),
    0 0 100px rgba(14, 165, 233, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}
```

**Características:**
- **Tamaño:** XLarge (1200px) para visualización óptima
- **Altura:** 90vh para maximizar espacio
- **Blur:** Intenso (40px) para backdrop profesional
- **Layout:** Column flex para toolbar + viewer

---

## 🛠️ Toolbar

### **Header Toolbar (Top):**

```html
<div class="pdf-toolbar">
  <!-- Left Section: Info -->
  <div class="toolbar-section">
    <div class="pdf-icon">📄</div>
    <div class="pdf-info">
      <h3 class="pdf-title">Comprobante de Pago</h3>
      <p class="pdf-meta">2.4 MB • 3 páginas</p>
    </div>
  </div>

  <!-- Center Section: Navigation -->
  <div class="toolbar-section center">
    <button class="toolbar-button" title="Página anterior">
      <span class="material-icons">navigate_before</span>
    </button>
    <div class="page-indicator">
      <input type="number" class="page-input" value="1" min="1" max="3" />
      <span class="page-total">/ 3</span>
    </div>
    <button class="toolbar-button" title="Página siguiente">
      <span class="material-icons">navigate_next</span>
    </button>
  </div>

  <!-- Right Section: Actions -->
  <div class="toolbar-section">
    <button class="toolbar-button" title="Zoom -">
      <span class="material-icons">zoom_out</span>
    </button>
    <span class="zoom-level">100%</span>
    <button class="toolbar-button" title="Zoom +">
      <span class="material-icons">zoom_in</span>
    </button>
    <div class="toolbar-divider"></div>
    <button class="toolbar-button" title="Ajustar a ancho">
      <span class="material-icons">fit_screen</span>
    </button>
    <button class="toolbar-button" title="Pantalla completa">
      <span class="material-icons">fullscreen</span>
    </button>
    <div class="toolbar-divider"></div>
    <button class="toolbar-button" title="Descargar">
      <span class="material-icons">download</span>
    </button>
    <button class="toolbar-button" title="Imprimir">
      <span class="material-icons">print</span>
    </button>
    <button class="toolbar-button close" title="Cerrar">
      <span class="material-icons">close</span>
    </button>
  </div>
</div>
```

### **Estilos del Toolbar:**

```css
.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  gap: 16px;
}

/* Sections */
.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-section.center {
  flex: 1;
  justify-content: center;
}

/* PDF Icon */
.pdf-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* PDF Info */
.pdf-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pdf-title {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.pdf-meta {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* Toolbar Buttons */
.toolbar-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.toolbar-button:hover {
  background: rgba(14, 165, 233, 0.12);
  border-color: rgba(14, 165, 233, 0.3);
  color: #0ea5e9;
  transform: translateY(-1px);
}

.toolbar-button:active {
  transform: scale(0.95);
}

/* Close button específico */
.toolbar-button.close:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Page Indicator */
.page-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
}

.page-input {
  width: 50px;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  outline: none;
}

.page-input::-webkit-inner-spin-button,
.page-input::-webkit-outer-spin-button {
  opacity: 1;
}

.page-total {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* Zoom Level */
.zoom-level {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  min-width: 50px;
  text-align: center;
}

/* Divider */
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(148, 163, 184, 0.12);
  margin: 0 4px;
}
```

---

## 🖼️ Viewer Area

### **Estructura:**

```html
<div class="pdf-viewer-container">
  <!-- Canvas o iframe del PDF -->
  <div class="pdf-canvas-wrapper">
    <canvas id="pdf-canvas"></canvas>
    <!-- O alternativa con iframe -->
    <iframe src="pdf-url" class="pdf-iframe"></iframe>
  </div>

  <!-- Loading State -->
  <div class="pdf-loading">
    <div class="loading-spinner"></div>
    <p class="loading-text">Cargando documento...</p>
  </div>

  <!-- Error State -->
  <div class="pdf-error">
    <span class="material-icons error-icon">error_outline</span>
    <h3 class="error-title">Error al cargar PDF</h3>
    <p class="error-message">No se pudo cargar el documento</p>
    <button class="retry-button">Reintentar</button>
  </div>
</div>
```

### **Estilos del Viewer:**

```css
.pdf-viewer-container {
  flex: 1;
  position: relative;
  background: #0a0e27;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* Canvas Wrapper */
.pdf-canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#pdf-canvas {
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
}

/* Iframe alternativo */
.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* Custom Scrollbar */
.pdf-viewer-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.pdf-viewer-container::-webkit-scrollbar-track {
  background: transparent;
}

.pdf-viewer-container::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.pdf-viewer-container::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
  background-clip: padding-box;
}

.pdf-viewer-container::-webkit-scrollbar-corner {
  background: transparent;
}
```

---

## 🔄 Estados

### **1. Loading State:**

```css
.pdf-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: rgba(10, 14, 39, 0.95);
  backdrop-filter: blur(10px);
  z-index: 8;
}

/* Spinner */
.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(14, 165, 233, 0.2);
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #cbd5e1;
  margin: 0;
}
```

### **2. Error State:**

```css
.pdf-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(10, 14, 39, 0.95);
  backdrop-filter: blur(10px);
  z-index: 8;
  padding: 40px;
}

.error-icon {
  font-size: 64px;
  color: #ef4444;
  opacity: 0.8;
}

.error-title {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.error-message {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  text-align: center;
  max-width: 400px;
}

.retry-button {
  padding: 12px 28px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
  margin-top: 8px;
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(14, 165, 233, 0.5);
}
```

### **3. Empty State (No PDF):**

```css
.pdf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 60px 40px;
}

.empty-icon {
  font-size: 80px;
  opacity: 0.3;
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.empty-description {
  font-size: 14px;
  color: #64748b;
  text-align: center;
  max-width: 400px;
  margin: 0;
}
```

---

## 🎮 Navegación y Controles

### **Zoom Controls:**

```javascript
const zoomLevels = [50, 75, 100, 125, 150, 175, 200, 250, 300];
let currentZoomIndex = 2; // 100%

function zoomIn() {
  if (currentZoomIndex < zoomLevels.length - 1) {
    currentZoomIndex++;
    applyZoom(zoomLevels[currentZoomIndex]);
  }
}

function zoomOut() {
  if (currentZoomIndex > 0) {
    currentZoomIndex--;
    applyZoom(zoomLevels[currentZoomIndex]);
  }
}

function applyZoom(level) {
  const canvas = document.getElementById('pdf-canvas');
  canvas.style.transform = `scale(${level / 100})`;
  document.querySelector('.zoom-level').textContent = `${level}%`;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      zoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      currentZoomIndex = 2; // Reset to 100%
      applyZoom(100);
    }
  }
});
```

### **Page Navigation:**

```javascript
let currentPage = 1;
let totalPages = 1;

function goToPage(pageNum) {
  if (pageNum >= 1 && pageNum <= totalPages) {
    currentPage = pageNum;
    renderPage(currentPage);
    document.querySelector('.page-input').value = currentPage;
  }
}

function nextPage() {
  goToPage(currentPage + 1);
}

function previousPage() {
  goToPage(currentPage - 1);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    previousPage();
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    nextPage();
  }
});
```

### **Fit to Width/Height:**

```javascript
function fitToWidth() {
  const container = document.querySelector('.pdf-viewer-container');
  const canvas = document.getElementById('pdf-canvas');
  const containerWidth = container.clientWidth - 48; // padding
  const canvasWidth = canvas.naturalWidth;
  const scale = (containerWidth / canvasWidth) * 100;
  applyZoom(Math.round(scale));
}

function fitToHeight() {
  const container = document.querySelector('.pdf-viewer-container');
  const canvas = document.getElementById('pdf-canvas');
  const containerHeight = container.clientHeight - 48; // padding
  const canvasHeight = canvas.naturalHeight;
  const scale = (containerHeight / canvasHeight) * 100;
  applyZoom(Math.round(scale));
}

// Auto fit on window resize
window.addEventListener('resize', debounce(fitToWidth, 300));
```

### **Fullscreen Toggle:**

```javascript
function toggleFullscreen() {
  const modal = document.querySelector('.pdf-viewer-modal');
  
  if (!document.fullscreenElement) {
    modal.requestFullscreen().catch(err => {
      console.error('Error entering fullscreen:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  }
});
```

---

## 🧩 Implementación con React + PDF.js

### **UltraPDFViewer Component:**

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, alpha } from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Fullscreen,
  Download,
  Print,
  Close,
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const UltraPDFViewer = ({ pdfUrl, fileName, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    setError(error);
    setLoading(false);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const fitToWidth = () => {
    const containerWidth = containerRef.current?.clientWidth - 48;
    // Calcular scale basado en ancho estándar de PDF (595px)
    setScale(containerWidth / 595);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') setPageNumber(prev => Math.max(prev - 1, 1));
      if (e.key === 'ArrowRight') setPageNumber(prev => Math.min(prev + 1, numPages));
      if (e.ctrlKey && e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [numPages]);

  return (
    <Box
      sx={{
        width: 1200,
        maxWidth: '95vw',
        height: '90vh',
        background: alpha('#0f172a', 0.90),
        backdropFilter: 'blur(40px) saturate(200%)',
        border: `1px solid ${alpha('#94a3b8', 0.15)}`,
        borderRadius: '24px',
        boxShadow: `
          0 25px 50px -12px rgba(0, 0, 0, 0.6),
          0 0 100px rgba(14, 165, 233, 0.1)
        `,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: '16px 24px',
          background: alpha('#0f172a', 0.8),
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${alpha('#94a3b8', 0.08)}`,
          gap: 2,
        }}
      >
        {/* Left: Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            📄
          </Box>
          <Box>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
              {fileName}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
              {numPages} páginas
            </Typography>
          </Box>
        </Box>

        {/* Center: Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber === 1}
          >
            <NavigateBefore />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 1,
              background: alpha('#0f172a', 0.6),
              border: `1px solid ${alpha('#94a3b8', 0.12)}`,
              borderRadius: '10px',
            }}
          >
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value);
                if (num >= 1 && num <= numPages) setPageNumber(num);
              }}
              style={{
                width: 50,
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <Typography sx={{ fontSize: 14, color: '#64748b' }}>
              / {numPages}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
            disabled={pageNumber === numPages}
          >
            <NavigateNext />
          </IconButton>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={zoomOut}>
            <ZoomOut />
          </IconButton>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', minWidth: 50, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton size="small" onClick={zoomIn}>
            <ZoomIn />
          </IconButton>
          <Box sx={{ width: 1, height: 24, background: alpha('#94a3b8', 0.12), mx: 0.5 }} />
          <IconButton size="small" onClick={fitToWidth}>
            <FitScreen />
          </IconButton>
          <IconButton size="small" onClick={() => {}}>
            <Fullscreen />
          </IconButton>
          <Box sx={{ width: 1, height: 24, background: alpha('#94a3b8', 0.12), mx: 0.5 }} />
          <IconButton size="small" onClick={() => window.open(pdfUrl, '_blank')}>
            <Download />
          </IconButton>
          <IconButton size="small" onClick={() => window.print()}>
            <Print />
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      {/* Viewer Area */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          background: '#0a0e27',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        {loading && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography>Cargando documento...</Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography color="error">Error al cargar el PDF</Typography>
          </Box>
        )}
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </Box>
    </Box>
  );
};

export default UltraPDFViewer;
```

---

## ♿ Accesibilidad

- **Keyboard Navigation:** Arrow keys, +/-, Page Up/Down
- **Focus Trap:** Mantener foco dentro del modal
- **ARIA Labels:** Descriptivos para todos los botones
- **Alt Text:** Para estado de carga y errores

---

## 📱 Responsive

```css
@media (max-width: 1024px) {
  .pdf-viewer-modal {
    width: 95vw;
  }
  
  .toolbar-section.center {
    order: 3;
    flex-basis: 100%;
  }
}

@media (max-width: 768px) {
  .pdf-toolbar {
    flex-wrap: wrap;
    padding: 12px 16px;
  }
  
  .pdf-info {
    display: none; /* Ocultar detalles en móvil */
  }
  
  .zoom-level {
    display: none;
  }
}
```

---

**Versión:** 1.0.0  
**Librerías Recomendadas:** react-pdf, pdf.js  
**Referencia:** Ultra Modern Design System, Modal Design
