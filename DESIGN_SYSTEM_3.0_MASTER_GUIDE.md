# 🎨 DESIGN SYSTEM 3.0 - GUÍA MAESTRA AUTOSUFICIENTE

## 📋 ÍNDICE DE REFERENCIA RÁPIDA
- [🎯 Colores Principales](#colores-principales)
- [🌈 Gradientes](#gradientes)  
- [🎭 Sombras](#sombras)
- [📐 Espaciado](#espaciado)
- [🔤 Tipografía](#tipografía)
- [🎪 Animaciones](#animaciones)
- [🎨 Efectos Visuales](#efectos-visuales)
- [📱 Componentes](#componentes)

---

## 🎯 COLORES PRINCIPALES

### Paleta Primaria Spectacular
```css
/* Azul Espectacular */
--spectacular-blue-50: #e8f4fd
--spectacular-blue-100: #bde2fb
--spectacular-blue-200: #91cff8
--spectacular-blue-300: #64bbf6
--spectacular-blue-400: #42acf4
--spectacular-blue-500: #1e9cf2  /* Principal */
--spectacular-blue-600: #1a8cd6
--spectacular-blue-700: #167bb9
--spectacular-blue-800: #126a9c
--spectacular-blue-900: #0e5880

/* Púrpura Espectacular */
--spectacular-purple-50: #f4e8fd
--spectacular-purple-100: #e0bdfb
--spectacular-purple-200: #cc91f8
--spectacular-purple-300: #b764f6
--spectacular-purple-400: #a742f4
--spectacular-purple-500: #961ef2  /* Principal */
--spectacular-purple-600: #851ad6
--spectacular-purple-700: #7416b9
--spectacular-purple-800: #62129c
--spectacular-purple-900: #510e80

/* Rosa Espectacular */
--spectacular-pink-50: #fde8f4
--spectacular-pink-100: #fbbde0
--spectacular-pink-200: #f891cc
--spectacular-pink-300: #f664b7
--spectacular-pink-400: #f442a7
--spectacular-pink-500: #f21e96  /* Principal */
--spectacular-pink-600: #d61a85
--spectacular-pink-700: #b91674
--spectacular-pink-800: #9c1262
--spectacular-pink-900: #800e51
```

### Colores de Estado
```css
/* Éxito */
--success-primary: #4caf50
--success-light: #81c784
--success-dark: #2e7d32
--success-bg: #e8f5e8

/* Error */
--error-primary: #f44336
--error-light: #ef5350
--error-dark: #c62828
--error-bg: #ffebee

/* Advertencia */
--warning-primary: #ff9800
--warning-light: #ffb74d
--warning-dark: #f57c00
--warning-bg: #fff3e0

/* Información */
--info-primary: #2196f3
--info-light: #64b5f6
--info-dark: #1976d2
--info-bg: #e3f2fd
```

### Escala de Grises Espectacular
```css
--gray-50: #fafafa
--gray-100: #f5f5f5
--gray-200: #eeeeee
--gray-300: #e0e0e0
--gray-400: #bdbdbd
--gray-500: #9e9e9e
--gray-600: #757575
--gray-700: #616161
--gray-800: #424242
--gray-900: #212121
```

---

## 🌈 GRADIENTES

### Gradientes Principales Spectacular
```css
/* Gradiente Primario Azul-Púrpura */
.gradient-primary {
  background: linear-gradient(135deg, #1e9cf2 0%, #961ef2 100%);
}

/* Gradiente Secundario Púrpura-Rosa */
.gradient-secondary {
  background: linear-gradient(135deg, #961ef2 0%, #f21e96 100%);
}

/* Gradiente Terciario Azul-Rosa */
.gradient-tertiary {
  background: linear-gradient(135deg, #1e9cf2 0%, #f21e96 100%);
}

/* Gradiente Suave para Fondos */
.gradient-soft {
  background: linear-gradient(135deg, 
    rgba(30, 156, 242, 0.1) 0%, 
    rgba(150, 30, 242, 0.1) 50%, 
    rgba(242, 30, 150, 0.1) 100%);
}

/* Gradiente para Textos */
.gradient-text {
  background: linear-gradient(135deg, #1e9cf2 0%, #961ef2 50%, #f21e96 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Gradiente para Papers/Cards */
.gradient-paper {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%, 
    rgba(255, 255, 255, 0.7) 100%);
}
```

### Gradientes de Estado
```css
/* Éxito Gradiente */
.gradient-success {
  background: linear-gradient(135deg, #4caf50 0%, #81c784 100%);
}

/* Error Gradiente */
.gradient-error {
  background: linear-gradient(135deg, #f44336 0%, #ef5350 100%);
}

/* Advertencia Gradiente */
.gradient-warning {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
}

/* Información Gradiente */
.gradient-info {
  background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
}
```

---

## 🎭 SOMBRAS

### Sombras Spectacular
```css
/* Sombra Suave */
--shadow-soft: 0 2px 8px rgba(30, 156, 242, 0.08);

/* Sombra Media */
--shadow-medium: 0 4px 20px rgba(30, 156, 242, 0.12);

/* Sombra Fuerte */
--shadow-strong: 0 8px 32px rgba(30, 156, 242, 0.16);

/* Sombra Espectacular */
--shadow-spectacular: 0 12px 48px rgba(30, 156, 242, 0.2);

/* Sombra Glassmorphism */
--shadow-glass: 0 8px 32px rgba(31, 38, 135, 0.37);

/* Sombras de Hover */
--shadow-hover: 0 6px 25px rgba(30, 156, 242, 0.15);

/* Sombras Internas */
--shadow-inner: inset 0 2px 4px rgba(30, 156, 242, 0.1);
```

### Sombras por Elevación
```css
/* Elevación 1 - Cards */
--elevation-1: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);

/* Elevación 2 - Botones Hover */
--elevation-2: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);

/* Elevación 3 - Modales */
--elevation-3: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);

/* Elevación 4 - Drawers */
--elevation-4: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);

/* Elevación 5 - AppBar */
--elevation-5: 0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22);
```

---

## 📐 ESPACIADO

### Sistema de Espaciado (8px base)
```css
--spacing-xs: 4px    /* 0.5 unidades */
--spacing-sm: 8px    /* 1 unidad */
--spacing-md: 16px   /* 2 unidades */
--spacing-lg: 24px   /* 3 unidades */
--spacing-xl: 32px   /* 4 unidades */
--spacing-2xl: 48px  /* 6 unidades */
--spacing-3xl: 64px  /* 8 unidades */
--spacing-4xl: 96px  /* 12 unidades */
```

### Dimensiones de Componentes
```css
/* Botones */
--btn-height-small: 32px
--btn-height-medium: 40px
--btn-height-large: 48px
--btn-padding-x: 16px
--btn-padding-y: 8px

/* Cards */
--card-padding: 24px
--card-border-radius: 16px
--card-min-height: 120px

/* Inputs */
--input-height: 48px
--input-padding-x: 16px
--input-border-radius: 12px

/* Avatars */
--avatar-small: 32px
--avatar-medium: 40px
--avatar-large: 56px
--avatar-xl: 80px

/* Icons */
--icon-small: 16px
--icon-medium: 24px
--icon-large: 32px
--icon-xl: 48px
```

### Border Radius
```css
--radius-xs: 4px
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 24px
--radius-2xl: 32px
--radius-full: 50%
```

---

## 🔤 TIPOGRAFÍA

### Pesos de Fuente
```css
--font-light: 300
--font-regular: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
--font-black: 900
```

### Escalas de Tamaño
```css
/* Headings */
--text-h1: 48px  /* line-height: 56px */
--text-h2: 40px  /* line-height: 48px */
--text-h3: 32px  /* line-height: 40px */
--text-h4: 28px  /* line-height: 36px */
--text-h5: 24px  /* line-height: 32px */
--text-h6: 20px  /* line-height: 28px */

/* Body */
--text-body-lg: 18px   /* line-height: 28px */
--text-body: 16px      /* line-height: 24px */
--text-body-sm: 14px   /* line-height: 20px */
--text-caption: 12px   /* line-height: 16px */
--text-overline: 10px  /* line-height: 16px, uppercase */

/* Buttons */
--text-button: 14px  /* font-weight: 600, uppercase */
```

### Estilos de Texto Spectacular
```css
/* Título Principal con Gradiente */
.text-spectacular-title {
  font-size: 48px;
  font-weight: 800;
  line-height: 56px;
  background: linear-gradient(135deg, #1e9cf2 0%, #961ef2 50%, #f21e96 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Subtítulo Elegante */
.text-spectacular-subtitle {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  color: #616161;
  letter-spacing: -0.02em;
}

/* Texto de Cuerpo Premium */
.text-spectacular-body {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #424242;
  letter-spacing: 0.01em;
}
```

---

## 🎪 ANIMACIONES

### Transiciones Base
```css
/* Transición Spectacular Suave */
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Transición Spectacular Rápida */
--transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

/* Transición Spectacular Lenta */
--transition-slow: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);

/* Transición Bounce */
--transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Animaciones Keyframes
```css
/* Shimmer Effect */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

/* Pulse Glow */
@keyframes pulseGlow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(30, 156, 242, 0.3);
  }
  50% { 
    box-shadow: 0 0 40px rgba(30, 156, 242, 0.6);
  }
}

/* Rotate Spectacular */
@keyframes rotateSpectacular {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.05); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Scale In */
@keyframes scaleIn {
  0% { 
    transform: scale(0.8); 
    opacity: 0; 
  }
  100% { 
    transform: scale(1); 
    opacity: 1; 
  }
}

/* Slide In Up */
@keyframes slideInUp {
  0% {
    transform: translateY(30px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Fade In */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

### Clases de Animación Listas para Usar
```css
/* Shimmer Effect para Loading */
.shimmer-effect {
  position: relative;
  overflow: hidden;
}
.shimmer-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  animation: shimmer 2s infinite;
}

/* Hover Effects */
.hover-spectacular {
  transition: var(--transition-smooth);
}
.hover-spectacular:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 48px rgba(30, 156, 242, 0.2);
}

/* Pulse Effect */
.pulse-spectacular {
  animation: pulseGlow 2s infinite;
}

/* Float Effect */
.float-spectacular {
  animation: float 3s ease-in-out infinite;
}
```

---

## 🎨 EFECTOS VISUALES

### Glassmorphism
```css
.glassmorphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}

.glassmorphism-dark {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Efectos de Hover Spectacular
```css
/* Botón Spectacular */
.btn-spectacular {
  background: linear-gradient(135deg, #1e9cf2 0%, #961ef2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.btn-spectacular::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: var(--transition-smooth);
}

.btn-spectacular:hover::before {
  left: 100%;
}

.btn-spectacular:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 156, 242, 0.3);
}
```

### Bordes Spectacular
```css
.border-spectacular {
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #1e9cf2, #961ef2) border-box;
  border-radius: 12px;
}
```

---

## 📱 COMPONENTES

### Cards Spectacular
```css
.card-spectacular {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  padding: 24px;
  transition: var(--transition-smooth);
}

.card-spectacular:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(31, 38, 135, 0.2);
}
```

### Inputs Spectacular
```css
.input-spectacular {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  transition: var(--transition-smooth);
  background: rgba(255, 255, 255, 0.9);
}

.input-spectacular:focus {
  border-color: #1e9cf2;
  box-shadow: 0 0 0 4px rgba(30, 156, 242, 0.1);
  outline: none;
}
```

### Modales Spectacular
```css
.modal-spectacular {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 32px;
  max-width: 600px;
  margin: auto;
}

.modal-backdrop-spectacular {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}
```

---

## 🎯 GUÍA DE USO RÁPIDA

### Para Botones
```jsx
// Botón Principal
<Button sx={{
  background: 'linear-gradient(135deg, #1e9cf2 0%, #961ef2 100%)',
  borderRadius: '12px',
  fontWeight: 600,
  padding: '12px 24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(30, 156, 242, 0.3)'
  }
}}>
```

### Para Cards
```jsx
// Card Spectacular
<Card sx={{
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
  padding: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 48px rgba(31, 38, 135, 0.2)'
  }
}}>
```

### Para Textos con Gradiente
```jsx
// Título Spectacular
<Typography sx={{
  fontSize: '48px',
  fontWeight: 800,
  lineHeight: '56px',
  background: 'linear-gradient(135deg, #1e9cf2 0%, #961ef2 50%, #f21e96 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
}}>
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Copiar valores exactos (no usar tokens)
- [ ] Aplicar transiciones suaves: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- [ ] Usar border-radius: `12px` para elementos, `16px` para cards
- [ ] Aplicar sombras spectacular en hover
- [ ] Usar gradientes para elementos principales
- [ ] Aplicar glassmorphism en overlays
- [ ] Mantener espaciado consistente (múltiplos de 8px)
- [ ] Usar pesos de fuente correctos (600 para botones, 800 para títulos)

---

**🚀 Esta guía contiene TODOS los valores que necesitas. NO consultes tokens. Copia y pega directamente estos valores en tus componentes.**
