import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useEmailNotifications } from './useEmailNotifications';
import { useTelegramNotifications } from './useTelegramNotifications';
import { useColombianHolidays } from './useColombianHolidays';
import { differenceInDays, format, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Hook para gestionar notificaciones automáticas de eventos críticos:
 * - Coljuegos (décimo día hábil del mes)
 * - UIAF (día 10 de cada mes)
 * - Parafiscales (tercer día hábil del mes)
 * 
 * Notifica: 3 días antes, 1 día antes, y el día del evento
 */
export const useAutomaticEventNotifications = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { sendCustomNotification: sendEmail } = useEmailNotifications();
  const { sendCustomNotification: sendTelegram } = useTelegramNotifications();
  const currentYear = new Date().getFullYear();
  const holidays = useColombianHolidays(currentYear);
  
  const [notificationsSent, setNotificationsSent] = useState(new Set());

  /**
   * Función para verificar si un día es hábil (no fin de semana ni festivo)
   */
  const esHabil = (fecha) => {
    const dayOfWeek = getDay(fecha);
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
    
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);
    const fechaISO = fechaNormalizada.toISOString().split('T')[0];
    const isHoliday = holidays.some(holiday => holiday.date === fechaISO);
    
    return !isWeekendDay && !isHoliday;
  };

  /**
   * Función para sumar días hábiles desde una fecha base
   */
  const sumarDiasHabiles = (fechaBase, diasAsumar) => {
    let fecha = addDays(new Date(fechaBase), 1);
    let contador = 0;
    
    while (contador < diasAsumar) {
      if (esHabil(fecha)) {
        contador++;
      }
      if (contador < diasAsumar) {
        fecha = addDays(fecha, 1);
      }
    }
    
    return fecha;
  };

  /**
   * Calcula el décimo día hábil del mes
   */
  const calculateTenthBusinessDay = (year, month) => {
    const fechaBase = new Date(year, month, 0); // Último día del mes anterior
    return sumarDiasHabiles(fechaBase, 10);
  };

  /**
   * Calcula el tercer día hábil del mes
   */
  const calculateThirdBusinessDay = (year, month) => {
    const fechaBase = new Date(year, month, 0); // Último día del mes anterior
    return sumarDiasHabiles(fechaBase, 3);
  };

  /**
   * Envía notificación por el canal configurado
   */
  const sendNotification = async (eventData) => {
    const notificationSettings = settings?.notificationSettings;
    
    if (!notificationSettings) return;
    
    const { emailEnabled, telegramEnabled, telegramChatId } = notificationSettings;
    
    // Enviar por Email si está habilitado
    if (emailEnabled && user?.email) {
      try {
        await sendEmail(
          user.email,
          user.displayName || user.name || 'Usuario',
          `<h2>🔔 ${eventData.title}</h2>
          <p><strong>📅 Fecha del evento:</strong> ${eventData.eventDate}</p>
          <p><strong>⏰ Recordatorio:</strong> ${eventData.reminderLabel}</p>
          <p><strong>📝 Descripción:</strong> ${eventData.description}</p>
          <p><strong>⚠️ Prioridad:</strong> ${eventData.priority}</p>
          <hr>
          <p style="color: #666; font-size: 0.9em;">Este es un recordatorio automático de evento crítico del sistema.</p>`
        );
        console.log(`📧 Email enviado: ${eventData.title} - ${eventData.reminderLabel}`);
      } catch (error) {
        console.error('❌ Error enviando email:', error);
      }
    }
    
    // Enviar por Telegram si está habilitado
    if (telegramEnabled && telegramChatId) {
      try {
        await sendTelegram(
          telegramChatId,
          user.displayName || user.name || 'Usuario',
          `🔔 <b>${eventData.title}</b>\n\n` +
          `📅 <b>Fecha:</b> ${eventData.eventDate}\n` +
          `⏰ <b>Recordatorio:</b> ${eventData.reminderLabel}\n` +
          `📝 <b>Descripción:</b> ${eventData.description}\n` +
          `⚠️ <b>Prioridad:</b> ${eventData.priority}\n\n` +
          `<i>Recordatorio automático de evento crítico</i>`
        );
        console.log(`📱 Telegram enviado: ${eventData.title} - ${eventData.reminderLabel}`);
      } catch (error) {
        console.error('❌ Error enviando Telegram:', error);
      }
    }
  };

  /**
   * Procesa notificaciones para un evento automático
   */
  const processEventNotifications = async (eventDate, eventConfig) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const daysUntilEvent = differenceInDays(eventDate, today);
    const notificationPeriods = [3, 1, 0]; // 3 días antes, 1 día antes, día del evento
    
    for (const daysBefore of notificationPeriods) {
      if (daysUntilEvent === daysBefore) {
        const notificationKey = `${eventConfig.type}-${format(eventDate, 'yyyy-MM-dd')}-${daysBefore}`;
        
        // Evitar duplicados
        if (notificationsSent.has(notificationKey)) continue;
        
        const formattedDate = format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: es });
        
        let reminderLabel;
        if (daysBefore === 0) {
          reminderLabel = '¡HOY es el evento!';
        } else if (daysBefore === 1) {
          reminderLabel = 'Mañana';
        } else {
          reminderLabel = `En ${daysBefore} días`;
        }
        
        const eventData = {
          title: eventConfig.title,
          eventDate: formattedDate,
          reminderLabel: reminderLabel,
          description: eventConfig.description,
          priority: daysBefore === 0 ? 'ALTA' : daysBefore === 1 ? 'MEDIA' : 'NORMAL'
        };
        
        await sendNotification(eventData);
        setNotificationsSent(prev => new Set([...prev, notificationKey]));
      }
    }
  };

  // Ejecutar verificación diaria de eventos automáticos
  useEffect(() => {
    if (!user || !settings?.notificationSettings) return;
    
    const { emailEnabled, telegramEnabled, coljuegosEnabled, uiafEnabled, parafiscalesEnabled } = settings.notificationSettings;
    
    // Solo procesar si hay al menos un canal habilitado
    if (!emailEnabled && !telegramEnabled) return;

    const checkAutomaticEvents = async () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // 1. Coljuegos - Décimo día hábil (solo si está habilitado)
      if (coljuegosEnabled !== false) {
        const coljuegosDate = calculateTenthBusinessDay(currentYear, currentMonth);
        await processEventNotifications(coljuegosDate, {
          type: 'coljuegos',
          title: 'Pago Coljuegos - Décimo Día Hábil',
          description: 'Día de pago obligatorio para Coljuegos (décimo día hábil del mes)'
        });
      }
      
      // 2. UIAF - Día 10 del mes (solo si está habilitado)
      if (uiafEnabled !== false) {
        const uiafDate = new Date(currentYear, currentMonth, 10);
        await processEventNotifications(uiafDate, {
          type: 'uiaf',
          title: 'Reporte UIAF',
          description: 'Reporte mensual a la Unidad de Información y Análisis Financiero (UIAF)'
        });
      }
      
      // 3. Parafiscales - Tercer día hábil (solo si está habilitado)
      if (parafiscalesEnabled !== false) {
        const parafiscalesDate = calculateThirdBusinessDay(currentYear, currentMonth);
        await processEventNotifications(parafiscalesDate, {
          type: 'parafiscales',
          title: 'Pago de Parafiscales',
          description: 'Pago de aportes parafiscales (tercer día hábil del mes)'
        });
      }
    };

    checkAutomaticEvents();

    // Verificar cada hora (en caso de que la app esté abierta todo el día)
    const interval = setInterval(checkAutomaticEvents, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, settings, holidays]);

  return {
    notificationsSent
  };
};

export default useAutomaticEventNotifications;
