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
  Typography
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationsContext';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { uploadChatAttachment } from '../../utils/chatFileUpload';

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
 * Input para enviar mensajes con soporte de archivos adjuntos y respuestas
 */
const MessageInput = ({ onSendMessage, conversationId, replyingTo, onCancelReply }) => {
  const { addNotification } = useNotifications();
  const { updateTypingStatus } = useTypingIndicator(conversationId);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // ⌨️ C. Debounced typing indicator
  const debouncedTypingUpdate = useDebounce(updateTypingStatus, 500);

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
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Manejar envío de mensaje
  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      await onSendMessage(message, attachments, replyingTo?.id);
      setMessage('');
      setAttachments([]);
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      addNotification('Error al enviar mensaje', 'error');
    }
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
        borderColor: alpha(theme.palette.divider, 0.6),
        bgcolor: 'background.paper',
        p: 2.5,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.04)'
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

        {/* Campo de texto Sobrio */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            // ⌨️ C. Actualizar indicador de "escribiendo" con debounce
            if (e.target.value.trim()) {
              debouncedTypingUpdate();
            }
          }}
          onKeyPress={handleKeyPress}
          disabled={uploading}
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

        {/* Botón enviar Sobrio */}
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
      </Box>
    </Box>
  );
};

export default MessageInput;
