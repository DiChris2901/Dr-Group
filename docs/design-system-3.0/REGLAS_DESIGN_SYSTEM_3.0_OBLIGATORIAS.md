# REGLAS DESIGN SYSTEM 3.0 OBLIGATORIAS - DR GROUP DASHBOARD

## ⚠️ PREREQUISITO FUNDAMENTAL: REGLAS DE DESARROLLO OBLIGATORIAS
**ANTES DE APLICAR DS 3.0, SE DEBEN CUMPLIR OBLIGATORIAMENTE:**
- 📋 **SEGUIR `REGLAS_DESARROLLO_OBLIGATORIAS.md`** al pie de la letra
- 🔒 **PROTOCOLO DE BACKUP** según reglas### **🛡️ RECUPERACIÓN DE ERRORES DS 3.0**
1. **ERROR IMPORT TOKENS**: 
   - Usar `semantic_search("designTokens")` para ver tokens reales
   - Verificar ruta import `from '../theme/tokens'`
   - Confirmar typos en nombres (`tokenUtils` no `tokensUtils`)
2. **ERROR TOKENS INEXISTENTES**: 
   - Usar `read_file("/theme/tokens/index.js")` para ver exports
   - No usar nombres inventados, solo nombres verificados
3. **ERROR GRADIENTES**: Verificar variant (full/soft) correcto
4. **ERROR ANIMACIONES**: Confirmar framer-motion props
5. **ERROR RESPONSIVE**: Verificar tokens spacing responsive
6. **ROLLBACK COMPLETO**: `cp archivo.backup → archivo.jsx`sarrollo
- 🔍 **VERIFICACIÓN GET_ERRORS()** según reglas de desarrollo  
- 💾 **COMMITS DESCRIPTIVOS** según reglas de desarrollo
- 🚨 **AUTORIZACIÓN PREVIA** según reglas de desarrollo
- 📝 **CHECKLIST COMPLETO** según reglas de desarrollo

**ESTAS REGLAS DS 3.0 SE COMPLEMENTAN Y REFUERZAN LAS REGLAS DE DESARROLLO OBLIGATORIAS**

## ⚠️ AVISO DE CUMPLIMIENTO PERMANENTE DS 3.0
**ESTAS REGLAS SON DE CUMPLIMIENTO OBLIGATORIO:**
- Durante TODA la implementación de DS 3.0
- Desde el PRIMER token hasta el ÚLTIMO componente
- En CADA modificación visual y estilística
- Sin EXCEPCIÓN ni EXCUSA alguna
- En TODOS los componentes y features
- Por TODOS los desarrolladores
- **SIGUIENDO SIEMPRE LAS REGLAS DE DESARROLLO OBLIGATORIAS COMO BASE**

## 🚫 NO SE PERMITEN:
- Colores hardcodeados fuera del sistema de tokens
- Gradientes custom que no estén tokenizados
- Animaciones que no usen framer-motion tokenizado
- Estilos inline que rompan la coherencia
- Excepciones temporales "para después arreglar"
- Componentes sin tokens spectacular
- **IMPORTS INCORRECTOS DE TOKENS** (nombres inventados, rutas erróneas)
- **TOKENS INEXISTENTES** (usar nombres que no existen en el sistema)
- **IMPORTS SIN VERIFICAR** (no confirmar que el token existe antes de usar)

## 🚨 PROTOCOLO OBLIGATORIO DS 3.0 - CUMPLIMIENTO AL PIE DE LA LETRA

## 📋 0.1. VERIFICACIÓN DE TOKENS ANTES DE IMPORTAR (CRÍTICO)
### **🔍 PROTOCOLO ANTI-ERRORES DE IMPORTACIÓN**
- [ ] **LISTAR TOKENS DISPONIBLES**: Usar `semantic_search("designTokens")` para ver tokens
- [ ] **VERIFICAR ESTRUCTURA**: Usar `list_dir("/theme/tokens/")` para ver archivos
- [ ] **LEER INDEX TOKENS**: Usar `read_file("/theme/tokens/index.js")` para ver exports
- [ ] **VERIFICAR MÓDULO ESPECÍFICO**: Leer archivo token específico antes de importar
- [ ] **COPIAR NOMBRES EXACTOS**: Copiar nombres de tokens tal como aparecen en código
- [ ] **NO INVENTAR NOMBRES**: Jamás asumir nombres de tokens sin verificar

