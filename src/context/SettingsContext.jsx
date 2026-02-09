import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
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
    animations: true, // ⚡ MODO EMPRESARIAL: Animaciones habilitadas por defecto para mejor experiencia
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
      animationsEnabled: false, // ⚡ MODO EMPRESARIAL RÁPIDO
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
    
    // 💬 Configuraciones de Chat
    chat: {
      enabled: true, // Habilitar notificaciones de chat
      sound: true, // Sonido al recibir mensajes
      toast: true, // Mostrar notificación toast
      vibrate: false, // Vibración en dispositivos móviles
    }
  },

  // 🎨 Temas Predefinidos - Configuraciones completas aplicables con un clic
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
  
  // 🎨 CRÍTICO: Inicializar con localStorage si existe (evita flash de colores por defecto)
  const getInitialSettings = () => {
    try {
      const savedSettings = localStorage.getItem('drgroup-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        console.log('⚡ [SETTINGS] Estado inicial desde localStorage (caché rápido)');
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('❌ [SETTINGS] Error parseando localStorage inicial:', error);
    }
    console.log('⚡ [SETTINGS] localStorage vacío, usando defaults (cookies borradas o primera vez)');
    return defaultSettings;
  };
  
  const [settings, setSettings] = useState(getInitialSettings);
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
          console.log('✅ [SETTINGS] Configuraciones cargadas desde localStorage (sin usuario)');
        } catch (error) {
          console.error('❌ [SETTINGS] Error parseando localStorage:', error);
          setSettings(defaultSettings);
        }
      } else {
        console.log('🔄 [SETTINGS] Usando configuraciones por defecto (sin usuario)');
        setSettings(defaultSettings);
      }
      setLoading(false);
      return;
    }

    const loadUserSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 [SETTINGS] Cargando configuraciones desde Firestore para usuario:', user.uid);
        
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userRef = doc(db, 'users', user.uid);
        
        // 🎨 PASO 1: Cargar colores desde users/{uid}/theme (fuente de verdad para colores)
        const userDocSnap = await getDoc(userRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};
        const userTheme = userData.theme || {};
        const notificationSettings = userData.notificationSettings || {};
        
        console.log('🎨 [SETTINGS] Colores del perfil (users/{uid}):', userTheme);
        
        // 🎨 PASO 2: Cargar configuraciones desde userSettings/{uid}
        const docSnap = await getDoc(userSettingsRef);
        
        if (docSnap.exists()) {
          console.log('✅ [SETTINGS] Configuraciones encontradas en userSettings');
          const firebaseSettings = docSnap.data();
          
          // Merge configuraciones, PRIORIZANDO colores de users/{uid}/theme
          const mergedSettings = {
            ...defaultSettings,
            ...firebaseSettings,
            // 🎨 CRÍTICO: Usar colores de users/{uid}/theme, NO de userSettings ni defaults
            theme: { 
              ...defaultSettings.theme, 
              ...firebaseSettings.theme,
              ...userTheme  // Los colores de users/{uid} tienen máxima prioridad
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
            notifications: { ...defaultSettings.notifications, ...firebaseSettings.notifications },
            notificationSettings: notificationSettings
          };
          setSettings(mergedSettings);
          
          // Guardar en localStorage como backup
          localStorage.setItem('drgroup-settings', JSON.stringify(mergedSettings));
          console.log('💾 [SETTINGS] Configuraciones guardadas en localStorage');
          console.log('✅ [SETTINGS] Colores aplicados:', mergedSettings.theme);
        } else {
          console.log('⚠️ [SETTINGS] No hay configuraciones en userSettings');
          console.log('ℹ️ [SETTINGS] Usando colores del perfil + defaults en memoria (NO se guarda en Firestore)');
          
          // 🎨 Usar colores de users/{uid}/theme + defaults EN MEMORIA (NO crear documento)
          const settingsWithNotifications = {
            ...defaultSettings,
            theme: { 
              ...defaultSettings.theme, 
              ...userTheme  // Usar colores existentes del perfil
            },
            notificationSettings: notificationSettings
          };
          
          setSettings(settingsWithNotifications);
          localStorage.setItem('drgroup-settings', JSON.stringify(settingsWithNotifications));
          console.log('✅ [SETTINGS] Configuraciones con colores del perfil:', settingsWithNotifications.theme);
        }
      } catch (error) {
        console.error('❌ [SETTINGS] Error cargando desde Firestore:', error);
        console.error('❌ [SETTINGS] Código de error:', error.code);
        console.error('❌ [SETTINGS] Mensaje:', error.message);
        setError('Error al cargar configuraciones');
        
        // ⚠️ IMPORTANTE: NO usar localStorage como fallback si está vacío
        // En su lugar, usar defaultSettings y notificar al usuario
        const savedSettings = localStorage.getItem('drgroup-settings');
        if (savedSettings) {
          console.log('💾 [SETTINGS] Usando configuraciones de localStorage como fallback temporal');
          try {
            setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
          } catch (e) {
            console.error('❌ [SETTINGS] Error parseando localStorage, usando defaults');
            setSettings(defaultSettings);
          }
        } else {
          console.log('⚠️ [SETTINGS] localStorage vacío, usando configuraciones por defecto');
          console.log('🔄 [SETTINGS] Reintenta cargar tu perfil para recuperar configuraciones');
          setSettings(defaultSettings);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();

    // Listener en tiempo real para cambios de configuración
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const userRef = doc(db, 'users', user.uid);
    
    // Listener para userSettings
    const unsubscribeSettings = onSnapshot(userSettingsRef, async (doc) => {
      if (doc.exists()) {
        const firebaseSettings = doc.data();
        
        // 🎨 Obtener colores actualizados de users/{uid}/theme (fuente de verdad)
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        const userTheme = userData.theme || {};
        const notificationSettings = userData.notificationSettings || {};
        
        const mergedSettings = {
          ...defaultSettings,
          ...firebaseSettings,
          // 🎨 CRÍTICO: Priorizar colores de users/{uid}/theme
          theme: { 
            ...defaultSettings.theme, 
            ...firebaseSettings.theme,
            ...userTheme  // Máxima prioridad a colores del perfil
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
          notifications: { ...defaultSettings.notifications, ...firebaseSettings.notifications },
          notificationSettings: notificationSettings
        };
        setSettings(mergedSettings);
        localStorage.setItem('drgroup-settings', JSON.stringify(mergedSettings));
      }
    }, (error) => {
      console.error('Error listening to settings changes:', error);
    });
    
    // 🆕 Listener adicional para cambios en notificationSettings desde users/{userId}
    const unsubscribeNotifications = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const notificationSettings = doc.data()?.notificationSettings || {};
        setSettings(prev => ({
          ...prev,
          notificationSettings: notificationSettings
        }));
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeNotifications();
    };
  }, [user?.uid]); // ✅ FIX: Usar uid primitivo en lugar del objeto user completo

  // Función para actualizar configuración en Firebase
  const updateSettings = async (categoryOrNewSettings, updates) => {
    try {
      let newSettings;

      // Si el primer argumento es un objeto completo (sin segundo argumento)
      if (typeof categoryOrNewSettings === 'object' && !updates) {
        newSettings = categoryOrNewSettings;
        console.log('🔄 [SettingsContext] Actualizando settings completos:', newSettings);
      } else {
        // Formato antiguo: (category, updates)
        newSettings = {
          ...settings,
          [categoryOrNewSettings]: {
            ...settings[categoryOrNewSettings],
            ...updates
          }
        };
        console.log(`🔄 [SettingsContext] Actualizando categoría ${categoryOrNewSettings}:`, updates);
      }

      console.log('📊 [SettingsContext] Estado final a guardar:', {
        'sidebar.compactMode': newSettings?.sidebar?.compactMode,
        'theme.compactMode': newSettings?.theme?.compactMode
      });

      // Actualizar estado local inmediatamente
      setSettings(newSettings);
      
      // Guardar en localStorage como backup
      localStorage.setItem('drgroup-settings', JSON.stringify(newSettings));

      // Si hay usuario autenticado, guardar en Firebase
      if (user) {
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        
        // Serializar correctamente para Firestore (evitar objetos anidados problemáticos)
        const firestoreData = JSON.parse(JSON.stringify(newSettings));
        
        // Remover propiedades que no se pueden serializar
        delete firestoreData.predefinedThemes; // No guardar temas predefinidos
        
        // 🎨 CRÍTICO: Si se actualizó el tema, sincronizar con users/{uid}/theme PRIMERO
        if (newSettings.theme) {
          console.log('🎨 [SETTINGS] Sincronizando colores con users/{uid}/theme:', newSettings.theme);
          await updateDoc(userDocRef, {
            theme: {
              darkMode: newSettings.theme.darkMode ?? false,
              primaryColor: newSettings.theme.primaryColor || '#1976d2',
              secondaryColor: newSettings.theme.secondaryColor || '#dc004e'
            },
            updatedAt: new Date()
          });
          console.log('✅ [SETTINGS] Colores sincronizados en users/{uid}');
        }
        
        // 🔄 LUEGO crear/actualizar userSettings/{uid} (esto disparará el listener)
        // Usar setDoc con merge:true para crear si no existe
        await setDoc(userSettingsRef, {
          ...firestoreData,
          lastUpdated: new Date()
        }, { merge: true });
        console.log('✅ [SETTINGS] Configuraciones guardadas en userSettings/{uid}');
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

  // 🎨 Función para aplicar tema predefinido completo
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
      localStorage.setItem('drgroup-settings', JSON.stringify(newSettings));

      // Guardar en Firebase si hay usuario autenticado
      if (user) {
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        
        // 🎨 CRÍTICO: Actualizar users/{uid}/theme PRIMERO (antes del listener)
        console.log('🎨 [THEME] Sincronizando tema predefinido con users/{uid}/theme');
        await updateDoc(userDocRef, {
          theme: {
            darkMode: predefinedTheme.mode === 'dark',
            primaryColor: predefinedTheme.primaryColor,
            secondaryColor: predefinedTheme.secondaryColor
          },
          updatedAt: new Date()
        });
        console.log('✅ [THEME] Colores sincronizados en users/{uid}:', predefinedTheme.name);
        
        // 🔄 LUEGO crear/actualizar userSettings/{uid} (esto disparará el listener)
        // Usar setDoc con merge:true para crear si no existe
        await setDoc(userSettingsRef, {
          ...newSettings,
          lastUpdated: new Date(),
          appliedTheme: {
            key: themeKey,
            name: predefinedTheme.name,
            appliedAt: new Date()
          }
        }, { merge: true });
        console.log('✅ [THEME] Configuraciones completas guardadas en userSettings/{uid}');
      }

      return true;
    } catch (error) {
      console.error('Error aplicando tema predefinido:', error);
      setError('Error al aplicar el tema');
      return false;
    }
  };

  const value = {
    settings,
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
