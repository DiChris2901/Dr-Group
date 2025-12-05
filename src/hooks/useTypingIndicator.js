import { useEffect, useCallback, useRef, useState } from 'react';
import { ref, set, onValue, remove, onDisconnect } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para indicar cuando el usuario está escribiendo
 * Utiliza RTDB para latencia ultra-baja (<50ms) y auto-cleanup con onDisconnect
 * 
 * VENTAJA: 
 * - Mucho más rápido que Firestore (50ms vs 300ms)
 * - Auto-limpieza si el usuario se desconecta
 * - No consume writes costosos de Firestore
 */
export const useTypingIndicator = (conversationId) => {
  const { currentUser } = useAuth();
  const typingTimeoutRef = useRef(null);
  const [whoIsTyping, setWhoIsTyping] = useState([]);

  // 🔄 Función para indicar que estoy escribiendo
  const startTyping = useCallback(async () => {
    if (!conversationId || !currentUser?.uid || !database) return;

    try {
      const typingRef = ref(database, `/typing/${conversationId}/${currentUser.uid}`);
      
      // Configurar auto-cleanup si me desconecto
      await onDisconnect(typingRef).remove();
      
      // Marcar que estoy escribiendo
      await set(typingRef, {
        userName: currentUser.displayName || currentUser.email,
        timestamp: Date.now()
      });

      // Auto-limpiar después de 3 segundos sin escribir
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } catch (error) {
      console.debug('Error updating typing status:', error);
    }
  }, [conversationId, currentUser]);

  // 🛑 Función para indicar que dejé de escribir
  const stopTyping = useCallback(async () => {
    if (!conversationId || !currentUser?.uid || !database) return;

    try {
      const typingRef = ref(database, `/typing/${conversationId}/${currentUser.uid}`);
      await remove(typingRef);
    } catch (error) {
      console.debug('Error clearing typing status:', error);
    }
  }, [conversationId, currentUser]);

  // 👀 Escuchar quién más está escribiendo
  useEffect(() => {
    if (!conversationId || !currentUser?.uid || !database) return;

    const typingRootRef = ref(database, `/typing/${conversationId}`);
    
    const unsubscribe = onValue(typingRootRef, (snapshot) => {
      const typingData = snapshot.val();
      if (!typingData) {
        setWhoIsTyping([]);
        return;
      }

      // Filtrar para excluir al usuario actual
      const typingUsers = Object.entries(typingData)
        .filter(([uid]) => uid !== currentUser.uid)
        .map(([uid, data]) => ({
          uid,
          userName: data.userName,
          timestamp: data.timestamp
        }))
        .filter(user => Date.now() - user.timestamp < 5000); // Solo últimos 5 segundos

      setWhoIsTyping(typingUsers);
    });

    return () => {
      unsubscribe();
      stopTyping();
    };
  }, [conversationId, currentUser, stopTyping]);

  // 🧹 Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { 
    startTyping, 
    stopTyping,
    whoIsTyping  // Array de usuarios que están escribiendo
  };
};
