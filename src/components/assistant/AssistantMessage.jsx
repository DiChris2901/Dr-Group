/**
 * 💬 Componente de Mensaje del Asistente
 * Burbuja de mensaje con formato y fuentes
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Person as UserIcon,
  SmartToy as AssistantIcon,
  Business as CompanyIcon,
  Payment as PaymentIcon,
  Assignment as CommitmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AssistantMessage = ({ message }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const isError = message.error;

  // Icono de fuente según tipo
  const getSourceIcon = (type) => {
    switch (type) {
      case 'empresas':
        return <CompanyIcon sx={{ fontSize: 14 }} />;
      case 'pagos':
        return <PaymentIcon sx={{ fontSize: 14 }} />;
      case 'compromisos':
        return <CommitmentIcon sx={{ fontSize: 14 }} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 12
      }}
    >
      {/* Avatar del Asistente */}
      {!isUser && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isError 
              ? `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`
              : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          <AssistantIcon sx={{ fontSize: 20 }} />
        </Box>
      )}

      {/* Mensaje */}
      <Box sx={{ maxWidth: isUser ? '80%' : '85%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: isUser
              ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              : isError
              ? alpha(theme.palette.error.main, 0.1)
              : theme.palette.background.paper,
            color: isUser ? 'white' : theme.palette.text.primary,
            borderRadius: 2,
            border: `1px solid ${
              isUser 
                ? 'transparent' 
                : isError 
                ? theme.palette.error.main 
                : theme.palette.divider
            }`,
            boxShadow: isUser 
              ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
              : 'none'
          }}
        >
          <Box
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6
            }}
          >
            {/* Renderizar con formato básico */}
            {message.content.split('\n').map((line, index) => {
              // Detectar headers (líneas que empiezan con **)
              if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                const text = line.replace(/\*\*/g, '');
                return (
                  <Typography
                    key={index}
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: isUser ? 'white' : theme.palette.primary.main
                    }}
                  >
                    {text}
                  </Typography>
                );
              }
              
              // Líneas normales con soporte para bold (**)
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <Typography
                  key={index}
                  variant="body2"
                  component="div"
                  sx={{ mb: line.trim() ? 0.5 : 0 }}
                >
                  {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <Box
                          key={i}
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: isUser ? 'white' : theme.palette.primary.main
                          }}
                        >
                          {part.slice(2, -2)}
                        </Box>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </Typography>
              );
            })}
          </Box>

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
              fontSize: '0.7rem'
            }}
          >
            {format(message.timestamp, 'HH:mm', { locale: es })}
          </Typography>
        </Paper>

        {/* Fuentes de información */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {message.sources.map((source, index) => (
              <Chip
                key={index}
                icon={getSourceIcon(source.type)}
                label={`${source.count} ${source.type}`}
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.text.secondary,
                  '& .MuiChip-icon': {
                    color: theme.palette.primary.main
                  }
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Avatar del Usuario */}
      {isUser && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.primary.main,
            flexShrink: 0,
            border: `2px solid ${theme.palette.primary.main}`
          }}
        >
          <UserIcon sx={{ fontSize: 20 }} />
        </Box>
      )}
    </motion.div>
  );
};

export default AssistantMessage;
