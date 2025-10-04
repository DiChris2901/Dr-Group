import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para notificar mensajes nuevos cuando el chat está cerrado
 * Implementa notificaciones toast y sonido opcional
 */
export const useChatNotifications = (isDrawerOpen) => {
  const { conversations } = useChat();
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const previousMessagesRef = useRef({});

  useEffect(() => {
    // Solo notificar si el drawer está cerrado
    if (isDrawerOpen || !currentUser?.uid) return;

    conversations.forEach(conversation => {
      const lastMessage = conversation.lastMessage;
      
      // Verificar si es un mensaje nuevo y no es del usuario actual
      if (
        lastMessage &&
        lastMessage.senderId !== currentUser.uid &&
        lastMessage.timestamp
      ) {
        const messageKey = `${conversation.id}_${lastMessage.timestamp.getTime()}`;
        
        // Si no hemos procesado este mensaje antes
        if (!previousMessagesRef.current[messageKey]) {
          previousMessagesRef.current[messageKey] = true;

          // 🔔 Obtener nombre del remitente
          const otherUserId = conversation.participantIds?.find(
            id => id !== currentUser.uid
          );
          const senderName = conversation.participantNames?.[otherUserId] || 'Usuario';

          // 🎯 Mostrar notificación toast
          addNotification(
            `💬 ${senderName}: ${lastMessage.text?.substring(0, 50)}${lastMessage.text?.length > 50 ? '...' : ''}`,
            'info',
            5000 // 5 segundos
          );

          // 🔊 Reproducir sonido (opcional - solo si hay permisos)
          try {
            // Crear un tono simple con Web Audio API (más compatible que archivos de audio)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frecuencia del tono
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
          } catch (err) {
            // Si falla el audio, no importa - la notificación toast sigue funcionando
            console.debug('Audio notification not available');
          }
        }
      }
    });

    // Limpiar mensajes antiguos del cache (mantener solo últimos 100)
    const keys = Object.keys(previousMessagesRef.current);
    if (keys.length > 100) {
      const toRemove = keys.slice(0, keys.length - 100);
      toRemove.forEach(key => {
        delete previousMessagesRef.current[key];
      });
    }
  }, [conversations, isDrawerOpen, currentUser?.uid, addNotification]);
};
