import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge as MuiBadge
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

/**
 * Lista de contactos (usuarios registrados) estilo WhatsApp
 */
const ContactsList = ({ 
  users = [], 
  selectedUserId, 
  onSelectUser,
  loading = false 
}) => {
  const { currentUser } = useAuth();
  const { usersPresence, unreadByUser } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [userInfoDialogOpen, setUserInfoDialogOpen] = useState(false);

  // Helper robusto para identificar si un item es el usuario actual
  const isMe = useCallback((u) => {
    if (!u || !currentUser) return false;
    // Preferimos id de documento, luego uid del payload, y de respaldo email
    return (
      u.id === currentUser.uid ||
      u.uid === currentUser.uid ||
      (!!u.email && !!currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [currentUser]);

  // 🐛 Debug: Log de presencia y filtrado
  React.useEffect(() => {
    console.log('� currentUser?.uid:', currentUser?.uid);
    console.log('�👥 Users Presence:', usersPresence);
    console.log('📋 Users:', users.map(u => ({ 
      id: u.id,
      uid: u.uid, 
      name: u.displayName || u.name, 
      online: usersPresence[u.id]?.state,
      isMe: u.id === currentUser?.uid
    })));
  }, [usersPresence, users, currentUser]);

  const handleAvatarClick = (event, user) => {
    event.stopPropagation(); // Evitar que se active onSelectUser
    setSelectedUserInfo(user);
    setUserInfoDialogOpen(true);
  };

  const handleCloseUserInfo = () => {
    setUserInfoDialogOpen(false);
    setSelectedUserInfo(null);
  };

  // 🔍 D. Configurar Fuse.js para búsqueda fuzzy optimizada
  const fuse = useMemo(() => {
    const usersWithoutMe = users.filter(user => !isMe(user));
    
    return new Fuse(usersWithoutMe, {
      keys: [
        { name: 'displayName', weight: 2 }, // Prioridad alta al nombre
        { name: 'name', weight: 2 },
        { name: 'email', weight: 1 },
        { name: 'role', weight: 0.5 }
      ],
      threshold: 0.4, // Tolerancia a errores (0 = exacto, 1 = muy tolerante)
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true
    });
  }, [users, currentUser?.uid]);

  // 🔍 D. Búsqueda fuzzy con Fuse.js
  const filteredUsers = useMemo(() => {
    const usersWithoutMe = users.filter(user => !isMe(user));

    if (!searchTerm || searchTerm.length < 2) {
      // Sin búsqueda, devolver todos ordenados
      return usersWithoutMe.sort((a, b) => {
        const nameA = (a.displayName || a.name || a.email || '').toLowerCase();
        const nameB = (b.displayName || b.name || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    // Con búsqueda, usar Fuse.js
    const results = fuse.search(searchTerm);
    return results.map(result => result.item);
  }, [users, currentUser?.uid, searchTerm, fuse]);

  // Lista final a renderizar (ya sin mí)
  const displayedUsers = useMemo(() => filteredUsers.filter(u => !isMe(u)), [filteredUsers, isMe]);

  // Color del rol según el tipo
  const getRoleColor = (role) => {
    const colors = {
      'ADMIN': 'error',
      'GERENTE': 'warning',
      'CONTADOR': 'info',
      'VISUALIZADOR': 'default'
    };
    return colors[role] || 'default';
  };

  // Label del rol
  const getRoleLabel = (role) => {
    const labels = {
      'ADMIN': 'Admin',
      'GERENTE': 'Gerente',
      'CONTADOR': 'Contador',
      'VISUALIZADOR': 'Visualizador'
    };
    return labels[role] || role;
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider'
      }}
    >
      {/* Header Sobrio */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(useAuth().currentUser ? '#667eea' : '#f5f5f5', 0.04)
        }}
      >
        <Typography 
          variant="overline" 
          sx={{
            fontWeight: 600, 
            fontSize: '0.65rem', 
            color: 'text.secondary',
            letterSpacing: 1
          }}
        >
          CONTACTOS DISPONIBLES
        </Typography>
        <Typography 
          variant="h6" 
          fontWeight={600} 
          sx={{ 
            mt: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          👥 {displayedUsers.length} {displayedUsers.length === 1 ? 'Usuario' : 'Usuarios'}
        </Typography>
      </Box>

      {/* Barra de búsqueda Sobrio */}
      <Box sx={{ p: 2.5, pt: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre, email o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => setSearchTerm('')}
                  sx={{
                    '&:hover': {
                      bgcolor: alpha('#000', 0.04)
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: alpha('#000', 0.02),
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha('#000', 0.04),
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              },
              '&.Mui-focused': {
                bgcolor: 'background.paper',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }
          }}
        />
      </Box>

      {/* Lista de contactos */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            px={3}
          >
            <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {searchTerm ? 'No se encontraron contactos' : 'No hay usuarios disponibles'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            <AnimatePresence>
              {displayedUsers.map((user, index) => {
                const isSelected = selectedUserId === user.uid;
                const userName = user.displayName || user.name || user.email?.split('@')[0] || 'Usuario';
                const userEmail = user.email || '';
                const userRole = user.role || 'VISUALIZADOR';
                const userPhoto = user.photoURL || user.photo || '';

                return (
                  <motion.div
                    key={user.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => onSelectUser(user.uid)}
                        sx={{
                          py: 1.5,
                          px: 2.5,
                          bgcolor: isSelected ? alpha('#667eea', 0.08) : 'transparent',
                          borderLeft: isSelected ? 3 : 0,
                          borderColor: 'primary.main',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: isSelected ? alpha('#667eea', 0.12) : alpha('#000', 0.04),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          },
                          '&.Mui-selected': {
                            bgcolor: alpha('#667eea', 0.08),
                            '&:hover': {
                              bgcolor: alpha('#667eea', 0.12)
                            }
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <MuiBadge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            invisible={
                              isMe(user) ||
                              !usersPresence[user.id] ||
                              !(usersPresence[user.id]?.online === true || usersPresence[user.id]?.state === 'online')
                            }
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: '#44b700',
                                color: '#44b700',
                                boxShadow: '0 0 0 2.5px white',
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                border: '2px solid white',
                              },
                            }}
                          >
                            <Avatar
                              src={userPhoto}
                              alt={userName}
                              onClick={(e) => handleAvatarClick(e, user)}
                              sx={{
                                width: 44,
                                height: 44,
                                border: isSelected ? 2 : 0,
                                borderColor: 'primary.main',
                                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                                }
                              }}
                            >
                              {userName.charAt(0).toUpperCase()}
                            </Avatar>
                          </MuiBadge>
                        </ListItemAvatar>

                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography
                                variant="body1"
                                fontWeight={isSelected ? 600 : 500}
                                noWrap
                              >
                                {userName}
                              </Typography>
                              <Chip
                                label={getRoleLabel(userRole)}
                                color={getRoleColor(userRole)}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                              {unreadByUser?.[user.id] > 0 && (
                                <Chip
                                  label={unreadByUser[user.id]}
                                  color="primary"
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {userEmail}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < filteredUsers.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </List>
        )}
      </Box>

      {/* Dialog de Información del Usuario */}
      <Dialog
        open={userInfoDialogOpen}
        onClose={handleCloseUserInfo}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: { xs: 0, md: 8 }
          }
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 2,
            border: 1,
            borderColor: alpha('#000', 0.08),
            m: { xs: 2, md: 0 }
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: alpha('#667eea', 0.04),
              borderBottom: 1,
              borderColor: alpha('#000', 0.08)
            }}
          >
            <Typography variant="body1" fontWeight={600} fontSize="1.1rem">
              Información del Usuario
            </Typography>
            <IconButton size="small" onClick={handleCloseUserInfo}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedUserInfo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              {/* Avatar Grande */}
              <Avatar
                src={selectedUserInfo.photoURL || selectedUserInfo.photo}
                alt={selectedUserInfo.displayName || selectedUserInfo.name}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: 3,
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              >
                {(selectedUserInfo.displayName || selectedUserInfo.name || selectedUserInfo.email || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>

              {/* Nombre */}
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {selectedUserInfo.displayName || selectedUserInfo.name || 'Usuario'}
              </Typography>

              {/* Rol */}
              <Chip
                label={getRoleLabel(selectedUserInfo.role || 'VISUALIZADOR')}
                color={getRoleColor(selectedUserInfo.role || 'VISUALIZADOR')}
                sx={{ mb: 3 }}
              />

              {/* Información adicional */}
              <Box sx={{ width: '100%' }}>
                {/* Email */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    mb: 1,
                    bgcolor: alpha('#000', 0.02),
                    borderRadius: 1,
                    border: 1,
                    borderColor: alpha('#000', 0.08)
                  }}
                >
                  <EmailIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Correo electrónico
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedUserInfo.email || 'No disponible'}
                    </Typography>
                  </Box>
                </Box>

                {/* Teléfono */}
                {selectedUserInfo.phone && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      mb: 1,
                      bgcolor: alpha('#000', 0.02),
                      borderRadius: 1,
                      border: 1,
                      borderColor: alpha('#000', 0.08)
                    }}
                  >
                    <PhoneIcon color="success" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Teléfono / WhatsApp
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedUserInfo.phone}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => window.open(`https://wa.me/${selectedUserInfo.phone.replace(/\D/g, '')}`, '_blank')}
                      sx={{
                        bgcolor: '#25D366',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#128C7E',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {/* UID */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    bgcolor: alpha('#000', 0.02),
                    borderRadius: 1,
                    border: 1,
                    borderColor: alpha('#000', 0.08)
                  }}
                >
                  <BadgeIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      ID de Usuario
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                      }}
                    >
                      {selectedUserInfo.uid?.substring(0, 20)}...
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            variant="contained"
            onClick={handleCloseUserInfo}
            fullWidth
            sx={{ boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactsList;
