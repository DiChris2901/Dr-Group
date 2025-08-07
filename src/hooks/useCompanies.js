import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const companiesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          companiesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });

        setCompanies(companiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching companies:', error);
        setError('Error al cargar empresas: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Función helper para buscar empresa por NIT
  const findCompanyByNIT = (nit) => {
    if (!nit || !companies.length) return 'No encontrado';
    
    const nitStr = nit.toString().trim();
    const company = companies.find(comp => 
      comp.nit?.toString().trim() === nitStr
    );
    
    return company ? company.name || 'No encontrado' : 'No encontrado';
  };

  return {
    companies,
    loading,
    error,
    findCompanyByNIT
  };
};

export default useCompanies;
