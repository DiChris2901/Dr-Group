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
  addDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
  deleteDoc
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

  // 🟢 Estado de presencia de usuarios
  const [usersPresence, setUsersPresence] = useState({});

  // Cache para evitar re-renders innecesarios
  const [conversationsCache, setConversationsCache] = useState({});

  // Derivado: mensajes no leídos por usuario (para chats directos)
  const unreadByUser = React.useMemo(() => {
    if (!currentUser?.uid) return {};
    const map = {};
    conversations.forEach((conv) => {
      if (!conv || !Array.isArray(conv.participantIds)) return;
      // Solo aplica para conversaciones directas
      const otherId = conv.participantIds.find((id) => id !== currentUser.uid);
      if (!otherId) return;
      const count = conv.unreadCount?.[currentUser.uid] || 0;
      if (count > 0) {
        map[otherId] = (map[otherId] || 0) + count;
      }
    });
    return map;
  }, [conversations, currentUser?.uid]);

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

  // 🟢 LISTENER: Estado de presencia de usuarios desde Firestore
  useEffect(() => {
    console.log('🔥 Iniciando listener de presencia (Firestore)...');
    
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const presenceData = {};
      snapshot.docs.forEach((doc) => {
        const userData = doc.data();
        // Señales de presencia
        const lastSeenDate = userData.lastSeen?.toDate ? userData.lastSeen.toDate() : userData.lastSeen;
        const hasFreshLastSeen = lastSeenDate ? (Date.now() - lastSeenDate.getTime()) < 180000 : false; // 3 min
        const onlineFlag = userData.online === true;
        // Relajamos condición: online si hay flag o lastSeen fresco
        const isOnline = onlineFlag || hasFreshLastSeen;
        
        presenceData[doc.id] = {
          state: isOnline ? 'online' : 'offline',
          online: isOnline,
          lastSeen: lastSeenDate,
          // Señales crudas útiles para debug fino
          _onlineFlag: onlineFlag,
          _fresh: hasFreshLastSeen
        };
      });
      
      // console.log('👥 Presencia recibida:', presenceData);
      setUsersPresence(presenceData);
    }, (error) => {
      console.error('❌ Error en listener de presencia:', error);
    });

    return () => {
      console.log('🔚 Desconectando listener de presencia');
      unsubscribe();
    };
  }, []);

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

  // ✅ FUNCIÓN: Crear chat grupal
  const createGroupChat = useCallback(async (groupName, memberIds, photoURL = null) => {
    if (!currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    if (!groupName || groupName.trim().length === 0) {
      throw new Error('El nombre del grupo es obligatorio');
    }

    if (!memberIds || memberIds.length < 2) {
      throw new Error('Se requieren al menos 2 miembros además del creador');
    }

    try {
      // Incluir al creador en la lista de participantes
      const allParticipantIds = [currentUser.uid, ...memberIds.filter(id => id !== currentUser.uid)];

      // Obtener info de todos los participantes
      const participantInfoPromises = allParticipantIds.map(id => getParticipantInfo(id));
      const participantsInfo = await Promise.all(participantInfoPromises);

      // Construir maps de nombres y fotos
      const participantNames = {};
      const participantPhotos = {};
      const unreadCount = {};

      participantsInfo.forEach(info => {
        if (info) {
          participantNames[info.id] = info.name;
          participantPhotos[info.id] = info.photoURL;
          unreadCount[info.id] = 0;
        }
      });

      const groupData = {
        type: 'group',
        participantIds: allParticipantIds,
        participantNames,
        participantPhotos,
        lastMessage: null,
        unreadCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          groupName: groupName.trim(),
          groupPhoto: photoURL,
          admins: [currentUser.uid], // Creador es admin por defecto
          createdBy: currentUser.uid,
          archived: false
        }
      };

      const groupRef = await addDoc(collection(db, 'conversations'), groupData);

      console.log('✅ Grupo creado:', groupRef.id);
      addNotification(`Grupo "${groupName}" creado exitosamente`, 'success');

      return groupRef.id;
    } catch (err) {
      console.error('❌ Error creando grupo:', err);
      addNotification('Error al crear grupo', 'error');
      throw err;
    }
  }, [currentUser?.uid, getParticipantInfo, addNotification]);

  // ✅ FUNCIÓN: Agregar miembro a grupo
  const addGroupMember = useCallback(async (conversationId, userId) => {
    if (!currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        throw new Error('Conversación no encontrada');
      }

      const conversationData = conversationSnap.data();

      // Verificar que es un grupo
      if (conversationData.type !== 'group') {
        throw new Error('Solo se pueden agregar miembros a grupos');
      }

      // Verificar que el usuario actual es admin
      const admins = conversationData.metadata?.admins || [];
      if (!admins.includes(currentUser.uid)) {
        throw new Error('Solo los administradores pueden agregar miembros');
      }

      // Verificar que el usuario no está ya en el grupo
      if (conversationData.participantIds.includes(userId)) {
        throw new Error('El usuario ya es miembro del grupo');
      }

      // Obtener info del nuevo miembro
      const userInfo = await getParticipantInfo(userId);
      if (!userInfo) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar grupo
      await updateDoc(conversationRef, {
        participantIds: arrayUnion(userId),
        [`participantNames.${userId}`]: userInfo.name,
        [`participantPhotos.${userId}`]: userInfo.photoURL,
        [`unreadCount.${userId}`]: 0,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Miembro agregado al grupo');
      addNotification(`${userInfo.name} agregado al grupo`, 'success');

      return true;
    } catch (err) {
      console.error('❌ Error agregando miembro:', err);
      addNotification(err.message || 'Error al agregar miembro', 'error');
      throw err;
    }
  }, [currentUser?.uid, getParticipantInfo, addNotification]);

  // ✅ FUNCIÓN: Remover miembro de grupo
  const removeGroupMember = useCallback(async (conversationId, userId) => {
    if (!currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        throw new Error('Conversación no encontrada');
      }

      const conversationData = conversationSnap.data();

      // Verificar que es un grupo
      if (conversationData.type !== 'group') {
        throw new Error('Solo se pueden remover miembros de grupos');
      }

      // Verificar que el usuario actual es admin
      const admins = conversationData.metadata?.admins || [];
      if (!admins.includes(currentUser.uid)) {
        throw new Error('Solo los administradores pueden remover miembros');
      }

      // No permitir remover al creador
      if (userId === conversationData.metadata?.createdBy) {
        throw new Error('No se puede remover al creador del grupo');
      }

      // Verificar que el usuario está en el grupo
      if (!conversationData.participantIds.includes(userId)) {
        throw new Error('El usuario no es miembro del grupo');
      }

      // Actualizar grupo
      await updateDoc(conversationRef, {
        participantIds: arrayRemove(userId),
        [`participantNames.${userId}`]: deleteField(),
        [`participantPhotos.${userId}`]: deleteField(),
        [`unreadCount.${userId}`]: deleteField(),
        updatedAt: serverTimestamp()
      });

      // Si era admin, removerlo también de admins
      if (admins.includes(userId)) {
        await updateDoc(conversationRef, {
          'metadata.admins': arrayRemove(userId)
        });
      }

      console.log('✅ Miembro removido del grupo');
      addNotification('Miembro removido del grupo', 'success');

      return true;
    } catch (err) {
      console.error('❌ Error removiendo miembro:', err);
      addNotification(err.message || 'Error al remover miembro', 'error');
      throw err;
    }
  }, [currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN: Actualizar info del grupo
  const updateGroupInfo = useCallback(async (conversationId, updates) => {
    if (!currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        throw new Error('Conversación no encontrada');
      }

      const conversationData = conversationSnap.data();

      // Verificar que es un grupo
      if (conversationData.type !== 'group') {
        throw new Error('Solo se puede actualizar info de grupos');
      }

      // Verificar que el usuario actual es admin
      const admins = conversationData.metadata?.admins || [];
      if (!admins.includes(currentUser.uid)) {
        throw new Error('Solo los administradores pueden actualizar el grupo');
      }

      const updateData = {
        updatedAt: serverTimestamp()
      };

      if (updates.groupName) {
        updateData['metadata.groupName'] = updates.groupName.trim();
      }

      if (updates.groupPhoto !== undefined) {
        updateData['metadata.groupPhoto'] = updates.groupPhoto;
      }

      await updateDoc(conversationRef, updateData);

      console.log('✅ Info de grupo actualizada');
      addNotification('Información del grupo actualizada', 'success');

      return true;
    } catch (err) {
      console.error('❌ Error actualizando grupo:', err);
      addNotification(err.message || 'Error al actualizar grupo', 'error');
      throw err;
    }
  }, [currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN: Verificar si usuario es admin de grupo
  const isGroupAdmin = useCallback((conversationId, userId = currentUser?.uid) => {
    if (!conversationId || !userId) return false;

    const conversation = conversationsCache[conversationId];
    if (!conversation) return false;

    if (conversation.type !== 'group') return false;

    const admins = conversation.metadata?.admins || [];
    return admins.includes(userId);
  }, [conversationsCache, currentUser?.uid]);

  // ✅ FUNCIÓN: Obtener miembros del grupo
  const getGroupMembers = useCallback((conversationId) => {
    const conversation = conversationsCache[conversationId];
    if (!conversation || conversation.type !== 'group') {
      return [];
    }

    return conversation.participantIds.map(id => ({
      id,
      name: conversation.participantNames?.[id] || 'Usuario',
      photoURL: conversation.participantPhotos?.[id] || null,
      isAdmin: conversation.metadata?.admins?.includes(id) || false,
      isCreator: id === conversation.metadata?.createdBy
    }));
  }, [conversationsCache]);

  // Función para eliminar un grupo
  const deleteGroup = async (groupId) => {
    if (!currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // 1. Eliminar conversación
      const conversationRef = doc(db, 'conversations', groupId);
      await deleteDoc(conversationRef);

      // 2. Opcional: Eliminar mensajes asociados
      // (Puedes comentar esto si quieres conservar historial)
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', groupId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(msgDoc => 
        deleteDoc(doc(db, 'messages', msgDoc.id))
      );
      await Promise.all(deletePromises);

      console.log(`✅ Grupo ${groupId} eliminado correctamente`);
    } catch (error) {
      console.error('❌ Error al eliminar grupo:', error);
      throw error;
    }
  };

  const value = {
    // Estados
    conversations,
    activeConversationId,
    unreadCount,
    loading,
    error,
    usersPresence,
    unreadByUser,

    // Setters
    setActiveConversationId,

    // Funciones directas
    markConversationAsRead,
    getParticipantInfo,
    getOrCreateConversation,
    getConversation,
    getAllUsers,
    searchUsers,

    // Funciones de grupos
    createGroupChat,
    addGroupMember,
    removeGroupMember,
    updateGroupInfo,
    isGroupAdmin,
    getGroupMembers,
    deleteGroup
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
