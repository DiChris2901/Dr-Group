import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Checkbox,
  InputAdornment,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  AddPhotoAlternate as PhotoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const MotionBox = motion(Box);
const MotionListItem = motion(ListItem);

const CreateGroupModal = ({ open, onClose, onGroupCreated }) => {
  const { createGroupChat, getAllUsers } = useChat();
  const { currentUser } = useAuth();

  const [groupName, setGroupName] = useState('');
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errors, setErrors] = useState({});

  // Cargar usuarios al abrir modal
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getAllUsers();
      // Filtrar usuario actual
      const filteredUsers = users.filter(u => u.id !== currentUser?.uid);
      setAllUsers(filteredUsers);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;

    const search = searchTerm.toLowerCase();
    return allUsers.filter(user => {
      const name = (user.displayName || user.nombre || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(search) || email.includes(search);
    });
  }, [allUsers, searchTerm]);

  // Manejar selección de miembro
  const handleToggleMember = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Manejar foto de grupo
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Solo se permiten imágenes' }));
        return;
      }

      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'La imagen no debe superar 2MB' }));
        return;
      }

      setGroupPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, photo: null }));
    }
  };

  const handleRemovePhoto = () => {
    setGroupPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!groupName.trim()) {
      newErrors.groupName = 'El nombre del grupo es obligatorio';
    } else if (groupName.trim().length < 3) {
      newErrors.groupName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (selectedMembers.length < 2) {
      newErrors.members = 'Selecciona al menos 2 miembros';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear grupo
  const handleCreateGroup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Si hay foto, subirla a Firebase Storage primero
      // Por ahora solo usamos la URL de preview
      const photoURL = photoPreview;

      const groupId = await createGroupChat(groupName, selectedMembers, photoURL);
      
      // Resetear form
      handleClose();
      
      if (onGroupCreated) {
        onGroupCreated(groupId);
      }
    } catch (err) {
      console.error('Error creando grupo:', err);
      setErrors({ submit: err.message || 'Error al crear grupo' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setGroupPhoto(null);
    setPhotoPreview(null);
    setSearchTerm('');
    setSelectedMembers([]);
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <GroupIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Crear Grupo
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {/* Foto del grupo */}
        <Box mb={2.5} textAlign="center">
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="group-photo-upload"
            type="file"
            onChange={handlePhotoChange}
          />
          <label htmlFor="group-photo-upload">
            <Box
              sx={{
                display: 'inline-flex',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <Avatar
                src={photoPreview}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                  border: theme => `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.15)
                  }
                }}
              >
                <PhotoIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Avatar>
              {photoPreview && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemovePhoto();
                  }}
                  sx={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </label>
          {errors.photo && (
            <Typography variant="caption" color="error" display="block" mt={0.5}>
              {errors.photo}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Haz clic para subir foto (opcional)
          </Typography>
        </Box>

        {/* Nombre del grupo */}
        <TextField
          fullWidth
          label="Nombre del Grupo"
          value={groupName}
          onChange={(e) => {
            setGroupName(e.target.value);
            setErrors(prev => ({ ...prev, groupName: null }));
          }}
          error={!!errors.groupName}
          helperText={errors.groupName}
          placeholder="Ej: Equipo de Ventas"
          sx={{ mb: 2.5 }}
          inputProps={{ maxLength: 50 }}
        />

        {/* Búsqueda de usuarios */}
        <TextField
          fullWidth
          placeholder="Buscar miembros..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
          sx={{ mb: 1.5 }}
        />

        {/* Miembros seleccionados */}
        {selectedMembers.length > 0 && (
          <Box mb={1.5} display="flex" flexWrap="wrap" gap={1}>
            {selectedMembers.map(userId => {
              const user = allUsers.find(u => u.id === userId);
              if (!user) return null;
              
              return (
                <Chip
                  key={userId}
                  label={user.displayName || user.nombre || 'Usuario'}
                  onDelete={() => handleToggleMember(userId)}
                  size="small"
                  avatar={<Avatar src={user.photoURL} />}
                />
              );
            })}
          </Box>
        )}

        {errors.members && (
          <Typography variant="caption" color="error" display="block" mb={1}>
            {errors.members}
          </Typography>
        )}

        {/* Lista de usuarios */}
        <Box
          sx={{
            maxHeight: 300,
            overflowY: 'auto',
            border: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            bgcolor: theme => alpha(theme.palette.background.default, 0.5)
          }}
        >
          {loadingUsers ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No se encontraron usuarios
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              <AnimatePresence>
                {filteredUsers.map((user, index) => (
                  <MotionListItem
                    key={user.id}
                    disablePadding
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ListItemButton
                      onClick={() => handleToggleMember(user.id)}
                      dense
                      sx={{
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: theme => alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedMembers.includes(user.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemAvatar>
                        <Avatar src={user.photoURL}>
                          {(user.displayName || user.nombre || '?')[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.displayName || user.nombre || 'Usuario'}
                        secondary={user.email}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItemButton>
                  </MotionListItem>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Box>

        {errors.submit && (
          <Typography variant="body2" color="error" mt={1.5} textAlign="center">
            {errors.submit}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCreateGroup}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <GroupIcon />}
          sx={{
            borderRadius: 2,
            px: 3
          }}
        >
          {loading ? 'Creando...' : 'Crear Grupo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupModal;
