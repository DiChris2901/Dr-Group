/**
 * 📝 DR Group Design System 3.0 - Typography Tokens
 * Tokens de tipografía extraídos de la Escala Tipográfica 3.0 establecida
 */

// ========================================
// 📏 TYPOGRAPHY SCALE 3.0 - SISTEMA DEFINIDO
// ========================================

export const typographyScaleTokens = {
  // Display scale (encabezados principales)
  display: {
    '2xl': {
      fontSize: '3.5rem',    // 56px
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.5px',
      note: 'Solo portada / hero'
    },
    'xl': {
      fontSize: '3rem',      // 48px
      fontWeight: 800,
      lineHeight: 1.12,
      letterSpacing: '-0.5px',
      note: 'Encabezados de secciones principales'
    }
  },

  // Heading scale (H1-H6)
  heading: {
    'h1': {
      fontSize: '2.5rem',    // 40px
      fontWeight: 700,
      lineHeight: 1.18,
      letterSpacing: '-0.5px',
      note: 'Título página interna'
    },
    'h2': {
      fontSize: '2rem',      // 32px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.25px',
      note: 'Subsección principal'
    },
    'h3': {
      fontSize: '1.75rem',   // 28px
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.25px',
      note: 'Bloques dentro de secciones'
    },
    'h4': {
      fontSize: '1.5rem',    // 24px
      fontWeight: 600,
      lineHeight: 1.28,
      letterSpacing: '-0.25px',
      note: 'Encabezado widget'
    },
    'h5': {
      fontSize: '1.25rem',   // 20px
      fontWeight: 600,
      lineHeight: 1.32,
      letterSpacing: '-0.15px',
      note: 'Titular compacto'
    },
    'h6': {
      fontSize: '1.125rem',  // 18px
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '-0.15px',
      note: 'Etiqueta subsección menor'
    }
  },

  // Body text scale
  body: {
    'lg': {
      fontSize: '1.125rem',  // 18px
      fontWeight: 400,
      lineHeight: 1.55,
      letterSpacing: '0',
      note: 'Párrafos destacados'
    },
    'md': {
      fontSize: '1rem',      // 16px
      fontWeight: 400,
      lineHeight: 1.55,
      letterSpacing: '0',
      note: 'Texto estándar'
    },
    'sm': {
      fontSize: '0.875rem',  // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0',
      note: 'Secundario / tablas'
    }
  },

  // Specialized roles
  specialized: {
    'label': {
      fontSize: '0.8125rem', // 13px
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: '0.5px',
      note: 'Form labels'
    },
    'overline': {
      fontSize: '0.6875rem', // 11px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      note: 'Agrupadores superiores'
    },
    'caption': {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0',
      note: 'Notas / ayuda'
    },
    'code': {
      fontSize: '0.8125rem', // 13px
      fontWeight: 500,
      lineHeight: 1.45,
      letterSpacing: '0',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      note: 'Snippets técnicos'
    },
    'numeric': {
      fontSize: '1.25rem',   // 20px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0',
      note: 'KPIs / métricas'
    }
  },

  // Text scale (textos y párrafos)
  text: {
    'xl': {
      fontSize: '1.25rem',   // 20px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em'
    },
    'lg': {
      fontSize: '1.125rem',  // 18px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em'
    },
    'md': {
      fontSize: '1rem',      // 16px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em'
    },
    'sm': {
      fontSize: '0.875rem',  // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em'
    },
    'xs': {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em'
    }
  }
};

// ========================================
// ⚖️ FONT WEIGHT TOKENS
// ========================================

export const fontWeightTokens = {
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900
};

// ========================================
// 📐 LINE HEIGHT TOKENS
// ========================================

export const lineHeightTokens = {
  none: 1,
  tight: 1.1,
  snug: 1.2,
  normal: 1.3,
  relaxed: 1.5,
  loose: 1.6
};

// ========================================
// 🔤 LETTER SPACING TOKENS
// ========================================

export const letterSpacingTokens = {
  tighter: '-0.02em',
  tight: '-0.01em', 
  normal: '0em',
  wide: '0.01em',
  wider: '0.02em',
  widest: '0.08em' // para overlines y caps
};

// ========================================
// 👨‍💻 FONT FAMILY TOKENS  
// ========================================

export const fontFamilyTokens = {
  system: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"'
  ].join(','),
  
  mono: [
    '"SF Mono"',
    'Monaco',
    'Inconsolata',
    '"Roboto Mono"',
    '"Source Code Pro"',
    'monospace'
  ].join(','),

  serif: [
    'Georgia',
    'Cambria',
    '"Times New Roman"',
    'Times',
    'serif'
  ].join(',')
};

// ========================================
// 🎯 SEMANTIC TYPOGRAPHY - ROLES DEFINIDOS
// ========================================

