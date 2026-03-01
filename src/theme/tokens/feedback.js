// ========================================
// 📢 FEEDBACK TOKENS — ORGANIZACI�N RDJ DASHBOARD  
// ========================================
// Sistema completo de feedback: Alerts, Snackbars, Tooltips, Chips, Badges, Progress
// Fecha: 12 de Agosto, 2025 - Design System 3.0

import { gradientTokensLegacy } from './gradients.js';

// ========================================
// 🚨 ALERT TOKENS - Sistema de alertas empresariales
// ========================================
export const alertTokens = {
  // Variantes semánticas empresariales
  variants: {
    success: {
      background: '#f3f9f1',
      border: '#4caf50',
      color: '#2e7d32',
      icon: '#4caf50',
      gradient: gradientTokensLegacy.success
    },
    info: {
      background: '#f0f7ff',
      border: '#2196f3',
      color: '#1565c0',
      icon: '#2196f3',
      gradient: gradientTokensLegacy.info
    },
    warning: {
      background: '#fffbf0',
      border: '#ff9800',
      color: '#e65100',
      icon: '#ff9800',
      gradient: gradientTokensLegacy.warning
    },
    error: {
      background: '#fef7f7',
      border: '#f44336',
      color: '#c62828',
      icon: '#f44336',
      gradient: gradientTokensLegacy.error
    }
  },

  // Estilos y formas
  shape: {
    borderRadius: 8,
    borderWidth: 1,
    padding: '12px 16px',
    iconSize: 20,
    minHeight: 48
  },

  // Animaciones específicas
  animations: {
    slideIn: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    shake: {
      animate: { x: [0, -10, 10, -10, 10, 0] },
      transition: { duration: 0.5 }
    }
  },

  // Comportamiento empresarial
  behavior: {
    autoHide: false,
    dismissible: true,
    persistent: true,
    stackSpacing: 12
  }
};

// ========================================
// 💊 CHIP TOKENS - Etiquetas y filtros empresariales
// ========================================
export const chipTokens = {
  // Variantes por contexto empresarial
  variants: {
    filled: {
      primary: {
        background: gradientTokensLegacy.primary,
        color: '#ffffff',
        deleteIcon: '#ffffff'
      },
      secondary: {
        background: gradientTokensLegacy.secondary,
        color: '#ffffff',
        deleteIcon: '#ffffff'
      },
      success: {
        background: gradientTokensLegacy.success,
        color: '#ffffff',
        deleteIcon: '#ffffff'
      },
      warning: {
        background: gradientTokensLegacy.warning,
        color: '#ffffff',
        deleteIcon: '#ffffff'
      },
      error: {
        background: gradientTokensLegacy.error,
        color: '#ffffff',
        deleteIcon: '#ffffff'
      },
      info: {
        background: gradientTokensLegacy.info,
        color: '#ffffff',
        deleteIcon: '#ffffff'
      }
    },
    outlined: {
      primary: { border: '#1976d2', color: '#1976d2' },
      secondary: { border: '#9c27b0', color: '#9c27b0' },
      success: { border: '#2e7d32', color: '#2e7d32' },
      warning: { border: '#ed6c02', color: '#ed6c02' },
      error: { border: '#d32f2f', color: '#d32f2f' },
      info: { border: '#0288d1', color: '#0288d1' }
    }
  },

  // Tamaños empresariales
  sizes: {
    small: {
      height: 24,
      fontSize: '0.75rem',
      padding: '0 8px',
      iconSize: 16
    },
    medium: {
      height: 32,
      fontSize: '0.875rem',
      padding: '0 12px',
      iconSize: 20
    },
    large: {
      height: 40,
      fontSize: '1rem',
      padding: '0 16px',
      iconSize: 24
    }
  },

  // Formas y estilos
  shape: {
    borderRadius: 16,
    borderWidth: 1,
    spacing: 8
  },

  // Estados interactivos
  states: {
    hover: {
      transform: 'scale(1.05)',
      transition: 'all 0.2s ease'
    },
    active: {
      transform: 'scale(0.98)'
    },
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }
};

