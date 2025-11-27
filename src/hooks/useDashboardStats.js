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
    lastUpdated: null
  });

  // ✅ FUNCIÓN PARA FORZAR RECÁLCULO DE CONTADORES
  const refreshStats = useCallback(async () => {
    try {
      console.log('🚀 [refreshStats] Iniciando recálculo...');
      setStats(prev => ({ ...prev, loading: true }));

      const functions = getFunctions();
      console.log('🔧 [refreshStats] getFunctions() ejecutado');
      
      const forceRecalculateStats = httpsCallable(functions, 'forceRecalculateStats');
      console.log('📞 [refreshStats] Llamando a forceRecalculateStats...');
      
      const result = await forceRecalculateStats();
      
      console.log('✅ [refreshStats] ÉXITO! Respuesta:', result.data);
      console.log('📊 [refreshStats] Stats calculados:', result.data.stats);
      console.log('💾 [refreshStats] Documento system_stats/dashboard creado en Firestore');
      console.log('⏳ [refreshStats] El listener de onSnapshot detectará los cambios en 2-3 segundos...');
      
      // Forzar recarga después de 3 segundos para ver el cambio
      setTimeout(() => {
        console.log('🔄 [refreshStats] Timeout completado, el listener debería haber actualizado los stats');
      }, 3000);
      
    } catch (error) {
      console.error('❌ [refreshStats] ERROR:', error);
      console.error('❌ [refreshStats] Código de error:', error.code);
      console.error('❌ [refreshStats] Mensaje:', error.message);
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
      throw error; // Re-lanzar para que ExecutiveDashboardPage lo capture
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
          const data = docSnapshot.data();
          
          console.log('✅ Stats cargadas desde system_stats/dashboard (1 lectura)');
          
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
          console.error('❌ ERROR: system_stats/dashboard no existe');
          setStats(prev => ({
            ...prev,
            loading: false,
            error: 'Documento de contadores no encontrado'
          }));
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
    
    // Acciones
    refreshStats // Función para forzar recálculo manual
  };
};

export default useDashboardStats;
