import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { BottomNavigation, useTheme as usePaperTheme } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Screens
import AdminNovedadesScreen from '../screens/admin/AdminNovedadesScreen';
import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
import CalendarioScreen from '../screens/calendario/CalendarioScreen';
import AdminDashboardScreen from '../screens/dashboard/AdminDashboardScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import NovedadesScreen from '../screens/novedades/NovedadesScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const theme = usePaperTheme();
  const { userProfile } = useAuth();
  const { triggerHaptic } = useTheme();
  
  const userRole = userProfile?.role || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            triggerHaptic('selection'); // ✅ Vibración al cambiar de pestaña
            
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              preventDefault();
            } else {
             navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key];
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 });
            }
            return null;
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            return options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;
          }}
          style={{
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.surfaceVariant,
            borderTopWidth: 0.5,
          }}
          activeIndicatorStyle={{
            backgroundColor: theme.colors.secondaryContainer,
          }}
        />
      )}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={isAdmin ? AdminDashboardScreen : DashboardScreen}
        options={{
          tabBarLabel: isAdmin ? 'Control' : 'Mi Jornada',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons 
              name={isAdmin ? (focused ? "view-dashboard" : "view-dashboard-outline") : (focused ? "timer" : "timer-outline")} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {isAdmin ? <Tab.Screen 
        name="Calendario" 
        component={CalendarioScreen}
        options={{
          tabBarLabel: 'Calendario',
          tabBarIcon: ({ focused, color}) => (
            <MaterialCommunityIcons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      /> : null}

      {isAdmin ? <Tab.Screen 
        name="AdminNovedades" 
        component={AdminNovedadesScreen}
        options={{
          tabBarLabel: 'Novedades',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={focused ? "inbox-full" : "inbox-outline"} size={24} color={color} />
          ),
        }}
      /> : null}

      {!isAdmin ? <Tab.Screen 
        name="Novedades" 
        component={NovedadesScreen}
        options={{
          tabBarLabel: 'Novedades',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={focused ? "bell" : "bell-outline"} size={24} color={color} />
          ),
        }}
      /> : null}

      <Tab.Screen 
        name="Reportes" 
        component={ReportesScreen}
        options={{
          tabBarLabel: isAdmin ? 'Reportes' : 'Estadísticas',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={focused ? "chart-bar" : "chart-bar"} size={24} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Asistencias" 
        component={AsistenciasScreen}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={focused ? "clock-time-four" : "clock-time-four-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
