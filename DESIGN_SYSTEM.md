# 🎨 DR Group Dashboard - Design System v2.0

## 📋 Índice
1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Paleta de Colores](#paleta-de-colores)
3. [Gradientes y Efectos](#gradientes-y-efectos)
4. [Tipografía](#tipografía)
5. [Espaciado y Layout](#espaciado-y-layout)
6. [Animaciones](#animaciones)
7. [Componentes Premium](#componentes-premium)
8. [Micro-interacciones](#micro-interacciones)
9. [Código Reutilizable](#código-reutilizable)
10. [Directrices de Implementación](#directrices-de-implementación)

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

## 🏗️ Componentes Premium

### 1. Banner Premium Template
```jsx
<Box
  sx={{
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: 'white',
    p: 4,
    borderRadius: '16px 16px 0 0',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
      zIndex: 1
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: -50,
      right: -50,
      width: 120,
      height: 120,
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      animation: 'float 6s ease-in-out infinite',
      zIndex: 1
    }
  }}
>
  {/* Contenido con zIndex: 2 */}
</Box>
```

### 2. Botón Premium Template
```jsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", bounce: 0.4 }}
>
  <Button
    sx={{
      borderRadius: '12px',
      height: '48px',
      textTransform: 'none',
      fontWeight: 600,
      position: 'relative',
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      boxShadow: `0 4px 15px ${theme.palette.primary.main}40`,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        transition: 'all 0.6s'
      },
      '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${theme.palette.primary.main}50`,
        '&::before': {
          left: '100%'
        }
      },
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
  >
    Texto del Botón
  </Button>
</motion.div>
```

### 3. Paper Premium Template
```jsx
<Paper
  elevation={0}
  sx={{
    p: 2.5,
    borderRadius: 3,
    background: `linear-gradient(135deg, ${theme.palette.info.light}15, ${theme.palette.info.main}10)`,
    border: `1px solid ${theme.palette.info.main}30`,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, transparent, ${theme.palette.info.main}20, transparent)`,
      animation: 'shimmer 3s infinite',
      zIndex: 1
    }
  }}
>
  {/* Contenido con zIndex: 2 */}
</Paper>
```

### 4. Progress Bar Premium
```jsx
<LinearProgress
  variant="determinate"
  value={progress}
  sx={{
    height: 8,
    borderRadius: 4,
    bgcolor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    '& .MuiLinearProgress-bar': {
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 4,
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        animation: 'shimmer 2s infinite'
      }
    }
  }}
/>
```

---

## 🎯 Micro-interacciones

### Estados de Input Premium
```jsx
// TextField con validación visual
<TextField
  sx={{ 
    '& .MuiOutlinedInput-root': { 
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }
    }
  }}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <Icon color={error ? 'error' : 'primary'} />
      </InputAdornment>
    ),
    endAdornment: !error && value && (
      <InputAdornment position="end">
        <CheckCircle color="success" fontSize="small" />
      </InputAdornment>
    )
  }}
/>
```

### Chips Animados
```jsx
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
>
  <Chip
    sx={{
      bgcolor: theme.palette.warning.main,
      color: 'white',
      fontWeight: 600,
      boxShadow: `0 2px 8px ${theme.palette.warning.main}40`,
      animation: 'pulse 2s infinite'
    }}
  />
</motion.div>
```

---

## 💻 Código Reutilizable

### Custom Hooks Estándar
```jsx
// Hook para gradientes dinámicos
const useThemeGradient = () => {
  const theme = useTheme();
  return {
    primary: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    info: `linear-gradient(135deg, ${theme.palette.info.light}15, ${theme.palette.info.main}10)`,
    paper: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'
  };
};
```

### Utilidades de Animación
```jsx
// Variantes de animación estándar
export const animationVariants = {
  // Entrada desde abajo
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },
  
  // Entrada con escala
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", bounce: 0.3, duration: 0.6 }
  },
  
  // Micro-interacciones de botón
  buttonHover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", bounce: 0.4 }
  }
};
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

**Versión Actual: 2.0** (Julio 2025)

### Changelog
- **v2.0**: Sistema completo premium con micro-interacciones
- **v1.5**: Gradientes dinámicos y efectos shimmer
- **v1.0**: Base inicial con Material-UI

### Próximas Mejoras
- [ ] Componente de notificaciones toast
- [ ] Sistema de skeleton loaders premium
- [ ] Paleta de colores extendida
- [ ] Animaciones de página completa

---

*Este Design System debe ser consultado antes de crear cualquier componente nuevo o modificar existentes para mantener consistencia visual y funcional en todo el proyecto.*