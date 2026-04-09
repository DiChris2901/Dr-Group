// 🎯 LOADING STATES TOKENS - Design System 3.0
// Estados de carga empresariales con gradientes spectacular y micro-interacciones

import { gradientTokensLegacy } from './gradients.js';

// ⚡ SKELETON TOKENS - Placeholders empresariales
export const skeletonTokens = {
  // Variantes base
  variants: {
    circular: {
      borderRadius: '50%',
      animation: 'wave'
    },
    rectangular: {
      borderRadius: 2,
      animation: 'wave'
    },
    text: {
      borderRadius: 1,
      animation: 'wave'
    }
  },
  
  // Gradientes empresariales para skeletons
  gradients: {
    primary: {
      background: `linear-gradient(90deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.3), rgba(25, 118, 210, 0.1))`,
      opacity: 0.3
    },
    secondary: {
      background: `linear-gradient(90deg, rgba(156, 39, 176, 0.1), rgba(156, 39, 176, 0.3), rgba(156, 39, 176, 0.1))`,
      opacity: 0.3
    },
    success: {
      background: `linear-gradient(90deg, rgba(46, 125, 50, 0.1), rgba(46, 125, 50, 0.3), rgba(46, 125, 50, 0.1))`,
      opacity: 0.3
    },
    warning: {
      background: `linear-gradient(90deg, rgba(237, 108, 2, 0.1), rgba(237, 108, 2, 0.3), rgba(237, 108, 2, 0.1))`,
      opacity: 0.3
    },
    error: {
      background: `linear-gradient(90deg, rgba(211, 47, 47, 0.1), rgba(211, 47, 47, 0.3), rgba(211, 47, 47, 0.1))`,
      opacity: 0.3
    },
    info: {
      background: `linear-gradient(90deg, rgba(2, 136, 209, 0.1), rgba(2, 136, 209, 0.3), rgba(2, 136, 209, 0.1))`,
      opacity: 0.3
    }
  },

  // Casos uso empresariales
  businessContexts: {
    card: {
      avatar: { width: 48, height: 48, variant: 'circular' },
      title: { variant: 'text', fontSize: '1.25rem', width: '70%' },
      subtitle: { variant: 'text', fontSize: '0.875rem', width: '90%' },
      content: { variant: 'rectangular', height: 120 },
      metrics: { variant: 'text', height: 20, count: 3 }
    },
    list: {
      avatar: { width: 40, height: 40, variant: 'circular' },
      primary: { variant: 'text', fontSize: '1rem', width: '80%' },
      secondary: { variant: 'text', fontSize: '0.875rem', width: '60%' },
      action: { variant: 'rectangular', width: 80, height: 24 }
    },
    table: {
      avatar: { width: 24, height: 24, variant: 'circular' },
      cell: { variant: 'text', width: '70%' },
      status: { variant: 'rectangular', width: 60, height: 20 }
    },
    metrics: {
      value: { variant: 'text', fontSize: '2rem', width: '80%' },
      label: { variant: 'text', fontSize: '0.75rem', width: '100%' }
    }
  }
};

// 🎯 PROGRESS INDICATORS TOKENS
export const progressTokens = {
  // Configuraciones base
  circular: {
    sizes: {
      small: { size: 20, thickness: 3.6 },
      medium: { size: 40, thickness: 3.6 },
      large: { size: 56, thickness: 4 },
      xl: { size: 72, thickness: 4.5 }
    },
    colors: {
      primary: { color: 'primary' },
      secondary: { color: 'secondary' },
      success: { color: 'success' },
      warning: { color: 'warning' },
      error: { color: 'error' },
      info: { color: 'info' }
    }
  },

  linear: {
    heights: {
      thin: 4,
      medium: 8,
      thick: 12,
      xl: 16
    },
    variants: {
      determinate: { variant: 'determinate' },
      buffer: { variant: 'buffer' },
      indeterminate: { variant: 'indeterminate' }
    }
  },

  // Gradientes spectacular para progress
  gradientProgress: {
    primary: {
      background: 'conic-gradient(rgb(102, 126, 234) 75%, rgba(0,0,0,0.1) 75%)',
      filter: 'drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3))'
    },
    secondary: {
      background: 'conic-gradient(rgb(240, 147, 251) 75%, rgba(0,0,0,0.1) 75%)',
      filter: 'drop-shadow(0 4px 12px rgba(240, 147, 251, 0.3))'
    },
    success: {
      background: 'conic-gradient(rgb(79, 172, 254) 75%, rgba(0,0,0,0.1) 75%)',
      filter: 'drop-shadow(0 4px 12px rgba(79, 172, 254, 0.3))'
    }
  }
};

