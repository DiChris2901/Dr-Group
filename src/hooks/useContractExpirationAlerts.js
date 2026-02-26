import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNotifications } from '../context/NotificationsContext';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Hook para gestionar alertas de vencimiento de contratos de empresas
 * Genera alertas visuales in-app en los siguientes períodos:
 * - 180 días (6 meses antes)
 * - 90 días (3 meses antes)
 * - 60 días (2 meses antes)
 * - 30 días (1 mes antes)
 * - 15 días
 * - 7 días (1 semana antes)
 * - 3 días
 * - 0 días (día del vencimiento)
 * - Contratos vencidos (hasta 30 días después)
 */
export const useContractExpirationAlerts = () => {
  const { addAlert } = useNotifications();

  const [companies, setCompanies] = useState([]);
  const [processedAlerts, setProcessedAlerts] = useState(new Set());

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

    for (const company of companies) {
      if (!company.contractExpirationDate) continue;

      const expirationDate = new Date(company.contractExpirationDate);
      expirationDate.setHours(0, 0, 0, 0);

      const daysUntilExpiration = differenceInDays(expirationDate, today);

      // Periodos de alerta
      const alertPeriods = [
        { days: 180, label: '6 meses', severity: 'info' },
        { days: 90, label: '3 meses', severity: 'info' },
        { days: 60, label: '2 meses', severity: 'warning' },
        { days: 30, label: '1 mes', severity: 'warning' },
        { days: 15, label: '15 días', severity: 'warning' },
        { days: 7, label: '1 semana', severity: 'warning' },
        { days: 3, label: '3 días', severity: 'error' },
        { days: 0, label: 'hoy', severity: 'error' }
      ];

      alertPeriods.forEach((period) => {
        if (daysUntilExpiration === period.days) {
          const alertId = `contract-${company.id}-${period.days}`;

          if (processedAlerts.has(alertId)) return;

          const formattedDate = format(expirationDate, "d 'de' MMMM 'de' yyyy", { locale: es });

          let message = '';
          if (period.days === 0) {
            message = `El contrato de ${company.name} vence HOY`;
          } else {
            message = `El contrato de ${company.name} vence en ${period.label} (${formattedDate})`;
          }

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

          setProcessedAlerts(prev => new Set([...prev, alertId]));
        }
      });

      // Alertas para contratos ya vencidos (días negativos)
      if (daysUntilExpiration < 0 && daysUntilExpiration >= -30) {
        const daysExpired = Math.abs(daysUntilExpiration);
        const alertId = `contract-expired-${company.id}-${daysExpired}`;

        if (!processedAlerts.has(alertId)) {
          const formattedDate = format(expirationDate, "d 'de' MMMM 'de' yyyy", { locale: es });

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

          setProcessedAlerts(prev => new Set([...prev, alertId]));
        }
      }
    }
  }, [companies, addAlert, processedAlerts]);

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
