/**
 * 🎴 Organizaci�n RDJ Design System 3.0 - Cards & Containers Tokens
 * Tokens de cards y contenedores extraídos de la pestaña establecida
 */

// ========================================
// 📊 DASHBOARD CARDS TOKENS - CARDS EMPRESARIALES
// ========================================

export const dashboardCardTokens = {
  // Card de Métricas Base
  base: {
    height: 180,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid',
    borderColor: 'divider',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      borderColor: 'primary.light'
    }
  },

  // Diferentes variantes de métricas
  variants: {
    metrics: {
      contentPadding: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      iconSize: 24,
      titleFontSize: '1rem',
      titleFontWeight: 500,
      metricFontSize: '2rem',
      metricFontWeight: 600,
      descriptionMarginBottom: 'auto',
      trendMarginTop: 2,
      trendIconSize: 14
    },

    company: {
      contentPadding: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      iconSize: 24,
      titleFontSize: '1rem',
      titleFontWeight: 500,
      chipMarginTop: 'auto'
    },

    alert: {
      contentPadding: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      iconSize: 24,
      titleFontSize: '1rem',
      titleFontWeight: 500,
      metricFontSize: '2rem',
      metricFontWeight: 600,
      buttonMarginTop: 2,
      buttonFontWeight: 500,
      buttonAlignSelf: 'flex-start'
    }
  },

  // Colores semánticos para iconos
  iconColors: {
    money: 'success.main',
    business: 'primary.main',
    warning: 'warning.main',
    trend: 'success.main'
  }
};

// ========================================
// 📄 DETAILED CARDS TOKENS - CARDS DETALLADAS
// ========================================

export const detailedCardTokens = {
  // Card base para información detallada
  base: {
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid',
    borderColor: 'divider',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      borderColor: 'primary.light'
    }
  },

  // Card de Compromiso
  commitment: {
    header: {
      paddingBottom: 1,
      avatarSize: { width: 40, height: 40 },
      titleFontSize: '1rem',
      titleFontWeight: 500,
      chipFontWeight: 500
    },
    content: {
      paddingTop: 0,
      paddingBottom: 2,
      amountFontSize: '1.25rem',
      amountFontWeight: 600,
      amountMarginBottom: 2,
      detailIconSize: 16,
      detailMarginBottom: 1
    },
    actions: {
      paddingX: 3,
      paddingBottom: 2,
      paddingTop: 0,
      buttonFontWeight: 500
    }
  },

  // Card de Usuario
  user: {
    content: {
      padding: 3,
      avatarSize: { width: 48, height: 48 },
      avatarMarginRight: 2,
      titleFontSize: '1rem',
      titleFontWeight: 500,
      detailIconSize: 16,
      detailMarginBottom: 0.5,
      chipGap: 1,
      chipFontWeight: 500
    }
  }
};

// ========================================
// 📋 PAPER ACCENT TOKENS - CONTENEDORES PROFESIONALES
// ========================================

export const paperAccentTokens = {
  // Base común para todos los paper acentos
  base: {
    padding: 2.5,
    borderRadius: 1,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.25s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      transform: 'translateY(-1px)'
    }
  },

  // Tamaños estándar
  sizes: {
    small: {
      height: 140,
      padding: 2.5,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    medium: {
      height: 140,
      padding: 2.5,
      display: 'flex',
      flexDirection: 'column'
    },
    large: {
      padding: 3,
      minHeight: 180,
      display: 'flex',
      flexDirection: 'column'
    }
  },

  // Variantes de color (acento izquierdo)
  accents: {
    primary: {
      borderLeftColor: 'primary.main',
      iconColor: 'primary.main'
    },
    secondary: {
      borderLeftColor: 'secondary.main',
      iconColor: 'secondary.main'
    },
    success: {
      borderLeftColor: 'success.main',
      iconColor: 'success.main'
    },
    warning: {
      borderLeftColor: 'warning.main',
      iconColor: 'warning.main'
    },
    error: {
      borderLeftColor: 'error.main',
      iconColor: 'error.main'
    },
    info: {
      borderLeftColor: 'info.main',
      iconColor: 'info.main'
    }
  },

  // Tipografía para contenido
  typography: {
    // Para cards pequeñas centradas
    small: {
      titleFontSize: '0.95rem',
      titleFontWeight: 500,
      descriptionFontSize: '0.8rem',
      descriptionLineHeight: 1.3,
      iconSize: 20,
      iconMarginRight: 1
    },
    
    // Para cards medianas
    medium: {
      titleFontSize: '1.1rem',
      titleFontWeight: 500,
      descriptionFontSize: '0.85rem',
      descriptionLineHeight: 1.4,
      iconSize: 22,
      iconMarginRight: 1.5,
      chipFontSize: '0.7rem',
      chipHeight: 24
    },

    // Para cards grandes
    large: {
      titleFontSize: '1.3rem',
      titleFontWeight: 500,
      descriptionFontSize: '0.9rem',
      descriptionLineHeight: 1.5,
      iconSize: 24,
      iconMarginRight: 2
    }
  }
};

