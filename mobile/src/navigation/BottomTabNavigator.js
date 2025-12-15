import React, { useEffect, useRef } from 'react';
import { Animated, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
// import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'; // Removed as per user request
import AdminNovedadesScreen from '../screens/admin/AdminNovedadesScreen';
import CalendarioScreen from '../screens/calendario/CalendarioScreen';
import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';
import NovedadesScreen from '../screens/novedades/NovedadesScreen';

const Tab = createBottomTabNavigator();

/**
 * BottomTabNavigator - Navegación principal con tabs dinámicos por rol
 * 
 * Tabs Comunes:
 * 1. Jornada (DashboardScreen)
 * 3. Reportes (ReportesScreen)
 * 4. Historial (AsistenciasScreen)
 * 
 * Tabs Admin:
 * 2. Calendario (CalendarioScreen)
 * 
 * Tabs User:
 * 2. Novedades (NovedadesScreen)
 */
export default function BottomTabNavigator() {
  const paperTheme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  
  const userRole = userProfile?.role || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Color de íconos inactivos con mejor contraste en modo oscuro
  const inactiveColor = paperTheme.dark ? '#94a3b8' : paperTheme.colors.onSurfaceVariant;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: getPrimaryColor(),
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          height: 80 + (Platform.OS === 'ios' ? insets.bottom : 10),
          backgroundColor: paperTheme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: paperTheme.colors.surfaceVariant,
          elevation: 0,
          paddingTop: 12,
          paddingBottom: 12 + (Platform.OS === 'ios' ? insets.bottom : 10),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        }
      }}
    >
      {/* 1. INICIO (Jornada) - Para TODOS (Incluido Admin) */}
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "timer" : "timer-outline"} size={24} color={color} />
          ),
          tabBarLabel: 'Mi Jornada'
        }}
      />

      {isAdmin ? (
        <>
          <Tab.Screen 
            name="Calendario" 
            component={CalendarioScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
              ),
              tabBarLabel: 'Calendario'
            }}
          />
          <Tab.Screen 
            name="AdminNovedades" 
            component={AdminNovedadesScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "file-tray-full" : "file-tray-full-outline"} size={24} color={color} />
              ),
              tabBarLabel: 'Novedades'
            }}
          />
        </>
      ) : (
        <Tab.Screen 
          name="Novedades" 
          component={NovedadesScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={color} />
            ),
            tabBarLabel: 'Novedades'
          }}
        />
      )}
      
      {/* COMMON TABS */}
      <Tab.Screen 
        name="Reportes" 
        component={ReportesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={24} color={color} />
          ),
          tabBarLabel: isAdmin ? 'Reportes' : 'Estadísticas'
        }}
      />
      
      <Tab.Screen 
        name="Asistencias" 
        component={AsistenciasScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={24} color={color} />
          ),
          tabBarLabel: 'Historial'
        }}
      />
    </Tab.Navigator>
  );
}
