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
import { ref, onValue } from 'firebase/database';
import { db, database } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import { useUnreadCount, resetUnreadCount } from '../hooks/useUnreadCount';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🔥 Contadores de no leídos con RTDB (actualización instantánea)
  const { unreadCounts, totalUnread: unreadCount, getUnreadForConversation } = useUnreadCount(currentUser?.uid);

  // 🟢 Estado de presencia de usuarios
  const [usersPresence, setUsersPresence] = useState({});

  // Cache para evitar re-renders innecesarios
  const [conversationsCache, setConversationsCache] = useState({});

  // Derivado: mensajes no leídos por usuario (para chats directos) - AHORA CON RTDB
  const unreadByUser = React.useMemo(() => {
    if (!currentUser?.uid || !unreadCounts) return {};
    const map = {};
    conversations.forEach((conv) => {
      if (!conv || !Array.isArray(conv.participantIds)) return;
      // Solo aplica para conversaciones directas
      const otherId = conv.participantIds.find((id) => id !== currentUser.uid);
      if (!otherId) return;
      // Obtener contador desde RTDB
      const count = getUnreadForConversation(conv.id) || 0;
      if (count > 0) {
        map[otherId] = (map[otherId] || 0) + count;
      }
    });
    return map;
  }, [conversations, currentUser?.uid, unreadCounts, getUnreadForConversation]);

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

          // ✅ Total de no leídos ahora viene del hook useUnreadCount (RTDB)
          // Ya no necesitamos calcularlo aquí

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

  // 🟢 LISTENER: Estado de presencia de usuarios desde RTDB
  useEffect(() => {
    if (!database) {
      console.warn('⚠️ RTDB no disponible, presencia deshabilitada');
      return;
    }

    if (!currentUser?.uid) {
      console.warn('⚠️ Usuario no autenticado, esperando...');
      return;
    }

    console.log('🔥 Iniciando listener de presencia (RTDB)...');
    
    const statusRef = ref(database, '/status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const presenceData = {};
      const statusData = snapshot.val();
      
      if (statusData) {
        Object.entries(statusData).forEach(([userId, status]) => {
          const isOnline = status.state === 'online';
          const lastChanged = status.last_changed ? new Date(status.last_changed) : null;
          
          presenceData[userId] = {
            state: status.state,
            online: isOnline,
            lastSeen: lastChanged,
            last_changed: status.last_changed
          };
        });
      }
      
      console.log('👥 Presencia RTDB actualizada:', Object.keys(presenceData).length, 'usuarios');
      setUsersPresence(presenceData);
    }, (error) => {
      console.error('❌ Error en listener de presencia RTDB:', error);
      console.error('Detalles:', {
        code: error.code,
        message: error.message,
        authenticated: !!currentUser?.uid
      });
      // Fallback: limpiar presencia si hay error de permisos
      setUsersPresence({});
    });

    return () => {
      console.log('🔚 Desconectando listener de presencia RTDB');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // ✅ FUNCIÓN: Marcar mensajes como leídos (ahora con RTDB para actualización instantánea)
  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!currentUser?.uid || !conversationId) return;

    try {
      // Resetear contador en RTDB (instantáneo)
      await resetUnreadCount(conversationId, currentUser.uid);
      
      // También actualizar en Firestore para persistencia (opcional, por compatibilidad)
      // ❌ NO actualizar updatedAt aquí - solo debe actualizarse con mensajes nuevos
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${currentUser.uid}`]: 0
        // updatedAt: serverTimestamp() ← REMOVIDO para evitar reordenamiento al abrir
      }).catch(err => console.warn('⚠️ Error actualizando Firestore:', err));

      console.log(`✅ Conversación ${conversationId} marcada como leída`);
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
          description: '', // Descripción del grupo
          admins: [currentUser.uid], // Creador es admin por defecto
          createdBy: currentUser.uid,
          archived: false,
          settings: {
            onlyAdminsCanSend: false,
            onlyAdminsCanEditInfo: false,
            restrictLargeFiles: false,
            muteAll: false
          }
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

      // Verificar que el usuario actual es participante del grupo
      if (!conversationData.participantIds?.includes(currentUser.uid)) {
        throw new Error('Solo los participantes pueden actualizar el grupo');
      }

      const updateData = {
        updatedAt: serverTimestamp()
      };

      // Solo admins pueden cambiar el nombre del grupo
      if (updates.groupName) {
        const admins = conversationData.metadata?.admins || [];
        if (!admins.includes(currentUser.uid)) {
          throw new Error('Solo los administradores pueden cambiar el nombre del grupo');
        }
        updateData['metadata.groupName'] = updates.groupName.trim();
      }

      // Cualquier participante puede cambiar la foto del grupo
      if (updates.groupPhoto !== undefined) {
        updateData['metadata.groupPhoto'] = updates.groupPhoto;
      }

      // Solo admins pueden cambiar la descripción
      if (updates.description !== undefined) {
        const admins = conversationData.metadata?.admins || [];
        if (!admins.includes(currentUser.uid)) {
          throw new Error('Solo los administradores pueden cambiar la descripción del grupo');
        }
        updateData['metadata.description'] = updates.description.trim();
      }

      // Solo admins pueden cambiar configuraciones avanzadas
      if (updates.settings) {
        const admins = conversationData.metadata?.admins || [];
        if (!admins.includes(currentUser.uid)) {
          throw new Error('Solo los administradores pueden cambiar la configuración del grupo');
        }
        if (updates.settings.onlyAdminsCanSend !== undefined) {
          updateData['metadata.settings.onlyAdminsCanSend'] = updates.settings.onlyAdminsCanSend;
        }
        if (updates.settings.onlyAdminsCanEditInfo !== undefined) {
          updateData['metadata.settings.onlyAdminsCanEditInfo'] = updates.settings.onlyAdminsCanEditInfo;
        }
        if (updates.settings.restrictLargeFiles !== undefined) {
          updateData['metadata.settings.restrictLargeFiles'] = updates.settings.restrictLargeFiles;
        }
        if (updates.settings.muteAll !== undefined) {
          updateData['metadata.settings.muteAll'] = updates.settings.muteAll;
        }
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

  // ✅ FUNCIÓN: Abandonar grupo
  const leaveGroup = useCallback(async (conversationId) => {
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
        throw new Error('Solo se puede abandonar un grupo');
      }

      // No permitir que el creador abandone si hay otros miembros
      if (conversationData.metadata?.createdBy === currentUser.uid) {
        if (conversationData.participantIds.length > 1) {
          throw new Error('El creador debe transferir la propiedad o eliminar el grupo antes de abandonarlo');
        }
      }

      // Remover usuario de la lista de participantes
      const updatedParticipantIds = conversationData.participantIds.filter(id => id !== currentUser.uid);
      const updatedParticipantNames = { ...conversationData.participantNames };
      delete updatedParticipantNames[currentUser.uid];
      const updatedParticipantPhotos = { ...conversationData.participantPhotos };
      delete updatedParticipantPhotos[currentUser.uid];
      const updatedUnreadCount = { ...conversationData.unreadCount };
      delete updatedUnreadCount[currentUser.uid];

      // Remover de admins si era admin
      let updatedAdmins = conversationData.metadata?.admins || [];
      updatedAdmins = updatedAdmins.filter(id => id !== currentUser.uid);

      await updateDoc(conversationRef, {
        participantIds: updatedParticipantIds,
        participantNames: updatedParticipantNames,
        participantPhotos: updatedParticipantPhotos,
        unreadCount: updatedUnreadCount,
        'metadata.admins': updatedAdmins,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Abandonado el grupo exitosamente');
      addNotification('Has abandonado el grupo', 'success');

      return true;
    } catch (err) {
      console.error('❌ Error abandonando grupo:', err);
      addNotification(err.message || 'Error al abandonar el grupo', 'error');
      throw err;
    }
  }, [currentUser?.uid, addNotification]);

  // ✅ FUNCIÓN: Eliminar conversación (DM)
  const deleteConversation = useCallback(async (conversationId) => {
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

      // Solo permitir eliminar conversaciones directas (DM)
      if (conversationData.type === 'group') {
        throw new Error('Para eliminar grupos usa la opción correspondiente');
      }

      // Eliminar conversación
      await deleteDoc(conversationRef);

      // Opcional: Eliminar mensajes asociados
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(msgDoc => 
        deleteDoc(doc(db, 'messages', msgDoc.id))
      );
      await Promise.all(deletePromises);

      console.log('✅ Conversación eliminada exitosamente');
      addNotification('Conversación eliminada', 'success');

      return true;
    } catch (err) {
      console.error('❌ Error eliminando conversación:', err);
      addNotification(err.message || 'Error al eliminar conversación', 'error');
      throw err;
    }
  }, [currentUser?.uid, addNotification]);

  // 📌 Fijar/desfijar mensaje
  const togglePinMessage = async (conversationId, messageId) => {
    if (!conversationId || !currentUser?.uid) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        throw new Error('Conversación no encontrada');
      }

      const currentPinnedId = conversationSnap.data().pinnedMessageId;

      // Si el mensaje ya está fijado, desfijarlo
      if (currentPinnedId === messageId) {
        await updateDoc(conversationRef, {
          pinnedMessageId: deleteField()
        });
        addNotification('Mensaje desfijado', 'info');
        console.log('✅ Mensaje desfijado');
      } else {
        // Fijar nuevo mensaje
        await updateDoc(conversationRef, {
          pinnedMessageId: messageId
        });
        addNotification('Mensaje fijado', 'success');
        console.log('✅ Mensaje fijado:', messageId);
      }
    } catch (err) {
      console.error('❌ Error al fijar/desfijar mensaje:', err);
      addNotification('Error al fijar mensaje', 'error');
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
    deleteGroup,

    // Funciones de mensajes fijados
    togglePinMessage,

    // Funciones de gestión de conversaciones
    leaveGroup,
    deleteConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

