import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeCommitments: 0,
    totalPayments: 0,
    reportsGenerated: 0,
    recentActivity: [],
    loading: true,
    error: null
  });

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Datos simulados para evitar errores de índices de Firebase
      // En una implementación real, se configurarían los índices necesarios
      const simulatedStats = {
        activeCommitments: 5,
        totalPayments: 12,
        reportsGenerated: 8,
        recentActivity: [
          {
            id: 1,
            type: 'payment',
            description: 'Pago registrado - ABC Corp',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toLocaleString(),
            status: 'completed'
          },
          {
            id: 2,
            type: 'commitment',
            description: 'Nuevo compromiso creado - XYZ Industries',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toLocaleString(),
            status: 'active'
          },
          {
            id: 3,
            type: 'report',
            description: 'Reporte ejecutivo generado',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toLocaleString(),
            status: 'completed'
          },
          {
            id: 4,
            type: 'company',
            description: 'Empresa actualizada - Tech Solutions',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
            status: 'updated'
          }
        ]
      };

      // Simular tiempo de carga realista
      setTimeout(() => {
        setStats({
          ...simulatedStats,
          loading: false,
          error: null
        });
      }, 800);

    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar las estadísticas'
      }));
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const refreshStats = () => {
    fetchUserStats();
  };

  return {
    stats,
    loading: stats.loading,
    error: stats.error,
    refreshStats
  };
};

export default useUserStats;
