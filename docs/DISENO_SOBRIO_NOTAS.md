# 📋 Diseño Sobrio - Notas de Implementación

## 🎯 Descripción General

El **Diseño Sobrio** es un sistema visual minimalista y elegante implementado como alternativa al diseño "spectacular" premium del dashboard DR Group. Se caracteriza por su enfoque limpio, profesional y empresarial, eliminando efectos visuales excesivos mientras mantiene la funcionalidad y usabilidad.

---

## 🎨 Características Principales del Diseño Sobrio

### 1. **Bordes y Formas**
```scss
// Características de bordes
borderRadius: 1                    // 8px - Bordes sutilmente redondeados
borderRadius: 2                    // 16px - Para containers principales

// Bordes divisores tradicionales
border: `1px solid ${theme.palette.divider}`

// ⭐ NUEVO: Bordes dinámicos con color del tema (Agosto 2025)
border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`  // Borde principal
border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`  // Para elementos success
border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`    // Para elementos error
border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`// Para elementos secondary

// Hover states para bordes dinámicos
'&:hover': {
  borderColor: alpha(theme.palette.primary.main, 0.8)  // Intensifica en hover
}
```

### 2. **Sombras Minimalistas**
```scss
// Sombra principal sobria
boxShadow: '0 2px 8px rgba(0,0,0,0.06)'    // Sombra muy sutil

// Sombra hover
boxShadow: '0 4px 12px rgba(0,0,0,0.1)'    // Incremento mínimo en hover
```

### 3. **Colores y Transparencias**
```scss
// Uso de alpha para transparencias sutiles
backgroundColor: alpha(theme.palette.primary.main, 0.05)   // Fondo muy sutil
backgroundColor: alpha(theme.palette.primary.main, 0.08)   // Hover state
backgroundColor: alpha(theme.palette.primary.main, 0.1)    // Focused state
```

### 4. **Transiciones Suaves**
```scss
// Transiciones simples y naturales
transition: 'all 0.2s ease'
transition: 'box-shadow 0.2s ease'
```

### 5. **Tipografía Empresarial**
```scss
// Pesos de fuente equilibrados
fontWeight: 400  // Regular text
fontWeight: 500  // Medium emphasis
fontWeight: 600  // Headers y labels importantes

// Sin efectos tipográficos excesivos
textTransform: 'none'  // Texto natural, sin mayúsculas forzadas
```

### 6. **Headers con Gradiente Controlado**
```scss
// Header gradient sobrio simplificado (Patrón estándar 2025)
background: theme.palette.mode === 'dark' 
  ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
borderRadius: 1,
overflow: 'hidden',
boxShadow: theme.palette.mode === 'dark'
  ? '0 4px 20px rgba(0, 0, 0, 0.3)'
  : '0 4px 20px rgba(0, 0, 0, 0.08)',

// Estructura estándar del header
<Paper sx={headerStyles}>
  <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
    <Typography variant="overline" sx={{
      fontWeight: 600, 
      fontSize: '0.7rem', 
      color: 'rgba(255, 255, 255, 0.8)',
      letterSpacing: 1.2
    }}>
      SECCIÓN • DESCRIPCIÓN
    </Typography>
    <Typography variant="h4" sx={{
      fontWeight: 700, 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      🎯 Título Principal
    </Typography>
    <Typography variant="body1" sx={{ 
      color: 'rgba(255, 255, 255, 0.9)'
    }}>
      Descripción de la sección
    </Typography>
  </Box>
</Paper>

// SIN chips de información ni refresh icons (simplificado)
```

### 7. **Espaciado Consistente**
```scss
// Padding y margins estandarizados
p: 3         // 24px padding estándar
p: 4         // 32px padding para contenido principal
mb: 3        // 24px margin bottom
gap: 2       // 16px gap entre elementos
```

---

## 🏗️ Componentes del Sistema Sobrio

### **Cards Principales**
- Bordes sutiles con `divider` color
- Sombras mínimas `0 2px 8px rgba(0,0,0,0.06)`
- Headers con gradiente controlado
- Hover effects discretos

### **Campos de Formulario**
- `borderRadius: 1` para consistency
- Backgrounds con alpha muy bajo (0.05)
- Estados hover y focus graduales
- Sin efectos shimmer o glassmorphism

### **Botones**
- Formas limpias con `borderRadius: 1`
- `textTransform: 'none'` para texto natural
- Padding consistente `px: 3, py: 1`
- `fontWeight: 600` para claridad

### **Alertas y Notificaciones**
- Diseño plano con borde sutil
- Sin animaciones excesivas
- Colores del theme palette standard

---

---

## 🆕 **ACTUALIZACIONES AGOSTO 2025** - *Nuevas Implementaciones*

### **✅ Sistema de Bordes Dinámicos**
**Fecha:** Agosto 21, 2025  
**Implementado en:** UserManagementPage, ReportsConceptPage

**Características:**
- Bordes con color del tema y transparencia `alpha(color, 0.6)`
- Adaptación automática a modo claro/oscuro
- Hover effects que intensifican a `alpha(color, 0.8)`
- Consistencia visual en toda la aplicación

**Páginas actualizadas:**
- ✅ `UserManagementPage.jsx` - Tabla y tarjetas con bordes dinámicos
- ✅ `ReportsConceptPage.jsx` - Todos los cards con bordes dinámicos

### **✅ Headers Gradient Simplificados**
**Fecha:** Agosto 21, 2025  
**Implementado en:** Múltiples páginas

**Patrón estándar implementado:**
- Sin refresh icons
- Sin chips de información
- Estructura limpia con overline, título y descripción
- Adaptación automática al tema

