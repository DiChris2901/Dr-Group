import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNotifications } from '../context/NotificationsContext';
import { useEmailNotifications } from './useEmailNotifications';
import { useAuth } from '../context/AuthContext';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Hook para gestionar alertas de vencimiento de contratos de empresas
 * Genera alertas en los siguientes períodos:
 * - 365 días (1 año antes)
 * - 180 días (6 meses antes)
 * - 90 días (3 meses antes)
 * - 30 días (1 mes antes)
 * - 0 días (día del vencimiento)
 */
export const useContractExpirationAlerts = () => {
  const { addAlert } = useNotifications();
  const { user } = useAuth();
  const { 
    sendContractExpirationNotification,
    sendContractDueTodayNotification,
    sendContractExpiredNotification 
  } = useEmailNotifications();
  
  const [companies, setCompanies] = useState([]);
  const [processedAlerts, setProcessedAlerts] = useState(new Set());
  const [emailsSentToday, setEmailsSentToday] = useState(new Set());

  // Cargar empresas desde Firestore
  useEffect(() => {
    const companiesQuery = query(collection(db, 'companies'));
    
    const unsubscribe = onSnapshot(companiesQuery, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);
    });

    return () => unsubscribe();
  }, []);

  // Procesar alertas cuando cambien las empresas
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processAlerts = async () => {
      for (const company of companies) {
        if (!company.contractExpirationDate) continue;

      const expirationDate = new Date(company.contractExpirationDate);
      expirationDate.setHours(0, 0, 0, 0);
      
      const daysUntilExpiration = differenceInDays(expirationDate, today);

      // Periodos de alerta: 365, 180, 90, 30, 0 días
      const alertPeriods = [
        { days: 365, label: '1 año', severity: 'info' },
        { days: 180, label: '6 meses', severity: 'info' },
        { days: 90, label: '3 meses', severity: 'warning' },
        { days: 30, label: '1 mes', severity: 'warning' },
        { days: 0, label: 'hoy', severity: 'error' }
      ];

      alertPeriods.forEach(async (period) => {
        if (daysUntilExpiration === period.days) {
          const alertId = `contract-${company.id}-${period.days}`;
          const emailKey = `${company.id}-${period.days}-${today.toDateString()}`;
          
          // Evitar duplicados de alertas
          if (processedAlerts.has(alertId)) return;

          const formattedDate = format(expirationDate, "d 'de' MMMM 'de' yyyy", { locale: es });
          
          let message = '';
          if (period.days === 0) {
            message = `El contrato de ${company.name} vence HOY`;
          } else {
            message = `El contrato de ${company.name} vence en ${period.label} (${formattedDate})`;
          }

          // Agregar alerta visual
          addAlert({
            id: alertId,
            type: period.severity,
            title: 'Vencimiento de Contrato',
            message: message,
            category: 'contract',
            companyId: company.id,
            companyName: company.name,
            expirationDate: company.contractExpirationDate,
            daysUntilExpiration: daysUntilExpiration
          });

          // Enviar email si no se ha enviado hoy y el usuario está autenticado
          if (user?.email && !emailsSentToday.has(emailKey)) {
            try {
              if (period.days === 0) {
                // Contrato vence HOY
                await sendContractDueTodayNotification(user.email, {
                  companyId: company.id,
                  companyName: company.name,
                  expirationDate: formattedDate,
                  userName: user.displayName || user.email
                });
              } else {
                // Contrato vence en X días
                await sendContractExpirationNotification(user.email, {
                  companyId: company.id,
                  companyName: company.name,
                  expirationDate: formattedDate,
                  daysUntilExpiration: period.days,
                  period: period.label,
                  userName: user.displayName || user.email
                });
              }
              
              console.log(`📧 Email enviado: Contrato de ${company.name} vence en ${period.label}`);
              setEmailsSentToday(prev => new Set([...prev, emailKey]));
            } catch (error) {
              console.error('❌ Error enviando email de contrato:', error);
            }
          }

          // Marcar alerta como procesada
          setProcessedAlerts(prev => new Set([...prev, alertId]));
        }
      });

      // Alertas para contratos ya vencidos (días negativos)
      if (daysUntilExpiration < 0 && daysUntilExpiration >= -30) {
        const daysExpired = Math.abs(daysUntilExpiration);
        const alertId = `contract-expired-${company.id}-${daysExpired}`;
        const emailKey = `expired-${company.id}-${today.toDateString()}`;
        
        if (!processedAlerts.has(alertId)) {
          const formattedDate = format(expirationDate, "d 'de' MMMM 'de' yyyy", { locale: es });
          
          // Agregar alerta visual
          addAlert({
            id: alertId,
            type: 'error',
            title: 'Contrato Vencido',
            message: `El contrato de ${company.name} venció hace ${daysExpired} ${daysExpired === 1 ? 'día' : 'días'} (${formattedDate})`,
            category: 'contract',
            companyId: company.id,
            companyName: company.name,
            expirationDate: company.contractExpirationDate,
            daysUntilExpiration: daysUntilExpiration
          });

          // Enviar email DIARIO de contrato vencido (uno por día)
          if (user?.email && !emailsSentToday.has(emailKey)) {
            try {
              await sendContractExpiredNotification(user.email, {
                companyId: company.id,
                companyName: company.name,
                expirationDate: formattedDate,
                daysExpired: daysExpired,
                userName: user.displayName || user.email
              });
              
              console.log(`📧 Email enviado: Contrato vencido de ${company.name} (${daysExpired} días)`);
              setEmailsSentToday(prev => new Set([...prev, emailKey]));
            } catch (error) {
              console.error('❌ Error enviando email de contrato vencido:', error);
            }
          }

          setProcessedAlerts(prev => new Set([...prev, alertId]));
        }
      }
      } // Fin del for loop
    }; // Fin de processAlerts
    
    processAlerts(); // Ejecutar función async
  }, [companies, addAlert, processedAlerts, user, sendContractExpirationNotification, sendContractDueTodayNotification, sendContractExpiredNotification, emailsSentToday]);

  // Función para obtener contratos próximos a vencer (para el calendario)
  const getUpcomingExpirations = (daysAhead = 90) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return companies
      .filter(company => company.contractExpirationDate)
      .map(company => {
        const expirationDate = new Date(company.contractExpirationDate);
        expirationDate.setHours(0, 0, 0, 0);
        const daysUntilExpiration = differenceInDays(expirationDate, today);

        return {
          ...company,
          daysUntilExpiration,
          expirationDate
        };
      })
      .filter(company => 
        company.daysUntilExpiration >= -30 && 
        company.daysUntilExpiration <= daysAhead
      )
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  };

  return {
    companies,
    getUpcomingExpirations
  };
};

export default useContractExpirationAlerts;
