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
            paymentsSnapshot.forEach((doc) => {
              const payment = doc.data();
              const commitmentId = payment.commitmentId;
              if (commitmentId) {
                if (!paymentsByCommitment[commitmentId]) {
                  paymentsByCommitment[commitmentId] = [];
                }
                paymentsByCommitment[commitmentId].push({
                  id: doc.id,
                  amount: parseFloat(payment.amount || payment.totalAmount || 0),
                  createdAt: payment.createdAt,
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

              if (isPaid) {
                completedCommitments++;
                amounts.paid += originalAmount;
                
                paymentsForCommitment.forEach(payment => {
                  const paymentDate = payment.createdAt?.toDate ? payment.createdAt.toDate() : now;
                  if (paymentDate.getMonth() === currentMonth && 
                      paymentDate.getFullYear() === currentYear) {
                    currentMonthPayments++;
                    currentMonthPaymentAmount += payment.amount;
                  }
                });
              } else {
                activeCommitments++;
                pendingCommitments++;
                amounts.pending += remainingAmount;
                
                if (isOverdue) {
                  overDueCommitments++;
                }
              }
            });
            
            const totalCompanies = uniqueCompanies.size;
            const totalCommitments = commitments.length;

            console.log('Pendientes SALDO REAL:', amounts.pending);

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
