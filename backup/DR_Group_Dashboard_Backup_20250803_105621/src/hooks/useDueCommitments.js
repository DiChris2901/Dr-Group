import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

export const useDueCommitments = () => {
  const { currentUser } = useAuth();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'commitments'),
        orderBy('dueDate', 'asc')
      ),
      (snapshot) => {
        const now = new Date();
        const sevenDaysFromNow = addDays(now, 7);
        const commitmentsData = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
          
          // Solo incluir compromisos que están vencidos, próximos a vencer o pendientes
          const isDue = dueDate <= sevenDaysFromNow;
          const isPending = data.status === 'pending' || data.status === 'overdue';
          
          if (isDue && isPending) {
            const daysUntilDue = differenceInDays(dueDate, now);
            let status = 'upcoming';
            let priority = data.priority || 'medium';

            // Determinar estado basado en días restantes
            if (daysUntilDue < 0) {
              status = 'overdue';
              priority = 'critical';
            } else if (daysUntilDue <= 1) {
              status = 'due_soon';
              priority = priority === 'low' ? 'high' : priority;
            } else if (daysUntilDue <= 3) {
              status = 'due_soon';
            }

            commitmentsData.push({
              id: doc.id,
              title: data.title || data.description || 'Compromiso sin título',
              company: data.company || data.companyName || 'Sin empresa',
              amount: parseFloat(data.amount) || 0,
              dueDate: dueDate,
              priority: priority,
              status: status,
              description: data.description || data.notes || '',
              category: data.category || 'general',
              paymentMethod: data.paymentMethod || 'transfer',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
              userId: data.userId,
              daysUntilDue: daysUntilDue
            });
          }
        });

        // Ordenar por prioridad y fecha de vencimiento
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        commitmentsData.sort((a, b) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.dueDate - b.dueDate;
        });

        setCommitments(commitmentsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error loading due commitments:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const refreshCommitments = () => {
    setLoading(true);
    // El onSnapshot se encargará de actualizar automáticamente
  };

  const getCommitmentsByPriority = (priority) => {
    if (priority === 'all') return commitments;
    return commitments.filter(c => c.priority === priority);
  };

  const getCommitmentsByStatus = (status) => {
    if (status === 'all') return commitments;
    return commitments.filter(c => c.status === status);
  };

  const getStats = () => {
    const total = commitments.length;
    const overdue = commitments.filter(c => c.status === 'overdue').length;
    const dueSoon = commitments.filter(c => c.status === 'due_soon').length;
    const upcoming = commitments.filter(c => c.status === 'upcoming').length;
    const totalAmount = commitments.reduce((sum, c) => sum + c.amount, 0);
    const overdueAmount = commitments
      .filter(c => c.status === 'overdue')
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      total,
      overdue,
      dueSoon,
      upcoming,
      totalAmount,
      overdueAmount,
      averageAmount: total > 0 ? totalAmount / total : 0
    };
  };

  return {
    commitments,
    loading,
    error,
    refreshCommitments,
    getCommitmentsByPriority,
    getCommitmentsByStatus,
    stats: getStats()
  };
};

export default useDueCommitments;
