import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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

      // Obtener compromisos del usuario
      const commitmentsQuery = query(
        collection(db, 'commitments'),
        where('createdBy', '==', user.uid)
      );
      const commitmentsSnapshot = await getDocs(commitmentsQuery);
      
      // Procesar compromisos y contar los activos
      let activeCommitments = 0;
      const allCommitments = [];
      
      commitmentsSnapshot.forEach(doc => {
        const data = doc.data();
        const commitment = { id: doc.id, ...data };
        allCommitments.push(commitment);
        
        // Contar como activos los que están pending o sin status definido
        if (data.status === 'pending' || !data.status) {
          activeCommitments++;
        }
      });

      console.log(`Compromisos totales: ${allCommitments.length}, Activos: ${activeCommitments}`);

      // Obtener pagos del usuario
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('createdBy', '==', user.uid)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const totalPayments = paymentsSnapshot.size;

      console.log(`Pagos totales: ${totalPayments}`);

      // Calcular reportes generados (estimado basado en actividad)
      const reportsGenerated = Math.floor((activeCommitments + totalPayments) / 3);

      // Obtener actividad reciente (compromisos y pagos recientes)
      const recentCommitmentsQuery = query(
        collection(db, 'commitments'),
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      
      const recentPaymentsQuery = query(
        collection(db, 'payments'),
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(2)
      );

      const [recentCommitmentsSnapshot, recentPaymentsSnapshot] = await Promise.all([
        getDocs(recentCommitmentsQuery),
        getDocs(recentPaymentsQuery)
      ]);

      // Combinar actividad reciente
      const recentActivity = [];

      recentCommitmentsSnapshot.forEach(doc => {
        const data = doc.data();
        recentActivity.push({
          id: doc.id,
          action: 'Creó compromiso financiero',
          detail: data.description || data.title || 'Nuevo compromiso',
          timestamp: data.createdAt?.toDate(),
          type: 'commitment'
        });
      });

      recentPaymentsSnapshot.forEach(doc => {
        const data = doc.data();
        recentActivity.push({
          id: doc.id,
          action: 'Procesó pago',
          detail: `$${data.amount?.toLocaleString('es-ES') || '0'} - ${data.description || 'Pago realizado'}`,
          timestamp: data.createdAt?.toDate(),
          type: 'payment'
        });
      });

      // Ordenar por fecha más reciente
      recentActivity.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp - a.timestamp;
      });

      setStats({
        activeCommitments,
        totalPayments,
        reportsGenerated,
        recentActivity: recentActivity.slice(0, 4),
        loading: false,
        error: null
      });

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

  return { ...stats, refetch: fetchUserStats };
};
