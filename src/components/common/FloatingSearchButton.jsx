import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  TextField,
  InputAdornment,
  Paper,
  ClickAwayListener,
  Zoom,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Avatar,
  Skeleton,
  Fade,
  Slide
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Assignment as CommitmentIcon,
  Business as CompanyIcon,
  Receipt as ReceiptIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import useSearch from '../../hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import CompanyDetailsModal from '../companies/CompanyDetailsModal';

const FloatingSearchButton = ({ sidebarHoverExpanded = false, currentSidebarWidth: propSidebarWidth }) => {
  const theme = useMuiTheme();
  const { settings } = useSettings();
  const searchHook = useSearch();
  const { searchQuery, searchResults, isSearching, performSearch, clearSearch } = searchHook;
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null); // Estado separado para el modal detallado
  const inputRef = useRef(null);

  // Configuración del sidebar
  const sidebarWidth = settings?.sidebar?.width || 280;
  const sidebarPosition = settings?.sidebar?.position || 'left';
  const isCompactMode = settings?.sidebar?.compactMode || false;

  // Usar el ancho del sidebar desde las props si está disponible, sino calcularlo
  const currentSidebarWidth = propSidebarWidth !== undefined ? propSidebarWidth :
    (isCompactMode ? 80 : (sidebarHoverExpanded ? sidebarWidth : 80));

  // Autoenfoque cuando se abre la búsqueda
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Calcular posición del sidebar y offset
  const getSidebarOffset = () => {
    if (isMobile) return 20;
    return sidebarPosition === 'left' ? currentSidebarWidth + 40 : 20;
  };

  const sidebarOffset = getSidebarOffset();

  // Calcular posición del botón con manejo mejorado
  const getButtonPosition = () => {
    // Posición base original sin interferencia
    const baseOffset = 16; // Posición original

    if (sidebarPosition === 'left') {
      return {
        bottom: baseOffset,
        left: sidebarOffset,
        right: 'auto',
      };
    } else {
      return {
        bottom: baseOffset,
        left: 20,
        right: sidebarOffset,
      };
    }
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchValue('');
    clearSearch();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      performSearch(searchValue.trim());
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Búsqueda en tiempo real
    if (value.trim()) {
      performSearch(value.trim());
    } else {
      clearSearch();
    }
  };

  const handleResultClick = (result) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  const handleNavigateToResult = (result) => {
    // Cerrar modal y búsqueda
    setShowDetailsModal(false);
    handleSearchClose();

    // Navegar según el tipo de resultado con parámetros específicos
    switch (result.type) {
      case 'commitment':
        // Navegar a compromisos filtrado por la empresa del compromiso si existe
        if (result.companyName) {
          navigate('/commitments', { state: { filterCompany: result.companyName, highlightId: result.id } });
        } else {
          navigate('/commitments', { state: { highlightId: result.id } });
        }
        break;
      case 'company':
        // Navegar a compromisos filtrado por esta empresa específica
        navigate('/commitments', {
          state: {
            filterCompany: result.title || result.companyName,
            companyId: result.id,
            fromSearch: true
          }
        });
        break;
      case 'receipt':
        navigate('/receipts', { state: { highlightId: result.id } });
        break;
      case 'report':
        navigate('/reports', { state: { highlightId: result.id } });
        break;
      case 'setting':
        navigate(result.path || '/settings');
        break;
      default:
        console.log('Tipo de resultado no reconocido', result);
    }
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedResult(null);
  };

  const handleCloseCompanyDetailsModal = () => {
    setShowCompanyDetailsModal(false);
    setSelectedCompany(null);
  };

  // Función para obtener el icono según el tipo
  const getResultIcon = (type) => {
    switch (type) {
      case 'commitment':
        return <CommitmentIcon />;
      case 'company':
        return <CompanyIcon />;
      case 'receipt':
        return <ReceiptIcon />;
      case 'report':
        return <ReportIcon />;
      case 'setting':
        return <SettingsIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Función para obtener el color según el tipo
  const getResultColor = (type) => {
    switch (type) {
      case 'commitment':
        return 'primary';
      case 'company':
        return 'secondary';
      case 'receipt':
        return 'success';
      case 'report':
        return 'info';
      case 'setting':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <ClickAwayListener onClickAway={isSearchOpen ? handleSearchClose : () => {}}>
        <Box
          position="fixed"
          sx={{
            ...getButtonPosition(),
            zIndex: 1300,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed',
                  bottom: 86, // Elevado para aparecer arriba del botón (16 + 70)
                  left: sidebarPosition === 'left' ? sidebarOffset : 20,
                  right: sidebarPosition === 'right' ? sidebarOffset : 20,
                  width: isMobile ? 'calc(100vw - 40px)' : '400px',
                  maxWidth: isMobile ? 'calc(100vw - 40px)' : '500px',
                  zIndex: 1400, // Mayor que el botón
                }}
              >
                <Paper
                  elevation={12}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                    backdropFilter: 'blur(20px)',
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(30, 30, 30, 0.95)'
                      : 'rgba(255, 255, 255, 0.95)',
                  }}
                >
                  {/* Campo de búsqueda */}
                  <Box p={2}>
                    <form onSubmit={handleSearchSubmit}>
                      <TextField
                        ref={inputRef}
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar empresas, compromisos, reportes..."
                        value={searchValue}
                        onChange={handleSearchChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: searchValue && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSearchValue('');
                                  clearSearch();
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                            },
                          }
                        }}
                      />
                    </form>
                  </Box>

                  {/* Resultados de búsqueda */}
                  {searchValue && (
                    <Box>
                      <Divider />

                      {isSearching ? (
                        <Box p={3} display="flex" flexDirection="column" gap={1}>
                          {[1, 2, 3].map((i) => (
                            <Box key={i} display="flex" alignItems="center" gap={2}>
                              <Skeleton variant="circular" width={40} height={40} />
                              <Box flex={1}>
                                <Skeleton variant="text" width="70%" />
                                <Skeleton variant="text" width="50%" />
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ) : searchResults.length > 0 ? (
                        <List sx={{ maxHeight: '300px', overflow: 'auto', p: 0 }}>
                          {searchResults.slice(0, 10).map((result, index) => (
                            <ListItem
                              key={result.id || index}
                              button
                              onClick={() => handleResultClick(result)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                                borderLeft: `4px solid ${theme.palette[getResultColor(result.type)]?.main || theme.palette.primary.main}`,
                              }}
                            >
                              <ListItemIcon>
                                <Avatar
                                  sx={{
                                    backgroundColor: theme.palette[getResultColor(result.type)]?.main,
                                    width: 36,
                                    height: 36,
                                  }}
                                >
                                  {getResultIcon(result.type)}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle2" fontWeight="600">
                                    {result.title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary">
                                    {result.description} • {result.category}
                                  </Typography>
                                }
                              />
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={result.category}
                                  size="small"
                                  color={getResultColor(result.type)}
                                  variant="outlined"
                                />
                                <ChevronRightIcon color="action" />
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Box p={3} textAlign="center">
                          <Typography variant="body2" color="text.secondary">
                            No se encontraron resultados para "{searchValue}"
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón flotante */}
          <Zoom in={!isSearchOpen}>
            <Fab
              color="primary"
              onClick={handleSearchToggle}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: theme.shadows[8],
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: theme.shadows[12],
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <SearchIcon />
            </Fab>
          </Zoom>
        </Box>
      </ClickAwayListener>

      {/* Modal de detalles */}
      <Dialog
        open={showDetailsModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(50, 50, 50, 0.95))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 250, 250, 0.95))',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        {selectedResult && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    backgroundColor: theme.palette[getResultColor(selectedResult.type)]?.main,
                    width: 48,
                    height: 48,
                  }}
                >
                  {getResultIcon(selectedResult.type)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="600">
                    {selectedResult.title}
                  </Typography>
                  <Chip
                    label={selectedResult.category}
                    size="small"
                    color={getResultColor(selectedResult.type)}
                    variant="outlined"
                  />
                </Box>
                <IconButton onClick={handleCloseModal}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedResult.description}
              </Typography>

              {/* Información adicional según el tipo */}
              {selectedResult.type === 'commitment' && (
                <Box mt={2}>
                  {selectedResult.amount && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                     <strong>Valor:</strong> {selectedResult.amount}
                    </Typography>
                  )}
                  {selectedResult.beneficiary && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Beneficiario:</strong> {selectedResult.beneficiary}
                    </Typography>
                  )}
                  {selectedResult.dueDate && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Fecha de vencimiento:</strong> {new Date(selectedResult.dueDate).toLocaleDateString()}
                    </Typography>
                  )}
                  {selectedResult.companyName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Empresa:</strong> {selectedResult.companyName}
                    </Typography>
                  )}
                </Box>
              )}

              {selectedResult.type === 'company' && (
                <Box mt={2}>
                  {selectedResult.nit && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>NIT:</strong> {selectedResult.nit}
                    </Typography>
                  )}
                  {selectedResult.status && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Estado:</strong> {selectedResult.status}
                    </Typography>
                  )}
                  {selectedResult.address && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Dirección:</strong> {selectedResult.address}
                    </Typography>
                  )}
                  {selectedResult.phone && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Teléfono:</strong> {selectedResult.phone}
                    </Typography>
                  )}
                  {selectedResult.email && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {selectedResult.email}
                    </Typography>
                  )}
                  {selectedResult.city && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Ciudad:</strong> {selectedResult.city}
                    </Typography>
                  )}
                  {selectedResult.sector && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Sector:</strong> {selectedResult.sector}
                    </Typography>
                  )}
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                variant="outlined"
                onClick={handleCloseModal}
              >
                Cerrar
              </Button>

              {/* Botón adicional para crear compromiso si es empresa */}
              {selectedResult.type === 'company' && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleSearchClose();
                    navigate('/commitments/new', {
                      state: {
                        preselectedCompany: {
                          id: selectedResult.id,
                          name: selectedResult.title || selectedResult.companyName
                        }
                      }
                    });
                  }}
                  sx={{ mr: 1 }}
                >
                  Crear Compromiso
                </Button>
              )}

              {selectedResult.type === 'company' && (
                <Button
                  variant="contained"
                  onClick={() => {
                    // Guardar la empresa seleccionada y abrir el modal detallado
                    setSelectedCompany(selectedResult);
                    setShowDetailsModal(false);
                    setShowCompanyDetailsModal(true);
                  }}
                  startIcon={<InfoIcon />}
                >
                  Ver detalles completos
                </Button>
              )}

              {selectedResult.type !== 'company' && (
                <Button
                  variant="contained"
                  onClick={() => handleNavigateToResult(selectedResult)}
                  startIcon={<ChevronRightIcon />}
                >
                  Ir a lista filtrada
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de detalles completos de empresa */}
      <CompanyDetailsModal
        open={showCompanyDetailsModal}
        onClose={handleCloseCompanyDetailsModal}
        company={selectedCompany}
      />
    </>
  );
};

export default FloatingSearchButton;
