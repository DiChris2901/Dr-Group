import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Función utilitaria para determinar el estado de un compromiso
 * basándose en la lógica mejorada de pagos
 */
export const determineCommitmentStatus = async (commitment) => {
  if (!commitment) return 'unknown';

  // 1. Verificar estados directos de completion
  if (commitment.paid || commitment.isPaid || commitment.status === 'completed' || commitment.status === 'paid') {
    return 'completed';
  }

  // 2. Consultar pagos asociados
  try {
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(paymentsRef, where('commitmentId', '==', commitment.id));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. Calcular totales
    const totalAmount = parseFloat(commitment.totalAmount || commitment.amount || 0);
    const totalPaid = payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || payment.totalAmount || 0);
    }, 0);

    // 4. Determinar estado basado en pagos
    const tolerance = totalAmount * 0.01; // 1% de tolerancia
    const isCompletelyPaid = Math.abs(totalPaid - totalAmount) <= tolerance || totalPaid >= totalAmount;
    const isPartiallyPaid = totalPaid > 0 && !isCompletelyPaid;

    if (isCompletelyPaid) {
      return 'completed';
    }

    if (isPartiallyPaid) {
      return 'partial'; // Tiene pagos parciales - debería aparecer como pendiente, NO como vencido
    }

    // 5. Sin pagos: verificar fecha de vencimiento
    const today = new Date();
    const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
    const isOverdueByDate = dueDate < today;

    if (isOverdueByDate) {
      return 'overdue';
    }

    return 'pending';

  } catch (error) {
    console.error('Error determining commitment status:', error);
    // Fallback a lógica simple
    const today = new Date();
    const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
    return dueDate < today ? 'overdue' : 'pending';
  }
};

/**
 * Función mejorada para filtrar compromisos basándose en estados reales de pago
 */
export const filterCommitmentsByStatus = async (commitments, statusFilter) => {
  console.log(`🔍 [FILTER DEBUG] Iniciando filtrado: ${commitments.length} compromisos, filtro: ${statusFilter}`);
  
  if (!commitments || commitments.length === 0) return [];
  if (statusFilter === 'all') return commitments;

  const commitmentsWithStatus = await Promise.all(
    commitments.map(async (commitment) => {
      const status = await determineCommitmentStatus(commitment);
      return { ...commitment, calculatedStatus: status };
    })
  );

  const filteredResults = commitmentsWithStatus.filter(commitment => {
    const status = commitment.calculatedStatus;
    
    switch (statusFilter) {
      case 'completed':
      case 'paid':
        return status === 'completed';
      
      case 'pending':
        // Pendientes incluyen tanto sin pagos como con pagos parciales
        const shouldInclude = status === 'pending' || status === 'partial';
        console.log(`🔍 [FILTER DEBUG] Compromiso ${commitment.id}: status=${status}, incluir=${shouldInclude}`);
        return shouldInclude;
      
      case 'overdue':
        // Vencidos SOLO son los que no tienen pagos Y están vencidos por fecha
        return status === 'overdue';
      
      case 'partial':
        // Filtro específico para pagos parciales
        return status === 'partial';
      
      case 'due-soon':
        // Próximos a vencer (sin pagos, dentro de 3 días)
        if (status === 'completed') return false;
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);
        const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
        return dueDate > today && dueDate < threeDaysFromNow && (status === 'pending' || status === 'partial');
      
      default:
        return false;
    }
  });

  console.log(`🔍 [FILTER DEBUG] Resultado final: ${filteredResults.length} compromisos filtrados`);
  return filteredResults;
};

/**
 * Función para obtener estadísticas de compromisos considerando pagos parciales
 */
export const getCommitmentStats = async (commitments) => {
  if (!commitments || commitments.length === 0) {
    return {
      total: 0,
      completed: 0,
      partial: 0,
      pending: 0,
      overdue: 0
    };
  }

  const commitmentsWithStatus = await Promise.all(
    commitments.map(async (commitment) => {
      const status = await determineCommitmentStatus(commitment);
      return { ...commitment, calculatedStatus: status };
    })
  );

  const stats = commitmentsWithStatus.reduce((acc, commitment) => {
    acc.total++;
    switch (commitment.calculatedStatus) {
      case 'completed':
        acc.completed++;
        break;
      case 'partial':
        acc.partial++;
        break;
      case 'pending':
        acc.pending++;
        break;
      case 'overdue':
        acc.overdue++;
        break;
    }
    return acc;
  }, {
    total: 0,
    completed: 0,
    partial: 0,
    pending: 0,
    overdue: 0
  });

  return stats;
};

export default {
  determineCommitmentStatus,
  filterCommitmentsByStatus,
  getCommitmentStats
};