### **🛡️ IMPORTS SEGUROS OBLIGATORIOS**
```jsx
// ❌ PROHIBIDO (nombres inventados):
import { primaryGradient, spectacularAnimation } from '../theme/tokens'

// ✅ OBLIGATORIO (verificar primero con semantic_search/read_file):
// 1. Verificar que existe designTokens.gradients.primary.full
// 2. Verificar que existe tokenUtils.animations.createEntranceProps
import { designTokens, tokenUtils, cardsUtils } from '../theme/tokens'
```

### **🔍 CHECKLIST VERIFICACIÓN DE TOKENS**
- [ ] **¿Existe el archivo token?**: `/theme/tokens/gradients.js`
- [ ] **¿Está exportado en index?**: Verificar export en `/theme/tokens/index.js`
- [ ] **¿El nombre es exacto?**: `designTokens.gradients.primary.full` (no inventar)
- [ ] **¿La ruta es correcta?**: `from '../theme/tokens'` (verificar niveles)
- [ ] **¿Hay typos?**: `tokenUtils` no `tokensUtils`, `cardsUtils` no `cardUtils`

## 🔒 0. PREPARACIÓN Y TOKENS (OBLIGATORIO)
- [ ] **CUMPLIR REGLAS DE DESARROLLO**: Seguir `REGLAS_DESARROLLO_OBLIGATORIAS.md` completamente
- [ ] **VERIFICAR ESTRUCTURA TOKENS**: Confirmar estructura `/theme/tokens/` existe
- [ ] **VERIFICAR ARCHIVOS TOKENS**: Listar archivos disponibles en `/theme/tokens/`
- [ ] **VERIFICAR EXPORTS TOKENS**: Confirmar exports correctos en cada archivo token
- [ ] **VERIFICAR INDEX TOKENS**: Confirmar `index.js` exporta todos los módulos
- [ ] **BACKUP COMPONENTE**: Crear .backup antes de aplicar DS 3.0 (según reglas de desarrollo)
- [ ] **SERVIDOR ACTIVO**: Verificar localhost funcionando
- [ ] **GET_ERRORS() INICIAL**: Verificar estado sin errores (según reglas de desarrollo)
- [ ] **LISTAR CAMBIOS DS 3.0 Y SOLICITAR AUTORIZACIÓN**: Antes de aplicar DS 3.0, listar detalladamente los cambios spectacular y esperar autorización expresa (según reglas de desarrollo).

## 🎨 1. TOKENS OBLIGATORIOS (CRÍTICO)
### **🌈 GRADIENTES - USO OBLIGATORIO**
- [ ] **GRADIENTES TOKENIZADOS**: Solo usar `designTokens.gradients.primary.full`
- [ ] **NUNCA HARDCODEAR**: Prohibido `linear-gradient(...)` directo
- [ ] **VARIANTS CORRECTOS**: `full` para protagonistas, `soft` para fondos
- [ ] **THEME INTEGRATION**: Usar `theme.custom.gradientsV2.primary.full`

```jsx
✅ CORRECTO:
background: designTokens.gradients.primary.full
background: tokenUtils.gradients.getGradient('primary', 'full')
background: theme.custom.gradientsV2.secondary.soft

❌ PROHIBIDO:
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
background: '#667eea'
```

### **🎬 ANIMACIONES - FRAMER MOTION TOKENIZADO**
- [ ] **SOLO TOKENS ANIMACIÓN**: Usar `tokenUtils.animations.*`
- [ ] **DURATIONS TOKENIZADAS**: `baseAnimationTokens.durations.spectacular`
- [ ] **EASINGS TOKENIZADOS**: `baseAnimationTokens.easings.spectacular`
- [ ] **ENTRANCE PROPS**: `tokenUtils.animations.createEntranceProps()`

