import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

/**
 * Hook para compartir registros al chat
 * Permite enviar compromisos, pagos, liquidaciones, etc. a conversaciones específicas
 */
export const useShareToChat = () => {
  const { currentUser } = useAuth();
  const { conversations } = useChat();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar lista de usuarios disponibles para DMs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== currentUser?.uid) // Excluir usuario actual
          .sort((a, b) => (a.name || a.displayName || a.email).localeCompare(b.name || b.displayName || b.email));
        
        setUsers(usersData);
      } catch (err) {
        console.error('Error loading users:', err);
        setError(err.message);
      }
    };

    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

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
   * Formatear mensaje según tipo de entidad
   */
  const formatMessage = useCallback(async (entityType, entityData, customMessage) => {
    // Cargar nombre de empresa si existe companyId
    let companyName = entityData.company;
    if (entityData.companyId) {
      try {
        const companyDoc = await getDoc(doc(db, 'companies', entityData.companyId));
        if (companyDoc.exists()) {
          companyName = companyDoc.data().name;
        }
      } catch (error) {
        console.error('Error loading company name:', error);
      }
    }

    const templates = {
      commitment: {
        title: '💼 Compromiso Compartido',
        fields: [
          { emoji: '📋', label: 'Descripción', value: entityData.description || entityData.concept },
          { emoji: '🏢', label: 'Empresa', value: companyName },
          { emoji: '👤', label: 'Beneficiario', value: entityData.beneficiary },
          { emoji: '💰', label: 'Monto', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.amount) },
          { emoji: '📅', label: 'Vence', value: entityData.dueDate ? new Date(entityData.dueDate).toLocaleDateString('es-CO') : 'No especificado' },
          { emoji: '📌', label: 'Estado', value: entityData.paid || entityData.isPaid ? '✅ Pagado' : '⏳ Pendiente' },
          ...(entityData.invoiceUrl || (entityData.invoices && entityData.invoices[0]?.url) ? [{ emoji: '📎', label: 'Factura', value: entityData.invoiceUrl || entityData.invoices[0]?.url }] : []),
          ...(entityData.receiptUrl ? [{ emoji: '📎', label: 'Comprobante', value: entityData.receiptUrl }] : [])
        ]
      },
      payment: {
        title: '💸 Pago Compartido',
        fields: [
          { emoji: '📋', label: 'Concepto', value: entityData.concept },
          { emoji: '🏢', label: 'Empresa', value: entityData.companyName || entityData.company },
          { emoji: '👤', label: 'Beneficiario', value: entityData.beneficiary || entityData.provider || 'No especificado' },
          { emoji: '💰', label: 'Monto', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.amount || entityData.finalAmount || 0) },
          { emoji: '📅', label: 'Fecha', value: entityData.date ? new Date(entityData.date).toLocaleDateString('es-CO') : 'No especificada' },
          { emoji: '💳', label: 'Método', value: entityData.method || entityData.paymentMethod || 'No especificado' },
          ...(entityData.reference ? [{ emoji: '🔢', label: 'Referencia', value: entityData.reference }] : []),
          ...(entityData.sourceBank ? [{ emoji: '🏦', label: 'Banco Origen', value: entityData.sourceBank }] : []),
          ...(entityData.sourceAccount ? [{ emoji: '💳', label: 'Cuenta Origen', value: entityData.sourceAccount }] : []),
          ...(entityData.notes ? [{ emoji: '💬', label: 'Notas', value: entityData.notes }] : [])
        ]
      },
      liquidacion: {
        title: '📊 Liquidación Compartida',
        fields: [
          { emoji: '🏢', label: 'Empresa', value: entityData.empresa?.nombre || entityData.empresaNombre || entityData.company || 'No especificada' },
          { emoji: '🎮', label: 'Sala', value: entityData.sala?.nombre || entityData.salaNombre || entityData.sala || entityData.name || 'No especificada' },
          { emoji: '📅', label: 'Período', value: formatearPeriodo(entityData.fechas?.periodoLiquidacion || entityData.periodo || entityData.period || entityData.mes) },
          { emoji: '🎰', label: 'Máquinas', value: entityData.metricas?.totalMaquinas || entityData.totalMaquinas || 'N/A' },
          { emoji: '💰', label: 'Producción', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.metricas?.totalProduccion || entityData.totalProduccion || 0) },
          { emoji: '💸', label: 'Impuestos', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.metricas?.totalImpuestos || entityData.totalImpuestos || entityData.total || 0) }
        ]
      },
      invoice: {
        title: '🧾 Cuenta de Cobro Compartida',
        fields: [
          { emoji: '📋', label: 'Número', value: entityData.numero },
          { emoji: '🏢', label: 'Cliente', value: entityData.cliente },
          { emoji: '💰', label: 'Monto', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.monto || 0) },
          { emoji: '📅', label: 'Fecha', value: entityData.fecha ? new Date(entityData.fecha).toLocaleDateString('es-CO') : 'No especificada' }
        ]
      },
      income: {
        title: '💵 Ingreso Compartido',
        fields: [
          { emoji: '📋', label: 'Descripción', value: entityData.description },
          { emoji: '💰', label: 'Monto', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.amount || 0) },
          { emoji: '📅', label: 'Fecha', value: entityData.date ? new Date(entityData.date).toLocaleDateString('es-CO') : 'No especificada' },
          { emoji: '🏢', label: 'Empresa', value: entityData.company }
        ]
      },
      company: {
        title: '🏢 Empresa Compartida',
        fields: [
          { emoji: '🏢', label: 'Nombre', value: entityData.name },
          { emoji: '🆔', label: 'NIT', value: entityData.nit || 'No especificado' },
          ...(entityData.email ? [{ emoji: '📧', label: 'Email', value: entityData.email }] : []),
          ...(entityData.legalRepresentative ? [{ emoji: '👤', label: 'Representante Legal', value: entityData.legalRepresentative }] : []),
          ...(entityData.legalRepresentativeId ? [{ emoji: '🪪', label: 'Cédula Rep. Legal', value: entityData.legalRepresentativeId }] : []),
          ...(entityData.contractNumber ? [{ emoji: '📋', label: 'Número de Contrato', value: entityData.contractNumber }] : []),
          ...(entityData.bankName ? [{ emoji: '🏦', label: 'Banco', value: entityData.bankName }] : []),
          ...(entityData.bankAccount ? [{ emoji: '💳', label: 'Cuenta Bancaria', value: entityData.bankAccount }] : []),
          ...(entityData.accountType ? [{ emoji: '📊', label: 'Tipo de Cuenta', value: entityData.accountType }] : [])
        ]
      },
      client: {
        title: '👤 Cliente Compartido',
        fields: [
          { emoji: '👤', label: 'Nombre', value: entityData.name },
          { emoji: '📧', label: 'Email', value: entityData.email },
          { emoji: '📞', label: 'Teléfono', value: entityData.telefono || 'No especificado' },
          { emoji: '🏢', label: 'Empresa', value: entityData.empresa || 'No especificada' }
        ]
      },
      sala: {
        title: '🎮 Sala Compartida',
        fields: [
          { emoji: '🏢', label: 'Empresa', value: entityData.companyName || 'No especificada' },
          { emoji: '🎮', label: 'Nombre', value: entityData.name },
          { emoji: '📍', label: 'Ubicación', value: `${entityData.ciudad || 'N/A'}, ${entityData.departamento || 'N/A'}` },
          { emoji: '🗺️', label: 'Dirección', value: entityData.direccion || 'No especificada' },
          { emoji: '👤', label: 'Propietario', value: entityData.propietario || 'No especificado' },
          { emoji: '💻', label: 'Proveedor', value: entityData.proveedorOnline || 'No especificado' },
          { emoji: '📋', label: 'Contrato', value: entityData.fechaInicioContrato ? `Inicio: ${new Date(entityData.fechaInicioContrato).toLocaleDateString('es-CO')}` : 'No especificado' },
          { emoji: '👨‍💼', label: 'Contacto Principal', value: entityData.contactoAutorizado ? `${entityData.contactoAutorizado} - ${entityData.contactPhone || 'S/T'} - ${entityData.contactEmail || 'S/E'}` : 'No especificado' },
          ...(entityData.contactoAutorizado2 ? [{ emoji: '👨‍💼', label: 'Contacto Secundario', value: `${entityData.contactoAutorizado2} - ${entityData.contactPhone2 || 'S/T'} - ${entityData.contactEmail2 || 'S/E'}` }] : []),
          { emoji: '🎰', label: 'Máquinas', value: entityData.maquinas || '0' },
          { emoji: '✅', label: 'Estado', value: entityData.status === 'active' ? 'Activa' : 'Retirada' }
        ]
      },
      platform: {
        title: '🔐 Credenciales de Plataforma',
        fields: [
          { emoji: '🏢', label: 'Empresa', value: entityData.companyName },
          { emoji: '💻', label: 'Plataforma', value: entityData.platformName },
          { emoji: '👤', label: 'Usuario', value: entityData.username || entityData.nit || 'No especificado' },
          ...(entityData.cedula ? [{ emoji: '🪪', label: 'Cédula', value: entityData.cedula }] : []),
          ...(entityData.password || entityData.contrasena ? [{ emoji: '🔒', label: 'Contraseña', value: entityData.password || entityData.contrasena }] : []),
          ...(entityData.link ? [{ emoji: '🔗', label: 'Link*', value: `${entityData.link}\n\n*Copia este enlace o ábrelo desde el visor de mensaje` }] : [])
        ]
      },
      company_with_salas: {
        title: '🏢 Empresa con Salas',
        fields: [
          { emoji: '🏢', label: 'Empresa', value: entityData.name },
          { emoji: '📊', label: 'Total de Salas', value: `${entityData.salasCount || 0} salas` },
          { emoji: '🎮', label: 'Salas', value: entityData.salas && entityData.salas.length > 0 
            ? entityData.salas.map((sala, index) => 
                `\n${index + 1}. ${sala.name} - ${sala.ciudad || 'N/A'} (${sala.status === 'active' ? 'Activa' : 'Retirada'})`
              ).join('')
            : 'No hay salas registradas'
          }
        ]
      }
    };

    const template = templates[entityType] || templates.commitment;
    
    // Filtrar campos que no se mostrarán en el texto
    const fieldsToShow = template.fields.filter(
      field => field.label !== 'Factura' && field.label !== 'Comprobante'
    );
    
    // Construir mensaje formateado
    let message = `🚨 *${template.title}*\n\n`;
    
    fieldsToShow.forEach(field => {
      message += `${field.emoji} *${field.label}:* ${field.value}\n`;
    });

    if (customMessage && customMessage.trim() !== '') {
      message += `\n💬 *Mensaje:*\n${customMessage}`;
    }

    return message;
  }, []);

  /**
   * Compartir registro a una conversación específica
   */
  const shareToChat = useCallback(async (entityType, entityData, customMessage, targetConversationId) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    if (!targetConversationId) {
      throw new Error('Debe seleccionar un destino');
    }

    setLoading(true);
    setError(null);

    try {
      const messageText = await formatMessage(entityType, entityData, customMessage);

      // Extraer URLs de comprobantes/facturas según tipo de entidad
      const attachments = [];
      let entityUrl = null;

      if (entityType === 'commitment') {
        // Prioridad: invoiceUrl > receiptUrl > receiptUrls[0] > invoices[0]
        entityUrl = entityData.invoiceUrl || 
                   entityData.receiptUrl || 
                   (entityData.receiptUrls && entityData.receiptUrls.length > 0 ? entityData.receiptUrls[0] : null) ||
                   (entityData.invoices && entityData.invoices.length > 0 ? entityData.invoices[0].url || entityData.invoices[0].downloadURL : null);
        
        if (entityUrl) {
          attachments.push({
            type: 'application/pdf', // ✅ Tipo correcto para que MessageBubble lo detecte
            url: entityUrl,
            name: 'Comprobante.pdf', // ✅ Agregar extensión .pdf
            size: 0,
            uploadedAt: new Date().toISOString()
          });
        }
      } else if (entityType === 'payment') {
        // Prioridad: attachments[0] > receiptUrl > receiptUrls[0]
        entityUrl = (entityData.attachments && entityData.attachments.length > 0 ? entityData.attachments[0] : null) ||
                   entityData.receiptUrl || 
                   (entityData.receiptUrls && entityData.receiptUrls.length > 0 ? entityData.receiptUrls[0] : null);
        
        if (entityUrl) {
          attachments.push({
            type: 'application/pdf', // ✅ Tipo correcto
            url: entityUrl,
            name: 'Comprobante_pago.pdf', // ✅ Agregar extensión .pdf
            size: 0,
            uploadedAt: new Date().toISOString()
          });
        }
      }

      // Crear mensaje en Firestore
      await addDoc(collection(db, 'messages'), {
        conversationId: targetConversationId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.name || currentUser.email,
        senderPhoto: currentUser.photoURL || null,
        text: messageText,
        createdAt: serverTimestamp(),
        status: {
          sent: true,
          delivered: false,
          read: false
        },
        metadata: {
          isSharedEntity: true,
          entityType: entityType,
          entityId: entityData.id,
          entityUrl: entityUrl, // URL directo para smart chips
          sharedBy: {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.name || currentUser.email,
            timestamp: new Date().toISOString()
          }
        },
        attachments: attachments,
        mentions: [],
        replyTo: null
      });

      // ✅ ACTUALIZAR CONVERSACIÓN: lastMessage + updatedAt para reordenar lista de contactos
      const conversationRef = doc(db, 'conversations', targetConversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (conversationSnap.exists()) {
        const conversationData = conversationSnap.data();
        const otherParticipantIds = conversationData.participantIds?.filter(
          id => id !== currentUser.uid
        ) || [];

        // Incrementar contadores de no leídos para otros participantes
        const unreadCountUpdates = {};
        otherParticipantIds.forEach(participantId => {
          unreadCountUpdates[`unreadCount.${participantId}`] = increment(1);
        });

        await updateDoc(conversationRef, {
          lastMessage: {
            text: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            hasAttachments: attachments.length > 0
          },
          ...unreadCountUpdates,
          updatedAt: serverTimestamp()
        });
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Error sharing to chat:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [currentUser, formatMessage]);

  /**
   * Obtener solo grupos disponibles (no incluye DMs)
   */
  const getAvailableGroups = useCallback(() => {
    // ✅ GRUPOS REALES: Solo grupos que existen en Firestore (no hardcodeados)
    return conversations
      .filter(conv => conv.type === 'group')
      .map(conv => ({
        id: conv.id,
        name: conv.metadata?.groupName || conv.name || 'Grupo sin nombre',
        description: conv.metadata?.description || conv.description || 'Grupo de chat',
        type: 'group',
        icon: conv.metadata?.groupPhoto || conv.icon || '👥'
      }));
  }, [conversations]);

  return {
    shareToChat,
    availableGroups: getAvailableGroups(),
    availableUsers: users,
    loading,
    error
  };
};
