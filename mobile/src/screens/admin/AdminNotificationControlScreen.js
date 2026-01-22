import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, Surface, Avatar, IconButton, Switch, useTheme as usePaperTheme, ActivityIndicator, Searchbar, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, query, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { SobrioCard } from '../../components'; 
import materialTheme from '../../../material-theme.json';

export default function AdminNotificationControlScreen({ navigation }) {
  const theme = usePaperTheme();
  const { getPrimaryColor, isDarkMode, triggerHaptic } = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Surface colors from theme for depth
  const surfaceContainer = isDarkMode ? materialTheme.schemes.dark.surfaceContainer : materialTheme.schemes.light.surfaceContainer;
  const surfaceContainerHigh = isDarkMode ? materialTheme.schemes.dark.surfaceContainerHigh : materialTheme.schemes.light.surfaceContainerHigh;

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
    setLoading(true); // Reuse loading state for modal prep (simple UX choice)
    
    try {
      const preferencesRef = doc(db, 'users', user.id, 'settings', 'notificationPreferences');
      const preferencesSnap = await getDoc(preferencesRef);
      const defaults = getDefaultPreferences(user.role);
      
      if (preferencesSnap.exists()) {
        const data = preferencesSnap.data();
        // Merge defaults to ensure no missing keys crashing the UI
        setUserPreferences({
          ...defaults,
          ...data,
          calendar: { ...defaults.calendar, ...(data.calendar || {}) },
          events: { ...defaults.calendar.events, ...(data.calendar?.events || {}) },
          workEvents: { 
            ...defaults.workEvents, 
            ...(data.workEvents || {}),
            events: { ...defaults.workEvents.events, ...(data.workEvents?.events || {}) }
          },
          attendance: { ...defaults.attendance, ...(data.attendance || {}) },
          alerts: { ...defaults.alerts, ...(data.alerts || {}) }
        });
      } else {
        setUserPreferences(defaults);
      }
      setModalVisible(true);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'No se pudieron cargar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPreferences = (role) => {
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    return {
      calendar: {
        enabled: isAdmin,
        events: {
          parafiscales: isAdmin, coljuegos: isAdmin, uiaf: isAdmin,
          contratos: isAdmin, festivos: false, custom: isAdmin
        },
        daysBeforeArray: [2, 0],
        notificationTime: "08:00"
      },
      workEvents: {
        enabled: isAdmin,
        events: {
          clockIn: isAdmin,
          clockOut: isAdmin,
          breakStart: isAdmin,
          lunchStart: isAdmin,
          incidents: isAdmin
        }
      },
      attendance: {
        enabled: true,
        exitReminder: true, breakReminder: true, lunchReminder: true
      },
      alerts: {
        enabled: true,
        general: true,
        highPriority: true,
        adminOnly: isAdmin
      }
    };
  };

  const handleToggleSection = (section) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      [section]: { ...prev[section], enabled: !prev[section].enabled }
    }));
  };

  const handleCalendarEventToggle = (key) => {
     triggerHaptic('selection');
     setUserPreferences(prev => ({
       ...prev,
       calendar: {
         ...prev.calendar,
         events: { ...prev.calendar.events, [key]: !prev.calendar.events[key] }
       }
     }));
  };

  const handleWorkEventToggle = (key) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      workEvents: {
        ...prev.workEvents,
        events: { ...prev.workEvents.events, [key]: !prev.workEvents.events[key] }
      }
    }));
  };

  const handleAttendanceToggle = (key) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      attendance: { ...prev.attendance, [key]: !prev.attendance[key] }
    }));
  };
  
  const handleAlertsToggle = (key) => {
    triggerHaptic('selection');
    setUserPreferences(prev => ({
      ...prev,
      alerts: { ...prev.alerts, [key]: !prev.alerts[key] }
    }));
  };

  const savePreferences = async () => {
    if (!selectedUser || !userPreferences) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const preferencesRef = doc(db, 'users', selectedUser.id, 'settings', 'notificationPreferences');
      await setDoc(preferencesRef, userPreferences);
      setModalVisible(false);
      setSelectedUser(null);
      setUserPreferences(null);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    return (emp.name || emp.displayName || '').toLowerCase().includes(q) || 
           (emp.email || '').toLowerCase().includes(q);
  });

  const renderEmployee = ({ item }) => {
    const displayName = item.name || item.displayName || 'Usuario';
    const isAdmin = item.role === 'ADMIN' || item.role === 'SUPER_ADMIN';
    
    return (
      <SobrioCard 
        onPress={() => openUserPreferences(item)}
        style={{ marginBottom: 10, borderRadius: 24, padding: 12 }} 
        variant="secondary"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar.Image 
            size={44} 
            source={{ uri: item.photoURL || 'https://via.placeholder.com/150' }}
            style={{ backgroundColor: surfaceContainerHigh }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>{displayName}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.email}</Text>
            {isAdmin && (
              <Surface 
                style={{ 
                  alignSelf: 'flex-start', 
                  backgroundColor: theme.colors.primaryContainer, 
                  paddingHorizontal: 6, paddingVertical: 2, 
                  borderRadius: 8, marginTop: 4 
                }} 
                elevation={0}
              >
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontSize: 10 }}>ADMIN</Text>
              </Surface>
            )}
          </View>
          <IconButton icon="chevron-right" iconColor={theme.colors.onSurfaceVariant} size={20} />
        </View>
      </SobrioCard>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
           <Avatar.Icon size={40} icon="arrow-left" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
        
        <Text 
          variant="headlineLarge" 
          style={{ 
            fontFamily: 'Roboto-Flex', 
            fontWeight: '500', 
            letterSpacing: -0.25,
            color: theme.colors.onBackground
          }}
        >
          Notificaciones
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.secondary, marginTop: 4 }}>
          Gestionar preferencias por usuario
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Searchbar
          placeholder="Buscar empleado..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ 
            backgroundColor: surfaceContainerHigh,
            borderRadius: 24, 
            elevation: 0,
            height: 48
          }}
          inputStyle={{ fontFamily: 'Roboto-Flex', fontSize: 15 }}
          iconColor={theme.colors.primary}
        />
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={item => item.id}
        renderItem={renderEmployee}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.6 }}>
              <Avatar.Icon size={64} icon="account-search-outline" style={{ backgroundColor: 'transparent' }} color={theme.colors.secondary} />
              <Text variant="titleMedium" style={{ marginTop: 16 }}>No se encontraron usuarios</Text>
            </View>
          )
        }
      />

      <RNModal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {selectedUser && userPreferences ? (
            <>
              <Surface style={{ padding: 20, backgroundColor: theme.colors.surface }} elevation={0}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Avatar.Icon size={40} icon="close" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <Button mode="text" onPress={savePreferences} disabled={saving} textColor={getPrimaryColor()}>
                     {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </View>
                <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                   <Avatar.Image size={48} source={{ uri: selectedUser.photoURL }} />
                   <View style={{ flex: 1 }}>
                     <Text variant="titleLarge" style={{ fontFamily: 'Roboto-Flex', fontWeight: '600' }}>
                       {selectedUser.name || selectedUser.displayName} 
                     </Text>
                     <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>Configuración individual</Text>
                   </View>
                </View>
              </Surface>
              
              <Divider />

              <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
                  <Surface style={styles.settingCard} elevation={0}>
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Avatar.Icon size={40} icon="calendar-month" style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
                        <Text variant="titleMedium" style={{ fontFamily: 'Roboto-Flex', fontWeight: '600' }}>Calendario</Text>
                      </View>
                      <Switch value={userPreferences.calendar.enabled} onValueChange={() => handleToggleSection('calendar')} color={getPrimaryColor()} />
                    </View>
                    
                    {userPreferences.calendar.enabled && (
                      <View style={{ marginTop: 12, gap: 10 }}>
                         <Divider />
                         {Object.entries({
                           parafiscales: 'Impuestos parafiscales',
                           coljuegos: 'Reportes Coljuegos',
                           uiaf: 'Reportes UIAF',
                           contratos: 'Vencmiento contratos',
                           festivos: 'Días festivos',
                           custom: 'Personalizados'
                         }).map(([key, label]) => (
                           <View key={key} style={styles.row}>
                             <Text variant="bodyLarge">{label}</Text>
                             <Switch 
                               value={userPreferences.calendar.events[key]} 
                               onValueChange={() => handleCalendarEventToggle(key)} 
                               color={getPrimaryColor()}
                             />
                           </View>
                         ))}
                      </View>
                    )}
                  </Surface>

                <Surface style={styles.settingCard} elevation={0}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                       <Avatar.Icon size={40} icon="account-clock" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />
                       <Text variant="titleMedium" style={{ fontFamily: 'Roboto-Flex', fontWeight: '600' }}>Eventos de Jornada</Text>
                    </View>
                    <Switch value={userPreferences.workEvents.enabled} onValueChange={() => handleToggleSection('workEvents')} color={getPrimaryColor()} />
                  </View>
                  {userPreferences.workEvents.enabled && (
                     <View style={{ marginTop: 12, gap: 8 }}>
                        <Divider />
                        <View style={styles.row}><Text variant="bodyLarge">Inicio de Jornada</Text><Switch value={userPreferences.workEvents.events.clockIn} onValueChange={() => handleWorkEventToggle('clockIn')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Finalización de Jornada</Text><Switch value={userPreferences.workEvents.events.clockOut} onValueChange={() => handleWorkEventToggle('clockOut')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Inicio de Break</Text><Switch value={userPreferences.workEvents.events.breakStart} onValueChange={() => handleWorkEventToggle('breakStart')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Inicio de Almuerzo</Text><Switch value={userPreferences.workEvents.events.lunchStart} onValueChange={() => handleWorkEventToggle('lunchStart')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Novedades Generadas</Text><Switch value={userPreferences.workEvents.events.incidents} onValueChange={() => handleWorkEventToggle('incidents')} color={getPrimaryColor()} /></View>
                     </View>
                  )}
                </Surface>

                <Surface style={styles.settingCard} elevation={0}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                       <Avatar.Icon size={40} icon="clock-check-outline" style={{ backgroundColor: theme.colors.tertiaryContainer }} color={theme.colors.onTertiaryContainer} />
                       <Text variant="titleMedium" style={{ fontFamily: 'Roboto-Flex', fontWeight: '600' }}>Asistencia</Text>
                    </View>
                    <Switch value={userPreferences.attendance.enabled} onValueChange={() => handleToggleSection('attendance')} color={getPrimaryColor()} />
                  </View>
                  {userPreferences.attendance.enabled && (
                     <View style={{ marginTop: 12, gap: 8 }}>
                        <Divider />
                        <View style={styles.row}><Text variant="bodyLarge">Recordar Salida (6 PM)</Text><Switch value={userPreferences.attendance.exitReminder} onValueChange={() => handleAttendanceToggle('exitReminder')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Recordar Break (4h)</Text><Switch value={userPreferences.attendance.breakReminder} onValueChange={() => handleAttendanceToggle('breakReminder')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Recordar Almuerzo (12 PM)</Text><Switch value={userPreferences.attendance.lunchReminder} onValueChange={() => handleAttendanceToggle('lunchReminder')} color={getPrimaryColor()} /></View>
                     </View>
                  )}
                </Surface>

                 <Surface style={styles.settingCard} elevation={0}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                       <Avatar.Icon size={40} icon="bell-ring-outline" style={{ backgroundColor: theme.colors.errorContainer }} color={theme.colors.onErrorContainer} />
                       <Text variant="titleMedium" style={{ fontFamily: 'Roboto-Flex', fontWeight: '600' }}>Alertas</Text>
                    </View>
                    <Switch value={userPreferences.alerts.enabled} onValueChange={() => handleToggleSection('alerts')} color={getPrimaryColor()} />
                  </View>
                  {userPreferences.alerts.enabled && (
                     <View style={{ marginTop: 12, gap: 8 }}>
                        <Divider />
                        <View style={styles.row}><Text variant="bodyLarge">Alertas Generales</Text><Switch value={userPreferences.alerts.general} onValueChange={() => handleAlertsToggle('general')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Alertas Prioritarias</Text><Switch value={userPreferences.alerts.highPriority} onValueChange={() => handleAlertsToggle('highPriority')} color={getPrimaryColor()} /></View>
                        <View style={styles.row}><Text variant="bodyLarge">Alertas Solo Admin</Text><Switch value={userPreferences.alerts.adminOnly} onValueChange={() => handleAlertsToggle('adminOnly')} color={getPrimaryColor()} /></View>
                     </View>
                  )}
                </Surface>

                <View style={{ height: 24 }} />
              </ScrollView>
            </>
          ) : (
             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
               <ActivityIndicator size="large" />
             </View>
          )}
        </View>
      </RNModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  settingCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(125, 125, 125, 0.08)', // Reduced opacity for cleaner look
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  }
});
