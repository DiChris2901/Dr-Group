# 🎨 DR Group Dashboard - Design System v2.1

## 📋 Índice
1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Paleta de Colores](#paleta-de-colores)
3. [Gradientes y Efectos](#gradientes-y-efectos)
4. [Tipografía](#tipografía)
5. [Espaciado y Layout](#espaciado-y-layout)
6. [Animaciones](#animaciones)
7. [Micro-interacciones](#micro-interacciones)
8. [Directrices de Implementación](#directrices-de-implementación)

---

## 🎯 Filosofía de Diseño

### Principios Fundamentales
- **Premium Enterprise**: Calidad comparable a las mejores SaaS (Notion, Linear, Figma)
- **Micro-interacciones**: Cada elemento debe tener feedback visual
- **Gradientes Dinámicos**: Usar `theme.palette.primary/secondary` siempre
- **Consistencia**: Todos los componentes siguen los mismos patrones
- **Accesibilidad**: Soporte completo para modo claro/oscuro

### Nivel de Calidad Objetivo
**🌟 10/10 Enterprise-Level**
- Animaciones suaves tipo spring
- Efectos shimmer y glow
- Sombras dinámicas
- Micro-feedback en todas las interacciones

---

## 🎨 Paleta de Colores

### Colores Principales (Dinámicos)
```jsx
// SIEMPRE usar theme.palette para consistencia
const primaryColor = theme.palette.primary.main
const secondaryColor = theme.palette.secondary.main
const errorColor = theme.palette.error.main
const warningColor = theme.palette.warning.main
const successColor = theme.palette.success.main
const infoColor = theme.palette.info.main
```

### Gradientes Base
```jsx
// Gradiente Principal Premium
background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`

// Gradiente de Modo (Light/Dark)
background: theme.palette.mode === 'dark'
  ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'

// Gradiente de Información
background: `linear-gradient(135deg, ${theme.palette.info.light}15, ${theme.palette.info.main}10)`
```

### Transparencias Estándar
```jsx
// Bordes y Divisores
border: `1px solid ${theme.palette.divider}`
border: `1px solid ${theme.palette.primary.main}30` // 30% opacity

// Fondos Overlay
backgroundColor: 'rgba(255, 255, 255, 0.2)' // Light overlay
backgroundColor: 'rgba(0, 0, 0, 0.1)'       // Dark overlay

// Sombras con Color
boxShadow: `0 4px 12px ${theme.palette.primary.main}40` // 40% opacity
```

---

## ✨ Gradientes y Efectos

### 1. Efectos Shimmer (Premium)
```jsx
// CSS Keyframes para Shimmer
'&::before': {
  content: '""',
  position: 'absolute',
  top: 0,
  left: '-100%',
  width: '100%',
  height: '100%',
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
  animation: 'shimmer 2s infinite',
  zIndex: 1
},
'@keyframes shimmer': {
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' }
}
```

### 2. Efectos Pulse
```jsx
// Animación Pulse para elementos importantes
'@keyframes pulse': {
  '0%, 100%': { 
    boxShadow: `0 0 0 0 ${theme.palette.primary.main}40` 
  },
  '50%': { 
    boxShadow: `0 0 0 10px ${theme.palette.primary.main}00` 
  }
}
```

### 3. Efectos Float
```jsx
// Partículas flotantes en banners
'@keyframes float': {
  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
  '50%': { transform: 'translateY(-20px) rotate(180deg)' }
}
```

---

## 📝 Tipografía

### Jerarquía de Texto
```jsx
// Títulos Principales (Banners)
variant="h5" 
sx={{ fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}

// Subtítulos
variant="h6" 
sx={{ fontWeight: 600 }}

// Texto Descriptivo
variant="body1" 
sx={{ opacity: 0.9, fontWeight: 500 }}

// Texto Secundario
variant="body2" 
sx={{ color: 'text.secondary' }}

// Captions con Peso
variant="caption" 
sx={{ opacity: 0.9, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
```

---

## 📐 Espaciado y Layout

### Espaciado Estándar
```jsx
// Padding Principal
p: 4 // 32px - Para contenido principal
p: 3 // 24px - Para secciones
p: 2 // 16px - Para elementos pequeños

// Margins
mb: 3 // 24px - Entre secciones
mb: 1 // 8px - Entre elementos relacionados
gap: 2 // 16px - Entre elementos en flex/grid
gap: 3 // 24px - Entre elementos principales
```

### Border Radius Estándar
```jsx
borderRadius: 3  // 12px - Botones y campos
borderRadius: 4  // 16px - Modales y papers
borderRadius: 2  // 8px - Elementos pequeños
borderRadius: '50%' // Círculos perfectos
```

### Elevaciones (Shadows)
```jsx
elevation={0}  // Sin sombra (con border)
elevation={4}  // Sombra suave
elevation={8}  // Sombra media
elevation={12} // Sombra pronunciada
elevation={24} // Sombra máxima (modales)
```

---

## 🎬 Animaciones

### 1. Animaciones Framer Motion Estándar

#### Entrada de Componentes
```jsx
// Entrada suave desde abajo
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.1, duration: 0.3 }}

// Entrada con escala
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}

// Entrada lateral
initial={{ x: -30, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ delay: 0.3, duration: 0.5 }}
```

#### Micro-interacciones de Botones
```jsx
// Hover y Tap estándar
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
transition={{ type: "spring", bounce: 0.4 }}

// Para elementos que no deben moverse cuando disabled
whileHover={{ scale: disabled ? 1 : 1.02 }}
whileTap={{ scale: disabled ? 1 : 0.98 }}
```

#### Animaciones de Rotación
```jsx
// Rotación continua (iconos de carga)
animate={{ rotate: 360 }}
transition={{ duration: 2, repeat: Infinity, ease: "linear" }}

// Rotación con escala (elementos especiales)
animate={{ 
  rotate: [0, 360],
  scale: [1, 1.1, 1]
}}
transition={{ 
  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
}}
```

### 2. Transitions CSS Estándar
```jsx
// Transición estándar para hover
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'

// Transición suave para transformaciones
transition: 'all 0.3s ease-in-out'

// Transición más lenta para efectos especiales
transition: 'all 0.6s'
```

---

---

## 🎯 Micro-interacciones

### Principios de Micro-interacciones
```jsx
// Estados hover estándar para botones
whileHover={{ scale: 1.02, y: -2 }}
whileTap={{ scale: 0.98 }}
transition={{ type: "spring", bounce: 0.4 }}

// Estados hover para cards
whileHover={{ y: -4, scale: 1.01 }}
transition={{ duration: 0.3, ease: "easeOut" }}

// Estados de focus para inputs
'&:focus-within': {
  transform: 'translateY(-1px)',
  boxShadow: `0 4px 12px ${theme.palette.primary.main}20`
}
```

### Feedback Visual Estándar
```jsx
// Ripple effect en botones
sx={{
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    transition: 'width 0.6s, height 0.6s, top 0.6s, left 0.6s'
  },
  '&:active::after': {
    width: '300px',
    height: '300px',
    top: 'calc(50% - 150px)',
    left: 'calc(50% - 150px)'
  }
}}
```

---

## 📋 Directrices de Implementación

### ✅ SIEMPRE Hacer
1. **Usar `theme.palette`** para todos los colores
2. **Incluir micro-interacciones** en elementos clickeables
3. **Agregar loading states** y feedback visual
4. **Implementar modo claro/oscuro** desde el inicio
5. **Usar Framer Motion** para animaciones complejas
6. **Incluir efectos shimmer** en elementos premium
7. **Agregar spring transitions** para naturalidad
8. **Validar estados disabled** correctamente

### ❌ NUNCA Hacer
1. **Colores hardcoded** (#1976d2, #fff, etc.)
2. **Animaciones sin purpose** (decorativas únicamente)
3. **Sombras inconsistentes** (usar elevation estándar)
4. **Bordes sin radius** (mínimo borderRadius: 2)
5. **Botones sin feedback** visual
6. **Ignorar estados disabled** en micro-interacciones
7. **Mezclar estilos** de diferentes design systems

### 🎯 Checklist de Calidad Premium
- [ ] ¿Usa gradientes dinámicos del tema?
- [ ] ¿Tiene micro-interacciones apropiadas?
- [ ] ¿Funciona en modo claro y oscuro?
- [ ] ¿Incluye efectos shimmer donde corresponde?
- [ ] ¿Las animaciones son suaves y naturales?
- [ ] ¿Los estados disabled están bien manejados?
- [ ] ¿El spacing es consistente con el sistema?
- [ ] ¿La tipografía sigue la jerarquía establecida?

---

## 🔄 Versionado del Design System

**Versión Actual: 2.2** (Agosto 2025)

### Changelog
- **v2.2**: 🚀 Optimización ARM64 + Próximas mejoras planificadas
  - Solución completa para compatibilidad Windows ARM64
  - Migración exitosa a `pnpm` para mejor gestión de dependencias
  - Planificación de componentes avanzados (PremiumDataTable, SmartAlert, MorphingCard)
  - Documentación de arquitectura optimizada
  - Setup scripts para desarrollo ARM64
- **v2.1**: Limpieza de Design System - Solo lenguaje de diseño visual
- **v2.0**: Sistema completo premium con micro-interacciones
- **v1.5**: Gradientes dinámicos y efectos shimmer
- **v1.0**: Base inicial con Material-UI

### 🏗️ Arquitectura Técnica
- **Gestión de dependencias**: `pnpm` (ARM64 optimizado)
- **Bundler**: Vite + Rollup con soporte ARM64
- **Compatibilidad**: Windows ARM64, x64, macOS (Apple Silicon/Intel)
- **CI/CD**: Preparado para runners ARM64

### 🔮 Roadmap v2.3-v3.0
- **v2.3**: Implementación PremiumDataTable con efectos cristal
- **v2.4**: SmartAlert con recomendaciones automáticas basadas en contexto
- **v2.5**: MorphingCard con transiciones de estado dinámicas
- **v3.0**: Sistema completo de componentes premium + TypeScript nativo

---

*Este Design System es la columna vertebral visual de DR Group Dashboard. Cada actualización mantiene compatibilidad hacia atrás mientras expande las capacidades premium. Optimizado para desarrollo moderno en cualquier arquitectura (ARM64/x64).*