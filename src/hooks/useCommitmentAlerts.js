import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useSettings } from '../context/SettingsContext';
import { differenceInDays, isBefore, isAfter } from 'date-fns';

/**
 * Hook personalizado para generar alertas automáticas de compromisos
 * basadas en fechas de vencimiento y configuraciones de usuario
 */
const useCommitmentAlerts = (commitments) => {
  const { addAlert, alerts, deleteAlert } = useNotifications();
  const { settings } = useSettings();

  useEffect(() => {
    if (!commitments || commitments.length === 0) return;

    // ✅ Verificar si las notificaciones están habilitadas
    if (!settings.notifications?.enabled) return;

    const today = new Date();
    const reminderDays = settings.notifications?.reminderDays || 3;
    const futureDaysFromNow = new Date();
    futureDaysFromNow.setDate(today.getDate() + reminderDays);

    // Limpiar solo alertas de compromisos existentes (que tengan id con prefijo overdue- o due-soon-)
    const currentAlerts = alerts || [];
    const commitmentAlertIds = currentAlerts
      .filter(alert => alert.id && (alert.id.startsWith('overdue-') || alert.id.startsWith('due-soon-')))
      .map(alert => alert.id);
    
    // Eliminar alertas de compromisos obsoletas
    commitmentAlertIds.forEach(alertId => {
      deleteAlert(alertId);
    });

    // Filtrar compromisos no pagados
    const unpaidCommitments = commitments.filter(commitment => !commitment.paid);

    // ✅ Compromisos vencidos (solo si está habilitado)
    if (settings.notifications?.pagosVencidos) {
      const overdueCommitments = unpaidCommitments.filter(commitment => {
        const dueDate = commitment.dueDate;
        return isBefore(dueDate, today);
      });

      // Generar alertas para compromisos vencidos
      overdueCommitments.forEach(commitment => {
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
      });
    }

    // ✅ Compromisos próximos a vencer (solo si está habilitado)
    if (settings.notifications?.proximosPagos) {
      const dueSoonCommitments = unpaidCommitments.filter(commitment => {
        const dueDate = commitment.dueDate;
        return isAfter(dueDate, today) && isBefore(dueDate, futureDaysFromNow);
      });

      // Generar alertas para compromisos próximos a vencer
      dueSoonCommitments.forEach(commitment => {
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
      });
    }
  }, [commitments, addAlert, alerts, deleteAlert, settings.notifications]);

  // Calcular contadores para retorno
  const unpaidCommitments = (commitments || []).filter(commitment => !commitment.paid);
  const today = new Date();
  const reminderDays = settings.notifications?.reminderDays || 3;
  const futureDaysFromNow = new Date();
  futureDaysFromNow.setDate(today.getDate() + reminderDays);

  const overdueCount = settings.notifications?.pagosVencidos ? 
    unpaidCommitments.filter(c => isBefore(c.dueDate, today)).length : 0;
  const dueSoonCount = settings.notifications?.proximosPagos ? 
    unpaidCommitments.filter(c => isAfter(c.dueDate, today) && isBefore(c.dueDate, futureDaysFromNow)).length : 0;

  return {
    overdueCount,
    dueSoonCount
  };
};

export default useCommitmentAlerts;
