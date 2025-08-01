import { useState, useEffect } from 'react';

const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Datos mock para la búsqueda (aquí puedes conectar con tu base de datos)
  const mockData = [
    // Compromisos
    { 
      id: 1, 
      type: 'commitment', 
      title: 'Pago de Nómina Enero 2025', 
      category: 'Compromisos',
      description: 'Pago mensual de nómina del personal',
      amount: '$15,000',
      dueDate: '2025-01-31'
    },
    { 
      id: 2, 
      type: 'commitment', 
      title: 'Alquiler Oficina Principal', 
      category: 'Compromisos',
      description: 'Pago mensual del alquiler',
      amount: '$8,500',
      dueDate: '2025-01-15'
    },
    { 
      id: 3, 
      type: 'commitment', 
      title: 'Servicios Públicos', 
      category: 'Compromisos',
      description: 'Pago de electricidad, agua y gas',
      amount: '$2,300',
      dueDate: '2025-01-20'
    },
    
    // Empresas
    { 
      id: 4, 
      type: 'company', 
      title: 'DR Group Holdings', 
      category: 'Empresas',
      description: 'Empresa matriz del grupo',
      status: 'Activa'
    },
    { 
      id: 5, 
      type: 'company', 
      title: 'DR Tech Solutions', 
      category: 'Empresas',
      description: 'División tecnológica',
      status: 'Activa'
    },
    { 
      id: 6, 
      type: 'company', 
      title: 'DR Consulting', 
      category: 'Empresas',
      description: 'Servicios de consultoría',
      status: 'Activa'
    },
    
    // Usuarios
    { 
      id: 7, 
      type: 'user', 
      title: 'Diego Rodriguez', 
      category: 'Usuarios',
      description: 'Director Ejecutivo',
      email: 'diego@drgroup.com'
    },
    { 
      id: 8, 
      type: 'user', 
      title: 'Ana Martinez', 
      category: 'Usuarios',
      description: 'Gerente Financiera',
      email: 'ana@drgroup.com'
    },
    
    // Reportes
    { 
      id: 9, 
      type: 'report', 
      title: 'Reporte Financiero Q1 2025', 
      category: 'Reportes',
      description: 'Análisis financiero del primer trimestre',
      date: '2025-01-15'
    },
    { 
      id: 10, 
      type: 'report', 
      title: 'Estado de Compromisos Enero', 
      category: 'Reportes',
      description: 'Resumen de compromisos del mes',
      date: '2025-01-21'
    },
    
    // Configuraciones
    { 
      id: 11, 
      type: 'setting', 
      title: 'Configuración de Temas', 
      category: 'Configuración',
      description: 'Personalizar colores y apariencia',
      path: '/settings'
    },
    { 
      id: 12, 
      type: 'setting', 
      title: 'Gestión de Usuarios', 
      category: 'Configuración',
      description: 'Administrar permisos y roles',
      path: '/users'
    },
  ];

  // Función para realizar la búsqueda
  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simular delay de búsqueda para mostrar loading
    setTimeout(() => {
      const results = mockData.filter(item => {
        const searchTerm = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.type.toLowerCase().includes(searchTerm)
        );
      });
      
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleResultClick = (result) => {
    console.log('🔍 Resultado seleccionado:', result);
    
    // Aquí puedes implementar la navegación según el tipo
    switch (result.type) {
      case 'commitment':
        // Navegar a la página de compromisos con filtro
        console.log('Navegando a compromisos...');
        break;
      case 'company':
        // Navegar a la página de empresas
        console.log('Navegando a empresas...');
        break;
      case 'user':
        // Navegar al perfil del usuario
        console.log('Navegando a perfil de usuario...');
        break;
      case 'report':
        // Navegar a reportes
        console.log('Navegando a reportes...');
        break;
      case 'setting':
        // Navegar a configuración
        window.location.hash = result.path || '/settings';
        break;
      default:
        console.log('Tipo de resultado no reconocido');
    }
    
    clearSearch();
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    handleResultClick
  };
};

export default useSearch;
