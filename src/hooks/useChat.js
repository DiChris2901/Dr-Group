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
  getDocs,
  deleteField
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNotifications } from '../context/NotificationsContext';
import { incrementUnreadCount } from './useUnreadCount';

/**
 * Hook para manejar mensajes de una conversación específica
 * @param {string} conversationId - ID de la conversación
 * @param {number} messagesPerPage - Cantidad de mensajes por página (default: 25)
 */
export const useChatMessages = (conversationId, messagesPerPage = 25) => {
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

    // Resetear estado al cambiar de conversación
    setMessages([]);
    setLoading(true);
    setError(null);
    setHasMore(true);
    setLastVisible(null);

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
          // 📊 Log de lecturas para monitoreo (solo si no es cache ni pendiente)
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            console.log(`📨 Cargados ${snapshot.docs.length} mensajes desde servidor`);
          }

          // 🚀 OPTIMIZACIÓN: Usar docChanges() para actualizaciones incrementales
          // Esto evita reconstruir todo el array y mantiene las referencias estables
          const changes = snapshot.docChanges();

          if (changes.length === 0) {
            // No hay cambios reales, solo actualizar metadata
            setLoading(false);
            return;
          }

          // Helper para procesar un documento
          const processDoc = (docSnap) => {
            const data = docSnap.data();
            const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();

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
              },
              reactions: data.reactions || {}
            };
          };

          setMessages(prevMessages => {
            let updatedMessages = [...prevMessages];

            changes.forEach(change => {
              const processedMessage = processDoc(change.doc);

              if (change.type === 'added') {
                // 🔥 OPTIMISTIC UI: Buscar mensaje temporal para reemplazar
                const tempIndex = updatedMessages.findIndex(m => 
                  m._optimistic && 
                  m.senderId === processedMessage.senderId &&
                  m.text === processedMessage.text &&
                  Math.abs(m.createdAt - processedMessage.createdAt) < 5000 // Mismo mensaje en ventana de 5 seg
                );

                if (tempIndex !== -1) {
                  // ✅ Reemplazar mensaje temporal con el real
                  updatedMessages[tempIndex] = processedMessage;
                } else {
                  // ✅ Agregar nuevo mensaje en orden cronológico
                  const insertIndex = updatedMessages.findIndex(m => 
                    m.createdAt > processedMessage.createdAt
                  );
                  if (insertIndex === -1) {
                    updatedMessages.push(processedMessage);
                  } else {
                    updatedMessages.splice(insertIndex, 0, processedMessage);
                  }
                }
              } else if (change.type === 'modified') {
                // Actualizar mensaje existente manteniendo su posición
                const existingIndex = updatedMessages.findIndex(m => m.id === processedMessage.id);
                if (existingIndex !== -1) {
                  updatedMessages[existingIndex] = processedMessage;
                }
              } else if (change.type === 'removed') {
                // 🚀 OPTIMISTIC UI: El mensaje ya fue eliminado, solo confirmar
                // Filtrar por si acaso no se eliminó antes (edge case)
                updatedMessages = updatedMessages.filter(m => m.id !== change.doc.id);
              }
            });

            return updatedMessages;
          });

          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === messagesPerPage);
          setLoading(false);

          // ⚡ INSTANTÁNEO: Marcar como leído sin delay
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

      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        firestoreLimit(messagesPerPage)
      );

      const snapshot = await getDocs(messagesQuery);

      // 📊 Log de lecturas adicionales
      console.log(`📨 Cargando ${snapshot.docs.length} mensajes antiguos más (${snapshot.metadata.fromCache ? 'cache' : 'servidor'})`);

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

      // ✅ ORDEN: desc trae mensajes más antiguos, reverse y agregar al INICIO del array
      setMessages(prev => [...moreMessagesData.reverse(), ...prev]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === messagesPerPage);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error cargando más mensajes:', err);
      setLoading(false);
    }
  }, [conversationId, hasMore, lastVisible, loading, messagesPerPage]);

  // ✅ FUNCIÓN: Enviar mensaje de texto CON OPTIMISTIC UI
  const sendMessage = useCallback(async (text, attachments = [], replyToId = null, mentionedUserIds = []) => {
    if (!conversationId || !currentUser?.uid || (!text?.trim() && attachments.length === 0)) {
      return;
    }

    // 🚀 OPTIMISTIC UI: Crear ID temporal y agregar mensaje INSTANTÁNEAMENTE
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage = {
      id: tempId,
      conversationId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.name || currentUser.email || 'Usuario',
      senderPhoto: currentUser.photoURL || null,
      text: text.trim(),
      type: attachments.length > 0 ? 'file' : 'text',
      attachments: attachments,
      mentions: mentionedUserIds || [],
      status: {
        sent: false, // Aún no confirmado por servidor
        delivered: false,
        read: false,
        readBy: [],
        readAt: null
      },
      createdAt: new Date(),
      metadata: {
        editedAt: null,
        deletedAt: null,
        replyTo: replyToId || null
      },
      _optimistic: true // Flag para identificar mensaje temporal
    };

    // ⚡ AGREGAR INMEDIATAMENTE a la UI
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Obtener info de la conversación (usar cache si es posible)
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        throw new Error('Conversación no encontrada');
      }

      const conversationData = conversationSnap.data();
      const currentUserName = conversationData.participantNames?.[currentUser.uid] || currentUser.displayName || currentUser.name || currentUser.email || 'Usuario';
      const currentUserPhoto = conversationData.participantPhotos?.[currentUser.uid] || currentUser.photoURL || null;

      // Crear mensaje real
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
        createdAt: new Date(),
        metadata: {
          editedAt: null,
          deletedAt: null,
          replyTo: replyToId || null
        }
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);

      // ✅ El listener onSnapshot se encargará de reemplazar el mensaje temporal
      // No hacemos nada aquí para evitar duplicados

      // Actualizar conversación
      const otherParticipantIds = conversationData.participantIds.filter(
        id => id !== currentUser.uid
      );

      // Incrementar contadores de no leídos en RTDB (instantáneo)
      otherParticipantIds.forEach(participantId => {
        incrementUnreadCount(conversationId, participantId);
      });

      // También actualizar Firestore por compatibilidad
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

  // ✅ FUNCIÓN: Eliminar mensaje (eliminación física de Firestore con Optimistic UI)
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

      // 🚀 OPTIMISTIC UI: Eliminar inmediatamente de la UI
      setMessages(prev => prev.filter(m => m.id !== messageId));

      // Eliminar físicamente el mensaje de Firestore en background
      await deleteDoc(messageRef);

      console.log('✅ Mensaje eliminado de Firestore:', messageId);
      addNotification('Mensaje eliminado', 'success');
    } catch (err) {
      console.error('❌ Error eliminando mensaje:', err);
      addNotification(err.message || 'Error al eliminar mensaje', 'error');
      
      // Si falla, recargar mensajes para restaurar estado
      // El listener se encargará de restaurar el mensaje
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
      // Obtener info del usuario actual desde Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      const currentUserName = userSnap.exists() 
        ? (userSnap.data().name || userSnap.data().displayName || userSnap.data().email || 'Usuario')
        : (currentUser.displayName || currentUser.email || 'Usuario');
      const currentUserPhoto = userSnap.exists() 
        ? (userSnap.data().photoURL || null)
        : (currentUser.photoURL || null);

      // Obtener info de la conversación destino
      const targetConversationRef = doc(db, 'conversations', targetConversationId);
      const targetConversationSnap = await getDoc(targetConversationRef);

      if (!targetConversationSnap.exists()) {
        throw new Error('Conversación destino no encontrada');
      }

      const targetConversationData = targetConversationSnap.data();

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

  // ✅ FUNCIÓN OPTIMIZADA: Actualizar cursor de lectura (1 escritura en lugar de N)
  const updateReadCursor = useCallback(async (lastMessageTimestamp) => {
    if (!currentUser?.uid || !conversationId || !lastMessageTimestamp) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      
      // Solo actualizar si el nuevo timestamp es más reciente
      const conversationSnap = await getDoc(conversationRef);
      if (!conversationSnap.exists()) return;
      
      const currentReadTimestamp = conversationSnap.data()[`lastRead_${currentUser.uid}`];
      
      // Convertir timestamps para comparar
      const newTimestamp = lastMessageTimestamp instanceof Date 
        ? lastMessageTimestamp.getTime() 
        : lastMessageTimestamp;
      const oldTimestamp = currentReadTimestamp instanceof Date 
        ? currentReadTimestamp.getTime() 
        : currentReadTimestamp?.toMillis?.() || 0;
      
      if (newTimestamp <= oldTimestamp) return; // Ya leído más adelante
      
      await updateDoc(conversationRef, {
        [`lastRead_${currentUser.uid}`]: lastMessageTimestamp,
        [`unreadCount.${currentUser.uid}`]: 0 // Resetear contador
      });
      
      console.log('✅ Cursor de lectura actualizado');
    } catch (err) {
      console.error('❌ Error actualizando cursor de lectura:', err);
    }
  }, [currentUser?.uid, conversationId]);

  // ✅ FUNCIÓN: Agregar/quitar reacción a un mensaje
  const toggleReaction = useCallback(async (messageId, emoji) => {
    if (!currentUser?.uid || !messageId || !emoji) return;

    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        throw new Error('Mensaje no encontrado');
      }

      const messageData = messageSnap.data();
      const reactions = messageData.reactions || {};
      
      // Si el usuario ya reaccionó con este emoji, quitarlo
      if (reactions[currentUser.uid] === emoji) {
        await updateDoc(messageRef, {
          [`reactions.${currentUser.uid}`]: deleteField()
        });
        console.log('✅ Reacción eliminada');
      } else {
        // Agregar o cambiar reacción
        await updateDoc(messageRef, {
          [`reactions.${currentUser.uid}`]: emoji
        });
        console.log('✅ Reacción agregada:', emoji);
      }
    } catch (err) {
      console.error('❌ Error actualizando reacción:', err);
      addNotification('Error al agregar reacción', 'error');
    }
  }, [currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN LEGACY: Mantener para compatibilidad (ya no hace nada)
  const markMessageAsRead = useCallback(async (messageId) => {
    // Esta función ya no hace nada - usamos cursor de lectura
    // Se mantiene solo para no romper código existente
    return;
  }, []);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    sendMessage,
    markMessageAsRead, // Legacy - mantener para compatibilidad
    updateReadCursor, // Nueva función optimizada
    deleteMessage,
    editMessage,
    forwardMessage,
    toggleReaction // Nueva función de reacciones
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
