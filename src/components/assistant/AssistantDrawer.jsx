/**
 * 🤖 Panel del Asistente Inteligente
 * Drawer lateral con chat y sugerencias
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  AutoAwesome as MagicIcon,
  RestartAlt as ResetIcon,
  Lightbulb as SuggestionIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AssistantMessage from './AssistantMessage';
import { useAssistant } from '../../hooks/useAssistant';

const AssistantDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    messages,
    isTyping,
    suggestions,
    sendMessage,
    resetChat,
    useSuggestion
  } = useAssistant();

  // Espacio reservado para el Taskbar (altura + márgenes)
  const taskbarSpace = isMobile ? 80 : 96; // 64px de altura + 16px de margen inferior

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus en input al abrir
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Manejar envío
  const handleSend = () => {
    if (input.trim() && !isTyping) {
      sendMessage(input);
      setInput('');
      setShowSuggestions(false);
    }
  };

  // Manejar Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Usar sugerencia
  const handleUseSuggestion = (suggestion) => {
    useSuggestion(suggestion);
    setShowSuggestions(false);
  };

  // Reiniciar chat
  const handleReset = () => {
    resetChat();
    setInput('');
    setShowSuggestions(true);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? '100%' : 450,
          maxWidth: '100%',
          height: `calc(100vh - ${taskbarSpace}px)`, // Restar espacio del Taskbar
          bottom: taskbarSpace, // Posicionar encima del Taskbar
          top: 'auto',
          background: theme.palette.background.default,
          borderLeft: `1px solid ${theme.palette.divider}`
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MagicIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Asistente IA
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Powered by Gemini 1.5 Pro
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Reiniciar chat">
            <IconButton
              onClick={handleReset}
              sx={{
                color: 'white',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <ResetIcon />
            </IconButton>
          </Tooltip>
          
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              '&:hover': {
                background: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.background.default 
            : alpha(theme.palette.background.paper, 0.5)
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <AssistantMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '80%',
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Gemini está pensando...
              </Typography>
            </Paper>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SuggestionIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Preguntas sugeridas:
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                onClick={() => handleUseSuggestion(suggestion)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: theme.palette.primary.main,
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Divider />

      {/* Input Area */}
      <Box sx={{ p: 2, background: theme.palette.background.paper }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu pregunta aquí..."
          disabled={isTyping}
          inputRef={inputRef}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  sx={{
                    background: input.trim() && !isTyping
                      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      : 'transparent',
                    color: input.trim() && !isTyping ? 'white' : theme.palette.text.disabled,
                    '&:hover': {
                      background: input.trim() && !isTyping
                        ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                        : 'transparent',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
              }
            }
          }}
        />
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mt: 1, textAlign: 'center' }}
        >
          Presiona Enter para enviar • Shift+Enter para nueva línea
        </Typography>
      </Box>
    </Drawer>
  );
};

export default AssistantDrawer;
