import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { usePermissions } from './usePermissions';
import { APP_PERMISSIONS } from '../constants/permissions';

/**
 * useEmpleados - Hook para consultar directorio de empleados
 * 
 * Características:
 * - Real-time listener con onSnapshot
 * - Límite de documentos para controlar lecturas Firestore
 * - Búsqueda y filtrado client-side
 * - Carga de empresas para mapeo de empresaContratante
 * - Validación de permisos antes de consultar
 * - Filtros: empresa, estado (activo/retirado), búsqueda texto
 * 
 * @param {Object} options
 * @param {number} options.maxResults - Máximo de empleados a cargar (default: 100)
 * @returns {Object}
 */
export function useEmpleados({ maxResults = 100 } = {}) {
  const { can } = usePermissions();
  const [empleados, setEmpleados] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('all'); // 'all' | companyId
  const [filterEstado, setFilterEstado] = useState('activos'); // 'activos' | 'retirados' | 'todos'

  // Verificar permiso
  const hasPermission = can(APP_PERMISSIONS.EMPLEADOS_VER);

  // Cargar empleados
  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      setError('No tienes permiso para ver empleados');
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'empleados'),
      orderBy('apellidos', 'asc'),
      limit(maxResults)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmpleados(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar empleados:', err);
        setError('Error al cargar empleados. Intenta de nuevo.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hasPermission, maxResults]);

  // Cargar empresas para mapeo (solo nombres, lectura ligera)
  useEffect(() => {
    if (!hasPermission) return;

    const q = query(
      collection(db, 'companies'),
      orderBy('name', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Sin nombre',
        }));
        setCompanies(data);
      },
      (err) => {
        console.error('Error al cargar empresas para filtro:', err);
      }
    );

    return () => unsubscribe();
  }, [hasPermission]);

  // Mapa de empresas para lookup rápido
  const companiesMap = useMemo(() => {
    const map = {};
    companies.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [companies]);

  // Obtener nombre de empresa por ID
  const getCompanyName = useCallback(
    (companyId) => {
      return companiesMap[companyId] || 'Sin empresa';
    },
    [companiesMap]
  );

  // Calcular tiempo en empresa
  const calcularTiempoEnEmpresa = useCallback((fechaInicio) => {
    if (!fechaInicio) return 'No especificado';

    try {
      const inicio = fechaInicio.toDate ? fechaInicio.toDate() : new Date(fechaInicio);
      const ahora = new Date();
      const diffMs = ahora - inicio;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      const days = diffDays % 30;

      const parts = [];
      if (years > 0) parts.push(`${years} año${years > 1 ? 's' : ''}`);
      if (months > 0) parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
      if (days > 0 && years === 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);

      return parts.length > 0 ? parts.join(', ') : 'Recién ingresado';
    } catch {
      return 'No especificado';
    }
  }, []);

  // Filtrado y búsqueda client-side
  const filteredEmpleados = useMemo(() => {
    let result = [...empleados];

    // Filtro por estado
    if (filterEstado === 'activos') {
      result = result.filter((e) => !e.retirado);
    } else if (filterEstado === 'retirados') {
      result = result.filter((e) => e.retirado === true);
    }

    // Filtro por empresa
    if (filterEmpresa !== 'all') {
      result = result.filter((e) => e.empresaContratante === filterEmpresa);
    }

    // Búsqueda por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const nombres = (e.nombres || '').toLowerCase();
        const apellidos = (e.apellidos || '').toLowerCase();
        const documento = (e.numeroDocumento || '').toLowerCase();
        const email = (e.emailCorporativo || '').toLowerCase();
        const telefono = (e.telefono || '').toLowerCase();

        return (
          nombres.includes(q) ||
          apellidos.includes(q) ||
          documento.includes(q) ||
          email.includes(q) ||
          telefono.includes(q) ||
          `${nombres} ${apellidos}`.includes(q)
        );
      });
    }

    return result;
  }, [empleados, searchQuery, filterEmpresa, filterEstado]);

  // Estadísticas
  const stats = useMemo(() => {
    const activos = empleados.filter((e) => !e.retirado).length;
    const retirados = empleados.filter((e) => e.retirado === true).length;
    return { total: empleados.length, activos, retirados };
  }, [empleados]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  return {
    empleados,
    filteredEmpleados,
    companies,
    companiesMap,
    getCompanyName,
    calcularTiempoEnEmpresa,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterEmpresa,
    setFilterEmpresa,
    filterEstado,
    setFilterEstado,
    hasPermission,
    stats,
    totalCount: empleados.length,
    filteredCount: filteredEmpleados.length,
    refetch,
  };
}