**Páginas actualizadas:**
- ✅ `PaymentsPage.jsx`
- ✅ `NewPaymentPage.jsx`  
- ✅ `IncomePage.jsx`
- ✅ `IncomeHistoryPage.jsx`
- ✅ `BankAccountsPage.jsx`
- ✅ `CompaniesPage.jsx`
- ✅ `ReportsSummaryPage.jsx`
- ✅ `ReportsCompanyPage.jsx`
- ✅ `ReportsPeriodPage.jsx`
- ✅ `ReportsConceptPage.jsx`
- ✅ `UserManagementPage.jsx`

### **🎯 Código de Referencia para Bordes Dinámicos**
```jsx
// Para aplicar borde dinámico estándar (opacidad 0.6)
border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`

// Variaciones por color:
// - primary.main (azul) - Para elementos principales
// - success.main (verde) - Para elementos positivos/activos  
// - error.main (rojo) - Para elementos críticos/admin
// - secondary.main (púrpura) - Para elementos secundarios

// Con hover effect:
'&:hover': {
  borderColor: alpha(theme.palette.primary.main, 0.8)
}
```

---

## 📁 Páginas y Componentes Implementados

### **✅ ProfilePage.jsx** - *Implementación Completa (100%)*
**Ubicación:** `src/pages/ProfilePage.jsx`  
**URL:** `http://localhost:5173/profile`

**Características implementadas:**
- Cards con diseño sobrio completo
- Headers con gradiente controlado únicamente
- Formularios con campos consistentes
- Botones con estilo empresarial
- Avatar con efectos sutiles
- Chips y badges minimalistas
- Dialog de cambio de contraseña sobrio

**Elementos específicos:**
```jsx
// Card principal
sx={{
  borderRadius: 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
}}

// Header con gradiente controlado
sx={{
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: 'white'
}}

// TextField sobrio
sx={{
  '& .MuiOutlinedInput-root': {
    backgroundColor: editing 
      ? alpha(theme.palette.primary.main, 0.05)
      : 'background.paper',
    borderRadius: 1,
    transition: 'all 0.2s ease'
  }
}}
```

---

## 📊 **MÓDULO DE REPORTES** - *Implementaciones Parciales (70-80%)*

### **✅ ReportsSummaryPage.jsx** - *Implementación Parcial*
**Ubicación:** `src/pages/reports/ReportsSummaryPage.jsx`  
**URL:** `http://localhost:5173/reports/summary`

**Características implementadas:**
- Cards principales con `boxShadow: '0 2px 8px rgba(0,0,0,0.06)'`
- Formularios con `borderRadius: 1` consistente
- Elementos de filtro con diseño sobrio
- Tablas con bordes sutiles

### **✅ ReportsPeriodPage.jsx** - *Implementación Parcial*
**Ubicación:** `src/pages/reports/ReportsPeriodPage.jsx`  
**URL:** `http://localhost:5173/reports/period`

**Características implementadas:**
- Cards de filtros con `borderRadius: 1`
- Sombras sutiles `boxShadow: '0 2px 8px rgba(0,0,0,0.06)'`
- Campos de fecha con diseño consistente
- Tablas de resultados con bordes minimalistas

### **✅ ReportsConceptPage.jsx** - *Implementación Parcial*
**Ubicación:** `src/pages/reports/ReportsConceptPage.jsx`  
**URL:** `http://localhost:5173/reports/concept`

**Características implementadas:**
- Sistema de filtros con diseño sobrio
- Cards de métricas con sombras sutiles
- Elementos de UI consistentes con el sistema

### **✅ ReportsCompanyPage.jsx** - *Implementación Parcial*
**Ubicación:** `src/pages/reports/ReportsCompanyPage.jsx`  
**URL:** `http://localhost:5173/reports/company`

**Características implementadas:**
- Selectores de empresa con diseño limpio
- Cards de reporte con sombras sutiles
- Elementos de navegación consistentes

---

## 🏢 **MÓDULO DE EMPRESAS**

### **✅ CompaniesPage.jsx** - *Implementación Parcial (60%)*
**Ubicación:** `src/pages/CompaniesPage.jsx`  
**URL:** `http://localhost:5173/companies`

**Características implementadas:**
- TextField con `borderRadius: 1` para formularios
- Cards de empresa con diseño limpio
- Botones con estilo sobrio empresarial
- Modales con diseño consistente

**Elementos específicos:**
```jsx
// Campos de formulario
sx={{
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
  }
}}
```

---

## 💰 **MÓDULO DE INGRESOS**

### **✅ IncomePage.jsx (IncomePage_good.jsx)** - *Implementación Parcial*
**Ubicación:** `src/pages/IncomePage_good.jsx`  
**URL:** `http://localhost:5173/income`

**Características implementadas:**
- Divisores con `border: 1px solid ${theme.palette.divider}`
- Áreas de drag & drop con bordes sutiles
- Headers con separadores consistentes

### **✅ IncomeHistoryPage.jsx** - *Implementación Parcial*
**Ubicación:** `src/pages/IncomeHistoryPage.jsx`  
**URL:** `http://localhost:5173/income/history`

**Características implementadas:**
- Cards con sombras sutiles `boxShadow: '0 2px 8px rgba(0,0,0,0.06)'`
- Bordes divisores consistentes
- TextField con `borderRadius: 1`
- Botones de paginación con diseño limpio

### **✅ IncomeHistoryPage_new.jsx** - *Implementación Parcial*
**Ubicación:** `src/pages/IncomeHistoryPage_new.jsx`  
**URL:** `http://localhost:5173/income/accounts`

**Características implementadas:**
- Divisores con `borderBottom: 1px solid ${theme.palette.divider}`
- Headers de tabla con separadores sutiles
- Paginación con diseño consistente

---

## 📅 **MÓDULO DE COMPROMISOS**

### **✅ DueCommitmentsPage.jsx** - *Implementación Extensiva (80%)*
**Ubicación:** `src/pages/DueCommitmentsPage.jsx`  
**URL:** `http://localhost:5173/commitments/due`

