import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * 📊 Hook optimizado: Estadísticas pre-calculadas de asistencias (hoy)
 * Lee 1 solo documento: system_stats/asistencias
 * Actualizado automáticamente por Cloud Functions triggers
 */
export const useAsistenciasStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    fecha: null,
    totalEmployees: 0,
    presentes: 0,
    trabajando: 0,
    enBreak: 0,
    enAlmuerzo: 0,
    finalizados: 0,
    ausentes: 0,
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
      doc(db, 'system_stats', 'asistencias'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setStats({
            fecha: data.fecha || null,
            totalEmployees: data.totalEmployees || 0,
            presentes: data.presentes || 0,
            trabajando: data.trabajando || 0,
            enBreak: data.enBreak || 0,
            enAlmuerzo: data.enAlmuerzo || 0,
            finalizados: data.finalizados || 0,
            ausentes: data.ausentes || 0,
            loading: false,
            error: null,
            lastUpdated: data.lastUpdated?.toDate?.() || null
          });
        } else {
          setStats(prev => ({
            ...prev,
            loading: false,
            error: 'Stats de asistencias no disponibles'
          }));
        }
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Error cargando stats asistencias:', error);
        }
        setStats(prev => ({ ...prev, loading: false, error: error.message }));
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return stats;
};

export default useAsistenciasStats;
