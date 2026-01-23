import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Linking } from 'react-native';
import { Text, Surface, Avatar, IconButton, useTheme as usePaperTheme, ActivityIndicator, Menu, Divider, Badge, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAppDistribution } from '../../hooks/useAppDistribution';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import { collection, query, where, onSnapshot, getDocs, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SobrioCard, DetailRow, OverlineText } from '../../components';

export default function AdminDashboardScreen({ navigation }) {
  const theme = usePaperTheme();
  const { getPrimaryColor, isDarkMode, toggleDarkMode, triggerHaptic } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { updateAvailable, showUpdateDialog } = useAppDistribution();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [filter, setFilter] = useState('working'); // Default to 'working'
  const [allEmployees, setAllEmployees] = useState([]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const filteredEmployees = useMemo(() => {
    if (filter === 'all') return allEmployees; // Show everyone (including finished)
    if (filter === 'working') return allEmployees.filter(e => e.status === 'trabajando');
    if (filter === 'break') return allEmployees.filter(e => e.status === 'break');
    if (filter === 'lunch') return allEmployees.filter(e => e.status === 'almuerzo');
    if (filter === 'finished') return allEmployees.filter(e => e.status === 'finalizado');
    if (filter === 'absent') return allEmployees.filter(e => e.status === 'ausente');
    return allEmployees;
  }, [allEmployees, filter]);

  const handleCall = useCallback((phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleWhatsApp = useCallback((phone) => {
    if (!phone) return;
    // Remove '+' and spaces for WA link
    const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  }, []);
  
  // Stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    active: 0,
    break: 0,
    lunch: 0,
    finished: 0,
    absent: 0
  });
  const [activeEmployees, setActiveEmployees] = useState([]);
  const unsubscribeRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return; // ✅ Protección adicional
    
    setLoading(true);
    try {
      // 1. Get Total Employees
      const usersQuery = query(collection(db, 'users'), where('role', '!=', 'ADMIN')); 
      const usersSnapshot = await getDocs(usersQuery);
      const employeesList = [];
      usersSnapshot.docs.forEach(doc => {
        employeesList.push({ id: doc.id, ...doc.data() });
      });

      // 2. Get Today's Attendance
      const today = format(new Date(), 'yyyy-MM-dd');
      const attendanceQuery = query(
        collection(db, 'asistencias'), 
        where('fecha', '==', today),
        limit(100) // ✅ Máximo 100 asistencias del día
      );
      
      const unsubscribe = onSnapshot(
        attendanceQuery, 
        (snapshot) => {
        const attendanceMap = {};
        snapshot.docs.forEach(doc => {
            attendanceMap[doc.data().uid] = { ...doc.data(), id: doc.id };
        });

        let active = 0;
        let onBreak = 0;
        let onLunch = 0;
        let finished = 0;
        let absent = 0;

        const processedList = employeesList.map(user => {
            const attendance = attendanceMap[user.id];
            let status = 'ausente';
            let statusData = null;

            if (attendance) {
                status = attendance.estadoActual;
                statusData = attendance;
                
                if (status === 'trabajando') active++;
                else if (status === 'break') onBreak++;
                else if (status === 'almuerzo') onLunch++;
                else if (status === 'finalizado') finished++;
            } else {
                absent++;
            }

            return {
                id: user.id,
                userData: user,
                status,
                attendance: statusData
            };
        });

        // Sort: Active -> Break -> Absent -> Finished
        processedList.sort((a, b) => {
            const priority = { 'trabajando': 1, 'break': 2, 'almuerzo': 2, 'ausente': 3, 'finalizado': 4 };
            return (priority[a.status] || 99) - (priority[b.status] || 99);
        });

        // Sort in-place para evitar crear nueva referencia
        processedList.sort((a, b) => {
          const order = { trabajando: 1, break: 2, almuerzo: 3, finalizado: 4, ausente: 5 };
          return (order[a.status] || 99) - (order[b.status] || 99);
        });

        setStats({
          totalEmployees: employeesList.length,
          active,
          break: onBreak,
          lunch: onLunch,
          finished,
          absent
        });
        
        setAllEmployees(processedList);
        setLoading(false);
      },
      (error) => {
        console.log("⚠️ Error en listener de asistencias (esperado al cerrar sesión):", error.code);
        setLoading(false);
      }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      setLoading(false);
    }
  }, [user]);

  // ✅ useFocusEffect para limpiar listener cuando pierde foco (optimización para dispositivos lentos)
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        fetchData();
      }

      // Cleanup: detener listener cuando pierde el foco
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }, [user, fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const KPICard = memo(({ icon, label, value, color, bgColor, filterType }) => {
    const isSelected = filter === filterType;
    return (
      <TouchableOpacity 
        style={{ flex: 1 }} 
        onPress={() => setFilter(isSelected ? 'working' : filterType)} // Toggle back to 'working' instead of 'all'
        activeOpacity={0.7}
      >
        <Surface 
          style={[
            styles.kpiCard, 
            { 
              backgroundColor: bgColor,
              borderWidth: isSelected ? 2 : 0,
              borderColor: color,
              opacity: (isSelected) ? 1 : 0.5 // Dim non-selected cards
            }
          ]} 
          elevation={0}
        >
          <Avatar.Icon size={40} icon={icon} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} color={color} />
          <View>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: color }}>{value}</Text>
            <Text variant="labelMedium" style={{ color: color, opacity: 0.8 }}>{label}</Text>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Admin */}
      <View style={[styles.header, { paddingHorizontal: 24, paddingTop: 24, marginBottom: 0 }]}>
        <View>
          <Text 
            variant="headlineLarge"
            style={{ 
              color: theme.colors.primary,
              fontFamily: 'Roboto-Flex',
              fontWeight: '500',
              letterSpacing: -0.5,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}
          >
            Hola, {userProfile?.displayName?.split(' ')[0] || 'Admin'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 16 }}>
          <View>
            <IconButton 
              icon="bell-outline" 
              mode="contained-tonal"
              size={24}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Notifications');
              }} 
            />
            {unreadCount > 0 && (
              <Badge
                visible={unreadCount > 0}
                size={16}
                style={{ position: 'absolute', top: 4, right: 4 }}
              >
                {unreadCount}
              </Badge>
            )}
          </View>
          <IconButton 
            icon={isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"} 
            mode="contained-tonal"
            size={24}
            onPress={() => {
              triggerHaptic('selection');
              toggleDarkMode();
            }} 
          />
          <IconButton 
            icon="cog-outline" 
            mode="contained-tonal"
            size={24}
            onPress={() => {
              triggerHaptic('selection');
              navigation.navigate('Settings');
            }} 
          />
          <IconButton 
            icon="logout" 
            mode="outlined"
            iconColor={theme.colors.error}
            size={24}
            style={{ borderColor: theme.colors.error }}
            onPress={() => {
              triggerHaptic('warning');
              Alert.alert(
                "Cerrar Sesión",
                "¿Estás seguro que deseas salir?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Salir", style: "destructive", onPress: () => signOut() }
                ]
              );
            }} 
          />
        </View>
      </ScrollView>

      {/* Update Banner */}
      {updateAvailable && (
        <Surface 
          style={[styles.updateBanner, { 
            backgroundColor: updateAvailable.isCritical ? theme.colors.errorContainer : theme.colors.tertiaryContainer,
            marginHorizontal: 24,
            marginBottom: 16
          }]} 
          elevation={2}
        >
          <View style={styles.updateContent}>
            <Avatar.Icon 
              size={40} 
              icon={updateAvailable.isCritical ? "alert-circle" : "cloud-download"} 
              style={{ 
                backgroundColor: updateAvailable.isCritical ? theme.colors.error : theme.colors.tertiary 
              }} 
              color="#FFFFFF"
            />
            <View style={styles.updateText}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                {updateAvailable.isCritical ? '⚠️ Actualización Crítica' : '🎉 Nueva Versión'} {updateAvailable.version}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2}>
                {updateAvailable.releaseNotes}
              </Text>
            </View>
          </View>
          <Button 
            mode="contained" 
            onPress={showUpdateDialog}
            style={{ marginTop: 8 }}
            buttonColor={updateAvailable.isCritical ? theme.colors.error : theme.colors.tertiary}
          >
            {updateAvailable.isCritical ? 'Actualizar Ahora' : 'Descargar'}
          </Button>
        </Surface>
      )}

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI Section - Grid 2 Rows (2 top, 3 bottom) */}
        <View style={styles.kpiContainer}>
          {/* Row 1: Critical States */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <KPICard 
              icon="account-check" 
              label="Trabajando" 
              value={stats.active} 
              color={theme.colors.onPrimaryContainer}
              bgColor={theme.colors.primaryContainer}
              filterType="working"
            />
            <KPICard 
              icon="account-alert" 
              label="Ausentes" 
              value={stats.absent} 
              color={theme.colors.onErrorContainer}
              bgColor={theme.colors.errorContainer}
              filterType="absent"
            />
          </View>
          
          {/* Row 2: Secondary States */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <KPICard 
              icon="coffee" 
              label="Break" 
              value={stats.break} 
              color={theme.colors.onTertiaryContainer}
              bgColor={theme.colors.tertiaryContainer}
              filterType="break"
            />
            <KPICard 
              icon="food" 
              label="Almuerzo" 
              value={stats.lunch} 
              color={theme.colors.onSecondaryContainer}
              bgColor={theme.colors.secondaryContainer}
              filterType="lunch"
            />
            <KPICard 
              icon="check-circle-outline" 
              label="Fin" 
              value={stats.finished} 
              color={theme.colors.onSurfaceVariant}
              bgColor={theme.colors.surfaceVariant}
              filterType="finished"
            />
          </View>
        </View>

        {/* Active Employees List */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <OverlineText color={getPrimaryColor()}>
            {filter === 'all' ? 'TODOS LOS EMPLEADOS' : 
             filter === 'working' ? 'PERSONAL TRABAJANDO' :
             filter === 'break' ? 'PERSONAL EN BREAK' : 
             filter === 'lunch' ? 'PERSONAL EN ALMUERZO' : 
             filter === 'finished' ? 'JORNADA FINALIZADA' : 'PERSONAL AUSENTE'}
          </OverlineText>
          {filter !== 'working' && (
            <TouchableOpacity onPress={() => setFilter('working')}>
              <Text variant="labelSmall" style={{ color: theme.colors.primary }}>Ver activos</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <SobrioCard key={employee.id} style={{ marginBottom: 12, padding: 16 }} variant="secondary">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar.Text 
                  size={40} 
                  label={employee.userData.displayName?.substring(0, 2).toUpperCase() || 'NN'} 
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                  color={theme.colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {employee.userData.displayName || 'Usuario'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: 
                        employee.status === 'trabajando' ? theme.colors.primary : 
                        employee.status === 'break' ? theme.colors.tertiary : 
                        employee.status === 'almuerzo' ? theme.colors.secondary :
                        employee.status === 'finalizado' ? theme.colors.outline :
                        employee.status === 'ausente' ? theme.colors.error : theme.colors.outline
                    }} />
                    <Text variant="bodySmall" style={{ color: theme.colors.secondary, textTransform: 'capitalize' }}>
                      {employee.status} 
                      {(() => {
                        const attendance = employee.attendance;
                        if (!attendance) return ' • Sin registro';
                        
                        let timeLabel = '';
                        
                        if (employee.status === 'break') {
                          // Mostrar hora del último break
                          const lastBreak = attendance.breaks?.[attendance.breaks.length - 1];
                          if (lastBreak?.inicio) {
                            const breakTime = lastBreak.inicio.toDate ? lastBreak.inicio.toDate() : new Date(lastBreak.inicio);
                            timeLabel = ` • Desde ${breakTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          }
                        } else if (employee.status === 'almuerzo') {
                          // Mostrar hora de inicio del almuerzo
                          if (attendance.almuerzo?.inicio) {
                            const lunchTime = attendance.almuerzo.inicio.toDate ? attendance.almuerzo.inicio.toDate() : new Date(attendance.almuerzo.inicio);
                            timeLabel = ` • Desde ${lunchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          }
                        } else if (employee.status === 'finalizado') {
                          // Mostrar hora de salida
                          if (attendance.salida?.hora) {
                            const exitTime = attendance.salida.hora.toDate ? attendance.salida.hora.toDate() : new Date(attendance.salida.hora);
                            timeLabel = ` • Finalizó ${exitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          }
                        } else if (employee.status === 'trabajando') {
                          // Mostrar hora de entrada
                          if (attendance.entrada?.hora) {
                            const entryTime = attendance.entrada.hora.toDate ? attendance.entrada.hora.toDate() : new Date(attendance.entrada.hora);
                            timeLabel = ` • Desde ${entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          }
                        }
                        
                        return timeLabel || ' • Sin registro';
                      })()}
                    </Text>
                  </View>
                </View>
                
                {/* Contact Actions */}
                <View style={{ flexDirection: 'row' }}>
                  {employee.userData.phone && (
                    <>
                      <IconButton 
                        icon="whatsapp" 
                        size={20} 
                        iconColor="#25D366" 
                        onPress={() => handleWhatsApp(employee.userData.phone)}
                      />
                      <IconButton 
                        icon="phone" 
                        size={20} 
                        iconColor={theme.colors.primary} 
                        onPress={() => handleCall(employee.userData.phone)}
                      />
                    </>
                  )}
                </View>
              </View>
            </SobrioCard>
          ))
        ) : (
          <Surface style={{ padding: 24, borderRadius: 16, alignItems: 'center', backgroundColor: theme.colors.surfaceVariant }} elevation={0}>
            <Avatar.Icon size={48} icon="account-search" style={{ backgroundColor: 'transparent' }} color={theme.colors.secondary} />
            <Text variant="bodyLarge" style={{ color: theme.colors.secondary, marginTop: 8 }}>
              No hay empleados en esta categoría
            </Text>
          </Surface>
        )}

        {/* Quick Actions */}
        <View style={{ marginTop: 24 }}>
          <OverlineText color={getPrimaryColor()}>ACCIONES RÁPIDAS</OverlineText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Surface style={[styles.quickAction, { backgroundColor: theme.colors.surfaceContainerHigh }]} elevation={0}>
              <IconButton icon="bell-ring-outline" size={32} iconColor={theme.colors.primary} onPress={() => navigation.navigate('AdminCreateAlert')} />
              <Text variant="labelMedium" style={{ textAlign: 'center' }}>Alertas</Text>
            </Surface>
            <Surface style={[styles.quickAction, { backgroundColor: theme.colors.surfaceContainerHigh }]} elevation={0}>
              <IconButton icon="bell-cog" size={32} iconColor={theme.colors.primary} onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('AdminNotificationControl');
              }} />
              <Text variant="labelMedium" style={{ textAlign: 'center' }}>Notificaciones</Text>
            </Surface>
            <Surface style={[styles.quickAction, { backgroundColor: theme.colors.surfaceContainerHigh }]} elevation={0}>
              <IconButton icon="cog-outline" size={32} iconColor={theme.colors.primary} onPress={() => navigation.navigate('AdminSettings')} />
              <Text variant="labelMedium" style={{ textAlign: 'center' }}>Config. Laboral</Text>
            </Surface>
          </View>
          {can(APP_PERMISSIONS.USUARIOS_GESTIONAR) && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <Surface style={[styles.quickAction, { backgroundColor: theme.colors.surfaceContainerHigh }]} elevation={0}>
                <IconButton icon="shield-account" size={32} iconColor={theme.colors.primary} onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('Users');
                }} />
                <Text variant="labelMedium" style={{ textAlign: 'center' }}>Permisos</Text>
              </Surface>
            </View>
          )}
        </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  kpiContainer: {
    marginBottom: 32,
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: 'flex-start', // Align left for cleaner grid look
    justifyContent: 'center',
    gap: 4,
    minHeight: 110, // Ensure consistent height
  },
  quickAction: {
    flex: 1,
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
    // backgroundColor: '#f1f5f9', // Removed hardcoded color
  },
  updateBanner: {
    padding: 16,
    borderRadius: 24,
    elevation: 2,
  },
  updateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateText: {
    flex: 1,
  }
});