**Características implementadas:**
- Múltiples cards con `borderRadius: 1`
- Uso extensivo de `theme.palette.divider` para bordes
- Sombras sutiles en modales y containers
- Formularios con campos consistentes
- Estados hover discretos
- Elementos de filtro con diseño sobrio

**Elementos específicos:**
```jsx
// Cards de commitment
sx={{
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
}}

// Divisores de lista
borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`
```

### **✅ CommitmentEditForm.jsx** - *Implementación en Dialog*
**Ubicación:** `src/components/commitments/CommitmentEditForm.jsx`

**Características implementadas:**
- Dialog con header gradient controlado
- Form fields con `borderRadius: 1` y '12px' para consistency
- Paper components con design sobrio
- Buttons con estilo empresarial

---

## 🔍 **MÓDULO DE BÚSQUEDA**

### **✅ GlobalSearchPage.jsx** - *Implementación Parcial (85%)*
**Ubicación:** `src/pages/GlobalSearchPage.jsx`  
**URL:** `http://localhost:5173/search`

**Características implementadas:**

#### **Header de Búsqueda - Diseño Spectacular Controlado**
```jsx
// Header principal con gradiente completo
<Box sx={{
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 1.0)}, ${alpha(theme.palette.secondary.main, 1.0)})`,
  color: 'white',
  p: 4,
  borderRadius: '8px',                    // Esquinas sutiles (reducido de 16px)
  position: 'relative',
  overflow: 'hidden',
  mb: 4,
  // Efectos decorativos mantenidos
  '&::before': {
    content: '""',
    position: 'absolute',
    background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    animation: 'float 6s ease-in-out infinite'
  }
}}>
```

#### **Tipografía del Header**
```jsx
// Título principal
<Typography variant="h4" sx={{ 
  fontWeight: 700,
  fontSize: { xs: '1.75rem', sm: '2.125rem' },
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  mb: 0.5
}}>
  Resultados de Búsqueda
</Typography>

// Subtítulo
<Typography variant="h6" sx={{ 
  opacity: 0.9,
  fontWeight: 400,
  fontSize: '1.1rem'
}}>
  Mostrando resultados para: <strong>"{searchTerm}"</strong>
</Typography>
```

#### **Modales de Detalle - Diseño Sobrio Completo**
- **Modal de Compromiso**: Header transparente, tipografía sobria, campos con labels en mayúsculas
- **Modal de Empresa**: Diseño completamente sobrio con cards sutiles y información estructurada

**Elementos específicos del Modal Sobrio:**
```jsx
// Header del modal (sobrio)
<DialogTitle sx={{ 
  pb: 2, 
  pt: 3,
  px: 3,
  background: 'transparent',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
}}>

// Labels de información (estilo sobrio)
<Typography variant="subtitle2" sx={{ 
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  mb: 1
}}>

// Cards de información
<Box sx={{ 
  p: 2, 
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: 1,
  backgroundColor: alpha(theme.palette.background.default, 0.5)
}}>
```

#### **Tablas de Resultados**
- Diseño sobrio con bordes sutiles y neutros
- Solo el borde exterior usa color dinámico del tema
- Bordes internos (celdas, filas) usan color 'divider' neutro
- Hover effects discretos
- Paginación integrada con estilos consistentes
- Botones de acción minimalistas

#### **⚠️ IMPORTANTE: Bordes de Tablas**
```jsx
// ✅ CORRECTO: Borde exterior dinámico, internos neutros
<Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}` }}>
  <Table sx={{
    '& .MuiTableCell-root': {
      borderColor: 'divider'  // Todas las celdas con color neutro
    },
    '& .MuiTableHead-root .MuiTableRow-root': {
      borderBottom: `1px solid ${theme.palette.divider}`  // Header con borde neutro
    }
  }}>
    <TableHead>
      <TableRow sx={{ 
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
        borderBottom: `1px solid ${theme.palette.divider}`  // Explícito
      }}>
        <TableCell sx={{ borderColor: 'divider' }}>...</TableCell>
      </TableRow>
    </TableHead>
  </Table>
</Card>

// ❌ INCORRECTO: Bordes internos con colores dinámicos
borderColor: alpha(theme.palette.primary.main, 0.6)  // Solo para bordes exteriores
```

---

## 🎯 Filosofía del Diseño Sobrio

### **Principios Fundamentales:**

1. **Minimalismo Funcional**
   - Eliminar elementos visuales innecesarios
   - Mantener funcionalidad completa
   - Priorizar la información sobre la decoración

2. **Consistencia Visual**
   - Usar el mismo `borderRadius` en toda la aplicación
   - Sombras uniformes y sutiles
   - Espaciado predecible y sistemático

3. **Profesionalismo Empresarial**
   - Colores del theme palette sin modificaciones
   - Tipografía clara y legible
   - Elementos de interfaz predecibles

4. **Transiciones Naturales**
   - Efectos hover discretos
   - Transiciones rápidas (0.2s)
   - Estados focus claros pero no intrusivos

### **Elementos EXCLUIDOS del Diseño Sobrio:**
- ❌ Efectos shimmer y glassmorphism
- ❌ Animaciones con framer-motion complejas
- ❌ Sombras excesivas o coloridas
- ❌ Gradientes múltiples en elementos
- ❌ Transformaciones de escala dramáticas
- ❌ Efectos de blur y backdrop-filter

---

## 🔧 Guía de Implementación

### **Para Nuevos Componentes:**

1. **Usar la estructura base:**
```jsx
const ComponenteSobrio = () => {
  return (
    <Card sx={{
      borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }
    }}>
      {/* Header con gradiente controlado */}
      <Box sx={{
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: 'white'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Título del Componente
        </Typography>
      </Box>
      
      {/* Contenido */}
      <CardContent sx={{ p: 4 }}>
        {/* Elementos con diseño sobrio */}
      </CardContent>
    </Card>
  );
};
```

