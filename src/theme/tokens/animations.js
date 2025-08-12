// ========================================
// 🎬 ANIMATION TOKENS — DR GROUP DASHBOARD  
// ========================================
// Configuraciones Framer Motion empresariales tokenizadas
// Fecha: 12 de Agosto, 2025 - Design System 3.0

import { gradientTokensLegacy } from './gradients.js';

// ========================================
// 🎯 BASE ANIMATION CONFIGURATIONS
// ========================================

export const baseAnimationTokens = {
  // Duraciones empresariales
  durations: {
    instant: 0.15,
    fast: 0.25,
    standard: 0.3,
    complex: 0.45,
    spectacular: 0.6
  },

  // Easing curves spectacular
  easings: {
    standard: [0.4, 0, 0.2, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
    sharp: [0.4, 0, 0.6, 1],
    spectacular: [0.23, 1, 0.32, 1]
  },

  // Stagger configurations
  stagger: {
    tight: 0.1,
    standard: 0.15,
    relaxed: 0.2,
    spectacular: 0.25
  }
};

// ========================================
// 🎭 ENTRANCE ANIMATIONS
// ========================================

export const entranceAnimationTokens = {
  // Fade variations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.standard 
    }
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.decelerate 
    }
  },

  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.spectacular 
    }
  },

  // Slide variations
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.decelerate 
    }
  },

  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.decelerate 
    }
  },

  // Spectacular entrance
  spectacularEntrance: {
    initial: { 
      opacity: 0, 
      y: 30, 
      scale: 0.9,
      rotate: -5 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotate: 0 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      rotate: 3 
    },
    transition: { 
      duration: baseAnimationTokens.durations.spectacular,
      ease: baseAnimationTokens.easings.spectacular 
    }
  }
};

// ========================================
// 🎪 HOVER & INTERACTION ANIMATIONS  
// ========================================

export const hoverAnimationTokens = {
  // Lift effects
  liftSubtle: {
    scale: 1.02,
    y: -2,
    transition: { 
      duration: baseAnimationTokens.durations.fast,
      ease: baseAnimationTokens.easings.decelerate 
    }
  },

  liftStandard: {
    scale: 1.05,
    y: -4,
    transition: { 
      duration: baseAnimationTokens.durations.fast,
      ease: baseAnimationTokens.easings.decelerate 
    }
  },

  liftSpectacular: {
    scale: 1.08,
    y: -8,
    rotate: [0, 1, -1, 0],
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.spectacular 
    }
  },

  // Pulse effects
  pulseSubtle: {
    scale: [1, 1.02, 1],
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      repeat: Infinity,
      ease: baseAnimationTokens.easings.standard 
    }
  },

  pulseGradient: {
    scale: [1, 1.05, 1],
    background: [
      gradientTokensLegacy.primary,
      gradientTokensLegacy.info,
      gradientTokensLegacy.primary
    ],
    transition: { 
      duration: baseAnimationTokens.durations.spectacular,
      repeat: Infinity,
      ease: baseAnimationTokens.easings.spectacular 
    }
  },

  // Rotation effects
  rotateSubtle: {
    rotate: [0, 5, -5, 0],
    transition: { 
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.standard 
    }
  },

  rotateSpectacular: {
    rotate: [0, 10, -10, 5, 0],
    scale: [1, 1.05, 1],
    transition: { 
      duration: baseAnimationTokens.durations.spectacular,
      ease: baseAnimationTokens.easings.spectacular 
    }
  }
};

// ========================================
// 🎨 GRADIENT ANIMATION EFFECTS
// ========================================

export const gradientAnimationTokens = {
  // Shimmer effect
  shimmer: {
    backgroundSize: ['200% 100%', '200% 100%'],
    backgroundPosition: ['-100% 0%', '100% 0%'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear'
    }
  },

  // Gradient shift
  gradientShift: {
    background: [
      gradientTokensLegacy.primary,
      gradientTokensLegacy.success,
      gradientTokensLegacy.info,
      gradientTokensLegacy.primary
    ],
    transition: {
      duration: baseAnimationTokens.durations.spectacular * 4,
      repeat: Infinity,
      ease: baseAnimationTokens.easings.standard
    }
  },

  // Gradient pulse
  gradientPulse: {
    background: [
      gradientTokensLegacy.primary,
      gradientTokensLegacy.info,
      gradientTokensLegacy.primary
    ],
    scale: [1, 1.02, 1],
    transition: {
      duration: baseAnimationTokens.durations.spectacular,
      repeat: Infinity,
      ease: baseAnimationTokens.easings.spectacular
    }
  }
};

