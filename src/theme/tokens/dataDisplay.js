/**
 * 🎨 DR Group Design System 3.0 - Data Display Tokens
 * Tokens especializados para componentes de visualización de datos empresariales
 */

// 👤 AVATAR TOKENS
// =====================================

export const avatarTokens = {
  sizes: {
    xs: { 
      width: 24, 
      height: 24, 
      fontSize: '0.75rem',
      borderWidth: 1 
    },
    sm: { 
      width: 32, 
      height: 32, 
      fontSize: '0.875rem',
      borderWidth: 1.5 
    },
    md: { 
      width: 40, 
      height: 40, 
      fontSize: '1rem',
      borderWidth: 2 
    },
    lg: { 
      width: 56, 
      height: 56, 
      fontSize: '1.25rem',
      borderWidth: 2 
    },
    xl: { 
      width: 72, 
      height: 72, 
      fontSize: '1.5rem',
      borderWidth: 3 
    },
    xxl: { 
      width: 96, 
      height: 96, 
      fontSize: '2rem',
      borderWidth: 3 
    }
  },
  
  variants: {
    primary: {
      background: 'primary.main',
      color: 'white',
      border: 'primary.light'
    },
    secondary: {
      background: 'secondary.main',
      color: 'white',
      border: 'secondary.light'
    },
    success: {
      background: 'success.main',
      color: 'white',
      border: 'success.light'
    },
    warning: {
      background: 'warning.main',
      color: 'white',
      border: 'warning.light'
    },
    error: {
      background: 'error.main',
      color: 'white',
      border: 'error.light'
    },
    info: {
      background: 'info.main',
      color: 'white',
      border: 'info.light'
    },
    neutral: {
      background: 'grey.600',
      color: 'white',
      border: 'grey.400'
    }
  },

  elevation: {
    none: 0,
    subtle: 1,
    standard: 2,
    prominent: 3
  },

  animations: {
    hover: {
      scale: 1.05,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: {
      scale: 0.95,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    entrance: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  }
};

// 📋 LIST TOKENS
// =====================================

export const listTokens = {
  spacing: {
    compact: {
      padding: '4px 8px',
      gap: 8,
      itemHeight: 40
    },
    standard: {
      padding: '8px 16px',
      gap: 12,
      itemHeight: 56
    },
    comfortable: {
      padding: '12px 20px',
      gap: 16,
      itemHeight: 72
    }
  },

  variants: {
    default: {
      background: 'transparent',
      border: 'none',
      dividerColor: 'divider'
    },
    elevated: {
      background: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      boxShadow: 1
    },
    outlined: {
      background: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    },
    gradient: {
      background: 'linear-gradient(135deg, background.paper, background.default)',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3
    }
  },

  interactions: {
    hover: {
      background: 'primary.main',
      backgroundOpacity: 0.04,
      transform: 'translateX(4px)',
      transition: 'all 0.2s ease-in-out'
    },
    active: {
      background: 'primary.main',
      backgroundOpacity: 0.08,
      transform: 'translateX(2px)'
    },
    focus: {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2
    }
  },

  status: {
    success: {
      indicatorColor: 'success.main',
      backgroundColor: 'success.main',
      backgroundOpacity: 0.08,
      textColor: 'success.dark'
    },
    warning: {
      indicatorColor: 'warning.main',
      backgroundColor: 'warning.main',
      backgroundOpacity: 0.08,
      textColor: 'warning.dark'
    },
    error: {
      indicatorColor: 'error.main',
      backgroundColor: 'error.main',
      backgroundOpacity: 0.08,
      textColor: 'error.dark'
    },
    info: {
      indicatorColor: 'info.main',
      backgroundColor: 'info.main',
      backgroundOpacity: 0.08,
      textColor: 'info.dark'
    }
  }
};

// ➗ DIVIDER TOKENS
// =====================================

export const dividerTokens = {
  variants: {
    default: {
      color: 'divider',
      thickness: 1,
      opacity: 1
    },
    subtle: {
      color: 'divider',
      thickness: 1,
      opacity: 0.6
    },
    bold: {
      color: 'divider',
      thickness: 2,
      opacity: 1
    },
    gradient: {
      background: 'linear-gradient(90deg, primary.main, secondary.main)',
      thickness: 2,
      opacity: 0.8,
      borderRadius: 1
    },
    primary: {
      color: 'primary.main',
      thickness: 1,
      opacity: 0.8
    },
    secondary: {
      color: 'secondary.main',
      thickness: 1,
      opacity: 0.8
    }
  },

  spacing: {
    compact: {
      marginTop: 8,
      marginBottom: 8
    },
    standard: {
      marginTop: 16,
      marginBottom: 16
    },
    comfortable: {
      marginTop: 24,
      marginBottom: 24
    }
  },

  content: {
    chip: {
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '4px 12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    text: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: 'text.secondary',
      padding: '0 16px'
    }
  }
};

// 🎯 DATA DISPLAY UTILS
// =====================================

export const dataDisplayUtils = {
  /**
   * Crear props para avatar empresarial
   * @param {string} size - Tamaño del avatar (xs, sm, md, lg, xl, xxl)
   * @param {string} variant - Variante de color (primary, secondary, success, etc.)
   * @param {string} elevation - Nivel de elevación (none, subtle, standard, prominent)
   * @returns {Object} Props para avatar
   */
  createAvatarProps: (size = 'md', variant = 'primary', elevation = 'standard') => {
    const sizeProps = avatarTokens.sizes[size] || avatarTokens.sizes.md;
    const variantProps = avatarTokens.variants[variant] || avatarTokens.variants.primary;
    const shadowLevel = avatarTokens.elevation[elevation] || avatarTokens.elevation.standard;

    return {
      sx: {
        ...sizeProps,
        bgcolor: variantProps.background,
        color: variantProps.color,
        border: `${sizeProps.borderWidth}px solid`,
        borderColor: variantProps.border,
        boxShadow: shadowLevel,
        transition: 'all 0.3s ease'
      }
    };
  },

  /**
   * Crear props para lista empresarial
   * @param {string} variant - Variante de estilo (default, elevated, outlined, gradient)
   * @param {string} spacing - Espaciado (compact, standard, comfortable)
   * @returns {Object} Props para lista
   */
  createListProps: (variant = 'gradient', spacing = 'standard') => {
    const variantProps = listTokens.variants[variant] || listTokens.variants.default;
    const spacingProps = listTokens.spacing[spacing] || listTokens.spacing.standard;

    return {
      sx: {
        p: spacingProps.padding,
        ...variantProps,
        '& .MuiListItem-root': {
          minHeight: spacingProps.itemHeight,
          borderRadius: 2,
          mb: 1,
          transition: listTokens.interactions.hover.transition,
          '&:hover': {
            bgcolor: `${listTokens.interactions.hover.background}${Math.round(listTokens.interactions.hover.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
            transform: listTokens.interactions.hover.transform
          }
        }
      }
    };
  },

  /**
   * Crear divider con gradiente
   * @param {string} variant - Variante del divider (default, gradient, primary, etc.)
   * @param {string} spacing - Espaciado vertical (compact, standard, comfortable)
   * @returns {Object} Props para divider
   */
  createDividerProps: (variant = 'gradient', spacing = 'standard') => {
    const variantProps = dividerTokens.variants[variant] || dividerTokens.variants.default;
    const spacingProps = dividerTokens.spacing[spacing] || dividerTokens.spacing.standard;

    if (variant === 'gradient') {
      return {
        component: 'div',
        sx: {
          height: variantProps.thickness,
          background: variantProps.background,
          opacity: variantProps.opacity,
          borderRadius: variantProps.borderRadius,
          ...spacingProps
        }
      };
    }

    return {
      sx: {
        borderColor: variantProps.color,
        borderWidth: variantProps.thickness,
        opacity: variantProps.opacity,
        ...spacingProps
      }
    };
  },

  /**
   * Crear chip de estado empresarial
   * @param {string} status - Estado (success, warning, error, info)
   * @param {string} label - Texto del chip
   * @param {string} variant - Variante (filled, outlined)
   * @returns {Object} Props para chip
   */
  createStatusChip: (status = 'info', label = '', variant = 'filled') => {
    const statusProps = listTokens.status[status] || listTokens.status.info;

    return {
      label,
      variant,
      size: 'small',
      sx: {
        fontWeight: 600,
        bgcolor: variant === 'filled' ? statusProps.backgroundColor : 'transparent',
        color: statusProps.textColor,
        border: variant === 'outlined' ? `1px solid ${statusProps.indicatorColor}` : 'none'
      }
    };
  },

  /**
   * Crear animación de entrada escalonada
   * @param {number} index - Índice del elemento
   * @param {number} delay - Delay base en segundos
   * @returns {Object} Props de animación
   */
  createStaggeredAnimation: (index = 0, delay = 0.1) => ({
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { 
      delay: index * delay,
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  })
};

// Export por defecto
export default {
  avatarTokens,
  listTokens,
  dividerTokens,
  dataDisplayUtils
};
