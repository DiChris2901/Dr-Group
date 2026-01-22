import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Switch, Surface, useTheme, ActivityIndicator, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { useAuth } from '../../contexts/AuthContext';
import materialTheme from '../../../material-theme.json';

export default function NotificationPreferencesScreen({ navigation }) {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { preferences, loading, updateSection } = useNotificationPreferences();
  const [saving, setSaving] = useState(false);

  const surfaceColors = theme.dark ? materialTheme.schemes.dark : materialTheme.schemes.light;

  const handleToggle = async (category, key, value) => {
    Haptics.selectionAsync();
    setSaving(true);

    try {
      const result = await updateSection(category, { [key]: value });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', 'No se pudo guardar la configuración');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEventToggle = async (eventKey, value) => {
    Haptics.selectionAsync();
    setSaving(true);

    try {
      const updatedEvents = {
        ...preferences.calendar.events,
        [eventKey]: value,
      };

      const result = await updateSection('calendar', { events: updatedEvents });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: surfaceColors.background }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="arrow-left" 
          size={24} 
          color={surfaceColors.onSurface} 
          onPress={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="headlineSmall" style={{ color: surfaceColors.onSurface, fontWeight: '500' }}>
            Notificaciones
          </Text>
          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
            Personaliza tus alertas
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 📅 CALENDARIO (Solo ADMIN puede ver y configurar) */}
        {isAdmin && (
          <Surface style={[styles.section, { backgroundColor: surfaceColors.surfaceContainerLow }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-alert" size={24} color={surfaceColors.primary} />
              <Text variant="titleMedium" style={{ color: surfaceColors.onSurface, marginLeft: 12, fontWeight: '600' }}>
                📅 Calendario
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginBottom: 16 }}>
              Recordatorios de vencimientos y eventos empresariales
            </Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: surfaceColors.onSurface, fontWeight: '500' }}>Activar notificaciones de calendario</Text>
                <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                  Recibe alertas de eventos próximos
                </Text>
              </View>
              <Switch 
                value={preferences?.calendar.enabled} 
                onValueChange={(val) => handleToggle('calendar', 'enabled', val)}
                disabled={saving}
              />
            </View>

            {preferences?.calendar.enabled && (
              <>
                <Divider style={{ marginVertical: 16 }} />
                
                <Text variant="labelLarge" style={{ color: surfaceColors.primary, marginBottom: 12, textTransform: 'uppercase' }}>
                  Tipos de Eventos
                </Text>

                <View style={styles.row}>
                  <Text style={{ flex: 1, color: surfaceColors.onSurface }}>👥 Parafiscales</Text>
                  <Switch 
                    value={preferences?.calendar.events.parafiscales} 
                    onValueChange={(val) => handleEventToggle('parafiscales', val)}
                    disabled={saving}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={{ flex: 1, color: surfaceColors.onSurface }}>🎰 Coljuegos</Text>
                  <Switch 
                    value={preferences?.calendar.events.coljuegos} 
                    onValueChange={(val) => handleEventToggle('coljuegos', val)}
                    disabled={saving}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={{ flex: 1, color: surfaceColors.onSurface }}>👮 UIAF</Text>
                  <Switch 
                    value={preferences?.calendar.events.uiaf} 
                    onValueChange={(val) => handleEventToggle('uiaf', val)}
                    disabled={saving}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={{ flex: 1, color: surfaceColors.onSurface }}>📄 Contratos</Text>
                  <Switch 
                    value={preferences?.calendar.events.contratos} 
                    onValueChange={(val) => handleEventToggle('contratos', val)}
                    disabled={saving}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={{ flex: 1, color: surfaceColors.onSurface }}>🇨🇴 Festivos</Text>
                  <Switch 
                    value={preferences?.calendar.events.festivos} 
                    onValueChange={(val) => handleEventToggle('festivos', val)}
                    disabled={saving}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={{ flex: 1, color: surfaceColors.onSurface }}>📝 Eventos Personales</Text>
                  <Switch 
                    value={preferences?.calendar.events.custom} 
                    onValueChange={(val) => handleEventToggle('custom', val)}
                    disabled={saving}
                  />
                </View>
              </>
            )}
          </Surface>
        )}

        {/* ⏰ ASISTENCIA */}
        <Surface style={[styles.section, { backgroundColor: surfaceColors.surfaceContainerLow }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-alert-outline" size={24} color={surfaceColors.secondary} />
            <Text variant="titleMedium" style={{ color: surfaceColors.onSurface, marginLeft: 12, fontWeight: '600' }}>
              ⏰ Asistencia
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginBottom: 16 }}>
            Recordatorios de tu jornada laboral
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: surfaceColors.onSurface, fontWeight: '500' }}>Activar recordatorios de asistencia</Text>
              <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                Recordatorios de salida, breaks y almuerzo
              </Text>
            </View>
            <Switch 
              value={preferences?.attendance.enabled} 
              onValueChange={(val) => handleToggle('attendance', 'enabled', val)}
              disabled={saving}
            />
          </View>

          {preferences?.attendance.enabled && (
            <>
              <Divider style={{ marginVertical: 16 }} />

              <View style={styles.row}>
                <Text style={{ flex: 1, color: surfaceColors.onSurface }}>🏠 Recordatorio de salida (6 PM)</Text>
                <Switch 
                  value={preferences?.attendance.exitReminder} 
                  onValueChange={(val) => handleToggle('attendance', 'exitReminder', val)}
                  disabled={saving}
                />
              </View>

              <View style={styles.row}>
                <Text style={{ flex: 1, color: surfaceColors.onSurface }}>☕ Recordatorio de break (4 horas)</Text>
                <Switch 
                  value={preferences?.attendance.breakReminder} 
                  onValueChange={(val) => handleToggle('attendance', 'breakReminder', val)}
                  disabled={saving}
                />
              </View>

              <View style={styles.row}>
                <Text style={{ flex: 1, color: surfaceColors.onSurface }}>🍽️ Recordatorio de almuerzo (12 PM)</Text>
                <Switch 
                  value={preferences?.attendance.lunchReminder} 
                  onValueChange={(val) => handleToggle('attendance', 'lunchReminder', val)}
                  disabled={saving}
                />
              </View>
            </>
          )}
        </Surface>

        {/* 🔔 ALERTAS DEL SISTEMA */}
        <Surface style={[styles.section, { backgroundColor: surfaceColors.surfaceContainerLow }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bell-alert" size={24} color={surfaceColors.tertiary} />
            <Text variant="titleMedium" style={{ color: surfaceColors.onSurface, marginLeft: 12, fontWeight: '600' }}>
              🔔 Alertas
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginBottom: 16 }}>
            Notificaciones del sistema y mensajes de administradores
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: surfaceColors.onSurface, fontWeight: '500' }}>Activar alertas del sistema</Text>
              <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                Notificaciones importantes de la aplicación
              </Text>
            </View>
            <Switch 
              value={preferences?.alerts.enabled} 
              onValueChange={(val) => handleToggle('alerts', 'enabled', val)}
              disabled={saving}
            />
          </View>

          {preferences?.alerts.enabled && (
            <>
              <Divider style={{ marginVertical: 16 }} />

              <View style={styles.row}>
                <Text style={{ flex: 1, color: surfaceColors.onSurface }}>⚙️ Alertas del sistema</Text>
                <Switch 
                  value={preferences?.alerts.systemAlerts} 
                  onValueChange={(val) => handleToggle('alerts', 'systemAlerts', val)}
                  disabled={saving}
                />
              </View>

              <View style={styles.row}>
                <Text style={{ flex: 1, color: surfaceColors.onSurface }}>💬 Mensajes de administradores</Text>
                <Switch 
                  value={preferences?.alerts.adminMessages} 
                  onValueChange={(val) => handleToggle('alerts', 'adminMessages', val)}
                  disabled={saving}
                />
              </View>

              <View style={styles.row}>
                <Text style={{ flex: 1, color: surfaceColors.onSurface }}>🚨 Solo notificaciones urgentes</Text>
                <Switch 
                  value={preferences?.alerts.urgentOnly} 
                  onValueChange={(val) => handleToggle('alerts', 'urgentOnly', val)}
                  disabled={saving}
                />
              </View>
            </>
          )}
        </Surface>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
