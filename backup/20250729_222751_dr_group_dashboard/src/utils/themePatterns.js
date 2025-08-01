// Utilidades para patrones de tema inspirados en Office/Outlook

export const themePatterns = {
  // Patrón de circuitos tecnológicos
  circuit: (color, opacity = 0.06) => `
    data:image/svg+xml;base64,${btoa(`
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="transparent"/>
            <circle cx="10" cy="10" r="2" fill="${color}" opacity="${opacity}"/>
            <circle cx="50" cy="50" r="2" fill="${color}" opacity="${opacity}"/>
            <line x1="10" y1="10" x2="30" y2="10" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <line x1="30" y1="10" x2="30" y2="30" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <line x1="30" y1="30" x2="50" y2="30" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <line x1="50" y1="30" x2="50" y2="50" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <rect x="28" y="28" width="4" height="4" fill="${color}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="60" height="60" fill="url(#circuit)"/>
      </svg>
    `)}
  `,

  // Patrón de hexágonos corporativos
  hexagon: (color, opacity = 0.05) => `
    data:image/svg+xml;base64,${btoa(`
      <svg width="80" height="70" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagon" x="0" y="0" width="80" height="70" patternUnits="userSpaceOnUse">
            <rect width="80" height="70" fill="transparent"/>
            <polygon points="40,5 60,20 60,40 40,55 20,40 20,20" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <polygon points="0,35 20,50 20,70 0,85 -20,70 -20,50" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <polygon points="80,35 100,50 100,70 80,85 60,70 60,50" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="80" height="70" fill="url(#hexagon)"/>
      </svg>
    `)}
  `,

  // Patrón de ondas suaves
  waves: (color, opacity = 0.08) => `
    data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="waves" x="0" y="0" width="100" height="40" patternUnits="userSpaceOnUse">
            <rect width="100" height="40" fill="transparent"/>
            <path d="M0,20 Q25,10 50,20 T100,20" fill="none" stroke="${color}" stroke-width="1.5" opacity="${opacity}"/>
            <path d="M0,30 Q25,20 50,30 T100,30" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity * 0.7}"/>
          </pattern>
        </defs>
        <rect width="100" height="40" fill="url(#waves)"/>
      </svg>
    `)}
  `,

  // Patrón de líneas diagonales minimalistas
  diagonal: (color, opacity = 0.04) => `
    data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonal" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="transparent"/>
            <line x1="0" y1="40" x2="40" y2="0" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <line x1="20" y1="40" x2="40" y2="20" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            <line x1="0" y1="20" x2="20" y2="0" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="40" height="40" fill="url(#diagonal)"/>
      </svg>
    `)}
  `,

  // Patrón de puntos corporativos
  dots: (color, opacity = 0.06) => `
    data:image/svg+xml;base64,${btoa(`
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill="transparent"/>
            <circle cx="15" cy="15" r="1.5" fill="${color}" opacity="${opacity}"/>
            <circle cx="0" cy="0" r="1" fill="${color}" opacity="${opacity * 0.6}"/>
            <circle cx="30" cy="30" r="1" fill="${color}" opacity="${opacity * 0.6}"/>
          </pattern>
        </defs>
        <rect width="30" height="30" fill="url(#dots)"/>
      </svg>
    `)}
  `,

  // Patrón de red neuronal
  network: (color, opacity = 0.05) => `
    data:image/svg+xml;base64,${btoa(`
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="network" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="transparent"/>
            <circle cx="20" cy="20" r="2" fill="${color}" opacity="${opacity}"/>
            <circle cx="60" cy="30" r="2" fill="${color}" opacity="${opacity}"/>
            <circle cx="100" cy="40" r="2" fill="${color}" opacity="${opacity}"/>
            <circle cx="30" cy="80" r="2" fill="${color}" opacity="${opacity}"/>
            <circle cx="90" cy="90" r="2" fill="${color}" opacity="${opacity}"/>
            <line x1="20" y1="20" x2="60" y2="30" stroke="${color}" stroke-width="0.5" opacity="${opacity * 0.6}"/>
            <line x1="60" y1="30" x2="100" y2="40" stroke="${color}" stroke-width="0.5" opacity="${opacity * 0.6}"/>
            <line x1="30" y1="80" x2="90" y2="90" stroke="${color}" stroke-width="0.5" opacity="${opacity * 0.6}"/>
            <line x1="20" y1="20" x2="30" y2="80" stroke="${color}" stroke-width="0.5" opacity="${opacity * 0.6}"/>
          </pattern>
        </defs>
        <rect width="120" height="120" fill="url(#network)"/>
      </svg>
    `)}
  `
};

// Función principal para crear backgrounds con patrones
export const createPatternBackground = (primaryColor, secondaryColor = null, patternType = 'none', patternOpacity = 0.06) => {
  const baseGradient = primaryColor; // Solo usar color primario, sin gradientes

  if (patternType === 'none' || !themePatterns[patternType]) {
    return {
      background: baseGradient
    };
  }

  const patternUrl = themePatterns[patternType](primaryColor, patternOpacity);
  return {
    background: baseGradient,
    backgroundImage: `url("${patternUrl}")`,
    backgroundBlendMode: 'overlay'
  };
};

// Presets de patrones predefinidos
export const patternPresets = [
  { 
    id: 'none', 
    name: 'Sin patrón', 
    description: 'Color sólido limpio',
    preview: 'solid'
  },
  { 
    id: 'circuit', 
    name: 'Circuitos', 
    description: 'Patrón tecnológico moderno',
    preview: 'tech'
  },
  { 
    id: 'hexagon', 
    name: 'Hexágonos', 
    description: 'Diseño corporativo elegante',
    preview: 'corporate'
  },
  { 
    id: 'waves', 
    name: 'Ondas', 
    description: 'Flujo orgánico suave',
    preview: 'organic'
  },
  { 
    id: 'diagonal', 
    name: 'Diagonal', 
    description: 'Líneas minimalistas',
    preview: 'minimal'
  },
  { 
    id: 'dots', 
    name: 'Puntos', 
    description: 'Patrón punteado sutil',
    preview: 'classic'
  },
  { 
    id: 'network', 
    name: 'Red', 
    description: 'Conexiones neurales',
    preview: 'network'
  }
];

// Función para obtener colores recomendados por patrón
export const getRecommendedColors = (patternType) => {
  const colorSets = {
    circuit: ['#1976d2', '#2e7d32', '#7b1fa2', '#d32f2f'],
    hexagon: ['#424242', '#1976d2', '#388e3c', '#f57c00'],
    waves: ['#0277bd', '#00695c', '#5e35b1', '#c2185b'],
    diagonal: ['#37474f', '#455a64', '#546e7a', '#607d8b'],
    dots: ['#1565c0', '#2e7d32', '#ef6c00', '#8e24aa'],
    network: ['#1a237e', '#004d40', '#4a148c', '#b71c1c'],
    none: ['#1976d2', '#388e3c', '#f57c00', '#d32f2f']
  };
  
  return colorSets[patternType] || colorSets.none;
};