// ========================================
// 🔔 BADGE TOKENS - Indicadores y notificaciones
// ========================================
export const badgeTokens = {
  // Variantes por contexto
  variants: {
    standard: {
      primary: { background: '#1976d2', color: '#ffffff' },
      secondary: { background: '#9c27b0', color: '#ffffff' },
      success: { background: '#2e7d32', color: '#ffffff' },
      warning: { background: '#ed6c02', color: '#ffffff' },
      error: { background: '#d32f2f', color: '#ffffff' },
      info: { background: '#0288d1', color: '#ffffff' }
    },
    dot: {
      primary: { background: '#1976d2' },
      secondary: { background: '#9c27b0' },
      success: { background: '#2e7d32' },
      warning: { background: '#ed6c02' },
      error: { background: '#d32f2f' },
      info: { background: '#0288d1' }
    }
  },

  // Posicionamiento empresarial
  positions: {
    topRight: { top: 0, right: 0 },
    topLeft: { top: 0, left: 0 },
    bottomRight: { bottom: 0, right: 0 },
    bottomLeft: { bottom: 0, left: 0 }
  },

  // Formas y tamaños
  shape: {
    standard: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      fontSize: '0.75rem',
      padding: '0 6px'
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4
    }
  },

  // Animaciones
  animations: {
    pulse: {
      animate: { scale: [1, 1.2, 1] },
      transition: { duration: 2, repeat: Infinity }
    },
    bounce: {
      animate: { y: [0, -4, 0] },
      transition: { duration: 0.6, repeat: Infinity, repeatType: 'loop' }
    }
  }
};

// ========================================
// 💬 TOOLTIP TOKENS - Sistema de ayuda contextual
// ========================================
export const tooltipTokens = {
  // Variantes por contexto
  variants: {
    default: {
      background: 'rgba(97, 97, 97, 0.92)',
      color: '#ffffff',
      backdropFilter: 'blur(20px)'
    },
    light: {
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#424242',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      backdropFilter: 'blur(20px)'
    },
    gradient: {
      background: gradientTokensLegacy.primary,
      color: '#ffffff',
      backdropFilter: 'blur(20px)'
    }
  },

  // Posicionamiento inteligente
  placements: {
    top: { marginBottom: 8 },
    bottom: { marginTop: 8 },
    left: { marginRight: 8 },
    right: { marginLeft: 8 }
  },

  // Formas y estilos
  shape: {
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.875rem',
    fontWeight: 500,
    maxWidth: 300,
    lineHeight: 1.4,
    zIndex: 1500
  },

  // Comportamiento
  behavior: {
    enterDelay: 500,
    leaveDelay: 200,
    arrow: true,
    followCursor: false
  },

  // Animaciones
  animations: {
    fadeIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
      transition: { duration: 0.2 }
    }
  }
};

// ========================================
// 📊 PROGRESS TOKENS - Indicadores de progreso empresariales
// ========================================
export const progressTokens = {
  // Variantes por contexto empresarial
  variants: {
    linear: {
      primary: {
        background: gradientTokensLegacy.primary,
        track: 'rgba(25, 118, 210, 0.1)'
      },
      secondary: {
        background: gradientTokensLegacy.secondary,
        track: 'rgba(156, 39, 176, 0.1)'
      },
      success: {
        background: gradientTokensLegacy.success,
        track: 'rgba(46, 125, 50, 0.1)'
      },
      warning: {
        background: gradientTokensLegacy.warning,
        track: 'rgba(237, 108, 2, 0.1)'
      },
      error: {
        background: gradientTokensLegacy.error,
        track: 'rgba(211, 47, 47, 0.1)'
      },
      info: {
        background: gradientTokensLegacy.info,
        track: 'rgba(2, 136, 209, 0.1)'
      }
    },
    circular: {
      primary: { color: '#1976d2' },
      secondary: { color: '#9c27b0' },
      success: { color: '#2e7d32' },
      warning: { color: '#ed6c02' },
      error: { color: '#d32f2f' },
      info: { color: '#0288d1' }
    }
  },

  // Tamaños empresariales
  sizes: {
    linear: {
      small: { height: 4 },
      medium: { height: 6 },
      large: { height: 8 }
    },
    circular: {
      small: { size: 20, thickness: 3 },
      medium: { size: 40, thickness: 4 },
      large: { size: 60, thickness: 5 }
    }
  },

  // Formas
  shape: {
    linear: {
      borderRadius: 4
    },
    circular: {
      borderRadius: '50%'
    }
  },

  // Animaciones spectacular
  animations: {
    indeterminate: {
      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
      animation: 'progressShine 1.5s infinite'
    },
    pulse: {
      animate: { scale: [1, 1.1, 1] },
      transition: { duration: 2, repeat: Infinity }
    }
  }
};

