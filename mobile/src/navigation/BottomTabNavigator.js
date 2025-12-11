import React, { useEffect, useRef } from 'react';
import { Animated, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  // Ionicons logic: filled when focused, outline when not
  const iconName = focused ? name : `${name}-outline`;
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? color + '20' : 'transparent', // 20 = 12% opacity approx
      paddingHorizontal: 20,
      paddingVertical: 4,
      borderRadius: 16, // Pill shape
      marginBottom: 4
    }}>
      <Ionicons name={iconName} size={24} color={color} />
    </View>
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
  const insets = useSafeAreaInsets();
  
  const userRole = userProfile?.role || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: getPrimaryColor(),
        tabBarInactiveTintColor: '#64748b', // Slate 500
        tabBarStyle: {
          height: 80 + (Platform.OS === 'ios' ? insets.bottom : 10), // Ajuste dinámico
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9', // Slate 100
          elevation: 0, // Flat design (Material 3)
          paddingTop: 12,
          paddingBottom: 12 + (Platform.OS === 'ios' ? insets.bottom : 10), // Ajuste dinámico
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
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid" size={24} color={color} focused={focused} />
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
              <TabIcon name="calendar" size={24} color={color} focused={focused} />
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
              <TabIcon name="notifications" size={24} color={color} focused={focused} />
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
            <TabIcon name="time" size={24} color={color} focused={focused} />
          ),
          tabBarLabel: 'Historial'
        }}
      />
    </Tab.Navigator>
  );
}
