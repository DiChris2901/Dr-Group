import {
    Add,
    Assignment
} from '@mui/icons-material';
import {
    Box,
    Button,
    Paper,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommitmentsFilters from '../components/commitments/CommitmentsFilters';
import CommitmentsList from '../components/commitments/CommitmentsList';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';
import {
    shimmerEffect,
    useThemeGradients
} from '../utils/designSystem.js';

const CommitmentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const gradients = useThemeGradients();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleCompanyChange = (value) => {
    setCompanyFilter(value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleAddCommitment = () => {
    // Navegar a la página de nuevo compromiso
    navigate('/commitments/new');
  };

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
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: `${settings.theme?.borderRadius || 16}px`,
              zIndex: 0,
            }
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
                  <Assignment sx={{ fontSize: (settings.theme?.fontSize || 16) * 2.3, color: 'white' }} />
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
                    Administra todos tus compromisos financieros empresariales con elegancia y control total
                  </Typography>
                </Box>
              </Box>
              
              {/* Botón Nuevo Compromiso dentro del Banner */}
              <motion.div
                initial={settings.theme?.animations ? { x: 30, opacity: 0 } : {}}
                animate={settings.theme?.animations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                transition={settings.theme?.animations ? { delay: 0.3, duration: 0.5 } : { duration: 0 }}
                whileHover={settings.theme?.animations ? { scale: 1.05 } : {}}
                whileTap={settings.theme?.animations ? { scale: 0.95 } : {}}
              >
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddCommitment}
                  size={settings.theme?.compactMode ? "medium" : "large"}
                  sx={{
                    py: settings.theme?.compactMode ? 1 : 1.5,
                    px: settings.theme?.compactMode ? 3 : 4,
                    fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize * 1.1}px` : '1.1rem',
                    fontWeight: 700,
                    fontFamily: settings.theme?.fontFamily || 'inherit',
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
              </motion.div>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={settings.theme?.animations ? { opacity: 0, y: 20 } : {}}
        animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={settings.theme?.animations ? { duration: 0.3, delay: 0.2 } : { duration: 0 }}
      >
        <CommitmentsFilters
          searchTerm={searchTerm}
          companyFilter={companyFilter}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onCompanyChange={handleCompanyChange}
          onStatusChange={handleStatusChange}
        />
      </motion.div>

      {/* Lista de compromisos */}
      <motion.div
        initial={settings.theme?.animations ? { opacity: 0, y: 20 } : {}}
        animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={settings.theme?.animations ? { duration: 0.3, delay: 0.3 } : { duration: 0 }}
      >
        <CommitmentsList
          searchTerm={searchTerm}
          companyFilter={companyFilter}
          statusFilter={statusFilter}
          viewMode={settings.dashboard?.layout?.viewMode || 'cards'}
        />
      </motion.div>
    </Box>
  );
};

export default CommitmentsPage;