import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNotifications } from '../context/NotificationsContext';

/**
 * Hook para manejar mensajes de una conversación específica
 * @param {string} conversationId - ID de la conversación
 * @param {number} messagesPerPage - Cantidad de mensajes por página (default: 50)
 */
export const useChatMessages = (conversationId, messagesPerPage = 50) => {
  const { currentUser } = useAuth();
  const { markConversationAsRead } = useChat();
  const { addNotification } = useNotifications();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);

  // 🔥 LISTENER: Mensajes en tiempo real
  useEffect(() => {
    if (!conversationId || !currentUser?.uid) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(messagesPerPage)
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messagesData = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            
            // Manejar createdAt: si es null (serverTimestamp pendiente), usar Date.now()
            let createdAt;
            if (data.createdAt) {
              createdAt = data.createdAt.toDate();
            } else {
              // Si serverTimestamp aún no se ha resuelto, usar timestamp actual
              createdAt = new Date();
            }

            return {
              id: docSnap.id,
              ...data,
              createdAt,
              status: {
                ...data.status,
                readAt: data.status?.readAt?.toDate()
              },
              metadata: {
                ...data.metadata,
                editedAt: data.metadata?.editedAt?.toDate(),
                deletedAt: data.metadata?.deletedAt?.toDate()
              }
            };
          });

          setMessages(messagesData.reverse()); // Orden cronológico
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === messagesPerPage);
          setLoading(false);

          // Marcar como leídos automáticamente
          markConversationAsRead(conversationId);
        },
        (err) => {
          console.error('❌ Error escuchando mensajes:', err);
          setError('Error al cargar mensajes');
          setLoading(false);
          addNotification('Error al cargar mensajes', 'error');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error configurando listener mensajes:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [conversationId, currentUser?.uid, messagesPerPage, markConversationAsRead, addNotification]);

  // ✅ FUNCIÓN: Cargar más mensajes (paginación)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !lastVisible || loading) return;

    try {
      setLoading(true);

      const moreMessagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        firestoreLimit(messagesPerPage)
      );

      const snapshot = await getDocs(moreMessagesQuery);

      const moreMessagesData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        // Manejar createdAt de forma segura
        let createdAt;
        if (data.createdAt) {
          createdAt = data.createdAt.toDate();
        } else {
          createdAt = new Date();
        }

        return {
          id: docSnap.id,
          ...data,
          createdAt
        };
      });

      setMessages(prev => [...moreMessagesData.reverse(), ...prev]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === messagesPerPage);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error cargando más mensajes:', err);
      setLoading(false);
    }
  }, [conversationId, hasMore, lastVisible, loading, messagesPerPage]);

  // ✅ FUNCIÓN: Enviar mensaje de texto
  const sendMessage = useCallback(async (text, attachments = [], replyToId = null, mentionedUserIds = []) => {
    if (!conversationId || !currentUser?.uid || (!text?.trim() && attachments.length === 0)) {
      return;
    }

    try {
      // Obtener info de la conversación
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        throw new Error('Conversación no encontrada');
      }

      const conversationData = conversationSnap.data();
      const currentUserName = conversationData.participantNames[currentUser.uid] || 'Usuario';
      const currentUserPhoto = conversationData.participantPhotos[currentUser.uid] || null;

      // Crear mensaje
      const messageData = {
        conversationId,
        senderId: currentUser.uid,
        senderName: currentUserName,
        senderPhoto: currentUserPhoto,
        text: text.trim(),
        type: attachments.length > 0 ? 'file' : 'text',
        attachments: attachments,
        mentions: mentionedUserIds || [],
        status: {
          sent: true,
          delivered: false,
          read: false,
          readBy: [],
          readAt: null
        },
        createdAt: serverTimestamp(),
        metadata: {
          editedAt: null,
          deletedAt: null,
          replyTo: replyToId || null
        }
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);

      // Actualizar conversación
      const otherParticipantIds = conversationData.participantIds.filter(
        id => id !== currentUser.uid
      );

      const unreadCountUpdates = {};
      otherParticipantIds.forEach(participantId => {
        unreadCountUpdates[`unreadCount.${participantId}`] = increment(1);
      });

      await updateDoc(conversationRef, {
        lastMessage: {
          text: text.trim() || '📎 Archivo adjunto',
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
          hasAttachments: attachments.length > 0
        },
        ...unreadCountUpdates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Mensaje enviado:', messageRef.id);
      return messageRef.id;
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err);
      addNotification('Error al enviar mensaje', 'error');
      throw err;
    }
  }, [conversationId, currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN: Marcar mensaje como leído
  const markMessageAsRead = useCallback(async (messageId) => {
    if (!currentUser?.uid || !messageId) return;

    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) return;

      const messageData = messageSnap.data();

      // Solo marcar si no soy el remitente
      if (messageData.senderId === currentUser.uid) return;

      // Ya leído por este usuario
      if (messageData.status?.readBy?.includes(currentUser.uid)) return;

      await updateDoc(messageRef, {
        'status.read': true,
        'status.readBy': [...(messageData.status?.readBy || []), currentUser.uid],
        'status.readAt': serverTimestamp()
      });
    } catch (err) {
      console.error('❌ Error marcando mensaje como leído:', err);
    }
  }, [currentUser?.uid]);

  // ✅ FUNCIÓN: Eliminar mensaje (eliminación física de Firestore)
  const deleteMessage = useCallback(async (messageId) => {
    if (!currentUser?.uid || !messageId) return;

    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        throw new Error('Mensaje no encontrado');
      }

      const messageData = messageSnap.data();

      // Verificar que sea el remitente
      if (messageData.senderId !== currentUser.uid) {
        throw new Error('No tienes permiso para eliminar este mensaje');
      }

      // Eliminar físicamente el mensaje de Firestore
      await deleteDoc(messageRef);

      console.log('✅ Mensaje eliminado de Firestore:', messageId);
      addNotification('Mensaje eliminado', 'success');
    } catch (err) {
      console.error('❌ Error eliminando mensaje:', err);
      addNotification(err.message || 'Error al eliminar mensaje', 'error');
      throw err;
    }
  }, [currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN: Editar mensaje
  const editMessage = useCallback(async (messageId, newText) => {
    if (!currentUser?.uid || !messageId || !newText?.trim()) return;

    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        throw new Error('Mensaje no encontrado');
      }

      const messageData = messageSnap.data();

      // Verificar que sea el remitente
      if (messageData.senderId !== currentUser.uid) {
        throw new Error('No tienes permiso para editar este mensaje');
      }

      // Actualizar mensaje
      await updateDoc(messageRef, {
        text: newText.trim(),
        'metadata.editedAt': serverTimestamp(),
        'metadata.editedBy': currentUser.uid
      });

      console.log('✅ Mensaje editado:', messageId);
      addNotification('Mensaje editado', 'success');
    } catch (err) {
      console.error('❌ Error editando mensaje:', err);
      addNotification(err.message || 'Error al editar mensaje', 'error');
      throw err;
    }
  }, [currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN: Reenviar mensaje a otra conversación
  const forwardMessage = useCallback(async (originalMessage, targetConversationId) => {
    if (!currentUser?.uid || !originalMessage || !targetConversationId) return;

    try {
      // Obtener info de la conversación destino
      const targetConversationRef = doc(db, 'conversations', targetConversationId);
      const targetConversationSnap = await getDoc(targetConversationRef);

      if (!targetConversationSnap.exists()) {
        throw new Error('Conversación destino no encontrada');
      }

      const targetConversationData = targetConversationSnap.data();
      const currentUserName = targetConversationData.participantNames[currentUser.uid] || 'Usuario';
      const currentUserPhoto = targetConversationData.participantPhotos[currentUser.uid] || null;

      // Crear mensaje reenviado
      const forwardedMessageData = {
        conversationId: targetConversationId,
        senderId: currentUser.uid,
        senderName: currentUserName,
        senderPhoto: currentUserPhoto,
        text: originalMessage.text || '',
        type: originalMessage.attachments?.length > 0 ? 'file' : 'text',
        attachments: originalMessage.attachments || [],
        status: {
          sent: true,
          delivered: false,
          read: false,
          readBy: [],
          readAt: null
        },
        createdAt: serverTimestamp(),
        metadata: {
          editedAt: null,
          deletedAt: null,
          replyTo: null,
          forwardedFrom: originalMessage.id,
          originalSender: originalMessage.senderName
        }
      };

      // Crear mensaje en la conversación destino
      const messageRef = await addDoc(collection(db, 'messages'), forwardedMessageData);

      // Actualizar conversación destino
      const otherParticipants = targetConversationData.participantIds.filter(
        id => id !== currentUser.uid
      );
      const unreadCountUpdates = {};
      otherParticipants.forEach(participantId => {
        unreadCountUpdates[`unreadCount.${participantId}`] = increment(1);
      });

      await updateDoc(targetConversationRef, {
        lastMessage: originalMessage.text || '📎 Archivo adjunto',
        lastMessageAt: serverTimestamp(),
        ...unreadCountUpdates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Mensaje reenviado:', messageRef.id);
      addNotification('Mensaje reenviado', 'success');
      return messageRef.id;
    } catch (err) {
      console.error('❌ Error reenviando mensaje:', err);
      addNotification(err.message || 'Error al reenviar mensaje', 'error');
      throw err;
    }
  }, [currentUser?.uid, addNotification]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    editMessage,
    forwardMessage
  };
};

/**
 * Hook para buscar mensajes en una conversación
 * @param {string} conversationId - ID de la conversación
 * @param {string} searchTerm - Término de búsqueda
 */
export const useChatSearch = (conversationId, searchTerm) => {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!conversationId || !searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchMessages = async () => {
      setSearching(true);

      try {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', conversationId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(messagesQuery);

        const searchResults = snapshot.docs
          .map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate()
          }))
          .filter(message => {
            const searchLower = searchTerm.toLowerCase();
            return message.text?.toLowerCase().includes(searchLower);
          });

        setResults(searchResults);
        setSearching(false);
      } catch (err) {
        console.error('❌ Error buscando mensajes:', err);
        setSearching(false);
      }
    };

    // Debounce de 500ms
    const timeoutId = setTimeout(searchMessages, 500);
    return () => clearTimeout(timeoutId);
  }, [conversationId, searchTerm]);

  return { results, searching };
};

/**
 * Hook para estadísticas de chat
 */
export const useChatStats = () => {
  const { conversations, unreadCount } = useChat();
  const { currentUser } = useAuth();

  const stats = useMemo(() => {
    if (!currentUser?.uid) {
      return {
        totalConversations: 0,
        unreadConversations: 0,
        totalUnreadMessages: 0,
        activeConversations: 0
      };
    }

    const unreadConversations = conversations.filter(
      conv => (conv.unreadCount?.[currentUser.uid] || 0) > 0
    ).length;

    const activeConversations = conversations.filter(
      conv => conv.lastMessage !== null
    ).length;

    return {
      totalConversations: conversations.length,
      unreadConversations,
      totalUnreadMessages: unreadCount,
      activeConversations
    };
  }, [conversations, unreadCount, currentUser?.uid]);

  return stats;
};
