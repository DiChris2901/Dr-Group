import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Avatar,
  Typography,
  Grid,
  CircularProgress,
  Autocomplete,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Save as SaveIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

/**
 * Modal para agregar una nueva sala
 * Componente extraído de SalasPage para mejorar la mantenibilidad
 */
const AddSalaModal = ({
  open,
  onClose,
  formData,
  companies,
  salas,
  proveedoresUnicos,
  contactosUnicos,
  propietariosConDatos,
  camaraComercioFile,
  usoSuelosFile,
  saving,
  uploadingFiles,
  handleFormChange,
  handleCiudadChange,
  handlePropietarioChange,
  handleContactoChange,
  handleContacto2Change,
  setCamaraComercioFile,
  setUsoSuelosFile,
  handleCreateSala,
  formatCurrencyInput,
  parseCurrencyValue,
  addNotification
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
              Agregar Nueva Sala
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: 'white' }}>
              Complete los datos para registrar una nueva sala
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 2,
                mt: 2,
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
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={companies}
              getOptionLabel={(option) => option.name || ''}
              value={companies.find(c => c.id === formData.companyId) || null}
              onChange={(event, newValue) => {
                handleFormChange('companyId', newValue?.id || '');
                handleFormChange('companyName', newValue?.name || '');
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Empresa"
                  required
                  helperText="Seleccione o busque la empresa"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={proveedoresUnicos.filter(p => p !== 'all')}
              value={formData.proveedorOnline ?? ''}
              onChange={(event, newValue) => {
                handleFormChange('proveedorOnline', newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                handleFormChange('proveedorOnline', newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Proveedor Online"
                  helperText="Proveedor de servicios online (puede escribir nuevo o seleccionar existente)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha Inicio Contrato"
              type="date"
              value={formData.fechaInicioContrato || ''}
              onChange={(e) => handleFormChange('fechaInicioContrato', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Fecha de inicio del contrato con el proveedor"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={[...new Set(salas.map(sala => sala.ciudad).filter(Boolean))]}
              value={formData.ciudad ?? ''}
              onChange={(event, newValue) => {
                handleCiudadChange(newValue);
              }}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  handleFormChange('ciudad', newInputValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ciudad"
                  helperText="Ciudad donde se encuentra la sala (el departamento se auto-completa)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={[...new Set(salas.map(sala => sala.departamento).filter(Boolean))]}
              value={formData.departamento ?? ''}
              onChange={(event, newValue) => {
                handleFormChange('departamento', newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                handleFormChange('departamento', newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Departamento"
                  helperText="Departamento donde se encuentra la sala"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => handleFormChange('direccion', e.target.value)}
              helperText="Dirección completa de la sala"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={formData.status === 'retired' ? 6 : 6}>
            <FormControl fullWidth sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => {
                  handleFormChange('status', e.target.value);
                  // Si cambia a activa, limpiar fecha de retiro
                  if (e.target.value === 'active') {
                    handleFormChange('fechaRetiro', '');
                  }
                }}
                label="Estado"
              >
                <MenuItem value="active">Activa</MenuItem>
                <MenuItem value="retired">Retirada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {formData.status === 'retired' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Retiro"
                type="date"
                value={formData.fechaRetiro || ''}
                onChange={(e) => handleFormChange('fechaRetiro', e.target.value)}
                required
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Fecha en la que la sala fue retirada"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
          )}
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={propietariosConDatos}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : option.nombre
              }
              value={formData.propietario ?? ''}
              onChange={(event, newValue) => handlePropietarioChange(newValue)}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  handleFormChange('propietario', newInputValue);
                }
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        💼 Admin: ${option.administracion.toLocaleString()} • 🔌 Conexión: ${option.conexion.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Propietario"
                  helperText="Seleccione o escriba (autocompleta costos típicos)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre Representante Legal"
              value={formData.nombreRepLegal || ''}
              onChange={(e) => handleFormChange('nombreRepLegal', e.target.value)}
              helperText="Nombre completo del representante legal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cédula Representante Legal"
              value={formData.cedulaRepLegal || ''}
              onChange={(e) => handleFormChange('cedulaRepLegal', e.target.value)}
              helperText="Número de cédula del representante legal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          {/* Información de Contacto */}
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
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={contactosUnicos}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : option.nombre
              }
              value={formData.contactoAutorizado ?? ''}
              onChange={(event, newValue) => handleContactoChange(newValue)}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  handleFormChange('contactoAutorizado', newInputValue);
                }
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.nombre}
                      </Typography>
                      {option.telefono && (
                        <Typography variant="caption" color="text.secondary">
                          📞 {option.telefono}
                        </Typography>
                      )}
                      {option.email && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          ✉️ {option.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Contacto autorizado"
                  helperText="Seleccione o escriba nuevo (autocompleta tel. y email)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.contactPhone}
              onChange={(e) => handleFormChange('contactPhone', e.target.value)}
              helperText="Número de contacto"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="E-mail de contacto"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleFormChange('contactEmail', e.target.value)}
              helperText="Correo electrónico de contacto"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          {/* Contacto Autorizado 2 */}
          <Grid item xs={12}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 2,
                mt: 1,
                borderLeft: `4px solid ${theme.palette.info.main}`,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? `${theme.palette.info.main}20` 
                  : `${theme.palette.info.main}08`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    backgroundColor: 'info.main', 
                    borderRadius: '50%', 
                    p: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PeopleIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 'bold',
                    color: 'info.main',
                    lineHeight: 1.2
                  }}>
                    Contacto Autorizado 2 (Opcional)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Datos de contacto secundario o alternativo
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={contactosUnicos}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : option.nombre
              }
              value={formData.contactoAutorizado2 ?? ''}
              onChange={(event, newValue) => handleContacto2Change(newValue)}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  handleFormChange('contactoAutorizado2', newInputValue);
                }
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.nombre}
                      </Typography>
                      {option.telefono && (
                        <Typography variant="caption" color="text.secondary">
                          📞 {option.telefono}
                        </Typography>
                      )}
                      {option.email && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          ✉️ {option.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Contacto autorizado 2"
                  helperText="Seleccione o escriba nuevo (autocompleta tel. y email)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono 2"
              value={formData.contactPhone2 ?? ''}
              onChange={(e) => handleFormChange('contactPhone2', e.target.value)}
              helperText="Número de contacto alternativo"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="E-mail de contacto 2"
              type="email"
              value={formData.contactEmail2 ?? ''}
              onChange={(e) => handleFormChange('contactEmail2', e.target.value)}
              helperText="Correo electrónico alternativo"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          {/* Archivos Adjuntos */}
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
                  <AttachFileIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 'bold',
                    color: 'warning.main',
                    lineHeight: 1.2
                  }}>
                    Documentos Adjuntos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Adjunte documentos legales de la sala (opcionales)
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="camara-comercio-file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      addNotification('El archivo no debe superar 10MB', 'error');
                      e.target.value = '';
                      return;
                    }
                    setCamaraComercioFile(file);
                    addNotification('Archivo de Cámara de Comercio seleccionado', 'success');
                  }
                }}
              />
              <label htmlFor="camara-comercio-file">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={camaraComercioFile ? <CheckCircleIcon /> : <CloudUploadIcon />}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    borderColor: camaraComercioFile ? 'success.main' : 'primary.main',
                    color: camaraComercioFile ? 'success.main' : 'primary.main',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  {camaraComercioFile ? 'Cámara de Comercio ✓' : 'Adjuntar Cámara de Comercio'}
                </Button>
              </label>
              {camaraComercioFile && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PdfIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1, wordBreak: 'break-all' }}>
                    {camaraComercioFile.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCamaraComercioFile(null);
                      document.getElementById('camara-comercio-file').value = '';
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="uso-suelos-file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      addNotification('El archivo no debe superar 10MB', 'error');
                      e.target.value = '';
                      return;
                    }
                    setUsoSuelosFile(file);
                    addNotification('Archivo de Uso de Suelos seleccionado', 'success');
                  }
                }}
              />
              <label htmlFor="uso-suelos-file">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={usoSuelosFile ? <CheckCircleIcon /> : <CloudUploadIcon />}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    borderColor: usoSuelosFile ? 'success.main' : 'primary.main',
                    color: usoSuelosFile ? 'success.main' : 'primary.main',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  {usoSuelosFile ? 'Uso de Suelos ✓' : 'Adjuntar Uso de Suelos'}
                </Button>
              </label>
              {usoSuelosFile && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PdfIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1, wordBreak: 'break-all' }}>
                    {usoSuelosFile.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setUsoSuelosFile(null);
                      document.getElementById('uso-suelos-file').value = '';
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Grid>
          
          {/* Costos Adicionales */}
          <Grid item xs={12}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 2,
                mt: 1,
                borderLeft: `4px solid ${theme.palette.success.main}`,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? `${theme.palette.success.main}20` 
                  : `${theme.palette.success.main}08`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    backgroundColor: 'success.main', 
                    borderRadius: '50%', 
                    p: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MoneyIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 'bold',
                    color: 'success.main',
                    lineHeight: 1.2
                  }}>
                    Costos Adicionales
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Costos mensuales adicionales de la sala
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Administración"
              value={formatCurrencyInput(formData.administracion !== undefined ? formData.administracion : '')}
              onChange={(e) => {
                const numericValue = parseCurrencyValue(e.target.value);
                handleFormChange('administracion', numericValue);
              }}
              error={formData.administracion === undefined || formData.administracion === null || formData.administracion === ''}
              helperText={(formData.administracion === undefined || formData.administracion === null || formData.administracion === '') ? "Campo obligatorio" : "Costo de administración (puede ser $0)"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Conexión"
              value={formatCurrencyInput(formData.conexion !== undefined ? formData.conexion : '')}
              onChange={(e) => {
                const numericValue = parseCurrencyValue(e.target.value);
                handleFormChange('conexion', numericValue);
              }}
              error={formData.conexion === undefined || formData.conexion === null || formData.conexion === ''}
              helperText={(formData.conexion === undefined || formData.conexion === null || formData.conexion === '') ? "Campo obligatorio" : "Costo de conexión (puede ser $0)"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCreateSala}
          variant="contained"
          disabled={saving || uploadingFiles}
          startIcon={<SaveIcon />}
          sx={{ borderRadius: 2 }}
        >
          {uploadingFiles ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Subiendo archivos...
            </Box>
          ) : saving ? (
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
  );
};

export default AddSalaModal;
