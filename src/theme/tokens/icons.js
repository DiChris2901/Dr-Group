/**
 * 🎯 Organizaci�n RDJ Design System 3.0 - Icon Tokens
 * Tokens de iconos extraídos de la pestaña de íconos establecida
 */

// ========================================
// 📏 ICON SIZE TOKENS - TAMAÑOS DEFINIDOS
// ========================================

export const iconSizeTokens = {
  xs: 16,      // Extra small
  sm: 20,      // Small
  md: 24,      // Medium (default)
  lg: 32,      // Large
  xl: 48,      // Extra large
  '2xl': 64,   // 2X Large
  
  // Aliases semánticos
  small: 18,
  medium: 26,
  large: 30,
  
  // FAB sizes (Floating Action Buttons)
  fab: {
    small: 18,
    medium: 24,
    large: 32
  }
};

// ========================================
// 🎨 ICON CATEGORY TOKENS - CATEGORÍAS DEFINIDAS
// ========================================

export const iconCategoryTokens = {
  // Iconos de navegación
  navigation: {
    icons: ['Dashboard', 'Home', 'Menu', 'Search', 'ArrowBack', 'MoreVert', 'MoreHoriz', 'Close'],
    defaultSize: iconSizeTokens.sm,
    style: {
      fontSize: 20,
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }
  },

  // Iconos de acción
  action: {
    icons: ['Add', 'Edit', 'Delete', 'Save', 'Cancel', 'Share', 'Print', 'Refresh'],
    defaultSize: iconSizeTokens.md,
    style: {
      fontSize: 26,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    colors: {
      Add: 'success.main',
      Edit: 'primary.main', 
      Delete: 'error.main',
      Save: 'success.main',
      Cancel: 'error.main',
      Share: 'info.main',
      Print: 'text.secondary',
      Refresh: 'primary.main'
    }
  },

  // Iconos de estado y feedback
  status: {
    icons: ['CheckCircle', 'Warning', 'Error', 'Info', 'Notifications', 'Security', 'Lock', 'LockOpen'],
    defaultSize: iconSizeTokens.lg,
    style: {
      fontSize: 30,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    colors: {
      CheckCircle: 'success.main',
      Warning: 'warning.main',
      Error: 'error.main', 
      Info: 'info.main',
      Notifications: 'primary.main',
      Security: 'error.main',
      Lock: 'warning.main',
      LockOpen: 'success.main'
    }
  },

  // iconos empresariales Organizaci�n RDJ
  business: {
    icons: ['Business', 'AttachMoney', 'Analytics', 'TrendingUp', 'People', 'Assignment', 'Today', 'EventNote'],
    defaultSize: iconSizeTokens.large,
    style: {
      fontSize: 28,
      transition: 'all 0.25s ease'
    },
    colors: {
      Business: 'primary.main',
      AttachMoney: 'success.main',
      Analytics: 'info.main',
      TrendingUp: 'success.main',
      People: 'secondary.main',
      Assignment: 'warning.main',
      Today: 'primary.main',
      EventNote: 'info.main'
    }
  },

  // Iconos interactivos
  interactive: {
    icons: ['FavoriteBorder', 'Favorite', 'BookmarkBorder', 'Bookmark', 'VisibilityOff', 'Visibility'],
    defaultSize: iconSizeTokens.md,
    style: {
      fontSize: 24,
      transition: 'all 0.2s ease'
    }
  }
};

// ========================================
// 🎭 ICON STYLE TOKENS - ESTILOS DEFINIDOS
// ========================================

export const iconStyleTokens = {
  // Estilo para iconos de navegación
  navigation: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 1.5,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1.5,
      cursor: 'pointer',
      minHeight: 60,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      bgcolor: 'background.paper',
      '&:hover': {
        borderColor: 'primary.main',
        bgcolor: 'action.hover',
        color: 'primary.main',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
      }
    },
    icon: {
      fontSize: 20,
      transition: 'all 0.2s ease',
      mb: 0.5
    },
    label: {
      textAlign: 'center',
      fontWeight: 500,
      fontSize: '0.7rem',
      transition: 'all 0.2s ease',
      lineHeight: 1.2
    }
  },

  // Estilo para iconos de acción
  action: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 2,
      border: '2px solid',
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        color: 'white',
        boxShadow: '0 6px 16px rgba(0,0,0,0.3)'
      }
    },
    icon: {
      fontSize: 26
    },
    label: {
      mt: 1,
      textAlign: 'center',
      fontWeight: 500
    }
  },

  // Estilo para iconos de estado
  status: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 2,
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
        transform: 'translateY(-2px)'
      }
    },
    icon: {
      fontSize: 30
    },
    label: {
      mt: 1,
      textAlign: 'center',
      fontWeight: 500
    }
  },

  // Estilo para iconos empresariales
  business: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 2,
      borderRadius: 2,
      cursor: 'pointer',
      border: '1px solid',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      '&:hover': {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)'
      }
    },
    icon: {
      fontSize: 28,
      mb: 1,
      transition: 'all 0.25s ease'
    },
    label: {
      textAlign: 'center',
      fontWeight: 500,
      fontSize: '0.75rem',
      transition: 'all 0.25s ease'
    }
  }
};

