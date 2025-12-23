import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { checkForAllUpdates } from './src/services/UpdateService';
import NotificationService from './src/services/NotificationService';
import materialTheme from './material-theme.json';

// 🎨 TEMA "MATERIAL YOU EXPRESSIVE" - Generated from material-theme.json
const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    ...materialTheme.schemes.light,
    elevation: {
      level0: 'transparent',
      level1: materialTheme.schemes.light.surfaceContainerLow,
      level2: materialTheme.schemes.light.surfaceContainer,
      level3: materialTheme.schemes.light.surfaceContainerHigh,
      level4: materialTheme.schemes.light.surfaceContainerHighest,
      level5: materialTheme.schemes.light.surfaceContainerHighest,
    }
  },
};

// 🌙 TEMA OSCURO "MATERIAL YOU EXPRESSIVE"
const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    ...materialTheme.schemes.dark,
    elevation: {
      level0: 'transparent',
      level1: materialTheme.schemes.dark.surfaceContainerLow,
      level2: materialTheme.schemes.dark.surfaceContainer,
      level3: materialTheme.schemes.dark.surfaceContainerHigh,
      level4: materialTheme.schemes.dark.surfaceContainerHighest,
      level5: materialTheme.schemes.dark.surfaceContainerHighest,
    }
  },
};

function AppContent() {
  const navigationRef = useRef(null);
  const { isDarkMode, colors: dynamicColors } = useTheme();

  // Seleccionar tema base
  const baseTheme = isDarkMode ? darkTheme : lightTheme;

  // ✅ Construir tema dinámico (Solo Primary Color)
  // Mantenemos la paleta original de Material Design (Secondary, Tertiary, etc.)
  // y solo actualizamos el color primario seleccionado por el usuario.
  const primaryColor = dynamicColors.primary;
  
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: primaryColor,
      onPrimary: '#FFFFFF',
      
      // Primary Container (Derivado suave del color principal)
      primaryContainer: primaryColor + '20', 
      onPrimaryContainer: primaryColor,
      
      // Mantenemos el resto de colores originales del tema (Secondary, Tertiary, Error, etc.)
      // para evitar el efecto "todo del mismo color" (monocromático).
      error: dynamicColors.error,
    }
  };

  // ✅ Verificar TODAS las actualizaciones (OTA + APK) y solicitar permisos de notificaciones
  useEffect(() => {
    checkForAllUpdates();
    NotificationService.requestPermissions();
  }, []);

  // ✅ PASO 3.6: Manejar tap en notificaciones
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('🔔 Usuario tocó notificación:', data);

      // Navegar según el tipo de notificación
      if (navigationRef.current) {
        // Si es una notificación de estado (Jornada, Break, Almuerzo) -> Dashboard
        if (['trabajando', 'break', 'almuerzo'].includes(data.estado)) {
          navigationRef.current.navigate('Main', { screen: 'Dashboard' });
        }
        // Si es meta cumplida -> Dashboard
        else if (data.type === 'work_goal_reached') {
          navigationRef.current.navigate('Main', { screen: 'Dashboard' });
        }
        // Si es break largo -> Dashboard
        else if (data.type === 'long_break') {
          navigationRef.current.navigate('Main', { screen: 'Dashboard' });
        }
        // Si es novedad -> Novedades
        else if (data.type === 'novedad_approved' || data.type === 'novedad_rejected') {
          navigationRef.current.navigate('Novedades');
        }
        // Default -> Dashboard
        else {
          navigationRef.current.navigate('Main', { screen: 'Dashboard' });
        }
      }
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
