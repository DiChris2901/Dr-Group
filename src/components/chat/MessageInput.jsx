import React, { useState, useRef, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Paper,
  alpha,
  useTheme,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  ListItemButton
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  EmojiEmotions as EmojiIcon,
  AlternateEmail as MentionIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  StrikethroughS as StrikethroughSIcon,
  FormatQuote as FormatQuoteIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationsContext';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { uploadChatAttachment } from '../../utils/chatFileUpload';
import { useChat } from '../../context/ChatContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

// 🎨 Helper para renderizar formato en tiempo real
const renderFormattedPreview = (text) => {
  if (!text) return null;
  
  const regex = /(\*([^*]+)\*)|(_([^_]+)_)|(__([^_]+)__)|(~~([^~]+)~~)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={`i-${match.index}`}>{match[4]}</em>);
    } else if (match[6]) {
      parts.push(<u key={`u-${match.index}`}>{match[6]}</u>);
    } else if (match[8]) {
      parts.push(<del key={`s-${match.index}`}>{match[8]}</del>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// 🔧 Utilidad para debounce
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Input para enviar mensajes con soporte de archivos adjuntos, respuestas y menciones
 */
const MessageInput = ({ onSendMessage, conversationId, replyingTo, onCancelReply }) => {
  const { addNotification } = useNotifications();
  const { updateTypingStatus } = useTypingIndicator(conversationId);
  const { getGroupMembers, getConversation } = useChat();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);
  const [mentions, setMentions] = useState([]);
  const [showFormatTooltip, setShowFormatTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState({ start: 0, end: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mentionPickerRef = useRef(null);
  const textFieldRef = useRef(null);

  // 🎤 Hook de grabación de audio
  const {
    isRecording,
    audioURL,
    duration,
    uploading: audioUploading,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
    formatDuration,
    cleanup: cleanupAudio
  } = useAudioRecorder();

  // ⏱️ C. Debounced typing indicator
  const debouncedTypingUpdate = useDebounce(updateTypingStatus, 500);

  // 💾 Cargar borrador desde localStorage al montar
  React.useEffect(() => {
    const savedDraft = localStorage.getItem(`draft_${conversationId}`);
    if (savedDraft) {
      setMessage(savedDraft);
    }
  }, [conversationId]);

  // 💾 Guardar borrador en localStorage mientras escribe
  React.useEffect(() => {
    if (message.trim()) {
      localStorage.setItem(`draft_${conversationId}`, message);
    } else {
      localStorage.removeItem(`draft_${conversationId}`);
    }
  }, [message, conversationId]);

  // 😊 Manejar selección de emoji
  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  // Cerrar picker al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (mentionPickerRef.current && !mentionPickerRef.current.contains(event.target)) {
        setShowMentionSuggestions(false);
      }
    };
    if (showEmojiPicker || showMentionSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showMentionSuggestions]);

  // 👥 Obtener miembros del grupo para menciones
  const groupMembers = React.useMemo(() => {
    const conversation = getConversation(conversationId);
    if (!conversation || conversation.type !== 'group') return [];
    return getGroupMembers(conversationId);
  }, [conversationId, getConversation, getGroupMembers]);

  // 🔍 Detectar @ para menciones
  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessage(newValue);
    debouncedTypingUpdate(true);

    // Detectar si hay un @ antes del cursor
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && groupMembers.length > 0) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Solo mostrar si no hay espacios después del @
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionCursorPosition(lastAtIndex);
        setShowMentionSuggestions(true);
        return;
      }
    }
    
    setShowMentionSuggestions(false);
  };

  // 👤 Insertar mención
  const handleSelectMention = (member) => {
    const beforeMention = message.substring(0, mentionCursorPosition);
    const afterMention = message.substring(textFieldRef.current.selectionStart);
    const mentionText = `@${member.name} `;
    
    const newMessage = beforeMention + mentionText + afterMention;
    setMessage(newMessage);
    
    // Agregar a lista de menciones
    if (!mentions.find(m => m.id === member.id)) {
      setMentions(prev => [...prev, { id: member.id, name: member.name }]);
    }
    
    setShowMentionSuggestions(false);
    setMentionSearch('');
    
    // Enfocar de nuevo el input
    setTimeout(() => {
      if (textFieldRef.current) {
        textFieldRef.current.focus();
        const newCursorPos = beforeMention.length + mentionText.length;
        textFieldRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 🔍 Filtrar sugerencias de menciones
  const filteredMentions = React.useMemo(() => {
    if (!mentionSearch) return groupMembers;
    return groupMembers.filter(member => 
      member.name.toLowerCase().includes(mentionSearch)
    );
  }, [groupMembers, mentionSearch]);

  // 🎨 Aplicar formato de texto
  const applyFormat = (formatType) => {
    const input = textFieldRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selectedText = message.substring(start, end);

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
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      default:
        return;
    }

    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);
    setShowFormatTooltip(false);

    // Restaurar selección
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  // 📍 Detectar selección de texto para tooltip flotante
  const handleTextSelect = () => {
    const input = textFieldRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start !== end && end - start > 0) {
      // Hay texto seleccionado
      setSelectedText({ start, end });
      
      // Calcular posición del tooltip
      const rect = input.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 60,
        left: rect.left + (rect.width / 2) - 150
      });
      setShowFormatTooltip(true);
    } else {
      setShowFormatTooltip(false);
    }
  };

  // ⌨️ Manejar atajos de teclado (Ctrl+B, Ctrl+I, Ctrl+U)
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('underline');
          break;
        default:
          break;
      }
    }
  };

  // Extraer IDs de usuarios mencionados del texto
  const extractMentionIds = (text) => {
    const mentionRegex = /@(\w+)/g;
    const matches = [...text.matchAll(mentionRegex)];
    const mentionedIds = [];
    
    matches.forEach(match => {
      const mentionName = match[1];
      const member = groupMembers.find(m => 
        m.name.toLowerCase().includes(mentionName.toLowerCase())
      );
      if (member && !mentionedIds.includes(member.id)) {
        mentionedIds.push(member.id);
      }
    });
    
    return mentionedIds;
  };

  // Manejar envío de mensaje
  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      const mentionedUserIds = extractMentionIds(message);
      
      await onSendMessage(message, attachments, replyingTo?.id, mentionedUserIds);
      setMessage('');
      setAttachments([]);
      setMentions([]);
      // 💾 Limpiar borrador de localStorage
      localStorage.removeItem(`draft_${conversationId}`);
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      addNotification('Error al enviar mensaje', 'error');
    }
  };

  // 🎤 Manejar grabación de audio
  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch (error) {
        addNotification(error.message || 'Error al acceder al micrófono', 'error');
      }
    }
  };

  // 🎤 Enviar nota de voz
  const handleSendVoiceNote = async () => {
    try {
      setUploading(true);
      const audioData = await uploadAudio(conversationId);
      
      await onSendMessage('', [{
        url: audioData.url,
        type: 'audio',
        name: audioData.fileName,
        size: audioData.size,
        duration: audioData.duration
      }]);

      cleanupAudio();
      addNotification('Nota de voz enviada', 'success');
    } catch (error) {
      console.error('Error enviando nota de voz:', error);
      addNotification('Error al enviar nota de voz', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 🎤 Cancelar nota de voz
  const handleCancelVoiceNote = () => {
    cancelRecording();
    cleanupAudio();
  };

  // Manejar adjuntar archivos
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validar tamaño total (10MB máximo por archivo)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter(file => file.size > maxFileSize);

    if (invalidFiles.length > 0) {
      addNotification(
        `Algunos archivos exceden el tamaño máximo de 10MB`,
        'warning'
      );
      return;
    }

    setUploading(true);

    try {
      const uploadedAttachments = await Promise.all(
        files.map(file => uploadChatAttachment(file))
      );

      setAttachments(prev => [...prev, ...uploadedAttachments]);
      addNotification(`${files.length} archivo(s) adjuntado(s)`, 'success');
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      addNotification('Error al adjuntar archivos', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remover archivo adjunto
  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Manejar Enter para enviar
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const theme = useTheme();

  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: alpha(theme.palette.primary.main, 0.15),
        background: theme.palette.mode === 'dark'
          ? 'background.paper'
          : `linear-gradient(135deg, ${alpha('#667eea', 0.02)} 0%, ${alpha('#764ba2', 0.02)} 100%)`,
        p: 2.5,
        boxShadow: '0 -2px 12px rgba(102, 126, 234, 0.08)'
      }}
    >
      {/* Indicador de respuesta */}
      <AnimatePresence>
        {replyingTo && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              mb: 1.5,
              bgcolor: alpha('#667eea', 0.08),
              borderLeft: 3,
              borderColor: 'primary.main',
              borderRadius: 1
            }}
          >
            <Box flexGrow={1}>
              <Typography variant="caption" color="primary" fontWeight={600}>
                Respondiendo a {replyingTo.senderName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {replyingTo.text || '📎 Archivo adjunto'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onCancelReply}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </AnimatePresence>

      {/* Vista previa de archivos adjuntos */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            sx={{
              display: 'flex',
              gap: 1,
              mb: 1,
              flexWrap: 'wrap'
            }}
          >
            {attachments.map((attachment, index) => (
              <Chip
                key={index}
                icon={<FileIcon />}
                label={attachment.name}
                onDelete={() => handleRemoveAttachment(index)}
                deleteIcon={<CloseIcon />}
                size="small"
                sx={{ maxWidth: 200 }}
              />
            ))}
          </Box>
        )}
      </AnimatePresence>

      {/* Área de input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        {/* Input de archivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        />

        {/* Botón adjuntar */}
        <Tooltip title="Adjuntar archivo">
          <span>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{
                bgcolor: alpha('#000', 0.04),
                transition: 'all 0.3s ease',
                '&:hover': { 
                  bgcolor: alpha('#000', 0.08),
                  transform: 'scale(1.05)'
                }
              }}
            >
              {uploading ? (
                <CircularProgress size={24} />
              ) : (
                <AttachFileIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>

        {/* Botón emoji */}
        <Box sx={{ position: 'relative' }} ref={emojiPickerRef}>
          <Tooltip title="Emojis">
            <IconButton
              onClick={() => setShowEmojiPicker(prev => !prev)}
              disabled={uploading}
              sx={{
                bgcolor: showEmojiPicker ? alpha('#667eea', 0.12) : alpha('#000', 0.04),
                transition: 'all 0.3s ease',
                '&:hover': { 
                  bgcolor: showEmojiPicker ? alpha('#667eea', 0.16) : alpha('#000', 0.08),
                  transform: 'scale(1.05)'
                }
              }}
            >
              <EmojiIcon />
            </IconButton>
          </Tooltip>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  bottom: '60px',
                  left: 0,
                  zIndex: 1300
                }}
              >
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={320}
                  height={400}
                  theme="light"
                  searchPlaceholder="Buscar emoji..."
                  previewConfig={{ showPreview: false }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* 🎨 Tooltip flotante de formato (aparece al seleccionar texto) */}
        <AnimatePresence>
          {showFormatTooltip && (
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              sx={{
                position: 'fixed',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                zIndex: 1400,
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                bgcolor: 'background.paper',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <Tooltip title="Negrita">
                <IconButton size="small" onClick={() => applyFormat('bold')}>
                  <FormatBoldIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cursiva">
                <IconButton size="small" onClick={() => applyFormat('italic')}>
                  <FormatItalicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Subrayado">
                <IconButton size="small" onClick={() => applyFormat('underline')}>
                  <FormatUnderlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tachado">
                <IconButton size="small" onClick={() => applyFormat('strikethrough')}>
                  <StrikethroughSIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Box sx={{ width: 1, height: 24, bgcolor: 'divider', mx: 0.5 }} />
              <Tooltip title="Cita">
                <IconButton size="small" onClick={() => applyFormat('quote')}>
                  <FormatQuoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          )}
        </AnimatePresence>

        {/* Campo de texto Sobrio con soporte de menciones */}
        <Box sx={{ position: 'relative', flex: 1 }}>
          <Box>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              onKeyDown={handleKeyDown}
              onSelect={handleTextSelect}
              onMouseUp={handleTextSelect}
              onFocus={() => setShowPreview(true)}
              disabled={uploading}
              inputRef={textFieldRef}
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
            
            {/* 👁️ Vista previa de formato en tiempo real */}
            <AnimatePresence>
              {message.trim() && /[*_~]/.test(message) && (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    👁️ Vista previa:
                  </Typography>
                  <Typography variant="body2" component="div">
                    {renderFormattedPreview(message)}
                  </Typography>
                </Box>
              )}
            </AnimatePresence>
          </Box>

          {/* Autocomplete de menciones */}
          <AnimatePresence>
            {showMentionSuggestions && filteredMentions.length > 0 && (
              <Paper
                ref={mentionPickerRef}
                component={motion.div}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  mb: 1,
                  maxHeight: 200,
                  overflowY: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  zIndex: 1300
                }}
              >
                <List dense disablePadding>
                  {filteredMentions.map((member, index) => (
                    <ListItemButton
                      key={member.id}
                      onClick={() => handleSelectMention(member)}
                      sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: alpha('#667eea', 0.08)
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={member.photoURL} sx={{ width: 32, height: 32 }}>
                          {member.name[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.name}
                        primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                      />
                      {member.isAdmin && (
                        <Chip label="Admin" size="small" color="primary" sx={{ height: 18 }} />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </AnimatePresence>
        </Box>

        {/* 🎤 Preview de nota de voz */}
        {audioURL && !isRecording && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <audio src={audioURL} controls style={{ flex: 1, maxHeight: 40 }} />
            <Typography variant="caption" color="text.secondary">
              {formatDuration(duration)}
            </Typography>
            <Tooltip title="Eliminar">
              <IconButton onClick={handleCancelVoiceNote} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Enviar nota de voz">
              <IconButton 
                onClick={handleSendVoiceNote} 
                disabled={audioUploading}
                sx={{
                  bgcolor: 'success.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'success.dark' }
                }}
              >
                {audioUploading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* 🎤 Botón de micrófono */}
        {!audioURL && !message.trim() && attachments.length === 0 && (
          <Tooltip title={isRecording ? 'Detener grabación' : 'Grabar nota de voz'}>
            <IconButton
              onClick={handleMicClick}
              disabled={uploading}
              sx={{
                bgcolor: isRecording ? 'error.main' : alpha(theme.palette.primary.main, 0.08),
                color: isRecording ? 'white' : 'primary.main',
                transition: 'all 0.3s ease',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' }
                },
                '&:hover': {
                  bgcolor: isRecording ? 'error.dark' : alpha(theme.palette.primary.main, 0.15)
                }
              }}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* 🎤 Contador de grabación */}
        {isRecording && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'blink 1s infinite',
                '@keyframes blink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.3 }
                }
              }}
            />
            <Typography variant="body2" color="error.main" fontWeight={600}>
              {formatDuration(duration)}
            </Typography>
          </Box>
        )}

        {/* Botón enviar Sobrio */}
        {(message.trim() || attachments.length > 0) && !audioURL && (
          <Tooltip title="Enviar mensaje">
            <span>
              <IconButton
                onClick={handleSend}
                disabled={(!message.trim() && attachments.length === 0) || uploading}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                    boxShadow: 'none'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default MessageInput;