2. **TextField estándar sobrio:**
```jsx
<TextField
  sx={{
    '& .MuiOutlinedInput-root': {
      backgroundColor: editing 
        ? alpha(theme.palette.primary.main, 0.05)
        : 'background.paper',
      borderRadius: 1,
      transition: 'all 0.2s ease',
      '&:hover': editing ? {
        backgroundColor: alpha(theme.palette.primary.main, 0.08)
      } : {},
      '&.Mui-focused': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1)
      }
    }
  }}
/>
```

3. **Botón estándar sobrio:**
```jsx
<Button
  variant="contained"
  sx={{
    borderRadius: 1,
    fontWeight: 600,
    px: 3,
    py: 1,
    textTransform: 'none'
  }}
>
  Acción
</Button>
```

### **Variables CSS Recomendadas:**
```scss
// Bordes
--sobrio-border-radius: 8px;
--sobrio-border-radius-large: 16px;

// Sombras
--sobrio-shadow-subtle: 0 2px 8px rgba(0,0,0,0.06);
--sobrio-shadow-hover: 0 4px 12px rgba(0,0,0,0.1);

// Transparencias
--sobrio-alpha-bg: 0.05;
--sobrio-alpha-hover: 0.08;
--sobrio-alpha-focus: 0.1;

// Transiciones
--sobrio-transition: all 0.2s ease;
```

---

## 📊 Comparación con Diseño Spectacular

| Aspecto | Diseño Spectacular | Diseño Sobrio |
|---------|-------------------|---------------|
| Bordes | `borderRadius: '12px'` variable | `borderRadius: 1` consistente |
| Sombras | `0 8px 32px rgba(31, 38, 135, 0.37)` | `0 2px 8px rgba(0,0,0,0.06)` |
| Animaciones | Framer Motion complejo | Transiciones CSS simples |
| Efectos | Shimmer, glassmorphism | Efectos hover discretos |
| Gradientes | Múltiples gradientes | Solo en headers |
| Transparencias | Backdrop filters | Alpha simples |

---

## 🚀 Estado de Implementación

### **✅ Completamente Implementado (100%)**
- ✅ **ProfilePage.jsx** - Diseño sobrio completo con todas las características implementadas

### **🟡 Parcialmente Implementado (60-80%)**
- 🟡 **DueCommitmentsPage.jsx** - Cards, formularios principales y modales (80%)
- 🟡 **CommitmentEditForm.jsx** - Dialog y form fields (70%)
- 🟡 **ReportsSummaryPage.jsx** - Cards principales y filtros (75%)
- 🟡 **ReportsPeriodPage.jsx** - Filtros y tablas de resultados (70%)
- 🟡 **ReportsConceptPage.jsx** - Sistema de filtros y métricas (70%)
- 🟡 **ReportsCompanyPage.jsx** - Selectores y cards de reporte (70%)
- 🟡 **IncomeHistoryPage.jsx** - Cards principales y paginación (65%)
- 🟡 **IncomeHistoryPage_new.jsx** - Headers y divisores (60%)
- 🟡 **CompaniesPage.jsx** - Formularios y cards de empresa (60%)
- 🟡 **IncomePage_good.jsx** - Divisores y áreas de interacción (60%)

### **⏳ Pendiente de Implementación Completa**
- ⏳ Dashboard principal - Necesita aplicación completa del sistema sobrio
- ⏳ Componentes de configuración - Settings y preferencias
- ⏳ Modales globales - Confirmaciones y alertas del sistema
- ⏳ Sidebar navigation - Menú principal y navegación secundaria

---

## 📝 Notas de Desarrollo

### **Best Practices Aplicadas:**
1. Uso de `theme.palette.divider` para bordes consistentes
2. `alpha()` function para transparencias controladas
3. Transiciones CSS en lugar de bibliotecas externas
4. Gradientes limitados solo a headers importantes
5. Espaciado basado en sistema de MUI (múltiplos de 8px)

### **Consideraciones de Mantenimiento:**
1. El diseño sobrio es más fácil de mantener que spectacular
2. Menos dependencias de librerías externas de animación
3. Mejor performance por menor uso de efectos complejos
4. Mayor compatibilidad con diferentes dispositivos

### **Testing y Validación:**
- Diseño probado en modo claro y oscuro
- Responsive design validado
- Accesibilidad mantenida
- Performance optimizado

---

**📅 Última actualización:** 20 de Agosto, 2025  
**👨‍💻 Implementado por:** GitHub Copilot  
**🎯 Objetivo:** Sistema de diseño empresarial minimalista para DR Group Dashboard

---

## 🌐 **Mapeo Completo de URLs con Diseño Sobrio**

### **✅ Páginas Implementadas:**

| URL | Página | Estado | Características Sobrias |
|-----|--------|--------|------------------------|
| `/profile` | ProfilePage.jsx | ✅ 100% | Cards completos, formularios, headers con gradiente |
| `/commitments/due` | DueCommitmentsPage.jsx | 🟡 80% | Cards, modales, formularios, filtros |
| `/reports/summary` | ReportsSummaryPage.jsx | 🟡 75% | Cards de métricas, sombras sutiles |
| `/reports/period` | ReportsPeriodPage.jsx | 🟡 70% | Filtros de fecha, tablas de resultados |
| `/reports/concept` | ReportsConceptPage.jsx | 🟡 70% | Sistema de filtros, cards de concepto |
| `/reports/company` | ReportsCompanyPage.jsx | 🟡 70% | Selectores de empresa, cards de reporte |
| `/companies` | CompaniesPage.jsx | 🟡 60% | Formularios de empresa, cards informativos |
| `/income` | IncomePage_good.jsx | 🟡 60% | Divisores, áreas drag & drop |
| `/income/history` | IncomeHistoryPage.jsx | 🟡 65% | Cards principales, paginación |
| `/income/accounts` | IncomeHistoryPage_new.jsx | 🟡 60% | Headers de tabla, divisores |

