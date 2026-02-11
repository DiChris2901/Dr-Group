import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
    Avatar,
    Button,
    IconButton,
    Modal,
    Menu,
    Divider,
    Text as PaperText,
    Portal,
    Surface,
    useTheme as usePaperTheme,
    Badge
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingActionBar from '../../components/FloatingActionBar';
import NovedadesSheet from '../../components/NovedadesSheet';
import RingChart from '../../components/RingChart';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAppDistribution } from '../../hooks/useAppDistribution';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import designSystem from '../../../design-system.json';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const theme = usePaperTheme();
  const { isDarkMode, toggleDarkMode, triggerHaptic } = useTheme();
  const { unreadCount } = useNotifications();
  const { updateAvailable, showUpdateDialog } = useAppDistribution();
  const { can } = usePermissions();
  
  const { 
    user, 
    userProfile, 
    activeSession, 
    iniciarJornada, 
    registrarBreak, 
    finalizarBreak, 
    registrarAlmuerzo, 
    finalizarAlmuerzo, 
    finalizarJornada,
    signOut,
    isStartingSession, // 🔒 Estado de procesamiento del inicio
    hasPendingSync // ✅ Estado de sincronización pendiente
  } = useAuth();
  
  const [tiempoTrabajado, setTiempoTrabajado] = useState('00:00:00');
  const [progress, setProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [novedadesVisible, setNovedadesVisible] = useState(false);
  const [novedadInitialType, setNovedadInitialType] = useState(null);
  const [localLoading, setLocalLoading] = useState(false); // 🔒 Loading local adicional

  // ✅ Memoizar función de formateo para evitar recrearla
  const formatMs = useCallback((ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // ✅ Manejador seguro para iniciar jornada con protección contra múltiples taps
  const handleIniciarJornada = useCallback(async () => {
    // 🔒 CAPA 2: Validación UI inmediata (prevenir doble tap)
    if (localLoading || isStartingSession) {
      console.log('⚠️ Ya se está procesando, ignorando toque duplicado');
      return; // Salir silenciosamente sin alertar al usuario
    }

    try {
      setLocalLoading(true); // 🔒 Activar loading local inmediatamente
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // ✅ Feedback táctil inmediato
      
      await iniciarJornada();
      
      // ✅ Feedback de éxito
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Si el error es por procesamiento duplicado, ignorar (ya hay candado activo)
      if (error.message.includes('Ya se está procesando')) {
        return; // No mostrar alerta, es protección interna
      }
      
      // Si el error es por jornada finalizada, ofrecer reapertura (sin loguear error)
      if (error.message.includes('Ya finalizaste tu jornada')) {
        Alert.alert(
          'Jornada Finalizada',
          'Ya has marcado tu salida hoy. ¿Fue un error y necesitas continuar trabajando?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Solicitar Reapertura', 
              onPress: () => {
                // Abrir modal de novedades automáticamente con tipo preseleccionado
                setNovedadInitialType('solicitud_reapertura');
                setNovedadesVisible(true);
              }
            }
          ]
        );
      } else {
        // Otros errores (ej. horario temprano, sin conexión)
        console.log('Error al iniciar jornada:', error.message);
        Alert.alert('No se pudo iniciar', error.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // ✅ Feedback de error
      }
    } finally {
      setLocalLoading(false); // 🔓 Liberar loading local
    }
  }, [localLoading, isStartingSession, iniciarJornada, setNovedadInitialType, setNovedadesVisible]);

  // ✅ Timer Logic
  useEffect(() => {
    const updateTimer = () => {
      if (!activeSession || activeSession.estadoActual === 'finalizado') {
        setTiempoTrabajado('00:00:00');
        setProgress(0);
        return;
      }
      
      const ahora = new Date();

      // 1. Si está en BREAK
      if (activeSession.estadoActual === 'break') {
        const currentBreak = activeSession.breaks ? activeSession.breaks[activeSession.breaks.length - 1] : null;
        if (currentBreak && currentBreak.inicio) {
           const inicio = currentBreak.inicio.toDate ? currentBreak.inicio.toDate() : new Date(currentBreak.inicio);
           const diff = ahora - inicio;
           setTiempoTrabajado(formatMs(diff));
           // Progreso visual para break (ej. base 15 min)
           setProgress(Math.min(diff / (15 * 60 * 1000), 1)); 
        }
        return;
      }

      // 2. Si está en ALMUERZO
      if (activeSession.estadoActual === 'almuerzo') {
        if (activeSession.almuerzo && activeSession.almuerzo.inicio) {
           const inicio = activeSession.almuerzo.inicio.toDate ? activeSession.almuerzo.inicio.toDate() : new Date(activeSession.almuerzo.inicio);
           const diff = ahora - inicio;
           setTiempoTrabajado(formatMs(diff));
           // Progreso visual para almuerzo (ej. base 60 min)
           setProgress(Math.min(diff / (60 * 60 * 1000), 1));
        }
        return;
      }

      // 3. Si está TRABAJANDO (Calcula tiempo neto trabajado)
      const entrada = activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora);
      let tiempoTotalMs = ahora - entrada;
      
      // Restar breaks finalizados
      if (activeSession.breaks) {
        activeSession.breaks.forEach(b => {
          if (b.fin) {
            const inicio = b.inicio.toDate ? b.inicio.toDate() : new Date(b.inicio);
            const fin = b.fin.toDate ? b.fin.toDate() : new Date(b.fin);
            tiempoTotalMs -= (fin - inicio);
          }
        });
      }
      // Restar almuerzo finalizado
      if (activeSession.almuerzo?.fin) {
        const inicio = activeSession.almuerzo.inicio.toDate ? activeSession.almuerzo.inicio.toDate() : new Date(activeSession.almuerzo.inicio);
        const fin = activeSession.almuerzo.fin.toDate ? activeSession.almuerzo.fin.toDate() : new Date(activeSession.almuerzo.fin);
        tiempoTotalMs -= (fin - inicio);
      }

      setTiempoTrabajado(formatMs(tiempoTotalMs));
      
      // Calculate progress (Goal: 9 hours = 32400 seconds)
      const goalSeconds = 9 * 3600;
      const currentProgress = Math.min((tiempoTotalMs / 1000) / goalSeconds, 1);
      setProgress(currentProgress);
    };

    const interval = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(interval);
  }, [activeSession, formatMs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh logic
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <PaperText 
              variant="headlineLarge"
              style={{ 
                color: theme.colors.primary,
                fontFamily: 'Roboto-Flex',
                fontWeight: '500',
                letterSpacing: -0.5,
                fontVariationSettings: [{ axis: 'wdth', value: 110 }]
              }}
            >
              Hola, {userProfile?.displayName?.split(' ')[0] || 'Usuario'}
            </PaperText>
            <PaperText 
              variant="bodyLarge"
              style={{ 
                color: theme.colors.secondary,
                marginTop: 4
              }}
            >
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </PaperText>
          </View>
        </View>
        
        {/* ✅ NUEVO: Indicador de Sincronización Pendiente */}
        {hasPendingSync && (
          <Surface
            style={{
              backgroundColor: theme.colors.warningContainer || '#FFF4E5',
              borderRadius: designSystem.borderRadius.components.card.medium,
              padding: 16,
              marginBottom: 16,
              marginHorizontal: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.warning || '#FF9800'
            }}
            elevation={0}
          >
            <MaterialCommunityIcons 
              name="cloud-sync-outline" 
              size={24} 
              color={theme.colors.warning || '#FF9800'} 
            />
            <View style={{ flex: 1 }}>
              <PaperText 
                variant="bodyMedium"
                style={{ 
                  color: theme.colors.onSurface,
                  fontWeight: '600'
                }}
              >
                Sincronización Pendiente
              </PaperText>
              <PaperText 
                variant="bodySmall"
                style={{ 
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 2
                }}
              >
                Tus registros se sincronizarán automáticamente cuando tengas internet
              </PaperText>
            </View>
          </Surface>
        )}

        {/* Action Buttons Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, paddingHorizontal: 0 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
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
            {(userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') && (
              <IconButton 
                icon="shield-account-outline" 
                mode="contained-tonal"
                size={24}
                onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('AdminSettings');
                }} 
              />
            )}
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
              backgroundColor: updateAvailable.isCritical ? theme.colors.errorContainer : theme.colors.tertiaryContainer 
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
                <PaperText variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  {updateAvailable.isCritical ? '⚠️ Actualización Crítica' : '🎉 Nueva Versión'} {updateAvailable.version}
                </PaperText>
                <PaperText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2}>
                  {updateAvailable.releaseNotes}
                </PaperText>
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

        {/* Ring Chart Section */}
        <View style={styles.chartContainer}>
          <RingChart 
            progress={progress} 
            label={tiempoTrabajado}
            subLabel={activeSession?.estadoActual === 'trabajando' ? 'Tiempo Trabajado' : activeSession?.estadoActual?.toUpperCase() || 'INACTIVO'}
            status={activeSession?.estadoActual || 'idle'}
            color={
              activeSession?.estadoActual === 'break' ? theme.colors.tertiary :
              activeSession?.estadoActual === 'almuerzo' ? theme.colors.secondary :
              theme.colors.primary
            }
          />
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceContainerLow }]} elevation={0}>
            <Avatar.Icon size={40} icon="clock-start" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
            <View style={styles.statText}>
              <PaperText variant="labelMedium" style={{ color: theme.colors.secondary }}>Entrada</PaperText>
              <PaperText variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {activeSession?.entrada?.hora ? 
                  (activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora))
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--'}
              </PaperText>
            </View>
          </Surface>

          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceContainerLow }]} elevation={0}>
            <Avatar.Icon size={40} icon="clock-end" style={{ backgroundColor: theme.colors.errorContainer }} color={theme.colors.error} />
            <View style={styles.statText}>
              <PaperText variant="labelMedium" style={{ color: theme.colors.secondary }}>Salida</PaperText>
              <PaperText variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {activeSession?.salida?.hora ? 
                  (activeSession.salida.hora.toDate ? activeSession.salida.hora.toDate() : new Date(activeSession.salida.hora))
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--'}
              </PaperText>
            </View>
          </Surface>
        </View>

        {/* Novedades Button */}
        <Surface style={[styles.actionCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
          <View style={styles.actionContent}>
            <PaperText variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSecondaryContainer, fontSize: 16 }}>
              ¿Novedades?
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>
              Reportar permisos/incapacidad
            </PaperText>
          </View>
          <Button 
            mode="contained" 
            compact
            onPress={() => {
              triggerHaptic('selection');
              setNovedadesVisible(true);
            }}
            style={{ borderRadius: 24 }}
            contentStyle={{ paddingHorizontal: 4, height: 36 }}
            labelStyle={{ fontSize: 13 }}
          >
            Reportar
          </Button>
        </Surface>

        {/* Directorio - Acceso rápido a Empresas y Empleados */}
        {(can(APP_PERMISSIONS.EMPRESAS_VER) || can(APP_PERMISSIONS.EMPLEADOS_VER)) && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <PaperText variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', paddingLeft: 4 }}>
              Directorio
            </PaperText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {can(APP_PERMISSIONS.EMPRESAS_VER) && (
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    navigation.navigate('Empresas');
                  }}
                  android_ripple={{ color: theme.colors.primary + '1F' }}
                  style={({ pressed }) => [
                    styles.directoryCard,
                    {
                      backgroundColor: theme.colors.surfaceContainerLow,
                      flex: 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <Avatar.Icon
                    size={40}
                    icon="domain"
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.primary}
                  />
                  <PaperText variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: 8 }}>
                    Empresas
                  </PaperText>
                </Pressable>
              )}
              {can(APP_PERMISSIONS.EMPLEADOS_VER) && (
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    navigation.navigate('Empleados');
                  }}
                  android_ripple={{ color: theme.colors.secondary + '1F' }}
                  style={({ pressed }) => [
                    styles.directoryCard,
                    {
                      backgroundColor: theme.colors.surfaceContainerLow,
                      flex: 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <Avatar.Icon
                    size={40}
                    icon="account-group"
                    style={{ backgroundColor: theme.colors.secondaryContainer }}
                    color={theme.colors.secondary}
                  />
                  <PaperText variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: 8 }}>
                    Empleados
                  </PaperText>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Spacer for Floating Action Bar */}
        <View style={{ height: 180 }} />

      </ScrollView>

      {/* Floating Action Bar */}
      <FloatingActionBar
        status={activeSession?.estadoActual || 'off'}
        onPressStart={handleIniciarJornada}
        isLoading={localLoading || isStartingSession} // 🔒 Pasar estado de loading
        onPressBreak={() => registrarBreak()}
        onPressLunch={() => registrarAlmuerzo()}
        onPressEnd={() => finalizarJornada()}
        onPressResume={() => {
          if (activeSession?.estadoActual === 'break') finalizarBreak();
          if (activeSession?.estadoActual === 'almuerzo') finalizarAlmuerzo();
        }}
        breaksCount={activeSession?.breaks ? activeSession.breaks.length : 0}
      />

      {/* Novedades Bottom Sheet Modal */}
      <Portal>
        <Modal
          visible={novedadesVisible}
          onDismiss={() => {
            setNovedadesVisible(false);
            setNovedadInitialType(null);
          }}
          contentContainerStyle={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
          }}
        >
          <NovedadesSheet 
            onClose={() => {
              setNovedadesVisible(false);
              setNovedadInitialType(null);
            }} 
            initialType={novedadInitialType}
          />
        </Modal>
      </Portal>

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
  deniedTitle: {
    marginTop: 16,
    fontWeight: '600',
  },
  deniedMessage: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 160, // ✅ Aumentado para evitar solapamiento con botón flotante
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },
  statText: {
    flex: 1,
  },
  updateBanner: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 24,
  },
  updateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateText: {
    flex: 1,
  },
  actionCard: {
    padding: 16, // Reducido de 24
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionContent: {
    flex: 1,
  },
  fab: {
    paddingBottom: 90,
  },
  fabExtended: {
    position: 'absolute',
    margin: 16,
    right: 0,
    left: 0,
    bottom: 90, // Just above the bottom tab bar (80px height + padding)
    borderRadius: 100,
    justifyContent: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 28,
    padding: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  directoryCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
});

