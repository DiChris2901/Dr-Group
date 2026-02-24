import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const CompaniesContext = createContext({
  companies: [],
  loading: true,
  error: null,
  findCompanyByNIT: () => 'No encontrado',
});

/**
 * CompaniesProvider — Single Firestore listener for all companies.
 * Replaces N independent listeners from useCompanies() hook usages.
 */
export const CompaniesProvider = ({ children }) => {
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
          companiesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          });
        });
        setCompanies(companiesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error cargando empresas:', err);
        setError('Error al cargar empresas: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Helper — flexible NIT lookup
  const normalizeNIT = (nit) => {
    if (!nit) return '';
    return nit.toString().replace(/[.\-\s]/g, '').trim().toUpperCase();
  };

  const findCompanyByNIT = useCallback((nit) => {
    if (!nit || !companies.length) return 'No encontrado';

    const normalizedSearchNIT = normalizeNIT(nit);

    let company = companies.find(
      (c) => normalizeNIT(c.nit) === normalizedSearchNIT
    );

    if (!company) {
      company = companies.find((c) => {
        const cNIT = normalizeNIT(c.nit);
        const cWithoutDV = cNIT.slice(0, -1);
        const sWithoutDV =
          normalizedSearchNIT.length > 9
            ? normalizedSearchNIT.slice(0, -1)
            : normalizedSearchNIT;
        return cWithoutDV === sWithoutDV || cNIT.startsWith(normalizedSearchNIT);
      });
    }

    return company ? company.name || 'No encontrado' : 'No encontrado';
  }, [companies]);

  const value = { companies, loading, error, findCompanyByNIT };

  return (
    <CompaniesContext.Provider value={value}>
      {children}
    </CompaniesContext.Provider>
  );
};

/**
 * useCompaniesContext — access the shared companies data.
 */
export const useCompaniesContext = () => {
  const ctx = useContext(CompaniesContext);
  if (!ctx) {
    throw new Error('useCompaniesContext must be used within CompaniesProvider');
  }
  return ctx;
};

export default CompaniesContext;
