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
      setError('Usuario no autenticado');
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
        const company = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        };
        companiesData.push(company);
      });

      setCompanies(companiesData);
      setLoading(false);
    },
    (error) => {
      console.error('Error cargando empresas:', error);
      setError('Error al cargar empresas: ' + error.message);
      setLoading(false);
    }
  );    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Función helper para normalizar NIT (quitar puntos, guiones y espacios)
  const normalizeNIT = (nit) => {
    if (!nit) return '';
    return nit.toString().replace(/[\.\-\s]/g, '').trim().toUpperCase();
  };

  // Función helper para buscar empresa por NIT con comparación flexible
  const findCompanyByNIT = (nit) => {
    if (!nit || !companies.length) {
      return 'No encontrado';
    }
    
    const normalizedSearchNIT = normalizeNIT(nit);
    
    // Busqueda exacta primero
    let company = companies.find(comp => {
      const companyNIT = normalizeNIT(comp.nit);
      return companyNIT === normalizedSearchNIT;
    });
    
    // Si no se encuentra match exacto, buscar sin dígito verificador
    if (!company) {
      company = companies.find(comp => {
        const companyNIT = normalizeNIT(comp.nit);
        // Remover el último dígito (dígito verificador) para comparar
        const companyNITWithoutDV = companyNIT.slice(0, -1);
        const searchNITWithoutDV = normalizedSearchNIT.length > 9 ? normalizedSearchNIT.slice(0, -1) : normalizedSearchNIT;
        
        return companyNITWithoutDV === searchNITWithoutDV || companyNIT.startsWith(normalizedSearchNIT);
      });
    }
    
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
