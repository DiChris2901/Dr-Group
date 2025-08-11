/**
 * 🎨 DR Group Design System 3.0 - Color Tokens
 * Tokens extraídos del sistema de colores establecido
 */

// ========================================
// 🎯 COLOR TOKENS - PALETA BASE
// ========================================

export const colorTokens = {
  // Primary colors (empresa)
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb', 
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // main
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1'
  },

  // Secondary colors (complementarios)
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8', 
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0', // main
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c'
  },

  // Semantic colors
  success: {
    light: '#81c784',
    main: '#4caf50',
    dark: '#388e3c'
  },

  warning: {
    light: '#ffb74d',
    main: '#ff9800', 
    dark: '#f57c00'
  },

  error: {
    light: '#e57373',
    main: '#f44336',
    dark: '#d32f2f'
  },

  info: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#1976d2'
  },

  // Greys system
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee', 
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
};

// ========================================
// 🌙 SURFACE COLORS - MODO CLARO/OSCURO
// ========================================

export const surfaceTokens = {
  light: {
    background: {
      default: '#fafafa',
      paper: '#ffffff'
    },
    surface: {
      1: '#ffffff',
      2: '#f8f9fa',
      3: '#f1f3f4', 
      4: '#e8eaed',
      5: '#dadce0'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)', 
      disabled: 'rgba(0, 0, 0, 0.38)'
    }
  },

  dark: {
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a'
    },
    surface: {
      1: '#1e1e1e',
      2: '#222222',
      3: '#262626',
      4: '#2c2c2c',
      5: '#323232'
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.38)'
    }
  }
};

export default {
  colorTokens,
  surfaceTokens
};
