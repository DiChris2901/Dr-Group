import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  TextField,
  InputAdornment,
  Paper,
  ClickAwayListener,
  Zoom,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

const FloatingSearchButton = ({ sidebarHoverExpanded = false, currentSidebarWidth: propSidebarWidth }) => {
  const theme = useMuiTheme();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef(null);

  // Configuración del sidebar
  const sidebarWidth = settings?.sidebar?.width || 280;
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
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchValue('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      console.log('Buscar:', searchValue);
      // Aquí implementarías la lógica de búsqueda
    }
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
                  placeholder="Buscar compromisos, empresas..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
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
            </Box>
          </ClickAwayListener>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingSearchButton;
