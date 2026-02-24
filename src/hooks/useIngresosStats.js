import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * 📊 Hook optimizado: Estadísticas pre-calculadas de ingresos
 * Lee 1 solo documento: system_stats/ingresos
 * Actualizado automáticamente por Cloud Functions triggers
 */
export const useIngresosStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    currentMonthCount: 0,
    currentMonthAmount: 0,
    byPaymentMethod: {},
    loading: true,
    error: null,
    lastUpdated: null
  });

  useEffect(() => {
    if (!currentUser) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'system_stats', 'ingresos'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setStats({
            totalCount: data.totalCount || 0,
            totalAmount: data.totalAmount || 0,
            currentMonthCount: data.currentMonthCount || 0,
            currentMonthAmount: data.currentMonthAmount || 0,
            byPaymentMethod: data.byPaymentMethod || {},
            loading: false,
            error: null,
            lastUpdated: data.lastUpdated?.toDate?.() || null
          });
        } else {
          setStats(prev => ({
            ...prev,
            loading: false,
            error: 'Stats de ingresos no disponibles'
          }));
        }
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Error cargando stats ingresos:', error);
        }
        setStats(prev => ({ ...prev, loading: false, error: error.message }));
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return stats;
};

export default useIngresosStats;
