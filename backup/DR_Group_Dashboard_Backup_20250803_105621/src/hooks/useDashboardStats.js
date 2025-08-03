import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useDashboardStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalCommitments: 0,
    pendingCommitments: 0,
    overDueCommitments: 0,
    completedCommitments: 0,
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
        let totalCommitments = commitments.length;
        let pendingCommitments = 0;
        let overDueCommitments = 0;
        let completedCommitments = 0;
        let totalAmount = 0;
        let paidAmount = 0;
        let pendingAmount = 0;

        commitments.forEach(commitment => {
          const amount = commitment.amount || 0;
          totalAmount += amount;

          if (commitment.status === 'completed' || commitment.status === 'paid') {
            completedCommitments++;
            paidAmount += amount;
          } else if (commitment.status === 'pending') {
            pendingCommitments++;
            pendingAmount += amount;
            
            // Verificar si está vencido
            if (commitment.dueDate && commitment.dueDate < now) {
              overDueCommitments++;
            }
          } else if (commitment.status === 'overdue') {
            overDueCommitments++;
            pendingAmount += amount;
          }
        });

        setStats({
          totalCommitments,
          pendingCommitments,
          overDueCommitments,
          completedCommitments,
          totalAmount,
          paidAmount,
          pendingAmount,
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
    stats: {
      totalCommitments: stats.totalCommitments,
      pendingCommitments: stats.pendingCommitments,
      overDueCommitments: stats.overDueCommitments,
      completedCommitments: stats.completedCommitments,
      totalAmount: stats.totalAmount,
      paidAmount: stats.paidAmount,
      pendingAmount: stats.pendingAmount
    },
    loading: stats.loading,
    error: stats.error
  };
};

export default useDashboardStats;
