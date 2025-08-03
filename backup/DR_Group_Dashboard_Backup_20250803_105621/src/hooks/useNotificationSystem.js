import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';

export const useNotificationSystem = () => {
  const { addNotification, addAlert } = useNotifications();

  // Función para generar notificaciones basadas en datos reales de compromisos
  const generateCommitmentNotifications = (commitments = []) => {
    const now = new Date();
    
    commitments.forEach(commitment => {
      const daysUntilDue = Math.ceil((new Date(commitment.dueDate) - now) / (1000 * 60 * 60 * 24));
      
      // Compromisos vencidos
      if (commitment.status === 'overdue' || daysUntilDue < 0) {
        addAlert({
          title: 'Compromiso Vencido',
          message: `${commitment.company} - ${commitment.type}: $${commitment.amount?.toLocaleString() || 'N/A'}`,
          type: 'error',
          priority: 'Alta',
          category: 'payment'
        });
      }
      
      // Compromisos próximos a vencer (1-3 días)
      else if (daysUntilDue <= 3 && daysUntilDue > 0) {
        addNotification({
          title: 'Compromiso Próximo a Vencer',
          message: `${commitment.company} - Vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`,
          type: 'warning',
          category: 'payment'
        });
      }
      
      // Compromisos de alto monto (mayor a 200k)
      else if (commitment.amount > 200000) {
        addNotification({
          title: 'Compromiso de Alto Monto',
          message: `${commitment.company} - $${commitment.amount.toLocaleString()}`,
          type: 'info',
          category: 'payment'
        });
      }
    });
  };

  // Función para agregar notificación de sistema
  const addSystemNotification = (title, message, type = 'info', category = 'system') => {
    addNotification({
      title,
      message,
      type,
      category
    });
  };

  // Función para agregar alerta de sistema
  const addSystemAlert = (title, message, priority = 'Media', category = 'system') => {
    addAlert({
      title,
      message,
      priority,
      category
    });
  };

  // Función para notificar pago recibido
  const notifyPaymentReceived = (company, amount) => {
    addNotification({
      title: 'Pago Recibido',
      message: `${company} completó el pago de $${amount.toLocaleString()}`,
      type: 'success',
      category: 'payment'
    });
  };

  // Función para notificar nueva empresa
  const notifyNewCompany = (companyName) => {
    addNotification({
      title: 'Nueva Empresa Registrada',
      message: `${companyName} se ha agregado al sistema`,
      type: 'info',
      category: 'company'
    });
  };

  // Función para notificar modificación de compromiso
  const notifyCommitmentUpdated = (company, updateType) => {
    addNotification({
      title: 'Modificación de Compromiso',
      message: `Se actualizó ${updateType} para ${company}`,
      type: 'info',
      category: 'schedule'
    });
  };

  // Función para notificar nuevo comprobante
  const notifyNewDocument = (documentType, company, documentId) => {
    addNotification({
      title: 'Nuevo Comprobante Cargado',
      message: `${documentType} #${documentId} de ${company} ha sido procesado`,
      type: 'info',
      category: 'company'
    });
  };

  // Función para notificar reporte disponible
  const notifyReportAvailable = (reportType, period) => {
    addNotification({
      title: 'Reporte Disponible',
      message: `El ${reportType} de ${period} ya está listo para revisar`,
      type: 'success',
      category: 'report'
    });
  };

  // El hook ya no genera datos automáticamente al cargar
  useEffect(() => {
    // Solo inicializar el sistema, sin datos dummy
    console.log('Sistema de notificaciones inicializado');
  }, []);

  return {
    generateCommitmentNotifications,
    addSystemNotification,
    addSystemAlert,
    notifyPaymentReceived,
    notifyNewCompany,
    notifyCommitmentUpdated,
    notifyNewDocument,
    notifyReportAvailable
  };
};
