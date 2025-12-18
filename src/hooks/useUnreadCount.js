import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, increment } from 'firebase/database';
import { database, auth } from '../config/firebase';

/**
 * Hook para gestionar contadores de mensajes no leídos con RTDB
 * 
 * VENTAJA sobre Firestore:
 * - Operaciones atómicas con increment()
 * - Actualización instantánea (<50ms)
 * - No consume writes costosos de Firestore
 * - Sincronización en tiempo real entre dispositivos
 */

/**
 * Incrementar contador de no leídos para un usuario en una conversación
 */
export const incrementUnreadCount = async (conversationId, userId) => {
  if (!database || !conversationId || !userId) return;
  
  try {
    const unreadRef = ref(database, `/unread/${userId}/${conversationId}`);
    await set(unreadRef, increment(1));
  } catch (error) {
    console.error('❌ Error incrementando contador:', error);
  }
};

/**
 * Resetear contador de no leídos para un usuario en una conversación
 */
export const resetUnreadCount = async (conversationId, userId) => {
  if (!database || !conversationId || !userId) return;
  
  try {
    const unreadRef = ref(database, `/unread/${userId}/${conversationId}`);
    await set(unreadRef, 0);
  } catch (error) {
    console.error('❌ Error reseteando contador:', error);
  }
};

/**
 * Hook para escuchar contadores de no leídos de un usuario
 * Retorna un objeto { conversationId: count }
 */
export const useUnreadCount = (userId) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!userId || !database) {
      setUnreadCounts({});
      setTotalUnread(0);
      return;
    }

    const unreadRef = ref(database, `/unread/${userId}`);
    
    const unsubscribe = onValue(unreadRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUnreadCounts(data);
      
      // Calcular total
      const total = Object.values(data).reduce((sum, count) => sum + (count || 0), 0);
      setTotalUnread(total);
    }, (error) => {
      // Ignorar errores de permisos si el usuario se está deslogueando
      if ((error.message?.includes('permission_denied') || error.code === 'PERMISSION_DENIED') && !auth.currentUser) {
        return;
      }
      console.error('❌ Error escuchando contadores:', error);
    });

    return () => unsubscribe();
  }, [userId]);

  // Función helper para obtener contador de una conversación específica
  const getUnreadForConversation = useCallback((conversationId) => {
    return unreadCounts[conversationId] || 0;
  }, [unreadCounts]);

  return {
    unreadCounts,           // { conversationId: count }
    totalUnread,            // Número total de no leídos
    getUnreadForConversation
  };
};
