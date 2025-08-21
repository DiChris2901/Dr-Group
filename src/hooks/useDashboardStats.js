import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useDashboardStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalCommitments: 0,
    activeCommitments: 0,
    pendingCommitments: 0,
    overDueCommitments: 0,
    completedCommitments: 0,
    totalCompanies: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!currentUser) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'commitments'),
      (snapshot) => {
        const commitments = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          commitments.push({
            id: doc.id,
            ...data,
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
            amount: parseFloat(data.amount) || 0
          });
        });

        // Calcular estadísticas
        const now = new Date();
        let pendingCommitments = 0;
        let overDueCommitments = 0;
        let completedCommitments = 0;
        let activeCommitments = 0; // Compromisos activos (no pagados)
        
        // Objeto para manejar montos
        const amounts = {
          total: 0,
          paid: 0,
          pending: 0
        };
        
        // Calcular empresas únicas
        const uniqueCompanies = new Set();

        commitments.forEach(commitment => {
          const amount = commitment.amount || 0;
          amounts.total += amount;
          
          // Agregar empresa al set de empresas únicas
          if (commitment.company) {
            uniqueCompanies.add(commitment.company);
          }

          // Debug: log de cada compromiso con TODOS los campos
          console.log('📊 Procesando compromiso:', {
            id: commitment.id,
            description: commitment.description,
            status: commitment.status,
            paid: commitment.paid,
            paymentStatus: commitment.paymentStatus,
            isPaid: commitment.isPaid,
            completed: commitment.completed,
            amount: amount,
            dueDate: commitment.dueDate,
            isOverdue: commitment.dueDate < now,
            company: commitment.company,
            allFields: Object.keys(commitment)
          });

          // Verificar si está vencido ANTES de revisar el status
          const isOverdue = commitment.dueDate && commitment.dueDate < now;

          // Verificar múltiples formas de identificar un compromiso PAGADO
          const isPaid = commitment.status === 'completed' || 
                        commitment.status === 'paid' || 
                        commitment.status === 'Pagado' ||
                        commitment.status === 'pagado' ||
                        commitment.status === 'PAGADO' ||
                        commitment.paid === true ||
                        commitment.isPaid === true ||
                        commitment.paymentStatus === 'paid' ||
                        commitment.paymentStatus === 'Pagado' ||
                        commitment.paymentStatus === 'pagado' ||
                        commitment.completed === true;

          console.log('💰 Estado de pago determinado:', {
            id: commitment.id,
            isPaid: isPaid,
            reasonForPaidStatus: isPaid ? 'Marcado como pagado' : 'Sin indicadores de pago'
          });

          if (isPaid) {
            completedCommitments++;
            amounts.paid += amount;
            console.log('✅ Compromiso marcado como PAGADO');
          } else {
            // Si no está pagado, es activo y pendiente
            activeCommitments++;
            pendingCommitments++;
            amounts.pending += amount;
            console.log('⏳ Compromiso marcado como PENDIENTE');
            
            // Verificar si además está vencido
            if (isOverdue) {
              overDueCommitments++;
              console.log('🚨 Compromiso VENCIDO');
            }
          }
        });
        
        const totalCompanies = uniqueCompanies.size;
        const totalCommitments = commitments.length;

        console.log('📈 Estadísticas finales:', {
          totalCommitments,
          activeCommitments,
          pendingCommitments,
          overDueCommitments,
          completedCommitments,
          totalCompanies,
          totalAmount: amounts.total,
          paidAmount: amounts.paid,
          pendingAmount: amounts.pending
        });

        console.log('🎯 RESUMEN EJECUTIVO:', {
          'Total de compromisos': totalCommitments,
          'Compromisos pagados': completedCommitments,
          'Compromisos activos (sin pagar)': activeCommitments,
          'Compromisos vencidos': overDueCommitments,
          'Monto total pendiente': `$${amounts.pending.toLocaleString()}`,
          'Monto total pagado': `$${amounts.paid.toLocaleString()}`
        });

        setStats({
          totalCommitments,
          activeCommitments,
          pendingCommitments,
          overDueCommitments,
          completedCommitments,
          totalCompanies,
          totalAmount: amounts.total,
          paidAmount: amounts.paid,
          pendingAmount: amounts.pending,
          loading: false,
          error: null
        });
      },
      (error) => {
        console.error('Error loading dashboard stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    );

    return unsubscribe;
  }, [currentUser]);

  return {
    totalCommitments: stats.totalCommitments,
    pendingCommitments: stats.pendingCommitments,
    overDueCommitments: stats.overDueCommitments,
    completedCommitments: stats.completedCommitments,
    totalCompanies: stats.totalCompanies,
    totalAmount: stats.totalAmount,
    paidAmount: stats.paidAmount,
    pendingAmount: stats.pendingAmount,
    loading: stats.loading,
    error: stats.error
  };
};

export default useDashboardStats;
