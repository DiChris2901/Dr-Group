# 🚨 CORRECCIÓN INMEDIATA - ERRORES CRÍTICOS DS 3.0

## ❌ **8 ERRORES CRÍTICOS ENCONTRADOS**

El validador ha identificado archivos que aún usan el sistema `designTokens` antiguo.
**ESTOS ARCHIVOS BLOQUEAN COMMITS** hasta ser corregidos.

### 🔧 **CORRECCIONES REQUERIDAS:**

#### 1. **FormulariosUnificados.jsx**
- **Error**: `designTokens` usado 18 veces + import prohibido
- **Acción**: Reemplazar con `unifiedTokens` y hooks seguros

#### 2. **layout/Topbar.jsx**  
- **Error**: `designTokens` usado 91 veces
- **Acción**: Migración completa a DS 3.0

#### 3. **useTokens.js**
- **Error**: `designTokens` usado 3 veces  
- **Acción**: Limpiar referencias residuales

#### 4. **DesignSystemTestPage.jsx**
- **Error**: Import de `designTokens`
- **Acción**: Actualizar imports

#### 5. **theme/tokens/index.js**
- **Error**: `designTokens` usado 3 veces
- **Acción**: Limpiar sistema tokens

#### 6. **tokenValidator.js**
- **Error**: Referencias en validador mismo
- **Acción**: Limpiar auto-referencias

## ⚡ **SOLUCIÓN RÁPIDA:**

### **PASO 1:** Buscar y Reemplazar Global
```bash
# Buscar todas las referencias
npm run validate-tokens

# Ver archivos con problemas específicos
```

### **PASO 2:** Patrones de Reemplazo
```jsx
// ❌ ANTES (Prohibido)
import { designTokens } from '../../theme/tokens';
const weight = designTokens.fontWeights.semiBold;

// ✅ DESPUÉS (Correcto)  
import { useTokens } from '../../hooks/useTokens';
const tokens = useTokens();
const weight = tokens.typography.weights.semiBold;
```

### **PASO 3:** Validación
```bash
# Ejecutar después de cada corrección
npm run validate-tokens

# Objetivo: 0 errores críticos
```

## 🎯 **PRIORIDAD ALTA:**

1. **Topbar.jsx** (91 ocurrencias) - Mayor impacto
2. **FormulariosUnificados.jsx** (18 ocurrencias)  
3. **useTokens.js** (3 ocurrencias) - Crítico para sistema
4. **theme/tokens/index.js** (3 ocurrencias) - Core del sistema

## ✅ **VERIFICACIÓN FINAL:**

Una vez corregidos todos los errores:
```bash
npm run validate-tokens
# Resultado esperado: ✅ PERFECTO! Todos los tokens son válidos
```

---
**🚨 IMPORTANTE:** 
- No hacer commits hasta resolver estos 8 errores críticos
- El validador bloquea automáticamente commits problemáticos
- Seguir REGLAS_TOKENS_DS_3.0_ESTRICTAS.md para evitar futuros errores
