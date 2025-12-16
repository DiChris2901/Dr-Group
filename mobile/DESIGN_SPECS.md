# 📋 Especificaciones de Diseño - DR Group Mobile App

## 🌟 Material You Expressive v3.0.0 - Visual Design Only

**Versión:** 3.0.0 Visual  
**Última Actualización:** 15 de diciembre de 2025  
**Filosofía:** Material You Expressive visual puro (sin animaciones avanzadas)  
**Checkpoint Base:** `257e12e` (Baseline limpio después de revertir Reanimated 3)

---

## ⚠️ ESTADO ACTUAL DEL REDISEÑO (Diciembre 15, 2025)

### 🔄 Cambio de Estrategia (Crítico)

**Fase 1 Reanimated 3 → REVERTIDA** (problemas Worklets en Expo Go)
- ❌ Animaciones 60/120fps con Reanimated 3
- ❌ Shared Values y worklets en UI Thread
- ❌ Error: "Body is unusable: Body has already been read"

**Nueva Estrategia → Material You Expressive Visual Puro:**
- ✅ Diseño visual completo (border radius, surface colors, typography)
- ✅ Haptics para feedback táctil (Expo Haptics)
- ✅ Pressable con ripples tintados
- ✅ Surface colors para profundidad (sin sombras)
- ⏸️ Animaciones avanzadas pospuestas (requiere desarrollo build)

---

## 📊 PROGRESO DE TRANSFORMACIÓN

### ✅ **COMPLETADO (100%)**

#### **1. Pantallas Principales:**
- ✅ **AsistenciasScreen** (Asistencias laborales)
  - Header: headlineLarge, weight 600, -0.5 spacing
  - Cards: border radius 24px, surfaceContainerLow
  - Modal detalle: surfaceContainerHigh elevation
  - Buttons: Pressable + haptics + border radius 24px
  - Status badges: Surface colors contextuales

- ✅ **ReportesScreen** (Reportes de asistencias)
  - Header estandarizado (headlineLarge)
  - Color: onSurface consistente
  - Subtitle: bodyLarge onSurfaceVariant

#### **2. Módulo Novedades (3 archivos):**

- ✅ **NovedadesScreen** (Pantalla completa empleados - 2 tabs)
  - Location: `mobile/src/screens/novedades/NovedadesScreen.js`
  - Commit: `91d037f` + correcciones adicionales
  - **Transformaciones:**
    - Header: headlineLarge + subtitle bodyLarge
    - Chips tipo novedad: Pressable + haptics selectionAsync + border radius 20px
    - TextInput: outlineStyle border radius 20px
    - Botones Cámara/Archivo: Pressable + haptics + border radius 20px
    - File preview: secondaryContainer + Pressable close
    - Edit Banner: tertiaryContainer + Pressable close
    - Botón Cancelar: Pressable + haptics + error color
    - Empty State: surfaceVariant
    - SegmentedButtons: haptics onChange
    - Submit button: Pressable + border radius 24px + haptics
    - Historial cards: Pressable + surface colors + haptics
  - **Surface colors:** 16 colores completos (background, tertiary, containers)
  - **Estado:** ✅ Transformación 100%

- ✅ **NovedadesSheet** (Bottom Sheet modal rápido)
  - Location: `mobile/src/components/NovedadesSheet.js`
  - Usado en: DashboardScreen (botón flotante)
  - **Transformaciones:**
    - Header: headlineMedium weight 600, -0.5 spacing
    - Close button: Pressable + haptics + ripple tintado
    - Chips: Pressable personalizados + border radius 20px
    - TextInput: border radius 20px orgánico
    - Botón adjuntar: Pressable + haptics + outline
    - Submit button: Pressable + border radius 24px + haptics
  - **Surface colors:** 10 colores dinámicos
  - **Estado:** ✅ Transformación 100%

