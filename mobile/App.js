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
import UpdateBanner from './src/components/UpdateBanner';
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

  // ✅ Verificar TODAS las actualizaciones (OTA + APK)
  // Permisos de notificaciones gestionados por NotificationsContext
  useEffect(() => {
    checkForAllUpdates();
  }, []);

  // ✅ Deep linking: Navegar a la pantalla correcta al tocar una notificación
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};

      if (!navigationRef.current) return;
      const nav = navigationRef.current;

      // 1. Notificación persistente de estado → Dashboard
      if (['trabajando', 'break', 'almuerzo'].includes(data.estado)) {
        nav.navigate('Main', { screen: 'Dashboard' });
      }
      // 2. Meta de trabajo o break largo → Dashboard
      else if (data.type === 'work_goal_reached' || data.type === 'long_break') {
        nav.navigate('Main', { screen: 'Dashboard' });
      }
      // 3. Novedades (aprobada/rechazada) → Tab Novedades
      else if (data.type === 'novedad_approved' || data.type === 'novedad_rejected') {
        nav.navigate('Main', { screen: 'Novedades' });
      }
      // 4. Admin nueva novedad → Tab Novedades (admin ve AdminNovedades)
      else if (data.type === 'admin_new_novedad') {
        nav.navigate('Main', { screen: 'Novedades' });
      }
      // 5. Evento de calendario → Tab Calendario
      else if (data.type === 'calendar' || data.type === 'calendar_event') {
        nav.navigate('Main', { screen: 'Calendario' });
      }
      // 6. Alerta de admin → Pantalla de Notificaciones
      else if (data.type === 'admin_alert') {
        nav.navigate('Notifications');
      }
      // 7. Recordatorios de asistencia (salida, break, almuerzo) → Dashboard
      else if (data.type === 'attendance') {
        nav.navigate('Main', { screen: 'Dashboard' });
      }
      // 8. Recordatorio de inicio de jornada → Dashboard
      else if (data.type === 'work_reminder') {
        nav.navigate('Main', { screen: 'Dashboard' });
      }
      // Default → Notificaciones para ver detalle
      else {
        nav.navigate('Notifications');
      }
    });

    return () => subscription.remove();
  }, []);
  return (
    <PaperProvider theme={theme}>
      <NotificationsProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={theme.colors.background} />
        {/* 🔄 Banner de actualizaciones OTA */}
        <UpdateBanner />
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
