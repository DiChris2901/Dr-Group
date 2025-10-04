import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useChatMessages } from '../../hooks/useChat';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

/**
 * Thread de mensajes de una conversación
 */
const MessageThread = ({ conversationId, selectedUser, onBack }) => {
  const { currentUser } = useAuth();
  const { getConversation, setActiveConversationId } = useChat();
  const {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    editMessage,
    forwardMessage
  } = useChatMessages(conversationId);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // ⌨️ C. Estado para indicador de "escribiendo..."
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // 📌 Estado para respuestas
  const [replyingTo, setReplyingTo] = useState(null);

  // 👤 Estado para diálogo de información de usuario
  const [userInfoDialogOpen, setUserInfoDialogOpen] = useState(false);

  // 👤 Handlers para el diálogo de usuario
  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setUserInfoDialogOpen(true);
  };

  const handleCloseUserInfo = () => {
    setUserInfoDialogOpen(false);
  };

  const conversation = getConversation(conversationId);
  
  // Usar info del usuario seleccionado si está disponible
  const displayName = selectedUser?.displayName || selectedUser?.name || 'Usuario';
  const displayPhoto = selectedUser?.photoURL || selectedUser?.photo || null;

  // ⌨️ C. Listener para detectar cuando el otro usuario está escribiendo
  useEffect(() => {
    if (!conversationId || !currentUser?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const typing = data.typing || {};
        
        // Verificar si algún otro usuario está escribiendo (no el actual)
        const otherUsersTyping = Object.entries(typing).filter(([userId, timestamp]) => {
          if (userId === currentUser.uid) return false;
          if (!timestamp) return false;
          
          // Considerar "escribiendo" si el timestamp es de los últimos 3 segundos
          const now = Date.now();
          const typingTime = timestamp.toMillis();
          return (now - typingTime) < 3000;
        });

        setOtherUserTyping(otherUsersTyping.length > 0);
      }
    });

    return () => unsubscribe();
  }, [conversationId, currentUser?.uid]);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Marcar mensajes como leídos cuando se visualizan
  useEffect(() => {
    messages.forEach(message => {
      if (message.senderId !== currentUser?.uid && !message.status?.readBy?.includes(currentUser?.uid)) {
        markMessageAsRead(message.id);
      }
    });
  }, [messages, currentUser?.uid, markMessageAsRead]);

  // Detectar scroll para mostrar botón "ir al final"
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!conversation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  // Obtener info del otro participante (fallback a conversation si no hay selectedUser)
  const otherUserId = conversation?.participantIds?.find(id => id !== currentUser?.uid);
  const otherParticipantName = displayName || conversation?.participantNames?.[otherUserId] || 'Usuario';
  const otherParticipantPhoto = displayPhoto || conversation?.participantPhotos?.[otherUserId] || null;

  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default'
      }}
    >
      {/* Header Sobrio */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2.5,
          borderBottom: 1,
          borderColor: alpha(theme.palette.divider, 0.6),
          bgcolor: alpha('#667eea', 0.04),
          gap: 2,
          borderRadius: 0
        }}
      >
        {/* Botón volver (móvil) */}
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{ 
              display: { xs: 'block', md: 'none' },
              '&:hover': {
                bgcolor: alpha('#000', 0.04)
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* Avatar y nombre */}
        <Avatar
          src={otherParticipantPhoto}
          alt={otherParticipantName}
          onClick={handleAvatarClick}
          sx={{ 
            width: 44, 
            height: 44, 
            bgcolor: 'primary.main',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }
          }}
        >
          {!otherParticipantPhoto && <PersonIcon />}
        </Avatar>

        <Box flexGrow={1}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.25 }}>
            {otherParticipantName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            💬 {messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}
          </Typography>
        </Box>

        {/* Opciones */}
        <Tooltip title="Opciones de conversación">
          <IconButton
            sx={{
              '&:hover': {
                bgcolor: alpha('#000', 0.04)
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Área de mensajes Sobrio */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          bgcolor: alpha('#f5f5f5', theme.palette.mode === 'dark' ? 0.02 : 0.3)
        }}
      >
        {loading && messages.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : messages.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={2}
          >
            <Typography variant="h6" color="text.secondary">
              No hay mensajes aún
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Envía el primer mensaje para iniciar la conversación
            </Typography>
          </Box>
        ) : (
          <>
            {/* Botón cargar más mensajes */}
            {hasMore && (
              <Box display="flex" justifyContent="center" py={2}>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={loadMoreMessages}
                >
                  Cargar mensajes anteriores
                </Typography>
              </Box>
            )}

            {/* Lista de mensajes */}
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUser?.uid;
              const showDateDivider =
                index === 0 ||
                new Date(messages[index - 1].createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDateDivider && (
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(message.createdAt).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Divider>
                  )}

                  <MessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                    onDelete={deleteMessage}
                    onEdit={editMessage}
                    onReply={setReplyingTo}
                    onForward={forwardMessage}
                    replyToMessage={
                      message.metadata?.replyTo 
                        ? messages.find(m => m.id === message.metadata.replyTo)
                        : null
                    }
                  />
                </React.Fragment>
              );
            })}

            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* ⌨️ C. Indicador de "escribiendo..." */}
      {otherUserTyping && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {displayName} está escribiendo
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ...
            </motion.span>
          </Typography>
        </Box>
      )}

      {/* Input de mensaje */}
      <MessageInput
        conversationId={conversationId}
        onSendMessage={(text, attachments, replyToId) => sendMessage(text, attachments, replyToId)}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Diálogo de información del usuario */}
      <Dialog
        open={userInfoDialogOpen}
        onClose={handleCloseUserInfo}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: { xs: 0, md: 8 }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: 1,
            borderColor: alpha('#000', 0.08),
            m: { xs: 2, md: 0 },
            maxWidth: 400
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
              borderColor: alpha(theme.palette.divider, 0.08)
            }}
          >
            <Typography variant="body1" fontWeight={600} fontSize="1.1rem">
              Información del Usuario
            </Typography>
            <IconButton size="small" onClick={handleCloseUserInfo}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              {/* Avatar Grande */}
              <Avatar
                src={selectedUser.photoURL || selectedUser.photo || displayPhoto}
                alt={selectedUser.displayName || selectedUser.name || displayName}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: 3,
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              >
                {(!selectedUser.photoURL && !selectedUser.photo && !displayPhoto) && <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>

              {/* Nombre */}
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {selectedUser.displayName || selectedUser.name || displayName}
              </Typography>

              {/* Rol */}
              {selectedUser.role && (
                <Chip
                  label={
                    selectedUser.role === 'ADMIN' ? 'Admin' :
                    selectedUser.role === 'GERENTE' ? 'Gerente' :
                    selectedUser.role === 'CONTADOR' ? 'Contador' :
                    selectedUser.role === 'VISUALIZADOR' ? 'Visualizador' :
                    selectedUser.role
                  }
                  color={
                    selectedUser.role === 'ADMIN' ? 'error' :
                    selectedUser.role === 'GERENTE' ? 'warning' :
                    selectedUser.role === 'CONTADOR' ? 'info' :
                    'default'
                  }
                  sx={{ mb: 3 }}
                />
              )}

              {/* Información adicional */}
              <Box sx={{ width: '100%' }}>
                {/* Email */}
                {selectedUser.email && (
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
                        {selectedUser.email}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* UID */}
                {selectedUser.uid && (
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
                        {selectedUser.uid.substring(0, 20)}...
                      </Typography>
                    </Box>
                  </Box>
                )}
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

export default MessageThread;