// ========================================
// 🎬 CARD ANIMATION TOKENS - ANIMACIONES
// ========================================

export const cardAnimationTokens = {
  // Animación estándar para todas las cards
  standard: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
    whileHover: { y: -2, transition: { duration: 0.2 } }
  },

  // Animación con delay para grids
  staggered: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    getTransition: (index = 0) => ({ 
      duration: 0.3, 
      delay: index * 0.1 
    }),
    whileHover: { y: -2, transition: { duration: 0.2 } }
  },

  // Animación sutil para paper containers
  paper: {
    whileHover: { y: -2, transition: { duration: 0.2 } }
  },

  // Animación más pronunciada para dashboard cards
  dashboard: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.4 },
    whileHover: { 
      y: -4, 
      scale: 1.02,
      transition: { duration: 0.2 } 
    }
  }
};

// ========================================
// 🎯 SEMANTIC COLORS TOKENS - COLORES SEMÁNTICOS
// ========================================

export const cardSemanticTokens = {
  // Para uso de colores por contexto
  contexts: {
    general: {
      accent: 'primary.main',
      icon: 'primary.main',
      description: 'Para configuraciones generales y ajustes del sistema'
    },
    success: {
      accent: 'success.main',
      icon: 'success.main',
      description: 'Para confirmaciones, reportes positivos y éxitos'
    },
    warning: {
      accent: 'warning.main',
      icon: 'warning.main',
      description: 'Para alertas, avisos y compromisos próximos a vencer'
    },
    critical: {
      accent: 'error.main',
      icon: 'error.main',
      description: 'Para errores, elementos críticos y situaciones urgentes'
    },
    informational: {
      accent: 'info.main',
      icon: 'info.main',
      description: 'Para información adicional, ayuda y datos de referencia'
    },
    business: {
      accent: 'secondary.main',
      icon: 'secondary.main',
      description: 'Para información empresarial, usuarios y gestión organizacional'
    }
  },

  // Chips por contexto
  chips: {
    active: { label: 'Activa', color: 'success' },
    pending: { label: 'Pendiente', color: 'warning' },
    completed: { label: 'Completado', color: 'success' },
    critical: { label: 'Crítico', color: 'error' },
    admin: { label: 'Admin', color: 'primary' },
    user: { label: 'Usuario', color: 'default' }
  }
};

// ========================================
// 📐 LAYOUT TOKENS - ESPACIADO Y DISTRIBUCIÓN
// ========================================

export const cardLayoutTokens = {
  // Espaciados estándar
  spacing: {
    cardGrid: 3,           // Grid spacing between cards
    contentPadding: 3,     // Standard content padding
    sectionMarginTop: 4,   // Margin between sections
    elementMarginBottom: 2, // Standard margin between elements
    iconMargin: 1,         // Standard icon margins
    chipGap: 1            // Gap between chips
  },

  // Alturas estándar
  heights: {
    dashboardCard: 180,
    smallContainer: 140,
    mediumContainer: 160,
    detailedCard: 'auto'
  },

  // Responsive breakpoints para cards
  responsive: {
    dashboardCards: {
      xs: 12,
      sm: 6, 
      md: 4
    },
    detailedCards: {
      xs: 12,
      md: 6
    },
    paperContainers: {
      small: { xs: 12, sm: 6, md: 3 },
      medium: { xs: 12, md: 6 },
      large: { xs: 12 }
    }
  }
};

// ========================================
// 🛠️ CARDS & CONTAINERS UTILS
// ========================================

