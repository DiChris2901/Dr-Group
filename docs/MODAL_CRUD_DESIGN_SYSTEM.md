# 📋 Sistema de Diseño para Modales CRUD - DR Group Dashboard

> **Versión:** 1.0  
> **Fecha:** Octubre 2025  
> **Basado en:** Spectacular Theme Original  
> **Modales de referencia:** CompaniesPage, SalasPage

---

## 🎯 Objetivo

Establecer un sistema de diseño consistente, elegante y empresarial para todos los modales CRUD (Crear/Editar) del dashboard DR Group, garantizando:

- ✅ **Consistencia visual** entre todos los modales del sistema
- ✅ **Jerarquía clara** mediante colores y elevaciones
- ✅ **Accesibilidad** y usabilidad optimizada
- ✅ **Adaptabilidad** modo claro/oscuro
- ✅ **Elegancia empresarial** sin excesos visuales

---

## 📐 Especificaciones Técnicas

### 1. **Estructura Base del Modal**

```jsx
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 2,
      background: theme.palette.background.paper,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
        : '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: `1px solid ${alpha(theme.palette.[COLOR].main, 0.6)}`
    }
  }}
>
  {/* DialogTitle */}
  {/* DialogContent */}
  {/* DialogActions */}
</Dialog>
```

**Propiedades obligatorias:**
- `maxWidth="md"` - Ancho estándar para modales
- `fullWidth` - Responsivo al ancho disponible
- `borderRadius: 2` - Bordes redondeados consistentes
- Border con color temático usando alpha 0.6

---

### 2. **DialogTitle con Gradiente Spectacular**

#### **Modal Agregar (CREATE)**
```jsx
<DialogTitle 
  sx={{ 
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    color: 'white',
    textAlign: 'center',
    py: 2.5,
    borderBottom: `3px solid ${theme.palette.primary.main}`,
  }}
>
  <Box display="flex" alignItems="center" justifyContent="center">
    <Avatar
      sx={{
        width: 42,
        height: 42,
        mr: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        boxShadow: `0 2px 8px ${theme.palette.primary.main}25`,
      }}
    >
      <AddIcon sx={{ fontSize: 22, color: 'white' }} />
    </Avatar>
    <Box textAlign="left">
      <Typography variant="h5" component="div" fontWeight="600" color="white">
        Agregar [Entidad]
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: 'white' }}>
        Complete los datos para registrar
      </Typography>
    </Box>
  </Box>
</DialogTitle>
```

**Colores sugeridos para CREATE:**
- **Primario:** `primary → secondary` (azul → púrpura)
- **Alternativo:** `info → primary` (cyan → azul)

#### **Modal Editar (UPDATE)**
```jsx
<DialogTitle 
  sx={{ 
    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`,
    color: 'white',
    textAlign: 'center',
    py: 2.5,
    borderBottom: `3px solid ${theme.palette.warning.main}`,
  }}
