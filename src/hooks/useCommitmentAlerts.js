import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { differenceInDays, isBefore, isAfter } from 'date-fns';

/**
 * Hook personalizado para generar alertas automáticas de compromisos
 * basadas en fechas de vencimiento
 */
const useCommitmentAlerts = (commitments) => {
  const { addAlert, alerts, deleteAlert } = useNotifications();

  useEffect(() => {
    if (!commitments || commitments.length === 0) return;

    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

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

    // Compromisos vencidos
    const overdueCommitments = unpaidCommitments.filter(commitment => {
      const dueDate = commitment.dueDate;
      return isBefore(dueDate, today);
    });

    // Compromisos próximos a vencer (en los próximos 3 días)
    const dueSoonCommitments = unpaidCommitments.filter(commitment => {
      const dueDate = commitment.dueDate;
      return isAfter(dueDate, today) && isBefore(dueDate, threeDaysFromNow);
    });

    // Generar alertas para compromisos vencidos
    overdueCommitments.forEach(commitment => {
      const daysPastDue = Math.abs(differenceInDays(commitment.dueDate, today));
      
      addAlert({
        id: `overdue-${commitment.id}`,
        type: 'error',
        severity: 'error',
        title: '🚨 Compromiso Vencido',
        message: `${commitment.description} - Vencido hace ${daysPastDue} día${daysPastDue !== 1 ? 's' : ''}`,
        company: commitment.companyName,
        amount: commitment.amount,
        dueDate: commitment.dueDate,
        autoHide: false, // Las alertas de vencidos no se ocultan automáticamente
        priority: 'high'
      });
    });

    // Generar alertas para compromisos próximos a vencer
    dueSoonCommitments.forEach(commitment => {
      const daysUntilDue = differenceInDays(commitment.dueDate, today);
      
      addAlert({
        id: `due-soon-${commitment.id}`,
        type: 'warning',
        severity: 'warning',
        title: '⚠️ Compromiso Próximo a Vencer',
        message: `${commitment.description} - Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`,
        company: commitment.companyName,
        amount: commitment.amount,
        dueDate: commitment.dueDate,
        autoHide: false,
        priority: 'medium'
      });
    });

    // console.log(`Alertas generadas: ${overdueCommitments.length} vencidos, ${dueSoonCommitments.length} próximos a vencer`);

  }, [commitments, addAlert, alerts, deleteAlert]);

  return {
    overdueCount: commitments ? commitments.filter(c => !c.paid && isBefore(c.dueDate, new Date())).length : 0,
    dueSoonCount: commitments ? commitments.filter(c => {
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);
      return !c.paid && isAfter(c.dueDate, today) && isBefore(c.dueDate, threeDaysFromNow);
    }).length : 0
  };
};

export default useCommitmentAlerts;
