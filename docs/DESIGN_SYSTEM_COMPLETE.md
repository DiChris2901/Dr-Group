# 🎨 SISTEMA DE DISEÑO COMPLETO - DR GROUP DASHBOARD
## Documentación Exhaustiva para Replicación Fiel del Diseño

> **Versión:** 3.0 | **Fecha:** Enero 2026  
> **Propósito:** Guía completa para replicar el sistema de diseño sobrio empresarial de DR Group Dashboard  
> **Stack:** React 18 + Material-UI v5 + Firebase + Vite  

---

## 📋 ÍNDICE

1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Colores y Paletas](#colores-y-paletas)
3. [Tipografía Completa](#tipografía-completa)
4. [Espaciado y Layout](#espaciado-y-layout)
5. [Bordes y Formas](#bordes-y-formas)
6. [Sombras y Elevación](#sombras-y-elevación)
7. [Iconografía](#iconografía)
8. [Componentes Base](#componentes-base)
9. [Headers y Encabezados](#headers-y-encabezados)
10. [Modales y Diálogos](#modales-y-diálogos)
11. [Formularios y Inputs](#formularios-y-inputs)
12. [Botones y Acciones](#botones-y-acciones)
13. [Cards y Contenedores](#cards-y-contenedores)
14. [Tablas y Listas](#tablas-y-listas)
15. [Animaciones y Transiciones](#animaciones-y-transiciones)
16. [Estados y Feedback](#estados-y-feedback)
17. [Responsive Design](#responsive-design)
18. [Exportación Excel](#exportación-excel)

---

## 🎯 FILOSOFÍA DE DISEÑO

### **Diseño Sobrio Empresarial**

**Principios Fundamentales:**
- ✅ **Minimalismo Profesional**: Eliminar efectos visuales excesivos
- ✅ **Claridad Visual**: Interfaces limpias y fáciles de entender
- ✅ **Consistencia Absoluta**: Mismo patrón en toda la aplicación
- ✅ **Performance**: Animaciones sutiles sin comprometer velocidad
- ✅ **Accesibilidad**: Contraste adecuado en modo claro y oscuro

**Prohibiciones Estrictas:**
- ❌ **Glassmorphism** (backdrop-filter, blur effects)
- ❌ **Gradientes dramáticos** (solo gradientes controlados en headers)
- ❌ **Colores hardcodeados** (siempre usar theme.palette)
- ❌ **Efectos 3D excesivos** (scale > 1.05, rotaciones dramáticas)
- ❌ **Animaciones largas** (> 0.3s duración)
- ❌ **Sombras dramáticas** (solo 3 niveles permitidos)

---

## 🎨 COLORES Y PALETAS

### **Sistema de Color Base**

```javascript
// Configuración en ThemeContext
const theme = createTheme({
  palette: {
    mode: 'light', // o 'dark'
    primary: {
      main: '#667eea',           // Azul primario
      light: '#667eea40',        // Con 40 de opacidad
      dark: '#667eea',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',           // Púrpura secundario
      light: '#764ba240',
      dark: '#764ba2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#e2e8f0',        // Fondo general (light)
      paper: '#f8fafc',          // Fondo de cards (light)
      // Dark mode:
      // default: '#0f172a',
      // paper: '#1e293b',
    },
    text: {
      primary: '#1e293b',        // Texto principal (light)
      secondary: '#64748b',      // Texto secundario (light)
      // Dark mode:
      // primary: '#f8fafc',
      // secondary: '#cbd5e1',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
  }
});
```

### **Sistema Alpha (Transparencias)**

**Uso obligatorio de la función `alpha()` de MUI:**

```javascript
import { alpha } from '@mui/material';

// Bordes sutiles
alpha(theme.palette.primary.main, 0.2)      // 20% - Bordes principales
alpha(theme.palette.secondary.main, 0.2)    // 20% - Bordes laterales
alpha(theme.palette.divider, 0.12)          // 12% - Separadores
alpha(theme.palette.divider, 0.15)          // 15% - Bordes punteados
alpha(theme.palette.primary.main, 0.6)      // 60% - Bordes dinámicos

// Fondos
alpha(theme.palette.primary.main, 0.04)     // 4% - Hover suave
alpha(theme.palette.primary.main, 0.05)     // 5% - Background inputs
alpha(theme.palette.primary.main, 0.08)     // 8% - Highlight
alpha(theme.palette.error.main, 0.08)       // 8% - Error background
alpha(theme.palette.success.main, 0.08)     // 8% - Success background
alpha(theme.palette.warning.main, 0.08)     // 8% - Warning background

// Overlays
alpha(theme.palette.common.black, 0.5)      // 50% - Backdrop modal
```

### **Colores para Excel (ExcelJS ARGB)**

```javascript
const BRAND_COLORS = {
  // Headers oscuros corporativos
  titleBg: '0B3040',        // Azul oscuro títulos
  subtitleBg: '1A5F7A',     // Azul medio subtítulos
  metricsBg: '334155',      // Gris azulado métricas
  dateBg: '475569',         // Gris oscuro fecha
  headerBg: '0B3040',       // Azul oscuro columnas
  
  // Texto
  white: 'FFFFFF',          // Texto sobre oscuro
  textDark: '223344',       // Texto contenido
  
  // Bordes
  borderLight: 'E2E8F0',    // Bordes sutiles
  borderMedium: 'C0CCDA',   // Bordes medios
  borderDark: '94A3B8'      // Bordes acentuados
};
```

---

## ✒️ TIPOGRAFÍA COMPLETA

### **Fuente Base**

```javascript
typography: {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: 14,                    // Base 14px
  fontWeightRegular: 400,          // Regular
  fontWeightMedium: 500,           // Medium
  fontWeightBold: 700,             // Bold
}
```

### **Jerarquía Tipográfica**

#### **Display y Headings**

```javascript
// h1 - Títulos principales de página
h1: {
  fontWeight: 800,                 // ExtraBold
  fontSize: '2.5rem',              // 40px
  lineHeight: 1.2,
  letterSpacing: '-0.02em',
}

// h2 - Subtítulos de sección
h2: {
  fontWeight: 700,                 // Bold
  fontSize: '2rem',                // 32px
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
}

// h3 - Headers de cards
h3: {
  fontWeight: 600,                 // SemiBold
  fontSize: '1.75rem',             // 28px
  lineHeight: 1.3,
}

// h4 - Subtítulos de componentes
h4: {
  fontWeight: 600,
  fontSize: '1.5rem',              // 24px
  lineHeight: 1.4,
}

// h5 - Labels grandes
h5: {
  fontWeight: 600,
  fontSize: '1.25rem',             // 20px
  lineHeight: 1.4,
}

// h6 - Títulos pequeños
h6: {
  fontWeight: 600,
  fontSize: '1rem',                // 16px
  lineHeight: 1.5,
}
```

#### **Body Text**

```javascript
// body1 - Texto principal
body1: {
  fontSize: '1rem',                // 16px
  fontWeight: 400,
  lineHeight: 1.5,
}

// body2 - Texto secundario
body2: {
  fontSize: '0.875rem',            // 14px
  fontWeight: 400,
  lineHeight: 1.43,
}
```

#### **Utilidades**

```javascript
// overline - Etiquetas superiores (UPPERCASE)
overline: {
  fontSize: '0.75rem',             // 12px
  fontWeight: 600,
  letterSpacing: '0.08em',         // 0.8px
  textTransform: 'uppercase',
  lineHeight: 2.66,
}

// caption - Texto auxiliar pequeño
caption: {
  fontSize: '0.75rem',             // 12px
  fontWeight: 400,
  lineHeight: 1.66,
}

// button - Texto de botones
button: {
  fontSize: '0.875rem',            // 14px
  fontWeight: 600,
  textTransform: 'none',           // ⚠️ NUNCA uppercase
  letterSpacing: '0.02em',
}
```

### **Pesos de Fuente Estándar**

```javascript
// Uso de fontWeight en componentes
fontWeight: 400   // Regular - Texto normal
fontWeight: 500   // Medium - Énfasis moderado
fontWeight: 600   // SemiBold - Labels, headers pequeños
fontWeight: 700   // Bold - Títulos principales
fontWeight: 800   // ExtraBold - Títulos destacados (raro)

// ❌ EVITAR: 300 (Light), 900 (Black)
```

---

## 📐 ESPACIADO Y LAYOUT

### **Sistema de Espaciado Base**

**MUI usa múltiplos de 8px mediante `theme.spacing(n)`:**

```javascript
theme.spacing(0.5)  // 4px
theme.spacing(1)    // 8px
theme.spacing(1.5)  // 12px
theme.spacing(2)    // 16px
theme.spacing(2.5)  // 20px
theme.spacing(3)    // 24px   ⭐ Estándar padding cards
theme.spacing(4)    // 32px   ⭐ Padding contenido principal
theme.spacing(5)    // 40px
theme.spacing(6)    // 48px
```

### **Padding Estándar por Componente**

```javascript
// Cards principales
p: 3                // 24px - Padding estándar

// Contenido principal de página
p: 4                // 32px - Padding amplio

// Botones
px: 3, py: 1        // Horizontal 24px, Vertical 8px

// Inputs
p: 1.5              // 12px - Padding interno

// Modales (Dialog)
pb: 2               // 16px - Padding bottom DialogTitle
p: 3                // 24px - Padding DialogContent

// Chips
px: 1.5, py: 0.5    // Horizontal 12px, Vertical 4px
```

### **Margin y Gap Estándar**

```javascript
// Margin bottom entre secciones
mb: 3               // 24px - Espaciado estándar
mb: 4               // 32px - Espaciado amplio

// Gap entre elementos flex
gap: 1              // 8px - Gap mínimo
gap: 1.5            // 12px - Gap entre avatar y texto
gap: 2              // 16px - Gap estándar
gap: 3              // 24px - Gap amplio

// Separación vertical entre componentes
Stack spacing={3}   // 24px entre elementos
```

### **Grid Breakpoints**

```javascript
// Sistema de columnas en modales/layouts
<Grid container spacing={3}>
  {/* Vista Desktop */}
  <Grid item xs={12} md={8}>      // 66% ancho (información)
  <Grid item xs={12} md={4}>      // 33% ancho (lateral)
  
  {/* Vista con archivos */}
  <Grid item xs={12} md={7}>      // 58% ancho (información)
  <Grid item xs={12} md={5}>      // 42% ancho (archivos)
  
  {/* Vista móvil completa */}
  <Grid item xs={12}>             // 100% ancho
</Grid>
```

---

## 🔲 BORDES Y FORMAS

### **Border Radius Estándar**

```javascript
// Sistema de border radius sobrio
borderRadius: 0      // Sin bordes (raro, solo líneas)
borderRadius: 1      // 8px - Inputs, botones, chips ⭐ Más usado
borderRadius: 2      // 16px - Cards, modales ⭐ Segundo más usado
borderRadius: 3      // 24px - Elementos destacados (archivos)
borderRadius: 4      // 32px - Solo casos muy especiales

// ❌ NO USAR borderRadius > 4 (>32px)
```

### **Aplicación por Componente**

```javascript
// Botones y inputs
<Button sx={{ borderRadius: 1 }}>           // 8px
<TextField sx={{ borderRadius: 1 }}>        // 8px

// Cards y papers
<Paper sx={{ borderRadius: 2 }}>            // 16px
<Card sx={{ borderRadius: 2 }}>             // 16px

// Modales (Dialog PaperProps)
PaperProps={{
  sx: { borderRadius: 2 }                    // 16px
}}

// Chips y badges
<Chip sx={{ borderRadius: 1 }}>             // 8px

// Archivos/documentos
<Box sx={{ borderRadius: 3 }}>              // 24px
```

### **Tipos de Borde**

```javascript
// Borde estándar con divider
border: `1px solid ${theme.palette.divider}`

// Borde dinámico con color del tema (⭐ Agosto 2025)
border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`

// Variaciones de color
border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`
border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`
border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`

// Con hover
'&:hover': {
  borderColor: alpha(theme.palette.primary.main, 0.8)  // Intensifica
}

// Borde bottom para separadores
borderBottom: `1px solid ${theme.palette.divider}`
```

---

## 🌑 SOMBRAS Y ELEVACIÓN

### **Sistema de 3 Niveles**

**Solo 3 sombras permitidas en toda la aplicación:**

```javascript
// NIVEL 1 - Cards y elementos sutiles
boxShadow: '0 2px 8px rgba(0,0,0,0.06)'

// NIVEL 2 - Hover states
boxShadow: '0 4px 12px rgba(0,0,0,0.08)'

// NIVEL 3 - Modales principales
// Light mode:
boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
// Dark mode:
boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
```

### **Aplicación por Estado**

```javascript
// Card en reposo
<Card sx={{
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'  // NIVEL 2
  }
}}>

// Modal (Dialog)
<Dialog
  PaperProps={{
    sx: {
      boxShadow: theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0,0,0,0.08)'
    }
  }}
>
```

### **Tonal Elevation (Sin sombras)**

**En algunos casos usar colores de superficie en lugar de sombras:**

```javascript
// Profundidad con color (estilo Material Design 3)
backgroundColor: theme.palette.background.paper      // Base
backgroundColor: alpha(theme.palette.primary.main, 0.04)  // Hover
backgroundColor: alpha(theme.palette.primary.main, 0.08)  // Pressed
```

---

## 🎨 ICONOGRAFÍA

### **Biblioteca de Iconos**

```javascript
// Material Icons Rounded (variante suave)
import {
  Dashboard,
  People,
  Business,
  AttachMoney,
  Receipt,
  Assessment,
  Notifications,
  Settings,
  Add,
  Edit,
  Delete,
  Save,
  Close,
  Visibility,
  VisibilityOff,
  Search,
  FilterList,
  CloudUpload,
  AttachFile,
  PictureAsPdf,
  Image,
  InsertDriveFile,
} from '@mui/icons-material';
```

### **Tamaños de Iconos**

```javascript
// Extra pequeño - Iconos en chips
fontSize="small"                    // 20px

// Estándar - Iconos en botones y menú
fontSize="medium"                   // 24px (default)

// Grande - Iconos destacados en avatars
fontSize="large"                    // 32px

// Custom
sx={{ fontSize: 40 }}               // Para casos especiales
```

### **Color de Iconos**

```javascript
// Color del tema
<DashboardIcon color="primary" />
<PeopleIcon color="secondary" />
<AttachMoneyIcon color="success" />
<ErrorIcon color="error" />
<WarningIcon color="warning" />
<InfoIcon color="info" />

// Color heredado
<CloseIcon color="inherit" />       // Hereda del padre

// Color custom
<SaveIcon sx={{ color: theme.palette.success.main }} />
```

### **Uso en Avatars**

```javascript
<Avatar sx={{ 
  bgcolor: 'primary.main', 
  color: 'primary.contrastText',
  width: 40,
  height: 40
}}>
  <DashboardIcon fontSize="small" />
</Avatar>
```

---

## 📦 COMPONENTES BASE

### **Paper / Card**

```javascript
// Paper sobrio estándar
<Paper sx={{
  p: 3,                                           // 24px padding
  borderRadius: 2,                                // 16px
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  }
}}>
  {/* Contenido */}
</Paper>

// Card con borde dinámico
<Card sx={{
  borderRadius: 2,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.8),
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  }
}}>
  {/* Contenido */}
</Card>
```

### **Stack (Contenedor Flex)**

```javascript
// Stack vertical con espaciado
<Stack spacing={3}>                // 24px entre elementos
  <Component1 />
  <Component2 />
  <Component3 />
</Stack>

// Stack horizontal
<Stack direction="row" spacing={2} alignItems="center">
  <Avatar />
  <Typography variant="h6">Nombre</Typography>
</Stack>
```

### **Box (Contenedor Genérico)**

```javascript
// Box como contenedor flex
<Box sx={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: 2,
  p: 2
}}>
  {/* Contenido */}
</Box>

// Box como grid
<Box sx={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 3
}}>
  {/* Cards */}
</Box>
```

---

## 🎯 HEADERS Y ENCABEZADOS

### **Header con Gradiente Controlado (Patrón Estándar)**

```javascript
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
  <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
    {/* Overline */}
    <Typography variant="overline" sx={{
      fontWeight: 600, 
      fontSize: '0.7rem', 
      color: 'rgba(255, 255, 255, 0.8)',
      letterSpacing: 1.2
    }}>
      SECCIÓN • DESCRIPCIÓN
    </Typography>
    
    {/* Título Principal */}
    <Typography variant="h4" sx={{
      fontWeight: 700, 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      🎯 Título Principal
    </Typography>
    
    {/* Descripción */}
    <Typography variant="body1" sx={{ 
      color: 'rgba(255, 255, 255, 0.9)'
    }}>
      Descripción de la sección
    </Typography>
  </Box>
</Paper>
```

### **Header Simple (Sin Gradiente)**

```javascript
<Paper sx={{
  p: 3,
  borderRadius: 2,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  mb: 3
}}>
  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
    Título de Sección
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Descripción breve de la sección
  </Typography>
</Paper>
```

---

## 📋 MODALES Y DIÁLOGOS

### **Estructura Dialog Estándar**

```javascript
<Dialog
  open={open}
  onClose={onClose}
  fullWidth
  maxWidth="md"                    // ⚠️ SIEMPRE "md"
  PaperProps={{
    sx: {
      borderRadius: 2,             // 16px
      background: theme.palette.background.paper,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
        : '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
    }
  }}
>
  {/* DialogTitle */}
  {/* DialogContent */}
  {/* DialogActions */}
</Dialog>
```

### **DialogTitle con Avatar**

```javascript
<DialogTitle sx={{ 
  pb: 2,
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  background: theme.palette.mode === 'dark' 
    ? theme.palette.grey[900]
    : theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
}}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <VisibilityIcon />
    </Avatar>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
        Detalle del Compromiso
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Información completa
      </Typography>
    </Box>
  </Box>
  <IconButton onClick={onClose} size="small">
    <CloseIcon />
  </IconButton>
</DialogTitle>
```

### **DialogContent con Grid**

```javascript
<DialogContent sx={{ pt: 3 }}>
  <Grid container spacing={3}>
    {/* Columna principal */}
    <Grid item xs={12} md={8}>
      <Paper sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Contenido */}
      </Paper>
    </Grid>
    
    {/* Columna lateral */}
    <Grid item xs={12} md={4}>
      <Paper sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Información adicional */}
      </Paper>
    </Grid>
  </Grid>
</DialogContent>
```

### **DialogActions**

```javascript
<DialogActions sx={{ 
  p: 2, 
  borderTop: `1px solid ${theme.palette.divider}`,
  gap: 1
}}>
  <Button 
    onClick={onClose} 
    variant="outlined"
    sx={{ borderRadius: 1 }}
  >
    Cancelar
  </Button>
  <Button 
    onClick={onSave}
    variant="contained"
    startIcon={<SaveIcon />}
    sx={{ borderRadius: 1 }}
  >
    Guardar
  </Button>
</DialogActions>
```

---

## 📝 FORMULARIOS Y INPUTS

### **TextField Estándar**

```javascript
<TextField
  fullWidth
  label="Concepto del Gasto"
  value={concepto}
  onChange={(e) => setConcepto(e.target.value)}
  variant="outlined"
  sx={{
    '& .MuiOutlinedInput-root': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
      borderRadius: 1,                              // 8px
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
      '&.Mui-focused': {
        backgroundColor: theme.palette.background.paper,
      }
    }
  }}
/>
```

### **TextField con Validación**

```javascript
<TextField
  fullWidth
  label="Monto"
  type="number"
  value={monto}
  onChange={(e) => setMonto(e.target.value)}
  error={!!errors.monto}
  helperText={errors.monto}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <AttachMoneyIcon fontSize="small" />
      </InputAdornment>
    ),
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
    }
  }}
/>
```

### **Select / Autocomplete**

```javascript
<Autocomplete
  options={categorias}
  getOptionLabel={(option) => option.nombre}
  value={selectedCategoria}
  onChange={(e, newValue) => setSelectedCategoria(newValue)}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Categoría"
      placeholder="Seleccionar categoría"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
        }
      }}
    />
  )}
  renderOption={(props, option) => (
    <Box component="li" {...props} sx={{ gap: 1 }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: option.color
        }}
      />
      {option.nombre}
    </Box>
  )}
/>
```

### **Date Picker**

```javascript
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
  <DatePicker
    label="Fecha del Gasto"
    value={fecha}
    onChange={setFecha}
    slotProps={{
      textField: {
        fullWidth: true,
        sx: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
          }
        }
      }
    }}
  />
</LocalizationProvider>
```

---

## 🔘 BOTONES Y ACCIONES

### **Botón Primario (Contained)**

```javascript
<Button
  variant="contained"
  color="primary"
  startIcon={<SaveIcon />}
  onClick={handleSave}
  sx={{
    px: 3,
    py: 1,
    borderRadius: 1,
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transform: 'translateY(-2px)',
    }
  }}
>
  Guardar Cambios
</Button>
```

### **Botón Secundario (Outlined)**

```javascript
<Button
  variant="outlined"
  color="primary"
  startIcon={<CloseIcon />}
  onClick={onClose}
  sx={{
    px: 3,
    py: 1,
    borderRadius: 1,
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.2s ease',
  }}
>
  Cancelar
</Button>
```

### **Botón Terciario (Text)**

```javascript
<Button
  variant="text"
  color="primary"
  startIcon={<EditIcon />}
  onClick={handleEdit}
  sx={{
    px: 2,
    py: 0.5,
    borderRadius: 1,
    fontWeight: 500,
    textTransform: 'none',
  }}
>
  Editar
</Button>
```

### **IconButton**

```javascript
<IconButton
  onClick={handleDelete}
  size="small"
  sx={{
    color: 'error.main',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.error.main, 0.08),
      transform: 'scale(1.1)',
    }
  }}
>
  <DeleteIcon fontSize="small" />
</IconButton>
```

### **Tooltip con Botón**

```javascript
<Tooltip title="Descargar PDF" placement="top">
  <IconButton
    onClick={handleDownload}
    size="small"
    sx={{
      color: 'primary.main',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      }
    }}
  >
    <PictureAsPdfIcon fontSize="small" />
  </IconButton>
</Tooltip>
```

---

## 🗂️ CARDS Y CONTENEDORES

### **Card de Métrica Simple**

```javascript
<Card sx={{
  p: 2.5,
  borderRadius: 2,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transform: 'translateY(-4px)',
  }
}}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Avatar sx={{ 
      bgcolor: alpha(theme.palette.primary.main, 0.1),
      color: 'primary.main'
    }}>
      <AttachMoneyIcon />
    </Avatar>
    <Box>
      <Typography variant="overline" sx={{ 
        fontWeight: 600,
        color: 'text.secondary',
        letterSpacing: 0.8
      }}>
        TOTAL GASTOS
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        $1,250,000
      </Typography>
    </Box>
  </Box>
</Card>
```

### **Card de Lista con Items**

```javascript
<Card sx={{
  borderRadius: 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  overflow: 'hidden'
}}>
  <Box sx={{
    p: 2,
    borderBottom: `1px solid ${theme.palette.divider}`,
    background: alpha(theme.palette.primary.main, 0.04)
  }}>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      Últimos Gastos
    </Typography>
  </Box>
  <List sx={{ p: 0 }}>
    {gastos.map((gasto, index) => (
      <ListItem
        key={gasto.id}
        divider={index < gastos.length - 1}
        sx={{
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04)
          }
        }}
      >
        <ListItemIcon>
          <AttachFileIcon />
        </ListItemIcon>
        <ListItemText
          primary={gasto.concepto}
          secondary={formatCurrency(gasto.monto)}
        />
        <IconButton size="small">
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </ListItem>
    ))}
  </List>
</Card>
```

### **Card Expandible (Accordion)**

```javascript
<Accordion sx={{
  borderRadius: 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  '&:before': { display: 'none' },
  mb: 2
}}>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
      <Avatar sx={{ bgcolor: 'primary.main' }}>
        <BusinessIcon />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Empresa ABC
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Ver detalles
        </Typography>
      </Box>
    </Box>
  </AccordionSummary>
  <AccordionDetails sx={{ pt: 0 }}>
    <Divider sx={{ mb: 2 }} />
    {/* Contenido expandido */}
  </AccordionDetails>
</Accordion>
```

---

## 📊 TABLAS Y LISTAS

### **Tabla Estándar (Table)**

```javascript
<TableContainer component={Paper} sx={{
  borderRadius: 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  overflow: 'hidden'
}}>
  <Table>
    <TableHead sx={{
      backgroundColor: alpha(theme.palette.primary.main, 0.08)
    }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 600 }}>Concepto</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {gastos.map((gasto) => (
        <TableRow
          key={gasto.id}
          sx={{
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04)
            }
          }}
        >
          <TableCell>{gasto.concepto}</TableCell>
          <TableCell>{formatCurrency(gasto.monto)}</TableCell>
          <TableCell>{formatDate(gasto.fecha)}</TableCell>
          <TableCell align="right">
            <IconButton size="small" onClick={() => handleEdit(gasto.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => handleDelete(gasto.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### **Lista con Dividers**

```javascript
<List sx={{
  borderRadius: 2,
  border: `1px solid ${theme.palette.divider}`,
  overflow: 'hidden'
}}>
  {items.map((item, index) => (
    <React.Fragment key={item.id}>
      <ListItem
        button
        onClick={() => handleSelect(item)}
        sx={{
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04)
          }
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {item.icon}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={item.title}
          secondary={item.description}
          primaryTypographyProps={{ fontWeight: 600 }}
        />
      </ListItem>
      {index < items.length - 1 && <Divider />}
    </React.Fragment>
  ))}
</List>
```

---

## ✨ ANIMACIONES Y TRANSICIONES

### **Transición Estándar**

```javascript
// Transición suave única permitida
transition: 'all 0.2s ease'

// Casos específicos
transition: 'box-shadow 0.2s ease'
transition: 'background-color 0.2s ease'
transition: 'transform 0.2s ease'
transition: 'border-color 0.2s ease'

// ❌ NO USAR cubic-bezier complejos
// ❌ NO USAR duraciones > 0.3s
```

### **Hover Effects Sutiles**

```javascript
// Elevación suave (Card)
'&:hover': {
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  transform: 'translateY(-2px)',
}

// Cambio de color (Button)
'&:hover': {
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
}

// Escala mínima (IconButton)
'&:hover': {
  transform: 'scale(1.1)',
}

// ❌ NO USAR scale > 1.1
// ❌ NO USAR translateY < -4px
```

### **Framer Motion (Casos Especiales)**

```javascript
import { motion } from 'framer-motion';

// Fade in simple
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  {/* Contenido */}
</motion.div>

// Slide in from bottom
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
  {/* Contenido */}
</motion.div>

// ⚠️ Usar Framer Motion SOLO para entradas/salidas complejas
```

---

## 🚨 ESTADOS Y FEEDBACK

### **Loading States**

```javascript
// Loading con CircularProgress
{loading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
)}

// Loading inline
<Button
  variant="contained"
  disabled={loading}
  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
>
  {loading ? 'Guardando...' : 'Guardar'}
</Button>

// Skeleton (para contenido que se está cargando)
<Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
<Skeleton variant="text" width="80%" />
<Skeleton variant="circular" width={40} height={40} />
```

### **Alerts y Notificaciones**

```javascript
// Alert Success
<Alert 
  severity="success" 
  sx={{ 
    borderRadius: 2,
    mb: 2 
  }}
  onClose={() => setShowAlert(false)}
>
  <AlertTitle>¡Éxito!</AlertTitle>
  El gasto se guardó correctamente.
</Alert>

// Alert Error
<Alert 
  severity="error" 
  sx={{ 
    borderRadius: 2,
    mb: 2 
  }}
>
  <AlertTitle>Error</AlertTitle>
  No se pudo guardar el gasto. Intenta nuevamente.
</Alert>

// Alert Warning
<Alert 
  severity="warning" 
  sx={{ 
    borderRadius: 2,
    mb: 2 
  }}
>
  El presupuesto mensual está cerca de agotarse.
</Alert>
```

### **Snackbar (Toast)**

```javascript
<Snackbar
  open={showSnackbar}
  autoHideDuration={3000}
  onClose={handleCloseSnackbar}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <Alert
    onClose={handleCloseSnackbar}
    severity="success"
    sx={{ 
      width: '100%',
      borderRadius: 2 
    }}
  >
    ¡Cambios guardados exitosamente!
  </Alert>
</Snackbar>
```

### **Chips de Estado**

```javascript
// Chip Success (Pagado)
<Chip
  label="Pagado"
  color="success"
  size="small"
  icon={<CheckCircleIcon />}
  sx={{ 
    borderRadius: 1,
    fontWeight: 600 
  }}
/>

// Chip Warning (Pendiente)
<Chip
  label="Pendiente"
  color="warning"
  size="small"
  icon={<AccessTimeIcon />}
  sx={{ 
    borderRadius: 1,
    fontWeight: 600 
  }}
/>

// Chip Error (Vencido)
<Chip
  label="Vencido"
  color="error"
  size="small"
  icon={<ErrorIcon />}
  sx={{ 
    borderRadius: 1,
    fontWeight: 600 
  }}
/>
```

---

## 📱 RESPONSIVE DESIGN

### **Breakpoints de MUI**

```javascript
// xs: 0px - 600px (móvil)
// sm: 600px - 900px (tablet)
// md: 900px - 1200px (desktop pequeño)
// lg: 1200px - 1536px (desktop)
// xl: 1536px+ (pantalla grande)
```

### **Uso en Grid**

```javascript
<Grid container spacing={3}>
  {/* Móvil: 100%, Tablet: 50%, Desktop: 33% */}
  <Grid item xs={12} sm={6} md={4}>
    <Card />
  </Grid>
  
  {/* Móvil: 100%, Desktop: 66% y 33% */}
  <Grid item xs={12} md={8}>
    <Paper />
  </Grid>
  <Grid item xs={12} md={4}>
    <Paper />
  </Grid>
</Grid>
```

### **Responsive en sx prop**

```javascript
<Box sx={{
  // Padding responsive
  p: { xs: 2, md: 4 },           // Móvil: 16px, Desktop: 32px
  
  // Display responsive
  display: { xs: 'none', md: 'block' },  // Ocultar en móvil
  
  // Flex direction responsive
  flexDirection: { xs: 'column', md: 'row' },
  
  // Gap responsive
  gap: { xs: 2, md: 3 },
}}>
  {/* Contenido */}
</Box>
```

### **Typography Responsive**

```javascript
<Typography 
  variant="h2" 
  sx={{ 
    fontSize: { 
      xs: '1.5rem',   // 24px móvil
      sm: '2rem',     // 32px tablet
      md: '2.5rem'    // 40px desktop
    },
    fontWeight: 700
  }}
>
  Título Responsive
</Typography>
```

---

## 📊 EXPORTACIÓN EXCEL

### **Biblioteca Obligatoria**

```javascript
import ExcelJS from 'exceljs';

// ❌ NUNCA usar XLSX (SheetJS)
// ✅ SIEMPRE usar ExcelJS para formato profesional
```

### **Estructura de 7 Filas (Formato Python)**

```javascript
const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte de Gastos');

  // FILA 1: Título principal
  worksheet.getCell('A1').value = 'Control de Gastos Casa';
  worksheet.getCell('A1').font = {
    name: 'Segoe UI',
    size: 16,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0B3040' }    // Azul oscuro corporativo
  };
  worksheet.getCell('A1').alignment = { 
    vertical: 'middle', 
    horizontal: 'center' 
  };
  worksheet.mergeCells('A1:F1');
  worksheet.getRow(1).height = 35;

  // FILA 2: Subtítulo
  worksheet.getCell('A2').value = 'Reporte Mensual de Gastos';
  worksheet.getCell('A2').font = {
    name: 'Segoe UI',
    size: 12,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  worksheet.getCell('A2').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A5F7A' }    // Azul medio
  };
  worksheet.getCell('A2').alignment = { 
    vertical: 'middle', 
    horizontal: 'center' 
  };
  worksheet.mergeCells('A2:F2');
  worksheet.getRow(2).height = 25;

  // FILA 3: Métricas
  const metrics = [
    { label: 'Total Gastos:', value: '$1,250,000' },
    { label: 'Categorías:', value: '8' },
    { label: 'Mes:', value: 'Enero 2026' }
  ];
  
  let colIndex = 1;
  metrics.forEach(metric => {
    worksheet.getCell(3, colIndex).value = metric.label;
    worksheet.getCell(3, colIndex + 1).value = metric.value;
    
    // Estilo label
    worksheet.getCell(3, colIndex).font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    worksheet.getCell(3, colIndex).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' }  // Gris azulado
    };
    
    // Estilo valor
    worksheet.getCell(3, colIndex + 1).font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FF223344' }
    };
    
    colIndex += 2;
  });
  worksheet.getRow(3).height = 20;

  // FILA 4: Fecha de generación
  worksheet.getCell('A4').value = `Generado: ${new Date().toLocaleDateString('es-ES')}`;
  worksheet.getCell('A4').font = {
    name: 'Segoe UI',
    size: 9,
    italic: true,
    color: { argb: 'FFFFFFFF' }
  };
  worksheet.getCell('A4').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF475569' }    // Gris oscuro
  };
  worksheet.mergeCells('A4:F4');
  worksheet.getRow(4).height = 18;

  // FILA 5: Espacio en blanco
  worksheet.getRow(5).height = 10;

  // FILA 6: Headers de columnas
  const headers = ['Fecha', 'Concepto', 'Categoría', 'Monto', 'Cuenta', 'Estado'];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(6, index + 1);
    cell.value = header;
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B3040' }  // Azul oscuro
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  });
  worksheet.getRow(6).height = 25;

  // FILA 7+: Datos
  gastos.forEach((gasto, rowIndex) => {
    const row = worksheet.getRow(7 + rowIndex);
    row.values = [
      formatDate(gasto.fecha),
      gasto.concepto,
      gasto.categoria?.nombre || 'Sin categoría',
      formatCurrency(gasto.monto),
      gasto.cuenta || '-',
      gasto.pagado ? 'Pagado' : 'Pendiente'
    ];
    
    // Estilo de datos
    row.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        color: { argb: 'FF223344' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      
      // Alternar colores de filas
      if (rowIndex % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }  // Fondo claro alternado
        };
      }
    });
    row.height = 20;
  });

  // Ajustar anchos de columnas
  worksheet.columns = [
    { width: 12 },   // Fecha
    { width: 30 },   // Concepto
    { width: 20 },   // Categoría
    { width: 15 },   // Monto
    { width: 15 },   // Cuenta
    { width: 12 }    // Estado
  ];

  // Freeze panes (Congelar primera fila de headers)
  worksheet.views = [
    { state: 'frozen', ySplit: 6 }  // Congelar hasta fila 6
  ];

  // Exportar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Gastos_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};
```

---

## 🎯 REGLAS FINALES

### **Checklist de Validación**

Antes de implementar cualquier componente, verificar:

- ✅ ¿Usas `theme.palette` en lugar de colores hardcodeados?
- ✅ ¿borderRadius es 1 o 2 únicamente?
- ✅ ¿Las sombras son de nivel 1, 2 o 3 exactamente?
- ✅ ¿El espaciado usa `theme.spacing()` o múltiplos de 8px?
- ✅ ¿Los pesos de fuente son 400, 500, 600 o 700?
- ✅ ¿Las transiciones son de 0.2s ease?
- ✅ ¿Los botones tienen `textTransform: 'none'`?
- ✅ ¿Los modales tienen `maxWidth="md"` y `borderRadius: 2`?
- ✅ ¿Las animaciones hover son sutiles (translateY max -4px, scale max 1.1)?
- ✅ ¿Los iconos son de Material Icons Rounded?

### **Prohibiciones Absolutas**

- ❌ **Glassmorphism** (backdrop-filter, blur)
- ❌ **Colores hardcodeados** (#667eea directo)
- ❌ **borderRadius > 32px** (solo hasta 4)
- ❌ **Sombras custom** (solo las 3 definidas)
- ❌ **Animaciones largas** (> 0.3s)
- ❌ **Efectos 3D dramáticos** (scale > 1.1, rotaciones)
- ❌ **textTransform: 'uppercase'** en botones
- ❌ **Pesos de fuente extremos** (< 400 o > 700)

---

## 🎯 MODALES - SISTEMA COMPLETO

### **Estructura Dialog Estándar COMPLETA**

```jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const CustomModal = ({ open, onClose, data, mode = 'view' }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"                    // ⚠️ SIEMPRE "md"
      PaperProps={{
        sx: {
          borderRadius: 2,             // 16px
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
        }
      }}
    >
      {/* DialogTitle */}
      <DialogTitle sx={{ 
        pb: 2,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <VisibilityIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
              Detalle del Registro
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Información completa
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* DialogContent */}
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Columna principal */}
          <Grid item xs={12} md={8}>
            <Paper sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'primary.main',
                letterSpacing: 0.8,
                fontSize: '0.75rem'
              }}>
                Información General
              </Typography>
              
              {/* Contenido */}
            </Paper>
          </Grid>
          
          {/* Columna lateral */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              {/* Información adicional */}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      {/* DialogActions */}
      <DialogActions sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        gap: 1
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ borderRadius: 1 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={() => {}}
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ borderRadius: 1 }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### **DetailRow Component (Obligatorio)**

```jsx
const DetailRow = ({ icon, label, value, highlight = false }) => {
  const theme = useTheme();
  
  if (!value) return null;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      p: 1.5,
      borderRadius: 1,
      background: highlight 
        ? alpha(theme.palette.success.main, 0.08)
        : alpha(theme.palette.primary.main, 0.04),
      border: `1px solid ${highlight 
        ? alpha(theme.palette.success.main, 0.3)
        : alpha(theme.palette.primary.main, 0.2)
      }`
    }}>
      <Box sx={{ 
        color: highlight ? 'success.main' : 'primary.main',
        display: 'flex',
        alignItems: 'center'
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ 
          fontWeight: 600, 
          color: 'text.secondary',
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.7rem',
          mb: 0.5
        }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ 
          fontWeight: highlight ? 600 : 500,
          color: highlight ? 'success.main' : 'text.primary',
          fontSize: '0.875rem'
        }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
};
```

### **Gestión de Archivos en Modales**

```jsx
// Sección de archivos lateral
<Paper sx={{ 
  p: 3.5, 
  borderRadius: 2, 
  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
}}>
  <Typography variant="overline" sx={{ 
    fontWeight: 600, 
    color: 'secondary.main',
    letterSpacing: 0.8,
    fontSize: '0.75rem'
  }}>
    <AttachFileIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
    Gestión de Archivos
  </Typography>
  
  {/* Alert informativo */}
  <Alert 
    severity="info"
    sx={{ 
      mb: 2,
      mt: 2,
      backgroundColor: alpha(theme.palette.info.main, 0.08),
    }}
  >
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      ☁️ <strong>Este registro tiene 2 comprobantes en almacenamiento</strong>
    </Typography>
  </Alert>
  
  {/* Lista de archivos */}
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {files.map((file, index) => (
      <Paper
        key={index}
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.25),
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AttachFileIcon fontSize="small" />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(file.size)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Ver archivo">
            <IconButton size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    ))}
  </Box>
  
  {/* Estado vacío */}
  {files.length === 0 && (
    <Box sx={{
      textAlign: 'center',
      py: 4,
      borderRadius: 2,
      border: `2px dashed ${alpha(theme.palette.divider, 0.15)}`,
    }}>
      <AttachFileIcon sx={{ 
        fontSize: 40, 
        color: alpha(theme.palette.text.secondary, 0.5),
        mb: 1
      }} />
      <Typography variant="body2" color="text.secondary">
        Sin archivos adjuntos
      </Typography>
    </Box>
  )}
</Paper>
```

---

## 📄 VISOR PDF - IMPLEMENTACIÓN COMPLETA

### **Modal PDF Viewer Avanzado**

```jsx
import { ref, getMetadata } from 'firebase/storage';
import { storage } from '../config/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Info,
  FolderOpen,
  InsertDriveFile,
  Schedule,
  GetApp,
  PictureAsPdf,
  Image,
} from '@mui/icons-material';

const PDFViewerModal = ({ open, onClose, url }) => {
  const theme = useTheme();
  const [documentInfo, setDocumentInfo] = useState(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [documentDimensions, setDocumentDimensions] = useState({ 
    width: 'xl', 
    height: '90vh' 
  });

  // Cargar información del documento
  useEffect(() => {
    if (url && open) {
      loadDocumentInfo();
    }
  }, [url, open]);

  const loadDocumentInfo = async () => {
    try {
      // Extraer ruta del archivo desde URL Firebase
      let filePath = null;
      
      if (url.includes('firebase') && url.includes('o/')) {
        const encodedPath = url.split('o/')[1].split('?')[0];
        filePath = decodeURIComponent(encodedPath);
      }
      
      if (filePath) {
        const fileRef = ref(storage, filePath);
        const metadata = await getMetadata(fileRef);
        
        setDocumentInfo({
          name: metadata.name || 'Documento',
          size: parseInt(metadata.size) || 0,
          type: metadata.contentType || 'application/pdf',
          uploadedAt: metadata.timeCreated ? new Date(metadata.timeCreated) : null,
          updatedAt: metadata.updated ? new Date(metadata.updated) : null,
          path: filePath,
          url: url,
          bucket: metadata.bucket,
          fullPath: metadata.fullPath
        });
      }
    } catch (error) {
      console.error('Error cargando metadatos:', error);
    }
  };

  const handleToggleDocumentInfo = () => {
    const willOpen = !documentInfoOpen;
    setDocumentInfoOpen(willOpen);
    
    // Ajustar altura del modal
    if (willOpen) {
      setDocumentDimensions(prev => ({
        ...prev,
        height: 'calc(100vh - 50px)'
      }));
    } else {
      setDocumentDimensions(prev => ({
        ...prev,
        height: '90vh'
      }));
    }
  };

  const formatDocumentType = (type) => {
    const mimeToFriendly = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
    };
    return mimeToFriendly[type] || type;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Tamaño no disponible';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={documentDimensions.width}
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: documentDimensions.height,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
        }
      }}
    >
      {/* Header con información */}
      <DialogTitle sx={{ 
        p: 3,
        pb: 2,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2.5}>
            <Avatar sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              width: 40,
              height: 40
            }}>
              <PictureAsPdf />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {documentInfo?.name || 'Documento'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {documentInfo && `${formatDocumentType(documentInfo.type)} • ${formatFileSize(documentInfo.size)}`}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Información del documento">
              <IconButton
                onClick={handleToggleDocumentInfo}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: documentInfoOpen 
                    ? alpha(theme.palette.info.main, 0.15) 
                    : alpha(theme.palette.info.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.info.main, 0.2),
                  }
                }}
              >
                <Info sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Panel de información expandible */}
      {documentInfo && documentInfoOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: 'hidden' }}
        >
          <Box sx={{
            px: 3,
            py: 2,
            background: alpha(theme.palette.info.main, 0.04),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            maxHeight: '50vh',
            overflowY: 'auto',
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2, 
              mb: 2
            }}>
              {/* Ubicación */}
              <Box display="flex" alignItems="start" gap={1}>
                <FolderOpen sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: 'block'
                  }}>
                    Ubicación
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.8rem',
                    wordBreak: 'break-word'
                  }}>
                    {documentInfo.path || 'Firebase Storage'}
                  </Typography>
                </Box>
              </Box>
              
              {/* Tipo */}
              <Box display="flex" alignItems="start" gap={1}>
                <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption">Tipo</Typography>
                  <Typography variant="body2">
                    {formatDocumentType(documentInfo.type)}
                  </Typography>
                </Box>
              </Box>
              
              {/* Fecha */}
              <Box display="flex" alignItems="start" gap={1}>
                <Schedule sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption">Fecha de subida</Typography>
                  <Typography variant="body2">
                    {documentInfo.uploadedAt && format(documentInfo.uploadedAt, "dd/MM/yyyy HH:mm", { locale: es })}
                  </Typography>
                </Box>
              </Box>
              
              {/* Tamaño */}
              <Box display="flex" alignItems="start" gap={1}>
                <GetApp sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption">Tamaño</Typography>
                  <Typography variant="body2">
                    {formatFileSize(documentInfo.size)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Ruta completa */}
            {documentInfo.fullPath && (
              <Box sx={{ pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                <Typography variant="caption">Ruta completa</Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  background: alpha(theme.palette.grey[500], 0.1),
                  p: 1.5,
                  borderRadius: 1,
                  wordBreak: 'break-all',
                }}>
                  {documentInfo.fullPath}
                </Typography>
              </Box>
            )}
          </Box>
        </motion.div>
      )}

      {/* Contenido del documento */}
      <DialogContent sx={{ 
        p: 0, 
        height: documentInfoOpen ? 'calc(100% - 200px)' : '100%',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {url.toLowerCase().endsWith('.pdf') ? (
          <iframe
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="PDF Viewer"
          />
        ) : (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 2
          }}>
            <img 
              src={url} 
              alt="Documento" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

---

## 📚 UTILIDADES Y HELPERS

### **Formateo de Moneda**

```javascript
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
```

### **Formateo de Fechas**

```javascript
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: es });
};

export const formatDateShort = (date) => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: es });
};
```

### **Formateo de Tamaño de Archivos**

```javascript
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'Tamaño no disponible';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};
```

---

## ✅ CHECKLIST FINAL DE IMPLEMENTACIÓN

### **Antes de Implementar Cualquier Componente**

- [ ] ¿Usas `theme.palette` en lugar de colores hardcodeados?
- [ ] ¿borderRadius es 1 o 2 únicamente?
- [ ] ¿Las sombras son de nivel 1, 2 o 3 exactamente?
- [ ] ¿El espaciado usa `theme.spacing()` o múltiplos de 8px?
- [ ] ¿Los pesos de fuente son 400, 500, 600 o 700?
- [ ] ¿Las transiciones son de 0.2s ease?
- [ ] ¿Los botones tienen `textTransform: 'none'`?
- [ ] ¿Los modales tienen `maxWidth="md"` y `borderRadius: 2`?
- [ ] ¿Las animaciones hover son sutiles (translateY max -4px, scale max 1.1)?
- [ ] ¿Los iconos son de Material Icons Rounded?

### **Checklist de Modales**

- [ ] DialogTitle con Avatar + Typography + Close button
- [ ] Background grey[50] (light) / grey[900] (dark)
- [ ] pb: 2 en DialogTitle
- [ ] DialogContent con pt: 3
- [ ] Grid container con spacing={3}
- [ ] Cards con borderRadius: 2 y border alpha 0.2
- [ ] Overline con fontSize: '0.75rem' y letterSpacing: 0.8
- [ ] DialogActions con p: 2 y borderTop

### **Checklist de Visor PDF**

- [ ] Estados: documentInfo, documentInfoOpen, documentDimensions
- [ ] Función getMetadata de Firebase Storage
- [ ] Panel de información con motion.div
- [ ] CSS Grid layout responsivo
- [ ] Formateo inteligente de tipos MIME
- [ ] Ajuste dinámico de altura del modal
- [ ] Botón Info con estado activo

### **Checklist de Exportación Excel**

- [ ] Usar ExcelJS (NO XLSX/SheetJS)
- [ ] Estructura de 7 filas obligatoria
- [ ] Colores BRAND_COLORS con prefijo FF
- [ ] Fuente Segoe UI en todo el archivo
- [ ] Freeze panes en fila 7
- [ ] Bordes con thin style
- [ ] Formato ARGB correcto

---

**Última actualización:** Enero 3, 2026  
**Versión:** 4.0 COMPLETA - La Biblia del Diseño  
**Autor:** DR Group Dashboard Design Team  
**Licencia:** Uso exclusivo - Sin referencias externas - Completamente autosuficiente