### **⚡ Links de Desarrollo Rápido:**
```bash
# Reportes
http://localhost:5173/reports/concept
http://localhost:5173/reports/period  
http://localhost:5173/reports/company
http://localhost:5173/reports/summary

# Gestión
http://localhost:5173/companies
http://localhost:5173/commitments/due

# Ingresos  
http://localhost:5173/income
http://localhost:5173/income/history
http://localhost:5173/income/accounts

# Usuario
http://localhost:5173/profile
```

---

## 🆕 PaymentReceiptViewer - Modal de Pagos Sobrio

**Archivo:** `src/components/commitments/PaymentReceiptViewer.jsx`
**Fecha de Implementación:** Diciembre 2024

### Transformación Spectacular → Sobrio

#### 🎨 Header Simplificado
**Antes:**
```javascript
// Header con gradiente dramático
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
color: 'white',
textShadow: '0 2px 4px rgba(0,0,0,0.2)'
```

**Después:**
```javascript
// Header sobrio con ícono contenido
<Box sx={{
  width: 48,
    height: 48,
```

---

## 🚀 **GUÍA RÁPIDA DE APLICACIÓN**

### **Para aplicar Header Gradient Sobrio:**
```jsx
// Estructura estándar - copiar y personalizar
<Paper sx={{ 
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  borderRadius: 1,
  overflow: 'hidden',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
    : '0 4px 20px rgba(0, 0, 0, 0.08)',
  mb: 6
}}>
  <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
    <Typography variant="overline">SECCIÓN • DESCRIPCIÓN</Typography>
    <Typography variant="h4">🎯 Título</Typography>
    <Typography variant="body1">Descripción</Typography>
  </Box>
</Paper>
```

### **Para aplicar Borde Dinámico:**
```jsx
// Borde estándar (opacidad 0.6)
border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`

// Pedir el borde: "Dale un borde dinámico" o "Aplica el borde con color del tema"
```

### **Solicitudes de Implementación Típicas:**
1. **"Aplica diseño sobrio"** → Cambiar a bordes sutiles, sombras mínimas, sin efectos excesivos
2. **"Dale un header gradient"** → Aplicar el patrón estándar sin chips ni refresh
3. **"Dale un borde dinámico"** → Aplicar `alpha(color, 0.6)` con adaptación al tema
4. **"Aplica el mismo borde que usuarios"** → Usar la referencia de UserManagementPage

### **Estados del Sistema (Agosto 2025):**
- ✅ **Headers**: 11 páginas actualizadas con gradient sobrio
- ✅ **Bordes**: 2 páginas con sistema dinámico implementado
- ⏳ **Pendiente**: Expandir bordes dinámicos a más páginas según necesidad

---

*Última actualización: Agosto 21, 2025*
*Documento mantiene registro completo de implementaciones sobrias vs spectacular*
  borderRadius: 2,
  backgroundColor: theme.palette.success.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white'
}}>
  💰
</Box>
```

#### 💳 Tarjetas de Información del Pago
Las tres tarjetas principales (Monto, Fecha, Método de Pago) fueron rediseñadas:

**Antes:**
```javascript
// Gradientes y efectos dramáticos
background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
border: '2px solid',
borderColor: 'success.main',
borderRadius: 3,
'&:hover': {
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.15)'
}
```

**Después:**
```javascript
// Diseño sobrio con fundamentos sólidos
backgroundColor: alpha(theme.palette.success.main, 0.08),
border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
borderRadius: 2,
transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
'&:hover': {
  backgroundColor: alpha(theme.palette.success.main, 0.12),
  borderColor: alpha(theme.palette.success.main, 0.3),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
}
```

#### 🏷️ Chips y Elementos de Estado
- **Chips:** Cambiados de `variant="filled"` a `variant="outlined"`
- **FontWeight:** Reducido de 600-700 a 500
- **Bordes:** Colores con alpha consistente

#### 🎯 Botón "Ver Comprobante"
**Antes:**
```javascript
boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
'&:hover': {
  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
  transform: 'translateY(-1px)'
}
```

**Después:**
```javascript
boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
'&:hover': {
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
}
```

#### 🚪 Botón Cerrar
**Transformación completa:**
- **Antes:** `variant="contained"` con gradientes
- **Después:** `variant="outlined"` con hover sutil

### Paleta de Colores Implementada

#### Tarjeta de Monto (Success)
```javascript
backgroundColor: alpha(theme.palette.success.main, 0.08)
border: alpha(theme.palette.success.main, 0.2)
hover: alpha(theme.palette.success.main, 0.12)
```

#### Tarjeta de Fecha (Info) 
```javascript
backgroundColor: alpha(theme.palette.info.main, 0.08)
border: alpha(theme.palette.info.main, 0.2)
hover: alpha(theme.palette.info.main, 0.12)
```

#### Tarjeta de Método (Secondary)
```javascript
backgroundColor: alpha(theme.palette.secondary.main, 0.08)
border: alpha(theme.palette.secondary.main, 0.2)
hover: alpha(theme.palette.secondary.main, 0.12)
```

### Métricas de Mejora Específicas
- **Gradientes eliminados:** 100% (5 gradientes → 0)
- **Sombras optimizadas:** Intensidad reducida en 70%
- **BorderRadius unificado:** De 3-4 → 2 consistente
- **Hovers simplificados:** Eliminados transforms y efectos 3D
- **Tipografía balanceada:** FontWeight 500-600 vs 700-800 previos

### Resultado Visual
El modal ahora presenta:
- ✅ Información clara y jerarquizada
- ✅ Colores consistentes con el sistema sobrio
- ✅ Interacciones suaves y profesionales
- ✅ Mejor legibilidad y accesibilidad
- ✅ Estilo empresarial confiable

---

## 📄 **HEADERS DE PÁGINA - ESTÁNDAR EMPRESARIAL OFICIAL**

