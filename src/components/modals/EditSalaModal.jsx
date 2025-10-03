import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Avatar,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  CircularProgress,
  IconButton,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

const EditSalaModal = ({
  open,
  onClose,
  formData,
  onFormChange,
  companies,
  proveedoresUnicos,
  salas,
  onCiudadChange,
  propietariosUnicos,
  onSave,
  saving,
  formatCurrencyInput,
  parseCurrencyValue,
  // Documentos existentes
  existingCamaraComercio,
  existingUsoSuelos,
  // Archivos nuevos
  camaraComercioFile,
  setCamaraComercioFile,
  usoSuelosFile,
  setUsoSuelosFile,
  // Handlers
  onDeleteDocument,
  uploadingFiles,
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
          border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`
        }
      }}
    >
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
              Editar Sala
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: 'white' }}>
              Modifica la información de la sala
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
              onChange={(e) => onFormChange('name', e.target.value)}
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
                onFormChange('companyId', newValue?.id || '');
                onFormChange('companyName', newValue?.name || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Empresa"
                  required
                  helperText="Empresa asociada a la sala (escriba para buscar)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={proveedoresUnicos.filter(p => p !== 'all')}
              value={formData.proveedorOnline ?? ''}
              onChange={(event, newValue) => {
                onFormChange('proveedorOnline', newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                onFormChange('proveedorOnline', newInputValue);
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
            <Autocomplete
              freeSolo
              options={[...new Set(salas.map(sala => sala.ciudad).filter(Boolean))]}
              value={formData.ciudad ?? ''}
              onChange={(event, newValue) => {
                onCiudadChange(newValue);
              }}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  onFormChange('ciudad', newInputValue);
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
                onFormChange('departamento', newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                onFormChange('departamento', newInputValue);
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
              onChange={(e) => onFormChange('direccion', e.target.value)}
              helperText="Dirección completa de la sala"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => onFormChange('status', e.target.value)}
                label="Estado"
              >
                <MenuItem value="active">Activa</MenuItem>
                <MenuItem value="retired">Retirada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={propietariosUnicos.filter(p => p !== 'all')}
              value={formData.propietario ?? ''}
              onChange={(event, newValue) => {
                onFormChange('propietario', newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                onFormChange('propietario', newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Propietario"
                  helperText="Propietario de la sala (puede escribir nuevo o seleccionar existente)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
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
            <TextField
              fullWidth
              label="Contacto autorizado"
              value={formData.contactoAutorizado ?? ''}
              onChange={(e) => onFormChange('contactoAutorizado', e.target.value)}
              helperText="Persona autorizada para contacto"
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
              label="Teléfono"
              value={formData.contactPhone ?? ''}
              onChange={(e) => onFormChange('contactPhone', e.target.value)}
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
              value={formData.contactEmail ?? ''}
              onChange={(e) => onFormChange('contactEmail', e.target.value)}
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
            <TextField
              fullWidth
              label="Contacto autorizado 2"
              value={formData.contactoAutorizado2 ?? ''}
              onChange={(e) => onFormChange('contactoAutorizado2', e.target.value)}
              helperText="Segunda persona autorizada para contacto"
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
              label="Teléfono 2"
              value={formData.contactPhone2 ?? ''}
              onChange={(e) => onFormChange('contactPhone2', e.target.value)}
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
              onChange={(e) => onFormChange('contactEmail2', e.target.value)}
              helperText="Correo electrónico alternativo"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          {/* Documentos Adjuntos */}
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
                    Gestione los documentos legales de la sala
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* Cámara de Comercio */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Input oculto - siempre disponible */}
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="edit-camara-comercio-file"
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
              
              {/* Documento existente */}
              {existingCamaraComercio && !camaraComercioFile && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    mb: 1,
                    border: `2px solid ${theme.palette.success.main}`,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.05)
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={600} color="success.main">
                      Cámara de Comercio (Actual)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                      {existingCamaraComercio.name || 'Documento guardado'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => document.getElementById('edit-camara-comercio-file').click()}
                      sx={{ flex: 1, borderRadius: 1.5 }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => onDeleteDocument('camaraComercio')}
                      sx={{ flex: 1, borderRadius: 1.5 }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </Paper>
              )}
              
              {/* Subir nuevo documento */}
              {(!existingCamaraComercio || camaraComercioFile) && (
                <>
                  <label htmlFor="edit-camara-comercio-file">
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
                      {camaraComercioFile ? 'Cámara de Comercio ✓' : existingCamaraComercio ? 'Reemplazar Cámara de Comercio' : 'Adjuntar Cámara de Comercio'}
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
                          document.getElementById('edit-camara-comercio-file').value = '';
                        }}
                        sx={{ p: 0.5 }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Grid>
          
          {/* Uso de Suelos */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Input oculto - siempre disponible */}
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="edit-uso-suelos-file"
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
              
              {/* Documento existente */}
              {existingUsoSuelos && !usoSuelosFile && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    mb: 1,
                    border: `2px solid ${theme.palette.success.main}`,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.05)
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={600} color="success.main">
                      Uso de Suelos (Actual)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                      {existingUsoSuelos.name || 'Documento guardado'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => document.getElementById('edit-uso-suelos-file').click()}
                      sx={{ flex: 1, borderRadius: 1.5 }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => onDeleteDocument('usoSuelos')}
                      sx={{ flex: 1, borderRadius: 1.5 }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </Paper>
              )}
              
              {/* Subir nuevo documento */}
              {(!existingUsoSuelos || usoSuelosFile) && (
                <>
                  <label htmlFor="edit-uso-suelos-file">
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
                      {usoSuelosFile ? 'Uso de Suelos ✓' : existingUsoSuelos ? 'Reemplazar Uso de Suelos' : 'Adjuntar Uso de Suelos'}
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
                          document.getElementById('edit-uso-suelos-file').value = '';
                        }}
                        sx={{ p: 0.5 }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </>
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
              label="Administración"
              value={formatCurrencyInput(formData.administracion !== undefined ? formData.administracion : 0)}
              onChange={(e) => {
                const numericValue = parseCurrencyValue(e.target.value);
                onFormChange('administracion', numericValue);
              }}
              helperText="Costo de administración (puede ser $0)"
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
              label="Conexión"
              value={formatCurrencyInput(formData.conexion !== undefined ? formData.conexion : 0)}
              onChange={(e) => {
                const numericValue = parseCurrencyValue(e.target.value);
                onFormChange('conexion', numericValue);
              }}
              helperText="Costo de conexión (puede ser $0)"
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
          disabled={saving || uploadingFiles}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onSave}
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
            'Actualizar Sala'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSalaModal;
