import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, Surface, Avatar, IconButton, Switch, useTheme as usePaperTheme, ActivityIndicator, Divider, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { SobrioCard, OverlineText } from '../../components';
import designSystem from '../../../design-system.json';
import materialTheme from '../../../material-theme.json';

export default function AdminNotificationControlScreen({ navigation }) {
  const theme = usePaperTheme();
  const { getPrimaryColor, getSecondaryColor, isDarkMode, triggerHaptic } = useTheme();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const employeesList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by name
      employeesList.sort((a, b) => (a.name || a.displayName || '').localeCompare(b.name || b.displayName || ''));
      
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const openUserPreferences = async (user) => {
    triggerHaptic('selection');
    setSelectedUser(user);
    
    // Load user preferences
    try {
      const preferencesRef = doc(db, 'users', user.id, 'settings', 'notificationPreferences');
      const preferencesSnap = await getDoc(preferencesRef);
      
      if (preferencesSnap.exists()) {
        setUserPreferences(preferencesSnap.data());
      } else {
        // Default preferences
        setUserPreferences(getDefaultPreferences(user.role));
      }
      
      setModalVisible(true);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'No se pudieron cargar las preferencias');
    }
  };

  const getDefaultPreferences = (role) => {
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    
    return {
      calendar: {
        enabled: isAdmin,
        events: {
          parafiscales: isAdmin,
          coljuegos: isAdmin,
          uiaf: isAdmin,
          contratos: isAdmin,
          festivos: false,
          custom: isAdmin
        },
        daysBeforeArray: [2, 0],
        notificationTime: "08:00"
      },
      attendance: {
        enabled: true,
        exitReminder: true,
        breakReminder: true,
        lunchReminder: true
      },
      alerts: {
        enabled: true,
        systemAlerts: true,
        adminMessages: true,
        urgentOnly: false
      }
    };
  };

  const handleToggleSection = (section) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled
      }
    }));
  };

  const handleToggleEvent = (eventType) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        events: {
          ...prev.calendar.events,
          [eventType]: !prev.calendar.events[eventType]
        }
      }
    }));
  };

  const handleToggleAttendance = (type) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [type]: !prev.attendance[type]
      }
    }));
  };

  const handleToggleAlert = (type) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        [type]: !prev.alerts[type]
      }
    }));
  };

  const savePreferences = async () => {
    if (!selectedUser || !userPreferences) return;
    
    setSaving(true);
    triggerHaptic('success');
    
    try {
      const preferencesRef = doc(db, 'users', selectedUser.id, 'settings', 'notificationPreferences');
      await setDoc(preferencesRef, userPreferences);
      
      Alert.alert('Guardado', `Preferencias de ${selectedUser.name || selectedUser.displayName} actualizadas`);
      setModalVisible(false);
      setSelectedUser(null);
      setUserPreferences(null);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchQuery.toLowerCase();
    const name = (emp.name || emp.displayName || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const renderEmployee = ({ item }) => {
    const displayName = item.name || item.displayName || 'Sin nombre';
    const isAdmin = item.role === 'ADMIN' || item.role === 'SUPER_ADMIN';
    
    return (
      <TouchableOpacity
        onPress={() => openUserPreferences(item)}
        activeOpacity={0.7}
      >
        <SobrioCard variant="secondary" style={{ marginBottom: 12 }}>
          <View style={styles.employeeRow}>
            <Avatar.Image 
              size={48} 
              source={{ uri: item.photoURL || 'https://via.placeholder.com/150' }}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {displayName}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                {item.email}
              </Text>
              {isAdmin && (
                <Text variant="labelSmall" style={{ color: getPrimaryColor(), marginTop: 2 }}>
                  ADMIN
                </Text>
              )}
            </View>
            <IconButton 
              icon="bell-cog" 
              size={24}
              iconColor={theme.colors.primary}
            />
          </View>
        </SobrioCard>
      </TouchableOpacity>
    );
  };

  const renderPreferencesModal = () => {
    if (!selectedUser || !userPreferences) return null;
    
    const isAdmin = selectedUser.role === 'ADMIN' || selectedUser.role === 'SUPER_ADMIN';
    
    return (
      <RNModal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <Surface style={[styles.modalHeader, { backgroundColor: getPrimaryColor() }]} elevation={0}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Avatar.Image 
                  size={40} 
                  source={{ uri: selectedUser.photoURL || 'https://via.placeholder.com/150' }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text variant="titleMedium" style={{ color: 'white', fontWeight: '600' }}>
                    {selectedUser.name || selectedUser.displayName}
                  </Text>
                  <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Configurar Notificaciones
                  </Text>
                </View>
                <IconButton 
                  icon="close" 
                  iconColor="white"
                  onPress={() => setModalVisible(false)}
                />
              </View>
            </Surface>

            <ScrollView style={styles.modalContent}>
              {/* Calendar Section (ADMIN only) */}
              {isAdmin && (
                <View style={{ marginBottom: 24 }}>
                  <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                    <View style={styles.sectionHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 32, marginRight: 12 }}>📅</Text>
                        <View style={{ flex: 1 }}>
                          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                            Calendario
                          </Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                            Eventos administrativos
                          </Text>
                        </View>
                      </View>
                      <Switch 
                        value={userPreferences.calendar.enabled} 
                        onValueChange={() => handleToggleSection('calendar')}
                        color={getPrimaryColor()}
                      />
                    </View>

                    {userPreferences.calendar.enabled && (
                      <View style={{ marginTop: 16 }}>
                        <Divider style={{ marginBottom: 12 }} />
                        {[
                          { key: 'parafiscales', label: 'Parafiscales', icon: '🏛️' },
                          { key: 'coljuegos', label: 'Coljuegos', icon: '🎰' },
                          { key: 'uiaf', label: 'UIAF', icon: '💰' },
                          { key: 'contratos', label: 'Contratos', icon: '📄' },
                          { key: 'festivos', label: 'Festivos', icon: '🎉' },
                          { key: 'custom', label: 'Eventos personalizados', icon: '⭐' }
                        ].map((event, index) => (
                          <View key={event.key}>
                            <View style={styles.itemRow}>
                              <Text style={{ fontSize: 20, marginRight: 8 }}>{event.icon}</Text>
                              <Text variant="bodyMedium" style={{ flex: 1 }}>
                                {event.label}
                              </Text>
                              <Switch 
                                value={userPreferences.calendar.events[event.key]} 
                                onValueChange={() => handleToggleEvent(event.key)}
                                color={getPrimaryColor()}
                              />
                            </View>
                            {index < 5 && <Divider style={{ marginVertical: 8 }} />}
                          </View>
                        ))}
                      </View>
                    )}
                  </Surface>
                </View>
              )}

              {/* Attendance Section */}
              <View style={{ marginBottom: 24 }}>
                <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                  <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 32, marginRight: 12 }}>⏰</Text>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                          Asistencia
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                          Recordatorios de jornada
                        </Text>
                      </View>
                    </View>
                    <Switch 
                      value={userPreferences.attendance.enabled} 
                      onValueChange={() => handleToggleSection('attendance')}
                      color={getPrimaryColor()}
                    />
                  </View>

                  {userPreferences.attendance.enabled && (
                    <View style={{ marginTop: 16 }}>
                      <Divider style={{ marginBottom: 12 }} />
                      {[
                        { key: 'exitReminder', label: 'Recordatorio de salida', desc: '6:00 PM' },
                        { key: 'breakReminder', label: 'Recordatorio de break', desc: 'Después de 4 horas' },
                        { key: 'lunchReminder', label: 'Recordatorio de almuerzo', desc: '12:00 PM' }
                      ].map((item, index) => (
                        <View key={item.key}>
                          <View style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                              <Text variant="bodyMedium">{item.label}</Text>
                              <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                                {item.desc}
                              </Text>
                            </View>
                            <Switch 
                              value={userPreferences.attendance[item.key]} 
                              onValueChange={() => handleToggleAttendance(item.key)}
                              color={getPrimaryColor()}
                            />
                          </View>
                          {index < 2 && <Divider style={{ marginVertical: 8 }} />}
                        </View>
                      ))}
                    </View>
                  )}
                </Surface>
              </View>

              {/* Alerts Section */}
              <View style={{ marginBottom: 24 }}>
                <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                  <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 32, marginRight: 12 }}>🔔</Text>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                          Alertas
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                          Notificaciones generales
                        </Text>
                      </View>
                    </View>
                    <Switch 
                      value={userPreferences.alerts.enabled} 
                      onValueChange={() => handleToggleSection('alerts')}
                      color={getPrimaryColor()}
                    />
                  </View>

                  {userPreferences.alerts.enabled && (
                    <View style={{ marginTop: 16 }}>
                      <Divider style={{ marginBottom: 12 }} />
                      {[
                        { key: 'systemAlerts', label: 'Alertas del sistema', desc: 'Actualizaciones y mantenimiento' },
                        { key: 'adminMessages', label: 'Mensajes de administradores', desc: 'Comunicados importantes' },
                        { key: 'urgentOnly', label: 'Solo alertas urgentes', desc: 'Filtrar notificaciones' }
                      ].map((item, index) => (
                        <View key={item.key}>
                          <View style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                              <Text variant="bodyMedium">{item.label}</Text>
                              <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                                {item.desc}
                              </Text>
                            </View>
                            <Switch 
                              value={userPreferences.alerts[item.key]} 
                              onValueChange={() => handleToggleAlert(item.key)}
                              color={getPrimaryColor()}
                            />
                          </View>
                          {index < 2 && <Divider style={{ marginVertical: 8 }} />}
                        </View>
                      ))}
                    </View>
                  )}
                </Surface>
              </View>

            </ScrollView>

            {/* Save Button */}
            <Surface style={styles.modalFooter} elevation={4}>
              <TouchableOpacity 
                onPress={savePreferences}
                disabled={saving}
                style={[styles.saveButton, { backgroundColor: getPrimaryColor() }]}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text variant="titleMedium" style={{ color: 'white', fontWeight: '600' }}>
                    Guardar Cambios
                  </Text>
                )}
              </TouchableOpacity>
            </Surface>
          </View>
        </View>
      </RNModal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={{ flex: 1 }}>
          <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
            Control de Notificaciones
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            Gestionar por usuario
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <Searchbar
          placeholder="Buscar usuario..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ borderRadius: 24, elevation: 0 }}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getPrimaryColor()} />
          <Text variant="bodyMedium" style={{ marginTop: 16, color: theme.colors.secondary }}>
            Cargando usuarios...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id}
          renderItem={renderEmployee}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
                No se encontraron usuarios
              </Text>
            </View>
          }
        />
      )}

      {renderPreferencesModal()}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalFooter: {
    padding: 20,
  },
  saveButton: {
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
