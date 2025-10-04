import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat debe ser usado dentro de ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  // Estados principales
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache para evitar re-renders innecesarios
  const [conversationsCache, setConversationsCache] = useState({});

  // 🔥 LISTENER: Conversaciones del usuario actual
  useEffect(() => {
    if (!currentUser?.uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        conversationsQuery,
        (snapshot) => {
          const conversationsData = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            updatedAt: docSnap.data().updatedAt?.toDate(),
            createdAt: docSnap.data().createdAt?.toDate(),
            lastMessage: {
              ...docSnap.data().lastMessage,
              timestamp: docSnap.data().lastMessage?.timestamp?.toDate()
            }
          }));

          setConversations(conversationsData);

          // Actualizar cache
          const newCache = {};
          conversationsData.forEach(conv => {
            newCache[conv.id] = conv;
          });
          setConversationsCache(newCache);

          // Calcular total de mensajes no leídos
          const totalUnread = conversationsData.reduce((sum, conv) => {
            return sum + (conv.unreadCount?.[currentUser.uid] || 0);
          }, 0);
          setUnreadCount(totalUnread);

          setLoading(false);
        },
        (err) => {
          console.error('❌ Error escuchando conversaciones:', err);
          setError('Error al cargar conversaciones');
          setLoading(false);
          addNotification('Error al cargar conversaciones', 'error');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error configurando listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN: Marcar mensajes como leídos
  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!currentUser?.uid || !conversationId) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        console.warn('⚠️ Conversación no existe:', conversationId);
        return;
      }

      const currentUnread = conversationSnap.data().unreadCount?.[currentUser.uid] || 0;

      if (currentUnread > 0) {
        await updateDoc(conversationRef, {
          [`unreadCount.${currentUser.uid}`]: 0,
          updatedAt: serverTimestamp()
        });

        console.log(`✅ Conversación ${conversationId} marcada como leída`);
      }
    } catch (err) {
      console.error('❌ Error marcando como leído:', err);
    }
  }, [currentUser?.uid]);

  // ✅ FUNCIÓN: Obtener información de un participante
  const getParticipantInfo = useCallback(async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userId,
          name: userData.displayName || userData.nombre || 'Usuario',
          email: userData.email || '',
          photoURL: userData.photoURL || null,
          role: userData.role || 'user'
        };
      }
      return null;
    } catch (err) {
      console.error('❌ Error obteniendo info de usuario:', err);
      return null;
    }
  }, []);

  // ✅ FUNCIÓN: Obtener conversación con otro usuario (o crearla)
  const getOrCreateConversation = useCallback(async (otherUserId) => {
    if (!currentUser?.uid || !otherUserId) {
      throw new Error('Usuario no autenticado o destinatario inválido');
    }

    if (currentUser.uid === otherUserId) {
      throw new Error('No puedes crear una conversación contigo mismo');
    }

    try {
      // Buscar conversación existente
      const existingConversationsQuery = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', currentUser.uid),
        where('type', '==', 'direct')
      );

      const snapshot = await getDocs(existingConversationsQuery);
      
      // Buscar conversación que incluya al otro usuario
      const existingConversation = snapshot.docs.find(docSnap => {
        const data = docSnap.data();
        return data.participantIds.includes(otherUserId);
      });

      if (existingConversation) {
        console.log('✅ Conversación existente encontrada:', existingConversation.id);
        return existingConversation.id;
      }

      // No existe, crear nueva conversación
      const otherUserInfo = await getParticipantInfo(otherUserId);
      const currentUserInfo = await getParticipantInfo(currentUser.uid);

      if (!otherUserInfo || !currentUserInfo) {
        throw new Error('No se pudo obtener información de los usuarios');
      }

      const newConversationData = {
        type: 'direct',
        participantIds: [currentUser.uid, otherUserId],
        participantNames: {
          [currentUser.uid]: currentUserInfo.name,
          [otherUserId]: otherUserInfo.name
        },
        participantPhotos: {
          [currentUser.uid]: currentUserInfo.photoURL || null,
          [otherUserId]: otherUserInfo.photoURL || null
        },
        lastMessage: null,
        unreadCount: {
          [currentUser.uid]: 0,
          [otherUserId]: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          createdBy: currentUser.uid,
          archived: false
        }
      };

      const createdConversationRef = await addDoc(
        collection(db, 'conversations'),
        newConversationData
      );

      console.log('✅ Nueva conversación creada:', createdConversationRef.id);
      addNotification('Conversación iniciada', 'success');

      return createdConversationRef.id;
    } catch (err) {
      console.error('❌ Error obteniendo/creando conversación:', err);
      addNotification('Error al iniciar conversación', 'error');
      throw err;
    }
  }, [currentUser?.uid, getParticipantInfo, addNotification]);

  // ✅ FUNCIÓN: Obtener conversación desde cache
  const getConversation = useCallback((conversationId) => {
    return conversationsCache[conversationId] || null;
  }, [conversationsCache]);

  // ✅ FUNCIÓN: Obtener TODOS los usuarios registrados
  const getAllUsers = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));

      const users = snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        id: docSnap.id,
        ...docSnap.data()
      }));

      return users;
    } catch (err) {
      console.error('❌ Error obteniendo usuarios:', err);
      addNotification('Error al cargar contactos', 'error');
      return [];
    }
  }, [addNotification]);

  // ✅ FUNCIÓN: Buscar usuarios disponibles para chat
  const searchUsers = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return [];

    try {
      const snapshot = await getDocs(collection(db, 'users'));

      const users = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        .filter(user => {
          // Excluir usuario actual
          if (user.id === currentUser?.uid) return false;

          // Buscar en nombre y email
          const searchLower = searchTerm.toLowerCase();
          const nameMatch = (user.displayName || user.nombre || '').toLowerCase().includes(searchLower);
          const emailMatch = (user.email || '').toLowerCase().includes(searchLower);

          return nameMatch || emailMatch;
        })
        .slice(0, 10); // Limitar a 10 resultados

      return users;
    } catch (err) {
      console.error('❌ Error buscando usuarios:', err);
      return [];
    }
  }, [currentUser?.uid]);

  const value = {
    // Estados
    conversations,
    activeConversationId,
    unreadCount,
    loading,
    error,

    // Setters
    setActiveConversationId,

    // Funciones
    markConversationAsRead,
    getParticipantInfo,
    getOrCreateConversation,
    getConversation,
    getAllUsers,
    searchUsers
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
