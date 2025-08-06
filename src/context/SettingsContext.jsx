import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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
    },
    charts: {
      defaultType: 'bar', // Tipo de gráfica predeterminado 
      animations: 'smooth', // Animaciones en gráficas: 'none', 'smooth', 'bounce', 'elastic'
      colorScheme: 'corporativo', // Esquema de colores para gráficas
      showDataLabels: true, // Mostrar etiquetas de datos
      enableZoom: true, // Habilitar zoom en gráficas
      gridLines: true // Mostrar líneas de cuadrícula
    }
  },

  // Configuración de Notificaciones
  notifications: {
    enabled: true, // Habilitar notificaciones generales
    sound: true, // Sonido en notificaciones
    desktop: true, // Notificaciones de escritorio
    email: false, // Notificaciones por email
    reminderDays: 3, // Días de anticipación para recordatorios
    overdueAlerts: true, // Alertas de vencimientos
    weeklyReport: true, // Reporte semanal
    
    // Configuraciones específicas del menú de ajustes
    proximosPagos: true, // Notificaciones de próximos pagos
    actualizacionesSistema: true, // Notificaciones de actualizaciones
    montosElevados: true, // Alertas de montos elevados
    pagosVencidos: true, // Alertas de pagos vencidos
    umbralesMonto: 100000, // Umbral de monto para alertas ($100,000)
    
    // Configuraciones adicionales
    dailyDigest: false, // Resumen diario
    instantAlerts: true, // Alertas instantáneas
    batchNotifications: false, // Agrupar notificaciones
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
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listener para cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Cargar configuraciones desde Firebase cuando el usuario cambia
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, usar configuración local o por defecto
      const savedSettings = localStorage.getItem('drgroup-settings');
      if (savedSettings) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
        } catch (error) {
          console.error('Error loading local settings:', error);
          setSettings(defaultSettings);
        }
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
      return;
    }

    const loadUserSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const docSnap = await getDoc(userSettingsRef);
        
        if (docSnap.exists()) {
          const firebaseSettings = docSnap.data();
          // Merge configuraciones de Firebase con las por defecto
          const mergedSettings = {
            ...defaultSettings,
            ...firebaseSettings,
            // Asegurar que nested objects se mezclen correctamente
            theme: { ...defaultSettings.theme, ...firebaseSettings.theme },
            sidebar: { ...defaultSettings.sidebar, ...firebaseSettings.sidebar },
            dashboard: { 
              ...defaultSettings.dashboard, 
              ...firebaseSettings.dashboard,
              layout: { ...defaultSettings.dashboard.layout, ...firebaseSettings.dashboard?.layout },
              widgets: { ...defaultSettings.dashboard.widgets, ...firebaseSettings.dashboard?.widgets },
              alerts: { ...defaultSettings.dashboard.alerts, ...firebaseSettings.dashboard?.alerts },
              behavior: { ...defaultSettings.dashboard.behavior, ...firebaseSettings.dashboard?.behavior },
              appearance: { ...defaultSettings.dashboard.appearance, ...firebaseSettings.dashboard?.appearance }
            },
            notifications: { ...defaultSettings.notifications, ...firebaseSettings.notifications }
          };
          setSettings(mergedSettings);
          
          // También guardar en localStorage como backup
          localStorage.setItem('drgroup-settings', JSON.stringify(mergedSettings));
        } else {
          // Si no existe documento, crear uno con configuración por defecto
          await setDoc(userSettingsRef, {
            ...defaultSettings,
            createdAt: new Date(),
            lastUpdated: new Date()
          });
          setSettings(defaultSettings);
          localStorage.setItem('drgroup-settings', JSON.stringify(defaultSettings));
        }
      } catch (error) {
        console.error('Error loading user settings from Firebase:', error);
        setError('Error al cargar configuraciones');
        
        // Fallback a localStorage
        const savedSettings = localStorage.getItem('drgroup-settings');
        if (savedSettings) {
          try {
            setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
          } catch (e) {
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();

    // Listener en tiempo real para cambios de configuración
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const unsubscribe = onSnapshot(userSettingsRef, (doc) => {
      if (doc.exists()) {
        const firebaseSettings = doc.data();
        const mergedSettings = {
          ...defaultSettings,
          ...firebaseSettings,
          theme: { ...defaultSettings.theme, ...firebaseSettings.theme },
          sidebar: { ...defaultSettings.sidebar, ...firebaseSettings.sidebar },
          dashboard: { 
            ...defaultSettings.dashboard, 
            ...firebaseSettings.dashboard,
            layout: { ...defaultSettings.dashboard.layout, ...firebaseSettings.dashboard?.layout },
            widgets: { ...defaultSettings.dashboard.widgets, ...firebaseSettings.dashboard?.widgets },
            alerts: { ...defaultSettings.dashboard.alerts, ...firebaseSettings.dashboard?.alerts },
            behavior: { ...defaultSettings.dashboard.behavior, ...firebaseSettings.dashboard?.behavior },
            appearance: { ...defaultSettings.dashboard.appearance, ...firebaseSettings.dashboard?.appearance }
          },
          notifications: { ...defaultSettings.notifications, ...firebaseSettings.notifications }
        };
        setSettings(mergedSettings);
        localStorage.setItem('drgroup-settings', JSON.stringify(mergedSettings));
      }
    }, (error) => {
      console.error('Error listening to settings changes:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Función para actualizar configuración en Firebase
  const updateSettings = async (category, updates) => {
    try {
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          ...updates
        }
      };

      // Actualizar estado local inmediatamente
      setSettings(newSettings);
      
      // Guardar en localStorage como backup
      localStorage.setItem('drgroup-settings', JSON.stringify(newSettings));

      // Si hay usuario autenticado, guardar en Firebase
      if (user) {
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        await updateDoc(userSettingsRef, {
          [category]: newSettings[category],
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Error al guardar configuraciones');
      
      // Revertir cambios en caso de error
      const savedSettings = localStorage.getItem('drgroup-settings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          setSettings(defaultSettings);
        }
      }
    }
  };

  // Función para resetear configuración
  const resetSettings = async (category = null) => {
    try {
      let newSettings;
      
      if (category) {
        newSettings = {
          ...settings,
          [category]: defaultSettings[category]
        };
      } else {
        newSettings = defaultSettings;
      }

      // Actualizar estado local
      setSettings(newSettings);
      
      // Guardar en localStorage
      localStorage.setItem('drgroup-settings', JSON.stringify(newSettings));

      // Si hay usuario autenticado, actualizar en Firebase
      if (user) {
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        if (category) {
          await updateDoc(userSettingsRef, {
            [category]: defaultSettings[category],
            lastUpdated: new Date()
          });
        } else {
          await setDoc(userSettingsRef, {
            ...defaultSettings,
            lastUpdated: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      setError('Error al restablecer configuraciones');
    }
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    defaultSettings,
    loading,
    error,
    user
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
export { useSettings, backgroundPresets };