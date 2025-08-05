import {
    Add,
    Assignment,
    CalendarToday
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
import ExtendCommitmentsModal from '../components/commitments/ExtendCommitmentsModal';
import { useSettings } from '../context/SettingsContext';
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
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const handleCommitmentsDataChange = (newCommitmentsData) => {
    setCommitmentsData(newCommitmentsData);
  };

  // Función temporal para probar el modal de extensiones con datos simulados
  const handleTestExtensions = () => {
    console.log('🧪 TEST: Iniciando prueba del modal...');
    
    const simulatedExtensionData = {
      total: 2,
      needsExtension: 2,
      groups: [
        {
          groupId: 'test_group_1',
          concept: 'Nómina Administrativos',
          periodicity: 'monthly',
          companyId: 'company1',
          companyName: 'DiverGames SAS',
          beneficiary: 'Empleados Admin',
          amount: 2500000,
          commitmentsCount: 12,
          lastDueDate: new Date('2025-07-15'),
          commitments: []
        },
        {
          groupId: 'test_group_2',
          concept: 'Arriendo Oficina',
          periodicity: 'monthly',
          companyId: 'company2',
          companyName: 'TechCorp Ltd',
          beneficiary: 'Inmobiliaria XYZ',
          amount: 1800000,
          commitmentsCount: 12,
          lastDueDate: new Date('2025-06-30'),
          commitments: []
        }
      ]
    };
    
    console.log('🧪 TEST: Datos simulados:', simulatedExtensionData);
    console.log('🧪 TEST: Estado actual extendModalOpen:', extendModalOpen);
    console.log('🧪 TEST: Estado actual commitmentsToExtend:', commitmentsToExtend);
    
    setCommitmentsToExtend(simulatedExtensionData);
    setExtendModalOpen(true);
    
    console.log('🧪 TEST: Estados actualizados - Modal debería abrirse');
    
    // Verificar después de un momento
    setTimeout(() => {
      console.log('🧪 TEST: Verificación post-actualización:');
      console.log('  - extendModalOpen:', extendModalOpen);
      console.log('  - commitmentsToExtend:', commitmentsToExtend);
    }, 100);
  };

  const handleAddCommitment = () => {
    // Navegar a la página de nuevo compromiso
    navigate('/commitments/new');
  };

  const handleCheckExtensions = () => {
    console.log('🔍 Verificando extensiones...');
    console.log('📊 Datos de compromisos:', commitmentsData);
    console.log('📋 Total compromisos:', commitmentsData.length);
    
    if (commitmentsData.length === 0) {
      addNotification({
        type: 'info',
        title: 'Sin Compromisos',
        message: 'No hay compromisos para verificar extensiones.',
        duration: 4000
      });
      return;
    }

    // Mostrar algunos compromisos de ejemplo para depuración
    if (commitmentsData.length > 0) {
      console.log('🔬 Ejemplo de compromiso:', {
        concept: commitmentsData[0].concept,
        isRecurring: commitmentsData[0].isRecurring,
        recurringGroup: commitmentsData[0].recurringGroup,
        periodicity: commitmentsData[0].periodicity,
        dueDate: commitmentsData[0].dueDate
      });
    }

    const extensionCheck = checkCommitmentsForExtension(commitmentsData, 3);
    console.log('🎯 Resultado verificación:', extensionCheck);
    
    // Verificar si hay compromisos recurrentes en general (no solo los que necesitan extensión)
    const recurringCommitments = commitmentsData.filter(c => c.isRecurring && c.recurringGroup);
    console.log('🔄 Compromisos recurrentes encontrados:', recurringCommitments.length);
    
    if (recurringCommitments.length === 0) {
      addNotification({
        type: 'info',
        title: '📋 Sin Compromisos Recurrentes',
        message: 'No se encontraron compromisos recurrentes para extender. Crea compromisos con periodicidad para usar esta función.',
        duration: 6000
      });
      return;
    }
    
    if (extensionCheck.needsExtension === 0) {
      // Si hay compromisos recurrentes pero no necesitan extensión, forzar apertura del modal
      console.log('🔄 Forzando apertura del modal para compromisos recurrentes...');
      
      addNotification({
        type: 'info',
        title: '� Abriendo Extensión Manual',
        message: `Se encontraron ${recurringCommitments.length} compromisos recurrentes. Abriendo opciones de extensión...`,
        duration: 3000
      });
      
      // Forzar la apertura del modal con todos los grupos recurrentes usando fecha pasada
      const forcedExtensionCheck = checkCommitmentsForExtension(commitmentsData, -12);
      console.log('🎯 Datos forzados para modal:', forcedExtensionCheck);
      
      if (forcedExtensionCheck.needsExtension > 0) {
        console.log('✅ Abriendo modal con datos forzados');
        setCommitmentsToExtend(forcedExtensionCheck);
        setExtendModalOpen(true);
      } else {
        console.log('❌ No se pudieron forzar datos para el modal');
        addNotification({
          type: 'error',
          title: 'Error en Extensión',
          message: 'No se pudieron procesar los compromisos recurrentes para extensión.',
          duration: 5000
        });
      }
    } else {
      console.log('✅ Abriendo modal con extensiones necesarias');
      setCommitmentsToExtend(extensionCheck);
      setExtendModalOpen(true);
    }
  };

  const handleExtensionComplete = (results) => {
    // Refrescar la lista de compromisos después de la extensión
    // En una aplicación real, esto activaría un refetch de los datos
    console.log('Extension completed:', results);
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
              
              {/* Botones de Acción */}
              <Box display="flex" gap={2}>
                {/* Botón Verificar Extensiones */}
                <motion.div
                  initial={settings.theme?.animations ? { x: 20, opacity: 0 } : {}}
                  animate={settings.theme?.animations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  transition={settings.theme?.animations ? { delay: 0.2, duration: 0.5 } : { duration: 0 }}
                  whileHover={settings.theme?.animations ? { scale: 1.05 } : {}}
                  whileTap={settings.theme?.animations ? { scale: 0.95 } : {}}
                >
                  <Button
                    variant="outlined"
                    startIcon={<CalendarToday />}
                    onClick={handleCheckExtensions}
                    size={settings.theme?.compactMode ? "medium" : "large"}
                    sx={{
                      py: settings.theme?.compactMode ? 1 : 1.5,
                      px: settings.theme?.compactMode ? 2.5 : 3.5,
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize * 1}px` : '1rem',
                      fontWeight: 600,
                      fontFamily: settings.theme?.fontFamily || 'inherit',
                      borderRadius: `${settings.theme?.borderRadius || 16}px`,
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      color: 'white',
                      textTransform: 'none',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                  >
                    Extender
                  </Button>
                </motion.div>

                {/* Botón de Prueba Temporal - REMOVER EN PRODUCCIÓN */}
                <motion.div
                  initial={settings.theme?.animations ? { x: 25, opacity: 0 } : {}}
                  animate={settings.theme?.animations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  transition={settings.theme?.animations ? { delay: 0.25, duration: 0.5 } : { duration: 0 }}
                  whileHover={settings.theme?.animations ? { scale: 1.05 } : {}}
                  whileTap={settings.theme?.animations ? { scale: 0.95 } : {}}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Assignment />}
                    onClick={handleTestExtensions}
                    size="medium"
                    sx={{
                      py: 1,
                      px: 2,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      borderRadius: `${settings.theme?.borderRadius || 16}px`,
                      border: '1px solid rgba(255, 193, 7, 0.5)',
                      color: 'rgba(255, 193, 7, 0.9)',
                      textTransform: 'none',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'rgba(255, 193, 7, 0.1)',
                        borderColor: 'rgba(255, 193, 7, 0.8)',
                        color: 'rgba(255, 193, 7, 1)'
                      }
                    }}
                  >
                    🧪 Test
                  </Button>
                </motion.div>

                {/* Botón Nuevo Compromiso */}
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
          onCommitmentsChange={handleCommitmentsDataChange}
        />
      </motion.div>

      {/* Modal de Extensión de Compromisos */}
      {commitmentsToExtend && (
        <>
          {console.log('🎭 RENDER: Modal ExtendCommitmentsModal renderizándose:', {
            open: extendModalOpen,
            commitmentsToExtend: commitmentsToExtend,
            groupsCount: commitmentsToExtend.groups?.length
          })}
          <ExtendCommitmentsModal
            open={extendModalOpen}
            onClose={() => {
              console.log('🎭 MODAL: Cerrando modal');
              setExtendModalOpen(false);
              setCommitmentsToExtend(null);
            }}
            commitmentsData={commitmentsToExtend}
            onExtensionComplete={(result) => {
              console.log('🎉 Extensión completada:', result);
              addNotification({
                type: 'success',
                title: '✅ Extensión Exitosa',
                message: `Se han extendido ${result.totalExtended} compromisos recurrentes.`,
                duration: 5000
              });
              setExtendModalOpen(false);
              setCommitmentsToExtend(null);
              // Recargar la lista de compromisos
              window.location.reload();
            }}
          />
        </>
      )}
    </Box>
  );
};

export default CommitmentsPage;