// ========================================
// 🎬 ICON ANIMATION TOKENS - ANIMACIONES DEFINIDAS
// ========================================

export const iconAnimationTokens = {
  // Animaciones para navegación
  navigation: {
    hover: { scale: 1.01, y: -1 },
    tap: { scale: 0.99 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Animaciones para acciones
  action: {
    hover: { scale: 1.03, y: -2 },
    tap: { scale: 0.98 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Animaciones para estados
  status: {
    hover: { scale: 1.04, y: -3 },
    tap: { scale: 0.96 },
    special: {
      rotate: [0, 3, -3, 0], // Para notifications
      duration: 3,
      repeat: Infinity,
      repeatDelay: 4,
      ease: "easeInOut"
    },
    transition: {
      scale: { duration: 0.2, ease: "easeOut" },
      y: { duration: 0.3, ease: "easeOut" }
    }
  },

  // Animaciones para empresariales
  business: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.02, y: -2 },
    tap: { scale: 0.98 },
    iconHover: { scale: 1.05 },
    transition: {
      initial: { duration: 0.3, ease: "easeOut" },
      hover: { duration: 0.25, ease: "easeOut" },
      icon: { duration: 0.2, ease: "easeOut" }
    }
  },

  // Animaciones para interactivos
  interactive: {
    hover: { scale: 1.2 },
    tap: { scale: 0.9 },
    fab: {
      hover: { scale: 1.05, y: -1 },
      tap: { scale: 0.95 }
    }
  }
};

// ========================================
// 💎 FAB TOKENS - FLOATING ACTION BUTTONS
// ========================================

export const fabTokens = {
  sizes: {
    small: {
      width: 40,
      height: 40,
      iconSize: 18
    },
    medium: {
      width: 56,
      height: 56,
      iconSize: 24
    },
    large: {
      width: 72,
      height: 72,
      iconSize: 32
    }
  },
  
  styles: {
    base: {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    },
    gradient: {
      color: 'white',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    }
  }
};

// ========================================
// 🛠️ ICON UTILS
// ========================================

export const iconUtils = {
  /**
   * Obtener tamaño de ícono
   * @param {string} size - Tamaño del ícono
   * @returns {number} Tamaño en pixels
   */
  getSize: (size = 'md') => {
    return iconSizeTokens[size] || iconSizeTokens.md;
  },

  /**
   * Obtener estilo por categoría
   * @param {string} category - Categoría del ícono
   * @returns {Object} Estilos de la categoría
   */
  getCategoryStyle: (category = 'navigation') => {
    return iconStyleTokens[category] || iconStyleTokens.navigation;
  },

  /**
   * Obtener color por ícono y categoría
   * @param {string} iconName - Nombre del ícono
   * @param {string} category - Categoría del ícono
   * @returns {string} Color del ícono
   */
  getIconColor: (iconName, category) => {
    const categoryData = iconCategoryTokens[category];
    return categoryData?.colors?.[iconName] || 'inherit';
  },

  /**
   * Obtener animación por categoría
   * @param {string} category - Categoría del ícono
   * @returns {Object} Configuración de animación
   */
  getAnimation: (category = 'navigation') => {
    return iconAnimationTokens[category] || iconAnimationTokens.navigation;
  },

  /**
   * Crear props para ícono con estilo completo
   * @param {Object} config - Configuración del ícono
   * @returns {Object} Props para el componente
   */
  createIconProps: ({
    name,
    category = 'navigation',
    size = 'md',
    color = null
  }) => {
    const categoryData = iconCategoryTokens[category];
    const finalColor = color || iconUtils.getIconColor(name, category);
    const iconSize = iconUtils.getSize(size);
    
    return {
      sx: {
        fontSize: iconSize,
        color: finalColor,
        ...categoryData?.style
      }
    };
  }
};

export default {
  iconSizeTokens,
  iconCategoryTokens,
  iconStyleTokens,
  iconAnimationTokens,
  fabTokens,
  iconUtils
};
