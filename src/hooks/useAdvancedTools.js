// 🔧 Hook para datos de herramientas avanzadas
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useAdvancedTools = () => {
  const { currentUser } = useAuth();
  const [toolsData, setToolsData] = useState({
    recentCalculations: [],
    exportHistory: [],
    importHistory: [],
    systemTools: [],
    userTools: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!currentUser) {
      setToolsData(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribeCalculations = onSnapshot(
      query(
        collection(db, 'calculations'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const calculations = [];
        snapshot.forEach((doc) => {
          calculations.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          });
        });
        
        setToolsData(prev => ({
          ...prev,
          recentCalculations: calculations.slice(0, 10), // Últimas 10
          loading: false
        }));
      },
      (error) => {
        console.error('Error fetching calculations:', error);
        setToolsData(prev => ({ ...prev, error: error.message, loading: false }));
      }
    );

    const unsubscribeExports = onSnapshot(
      query(
        collection(db, 'exportHistory'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const exports = [];
        snapshot.forEach((doc) => {
          exports.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          });
        });
        
        setToolsData(prev => ({
          ...prev,
          exportHistory: exports.slice(0, 5)
        }));
      }
    );

    const unsubscribeImports = onSnapshot(
      query(
        collection(db, 'importHistory'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const imports = [];
        snapshot.forEach((doc) => {
          imports.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          });
        });
        
        setToolsData(prev => ({
          ...prev,
          importHistory: imports.slice(0, 5)
        }));
      }
    );

    // Obtener herramientas del sistema
    const fetchSystemTools = async () => {
      try {
        const systemToolsSnapshot = await getDocs(collection(db, 'systemTools'));
        const tools = [];
        systemToolsSnapshot.forEach((doc) => {
          tools.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setToolsData(prev => ({
          ...prev,
          systemTools: tools
        }));
      } catch (error) {
        console.error('Error fetching system tools:', error);
      }
    };

    fetchSystemTools();

    return () => {
      unsubscribeCalculations();
      unsubscribeExports();
      unsubscribeImports();
    };
  }, [currentUser]);

  return toolsData;
};
