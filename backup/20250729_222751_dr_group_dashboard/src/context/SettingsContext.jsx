import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const defaultSettings = {
  // Configuración de Tema
  theme: {
    mode: 'light', // 'light' | 'dark' | 'auto'
    primaryColor: '#667eea', // Color primario personalizable
    secondaryColor: '#764ba2', // Color secundario personalizable
    borderRadius: 8, // Radio de bordes (4, 8, 12, 16)
    fontFamily: 'Inter', // Fuente principal
    fontSize: 14, // Tamaño de fuente base en px (12-18)
    fontWeight: 400, // Peso de fuente base (300, 400, 500, 600)
    backgroundType: 'gradient', // 'solid' | 'gradient' | 'pattern'
    backgroundPreset: 'modern-blue', // Preset de fondo seleccionado
    compactMode: true, // Modo compacto global habilitado por defecto
    animations: true, // Animaciones habilitadas por defecto
  },

  // Configuración del Sidebar
  sidebar: {
    compactMode: true, // Modo compacto global del sidebar
    width: 280, // Ancho del sidebar (240, 280, 320)
    position: 'left', // 'left' | 'right'
    showIcons: true, // Mostrar iconos en el menú
    showLabels: true, // Mostrar etiquetas en el menú
    grouping: true, // Agrupar elementos del menú
    showActiveIndicator: true, // Mostrar indicador de sección activa
    animationSpeed: 'normal', // 'slow' | 'normal' | 'fast' | 'none'
    hoverDelay: 300, // Retardo de hover en ms
    persistState: true, // Recordar estado entre sesiones
  },

  // Configuración del Dashboard
  dashboard: {
    layout: {
      columns: 3,
      cardSize: 'medium',
      density: 'normal',
      viewMode: 'cards'
    },
    widgets: {
      stats: true,
      recentCommitments: true,
      upcomingPayments: true,
      monthlyChart: true,
      companiesOverview: true,
      quickActions: true
    },
    alerts: {
      enabled: true,
      daysBeforeExpiry: 7,
      emailNotifications: true,
      inAppNotifications: true,
      amountThreshold: 10000
    },
    behavior: {
      autoRefresh: true,
      refreshInterval: 30,
      defaultPeriod: 'month',
      animationsEnabled: true,
      showTooltips: true
    },
    appearance: {
      chartType: 'bar',
      showTrends: true,
      compactMode: false,
      transparencyLevel: 80
    }
  },

  // Configuración de Notificaciones
  notifications: {
    enabled: true, // Habilitar notificaciones
    sound: true, // Sonido en notificaciones
    desktop: true, // Notificaciones de escritorio
    email: false, // Notificaciones por email
    reminderDays: 3, // Días de anticipación para recordatorios
    overdueAlerts: true, // Alertas de vencimientos
    weeklyReport: true, // Reporte semanal
  },
};

// Presets de colores corporativos y creativos
const backgroundPresets = {
  'solid-light': {
    name: 'Sólido Claro',
    type: 'solid',
    background: '#f8fafc'
  },
  'solid-dark': {
    name: 'Sólido Oscuro', 
    type: 'solid',
    background: '#1e293b'
  },
  'modern-blue': {
    name: 'Azul Moderno',
    type: 'gradient',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  'ocean-breeze': {
    name: 'Brisa Marina',
    type: 'gradient', 
    background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)'
  },
  'sunset-glow': {
    name: 'Resplandor Dorado',
    type: 'gradient',
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
  },
  'purple-haze': {
    name: 'Neblina Púrpura',
    type: 'gradient',
    background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  },
  'emerald-flow': {
    name: 'Flujo Esmeralda',
    type: 'gradient',
    background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)'
  },
  'cosmic-fusion': {
    name: 'Fusión Cósmica',
    type: 'gradient',
    background: 'linear-gradient(135deg, #fc00ff 0%, #00dbde 100%)'
  },
  'warm-flame': {
    name: 'Llama Cálida',
    type: 'gradient',
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)'
  },
  'cool-blues': {
    name: 'Azules Frescos',
    type: 'gradient',
    background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
  }
};

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Cargar configuración guardada o usar por defecto
    const savedSettings = localStorage.getItem('drgroup-settings');
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Error loading saved settings:', error);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Guardar configuración cuando cambie
  useEffect(() => {
    localStorage.setItem('drgroup-settings', JSON.stringify(settings));
  }, [settings]);

  // Función para actualizar configuración
  const updateSettings = (category, updates) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates
      }
    }));
  };

  // Función para resetear configuración
  const resetSettings = (category = null) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: defaultSettings[category]
      }));
    } else {
      setSettings(defaultSettings);
    }
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    defaultSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
export { useSettings, backgroundPresets };