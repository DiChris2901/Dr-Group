// DashboardWrapper - Decide qué Dashboard mostrar según permisos
// Muestra skeleton mientras valida para evitar transiciones molestas

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { usePermissions } from '../hooks/usePermissions';
import { APP_PERMISSIONS } from '../constants/permissions';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AdminDashboardScreen from '../screens/dashboard/AdminDashboardScreen';

export default function DashboardWrapper({ navigation }) {
  const theme = useTheme();
  const { can, loading } = usePermissions();

  // Mostrar skeleton mientras valida permisos
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Decidir qué dashboard mostrar según permisos
  const canAccessAdminDashboard = can(APP_PERMISSIONS.ADMIN_DASHBOARD);

  return canAccessAdminDashboard 
    ? <AdminDashboardScreen navigation={navigation} /> 
    : <DashboardScreen navigation={navigation} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