// 🔄 LOADING STATES TOKENS - Estados empresariales específicos
export const loadingStatesTokens = {
  // Contextos empresariales Organizaci�n RDJ
  businessStates: {
    compromisos: {
      gradient: gradientTokensLegacy.primary,
      icon: 'Assignment',
      message: 'Cargando compromisos financieros...',
      context: 'Sincronizando compromisos activos',
      color: 'primary'
    },
    pagos: {
      gradient: gradientTokensLegacy.success,
      icon: 'Payment',
      message: 'Procesando pagos pendientes...',
      context: 'Validando transacciones',
      color: 'success'
    },
    reportes: {
      gradient: gradientTokensLegacy.info,
      icon: 'Assessment',
      message: 'Generando reportes ejecutivos...',
      context: 'Compilando datos del período',
      color: 'info'
    },
    vencimientos: {
      gradient: gradientTokensLegacy.warning,
      icon: 'Schedule',
      message: 'Verificando vencimientos...',
      context: 'Revisando alertas automáticas',
      color: 'warning'
    }
  },

  // Estados de sincronización
  syncStates: {
    firebase: {
      borderColor: 'primary.main',
      backgroundColor: 'primary.main',
      backgroundOpacity: 0.08,
      icon: 'Sync',
      message: 'Sincronizando con Firebase...',
      context: 'Actualizando datos en tiempo real'
    },
    validation: {
      steps: [
        { 
          label: 'Validando permisos de usuario', 
          progress: 100, 
          color: 'success', 
          icon: 'CheckCircle' 
        },
        { 
          label: 'Verificando integridad de datos', 
          progress: 75, 
          color: 'info', 
          icon: 'Security' 
        },
        { 
          label: 'Cargando configuraciones empresariales', 
          progress: 50, 
          color: 'warning', 
          icon: 'Settings' 
        },
        { 
          label: 'Conectando con servicios externos', 
          progress: 25, 
          color: 'error', 
          icon: 'Cloud' 
        }
      ]
    }
  },

  // Estilos para contenedores loading
  containers: {
    gradient: {
      padding: 2.5,
      borderRadius: 2,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: (color) => `0 4px 20px rgba(var(--${color}-rgb), 0.3)`,
      '&:hover': {
        boxShadow: (color) => `0 6px 25px rgba(var(--${color}-rgb), 0.4)`
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
        pointerEvents: 'none'
      }
    },
    dashed: {
      padding: 3,
      border: '2px dashed',
      borderRadius: 2,
      backgroundColor: (color) => `${color}.main`,
      backgroundOpacity: 0.08,
      color: (color) => `${color}.main`,
      position: 'relative',
      overflow: 'hidden'
    }
  },

  // Animaciones Framer Motion
  animations: {
    fadeInUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6 }
    },
    staggeredFadeIn: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      transition: (index) => ({ duration: 0.6, delay: index * 0.2 })
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.8 }
    },
    shimmerEffect: {
      animate: {
        background: [
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
        ],
        x: ['-100%', '100%']
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

// 🛠️ LOADING UTILS - Utilidades para crear estados de carga
export const loadingUtils = {
  // Crear skeleton con gradiente empresarial
  createSkeleton: (variant, color = 'primary', size = {}) => ({
    variant,
    animation: 'wave',
    sx: {
      ...skeletonTokens.gradients[color],
      ...size,
      ...skeletonTokens.variants[variant]
    }
  }),

  // Crear skeleton para contexto empresarial
  createBusinessSkeleton: (context, color = 'primary') => {
    const config = skeletonTokens.businessContexts[context];
    if (!config) return {};

    return Object.entries(config).reduce((acc, [key, props]) => {
      acc[key] = {
        ...props,
        sx: {
          ...skeletonTokens.gradients[color],
          ...props
        }
      };
      return acc;
    }, {});
  },

  // Crear progress circular con tamaño
  createCircularProgress: (size = 'medium', color = 'primary') => ({
    ...progressTokens.circular.sizes[size],
    ...progressTokens.circular.colors[color],
    sx: {
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    }
  }),

  // Crear progress determinado con métricas
  createDeterminateProgress: (value, label, context, color = 'primary') => ({
    variant: 'determinate',
    value,
    color,
    label,
    context,
    sx: {
      height: 10,
      borderRadius: 1,
      backgroundColor: `${color}.main`,
      backgroundOpacity: 0.1,
      '& .MuiLinearProgress-bar': {
        borderRadius: 1
      }
    }
  }),

  // Crear estado de carga empresarial
  createBusinessLoadingState: (type) => {
    const state = loadingStatesTokens.businessStates[type];
    if (!state) return {};

    return {
      ...state,
      containerSx: {
        display: 'flex',
        alignItems: 'center',
        background: state.gradient,
        ...loadingStatesTokens.containers.gradient,
        boxShadow: loadingStatesTokens.containers.gradient.boxShadow(state.color),
        '&:hover': {
          boxShadow: loadingStatesTokens.containers.gradient['&:hover'].boxShadow(state.color)
        }
      },
      iconContainerSx: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)'
      }
    };
  },

  // Crear estado de sincronización
  createSyncState: () => ({
    ...loadingStatesTokens.syncStates.firebase,
    containerSx: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `2px dashed`,
      borderColor: loadingStatesTokens.syncStates.firebase.borderColor,
      backgroundColor: `${loadingStatesTokens.syncStates.firebase.backgroundColor}${Math.round(loadingStatesTokens.syncStates.firebase.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
      color: loadingStatesTokens.syncStates.firebase.borderColor,
      ...loadingStatesTokens.containers.dashed
    }
  }),

  // Crear pasos de validación
  createValidationSteps: () => 
    loadingStatesTokens.syncStates.validation.steps.map((step, index) => ({
      ...step,
      containerSx: {
        padding: 2,
        borderRadius: 1,
        backgroundColor: `${step.color}.main`,
        backgroundOpacity: 0.05,
        border: `1px solid`,
        borderColor: `${step.color}.main`,
        borderOpacity: 0.2
      },
      iconContainerSx: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: `${step.color}.main`,
        backgroundOpacity: 0.15
      },
      progressSx: {
        height: 6,
        borderRadius: 1,
        backgroundColor: `${step.color}.main`,
        backgroundOpacity: 0.15
      },
      animation: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: index * 0.1 }
      }
    })),

  // Obtener animación por tipo
  getAnimation: (type) => loadingStatesTokens.animations[type] || {},

  // Crear progress con gradiente spectacular
  createGradientProgress: (type = 'primary', value = 75) => ({
    value,
    containerSx: {
      position: 'relative',
      width: 100,
      height: 100,
      ...progressTokens.gradientProgress[type]
    },
    centerContentSx: {
      width: 75,
      height: 75,
      borderRadius: '50%',
      backgroundColor: 'background.paper',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
    }
  })
};

// Exportar todos los tokens y utilidades
export const loadingTokens = {
  skeleton: skeletonTokens,
  progress: progressTokens,
  states: loadingStatesTokens
};

export default {
  loadingTokens,
  loadingUtils
};
