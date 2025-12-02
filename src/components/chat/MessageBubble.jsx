import React, { useState, useMemo, useRef } from 'react';
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
  PushPin as PushPinIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  OpenInNew as OpenInNewIcon,
  Groups as GroupsIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  StrikethroughS as StrikethroughSIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import PreviewDialog from './PreviewDialog';

/**
 * Renderizar texto con menciones resaltadas
 */
const renderTextWithMentions = (text, theme, isMentionedUser) => {
  if (!text) return null;

  // 1. Separar por menciones (tu lógica actual)
  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Agregar texto antes de la mención (procesando formato)
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      parts.push(...processTextFormat(beforeText));
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

  // Agregar texto restante (procesando formato)
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parts.push(...processTextFormat(remainingText));
  }

  return <>{parts}</>;
};

/**
 * Procesar formato de texto: *negrita*, _cursiva_, __subrayado__, ~~tachado~~, > cita
 */
const processTextFormat = (text) => {
  const parts = [];
  // Regex mejorado: *negrita*, _cursiva_, __subrayado__, ~~tachado~~, > cita
  const regex = /(\*([^*]+)\*)|((?<!_)_([^_]+)_(?!_))|(__([^_]+)__)|(~~([^~]+)~~)|(^> (.+)$)/gm;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texto antes del formato
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Detectar tipo de formato
    if (match[2]) {
      // *negrita*
      parts.push(<strong key={`bold-${match.index}`}>{match[2]}</strong>);
    } else if (match[4]) {
      // _cursiva_
      parts.push(<em key={`italic-${match.index}`}>{match[4]}</em>);
    } else if (match[6]) {
      // __subrayado__
      parts.push(<u key={`underline-${match.index}`}>{match[6]}</u>);
    } else if (match[8]) {
      // ~~tachado~~
      parts.push(<del key={`strikethrough-${match.index}`}>{match[8]}</del>);
    } else if (match[10]) {
      // > cita (usar span con estilos en lugar de blockquote para evitar warning de anidamiento)
      parts.push(
        <span 
          key={`quote-${match.index}`}
          style={{
            display: 'block',
            borderLeft: '3px solid',
            borderColor: 'inherit',
            paddingLeft: '12px',
            paddingTop: '4px',
            paddingBottom: '4px',
            marginTop: '4px',
            marginBottom: '4px',
            fontStyle: 'italic',
            opacity: 0.85
          }}
        >
          {match[10]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

/**
 * Burbuja de mensaje individual con diseño sobrio
 */
const MessageBubble = React.memo(({ 
  message, 
  isOwnMessage,
  conversation, // Conversación para verificar cursor de lectura
  onDelete, 
  onEdit, 
  onReply,
  onForward,
  onReact,
  onPin,
  onNavigateToConversation,
  replyToMessage,
  onScrollToMessage
}) => {
  const theme = useTheme();
  const { conversations } = useChat();
  const { currentUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const editTextFieldRef = useRef(null);
  const [editedText, setEditedText] = useState(message.text || '');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(null);
  const [userPhotos, setUserPhotos] = useState({}); // Mapa de userId -> photoURL
  const menuOpen = Boolean(anchorEl);

  // Verificar si el usuario actual fue mencionado
  const isMentionedUser = message.mentions?.includes(currentUser?.uid);
  
  // 📄 Estados para modal de PDF/Imagen
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  // 🔗 Estado para Preview Dialog (navegación sin salir del chat)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEntity, setPreviewEntity] = useState(null);

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

  // 🎨 Aplicar formato en modal de edición
  const applyEditFormat = (formatType) => {
    const input = editTextFieldRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selectedText = editedText.substring(start, end);

    if (!selectedText) return;

    let formattedText = '';
    switch (formatType) {
      case 'bold':
        formattedText = `*${selectedText}*`;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      default:
        return;
    }

    const newText = editedText.substring(0, start) + formattedText + editedText.substring(end);
    setEditedText(newText);

    // Restaurar selección
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const handleReplyClick = () => {
    handleMenuClose();
    onReply(message);
  };

  // 📸 Cargar fotos de perfil de todos los usuarios cuando se abre el modal
  React.useEffect(() => {
    if (!forwardDialogOpen || !conversations) return;

    const loadUserPhotos = async () => {
      const uniqueConvs = getUniqueConversations(conversations);
      const photosMap = {};

      // Cargar fotos de usuarios en conversaciones directas
      const photoPromises = uniqueConvs
        .filter(conv => conv.type !== 'group')
        .map(async (conv) => {
          const otherUserId = conv.participantIds?.find(id => id !== currentUser?.uid);
          if (otherUserId && !photosMap[otherUserId]) {
            try {
              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                photosMap[otherUserId] = userData.photoURL || userData.photo || null;
              }
            } catch (err) {
              console.error(`Error cargando foto de ${otherUserId}:`, err);
            }
          }
        });

      await Promise.all(photoPromises);
      setUserPhotos(photosMap);
    };

    loadUserPhotos();
  }, [forwardDialogOpen, conversations, currentUser?.uid]);

  const handleForwardClick = () => {
    handleMenuClose();
    
    // 💾 Guardar posición actual del scroll antes de abrir el modal
    const messagesContainer = document.querySelector('[data-messages-container]');
    if (messagesContainer) {
      setSavedScrollPosition({
        scrollTop: messagesContainer.scrollTop,
        scrollHeight: messagesContainer.scrollHeight
      });
    }
    
    setForwardDialogOpen(true);
  };

  // ✅ Función helper para obtener conversaciones únicas (sin duplicados de usuarios)
  const getUniqueConversations = (allConversations) => {
    // ✅ PERMITIR reenviar al mismo grupo (solo excluir conversaciones directas actuales)
    const availableConversations = allConversations.filter(conv => {
      // Si es la conversación actual Y es directa, excluirla (no tiene sentido reenviarte a ti mismo)
      if (conv.id === message.conversationId && conv.type === 'direct') {
        return false;
      }
      // Permitir todas las demás (incluido el grupo actual)
      return true;
    });
    
    const conversationMap = new Map();
    const groups = [];
    
    availableConversations.forEach(conv => {
      const isGroup = conv.type === 'group';
      
      if (isGroup) {
        groups.push(conv);
      } else {
        const otherUserId = conv.participantIds?.find(id => id !== currentUser?.uid);
        
        if (otherUserId) {
          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, conv);
          } else {
            const existing = conversationMap.get(otherUserId);
            const existingDate = existing.lastMessageAt?.toDate?.() || new Date(0);
            const currentDate = conv.lastMessageAt?.toDate?.() || new Date(0);
            
            if (currentDate > existingDate) {
              conversationMap.set(otherUserId, conv);
            }
          }
        }
      }
    });
    
    const uniqueDirectConversations = Array.from(conversationMap.values());
    const finalConversations = [...groups, ...uniqueDirectConversations];
    
    // Ordenar: grupos primero, luego conversaciones directas por fecha
    finalConversations.sort((a, b) => {
      const aIsGroup = a.type === 'group';
      const bIsGroup = b.type === 'group';
      
      if (aIsGroup && !bIsGroup) return -1;
      if (!aIsGroup && bIsGroup) return 1;
      
      const aDate = a.lastMessageAt?.toDate?.() || new Date(0);
      const bDate = b.lastMessageAt?.toDate?.() || new Date(0);
      return bDate - aDate;
    });
    
    return finalConversations;
  };

  const handleForwardConfirm = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      setForwarding(true);
      await onForward(message, conversationId);
      setForwardDialogOpen(false);
      setSelectedConversation(null);
      
      // 🚀 Navegar a la conversación destino después de reenviar
      if (onNavigateToConversation) {
        setTimeout(() => {
          onNavigateToConversation(conversationId);
          setSavedScrollPosition(null); // Limpiar posición guardada
        }, 100);
      }
    } catch (err) {
      console.error('❌ Error reenviando mensaje:', err);
    } finally {
      setForwarding(false);
    }
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
      // 📱 Swipe to Reply (Gesto Móvil)
      drag="x"
      dragConstraints={{ left: 0, right: 50 }}
      dragElastic={{ right: 0.5 }}
      onDragEnd={(event, info) => {
        // Si arrastró más de 50px a la derecha → Activar respuesta
        if (info.offset.x > 50) {
          if (onReply) onReply(message);
        }
      }}
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
        {message.metadata?.replyTo && replyToMessage && (
          <Paper
            elevation={0}
            onClick={() => onScrollToMessage?.(message.metadata.replyTo)}
            sx={{
              p: 1,
              mb: 0.5,
              bgcolor: alpha('#000', 0.04),
              borderLeft: 3,
              borderColor: 'primary.main',
              borderRadius: 1,
              maxWidth: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha('#000', 0.08),
                transform: 'translateX(4px)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
              <Typography variant="caption" color="primary" fontWeight={600}>
                {replyToMessage.senderName || 'Usuario'}
              </Typography>
              {conversation?.type === 'group' && replyToMessage.createdAt && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  • {(() => {
                    const date = replyToMessage.createdAt?.seconds 
                      ? new Date(replyToMessage.createdAt.seconds * 1000)
                      : new Date(replyToMessage.createdAt);
                    return date.toLocaleString('es-ES', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit'
                    });
                  })()}
                </Typography>
              )}
            </Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
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

          {/* 🔗 Smart Chip - Enlaces de contexto */}
          {message.type === 'system_link' && message.metadata?.systemLink && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: `linear-gradient(135deg, ${alpha('#667eea', 0.08)} 0%, ${alpha('#764ba2', 0.08)} 100%)`,
                border: 1,
                borderColor: alpha('#667eea', 0.2),
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha('#667eea', 0.12)} 0%, ${alpha('#764ba2', 0.12)} 100%)`,
                  borderColor: alpha('#667eea', 0.4),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha('#667eea', 0.2)}`
                }
              }}
              onClick={() => {
                const { entityType, entityId } = message.metadata.systemLink;
                // 🔗 Abrir modal de preview (sin salir del chat)
                setPreviewEntity({ entityType, entityId });
                setPreviewOpen(true);
              }}
            >
              {/* Ícono según el tipo */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: '#fff',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                {message.metadata.systemLink.entityType === 'invoice' && <ReceiptIcon />}
                {message.metadata.systemLink.entityType === 'client' && <PersonIcon />}
                {message.metadata.systemLink.entityType === 'company' && <BusinessIcon />}
              </Box>

              <Box flexGrow={1}>
                <Typography variant="caption" color="primary" fontWeight={600} sx={{ display: 'block', mb: 0.25 }}>
                  {message.metadata.systemLink.entityType === 'invoice' && '💳 Factura'}
                  {message.metadata.systemLink.entityType === 'client' && '👤 Cliente'}
                  {message.metadata.systemLink.entityType === 'company' && '🏢 Empresa'}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {message.metadata.systemLink.previewText}
                </Typography>
              </Box>

              <OpenInNewIcon sx={{ fontSize: 18, color: 'primary.main', opacity: 0.7 }} />
            </Paper>
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

        {/* 👍 Reacciones - Siempre visible */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            mt: 0.5,
            alignItems: 'center',
            minHeight: reactionPickerOpen || Object.keys(groupedReactions).length > 0 ? 'auto' : 0,
            opacity: reactionPickerOpen || Object.keys(groupedReactions).length > 0 ? 1 : 0.7,
            transition: 'opacity 0.2s ease',
            '&:hover': {
              opacity: 1
            }
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

            {/* Botón para agregar reacción - Siempre visible */}
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
          {/* 🎨 Toolbar de formato para edición */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 0.5, 
              mb: 1.5,
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Tooltip title="Negrita">
              <IconButton 
                size="small" 
                onClick={() => applyEditFormat('bold')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <FormatBoldIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Cursiva">
              <IconButton 
                size="small" 
                onClick={() => applyEditFormat('italic')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <FormatItalicIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Subrayado">
              <IconButton 
                size="small" 
                onClick={() => applyEditFormat('underline')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <FormatUnderlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Tachado">
              <IconButton 
                size="small" 
                onClick={() => applyEditFormat('strikethrough')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <StrikethroughSIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box sx={{ flexGrow: 1 }} />

            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Selecciona texto para formatear
            </Typography>
          </Box>

          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Escribe tu mensaje..."
            inputRef={editTextFieldRef}
            sx={{
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
              {(() => {
                if (!conversations || conversations.length === 0) return 'Cargando...';
                const uniqueConversations = getUniqueConversations(conversations);
                const groupCount = uniqueConversations.filter(c => c.type === 'group').length;
                const userCount = uniqueConversations.filter(c => c.type !== 'group').length;
                return `${groupCount} grupo${groupCount !== 1 ? 's' : ''} • ${userCount} usuario${userCount !== 1 ? 's' : ''}`;
              })()}
            </Typography>
          </Box>
          
          {!conversations || conversations.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress size={30} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Cargando conversaciones...
              </Typography>
            </Box>
          ) : getUniqueConversations(conversations).length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No hay otras conversaciones disponibles
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto', pb: 1 }}>
              {getUniqueConversations(conversations).map((conv) => {
                const isGroup = conv.type === 'group';
                
                let displayName, displayPhoto;
                
                if (isGroup) {
                  displayName = conv.metadata?.groupName || 'Grupo sin nombre';
                  displayPhoto = conv.metadata?.groupPhoto || null;
                } else {
                  const otherUserId = conv.participantIds?.find(id => id !== currentUser?.uid);
                  displayName = conv.participantNames?.[otherUserId] || 'Usuario';
                  // 📸 Usar foto cargada desde Firestore si está disponible
                  displayPhoto = userPhotos[otherUserId] || conv.participantPhotos?.[otherUserId] || null;
                }
                
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
                      <Avatar src={displayPhoto} alt={displayName}>
                        {isGroup ? (
                          <GroupsIcon />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <MuiListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {displayName}
                          {isGroup && (
                            <Chip 
                              label={`${conv.participantIds?.length || 0} miembros`} 
                              size="small" 
                              sx={{ height: 18, fontSize: '0.65rem' }} 
                            />
                          )}
                        </Box>
                      }
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
          <Button 
            onClick={() => {
              setForwardDialogOpen(false);
              setSelectedConversation(null);
              
              // 📍 Restaurar posición si se cancela
              setTimeout(() => {
                const messagesContainer = document.querySelector('[data-messages-container]');
                if (messagesContainer && savedScrollPosition) {
                  messagesContainer.scrollTop = savedScrollPosition.scrollTop;
                  setSavedScrollPosition(null);
                }
              }, 100);
            }}
            disabled={forwarding}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => handleForwardConfirm(selectedConversation?.id)}
            disabled={!selectedConversation || forwarding}
            startIcon={forwarding ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)' }}
          >
            {forwarding ? 'Reenviando...' : 'Reenviar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ MODAL VISOR PDF/IMAGEN - DESIGN SYSTEM SPECTACULAR */}
      <Dialog
        open={fileViewerOpen}
        onClose={handleCloseFileViewer}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            height: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        {/* DialogTitle con diseño spectacular */}
        <DialogTitle sx={{ 
          p: 3,
          pb: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Avatar sx={{ 
                background: viewingFile?.type?.startsWith('image/')
                  ? `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`
                  : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                width: 40,
                height: 40
              }}>
                {viewingFile?.type?.startsWith('image/') ? 
                  <ImageIcon sx={{ fontSize: 20 }} /> :
                  <PdfIcon sx={{ fontSize: 20 }} />
                }
              </Avatar>
            </motion.div>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5
              }}>
                {viewingFile?.name || 'Comprobante'}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.85rem'
              }}>
                {viewingFile?.type?.startsWith('image/') ? 'Imagen' : 'Documento PDF'}
                {viewingFile?.size && ` • ${(viewingFile.size / 1024 / 1024).toFixed(2)} MB`}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Abrir en nueva pestaña">
              <IconButton
                component="a"
                href={viewingFile?.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.success.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.success.main, 0.12),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Descargar">
              <IconButton
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingFile.url;
                  link.download = viewingFile.name;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <DownloadIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <IconButton
              onClick={handleCloseFileViewer}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': { 
                  color: theme.palette.error.main,
                  background: alpha(theme.palette.error.main, 0.08),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* DialogContent con iframe/imagen */}
        <DialogContent sx={{ 
          p: 0, 
          bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {viewingFile?.type?.startsWith('image/') ? (
            <Box
              component="img"
              src={viewingFile.url}
              alt={viewingFile.name}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                p: 2
              }}
            />
          ) : (
            <Box
              component="iframe"
              src={`${viewingFile?.url}#toolbar=1&navpanes=1&scrollbar=1`}
              title={viewingFile?.name}
              sx={{
                width: '100%',
                height: '100%',
                border: 'none',
                bgcolor: 'white'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 🔗 Preview Dialog - Navegación sin salir del chat */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        entityType={previewEntity?.entityType}
        entityId={previewEntity?.entityId}
      />
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders innecesarios
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.status?.read === nextProps.message.status?.read &&
    prevProps.isOwnMessage === nextProps.isOwnMessage &&
    JSON.stringify(prevProps.message.reactions) === JSON.stringify(nextProps.message.reactions)
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
