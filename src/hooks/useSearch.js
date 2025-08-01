import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allData, setAllData] = useState([]);

  // Cargar datos reales de Firebase
  useEffect(() => {
    const unsubscribers = [];

    try {
      // Cargar empresas
      const companiesQuery = query(
        collection(db, 'companies'),
        orderBy('name', 'asc')
      );

      const unsubscribeCompanies = onSnapshot(companiesQuery, (snapshot) => {
        const companiesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          companiesData.push({
            id: doc.id,
            type: 'company',
            title: data.name,
            category: 'Empresas',
            description: data.nit ? `NIT: ${data.nit}` : 'Empresa del grupo',
            status: data.status || 'Activa',
            companyName: data.name,
            nit: data.nit,
            address: data.address,
            phone: data.phone,
            email: data.email,
            city: data.city,
            sector: data.sector,
            logoURL: data.logoURL,
            ...data
          });
        });

        // Cargar compromisos
        const commitmentsQuery = query(
          collection(db, 'commitments'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribeCommitments = onSnapshot(commitmentsQuery, (commitmentsSnapshot) => {
          const commitmentsData = [];
          commitmentsSnapshot.forEach((doc) => {
            const data = doc.data();
            commitmentsData.push({
              id: doc.id,
              type: 'commitment',
              title: `${data.concept || 'Compromiso'} - ${data.companyName || 'Sin empresa'}`,
              category: 'Compromisos',
              description: `Beneficiario: ${data.beneficiary || 'No especificado'}`,
              amount: data.amount ? new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(data.amount) : '$0',
              dueDate: data.dueDate,
              status: data.status || 'Activo',
              concept: data.concept,
              beneficiary: data.beneficiary,
              companyName: data.companyName,
              ...data
            });
          });

          // Combinar todos los datos
          const allCombinedData = [
            ...companiesData,
            ...commitmentsData,
            // Datos estáticos para configuración
            {
              id: 'settings-theme',
              type: 'setting',
              title: 'Configuración de Temas',
              category: 'Configuración',
              description: 'Personalizar colores y apariencia',
              path: '/settings'
            },
            {
              id: 'settings-users',
              type: 'setting',
              title: 'Gestión de Usuarios',
              category: 'Configuración',
              description: 'Administrar permisos y roles',
              path: '/users'
            }
          ];

          setAllData(allCombinedData);
        });

        unsubscribers.push(unsubscribeCommitments);
      }, (error) => {
        console.error('Error cargando empresas:', error);
        // En caso de error, usar datos básicos
        setAllData([
          {
            id: 'settings-theme',
            type: 'setting',
            title: 'Configuración de Temas',
            category: 'Configuración',
            description: 'Personalizar colores y apariencia',
            path: '/settings'
          }
        ]);
      });

      unsubscribers.push(unsubscribeCompanies);
    } catch (error) {
      console.error('Error configurando listeners:', error);
      setAllData([]);
    }

    // Cleanup
    return () => {
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error limpiando listener:', error);
        }
      });
    };
  }, []);

  // Función para realizar la búsqueda
  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);

    // Filtrar datos basados en la consulta
    const filteredResults = allData.filter(item => {
      const searchTerm = query.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm) ||
        item.beneficiary?.toLowerCase().includes(searchTerm) ||
        item.concept?.toLowerCase().includes(searchTerm) ||
        item.companyName?.toLowerCase().includes(searchTerm)
      );
    });

    setSearchResults(filteredResults);
    setIsSearching(false);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Manejar clic en resultado
  const handleResultClick = (result) => {
    switch (result.type) {
      case 'commitment':
        // Navegar a compromisos
        console.log('Navegando a compromisos...', result);
        window.location.hash = '/commitments';
        break;
      case 'company':
        // Navegar a empresas
        console.log('Navegando a empresas...', result);
        window.location.hash = '/companies';
        break;
      case 'receipt':
        // Navegar a recibos
        console.log('Navegando a recibos...', result);
        window.location.hash = '/receipts';
        break;
      case 'report':
        // Navegar a reportes
        console.log('Navegando a reportes...', result);
        window.location.hash = '/reports';
        break;
      case 'setting':
        // Navegar a configuración
        console.log('Navegando a configuración...', result);
        window.location.hash = result.path || '/settings';
        break;
      default:
        console.log('Tipo de resultado no reconocido', result);
    }

    clearSearch();
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    performSearch,
    clearSearch,
    handleResultClick
  };
};

export default useSearch;
