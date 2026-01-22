import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gestionar preferencias de notificaciones por usuario
 */
export const useNotificationPreferences = () => {
  const { user, userProfile } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estructura de preferencias por defecto
  const defaultPreferences = {
    calendar: {
      enabled: userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN', // Solo ADMIN por defecto
      events: {
        parafiscales: true,
        coljuegos: true,
        uiaf: false,
        contratos: true,
        festivos: false,
        custom: false, // Eventos personales
      },
      daysBeforeArray: [2, 0], // 2 días antes + día del evento
      notificationTime: '08:00', // 8:00 AM
    },
    attendance: {
      enabled: true,
      exitReminder: true, // 6 PM si no registró salida
      breakReminder: true, // 4 horas después de entrada
      lunchReminder: true, // 12 PM si no registró almuerzo
    },
    alerts: {
      enabled: true,
      systemAlerts: true, // Alertas del sistema
      adminMessages: true, // Mensajes de administradores
      urgentOnly: false, // Solo notificaciones urgentes
    },
  };

  // Cargar preferencias desde Firestore
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const prefDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'notificationPreferences'));
        
        if (prefDoc.exists()) {
          setPreferences(prefDoc.data());
        } else {
          // Si no existen, crear con valores por defecto
          await setDoc(doc(db, 'users', user.uid, 'settings', 'notificationPreferences'), defaultPreferences);
          setPreferences(defaultPreferences);
        }
      } catch (error) {
        console.error('Error cargando preferencias de notificaciones:', error);
        setPreferences(defaultPreferences);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid, userProfile?.role]);

  // Guardar preferencias en Firestore
  const updatePreferences = async (newPreferences) => {
    if (!user?.uid) return;

    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'notificationPreferences'), newPreferences);
      setPreferences(newPreferences);
      return { success: true };
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      return { success: false, error };
    }
  };

  // Actualizar una sección específica
  const updateSection = async (section, values) => {
    if (!preferences) return;

    const updated = {
      ...preferences,
      [section]: {
        ...preferences[section],
        ...values,
      },
    };

    return await updatePreferences(updated);
  };

  // Verificar si un tipo de notificación está habilitado para este usuario
  const isNotificationEnabled = (category, type) => {
    if (!preferences) return false;

    if (category === 'calendar') {
      return preferences.calendar.enabled && preferences.calendar.events[type];
    }

    if (category === 'attendance') {
      return preferences.attendance.enabled && preferences.attendance[type];
    }

    if (category === 'alerts') {
      return preferences.alerts.enabled && preferences.alerts[type];
    }

    return false;
  };

  return {
    preferences,
    loading,
    updatePreferences,
    updateSection,
    isNotificationEnabled,
    defaultPreferences,
  };
};