- ✅ **AdminNovedadesScreen** (Gestión administrador)
  - Location: `mobile/src/screens/admin/AdminNovedadesScreen.js`
  - Usado en: Navegación admin
  - **Transformaciones:**
    - Header: headlineLarge + subtitle descriptivo
    - Filter chips: Pressable + haptics + border radius 20px + iconos
    - Searchbar: border radius 20px + surfaceContainer
    - Card avatars: primaryContainer surface color
    - Status badges: Surface colors (tertiaryContainer, primaryContainer, errorContainer)
    - Typography: fontWeight '600' consistente
    - Swipe actions: Pressable + haptics impactAsync Medium
    - Modal: surfaceContainerHigh + Pressable buttons
    - Empty State: primaryContainer + surface colors
    - DetailRow: iconColor surface colors
  - **Correcciones:** 10 problemas identificados y corregidos
  - **Estado:** ✅ Transformación 100%

### ⏸️ **PENDIENTE**

#### **Pantallas sin transformar:**
- ⏸️ **DashboardScreen** (Pantalla principal) - ALTA PRIORIDAD
- ⏸️ **LoginScreen** (Autenticación) - MEDIA PRIORIDAD
- ⏸️ **CalendarioScreen** (No analizado)
- ⏸️ **NotificationsScreen** (No analizado)
- ⏸️ **AdminSettingsScreen** (No analizado)

#### **Funcionalidades adicionales:**
- ⏸️ Navigation animations (requiere Reanimated)
- ⏸️ Shared element transitions (requiere Reanimated)
- ⏸️ Skeleton loaders animados (requiere Reanimated)

---

## 🎨 Filosofía de Diseño Material You Expressive v3.0.0

---

## 🎨 Filosofía de Diseño Expressive (Gemini AI Recommendations)

**Cambio de Paradigma:**
- ❌ "Diseño sobrio y empresarial - NO spectacular" mata la creatividad
- ✅ Material You Expressive: Orgánico, suave, espacioso, con personalidad

**Principios Clave:**
1. **Formas Orgánicas** → Border radius generosos (24-48px)
2. **Tonal Elevation** → Elevation 0, jugar con surface colors
3. **Tipografía Expresiva** → Width Axis 110% para headlines más anchas
4. **Espaciado Generoso** → sectionGap 32-40px para breathing room
5. **Colores Pastel** → Paletas suaves que invitan a interactuar

---

## 🎯 Decisiones de Diseño Confirmadas (Material You Expressive)

### **1. Colores y Tema**
- ✅ **Fuente:** `material-theme.json` (Material Theme Builder)
- ✅ **Seed Color:** `#769CDF` (Azul medio suave)
- ✅ **Core Colors:**
  - Primary: `#769CDF`
  - Secondary: `#3591FF`
  - Tertiary: `#4791EF`
- ✅ **Modo por defecto:** Claro (Light Scheme)
- ✅ **Dark Mode:** Habilitado con toggle (ya implementado)
- ✅ **Paletas completas:** 19 tonos por color (0-100)
- 🆕 **Surface Colors:** Jugar con surfaceContainerLow/High en lugar de sombras

### **2. Tipografía (Material You Expressive)**
- ✅ **Fuente Única:** Roboto Flex (Variable Font)
  - Variable font oficial de Material Design 3
  - Soporta ajustes dinámicos de peso y **Width Axis**
  - Pesos: 300, 400, 500, 600, 700
- 🆕 **Width Axis:** 110% para Display y Headlines (look más ancho y expresivo)
- 🆕 **Letter Spacing:** Tight (-0.5 a -0.25) en displays grandes
- ✅ **Type Scale:** Material Design 3 oficial completo
  - Display: 44-64px (más grande para impacto)
  - Headline: 24-32px (con widthAxis 110%)
  - Title: 14-22px (subtítulos)
  - Body: 12-16px (texto general)
  - Label: 11-14px (labels y botones)

### **3. Espaciado (Material You Expressive)**
- ✅ **Sistema:** Múltiplos de 4px
- ✅ **Densidad:** Default, Comfortable, Compact
- 🆕 **Componentes (Espaciado Generoso):**
  - Card padding: 20px (16→20 para más breathing room)
  - Button padding: 24px horizontal, 10px vertical
  - Section gap: 32px (24→32 según Gemini)
  - Screen padding: 20px (16→20)
  - Touch targets mínimos: 48x48px

