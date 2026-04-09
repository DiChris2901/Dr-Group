/**
 * 🔘 Organizaci�n RDJ Design System 3.0 - Button Tokens
 * Tokens de botones extraídos de la pestaña de botones establecida
 */

// ========================================
// 🎯 BUTTON VARIANT TOKENS - VARIANTES PRINCIPALES
// ========================================

export const buttonVariantTokens = {
  // Botones Contained (sólidos)
  contained: {
    primary: {
      backgroundColor: 'primary.main',
      color: 'white',
      '&:hover': {
        backgroundColor: 'primary.dark',
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
      }
    },
    secondary: {
      backgroundColor: 'secondary.main',
      color: 'white',
      '&:hover': {
        backgroundColor: 'secondary.dark',
        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
      }
    }
  },

  // Botones Outlined (con borde)
  outlined: {
    primary: {
      border: '1.5px solid',
      borderColor: 'primary.main',
      color: 'primary.main',
      backgroundColor: 'transparent',
      '&:hover': {
        borderColor: 'primary.main',
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 6px rgba(25, 118, 210, 0.15)'
      }
    },
    secondary: {
      border: '1.5px solid',
      borderColor: 'secondary.main',
      color: 'secondary.main',
      backgroundColor: 'transparent',
      '&:hover': {
        borderColor: 'secondary.main',
        backgroundColor: 'rgba(156, 39, 176, 0.08)',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 6px rgba(156, 39, 176, 0.15)'
      }
    }
  },

  // Botones Text (sin fondo)
  text: {
    primary: {
      color: 'primary.main',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'action.hover',
        color: 'primary.main',
        transform: 'translateY(-1px)'
      }
    },
    secondary: {
      color: 'text.primary',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'action.hover',
        color: 'primary.main',
        transform: 'translateY(-1px)'
      }
    }
  }
};

// ========================================
// 📏 BUTTON SIZE TOKENS - TAMAÑOS DEFINIDOS
// ========================================

export const buttonSizeTokens = {
  small: {
    padding: '6px 16px',
    fontSize: '0.8125rem',
    minHeight: 32,
    lineHeight: 1.4
  },
  medium: {
    padding: '8px 22px',
    fontSize: '0.875rem',
    minHeight: 36,
    lineHeight: 1.5
  },
  large: {
    padding: '12px 28px',
    fontSize: '0.9375rem',
    minHeight: 42,
    lineHeight: 1.6
  }
};

// ========================================
// 🌈 GRADIENT BUTTON TOKENS - BOTONES ESPECTACULARES
// ========================================

export const gradientButtonTokens = {
  // Gradientes del sistema (usando gradientsV2)
  primary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.05)'
    }
  },
  secondary: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.05)'
    }
  },
  success: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.05)'
    }
  },
  warning: {
    background: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)',
    color: '#402d00',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.05)'
    }
  },
  error: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.05)'
    }
  },
  info: {
    background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.05)'
    }
  },
  dark: {
    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.05)'
    }
  }
};

// ========================================
// 🎯 FAB TOKENS - FLOATING ACTION BUTTONS
// ========================================

export const fabButtonTokens = {
  sizes: {
    small: {
      width: 40,
      height: 40,
      iconSize: 18,
      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
        transform: 'translateY(-2px)'
      }
    },
    medium: {
      width: 56,
      height: 56,
      iconSize: 20,
      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
        transform: 'translateY(-2px)'
      }
    },
    large: {
      width: 72,
      height: 72,
      iconSize: 24,
      boxShadow: '0 3px 12px rgba(156, 39, 176, 0.3)',
      '&:hover': {
        boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)',
        transform: 'translateY(-2px)'
      }
    }
  },
  
  colors: {
    primary: {
      backgroundColor: 'primary.main',
      color: 'white',
      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
      '&:hover': {
        backgroundColor: 'primary.dark',
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
      }
    },
    secondary: {
      backgroundColor: 'secondary.main',
      color: 'white',
      boxShadow: '0 3px 12px rgba(156, 39, 176, 0.3)',
      '&:hover': {
        backgroundColor: 'secondary.dark',
        boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)'
      }
    }
  }
};

