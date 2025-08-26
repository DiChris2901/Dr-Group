import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Hook para manejar compromisos financieros
export const useCommitments = (filters = {}) => {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = collection(db, 'commitments');
    
    // Aplicar filtros
    if (filters.company) {
      q = query(q, where('company', '==', filters.company));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Ordenar por fecha de vencimiento
    q = query(q, orderBy('dueDate', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const commitmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCommitments(commitmentsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filters.company, filters.status]); // Solo dependencias específicas

  const addCommitment = async (commitmentData) => {
    try {
      const docRef = await addDoc(collection(db, 'commitments'), {
        ...commitmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateCommitment = async (id, updates) => {
    try {
      const commitmentRef = doc(db, 'commitments', id);
      await updateDoc(commitmentRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCommitment = async (id) => {
    try {
      await deleteDoc(doc(db, 'commitments', id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    commitments,
    loading,
    error,
    addCommitment,
    updateCommitment,
    deleteCommitment
  };
};

// Hook para manejar empresas
export const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('name'));
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const companiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCompanies(companiesData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { companies, loading, error };
};

// Hook para notificaciones y alertas
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    });

    return unsubscribe;
  }, [userId]);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};

// Hook para manejar pagos
export const usePayments = (filters = {}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si shouldLoadData es false, cargar solo datos para poblar los filtros (primeros 50 registros)
    if (filters.shouldLoadData === false) {
      let q = query(collection(db, 'payments'), orderBy('date', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const sampleData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date),
            amount: parseFloat(doc.data().amount) || 0
          }));
          
          // Filtrar registros automáticos de 4x1000 en el cliente para la muestra
          const filteredSample = sampleData.filter(payment => 
            !payment.is4x1000Tax && !payment.isAutomatic
          );
          
          setPayments(filteredSample);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
      
      return () => unsubscribe();
    }

    let q = collection(db, 'payments');
    
    // Aplicar filtros (sin filtro de 4x1000 en query)
    if (filters.company) {
      q = query(q, where('companyName', '==', filters.company));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Ordenar por fecha de pago (más recientes primero)
    q = query(q, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const allPaymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date),
          amount: parseFloat(doc.data().amount) || 0
        }));
        
        // Filtrar registros automáticos de 4x1000 en el cliente
        const filteredPayments = allPaymentsData.filter(payment => 
          !payment.is4x1000Tax && !payment.isAutomatic
        );
        
        setPayments(filteredPayments);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filters.company, filters.status, filters.shouldLoadData]); // Solo dependencias específicas

  const addPayment = async (paymentData) => {
    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        date: paymentData.date instanceof Date ? paymentData.date : new Date(paymentData.date),
        amount: parseFloat(paymentData.amount),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updatePayment = async (id, updates) => {
    try {
      const paymentRef = doc(db, 'payments', id);
      await updateDoc(paymentRef, {
        ...updates,
        amount: updates.amount ? parseFloat(updates.amount) : undefined,
        date: updates.date instanceof Date ? updates.date : updates.date ? new Date(updates.date) : undefined,
        updatedAt: new Date()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deletePayment = async (id) => {
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    payments,
    loading,
    error,
    addPayment,
    updatePayment,
    deletePayment
  };
};

// Hook genérico para cualquier colección de Firestore
export const useFirestore = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionName) {
      setLoading(false);
      return;
    }

    let q = collection(db, collectionName);
    
    // Aplicar filtros si existen
    if (options.where) {
      q = query(q, where(options.where.field, options.where.operator, options.where.value));
    }
    
    // Aplicar ordenamiento si existe
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
    }
    
    // Aplicar límite si existe
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const dataArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(dataArray);
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(options)]);

  return {
    data,
    loading,
    error
  };
};
