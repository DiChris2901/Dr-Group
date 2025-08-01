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
    // Usar la misma altura que el botón de la derecha para alineación paralela
    const baseOffset = 16; // Misma altura que el FAB de la derecha

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
  const sidebarPosition = settings?.sidebar?.position || 'left';
  const isCompactMode = settings?.sidebar?.compactMode || false;
  
  // Usar el ancho del sidebar desde las props si está disponible, sino calcularlo
  const currentSidebarWidth = propSidebarWidth !== undefined 
    ? propSidebarWidth 
    : (isCompactMode ? (sidebarHoverExpanded ? sidebarWidth : 72) : sidebarWidth);
  
  // Obtener colores del tema actual
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const isDarkMode = theme.palette.mode === 'dark';

  // Calcular posición dinámica del botón
  const getButtonPosition = () => {
    if (isMobile) {
      return {
        bottom: 20,
        right: 20,
      };
    }

    const baseOffset = 20;
    const sidebarOffset = currentSidebarWidth + 20; // 20px de separación del sidebar

    if (sidebarPosition === 'left') {
      return {
        bottom: baseOffset,
        left: sidebarOffset,
      };
    } else {
      return {
        bottom: baseOffset,
        right: sidebarOffset,
      };
    }
  };

  // Calcular posición de la barra de búsqueda expandida
  const getSearchBarPosition = () => {
    if (isMobile) {
      return {
        bottom: 90,
        left: 20,
        right: 20,
      };
    }

    const baseOffset = 90; // Altura del botón + espacio
    const sidebarOffset = currentSidebarWidth + 20;

    if (sidebarPosition === 'left') {
      return {
        bottom: baseOffset,
        left: sidebarOffset,
        right: 20,
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
    if (!isSearchOpen) {
      // Al abrir, limpiar búsqueda anterior
      clearSearch();
    }
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    clearSearch();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('🔍 Búsqueda realizada:', searchQuery);
      // La búsqueda se maneja automáticamente por el hook useSearch
    }
  };

  const handleResultSelect = (result) => {
    handleResultClick(result);
    setIsSearchOpen(false);
  };

  // Enfocar el input cuando se abre la búsqueda
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300); // Esperar a que termine la animación
    }
  }, [isSearchOpen]);

  const buttonPosition = getButtonPosition();
  const searchBarPosition = getSearchBarPosition();

  return (
    <>
      {/* Botón flotante */}
      <Zoom in={!isSearchOpen}>
        <Fab
          color="primary"
          onClick={handleSearchToggle}
          sx={{
            position: 'fixed',
            zIndex: 1400,
            ...buttonPosition,
            backgroundColor: primaryColor,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              transform: 'scale(1.1)',
            },
            transition: theme.transitions.create(['transform', 'left', 'right', 'bottom'], {
              easing: theme.transitions.easing.easeInOut,
              duration: sidebarHoverExpanded 
                ? theme.transitions.duration.enteringScreen 
                : theme.transitions.duration.leavingScreen,
            }),
            boxShadow: theme.shadows[6],
          }}
        >
          <SearchIcon />
        </Fab>
      </Zoom>

      {/* Barra de búsqueda expandida */}
      <AnimatePresence>
        {isSearchOpen && (
          <ClickAwayListener onClickAway={handleSearchClose}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              sx={{
                position: 'fixed',
                zIndex: 1400,
                ...searchBarPosition,
                transition: theme.transitions.create(['left', 'right'], {
                  easing: theme.transitions.easing.easeInOut,
                  duration: sidebarHoverExpanded 
                    ? theme.transitions.duration.enteringScreen 
                    : theme.transitions.duration.leavingScreen,
                }),
              }}
            >
              <Paper
                component="form"
                onSubmit={handleSearchSubmit}
                sx={{
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 3,
                  boxShadow: theme.shadows[8],
                  backgroundColor: isDarkMode 
                    ? 'rgba(18, 18, 18, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <TextField
                  ref={inputRef}
                  placeholder="Buscar compromisos, empresas, usuarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: 'none',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover fieldset': {
                        border: 'none',
                      },
                      '&.Mui-focused fieldset': {
                        border: 'none',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: isDarkMode ? 'white' : 'text.primary',
                      '&::placeholder': {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        opacity: 1,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                          mr: 1
                        }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box
                          component="button"
                          type="button"
                          onClick={handleSearchClose}
                          sx={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 0.5,
                            borderRadius: '50%',
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            },
                            transition: theme.transitions.create('background-color'),
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                />
              </Paper>

              {/* Resultados de búsqueda */}
              {searchQuery.trim() && (searchResults.length > 0 || isSearching) && (
                <Paper
                  sx={{
                    mt: 1,
                    maxHeight: 400,
                    overflow: 'auto',
                    borderRadius: 2,
                    boxShadow: theme.shadows[8],
                    backgroundColor: isDarkMode 
                      ? 'rgba(18, 18, 18, 0.95)' 
                      : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {isSearching ? (
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Buscando...
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ py: 0 }}>
                      {searchResults.map((result, index) => {
                        const getIcon = (type) => {
                          switch (type) {
                            case 'commitment': return <AssignmentIcon />;
                            case 'company': return <BusinessIcon />;
                            case 'user': return <PersonIcon />;
                            case 'report': return <ReportIcon />;
                            case 'setting': return <SettingsIcon />;
                            default: return <SearchIcon />;
                          }
                        };

                        const getTypeColor = (type) => {
                          switch (type) {
                            case 'commitment': return 'primary';
                            case 'company': return 'secondary';
                            case 'user': return 'success';
                            case 'report': return 'info';
                            case 'setting': return 'warning';
                            default: return 'default';
                          }
                        };

                        return (
                          <React.Fragment key={result.id}>
                            <ListItem
                              button
                              onClick={() => handleResultSelect(result)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.05)' 
                                    : 'rgba(0, 0, 0, 0.04)',
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                {getIcon(result.type)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.primary">
                                      {result.title}
                                    </Typography>
                                    <Chip
                                      label={result.category}
                                      size="small"
                                      color={getTypeColor(result.type)}
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem', height: 20 }}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {result.description}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < searchResults.length - 1 && (
                              <Divider sx={{ ml: 5 }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingSearchButton;
