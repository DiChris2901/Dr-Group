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
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import MoneyIcon from '@mui/icons-material/AttachMoney';

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
  parseCurrencyValue
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
              value={formatCurrencyInput(formData.administracion || 0)}
              onChange={(e) => {
                const numericValue = parseCurrencyValue(e.target.value);
                onFormChange('administracion', numericValue);
              }}
              helperText="Costo de administración"
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
              value={formatCurrencyInput(formData.conexion || 0)}
              onChange={(e) => {
                const numericValue = parseCurrencyValue(e.target.value);
                onFormChange('conexion', numericValue);
              }}
              helperText="Costo de conexión"
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
          onClick={onSave}
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
            'Actualizar Sala'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSalaModal;