### **4. Bordes Redondeados (Material You Expressive - Orgánicos)**
- 🆕 **Botones:** 24px (20→24 más suaves)
- 🆕 **Cards:** 20-32px (12-24→20-32 formas orgánicas)
- 🆕 **Inputs:** 12px (4→12 más suaves)
- 🆕 **Modales:** 32px (28→32 más orgánicos)
- 🆕 **Bottom Sheets:** 32px
- 🆕 **FAB:** 24px (16→24 más redondo)
- 🆕 **Escala completa:** 8, 12, 24, 32, 48px (vs anterior 4, 8, 12, 16, 28)

### **5. Elevaciones/Sombras (Tonal Elevation - Google Expressive)**
- 🆕 **Filosofía:** Elevation 0 por defecto, eliminar sombras negras difusas
- 🆕 **Surface Colors:** Usar surfaceContainerLow/High en lugar de sombras
- 🆕 **Surface Tints:** Mantener pero con elevation 0
- 🆕 **Componentes:**
  - Cards: Elevation 0 (usar surfaceContainerLow)
  - Buttons: Elevation 0 (flat design)
  - FAB: Elevation 0 (usar primaryContainer color)
  - Modales: Elevation 0 (solo color surface)
  - Buttons filled: Nivel 0 (flat)
  - Buttons elevated: Nivel 1
  - FAB: Nivel 3
  - Modales: Nivel 3 (no 5, menos dramático)
  - App Bar: Nivel 0 (flat en M3)

### **6. Animaciones (Motion Tokens M3)**
- ✅ **Duraciones granulares:** short1-4, medium1-4, long1-4
- ✅ **Easings emphasized:** Característicos de Material 3
  - Standard: [0.2, 0.0, 0, 1.0]
  - Emphasized: [0.2, 0.0, 0, 1.0]
  - EmphasizedDecelerate: [0.05, 0.7, 0.1, 1.0]

---

## 📊 Comparación: Material 3 Standard vs Material You Expressive (Gemini)

| Aspecto | Material 3 Standard (v2.0.0) | Material You Expressive (v3.0.0) | Mejora |
|---------|------------------------------|----------------------------------|--------|
| **Border Radius** | 20px (botones), 16px (cards) | **24px (botones), 24-32px (cards)** | 🔥 +Formas orgánicas |
| **Modal Radius** | 28px | **32px** | ✅ Más suave |
| **FAB Radius** | 16px | **24px** | 🔥 Más redondeado |
| **Input Radius** | 4px (filled top) | **12px (todos los bordes)** | 🔥 Más consistente |
| **Card Padding** | 16px | **20px** | ✅ Más breathing room |
| **Section Gap** | 24px | **32px** | 🔥 Más espacioso |
| **Screen Padding** | 16px | **20px** | ✅ Más breathing room |
| **Elevación Cards** | Nivel 1 (sombras) | **Nivel 0 (surface colors)** | 🔥 Tonal elevation |
| **Elevación Buttons** | Elevated: Nivel 1 | **Todos: Nivel 0 (flat)** | 🔥 Flat design |
| **Typography Displays** | Standard weights | **Width Axis 110%** | 🔥 Headlines más anchas |
| **Display Sizes** | 36-57px | **44-64px** | 🔥 Más impacto visual |
| **Letter Spacing** | Standard | **Tight (-0.5 a -0.25)** | 🔥 Más moderno |
| **Surface Tints** | Con sombras | **Sin sombras, solo colores** | 🔥 Más limpio |
| **Filosofía** | "Sobrio empresarial" | **"Google Design Award Winner"** | 🔥🔥🔥 Transformación |

**🎯 Objetivo Gemini:** Pasar de diseño corporativo conservador a expresivo y Google-level sin perder profesionalismo.

---

## 🎨 Archivos de Diseño Disponibles

### **Existentes:**
1. ✅ `mobile/material-theme.json` - Tema completo Material Design 3
2. ✅ `mobile/design-system.json` v3.0.0 - Especificaciones Material You Expressive

### **Componentes Actuales (A Actualizar):**
1. 🔄 `SobrioCard.js` → **ExpressiveCard.js** (borderRadius 24px, elevation 0)
2. 🔄 `DetailRow.js` - Usar surfaceContainerLow en lugar de sombras
3. 🔄 `OverlineText.js` - Aplicar Width Axis 110%
4. 🔄 `ThemeContext.js` - Integrar surface colors completos

---

## 🚀 Plan de Implementación (Material You Expressive)

