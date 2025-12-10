import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook para cache de usuarios con listener real-time
 * Elimina getDocs() repetidos y mantiene usuarios actualizados
 */
export const useUsersCache = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    try {
      // ⚡ LISTENER REAL-TIME: Solo usuarios activos
      const usersQuery = query(
        collection(db, 'users'),
        where('isActive', '!=', false) // Excluir usuarios desactivados
      );

      const unsubscribe = onSnapshot(
        usersQuery,
        (snapshot) => {
          // 🚀 OPTIMIZACIÓN: Usar docChanges() para updates incrementales
          if (snapshot.docChanges().length === 0) {
            setLoading(false);
            return;
          }

          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            uid: doc.id,
            ...doc.data()
          }));

          setUsers(usersData);
          setLoading(false);

          console.log(`✅ Cache de usuarios actualizado: ${usersData.length} usuarios`);
        },
        (err) => {
          console.error('❌ Error en listener de usuarios:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error configurando cache de usuarios:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Helper para buscar usuario por ID
  const getUserById = (userId) => users.find(u => u.id === userId || u.uid === userId);

  // Helper para obtener usuarios sin el actual
  const getUsersExcept = (currentUserId) => 
    users.filter(u => u.id !== currentUserId && u.uid !== currentUserId);

  return { 
    users, 
    loading, 
    error,
    getUserById,
    getUsersExcept
  };
};
