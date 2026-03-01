/**
 * 📱 Organizaci�n RDJ Design System 3.0 - Header Tokens
 * Tokens de headers extraídos de la pestaña de headers establecida
 */

// ========================================
// 🎯 HEADER TYPES - TIPOS PRINCIPALES
// ========================================

export const headerTypeTokens = {
  // Header Principal de Dashboard
  dashboard: {
    padding: '20px',
    backgroundColor: 'background.paper',
    borderBottom: '1px solid',
    borderColor: 'divider',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    
    title: {
      variant: 'h6',
      fontWeight: 600,
      color: 'text.primary',
      lineHeight: 1.2
    },
    
    subtitle: {
      variant: 'caption',
      color: 'text.secondary',
      fontWeight: 500
    },
    
    statusBar: {
      padding: '12px 20px',
      backgroundColor: 'grey.50',
      borderTop: '1px solid',
      borderColor: 'divider'
    },
    
    actions: {
      iconButton: {
        size: 'medium',
        color: 'text.secondary',
        '&:hover': {
          backgroundColor: 'action.hover',
          color: 'primary.main'
        }
      }
    }
  },

  // Header Ejecutivo con Gradiente
  executive: {
    background: 'linear-gradient(135deg, #2196f3 0%, #9c27b0 100%)',
    color: 'white',
    padding: '24px',
    position: 'relative',
    
    title: {
      variant: 'h5',
      fontWeight: 600,
      marginBottom: '4px'
    },
    
    subtitle: {
      variant: 'body2',
      opacity: 0.9,
      fontWeight: 400
    },
    
    actions: {
      iconButton: {
        color: 'white',
        backgroundColor: 'rgba(255,255,255,0.1)',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.2)',
          transform: 'translateX(-2px)'
        },
        transition: 'all 0.2s ease'
      },
      
      avatar: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        border: '2px solid rgba(255,255,255,0.3)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.3)',
          transform: 'translateY(-1px)'
        }
      }
    },
    
    statusIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      borderRadius: '24px',
      backgroundColor: 'rgba(255,255,255,0.15)',
      
      dot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: '#4caf50'
      },
      
      text: {
        color: 'white',
        fontWeight: 500,
        fontSize: '0.75rem'
      }
    },
    
    confidentialTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      color: 'primary.main',
      fontWeight: 600,
      fontSize: '0.7rem',
      border: '1px solid',
      borderColor: 'rgba(37, 99, 235, 0.2)',
      '&:hover': {
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        borderColor: 'rgba(37, 99, 235, 0.3)'
      }
    }
  },

  // Header de Gestión Empresarial
  management: {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '16px',
      backgroundColor: 'grey.50',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '8px',
      position: 'relative'
    },
    
    indicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '4px',
      height: '100%',
      backgroundColor: 'primary.main',
      borderRadius: '0 2px 2px 0'
    },
    
    breadcrumb: {
      text: {
        color: 'text.secondary',
        textTransform: 'uppercase',
        fontWeight: 600,
        letterSpacing: 0.5,
        fontSize: '0.6875rem'
      },
      active: {
        color: 'primary.main',
        fontWeight: 600,
        fontSize: '0.6875rem'
      }
    },
    
    title: {
      variant: 'h6',
      fontWeight: 700,
      marginBottom: '4px',
      color: 'text.primary',
      lineHeight: 1.3
    },
    
    description: {
      color: 'text.secondary',
      fontSize: '0.85rem',
      lineHeight: 1.4
    },
    
    metrics: {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        backgroundColor: 'background.paper',
        padding: '8px 16px',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'divider'
      },
      
      item: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      },
      
      dot: {
        width: 6,
        height: 6,
        borderRadius: '50%'
      },
      
      value: {
        fontWeight: 600,
        color: 'text.primary',
        fontSize: '0.75rem'
      }
    },
    
    actions: {
      primary: {
        variant: 'contained',
        size: 'small',
        backgroundColor: 'primary.main',
        fontSize: '0.8rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          backgroundColor: 'primary.dark',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      },
      
      secondary: {
        variant: 'outlined',
        size: 'small',
        borderColor: 'divider',
        color: 'text.secondary',
        fontSize: '0.8rem',
        '&:hover': {
          borderColor: 'primary.main',
          color: 'primary.main',
          backgroundColor: 'primary.50'
        }
      },
      
      icon: {
        size: 'small',
        color: 'text.secondary',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        width: 28,
        height: 28,
        '&:hover': {
          color: 'primary.main',
          borderColor: 'primary.main',
          backgroundColor: 'primary.50'
        }
      }
    },
    
    statusBar: {
      padding: '16px 24px',
      backgroundColor: 'background.paper',
      borderTop: '1px solid',
      borderColor: 'divider',
      
      chip: {
        borderColor: 'primary.main',
        color: 'primary.main',
        backgroundColor: 'primary.50',
        size: 'small',
        variant: 'outlined'
      }
    }
  }
};

