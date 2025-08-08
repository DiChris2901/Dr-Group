import {
    Add,
    CalendarToday
} from '@mui/icons-material';
import {
    Box,
    Button,
    Paper,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommitmentsFilters from '../components/commitments/CommitmentsFilters';
import CommitmentsList from '../components/commitments/CommitmentsList';
import ExtendCommitmentsModal from '../components/commitments/ExtendCommitmentsModal';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { checkCommitmentsForExtension } from '../utils/recurringCommitments';
import {
    shimmerEffect,
    useThemeGradients
} from '../utils/designSystem.js';

const CommitmentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const gradients = useThemeGradients();
  const { settings } = useSettings();
  const { currentUser, loading: authLoading } = useAuth();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [commitmentsData, setCommitmentsData] = useState([]);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [commitmentsToExtend, setCommitmentsToExtend] = useState(null);

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
    setYearFilter(value);
  };

  const handleCommitmentsDataChange = (newCommitmentsData) => {
    setCommitmentsData(newCommitmentsData);
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
      <motion.div
        initial={settings.theme?.animations ? { opacity: 0, y: -20 } : {}}
        animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={settings.theme?.animations ? { duration: 0.6, type: "spring" } : { duration: 0 }}
      >
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
              
              {/* Botón Nuevo Compromiso */}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddCommitment}
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: `${settings.theme?.borderRadius || 16}px`,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                  }
                }}
              >
                Nuevo Compromiso
              </Button>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Filtros */}
      <CommitmentsFilters
        searchTerm={searchTerm}
        companyFilter={companyFilter}
        statusFilter={statusFilter}
        yearFilter={yearFilter}
        onSearchChange={handleSearchChange}
        onCompanyChange={handleCompanyChange}
        onStatusChange={handleStatusChange}
        onYearChange={handleYearChange}
      />

      {/* Lista de compromisos */}
      <CommitmentsList
        searchTerm={searchTerm}
        companyFilter={companyFilter}
        statusFilter={statusFilter}
        yearFilter={yearFilter}
        viewMode={settings.dashboard?.layout?.viewMode || 'cards'}
        onCommitmentsChange={handleCommitmentsDataChange}
      />
    </Box>
  );
};

export default CommitmentsPage;