>
  <Box display="flex" alignItems="center" justifyContent="center">
    <Avatar
      sx={{
        width: 42,
        height: 42,
        mr: 2,
        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`,
        boxShadow: `0 2px 8px ${theme.palette.warning.main}25`,
      }}
    >
      <EditIcon sx={{ fontSize: 22, color: 'white' }} />
    </Avatar>
    <Box textAlign="left">
      <Typography variant="h5" component="div" fontWeight="600" color="white">
        Editar [Entidad]
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: 'white' }}>
        Modifica la información
      </Typography>
    </Box>
  </Box>
</DialogTitle>
```

**Colores sugeridos para UPDATE:**
- **Primario:** `warning → error` (naranja → rojo)
- **Alternativo:** `warning → orange` (naranja → naranja oscuro)

**Especificaciones del Avatar:**
- ✅ Tamaño: `42x42px`
- ✅ Gradiente igual al DialogTitle
- ✅ BoxShadow con alpha 25
- ✅ Ícono tamaño `22px` en color blanco
- ✅ Margen derecho: `mr: 2`

**Especificaciones del Texto:**
- ✅ Título: `variant="h5"`, `fontWeight="600"`, `color="white"`
- ✅ Subtítulo: `variant="body2"`, `opacity: 0.9`, `fontSize: '0.85rem'`
- ✅ Padding vertical: `py: 2.5`
- ✅ Border inferior: `3px solid` color principal

---

### 3. **Secciones con Paper Elevado**

Cada sección del formulario debe usar Paper elevado con borde izquierdo de color.

```jsx
<Grid item xs={12}>
  <Paper 
    elevation={1} 
    sx={{ 
      p: 2, 
      mb: 2,
      mt: 1,
      borderLeft: `4px solid ${theme.palette.[COLOR].main}`,
      backgroundColor: theme.palette.mode === 'dark' 
        ? `${theme.palette.[COLOR].main}20` 
        : `${theme.palette.[COLOR].main}08`
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box 
        sx={{ 
          backgroundColor: '[COLOR].main', 
          borderRadius: '50%', 
          p: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <IconComponent sx={{ color: 'white', fontSize: 18 }} />
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold',
          color: '[COLOR].main',
          lineHeight: 1.2
        }}>
          Título de la Sección
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Descripción breve de la sección
        </Typography>
      </Box>
    </Box>
  </Paper>
</Grid>
```

**Especificaciones del Paper:**
- ✅ `elevation={1}` - Sombra sutil
- ✅ `borderLeft: 4px solid` - Borde de color distintivo
- ✅ `backgroundColor` adaptativo (20 dark / 08 light)
- ✅ Padding: `p: 2`
- ✅ Margen: `mb: 2, mt: 1`

**Especificaciones del Avatar:**
- ✅ `backgroundColor` sólido (NO alpha)
- ✅ `borderRadius: '50%'`
- ✅ Padding: `p: 0.8`
- ✅ Ícono: `color: 'white'`, `fontSize: 18`

**Especificaciones del Texto:**
- ✅ Título: `variant="subtitle1"`, `fontWeight: 'bold'`, color temático
- ✅ Subtitle: `variant="caption"`, `color="text.secondary"`
- ✅ `lineHeight: 1.2` para el título

---

### 4. **Paleta de Colores por Tipo de Sección**

| Tipo de Sección | Color | Uso Recomendado | Ícono Sugerido |
|----------------|-------|-----------------|----------------|
| **Información Básica** | `primary` | Datos principales/identificación | `BusinessIcon`, `InfoIcon`, `AccountCircleIcon` |
| **Información de Contacto** | `warning` | Contactos/comunicación | `PersonIcon`, `ContactPhoneIcon`, `EmailIcon` |
| **Contacto Secundario** | `info` | Contactos alternativos | `PeopleIcon`, `ContactsIcon` |
| **Costos/Finanzas** | `success` | Información financiera | `MoneyIcon`, `AttachMoneyIcon`, `AccountBalanceIcon` |
| **Configuración** | `secondary` | Opciones/ajustes | `SettingsIcon`, `TuneIcon` |
| **Accesos/Seguridad** | `error` | Credenciales/permisos | `VpnKeyIcon`, `LockIcon`, `SecurityIcon` |

**Ejemplo de uso consistente:**
```jsx
// Sección 1: Información Básica → PRIMARY
<Paper borderLeft="4px solid primary" backgroundColor="primary08/20">
  <Avatar backgroundColor="primary.main"><BusinessIcon /></Avatar>
  <Typography color="primary.main">Información Básica</Typography>
  <Typography caption>Datos generales</Typography>
</Paper>

// Sección 2: Contacto → WARNING
<Paper borderLeft="4px solid warning" backgroundColor="warning08/20">
  <Avatar backgroundColor="warning.main"><PersonIcon /></Avatar>
  <Typography color="warning.main">Información de Contacto</Typography>
  <Typography caption>Datos de contacto principal</Typography>
</Paper>

// Sección 3: Contacto Secundario → INFO
<Paper borderLeft="4px solid info" backgroundColor="info08/20">
  <Avatar backgroundColor="info.main"><PeopleIcon /></Avatar>
  <Typography color="info.main">Contacto Secundario</Typography>
  <Typography caption>Datos de contacto alternativo</Typography>
</Paper>

// Sección 4: Costos → SUCCESS
<Paper borderLeft="4px solid success" backgroundColor="success08/20">
  <Avatar backgroundColor="success.main"><MoneyIcon /></Avatar>
  <Typography color="success.main">Costos Adicionales</Typography>
  <Typography caption>Costos mensuales de operación</Typography>
</Paper>
```

---

### 5. **Campos de Formulario (TextField/Autocomplete/Select)**

```jsx
<TextField
  fullWidth
  label="Campo"
  value={value}
  onChange={handleChange}
  required={isRequired}
  helperText="Texto de ayuda descriptivo"
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: 2
    }
  }}
/>
```

**Reglas obligatorias:**
- ✅ `borderRadius: 2` en TODOS los campos
- ✅ `fullWidth` para responsividad
- ✅ `helperText` descriptivo siempre que sea posible
- ✅ `required` cuando sea mandatorio

**Grid Layout recomendado:**
```jsx
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <TextField {...} />
  </Grid>
  <Grid item xs={12} md={6}>
    <TextField {...} />
  </Grid>
  <Grid item xs={12}>
    <TextField {...} /> {/* Campo de ancho completo */}
  </Grid>
</Grid>
```

---

### 6. **DialogActions (Botones de Acción)**

```jsx
<DialogActions sx={{ 
  p: 3, 
  pt: 2, 
  borderTop: `1px solid ${theme.palette.divider}` 
}}>
  <Button
    onClick={handleCancel}
    disabled={saving}
    sx={{ borderRadius: 2 }}
  >
    Cancelar
  </Button>
  <Button
    onClick={handleSubmit}
    variant="contained"
    disabled={saving}
    startIcon={<SaveIcon />}
    sx={{ borderRadius: 2 }}
  >
    {saving ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} color="inherit" />
        Guardando...
      </Box>
    ) : (
      'Guardar'
    )}
  </Button>
</DialogActions>
```

**Especificaciones:**
- ✅ Padding: `p: 3, pt: 2`
- ✅ Border superior: `1px solid divider`
- ✅ Botones con `borderRadius: 2`
- ✅ Loading state con CircularProgress
- ✅ Ícono en botón primario (SaveIcon, AddIcon, etc.)

**Textos recomendados:**
- **Modal Crear:** "Crear [Entidad]"
- **Modal Editar:** "Guardar Cambios"
- **Modal Eliminar:** "Confirmar Eliminación"

---

## 🎨 Ejemplos de Implementación Completa

### **Ejemplo 1: Modal Agregar Sala**

```jsx
<Dialog
  open={addDialogOpen}
  onClose={() => {
    setAddDialogOpen(false);
    clearForm();
  }}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 2,
      background: theme.palette.background.paper,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
        : '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
    }
  }}
>
  {/* DialogTitle con gradiente primary→secondary */}
  <DialogTitle 
    sx={{ 
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      color: 'white',
      textAlign: 'center',
      py: 2.5,
      borderBottom: `3px solid ${theme.palette.primary.main}`,
    }}
  >
    <Box display="flex" alignItems="center" justifyContent="center">
      <Avatar
        sx={{
          width: 42,
          height: 42,
          mr: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 2px 8px ${theme.palette.primary.main}25`,
        }}
      >
        <AddIcon sx={{ fontSize: 22, color: 'white' }} />
      </Avatar>
      <Box textAlign="left">
        <Typography variant="h5" component="div" fontWeight="600" color="white">
          Agregar Sala
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: 'white' }}>
          Complete los datos para registrar la nueva sala
        </Typography>
      </Box>
    </Box>
  </DialogTitle>
  
  <DialogContent sx={{ p: 3 }}>
    <Grid container spacing={3}>
      {/* Sección 1: Información Básica - PRIMARY */}
      <Grid item xs={12}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2,
            mt: 1,
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            backgroundColor: theme.palette.mode === 'dark' 
              ? `${theme.palette.primary.main}20` 
              : `${theme.palette.primary.main}08`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
              sx={{ 
                backgroundColor: 'primary.main', 
                borderRadius: '50%', 
                p: 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BusinessIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                lineHeight: 1.2
              }}>
                Información Básica
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Datos generales de la sala
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nombre de la Sala"
          value={formData.name}
          onChange={(e) => handleFormChange('name', e.target.value)}
          required
          helperText="Nombre identificativo de la sala"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
      </Grid>
      
      {/* Más campos... */}
      
      {/* Sección 2: Información de Contacto - WARNING */}
      <Grid item xs={12}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2,
            mt: 1,
            borderLeft: `4px solid ${theme.palette.warning.main}`,
            backgroundColor: theme.palette.mode === 'dark' 
              ? `${theme.palette.warning.main}20` 
              : `${theme.palette.warning.main}08`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
              sx={{ 
                backgroundColor: 'warning.main', 
                borderRadius: '50%', 
                p: 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PersonIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 'bold',
                color: 'warning.main',
                lineHeight: 1.2
              }}>
                Información de Contacto
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Datos de contacto principal de la sala
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      {/* Más campos... */}
    </Grid>
  </DialogContent>
  
  <DialogActions sx={{ 
    p: 3, 
    pt: 2, 
    borderTop: `1px solid ${theme.palette.divider}` 
  }}>
    <Button
      onClick={() => {
        setAddDialogOpen(false);
        clearForm();
      }}
      disabled={saving}
      sx={{ borderRadius: 2 }}
    >
      Cancelar
    </Button>
    <Button
      onClick={handleCreateSala}
      variant="contained"
      disabled={saving}
      startIcon={<SaveIcon />}
      sx={{ borderRadius: 2 }}
    >
      {saving ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} color="inherit" />
          Guardando...
        </Box>
      ) : (
        'Crear Sala'
      )}
    </Button>
  </DialogActions>