// ========================================
// 🛠️ FEEDBACK UTILITIES - Utilidades helper
// ========================================
export const feedbackUtils = {
  /**
   * Crea props para Alert empresarial
   * @param {string} severity - success|info|warning|error
   * @param {boolean} dismissible - Si se puede cerrar
   * @returns {Object} Props para Alert
   */
  createAlertProps: (severity = 'info', dismissible = true) => {
    const variantConfig = alertTokens.variants[severity] || alertTokens.variants.info;
    
    return {
      severity,
      sx: {
        background: variantConfig.background,
        border: `1px solid ${variantConfig.border}`,
        borderRadius: alertTokens.shape.borderRadius,
        padding: alertTokens.shape.padding,
        minHeight: alertTokens.shape.minHeight,
        '& .MuiAlert-icon': {
          color: variantConfig.icon,
          fontSize: alertTokens.shape.iconSize
        },
        '& .MuiAlert-message': {
          color: variantConfig.color,
          fontWeight: 500
        }
      },
      onClose: dismissible ? () => {} : undefined,
      ...(dismissible && { closeText: 'Cerrar' })
    };
  },

  /**
   * Crea props para Chip empresarial
   * @param {string} variant - filled|outlined
   * @param {string} color - primary|secondary|success|warning|error|info
   * @param {string} size - small|medium|large
   * @returns {Object} Props para Chip
   */
  createChipProps: (variant = 'filled', color = 'primary', size = 'medium') => {
    const variantConfig = chipTokens.variants[variant]?.[color] || chipTokens.variants.filled.primary;
    const sizeConfig = chipTokens.sizes[size] || chipTokens.sizes.medium;
    
    return {
      variant,
      color,
      size,
      sx: {
        height: sizeConfig.height,
        fontSize: sizeConfig.fontSize,
        padding: sizeConfig.padding,
        borderRadius: chipTokens.shape.borderRadius,
        ...(variant === 'filled' && {
          background: variantConfig.background,
          color: variantConfig.color,
          '& .MuiChip-deleteIcon': {
            color: variantConfig.deleteIcon
          }
        }),
        ...(variant === 'outlined' && {
          borderColor: variantConfig.border,
          color: variantConfig.color
        }),
        '&:hover': chipTokens.states.hover,
        '&:active': chipTokens.states.active,
        '&.Mui-disabled': chipTokens.states.disabled
      }
    };
  },

  /**
   * Crea props para Badge empresarial
   * @param {string} variant - standard|dot
   * @param {string} color - primary|secondary|success|warning|error|info
   * @param {number|string} content - Contenido del badge
   * @returns {Object} Props para Badge
   */
  createBadgeProps: (variant = 'standard', color = 'primary', content = null) => {
    const variantConfig = badgeTokens.variants[variant]?.[color] || badgeTokens.variants.standard.primary;
    const shapeConfig = badgeTokens.shape[variant] || badgeTokens.shape.standard;
    
    return {
      variant,
      color,
      badgeContent: variant === 'dot' ? undefined : content,
      sx: {
        '& .MuiBadge-badge': {
          backgroundColor: variantConfig.background,
          color: variant === 'dot' ? 'transparent' : variantConfig.color,
          ...shapeConfig,
          fontSize: variant === 'dot' ? 0 : shapeConfig.fontSize
        }
      }
    };
  },

  /**
   * Crea props para Tooltip empresarial
   * @param {string} variant - default|light|gradient
   * @param {string} placement - top|bottom|left|right
   * @returns {Object} Props para Tooltip
   */
  createTooltipProps: (variant = 'default', placement = 'top') => {
    const variantConfig = tooltipTokens.variants[variant] || tooltipTokens.variants.default;
    
    return {
      placement,
      arrow: tooltipTokens.behavior.arrow,
      enterDelay: tooltipTokens.behavior.enterDelay,
      leaveDelay: tooltipTokens.behavior.leaveDelay,
      sx: {
        '& .MuiTooltip-tooltip': {
          background: variantConfig.background,
          color: variantConfig.color,
          border: variantConfig.border,
          backdropFilter: variantConfig.backdropFilter,
          borderRadius: tooltipTokens.shape.borderRadius,
          padding: tooltipTokens.shape.padding,
          fontSize: tooltipTokens.shape.fontSize,
          fontWeight: tooltipTokens.shape.fontWeight,
          maxWidth: tooltipTokens.shape.maxWidth,
          lineHeight: tooltipTokens.shape.lineHeight
        },
        '& .MuiTooltip-arrow': {
          color: variantConfig.background
        }
      }
    };
  },

  /**
   * Crea props para Progress empresarial
   * @param {string} type - linear|circular
   * @param {string} variant - primary|secondary|success|warning|error|info
   * @param {string} size - small|medium|large
   * @returns {Object} Props para Progress
   */
  createProgressProps: (type = 'linear', variant = 'primary', size = 'medium') => {
    const variantConfig = progressTokens.variants[type]?.[variant] || progressTokens.variants[type].primary;
    const sizeConfig = progressTokens.sizes[type]?.[size] || progressTokens.sizes[type].medium;
    
    if (type === 'linear') {
      return {
        sx: {
          height: sizeConfig.height,
          borderRadius: progressTokens.shape.linear.borderRadius,
          backgroundColor: variantConfig.track,
          '& .MuiLinearProgress-bar': {
            background: variantConfig.background,
            borderRadius: progressTokens.shape.linear.borderRadius
          }
        }
      };
    } else {
      return {
        size: sizeConfig.size,
        thickness: sizeConfig.thickness,
        sx: {
          color: variantConfig.color
        }
      };
    }
  }
};