### **Fase 1: Integración de Tema Material You** ⏭️
**Archivos a modificar:**
- [ ] `ThemeContext.js` - Cargar `material-theme.json` completo + surface colors
- [ ] Renombrar `SobrioCard.js` → `ExpressiveCard.js` con nuevas specs
- [ ] `DetailRow.js` - Usar surfaceContainerLow, borderRadius 12px
- [ ] `OverlineText.js` - Aplicar Width Axis 110%

**Resultado:**
- ✅ Tema Material You Expressive completo integrado
- ✅ Tonal Elevation implementada (elevation 0 + surface colors)
- ✅ Formas orgánicas (border radius 24-48px)
- ✅ Componentes "Google Design Award Winner" style

---

### **Fase 2: Instalación de Roboto Flex** ⏭️
**Comandos:**
```bash
cd mobile && npx expo install expo-font @expo-google-fonts/roboto-flex
```

**Archivos a modificar:**
- [ ] `App.js` - Cargar Roboto Flex al inicio con Width Axis support
- [ ] Componentes de texto - Aplicar Width Axis 110% a headlines

**Resultado:**
- ✅ Roboto Flex (variable font único)
- ✅ Width Axis 110% para displays y headlines (look más ancho y expresivo)
- ✅ Letter spacing tight para displays grandes (-0.5 a -0.25)
- ✅ Performance optimizada (un solo font family, variable axes)

---

### **Fase 3: Actualización de Componentes Expressive** ⏭️
**Componentes a actualizar:**
- [ ] `SobrioCard.js` → Renombrar a `ExpressiveCard.js`
  - BorderRadius: 16→24px
  - Elevation: 1→0 (usar surfaceContainerLow)
  - Padding: 16→20px
- [ ] `DetailRow.js`
  - BorderRadius: 8→12px
  - Background: Transparente → surfaceContainerLow
- [ ] `OverlineText.js`
  - Width Axis: 110%
  - Letter spacing: 0.8 → más tight
- [ ] Screens (LoginScreen, DashboardScreen)
  - Section gap: 24→32px
  - Screen padding: 16→20px
- [ ] Botones
  - BorderRadius: 20→24px
  - Elevation: 0 (todos flat)
- [ ] Inputs
  - BorderRadius: 4→12px
- [ ] FAB
  - BorderRadius: 16→24px
  - Elevation: 3→0 (usar primaryContainer)

**Aplicar:**
- ✅ Formas orgánicas (border radius 24-48px)
- ✅ Tonal elevation (elevation 0 + surface colors)
- ✅ Espaciado generoso (32-40px gaps)
- ✅ Tipografía expresiva (Width Axis 110%)

---

### **Fase 4: Refinamiento y Testing** ⏭️
- [ ] Pruebas en modo claro con surface colors
- [ ] Pruebas en modo oscuro con surface colors
- [ ] Validación de contraste (accesibilidad)
- [ ] Performance de Roboto Flex con Width Axis
- [ ] Comparación visual: Before (sobrio) vs After (expressive)
- [ ] Feedback de usuarios sobre "Google-level" feel
- [ ] Ajustes finales según feedback

---

## 📐 Tokens de Diseño Clave (Material You Expressive)

### **Typography Scale (Expressive con Width Axis)**
```javascript
// Display - Grandes headlines CON WIDTH AXIS 110%
displayLarge:  64px / 400 / -0.5 / Roboto Flex / Width 110%
displayMedium: 52px / 400 / -0.25 / Roboto Flex / Width 110%
displaySmall:  44px / 400 / 0 / Roboto Flex / Width 110%

// Headline - Títulos principales CON WIDTH AXIS 110%
headlineLarge:  32px / 500 / -0.5 / Roboto Flex / Width 110%
headlineMedium: 28px / 500 / -0.25 / Roboto Flex / Width 110%
headlineSmall:  24px / 500 / 0 / Roboto Flex / Width 110%

// Title - Subtítulos (standard width)
titleLarge:  22px / 500 / 0 / Roboto Flex
titleMedium: 16px / 500 / 0.15 / Roboto Flex
titleSmall:  14px / 500 / 0.1 / Roboto Flex

// Body - Texto general (standard width)
bodyLarge:  16px / 400 / 0.5 / Roboto Flex
bodyMedium: 14px / 400 / 0.25 / Roboto Flex
bodySmall:  12px / 400 / 0.4 / Roboto Flex

// Label - Labels y botones (standard width)
labelLarge:  14px / 500 / 0.1 / Roboto Flex
labelMedium: 12px / 500 / 0.5 / Roboto Flex
labelSmall:  11px / 500 / 0.5 / Roboto Flex
```

