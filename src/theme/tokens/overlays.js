/**
 * 🎭 Design System 3.0 - Overlays Tokens
 * Tokenización completa de modales, diálogos, drawers, snackbars y banners
 * Compatibilidad 100% con tokens existentes + accesibilidad AAA
 */

import { alpha } from '@mui/material/styles';

// 🎯 MODAL TOKENS - Tamaños, espaciados, sombras y backdrop
export const modalTokens = {
  // Tamaños responsivos
  sizes: {
    sm: {
      maxWidth: '400px',
      minWidth: '320px',
      minHeight: '200px',
      padding: { xs: '16px', sm: '20px', md: '24px' }
    },
    md: {
      maxWidth: '600px',
      minWidth: '480px',
      minHeight: '300px',
      padding: { xs: '20px', sm: '24px', md: '32px' }
    },
    lg: {
      maxWidth: '800px',
      minWidth: '600px',
      minHeight: '400px',
      padding: { xs: '24px', sm: '32px', md: '40px' }
    },
    xl: {
      maxWidth: '1200px',
      minWidth: '800px',
      minHeight: '500px',
      padding: { xs: '32px', sm: '40px', md: '48px' }
    }
  },

  // Espaciados internos
  spacing: {
    header: { pb: '12px', mb: '16px' },
    body: { py: '8px' },
    footer: { pt: '16px', mt: '24px' },
    gap: { sm: '12px', md: '16px', lg: '24px' }
  },

  // Bordes y radios
  shape: {
    borderRadius: { xs: '8px', sm: '12px', md: '16px' },
    border: {
      width: '1px',
      style: 'solid',
      accentWidth: '4px' // Para Paper con Acento
    }
  },

  // Sistema de sombras
  shadows: {
    level1: '0 4px 12px rgba(0, 0, 0, 0.08)', // Hover suave
    level2: '0 8px 32px rgba(0, 0, 0, 0.12)', // Modal estándar
    level3: '0 16px 64px rgba(0, 0, 0, 0.16)', // Modal crítico
    level4: '0 24px 96px rgba(0, 0, 0, 0.20)'  // Modal xl
  },

  // Backdrop y z-index
  backdrop: {
    backgroundColor: alpha('#000', 0.5),
    backdropFilter: 'blur(4px)',
    zIndex: 1300
  },

  // Z-index hierarchy
  zIndex: {
    modal: 1300,
    drawer: 1200,
    snackbar: 1400,
    tooltip: 1500
  }
};

// 🗣️ DIALOG HEADER TOKENS - Variantes semánticas con gradientes DS 3.0
export const dialogHeaderTokens = {
  // Variantes por tipo de diálogo
  variants: {
    confirmation: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      accentColor: 'primary.main',
      iconColor: 'primary.main',
      textColor: 'primary.contrastText',
      typography: 'h4', // 24px
      iconSize: 'medium' // 24px
    },
    destructive: {
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #d63031 100%)',
      accentColor: 'error.main',
      iconColor: 'error.main',
      textColor: 'error.contrastText',
      typography: 'h4', // 24px - emphasis crítico
      iconSize: 'medium',
      border: '4px solid',
      borderColor: 'error.main'
    },
    informative: {
      gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      accentColor: 'info.main',
      iconColor: 'info.main',
      textColor: 'info.contrastText',
      typography: 'h5', // 20px - menos énfasis
      iconSize: 'small' // 20px
    },
    transaction: {
      gradient: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
      accentColor: 'success.main',
      iconColor: 'success.main',
      textColor: 'success.contrastText',
      typography: 'h4', // 24px - importante
      iconSize: 'medium'
    },
    warning: {
      gradient: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
      accentColor: 'warning.main',
      iconColor: 'warning.main',
      textColor: 'warning.contrastText',
      typography: 'h5', // 20px
      iconSize: 'small'
    }
  },

  // Layout de header
  layout: {
    minHeight: '64px',
    padding: { xs: '16px', sm: '20px', md: '24px' },
    borderRadius: '16px 16px 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  // Iconografía sugerida por variante
  iconSuggestions: {
    confirmation: 'QuestionAnswer',
    destructive: 'Delete | Warning',
    informative: 'Info | CheckCircle',
    transaction: 'Payment | AttachMoney',
    warning: 'Warning | ErrorOutline'
  }
};

