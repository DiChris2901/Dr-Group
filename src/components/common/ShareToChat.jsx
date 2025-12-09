import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Box,
  Typography,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  IconButton,
  alpha
} from '@mui/material';
import { Share, Send, OpenInNew, Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useShareToChat } from '../../hooks/useShareToChat';
import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Formatear período de liquidación (ej: "octubre_2025" → "Octubre 2025")
 */
const formatearPeriodo = (periodo) => {
  if (!periodo) return 'No especificado';
  
  const [mes, año] = periodo.split('_');
  const mesesMap = {
    enero: 'Enero',
    febrero: 'Febrero',
    marzo: 'Marzo',
    abril: 'Abril',
    mayo: 'Mayo',
    junio: 'Junio',
    julio: 'Julio',
    agosto: 'Agosto',
    septiembre: 'Septiembre',
    octubre: 'Octubre',
    noviembre: 'Noviembre',
    diciembre: 'Diciembre'
  };
  
  return `${mesesMap[mes?.toLowerCase()] || mes} ${año}`;
};

/**
 * Componente de resumen de entidad compartida
 */
const EntitySummary = ({ entity, type }) => {
  const theme = useTheme();
  const [companyName, setCompanyName] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Cargar nombre de la empresa si existe companyId
  useEffect(() => {
    const loadCompanyName = async () => {
      if (!entity?.companyId) return;
      
      setLoadingCompany(true);
      try {
        const companyDoc = await getDoc(doc(db, 'companies', entity.companyId));
        if (companyDoc.exists()) {
          setCompanyName(companyDoc.data().name);
        }
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoadingCompany(false);
      }
    };

    loadCompanyName();
  }, [entity?.companyId]);

  // Validación: Si entity es null, mostrar mensaje (DESPUÉS de los hooks)
  if (!entity) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          No se pudo cargar la información del registro
        </Typography>
      </Paper>
    );
  }

  const renderField = (label, value, emoji = '📌') => (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      mb: 1.2,
      pb: 1.2,
      borderBottom: '1px solid',
      borderColor: alpha(theme.palette.divider, 0.6),
      '&:last-of-type': {
        borderBottom: 'none',
        mb: 0,
        pb: 0
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 180 }}>
        <Typography variant="body2" sx={{ mr: 0.8, fontSize: '0.9rem', lineHeight: 1.6 }}>
          {emoji}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.6 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ 
        flex: 1, 
        fontWeight: 500, 
        color: 'text.primary', 
        lineHeight: 1.6,
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}>
        {value || 'No especificado'}
      </Typography>
    </Box>
  );

  const renderAttachmentLink = (url, label = 'Ver adjunto') => {
    if (!url) return null;
    return (
      <Box sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
          📎 <strong>Adjunto:</strong>
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenInNew />}
          onClick={() => window.open(url, '_blank')}
          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
        >
          {label}
        </Button>
      </Box>
    );
  };

  const summaries = {
    commitment: (
      <>
        {renderField('Descripción', entity.description || entity.concept, '📋')}
        {renderField('Empresa', loadingCompany ? 'Cargando...' : (companyName || entity.company || 'No especificado'), '🏢')}
        {renderField('Beneficiario', entity.beneficiary, '👤')}
        {renderField('Monto', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.amount), '💰')}
        {renderField('Vence', entity.dueDate ? new Date(entity.dueDate).toLocaleDateString('es-CO') : 'No especificado', '📅')}
        {renderField('Estado', entity.paid || entity.isPaid ? '✅ Pagado' : '⏳ Pendiente', '📌')}
        {(entity.invoiceUrl || (entity.invoices && entity.invoices[0]?.url)) && 
          renderAttachmentLink(entity.invoiceUrl || entity.invoices[0]?.url, 'Ver factura')}
        {entity.receiptUrl && renderAttachmentLink(entity.receiptUrl, 'Ver comprobante')}
      </>
    ),
    payment: (
      <>
        {renderField('Concepto', entity.concept, '📋')}
        {renderField('Empresa', loadingCompany ? 'Cargando...' : (companyName || entity.companyName || entity.company || 'No especificado'), '🏢')}
        {renderField('Beneficiario', entity.beneficiary || entity.provider || 'No especificado', '👤')}
        {renderField('Monto', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.amount || entity.finalAmount || 0), '💰')}
        {renderField('Fecha', entity.date ? new Date(entity.date).toLocaleDateString('es-CO') : 'No especificada', '📅')}
        {renderField('Método', entity.method || entity.paymentMethod || 'No especificado', '💳')}
        {entity.reference && renderField('Referencia', entity.reference, '🔢')}
        {entity.sourceBank && renderField('Banco Origen', entity.sourceBank, '🏦')}
        {entity.sourceAccount && renderField('Cuenta Origen', entity.sourceAccount, '💳')}
        {entity.notes && renderField('Notas', entity.notes, '💬')}
        {(entity.attachments && entity.attachments.length > 0) && 
          renderAttachmentLink(entity.attachments[0], 'Ver comprobante')}
        {(!entity.attachments && entity.receiptUrl) && 
          renderAttachmentLink(entity.receiptUrl, 'Ver comprobante')}
        {(!entity.attachments && !entity.receiptUrl && entity.receiptUrls && entity.receiptUrls.length > 0) && 
          renderAttachmentLink(entity.receiptUrls[0], 'Ver comprobante')}
      </>
    ),
    liquidacion: (
      <>
        {renderField('Empresa', entity.empresa || entity.empresaNombre || entity.company || 'No especificada', '🏢')}
        {renderField('Período', entity.periodo || formatearPeriodo(entity.fechas?.periodoLiquidacion || entity.period || entity.mes) || 'No especificado', '📅')}
        {renderField('Establecimientos', entity.establecimientos || entity.metricas?.totalEstablecimientos || 'N/A', '🏛️')}
        {renderField('Máquinas', entity.totalMaquinas || entity.metricas?.totalMaquinas || entity.metricas?.maquinasConsolidadas || 'N/A', '🎰')}
        {renderField('Producción Total', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.totalProduccion || entity.metricas?.totalProduccion || 0), '💰')}
        {renderField('Derechos de Explotación', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.totalDerechos || entity.metricas?.derechosExplotacion || 0), '🏦')}
        {renderField('Gastos de Administración', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.totalGastos || entity.metricas?.gastosAdministracion || 0), '📋')}
        {renderField('Total Impuestos', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.totalImpuestos || entity.metricas?.totalImpuestos || entity.total || 0), '💸')}
      </>
    ),
    invoice: (
      <>
        {renderField('Número', entity.numero, '📋')}
        {renderField('Cliente', entity.cliente, '🏢')}
        {renderField('Monto', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.monto || 0), '💰')}
      </>
    ),
    income: (
      <>
        {renderField('Descripción', entity.description, '📋')}
        {renderField('Monto', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.amount || 0), '💰')}
        {renderField('Empresa', entity.company, '🏢')}
      </>
    ),
    company: (
      <>
        {entity.logoURL && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box
              component="img"
              src={entity.logoURL}
              alt={entity.name}
              sx={{
                maxWidth: '200px',
                maxHeight: '80px',
                objectFit: 'contain'
              }}
            />
          </Box>
        )}
        {renderField('Nombre', entity.name, '🏢')}
        {renderField('NIT', entity.nit || 'No especificado', '🆔')}
        {entity.email && renderField('Email', entity.email, '📧')}
        {entity.legalRepresentative && renderField('Representante Legal', entity.legalRepresentative, '👤')}
        {entity.legalRepresentativeId && renderField('Cédula Rep. Legal', entity.legalRepresentativeId, '🪪')}
        {entity.contractNumber && renderField('Número de Contrato', entity.contractNumber, '📋')}
        {entity.bankName && renderField('Banco', entity.bankName, '🏦')}
        {entity.bankAccount && renderField('Cuenta Bancaria', entity.bankAccount, '💳')}
        {entity.accountType && renderField('Tipo de Cuenta', entity.accountType, '📊')}
      </>
    ),
    client: (
      <>
        {renderField('Nombre', entity.nombre || entity.name, '👤')}
        {renderField('Email', entity.email || 'No especificado', '📧')}
        {renderField('Teléfono', entity.telefono || 'No especificado', '📞')}
        {entity.salas && entity.salas.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5,
            mb: 1.5,
            pb: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, fontSize: '0.9rem' }}>
                🎮
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: 0.5 
              }}>
                Salas Asociadas ({entity.salas.length})
              </Typography>
            </Box>
            {entity.salas.map((sala, index) => (
              <Typography 
                key={sala.id || index} 
                variant="body2" 
                sx={{ 
                  pl: 3, 
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}
              >
                {index + 1}. {sala.nombre} - {sala.ciudad || 'N/A'} ({sala.status === 'active' ? 'Activa' : 'Inactiva'})
              </Typography>
            ))}
          </Box>
        ) : (
          renderField('Salas', 'Sin salas asociadas', '🎮')
        )}
        {entity.administradores && entity.administradores.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5,
            mb: 1.5,
            pb: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, fontSize: '0.9rem' }}>
                👨‍💼
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: 0.5 
              }}>
                Administradores ({entity.administradores.length})
              </Typography>
            </Box>
            {entity.administradores.map((admin, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                sx={{ 
                  pl: 3, 
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}
              >
                {index + 1}. {admin.nombre} - {admin.telefono || 'Sin teléfono'}
              </Typography>
            ))}
          </Box>
        ) : null}
      </>
    ),
    administrator: (
      <>
        {renderField('Nombre', entity.nombre, '👤')}
        {renderField('Email', entity.email || 'No especificado', '📧')}
        {renderField('Teléfono', entity.telefono || 'No especificado', '📞')}
        {entity.salasAsociadas && entity.salasAsociadas.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5,
            mb: 1.5,
            pb: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, fontSize: '0.9rem' }}>
                🎮
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: 0.5 
              }}>
                Salas a Cargo ({entity.salasAsociadas.length})
              </Typography>
            </Box>
            {entity.salasAsociadas.map((sala, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                sx={{ 
                  pl: 3, 
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}
              >
                {index + 1}. {sala}
              </Typography>
            ))}
          </Box>
        ) : (
          renderField('Salas', 'Sin salas asignadas', '🎮')
        )}
      </>
    ),
    sala: (
      <>
        {renderField('Empresa', entity.companyName || 'No especificada', '🏢')}
        {renderField('Nombre', entity.name, '🎮')}
        {renderField('Ubicación', `${entity.ciudad || 'N/A'}, ${entity.departamento || 'N/A'}`, '📍')}
        {renderField('Dirección', entity.direccion || 'No especificada', '🗺️')}
        {renderField('Propietario', entity.propietario || 'No especificado', '👤')}
        {renderField('Proveedor', entity.proveedorOnline || 'No especificado', '💻')}
        {renderField('Contrato', entity.fechaInicioContrato ? `Inicio: ${new Date(entity.fechaInicioContrato).toLocaleDateString('es-CO')}` : 'No especificado', '📋')}
        {renderField('Contacto Principal', entity.contactoAutorizado ? `${entity.contactoAutorizado} - ${entity.contactPhone || 'S/T'} - ${entity.contactEmail || 'S/E'}` : 'No especificado', '👨‍💼')}
        {entity.contactoAutorizado2 && renderField('Contacto Secundario', `${entity.contactoAutorizado2} - ${entity.contactPhone2 || 'S/T'} - ${entity.contactEmail2 || 'S/E'}`, '👨‍💼')}
        {renderField('Máquinas', entity.maquinas || '0', '🎰')}
        {renderField('Estado', entity.status === 'active' ? 'Activa' : 'Retirada', '✅')}
      </>
    ),
    company_with_salas: (
      <>
        {renderField('Empresa', entity.name, '🏢')}
        {renderField('Total de Salas', `${entity.salasCount || 0} salas`, '📊')}
        {entity.salas && entity.salas.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5,
            mb: 1.5,
            pb: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, fontSize: '0.9rem' }}>
                🎮
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: 0.5 
              }}>
                Salas
              </Typography>
            </Box>
            {entity.salas.map((sala, index) => (
              <Typography 
                key={sala.id || index} 
                variant="body2" 
                sx={{ 
                  pl: 3, 
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}
              >
                {index + 1}. {sala.name} - {sala.ciudad || 'N/A'} ({sala.status === 'active' ? 'Activa' : 'Retirada'})
              </Typography>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 1.5,
            pb: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 180 }}>
              <Typography variant="body2" sx={{ mr: 1, fontSize: '0.9rem' }}>
                🎮
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: 0.5 
              }}>
                Salas
              </Typography>
            </Box>
            <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              No hay salas registradas
            </Typography>
          </Box>
        )}
      </>
    ),
    platform: (
      <>
        {renderField('Empresa', entity.companyName, '🏢')}
        {renderField('Plataforma', entity.platformName, '💻')}
        {renderField('Usuario', entity.username || entity.nit || 'No especificado', '👤')}
        {entity.cedula && renderField('Cédula', entity.cedula, '🪪')}
        {(entity.password || entity.contrasena) && renderField('Contraseña', '••••••••', '🔒')}
        {entity.link && (
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 1.5,
            pb: 1.5,
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 200 }}>
              <Typography variant="body2" sx={{ mr: 1, fontSize: '1.1rem' }}>
                🔗
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                Acceso
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNew />}
              onClick={() => window.open(entity.link, '_blank')}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 500,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              Abrir {entity.platformName}
            </Button>
          </Box>
        )}
      </>
    )
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        background: alpha(theme.palette.primary.main, 0.02),
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        maxHeight: '350px',
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { 
          background: 'transparent',
          marginTop: '4px',
          marginBottom: '4px'
        },
        '&::-webkit-scrollbar-thumb': { 
          background: alpha(theme.palette.primary.main, 0.3),
          borderRadius: '3px',
          transition: 'background 0.2s ease',
          '&:hover': { background: alpha(theme.palette.primary.main, 0.5) }
        }
      }}
    >
      <Typography variant="overline" sx={{ 
        fontWeight: 700, 
        color: 'primary.main',
        letterSpacing: 1,
        fontSize: '0.8rem',
        mb: 2.5,
        display: 'block',
        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        pb: 1
      }}>
        📝 Información a Compartir
      </Typography>
      {summaries[type] || summaries.commitment}
    </Paper>
  );
};