### **Spacing Scale (Expressive - Base 4px, gaps generosos)**
```javascript
xs: 4px
sm: 8px
md: 16px (base unit)
lg: 24px
xl: 32px      // Aumentado para section gaps
xxl: 48px

// Espaciado de componentes
cardPadding: 20px         // 16→20 (más breathing room)
screenPadding: 20px       // 16→20 (más breathing room)
sectionGap: 32px          // 24→32 (según Gemini)
buttonPaddingH: 24px
minimumTouchTarget: 48px

// Densidades
default: 1.0 (mobile)
comfortable: 0.875
compact: 0.75 (tablets)
```

### **Border Radius (Material You Expressive - Orgánicos)**
```javascript
// Tokens semánticos EXPRESSIVE
extraSmall: 8px   // Chips pequeños (4→8)
small: 12px       // Chips (8→12)
medium: 24px      // Cards pequeñas (12→24)
large: 32px       // Cards estándar (16→32)
extraLarge: 48px  // Modales, bottom sheets (28→48)

// Componentes EXPRESSIVE
button: 24px       // Todos los tipos (20→24 más orgánico)
card: 20-32px      // Variable según tamaño (12-24→20-32)
input: 12px        // Todos los bordes (4→12 más suave)
modal: 32px        // Más orgánico (28→32)
fab: 24px          // Más redondeado (16→24)
chip: 16px
avatar: 9999px (circular)
```

### **Elevation Levels (Tonal Elevation - Google Expressive)**
```javascript
// FILOSOFÍA: Elevation 0 por defecto, usar surface colors
0: { elevation: 0, tint: 0, surface: 'surface' }
1: { elevation: 0, tint: 0.05, surface: 'surfaceContainerLow' }
2: { elevation: 0, tint: 0.08, surface: 'surfaceContainer' }
3: { elevation: 0, tint: 0.11, surface: 'surfaceContainerHigh' }
4: { elevation: 1, tint: 0.14, surface: 'surfaceContainerHighest' }  // Solo para pressed
5: { elevation: 2, tint: 0.16, surface: 'surfaceVariant' }           // Máximo (raro)

// Componentes (la mayoría en elevation 0)
card: 1 (surfaceContainerLow)
button.filled: 0 (flat)
button.elevated: 0 (flat, NO sombras)
fab: 0 (usar primaryContainer color)
modal: 0 (surface color, sin sombras)
appBar: 0 (flat)
```

### **Animation Tokens (Motion M3 - Sin cambios)**
```javascript
// Duraciones granulares
short1-4:     50-200ms   // Micro-interacciones
medium1-4:    250-400ms  // Transiciones estándar
long1-4:      450-600ms  // Transiciones complejas
extraLong1-4: 700-1000ms // Animaciones elaboradas

// Easings emphasized (característico M3)
standard:              [0.2, 0.0, 0, 1.0]
emphasizedDecelerate:  [0.05, 0.7, 0.1, 1.0]  // Entrada
emphasizedAccelerate:  [0.3, 0.0, 0.8, 0.15]  // Salida
```

---

## 🎨 Paleta de Colores Light Mode (Principales + Surface Colors)

```javascript
// Colores principales
primary: #415F91
onPrimary: #FFFFFF
primaryContainer: #D6E3FF
onPrimaryContainer: #284777

secondary: #3E5F90
onSecondary: #FFFFFF
secondaryContainer: #D5E3FF
onSecondaryContainer: #254777

// Surface colors (CRÍTICOS para Tonal Elevation)
surface: #F9F9FF
onSurface: #191C20
surfaceVariant: #DFE2EB
onSurfaceVariant: #43474E
surfaceContainerLowest: #FFFFFF
surfaceContainerLow: #F3F3FA
surfaceContainer: #EDEEF4
surfaceContainerHigh: #E7E8EE
surfaceContainerHighest: #E2E2E9

background: #F9F9FF
onBackground: #191C20

error: #BA1A1A
onError: #FFFFFF
errorContainer: #FFDAD6
onErrorContainer: #93000A
```

