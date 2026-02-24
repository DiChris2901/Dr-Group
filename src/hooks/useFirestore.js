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
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Hook para manejar compromisos financieros
export const useCommitments = (filters = {}) => {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ Si shouldLoadData es false, no cargar nada (para páginas con filtros obligatorios)
    if (filters.shouldLoadData === false) {
      setCommitments([]);
      setLoading(false);
      return;
    }

    let q = collection(db, 'commitments');
    const constraints = [];
    
    // Aplicar filtros de empresa
    if (filters.company) {
      constraints.push(where('companyId', '==', filters.company));
    }
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    // ✅ Aplicar filtros de fecha (startDate y endDate)
    if (filters.startDate && filters.endDate) {
      constraints.push(where('dueDate', '>=', filters.startDate));
      constraints.push(where('dueDate', '<=', filters.endDate));
    }

    // ✅ Aplicar ordenamiento
    constraints.push(orderBy('dueDate', 'asc'));

    // Construir query con todos los constraints
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    } else {
      q = query(q, orderBy('dueDate', 'asc'));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const commitmentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          const commitment = {
            id: doc.id,
            ...data
          };
          
          // ✅ VALIDACIÓN: Verificar que el ID se haya extraído correctamente
          if (!commitment.id) {
            console.error('❌ COMPROMISO SIN ID DETECTADO:', {
              docId: doc.id,
              docExists: doc.exists,
              data: data
            });
          }
          
          return commitment;
        });
        
        // ✅ Filtrar compromisos sin ID (por si acaso)
        const validCommitments = commitmentsData.filter(c => c.id);
        const invalidCount = commitmentsData.length - validCommitments.length;
        
        if (invalidCount > 0) {
          console.warn(`⚠️ Se encontraron ${invalidCount} compromisos sin ID válido`);
        }
        
        setCommitments(validCommitments);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filters.company, filters.status, filters.startDate, filters.endDate, filters.shouldLoadData]);

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

// Hook para notificaciones y alertas
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
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
      if (unreadNotifications.length === 0) return;
      const batch = writeBatch(db);
      unreadNotifications.forEach(notification => {
        batch.update(doc(db, 'notifications', notification.id), { read: true });
      });
      await batch.commit();
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

  // Estabilizar options para evitar re-subscribe en cada render
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    if (!collectionName) {
      setLoading(false);
      return;
    }

    // Parsear options desde la key estable
    const opts = JSON.parse(optionsKey);

    let q = collection(db, collectionName);
    
    // Aplicar filtros si existen
    if (opts.where) {
      q = query(q, where(opts.where.field, opts.where.operator, opts.where.value));
    }
    
    // Aplicar ordenamiento si existe
    if (opts.orderBy) {
      q = query(q, orderBy(opts.orderBy.field, opts.orderBy.direction || 'asc'));
    }
    
    // Aplicar límite si existe
    if (opts.limit) {
      q = query(q, limit(opts.limit));
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
  }, [collectionName, optionsKey]);

  return {
    data,
    loading,
    error
  };
};
