# 🛡️ REGLAS ESTRICTAS DS 3.0 - PREVENCIÓN DE ERRORES

## 🚨 **REGLAS OBLIGATORIAS PARA TOKENS**

### ✅ **QUÉ SÍ HACER:**

#### 1. **USAR HOOKS SEGUROS:**
```jsx
// ✅ CORRECTO - Hook con detección de tema
const tokens = useTokens();
const tableTokens = useTableTokens();

// ✅ CORRECTO - Métodos seguros
const bgColor = tokens.getSurface('secondary');
const textColor = tokens.getText('primary');
```

#### 2. **IMPORTAR CORRECTAMENTE:**
```jsx
// ✅ CORRECTO
import { unifiedTokens, enhancedTokenUtils } from '../../theme/tokens';
import { useTableTokens, useTokens } from '../../hooks/useTokens';
```

#### 3. **VALIDAR ANTES DE USAR:**
```jsx
// ✅ CORRECTO - Con fallback
const fontSize = tokens.get('typography.sizes.md', '1rem');

// ✅ CORRECTO - Verificar existencia
if (tokens.exists('colors.surface.primary')) {
  // usar token
}
```

### ❌ **QUÉ NO HACER NUNCA:**

#### 1. **NO USAR TOKENS ANTIGUOS:**
```jsx
// ❌ PROHIBIDO - Sistema antiguo
import { designTokens } from '../../theme/tokens';
const weight = designTokens.fontWeights.semiBold; // ERROR!
```

#### 2. **NO HARDCODEAR VALORES:**
```jsx
// ❌ PROHIBIDO - Valores hardcodeados
const backgroundColor = '#f8f9fa'; // NO!
const padding = '6px 8px';         // NO!
```

#### 3. **NO CREAR TOKENS INEXISTENTES:**
```jsx
// ❌ PROHIBIDO - Token que no existe
const color = unifiedTokens.colors.surface.ultraPrimary; // NO EXISTE!
```

#### 4. **NO IGNORAR EL TEMA:**
```jsx
// ❌ PROHIBIDO - Solo tema light
const bg = surfaceTokens.light.surface[2]; // No es reactivo al tema!
```

## 🔧 **PROCESO OBLIGATORIO ANTES DE USAR TOKENS:**

### 1. **VALIDACIÓN PREVIA:**
```bash
# Ejecutar validador
node src/utils/validateTokens.js
```

### 2. **VERIFICAR EN CÓDIGO:**
```jsx
// Usar método de verificación
console.log('Token existe:', tokens.exists('colors.surface.primary'));
```

### 3. **IMPLEMENTAR CON FALLBACKS:**
```jsx
// Siempre con fallback
const value = tokens.get('path.to.token', 'fallbackValue');
```

## 🎯 **TOKENS VALIDADOS Y SEGUROS:**

### ✅ **Typography Weights:**
- `unifiedTokens.typography.weights.light` (300)
- `unifiedTokens.typography.weights.regular` (400)  
- `unifiedTokens.typography.weights.medium` (500)
- `unifiedTokens.typography.weights.semiBold` (600)
- `unifiedTokens.typography.weights.bold` (700)
- `unifiedTokens.typography.weights.extraBold` (800)
- `unifiedTokens.typography.weights.black` (900)

### ✅ **Typography Sizes:**
- `unifiedTokens.typography.sizes.xs` (0.75rem)
- `unifiedTokens.typography.sizes.sm` (0.875rem)
- `unifiedTokens.typography.sizes.md` (1rem)
- `unifiedTokens.typography.sizes.lg` (1.125rem)
- `unifiedTokens.typography.sizes.xl` (1.25rem)
- `unifiedTokens.typography.sizes.2xl` (1.5rem)

### ✅ **Spacing:**
- `unifiedTokens.spacing.none` (0)
- `unifiedTokens.spacing.xs` (4px)
- `unifiedTokens.spacing.sm` (8px) 
- `unifiedTokens.spacing.md` (16px)
- `unifiedTokens.spacing.lg` (24px)
- `unifiedTokens.spacing.xl` (32px)
- `unifiedTokens.spacing.2xl` (48px)

### ✅ **Surface & Text (Con detección de tema):**
- `tokens.getSurface('primary')` - Dinámico
- `tokens.getSurface('secondary')` - Dinámico
- `tokens.getSurface('tertiary')` - Dinámico
- `tokens.getText('primary')` - Dinámico
- `tokens.getText('secondary')` - Dinámico

## 🚀 **EJEMPLO COMPLETO CORRECTO:**

```jsx
import React from 'react';
import { useTokens, useTableTokens } from '../../hooks/useTokens';

const MiComponente = () => {
  // ✅ CORRECTO - Hooks seguros
  const tokens = useTokens();
  const tableTokens = useTableTokens();

  return (
    <Box sx={{
      // ✅ CORRECTO - Métodos con detección de tema
      backgroundColor: tokens.getSurface('primary'),
      color: tokens.getText('primary'),
      padding: tokens.spacing.md,
      borderRadius: tokens.radius.small,
      
      // ✅ CORRECTO - Con fallback
      fontSize: tokens.get('typography.sizes.md', '1rem'),
      fontWeight: tokens.get('typography.weights.medium', 500)
    }}>
      <Table sx={tableTokens.containerStyle}>
        <TableHead sx={tableTokens.headerStyle}>
          {/* Contenido */}
        </TableHead>
      </Table>
    </Box>
  );
};
```

## 📋 **CHECKLIST DE VALIDACIÓN:**

- [ ] ✅ Usé hooks seguros (`useTokens`, `useTableTokens`)
- [ ] ✅ No hardcodeé valores
- [ ] ✅ No usé sistema `designTokens` antiguo  
- [ ] ✅ Implementé fallbacks donde necesario
- [ ] ✅ Verifiqué que tokens existen con `tokens.exists()`
- [ ] ✅ Usé métodos con detección de tema (`getSurface`, `getText`)
- [ ] ✅ Validé con script antes de commit

---
**ESTAS REGLAS SON OBLIGATORIAS**  
**Cualquier código que las viole será rechazado**

---

## 🆕 Nuevos tokens/variants registrados (DS 3.0)

Estas adiciones están definidas a nivel de theme (MUI Variants). Úsalas por props, nunca importando tokens crudos en componentes.

### ✅ Variants de Button
- `variant="pillGradient"` con `color="primary|secondary"`
- `variant="pillOutlineGradient"` con `color="primary|secondary"`
- `variant="softNeutral"` (neutro para acciones secundarias como Cerrar)

Uso seguro en componentes:
```jsx
// ✅ Correcto (sin acceder a tokens internos)
<Button variant="pillGradient" color="primary">Confirmar</Button>
<Button variant="pillOutlineGradient" color="secondary">Compartir</Button>
<Button variant="softNeutral">Cerrar</Button>
```

### ✅ Variants de superficies (Paper/Card)
- `Paper`/`Card` con `variant="glass"` (glassmorphism controlado)
- `Paper`/`Card` con `variant="tile"` (tile suave semántico)

Uso seguro:
```jsx
<Paper variant="glass">…</Paper>
<Card variant="tile">…</Card>
```

### ⚠️ No permitido
- Importar `designTokens` directamente en componentes para estilizar (solo permitido dentro de la configuración del tema).
- Hardcodear gradientes, sombras o radios; usa los `variants` anteriores.

### Validación previa
Antes de mergear, asegúrate de que ningún componente use `designTokens` ni valores hardcodeados para reproducir estos estilos. Deben consumirse exclusivamente vía `variant`.