// ========================================
// 🎨 THEME COMPONENTS - Configuración MUI
// ========================================
export const feedbackThemeComponents = {
  // Configuración Alert
  MuiAlert: {
    styleOverrides: {
      root: ({ theme, ownerState }) => {
        const variantConfig = alertTokens.variants[ownerState.severity] || alertTokens.variants.info;
        return {
          background: variantConfig.background,
          border: `1px solid ${variantConfig.border}`,
          borderRadius: alertTokens.shape.borderRadius,
          padding: alertTokens.shape.padding,
          minHeight: alertTokens.shape.minHeight,
          backdropFilter: 'blur(10px)',
          '& .MuiAlert-icon': {
            color: variantConfig.icon,
            fontSize: alertTokens.shape.iconSize
          },
          '& .MuiAlert-message': {
            color: variantConfig.color,
            fontWeight: 500
          }
        };
      }
    }
  },

  // Configuración Chip
  MuiChip: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        borderRadius: chipTokens.shape.borderRadius,
        fontWeight: 500,
        transition: 'all 0.2s ease',
        '&:hover': chipTokens.states.hover,
        '&:active': chipTokens.states.active,
        '&.Mui-disabled': chipTokens.states.disabled
      }),
      filled: ({ theme, ownerState }) => {
        const variantConfig = chipTokens.variants.filled[ownerState.color] || chipTokens.variants.filled.primary;
        return {
          background: variantConfig.background,
          color: variantConfig.color,
          '& .MuiChip-deleteIcon': {
            color: variantConfig.deleteIcon
          }
        };
      },
      outlined: ({ theme, ownerState }) => {
        const variantConfig = chipTokens.variants.outlined[ownerState.color] || chipTokens.variants.outlined.primary;
        return {
          borderColor: variantConfig.border,
          color: variantConfig.color
        };
      }
    }
  },

  // Configuración Badge
  MuiBadge: {
    styleOverrides: {
      badge: ({ theme, ownerState }) => {
        const variant = ownerState.variant || 'standard';
        const color = ownerState.color || 'primary';
        const variantConfig = badgeTokens.variants[variant]?.[color] || badgeTokens.variants.standard.primary;
        const shapeConfig = badgeTokens.shape[variant] || badgeTokens.shape.standard;
        
        return {
          backgroundColor: variantConfig.background,
          color: variant === 'dot' ? 'transparent' : variantConfig.color,
          ...shapeConfig,
          fontSize: variant === 'dot' ? 0 : shapeConfig.fontSize
        };
      }
    }
  },

  // Configuración Tooltip
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: tooltipTokens.shape.borderRadius,
        padding: tooltipTokens.shape.padding,
        fontSize: tooltipTokens.shape.fontSize,
        fontWeight: tooltipTokens.shape.fontWeight,
        maxWidth: tooltipTokens.shape.maxWidth,
        lineHeight: tooltipTokens.shape.lineHeight
      }
    }
  },

  // Configuración LinearProgress
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: progressTokens.shape.linear.borderRadius
      },
      bar: {
        borderRadius: progressTokens.shape.linear.borderRadius
      }
    }
  }
};
