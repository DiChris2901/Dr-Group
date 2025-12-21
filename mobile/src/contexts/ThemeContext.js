import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../material-theme.json';

const ThemeContext = createContext({});

// ✅ Colores por defecto (Material You Expressive - Corporate Identity)
const DEFAULT_COLORS = {
  primary: '#004A98', // Deep Corporate Blue (Fixed)
  secondary: '#003366', // Darker Blue
  accent: '#E74C3C', // Red Checkmark
  error: materialTheme.schemes.light.error
};

const STORAGE_KEY = '@theme_colors_v3'; // Changed to force reset of cached colors
const PHOTO_STORAGE_KEY = '@last_user_photo';
const DARK_MODE_KEY = '@theme_dark_mode';
const HAPTICS_KEY = '@haptics_enabled';
const HAPTICS_INTENSITY_KEY = '@haptics_intensity';

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [lastUserPhoto, setLastUserPhoto] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [hapticsIntensity, setHapticsIntensity] = useState('light'); // light, medium, heavy

  // ✅ Cargar colores y foto guardados al iniciar la app
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedColors = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedColors) {
          setColors(JSON.parse(savedColors));
        }
        
        const savedPhoto = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);
        if (savedPhoto) {
          setLastUserPhoto(savedPhoto);
        }

        const savedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }

        const savedHaptics = await AsyncStorage.getItem(HAPTICS_KEY);
        if (savedHaptics !== null) {
          setHapticsEnabled(savedHaptics === 'true');
        }

        const savedIntensity = await AsyncStorage.getItem(HAPTICS_INTENSITY_KEY);
        if (savedIntensity) {
          setHapticsIntensity(savedIntensity);
        }
      } catch (error) {
        // Si hay error, usar defaults
      }
    };

    loadSavedData();
  }, []);

  // ✅ Cargar colores y foto del usuario cuando inicia sesión
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.uid) {
        return;
      }

      try {
        // ✅ Leer desde userSettings collection (estructura real de Firestore)
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userSettingsSnap = await getDoc(userSettingsRef);

        if (userSettingsSnap.exists()) {
          const settings = userSettingsSnap.data();
          
          // 1. Cargar Tema
          if (settings?.theme) {
            // 🔒 FORCE CORPORATE COLORS: Ignoramos los colores dinámicos de Firestore
            // para mantener la identidad de marca consistente (Azul/Rojo)
            const newColors = {
              primary: DEFAULT_COLORS.primary, // Siempre usar Corporate Blue
              secondary: DEFAULT_COLORS.secondary, // Siempre usar Dark Blue
              accent: DEFAULT_COLORS.accent, // Siempre usar Red Accent
              error: settings.theme.error || DEFAULT_COLORS.error
            };
            setColors(newColors);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newColors));
          }

          // 2. Cargar Preferencias (Dark Mode, Haptics)
          if (settings?.preferences) {
            const { darkMode, hapticsEnabled: haptics, hapticsIntensity: intensity } = settings.preferences;
            
            if (darkMode !== undefined) {
              setIsDarkMode(darkMode);
              await AsyncStorage.setItem(DARK_MODE_KEY, String(darkMode));
            }
            
            if (haptics !== undefined) {
              setHapticsEnabled(haptics);
              await AsyncStorage.setItem(HAPTICS_KEY, String(haptics));
            }

            if (intensity) {
              setHapticsIntensity(intensity);
              await AsyncStorage.setItem(HAPTICS_INTENSITY_KEY, intensity);
            }
          }
        }

        // ✅ También cargar la foto de perfil del usuario
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data()?.photoURL) {
          const photoURL = userSnap.data().photoURL;
          setLastUserPhoto(photoURL);
          // ✅ Guardar foto en AsyncStorage
          await AsyncStorage.setItem(PHOTO_STORAGE_KEY, photoURL);
        }
      } catch (error) {
        // Si hay error, mantener colores actuales
      }
    };

    loadUserSettings();
  }, [user]);

  // ✅ Helper para guardar en Firestore
  const savePreferenceToFirestore = async (key, value) => {
    if (!user?.uid) return;
    try {
      const userSettingsRef = doc(db, 'userSettings', user.uid);
      await setDoc(userSettingsRef, {
        preferences: {
          [key]: value
        }
      }, { merge: true });
    } catch (error) {
      console.error('Error guardando preferencia en Firestore:', error);
    }
  };

  // ✅ Guardar todas las preferencias manualmente
  const saveAllPreferences = async () => {
    if (!user?.uid) return;
    try {
      const userSettingsRef = doc(db, 'userSettings', user.uid);
      await setDoc(userSettingsRef, {
        preferences: {
          darkMode: isDarkMode,
          hapticsEnabled: hapticsEnabled,
          hapticsIntensity: hapticsIntensity
        }
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error guardando todas las preferencias:', error);
      throw error;
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(DARK_MODE_KEY, String(newMode));
      // savePreferenceToFirestore('darkMode', newMode); // Desactivado auto-save para usar botón manual si se prefiere
    } catch (error) {
      console.error('Error al cambiar modo oscuro:', error);
    }
  };

  const toggleHaptics = async () => {
    try {
      const newState = !hapticsEnabled;
      setHapticsEnabled(newState);
      await AsyncStorage.setItem(HAPTICS_KEY, String(newState));
      // savePreferenceToFirestore('hapticsEnabled', newState);
      if (newState) Haptics.selectionAsync();
    } catch (error) {
      console.error('Error al cambiar haptics:', error);
    }
  };

  const setIntensity = async (intensity) => {
    try {
      setHapticsIntensity(intensity);
      await AsyncStorage.setItem(HAPTICS_INTENSITY_KEY, intensity);
      // savePreferenceToFirestore('hapticsIntensity', intensity);
      // Feedback inmediato
      if (intensity === 'light') Haptics.selectionAsync();
      if (intensity === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (intensity === 'heavy') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error al cambiar intensidad:', error);
    }
  };

  // ✅ Wrapper seguro para Haptics
  const triggerHaptic = (type = 'selection') => {
    // Force check if enabled
    if (hapticsEnabled === false) return;
    
    try {
      // Si es 'selection' (el más común), usar la intensidad configurada
      if (type === 'selection') {
        switch (hapticsIntensity) {
          case 'light': Haptics.selectionAsync(); return;
          case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); return;
          case 'heavy': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); return;
          default: Haptics.selectionAsync(); return;
        }
      }

      // Para otros tipos específicos, mantener su comportamiento original
      switch (type) {
        case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
        case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
        case 'heavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
        case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
        case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
        case 'error': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
        default: Haptics.selectionAsync();
      }
    } catch (error) {
      console.log('Haptics error:', error);
    }
  };

  const value = {
    colors,
    isDarkMode,
    lastUserPhoto, // ✅ Exponer la foto del último usuario
    hapticsEnabled,
    hapticsIntensity,
    toggleDarkMode,
    toggleHaptics,
    setIntensity,
    saveAllPreferences, // ✅ Exponer función
    triggerHaptic,
    // Helper para obtener array de gradiente
    getGradient: () => [colors.primary, colors.secondary],
    // Helper para obtener color único
    getPrimaryColor: () => colors.primary,
    getSecondaryColor: () => colors.secondary,
    getAccentColor: () => colors.accent,
    getErrorColor: () => colors.error
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};