```jsx
✅ CORRECTO:
<motion.div {...tokenUtils.animations.createEntranceProps('fadeInUp', 0.1)}>
<motion.div {...tokenUtils.animations.createHoverProps('scale')}>
transition={{ duration: baseAnimationTokens.durations.spectacular }}

❌ PROHIBIDO:
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
transition={{ duration: 0.3 }}
```

### **🎴 COMPONENTES - CARDS Y CONTAINERS**
- [ ] **CARDS TOKENIZADAS**: Usar `cardsUtils.createPaperAccent()`
- [ ] **SHADOWS TOKENIZADAS**: `designTokens.shadows.soft`
- [ ] **SPACING TOKENIZADO**: `designTokens.spacing.spectacular`
- [ ] **BORDER RADIUS**: `designTokens.borderRadius.spectacular`

```jsx
✅ CORRECTO:
<Paper {...cardsUtils.createPaperAccent('primary', 'large')}>
boxShadow: designTokens.shadows.medium
padding: designTokens.spacing.component.large

❌ PROHIBIDO:
<Paper sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
padding: 24
```

## 🛠️ 2. IMPLEMENTACIÓN CONTROLADA DS 3.0
### **📝 ORDEN DE APLICACIÓN OBLIGATORIO**
1. **VERIFICAR TOKENS DISPONIBLES**: Revisar `/theme/tokens/` para el componente
2. **IMPORTAR TOKENS**: `import { designTokens, tokenUtils, cardsUtils } from '../theme/tokens'`
3. **APLICAR POR CAPAS**:
   - Primero: Gradientes de fondo
   - Segundo: Spacing y layout
   - Tercero: Tipografía tokenizada
   - Cuarto: Animaciones spectacular
   - Quinto: Componentes especializados

### **🔍 VERIFICACIÓN CONTINUA DS 3.0**
- [ ] **GET_ERRORS()**: Verificar sin errores tras cada aplicación DS 3.0 (según reglas de desarrollo)
- [ ] **LOCALHOST VISUAL**: Confirmar spectacular rendering
- [ ] **CONSOLE DEVTOOLS**: Sin warnings de tokens
- [ ] **RESPONSIVE CHECK**: Funcional en mobile/desktop
- [ ] **ANIMATION SMOOTH**: Transiciones spectacular fluidas
- [ ] **PROTOCOL COMPLIANCE**: Seguir protocolo de las reglas de desarrollo obligatorias

## 📊 3. COMPONENTES ESPECÍFICOS DS 3.0

### **🔘 BOTONES SPECTACULAR**
- [ ] **BUTTON UTILS**: `tokenUtils.buttons.createButtonProps()`
- [ ] **GRADIENT BUTTONS**: `designTokens.gradientButtons.primary`
- [ ] **STATES TOKENIZED**: `designTokens.buttonStates.hover`

```jsx
✅ CORRECTO:
<Button {...tokenUtils.buttons.createButtonProps('contained', 'primary', 'large')}>
<Button sx={{ background: designTokens.gradientButtons.primary.full }}>

❌ PROHIBIDO:
<Button sx={{ background: '#667eea' }}>
```

### **📄 FORMULARIOS SPECTACULAR**
- [ ] **FORM UTILS**: `formUtils.createFieldProps()`
- [ ] **VALIDATION FEEDBACK**: `tokenUtils.feedback.createAlertProps()`
- [ ] **MÁSCARAS TOKENIZADAS**: `formatCOP()`, `formatPhone()`, `formatNIT()`

```jsx
✅ CORRECTO:
<TextField {...formUtils.createFieldProps('outlined', 'primary')}>
value={formatCOP(amount)}
{...tokenUtils.feedback.createAlertProps('error', true)}

❌ PROHIBIDO:
<TextField sx={{ '& .MuiOutlinedInput-root': { borderColor: '#667eea' } }}>
```

