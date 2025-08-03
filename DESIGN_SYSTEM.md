# 🎨 DR Group Dashboard - Design System v2.2

## 📋 Índice
1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Paleta de Colores y Tokens](#paleta-de-colores-y-tokens)
3. [Gradientes y Efectos](#gradientes-y-efectos)
4. [Tipografía](#tipografía)
5. [Espaciado, Layout y Tokens](#espaciado-layout-y-tokens)
6. [Animaciones y Micro-interacciones](#animaciones-y-micro-interacciones)
7. [Accesibilidad](#accesibilidad)
8. [Performance & Optimization](#performance--optimization)
9. [Testing Visual y Automatización](#testing-visual-y-automatización)
10. [Directrices de Implementación](#directrices-de-implementación)
11. [Checklist de Calidad Premium](#checklist-de-calidad-premium)
12. [Versionado y Roadmap](#versionado-y-roadmap)
13. [Arquitectura Técnica](#arquitectura-técnica)

---

## 🎯 Filosofía de Diseño

### Principios Fundamentales
- **Premium Enterprise:** Calidad comparable a las mejores SaaS (Notion, Linear, Figma)
- **Micro-interacciones:** Cada elemento debe tener feedback visual relevante
- **Gradientes Dinámicos:** Usar `theme.palette.primary/secondary` y tokens de color siempre
- **Consistencia:** Todos los componentes siguen los mismos patrones y tokens
- **Accesibilidad:** Soporte completo para modo claro/oscuro, contrastes, navegación teclado y roles ARIA
- **Performance:** Prioridad a la velocidad, optimización, renderizado eficiente y responsividad

### Nivel de Calidad Objetivo
**🌟 10/10 Enterprise-Level**
- Animaciones suaves tipo spring y optimizadas
- Efectos shimmer y glow solo donde aporten valor
- Sombras dinámicas y elevaciones consistentes
- Micro-feedback en todas las interacciones importantes
- Experiencia fluida en desktop y mobile

---

## 🎨 Paleta de Colores y Tokens

### Colores Principales (Dinámicos)
```jsx
// SIEMPRE usar theme.palette y design tokens para consistencia
const primaryColor = theme.palette.primary.main
const secondaryColor = theme.palette.secondary.main
const errorColor = theme.palette.error.main
const warningColor = theme.palette.warning.main
const successColor = theme.palette.success.main
const infoColor = theme.palette.info.main
```

### Tokens de Diseño (Spacing, Radius, etc.)
```jsx
// Espaciado estándar
const spacing = {
  xs: 4,   // 4px
  sm: 8,   // 8px
  md: 16,  // 16px
  lg: 24,  // 24px
  xl: 32   // 32px
}
// Border radius estándar
const radius = {
  sm: 8,   // 8px
  md: 12,  // 12px
  lg: 16   // 16px
}
```

### Gradientes Base
```jsx
// Gradiente Principal Premium
background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`

// Gradiente de Modo (Light/Dark)
background: theme.palette.mode === 'dark'
  ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'

// Gradiente de Información
background: `linear-gradient(135deg, ${theme.palette.info.light}15, ${theme.palette.info.main}10)`
```

### Transparencias Estándar
```jsx
border: `1px solid ${theme.palette.divider}`
border: `1px solid ${primaryColor}30` // 30% opacity

backgroundColor: 'rgba(255, 255, 255, 0.2)' // Light overlay
backgroundColor: 'rgba(0, 0, 0, 0.1)'       // Dark overlay

boxShadow: `0 4px 12px ${primaryColor}40` // 40% opacity
```

---

## ✨ Gradientes y Efectos

### Efectos Shimmer (Premium)
```jsx
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

### Efectos Pulse y Float
```jsx
'@keyframes pulse': {
  '0%, 100%': { boxShadow: `0 0 0 0 ${primaryColor}40` },
  '50%': { boxShadow: `0 0 0 10px ${primaryColor}00` }
}
'@keyframes float': {
  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
  '50%': { transform: 'translateY(-20px) rotate(180deg)' }
}
```

---

## 📝 Tipografía

### Jerarquía de Texto
```jsx
variant="h5" sx={{ fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }} // Título principal
variant="h6" sx={{ fontWeight: 600 }} // Subtítulo
variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }} // Texto descriptivo
variant="body2" sx={{ color: 'text.secondary' }} // Texto secundario
variant="caption" sx={{ opacity: 0.9, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }} // Caption
```

---

## 📐 Espaciado, Layout y Tokens

### Espaciado Estándar y Tokens
```jsx
p: spacing.xl // 32px - Contenido principal
p: spacing.lg // 24px - Secciones
p: spacing.md // 16px - Elementos pequeños

mb: spacing.lg // 24px - Entre secciones
mb: spacing.sm // 8px - Entre elementos relacionados
gap: spacing.md // 16px - Entre elementos en flex/grid
gap: spacing.lg // 24px - Entre elementos principales
```

### Border Radius Estándar
```jsx
borderRadius: radius.md  // 12px - Botones y campos
borderRadius: radius.lg  // 16px - Modales y papers
borderRadius: radius.sm  // 8px - Elementos pequeños
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

## 🎬 Animaciones y Micro-interacciones

### Animaciones Framer Motion Estándar

#### Entrada de Componentes
```jsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.1, duration: 0.3 }}

initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}

initial={{ x: -30, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ delay: 0.3, duration: 0.5 }}
```

#### Micro-interacciones de Botones y Cards
```jsx
whileHover={{ scale: 1.02, y: -2 }}
whileTap={{ scale: 0.98 }}
transition={{ type: "spring", bounce: 0.4 }}

whileHover={{ y: -4, scale: 1.01 }}
transition={{ duration: 0.3, ease: "easeOut" }}
```

#### Estados de Focus para Inputs
```jsx
'&:focus-within': {
  transform: 'translateY(-1px)',
  boxShadow: `0 4px 12px ${primaryColor}20`
}
```

#### Feedback Visual Estándar (Ripple Effect)
```jsx
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

## ♿ Accesibilidad

### Principios y Checklist de Accesibilidad

- Contrastes mínimos recomendados (WCAG AA)
- Navegación por teclado en todos los componentes interactivos
- Uso de roles ARIA y atributos semánticos donde corresponda
- Etiquetas y descripciones en formularios
- Uso correcto de estados disabled y focus

**Importante:**  
Las opciones de accesibilidad avanzadas (contraste mejorado, navegación por teclado, roles ARIA, feedback visual especial, etc.) **solo deben estar disponibles si y solo si el usuario las habilita explícitamente en el menú de configuración**.  
Por defecto, la experiencia es premium visual; los ajustes de accesibilidad se activan como preferencia personal.

**Checklist:**
- [ ] ¿Los contrastes cumplen WCAG AA? *(si el usuario lo habilita)*
- [ ] ¿Los componentes son accesibles por teclado? *(si el usuario lo habilita)*
- [ ] ¿Se usan roles ARIA donde corresponde? *(si el usuario lo habilita)*
- [ ] ¿El feedback visual es accesible para usuarios con discapacidad visual? *(si el usuario lo habilita)*

---

## ⚡️ Performance & Optimization

### Reglas de Optimización Visual
- Limita animaciones y micro-interacciones a elementos clave y usa `will-change` en CSS
- Desactiva/reduce efectos visuales en dispositivos móviles o de bajo rendimiento (media queries)
- Agrupa animaciones y evita que muchas ocurran simultáneamente
- Usa React.memo, lazy loading y virtualización para listas grandes
- Carga diferida de assets (fonts, imágenes, iconos) y usa formatos optimizados
- Perfilado regular con Lighthouse, Chrome DevTools y React Profiler
- No abuses de box-shadow, filter y transparencias en layouts pesados

**Ejemplo:**
```jsx
if (isMobile) {
  disableShimmer()
  reduceMotion()
}
```

---

## 🔬 Testing Visual y Automatización

- Integra Storybook para documentar y testear componentes premium
- Usa Chromatic, Percy, BackstopJS para detectar regresiones visuales
- Checklist visual automatizado antes de cada release

---

## 📋 Directrices de Implementación

### ✅ SIEMPRE Hacer
1. Usar `theme.palette` y tokens para colores y spacing
2. Incluir micro-interacciones en elementos clickeables
3. Agregar loading states y feedback visual
4. Implementar modo claro/oscuro desde el inicio
5. Usar Framer Motion para animaciones complejas (solo cuando aporten valor)
6. Efectos shimmer solo en elementos premium y bien justificados
7. Agregar spring transitions para naturalidad
8. Validar estados disabled correctamente
9. Mantener compatibilidad y retrocompatibilidad en actualizaciones

### ❌ NUNCA Hacer
1. Colores hardcoded (#1976d2, #fff, etc.)
2. Animaciones sin propósito funcional
3. Sombras inconsistentes (usar elevation estándar)
4. Bordes sin radius (mínimo borderRadius: 2)
5. Botones sin feedback visual ni loading state
6. Ignorar estados disabled en micro-interacciones
7. Mezclar estilos de diferentes design systems
8. Ignorar performance y accesibilidad

---

## 🎯 Checklist de Calidad Premium

- [ ] ¿Usa gradientes dinámicos del tema?
- [ ] ¿Utiliza design tokens para spacing, radius y colores?
- [ ] ¿Tiene micro-interacciones apropiadas?
- [ ] ¿Funciona en modo claro y oscuro?
- [ ] ¿Incluye efectos shimmer donde corresponde?
- [ ] ¿Las animaciones son suaves, naturales y optimizadas?
- [ ] ¿Los estados disabled están bien manejados?
- [ ] ¿El spacing es consistente con el sistema?
- [ ] ¿La tipografía sigue la jerarquía establecida?
- [ ] ¿Cumple criterios de accesibilidad (WCAG AA) si el usuario lo habilita?
- [ ] ¿Se testea visualmente en Storybook u otro sistema?
- [ ] ¿Está optimizado y libre de cuellos de botella de performance?

---

## 🔄 Versionado y Roadmap

**Versión Actual: 2.2** (Agosto 2025)

### Changelog
- **v2.2**: 🚀 Optimización ARM64 + Mejora de tokens y performance
  - Solución completa para compatibilidad Windows ARM64
  - Migración exitosa a `pnpm`
  - Planificación de componentes avanzados (PremiumDataTable, SmartAlert, MorphingCard)
  - Documentación de arquitectura optimizada
  - Setup scripts para desarrollo ARM64
  - Performance & Optimization agregado
  - Checklist de accesibilidad personalizable por usuario
- **v2.1**: Limpieza de Design System - Solo lenguaje de diseño visual
- **v2.0**: Sistema completo premium con micro-interacciones
- **v1.5**: Gradientes dinámicos y efectos shimmer
- **v1.0**: Base inicial con Material-UI

### 🏗️ Arquitectura Técnica
- **Gestión de dependencias:** `pnpm` (ARM64 optimizado)
- **Bundler:** Vite + Rollup con soporte ARM64
- **Compatibilidad:** Windows ARM64, x64, macOS (Apple Silicon/Intel)
- **CI/CD:** Preparado para runners ARM64

### 🔮 Roadmap v2.3-v3.0
- **v2.3:** PremiumDataTable con efectos cristal
- **v2.4:** SmartAlert con recomendaciones automáticas basadas en contexto
- **v2.5:** MorphingCard con transiciones de estado dinámicas
- **v3.0:** Sistema completo de componentes premium + TypeScript nativo

---

*Este Design System es la columna vertebral visual de DR Group Dashboard. Cada actualización mantiene compatibilidad hacia atrás mientras expande las capacidades premium. Optimizado para desarrollo, accesibilidad y performance de clase mundial.*

---

## 🛠 Ejemplo de Uso en un Feature Real

```jsx
import { PremiumButton, PremiumPaper, useThemeGradients } from '../utils/designSystem';
import { motion } from 'framer-motion';

const gradients = useThemeGradients();

<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
  <PremiumPaper type="info" sx={{ background: gradients.primary }}>
    <PremiumButton variant="primary" disabled={false}>
      Acción Premium
    </PremiumButton>
  </PremiumPaper>
</motion.div>
```

---

## 📚 Archivos del Design System

- **DESIGN_SYSTEM.md:** Documentación completa y actualizada con principios, patrones y ejemplos.
- **src/utils/designSystem.js:** Componentes premium listos para usar, templates y helpers.
- **src/theme/premiumTheme.js:** Configuración centralizada del tema y tokens.
- **Storybook:** Documentación visual y testing automatizado.

---
