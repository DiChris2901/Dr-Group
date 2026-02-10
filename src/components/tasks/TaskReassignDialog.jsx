import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Paper,
  Button,
  IconButton,
  Autocomplete,
  TextField,
  CircularProgress,
  alpha,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useDelegatedTasks } from '../../hooks/useDelegatedTasks';

/**
 * TaskReassignDialog - Modal para reasignar tareas
 * Diseño: MODAL_DESIGN_SYSTEM.md estrictamente
 */
const TaskReassignDialog = ({ open, onClose, task }) => {
  const theme = useTheme();
  const { assignTask } = useDelegatedTasks();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [razon, setRazon] = useState('');
  const [error, setError] = useState('');

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

    if (open) {
      fetchUsers();
      setSelectedUser(null);
      setRazon('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Debes seleccionar un usuario');
      return;
    }

    if (!razon.trim()) {
      setError('Debes proporcionar una razón para la reasignación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await assignTask(task.id, selectedUser, razon);
      onClose();
    } catch (error) {
      console.error('Error al reasignar tarea:', error);
      setError('Error al reasignar la tarea. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
      {/* HEADER */}
      <DialogTitle sx={{ 
        p: 3,
        pb: 3,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              width: 44,
              height: 44
            }}
          >
            <SwapHorizIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              mb: 0.25
            }}>
              Reasignar Tarea
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              display: 'block'
            }}>
              Transferir tarea a otro usuario
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.error.main, 0.08),
              color: 'error.main'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3, px: 3 }}>
        {/* Información de la tarea actual */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mt: 3,
            mb: 3,
            borderRadius: 2, 
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AssignmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography 
              variant="caption" 
              sx={{ 
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 600,
                color: 'text.secondary'
              }}
            >
              Tarea Actual
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {task.titulo}
          </Typography>
          
          {task.asignadoA && (
            <Box sx={{ 
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5 
            }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Asignado actualmente a:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={task.asignadoA.photoURL} sx={{ width: 24, height: 24 }}>
                  {task.asignadoA.nombre?.charAt(0)}
                </Avatar>
                <Typography variant="body2" fontWeight={500}>
                  {task.asignadoA.nombre || task.asignadoA.email}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Selección de nuevo usuario */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography 
              variant="caption" 
              sx={{ 
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 600,
                color: 'text.secondary'
              }}
            >
              Nuevo Asignado
            </Typography>
          </Box>

          <Autocomplete
            options={users}
            getOptionLabel={(option) => option.nombre || option.email}
            value={selectedUser}
            onChange={(event, newValue) => {
              setSelectedUser(newValue);
              setError('');
            }}
            loading={loadingUsers}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar Usuario"
                placeholder="Buscar por nombre o email"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar src={option.photoURL} sx={{ width: 32, height: 32 }}>
                    {option.nombre?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />

          <TextField
            fullWidth
            label="Razón de la Reasignación"
            placeholder="¿Por qué se está reasignando esta tarea?"
            value={razon}
            onChange={(e) => {
              setRazon(e.target.value);
              setError('');
            }}
            multiline
            rows={3}
            required
            error={!!error && !razon.trim()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />
        </Paper>

        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              bgcolor: alpha(theme.palette.error.main, 0.08),
              mt: 2
            }}
          >
            <Typography variant="body2" color="error" fontWeight={500}>
              {error}
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          fullWidth
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            py: 1.25,
            borderColor: alpha(theme.palette.primary.main, 0.5),
            color: 'primary.main',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedUser}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SwapHorizIcon />}
          fullWidth
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            py: 1.25,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Reasignando...' : 'Reasignar Tarea'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskReassignDialog;
