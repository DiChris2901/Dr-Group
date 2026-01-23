import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { BottomNavigation, useTheme as usePaperTheme } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import { APP_PERMISSIONS } from '../constants/permissions';

// Screens
import AdminNovedadesScreen from '../screens/admin/AdminNovedadesScreen';
import AsistenciasScreen from '../screens/asistencias/AsistenciasScreen';
import CalendarioScreen from '../screens/calendario/CalendarioScreen';
import DashboardWrapper from '../components/DashboardWrapper';
import NovedadesScreen from '../screens/novedades/NovedadesScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const theme = usePaperTheme();
  const { userProfile } = useAuth();
  const { triggerHaptic } = useTheme();
  const { can } = usePermissions();
  
  // ✅ Validar permisos individuales
  const canAccessDashboard = can(APP_PERMISSIONS.DASHBOARD);
  const canAccessAdminDashboard = can(APP_PERMISSIONS.ADMIN_DASHBOARD);
  const canAccessCalendario = can(APP_PERMISSIONS.CALENDARIO);
  const canAccessAdminNovedades = can(APP_PERMISSIONS.ADMIN_NOVEDADES);
  const canAccessNovedades = can(APP_PERMISSIONS.NOVEDADES_REPORTAR) || can(APP_PERMISSIONS.NOVEDADES_GESTIONAR);
  const canAccessReportes = can(APP_PERMISSIONS.REPORTES_PROPIOS) || can(APP_PERMISSIONS.REPORTES_TODOS);
  const canAccessAsistencias = can(APP_PERMISSIONS.ASISTENCIAS_PROPIAS) || can(APP_PERMISSIONS.ASISTENCIAS_TODOS);

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
      {/* Dashboard: SIEMPRE renderizado primero para ser la pantalla inicial */}
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardWrapper}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons 
              name={focused ? "view-dashboard" : "view-dashboard-outline"} 
              size={24} 
              color={color} 
            />
          ),
          tabBarItemStyle: (canAccessAdminDashboard || canAccessDashboard) ? {} : { display: 'none' }
        }}
      />

      {/* Calendario: Solo si tiene permiso */}
      {canAccessCalendario && (
        <Tab.Screen 
          name="Calendario" 
          component={CalendarioScreen}
          options={{
            tabBarLabel: 'Calendario',
            tabBarIcon: ({ focused, color}) => (
              <MaterialCommunityIcons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            ),
          }}
        />
      )}

      {/* Novedades: SIEMPRE VISIBLE - Muestra AdminNovedades o Novedades según permiso */}
      <Tab.Screen 
        name="Novedades" 
        component={canAccessAdminNovedades ? AdminNovedadesScreen : NovedadesScreen}
        options={{
          tabBarLabel: 'Novedades',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons 
              name={focused 
                ? (canAccessAdminNovedades ? "inbox-full" : "bell") 
                : (canAccessAdminNovedades ? "inbox-outline" : "bell-outline")
              } 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Reportes: Solo si tiene permiso */}
      {canAccessReportes && (
        <Tab.Screen 
          name="Reportes" 
          component={ReportesScreen}
          options={{
            tabBarLabel: canAccessAdminDashboard ? 'Reportes' : 'Estadísticas',
            tabBarIcon: ({ focused, color }) => (
              <MaterialCommunityIcons name={focused ? "chart-bar" : "chart-bar"} size={24} color={color} />
            ),
          }}
        />
      )}
      
      {/* Asistencias (Historial): SIEMPRE VISIBLE - Todos los usuarios ven esta pestaña */}
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
