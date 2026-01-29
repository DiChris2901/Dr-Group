# 🪟 Modal Design System - Ultra Modern

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Referencia:** Ultra Modern Design System

---

## 📋 Índice
1. [Arquitectura de Modales](#arquitectura-de-modales)
2. [Backdrop](#backdrop)
3. [Modal Container](#modal-container)
4. [Header](#header)
5. [Body](#body)
6. [Footer](#footer)
7. [Tipos de Modales](#tipos-de-modales)
8. [Animaciones](#animaciones)
9. [Implementación MUI](#implementación-mui)

---

## 🎯 Arquitectura de Modales

### **Principio de Diseño:**

Los modales deben sentirse como **ventanas flotantes** en un espacio 3D, no como overlays planos. Glassmorphism extremo con profundidad clara.

### **Capas (z-index):**

```
5. Close button (z-index: 1)
4. Modal content (z-index: 3)
3. Modal container (z-index: 2)
2. Backdrop (z-index: 1)
1. Background page (z-index: 0)
```

---

## 🌫️ Backdrop

### **Especificaciones Técnicas:**

```css
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 14, 39, 0.85);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
```

**Características:**
- **Blur:** 12px (suficiente para contexto pero legible)
- **Saturación:** 120% (mantiene viveza de colores)
- **Opacidad:** 0.85 (85% oscuro)
- **Click to close:** Al hacer clic en el backdrop (no en el modal)

### **Estados:**

**Default:**
```css
opacity: 0;
transition: opacity 0.3s ease;
```

**Open:**
```css
opacity: 1;
```

**Close:**
```css
opacity: 0;
transition: opacity 0.2s ease;
```

---

## 📦 Modal Container

### **Tamaños Predefinidos:**

```css
/* Small - Confirmaciones simples */
.modal-container.small {
  width: 400px;
  max-width: 95vw;
}

/* Medium - CRUD forms estándar */
.modal-container.medium {
  width: 600px;
  max-width: 95vw;
}

/* Large - Forms complejos, vistas detalladas */
.modal-container.large {
  width: 800px;
  max-width: 95vw;
}

/* XLarge - PDF Viewer, image gallery */
.modal-container.xlarge {
  width: 1200px;
  max-width: 95vw;
  max-height: 90vh;
}

/* Full - Editores complejos */
.modal-container.full {
  width: 95vw;
  height: 95vh;
}
```

### **Glassmorphism Container:**

```css
.modal-container {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 24px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 100px rgba(14, 165, 233, 0.1);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1301;
}
```

**Detalles Técnicos:**
- **Blur:** 40px (más intenso que cards normales)
- **Saturación:** 200% (colores vibrantes)
- **Border:** Sutil con alpha 0.15
- **Shadow:** Triple capa (profundidad + glow + inset light)
- **Border radius:** 24px (orgánico)

### **Accent Top Border:**

```css
.modal-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(14, 165, 233, 0.8) 20%,
    rgba(139, 92, 246, 0.8) 50%,
    rgba(14, 165, 233, 0.8) 80%,
    transparent 100%
  );
  z-index: 2;
}
```

---

## 🎩 Header

### **Estructura:**

```html
<div class="modal-header">
  <div class="modal-header-icon">🎯</div>
  <div class="modal-header-content">
    <h2 class="modal-title">Título del Modal</h2>
    <p class="modal-subtitle">Descripción breve opcional</p>
  </div>
  <button class="modal-close-button">
    <span class="material-icons">close</span>
  </button>
</div>
```

### **Estilos:**

```css
.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px 32px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  background: linear-gradient(
    180deg,
    rgba(14, 165, 233, 0.03) 0%,
    transparent 100%
  );
}

/* Ícono del header */
.modal-header-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  font-size: 28px;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.25);
  border: 1px solid rgba(14, 165, 233, 0.2);
}

/* Título */
.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.01em;
  margin: 0;
}

/* Subtítulo (opcional) */
.modal-subtitle {
  font-size: 14px;
  color: #cbd5e1;
  margin: 4px 0 0;
  font-weight: 400;
}

/* Close button */
.modal-close-button {
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
  margin-left: auto;
  padding: 0;
}

.modal-close-button:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  transform: rotate(90deg);
}
```

**Variantes de Ícono:**

Usar gradientes específicos según el tipo de modal:

```css
/* Info/Default */
background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(139, 92, 246, 0.2));

/* Success */
background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));

/* Warning */
background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2));

/* Danger */
background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
```

---

## 📄 Body

### **Estructura:**

```html
<div class="modal-body">
  <!-- Contenido scrollable -->
</div>
```

### **Estilos:**

```css
.modal-body {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
```

### **Componentes Internos del Body:**

#### **Form Groups:**

```css
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
  background: rgba(15, 23, 42, 0.8);
}

.form-input::placeholder {
  color: #64748b;
}
```

#### **Info Cards (dentro del modal):**

```css
.modal-info-card {
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.modal-info-card .icon {
  color: #0ea5e9;
  font-size: 20px;
}

.modal-info-card .text {
  flex: 1;
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.5;
}
```

---

## 🦶 Footer

### **Estructura:**

```html
<div class="modal-footer">
  <button class="modal-button secondary">Cancelar</button>
  <button class="modal-button primary">Confirmar</button>
</div>
```

### **Estilos:**

```css
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px 28px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  background: linear-gradient(
    0deg,
    rgba(14, 165, 233, 0.02) 0%,
    transparent 100%
  );
}

/* Secondary Button (Cancel, etc.) */
.modal-button.secondary {
  padding: 12px 24px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-button.secondary:hover {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.25);
  color: #f8fafc;
  transform: translateY(-1px);
}

/* Primary Button (Confirm, Save, etc.) */
.modal-button.primary {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(14, 165, 233, 0.5);
}

.modal-button.primary:active {
  transform: scale(0.98);
}

/* Danger Button (Delete, etc.) */
.modal-button.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}

.modal-button.danger:hover {
  box-shadow: 0 12px 30px rgba(239, 68, 68, 0.5);
}
```

### **Footer con loading state:**

```jsx
<Box sx={{ display: 'flex', gap: 1.5 }}>
  <Button variant="outlined" disabled={loading}>
    Cancelar
  </Button>
  <Button 
    variant="contained" 
    disabled={loading}
    startIcon={loading && <CircularProgress size={16} />}
  >
    {loading ? 'Guardando...' : 'Guardar'}
  </Button>
</Box>
```

---

## 🔄 Tipos de Modales

### **1. Confirmation Modal (Small)**

**Uso:** Confirmar acciones destructivas (eliminar, descartar cambios, etc.)

```css
width: 400px;
```

**Características:**
- Sin body extenso
- Texto de confirmación breve
- 2 botones: Cancel + Confirm (danger)
- Ícono de warning en header

---

### **2. Form Modal (Medium)**

**Uso:** Formularios CRUD estándar (crear compromiso, editar pago, etc.)

```css
width: 600px;
```

**Características:**
- Multiple form fields
- Validación inline
- 2 botones: Cancel + Save
- Scrollable body si es necesario

---

### **3. Detail View Modal (Large)**

**Uso:** Ver detalles completos de un item (compromiso completo, usuario, etc.)

```css
width: 800px;
```

**Características:**
- Tabs opcionales en el body
- Secciones divididas
- Acciones secundarias en header (Edit, Delete)
- Footer opcional

---

### **4. PDF Viewer Modal (XLarge)**

**Uso:** Visualizar PDFs, imágenes, documentos

```css
width: 1200px;
max-height: 90vh;
```

**Características:**
- Toolbar en header (zoom, download, print)
- Body con iframe/canvas
- Footer minimalista o sin footer

---

### **5. Full Screen Editor (Full)**

**Uso:** Editores complejos (notas extensas, configuraciones avanzadas)

```css
width: 95vw;
height: 95vh;
```

**Características:**
- Fullscreen feel
- Toolbar completo
- Sidebar opcional
- Footer siempre visible

---

## ✨ Animaciones

### **Entrada del Modal:**

```css
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-container {
  animation: modalFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### **Salida del Modal:**

```css
@keyframes modalFadeOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
}

.modal-container.closing {
  animation: modalFadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### **Backdrop Fade:**

```css
@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-backdrop {
  animation: backdropFadeIn 0.3s ease;
}
```

---

## 🧩 Implementación MUI

### **UltraModal Component:**

```jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  alpha,
  Fade,
  Backdrop,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';

const UltraModal = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconGradient,
  size = 'medium',
  children,
  actions,
  ...props
}) => {
  const sizeMap = {
    small: 400,
    medium: 600,
    large: 800,
    xlarge: 1200,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 400 }}
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 300,
        sx: {
          backdropFilter: 'blur(12px) saturate(120%)',
          backgroundColor: alpha('#0a0e27', 0.85),
        },
      }}
      PaperProps={{
        sx: {
          width: sizeMap[size],
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: alpha('#0f172a', 0.85),
          backdropFilter: 'blur(40px) saturate(200%)',
          border: `1px solid ${alpha('#94a3b8', 0.15)}`,
          borderRadius: '24px',
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 0 100px rgba(14, 165, 233, 0.1)
          `,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: iconGradient || 
              'linear-gradient(90deg, transparent 0%, rgba(14, 165, 233, 0.8) 20%, rgba(139, 92, 246, 0.8) 50%, rgba(14, 165, 233, 0.8) 80%, transparent 100%)',
            zIndex: 2,
          },
        },
      }}
      {...props}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: '28px 32px 24px',
          borderBottom: `1px solid ${alpha('#94a3b8', 0.08)}`,
          background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.03) 0%, transparent 100%)',
        }}
      >
        {icon && (
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: iconGradient || 
                'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(139, 92, 246, 0.2))',
              borderRadius: '16px',
              fontSize: '28px',
              boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
              border: `1px solid ${alpha('#0ea5e9', 0.2)}`,
            }}
          >
            {icon}
          </Box>
        )}
        
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.01em',
              mb: subtitle ? 0.5 : 0,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '14px',
                color: '#cbd5e1',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            width: 36,
            height: 36,
            background: alpha('#94a3b8', 0.08),
            border: `1px solid ${alpha('#94a3b8', 0.12)}`,
            borderRadius: '10px',
            color: '#cbd5e1',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: alpha('#ef4444', 0.12),
              borderColor: alpha('#ef4444', 0.3),
              color: '#ef4444',
              transform: 'rotate(90deg)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Body */}
      <DialogContent
        sx={{
          p: 4,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha('#94a3b8', 0.3),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: alpha('#94a3b8', 0.5),
          },
        }}
      >
        {children}
      </DialogContent>

      {/* Footer */}
      {actions && (
        <DialogActions
          sx={{
            p: '20px 32px 28px',
            borderTop: `1px solid ${alpha('#94a3b8', 0.08)}`,
            background: 'linear-gradient(0deg, rgba(14, 165, 233, 0.02) 0%, transparent 100%)',
            gap: 1.5,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default UltraModal;
```

### **Ejemplo de Uso:**

```jsx
import UltraModal from './components/UltraModal';
import { Button } from '@mui/material';

function MyPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir Modal</Button>

      <UltraModal
        open={open}
        onClose={() => setOpen(false)}
        title="Crear Nuevo Compromiso"
        subtitle="Ingresa los detalles del compromiso financiero"
        icon="📝"
        size="medium"
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="contained">
              Guardar
            </Button>
          </>
        }
      >
        {/* Form fields here */}
        <TextField label="Empresa" fullWidth />
        <TextField label="Monto" fullWidth />
        {/* ... más campos */}
      </UltraModal>
    </>
  );
}
```

---

## 🎨 Variantes de Modales

### **Success Modal:**

```jsx
<UltraModal
  icon="✅"
  iconGradient="linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))"
  title="¡Operación Exitosa!"
  subtitle="El compromiso se guardó correctamente"
/>
```

### **Warning Modal:**

```jsx
<UltraModal
  icon="⚠️"
  iconGradient="linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))"
  title="Confirmación Requerida"
  subtitle="Esta acción no se puede deshacer"
/>
```

### **Danger Modal:**

```jsx
<UltraModal
  icon="🗑️"
  iconGradient="linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))"
  title="Eliminar Compromiso"
  subtitle="¿Estás seguro de eliminar este compromiso?"
/>
```

---

## ♿ Accesibilidad

### **Keyboard Navigation:**

```jsx
// Cerrar con ESC
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [open, onClose]);

