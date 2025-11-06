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

    if (!chatNotificationsEnabled) return;

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

          // 🎯 Mostrar notificación toast (si está habilitada)
          if (chatToastEnabled) {
            addNotification({
              title: `💬 ${senderName}`,
              message: `${lastMessage.text?.substring(0, 50)}${lastMessage.text?.length > 50 ? '...' : ''}`,
              type: 'info',
              source: 'chat', // Identificar que viene del chat
              conversationId: conversation.id
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
