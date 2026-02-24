import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * 📊 Hook optimizado: Estadísticas pre-calculadas de liquidaciones
 * Lee 1 solo documento: system_stats/liquidaciones
 * Actualizado automáticamente por Cloud Functions triggers
 */
export const useLiquidacionesStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalCount: 0,
    pendientes: 0,
    facturadas: 0,
    pagadas: 0,
    vencidas: 0,
    montoTotal: 0,
    montoPendiente: 0,
    montoCobrado: 0,
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
      doc(db, 'system_stats', 'liquidaciones'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setStats({
            totalCount: data.totalCount || 0,
            pendientes: data.pendientes || 0,
            facturadas: data.facturadas || 0,
            pagadas: data.pagadas || 0,
            vencidas: data.vencidas || 0,
            montoTotal: data.montoTotal || 0,
            montoPendiente: data.montoPendiente || 0,
            montoCobrado: data.montoCobrado || 0,
            loading: false,
            error: null,
            lastUpdated: data.lastUpdated?.toDate?.() || null
          });
        } else {
          setStats(prev => ({
            ...prev,
            loading: false,
            error: 'Stats de liquidaciones no disponibles'
          }));
        }
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Error cargando stats liquidaciones:', error);
        }
        setStats(prev => ({ ...prev, loading: false, error: error.message }));
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return stats;
};

export default useLiquidacionesStats;
