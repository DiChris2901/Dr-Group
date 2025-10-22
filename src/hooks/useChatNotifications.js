import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para notificar mensajes nuevos cuando el chat está cerrado
 * Implementa notificaciones toast y sonido opcional
 * Persiste mensajes notificados en localStorage para evitar duplicados
 */
export const useChatNotifications = (isDrawerOpen) => {
  const { conversations } = useChat();
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const previousMessagesRef = useRef({});
  const isInitializedRef = useRef(false);

  // Cargar mensajes ya notificados desde localStorage al inicializar
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    try {
      const storageKey = `dr_group_notified_messages_${currentUser.uid}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        previousMessagesRef.current = JSON.parse(stored);
        console.log(`📥 Cargados ${Object.keys(previousMessagesRef.current).length} mensajes ya notificados`);
      }
    } catch (error) {
      console.warn('Error cargando mensajes notificados:', error);
    }
    
    // Marcar como inicializado después de un pequeño delay para evitar notificaciones iniciales
    setTimeout(() => {
      isInitializedRef.current = true;
    }, 1000);
  }, [currentUser?.uid]);

  // Guardar mensajes notificados en localStorage
  const saveNotifiedMessages = () => {
    if (!currentUser?.uid) return;
    
    try {
      const storageKey = `dr_group_notified_messages_${currentUser.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(previousMessagesRef.current));
    } catch (error) {
      console.warn('Error guardando mensajes notificados:', error);
    }
  };

  useEffect(() => {
    // Solo notificar si el drawer está cerrado, el usuario está autenticado y ya se inicializó
    if (isDrawerOpen || !currentUser?.uid || !isInitializedRef.current) return;

    let hasNewNotifications = false;

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
          hasNewNotifications = true;

          // 🔔 Obtener nombre del remitente
          const otherUserId = conversation.participantIds?.find(
            id => id !== currentUser.uid
          );
          const senderName = conversation.participantNames?.[otherUserId] || 'Usuario';

          console.log(`🔔 Nueva notificación de chat: ${senderName}`);

          // 🎯 Mostrar notificación toast
          addNotification({
            title: `💬 ${senderName}`,
            message: `${lastMessage.text?.substring(0, 50)}${lastMessage.text?.length > 50 ? '...' : ''}`,
            type: 'info',
            source: 'chat', // Identificar que viene del chat
            conversationId: conversation.id
          });

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

    // Guardar en localStorage si hubo nuevas notificaciones
    if (hasNewNotifications) {
      saveNotifiedMessages();
    }

    // Limpiar mensajes antiguos del cache (mantener solo últimos 200)
    const keys = Object.keys(previousMessagesRef.current);
    if (keys.length > 200) {
      const sortedKeys = keys.sort(); // Ordenar por timestamp implícito en la key
      const toRemove = sortedKeys.slice(0, keys.length - 200);
      toRemove.forEach(key => {
        delete previousMessagesRef.current[key];
      });
      saveNotifiedMessages();
    }
  }, [conversations, isDrawerOpen, currentUser?.uid, addNotification]);
};
