import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { usePermissions } from './usePermissions';
import { APP_PERMISSIONS } from '../constants/permissions';

/**
 * useEmpresas - Hook para consultar directorio de empresas
 * 
 * Características:
 * - Real-time listener con onSnapshot (sincronización automática)
 * - Límite de documentos para controlar lecturas Firestore
 * - Búsqueda client-side para evitar lecturas adicionales
 * - Validación de permisos antes de consultar
 * 
 * @param {Object} options
 * @param {number} options.maxResults - Máximo de empresas a cargar (default: 50)
 * @returns {Object} { empresas, filteredEmpresas, loading, error, searchQuery, setSearchQuery, refetch }
 */
export function useEmpresas({ maxResults = 50 } = {}) {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Verificar permiso
  const hasPermission = can(APP_PERMISSIONS.EMPRESAS_VER);

  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      setError('No tienes permiso para ver empresas');
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'companies'),
      orderBy('name', 'asc'),
      limit(maxResults)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmpresas(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar empresas:', err);
        setError('Error al cargar empresas. Intenta de nuevo.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hasPermission, maxResults]);

  // Búsqueda client-side (sin lecturas adicionales a Firestore)
  const filteredEmpresas = useMemo(() => {
    if (!searchQuery.trim()) return empresas;

    const query = searchQuery.toLowerCase().trim();
    return empresas.filter((empresa) => {
      const name = (empresa.name || '').toLowerCase();
      const nit = (empresa.nit || '').toLowerCase();
      const city = (empresa.city || '').toLowerCase();
      const representative = (empresa.legalRepresentative || '').toLowerCase();
      const contractNumber = (empresa.contractNumber || '').toLowerCase();

      return (
        name.includes(query) ||
        nit.includes(query) ||
        city.includes(query) ||
        representative.includes(query) ||
        contractNumber.includes(query)
      );
    });
  }, [empresas, searchQuery]);

  // Refetch manual (no usado normalmente con onSnapshot, pero útil)
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  return {
    empresas,
    filteredEmpresas,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    hasPermission,
    totalCount: empresas.length,
    filteredCount: filteredEmpresas.length,
    refetch,
  };
}
