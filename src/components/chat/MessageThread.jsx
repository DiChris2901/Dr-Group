import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Paper,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  TextField,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  PushPin as PushPinIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useChatMessages, useChatSearch } from '../../hooks/useChat';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

/**
 * Thread de mensajes de una conversación
 */
const MessageThread = ({ conversationId, selectedUser, onBack }) => {
  const { currentUser } = useAuth();
  const { getConversation, setActiveConversationId, togglePinMessage } = useChat();
  const {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    sendMessage,
    markMessageAsRead, // Legacy - mantener por compatibilidad
    updateReadCursor, // Nueva función optimizada
    deleteMessage,
    editMessage,
    forwardMessage,
    toggleReaction
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

  // 🔍 Estados para búsqueda
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { results: searchResults, searching } = useChatSearch(conversationId, searchTerm);

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

  // 📌 Mensaje fijado
  const pinnedMessage = messages.find(m => m.id === conversation?.pinnedMessageId);

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

  // ✅ OPTIMIZACIÓN: Marcar como leídos usando cursor (1 escritura en lugar de N)
  useEffect(() => {
    if (!messages.length || !currentUser?.uid || !updateReadCursor || !conversation) return;

    // Encontrar el último mensaje del otro usuario
    const lastOtherUserMessage = [...messages]
      .reverse()
      .find(msg => msg.senderId !== currentUser.uid);

    if (lastOtherUserMessage?.createdAt) {
      // ✅ MICRO-OPTIMIZACIÓN: Comparar antes de escribir para evitar escrituras redundantes
      const myLastRead = conversation[`lastRead_${currentUser.uid}`];
      const messageTime = lastOtherUserMessage.createdAt instanceof Date 
        ? lastOtherUserMessage.createdAt.getTime() 
        : lastOtherUserMessage.createdAt.toMillis?.() || 0;
      const lastReadTime = myLastRead instanceof Date 
        ? myLastRead.getTime() 
        : myLastRead?.toMillis?.() || 0;

      // Solo actualizar si el mensaje es más nuevo que lo último leído
      if (messageTime > lastReadTime) {
        updateReadCursor(lastOtherUserMessage.createdAt);
      }
    }
  }, [messages, currentUser?.uid, updateReadCursor, conversation]);

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
          borderColor: alpha(theme.palette.primary.main, 0.15),
          background: theme.palette.mode === 'dark'
            ? 'background.paper'
            : `linear-gradient(135deg, ${alpha('#667eea', 0.03)} 0%, ${alpha('#764ba2', 0.02)} 100%)`,
          gap: 2,
          borderRadius: 0,
          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)'
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
            border: 2,
            borderColor: alpha('#667eea', 0.3),
            background: !otherParticipantPhoto
              ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
              : undefined,
            boxShadow: '0 2px 12px rgba(102, 126, 234, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.15) rotate(-5deg)',
              borderColor: 'primary.main',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
            }
          }}
        >
          {!otherParticipantPhoto && <PersonIcon />}
        </Avatar>

        <Box flexGrow={1}>
          {!searchOpen ? (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.25 }}>
                {otherParticipantName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                💬 {messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}
              </Typography>
            </>
          ) : (
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar en la conversación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searching && <CircularProgress size={20} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha('#000', 0.02)
                }
              }}
            />
          )}
        </Box>

        {/* Botón de búsqueda */}
        <Tooltip title={searchOpen ? "Cerrar búsqueda" : "Buscar"}>
          <IconButton
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setSearchTerm('');
            }}
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha('#667eea', 0.1),
                transform: 'rotate(90deg)'
              }
            }}
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
        </Tooltip>
      </Paper>

      {/* 📌 Banner de mensaje fijado */}
      {pinnedMessage && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: 1,
            borderColor: alpha('#667eea', 0.2),
            background: `linear-gradient(90deg, ${alpha('#667eea', 0.08)} 0%, ${alpha('#764ba2', 0.08)} 100%)`,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(90deg, ${alpha('#667eea', 0.12)} 0%, ${alpha('#764ba2', 0.12)} 100%)`
            }
          }}
          onClick={() => {
            const element = document.getElementById(`message-${pinnedMessage.id}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          <PushPinIcon 
            sx={{ 
              color: 'primary.main',
              transform: 'rotate(45deg)'
            }} 
          />
          <Box flexGrow={1}>
            <Typography variant="caption" color="primary" fontWeight={600} sx={{ mb: 0.25, display: 'block' }}>
              Mensaje fijado
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {pinnedMessage.text || '📎 Archivo adjunto'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              togglePinMessage(conversationId, pinnedMessage.id);
            }}
            sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* 🔍 Resultados de búsqueda */}
      {searchOpen && searchTerm && (
        <Paper
          elevation={0}
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            borderBottom: 1,
            borderColor: alpha('#000', 0.1)
          }}
        >
          {searching ? (
            <Box p={2} display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : searchResults.length === 0 ? (
            <Box p={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No se encontraron mensajes
              </Typography>
            </Box>
          ) : (
            <Box>
              {searchResults.map((result) => (
                <Box
                  key={result.id}
                  sx={{
                    p: 1.5,
                    borderBottom: 1,
                    borderColor: alpha('#000', 0.05),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha('#667eea', 0.05)
                    }
                  }}
                  onClick={() => {
                    const element = document.getElementById(`message-${result.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setSearchOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {result.senderName} • {new Date(result.createdAt).toLocaleDateString('es-CO')}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {result.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Área de mensajes Sobrio con gradiente */}
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
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, ${alpha('#667eea', 0.02)} 0%, ${alpha('#764ba2', 0.02)} 100%)`
            : `linear-gradient(180deg, ${alpha('#667eea', 0.03)} 0%, ${alpha('#f5f5f5', 0.8)} 50%, ${alpha('#764ba2', 0.03)} 100%)`
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
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        py: 1,
                        textAlign: 'center'
                      }}
                    >
                      <Chip
                        label={new Date(message.createdAt).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(4px)',
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          boxShadow: 1
                        }}
                      />
                    </Box>
                  )}

                  <Box id={`message-${message.id}`}>
                    <MessageBubble
                      message={message}
                      isOwnMessage={isOwnMessage}
                      conversation={conversation}
                      onDelete={deleteMessage}
                    onEdit={editMessage}
                    onReply={setReplyingTo}
                    onForward={forwardMessage}
                    onReact={toggleReaction}
                    onPin={(messageId) => togglePinMessage(conversationId, messageId)}
                    replyToMessage={
                      message.metadata?.replyTo 
                        ? messages.find(m => m.id === message.metadata.replyTo)
                        : null
                    }
                    />
                  </Box>
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
        onSendMessage={(text, attachments, replyToId, mentionedUserIds) => sendMessage(text, attachments, replyToId, mentionedUserIds)}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Diálogo de información del usuario */}
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

                {/* Teléfono */}
                {selectedUser.phone && (
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
                        {selectedUser.phone}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => window.open(`https://wa.me/${selectedUser.phone.replace(/\D/g, '')}`, '_blank')}
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
