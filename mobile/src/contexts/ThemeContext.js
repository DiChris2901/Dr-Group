import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';

const ThemeContext = createContext({});

// ✅ Colores por defecto spectacular
const DEFAULT_COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  accent: '#f093fb',
  error: '#f5576c'
};

const STORAGE_KEY = '@theme_colors';
const PHOTO_STORAGE_KEY = '@last_user_photo';
const DARK_MODE_KEY = '@theme_dark_mode';

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [lastUserPhoto, setLastUserPhoto] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
          if (settings?.theme) {
            const newColors = {
              primary: settings.theme.primaryColor || DEFAULT_COLORS.primary,
              secondary: settings.theme.secondaryColor || DEFAULT_COLORS.secondary,
              accent: settings.theme.accent || DEFAULT_COLORS.accent,
              error: settings.theme.error || DEFAULT_COLORS.error
            };
            setColors(newColors);
            // ✅ Guardar en AsyncStorage para la próxima vez
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newColors));
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

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(DARK_MODE_KEY, String(newMode));
    } catch (error) {
      console.error('Error al cambiar modo oscuro:', error);
    }
  };

  const value = {
    colors,
    isDarkMode,
    lastUserPhoto, // ✅ Exponer la foto del último usuario
    toggleDarkMode,
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
