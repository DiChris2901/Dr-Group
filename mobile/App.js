import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const navigationRef = useRef(null);

  // ✅ PASO 3.6: Manejar tap en notificaciones
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('🔔 Usuario tocó notificación:', data);

      // Navegar según el tipo de notificación
      if (data.screen === 'Chat') {
        navigationRef.current?.navigate('Chat');
      }
      // Agregar más navegaciones según sea necesario
    });

    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <ChatProvider>
            <StatusBar style="light" />
            <AppNavigator ref={navigationRef} />
          </ChatProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