/**
 * Dialog principal para compartir al chat
 */
const ShareToChat = ({ open, onClose, entity, entityType, entityName = 'registro' }) => {
  const { shareToChat, availableGroups, availableUsers, loading: sharingLoading, error: sharingError } = useShareToChat();
  const { addNotification } = useNotifications();

  const [selectedTarget, setSelectedTarget] = useState('general');
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();

  const handleShare = async () => {
    if (!entity) {
      addNotification('error', 'No se puede compartir: datos inválidos');
      return;
    }

    let targetId = '';

    setIsSubmitting(true);

    try {
      if (selectedTarget === 'group') {
        targetId = selectedConversationId;
      } else if (selectedTarget === 'user' && selectedUser) {
        // Buscar conversación directa existente
        // Firestore no puede comparar arrays directamente, buscar por ambos participantes
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', currentUser.uid)
        );
        
        const existingConversations = await getDocs(conversationsQuery);
        
        // Filtrar manualmente para encontrar conversación con el usuario específico
        const dmConversation = existingConversations.docs.find(doc => {
          const data = doc.data();
          return data.type === 'direct' && 
                 data.participantIds?.includes(selectedUser.id) &&
                 data.participantIds?.length === 2;
        });
        
        if (dmConversation) {
          // Usar conversación existente
          targetId = dmConversation.id;
        } else {
          // Crear nueva conversación directa
          const participantIds = [currentUser.uid, selectedUser.id].sort();
          const newConversation = await addDoc(collection(db, 'conversations'), {
            type: 'direct',
            participantIds: participantIds,
            participantNames: {
              [currentUser.uid]: currentUser.displayName || currentUser.name || currentUser.email,
              [selectedUser.id]: selectedUser.name || selectedUser.displayName || selectedUser.email
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: null,
            unreadCount: {
              [currentUser.uid]: 0,
              [selectedUser.id]: 1 // El destinatario tiene 1 mensaje sin leer
            }
          });
          
          targetId = newConversation.id;
        }
      }

      if (!targetId) {
        addNotification('error', 'Debe seleccionar un destino');
        setIsSubmitting(false);
        return;
      }

      await shareToChat(entityType, entity, customMessage, targetId);
      
      addNotification('success', `${entityName} compartido exitosamente al chat`);
      
      // Resetear y cerrar
      setCustomMessage('');
      setSelectedTarget('general');
      setSelectedConversationId('');
      setSelectedUser(null);
      onClose();
      
      // Abrir el chat con la conversación específica
      window.dispatchEvent(new CustomEvent('openChat', { 
        detail: { conversationId: targetId } 
      }));
    } catch (error) {
      console.error('Error sharing to chat:', error);
      addNotification('error', `Error al compartir: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCustomMessage('');
      setSelectedTarget('general');
      setSelectedConversationId('');
      setSelectedUser(null);
      onClose();
    }
  };

  const theme = useTheme();
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
          maxWidth: { xs: '95vw', sm: 'md' },
          m: { xs: 2, sm: 4 }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white'
          }}>
            <Share />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
              Compartir {entityName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Enviar al chat del equipo
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'text.secondary' }} disabled={isSubmitting}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 5 }}>
        {/* Resumen de la entidad */}
        <EntitySummary entity={entity} type={entityType} />

        <Divider sx={{ my: 2 }} />

        {/* Selector de destino */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.95rem' }}>
            🎯 ¿Con quién deseas compartir?
          </FormLabel>
          <RadioGroup 
            value={selectedTarget} 
            onChange={(e) => {
              setSelectedTarget(e.target.value);
              setSelectedConversationId('');
              setSelectedUser(null);
            }}
          >
            <FormControlLabel 
              value="group" 
              control={<Radio size="small" />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Typography sx={{ fontSize: '0.9rem' }}>💬</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Grupo de chat</Typography>
                </Box>
              }
              sx={{
                py: 0.5,
                px: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                mb: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.04),
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                }
              }}
            />
            <FormControlLabel 
              value="user" 
              control={<Radio size="small" />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Typography sx={{ fontSize: '0.9rem' }}>👤</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Usuario específico</Typography>
                </Box>
              }
              sx={{
                py: 0.5,
                px: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.04),
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                }
              }}
            />
          </RadioGroup>
        </FormControl>

        {/* Si selecciona grupo */}
        {selectedTarget === 'group' && (
          <Autocomplete
            options={availableGroups}
            getOptionLabel={(option) => option.name}
            onChange={(e, group) => setSelectedConversationId(group?.id || '')}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Selecciona grupo" 
                sx={{ 
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5)
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px'
                    }
                  }
                }}
                required
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body1">{option.name}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            }}
          />
        )}

        {/* Si selecciona usuario */}
        {selectedTarget === 'user' && (
          <Autocomplete
            options={availableUsers}
            getOptionLabel={(user) => user.name || user.displayName || user.email}
            onChange={(e, user) => setSelectedUser(user)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Selecciona usuario" 
                sx={{ mt: 2 }}
                required
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={option.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(option.name || option.email)}&background=667eea&color=fff`}
                      sx={{ width: 32, height: 32, borderRadius: '50%' }}
                    />
                    <Box>
                      <Typography variant="body2">{option.name || option.displayName || 'Sin nombre'}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                    </Box>
                  </Box>
                </Box>
              );
            }}
          />
        )}

        <Divider sx={{ my: 2 }} />

        {/* Mensaje personalizado */}
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          label="💬 Mensaje adicional (opcional)"
          placeholder="Agregar contexto adicional... ¿Qué necesitas discutir sobre este registro?"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          helperText="Explica por qué compartes esto o qué acción se requiere del equipo"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': {
                borderColor: alpha(theme.palette.primary.main, 0.5)
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px'
              }
            }
          }}
        />

        {/* Errores */}
        {sharingError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {sharingError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {entity?.id ? `ID: ${entity.id}` : 'Mensaje del sistema'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
            disabled={isSubmitting}
            sx={{ 
              borderRadius: 2,
              fontWeight: 500,
              textTransform: 'none',
              px: 3,
              minHeight: 44,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'error.main',
                color: 'error.main',
                background: alpha(theme.palette.error.main, 0.04)
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleShare}
            variant="contained"
            disabled={
              isSubmitting || 
              (selectedTarget === 'group' && !selectedConversationId) ||
              (selectedTarget === 'user' && !selectedUser)
            }
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
            sx={{ 
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              minHeight: 44,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground
              }
            }}
          >
            {isSubmitting ? 'Compartiendo...' : 'Compartir'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ShareToChat;
