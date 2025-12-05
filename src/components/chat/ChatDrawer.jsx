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
  Button,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  ChatBubbleOutline as ChatIcon,
  GroupAdd as GroupAddIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
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
const ChatDrawer = ({ open, onClose, pendingConversation, onConversationOpened }) => {
  const theme = useTheme();
  const { 
    getAllUsers, 
    getOrCreateConversation, 
    setActiveConversationId, 
    activeConversationId,
    loading: chatLoading,
    error: chatError,
    conversations
  } = useChat();
  
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [showContacts, setShowContacts] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // 🎯 Abrir conversación pendiente automáticamente
  useEffect(() => {
    if (open && pendingConversation && conversations.length > 0) {
      // Verificar si la conversación existe
      const conversation = conversations.find(c => c.id === pendingConversation);
      
      if (conversation) {
        setActiveConversationId(pendingConversation);
        setShowContacts(false);
        
        // Notificar que se abrió la conversación
        if (onConversationOpened) {
          onConversationOpened();
        }
      }
    }
  }, [open, pendingConversation, conversations, setActiveConversationId, onConversationOpened]);

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
    setIsFullscreen(false);
    onClose();
  };

  // 🖥️ Toggle pantalla completa
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 👥 Manejar creación de grupo
  const handleGroupCreated = async (groupId) => {
    setShowCreateGroup(false);
    setActiveConversationId(groupId);
    setShowContacts(false);
    setSelectedUserInfo(null); // ✅ Limpiar info de usuario al abrir grupo
  };

  // 👥 Manejar selección de grupo existente
  const handleSelectGroup = (conversationId) => {
    setActiveConversationId(conversationId);
    setSelectedUserInfo(null); // ✅ Limpiar info de usuario al abrir grupo
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
        background: `linear-gradient(135deg, ${alpha('#667eea', 0.08)} 0%, ${alpha('#764ba2', 0.08)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${alpha('#667eea', 0.15)} 0%, transparent 70%)`,
          animation: 'pulse 4s ease-in-out infinite'
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.1)' }
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${alpha('#667eea', 0.15)} 0%, ${alpha('#764ba2', 0.15)} 100%)`,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
            mb: 3
          }}
        >
          <ChatIcon
            sx={{
              fontSize: 64,
              color: 'primary.main',
              opacity: 0.8
            }}
          />
        </Box>
      </motion.div>
      <Typography 
        variant="h5" 
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          mb: 1,
          position: 'relative',
          zIndex: 1
        }}
      >
        💬 Mensajería Interna
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        textAlign="center" 
        maxWidth={300} 
        px={2}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        Selecciona un contacto o grupo para iniciar una conversación
      </Typography>
    </Box>
  );

  // Espacio reservado para el Taskbar
  const taskbarSpace = 96; // 80px de altura del taskbar + 16px de margen

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100vw' : { xs: '100%', sm: 520, md: 900, lg: 1100 },
          maxWidth: '100vw',
          height: isFullscreen ? '100vh' : `calc(100vh - ${taskbarSpace}px)`,
          bottom: isFullscreen ? 0 : taskbarSpace,
          top: isFullscreen ? 0 : 'auto',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: isFullscreen ? 1400 : 1200
        }
      }}
    >
      {/* Header del Drawer - Diseño Spectacular */}
      <Paper
        elevation={0}
        sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 0,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
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

            <Tooltip title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
              <IconButton
                onClick={handleToggleFullscreen}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)'
                  }
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

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
                onSelectGroup={handleSelectGroup}
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
              ) : activeConversationId ? (
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
