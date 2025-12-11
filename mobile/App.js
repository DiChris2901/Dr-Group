import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { checkForUpdates } from './src/services/UpdateService';

// 🎨 TEMA "PROJECT CHRONOS" - Deep Indigo Identity
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
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

export default function App() {
  const navigationRef = useRef(null);

  // ✅ Verificar actualizaciones OTA al iniciar
  useEffect(() => {
    checkForUpdates();
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
      <AuthProvider>
        <ThemeProvider>
          <NotificationsProvider>
            <StatusBar style="dark" backgroundColor="#F8FAFC" />
            <AppNavigator ref={navigationRef} />
          </NotificationsProvider>
        </ThemeProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