// ========================================
// 🎛️ ICON BUTTON TOKENS - BOTONES DE ÍCONOS
// ========================================

export const iconButtonTokens = {
  // Colores semánticos
  colors: {
    primary: {
      color: 'primary.main',
      backgroundColor: 'rgba(25, 118, 210, 0.08)',
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.15)',
        color: 'primary.dark'
      }
    },
    secondary: {
      color: 'secondary.main',
      backgroundColor: 'rgba(156, 39, 176, 0.08)',
      '&:hover': {
        backgroundColor: 'rgba(156, 39, 176, 0.15)',
        color: 'secondary.dark'
      }
    },
    success: {
      color: 'success.main',
      backgroundColor: 'rgba(76, 175, 80, 0.08)',
      '&:hover': {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        color: 'success.dark'
      }
    },
    error: {
      color: 'error.main',
      backgroundColor: 'rgba(211, 47, 47, 0.08)',
      '&:hover': {
        backgroundColor: 'rgba(211, 47, 47, 0.15)',
        color: 'error.dark'
      }
    }
  },
  
  common: {
    transition: 'all 0.2s ease',
    borderRadius: '8px'
  }
};

// ========================================
// 🎨 BUTTON WITH ICON TOKENS - BOTONES CON ÍCONOS
// ========================================

export const buttonWithIconTokens = {
  contained: {
    padding: '12px 24px',
    fontWeight: 600,
    fontSize: '0.9rem',
    textTransform: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
      transform: 'translateY(-1px)'
    },
    '& .MuiButton-startIcon': {
      marginRight: '8px',
      '& svg': {
        fontSize: '1.1rem'
      }
    },
    '& .MuiButton-endIcon': {
      marginLeft: '8px',
      '& svg': {
        fontSize: '1.1rem'
      }
    }
  },
  
  outlined: {
    padding: '12px 24px',
    fontWeight: 500,
    fontSize: '0.9rem',
    textTransform: 'none',
    borderRadius: '8px',
    borderWidth: '1.5px',
    '&:hover': {
      borderWidth: '1.5px',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 6px rgba(25, 118, 210, 0.15)'
    },
    '& .MuiButton-startIcon': {
      marginRight: '8px',
      '& svg': {
        fontSize: '1.1rem'
      }
    },
    '& .MuiButton-endIcon': {
      marginLeft: '8px',
      '& svg': {
        fontSize: '1.1rem'
      }
    }
  },
  
  text: {
    padding: '10px 20px',
    fontWeight: 500,
    fontSize: '0.9rem',
    textTransform: 'none',
    borderRadius: '8px',
    '&:hover': {
      transform: 'translateY(-1px)'
    },
    '& .MuiButton-startIcon': {
      marginRight: '8px',
      '& svg': {
        fontSize: '1.1rem'
      }
    }
  }
};

// ========================================
// 🎬 BUTTON ANIMATION TOKENS - ANIMACIONES
// ========================================

export const buttonAnimationTokens = {
  // Animaciones estándar
  standard: {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98 },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Animaciones para gradientes
  gradient: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Animaciones para FAB
  fab: {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.95 },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Animaciones para icon buttons
  iconButton: {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 },
    transition: 'all 0.2s ease'
  }
};

// ========================================
// 🔧 BUTTON STATE TOKENS - ESTADOS
// ========================================

export const buttonStateTokens = {
  normal: {
    opacity: 1,
    cursor: 'pointer'
  },
  
  disabled: {
    opacity: 0.38,
    cursor: 'not-allowed',
    '&:hover': {
      transform: 'none',
      boxShadow: 'none'
    }
  },
  
  loading: {
    opacity: 0.7,
    cursor: 'progress'
  }
};

// ========================================
// 🛠️ BUTTON UTILS
// ========================================

