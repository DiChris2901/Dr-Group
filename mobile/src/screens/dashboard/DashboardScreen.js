import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { checkForUpdates } from '../../services/UpdateService';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, userProfile, activeSession, signOut, registrarBreak, finalizarBreak, registrarAlmuerzo, finalizarAlmuerzo, finalizarJornada } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  const { scheduleNotification, cancelNotification } = useNotifications();
  
  // Animations
  const slideAnim = useRef(new Animated.Value(height * 0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [tiempoTrabajado, setTiempoTrabajado] = useState('00:00:00');
  const [tiempoDescanso, setTiempoDescanso] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const WORK_SESSION_NOTIFICATION_ID = 'work-session-notification';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ CONTADOR DE TIEMPO TRABAJADO
  useEffect(() => {
    if (!activeSession || activeSession.estadoActual === 'finalizado' || finalizando) return;
    if (activeSession.estadoActual !== 'trabajando') return;

    const interval = setInterval(() => {
      const entrada = activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora);
      const ahora = new Date();
      let tiempoTotalMs = ahora - entrada;
      
      if (activeSession.breaks && activeSession.breaks.length > 0) {
        activeSession.breaks.forEach(b => {
          if (b.fin) {
            const inicioBreak = b.inicio.toDate ? b.inicio.toDate() : new Date(b.inicio);
            const finBreak = b.fin.toDate ? b.fin.toDate() : new Date(b.fin);
            tiempoTotalMs -= (finBreak - inicioBreak);
          }
        });
      }
      
      if (activeSession.almuerzo?.fin) {
        const inicioAlmuerzo = activeSession.almuerzo.inicio.toDate ? activeSession.almuerzo.inicio.toDate() : new Date(activeSession.almuerzo.inicio);
        const finAlmuerzo = activeSession.almuerzo.fin.toDate ? activeSession.almuerzo.fin.toDate() : new Date(activeSession.almuerzo.fin);
        tiempoTotalMs -= (finAlmuerzo - inicioAlmuerzo);
      }
      
      const horas = Math.floor(tiempoTotalMs / 1000 / 60 / 60);
      const minutos = Math.floor((tiempoTotalMs / 1000 / 60) % 60);
      const segundos = Math.floor((tiempoTotalMs / 1000) % 60);
      
      setTiempoTrabajado(
        `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, finalizando]);

  // ✅ CONTADOR DE TIEMPO EN BREAK/ALMUERZO
  useEffect(() => {
    if (!activeSession || finalizando) return;
    if (activeSession.estadoActual !== 'break' && activeSession.estadoActual !== 'almuerzo') {
      setTiempoDescanso('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      let inicioDescanso;
      if (activeSession.estadoActual === 'break') {
        const breakActual = activeSession.breaks[activeSession.breaks.length - 1];
        inicioDescanso = breakActual.inicio.toDate ? breakActual.inicio.toDate() : new Date(breakActual.inicio);
      } else if (activeSession.estadoActual === 'almuerzo') {
        inicioDescanso = activeSession.almuerzo.inicio.toDate ? activeSession.almuerzo.inicio.toDate() : new Date(activeSession.almuerzo.inicio);
      }
      
      const ahora = new Date();
      const diff = ahora - inicioDescanso;
      const horas = Math.floor(diff / 1000 / 60 / 60);
      const minutos = Math.floor((diff / 1000 / 60) % 60);
      const segundos = Math.floor((diff / 1000) % 60);
      
      setTiempoDescanso(
        `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, finalizando]);

  // ✅ Helper para notificaciones
  const updateWorkSessionNotification = async (estadoActual, tiempoActual) => {
    try {
      if (!activeSession) return;
      const entradaDate = activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora);
      const horaEntrada = entradaDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      let titulo = '🕐 Jornada Laboral Activa';
      let cuerpo = '';

      switch (estadoActual) {
        case 'trabajando':
          cuerpo = `Entrada: ${horaEntrada}\nTiempo trabajado: ${tiempoActual}\nEstado: Trabajando 💼`;
          break;
        case 'break':
          cuerpo = `En Break ☕\nTiempo: ${tiempoActual}`;
          break;
        case 'almuerzo':
          cuerpo = `En Almuerzo 🍽️\nTiempo: ${tiempoActual}`;
          break;
        default:
          cuerpo = `Entrada: ${horaEntrada}\nTiempo trabajado: ${tiempoActual}`;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: WORK_SESSION_NOTIFICATION_ID,
        content: {
          title: titulo,
          body: cuerpo,
          data: { type: 'work-session' },
          sound: false,
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error actualizando notificación:', error);
    }
  };

  useEffect(() => {
    if (!activeSession || activeSession.estadoActual === 'finalizado' || finalizando) {
      Notifications.cancelScheduledNotificationAsync(WORK_SESSION_NOTIFICATION_ID).catch(() => {});
      return;
    }
    updateWorkSessionNotification(activeSession.estadoActual, tiempoTrabajado);
    return () => {
      if (activeSession?.estadoActual === 'finalizado') {
        Notifications.dismissNotificationAsync(WORK_SESSION_NOTIFICATION_ID).catch(() => {});
      }
    };
  }, [activeSession?.estadoActual]);

  useEffect(() => {
    if (!activeSession || activeSession.estadoActual === 'finalizado' || finalizando) return;
    const interval = setInterval(() => {
      updateWorkSessionNotification(activeSession.estadoActual, tiempoTrabajado);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeSession, tiempoTrabajado, finalizando]);

  const handleBreak = async () => {
    if (!activeSession) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (activeSession.estadoActual === 'break') {
        await finalizarBreak();
      } else {
        await registrarBreak();
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo registrar el break');
    } finally {
      setLoading(false);
    }
  };

  const handleAlmuerzo = async () => {
    if (!activeSession) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (activeSession.estadoActual === 'almuerzo') {
        await finalizarAlmuerzo();
      } else {
        await registrarAlmuerzo();
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo registrar el almuerzo');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarJornada = () => {
    if (activeSession?.estadoActual === 'break' || activeSession?.estadoActual === 'almuerzo') {
      Alert.alert(
        '⚠️ Actividad en Curso',
        `Tienes un ${activeSession.estadoActual === 'break' ? 'break' : 'almuerzo'} activo. ¿Deseas finalizarlo y cerrar tu jornada?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Finalizar Todo',
            style: 'destructive',
            onPress: async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setFinalizando(true);
              setLoading(true);
              try {
                if (activeSession.estadoActual === 'break') await finalizarBreak();
                else if (activeSession.estadoActual === 'almuerzo') await finalizarAlmuerzo();
                await new Promise(resolve => setTimeout(resolve, 500));
                await finalizarJornada();
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', error.message);
                setFinalizando(false);
                setLoading(false);
              }
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Finalizar Jornada',
      '¿Estás seguro de que deseas finalizar tu jornada laboral?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setFinalizando(true);
            setLoading(true);
            try {
              await finalizarJornada();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.message);
              setFinalizando(false);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      activeSession && activeSession.estadoActual !== 'finalizado'
        ? 'Tienes una jornada activa. Al cerrar sesión se finalizará automáticamente.'
        : '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatHora = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  const getEstadoColor = () => {
    if (!activeSession) return '#999';
    switch (activeSession.estadoActual) {
      case 'trabajando': return '#2ed573';
      case 'break': return '#ffa502';
      case 'almuerzo': return '#ff6348';
      case 'finalizado': return '#999';
      default: return '#999';
    }
  };

  const getEstadoTexto = () => {
    if (!activeSession) return 'Sin sesión';
    switch (activeSession.estadoActual) {
      case 'trabajando': return '⚡ Trabajando';
      case 'break': return '☕ En Break';
      case 'almuerzo': return '🍽️ Almorzando';
      case 'finalizado': return '🏠 Jornada Finalizada';
      default: return 'Sin sesión';
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Header Background */}
      <LinearGradient
        colors={getGradient()}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Hola,</Text>
              <Text style={styles.userName}>
                {userProfile?.name || userProfile?.displayName || user?.email?.split('@')[0]}
              </Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            
            <TouchableOpacity onPress={handleSignOut} style={styles.profileButton}>
              {userProfile?.photoURL ? (
                <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(userProfile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Bottom Sheet Content */}
      <Animated.View style={[
        styles.sheetContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[getPrimaryColor()]}
              tintColor={getPrimaryColor()}
            />
          }
        >
          {/* ADMIN VIEW */}
          {(userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') ? (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: getSecondaryColor() }]}>PANEL ADMIN</Text>
                </View>
                <Text style={styles.welcomeText}>
                  Bienvenido al panel de administración. Gestiona asistencias y reportes desde aquí.
                </Text>
                
                <View style={styles.adminActions}>
                  <TouchableOpacity
                    style={[styles.modernButton, { backgroundColor: '#2196f3' }]}
                    onPress={() => navigation.navigate('Asistencias')}
                  >
                    <Text style={styles.modernButtonText}>👥 Ver Asistencias</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modernButton, { backgroundColor: '#4caf50', marginTop: 12 }]}
                    onPress={() => navigation.navigate('Reportes')}
                  >
                    <Text style={styles.modernButtonText}>📊 Ver Reportes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ) : (
            /* USER VIEW */
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {/* Main Status Card */}
              <View style={styles.card}>
                <View style={[styles.statusPill, { backgroundColor: getEstadoColor() + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getEstadoColor() }]} />
                  <Text style={[styles.statusText, { color: getEstadoColor() }]}>
                    {getEstadoTexto().toUpperCase()}
                  </Text>
                </View>

                <View style={styles.timerContainer}>
                  <Text style={styles.timerValue}>
                    {activeSession?.estadoActual === 'break' || activeSession?.estadoActual === 'almuerzo' 
                      ? tiempoDescanso 
                      : tiempoTrabajado}
                  </Text>
                  <Text style={styles.timerLabel}>
                    {activeSession?.estadoActual === 'break' ? 'TIEMPO EN BREAK' : 
                     activeSession?.estadoActual === 'almuerzo' ? 'TIEMPO EN ALMUERZO' : 
                     'TIEMPO TRABAJADO'}
                  </Text>
                </View>

                <View style={styles.gridInfo}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>ENTRADA</Text>
                    <Text style={styles.infoValue}>{formatHora(activeSession?.entrada?.hora)}</Text>
                  </View>
                  {activeSession?.salida && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>SALIDA</Text>
                      <Text style={styles.infoValue}>{formatHora(activeSession.salida.hora)}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {activeSession && activeSession.estadoActual !== 'finalizado' && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.modernButton,
                        { backgroundColor: getPrimaryColor() },
                        (loading || activeSession.estadoActual === 'almuerzo') && styles.buttonDisabled
                      ]}
                      onPress={handleBreak}
                      disabled={loading || activeSession.estadoActual === 'almuerzo'}
                    >
                      <Text style={styles.modernButtonText}>
                        {activeSession.estadoActual === 'break' ? 'Finalizar Break' : 'Tomar Break'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modernButton,
                        { backgroundColor: getSecondaryColor(), marginTop: 12 },
                        (loading || activeSession.estadoActual === 'break' || activeSession.almuerzo?.fin) && styles.buttonDisabled
                      ]}
                      onPress={handleAlmuerzo}
                      disabled={loading || activeSession.estadoActual === 'break' || !!activeSession.almuerzo?.fin}
                    >
                      <Text style={styles.modernButtonText}>
                        {activeSession.estadoActual === 'almuerzo' ? 'Finalizar Almuerzo' : 'Ir a Almuerzo'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modernButton,
                        { backgroundColor: '#ff4757', marginTop: 24 },
                        (loading || activeSession.estadoActual === 'break' || activeSession.estadoActual === 'almuerzo') && styles.buttonDisabled
                      ]}
                      onPress={handleFinalizarJornada}
                      disabled={loading || activeSession.estadoActual === 'break' || activeSession.estadoActual === 'almuerzo'}
                    >
                      <Text style={styles.modernButtonText}>Finalizar Jornada</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Daily Log Card */}
              <View style={[styles.card, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>REGISTRO DE HOY</Text>
                
                {activeSession?.breaks?.map((b, i) => (
                  <View key={i} style={styles.logRow}>
                    <View style={styles.logIconContainer}>
                      <Text>☕</Text>
                    </View>
                    <View style={styles.logDetails}>
                      <Text style={styles.logTitle}>Break {i + 1}</Text>
                      <Text style={styles.logTime}>
                        {formatHora(b.inicio)} - {b.fin ? formatHora(b.fin) : 'En curso'}
                      </Text>
                    </View>
                    {b.duracion && <Text style={styles.logDuration}>{b.duracion}</Text>}
                  </View>
                ))}

                {activeSession?.almuerzo && (
                  <View style={styles.logRow}>
                    <View style={styles.logIconContainer}>
                      <Text>🍽️</Text>
                    </View>
                    <View style={styles.logDetails}>
                      <Text style={styles.logTitle}>Almuerzo</Text>
                      <Text style={styles.logTime}>
                        {formatHora(activeSession.almuerzo.inicio)} - {activeSession.almuerzo.fin ? formatHora(activeSession.almuerzo.fin) : 'En curso'}
                      </Text>
                    </View>
                    {activeSession.almuerzo.duracion && (
                      <Text style={styles.logDuration}>{activeSession.almuerzo.duracion}</Text>
                    )}
                  </View>
                )}

                {(!activeSession?.breaks?.length && !activeSession?.almuerzo) && (
                  <Text style={styles.emptyText}>No hay registros de actividad aún.</Text>
                )}
              </View>
            </Animated.View>
          )}

          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => checkForUpdates(false)}
          >
            <Text style={[styles.updateText, { color: getPrimaryColor() }]}>
              Verificar Actualizaciones v1.0.0
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGradient: {
    height: height * 0.35,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  profileButton: {
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -60,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#1c1c1e',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  gridInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
    paddingTop: 24,
    marginBottom: 24,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  modernButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  modernButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8e8e93',
    letterSpacing: 1,
    marginBottom: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logDetails: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  logTime: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  logDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    fontStyle: 'italic',
    marginTop: 8,
  },
  updateButton: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  updateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Admin styles
  cardHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 15,
    color: '#3a3a3c',
    lineHeight: 22,
    marginBottom: 24,
  },
  adminActions: {
    gap: 12,
  },
});
