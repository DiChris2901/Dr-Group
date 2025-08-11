/**
 * 📐 DR Group Design System 3.0 - Spacing Tokens  
 * Tokens de espaciado extraídos del sistema establecido
 */

// ========================================
// 📏 SPACING SCALE - SISTEMA BASE
// ========================================

export const spacingTokens = {
  // Escala base (múltiplos de 4px)
  0: 0,      // 0px
  1: 4,      // 4px  
  2: 8,      // 8px
  3: 12,     // 12px
  4: 16,     // 16px
  5: 20,     // 20px
  6: 24,     // 24px
  7: 28,     // 28px
  8: 32,     // 32px
  10: 40,    // 40px
  12: 48,    // 48px
  16: 64,    // 64px
  20: 80,    // 80px
  24: 96,    // 96px
  32: 128,   // 128px
  40: 160,   // 160px
  48: 192,   // 192px
  56: 224,   // 224px
  64: 256,   // 256px

  // Aliases semánticos
  xs: 4,     // Extra small
  sm: 8,     // Small
  md: 16,    // Medium  
  lg: 24,    // Large
  xl: 32,    // Extra large
  '2xl': 48, // 2X large
  '3xl': 64, // 3X large
  '4xl': 96, // 4X large
};

// ========================================
// 🧩 COMPONENT SPACING - ESPACIADO DE COMPONENTES
// ========================================

export const componentSpacingTokens = {
  // Padding interno de componentes
  padding: {
    none: 0,
    xs: 8,     // 8px
    sm: 12,    // 12px  
    md: 16,    // 16px
    lg: 24,    // 24px
    xl: 32,    // 32px
    '2xl': 48  // 48px
  },

  // Margin externo de componentes  
  margin: {
    none: 0,
    xs: 4,     // 4px
    sm: 8,     // 8px
    md: 16,    // 16px
    lg: 24,    // 24px  
    xl: 32,    // 32px
    '2xl': 48, // 48px
    '3xl': 64  // 64px
  },

  // Gap para layouts flexbox/grid
  gap: {
    none: 0,
    xs: 4,     // 4px
    sm: 8,     // 8px
    md: 16,    // 16px
    lg: 24,    // 24px
    xl: 32,    // 32px
    '2xl': 48  // 48px
  }
};

// ========================================
// 🎨 BORDER RADIUS TOKENS
// ========================================

export const borderRadiusTokens = {
  none: 0,
  xs: 4,      // 4px
  sm: 6,      // 6px  
  md: 8,      // 8px
  lg: 12,     // 12px
  xl: 16,     // 16px
  '2xl': 24,  // 24px
  '3xl': 32,  // 32px
  full: 9999, // Totalmente redondeado
  
  // Aliases semánticos
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  round: '50%' 
};

// ========================================
// 📏 LAYOUT SPACING - ESPACIADO DE LAYOUTS
// ========================================

export const layoutSpacingTokens = {
  // Contenedores principales
  container: {
    xs: 16,    // Mobile: 16px
    sm: 24,    // Tablet: 24px  
    md: 32,    // Desktop: 32px
    lg: 48,    // Large: 48px
    xl: 64     // XL: 64px
  },

  // Secciones de página
  section: {
    xs: 32,    // 32px
    sm: 48,    // 48px
    md: 64,    // 64px
    lg: 96,    // 96px
    xl: 128    // 128px
  },

  // Grids y columnas
  grid: {
    gutter: 16,   // 16px entre columnas
    row: 24,      // 24px entre filas
    section: 48   // 48px entre secciones
  }
};

// ========================================
// 🛠️ SPACING UTILS
// ========================================

export const spacingUtils = {
  /**
   * Obtener valor de espaciado por token
   * @param {string|number} token - Token de espaciado
   * @returns {number} Valor en píxeles
   */
  get: (token) => {
    if (typeof token === 'number') return token;
    return spacingTokens[token] || spacingTokens.md;
  },

  /**
   * Obtener espaciado de componente
   * @param {string} type - Tipo: 'padding', 'margin', 'gap'
   * @param {string} size - Tamaño: 'xs', 'sm', 'md', etc.
   * @returns {number} Valor en píxeles
   */
  getComponent: (type = 'padding', size = 'md') => {
    return componentSpacingTokens[type]?.[size] || componentSpacingTokens.padding.md;
  },

  /**
   * Crear espaciado responsive
   * @param {Object} breakpoints - Valores por breakpoint
   * @returns {Object} Configuración responsive
   */
  responsive: (breakpoints) => {
    const { xs, sm, md, lg, xl } = breakpoints;
    return {
      ...(xs && { padding: xs }),
      '@media (min-width: 600px)': sm && { padding: sm },
      '@media (min-width: 900px)': md && { padding: md },
      '@media (min-width: 1200px)': lg && { padding: lg },
      '@media (min-width: 1536px)': xl && { padding: xl }
    };
  },

  /**
   * Crear espaciado simétrico
   * @param {number|string} value - Valor de espaciado
   * @returns {Object} Padding/margin simétrico
   */
  symmetric: (value) => {
    const spacing = spacingUtils.get(value);
    return {
      paddingTop: spacing,
      paddingBottom: spacing,
      paddingLeft: spacing,
      paddingRight: spacing
    };
  },

  /**
   * Crear espaciado asimétrico
   * @param {Object} values - Valores por lado {top, right, bottom, left}
   * @returns {Object} Padding/margin asimétrico
   */
  asymmetric: ({ top, right, bottom, left }) => ({
    ...(top !== undefined && { paddingTop: spacingUtils.get(top) }),
    ...(right !== undefined && { paddingRight: spacingUtils.get(right) }),
    ...(bottom !== undefined && { paddingBottom: spacingUtils.get(bottom) }),
    ...(left !== undefined && { paddingLeft: spacingUtils.get(left) })
  }),

  /**
   * Calcular espaciado en rem
   * @param {number|string} value - Valor en píxeles o token
   * @param {number} baseFontSize - Tamaño base de fuente (default: 16px)
   * @returns {string} Valor en rem
   */
  toRem: (value, baseFontSize = 16) => {
    const pxValue = spacingUtils.get(value);
    return `${pxValue / baseFontSize}rem`;
  }
};

export default {
  spacingTokens,
  componentSpacingTokens,
  borderRadiusTokens,
  layoutSpacingTokens,
  spacingUtils
};
