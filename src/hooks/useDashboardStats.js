import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * 🚀 HOOK OPTIMIZADO: Dashboard Stats
 * 
 * ANTES: 
 * - Leía TODOS los compromisos + TODOS los pagos en cada carga
 * - 10,000 registros = 20,000 reads = $0.72/load = $21.60/mes
 * 
 * AHORA:
 * - Lee 1 SOLO documento 'system_stats/dashboard'
 * - Actualizado automáticamente por Cloud Functions en cada cambio
 * - 1 read = $0.000036/load = $0.001/mes = 99.995% de ahorro 💰
 */
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
    error: null,
    lastUpdated: null
  });

  useEffect(() => {
    // ⚠️ VALIDACIÓN: No ejecutar si no hay usuario autenticado
    if (!currentUser) {
      setStats(prev => ({ 
        ...prev, 
        loading: false,
        error: null
      }));
      return;
    }

    console.log('📊 Cargando estadísticas desde documento de contadores...');

    // Escuchar cambios en el documento de estadísticas
    const statsUnsubscribe = onSnapshot(
      doc(db, 'system_stats', 'dashboard'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          console.log('✅ Estadísticas cargadas desde contador:', {
            compromisos: data.totalCommitments,
            pendientes: data.pendingCommitments,
            vencidos: data.overDueCommitments,
            lastUpdated: data.lastUpdated?.toDate?.()
          });
          
          setStats({
            totalCommitments: data.totalCommitments || 0,
            activeCommitments: data.activeCommitments || 0,
            pendingCommitments: data.pendingCommitments || 0,
            overDueCommitments: data.overDueCommitments || 0,
            completedCommitments: data.completedCommitments || 0,
            totalCompanies: data.totalCompanies || 0,
            totalAmount: data.totalAmount || 0,
            paidAmount: data.paidAmount || 0,
            pendingAmount: data.pendingAmount || 0,
            currentMonthPayments: data.currentMonthPayments || 0,
            currentMonthPaymentAmount: data.currentMonthPaymentAmount || 0,
            loading: false,
            error: null,
            lastUpdated: data.lastUpdated?.toDate?.() || null
          });
        } else {
          // Si el documento no existe, mostrar mensaje informativo
          console.warn('⚠️ Documento de estadísticas no existe. Ejecuta forceRecalculateStats() desde Firebase Console.');
          
          setStats({
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
            loading: false,
            error: 'Estadísticas no inicializadas. Contacta al administrador.',
            lastUpdated: null
          });
        }
      },
      (error) => {
        // Manejo de errores
        if (error.code === 'permission-denied') {
          console.warn('⚠️ Permisos insuficientes (esperado durante logout)');
          setStats(prev => ({
            ...prev,
            loading: false,
            error: null
          }));
        } else {
          console.error('❌ Error cargando estadísticas:', error);
          setStats(prev => ({
            ...prev,
            loading: false,
            error: error.message
          }));
        }
      }
    );

    return () => {
      statsUnsubscribe();
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