---

## 🌙 Paleta de Colores Dark Mode (Principales + Surface Colors)

```javascript
// Colores principales
primary: #AAC7FF
onPrimary: #0A305F
primaryContainer: #284777
onPrimaryContainer: #D6E3FF

secondary: #A8C8FF
onSecondary: #05305F
secondaryContainer: #254777
onSecondaryContainer: #D5E3FF

// Surface colors (CRÍTICOS para Tonal Elevation)
surface: #111318
onSurface: #E2E2E9
surfaceVariant: #43474E
onSurfaceVariant: #C3C6CF
surfaceContainerLowest: #0C0E13
surfaceContainerLow: #191C20
surfaceContainer: #1D2024
surfaceContainerHigh: #282A2F
surfaceContainerHighest: #32353A

background: #111318
onBackground: #E2E2E9

error: #FFB4AB
onError: #690005
errorContainer: #93000A
onErrorContainer: #FFDAD6
```

**🔥 CRÍTICO EXPRESSIVE:** Los surface colors (surfaceContainerLow, surfaceContainerHigh, etc.) reemplazan las sombras negras tradicionales. Usar estos colores para crear profundidad visual en lugar de elevation shadows.

---

## ✅ Checklist de Implementación (Material You Expressive)

### **Pre-requisitos:**
- [x] Material theme JSON generado (Material Theme Builder)
- [x] Design system documentado v3.0.0 (Expressive)
- [x] Decisiones de diseño confirmadas (Gemini recommendations)
- [x] Fuente seleccionada: Roboto Flex (variable font con Width Axis)

### **Fase 1: Tema Expressive**
- [ ] Integrar material-theme.json en ThemeContext
- [ ] Agregar surface colors completos (surfaceContainerLow/High/etc.)
- [ ] Actualizar helpers (getPrimaryColor, getSurfaceColor, etc.)
- [ ] Soporte completo light/dark mode con surface colors
- [ ] Testing de cambio de tema (light ↔ dark)

### **Fase 2: Roboto Flex con Width Axis**
- [ ] Instalar @expo-google-fonts/roboto-flex
- [ ] Configurar carga en App.js con useFonts hook
- [ ] Crear helper para Width Axis 110% (headlines)
- [ ] Aplicar Roboto Flex a todos los componentes de texto
- [ ] Testing de performance (variable font)

### **Fase 3: Componentes Expressive**
- [ ] Renombrar SobrioCard → ExpressiveCard
  - BorderRadius: 16→24px
  - Elevation: 1→0, usar surfaceContainerLow
  - Padding: 16→20px
- [ ] Actualizar DetailRow
  - BorderRadius: 8→12px
  - Background: surfaceContainerLow
- [ ] Actualizar OverlineText
  - Width Axis: 110%
  - Letter spacing: tight
- [ ] Crear Button component estandarizado
  - BorderRadius: 24px (todos los tipos)
  - Elevation: 0 (flat design)
- [ ] Crear Input component estandarizado
  - BorderRadius: 12px (todos los bordes)

### **Fase 4: Screens Expressive**
- [ ] Actualizar LoginScreen
  - Section gap: 24→32px
  - Screen padding: 16→20px
  - Aplicar ExpressiveCard
- [ ] Actualizar DashboardScreen
  - Section gap: 24→32px
  - Screen padding: 16→20px
  - Aplicar surface colors en lugar de sombras
- [ ] Actualizar FAB (si existe)
  - BorderRadius: 16→24px
  - Elevation: 3→0, usar primaryContainer

### **Fase 5: Validación Expressive**
- [ ] Contraste de colores (WCAG AA) con surface colors
- [ ] Touch targets (mínimo 48px)
- [ ] Performance de Roboto Flex con Width Axis
- [ ] Testing en dispositivo real (Android/iOS)
- [ ] Comparación visual: Sobrio vs Expressive
- [ ] Feedback de usuarios sobre "Google Design Award Winner" feel

---

## 🚦 Semáforo de Estado