// ========================================
// 🏢 BUSINESS-SPECIFIC ANIMATIONS  
// ========================================

export const businessAnimationTokens = {
  // Compromisos financieros
  commitmentCard: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    whileHover: {
      y: -4,
      scale: 1.02,
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      transition: { duration: baseAnimationTokens.durations.fast }
    },
    tap: { scale: 0.98 },
    transition: {
      duration: baseAnimationTokens.durations.standard,
      ease: baseAnimationTokens.easings.decelerate
    }
  },

  // Dashboard metrics
  metricCounter: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        delay: 0.2,
        duration: baseAnimationTokens.durations.standard,
        ease: baseAnimationTokens.easings.spectacular
      }
    },
    whileHover: {
      scale: 1.05,
      transition: { duration: baseAnimationTokens.durations.fast }
    }
  },

  // Status indicators
  statusIndicator: {
    initial: { scale: 0 },
    animate: { 
      scale: 1,
      rotate: [0, 10, -10, 0],
      transition: {
        duration: baseAnimationTokens.durations.standard,
        ease: baseAnimationTokens.easings.spectacular
      }
    },
    whileHover: {
      scale: 1.1,
      rotate: [0, 5, -5, 0],
      transition: { duration: baseAnimationTokens.durations.fast }
    }
  },

  // Form validation
  validationSuccess: {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 10
      }
    }
  },

  validationError: {
    animate: {
      x: [0, -10, 10, -5, 5, 0],
      transition: {
        duration: baseAnimationTokens.durations.standard,
        ease: baseAnimationTokens.easings.sharp
      }
    }
  }
};

// ========================================
// 🔄 STAGGER ANIMATIONS
// ========================================

export const staggerAnimationTokens = {
  // Card grids
  cardGrid: {
    container: {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: {
          staggerChildren: baseAnimationTokens.stagger.standard,
          delayChildren: 0.1
        }
      }
    },
    item: entranceAnimationTokens.fadeInUp
  },

  // List items
  listItems: {
    container: {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: {
          staggerChildren: baseAnimationTokens.stagger.tight,
          delayChildren: 0.05
        }
      }
    },
    item: entranceAnimationTokens.slideInLeft
  },

  // Navigation items
  navigation: {
    container: {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: {
          staggerChildren: baseAnimationTokens.stagger.relaxed,
          delayChildren: 0.2
        }
      }
    },
    item: entranceAnimationTokens.spectacularEntrance
  }
};

// ========================================
// 📱 RESPONSIVE ANIMATIONS
// ========================================

export const responsiveAnimationTokens = {
  // Reduce animations on mobile
  mobile: {
    duration: baseAnimationTokens.durations.fast,
    reducedMotion: {
      transition: { duration: 0.01 }
    }
  },

  // Enhanced animations on desktop
  desktop: {
    duration: baseAnimationTokens.durations.spectacular,
    enhancedEffects: true
  }
};

// ========================================
// 🎯 COMBINED ANIMATION TOKENS
// ========================================

export const animationTokens = {
  base: baseAnimationTokens,
  entrance: entranceAnimationTokens,
  hover: hoverAnimationTokens,
  gradient: gradientAnimationTokens,
  business: businessAnimationTokens,
  stagger: staggerAnimationTokens,
  responsive: responsiveAnimationTokens
};

// ========================================
// 🛠️ ANIMATION UTILITIES
// ========================================

