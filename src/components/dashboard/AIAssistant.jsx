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
  Tooltip,
  Button,
  Grid,
  Divider,
  DialogActions
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Person as UserIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  AccountBalance as CommitmentIcon,
  Receipt as PaymentIcon,
  Business as CompanyIcon,
  CalendarToday as DateIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  AttachFile as FileIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fCurrency } from '../../utils/formatNumber';
import aiDataService from '../../services/aiDataService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const AIAssistant = () => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Estados para detalles de registros
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordType, setRecordType] = useState(null); // 'commitment' | 'payment'
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Scroll automático al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para cargar detalles completos desde Firestore
  const loadRecordDetails = async (recordId, type) => {
    setLoadingDetails(true);
    setRecordType(type);
    
    try {
      const collectionName = type === 'commitment' ? 'commitments' : 'payments';
      const docRef = doc(db, collectionName, recordId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        console.log('📋 Detalles cargados:', data);
        setSelectedRecord(data);
        setDetailsModalOpen(true);
      } else {
        console.error('❌ No se encontró el registro');
      }
    } catch (error) {
      console.error('❌ Error al cargar detalles:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Función para cerrar modal de detalles
  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedRecord(null);
    setRecordType(null);
  };

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
        return { text: data.message, data: null };
      }
      
      // Formatear respuesta según tipo de datos
      if (data.company) {
        const company = data.company;
        const text = `🏢 **${company.name || company.businessName || 'Empresa'}**\n\n` +
               `• **NIT:** ${company.nit || 'No registrado'}\n` +
               `• **Razón Social:** ${company.businessName || company.name || 'No registrada'}\n` +
               `• **Estado:** ${company.status === 'active' ? '✅ Activa' : company.status === 'inactive' ? '❌ Inactiva' : '⚠️ ' + (company.status || 'Sin estado')}\n` +
               `• **Teléfono:** ${company.phone || 'No registrado'}\n` +
               `• **Email:** ${company.email || 'No registrado'}\n` +
               `• **Dirección:** ${company.address || 'No registrada'}\n` +
               `• **Fecha de registro:** ${company.createdAt ? new Date(company.createdAt.seconds * 1000).toLocaleDateString('es-ES') : 'No registrada'}\n\n` +
               `📊 **Total de empresas registradas:** ${data.totalCompanies}`;
        return { text, data: null };
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
        
        return { text: response, data: null };
      }

      if (data.payments) {
        const summary = data.summary;
        const monthlyData = Object.entries(data.monthlyBreakdown);
        
        if (summary.paymentCount === 0) {
          const text = `💰 **Historial de Pagos**\n\n❌ **No se encontraron pagos** que coincidan con tu consulta en los últimos 3 meses.\n\n💡 **Sugerencias:**\n• Verifica el nombre de la empresa\n• Revisa si hay pagos registrados en la sección "Pagos"\n• Intenta con un término más general`;
          return { text, data: null };
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

        return { text: response, data: { type: 'payments', records: data.paymentIds || [] } };
      }

      if (data.summary && data.commitments) {
        const summary = data.summary;
        
        if (summary.total === 0) {
          const text = `📋 **Análisis de Compromisos**\n\n❌ **No se encontraron compromisos** registrados.\n\n💡 **Para empezar:**\n• Ve a "Compromisos" → "Agregar Nuevo"\n• Registra tus obligaciones financieras\n• Luego podrás consultarlas aquí`;
          return { text, data: null };
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

        return { text: response, data: { type: 'commitments', records: data.commitmentIds || [] } };
      }

      // Estadísticas generales
      if (data.companies && data.commitments && data.payments) {
        const text = `📊 **Dashboard General - Resumen Ejecutivo**\n\n` +
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
        return { text, data: null };
      }

      return { text: '🤖 He procesado tu consulta pero no encontré información específica. ¿Podrías ser más específico sobre qué datos necesitas?', data: null };
    } catch (error) {
      console.error('❌ Error al obtener respuesta IA:', error);
      const text = `❌ **Error al consultar datos**\n\n**Detalles técnicos:**\n${error.message}\n\n💡 **Sugerencias:**\n• Verifica tu conexión a internet\n• Intenta de nuevo en unos segundos\n• Si el problema persiste, contacta al administrador`;
      return { text, data: null };
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
        content: aiResponse.text,
        data: aiResponse.data, // Datos estructurados con IDs de registros
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
              
              {/* Botones de Ver Detalles si hay datos */}
              {message.data && message.data.records && message.data.records.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    {message.data.type === 'commitments' ? '📋 Compromisos disponibles:' : '💰 Pagos disponibles:'}
                  </Typography>
                  {message.data.records.map((record, index) => (
                    <Button
                      key={record.id}
                      size="small"
                      variant="outlined"
                      startIcon={message.data.type === 'commitments' ? <CommitmentIcon /> : <PaymentIcon />}
                      onClick={() => loadRecordDetails(record.id, message.data.type === 'commitments' ? 'commitment' : 'payment')}
                      sx={{
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        py: 0.5
                      }}
                    >
                      <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                        <Typography variant="caption" fontWeight="600" noWrap>
                          {record.concept || record.description || 'Sin concepto'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {fCurrency(record.amount)} • {record.companyName || 'Ver detalles'}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Box>
              )}
              
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

      {/* Modal de Detalles Completos */}
      <Dialog
        open={detailsModalOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: recordType === 'commitment' ? 'primary.main' : 'secondary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {recordType === 'commitment' ? <CommitmentIcon /> : <PaymentIcon />}
            <Typography variant="h6" fontWeight="600">
              {recordType === 'commitment' ? 'Detalles del Compromiso' : 'Detalles del Pago'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, mt: 2 }}>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedRecord ? (
            <Grid container spacing={3}>
              {/* Información General */}
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" fontWeight="600">
                  INFORMACIÓN GENERAL
                </Typography>
              </Grid>

              {recordType === 'commitment' ? (
                <>
                  {/* Concepto */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <DescriptionIcon fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">Concepto</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="600">
                      {selectedRecord.concept || 'Sin concepto'}
                    </Typography>
                  </Grid>

                  {/* Empresa */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CompanyIcon fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">Empresa</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="600">
                      {selectedRecord.companyName || 'Sin empresa'}
                    </Typography>
                  </Grid>

                  {/* Beneficiario */}
                  {selectedRecord.beneficiaryName && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <UserIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">Beneficiario</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="600">
                        {selectedRecord.beneficiaryName}
                      </Typography>
                    </Grid>
                  )}

                  {/* Fecha de Vencimiento */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <DateIcon fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">Fecha de Vencimiento</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="600">
                      {selectedRecord.dueDate ? new Date(selectedRecord.dueDate.seconds * 1000).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      }) : 'Sin fecha'}
                    </Typography>
                  </Grid>

                  {/* Monto */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <MoneyIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="text.secondary">Monto Total</Typography>
                    </Box>
                    <Typography variant="h6" color="success.main" fontWeight="700">
                      {fCurrency(selectedRecord.amount || 0)}
                    </Typography>
                  </Grid>

                  {/* Estado */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Estado</Typography>
                    </Box>
                    <Chip
                      label={selectedRecord.status === 'paid' || selectedRecord.status === 'completed' ? 'Pagado' : 
                             selectedRecord.status === 'pending' ? 'Pendiente' : 
                             selectedRecord.status === 'overdue' ? 'Vencido' : selectedRecord.status}
                      color={selectedRecord.status === 'paid' || selectedRecord.status === 'completed' ? 'success' : 
                             selectedRecord.status === 'pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </Grid>

                  {/* Observaciones */}
                  {selectedRecord.observations && (
                    <Grid item xs={12}>
                      <Typography variant="overline" color="text.secondary" fontWeight="600" sx={{ mt: 2, display: 'block' }}>
                        OBSERVACIONES
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                        {selectedRecord.observations}
                      </Typography>
                    </Grid>
                  )}

                  {/* Archivos Adjuntos */}
                  {((selectedRecord.invoices && selectedRecord.invoices.length > 0) || 
                    (selectedRecord.receiptUrls && selectedRecord.receiptUrls.length > 0)) && (
                    <Grid item xs={12}>
                      <Typography variant="overline" color="text.secondary" fontWeight="600" sx={{ mt: 2, display: 'block' }}>
                        ARCHIVOS ADJUNTOS
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {(selectedRecord.invoices || selectedRecord.receiptUrls || []).map((file, index) => (
                          <Chip
                            key={index}
                            icon={<FileIcon />}
                            label={file.name || `Archivo ${index + 1}`}
                            clickable
                            onClick={() => window.open(file.url || file, '_blank')}
                            size="small"
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  {/* PAGO - Concepto */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <DescriptionIcon fontSize="small" color="secondary" />
                      <Typography variant="caption" color="text.secondary">Concepto</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="600">
                      {selectedRecord.concept || selectedRecord.description || 'Sin concepto'}
                    </Typography>
                  </Grid>

                  {/* Empresa */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CompanyIcon fontSize="small" color="secondary" />
                      <Typography variant="caption" color="text.secondary">Empresa</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="600">
                      {selectedRecord.companyName || 'Sin empresa'}
                    </Typography>
                  </Grid>

                  {/* Fecha de Pago */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <DateIcon fontSize="small" color="secondary" />
                      <Typography variant="caption" color="text.secondary">Fecha de Pago</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="600">
                      {selectedRecord.paymentDate ? new Date(selectedRecord.paymentDate.seconds * 1000).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      }) : selectedRecord.createdAt ? new Date(selectedRecord.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Sin fecha'}
                    </Typography>
                  </Grid>

                  {/* Monto */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <MoneyIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="text.secondary">Monto Pagado</Typography>
                    </Box>
                    <Typography variant="h6" color="success.main" fontWeight="700">
                      {fCurrency(selectedRecord.amount || 0)}
                    </Typography>
                  </Grid>

                  {/* Método de Pago */}
                  {selectedRecord.paymentMethod && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Método de Pago</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="600">
                        {selectedRecord.paymentMethod}
                      </Typography>
                    </Grid>
                  )}

                  {/* Referencia */}
                  {selectedRecord.reference && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Referencia</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="600">
                        {selectedRecord.reference}
                      </Typography>
                    </Grid>
                  )}

                  {/* Notas */}
                  {selectedRecord.notes && (
                    <Grid item xs={12}>
                      <Typography variant="overline" color="text.secondary" fontWeight="600" sx={{ mt: 2, display: 'block' }}>
                        NOTAS
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                        {selectedRecord.notes}
                      </Typography>
                    </Grid>
                  )}

                  {/* Comprobantes */}
                  {selectedRecord.receiptUrls && selectedRecord.receiptUrls.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="overline" color="text.secondary" fontWeight="600" sx={{ mt: 2, display: 'block' }}>
                        COMPROBANTES
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {selectedRecord.receiptUrls.map((url, index) => (
                          <Chip
                            key={index}
                            icon={<FileIcon />}
                            label={`Comprobante ${index + 1}`}
                            clickable
                            onClick={() => window.open(url, '_blank')}
                            size="small"
                            sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No se pudo cargar la información del registro.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={handleCloseDetails} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AIAssistant;