</Dialog>
```

---

## 📋 Checklist de Implementación

Antes de dar por completado un modal CRUD, verificar:

### **DialogTitle:**
- [ ] Gradiente spectacular aplicado (primary→secondary para CREATE, warning→error para UPDATE)
- [ ] Avatar 42x42 con gradiente y boxShadow
- [ ] Typography h5 para título
- [ ] Typography body2 para subtítulo
- [ ] Border inferior 3px con color temático
- [ ] Padding vertical py: 2.5

### **Secciones Paper:**
- [ ] Todas las secciones usan Paper elevation={1}
- [ ] BorderLeft 4px con color distintivo por sección
- [ ] Background color adaptativo (dark: 20, light: 08)
- [ ] Avatar sólido (NO alpha) con ícono blanco
- [ ] Typography subtitle1 bold con color temático
- [ ] Typography caption descriptivo
- [ ] Padding p: 2, margen mb: 2, mt: 1

### **Campos de Formulario:**
- [ ] Todos los campos tienen borderRadius: 2
- [ ] Layout responsivo con Grid (xs={12} md={6})
- [ ] helperText descriptivo en cada campo
- [ ] required en campos obligatorios
- [ ] fullWidth en todos los campos

### **DialogActions:**
- [ ] Padding p: 3, pt: 2
- [ ] Border superior con divider
- [ ] Botones con borderRadius: 2
- [ ] Loading state con CircularProgress
- [ ] Ícono en botón primario
- [ ] Disabled durante operaciones async

### **Dialog Container:**
- [ ] maxWidth="md" y fullWidth
- [ ] borderRadius: 2 en PaperProps
- [ ] boxShadow adaptativo modo claro/oscuro
- [ ] Border 1px con alpha 0.6

---

## 🚫 Antipatrones - NO HACER

### ❌ **NO usar Box con borderBottom para encabezados**
```jsx
// ❌ INCORRECTO
<Box sx={{ 
  borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`
}}>
  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
    <BusinessIcon />
  </Avatar>
  <Typography variant="overline">Título</Typography>
</Box>
```

```jsx
// ✅ CORRECTO
<Paper elevation={1} sx={{ 
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  backgroundColor: `${theme.palette.primary.main}08`
}}>
  <Box sx={{ backgroundColor: 'primary.main', borderRadius: '50%' }}>
    <BusinessIcon sx={{ color: 'white' }} />
  </Box>
  <Typography variant="subtitle1" color="primary.main">Título</Typography>
  <Typography variant="caption">Descripción</Typography>
</Paper>
```

### ❌ **NO usar avatares translúcidos**
```jsx
// ❌ INCORRECTO
<Avatar sx={{ 
  bgcolor: alpha(theme.palette.primary.main, 0.1),
  color: 'primary.main'
}}>
```

```jsx
// ✅ CORRECTO
<Box sx={{ 
  backgroundColor: 'primary.main',
  borderRadius: '50%'
}}>
  <Icon sx={{ color: 'white' }} />
</Box>
```

### ❌ **NO usar borderRadius: 1**
```jsx
// ❌ INCORRECTO
borderRadius: 1

// ✅ CORRECTO
borderRadius: 2
```

### ❌ **NO usar variant="overline" para títulos de sección**
```jsx
// ❌ INCORRECTO
<Typography variant="overline" sx={{ letterSpacing: 1.5 }}>
  Información Básica
</Typography>

// ✅ CORRECTO
<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
  Información Básica
</Typography>
<Typography variant="caption" color="text.secondary">
  Datos generales
</Typography>
```

### ❌ **NO omitir subtitle descriptivo**
```jsx
// ❌ INCORRECTO - Solo título
<Typography variant="subtitle1">
  Información de Contacto
</Typography>

// ✅ CORRECTO - Título + descripción
<Typography variant="subtitle1">
  Información de Contacto
</Typography>
<Typography variant="caption" color="text.secondary">
  Datos de contacto principal de la sala
</Typography>
```

---

## 🎯 Casos de Uso por Entidad

### **Empresas (Companies)**
```jsx
DialogTitle: primary → secondary (Agregar) / warning → error (Editar)
Secciones:
  1. Logotipo → secondary (Image, PhotoCamera)
  2. Información Básica → primary (Business, Info)
  3. Contacto → warning (Person, ContactPhone)
  4. Accesos → error (VpnKey, Security)
```

### **Salas (Venues)**
```jsx
DialogTitle: primary → secondary (Agregar) / warning → error (Editar)
Secciones:
  1. Información Básica → primary (Business)
  2. Información de Contacto → warning (Person)
  3. Contacto Secundario → info (People)
  4. Costos Adicionales → success (Money)
```

### **Compromisos (Commitments)**
```jsx
DialogTitle: success → info (Agregar) / warning → error (Editar)
Secciones:
  1. Información General → primary (Assignment)
  2. Detalles Financieros → success (AttachMoney)
  3. Fechas y Extensiones → warning (CalendarToday)
  4. Archivos Adjuntos → info (AttachFile)
```

### **Usuarios (Users)**
```jsx
DialogTitle: primary → secondary (Agregar) / warning → error (Editar)
Secciones:
  1. Información Personal → primary (AccountCircle)
  2. Credenciales → error (VpnKey)
  3. Permisos y Roles → warning (Security)
  4. Configuración → secondary (Settings)
```

### **Pagos (Payments)**
```jsx
DialogTitle: success → primary (Agregar) / warning → error (Editar)
Secciones:
  1. Información del Pago → success (Payment)
  2. Detalles → primary (Info)
  3. Comprobantes → info (Receipt)
```

---

## 🔄 Migración de Modales Existentes

### **Proceso de transformación:**

1. **Identificar modal a migrar**
   - Verificar si es CREATE o UPDATE
   - Catalogar secciones existentes

2. **Transformar DialogTitle**
   - Aplicar gradiente según tipo (CREATE/UPDATE)
   - Agregar Avatar 42x42 con gradiente
   - Actualizar Typography a h5 y body2

3. **Transformar cada sección**
   - Convertir Box → Paper elevation={1}
   - Agregar borderLeft 4px de color
   - Cambiar avatar translúcido → sólido
   - Agregar Typography caption descriptivo

4. **Actualizar campos**
   - Cambiar borderRadius: 1 → 2
   - Verificar helperText descriptivos
   - Confirmar layout responsivo

5. **Actualizar DialogActions**
   - Agregar border superior
   - Confirmar borderRadius: 2 en botones
   - Validar loading state

6. **Validación final**
   - Ejecutar get_errors
   - Probar responsividad
   - Verificar modo claro/oscuro

---

## 📊 Métricas de Calidad

Un modal bien implementado debe cumplir:

✅ **100% de secciones** con Paper elevado  
✅ **0 borderRadius: 1** (todos deben ser 2)  
✅ **100% de avatares** sólidos con íconos blancos  
✅ **100% de secciones** con subtitle descriptivo  
✅ **Gradiente spectacular** en DialogTitle  
✅ **Loading states** en todas las operaciones async  
✅ **0 errores** de sintaxis o lint  

---

## 🎨 Tema Spectacular - Referencia Rápida

```jsx
// Gradientes spectacular
primary → secondary: '#667eea' → '#764ba2'
warning → error: '#f093fb' → '#f5576c'
success → info: '#4CAF50' → '#00bcd4'
info → primary: '#00bcd4' → '#667eea'

// Elevaciones
elevation={0}: Sin sombra
elevation={1}: Sombra sutil (usar para Papers)
elevation={2}: Sombra media (Cards especiales)
elevation={3}: Sombra prominente (Dialogs)

// Alpha backgrounds
Dark mode: [color]20 (32 en hex)
Light mode: [color]08 (8 en hex)

// BorderRadius
Estándar: borderRadius: 2
Avatares/círculos: borderRadius: '50%'

// Spacing
p: 2 (padding interno Paper)
mb: 2, mt: 1 (márgenes Paper)
py: 2.5 (padding vertical DialogTitle)
p: 3, pt: 2 (padding DialogActions)
gap: 1.5 (spacing entre elementos)
```

---

## 📚 Referencias

- **Modales de referencia:** 
  - `src/pages/CompaniesPage.jsx`
  - `src/pages/SalasPage.jsx`
- **Tema:** `src/theme/premiumTheme.js`
- **Documentos relacionados:**
  - `MODAL_DESIGN_SYSTEM.md` (modales generales)
  - `MODAL_PDF_VIEWER_DESIGN.md` (visores PDF)
  - `DISENO_SOBRIO_NOTAS.md` (diseño minimalista)

---

## 🤝 Contribución

Al crear o modificar modales CRUD:

1. ✅ **Seguir este documento** estrictamente
2. ✅ **Documentar** desviaciones justificadas
3. ✅ **Validar** con get_errors antes de commit
4. ✅ **Actualizar** este doc si se agregan patrones nuevos

---

**Última actualización:** Octubre 2025  
**Mantenido por:** Equipo DR Group Dashboard  
**Versión del documento:** 1.0
