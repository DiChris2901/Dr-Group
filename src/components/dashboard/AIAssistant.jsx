import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Person as UserIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fCurrency } from '../../utils/formatNumber';
import aiDataService from '../../services/aiDataService';

const AIAssistant = () => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll automático al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: `¡Hola ${userProfile?.displayName || 'Usuario'}! 👋\n\nSoy tu asistente IA empresarial. Puedo ayudarte con:\n\n• Consultar información de empresas (NITs, contactos, etc.)\n• Revisar historial de pagos específicos\n• Analizar compromisos y tendencias financieras\n• Generar reportes personalizados\n\n¿En qué puedo ayudarte hoy?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [open, userProfile?.displayName]);

  // Respuesta IA con datos reales de Firebase
  const getAIResponse = async (question) => {
    try {
      console.log('🤖 Procesando pregunta:', question);
      const data = await aiDataService.processAIQuery(question, currentUser.uid);
      console.log('📊 Datos recibidos:', data);
      
      // Si es un mensaje de ayuda
      if (data.help) {
        return data.message;
      }
      
      // Formatear respuesta según tipo de datos
      if (data.company) {
        const company = data.company;
        return `🏢 **${company.name || company.businessName || 'Empresa'}**\n\n` +
               `• **NIT:** ${company.nit || 'No registrado'}\n` +
               `• **Razón Social:** ${company.businessName || company.name || 'No registrada'}\n` +
               `• **Estado:** ${company.status === 'active' ? '✅ Activa' : company.status === 'inactive' ? '❌ Inactiva' : '⚠️ ' + (company.status || 'Sin estado')}\n` +
               `• **Teléfono:** ${company.phone || 'No registrado'}\n` +
               `• **Email:** ${company.email || 'No registrado'}\n` +
               `• **Dirección:** ${company.address || 'No registrada'}\n` +
               `• **Fecha de registro:** ${company.createdAt ? new Date(company.createdAt.seconds * 1000).toLocaleDateString('es-ES') : 'No registrada'}\n\n` +
               `📊 **Total de empresas registradas:** ${data.totalCompanies}`;
      }

      // Si no encontró la empresa específica
      if (data.found === false && data.availableCompanies) {
        let response = `❌ **${data.message}**\n\n`;
        
        if (data.availableCompanies.length > 0) {
          response += `📋 **Empresas disponibles en tu cuenta:**\n`;
          data.availableCompanies.forEach((company, index) => {
            response += `${index + 1}. **${company.name || company.businessName || 'Sin nombre'}**\n`;
            response += `   • NIT: ${company.nit || 'No registrado'}\n`;
            response += `   • Estado: ${company.status === 'active' ? '✅ Activa' : company.status || 'Sin estado'}\n\n`;
          });
          response += `💡 *Intenta preguntar por alguna de estas empresas específicamente.*`;
        } else {
          response += `📝 **No tienes empresas registradas aún.**\n\n`;
          response += `Para empezar:\n`;
          response += `• Ve a la sección "Empresas" en el menú lateral\n`;
          response += `• Registra tu primera empresa\n`;
          response += `• Luego podrás consultarla aquí`;
        }
        
        return response;
      }

      if (data.payments) {
        const summary = data.summary;
        const monthlyData = Object.entries(data.monthlyBreakdown);
        
        if (summary.paymentCount === 0) {
          return `💰 **Historial de Pagos**\n\n❌ **No se encontraron pagos** que coincidan con tu consulta en los últimos 3 meses.\n\n💡 **Sugerencias:**\n• Verifica el nombre de la empresa\n• Revisa si hay pagos registrados en la sección "Pagos"\n• Intenta con un término más general`;
        }
        
        let response = `💰 **Historial de Pagos**\n\n`;
        response += `📊 **Resumen (${summary.period}):**\n`;
        response += `• Total pagado: ${fCurrency(summary.totalAmount)}\n`;
        response += `• Número de pagos: ${summary.paymentCount}\n`;
        response += `• Promedio por pago: ${fCurrency(summary.averageAmount)}\n\n`;
        
        if (monthlyData.length > 0) {
          response += `📅 **Detalle mensual:**\n`;
          monthlyData.forEach(([month, data]) => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            response += `• **${monthName}:** ${fCurrency(data.amount)} (${data.count} pagos)\n`;
          });
        }

        return response;
      }

      if (data.summary && data.commitments) {
        const summary = data.summary;
        
        if (summary.total === 0) {
          return `📋 **Análisis de Compromisos**\n\n❌ **No se encontraron compromisos** registrados.\n\n💡 **Para empezar:**\n• Ve a "Compromisos" → "Agregar Nuevo"\n• Registra tus obligaciones financieras\n• Luego podrás consultarlas aquí`;
        }
        
        let response = `📋 **Análisis de Compromisos`;
        
        if (data.companyName) {
          response += ` - ${data.companyName}`;
        }
        response += `**\n\n`;
        
        response += `📊 **Resumen:**\n`;
        response += `• Total: ${summary.total} compromisos\n`;
        response += `• Activos: ${summary.active} (${fCurrency(summary.pendingAmount)})\n`;
        response += `• Pagados: ${summary.paid} (${fCurrency(summary.paidAmount)})\n`;
        response += `• Vencidos: ${summary.overdue} ⚠️\n`;
        response += `• Próximos a vencer: ${summary.upcoming} 🔔\n\n`;

        if (summary.overdue > 0) {
          response += `🚨 **Compromisos Vencidos:**\n`;
          data.commitments.overdue.forEach((commitment, index) => {
            if (index < 3) { // Mostrar máximo 3
              const daysOverdue = Math.floor((new Date() - commitment.dueDate) / (1000 * 60 * 60 * 24));
              response += `• ${commitment.concept || 'Sin concepto'}: ${fCurrency(commitment.amount)} (${daysOverdue} días)\n`;
            }
          });
        }

        return response;
      }

      // Estadísticas generales
      if (data.companies && data.commitments && data.payments) {
        return `📊 **Dashboard General - Resumen Ejecutivo**\n\n` +
               `🏢 **Empresas:**\n` +
               `• Total: ${data.companies.total}\n` +
               `• Activas: ${data.companies.active}\n\n` +
               `📋 **Compromisos:**\n` +
               `• Total: ${data.commitments.total}\n` +
               `• Activos: ${data.commitments.active}\n` +
               `• Vencidos: ${data.commitments.overdue} ⚠️\n` +
               `• Valor pendiente: ${fCurrency(data.commitments.pendingAmount)}\n\n` +
               `💰 **Pagos:**\n` +
               `• Total procesados: ${data.payments.total}\n` +
               `• Valor total: ${fCurrency(data.payments.totalAmount)}\n` +
               `• Este mes: ${data.payments.thisMonth} pagos`;
      }

      return '🤖 He procesado tu consulta pero no encontré información específica. ¿Podrías ser más específico sobre qué datos necesitas?';
    } catch (error) {
      console.error('❌ Error al obtener respuesta IA:', error);
      return `❌ **Error al consultar datos**\n\n**Detalles técnicos:**\n${error.message}\n\n💡 **Sugerencias:**\n• Verifica tu conexión a internet\n• Intenta de nuevo en unos segundos\n• Si el problema persiste, contacta al administrador`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Consulta real a Firebase a través del servicio IA
      const aiResponse = await getAIResponse(inputValue);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error al consultar IA:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '❌ Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const MessageBubble = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
          mb: 2
        }}
      >
        <Box
          sx={{
            maxWidth: '80%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: message.type === 'ai' ? 'primary.main' : 'secondary.main',
              fontSize: '0.9rem'
            }}
          >
            {message.type === 'ai' ? <AIIcon fontSize="small" /> : <UserIcon fontSize="small" />}
          </Avatar>
          
          <Card
            sx={{
              bgcolor: message.type === 'user' 
                ? theme.palette.primary.main 
                : alpha(theme.palette.background.paper, 0.8),
              color: message.type === 'user' ? 'white' : 'text.primary',
              borderRadius: 2,
              position: 'relative',
              '&:hover .copy-button': {
                opacity: 1
              }
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-line',
                  lineHeight: 1.4
                }}
              >
                {message.content}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.7,
                    fontSize: '0.7rem'
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
                
                <IconButton
                  className="copy-button"
                  size="small"
                  onClick={() => copyToClipboard(message.content)}
                  sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.1)
                    }
                  }}
                >
                  <CopyIcon fontSize="inherit" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </motion.div>
  );

  return (
    <>
      {/* Botón flotante para abrir IA */}
      <Tooltip title="Asistente IA Empresarial" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            boxShadow: theme.shadows[8],
            '&:hover': {
              boxShadow: theme.shadows[12],
              transform: 'scale(1.05)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <AIIcon />
        </Fab>
      </Tooltip>

      {/* Dialog del chat IA */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '600px',
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon />
            <Box>
              <Typography variant="h6" fontWeight="600">
                Asistente IA Empresarial
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                Consulta inteligente de datos empresariales
              </Typography>
            </Box>
          </Box>
          
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Área de mensajes */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              bgcolor: alpha(theme.palette.background.default, 0.3)
            }}
          >
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    <AIIcon fontSize="small" />
                  </Avatar>
                  <Chip
                    icon={<CircularProgress size={16} sx={{ color: 'white' }} />}
                    label="Analizando datos..."
                    color="primary"
                    variant="filled"
                  />
                </Box>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input de mensaje */}
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Pregunta algo sobre tus datos empresariales..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&:disabled': { bgcolor: 'action.disabled' }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIAssistant;
