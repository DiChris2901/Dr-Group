import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { gradientsV2 } from '../theme/premiumTheme';
import { useSettings } from './SettingsContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de CustomThemeProvider');
  }
  return context;
};

// Configuración del tema personalizado estilo Boss Lite que usa SettingsContext
const getTheme = (settings = {}) => {
  const mode = settings?.theme?.mode || 'light';
  const primaryColor = settings?.theme?.primaryColor || '#667eea';
  const secondaryColor = settings?.theme?.secondaryColor || '#764ba2';
  const borderRadius = settings?.theme?.borderRadius || 8;
  const fontFamily = settings?.theme?.fontFamily || 'Inter';
  const fontSize = settings?.theme?.fontSize || 14;
  const fontScale = (settings?.theme?.fontScale || 100) / 100; // Convertir porcentaje a decimal
  const fontWeight = settings?.theme?.fontWeight || 400;
  // Leer compactMode desde sidebar (fuente principal) con fallback a theme
  const compactMode = settings?.sidebar?.compactMode !== undefined 
    ? settings.sidebar.compactMode 
    : (settings?.theme?.compactMode || false);

  // Aplicar escala global a todos los tamaños de fuente
  const scaledBaseFontSize = fontSize * fontScale;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryColor,
        light: primaryColor + '40',
        dark: primaryColor,
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        light: secondaryColor + '40',
        dark: secondaryColor,
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#e2e8f0' : '#0f172a', // Cambio a un gris mucho más visible
        paper: mode === 'light' ? '#f8fafc' : '#1e293b', // Fondo de cards un poco más claro para contraste
      },
      text: {
        primary: mode === 'light' ? '#1e293b' : '#f8fafc',
        secondary: mode === 'light' ? '#64748b' : '#cbd5e1',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
    },
    // Campos custom para sandbox DS
    custom: {
      gradientsV2,
      fontScale: fontScale, // Hacer disponible la escala para componentes
      scaledBaseFontSize: scaledBaseFontSize // También el tamaño base escalado
    },
    typography: {
      fontFamily: `"${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
      fontSize: scaledBaseFontSize,
      fontWeightRegular: fontWeight,
      h1: {
        fontWeight: Math.max(fontWeight + 200, 800),
        fontSize: `${(compactMode ? 2 : 2.5) * fontScale}rem`,
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: Math.max(fontWeight + 100, 700),
        fontSize: `${(compactMode ? 1.75 : 2) * fontScale}rem`,
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: Math.max(fontWeight + 100, 600),
        fontSize: `${(compactMode ? 1.5 : 1.75) * fontScale}rem`,
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: Math.max(fontWeight + 100, 600),
        fontSize: `${(compactMode ? 1.25 : 1.5) * fontScale}rem`,
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: Math.max(fontWeight + 100, 600),
        fontSize: `${(compactMode ? 1.125 : 1.25) * fontScale}rem`,
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: Math.max(fontWeight + 100, 600),
        fontSize: `${(compactMode ? 1 : 1.125) * fontScale}rem`,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: `${(compactMode ? 0.875 : 1) * fontScale}rem`,
        fontWeight,
        lineHeight: 1.6,
      },
      body2: {
        fontSize: `${(compactMode ? 0.75 : 0.875) * fontScale}rem`,
        fontWeight,
        lineHeight: 1.6,
      },
      button: {
        fontWeight: Math.max(fontWeight, 500),
        textTransform: 'none',
      },
      caption: {
        fontSize: `${0.75 * fontScale}rem`,
        fontWeight,
      },
      overline: {
        fontSize: `${0.625 * fontScale}rem`,
        fontWeight: Math.max(fontWeight, 500),
        textTransform: 'uppercase',
        letterSpacing: '0.08333em',
      },
    },
    shape: {
      borderRadius: borderRadius,
    },
    spacing: compactMode ? 6 : 8,
    shadows: [
      'none',
      '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
      '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
      ...Array(19).fill('0px 25px 50px -12px rgba(0, 0, 0, 0.25)')
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: borderRadius,
            padding: compactMode ? `${6 * fontScale}px ${16 * fontScale}px` : `${10 * fontScale}px ${24 * fontScale}px`,
            fontSize: `${14 * fontScale}px`,
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0px 4px 12px ${primaryColor}30`,
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${secondaryColor}dd 100%)`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius,
            boxShadow: mode === 'light' 
              ? '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)'
              : '0px 4px 6px -1px rgba(0, 0, 0, 0.3), 0px 2px 4px -1px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              fontSize: `${14 * fontScale}px`,
            },
            '& .MuiInputLabel-root': {
              fontSize: `${14 * fontScale}px`,
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: primaryColor,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius / 2,
            fontWeight: 500,
            fontSize: `${12 * fontScale}px`,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            fontSize: `${scaledBaseFontSize}px`, // Aplicar escala al html root
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          body: {
            fontSize: `${14 * fontScale}px`, // Aplicar escala al body
            lineHeight: 1.5,
            backgroundColor: mode === 'light' ? '#e2e8f0 !important' : '#0f172a !important',
            color: mode === 'light' ? '#1e293b !important' : '#f8fafc !important',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            margin: 0,
            padding: 0,
            minHeight: '100vh',
            height: '100%',
          },
          '#root': {
            backgroundColor: mode === 'light' ? '#e2e8f0' : '#0f172a',
            minHeight: '100vh',
            transition: 'background-color 0.3s ease',
          },
        },
      },
    },
  });
};

export const CustomThemeProvider = ({ children }) => {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const [currentTheme, setCurrentTheme] = useState(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // Escuchar cambios en las preferencias del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemPrefersDark(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Determinar el modo efectivo basado en la configuración
  const getEffectiveMode = () => {
    if (settings?.theme?.mode === 'auto') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return settings?.theme?.mode || 'light';
  };

  // Regenerar tema cuando cambien los settings o las preferencias del sistema
  useEffect(() => {
    const effectiveMode = getEffectiveMode();
    
    const effectiveSettings = {
      ...settings,
      theme: {
        ...settings.theme,
        mode: effectiveMode
      }
    };
    
    const newTheme = getTheme(effectiveSettings);
    setCurrentTheme(newTheme);
  }, [settings, systemPrefersDark]);

  const toggleTheme = () => {
    const currentMode = settings.theme.mode;
    let newMode;
    
    if (currentMode === 'light') {
      newMode = 'dark';
    } else if (currentMode === 'dark') {
      newMode = 'auto';
    } else {
      newMode = 'light';
    }
    
    updateSettings('theme', { mode: newMode });
  };

  const value = {
    darkMode: getEffectiveMode() === 'dark',
    toggleTheme,
    theme: currentTheme,
    effectiveMode: getEffectiveMode()
  };

  // No renderizar hasta que el tema esté listo
  if (!currentTheme) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={currentTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;