### 🎯 Modelo de Referencia: NewPaymentPage
**URL:** `http://localhost:5173/payments/new`  
**Archivo:** `src/pages/NewPaymentPage.jsx`  
**Fecha de Estandarización:** Noviembre 2025

### 📋 Estructura Completa del Header Estándar

```jsx
<Paper sx={{ 
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  borderRadius: 1,
  overflow: 'hidden',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
    : '0 4px 20px rgba(0, 0, 0, 0.08)',
  mb: 3
}}>
  <Box sx={{ 
    p: 3, 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  }}>
    {/* LEFT SECTION - Información */}
    <Box sx={{ flex: 1 }}>
      {/* Breadcrumb superior */}
      <Typography variant="overline" sx={{ 
        fontWeight: 600, 
        fontSize: '0.7rem', 
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 1.2
      }}>
        FINANZAS • NUEVO PAGO
      </Typography>
      
      {/* Título principal - SIN EMOJI */}
      <Typography variant="h4" sx={{ 
        fontWeight: 700, 
        mt: 0.5, 
        mb: 0.5,
        color: 'white'
      }}>
        Registrar Pago de Compromiso
      </Typography>
      
      {/* Descripción */}
      <Typography variant="body1" sx={{ 
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        Complete la información del pago realizado
      </Typography>
    </Box>

    {/* RIGHT SECTION - Acciones */}
    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
      {/* Botón refresh opcional */}
      <IconButton
        onClick={handleRefresh}
        disabled={loading}
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <RefreshIcon />}
      </IconButton>
      
      {/* Botón volver */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/payments')}
        sx={{
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        Volver
      </Button>
    </Box>
  </Box>
</Paper>
```

### ✅ Elementos OBLIGATORIOS del Header

| Elemento | Especificación | Notas |
|----------|---------------|-------|
| **Paper Container** | `borderRadius: 1`, gradient background | Adaptable a dark/light mode |
| **Overline Breadcrumb** | `fontSize: 0.7rem`, `letterSpacing: 1.2`, uppercase | Contexto de navegación |
| **Título Principal** | `variant="h4"`, `fontWeight: 700`, **SIN EMOJI** | Máximo protagonismo |
| **Descripción** | `variant="body1"`, `rgba(255,255,255,0.9)` | Explicación breve de la página |
| **Flex Layout** | `display: flex`, `justifyContent: space-between` | Separa info de acciones |

### 🚫 Elementos PROHIBIDOS en Headers

- ❌ **Emojis en el título**: Usar solo texto limpio
- ❌ **Iconos decorativos innecesarios**: Solo íconos funcionales en botones
- ❌ **Chips informativos**: Mantener header simple y enfocado
- ❌ **Múltiples gradientes**: Solo uno por header
- ❌ **Animaciones complejas**: Solo transiciones CSS sutiles
- ❌ **Glassmorphism excesivo**: Backdrop-filter solo en botones específicos

### 🎨 Variaciones de Color Permitidas

```jsx
// SECCIÓN FINANCIERA (Verde/Azul)
gradient: primary.main → secondary.main

// SECCIÓN ADMINISTRATIVA (Rojo/Púrpura)
gradient: error.main → secondary.dark

// SECCIÓN REPORTES (Azul/Índigo)
gradient: info.main → primary.dark

// SECCIÓN EMPRESAS (Naranja/Amarillo)
gradient: warning.main → warning.dark
```

### 📐 Dimensiones y Espaciado

```jsx
// Padding interior
p: 3                    // 24px en todos los lados

// Margen inferior
mb: 3                   // 24px de separación con contenido

// Gap entre elementos
gap: 1                  // 8px entre botones
ml: 2                   // 16px separación left section → right section

// BorderRadius
borderRadius: 1         // 8px - Consistencia sobria
```

### 🔤 Tipografía Estándar

```jsx
// OVERLINE (Breadcrumb)
fontWeight: 600
fontSize: '0.7rem'      // 11.2px
letterSpacing: 1.2
textTransform: uppercase (implícito en variant)
color: rgba(255,255,255,0.8)

// TÍTULO (h4)
fontWeight: 700
fontSize: 2.125rem      // 34px por defecto MUI
color: white

// DESCRIPCIÓN (body1)
fontWeight: 400         // Regular
fontSize: 1rem          // 16px
color: rgba(255,255,255,0.9)
```

### 🎯 Botones de Acción

#### Botón Refresh (Opcional)
```jsx
<IconButton sx={{
  color: 'rgba(255, 255, 255, 0.9)',
  bgcolor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
}}>
```

#### Botón Volver (Recomendado)
```jsx
<Button variant="outlined" sx={{
  color: 'white',
  borderColor: 'rgba(255, 255, 255, 0.3)',
  '&:hover': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    bgcolor: 'rgba(255, 255, 255, 0.1)'
  }
}}>
```

### 📋 Checklist de Implementación

Antes de aprobar un header, verificar:

- [ ] **Gradient dinámico** adaptable a dark/light mode
- [ ] **Overline breadcrumb** con uppercase y letterSpacing 1.2
- [ ] **Título sin emojis** con fontWeight 700
- [ ] **Descripción clara** que explica la función de la página
- [ ] **Layout flex** con space-between para separar info y acciones
- [ ] **Botón volver** funcional con navegación apropiada
- [ ] **BorderRadius: 1** consistente con sistema sobrio
- [ ] **BoxShadow adaptable** según modo de tema
- [ ] **Sin glassmorphism** excepto en botones específicos
- [ ] **Sin animaciones complejas** - solo transiciones CSS

### 🚀 Plantilla Rápida para Copiar