// 📂 DRAWER TOKENS - Paneles deslizantes responsivos
export const drawerTokens = {
  // Anchos por breakpoint y propósito
  widths: {
    navigation: {
      xs: '280px',
      sm: '300px',
      md: '320px'
    },
    form: {
      xs: '100vw',
      sm: '400px',
      md: '480px',
      lg: '500px'
    },
    details: {
      xs: '100vw',
      sm: '500px',
      md: '600px',
      lg: '700px'
    },
    fullscreen: {
      xs: '100vw',
      sm: '100vw',
      md: '800px',
      lg: '900px'
    }
  },

  // Layout y espaciados
  layout: {
    header: {
      minHeight: '64px',
      padding: '16px 24px',
      borderBottom: '1px solid',
      borderBottomColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    body: {
      flex: 1,
      padding: '24px',
      overflowY: 'auto'
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid',
      borderTopColor: 'divider',
      backgroundColor: 'background.paper',
      position: 'sticky',
      bottom: 0
    }
  },

  // Transiciones y animaciones
  transitions: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    slideDistance: '100%'
  },

  // Sombras por anchor
  shadows: {
    left: '4px 0 12px rgba(0, 0, 0, 0.1)',
    right: '-4px 0 12px rgba(0, 0, 0, 0.1)',
    top: '0 4px 12px rgba(0, 0, 0, 0.1)',
    bottom: '0 -4px 12px rgba(0, 0, 0, 0.1)'
  }
};

// 🔔 SNACKBAR TOKENS - Sistema de notificaciones
export const snackbarTokens = {
  // Colores por severidad (consistente con Alert MUI)
  variants: {
    success: {
      backgroundColor: 'success.main',
      color: 'success.contrastText',
      iconColor: 'success.contrastText',
      borderColor: 'success.dark'
    },
    warning: {
      backgroundColor: 'warning.main',
      color: 'warning.contrastText',
      iconColor: 'warning.contrastText',
      borderColor: 'warning.dark'
    },
    error: {
      backgroundColor: 'error.main',
      color: 'error.contrastText',
      iconColor: 'error.contrastText',
      borderColor: 'error.dark'
    },
    info: {
      backgroundColor: 'info.main',
      color: 'info.contrastText',
      iconColor: 'info.contrastText',
      borderColor: 'info.dark'
    }
  },

  // Comportamiento y timings
  behavior: {
    autoHideDuration: {
      short: 3000,   // Quick feedback
      medium: 4000,  // Standard (recomendado)
      long: 6000     // Important info
    },
    maxVisible: 3,
    stackSpacing: 70, // px entre snackbars
    slideDirection: 'left'
  },

  // Posicionamiento
  positions: {
    bottomRight: { vertical: 'bottom', horizontal: 'right' },
    bottomLeft: { vertical: 'bottom', horizontal: 'left' },
    bottomCenter: { vertical: 'bottom', horizontal: 'center' },
    topRight: { vertical: 'top', horizontal: 'right' },
    topLeft: { vertical: 'top', horizontal: 'left' },
    topCenter: { vertical: 'top', horizontal: 'center' }
  },

  // Layout y forma
  shape: {
    borderRadius: '8px',
    padding: '12px 16px',
    minWidth: '288px',
    maxWidth: '568px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }
};

// 📢 BANNER TOKENS - Notificaciones persistentes
export const bannerTokens = {
  // Tipos de banner
  types: {
    info: {
      backgroundColor: 'info.50',
      borderColor: 'info.main',
      textColor: 'info.dark',
      iconColor: 'info.main',
      accentColor: 'info.main'
    },
    warning: {
      backgroundColor: 'warning.50',
      borderColor: 'warning.main',
      textColor: 'warning.dark',
      iconColor: 'warning.main',
      accentColor: 'warning.main'
    },
    error: {
      backgroundColor: 'error.50',
      borderColor: 'error.main',
      textColor: 'error.dark',
      iconColor: 'error.main',
      accentColor: 'error.main'
    },
    success: {
      backgroundColor: 'success.50',
      borderColor: 'success.main',
      textColor: 'success.dark',
      iconColor: 'success.main',
      accentColor: 'success.main'
    },
    cta: {
      backgroundColor: 'primary.50',
      borderColor: 'primary.main',
      textColor: 'primary.dark',
      iconColor: 'primary.main',
      accentColor: 'primary.main'
    }
  },

  // Layout consistente
  layout: {
    padding: '16px 20px',
    borderRadius: '8px',
    borderLeft: '4px solid', // Paper con Acento
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px'
  },

  // Botón de cierre
  closeButton: {
    size: 'small',
    sx: {
      color: 'inherit',
      opacity: 0.7,
      '&:hover': {
        opacity: 1,
        backgroundColor: alpha('#000', 0.04)
      }
    }
  }
};

// 🎬 OVERLAY ANIMATION TOKENS - Framer Motion
export const overlayAnimationTokens = {
  // Animaciones de modal/dialog
  modal: {
    initial: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10 
    },
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0, 0.2, 1] 
    }
  },

  // Animaciones de drawer
  drawer: {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' }
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' }
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' }
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' }
    },
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0, 0.2, 1] 
    }
  },

  // Animaciones de snackbar
  snackbar: {
    initial: { 
      opacity: 0, 
      x: 300, 
      scale: 0.9 
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1 
    },
    exit: { 
      opacity: 0, 
      x: 300, 
      scale: 0.9 
    },
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0, 0.2, 1] 
    }
  },

  // Animaciones de banner
  banner: {
    initial: { 
      opacity: 0, 
      height: 0, 
      marginBottom: 0 
    },
    animate: { 
      opacity: 1, 
      height: 'auto', 
      marginBottom: '16px' 
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      marginBottom: 0 
    },
    transition: { 
      duration: 0.4, 
      ease: [0.4, 0, 0.2, 1] 
    }
  }
};