export const buttonUtils = {
  /**
   * Obtener variante de botón
   * @param {string} variant - Variante del botón (contained, outlined, text)
   * @param {string} color - Color del botón
   * @returns {Object} Estilos de la variante
   */
  getVariant: (variant = 'contained', color = 'primary') => {
    return buttonVariantTokens[variant]?.[color] || buttonVariantTokens.contained.primary;
  },

  /**
   * Obtener tamaño de botón
   * @param {string} size - Tamaño del botón (small, medium, large)
   * @returns {Object} Estilos del tamaño
   */
  getSize: (size = 'medium') => {
    return buttonSizeTokens[size] || buttonSizeTokens.medium;
  },

  /**
   * Obtener botón con gradiente
   * @param {string} gradient - Tipo de gradiente
   * @returns {Object} Estilos del gradiente
   */
  getGradient: (gradient = 'primary') => {
    return gradientButtonTokens[gradient] || gradientButtonTokens.primary;
  },

  /**
   * Obtener FAB
   * @param {string} size - Tamaño del FAB
   * @param {string} color - Color del FAB
   * @returns {Object} Estilos del FAB
   */
  getFab: (size = 'medium', color = 'primary') => {
    const sizeStyle = fabButtonTokens.sizes[size] || fabButtonTokens.sizes.medium;
    const colorStyle = fabButtonTokens.colors[color] || fabButtonTokens.colors.primary;
    
    return {
      ...sizeStyle,
      ...colorStyle
    };
  },

  /**
   * Obtener icon button
   * @param {string} color - Color del icon button
   * @returns {Object} Estilos del icon button
   */
  getIconButton: (color = 'primary') => {
    return {
      ...iconButtonTokens.colors[color] || iconButtonTokens.colors.primary,
      ...iconButtonTokens.common
    };
  },

  /**
   * Obtener animación
   * @param {string} type - Tipo de animación
   * @returns {Object} Configuración de animación
   */
  getAnimation: (type = 'standard') => {
    return buttonAnimationTokens[type] || buttonAnimationTokens.standard;
  },

  /**
   * Crear props completos para botón
   * @param {Object} config - Configuración del botón
   * @returns {Object} Props para el componente
   */
  createButtonProps: ({
    variant = 'contained',
    color = 'primary',
    size = 'medium',
    animation = 'standard',
    gradient = null
  }) => {
    let styles = {};
    
    if (gradient) {
      styles = buttonUtils.getGradient(gradient);
    } else {
      styles = {
        ...buttonUtils.getVariant(variant, color),
        ...buttonUtils.getSize(size)
      };
    }
    
    const animationConfig = buttonUtils.getAnimation(animation);
    
    return {
      sx: {
        ...styles,
        transition: animationConfig.transition,
        // Aplicar animaciones como CSS hover states
        '&:hover': {
          ...styles['&:hover'],
          transform: animationConfig.whileHover?.scale ? `scale(${animationConfig.whileHover.scale})` : 'translateY(-1px)',
          ...(animationConfig.whileHover?.y && { transform: `translateY(${animationConfig.whileHover.y}px) scale(${animationConfig.whileHover.scale || 1})` })
        },
        '&:active': {
          transform: animationConfig.whileTap?.scale ? `scale(${animationConfig.whileTap.scale})` : 'scale(0.98)',
        }
      }
    };
  },

  /**
   * Crear props específicos para motion.* components
   */
  createMotionButtonProps: ({
    variant = 'contained',
    color = 'primary',
    size = 'medium',
    animation = 'standard',
    gradient = null
  }) => {
    let styles = {};
    
    if (gradient) {
      styles = buttonUtils.getGradient(gradient);
    } else {
      styles = {
        ...buttonUtils.getVariant(variant, color),
        ...buttonUtils.getSize(size)
      };
    }
    
    const animationConfig = buttonUtils.getAnimation(animation);
    
    return {
      sx: {
        ...styles,
        transition: animationConfig.transition
      },
      whileHover: animationConfig.whileHover,
      whileTap: animationConfig.whileTap
    };
  }
};

export default {
  buttonVariantTokens,
  buttonSizeTokens,
  gradientButtonTokens,
  fabButtonTokens,
  iconButtonTokens,
  buttonWithIconTokens,
  buttonAnimationTokens,
  buttonStateTokens,
  buttonUtils
};
