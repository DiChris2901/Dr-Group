import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Linking, Modal, FlatList, Pressable } from 'react-native';
import { Text, Surface, Avatar, IconButton, useTheme as usePaperTheme, ActivityIndicator, Menu, Divider, Badge, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import materialTheme from '../../../material-theme.json';

export default function AdminDashboardScreen({ navigation }) {
  const theme = usePaperTheme();
  const { getPrimaryColor, isDarkMode, toggleDarkMode, triggerHaptic } = useTheme();
  
  const surfaceColors = useMemo(() => {
    const scheme = isDarkMode ? materialTheme.schemes.dark : materialTheme.schemes.light;
    return {
      background: scheme.background,
      surface: scheme.surface,
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      surfaceContainerHighest: scheme.surfaceContainerHighest,
      onSurface: scheme.onSurface,
      onSurfaceVariant: scheme.onSurfaceVariant,
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      secondary: scheme.secondary,
      onSecondary: scheme.onSecondary,
      secondaryContainer: scheme.secondaryContainer,
      onSecondaryContainer: scheme.onSecondaryContainer,
      tertiary: scheme.tertiary,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      error: scheme.error,
      errorContainer: scheme.errorContainer,
      outline: scheme.outline,
      outlineVariant: scheme.outlineVariant,
      surfaceVariant: scheme.surfaceVariant,
    };
  }, [isDarkMode]);

  const { user, userProfile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { updateAvailable, bannerVisible, showUpdateDialog, dismissUpdate } = useAppDistribution();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalFilter, setModalFilter] = useState(null); // null = cerrado, 'working'|'break'|etc = abierto
  const [modalColor, setModalColor] = useState(null); // Color del KPI que abrió el modal
  const [modalBgColor, setModalBgColor] = useState(null); // BgColor del KPI
  const [expandedEmployee, setExpandedEmployee] = useState(null); // ID del empleado expandido en modal
  const [allEmployees, setAllEmployees] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // ✅ Controlar primera carga

  const modalEmployees = useMemo(() => {
    if (!modalFilter) return [];
    if (modalFilter === 'all') return allEmployees;
    if (modalFilter === 'working') return allEmployees.filter(e => e.status === 'trabajando');
    if (modalFilter === 'break') return allEmployees.filter(e => e.status === 'break');
    if (modalFilter === 'lunch') return allEmployees.filter(e => e.status === 'almuerzo');
    if (modalFilter === 'finished') return allEmployees.filter(e => e.status === 'finalizado');
    if (modalFilter === 'absent') return allEmployees.filter(e => e.status === 'ausente');
    return allEmployees;
  }, [allEmployees, modalFilter]);

  const modalTitle = useMemo(() => {
    const titles = {
      all: 'Todos los Empleados',
      working: 'Personal Trabajando',
      break: 'Personal en Break',
      lunch: 'Personal en Almuerzo',
      finished: 'Jornada Finalizada',
      absent: 'Personal Ausente',
    };
    return titles[modalFilter] || '';
  }, [modalFilter]);

  const modalIcon = useMemo(() => {
    const icons = {
      all: 'account-group',
      working: 'briefcase-clock',
      break: 'coffee',
      lunch: 'food',
      finished: 'check-circle-outline',
      absent: 'account-off',
    };
    return icons[modalFilter] || 'account-group';
  }, [modalFilter]);

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
  const unsubscribeRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return; // ✅ Protección adicional
    
    // ✅ Solo mostrar loading en la primera carga, no al cambiar de pantallas
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      // 1. Get Total Employees (excluir ADMIN y SUPERADMIN)
      const usersQuery = query(
        collection(db, 'users'), 
        where('appRole', 'in', ['USER', 'EMPLOYEE'])
      ); 
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

        // Sort: Trabajando -> Break -> Almuerzo -> Finalizado -> Ausente
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
        setIsInitialLoad(false); // ✅ Marcar que ya cargó la primera vez
      },
      (error) => {
        console.log("⚠️ Error en listener de asistencias (esperado al cerrar sesión):", error.code);
        setLoading(false);
        setIsInitialLoad(false); // ✅ Marcar que ya cargó aunque haya error
      }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      setLoading(false);
      setIsInitialLoad(false); // ✅ Marcar que ya cargó aunque haya error
    }
  }, [user, isInitialLoad]); // ✅ Agregar isInitialLoad a dependencias

  // ✅ useEffect para listener permanente - NO se detiene al cambiar de tab
  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }

    // Cleanup: solo al desmontar componente (logout)
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const KPICard = memo(({ icon, label, value, color, bgColor, filterType }) => {
    return (
      <TouchableOpacity 
        style={{ flex: 1 }} 
        onPress={() => {
          triggerHaptic('selection');
          setModalFilter(filterType);
          setModalColor(color);
          setModalBgColor(bgColor);
          setExpandedEmployee(null);
        }}
        activeOpacity={0.7}
      >
        <Surface 
          style={[
            styles.kpiCard, 
            { 
              backgroundColor: bgColor,
            }
          ]} 
          elevation={0}
        >
          <Avatar.Icon size={36} icon={icon} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} color={color} />
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: surfaceColors.background }}>
        <ActivityIndicator size="large" color={surfaceColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
      {/* Header Admin - Material You Expressive (Display Medium) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, marginBottom: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text 
              style={{ 
                fontFamily: 'Roboto-Flex', 
                fontSize: 45, 
                lineHeight: 52, 
                fontWeight: '400', 
                color: surfaceColors.primary,
                letterSpacing: -0.25,
                fontVariationSettings: [{ axis: 'wdth', value: 110 }] 
              }}
            >
              Hola, {(userProfile?.name || userProfile?.displayName || 'Admin').split(' ')[0]}
            </Text>
            <Text 
              variant="bodyLarge" 
              style={{ 
                color: surfaceColors.onSurfaceVariant,
                marginTop: 4 
              }}
            >
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          {userProfile?.photoURL ? (
            <Avatar.Image 
              size={56} 
              source={{ uri: userProfile.photoURL }} 
              style={{ backgroundColor: surfaceColors.surfaceContainerHighest }}
            />
          ) : (
            <Avatar.Text 
              size={56} 
              label={(userProfile?.displayName || userProfile?.name || 'A').substring(0, 2).toUpperCase()} 
              style={{ backgroundColor: surfaceColors.primaryContainer }}
              color={surfaceColors.onPrimaryContainer}
            />
          )}
        </View>
      </View>

      {/* Action Buttons Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 8 }}>
          <View>
            <IconButton 
              icon="bell-outline" 
              mode="contained-tonal"
              size={24}
              containerColor={surfaceColors.secondaryContainer}
              iconColor={surfaceColors.onSecondaryContainer}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Notifications');
              }} 
            />
            {unreadCount > 0 && (
              <Badge
                visible={unreadCount > 0}
                size={16}
                style={{ position: 'absolute', top: 4, right: 4, backgroundColor: surfaceColors.error }}
              >
                {unreadCount}
              </Badge>
            )}
          </View>
          <IconButton 
            icon={isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"} 
            mode="contained-tonal"
            size={24}
            containerColor={surfaceColors.secondaryContainer}
            iconColor={surfaceColors.onSecondaryContainer}
            onPress={() => {
              triggerHaptic('selection');
              toggleDarkMode();
            }} 
          />
          <IconButton 
            icon="cog-outline" 
            mode="contained-tonal"
            size={24}
            containerColor={surfaceColors.secondaryContainer}
            iconColor={surfaceColors.onSecondaryContainer}
            onPress={() => {
              triggerHaptic('selection');
              navigation.navigate('Settings');
            }} 
          />
          <IconButton 
            icon="logout" 
            mode="outlined"
            iconColor={surfaceColors.error}
            size={24}
            style={{ borderColor: surfaceColors.error }}
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
      {bannerVisible && updateAvailable && (
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
            {updateAvailable.canDismiss && (
              <IconButton
                icon="close"
                size={18}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={dismissUpdate}
                style={{ margin: 0 }}
              />
            )}
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
        {/* KPI Section - 2 top + 4 bottom grid */}
        <View style={styles.kpiContainer}>
          {/* Row 1: Estados accionables (grandes) */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <KPICard 
              icon="briefcase-clock" 
              value={stats.active} 
              label="Activos" 
              color={surfaceColors.primary} 
              bgColor={surfaceColors.primaryContainer}
              filterType="working"
            />
            <KPICard 
              icon="account-off" 
              value={stats.absent} 
              label="Ausentes" 
              color={surfaceColors.error} 
              bgColor={surfaceColors.errorContainer}
              filterType="absent"
            />
          </View>
          
          {/* Row 2: Contexto y estados transitorios (compactas) */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <KPICard 
              icon="account-group" 
              value={stats.totalEmployees} 
              label="Total" 
              color={surfaceColors.onSurface} 
              bgColor={surfaceColors.surfaceContainerHigh}
              filterType="all"
            />
            <KPICard 
              icon="coffee" 
              value={stats.break} 
              label="Break" 
              color={surfaceColors.tertiary} 
              bgColor={surfaceColors.tertiaryContainer}
              filterType="break"
            />
            <KPICard 
              icon="food" 
              value={stats.lunch} 
              label="Almuerzo" 
              color={surfaceColors.secondary} 
              bgColor={surfaceColors.secondaryContainer}
              filterType="lunch"
            />
            <KPICard 
              icon="check-circle-outline" 
              value={stats.finished} 
              label="Finalizado"
              color={surfaceColors.onSurfaceVariant}
              bgColor={surfaceColors.surfaceVariant}
              filterType="finished"
            />
          </View>
        </View>

        {/* ═══════════════ GESTIÓN ═══════════════ */}
        <View style={{ marginTop: 8 }}>
          <OverlineText color={surfaceColors.primary}>GESTIÓN</OverlineText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {can(APP_PERMISSIONS.ADMIN_CREATE_ALERT) && (
              <Surface style={[styles.quickAction, { backgroundColor: surfaceColors.surfaceContainerHigh }]} elevation={0}>
                <IconButton icon="bell-ring-outline" size={24} iconColor={surfaceColors.primary} onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('AdminCreateAlert');
                }} />
                <Text variant="labelMedium" style={{ textAlign: 'center', color: surfaceColors.onSurface }}>Alertas</Text>
              </Surface>
            )}
            {can(APP_PERMISSIONS.ADMIN_NOTIFICATION_CONTROL) && (
              <Surface style={[styles.quickAction, { backgroundColor: surfaceColors.surfaceContainerHigh }]} elevation={0}>
                <IconButton icon="bell-cog" size={24} iconColor={surfaceColors.tertiary} onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('AdminNotificationControl');
                }} />
                <Text variant="labelMedium" style={{ textAlign: 'center', color: surfaceColors.onSurface }}>Notificaciones</Text>
              </Surface>
            )}
            {can(APP_PERMISSIONS.ADMIN_SETTINGS) && (
              <Surface style={[styles.quickAction, { backgroundColor: surfaceColors.surfaceContainerHigh }]} elevation={0}>
                <IconButton icon="cog-outline" size={24} iconColor={surfaceColors.secondary} onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('AdminSettings');
                }} />
                <Text variant="labelMedium" style={{ textAlign: 'center', color: surfaceColors.onSurface }}>Config. Laboral</Text>
              </Surface>
            )}
            {can(APP_PERMISSIONS.USUARIOS_GESTIONAR) && (
              <Surface style={[styles.quickAction, { backgroundColor: surfaceColors.surfaceContainerHigh }]} elevation={0}>
                <IconButton icon="shield-account" size={24} iconColor={surfaceColors.primary} onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('Users');
                }} />
                <Text variant="labelMedium" style={{ textAlign: 'center', color: surfaceColors.onSurface }}>Permisos</Text>
              </Surface>
            )}
            {can(APP_PERMISSIONS.EMPRESAS_VER) && (
              <Surface style={[styles.quickAction, { backgroundColor: surfaceColors.surfaceContainerHigh }]} elevation={0}>
                <IconButton icon="domain" size={24} iconColor={surfaceColors.primary} onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('Empresas');
                }} />
                <Text variant="labelMedium" style={{ textAlign: 'center', color: surfaceColors.onSurface }}>Empresas</Text>
              </Surface>
            )}
            {can(APP_PERMISSIONS.EMPLEADOS_VER) && (
              <Surface style={[styles.quickAction, { backgroundColor: surfaceColors.surfaceContainerHigh }]} elevation={0}>
                <IconButton icon="account-group" size={24} iconColor={surfaceColors.secondary} onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('Empleados');
                }} />
                <Text variant="labelMedium" style={{ textAlign: 'center', color: surfaceColors.onSurface }}>Empleados</Text>
              </Surface>
            )}
          </View>
        </View>

      </ScrollView>

      {/* ═══════════════ MODAL: Lista de empleados por estado ═══════════════ */}
      <Modal
        visible={modalFilter !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFilter(null)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} 
          onPress={() => setModalFilter(null)}
        >
          <Pressable 
            style={[
              styles.modalContainer, 
              { backgroundColor: surfaceColors.surfaceContainerLow }
            ]}
            onPress={() => {}} // Prevent close when tapping modal content
          >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: surfaceColors.outlineVariant }} />
            </View>

            {/* Header - Color dinámico según KPI */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 12 }}>
              <Avatar.Icon 
                size={44} 
                icon={modalIcon} 
                style={{ backgroundColor: modalBgColor || surfaceColors.primaryContainer }} 
                color={modalColor || surfaceColors.onPrimaryContainer} 
              />
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={{ fontWeight: '700', color: modalColor || surfaceColors.onSurface }}>
                  {modalTitle}
                </Text>
                <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                  {modalEmployees.length} empleado{modalEmployees.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <IconButton 
                icon="close" 
                size={24} 
                iconColor={surfaceColors.onSurfaceVariant}
                onPress={() => setModalFilter(null)} 
              />
            </View>

            <Divider style={{ backgroundColor: surfaceColors.outlineVariant }} />

            {/* Employee list */}
            <FlatList
              data={modalEmployees}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Avatar.Icon 
                    size={56} 
                    icon="account-search" 
                    style={{ backgroundColor: surfaceColors.surfaceContainerHigh }} 
                    color={surfaceColors.onSurfaceVariant} 
                  />
                  <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 12 }}>
                    No hay empleados en esta categoría
                  </Text>
                </View>
              }
              renderItem={({ item: employee }) => (
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setExpandedEmployee(expandedEmployee === employee.id ? null : employee.id);
                  }}
                >
                <Surface 
                  style={{ 
                    marginBottom: 10, 
                    padding: 16, 
                    borderRadius: 20, 
                    backgroundColor: surfaceColors.surfaceContainer 
                  }} 
                  elevation={0}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {employee.userData.photoURL ? (
                      <Avatar.Image 
                        size={44} 
                        source={{ uri: employee.userData.photoURL }} 
                        style={{ backgroundColor: surfaceColors.surfaceContainerHighest }}
                      />
                    ) : (
                      <Avatar.Text 
                        size={44} 
                        label={(employee.userData.name || employee.userData.displayName || 'NN').substring(0, 2).toUpperCase()} 
                        style={{ backgroundColor: surfaceColors.primaryContainer }}
                        color={surfaceColors.onPrimaryContainer}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={{ fontWeight: '600', color: surfaceColors.onSurface }}>
                        {employee.userData.name || employee.userData.displayName || 'Usuario'}
                      </Text>
                      {/* Cargo / Departamento */}
                      {(employee.userData.position || employee.userData.department) && (
                        <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, opacity: 0.7, marginTop: 1 }}>
                          {[employee.userData.position, employee.userData.department].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <View style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: 4, 
                          backgroundColor: 
                            employee.status === 'trabajando' ? surfaceColors.primary : 
                            employee.status === 'break' ? surfaceColors.tertiary : 
                            employee.status === 'almuerzo' ? surfaceColors.secondary :
                            employee.status === 'finalizado' ? surfaceColors.outline :
                            surfaceColors.error
                        }} />
                        <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'capitalize' }}>
                          {employee.status}
                          {(() => {
                            const attendance = employee.attendance;
                            if (!attendance) return ' • Sin registro';
                            
                            if (employee.status === 'break') {
                              const lastBreak = attendance.breaks?.[attendance.breaks.length - 1];
                              if (lastBreak?.inicio) {
                                const t = lastBreak.inicio.toDate ? lastBreak.inicio.toDate() : new Date(lastBreak.inicio);
                                return ` • Desde ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                              }
                            } else if (employee.status === 'almuerzo') {
                              if (attendance.almuerzo?.inicio) {
                                const t = attendance.almuerzo.inicio.toDate ? attendance.almuerzo.inicio.toDate() : new Date(attendance.almuerzo.inicio);
                                return ` • Desde ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                              }
                            } else if (employee.status === 'finalizado') {
                              if (attendance.salida?.hora) {
                                const t = attendance.salida.hora.toDate ? attendance.salida.hora.toDate() : new Date(attendance.salida.hora);
                                return ` • Finalizó ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                              }
                            } else if (employee.status === 'trabajando') {
                              if (attendance.entrada?.hora) {
                                const t = attendance.entrada.hora.toDate ? attendance.entrada.hora.toDate() : new Date(attendance.entrada.hora);
                                return ` • Desde ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                              }
                            }
                            return ' • Sin registro';
                          })()}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Contact Actions + Expand indicator */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {employee.userData.phone && (
                        <>
                          <IconButton 
                            icon="whatsapp" 
                            size={20} 
                            iconColor="#25D366" 
                            onPress={(e) => { e.stopPropagation?.(); handleWhatsApp(employee.userData.phone); }}
                          />
                          <IconButton 
                            icon="phone" 
                            size={20} 
                            iconColor={surfaceColors.primary} 
                            onPress={(e) => { e.stopPropagation?.(); handleCall(employee.userData.phone); }}
                          />
                        </>
                      )}
                      <MaterialCommunityIcons 
                        name={expandedEmployee === employee.id ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={surfaceColors.onSurfaceVariant} 
                      />
                    </View>
                  </View>

                  {/* ═══ Expandible: Detalle de sesión ═══ */}
                  {expandedEmployee === employee.id && employee.attendance && (
                    <View style={{ 
                      marginTop: 12, 
                      paddingTop: 12, 
                      borderTopWidth: 1, 
                      borderTopColor: surfaceColors.outlineVariant,
                      gap: 8
                    }}>
                      {/* Entrada */}
                      {employee.attendance.entrada?.hora && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <MaterialCommunityIcons name="login" size={16} color={surfaceColors.primary} />
                          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, flex: 1 }}>Entrada</Text>
                          <Text variant="bodySmall" style={{ fontWeight: '600', color: surfaceColors.onSurface }}>
                            {(() => {
                              const t = employee.attendance.entrada.hora.toDate ? employee.attendance.entrada.hora.toDate() : new Date(employee.attendance.entrada.hora);
                              return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </Text>
                        </View>
                      )}

                      {/* Breaks */}
                      {employee.attendance.breaks?.length > 0 && employee.attendance.breaks.map((b, i) => (
                        <View key={`break-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <MaterialCommunityIcons name="coffee" size={16} color={surfaceColors.tertiary} />
                          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, flex: 1 }}>
                            Break {employee.attendance.breaks.length > 1 ? `#${i + 1}` : ''}
                          </Text>
                          <Text variant="bodySmall" style={{ fontWeight: '600', color: surfaceColors.onSurface }}>
                            {(() => {
                              const inicio = b.inicio?.toDate ? b.inicio.toDate() : new Date(b.inicio);
                              const inicioStr = inicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              if (b.fin) {
                                const fin = b.fin.toDate ? b.fin.toDate() : new Date(b.fin);
                                const finStr = fin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const durMs = fin - inicio;
                                const mins = Math.floor(durMs / 60000);
                                return `${inicioStr} - ${finStr} (${mins}min)`;
                              }
                              return `${inicioStr} - En curso...`;
                            })()}
                          </Text>
                        </View>
                      ))}

                      {/* Almuerzo */}
                      {employee.attendance.almuerzo?.inicio && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <MaterialCommunityIcons name="food" size={16} color={surfaceColors.secondary} />
                          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, flex: 1 }}>Almuerzo</Text>
                          <Text variant="bodySmall" style={{ fontWeight: '600', color: surfaceColors.onSurface }}>
                            {(() => {
                              const inicio = employee.attendance.almuerzo.inicio.toDate ? employee.attendance.almuerzo.inicio.toDate() : new Date(employee.attendance.almuerzo.inicio);
                              const inicioStr = inicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              if (employee.attendance.almuerzo.fin) {
                                const fin = employee.attendance.almuerzo.fin.toDate ? employee.attendance.almuerzo.fin.toDate() : new Date(employee.attendance.almuerzo.fin);
                                const finStr = fin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const durMs = fin - inicio;
                                const mins = Math.floor(durMs / 60000);
                                return `${inicioStr} - ${finStr} (${mins}min)`;
                              }
                              return `${inicioStr} - En curso...`;
                            })()}
                          </Text>
                        </View>
                      )}

                      {/* Salida */}
                      {employee.attendance.salida?.hora && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <MaterialCommunityIcons name="logout" size={16} color={surfaceColors.error} />
                          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, flex: 1 }}>Salida</Text>
                          <Text variant="bodySmall" style={{ fontWeight: '600', color: surfaceColors.onSurface }}>
                            {(() => {
                              const t = employee.attendance.salida.hora.toDate ? employee.attendance.salida.hora.toDate() : new Date(employee.attendance.salida.hora);
                              return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </Text>
                        </View>
                      )}

                      {/* Tiempo trabajado total */}
                      {employee.attendance.entrada?.hora && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          gap: 10, 
                          marginTop: 4,
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: surfaceColors.outlineVariant
                        }}>
                          <MaterialCommunityIcons name="clock-check-outline" size={16} color={surfaceColors.primary} />
                          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, flex: 1, fontWeight: '600' }}>Tiempo trabajado</Text>
                          <Text variant="bodySmall" style={{ fontWeight: '700', color: surfaceColors.primary }}>
                            {(() => {
                              const entrada = employee.attendance.entrada.hora.toDate ? employee.attendance.entrada.hora.toDate() : new Date(employee.attendance.entrada.hora);
                              const fin = employee.attendance.salida?.hora
                                ? (employee.attendance.salida.hora.toDate ? employee.attendance.salida.hora.toDate() : new Date(employee.attendance.salida.hora))
                                : new Date();
                              let totalMs = fin - entrada;
                              
                              // Restar breaks finalizados
                              if (employee.attendance.breaks) {
                                employee.attendance.breaks.forEach(b => {
                                  if (b.inicio && b.fin) {
                                    const bInicio = b.inicio.toDate ? b.inicio.toDate() : new Date(b.inicio);
                                    const bFin = b.fin.toDate ? b.fin.toDate() : new Date(b.fin);
                                    totalMs -= (bFin - bInicio);
                                  }
                                });
                              }
                              // Restar almuerzo finalizado
                              if (employee.attendance.almuerzo?.inicio && employee.attendance.almuerzo?.fin) {
                                const aInicio = employee.attendance.almuerzo.inicio.toDate ? employee.attendance.almuerzo.inicio.toDate() : new Date(employee.attendance.almuerzo.inicio);
                                const aFin = employee.attendance.almuerzo.fin.toDate ? employee.attendance.almuerzo.fin.toDate() : new Date(employee.attendance.almuerzo.fin);
                                totalMs -= (aFin - aInicio);
                              }

                              if (totalMs < 0) totalMs = 0;
                              const hours = Math.floor(totalMs / 3600000);
                              const mins = Math.floor((totalMs % 3600000) / 60000);
                              return `${hours}h ${mins}m`;
                            })()}
                          </Text>
                        </View>
                      )}

                      {/* Dispositivo de entrada */}
                      {employee.attendance.entrada?.dispositivo && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                          <MaterialCommunityIcons name="cellphone" size={16} color={surfaceColors.onSurfaceVariant} />
                          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, opacity: 0.7 }}>
                            {typeof employee.attendance.entrada.dispositivo === 'string' 
                              ? employee.attendance.entrada.dispositivo 
                              : `${employee.attendance.entrada.dispositivo.brand || ''} ${employee.attendance.entrada.dispositivo.modelName || ''}`.trim() || 'Dispositivo desconocido'
                            }
                          </Text>
                        </View>
                      )}

                      {/* Ubicaciones: Entrada y Salida */}
                      {(employee.attendance.entrada?.ubicacion?.lat || employee.attendance.salida?.ubicacion?.lat) && (
                        <View style={{ 
                          flexDirection: 'row', 
                          gap: 8, 
                          marginTop: 6,
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: surfaceColors.outlineVariant
                        }}>
                          {/* Ubicación de Entrada */}
                          {employee.attendance.entrada?.ubicacion?.lat && (
                            <Pressable
                              onPress={() => {
                                const { lat, lon } = employee.attendance.entrada.ubicacion;
                                Linking.openURL(`https://www.google.com/maps?q=${lat},${lon}`);
                              }}
                              style={{ 
                                flex: 1, 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                gap: 6,
                                backgroundColor: surfaceColors.surfaceContainerHigh,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12
                              }}
                            >
                              <MaterialCommunityIcons name="map-marker" size={16} color={surfaceColors.primary} />
                              <View style={{ flex: 1 }}>
                                <Text variant="labelSmall" style={{ color: surfaceColors.primary, fontWeight: '600' }}>
                                  Entrada
                                </Text>
                                <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, fontSize: 10 }}>
                                  {employee.attendance.entrada.ubicacion.tipo || 'Ver mapa'}
                                </Text>
                              </View>
                              <MaterialCommunityIcons name="open-in-new" size={12} color={surfaceColors.onSurfaceVariant} />
                            </Pressable>
                          )}

                          {/* Ubicación de Salida */}
                          {employee.attendance.salida?.ubicacion?.lat && (
                            <Pressable
                              onPress={() => {
                                const { lat, lon } = employee.attendance.salida.ubicacion;
                                Linking.openURL(`https://www.google.com/maps?q=${lat},${lon}`);
                              }}
                              style={{ 
                                flex: 1, 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                gap: 6,
                                backgroundColor: surfaceColors.surfaceContainerHigh,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12
                              }}
                            >
                              <MaterialCommunityIcons name="map-marker-check" size={16} color={surfaceColors.error} />
                              <View style={{ flex: 1 }}>
                                <Text variant="labelSmall" style={{ color: surfaceColors.error, fontWeight: '600' }}>
                                  Salida
                                </Text>
                                <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, fontSize: 10 }}>
                                  {employee.attendance.salida.ubicacion.tipo || 'Ver mapa'}
                                </Text>
                              </View>
                              <MaterialCommunityIcons name="open-in-new" size={12} color={surfaceColors.onSurfaceVariant} />
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Sin registro - expandido */}
                  {expandedEmployee === employee.id && !employee.attendance && (
                    <View style={{ 
                      marginTop: 12, 
                      paddingTop: 12, 
                      borderTopWidth: 1, 
                      borderTopColor: surfaceColors.outlineVariant,
                      alignItems: 'center',
                      paddingVertical: 8
                    }}>
                      <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, fontStyle: 'italic' }}>
                        No ha registrado entrada hoy
                      </Text>
                    </View>
                  )}
                </Surface>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  kpiContainer: {
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    borderRadius: 24,
    alignItems: 'flex-start', // Align left for cleaner grid look
    justifyContent: 'center',
    gap: 4,
    minHeight: 100, // Ensure consistent height
  },
  quickAction: {
    flex: 1,
    padding: 8,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: '28%',
    maxWidth: '32%',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '75%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
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
