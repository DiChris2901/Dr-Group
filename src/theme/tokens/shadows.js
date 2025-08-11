/**
 * 🎭 DR Group Design System 3.0 - Shadow Tokens
 * Tokens de sombras extraídos del sistema establecido
 */

// ========================================
// 📐 SHADOW TOKENS - SISTEMA ESTÁNDAR
// ========================================

export const shadowTokens = {
  // Sombras básicas
  none: 'none',
  soft: '0 2px 8px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
  strong: '0 8px 24px rgba(0, 0, 0, 0.2)',
  modal: '0 24px 48px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',

  // Sombras elevation system (Material Design)
  elevation: {
    0: 'none',
    1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)'
  }
};

// ========================================
// 🌈 COLORED SHADOWS - SOMBRAS CON COLOR
// ========================================

export const coloredShadowTokens = {
  primary: '0 4px 15px rgba(33, 150, 243, 0.4)',
  primaryHover: '0 8px 25px rgba(33, 150, 243, 0.5)',
  secondary: '0 4px 12px rgba(156, 39, 176, 0.3)',
  success: '0 4px 12px rgba(76, 175, 80, 0.3)',
  warning: '0 4px 12px rgba(255, 152, 0, 0.3)',
  error: '0 4px 12px rgba(244, 67, 54, 0.3)',
  info: '0 4px 12px rgba(33, 150, 243, 0.3)',

  // Variantes suaves para hover states
  soft: {
    primary: '0 2px 8px rgba(33, 150, 243, 0.2)',
    secondary: '0 2px 8px rgba(156, 39, 176, 0.2)',
    success: '0 2px 8px rgba(76, 175, 80, 0.2)',
    warning: '0 2px 8px rgba(255, 152, 0, 0.2)',
    error: '0 2px 8px rgba(244, 67, 54, 0.2)',
    info: '0 2px 8px rgba(33, 150, 243, 0.2)'
  }
};

// ========================================
// 🎨 INNER SHADOWS - SOMBRAS INTERNAS
// ========================================

export const innerShadowTokens = {
  subtle: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
  medium: 'inset 0 2px 4px rgba(0, 0, 0, 0.15)',
  strong: 'inset 0 4px 8px rgba(0, 0, 0, 0.2)',
  
  // Para inputs y campos de texto
  input: 'inset 0 1px 2px rgba(0, 0, 0, 0.08)',
  inputFocus: 'inset 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 2px rgba(33, 150, 243, 0.2)'
};

// ========================================
// 🛠️ SHADOW UTILS
// ========================================

export const shadowUtils = {
  /**
   * Generar sombra con color personalizado
   * @param {string} color - Color en formato hex, rgb, etc.
   * @param {number} intensity - Intensidad de la sombra (0-1)
   * @param {string} size - Tamaño: 'small', 'medium', 'large'
   * @returns {string} Sombra CSS
   */
  createColoredShadow: (color, intensity = 0.4, size = 'medium') => {
    const opacityHex = Math.round(intensity * 255).toString(16).padStart(2, '0');
    
    const sizes = {
      small: '0 2px 8px',
      medium: '0 4px 15px', 
      large: '0 8px 25px'
    };
    
    return `${sizes[size] || sizes.medium} ${color}${opacityHex}`;
  },

  /**
   * Generar sombra con transparencia
   * @param {string} shadowType - Tipo de sombra base
   * @param {number} opacity - Opacidad final (0-1)
   * @returns {string} Sombra CSS modificada
   */
  withOpacity: (shadowType, opacity = 1) => {
    const shadow = shadowTokens[shadowType] || shadowTokens.soft;
    // Modificar opacity en rgba values (simple implementation)
    return shadow.replace(/rgba\(([^)]+)\)/g, (match, values) => {
      const parts = values.split(',');
      if (parts.length === 4) {
        const currentOpacity = parseFloat(parts[3].trim());
        const newOpacity = (currentOpacity * opacity).toFixed(2);
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${newOpacity})`;
      }
      return match;
    });
  },

  /**
   * Combinar múltiples sombras
   * @param {...string} shadows - Lista de sombras a combinar
   * @returns {string} Sombras combinadas
   */
  combine: (...shadows) => {
    return shadows.filter(Boolean).join(', ');
  },

  /**
   * Obtener sombra por nivel de elevation
   * @param {number} level - Nivel de elevation (0-5)
   * @returns {string} Sombra CSS
   */
  getElevation: (level = 1) => {
    return shadowTokens.elevation[level] || shadowTokens.elevation[1];
  }
};

export default {
  shadowTokens,
  coloredShadowTokens,
  innerShadowTokens,
  shadowUtils
};