### **📋 TABLAS SPECTACULAR**
- [ ] **TABLE TOKENS**: `designTokens.tableBase.spectacular`
- [ ] **PAGINATION TOKENS**: `designTokens.pagination.spectacular`
- [ ] **ROW HOVER**: `tokenUtils.tables.createRowHover()`

## 🎯 4. VALIDACIÓN SPECTACULAR INTEGRAL

### **🔍 CHECKLIST OBLIGATORIO DS 3.0**
- [ ] **TOKENS ONLY**: Cero estilos hardcodeados
- [ ] **GRADIENTES SPECTACULAR**: Solo tokens gradients
- [ ] **ANIMACIONES SMOOTH**: Solo framer-motion tokenizado
- [ ] **SPACING CONSISTENT**: Solo spacing tokens
- [ ] **TYPOGRAPHY SCALE**: Solo typography tokens
- [ ] **RESPONSIVE PERFECT**: Funcional todos los dispositivos

### **📱 PRUEBAS SPECTACULAR**
- [ ] **DESKTOP**: 1920x1080 spectacular rendering
- [ ] **TABLET**: 768x1024 responsive perfecto
- [ ] **MOBILE**: 375x667 mobile-first spectacular
- [ ] **DARK MODE**: Theme switching perfecto
- [ ] **ANIMATIONS**: 60fps smooth spectacular

## 📦 5. COMMIT DS 3.0 ESPECÍFICO

### **🏷️ COMMITS SPECTACULAR**
- [ ] **SEGUIR REGLAS DE DESARROLLO**: Commits según `REGLAS_DESARROLLO_OBLIGATORIAS.md`
- [ ] **PREFIX DS3**: `🎨 DS3: Apply tokens to ComponentName`
- [ ] **DESCRIPTIVO**: Mencionar tokens aplicados específicamente
- [ ] **TAG VERSIÓN**: `git tag -a ds3.1.x -m "DS3 tokens component"`
- [ ] **AUTORIZACIÓN PREVIA**: Solicitar autorización según reglas de desarrollo

```bash
✅ CORRECTO (siguiendo reglas de desarrollo):
git commit -m "🎨 DS3: Apply gradients + animations to CommitmentCard"
git commit -m "🎨 DS3: Tokenize buttons with spectacular effects"

❌ PROHIBIDO:
git commit -m "Update styles"
git commit -m "Fix colors"
```

## ⚠️ 6. ERRORES CRÍTICOS DS 3.0 - NO REPETIR

### **🚫 ERRORES PROHIBIDOS**
1. **HARDCODEAR COLORES** en lugar de usar tokens
2. **GRADIENTES CUSTOM** fuera del sistema tokenizado
3. **ANIMACIONES BÁSICAS** sin usar spectacular tokens
4. **SPACING ARBITRARIO** en lugar de tokens spacing
5. **TIPOGRAFÍA INCONSISTENTE** sin usar typography scale
6. **COMPONENTS SIN UTILS** ignorando cardsUtils, buttonUtils, etc.
7. **THEME BYPASS** usando estilos que ignoren el theme
8. **RESPONSIVE ROTO** por no usar tokens responsive
9. **PERFORMANCE MALO** por no optimizar animaciones
10. **ACCESSIBILITY IGNORADA** sin considerar tokens a11y
11. **🚨 IMPORTS INCORRECTOS**: Nombres inventados de tokens
12. **🚨 TOKENS INEXISTENTES**: Usar tokens que no existen en el sistema
13. **🚨 RUTAS ERRÓNEAS**: Import paths incorrectos
14. **🚨 TYPOS EN NOMBRES**: `tokensUtils` en lugar de `tokenUtils`
15. **🚨 NO VERIFICAR TOKENS**: Asumir que existen sin confirmar

## 📋 7. CHECKLIST PREVIO DS 3.0

