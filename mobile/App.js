import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import AppNavigator from './src/navigation/AppNavigator';

// ✅ Suprimir warning de Expo Go sobre push notifications
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('expo-notifications') || args[0].includes('Expo Go')) &&
    (args[0].includes('Push notifications') || args[0].includes('remote notifications'))
  ) {
    return; // Ignorar este warning específico
  }
  originalWarn(...args);
};

export default function App() {
  const navigationRef = useRef(null);

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
    <AuthProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <StatusBar style="light" />
          <AppNavigator ref={navigationRef} />
        </NotificationsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