```jsx
// Importaciones necesarias
import { Paper, Box, Typography, Button, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';

// En el componente
const theme = useTheme();
const navigate = useNavigate();

// JSX del header
<Paper sx={{ 
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  borderRadius: 1,
  overflow: 'hidden',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
    : '0 4px 20px rgba(0, 0, 0, 0.08)',
  mb: 3
}}>
  <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <Box sx={{ flex: 1 }}>
      <Typography variant="overline" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1.2 }}>
        SECCIÓN • CONTEXTO
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, mb: 0.5, color: 'white' }}>
        Título de la Página
      </Typography>
      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        Descripción breve de la funcionalidad
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/ruta-anterior')}
        sx={{
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)', bgcolor: 'rgba(255, 255, 255, 0.1)' }
        }}
      >
        Volver
      </Button>
    </Box>
  </Box>
</Paper>
```

### 📊 Páginas con Header Implementado Correctamente

| Página | URL | Estado | Observaciones |
|--------|-----|--------|---------------|
| NewPaymentPage | `/payments/new` | ✅ **MODELO OFICIAL** | Implementación perfecta |
| PaymentsPage | `/payments` | ✅ Implementado | Sigue el estándar |
| UserManagementPage | `/users` | ✅ Implementado | Header sobrio completo |
| CompaniesPage | `/companies` | ✅ Implementado | Adaptación correcta |
| IncomePage | `/income` | ✅ Implementado | Sin emojis |
| IncomeHistoryPage | `/income/history` | ✅ Implementado | Diseño limpio |
| BankAccountsPage | `/income/accounts` | ✅ Implementado | Estándar aplicado |
| ReportsSummaryPage | `/reports/summary` | ✅ Implementado | Header ejecutivo |
| ReportsCompanyPage | `/reports/company` | ✅ Implementado | Filtros integrados |
| ReportsPeriodPage | `/reports/period` | ✅ Implementado | Temporal claro |
| ReportsConceptPage | `/reports/concept` | ✅ Implementado | Análisis conceptual |

### 🎓 Filosofía del Header Sobrio

> **"Un header debe comunicar dónde estás, qué puedes hacer, y cómo volver. Nada más, nada menos."**

**Principios fundamentales:**

1. **Claridad Visual**: El título debe ser lo primero que se lea
2. **Contexto Inmediato**: El breadcrumb orienta al usuario sin pensar
3. **Acciones Obvias**: Los botones están donde se esperan (arriba derecha)
4. **Elegancia Sobria**: Gradiente controlado, sin efectos excesivos
5. **Consistencia Total**: Mismo patrón en todas las páginas

### 🔄 Mantenimiento del Estándar

**Al crear una nueva página:**
1. Copiar plantilla rápida completa
2. Cambiar breadcrumb según sección
3. Cambiar título según funcionalidad
4. Adaptar descripción al caso de uso
5. Configurar navegación del botón volver
6. **VERIFICAR** que no tenga emojis en el título

**Al revisar páginas existentes:**
1. ¿Tiene emoji en el título? → Remover inmediatamente
2. ¿Tiene chips informativos? → Considerar eliminar o mover al body
3. ¿Tiene múltiples botones refresh? → Dejar máximo uno
4. ¿Sigue estructura flex con space-between? → Si no, corregir
5. ¿Usa gradient adaptable? → Verificar dark/light mode

---

## 🆕 ACTUALIZACIONES RECIENTES - Agosto 2025

### 🎨 Bordes Dinámicos con Color del Tema
**Implementado en:** UserManagementPage, ReportsConceptPage, BankAccountsPage

#### Características del Borde Dinámico:
```jsx
// Patrón estándar para bordes dinámicos
border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`

// Variaciones por tipo de elemento:
primary.main    // Para elementos principales (tablas, containers)
success.main    // Para elementos de éxito (usuarios activos)
error.main      // Para elementos de error/admin (administradores)
secondary.main  // Para elementos secundarios (gerentes)

// Estados hover con intensidad aumentada:
'&:hover': {
  borderColor: alpha(theme.palette.primary.main, 0.8)  // De 0.6 a 0.8
}
```

#### Ventajas del Sistema de Bordes Dinámicos:
- **Adaptación automática:** Cambia según tema claro/oscuro
- **Consistencia visual:** Mismo patrón en todas las páginas
- **Sutileza profesional:** Visible pero no invasivo
- **Feedback visual:** Hover states para mejor UX
- **Colores contextuales:** Cada elemento mantiene su significado

#### Cómo Solicitar Este Borde:
```
"Dale un borde dinámico a [elemento]"
"Agrega un borde con color del tema"
"Pon un borde que cambie con el tema"
"Aplica un borde sutil con el color primario"
```

### 🎯 Headers Gradient Simplificados
**Implementado en:** 8+ páginas principales del sistema

#### Patrón Estándar de Header Sobrio:
```jsx
// Estructura completa del header
<Paper sx={{ 
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  borderRadius: 1,
  overflow: 'hidden',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
    : '0 4px 20px rgba(0, 0, 0, 0.08)',
  mb: 6
}}>
  <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
    <Typography variant="overline" sx={{ 
      fontWeight: 600, 
      fontSize: '0.7rem', 
      color: 'rgba(255, 255, 255, 0.8)',
      letterSpacing: 1.2
    }}>
      SECCIÓN • DESCRIPCIÓN
    </Typography>
    <Typography variant="h4" sx={{ 
      fontWeight: 700, 
      mt: 0.5, 
      mb: 0.5,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      🎯 Título Principal
    </Typography>
    <Typography variant="body1" sx={{ 
      color: 'rgba(255, 255, 255, 0.9)'
    }}>
      Descripción de la sección
    </Typography>
  </Box>
</Paper>
```

#### Características del Header Simplificado:
- **Sin chips informativos:** Eliminados para mayor limpieza
- **Sin botón refresh:** Reducción de elementos distractores  
- **Gradient adaptable:** Se ajusta al tema automáticamente
- **Tipografía consistente:** Mismo patrón en todas las páginas
- **Estructura tripartita:** Overline + Título + Descripción

#### Páginas con Header Implementado:
1. ✅ PaymentsPage - Estadísticas de pagos
2. ✅ NewPaymentPage - Navegación y progreso  
3. ✅ IncomePage - Métricas de ingresos
4. ✅ IncomeHistoryPage - Análisis histórico
5. ✅ BankAccountsPage - Balance financiero
6. ✅ CompaniesPage - Gestión empresarial
7. ✅ ReportsSummaryPage - Dashboard ejecutivo
8. ✅ ReportsCompanyPage - Reportes por empresa
9. ✅ ReportsPeriodPage - Análisis temporal
10. ✅ ReportsConceptPage - Análisis por concepto
11. ✅ UserManagementPage - Gestión de usuarios

### 📋 Guía Rápida para Desarrolladores

#### Para Aplicar Borde Dinámico:
```jsx
// Borde principal (0.6 opacidad - visible pero sutil)
border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`

// Borde hover (0.8 opacidad - más visible)
borderColor: alpha(theme.palette.primary.main, 0.8)
```

#### Para Aplicar Header Sobrio:
1. Importar: `useTheme, alpha` de MUI
2. Usar estructura estándar de Paper + Box
3. Aplicar gradiente adaptable al tema
4. Estructura de contenido: overline + h4 + body1

#### Para Bordes de Tablas:
```jsx
// ✅ CORRECTO: Solo borde exterior con color dinámico, internos neutros
<Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}` }}>
  <Table sx={{
    '& .MuiTableCell-root': {
      borderColor: 'divider'  // Bordes internos neutros
    },
    '& .MuiTableHead-root .MuiTableRow-root': {
      borderBottom: `1px solid ${theme.palette.divider}`  // Header neutro
    }
  }}>
    <TableHead>
      <TableRow sx={{ 
        borderBottom: `1px solid ${theme.palette.divider}`  // Explícito
      }}>
        <TableCell sx={{ borderColor: 'divider' }}>...</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableCell sx={{ borderColor: 'divider' }}>...</TableCell>
    </TableBody>
  </Table>
