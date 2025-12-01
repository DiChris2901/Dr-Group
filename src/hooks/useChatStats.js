import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook para obtener estadísticas de una conversación
 * @param {string} conversationId - ID de la conversación
 * @returns {object} Estadísticas de la conversación
 */
export const useChatStats = (conversationId) => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalFiles: 0,
    totalAudios: 0,
    firstMessageDate: null,
    lastActivityDate: null,
    mostActiveUser: null,
    loading: true
  });

  useEffect(() => {
    if (!conversationId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));

        // Query para obtener todos los mensajes de la conversación
        const messagesQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', conversationId),
          orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(messagesQuery);
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (messages.length === 0) {
          setStats({
            totalMessages: 0,
            totalFiles: 0,
            totalAudios: 0,
            firstMessageDate: null,
            lastActivityDate: null,
            mostActiveUser: null,
            loading: false
          });
          return;
        }

        // Calcular estadísticas
        let fileCount = 0;
        let audioCount = 0;
        const userMessageCount = {};

        messages.forEach(msg => {
          // Contar archivos
          if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach(att => {
              if (att.type === 'audio') {
                audioCount++;
              } else {
                fileCount++;
              }
            });
          }

          // Contar mensajes por usuario
          if (msg.senderId) {
            userMessageCount[msg.senderId] = (userMessageCount[msg.senderId] || 0) + 1;
          }
        });

        // Encontrar usuario más activo
        let mostActiveUserId = null;
        let maxMessages = 0;
        Object.entries(userMessageCount).forEach(([userId, count]) => {
          if (count > maxMessages) {
            maxMessages = count;
            mostActiveUserId = userId;
          }
        });

        // Fechas
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];

        setStats({
          totalMessages: messages.length,
          totalFiles: fileCount,
          totalAudios: audioCount,
          firstMessageDate: firstMessage.createdAt?.toDate ? firstMessage.createdAt.toDate() : new Date(firstMessage.createdAt),
          lastActivityDate: lastMessage.createdAt?.toDate ? lastMessage.createdAt.toDate() : new Date(lastMessage.createdAt),
          mostActiveUser: mostActiveUserId ? { userId: mostActiveUserId, messageCount: maxMessages } : null,
          loading: false
        });
      } catch (err) {
        console.error('❌ Error obteniendo estadísticas del chat:', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [conversationId]);

  return stats;
};
