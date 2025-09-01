import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook personalizado para calcular el estado real de pagos de compromisos
 * Considera pagos parciales y determina correctamente si un compromiso está:
 * - Completamente pagado
 * - Parcialmente pagado (pendiente)
 * - Sin pagos (vencido si pasó la fecha, pendiente si no)
 */
export const useCommitmentPaymentStatus = (commitmentId) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!commitmentId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(paymentsRef, where('commitmentId', '==', commitmentId));

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPayments(paymentsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching payments:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [commitmentId]);

  return { payments, loading, error };
};

/**
 * Hook para calcular estadísticas de pago de un compromiso
 */
export const useCommitmentPaymentStats = (commitment) => {
  const { payments, loading, error } = useCommitmentPaymentStatus(commitment?.id);

  const paymentStats = useMemo(() => {
    if (!commitment || loading) {
      return {
        totalAmount: 0,
        totalPaid: 0,
        remainingAmount: 0,
        paymentPercentage: 0,
        isCompletelyPaid: false,
        isPartiallyPaid: false,
        hasNoPayments: true,
        status: 'calculating'
      };
    }

    const totalAmount = parseFloat(commitment.totalAmount || commitment.amount || 0);
    const totalPaid = payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || payment.totalAmount || 0);
    }, 0);

    const remainingAmount = Math.max(0, totalAmount - totalPaid);
    const paymentPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

    // Tolerancia del 1% para diferencias de redondeo
    const tolerance = totalAmount * 0.01;
    const isCompletelyPaid = Math.abs(remainingAmount) <= tolerance || totalPaid >= totalAmount;
    const isPartiallyPaid = totalPaid > 0 && !isCompletelyPaid;
    const hasNoPayments = totalPaid === 0;

    return {
      totalAmount,
      totalPaid,
      remainingAmount,
      paymentPercentage,
      isCompletelyPaid,
      isPartiallyPaid,
      hasNoPayments,
      paymentsCount: payments.length,
      status: isCompletelyPaid ? 'completed' : isPartiallyPaid ? 'partial' : 'unpaid'
    };
  }, [commitment, payments, loading]);

  return { paymentStats, paymentsLoading: loading, paymentsError: error };
};

/**
 * Función utilitaria para determinar el estado correcto de un compromiso
 * considerando pagos parciales y fechas de vencimiento
 */
export const getCommitmentStatus = (commitment, paymentStats) => {
  if (!commitment) return null;

  const today = new Date();
  const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
  const isOverdueByDate = dueDate < today;

  // 1. Si está completamente pagado
  if (paymentStats.isCompletelyPaid || commitment.paid || commitment.isPaid) {
    return {
      key: 'completed',
      label: 'Pagado',
      color: 'success',
      priority: 1,
      description: 'Compromiso completamente pagado'
    };
  }

  // 2. Si tiene pagos parciales (sin importar la fecha)
  if (paymentStats.isPartiallyPaid) {
    return {
      key: 'partial',
      label: 'Parcialmente Pagado',
      color: 'warning',
      priority: 2,
      description: `Pagado ${paymentStats.paymentPercentage.toFixed(1)}% del total`
    };
  }

  // 3. Sin pagos pero vencido por fecha
  if (paymentStats.hasNoPayments && isOverdueByDate) {
    return {
      key: 'overdue',
      label: 'Vencido',
      color: 'error',
      priority: 3,
      description: 'Sin pagos y fecha vencida'
    };
  }

  // 4. Sin pagos pero aún no vencido
  return {
    key: 'pending',
    label: 'Pendiente',
    color: 'info',
    priority: 4,
    description: 'Sin pagos, fecha vigente'
  };
};

/**
 * Hook principal que combina todo para obtener el estado completo de un compromiso
 */
export const useCommitmentCompleteStatus = (commitment) => {
  const { paymentStats, paymentsLoading, paymentsError } = useCommitmentPaymentStats(commitment);
  
  const status = useMemo(() => {
    if (paymentsLoading) {
      return {
        key: 'loading',
        label: 'Cargando...',
        color: 'default',
        priority: 999
      };
    }
    
    return getCommitmentStatus(commitment, paymentStats);
  }, [commitment, paymentStats, paymentsLoading]);

  return {
    status,
    paymentStats,
    loading: paymentsLoading,
    error: paymentsError
  };
};

export default useCommitmentPaymentStatus;
