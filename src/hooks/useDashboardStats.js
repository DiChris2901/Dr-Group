import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
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
    currentMonthPayments: 0,
    currentMonthPaymentAmount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!currentUser) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const commitmentsUnsubscribe = onSnapshot(
      collection(db, 'commitments'),
      (commitmentsSnapshot) => {
        const paymentsUnsubscribe = onSnapshot(
          collection(db, 'payments'),
          (paymentsSnapshot) => {
            const commitments = [];
            commitmentsSnapshot.forEach((doc) => {
              const data = doc.data();
              commitments.push({
                id: doc.id,
                ...data,
                dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
                amount: parseFloat(data.amount) || 0
              });
            });

            const paymentsByCommitment = {};
            console.log('🔥 TOTAL PAGOS EN FIREBASE:', paymentsSnapshot.size);
            
            paymentsSnapshot.forEach((doc) => {
              const payment = doc.data();
              const commitmentId = payment.commitmentId;
              
              console.log('💰 Pago encontrado:', {
                id: doc.id,
                commitmentId,
                amount: payment.amount || payment.totalAmount,
                createdAt: payment.createdAt,
                paymentDate: payment.paymentDate,
                date: payment.date,
                timestamp: payment.timestamp,
                allFields: Object.keys(payment)
              });
              
              if (commitmentId) {
                if (!paymentsByCommitment[commitmentId]) {
                  paymentsByCommitment[commitmentId] = [];
                }
                paymentsByCommitment[commitmentId].push({
                  id: doc.id,
                  amount: parseFloat(payment.amount || payment.totalAmount || 0),
                  createdAt: payment.createdAt,
                  paymentDate: payment.paymentDate,
                  date: payment.date,
                  timestamp: payment.timestamp,
                  ...payment
                });
              }
            });

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            let pendingCommitments = 0;
            let overDueCommitments = 0;
            let completedCommitments = 0;
            let activeCommitments = 0;
            let currentMonthPayments = 0;
            let currentMonthPaymentAmount = 0;
            
            const amounts = {
              total: 0,
              paid: 0,
              pending: 0
            };
            
            const uniqueCompanies = new Set();

            commitments.forEach(commitment => {
              const originalAmount = commitment.amount || 0;
              amounts.total += originalAmount;
              
              if (commitment.companyId) {
                uniqueCompanies.add(commitment.companyId);
              }

              const paymentsForCommitment = paymentsByCommitment[commitment.id] || [];
              const totalPaidForCommitment = paymentsForCommitment.reduce((sum, payment) => {
                return sum + payment.amount;
              }, 0);

              const remainingAmount = Math.max(0, originalAmount - totalPaidForCommitment);
              const tolerance = originalAmount * 0.01;
              const isCompletelyPaid = Math.abs(remainingAmount) <= tolerance || totalPaidForCommitment >= originalAmount;

              console.log('Compromiso:', {
                id: commitment.id,
                description: commitment.description,
                originalAmount: originalAmount,
                totalPaidForCommitment: totalPaidForCommitment,
                remainingAmount: remainingAmount,
                paymentsCount: paymentsForCommitment.length
              });

              const isOverdue = commitment.dueDate && commitment.dueDate < now;

              const isMarkedAsPaid = commitment.status === 'completed' || 
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

              const isPaid = isCompletelyPaid || isMarkedAsPaid;

              // 🔥 CONTAR PAGOS DEL MES ACTUAL - INDEPENDIENTE del estado del compromiso
              console.log(`📅 Revisando ${paymentsForCommitment.length} pagos para compromiso ${commitment.id}`);
              
              paymentsForCommitment.forEach(payment => {
                // ⚡ CLAVE: Los pagos se guardan con el campo 'date' (no createdAt)
                let paymentDate = null;
                
                // Prioridad 1: Campo 'date' (usado en NewPaymentPage.jsx línea 1207)
                if (payment.date?.toDate) {
                  paymentDate = payment.date.toDate();
                  console.log('  ✓ Usando date:', paymentDate);
                } 
                // Prioridad 2: Campo 'createdAt' (timestamp de creación)
                else if (payment.createdAt?.toDate) {
                  paymentDate = payment.createdAt.toDate();
                  console.log('  ✓ Usando createdAt:', paymentDate);
                } 
                // Prioridad 3: Campo 'paymentDate'
                else if (payment.paymentDate?.toDate) {
                  paymentDate = payment.paymentDate.toDate();
                  console.log('  ✓ Usando paymentDate:', paymentDate);
                } 
                // Fallback: Usar fecha actual
                else {
                  paymentDate = now;
                  console.log('  ⚠️ Sin fecha válida, usando NOW');
                }
                
                const isCurrentMonth = paymentDate.getMonth() === currentMonth && 
                                      paymentDate.getFullYear() === currentYear;
                
                console.log(`  📆 Pago $${payment.amount} | Fecha: ${paymentDate.toLocaleDateString('es-CO')} | Mes actual: ${isCurrentMonth}`);
                
                if (isCurrentMonth) {
                  currentMonthPayments++;
                  currentMonthPaymentAmount += payment.amount;
                  console.log(`  💳✅ PAGO DEL MES CONTADO! Total acumulado: $${currentMonthPaymentAmount.toLocaleString()}`);
                }
              });

              if (isPaid) {
                completedCommitments++;
                amounts.paid += originalAmount;
                console.log('✅ Compromiso PAGADO completamente');
              } else {
                activeCommitments++;
                pendingCommitments++;
                amounts.pending += remainingAmount;
                console.log('⏳ Compromiso PENDIENTE - Saldo:', remainingAmount);
                
                if (isOverdue) {
                  overDueCommitments++;
                  console.log('🚨 Compromiso VENCIDO');
                }
              }
            });
            
            const totalCompanies = uniqueCompanies.size;
            const totalCommitments = commitments.length;

            console.log('🎯 RESUMEN FINAL:');
            console.log('  📊 Pendientes SALDO REAL:', amounts.pending);
            console.log('  💳 Pagos del mes:', currentMonthPayments);
            console.log('  💰 Monto pagos del mes:', currentMonthPaymentAmount);

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
              currentMonthPayments,
              currentMonthPaymentAmount,
              loading: false,
              error: null
            });
          },
          (error) => {
            console.error('Error loading payments:', error);
            setStats(prev => ({
              ...prev,
              loading: false,
              error: error.message
            }));
          }
        );

        return paymentsUnsubscribe;
      },
      (error) => {
        console.error('Error loading commitments:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    );

    return () => {
      commitmentsUnsubscribe();
    };
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
    currentMonthPayments: stats.currentMonthPayments,
    currentMonthPaymentAmount: stats.currentMonthPaymentAmount,
    loading: stats.loading,
    error: stats.error
  };
};

export default useDashboardStats;
