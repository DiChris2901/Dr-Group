import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  alpha,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const MotionBox = motion(Box);
const MotionListItem = motion(ListItem);

const GroupInfoDialog = ({ open, onClose, conversationId }) => {
  const { 
    getConversation, 
    getGroupMembers, 
    isGroupAdmin,
    removeGroupMember,
    getAllUsers,
    addGroupMember
  } = useChat();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [loading, setLoading] = useState(false);

  const conversation = getConversation(conversationId);
  const members = getGroupMembers(conversationId);
  const isAdmin = isGroupAdmin(conversationId);

  // Filtrar miembros por búsqueda
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;

    const search = searchTerm.toLowerCase();
    return members.filter(member => 
      member.name.toLowerCase().includes(search)
    );
  }, [members, searchTerm]);

  // Manejar remover miembro
  const handleRemoveMember = async (userId) => {
    if (!isAdmin) return;

    const confirmed = window.confirm('¿Estás seguro de remover este miembro del grupo?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await removeGroupMember(conversationId, userId);
    } catch (err) {
      console.error('Error removiendo miembro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!conversation || conversation.type !== 'group') {
    return null;
  }

  const groupName = conversation.metadata?.groupName || 'Grupo sin nombre';
  const groupPhoto = conversation.metadata?.groupPhoto;
  const memberCount = members.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={600}>
            Información del Grupo
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {/* Encabezado del grupo */}
        <Box mb={3} textAlign="center">
          <Avatar
            src={groupPhoto}
            sx={{
              width: 100,
              height: 100,
              margin: '0 auto',
              mb: 1.5,
              bgcolor: 'primary.main',
              fontSize: 36,
              fontWeight: 600
            }}
          >
            {groupName[0].toUpperCase()}
          </Avatar>
          
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}>
            <Typography variant="h6" fontWeight={600}>
              {groupName}
            </Typography>
            {isAdmin && (
              <Tooltip title="Editar nombre">
                <IconButton size="small" color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Acciones de admin */}
        {isAdmin && (
          <Box mb={2} display="flex" gap={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setShowAddMember(!showAddMember)}
              sx={{ borderRadius: 2 }}
            >
              Agregar Miembro
            </Button>
          </Box>
        )}

        {/* Búsqueda de miembros */}
        <TextField
          fullWidth
          placeholder="Buscar miembro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
          sx={{ mb: 1.5 }}
        />

        {/* Lista de miembros */}
        <Typography variant="subtitle2" color="text.secondary" mb={1} fontWeight={600}>
          Miembros del Grupo
        </Typography>

        <Box
          sx={{
            maxHeight: 400,
            overflowY: 'auto',
            border: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            bgcolor: theme => alpha(theme.palette.background.default, 0.5)
          }}
        >
          <List disablePadding>
            <AnimatePresence>
              {filteredMembers.map((member, index) => {
                const isCurrentUser = member.id === currentUser?.uid;
                const canRemove = isAdmin && !member.isCreator && !isCurrentUser;

                return (
                  <MotionListItem
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: theme => alpha(theme.palette.action.hover, 0.05)
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={member.photoURL}>
                        {member.name[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={500}>
                            {member.name}
                            {isCurrentUser && ' (Tú)'}
                          </Typography>
                          {member.isAdmin && (
                            <Chip
                              icon={<AdminIcon />}
                              label="Admin"
                              size="small"
                              color="primary"
                              sx={{ 
                                height: 20,
                                '& .MuiChip-icon': { fontSize: 14 }
                              }}
                            />
                          )}
                          {member.isCreator && (
                            <Chip
                              label="Creador"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={member.isCreator ? 'Creador del grupo' : null}
                    />

                    {canRemove && (
                      <ListItemSecondaryAction>
                        <Tooltip title="Remover del grupo">
                          <IconButton
                            edge="end"
                            color="error"
                            size="small"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={loading}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    )}
                  </MotionListItem>
                );
              })}
            </AnimatePresence>
          </List>
        </Box>

        {filteredMembers.length === 0 && (
          <Box py={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              No se encontraron miembros
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<ExitIcon />}
          sx={{ borderRadius: 2 }}
        >
          Salir del Grupo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupInfoDialog;
