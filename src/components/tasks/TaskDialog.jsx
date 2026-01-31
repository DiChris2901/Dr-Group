import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Divider,
  Avatar,
  Autocomplete,
  Paper,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useDelegatedTasks } from '../../hooks/useDelegatedTasks';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * TaskDialog - Modal para crear/editar tareas delegadas
 * Diseño: Siguiendo MODAL_DESIGN_SYSTEM.md estrictamente
 */
const TaskDialog = ({ open, onClose, task = null }) => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const { createTask, updateTask } = useDelegatedTasks();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fechaVencimiento: '',
    empresa: null,
    asignadoA: null
  });

  const [errors, setErrors] = useState({});

  // Cargar usuarios disponibles
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = [];
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersData.push({
            uid: doc.id,
            nombre: userData.name || userData.displayName || userData.email,
            email: userData.email,
            photoURL: userData.photoURL
          });
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const companiesQuery = query(collection(db, 'companies'));
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesData = [];
        companiesSnapshot.forEach((doc) => {
          const companyData = doc.data();
          companiesData.push({
            id: doc.id,
            nombre: companyData.name || companyData.nombre,
            logoURL: companyData.logoURL || companyData.logo || companyData.logoUrl
          });
        });
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    if (open) {
      fetchUsers();
      fetchCompanies();
    }
  }, [open]);

  useEffect(() => {
    if (task && companies.length > 0) {
      // Encontrar el objeto empresa si existe
      const empresaObj = task.empresa 
        ? companies.find(c => c.nombre === task.empresa) || null
        : null;

      setFormData({
        titulo: task.titulo || '',
        descripcion: task.descripcion || '',
        prioridad: task.prioridad || 'media',
        fechaVencimiento: task.fechaVencimiento 
          ? new Date(task.fechaVencimiento.seconds * 1000).toISOString().split('T')[0] 
          : '',
        empresa: empresaObj,
        asignadoA: task.asignadoA || null
      });
    } else if (!task) {
      setFormData({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        fechaVencimiento: '',
        empresa: null,
        asignadoA: null
      });
    }
    setErrors({});
  }, [task, open, companies]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (!formData.prioridad) {
      newErrors.prioridad = 'La prioridad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Preparar datos para enviar
      const dataToSubmit = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        categoria: 'general',
        // Convertir fecha string a Date object si existe
        fechaVencimiento: formData.fechaVencimiento 
          ? new Date(formData.fechaVencimiento) 
          : null,
        // Guardar el objeto completo de la empresa (con id, nombre, logoURL)
        empresa: formData.empresa || null,
        // Guardar el objeto completo del usuario asignado (con uid, nombre, email)
        asignadoA: formData.asignadoA || null
      };

      console.log('📝 Guardando tarea en Firestore...', {
        titulo: dataToSubmit.titulo,
        asignadoA: dataToSubmit.asignadoA,
        prioridad: dataToSubmit.prioridad,
        empresa: dataToSubmit.empresa || 'Sin empresa',
        fechaVencimiento: dataToSubmit.fechaVencimiento
      });

      if (task) {
        await updateTask(task.id, dataToSubmit);
        console.log('✅ Tarea actualizada exitosamente en Firestore');
      } else {
        const taskId = await createTask(dataToSubmit);
        console.log('✅ Tarea creada exitosamente en Firestore con ID:', taskId);
      }
      onClose();
    } catch (error) {
      console.error('❌ Error completo al guardar tarea:', error);
      console.error('❌ Mensaje:', error.message);
      console.error('❌ Stack:', error.stack);
      setErrors({ submit: `Error: ${error.message || 'Error desconocido'}` });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente':
        return theme.palette.error.main;
      case 'alta':
        return theme.palette.warning.main;
      case 'media':
        return theme.palette.info.main;
      case 'baja':
        return theme.palette.grey[400];
      default:
        return theme.palette.grey[300];
    }
  };

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
      {/* HEADER EXACTO SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogTitle sx={{ 
        pb: 2,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            {task ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              mb: 0,
              color: 'text.primary'
            }}>
              {task ? 'Editar Tarea' : 'Nueva Tarea'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {task ? 'Modificar tarea existente' : 'Crear tarea para asignar'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 5 }}>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* INFORMACIÓN PRINCIPAL */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2, 
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                background: theme.palette.background.paper,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <Typography variant="overline" sx={{ 
                  fontWeight: 600, 
                  color: 'primary.main',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem'
                }}>
                  <AssignmentIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Información de la Tarea
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {/* Título */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título de la Tarea"
                      value={formData.titulo}
                      onChange={(e) => handleChange('titulo', e.target.value)}
                      error={Boolean(errors.titulo)}
                      helperText={errors.titulo}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main
                          }
                        }
                      }}
                    />
                  </Grid>

                  {/* Descripción */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Descripción"
                      value={formData.descripcion}
                      onChange={(e) => handleChange('descripcion', e.target.value)}
                      placeholder="Describe los detalles de la tarea..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>

                  {/* Asignar a Usuario */}
                  <Grid item xs={12}>
                    <Autocomplete
                      options={users}
                      loading={loadingUsers}
                      getOptionLabel={(option) => option.nombre}
                      value={formData.asignadoA}
                      onChange={(event, newValue) => handleChange('asignadoA', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Asignar a Usuario"
                          placeholder="Selecciona un usuario..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <PersonIcon sx={{ color: 'text.secondary', ml: 1, mr: -0.5 }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar 
                            src={option.photoURL} 
                            sx={{ width: 32, height: 32 }}
                          >
                            {option.nombre.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {option.nombre}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {option.email}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>

                  {/* Prioridad y Fecha */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Prioridad</InputLabel>
                      <Select
                        value={formData.prioridad}
                        onChange={(e) => handleChange('prioridad', e.target.value)}
                        label="Prioridad"
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value="baja">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.grey[400]
                              }}
                            />
                            Baja
                          </Box>
                        </MenuItem>
                        <MenuItem value="media">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.info.main
                              }}
                            />
                            Media
                          </Box>
                        </MenuItem>
                        <MenuItem value="alta">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.warning.main
                              }}
                            />
                            Alta
                          </Box>
                        </MenuItem>
                        <MenuItem value="urgente">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.error.main
                              }}
                            />
                            Urgente
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Fecha de Vencimiento */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha de Vencimiento"
                      value={formData.fechaVencimiento}
                      onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>

                  {/* Empresa */}
                  <Grid item xs={12}>
                    <Autocomplete
                      options={companies}
                      loading={loadingCompanies}
                      getOptionLabel={(option) => option.nombre || ''}
                      value={formData.empresa}
                      onChange={(event, newValue) => handleChange('empresa', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Empresa"
                          placeholder="Selecciona una empresa..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <BusinessIcon sx={{ color: 'text.secondary', ml: 1, mr: -0.5 }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {loadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {option.logoURL ? (
                            <Avatar 
                              src={option.logoURL} 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: 'transparent',
                                '& img': {
                                  objectFit: 'contain'
                                }
                              }}
                            >
                              {option.nombre.charAt(0).toUpperCase()}
                            </Avatar>
                          ) : (
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main'
                              }}
                            >
                              <BusinessIcon fontSize="small" />
                            </Avatar>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {option.nombre}
                          </Typography>
                        </Box>
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Error de submit */}
                {errors.submit && (
                  <Box sx={{ mt: 3 }}>
                    <Typography color="error" variant="body2">
                      {errors.submit}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <Divider />

      {/* ACTIONS SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            borderColor: alpha(theme.palette.text.primary, 0.2),
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: alpha(theme.palette.text.primary, 0.4),
              bgcolor: alpha(theme.palette.text.primary, 0.04)
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            }
          }}
        >
          {loading ? 'Guardando...' : (task ? 'Actualizar' : 'Crear Tarea')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;