### **🔍 ANTES DE APLICAR DS 3.0**
- [ ] ¿Seguí las reglas de desarrollo obligatorias completamente?
- [ ] **¿VERIFIQUÉ TOKENS CON SEMANTIC_SEARCH?**: Confirmar tokens existen
- [ ] **¿LEÍSTE ESTRUCTURA /theme/tokens/?**: Confirmar archivos disponibles  
- [ ] **¿COPIASTE NOMBRES EXACTOS?**: No inventar nombres de tokens
- [ ] ¿Importé designTokens, tokenUtils, cardsUtils correctamente?
- [ ] ¿Creé backup del componente original (según reglas de desarrollo)?
- [ ] ¿Verifiqué que no hay estilos hardcodeados?
- [ ] ¿Planeé el orden de aplicación por capas?
- [ ] ¿Listé cambios y solicité autorización (según reglas de desarrollo)?

### **🔍 DURANTE LA APLICACIÓN**
- [ ] ¿Apliqué gradientes tokenizados primero?
- [ ] ¿Usé spacing y layout tokens correctos?
- [ ] ¿Implementé animaciones spectacular smooth?
- [ ] ¿Verifiqué get_errors() tras cada cambio (según reglas de desarrollo)?
- [ ] ¿Probé en localhost visual rendering?

### **🔍 DESPUÉS DE APLICAR DS 3.0**
- [ ] ¿Cero estilos hardcodeados restantes?
- [ ] ¿Animaciones spectacular a 60fps?
- [ ] ¿Responsive perfecto en todos los dispositivos?
- [ ] ¿Console DevTools sin warnings?
- [ ] ¿Commit descriptivo con prefix DS3 (según reglas de desarrollo)?
- [ ] ¿Cumplí todas las reglas de desarrollo obligatorias?

## 🎨 8. PATRONES SPECTACULAR OBLIGATORIOS

### **🌈 GRADIENTES PATTERN**
```jsx
// Header spectacular
background: designTokens.gradients.primary.full
// Subtle backgrounds  
background: designTokens.gradients.primary.soft
// Dynamic gradients
background: tokenUtils.gradients.getGradient('success', 'full')
```

### **🎬 ANIMACIONES PATTERN**
```jsx
// Entrada spectacular
<motion.div {...tokenUtils.animations.createEntranceProps('fadeInUp', 0.1)}>
// Hover effects
<motion.div {...tokenUtils.animations.createHoverProps('scale')}>
// Business animations
<motion.div {...tokenUtils.animations.createBusinessAnimation('commitmentCard')}>
```

### **🎴 COMPONENTS PATTERN**
```jsx
// Cards spectacular
<Paper {...cardsUtils.createPaperAccent('primary', 'large')}>
// Buttons spectacular  
<Button {...tokenUtils.buttons.createButtonProps('contained', 'primary', 'large')}>
// Forms spectacular
<TextField {...formUtils.createFieldProps('outlined', 'primary')}>
```

## 🚨 9. PROTOCOLO DE VERIFICACIÓN DS 3.0 INFALIBLE

### **🔍 VERIFICACIÓN INMEDIATA**
1. **Verificar tokens disponibles ANTES de importar:**
    ```bash
    semantic_search("designTokens gradients primary")
    list_dir("/theme/tokens/")  
    read_file("/theme/tokens/index.js")
    ```

2. **Verificar imports correctos DESPUÉS de escribir:**
    ```jsx
    // ✅ OBLIGATORIO: Verificar que estos exports existen
    import { designTokens, tokenUtils, cardsUtils } from '../theme/tokens'
    
    // ❌ PROHIBIDO: Nombres inventados sin verificar
    import { primaryGradient, spectacularTokens } from '../theme/tokens'
    ```

3. **Verificar aplicación correcta INMEDIATAMENTE:**
    ```bash
    get_errors([archivo_modificado])
    # Si hay errores de import, ROLLBACK inmediato
    # Abrir localhost para verificar spectacular rendering
    ```

