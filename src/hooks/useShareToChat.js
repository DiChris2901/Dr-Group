import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { getChatGroupsList } from '../config/chatGroups';

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
          { emoji: '💰', label: 'Monto', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.amount) },
          { emoji: '📅', label: 'Fecha', value: entityData.date ? new Date(entityData.date).toLocaleDateString('es-CO') : 'No especificada' },
          { emoji: '🏢', label: 'Empresa', value: entityData.company }
        ]
      },
      liquidacion: {
        title: '📊 Liquidación Compartida',
        fields: [
          { emoji: '🏢', label: 'Sala', value: entityData.sala || entityData.name },
          { emoji: '💰', label: 'Total', value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.total || 0) },
          { emoji: '📅', label: 'Período', value: entityData.period || entityData.mes }
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
          { emoji: '🆔', label: 'NIT', value: entityData.nit },
          { emoji: '👤', label: 'Representante', value: entityData.representante || 'No especificado' },
          { emoji: '📞', label: 'Teléfono', value: entityData.telefono || 'No especificado' }
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
          { emoji: '🎮', label: 'Nombre', value: entityData.name },
          { emoji: '📍', label: 'Ubicación', value: entityData.ubicacion || 'No especificada' },
          { emoji: '💰', label: 'Tarifa', value: entityData.tarifa ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entityData.tarifa) : 'No especificada' },
          { emoji: '📊', label: 'Capacidad', value: entityData.capacidad || 'No especificada' }
        ]
      }
    };

    const template = templates[entityType] || templates.commitment;
    
    // Construir mensaje formateado
    let message = `🚨 *${template.title}*\n\n`;
    
    template.fields.forEach(field => {
      // No incluir campos de Factura/Comprobante en el texto (ya aparecen como botón)
      if (field.label === 'Factura' || field.label === 'Comprobante') {
        return; // Skip
      }
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
        entityUrl = entityData.receiptUrl || 
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
   * Obtener conversaciones disponibles (grupos + DMs)
   */
  const getAvailableConversations = useCallback(() => {
    // Grupos predefinidos
    const groups = getChatGroupsList();
    
    // Conversaciones directas existentes
    const directMessages = conversations
      .filter(conv => conv.type === 'direct' || conv.participantIds?.length === 2)
      .map(conv => {
        const otherUserId = conv.participantIds?.find(id => id !== currentUser?.uid);
        const otherUser = users.find(u => u.id === otherUserId);
        
        return {
          id: conv.id,
          name: otherUser ? `👤 ${otherUser.name || otherUser.displayName || otherUser.email}` : '👤 Usuario',
          description: 'Mensaje directo',
          type: 'direct',
          icon: '👤'
        };
      });

    return [...groups, ...directMessages];
  }, [conversations, users, currentUser]);

  return {
    shareToChat,
    availableConversations: getAvailableConversations(),
    availableUsers: users,
    loading,
    error
  };
};