// Focus trap dentro del modal
// Tab solo cicla entre elementos del modal
```

### **ARIA Labels:**

```jsx
<Dialog
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  role="dialog"
>
  <DialogTitle id="modal-title">{title}</DialogTitle>
  <DialogContent id="modal-description">
    {children}
  </DialogContent>
</Dialog>
```

---

## 📱 Responsive

### **Mobile Adaptations:**

```css
@media (max-width: 768px) {
  .modal-container {
    width: 95vw !important;
    max-height: 95vh;
    border-radius: 16px;
    margin: 16px;
  }

  .modal-header {
    padding: 20px 20px 16px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 16px 20px 20px;
    flex-direction: column-reverse;
  }

  .modal-button {
    width: 100%;
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear componente UltraModal base
- [ ] Implementar backdrop con glassmorphism
- [ ] Agregar animaciones de entrada/salida
- [ ] Crear variantes (success, warning, danger)
- [ ] Implementar tamaños (small, medium, large, xlarge, full)
- [ ] Agregar keyboard navigation (ESC)
- [ ] Implementar focus trap
- [ ] Responsive design completo
- [ ] Testing de accesibilidad
- [ ] Documentar ejemplos de uso

---

**Versión:** 1.0.0  
**Referencia:** `public/mockup-ultra-modern.html`, `public/mockup-commitments-ultra.html`  
**Siguiente:** PDF Viewer Design, Excel Export Design
