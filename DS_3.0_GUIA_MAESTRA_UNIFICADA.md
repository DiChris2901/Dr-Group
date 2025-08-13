# 🎨 GUÍA MAESTRA DS 3.0 - DESIGN SYSTEM UNIFICADO

> **📂 Documentación completa:** `docs/design-system-3.0/`  
> **🛡️ Validación:** `npm run validate-tokens`  
> **⚡ Corrección rápida:** `docs/design-system-3.0/CORRECCION_ERRORES_CRITICOS_DS_3.0.md`

## 📋 **ÍNDICE DE CONTENIDO**
- [📐 Sistema de Tokens](#sistema-de-tokens)
- [🎨 Elementos Visuales](#elementos-visuales)  
- [🛡️ Validación y Errores](#validación-y-errores)
- [🔧 Implementación Práctica](#implementación-práctica)
- [📚 Referencias Rápidas](#referencias-rápidas)

---

## 📐 **SISTEMA DE TOKENS**

### ✅ **ESTRUCTURA CORRECTA:**
```jsx
// ✅ CORRECTO - Imports seguros
import { useTokens, useTableTokens } from '../../hooks/useTokens';
import { unifiedTokens } from '../../theme/tokens';

// ✅ CORRECTO - Uso en componentes
const tokens = useTokens();
const tableTokens = useTableTokens();
```

### ❌ **PROHIBICIONES ABSOLUTAS:**
```jsx
// ❌ PROHIBIDO - Sistema antiguo
import { designTokens } from '../../theme/tokens';
const weight = designTokens.fontWeights.semiBold; // NO EXISTE!

// ❌ PROHIBIDO - Hardcoding
const color = '#f8f9fa';        // Usar tokens
const padding = '6px 8px';      // Usar tokens
const fontSize = '14px';        // Usar tokens
```

### 🎯 **TOKENS VALIDADOS:**

#### **Typography:**
```jsx
// ✅ Pesos tipográficos disponibles
typography.weights.light      // 300
typography.weights.regular    // 400  
typography.weights.medium     // 500
typography.weights.semiBold   // 600 ✅ SÍ EXISTE
typography.weights.bold       // 700
typography.weights.extraBold  // 800
typography.weights.black      // 900

// ✅ Tamaños tipográficos
typography.sizes.xs    // 0.75rem
typography.sizes.sm    // 0.875rem
typography.sizes.md    // 1rem
typography.sizes.lg    // 1.125rem
typography.sizes.xl    // 1.25rem
typography.sizes.2xl   // 1.5rem
```

#### **Spacing:**
```jsx
spacing.none  // 0
spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 16px
spacing.lg    // 24px
spacing.xl    // 32px
spacing.2xl   // 48px
```

#### **Border Radius:**
```jsx
radius.none    // 0
radius.small   // 1px
radius.medium  // 4px
radius.large   // 8px
radius.full    // 50%
```

---

## 🎨 **ELEMENTOS VISUALES SPECTACULAR**

### ✅ **GRADIENTES PERMITIDOS:**
```jsx
// ✅ Gradientes spectacular originales
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
```

### ✅ **EFECTOS GLASSMORPHISM:**
```jsx
// ✅ Efectos spectacular completos
backdropFilter: 'blur(20px)'
boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
background: 'rgba(255, 255, 255, 0.1)'
border: '1px solid rgba(255, 255, 255, 0.18)'
```

### ✅ **ANIMACIONES SPECTACULAR:**
```jsx
// ✅ Transiciones suaves
transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'

// ✅ Framer Motion effects
initial: { opacity: 0, y: 20, scale: 0.95 }
animate: { opacity: 1, y: 0, scale: 1 }
whileHover: { scale: 1.05, y: -4 }

// ✅ Efectos shimmer
animation: 'shimmer 3s infinite'
```

### ✅ **TIPOGRAFÍA SIN RESTRICCIONES:**
```jsx
// ✅ TODOS los pesos permitidos
fontWeight: 300  // Light
fontWeight: 400  // Regular
fontWeight: 500  // Medium
fontWeight: 600  // Semi-bold
fontWeight: 700  // Bold ✅ PERMITIDO
fontWeight: 800  // Extra-bold ✅ PERMITIDO
fontWeight: 900  // Black ✅ PERMITIDO
```

---

## 🛡️ **VALIDACIÓN Y PREVENCIÓN DE ERRORES**

### 🚨 **SISTEMA AUTOMÁTICO:**
```bash
# Validar tokens antes de commit
npm run validate-tokens

# Pre-commit automático
npm run pre-commit
```

### ❌ **ERRORES QUE BLOQUEAN COMMITS:**
1. Uso de `designTokens` (sistema obsoleto)
2. Imports prohibidos del sistema antiguo
3. Referencias a tokens inexistentes
4. Hardcoding de colores hex (#f8f9fa)
5. Hardcoding de spacing (6px 8px)

### ⚠️ **ADVERTENCIAS (NO BLOQUEAN):**
- Colores hardcodeados (se recomienda migrar)
- Spacing hardcodeado (se recomienda migrar)
- Falta de hooks seguros (se recomienda usar)

---

## 🔧 **IMPLEMENTACIÓN PRÁCTICA**

### 🎯 **HOOKS SEGUROS (RECOMENDADO):**
```jsx
import { useTokens, useTableTokens } from '../../hooks/useTokens';

const MiComponente = () => {
  const tokens = useTokens();
  const tableTokens = useTableTokens();

  return (
    <Box sx={{
      // ✅ Detección automática de tema (light/dark)
      backgroundColor: tokens.getSurface('primary'),
      color: tokens.getText('primary'),
      
      // ✅ Tokens directos
      padding: tokens.spacing.md,
      borderRadius: tokens.radius.small,
      fontSize: tokens.typography.sizes.md,
      fontWeight: tokens.typography.weights.medium
    }}>
      <Table sx={tableTokens.containerStyle}>
        {/* Contenido */}
      </Table>
    </Box>
  );
};
```

### 🎯 **TOKENS DIRECTOS (ALTERNATIVA):**
```jsx
import { unifiedTokens } from '../../theme/tokens';

const estilos = {
  padding: unifiedTokens.spacing.md,
  borderRadius: unifiedTokens.radius.small,
  fontSize: unifiedTokens.typography.sizes.md,
  fontWeight: unifiedTokens.typography.weights.semiBold
};
```

### 🎯 **CON FALLBACKS (MÁS SEGURO):**
```jsx
const tokens = useTokens();

const valor = tokens.get('typography.sizes.md', '1rem'); // Con fallback
const existe = tokens.exists('colors.surface.primary');  // Verificar
```

---

## 📚 **REFERENCIAS RÁPIDAS**

### 🔍 **COMANDOS ÚTILES:**
```bash
# Validar sistema completo
npm run validate-tokens

# Ver errores específicos
npm run validate-tokens | grep "❌"

# Generar reporte detallado
# (se guarda automáticamente en token-validation-report.json)
```

### 🎨 **PALETA DE COLORES SPECTACULAR:**
- **Primary**: `#667eea` → `#764ba2`
- **Secondary**: `#f093fb` → `#f5576c`  
- **Tertiary**: `#a8edea` → `#fed6e3`
- **Accent**: `#ffecd2` → `#fcb69f`

### 📐 **ESPACIADO ESTÁNDAR:**
- **xs**: 4px (elementos muy pequeños)
- **sm**: 8px (elementos pequeños)
- **md**: 16px (estándar general)
- **lg**: 24px (secciones)
- **xl**: 32px (bloques grandes)
- **2xl**: 48px (separación mayor)

### 🔄 **TRANSICIONES ESTÁNDAR:**
- **Rápida**: `0.2s ease-out` (hover, focus)
- **Normal**: `0.3s ease-in-out` (estados)
- **Suave**: `0.6s cubic-bezier(0.4, 0, 0.2, 1)` (spectacular)

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [ ] ✅ Uso hooks seguros (`useTokens`, `useTableTokens`)
- [ ] ✅ No hardcodeo valores (colores, spacing, etc.)
- [ ] ✅ No uso sistema `designTokens` antiguo
- [ ] ✅ Implemento fallbacks donde necesario
- [ ] ✅ Valido tokens con `tokens.exists()`
- [ ] ✅ Uso métodos theme-aware (`getSurface`, `getText`)
- [ ] ✅ Ejecuto validador antes de commit
- [ ] ✅ Sigo efectos spectacular (gradientes, glassmorphism)
- [ ] ✅ Mantengo elegancia empresarial
- [ ] ✅ Todos los pesos tipográficos permitidos

---

**🎨 DESIGN SYSTEM 3.0 - SPECTACULAR & ENTERPRISE**  
*Guía maestra unificada para implementación consistente*
