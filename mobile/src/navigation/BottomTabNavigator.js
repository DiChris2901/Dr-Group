import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext'; // ✅ FIX: Usar custom hook

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CalendarioScreen from '../screens/calendario/CalendarioScreen'; // ✅ FASE 0.4
import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';

const Tab = createBottomTabNavigator();

/**
 * BottomTabNavigator - Navegación principal con 4 tabs
 * 
 * Tabs:
 * 1. Jornada (DashboardScreen) - Control de jornada laboral
 * 2. Calendario (CalendarioScreen) - Eventos programados
 * 3. Reportes (ReportesScreen) - Estadísticas personales
 * 4. Historial (AsistenciasScreen) - Historial de asistencias
 * 
 * Material 3 Expressive Design:
 * - Tab bar con elevation y shadows
 * - Colores dinámicos desde ThemeContext
 * - Íconos Material Icons
 * - Spacing generoso
 */
export default function BottomTabNavigator() {
  const { getPrimaryColor, getSecondaryColor } = useTheme(); // ✅ FIX: Usar custom hook

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: getPrimaryColor(),
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: '#ffffff',
          borderRadius: 30,
          height: 70,
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="access-time" 
              size={focused ? 28 : 24} // Material 3: ícono activo más grande
              color={color} 
            />
          ),
          tabBarLabel: 'Jornada'
        }}
      />
      
      <Tab.Screen 
        name="Calendario" 
        component={CalendarioScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="event" 
              size={focused ? 28 : 24}
              color={color} 
            />
          ),
          tabBarLabel: 'Calendario'
        }}
      />
      
      <Tab.Screen 
        name="Reportes" 
        component={ReportesScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="bar-chart" 
              size={focused ? 28 : 24}
              color={color} 
            />
          ),
          tabBarLabel: 'Reportes'
        }}
      />
      
      <Tab.Screen 
        name="Asistencias" 
        component={AsistenciasScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="event-note" 
              size={focused ? 28 : 24}
              color={color} 
            />
          ),
          tabBarLabel: 'Historial'
        }}
      />
    </Tab.Navigator>
  );
}