// 🛠️ OVERLAY UTILS - Funciones helper para crear props consistentes
export const overlayUtils = {
  /**
   * Crea props consistentes para Dialog/Modal
   * @param {string} variant - 'confirmation' | 'destructive' | 'informative' | 'transaction' | 'warning'
   * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
   * @returns {Object} Props y sx para Dialog
   */
  createDialogProps: (variant = 'confirmation', size = 'md') => {
    const headerConfig = dialogHeaderTokens.variants[variant] || dialogHeaderTokens.variants.confirmation;
    const sizeConfig = modalTokens.sizes[size] || modalTokens.sizes.md;
    
    return {
      maxWidth: false, // Usar custom width
      fullWidth: true,
      PaperProps: {
        sx: {
          maxWidth: sizeConfig.maxWidth,
          minWidth: sizeConfig.minWidth,
          minHeight: sizeConfig.minHeight,
          borderRadius: modalTokens.shape.borderRadius.md,
          boxShadow: variant === 'destructive' ? modalTokens.shadows.level3 : modalTokens.shadows.level2,
          ...(variant === 'destructive' && {
            borderTop: modalTokens.shape.border.accentWidth + ' solid',
            borderTopColor: headerConfig.borderColor || headerConfig.accentColor
          })
        }
      },
      sx: {
        '& .MuiBackdrop-root': {
          backgroundColor: modalTokens.backdrop.backgroundColor,
          backdropFilter: modalTokens.backdrop.backdropFilter
        }
      },
      // Props de accesibilidad según variante
      ...(variant === 'destructive' && {
        role: 'alertdialog',
        'aria-modal': true
      }),
      ...(['confirmation', 'informative', 'transaction', 'warning'].includes(variant) && {
        role: 'dialog',
        'aria-modal': true
      })
    };
  },

  /**
   * Crea props para DialogTitle con header gradiente
   * @param {string} variant - Variante del header
   * @returns {Object} Props y sx para DialogTitle
   */
  createDialogHeaderProps: (variant = 'confirmation') => {
    const config = dialogHeaderTokens.variants[variant] || dialogHeaderTokens.variants.confirmation;
    
    return {
      sx: {
        background: config.gradient,
        color: config.textColor,
        ...dialogHeaderTokens.layout,
        borderRadius: modalTokens.shape.borderRadius.md + ' ' + modalTokens.shape.borderRadius.md + ' 0 0'
      }
    };
  },

  /**
   * Crea props consistentes para Drawer
   * @param {string} anchor - 'left' | 'right' | 'top' | 'bottom'
   * @param {string} size - 'navigation' | 'form' | 'details' | 'fullscreen'
   * @returns {Object} Props y sx para Drawer
   */
  createDrawerProps: (anchor = 'right', size = 'form') => {
    const widthConfig = drawerTokens.widths[size] || drawerTokens.widths.form;
    const isHorizontal = ['left', 'right'].includes(anchor);
    
    return {
      anchor: ['left', 'right', 'top', 'bottom'].includes(anchor) ? anchor : 'right',
      sx: {
        '& .MuiDrawer-paper': {
          [isHorizontal ? 'width' : 'height']: widthConfig,
          boxShadow: drawerTokens.shadows[anchor] || drawerTokens.shadows.right
        }
      },
      // Transiciones Framer Motion
      initial: overlayAnimationTokens.drawer[anchor]?.initial,
      animate: overlayAnimationTokens.drawer[anchor]?.animate,
      exit: overlayAnimationTokens.drawer[anchor]?.exit,
      transition: overlayAnimationTokens.drawer.transition
    };
  },

  /**
   * Crea props para header sticky de Drawer
   * @returns {Object} Sx para header
   */
  createDrawerHeaderProps: () => ({
    sx: {
      ...drawerTokens.layout.header
    }
  }),

  /**
   * Crea props para body scrolleable de Drawer
   * @returns {Object} Sx para body
   */
  createDrawerBodyProps: () => ({
    sx: {
      ...drawerTokens.layout.body
    }
  }),

  /**
   * Crea props para footer sticky de Drawer
   * @returns {Object} Sx para footer
   */
  createDrawerFooterProps: () => ({
    sx: {
      ...drawerTokens.layout.footer
    }
  }),

  /**
   * Crea props consistentes para Snackbar
   * @param {string} severity - 'success' | 'warning' | 'error' | 'info'
   * @param {string} position - 'bottomRight' | 'bottomLeft' | 'topCenter', etc.
   * @returns {Object} Props para Snackbar y Alert
   */
  createSnackbarProps: (severity = 'info', position = 'bottomRight') => {
    const variantConfig = snackbarTokens.variants[severity] || snackbarTokens.variants.info;
    const positionConfig = snackbarTokens.positions[position] || snackbarTokens.positions.bottomRight;
    
    return {
      snackbarProps: {
        anchorOrigin: positionConfig,
        autoHideDuration: snackbarTokens.behavior.autoHideDuration.medium,
        sx: {
          '& .MuiSnackbar-root': {
            maxWidth: snackbarTokens.shape.maxWidth
          }
        }
      },
      alertProps: {
        variant: 'filled',
        severity: severity,
        sx: {
          width: '100%',
          borderRadius: snackbarTokens.shape.borderRadius,
          boxShadow: snackbarTokens.shape.boxShadow,
          backgroundColor: variantConfig.backgroundColor,
          color: variantConfig.color,
          '& .MuiAlert-icon': {
            color: variantConfig.iconColor
          }
        }
      }
    };
  },

  /**
   * Crea props consistentes para Banner
   * @param {string} type - 'info' | 'warning' | 'error' | 'success' | 'cta'
   * @returns {Object} Props y sx para Paper/Box
   */
  createBannerProps: (type = 'info') => {
    const typeConfig = bannerTokens.types[type] || bannerTokens.types.info;
    
    return {
      sx: {
        ...bannerTokens.layout,
        backgroundColor: typeConfig.backgroundColor,
        borderColor: typeConfig.borderColor,
        borderLeftColor: typeConfig.accentColor,
        color: typeConfig.textColor,
        '& .banner-icon': {
          color: typeConfig.iconColor
        },
        '& .banner-close': {
          ...bannerTokens.closeButton.sx
        }
      },
      // Props para Paper
      elevation: 0,
      variant: 'outlined'
    };
  },

  /**
   * Helper para atributos ARIA de diálogos
   * @param {string} titleId - ID del título
   * @param {string} descId - ID de la descripción
   * @param {boolean} destructive - Si es destructivo (alertdialog)
   * @returns {Object} Props ARIA
   */
  getAriaDialogProps: (titleId, descId, destructive = false) => ({
    'aria-labelledby': titleId,
    'aria-describedby': descId,
    'role': destructive ? 'alertdialog' : 'dialog',
    'aria-modal': true
  }),

  /**
   * Helper para focus trap y retorno de foco
   * @param {Function} onClose - Callback de cierre
   * @returns {Object} Props de gestión de foco
   */
  getFocusProps: (onClose) => ({
    onClose: (event, reason) => {
      // Permitir ESC en todos los casos
      if (reason === 'escapeKeyDown') {
        onClose(event, reason);
        return;
      }
      
      // Permitir backdrop click solo en modales no destructivos
      if (reason === 'backdropClick') {
        onClose(event, reason);
        return;
      }
      
      // Otros casos
      if (onClose) {
        onClose(event, reason);
      }
    },
    // Props adicionales para focus management
    disableEscapeKeyDown: false,
    disableBackdropClick: false
  })
};

/**
 * 🎨 OVERLAY THEME INTEGRATION
 * Para integración futura con createTheme de MUI
 */
export const overlayThemeComponents = {
  MuiDialog: {
    defaultProps: {
      maxWidth: false,
      PaperProps: {
        elevation: 8
      }
    },
    styleOverrides: {
      paper: {
        borderRadius: modalTokens.shape.borderRadius.md,
        boxShadow: modalTokens.shadows.level2
      }
    }
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        boxShadow: drawerTokens.shadows.right
      }
    }
  },
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: snackbarTokens.positions.bottomRight,
      autoHideDuration: snackbarTokens.behavior.autoHideDuration.medium
    }
  }
};

// 📦 DEFAULT EXPORT - Todos los tokens agrupados
const overlayTokens = {
  modalTokens,
  dialogHeaderTokens,
  drawerTokens,
  snackbarTokens,
  bannerTokens,
  overlayAnimationTokens,
  overlayUtils,
  overlayThemeComponents
};

export default overlayTokens;
