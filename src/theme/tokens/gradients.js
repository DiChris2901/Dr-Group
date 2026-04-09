/**
 * 🌈 Organizaci�n RDJ Design System 3.0 - Gradient Tokens
 * Tokens de gradientes extraídos del sistema establecido
 */

// ========================================
// 🎨 GRADIENT TOKENS V2 - SISTEMA COMPLETO
// ========================================

export const gradientTokens = {
  // Primary gradients  
  primary: {
    full: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    soft: 'linear-gradient(135deg, #8899f233 0%, #8d6fb844 100%)'
  },

  // Secondary gradients
  secondary: {
    full: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    soft: 'linear-gradient(135deg, #f3b8fd33 0%, #f7797f44 100%)'
  },

  // Success gradients
  success: {
    full: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    soft: 'linear-gradient(135deg, #6fb9fe33 0%, #33f2fe44 100%)'
  },

  // Warning gradients
  warning: {
    full: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)',
    soft: 'linear-gradient(135deg, #ffc56f33 0%, #ffe06644 100%)'
  },

  // Error gradients
  error: {
    full: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    soft: 'linear-gradient(135deg, #ff858533 0%, #f2743f44 100%)'
  },

  // Info gradients
  info: {
    full: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    soft: 'linear-gradient(135deg, #95c8ff33 0%, #3d9ae644 100%)'
  },

  // Dark gradients
  dark: {
    full: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    soft: 'linear-gradient(135deg, #2c3e5033 0%, #3498db44 100%)'
  }
};

// ========================================
// 🎨 GRADIENT TOKENS V1 - COMPATIBILIDAD
// ========================================

export const gradientTokensLegacy = {
  // Gradiente principal de la marca
  primary: 'linear-gradient(135deg, #2196f3 0%, #9c27b0 100%)',
  
  // Gradientes de fondo para diferentes modos
  lightBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  darkBackground: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)',
  
  // Gradientes semánticos legacy
  success: 'linear-gradient(135deg, #81c784 0%, #4caf50 100%)',
  warning: 'linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)',
  error: 'linear-gradient(135deg, #e57373 0%, #f44336 100%)',
  info: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 100%)',
  
  // Gradientes sutiles para overlays
  infoOverlay: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
  warningOverlay: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
  successOverlay: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
  errorOverlay: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)'
};

// ========================================
// 🛠️ GRADIENT UTILS
// ========================================

export const gradientUtils = {
  /**
   * Obtener gradiente por tipo y variante
   * @param {string} type - Tipo de gradiente (primary, secondary, etc.)
   * @param {string} variant - Variante (full, soft)
   * @returns {string} Gradiente CSS
   */
  getGradient: (type = 'primary', variant = 'full') => {
    return gradientTokens[type]?.[variant] || gradientTokens.primary.full;
  },

  /**
   * Crear gradiente personalizado con opacidad
   * @param {string} color1 - Color inicial
   * @param {string} color2 - Color final  
   * @param {number} opacity - Opacidad (0-1)
   * @param {number} angle - Ángulo en grados
   * @returns {string} Gradiente CSS
   */
  createCustomGradient: (color1, color2, opacity = 1, angle = 135) => {
    const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `linear-gradient(${angle}deg, ${color1}${opacityHex} 0%, ${color2}${opacityHex} 100%)`;
  },

  /**
   * Obtener gradiente legacy por compatibilidad
   * @param {string} type - Tipo de gradiente legacy
   * @returns {string} Gradiente CSS
   */
  getLegacyGradient: (type = 'primary') => {
    return gradientTokensLegacy[type] || gradientTokensLegacy.primary;
  }
};

export default {
  gradientTokens,
  gradientTokensLegacy,
  gradientUtils
};
