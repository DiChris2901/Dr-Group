import { useEffect } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { doc, updateDoc, serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';
import { database, db, auth } from '../config/firebase';

/**
 * Hook para gestionar el estado de presencia (online/offline) del usuario
 * Utiliza RTDB para detección automática de desconexión + Firestore para persistencia
 * 
 * VENTAJA: onDisconnect de RTDB detecta automáticamente cuando el navegador se cierra
 * o pierde conexión, sin necesidad de polling o eventos del navegador.
 */
export const useUserPresence = (userId) => {
  useEffect(() => {
    if (!userId || !database) {
      return;
    }
    
    // Referencias RTDB (para presencia en tiempo real)
    const userStatusRef = ref(database, `/status/${userId}`);
    const connectedRef = ref(database, '.info/connected');
    
    // Referencia Firestore (para persistencia y consultas)
    const userFirestoreRef = doc(db, 'users', userId);
    
    // Estado online
    const onlineState = {
      state: 'online',
      last_changed: rtdbServerTimestamp()
    };
    
    // Estado offline (ejecutado automáticamente por servidor cuando se desconecta)
    const offlineState = {
      state: 'offline',
      last_changed: rtdbServerTimestamp()
    };
    
    // Listener de conexión
    const unsubscribe = onValue(connectedRef, async (snapshot) => {
      if (snapshot.val() === true) {
        // 1. Si nos desconectamos, el servidor ejecutará esto automáticamente:
        await onDisconnect(userStatusRef).set(offlineState);
        
        // 2. Marcarnos como online en RTDB
        await set(userStatusRef, onlineState);
        
        // 3. Actualizar Firestore también (para consultas generales)
        try {
          await updateDoc(userFirestoreRef, {
            online: true,
            lastSeen: firestoreServerTimestamp()
          });
        } catch (error) {
          console.error('❌ Error actualizando Firestore:', error);
        }
      }
    });
    
    // 🔴 Listener para marcar offline al cerrar ventana/pestaña
    const handleBeforeUnload = () => {
      // Usar navigator.sendBeacon para envío garantizado
      const offlineData = JSON.stringify({
        state: 'offline',
        last_changed: Date.now()
      });
      
      // Intentar marcar como offline de forma síncrona
      try {
        set(userStatusRef, offlineState);
      } catch (error) {
        console.error('Error en beforeunload:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Marcar offline al desmontar solo si seguimos autenticados
      // Si no hay auth.currentUser, la escritura fallará por reglas de seguridad
      if (auth.currentUser) {
        set(userStatusRef, offlineState).catch(error => {
          // Ignorar errores de permisos durante el logout
          if (!error.message?.includes('PERMISSION_DENIED')) {
            console.error('Error setting offline status:', error);
          }
        });
      }
    };
  }, [userId]);
};

/**
 * Hook para observar el estado de presencia de múltiples usuarios
 * Retorna un objeto con el estado de cada usuario
 */
export const useUsersPresence = (userIds = [], callback) => {
  useEffect(() => {
    if (!userIds || userIds.length === 0 || !database) return;

    const unsubscribes = [];

    userIds.forEach((userId) => {
      const userStatusRef = ref(database, `/status/${userId}`);
      
      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const status = snapshot.val();
        if (callback && status) {
          callback(userId, status);
        }
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userIds, callback]);
};
