import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  alpha,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  ChatBubbleOutline as ChatIcon,
  GroupAdd as GroupAddIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import ContactsList from './ContactsList';
import MessageThread from './MessageThread';
import CreateGroupModal from './CreateGroupModal';

/**
 * Drawer lateral de chat estilo WhatsApp Web
 * Diseño sobrio empresarial siguiendo DISENO_SOBRIO_NOTAS.md
 */
const ChatDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const { 
    getAllUsers, 
    getOrCreateConversation, 
    setActiveConversationId, 
    activeConversationId,
    loading: chatLoading,
    error: chatError
  } = useChat();
  
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [showContacts, setShowContacts] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // 🔥 Cargar todos los usuarios al abrir el drawer
  useEffect(() => {
    if (open) {
      const loadUsers = async () => {
        setLoadingUsers(true);
        try {
          const allUsers = await getAllUsers();
          setUsers(allUsers);
        } catch (error) {
          console.error('Error cargando usuarios:', error);
        } finally {
          setLoadingUsers(false);
        }
      };

      loadUsers();
    }
  }, [open, getAllUsers]);

  // 📱 Manejar selección de contacto
  const handleSelectUser = async (userId) => {
    setLoadingConversation(true);
    setSelectedUserId(userId);
    setShowContacts(false); // Ocultar lista de contactos en móvil

    try {
      // Obtener info del usuario seleccionado
      const user = users.find(u => u.uid === userId);
      setSelectedUserInfo(user);

      // Crear o obtener conversación existente
      const conversationId = await getOrCreateConversation(userId);
      setActiveConversationId(conversationId);
    } catch (error) {
      console.error('Error iniciando conversación:', error);
    } finally {
      setLoadingConversation(false);
    }
  };

  // 🔙 Volver a la lista de contactos
  const handleBackToContacts = () => {
    setShowContacts(true);
    setSelectedUserId(null);
    setActiveConversationId(null);
  };

  // 🚪 Cerrar drawer y resetear estado
  const handleClose = () => {
    setShowContacts(true);
    setSelectedUserId(null);
    setActiveConversationId(null);
    onClose();
  };

  // 👥 Manejar creación de grupo
  const handleGroupCreated = async (groupId) => {
    setShowCreateGroup(false);
    setActiveConversationId(groupId);
    setShowContacts(false);
  };

  // 🎨 Estado vacío cuando no hay contacto seleccionado
  const EmptyState = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      sx={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ChatIcon
          sx={{
            fontSize: 80,
            color: 'text.disabled',
            mb: 2,
            opacity: 0.3
          }}
        />
      </motion.div>
      <Typography variant="h6" color="text.secondary" fontWeight={600} gutterBottom>
        💬 Mensajería Interna
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={300} px={2}>
        Selecciona un contacto para iniciar una conversación
      </Typography>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420, md: 720 },
          maxWidth: '100vw',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      {/* Header del Drawer - Diseño Sobrio */}
      <Paper
        elevation={0}
        sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 0,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box>
            <Typography 
              variant="overline" 
              sx={{
                fontWeight: 600, 
                fontSize: '0.7rem', 
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: 1.2
              }}
            >
              COMUNICACIÓN • INTERNA
            </Typography>
            <Typography 
              variant="h5" 
              sx={{
                fontWeight: 700, 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 0.5
              }}
            >
              💬 Mensajería
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                mt: 0.5
              }}
            >
              DR Group Dashboard
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<GroupAddIcon />}
              onClick={() => setShowCreateGroup(true)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)'
                }
              }}
            >
              Nuevo Grupo
            </Button>

            <IconButton 
              onClick={handleClose} 
              sx={{ 
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Contenido del Drawer */}
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 140px)', 
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}>
        {/* ❌ Error global del chat */}
        {chatError ? (
          <Box p={3} width="100%">
            <Alert severity="error">{chatError}</Alert>
          </Box>
        ) : (
          <>
            {/* 📋 PANEL IZQUIERDO: Lista de Contactos */}
            <Box
              sx={{
                width: { xs: showContacts ? '100%' : '0', md: 300 },
                display: { xs: showContacts ? 'block' : 'none', md: 'block' },
                borderRight: { md: 1 },
                borderColor: { md: 'divider' },
                height: '100%',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              <ContactsList
                users={users}
                selectedUserId={selectedUserId}
                onSelectUser={handleSelectUser}
                loading={loadingUsers}
              />
            </Box>

            {/* 💬 PANEL DERECHO: Chat Activo */}
            <Box
              sx={{
                flex: 1,
                display: { xs: showContacts ? 'none' : 'flex', md: 'flex' },
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                bgcolor: 'background.default'
              }}
            >
              {loadingConversation ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <CircularProgress />
                </Box>
              ) : selectedUserId && activeConversationId ? (
                <MessageThread
                  conversationId={activeConversationId}
                  selectedUser={selectedUserInfo}
                  onBack={handleBackToContacts}
                />
              ) : (
                <EmptyState />
              )}
            </Box>
          </>
        )}
      </Box>

      {/* 👥 Modal de Creación de Grupo */}
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
    </Drawer>
  );
};

export default ChatDrawer;