### **🛡️ RECUPERACIÓN DE ERRORES DS 3.0**
1. **ERROR TOKENS**: Revisar import path y tokens disponibles
2. **ERROR GRADIENTES**: Verificar variant (full/soft) correcto
3. **ERROR ANIMACIONES**: Confirmar framer-motion props
4. **ERROR RESPONSIVE**: Verificar tokens spacing responsive
5. **ROLLBACK**: `cp archivo.backup → archivo.jsx`

## 🎯 10. RESULTADO SPECTACULAR GARANTIZADO

### **✅ STANDARDS SPECTACULAR**
- **GRADIENTES**: Solo tokens spectacular renderizando perfecto
- **ANIMACIONES**: 60fps smooth con framer-motion tokenizado
- **COMPONENTS**: Utils aplicados consistentemente
- **RESPONSIVE**: Mobile-first spectacular en todos dispositivos
- **PERFORMANCE**: Optimizado y sin warnings
- **ACCESSIBILITY**: Tokens a11y aplicados correctamente

### **🚀 EXPERIENCIA FINAL**
- **USUARIO**: Interface spectacular empresarial coherente
- **DESARROLLADOR**: Tokens reutilizables y mantenibles
- **PERFORMANCE**: 60fps animations + responsive perfecto
- **MAINTAINABILITY**: Sistema tokenizado escalable

---

## ⚠️ COMPROMISO INQUEBRANTABLE DS 3.0

**JURO SOLEMNEMENTE QUE:**

1. ✋ **SEGUIRÉ REGLAS DE DESARROLLO OBLIGATORIAS** como base fundamental
2. 🎨 **SOLO USARÉ TOKENS** spectacular del DS 3.0
3. 🔍 **NO HARDCODEARÉ** colores ni gradientes  
4. 🎬 **SOLO FRAMER-MOTION** tokenizado para animaciones
5. 🎴 **USARÉ UTILS** (cardsUtils, tokenUtils, formUtils)
6. 📊 **VERIFICARÉ RESPONSIVE** en todos los dispositivos
7. 🔍 **GET_ERRORS()** tras cada aplicación DS 3.0 (según reglas de desarrollo)
8. 📱 **PROBARÉ LOCALHOST** spectacular rendering
9. 💾 **CREARÉ BACKUPS** antes de aplicar DS 3.0 (según reglas de desarrollo)
10. 📝 **COMMITS DESCRIPTIVOS** con prefix DS3 (según reglas de desarrollo)
11. 🚀 **RESULTADO SPECTACULAR** garantizado siempre
12. 📋 **CUMPLIMIENTO TOTAL** de reglas de desarrollo obligatorias

**ESTAS SON LAS REGLAS SUPREMAS DEL DESIGN SYSTEM 3.0**  
**BASADAS EN Y COMPLEMENTARIAS A LAS REGLAS DE DESARROLLO OBLIGATORIAS**  
**CUMPLIMIENTO OBLIGATORIO E INQUEBRANTABLE**  
**NO ADMITE EXCEPCIONES NI ATAJOS**

## ⚠️ RECORDATORIO FINAL DS 3.0
1. Estas reglas DS 3.0 REQUIEREN cumplimiento previo de `REGLAS_DESARROLLO_OBLIGATORIAS.md`
2. Estas reglas aplican desde que INICIAS aplicación DS 3.0 hasta que TERMINAS
3. CADA componente debe seguir TODOS los pasos aquí descritos MÁS las reglas de desarrollo
4. NO hay modificaciones "pequeñas" que puedan saltar verificaciones
5. La calidad spectacular depende del cumplimiento ESTRICTO de ambas reglas
6. El incumplimiento de cualquier regla DS 3.0 o de desarrollo es motivo de ROLLBACK inmediato

**FIRMO Y ACEPTO ESTAS REGLAS COMO LEY FUNDAMENTAL DEL DESIGN SYSTEM 3.0 SPECTACULAR**  
**COMPLEMENTARIAS A LAS REGLAS DE DESARROLLO OBLIGATORIAS EXISTENTES**
