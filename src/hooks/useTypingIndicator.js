import { useEffect, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para indicar cuando el usuario está escribiendo
 * Actualiza timestamp en Firestore cada vez que el usuario escribe
 */
export const useTypingIndicator = (conversationId) => {
  const { currentUser } = useAuth();

  // 🔄 Función para actualizar estado de "escribiendo"
  const updateTypingStatus = useCallback(async () => {
    if (!conversationId || !currentUser?.uid) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`typing.${currentUser.uid}`]: serverTimestamp()
      });
    } catch (error) {
      console.debug('Error updating typing status:', error);
    }
  }, [conversationId, currentUser?.uid]);

  // 🧹 Limpiar estado de "escribiendo" al desmontar o cambiar conversación
  useEffect(() => {
    return () => {
      if (!conversationId || !currentUser?.uid) return;

      const clearTypingStatus = async () => {
        try {
          const conversationRef = doc(db, 'conversations', conversationId);
          await updateDoc(conversationRef, {
            [`typing.${currentUser.uid}`]: null
          });
        } catch (error) {
          console.debug('Error clearing typing status:', error);
        }
      };

      clearTypingStatus();
    };
  }, [conversationId, currentUser?.uid]);

  return { updateTypingStatus };
};
