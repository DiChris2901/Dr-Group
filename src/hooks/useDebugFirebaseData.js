// Hook para debuggear datos de Firebase en tiempo real
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useDebugFirebaseData = () => {
  const { currentUser } = useAuth();
  const [debugData, setDebugData] = useState({
    companies: [],
    commitments: [],
    payments: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchDebugData = async () => {
      try {
        console.log('🔍 Iniciando debug de Firebase para usuario:', currentUser.uid);

        // Obtener empresas
        const companiesQuery = query(
          collection(db, 'companies'),
          where('userId', '==', currentUser.uid)
        );
        const companiesSnapshot = await getDocs(companiesQuery);
        const companies = [];
        companiesSnapshot.forEach(doc => {
          companies.push({ id: doc.id, ...doc.data() });
        });
        console.log('🏢 Empresas encontradas:', companies);

        // Obtener compromisos
        const commitmentsQuery = query(
          collection(db, 'commitments'),
          where('userId', '==', currentUser.uid)
        );
        const commitmentsSnapshot = await getDocs(commitmentsQuery);
        const commitments = [];
        commitmentsSnapshot.forEach(doc => {
          commitments.push({ id: doc.id, ...doc.data() });
        });
        console.log('📋 Compromisos encontrados:', commitments);

        // Obtener pagos
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('userId', '==', currentUser.uid)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = [];
        paymentsSnapshot.forEach(doc => {
          payments.push({ id: doc.id, ...doc.data() });
        });
        console.log('💰 Pagos encontrados:', payments);

        setDebugData({
          companies,
          commitments,
          payments,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('❌ Error en debug de Firebase:', error);
        setDebugData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchDebugData();
  }, [currentUser?.uid]);

  return debugData;
};
