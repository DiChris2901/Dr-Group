import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useCommitments = () => {
  const { currentUser } = useAuth();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setCommitments([]);
      setLoading(false);
      return;
    }

    const fetchCommitments = async () => {
      try {
        setLoading(true);
        
        // Obtener compromisos próximos (próximos 3 meses)
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        
        const commitmentsRef = collection(db, 'commitments');
        const q = query(
          commitmentsRef,
          where('dueDate', '<=', threeMonthsFromNow),
          orderBy('dueDate', 'asc')
        );
        
        const snapshot = await getDocs(q);
        const commitmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCommitments(commitmentsData);
        setError(null);
      } catch (err) {
        console.warn('Error fetching commitments for calendar:', err);
        setError(err.message);
        // En caso de error, usar datos vacíos para no romper el calendario
        setCommitments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommitments();
  }, [currentUser]);

  return { commitments, loading, error };
};
