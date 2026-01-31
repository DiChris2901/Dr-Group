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
  Person as PersonIcon
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
      {/* HEADER EXACTO SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogTitle sx={{ 
        pt: 2,
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
            <SwapHorizIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              mb: 0,
              color: 'text.primary'
            }}>
              Reasignar Tarea
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Transferir tarea a otro usuario
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 4 }}>
        {/* Información de la tarea actual */}
        <Paper sx={{ 
          p: 3, 
          mt: 3,
          mb: 4,
          borderRadius: 2, 
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Typography variant="overline" sx={{ 
            fontWeight: 600, 
            color: 'info.main',
            letterSpacing: 0.8,
            mb: 1,
            display: 'block'
          }}>
            TAREA
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {task.titulo}
          </Typography>
          
          {task.asignadoA && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Asignado actualmente a:
              </Typography>
              <Chip
                avatar={
                  <Avatar src={task.asignadoA.photoURL} sx={{ width: 20, height: 20 }}>
                    {task.asignadoA.nombre?.charAt(0)}
                  </Avatar>
                }
                label={task.asignadoA.nombre || task.asignadoA.email}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          )}
        </Paper>

        {/* Selección de nuevo usuario */}
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2, 
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Typography variant="overline" sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            letterSpacing: 0.8,
            mb: 2,
            display: 'block'
          }}>
            NUEVO ASIGNADO
          </Typography>

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
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            )}
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
          />
        </Paper>

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      {/* FOOTER EXACTO SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogActions sx={{ 
        p: 2.5, 
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50]
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedUser}
          startIcon={loading ? <CircularProgress size={16} /> : <SwapHorizIcon />}
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {loading ? 'Reasignando...' : 'Reasignar Tarea'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskReassignDialog;