</Card>

// ❌ INCORRECTO: Aplicar colores dinámicos a bordes internos
<TableCell sx={{ borderColor: alpha(theme.palette.primary.main, 0.6) }}>
```

#### Regla de Oro para Bordes:
- **Borde exterior** (Card/Container): Color dinámico con alpha 0.6
- **Bordes internos** (TableCell, Dividers): Color 'divider' neutro
- **Hover states**: Intensificar solo el borde exterior (alpha 0.8)

#### Valores de Opacidad Recomendados:
- **0.4**: Muy sutil, apenas visible
- **0.6**: Sutil pero claramente visible ⭐ RECOMENDADO
- **0.8**: Hover states, más prominente
- **1.0**: Color sólido completo (evitar)

### 📝 Registro de Cambios Recientes

#### **21 Agosto 2025 - IMPLEMENTACIÓN CORRECTA DISEÑO SOBRIO EN TABLAS**
- **Problema identificado**: Tabla personalizada con Box no seguía patrones establecidos del sistema
- **Solución final implementada**: 
  - Restauré componentes Table/TableCell de MUI con estilos sobrios apropiados
  - Aplicé todos los bordes usando `theme.palette.divider` únicamente
  - Implementé espaciado, tipografía y colores según tokens documentados
  - Mantuve consistencia visual con demás páginas del sistema
- **Archivos afectados**: `src/pages/IncomeHistoryPage.jsx`
- **Resultado**: Tabla sobria perfectamente integrada con el sistema de diseño

#### **Patrón Final Implementado - Tabla Sobria Estándar**
```jsx
// ✅ SOLUCIÓN FINAL - Table de MUI con estilos sobrios completos
<Card sx={{ 
  borderRadius: 2,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`  // Solo borde exterior dinámico
}}>
  <TableContainer>
    <Table sx={{
      '& .MuiTableCell-root': {
        borderColor: `${theme.palette.divider}`,  // Todos los bordes neutros
        borderBottom: `1px solid ${theme.palette.divider}`
      },
      '& .MuiTableHead-root': {
        '& .MuiTableRow-root': {
          backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '0.875rem',
            paddingY: 2,
            borderColor: `${theme.palette.divider}`
          }
        }
      },
      '& .MuiTableBody-root': {
        '& .MuiTableRow-root': {
          '&:hover': { backgroundColor: theme.palette.action.hover },
          '&:last-child .MuiTableCell-root': { borderBottom: 'none' },
          '& .MuiTableCell-root': {
            paddingY: 1.8,
            fontSize: '0.85rem',
            borderColor: `${theme.palette.divider}`
          }
        }
      }
    }}>
```

#### **Nueva Arquitectura de Tablas Sobrias - PATRÓN ESTÁNDAR**
```jsx
// ✅ PATRÓN RECOMENDADO - Table de MUI con estilos sobrios apropiados
<Card sx={{ 
  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,  // Borde exterior dinámico
  borderRadius: 2,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
}}>
  <TableContainer>
    <Table sx={{
      '& .MuiTableCell-root': {
        borderColor: `${theme.palette.divider}`,  // Bordes neutros
        borderBottom: `1px solid ${theme.palette.divider}`
      },
      '& .MuiTableHead-root .MuiTableRow-root': {
        backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
        '& .MuiTableCell-root': {
          fontWeight: 600,
          fontSize: '0.875rem',
          paddingY: 2
        }
      },
      '& .MuiTableBody-root .MuiTableRow-root': {
        '&:hover': { backgroundColor: theme.palette.action.hover },
        '&:last-child .MuiTableCell-root': { borderBottom: 'none' },
        '& .MuiTableCell-root': {
          paddingY: 1.8,
          fontSize: '0.85rem'
        }
      }
    }}>
      <TableHead>
        <TableRow>
          <TableCell>Columna</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Dato</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
</Card>

// ❌ EVITAR: Box personalizado (no mantiene consistencia visual del sistema)
<Box sx={{ display: 'flex' }}>...</Box>
```

---