// ========================================
// 🎭 HEADER COMPONENT TOKENS
// ========================================

export const headerComponentTokens = {
  // Componentes comunes en headers
  logo: {
    height: 32,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.02)'
    }
  },
  
  menuButton: {
    color: 'text.primary',
    '&:hover': {
      backgroundColor: 'action.hover',
      color: 'primary.main'
    }
  },
  
  searchButton: {
    color: 'text.secondary',
    '&:hover': {
      backgroundColor: 'action.hover',
      color: 'primary.main'
    }
  },
  
  notificationBadge: {
    badgeContent: {
      backgroundColor: 'error.main',
      color: 'white',
      fontWeight: 600
    }
  },
  
  statusDot: {
    active: {
      backgroundColor: 'success.main'
    },
    inactive: {
      backgroundColor: 'error.main'
    },
    warning: {
      backgroundColor: 'warning.main'
    }
  }
};

// ========================================
// 🎬 HEADER ANIMATION TOKENS
// ========================================

export const headerAnimationTokens = {
  // Animaciones para headers
  fadeInDown: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  fadeInDownDeep: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  
  buttonHover: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  },
  
  iconButtonHover: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  },
  
  avatarHover: {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98 }
  }
};

// ========================================
// 📐 HEADER LAYOUT TOKENS
// ========================================

export const headerLayoutTokens = {
  heights: {
    compact: 56,
    standard: 64,
    extended: 80,
    executive: 96
  },
  
  breakpoints: {
    mobile: {
      padding: '12px 16px',
      gap: '8px'
    },
    tablet: {
      padding: '16px 20px',
      gap: '12px'
    },
    desktop: {
      padding: '20px 24px',
      gap: '16px'
    }
  },
  
  zIndex: {
    header: 1100,
    dropdown: 1200,
    modal: 1300
  }
};

// ========================================
// 🛠️ HEADER UTILS
// ========================================

export const headerUtils = {
  /**
   * Obtener configuración por tipo de header
   * @param {string} type - Tipo de header (dashboard, executive, management)
   * @returns {Object} Configuración del header
   */
  getHeaderType: (type = 'dashboard') => {
    return headerTypeTokens[type] || headerTypeTokens.dashboard;
  },

  /**
   * Obtener componentes por nombre
   * @param {string} component - Nombre del componente
   * @returns {Object} Configuración del componente
   */
  getComponent: (component) => {
    return headerComponentTokens[component] || {};
  },

  /**
   * Obtener animación por nombre
   * @param {string} animation - Nombre de la animación
   * @returns {Object} Configuración de animación
   */
  getAnimation: (animation = 'fadeInDown') => {
    return headerAnimationTokens[animation] || headerAnimationTokens.fadeInDown;
  },

  /**
   * Obtener altura por dispositivo
   * @param {string} size - Tamaño del header
   * @returns {number} Altura en pixels
   */
  getHeight: (size = 'standard') => {
    return headerLayoutTokens.heights[size] || headerLayoutTokens.heights.standard;
  },

  /**
   * Crear props completos para header
   * @param {Object} config - Configuración del header
   * @returns {Object} Props para el componente
   */
  createHeaderProps: ({
    type = 'dashboard',
    height = 'standard',
    animation = 'fadeInDown'
  }) => {
    const typeConfig = headerUtils.getHeaderType(type);
    const heightValue = headerUtils.getHeight(height);
    const animationConfig = headerUtils.getAnimation(animation);
    
    return {
      sx: {
        height: heightValue,
        ...typeConfig.container
      },
      ...animationConfig
    };
  }
};

export default {
  headerTypeTokens,
  headerComponentTokens,
  headerAnimationTokens,
  headerLayoutTokens,
  headerUtils
};