export const animationUtils = {
  /**
   * Crea props de animación de entrada para Framer Motion
   * @param {string} type - Tipo de entrada: 'fade', 'fadeUp', 'fadeScale', 'slideLeft', 'slideRight', 'spectacular'
   * @param {number} delay - Delay opcional
   * @returns {object} Props de Framer Motion
   */
  createEntranceProps: (type = 'fadeUp', delay = 0) => {
    const baseProps = entranceAnimationTokens[type === 'fade' ? 'fadeIn' : 
                      type === 'fadeUp' ? 'fadeInUp' :
                      type === 'fadeScale' ? 'fadeInScale' :
                      type === 'slideLeft' ? 'slideInLeft' :
                      type === 'slideRight' ? 'slideInRight' :
                      type === 'spectacular' ? 'spectacularEntrance' : 'fadeInUp'];
    
    return {
      ...baseProps,
      transition: {
        ...baseProps.transition,
        delay: delay
      }
    };
  },

  /**
   * Crea props de hover para Framer Motion
   * @param {string} effect - Tipo de efecto: 'liftSubtle', 'liftStandard', 'liftSpectacular', 'pulseSubtle', 'rotateSubtle'
   * @returns {object} Props whileHover de Framer Motion
   */
  createHoverProps: (effect = 'liftSubtle') => {
    return {
      whileHover: hoverAnimationTokens[effect] || hoverAnimationTokens.liftSubtle,
      whileTap: { scale: 0.98 }
    };
  },

  /**
   * Crea props para animaciones de gradiente
   * @param {string} effect - Tipo de efecto: 'shimmer', 'gradientShift', 'gradientPulse'
   * @returns {object} Props de Framer Motion
   */
  createGradientAnimation: (effect = 'shimmer') => {
    return {
      animate: gradientAnimationTokens[effect] || gradientAnimationTokens.shimmer
    };
  },

  /**
   * Crea props para animaciones empresariales específicas
   * @param {string} type - Tipo: 'commitmentCard', 'metricCounter', 'statusIndicator', 'validationSuccess', 'validationError'
   * @returns {object} Props de Framer Motion
   */
  createBusinessAnimation: (type) => {
    return businessAnimationTokens[type] || businessAnimationTokens.commitmentCard;
  },

  /**
   * Crea props para contenedores con stagger
   * @param {string} type - Tipo: 'cardGrid', 'listItems', 'navigation'
   * @param {number} customDelay - Delay personalizado entre elementos
   * @returns {object} Props de contenedor con stagger
   */
  createStaggerContainer: (type = 'cardGrid', customDelay = null) => {
    const staggerConfig = staggerAnimationTokens[type] || staggerAnimationTokens.cardGrid;
    
    if (customDelay) {
      return {
        ...staggerConfig.container,
        animate: {
          ...staggerConfig.container.animate,
          transition: {
            ...staggerConfig.container.animate.transition,
            staggerChildren: customDelay
          }
        }
      };
    }
    
    return staggerConfig.container;
  },

  /**
   * Crea props para elementos de stagger
   * @param {string} type - Tipo: 'cardGrid', 'listItems', 'navigation'
   * @returns {object} Props de elemento stagger
   */
  createStaggerItem: (type = 'cardGrid') => {
    const staggerConfig = staggerAnimationTokens[type] || staggerAnimationTokens.cardGrid;
    return staggerConfig.item;
  },

  /**
   * Crea animación personalizada combinando múltiples efectos
   * @param {object} config - Configuración personalizada
   * @returns {object} Props de Framer Motion personalizadas
   */
  createCustomAnimation: (config) => {
    const {
      entrance = 'fadeUp',
      hover = 'liftSubtle',
      delay = 0,
      duration = 'standard'
    } = config;

    return {
      ...animationUtils.createEntranceProps(entrance, delay),
      ...animationUtils.createHoverProps(hover),
      transition: {
        duration: baseAnimationTokens.durations[duration] || baseAnimationTokens.durations.standard,
        ease: baseAnimationTokens.easings.standard
      }
    };
  },

  /**
   * Obtiene configuración responsive de animaciones
   * @param {boolean} isMobile - Si es dispositivo móvil
   * @returns {object} Configuración responsive
   */
  getResponsiveConfig: (isMobile = false) => {
    return isMobile ? responsiveAnimationTokens.mobile : responsiveAnimationTokens.desktop;
  },

  /**
   * Crea props con soporte para prefers-reduced-motion
   * @param {object} animation - Animación base
   * @returns {object} Animación con soporte para reduced motion
   */
  createAccessibleAnimation: (animation) => {
    return {
      ...animation,
      transition: {
        ...animation.transition,
        duration: animation.transition?.duration || baseAnimationTokens.durations.standard
      }
    };
  }
};

export default animationTokens;
