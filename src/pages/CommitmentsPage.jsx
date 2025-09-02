import {
    Add,
    CalendarToday,
    Repeat
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
// Eliminada animación de entrada (se removió framer-motion para el header)
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CommitmentsFilters from '../components/commitments/CommitmentsFilters';
import CommitmentsList from '../components/commitments/CommitmentsList';
import ExtendCommitmentsModal from '../components/commitments/ExtendCommitmentsModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useSettings } from '../context/SettingsContext';
import {
    useThemeGradients
} from '../utils/designSystem.js';
import { checkCommitmentsForExtension } from '../utils/recurringCommitments';

const CommitmentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const gradients = useThemeGradients();
  const { settings } = useSettings();
  const { currentUser, loading: authLoading } = useAuth();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [commitmentsData, setCommitmentsData] = useState([]);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [commitmentsToExtend, setCommitmentsToExtend] = useState(null);
  
  // ✅ NUEVOS ESTADOS PARA SISTEMA DE FILTROS
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    companyFilter: 'all',
    statusFilter: 'all',
    yearFilter: 'all',
    monthFilter: 'all'
  });
  const [filtersApplied, setFiltersApplied] = useState(false);

  // 🔍 Efecto para leer parámetros de búsqueda de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(decodeURIComponent(searchFromUrl));
    }
  }, [location.search]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleCompanyChange = (value) => {
    setCompanyFilter(value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleYearChange = (value) => {
    console.log('🗓️ [PAGE] *** handleYearChange received ***:', value);
    setYearFilter(value);
    // Extraer mes del valor combinado si existe
    if (value.includes('-')) {
      const [year, month] = value.split('-');
      console.log('🗓️ [PAGE] *** Extracting month from yearFilter ***:', { year, month });
      setMonthFilter(month);
    }
  };

  const handleMonthChange = (value) => {
    console.log('🗓️ [PAGE] *** handleMonthChange received ***:', value);
    setMonthFilter(value);
  };

  const handleCommitmentsDataChange = (newCommitmentsData) => {
    setCommitmentsData(newCommitmentsData);
  };

  // ✅ NUEVAS FUNCIONES PARA SISTEMA DE FILTROS
  const handleApplyFilters = () => {
    setAppliedFilters({
      searchTerm,
      companyFilter,
      statusFilter,
      yearFilter,
      monthFilter
    });
    setFiltersApplied(true);
  };

  const handleClearFilters = () => {
  console.log('🧹 [PAGE] *** CLEAR FILTERS ACTION ***');
    setSearchTerm('');
    setCompanyFilter('all');
    setStatusFilter('all');
    setYearFilter('all');
    setMonthFilter('all');
    
    // ✅ Aplicar filtros limpos inmediatamente
    const clearedFilters = {
      searchTerm: '',
      companyFilter: 'all',
      statusFilter: 'all',
      yearFilter: 'all',
      monthFilter: 'all'
    };
    
  // Estado: filtros limpios pero NO aplicados => no se debe cargar nada hasta que el usuario presione "Aplicar Filtros"
  setAppliedFilters(clearedFilters);
  setFiltersApplied(false); // Mantener falso para que shouldLoadData sea false y la lista se vacíe
  };

  const hasFiltersChanged = () => {
    return (
      appliedFilters.searchTerm !== searchTerm ||
      appliedFilters.companyFilter !== companyFilter ||
      appliedFilters.statusFilter !== statusFilter ||
      appliedFilters.yearFilter !== yearFilter ||
      appliedFilters.monthFilter !== monthFilter
    );
  };

  const handleAddCommitment = () => {
    navigate('/commitments/new');
  };

  const handleCheckExtensions = () => {
    if (commitmentsData.length === 0) {
      addNotification({
        type: 'info',
        title: 'Sin Compromisos',
        message: 'No hay compromisos para verificar extensiones.',
        duration: 4000
      });
      return;
    }

    // Verificar compromisos que necesitan extensión
    const extensionData = checkCommitmentsForExtension(commitmentsData, 3);
    
    if (extensionData.needsExtension === 0) {
      addNotification({
        type: 'info',
        title: '✅ Todo al día',
        message: 'No hay compromisos recurrentes que requieran extensión en este momento.',
        duration: 4000
      });
      return;
    }

    // Abrir modal de extensión
    setCommitmentsToExtend(extensionData);
    setExtendModalOpen(true);

    addNotification({
      type: 'info',
      title: '🔄 Extensiones Disponibles',
      message: `Se encontraron ${extensionData.needsExtension} grupos que pueden ser extendidos.`,
      duration: 3000
    });
  };

  const handleCloseExtendModal = () => {
    setExtendModalOpen(false);
    setCommitmentsToExtend(null);
  };

  const handleExtensionComplete = (results) => {
    // Refrescar los datos después de la extensión
    window.location.reload(); // Opción simple para refrescar todo
  };

  // Verificación de autenticación
  if (authLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6">⚠️ No autenticado</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Necesitas iniciar sesión para ver los compromisos.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Header Premium con Gradiente Dinámico */}
  <div>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${settings.theme?.primaryColor || '#667eea'} 0%, ${settings.theme?.secondaryColor || '#764ba2'} 100%)`,
            borderRadius: `${settings.theme?.borderRadius || 16}px`,
            p: settings.theme?.compactMode ? 3 : 4,
            mb: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: `${(settings.theme?.borderRadius || 16) / 2}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CalendarToday sx={{ fontSize: (settings.theme?.fontSize || 16) * 2.3, color: 'white' }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="700" 
                    sx={{ 
                      color: 'white', 
                      mb: 0.5,
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize + 8}px` : '2rem',
                      fontFamily: settings.theme?.fontFamily || 'inherit'
                    }}
                  >
                    Gestión de Compromisos
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize + 2}px` : '1.125rem',
                      fontFamily: settings.theme?.fontFamily || 'inherit'
                    }}
                  >
                    Administra todos tus compromisos financieros empresariales
                  </Typography>
                </Box>
              </Box>
              
              {/* Botones de Acción */}
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddCommitment}
                  size="medium"
                  sx={{
                    py: 1,
                    px: 2.5,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: `${settings.theme?.borderRadius || 16}px`,
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: theme.palette.primary.main,
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                >
                  Nuevo Compromiso
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Repeat />}
                  onClick={handleCheckExtensions}
                  size="medium"
                  sx={{
                    py: 1,
                    px: 2.5,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: `${settings.theme?.borderRadius || 16}px`,
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: theme.palette.primary.main,
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  Verificar Extensiones
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
  </div>

      {/* Filtros con botones de acción */}
      <CommitmentsFilters
        searchTerm={searchTerm}
        companyFilter={companyFilter}
        statusFilter={statusFilter}
        yearFilter={yearFilter}
        monthFilter={monthFilter}
        onSearchChange={handleSearchChange}
        onCompanyChange={handleCompanyChange}
        onStatusChange={handleStatusChange}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        hasFiltersChanged={hasFiltersChanged()}
        filtersApplied={filtersApplied}
      />

      {/* Lista de compromisos con control condicional */}
      <CommitmentsList
        key={filtersApplied ? `${appliedFilters.searchTerm}|${appliedFilters.companyFilter}|${appliedFilters.statusFilter}|${appliedFilters.yearFilter}|${appliedFilters.monthFilter}` : 'pending-filters'}
        searchTerm={appliedFilters.searchTerm}
        companyFilter={appliedFilters.companyFilter}
        statusFilter={appliedFilters.statusFilter}
        yearFilter={appliedFilters.yearFilter}
        monthFilter={appliedFilters.monthFilter}
        viewMode={settings.dashboard?.layout?.viewMode || 'cards'}
        onCommitmentsChange={handleCommitmentsDataChange}
        shouldLoadData={filtersApplied}
        showEmptyState={!filtersApplied}
      />

      {/* Modal de Extensión de Compromisos */}
      <ExtendCommitmentsModal
        open={extendModalOpen}
        onClose={handleCloseExtendModal}
        commitmentsToExtend={commitmentsToExtend}
        onExtensionComplete={handleExtensionComplete}
      />
    </Box>
  );
};

export default CommitmentsPage;
