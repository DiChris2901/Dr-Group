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
import { useState } from 'react';
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
import WarningIcon from '@mui/icons-material/Warning';

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
  existingValidacionUsoSuelos,
  // Archivos nuevos
  camaraComercioFile,
  setCamaraComercioFile,
  usoSuelosFile,
  setUsoSuelosFile,
  validacionUsoSuelosFile,
  setValidacionUsoSuelosFile,
  // Handlers
  onDeleteDocument,
  uploadingFiles,
  addNotification,
  // Sala original para detectar cambios
  selectedSala
}) => {
  const theme = useTheme();
  
  // Estado para el dialog de advertencia
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Helper: Formatear texto a Title Case (Primera Letra Mayúscula)
  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper: Formatear cédula con puntos (ej: 25456325 → 25.456.325)
  const formatCedula = (value) => {
    if (!value) return '';
    // Remover todo lo que no sea número
    const numbers = value.replace(/\D/g, '');
    // Agregar puntos cada 3 dígitos desde el final
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper: Limpiar formato de cédula para guardar (25.456.325 → 25456325)
  const parseCedula = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };

  // Helper: Formatear NIT (900.123.456-7)
  const formatNIT = (nit) => {
    if (!nit) return '';
    const cleaned = String(nit).replace(/\D/g, '');
    if (cleaned.length <= 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3').replace(/\.$/, '');
    }
    const num = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return num.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3') + '-' + dv;
  };

  // Helper: Limpiar NIT (solo números)
  const parseNIT = (nit) => {
    if (!nit) return '';
    return String(nit).replace(/[^\d]/g, '');
  };

  // Detectar si cambió información crítica (nombre, dirección, rep. legal principal o suplente)
  const hasChangedCriticalInfo = () => {
    if (!selectedSala) return false;
    
    const nameChanged = formData.name?.trim() !== selectedSala.name?.trim();
    const addressChanged = formData.direccion?.trim() !== selectedSala.direccion?.trim();
    const repLegalChanged = parseCedula(formData.cedulaRepLegal) !== parseCedula(selectedSala.cedulaRepLegal);
    
    // Verificar cambios en representante legal suplente
    const supletenteNombreChanged = (formData.nombreRepLegalSuplente || '').trim() !== (selectedSala.nombreRepLegalSuplente || '').trim();
    const suplenteTipoChanged = (formData.tipoDocumentoRepLegalSuplente || 'CC') !== (selectedSala.tipoDocumentoRepLegalSuplente || 'CC');
    const suplenteDocChanged = parseCedula(formData.cedulaRepLegalSuplente || '') !== parseCedula(selectedSala.cedulaRepLegalSuplente || '');
    const supletenteChanged = supletenteNombreChanged || suplenteTipoChanged || suplenteDocChanged;
    
    return nameChanged || addressChanged || repLegalChanged || supletenteChanged;
  };

  // Handler: Validar antes de guardar
  const handleSave = () => {
    const requiresNewCamaraComercio = hasChangedCriticalInfo();
    
    if (requiresNewCamaraComercio && !camaraComercioFile) {
      setShowWarningDialog(true);
      return;
    }
    
    onSave();
  };

  return (
    <>
      {/* Dialog de Advertencia */}
      <Dialog
        open={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `2px solid ${theme.palette.error.main}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.3)}`
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            color: 'white',
            textAlign: 'center',
            py: 3
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap={1}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(theme.palette.common.white, 0.2),
                mb: 1
              }}
            >
              <WarningIcon sx={{ fontSize: 32, color: 'white' }} />
            </Avatar>
            <Typography variant="h6" component="div" fontWeight={600}>
              Cámara de Comercio Requerida
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2, fontSize: '1rem', lineHeight: 1.6 }}>
              Has modificado información crítica de la sala:
            </Typography>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 2,
                bgcolor: alpha(theme.palette.error.main, 0.08),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 1.5
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', mb: 1 }}>
                Cambios detectados:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                • Nombre de la sala<br/>
                • Dirección<br/>
                • Representante Legal
              </Typography>
            </Paper>
            <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
              Debes <Box component="span" sx={{ fontWeight: 700 }}>cargar una Cámara de Comercio actualizada</Box> para guardar estos cambios.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setShowWarningDialog(false)}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: 1,
              py: 1.2,
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Principal de Editar Sala */}
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
          position: 'relative',
          borderBottom: `3px solid ${theme.palette.warning.main}`,
        }}
      >
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
          <CloseIcon />
        </IconButton>
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
            <Typography variant="h6" component="div" fontWeight={600} color="white">
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
                    fontWeight: 600,
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
            <TextField
              fullWidth
              label="Fecha Inicio Contrato"
              type="date"
              value={formData.fechaInicioContrato || ''}
              onChange={(e) => onFormChange('fechaInicioContrato', e.target.value)}
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
                  onFormChange('status', e.target.value);
                  // Si cambia a activa, limpiar fecha de retiro
                  if (e.target.value === 'active') {
                    onFormChange('fechaRetiro', '');
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
                onChange={(e) => onFormChange('fechaRetiro', e.target.value)}
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
          
          {/* Representante Legal Principal */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
              📋 Representante Legal Principal
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre Representante Legal Principal"
              value={formData.nombreRepLegal || ''}
              onChange={(e) => onFormChange('nombreRepLegal', toTitleCase(e.target.value))}
              helperText="Nombre completo del representante legal principal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Tipo de Documento"
              value={formData.tipoDocumentoRepLegal || 'CC'}
              onChange={(e) => {
                onFormChange('tipoDocumentoRepLegal', e.target.value);
                onFormChange('cedulaRepLegal', ''); // Limpiar número al cambiar tipo
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
              <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
              <MenuItem value="NIT">NIT</MenuItem>
              <MenuItem value="CE">Cédula de Extranjería</MenuItem>
              <MenuItem value="PP">Pasaporte</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={{
                CC: 'Número de Cédula',
                NIT: 'Número de NIT',
                CE: 'Número de Cédula Extranjería',
                PP: 'Número de Pasaporte'
              }[formData.tipoDocumentoRepLegal || 'CC']}
              value={(() => {
                const tipo = formData.tipoDocumentoRepLegal || 'CC';
                const valor = formData.cedulaRepLegal || '';
                if (tipo === 'CC' || tipo === 'CE') return formatCedula(valor);
                if (tipo === 'NIT') return formatNIT(valor);
                return valor; // Pasaporte sin formato
              })()}
              onChange={(e) => {
                const tipo = formData.tipoDocumentoRepLegal || 'CC';
                let rawValue = e.target.value;
                if (tipo === 'CC' || tipo === 'CE') {
                  rawValue = parseCedula(e.target.value);
                } else if (tipo === 'NIT') {
                  rawValue = parseNIT(e.target.value);
                } else {
                  rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                }
                onFormChange('cedulaRepLegal', rawValue);
              }}
              placeholder={{
                CC: '25.456.325',
                NIT: '900.123.456-7',
                CE: '1.234.567',
                PP: 'AB1234567'
              }[formData.tipoDocumentoRepLegal || 'CC']}
              helperText={{
                CC: 'Formato automático: 12.345.678',
                NIT: 'Formato automático: 900.123.456-7',
                CE: 'Formato automático: 1.234.567',
                PP: 'Solo letras y números (mayúsculas)'
              }[formData.tipoDocumentoRepLegal || 'CC']}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          {/* Representante Legal Suplente */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.main', mb: 1, mt: 2 }}>
              👥 Representante Legal Suplente (Opcional)
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre Representante Legal Suplente"
              value={formData.nombreRepLegalSuplente || ''}
              onChange={(e) => onFormChange('nombreRepLegalSuplente', toTitleCase(e.target.value))}
              helperText="Nombre completo del representante legal suplente (opcional)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Tipo de Documento"
              value={formData.tipoDocumentoRepLegalSuplente || 'CC'}
              onChange={(e) => {
                onFormChange('tipoDocumentoRepLegalSuplente', e.target.value);
                onFormChange('cedulaRepLegalSuplente', '');
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
              <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
              <MenuItem value="NIT">NIT</MenuItem>
              <MenuItem value="CE">Cédula de Extranjería</MenuItem>
              <MenuItem value="PP">Pasaporte</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={{
                CC: 'Número de Cédula',
                NIT: 'Número de NIT',
                CE: 'Número de Cédula Extranjería',
                PP: 'Número de Pasaporte'
              }[formData.tipoDocumentoRepLegalSuplente || 'CC']}
              value={(() => {
                const tipo = formData.tipoDocumentoRepLegalSuplente || 'CC';
                const valor = formData.cedulaRepLegalSuplente || '';
                if (tipo === 'CC' || tipo === 'CE') return formatCedula(valor);
                if (tipo === 'NIT') return formatNIT(valor);
                return valor;
              })()}
              onChange={(e) => {
                const tipo = formData.tipoDocumentoRepLegalSuplente || 'CC';
                let rawValue = e.target.value;
                if (tipo === 'CC' || tipo === 'CE') {
                  rawValue = parseCedula(e.target.value);
                } else if (tipo === 'NIT') {
                  rawValue = parseNIT(e.target.value);
                } else {
                  rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                }
                onFormChange('cedulaRepLegalSuplente', rawValue);
              }}
              placeholder={{
                CC: '25.456.325',
                NIT: '900.123.456-7',
                CE: '1.234.567',
                PP: 'AB1234567'
              }[formData.tipoDocumentoRepLegalSuplente || 'CC']}
              helperText={{
                CC: 'Formato automático: 12.345.678',
                NIT: 'Formato automático: 900.123.456-7',
                CE: 'Formato automático: 1.234.567',
                PP: 'Solo letras y números (mayúsculas)'
              }[formData.tipoDocumentoRepLegalSuplente || 'CC']}
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
                    fontWeight: 600,
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
                    fontWeight: 600,
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
                    fontWeight: 600,
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
          
          {/* Validación Uso de Suelos */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Input oculto - siempre disponible */}
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="edit-validacion-uso-suelos-file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      addNotification('El archivo no debe superar 10MB', 'error');
                      e.target.value = '';
                      return;
                    }
                    setValidacionUsoSuelosFile(file);
                    addNotification('Archivo de Validación Uso de Suelos seleccionado', 'success');
                  }
                }}
              />
              
              {/* Documento existente */}
              {existingValidacionUsoSuelos && !validacionUsoSuelosFile && (
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
                      Validación Uso de Suelos (Actual)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                      {existingValidacionUsoSuelos.name || 'Documento guardado'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => document.getElementById('edit-validacion-uso-suelos-file').click()}
                      sx={{ flex: 1, borderRadius: 1.5 }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => onDeleteDocument('validacionUsoSuelos')}
                      sx={{ flex: 1, borderRadius: 1.5 }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </Paper>
              )}
              
              {/* Subir nuevo documento */}
              {(!existingValidacionUsoSuelos || validacionUsoSuelosFile) && (
                <>
                  <label htmlFor="edit-validacion-uso-suelos-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={validacionUsoSuelosFile ? <CheckCircleIcon /> : <CloudUploadIcon />}
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        borderColor: validacionUsoSuelosFile ? 'success.main' : 'primary.main',
                        color: validacionUsoSuelosFile ? 'success.main' : 'primary.main',
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          borderStyle: 'dashed',
                          backgroundColor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                    >
                      {validacionUsoSuelosFile ? 'Validación Uso de Suelos ✓' : existingValidacionUsoSuelos ? 'Reemplazar Validación Uso de Suelos' : 'Adjuntar Validación Uso de Suelos'}
                    </Button>
                  </label>
                  {validacionUsoSuelosFile && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PdfIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1, wordBreak: 'break-all' }}>
                        {validacionUsoSuelosFile.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setValidacionUsoSuelosFile(null);
                          document.getElementById('edit-validacion-uso-suelos-file').value = '';
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
                    fontWeight: 600,
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
      
      <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={saving || uploadingFiles}
          sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || uploadingFiles}
          startIcon={<SaveIcon />}
          sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
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
    </>
  );
};

export default EditSalaModal;