| Fase | Estado | Progreso |
|------|--------|----------|
| **Diseño Expressive** | ✅ Completo | 100% |
| **Documentación v3.0.0** | ✅ Completo | 100% |
| **Especificaciones Gemini** | ✅ Aplicadas | 100% |
| **Implementación Tema** | ⏸️ Pendiente aprobación | 0% |
| **Implementación Fuentes** | ⏸️ Pendiente aprobación | 0% |
| **Actualización Componentes** | ⏸️ Pendiente aprobación | 0% |
| **Testing** | ⏸️ Pendiente aprobación | 0% |

---

## 🎯 Resumen de Cambios Aplicados (v2.0.0 → v3.0.0)

### **🔄 Transformación de Diseño:**
**De:** Material 3 Standard (sobrio empresarial)  
**A:** Material You Expressive (Google Design Award Winner)

### **📋 Cambios Implementados en Especificaciones:**

1. **Border Radius Orgánicos:**
   - Botones: 20px → **24px** (+20%)
   - Cards: 12-24px → **20-32px** (+33-66%)
   - Modales: 28px → **32px** (+14%)
   - FAB: 16px → **24px** (+50%)
   - Inputs: 4px → **12px** (+200%)

2. **Tonal Elevation (Sin Sombras):**
   - Cards: Elevation 1 → **0** (usar surfaceContainerLow)
   - Buttons: Elevation 0/1 → **0** (todos flat)
   - FAB: Elevation 3 → **0** (usar primaryContainer)
   - Modales: Elevation 3 → **0** (surface color)

3. **Tipografía Expresiva:**
   - Displays: +7-14% tamaño (64px max vs 57px)
   - Width Axis: **110%** en displays y headlines
   - Letter spacing: **Tight** (-0.5 a -0.25) en grandes

4. **Espaciado Generoso:**
   - Card padding: 16px → **20px** (+25%)
   - Section gap: 24px → **32px** (+33%)
   - Screen padding: 16px → **20px** (+25%)

5. **Surface Colors:**
   - Agregados: surfaceContainerLow/High/Highest/Lowest
   - Uso: Reemplazan sombras para crear profundidad visual

### **🆕 Componentes Renombrados:**
- `SobrioCard` → `ExpressiveCard`

### **📚 Archivos Actualizados:**
- ✅ `design-system.json` v2.0.0 → v3.0.0
- ✅ `DESIGN_SPECS.md` - Documentación completa actualizada

---

## 💡 Próximo Paso: **CONFIRMACIÓN REQUERIDA**

**🚨 ANTES DE APLICAR EL CÓDIGO:**

Las especificaciones están **100% documentadas** según las recomendaciones de Gemini AI (Lead Designer de Google). Los archivos `design-system.json` y `DESIGN_SPECS.md` reflejan el enfoque "Material You Expressive" completo.

**¿Confirmas que quieres aplicar estos cambios al código de la app móvil?**

### **Lo que se implementará:**
1. ✅ Actualizar `ThemeContext.js` con surface colors completos
2. ✅ Renombrar y actualizar `SobrioCard` → `ExpressiveCard`
3. ✅ Actualizar todos los border radius (24-48px orgánicos)
4. ✅ Eliminar sombras, usar Tonal Elevation (surface colors)
5. ✅ Instalar Roboto Flex con Width Axis support
6. ✅ Aplicar tipografía expresiva (110% width en headlines)
7. ✅ Actualizar espaciados generosos (32px gaps)

### **Impacto:**
- 🎨 Transformación visual completa de la app
- 📱 "Google Design Award Winner" look según Gemini
- 🔥 Cambios extensivos en componentes existentes
- ⚡ Requiere testing exhaustivo post-implementación

**Responde:**
- ✅ **"Confirmo, aplica los cambios"** → Procedo con implementación completa
- ⏸️ **"Espera, quiero revisar primero"** → Te explico más detalles
- ❌ **"No, mantén Material 3 Standard"** → Revierto especificaciones a v2.0.0

---

## 📞 ¿Qué prefieres hacer ahora?

1. **Proceder con Fase 1** (Integración de Tema Material 3)
2. **Proceder con todo** (Implementación completa automática)
3. **Revisar algo específico** antes de implementar
4. **Ajustar alguna decisión** de diseño

**Estoy listo para implementar cuando lo autorices.** 🚀
