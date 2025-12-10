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
            {isAdmin ? (
              /* ✅ ADMIN: Acceso completo con Bottom Tab Navigator */
              <Stack.Screen name="Main" component={BottomTabNavigator} />
            ) : (
              /* ✅ USER: Solo Dashboard sin navegación inferior */
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
            )}
            
            {/* ✅ FASE 0.5: Pantalla de detalle de asistencia */}
            <Stack.Screen name="AsistenciaDetail" component={AsistenciaDetailScreen} />
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
