import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Hook para notificar mensajes nuevos cuando el chat está cerrado
 * Implementa notificaciones toast y sonido opcional
 * Persiste mensajes notificados en localStorage para evitar duplicados
 * Respeta configuraciones del usuario (sonido, toast, vibración)
 */
export const useChatNotifications = (isDrawerOpen) => {
  // ✅ TODOS LOS HOOKS EN ORDEN FIJO - NUNCA CONDICIONALES
  const chat = useChat();
  const notifications = useNotifications();
  const auth = useAuth();
  const settingsContext = useSettings();
  
  // ✅ useRef SIEMPRE después de todos los useContext
  const previousMessagesRef = useRef({});
  const isInitializedRef = useRef(false);
  const lastNotificationByUser = useRef({}); // Para throttling por remitente
  const notificationCount = useRef({ count: 0, resetTime: Date.now() }); // Para rate limiting

  // Extraer valores con fallbacks seguros
  const conversations = chat?.conversations || [];
  const addNotification = notifications?.addNotification;
  const currentUser = auth?.currentUser;
  const settings = settingsContext?.settings;

  // Cargar mensajes ya notificados desde localStorage al inicializar
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    try {
      const storageKey = `dr_group_notified_messages_${currentUser.uid}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        previousMessagesRef.current = JSON.parse(stored);
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

    // Verificar si las notificaciones de chat están habilitadas
    const chatNotificationsEnabled = settings?.notifications?.chat?.enabled !== false;
    const chatSoundEnabled = settings?.notifications?.chat?.sound !== false;
    const chatToastEnabled = settings?.notifications?.chat?.toast !== false;
    const chatVibrateEnabled = settings?.notifications?.chat?.vibrate === true;
    const chatBrowserEnabled = settings?.notifications?.chat?.browser === true;

    if (!chatNotificationsEnabled) return;

    // 🛡️ Rate Limiting Global: Máximo 5 notificaciones por minuto
    const canNotify = () => {
      const now = Date.now();
      const ONE_MINUTE = 60000;
      
      // Resetear contador cada minuto
      if (now - notificationCount.current.resetTime > ONE_MINUTE) {
        notificationCount.current = { count: 0, resetTime: now };
      }
      
      // Máximo 5 notificaciones por minuto
      if (notificationCount.current.count >= 5) {
        console.log('⚠️ Límite de notificaciones alcanzado (5/min)');
        return false;
      }
      
      notificationCount.current.count++;
      return true;
    };

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
          // 🔔 Obtener nombre del remitente REAL (no el primer participante)
          const senderId = lastMessage.senderId;
          const senderName = conversation.participantNames?.[senderId] || 'Usuario';

          // 🛡️ THROTTLING: Evitar spam del mismo remitente (3 segundos mínimo)
          const lastTime = lastNotificationByUser.current[senderId];
          const now = Date.now();
          const THROTTLE_INTERVAL = 3000; // 3 segundos

          if (lastTime && (now - lastTime) < THROTTLE_INTERVAL) {
            console.log(`⏸️ Throttling: ignorando mensaje de ${senderName} (menos de 3s)`);
            previousMessagesRef.current[messageKey] = true; // Marcar como procesado sin notificar
            return; // No notificar
          }

          // 🛡️ RATE LIMITING: Verificar límite global
          if (!canNotify()) {
            console.log('⚠️ Rate limit: demasiadas notificaciones, ignorando...');
            previousMessagesRef.current[messageKey] = true;
            return;
          }

          // ✅ TODO OK: Proceder con la notificación
          previousMessagesRef.current[messageKey] = true;
          lastNotificationByUser.current[senderId] = now; // Actualizar timestamp
          hasNewNotifications = true;

          // 🎯 Mostrar notificación toast (si está habilitada)
          if (chatToastEnabled) {
            addNotification({
              title: `💬 ${senderName}`,
              message: `${lastMessage.text?.substring(0, 50)}${lastMessage.text?.length > 50 ? '...' : ''}`,
              type: 'info',
              source: 'chat', // Identificar que viene del chat
              conversationId: conversation.id,
              onClick: () => {
                // ✅ Al hacer clic en toast, abrir el chat con esa conversación
                localStorage.setItem('drgroup_pendingConversation', conversation.id);
                localStorage.setItem('drgroup_chatDrawerOpen', 'true');
                
                window.dispatchEvent(new CustomEvent('openChat', {
                  detail: { conversationId: conversation.id }
                }));
              }
            });
          }

          // 🔊 Reproducir sonido mejorado (solo si está habilitado)
          if (chatSoundEnabled) {
            try {
              // Crear un tono de notificación más agradable con dos notas
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              
              // Primera nota (más alta)
              const oscillator1 = audioContext.createOscillator();
              const gainNode1 = audioContext.createGain();
              oscillator1.connect(gainNode1);
              gainNode1.connect(audioContext.destination);
              oscillator1.frequency.value = 1000; // Do alto
              oscillator1.type = 'sine';
              gainNode1.gain.setValueAtTime(0.2, audioContext.currentTime);
              gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
              oscillator1.start(audioContext.currentTime);
              oscillator1.stop(audioContext.currentTime + 0.15);

              // Segunda nota (más baja) - con pequeño delay
              const oscillator2 = audioContext.createOscillator();
              const gainNode2 = audioContext.createGain();
              oscillator2.connect(gainNode2);
              gainNode2.connect(audioContext.destination);
              oscillator2.frequency.value = 800; // Sol
              oscillator2.type = 'sine';
              gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1);
              gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
              oscillator2.start(audioContext.currentTime + 0.1);
              oscillator2.stop(audioContext.currentTime + 0.3);
            } catch (err) {
              // Si falla el audio, no importa - la notificación toast sigue funcionando
              console.debug('Audio notification not available');
            }
          }

          // 📳 Vibrar (solo en dispositivos móviles y si está habilitado)
          if (chatVibrateEnabled && 'vibrate' in navigator) {
            try {
              navigator.vibrate([200, 100, 200]); // Patrón de vibración: vibrar-pausar-vibrar
            } catch (err) {
              console.debug('Vibration not available');
            }
          }

          // 🔔 Notificación del navegador (si está habilitada)
          if (chatBrowserEnabled && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              try {
                const notification = new Notification(`💬 ${senderName}`, {
                  body: lastMessage.text?.substring(0, 100) || '📎 Archivo adjunto',
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/badge-72x72.png',
                  tag: 'dr-group-chat', // Agrupa notificaciones
                  requireInteraction: false,
                  silent: !chatSoundEnabled, // Usar el sonido del sistema si el nuestro está deshabilitado
                  vibrate: chatVibrateEnabled ? [200, 100, 200] : undefined,
                  data: {
                    conversationId: conversation.id,
                    senderId: senderId
                  }
                });

                // ✅ Al hacer clic en la notificación, abrir el chat con esa conversación
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                  
                  // Guardar conversación ID para abrir al activar el chat
                  localStorage.setItem('drgroup_pendingConversation', conversation.id);
                  localStorage.setItem('drgroup_chatDrawerOpen', 'true');
                  
                  // Forzar actualización disparando evento personalizado
                  window.dispatchEvent(new CustomEvent('openChat', {
                    detail: { conversationId: conversation.id }
                  }));
                };

                // Auto-cerrar después de 5 segundos
                setTimeout(() => notification.close(), 5000);
              } catch (err) {
                console.debug('Browser notification error:', err);
              }
            } else if (Notification.permission === 'default') {
              // Solicitar permiso automáticamente si aún no se ha preguntado
              Notification.requestPermission();
            }
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
  }, [conversations, isDrawerOpen, currentUser?.uid, addNotification, settings]);
};
