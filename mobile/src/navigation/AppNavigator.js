import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
// Admin screens (se crearán en FASE 5 - opcional)
// import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
// import ReportesScreen from '../screens/reportes/ReportesScreen';

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

  return (
    <NavigationContainer ref={ref}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {/* 📱 Pantalla principal */}
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            
            {/* 👨‍💼 Pantallas solo para ADMIN y SUPER_ADMIN (FASE 5 - opcional) */}
            {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
              <>
                {/* <Stack.Screen name="Asistencias" component={AsistenciasScreen} /> */}
                {/* <Stack.Screen name="Reportes" component={ReportesScreen} /> */}
              </>
            )}
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