export const semanticTypographyTokens = {
  heading: {
    h1: {
      ...typographyScaleTokens.display.lg,
      fontFamily: fontFamilyTokens.system
    },
    h2: {
      ...typographyScaleTokens.display.md,
      fontFamily: fontFamilyTokens.system
    },
    h3: {
      ...typographyScaleTokens.display.sm,
      fontFamily: fontFamilyTokens.system
    },
    h4: {
      ...typographyScaleTokens.display.xs,
      fontFamily: fontFamilyTokens.system
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: fontWeightTokens.bold,
      lineHeight: lineHeightTokens.normal,
      fontFamily: fontFamilyTokens.system
    },
    h6: {
      fontSize: '1.125rem', 
      fontWeight: fontWeightTokens.semiBold,
      lineHeight: lineHeightTokens.normal,
      fontFamily: fontFamilyTokens.system
    }
  },

  body: {
    large: {
      ...typographyScaleTokens.text.xl,
      fontFamily: fontFamilyTokens.system
    },
    medium: {
      ...typographyScaleTokens.text.md,
      fontFamily: fontFamilyTokens.system
    },
    small: {
      ...typographyScaleTokens.text.sm,
      fontFamily: fontFamilyTokens.system
    }
  },

  label: {
    large: {
      fontSize: '1rem',
      fontWeight: fontWeightTokens.medium,
      lineHeight: lineHeightTokens.normal,
      fontFamily: fontFamilyTokens.system
    },
    medium: {
      fontSize: '0.875rem',
      fontWeight: fontWeightTokens.medium, 
      lineHeight: lineHeightTokens.normal,
      fontFamily: fontFamilyTokens.system
    },
    small: {
      fontSize: '0.75rem',
      fontWeight: fontWeightTokens.medium,
      lineHeight: lineHeightTokens.normal,
      fontFamily: fontFamilyTokens.system
    }
  },

  caption: {
    fontSize: '0.75rem',
    fontWeight: fontWeightTokens.regular,
    lineHeight: lineHeightTokens.normal,
    fontFamily: fontFamilyTokens.system
  },

  overline: {
    fontSize: '0.75rem',
    fontWeight: fontWeightTokens.medium,
    lineHeight: lineHeightTokens.normal,
    letterSpacing: letterSpacingTokens.widest,
    textTransform: 'uppercase',
    fontFamily: fontFamilyTokens.system
  },

  button: {
    fontSize: '0.875rem',
    fontWeight: fontWeightTokens.semiBold,
    lineHeight: lineHeightTokens.tight,
    textTransform: 'none',
    fontFamily: fontFamilyTokens.system
  }
};

// ========================================
// 🎯 MUI TYPOGRAPHY VARIANTS
// ========================================

export const muiTypographyVariants = {
  h1: {
    fontSize: '2.5rem',    // 40px
    fontWeight: 700,
    lineHeight: 1.18,
    letterSpacing: '-0.5px'
  },
  h2: {
    fontSize: '2rem',      // 32px
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.25px'
  },
  h3: {
    fontSize: '1.75rem',   // 28px
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: '-0.25px'
  },
  h4: {
    fontSize: '1.5rem',    // 24px
    fontWeight: 600,
    lineHeight: 1.27,
    letterSpacing: '0px'
  },
  h5: {
    fontSize: '1.25rem',   // 20px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '0px'
  },
  h6: {
    fontSize: '1.125rem',  // 18px
    fontWeight: 600,
    lineHeight: 1.33,
    letterSpacing: '0px'
  },
  body1: {
    fontSize: '1rem',      // 16px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0em'
  },
  body2: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0em'
  },
  subtitle1: {
    fontSize: '1rem',      // 16px
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.00938em'
  },
  subtitle2: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.00714em'
  },
  caption: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em'
  },
  overline: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 600,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase'
  },
  button: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase'
  }
};

// ========================================
// 🛠️ TYPOGRAPHY UTILS
// ========================================

export const typographyUtils = {
  /**
   * Obtener tipografía por escala
   * @param {string} scale - 'display' o 'text'
   * @param {string} size - Tamaño (xs, sm, md, lg, xl, 2xl)
   * @returns {Object} Configuración tipográfica
   */
  getScale: (scale = 'text', size = 'md') => {
    return typographyScaleTokens[scale]?.[size] || typographyScaleTokens.text.md;
  },

  /**
   * Crear variante tipográfica personalizada
   * @param {Object} config - Configuración personalizada
   * @returns {Object} Configuración tipográfica completa
   */
  createVariant: ({
    fontSize,
    fontWeight = fontWeightTokens.regular,
    lineHeight = lineHeightTokens.normal,
    letterSpacing = letterSpacingTokens.normal,
    fontFamily = fontFamilyTokens.system
  }) => ({
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    fontFamily
  }),

  /**
   * Obtener tipografía semántica
   * @param {string} role - Rol semántico (heading, body, label, etc.)
   * @param {string} variant - Variante del rol
   * @returns {Object} Configuración tipográfica
   */
  getSemantic: (role = 'body', variant = 'medium') => {
    if (role === 'caption' || role === 'overline' || role === 'button') {
      return semanticTypographyTokens[role];
    }
    return semanticTypographyTokens[role]?.[variant] || semanticTypographyTokens.body.medium;
  },

  /**
   * Calcular responsive fontSize
   * @param {string} baseSize - Tamaño base
   * @param {number} scale - Factor de escala para dispositivos grandes
   * @returns {Object} Configuración responsive
   */
  responsive: (baseSize, scale = 1.2) => ({
    fontSize: baseSize,
    '@media (min-width: 768px)': {
      fontSize: `calc(${baseSize} * ${scale})`
    }
  })
};

export default {
  typographyScaleTokens,
  fontWeightTokens,
  fontFamilyTokens,
  lineHeightTokens,
  letterSpacingTokens,
  semanticTypographyTokens,
  muiTypographyVariants,
  typographyUtils
};
