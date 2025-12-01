import { useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook para gestionar el estado de presencia (online/offline) del usuario
 * Utiliza Firestore para actualizaciones en tiempo real
 */
export const useUserPresence = (userId) => {
  useEffect(() => {
    if (!userId) {
      return;
    }
    
    const userRef = doc(db, 'users', userId);
    
    // Marcar como online al montar
    const markOnline = async () => {
      try {
        await updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('❌ Error marcando online:', error);
      }
    };

    // Marcar como offline al desmontar o cerrar pestaña
    const markOffline = async () => {
      try {
        await updateDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('❌ Error marcando offline:', error);
      }
    };

    // Actualizar lastSeen cada 30 segundos si está online
    const updateInterval = setInterval(async () => {
      try {
        await updateDoc(userRef, {
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('❌ Error actualizando lastSeen:', error);
      }
    }, 30000); // 30 segundos

    // Eventos de visibilidad de página
    const handleVisibilityChange = () => {
      if (document.hidden) {
        markOffline();
      } else {
        markOnline();
      }
    };

    // Eventos de beforeunload para marcar offline al cerrar
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/offline', JSON.stringify({ userId }));
      markOffline();
    };

    // Inicializar
    markOnline();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup - NO marcar offline inmediatamente, solo limpiar listeners
    return () => {
      clearInterval(updateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // NO llamar markOffline() aquí - solo al cerrar navegador con beforeunload
    };
  }, [userId]);
};

/**
 * Hook para observar el estado de presencia de múltiples usuarios
 */
export const useUsersPresence = (userIds = []) => {
  useEffect(() => {
    if (!userIds || userIds.length === 0) return;

    const rtdb = getDatabase();
    const unsubscribes = [];

    userIds.forEach((userId) => {
      const userStatusRef = ref(rtdb, `/status/${userId}`);
      
      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const status = snapshot.val();
        // Aquí podrías emitir eventos o actualizar un estado global
        // Por ahora solo se escucha el cambio
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userIds]);
};
