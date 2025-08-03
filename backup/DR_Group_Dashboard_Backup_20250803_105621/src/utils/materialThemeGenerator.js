// Utilidades para generar paletas de colores automáticamente
// Inspirado en Material Design Color System

/**
 * Convierte un color HEX a HSL
 */
export const hexToHsl = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
};

/**
 * Convierte HSL a HEX
 */
export const hslToHex = (h, s, l) => {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1/3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1/3);

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Genera una paleta completa basada en un color semilla
 */
export const generatePaletteFromSeed = (seedColor) => {
  const [h, s, l] = hexToHsl(seedColor);
  
  // Generar colores primarios (variaciones del color semilla)
  const primary = {
    50: hslToHex(h, Math.max(s - 20, 10), Math.min(l + 40, 95)),
    100: hslToHex(h, Math.max(s - 10, 15), Math.min(l + 30, 90)),
    200: hslToHex(h, s, Math.min(l + 20, 85)),
    300: hslToHex(h, s, Math.min(l + 10, 75)),
    400: hslToHex(h, s, l),
    500: seedColor, // Color semilla original
    600: hslToHex(h, Math.min(s + 5, 90), Math.max(l - 10, 15)),
    700: hslToHex(h, Math.min(s + 10, 95), Math.max(l - 20, 10)),
    800: hslToHex(h, Math.min(s + 15, 100), Math.max(l - 30, 8)),
    900: hslToHex(h, Math.min(s + 20, 100), Math.max(l - 40, 5))
  };

  // Generar color secundario (complementario armónico)
  const secondaryHue = (h + 30) % 360; // Triádico suave
  const secondary = {
    50: hslToHex(secondaryHue, Math.max(s - 25, 10), Math.min(l + 35, 95)),
    100: hslToHex(secondaryHue, Math.max(s - 15, 15), Math.min(l + 25, 90)),
    200: hslToHex(secondaryHue, Math.max(s - 10, 20), Math.min(l + 15, 85)),
    300: hslToHex(secondaryHue, Math.max(s - 5, 25), Math.min(l + 5, 75)),
    400: hslToHex(secondaryHue, s, Math.max(l - 5, 20)),
    500: hslToHex(secondaryHue, s, Math.max(l - 10, 15)),
    600: hslToHex(secondaryHue, Math.min(s + 5, 90), Math.max(l - 15, 12)),
    700: hslToHex(secondaryHue, Math.min(s + 10, 95), Math.max(l - 25, 10)),
    800: hslToHex(secondaryHue, Math.min(s + 15, 100), Math.max(l - 35, 8)),
    900: hslToHex(secondaryHue, Math.min(s + 20, 100), Math.max(l - 45, 5))
  };

  // Generar color terciario (análogo)
  const tertiaryHue = (h + 60) % 360;
  const tertiary = {
    50: hslToHex(tertiaryHue, Math.max(s - 30, 8), Math.min(l + 38, 96)),
    100: hslToHex(tertiaryHue, Math.max(s - 20, 12), Math.min(l + 28, 92)),
    200: hslToHex(tertiaryHue, Math.max(s - 15, 18), Math.min(l + 18, 88)),
    300: hslToHex(tertiaryHue, Math.max(s - 10, 22), Math.min(l + 8, 78)),
    400: hslToHex(tertiaryHue, Math.max(s - 5, 25), Math.max(l - 2, 25)),
    500: hslToHex(tertiaryHue, s, Math.max(l - 8, 18)),
    600: hslToHex(tertiaryHue, Math.min(s + 3, 85), Math.max(l - 18, 15)),
    700: hslToHex(tertiaryHue, Math.min(s + 8, 90), Math.max(l - 28, 12)),
    800: hslToHex(tertiaryHue, Math.min(s + 12, 95), Math.max(l - 38, 10)),
    900: hslToHex(tertiaryHue, Math.min(s + 18, 100), Math.max(l - 48, 6))
  };

  // Generar neutros (grises basados en el tono del color semilla)
  const neutral = {
    50: hslToHex(h, 5, 98),
    100: hslToHex(h, 5, 96),
    200: hslToHex(h, 8, 92),
    300: hslToHex(h, 8, 83),
    400: hslToHex(h, 8, 64),
    500: hslToHex(h, 8, 45),
    600: hslToHex(h, 12, 38),
    700: hslToHex(h, 15, 25),
    800: hslToHex(h, 18, 15),
    900: hslToHex(h, 20, 9)
  };

  // Error colors (rojos estándar)
  const error = {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c'
  };

  return {
    primary,
    secondary,
    tertiary,
    neutral,
    error,
    // Colores principales para compatibilidad con el sistema actual
    primaryColor: primary[500],
    secondaryColor: secondary[500],
    tertiaryColor: tertiary[500]
  };
};

/**
 * Genera colores semilla predefinidos de alta calidad
 */
export const generateQualitySeedColors = () => [
  { name: 'Material Purple', color: '#6750A4', category: 'material' },
  { name: 'Corporate Blue', color: '#1976D2', category: 'corporate' },
  { name: 'Success Green', color: '#388E3C', category: 'corporate' },
  { name: 'Finance Gold', color: '#F57C00', category: 'corporate' },
  { name: 'Executive Navy', color: '#1565C0', category: 'corporate' },
  { name: 'Creative Orange', color: '#FF7043', category: 'creative' },
  { name: 'Modern Teal', color: '#00897B', category: 'creative' },
  { name: 'Elegant Pink', color: '#E91E63', category: 'creative' },
  { name: 'Tech Indigo', color: '#3F51B5', category: 'creative' },
  { name: 'Nature Green', color: '#689F38', category: 'creative' }
];

/**
 * Genera un tema completo para Material-UI
 */
export const generateMaterialTheme = (seedColor, mode = 'light') => {
  const palette = generatePaletteFromSeed(seedColor);
  
  return {
    palette: {
      mode,
      primary: {
        main: palette.primary[500],
        light: palette.primary[300],
        dark: palette.primary[700],
        contrastText: mode === 'light' ? '#ffffff' : '#000000'
      },
      secondary: {
        main: palette.secondary[500],
        light: palette.secondary[300],
        dark: palette.secondary[700],
        contrastText: mode === 'light' ? '#ffffff' : '#000000'
      },
      tertiary: {
        main: palette.tertiary[500],
        light: palette.tertiary[300],
        dark: palette.tertiary[700]
      },
      error: {
        main: palette.error[500],
        light: palette.error[300],
        dark: palette.error[700]
      },
      background: {
        default: mode === 'light' ? palette.neutral[50] : palette.neutral[900],
        paper: mode === 'light' ? '#ffffff' : palette.neutral[800]
      },
      text: {
        primary: mode === 'light' ? palette.neutral[900] : palette.neutral[50],
        secondary: mode === 'light' ? palette.neutral[600] : palette.neutral[300]
      }
    },
    // Mantener compatibilidad con el sistema actual
    primaryColor: palette.primary[500],
    secondaryColor: palette.secondary[500],
    tertiaryColor: palette.tertiary[500]
  };
};
