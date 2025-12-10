import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CalendarioScreen from '../screens/calendario/CalendarioScreen';
import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';
import NovedadesScreen from '../screens/novedades/NovedadesScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, color, size, focused }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.2 : 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <MaterialIcons name={name} size={size} color={color} />
    </Animated.View>
  );
};

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
  const { getPrimaryColor } = useTheme();
  const { userProfile } = useAuth();
  
  const userRole = userProfile?.role || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

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
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="access-time" size={24} color={color} focused={focused} />
          ),
          tabBarLabel: 'Jornada'
        }}
      />
      
      {isAdmin ? (
        <Tab.Screen 
          name="Calendario" 
          component={CalendarioScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="event" size={24} color={color} focused={focused} />
            ),
            tabBarLabel: 'Calendario'
          }}
        />
      ) : (
        <Tab.Screen 
          name="Novedades" 
          component={NovedadesScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="notification-important" size={24} color={color} focused={focused} />
            ),
            tabBarLabel: 'Novedades'
          }}
        />
      )}
      
      <Tab.Screen 
        name="Reportes" 
        component={ReportesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bar-chart" size={24} color={color} focused={focused} />
          ),
          tabBarLabel: isAdmin ? 'Reportes' : 'Estadísticas'
        }}
      />
      
      <Tab.Screen 
        name="Asistencias" 
        component={AsistenciasScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="event-note" size={24} color={color} focused={focused} />
          ),
          tabBarLabel: 'Historial'
        }}
      />
    </Tab.Navigator>
  );
}
