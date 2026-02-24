import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { usePermissionChangeNotifier } from '../hooks/usePermissionChangeNotifier';
import { ActivityIndicator, View } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator'; // ✅ FASE 0.3: Bottom Tab Navigator
import AsistenciaDetailScreen from '../screens/asistencias/AsistenciaDetailScreen'; // ✅ FASE 0.5: Detalle de asistencia
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import NovedadesScreen from '../screens/novedades/NovedadesScreen';
import AdminNovedadesScreen from '../screens/admin/AdminNovedadesScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminCreateAlertScreen from '../screens/admin/AdminCreateAlertScreen';
import UsersScreen from '../screens/admin/UsersScreen'; // ✅ RBAC: Gestión de usuarios y permisos
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import NotificationPreferencesScreen from '../screens/settings/NotificationPreferencesScreen';
import AdminNotificationControlScreen from '../screens/admin/AdminNotificationControlScreen';
import EmpresasScreen from '../screens/empresas/EmpresasScreen';
import EmpresaDetailScreen from '../screens/empresas/EmpresaDetailScreen';
import EmpleadosScreen from '../screens/empleados/EmpleadosScreen';
import EmpleadoDetailScreen from '../screens/empleados/EmpleadoDetailScreen';

const Stack = createNativeStackNavigator();

function AppNavigator({ navigation }, ref) {
  const { user, userProfile, loading } = useAuth();
  
  // ✅ Hook para notificar cambios de permisos en tiempo real
  const { renderDialog } = usePermissionChangeNotifier();

  // ✅ Esperar a que tanto user como userProfile estén cargados
  if (loading || (user && !userProfile)) {
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
    <>
      <ErrorBoundary>
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
            <Stack.Screen name="AdminCreateAlert" component={AdminCreateAlertScreen} />
            <Stack.Screen name="Users" component={UsersScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
            <Stack.Screen name="AdminNotificationControl" component={AdminNotificationControlScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Empresas" component={EmpresasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EmpresaDetail" component={EmpresaDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Empleados" component={EmpleadosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EmpleadoDetail" component={EmpleadoDetailScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // Usuario no autenticado
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </ErrorBoundary>
    
    {/* ✅ Renderizar diálogo de permisos fuera del NavigationContainer */}
    {renderDialog()}
  </>
  );
}

export default React.forwardRef(AppNavigator);
