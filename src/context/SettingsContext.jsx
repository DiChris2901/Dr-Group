import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth, db } from '../config/firebase';

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
    fontScale: 100, // Escala global de fuente en porcentaje (100%, 125%, 150%, 175%, 200%)
    fontWeight: 400, // Peso de fuente base (300, 400, 500, 600)
    backgroundType: 'gradient', // 'solid' | 'gradient' | 'pattern'
    backgroundPreset: 'modern-blue', // Preset de fondo seleccionado
    compactMode: true, // Modo compacto global habilitado por defecto
    animations: true, // ? MODO EMPRESARIAL: Animaciones habilitadas por defecto para mejor experiencia
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
      animationsEnabled: false, // ? MODO EMPRESARIAL RÁPIDO
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
    
    // ?? Configuraciones de Chat
    chat: {
      enabled: true, // Habilitar notificaciones de chat
      sound: true, // Sonido al recibir mensajes
      toast: true, // Mostrar notificación toast
      vibrate: false, // Vibración en dispositivos móviles
    }
  },

  // ?? Temas Predefinidos - Configuraciones completas aplicables con un clic
  predefinedThemes: {
    corporativo: {
      name: 'Corporativo Azul',
      description: 'Tema profesional con azul corporativo y tipografía elegante',
      mode: 'light',
      primaryColor: '#1976d2',
      secondaryColor: '#42a5f5',
      borderRadius: 8,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 400,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    elegante: {
      name: 'Elegante Oscuro',
      description: 'Diseño sofisticado con modo oscuro y acentos púrpura',
      mode: 'dark',
      primaryColor: '#7c4dff',
      secondaryColor: '#b39ddb',
      borderRadius: 12,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'solid',
      compactMode: false,
      animations: true
    },
    minimalista: {
      name: 'Minimalista Verde',
      description: 'Interfaz limpia y moderna con toques de verde natural',
      mode: 'light',
      primaryColor: '#4caf50',
      secondaryColor: '#81c784',
      borderRadius: 16,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 400,
      backgroundType: 'solid',
      compactMode: true,
      animations: false
    },
    ejecutivo: {
      name: 'Ejecutivo Dorado',
      description: 'Tema premium con acabados dorados para ejecutivos',
      mode: 'light',
      primaryColor: '#ff9800',
      secondaryColor: '#ffb74d',
      borderRadius: 6,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 600,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    creativo: {
      name: 'Creativo Rosa',
      description: 'Diseño vibrante y creativo con paleta rosa moderna',
      mode: 'light',
      primaryColor: '#e91e63',
      secondaryColor: '#f06292',
      borderRadius: 20,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    nocturno: {
      name: 'Nocturno Índigo',
      description: 'Tema oscuro con índigo profundo para trabajo nocturno',
      mode: 'dark',
      primaryColor: '#3f51b5',
      secondaryColor: '#7986cb',
      borderRadius: 10,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 400,
      backgroundType: 'solid',
      compactMode: false,
      animations: true
    },
    moderno: {
      name: 'Moderno Cian',
      description: 'Interfaz contemporánea con cian vibrante y animaciones fluidas',
      mode: 'light',
      primaryColor: '#00bcd4',
      secondaryColor: '#4dd0e1',
      borderRadius: 14,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    titanio: {
      name: 'Titanio Plateado',
      description: 'Elegancia metálica con grises sofisticados y detalles plateados',
      mode: 'light',
      primaryColor: '#607d8b',
      secondaryColor: '#90a4ae',
      borderRadius: 8,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'solid',
      compactMode: false,
      animations: true
    },
    sunset: {
      name: 'Sunset Naranja',
      description: 'Calidez del atardecer con naranjas vibrantes y rojos suaves',
      mode: 'light',
      primaryColor: '#ff5722',
      secondaryColor: '#ff8a65',
      borderRadius: 16,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    forest: {
      name: 'Forest Verde Oscuro',
      description: 'Serenidad del bosque con verdes profundos en modo oscuro',
      mode: 'dark',
      primaryColor: '#2e7d32',
      secondaryColor: '#66bb6a',
      borderRadius: 12,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 400,
      backgroundType: 'solid',
      compactMode: false,
      animations: true
    },
    royal: {
      name: 'Royal Púrpura',
      description: 'Majestuosidad real con púrpuras profundos y detalles dorados',
      mode: 'dark',
      primaryColor: '#673ab7',
      secondaryColor: '#9575cd',
      borderRadius: 10,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 600,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    ocean: {
      name: 'Ocean Azul Profundo',
      description: 'Profundidad oceánica con azules marinos y aguamarinas',
      mode: 'dark',
      primaryColor: '#0277bd',
      secondaryColor: '#4fc3f7',
      borderRadius: 14,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 400,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    cherry: {
      name: 'Cherry Blossom',
      description: 'Delicadeza japonesa con rosas suaves y blancos puros',
      mode: 'light',
      primaryColor: '#ad1457',
      secondaryColor: '#f48fb1',
      borderRadius: 18,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 400,
      backgroundType: 'solid',
      compactMode: true,
      animations: true
    },
    arctic: {
      name: 'Arctic Blanco',
      description: 'Pureza ártica con blancos cristalinos y azules helados',
      mode: 'light',
      primaryColor: '#37474f',
      secondaryColor: '#78909c',
      borderRadius: 6,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 300,
      backgroundType: 'solid',
      compactMode: true,
      animations: false
    },
    volcanic: {
      name: 'Volcanic Rojo',
      description: 'Intensidad volcánica con rojos ardientes y grises carbón',
      mode: 'dark',
      primaryColor: '#c62828',
      secondaryColor: '#ef5350',
      borderRadius: 8,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 600,
      backgroundType: 'solid',
      compactMode: false,
      animations: true
    },
    emerald: {
      name: 'Emerald Luxury',
      description: 'Lujo esmeralda con verdes joya y dorados elegantes',
      mode: 'light',
      primaryColor: '#00695c',
      secondaryColor: '#4db6ac',
      borderRadius: 12,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    cosmic: {
      name: 'Cosmic Violeta',
      description: 'Misterio cósmico con violetas profundos y estrellas plateadas',
      mode: 'dark',
      primaryColor: '#512da8',
      secondaryColor: '#9575cd',
      borderRadius: 20,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    autumn: {
      name: 'Autumn Gold',
      description: 'Calidez otoñal con dorados brillantes y marrones terra',
      mode: 'light',
      primaryColor: '#f57900',
      secondaryColor: '#ffb74d',
      borderRadius: 10,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 400,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    },
    midnight: {
      name: 'Midnight Blue',
      description: 'Elegancia de medianoche con azules oscuros y plateados',
      mode: 'dark',
      primaryColor: '#1a237e',
      secondaryColor: '#5c6bc0',
      borderRadius: 8,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      backgroundType: 'solid',
      compactMode: false,
      animations: true
    },
    spring: {
      name: 'Spring Fresh',
      description: 'Frescura primaveral con verdes lima y amarillos suaves',
      mode: 'light',
      primaryColor: '#689f38',
      secondaryColor: '#aed581',
      borderRadius: 15,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 400,
      backgroundType: 'gradient',
      compactMode: true,
      animations: true
    },
    steel: {
      name: 'Steel Industrial',
      description: 'Fortaleza industrial con grises metálicos y azules acero',
      mode: 'dark',
      primaryColor: '#455a64',
      secondaryColor: '#90a4ae',
      borderRadius: 6,
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'solid',
      compactMode: false,
      animations: false
    },
    sunrise: {
      name: 'Sunrise Amarillo',
      description: 'Energía del amanecer con amarillos brillantes y naranjas cálidos',
      mode: 'light',
      primaryColor: '#f9a825',
      secondaryColor: '#ffcc02',
      borderRadius: 12,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 500,
      backgroundType: 'gradient',
      compactMode: false,
      animations: true
    }
  }
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
  
  // ? Inicializar SIEMPRE desde localStorage (instantáneo, sin flash)
  const getInitialSettings = () => {
    try {
      const saved = localStorage.getItem('rdj-settings');
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) { /* localStorage corrupto, usar defaults */ }
    return defaultSettings;
  };
  
  const [settings, setSettings] = useState(getInitialSettings);
  const [loading, setLoading] = useState(false); // false: localStorage ya tiene datos
  const [error, setError] = useState(null);
  
  // Ref para coordinar colores entre los 2 listeners
  const userColorsRef = useRef({});

  // Listener para cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);


  // ======================================================================
  // ARQUITECTURA DEFINITIVA: SOLO LISTENERS EN TIEMPO REAL
  // - onSnapshot dispara INMEDIATAMENTE con datos del cache de Firebase
  // - NO necesitamos loadUserSettings() -> era redundante y causaba delays
  // - loading=false por defecto -> localStorage ya tiene datos
  // ======================================================================
  
  // Helper: Merge settings de Firestore con defaults y colores del usuario
  const mergeSettings = (firebaseSettings, userTheme) => {
    return {
      ...defaultSettings,
      ...firebaseSettings,
      theme: {
        ...defaultSettings.theme,
        ...firebaseSettings.theme,
        primaryColor: userTheme.primaryColor || firebaseSettings.theme?.primaryColor || defaultSettings.theme.primaryColor,
        secondaryColor: userTheme.secondaryColor || firebaseSettings.theme?.secondaryColor || defaultSettings.theme.secondaryColor
      },
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
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const userRef = doc(db, 'users', user.uid);

    // LISTENER 1: users/{uid} - Colores del tema
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        userColorsRef.current = {
          theme: data.theme || {}
        };
        setSettings(prev => ({
          ...prev,
          theme: {
            ...prev.theme,
            primaryColor: data.theme?.primaryColor || prev.theme.primaryColor,
            secondaryColor: data.theme?.secondaryColor || prev.theme.secondaryColor
          }
        }));
      }
    }, (err) => {
      console.error('[SETTINGS] Error listener users:', err.message);
    });

    // LISTENER 2: userSettings/{uid} - Preferencias de UI (sidebar, dashboard, theme mode)
    const unsubSettings = onSnapshot(userSettingsRef, (snap) => {
      if (snap.exists()) {
        const firebaseSettings = snap.data();
        const userTheme = userColorsRef.current.theme || {};

        const merged = mergeSettings(firebaseSettings, userTheme);
        setSettings(merged);
        
        try { localStorage.setItem('rdj-settings', JSON.stringify(merged)); } catch (e) { /* ignore */ }
      }
      setLoading(false);
    }, (err) => {
      console.error('[SETTINGS] Error listener userSettings:', err.message);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubSettings();
    };
  }, [user?.uid]);

  // Función para actualizar configuración en Firebase
  const updateSettings = async (categoryOrNewSettings, updates) => {
    try {
      let newSettings;

      // Si el primer argumento es un objeto completo (sin segundo argumento)
      if (typeof categoryOrNewSettings === 'object' && !updates) {
        newSettings = categoryOrNewSettings;
      } else {
        // Formato antiguo: (category, updates)
        newSettings = {
          ...settings,
          [categoryOrNewSettings]: {
            ...settings[categoryOrNewSettings],
            ...updates
          }
        };
      }

      // Actualizar estado local inmediatamente
      setSettings(newSettings);
      
      // Guardar en localStorage como backup
      localStorage.setItem('rdj-settings', JSON.stringify(newSettings));

      // Si hay usuario autenticado, guardar en Firebase
      if (user) {
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        
        // Serializar correctamente para Firestore (evitar objetos anidados problemáticos)
        const firestoreData = JSON.parse(JSON.stringify(newSettings));
        
        // Remover propiedades que no se pueden serializar
        delete firestoreData.predefinedThemes; // No guardar temas predefinidos
        
        // ?? CRÍTICO: Si se actualizó el tema, sincronizar con users/{uid}/theme PRIMERO
        if (newSettings.theme) {
          await updateDoc(userDocRef, {
            theme: {
              darkMode: newSettings.theme.darkMode ?? false,
              primaryColor: newSettings.theme.primaryColor || '#1976d2',
              secondaryColor: newSettings.theme.secondaryColor || '#dc004e'
            },
            updatedAt: new Date()
          });

        }
        
        // ?? LUEGO crear/actualizar userSettings/{uid} (esto disparará el listener)
        // Usar setDoc con merge:true para crear si no existe
        await setDoc(userSettingsRef, {
          ...firestoreData,
          lastUpdated: new Date()
        }, { merge: true });

      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Error al guardar configuraciones');
      
      // Revertir cambios en caso de error
      const savedSettings = localStorage.getItem('rdj-settings');
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
      localStorage.setItem('rdj-settings', JSON.stringify(newSettings));

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

  // ?? Función para aplicar tema predefinido completo
  const applyPredefinedTheme = async (themeKey) => {
    try {
      const predefinedTheme = defaultSettings.predefinedThemes[themeKey];
      if (!predefinedTheme) {
        throw new Error(`Tema ${themeKey} no encontrado`);
      }

      // Aplicar todas las configuraciones del tema
      const newSettings = {
        ...settings,
        theme: {
          ...settings.theme,
          mode: predefinedTheme.mode,
          primaryColor: predefinedTheme.primaryColor,
          secondaryColor: predefinedTheme.secondaryColor,
          borderRadius: predefinedTheme.borderRadius,
          fontFamily: predefinedTheme.fontFamily,
          fontSize: predefinedTheme.fontSize,
          fontScale: predefinedTheme.fontScale || 100, // Default 100% if not specified
          fontWeight: predefinedTheme.fontWeight,
          backgroundType: predefinedTheme.backgroundType,
          compactMode: predefinedTheme.compactMode,
          animations: predefinedTheme.animations
        },
        sidebar: {
          ...settings.sidebar,
          compactMode: predefinedTheme.compactMode,
          animationSpeed: predefinedTheme.animations ? 'normal' : 'none'
        },
        dashboard: {
          ...settings.dashboard,
          behavior: {
            ...settings.dashboard.behavior,
            animationsEnabled: predefinedTheme.animations
          },
          appearance: {
            ...settings.dashboard.appearance,
            compactMode: predefinedTheme.compactMode
          }
        }
      };

      setSettings(newSettings);

      // Guardar en localStorage
      localStorage.setItem('rdj-settings', JSON.stringify(newSettings));

      // Guardar en Firebase si hay usuario autenticado
      if (user) {
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        
        // ?? CRÍTICO: Actualizar users/{uid}/theme PRIMERO (antes del listener)
        try {
          await updateDoc(userDocRef, {
            'theme.darkMode': predefinedTheme.mode === 'dark',
            'theme.primaryColor': predefinedTheme.primaryColor,
            'theme.secondaryColor': predefinedTheme.secondaryColor,
            updatedAt: new Date()
          });
        } catch (error) {
          console.error('[SETTINGS] Error actualizando users/{uid}/theme:', error);
        }
        
        // ?? LUEGO crear/actualizar userSettings/{uid} (esto disparará el listener)
        // Usar setDoc con merge:true para crear si no existe
        try {
          await setDoc(userSettingsRef, {
            ...newSettings,
            lastUpdated: new Date(),
            appliedTheme: {
              key: themeKey,
              name: predefinedTheme.name,
              appliedAt: new Date()
            }
          }, { merge: true });
        } catch (error) {
          console.error('[SETTINGS] Error guardando userSettings:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error aplicando tema predefinido:', error);
      setError('Error al aplicar el tema');
      return false;
    }
  };

  const value = {
    settings, // ? Siempre válido, nunca null
    updateSettings,
    resetSettings,
    applyPredefinedTheme,
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
export { backgroundPresets, useSettings };
