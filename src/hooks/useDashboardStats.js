import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
    lastUpdated: null,
    usingFallback: false // ✅ Indicador de modo
  });

  // ✅ FUNCIÓN PARA FORZAR RECÁLCULO DE CONTADORES
  const refreshStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      console.log('🔄 Forzando recálculo de contadores...');

      const functions = getFunctions();
      const forceRecalculateStats = httpsCallable(functions, 'forceRecalculateStats');
      
      const result = await forceRecalculateStats();
      
      console.log('✅ Contadores recalculados exitosamente:', result.data);
      
      // El listener de onSnapshot detectará los cambios automáticamente
      
    } catch (error) {
      console.error('❌ Error forzando recálculo:', error);
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  }, []);

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
          // ✅ MODO OPTIMIZADO: Usar contadores pre-calculados
          const data = docSnapshot.data();
          
          console.log('✅ Estadísticas cargadas desde contador optimizado (1 read)');
          console.log('💰 Modo: OPTIMIZADO (99.995% ahorro activo)');
          
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
            lastUpdated: data.lastUpdated?.toDate?.() || null,
            usingFallback: false // ✅ Modo optimizado activo
          });
        } else {
          // ⚠️ FALLBACK: Documento no existe → Calcular directamente (temporal)
          console.warn('⚠️ Contador no inicializado. Usando cálculo directo (fallback)...');
          console.warn('💡 Para optimizar: Ejecuta forceRecalculateStats() desde Firebase Console');
          
          // Importar colecciones y calcular manualmente
          import('firebase/firestore').then(({ collection, onSnapshot: fsOnSnapshot }) => {
            const commitmentsUnsubscribe = fsOnSnapshot(
              collection(db, 'commitments'),
              (commitmentsSnapshot) => {
                const paymentsUnsubscribe = fsOnSnapshot(
                  collection(db, 'payments'),
                  (paymentsSnapshot) => {
                    // Calcular estadísticas (lógica simplificada)
                    const commitments = commitmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    
                    let totalCommitments = commitments.length;
                    let pendingCommitments = 0;
                    let overDueCommitments = 0;
                    let completedCommitments = 0;
                    let totalAmount = 0;
                    let paidAmount = 0;
                    let pendingAmount = 0;
                    
                    commitments.forEach(c => {
                      const amount = parseFloat(c.amount) || 0;
                      totalAmount += amount;
                      
                      const isPaid = c.status === 'paid' || c.status === 'completed' || c.paid === true;
                      const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
                      const isOverdue = dueDate && dueDate < now;
                      
                      if (isPaid) {
                        completedCommitments++;
                        paidAmount += amount;
                      } else {
                        pendingCommitments++;
                        pendingAmount += amount;
                        if (isOverdue) overDueCommitments++;
                      }
                    });
                    
                    const currentMonthPayments = payments.filter(p => {
                      if (p.is4x1000Tax) return false;
                      const paymentDate = p.date?.toDate ? p.date.toDate() : new Date(p.date);
                      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
                    }).length;
                    
                    const currentMonthPaymentAmount = payments
                      .filter(p => {
                        if (p.is4x1000Tax) return false;
                        const paymentDate = p.date?.toDate ? p.date.toDate() : new Date(p.date);
                        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
                      })
                      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                    
                    const uniqueCompanies = new Set(commitments.map(c => c.companyId).filter(Boolean));
                    
                    console.log('📊 Estadísticas calculadas directamente (fallback activo)');
                    console.log('⚠️ RECOMENDACIÓN: Ejecuta refreshStats() para activar modo optimizado');
                    
                    setStats({
                      totalCommitments,
                      activeCommitments: pendingCommitments,
                      pendingCommitments,
                      overDueCommitments,
                      completedCommitments,
                      totalCompanies: uniqueCompanies.size,
                      totalAmount,
                      paidAmount,
                      pendingAmount,
                      currentMonthPayments,
                      currentMonthPaymentAmount,
                      loading: false,
                      error: null,
                      lastUpdated: null,
                      usingFallback: true // ✅ Modo fallback activo
                    });
                  },
                  (error) => {
                    if (error.code !== 'permission-denied') {
                      console.error('Error cargando pagos:', error);
                    }
                  }
                );
                
                return paymentsUnsubscribe;
              },
              (error) => {
                if (error.code !== 'permission-denied') {
                  console.error('Error cargando compromisos:', error);
                }
              }
            );
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
    // Valores
    totalCommitments: stats.totalCommitments,
    activeCommitments: stats.activeCommitments,
    pendingCommitments: stats.pendingCommitments,
    overDueCommitments: stats.overDueCommitments,
    completedCommitments: stats.completedCommitments,
    totalCompanies: stats.totalCompanies,
    totalAmount: stats.totalAmount,
    paidAmount: stats.paidAmount,
    pendingAmount: stats.pendingAmount,
    currentMonthPayments: stats.currentMonthPayments,
    currentMonthPaymentAmount: stats.currentMonthPaymentAmount,
    
    // Estado
    loading: stats.loading,
    error: stats.error,
    lastUpdated: stats.lastUpdated,
    usingFallback: stats.usingFallback, // ✅ Para mostrar advertencia en UI
    
    // Acciones
    refreshStats // ✅ Función para forzar recálculo (botón "Actualizar")
  };
};

export default useDashboardStats;
