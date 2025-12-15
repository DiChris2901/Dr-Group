import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { checkForUpdates } from './src/services/UpdateService';
import NotificationService from './src/services/NotificationService';

// 🎨 TEMA "PROJECT CHRONOS" - Deep Indigo Identity (Light)
const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366F1', // Deep Indigo
    primaryContainer: '#E0E7FF', // Indigo 100
    secondary: '#4F46E5', // Indigo 600
    secondaryContainer: '#EEF2FF', // Indigo 50
    tertiary: '#EC4899', // Pink 500 (Accents)
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // Slate 100
    error: '#EF4444',
  },
  roundness: 4, // Base roundness (multiplied by components)
};

// 🌙 TEMA OSCURO "PROJECT CHRONOS"
const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818CF8', // Indigo 400 (más claro para contraste)
    primaryContainer: '#3730A3', // Indigo 800
    secondary: '#6366F1', // Indigo 500
    secondaryContainer: '#312E81', // Indigo 900
    tertiary: '#F472B6', // Pink 400
    background: '#0F172A', // Slate 900
    surface: '#1E293B', // Slate 800
    surfaceVariant: '#334155', // Slate 700
    error: '#F87171',
  },
  roundness: 4,
};

function AppContent() {
  const navigationRef = useRef(null);
  const { isDarkMode } = useTheme();

  // Seleccionar tema según el estado
  const theme = isDarkMode ? darkTheme : lightTheme;

  // ✅ Verificar actualizaciones OTA y solicitar permisos de notificaciones
  useEffect(() => {
    checkForUpdates();
    NotificationService.requestPermissions();
  }, []);

  // ✅ PASO 3.6: Manejar tap en notificaciones
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('🔔 Usuario tocó notificación:', data);

      // Navegar según el tipo de notificación
      if (data.screen === 'Dashboard') {
        navigationRef.current?.navigate('Dashboard');
      }
      // Agregar más navegaciones según sea necesario
    });

    return () => subscription.remove();
  }, []);
  return (
    <PaperProvider theme={theme}>
      <NotificationsProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={theme.colors.background} />
        <AppNavigator ref={navigationRef} />
      </NotificationsProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
