import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText as MuiListItemText,
  CircularProgress
} from '@mui/material';
import {
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  InsertDriveFile as FileIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  AddReaction as AddReactionIcon,
  PushPin as PushPinIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Renderizar texto con menciones resaltadas
 */
const renderTextWithMentions = (text, theme, isMentionedUser) => {
  if (!text) return null;

  // Regex para detectar menciones @usuario
  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Agregar texto antes de la mención
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Agregar mención resaltada
    const mentionName = match[1];
    parts.push(
      <Box
        key={`mention-${match.index}`}
        component="span"
        sx={{
          bgcolor: isMentionedUser 
            ? alpha(theme.palette.warning.main, 0.3)
            : alpha(theme.palette.primary.main, 0.15),
          color: isMentionedUser
            ? theme.palette.warning.dark
            : theme.palette.primary.main,
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: isMentionedUser
              ? alpha(theme.palette.warning.main, 0.4)
              : alpha(theme.palette.primary.main, 0.25)
          }
        }}
      >
        @{mentionName}
      </Box>
    );

    lastIndex = match.index + match[0].length;
  }

  // Agregar texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

/**
 * Burbuja de mensaje individual con diseño sobrio
 */
const MessageBubble = ({ 
  message, 
  isOwnMessage,
  conversation, // Conversación para verificar cursor de lectura
  onDelete, 
  onEdit, 
  onReply,
  onForward,
  onReact,
  onPin,
  replyToMessage 
}) => {
  const theme = useTheme();
  const { conversations } = useChat();
  const { currentUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [editedText, setEditedText] = useState(message.text || '');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  // Verificar si el usuario actual fue mencionado
  const isMentionedUser = message.mentions?.includes(currentUser?.uid);
  
  // 📄 Estados para modal de PDF/Imagen
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  // 📄 Manejar click en archivo adjunto
  const handleFileClick = (attachment) => {
    const fileType = attachment.type || '';
    const fileName = attachment.name || '';
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // PDFs e imágenes se abren en modal
    if (fileType.startsWith('image/') || fileType === 'application/pdf' || fileExtension === 'pdf') {
      setViewingFile(attachment);
      setFileViewerOpen(true);
    } else {
      // Otros archivos se descargan
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCloseFileViewer = () => {
    setFileViewerOpen(false);
    setViewingFile(null);
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(message.id);
    setDeleteDialogOpen(false);
  };

  const handleEditClick = () => {
    handleMenuClose();
    setEditedText(message.text || '');
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (editedText.trim()) {
      onEdit(message.id, editedText.trim());
      setEditDialogOpen(false);
    }
  };

  const handleReplyClick = () => {
    handleMenuClose();
    onReply(message);
  };

  const handleForwardClick = () => {
    handleMenuClose();
    console.log('🔍 Forward Dialog - Conversaciones disponibles:', conversations.length);
    console.log('🔍 Conversación actual:', message.conversationId);
    console.log('🔍 Conversaciones filtradas:', conversations.filter(conv => conv.id !== message.conversationId).length);
    setForwardDialogOpen(true);
  };

  const handleForwardConfirm = (conversationId) => {
    onForward(message, conversationId);
    setForwardDialogOpen(false);
  };

  // 📌 Handler de fijar mensaje
  const handlePinClick = () => {
    handleMenuClose();
    onPin(message.id);
  };

  // 👍 Handlers de reacciones
  const handleReactionClick = (emoji) => {
    onReact(message.id, emoji);
    setReactionPickerOpen(false);
  };

  const handleAddReactionClick = () => {
    setReactionPickerOpen(!reactionPickerOpen);
  };

  // Agrupar reacciones por emoji
  const groupedReactions = useMemo(() => {
    if (!message.reactions) return {};
    
    const grouped = {};
    Object.entries(message.reactions).forEach(([userId, emoji]) => {
      if (emoji) {
        if (!grouped[emoji]) {
          grouped[emoji] = [];
        }
        grouped[emoji].push(userId);
      }
    });
    return grouped;
  }, [message.reactions]);

  const formatTime = (date) => {
    if (!date) return '';
    
    try {
      // Si ya es un Date, usarlo directamente
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Validar que sea una fecha válida
      if (isNaN(dateObj.getTime())) {
        return 'Ahora';
      }
      
      return format(dateObj, 'HH:mm', { locale: es });
    } catch (error) {
      console.error('Error formateando fecha:', error, date);
      return 'Ahora';
    }
  };

  // ✅ OPTIMIZACIÓN: Verificar lectura usando cursor en lugar de status.read
  const getStatusIcon = () => {
    if (!isOwnMessage) return null;

    // Obtener ID del otro usuario
    const otherUserId = conversation?.participantIds?.find(id => id !== currentUser?.uid);
    
    if (otherUserId && conversation) {
      const lastReadTimestamp = conversation[`lastRead_${otherUserId}`];
      
      if (lastReadTimestamp && message.createdAt) {
        // Convertir timestamps para comparar
        // ✅ MICRO-OPTIMIZACIÓN: Manejar createdAt: null (optimistic UI con new Date())
        const messageTime = message.createdAt instanceof Date 
          ? message.createdAt.getTime() 
          : (message.createdAt?.toMillis ? message.createdAt.toMillis() : Date.now());
        const readTime = lastReadTimestamp instanceof Date 
          ? lastReadTimestamp.getTime() 
          : lastReadTimestamp.toMillis?.() || 0;
        
        // Si el cursor de lectura es >= al timestamp del mensaje, fue leído
        if (readTime >= messageTime) {
          return <DoneAllIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
        }
      }
    }
    
    // Fallback al sistema legacy
    if (message.status?.read) {
      return <DoneAllIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
    } else if (message.status?.delivered) {
      return <DoneAllIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
    } else if (message.status?.sent) {
      return <DoneIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
    }
    return null;
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 1
      }}
    >
      {/* Avatar del remitente (solo mensajes de otros) */}
      {!isOwnMessage && (
        <Avatar
          src={message.senderPhoto}
          alt={message.senderName}
          sx={{ 
            width: 32, 
            height: 32, 
            mr: 1, 
            mt: 'auto',
            border: 2,
            borderColor: alpha('#667eea', 0.3),
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              borderColor: alpha('#667eea', 0.6),
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }
          }}
        >
          {message.senderName?.charAt(0)}
        </Avatar>
      )}

      {/* Contenido del mensaje */}
      <Box
        sx={{
          maxWidth: { xs: '80%', sm: '70%', md: '60%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
        }}
      >
        {/* Nombre del remitente (solo mensajes de otros) */}
        {!isOwnMessage && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1, mb: 0.5 }}
          >
            {message.senderName}
          </Typography>
        )}

        {/* Indicador de mensaje reenviado */}
        {message.metadata?.forwardedFrom && (
          <Box 
            display="flex" 
            alignItems="center" 
            gap={0.5} 
            sx={{ mb: 0.5, ml: isOwnMessage ? 0 : 1 }}
          >
            <ForwardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" fontStyle="italic">
              Reenviado
              {message.metadata?.originalSender && ` de ${message.metadata.originalSender}`}
            </Typography>
          </Box>
        )}

        {/* Mensaje citado (respuesta) */}
        {message.replyTo && replyToMessage && (
          <Paper
            elevation={0}
            sx={{
              p: 1,
              mb: 0.5,
              bgcolor: alpha('#000', 0.04),
              borderLeft: 3,
              borderColor: 'primary.main',
              borderRadius: 1,
              maxWidth: '100%'
            }}
          >
            <Typography variant="caption" color="primary" fontWeight={600}>
              {replyToMessage.senderName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {replyToMessage.text || '📎 Archivo adjunto'}
            </Typography>
          </Paper>
        )}

        {/* Burbuja del mensaje Sobrio */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            background: isOwnMessage
              ? `linear-gradient(135deg, ${alpha('#667eea', 0.15)} 0%, ${alpha('#764ba2', 0.12)} 100%)`
              : 'background.paper',
            color: isOwnMessage ? 'primary.dark' : 'text.primary',
            borderRadius: 2,
            borderTopRightRadius: isOwnMessage ? 4 : 16,
            borderTopLeftRadius: isOwnMessage ? 16 : 4,
            border: 1,
            borderColor: isOwnMessage 
              ? alpha('#667eea', 0.4) 
              : alpha('#000', 0.1),
            boxShadow: isOwnMessage
              ? '0 2px 12px rgba(102, 126, 234, 0.15)'
              : '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: isOwnMessage
                ? '0 4px 16px rgba(102, 126, 234, 0.25)'
                : '0 4px 12px rgba(0,0,0,0.12)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          {/* Archivos adjuntos */}
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mb: message.text ? 1 : 0 }}>
              {message.attachments.map((attachment, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    bgcolor: isOwnMessage
                      ? alpha('#fff', 0.15)
                      : alpha('#000', 0.02),
                    border: 1,
                    borderColor: alpha('#000', 0.08),
                    borderRadius: 1,
                    mb: 0.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: isOwnMessage
                        ? alpha('#fff', 0.2)
                        : alpha('#000', 0.04)
                    }
                  }}
                >
                  {attachment.type?.startsWith('image/') ? (
                    <Box
                      component="img"
                      src={attachment.url}
                      alt={attachment.name}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleFileClick(attachment)}
                    />
                  ) : (
                    <Box
                      onClick={() => handleFileClick(attachment)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      {attachment.type === 'application/pdf' || attachment.name?.endsWith('.pdf') ? (
                        <PdfIcon color="error" />
                      ) : (
                        <FileIcon />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          flexGrow: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {attachment.name}
                      </Typography>
                      <Tooltip title="Ver / Descargar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileClick(attachment);
                          }}
                          sx={{ color: 'inherit' }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Texto del mensaje con menciones resaltadas */}
          {message.text && (
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5
              }}
            >
              {renderTextWithMentions(message.text, theme, isMentionedUser)}
            </Typography>
          )}

          {/* Timestamp, estado y menú de acciones */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 0.5,
              mt: 0.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  opacity: 0.8
                }}
              >
                {formatTime(message.createdAt)}
              </Typography>
              {getStatusIcon()}
              {message.metadata?.editedAt && (
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.65rem', opacity: 0.6, ml: 0.5 }}
                >
                  • editado
                </Typography>
              )}
            </Box>

            {/* Botón de menú de acciones */}
            <Tooltip title="Acciones">
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{
                  opacity: 0.6,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                    bgcolor: alpha('#000', 0.08)
                  }
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* 👍 Reacciones */}
        {(Object.keys(groupedReactions).length > 0 || reactionPickerOpen) && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              mt: 0.5,
              alignItems: 'center'
            }}
          >
            {/* Mostrar reacciones agrupadas */}
            {Object.entries(groupedReactions).map(([emoji, userIds]) => (
              <Chip
                key={emoji}
                label={`${emoji} ${userIds.length}`}
                size="small"
                onClick={() => handleReactionClick(emoji)}
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  borderRadius: 1,
                  bgcolor: userIds.includes(currentUser?.uid) 
                    ? alpha(theme.palette.primary.main, 0.15) 
                    : alpha('#000', 0.04),
                  border: 1,
                  borderColor: userIds.includes(currentUser?.uid)
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha('#000', 0.08),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    transform: 'scale(1.05)'
                  }
                }}
              />
            ))}

            {/* Selector de reacciones */}
            {reactionPickerOpen && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: alpha('#000', 0.04),
                  border: 1,
                  borderColor: alpha('#000', 0.1)
                }}
              >
                {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                  <IconButton
                    key={emoji}
                    size="small"
                    onClick={() => handleReactionClick(emoji)}
                    sx={{
                      fontSize: '1.2rem',
                      width: 32,
                      height: 32,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.2)',
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </Box>
            )}

            {/* Botón para agregar reacción */}
            <Tooltip title="Agregar reacción">
              <IconButton
                size="small"
                onClick={handleAddReactionClick}
                sx={{
                  width: 24,
                  height: 24,
                  opacity: 0.6,
                  '&:hover': {
                    opacity: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <AddReactionIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Menú contextual de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isOwnMessage ? 'left' : 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isOwnMessage ? 'right' : 'left'
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1,
            borderRadius: 2,
            border: 1,
            borderColor: alpha('#000', 0.08)
          }
        }}
      >
        <MenuItem onClick={handlePinClick}>
          <ListItemIcon>
            <PushPinIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {conversation?.pinnedMessageId === message.id ? 'Desfijar' : 'Fijar mensaje'}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={handleReplyClick}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Responder</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleForwardClick}>
          <ListItemIcon>
            <ForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reenviar</ListItemText>
        </MenuItem>

        {isOwnMessage && (
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}

        {isOwnMessage && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Diálogo de Edición */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
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
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Editar mensaje
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Escribe tu mensaje..."
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={!editedText.trim()}
            sx={{ boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)' }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
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
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" />
            <Typography variant="h6" fontWeight={600}>
              ¿Eliminar mensaje?
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer. El mensaje se eliminará permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            sx={{ boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)' }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Reenviar */}
      <Dialog
        open={forwardDialogOpen}
        onClose={() => {
          setForwardDialogOpen(false);
          setSelectedConversation(null);
        }}
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
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ForwardIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Reenviar mensaje
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {/* Preview del mensaje a reenviar */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: alpha('#667eea', 0.04),
              borderBottom: 1,
              borderColor: alpha('#000', 0.08)
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Mensaje a reenviar:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mt: 1,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: alpha('#000', 0.08),
                borderRadius: 1
              }}
            >
              <Typography variant="body2" noWrap>
                {message.text || '📎 Archivo adjunto'}
              </Typography>
            </Paper>
          </Box>

          {/* Lista de conversaciones */}
          <Box sx={{ px: 2.5, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Selecciona una conversación: {conversations.length > 0 && `(${conversations.filter(conv => conv.id !== message.conversationId).length} disponibles)`}
            </Typography>
          </Box>
          
          {!conversations || conversations.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress size={30} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Cargando conversaciones...
              </Typography>
            </Box>
          ) : conversations.filter(conv => conv.id !== message.conversationId).length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No hay otras conversaciones disponibles
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto', pb: 1 }}>
              {conversations
                .filter(conv => conv.id !== message.conversationId)
                .map((conv) => {
                  const otherUserId = conv.participantIds?.find(id => id !== currentUser?.uid);
                  const otherUserName = conv.participantNames?.[otherUserId] || 'Usuario';
                  const otherUserPhoto = conv.participantPhotos?.[otherUserId] || null;
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <ListItemButton
                      key={conv.id}
                      selected={isSelected}
                      onClick={() => setSelectedConversation(conv)}
                      sx={{
                        borderRadius: 1,
                        mx: 1,
                        mb: 0.5,
                        bgcolor: isSelected ? alpha('#667eea', 0.08) : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? alpha('#667eea', 0.12) : alpha('#000', 0.04)
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={otherUserPhoto} alt={otherUserName}>
                          {otherUserName.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <MuiListItemText
                        primary={otherUserName}
                        secondary={
                          conv.lastMessage 
                            ? (typeof conv.lastMessage === 'string' 
                                ? `${conv.lastMessage.substring(0, 30)}...` 
                                : 'Mensaje reciente')
                            : 'Sin mensajes'
                        }
                      />
                    </ListItemButton>
                  );
                })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => {
            setForwardDialogOpen(false);
            setSelectedConversation(null);
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => handleForwardConfirm(selectedConversation.id)}
            disabled={!selectedConversation}
            sx={{ boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)' }}
          >
            Reenviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de visor de PDF/Imagen */}
      <Dialog
        open={fileViewerOpen}
        onClose={handleCloseFileViewer}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            m: 2
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
            <Box display="flex" alignItems="center" gap={1}>
              {viewingFile?.type?.startsWith('image/') ? (
                <ImageIcon color="primary" />
              ) : (
                <PdfIcon color="error" />
              )}
              <Typography variant="body1" fontWeight={600} noWrap>
                {viewingFile?.name || 'Archivo'}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Descargar">
                <IconButton
                  size="small"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = viewingFile.url;
                    link.download = viewingFile.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={handleCloseFileViewer}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: alpha('#000', 0.02), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {viewingFile?.type?.startsWith('image/') ? (
            <Box
              component="img"
              src={viewingFile.url}
              alt={viewingFile.name}
              sx={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 120px)',
                objectFit: 'contain',
                p: 2
              }}
            />
          ) : (
            <Box
              component="iframe"
              src={viewingFile?.url}
              title={viewingFile?.name}
              sx={{
                width: '100%',
                height: 'calc(90vh - 120px)',
                border: 'none',
                bgcolor: 'white'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MessageBubble;
