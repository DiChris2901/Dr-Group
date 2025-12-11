import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator'; // ✅ FASE 0.3: Bottom Tab Navigator
import AsistenciaDetailScreen from '../screens/asistencias/AsistenciaDetailScreen'; // ✅ FASE 0.5: Detalle de asistencia
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import NovedadesScreen from '../screens/novedades/NovedadesScreen';
import AdminNovedadesScreen from '../screens/admin/AdminNovedadesScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';

const Stack = createNativeStackNavigator();

function AppNavigator({ navigation }, ref) {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // ✅ PASO 1.3: Determinar rol del usuario
  const userRole = userProfile?.role || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  return (
    <NavigationContainer ref={ref}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {/* ✅ TODOS: Acceso con Bottom Tab Navigator (Tabs dinámicos por rol) */}
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            
            {/* ✅ Pantallas Comunes (Accesibles por Stack) */}
            <Stack.Screen name="AsistenciaDetail" component={AsistenciaDetailScreen} />
            <Stack.Screen name="Novedades" component={NovedadesScreen} />
            <Stack.Screen name="AdminNovedades" component={AdminNovedadesScreen} />
            <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          // Usuario no autenticado
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default React.forwardRef(AppNavigator);
