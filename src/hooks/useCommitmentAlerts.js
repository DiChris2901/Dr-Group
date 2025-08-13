import { useEffect, useMemo } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useSettings } from '../context/SettingsContext';
import { differenceInDays, isBefore, isAfter } from 'date-fns';

/**
 * Hook personalizado para generar alertas automáticas de compromisos
 * basadas en fechas de vencimiento y configuraciones de usuario
 * 🚀 OPTIMIZADO: Memoización para evitar re-cálculos innecesarios
 */
const useCommitmentAlerts = (commitments) => {
  const { addAlert, alerts, deleteAlert } = useNotifications();
  const { settings } = useSettings();

  // 🚀 OPTIMIZACIÓN: Memoizar cálculos pesados
  const { overdueCount, dueSoonCount, processableCommitments } = useMemo(() => {
    if (!commitments || commitments.length === 0) {
      return { overdueCount: 0, dueSoonCount: 0, processableCommitments: [] };
    }

    const today = new Date();
    const reminderDays = settings.notifications?.reminderDays || 3;
    const futureDaysFromNow = new Date();
    futureDaysFromNow.setDate(today.getDate() + reminderDays);

    // Filtrar compromisos no pagados UNA sola vez
    const unpaidCommitments = commitments.filter(commitment => !commitment.paid);
    
    const overdue = settings.notifications?.pagosVencidos ? 
      unpaidCommitments.filter(c => isBefore(c.dueDate, today)) : [];
    
    const dueSoon = settings.notifications?.proximosPagos ? 
      unpaidCommitments.filter(c => isAfter(c.dueDate, today) && isBefore(c.dueDate, futureDaysFromNow)) : [];

    return {
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
      processableCommitments: [...overdue, ...dueSoon]
    };
  }, [commitments, settings.notifications?.reminderDays, settings.notifications?.pagosVencidos, settings.notifications?.proximosPagos]);

  useEffect(() => {
    // 🚀 OPTIMIZACIÓN: Early return si no hay datos procesables
    if (processableCommitments.length === 0 || !settings.notifications?.enabled) return;

    const today = new Date();
    const reminderDays = settings.notifications?.reminderDays || 3;

    // Limpiar solo alertas de compromisos existentes
    const currentAlerts = alerts || [];
    const commitmentAlertIds = currentAlerts
      .filter(alert => alert.id && (alert.id.startsWith('overdue-') || alert.id.startsWith('due-soon-')))
      .map(alert => alert.id);
    
    commitmentAlertIds.forEach(alertId => {
      deleteAlert(alertId);
    });

    // 🚀 OPTIMIZACIÓN: Procesar solo compromisos ya filtrados
    processableCommitments.forEach(commitment => {
      const isOverdue = isBefore(commitment.dueDate, today);
      
      if (isOverdue && settings.notifications?.pagosVencidos) {
        const daysPastDue = Math.abs(differenceInDays(commitment.dueDate, today));
        const alertId = `overdue-${commitment.id}`;
        
        addAlert({
          id: alertId,
          type: 'error',
          title: 'Pago Vencido',
          message: `El compromiso "${commitment.concept || 'Sin concepto'}" venció hace ${daysPastDue} día${daysPastDue !== 1 ? 's' : ''}`,
          commitment: commitment,
          timestamp: new Date(),
          severity: 'error',
          persistent: true
        });
      } else if (!isOverdue && settings.notifications?.proximosPagos) {
        const daysUntilDue = differenceInDays(commitment.dueDate, today);
        const alertId = `due-soon-${commitment.id}`;
        
        addAlert({
          id: alertId,
          type: 'warning',
          title: 'Próximo a Vencer',
          message: `El compromiso "${commitment.concept || 'Sin concepto'}" vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`,
          commitment: commitment,
          timestamp: new Date(),
          severity: 'warning'
        });
      }
    });
  }, [processableCommitments, addAlert, alerts, deleteAlert, settings.notifications]);

  return {
    overdueCount,
    dueSoonCount
  };
};

export default useCommitmentAlerts;