export const cardsUtils = {
  /**
   * Crear props para dashboard card
   * @param {string} variant - Variante de la card (metrics, company, alert)
   * @param {Object} customStyles - Estilos personalizados
   * @returns {Object} Props para la Card
   */
  createDashboardCard: (variant = 'metrics', customStyles = {}) => {
    const baseStyles = dashboardCardTokens.base;
    const variantStyles = dashboardCardTokens.variants[variant] || dashboardCardTokens.variants.metrics;
    
    return {
      sx: {
        ...baseStyles,
        ...customStyles
      },
      contentProps: {
        sx: variantStyles
      }
    };
  },

  /**
   * Crear props para paper con acento
   * @param {string} accent - Color del acento (primary, success, warning, error, info, secondary)
   * @param {string} size - Tamaño del paper (small, medium, large)
   * @param {Object} customStyles - Estilos personalizados
   * @returns {Object} Props para el Paper
   */
  createPaperAccent: (accent = 'primary', size = 'small', customStyles = {}) => {
    const baseStyles = paperAccentTokens.base;
    const sizeStyles = paperAccentTokens.sizes[size] || paperAccentTokens.sizes.small;
    const accentStyles = paperAccentTokens.accents[accent] || paperAccentTokens.accents.primary;
    
    return {
      sx: {
        ...baseStyles,
        ...sizeStyles,
        ...accentStyles,
        ...customStyles
      }
    };
  },

  /**
   * Obtener animación por tipo
   * @param {string} type - Tipo de animación (standard, staggered, paper, dashboard)
   * @param {number} index - Índice para animación escalonada
   * @returns {Object} Props de animación
   */
  getAnimation: (type = 'standard', index = 0) => {
    const animation = cardAnimationTokens[type] || cardAnimationTokens.standard;
    
    if (type === 'staggered') {
      return {
        ...animation,
        transition: animation.getTransition(index)
      };
    }
    
    return animation;
  },

  /**
   * Obtener contexto semántico
   * @param {string} context - Contexto (general, success, warning, critical, informational, business)
   * @returns {Object} Colores y descripción del contexto
   */
  getSemanticContext: (context = 'general') => {
    return cardSemanticTokens.contexts[context] || cardSemanticTokens.contexts.general;
  },

  /**
   * Crear grid responsive props
   * @param {string} cardType - Tipo de card para responsive (dashboardCards, detailedCards, paperContainers)
   * @param {string} size - Tamaño para paper containers
   * @returns {Object} Props para Grid item
   */
  getResponsiveGrid: (cardType = 'dashboardCards', size = 'small') => {
    if (cardType === 'paperContainers') {
      return cardLayoutTokens.responsive.paperContainers[size] || cardLayoutTokens.responsive.paperContainers.small;
    }
    
    return cardLayoutTokens.responsive[cardType] || cardLayoutTokens.responsive.dashboardCards;
  },

  /**
   * Crear componente completo con motion.div
   * @param {Object} config - Configuración completa
   * @returns {Object} Props completos para motion.div + componente
   */
  createMotionCard: ({
    type = 'dashboard',
    variant = 'metrics',
    accent = 'primary',
    size = 'small',
    animation = 'standard',
    index = 0,
    customStyles = {}
  }) => {
    let componentProps = {};
    
    if (type === 'dashboard') {
      componentProps = cardsUtils.createDashboardCard(variant, customStyles);
    } else if (type === 'paper') {
      componentProps = cardsUtils.createPaperAccent(accent, size, customStyles);
    } else if (type === 'detailed') {
      componentProps = {
        sx: {
          ...detailedCardTokens.base,
          ...customStyles
        }
      };
    }
    
    const animationProps = cardsUtils.getAnimation(animation, index);
    
    return {
      motionProps: animationProps,
      componentProps: componentProps
    };
  },

  /**
   * Obtener iconos y colores por contexto empresarial
   * @param {string} context - Contexto empresarial
   * @returns {Object} Configuración de iconos y colores
   */
  getBusinessContext: (context) => {
    const contexts = {
      metrics: { icon: 'AttachMoney', color: 'success.main' },
      company: { icon: 'Business', color: 'primary.main' },
      alerts: { icon: 'Warning', color: 'warning.main' },
      trends: { icon: 'TrendingUp', color: 'success.main' },
      settings: { icon: 'Settings', color: 'primary.main' },
      users: { icon: 'Person', color: 'secondary.main' },
      reports: { icon: 'Assessment', color: 'info.main' }
    };
    
    return contexts[context] || contexts.metrics;
  }
};

export default {
  dashboardCardTokens,
  detailedCardTokens,
  paperAccentTokens,
  cardAnimationTokens,
  cardSemanticTokens,
  cardLayoutTokens,
  cardsUtils
};
