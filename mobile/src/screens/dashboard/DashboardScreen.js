import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { LinearGradient } from 'expo-linear-gradient';
import SobrioCard from '../../components/SobrioCard';
import DetailRow from '../../components/DetailRow';
import OverlineText from '../../components/OverlineText';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, userProfile, activeSession, signOut, registrarBreak, finalizarBreak, registrarAlmuerzo, finalizarAlmuerzo, finalizarJornada } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  const { unreadCount } = useChat();
  const { scheduleNotification, cancelNotification } = useNotifications();
  const [tiempoTrabajado, setTiempoTrabajado] = useState('00:00:00');
  const [tiempoDescanso, setTiempoDescanso] = useState('00:00:00'); // ✅ Contador de break/almuerzo
  const [loading, setLoading] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [workSessionNotificationId, setWorkSessionNotificationId] = useState(null);
  const notificationIntervalRef = React.useRef(null); // ✅ Ref para el interval de notificación

  // ✅ CONTADOR DE TIEMPO TRABAJADO (se pausa durante break/almuerzo)
  useEffect(() => {
    if (!activeSession || activeSession.estadoActual === 'finalizado' || finalizando) return;
    
    // Solo contar si está en estado 'trabajando'
    if (activeSession.estadoActual !== 'trabajando') return;

    const interval = setInterval(() => {
      // ✅ Convertir Timestamp a Date
      const entrada = activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora);
      const ahora = new Date();
      let tiempoTotalMs = ahora - entrada;
      
      // ✅ RESTAR BREAKS FINALIZADOS - Calcular desde timestamps
      if (activeSession.breaks && activeSession.breaks.length > 0) {
        activeSession.breaks.forEach(b => {
          if (b.fin) { // Solo restar breaks finalizados
            const inicioBreak = b.inicio.toDate ? b.inicio.toDate() : new Date(b.inicio);
            const finBreak = b.fin.toDate ? b.fin.toDate() : new Date(b.fin);
            const duracionBreakMs = finBreak - inicioBreak;
            tiempoTotalMs -= duracionBreakMs;
          }
        });
      }
      
      // ✅ RESTAR ALMUERZO FINALIZADO - Calcular desde timestamps
      if (activeSession.almuerzo?.fin) { // Solo restar si el almuerzo finalizó
        const inicioAlmuerzo = activeSession.almuerzo.inicio.toDate ? activeSession.almuerzo.inicio.toDate() : new Date(activeSession.almuerzo.inicio);
        const finAlmuerzo = activeSession.almuerzo.fin.toDate ? activeSession.almuerzo.fin.toDate() : new Date(activeSession.almuerzo.fin);
        const duracionAlmuerzoMs = finAlmuerzo - inicioAlmuerzo;
        tiempoTotalMs -= duracionAlmuerzoMs;
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
    
    // Solo contar si está en break o almuerzo
    if (activeSession.estadoActual !== 'break' && activeSession.estadoActual !== 'almuerzo') {
      setTiempoDescanso('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      let inicioDescanso;
      
      if (activeSession.estadoActual === 'break') {
        const breakActual = activeSession.breaks[activeSession.breaks.length - 1];
        // ✅ Convertir Timestamp a Date
        inicioDescanso = breakActual.inicio.toDate ? breakActual.inicio.toDate() : new Date(breakActual.inicio);
      } else if (activeSession.estadoActual === 'almuerzo') {
        // ✅ Convertir Timestamp a Date
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

  // ✅ PASO 3.4: Notificación persistente de jornada laboral (OPTIMIZADO - NO recrea interval)
  useEffect(() => {
    if (!activeSession || activeSession.estadoActual === 'finalizado' || finalizando) {
      // Limpiar interval si existe
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
      // Cancelar notificación si no hay sesión activa
      if (workSessionNotificationId) {
        Notifications.dismissNotificationAsync(workSessionNotificationId);
        setWorkSessionNotificationId(null);
      }
      return;
    }

    // ✅ Función para crear/actualizar UNA SOLA notificación persistente
    const updateWorkSessionNotification = async () => {
      try {
        // ✅ CRÍTICO: Cancelar TODAS las notificaciones anteriores primero
        await Notifications.dismissAllNotificationsAsync();

        // Formatear hora de entrada
        const entradaDate = activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora);
        const horaEntrada = entradaDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        // Obtener estado actual
        let estado = 'Trabajando 💼';
        if (activeSession.estadoActual === 'break') estado = 'En Break ☕';
        if (activeSession.estadoActual === 'almuerzo') estado = 'Almorzando 🍽️';

        // ✅ Crear notificación actualizada (reemplaza la anterior)
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🕐 Jornada Laboral Activa',
            body: `Entrada: ${horaEntrada}\nTiempo trabajado: ${tiempoTrabajado}\nEstado: ${estado}`,
            data: { type: 'work-session' },
            sound: false, // Sin sonido para actualización
            sticky: true, // Notificación persistente
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Inmediato
        });

        setWorkSessionNotificationId(notificationId);
      } catch (error) {
        console.error('❌ Error actualizando notificación de jornada:', error);
      }
    };

    // ✅ Solo crear interval si no existe
    if (!notificationIntervalRef.current) {
      updateWorkSessionNotification(); // Primera ejecución inmediata
      notificationIntervalRef.current = setInterval(updateWorkSessionNotification, 10000); // 10 segundos
      console.log('✅ Interval de notificación creado');
    }

    return () => {
      // Limpiar interval al desmontar
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
        console.log('🔚 Interval de notificación limpiado');
      }
      // Cancelar notificación
      if (workSessionNotificationId) {
        Notifications.dismissNotificationAsync(workSessionNotificationId);
      }
    };
  }, [activeSession, finalizando]); // ✅ YA NO depende de tiempoTrabajado

  const handleBreak = async () => {
    if (!activeSession) return;

    setLoading(true);
    try {
      if (activeSession.estadoActual === 'break') {
        await finalizarBreak();
      } else {
        await registrarBreak();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el break');
    } finally {
      setLoading(false);
    }
  };

  const handleAlmuerzo = async () => {
    if (!activeSession) return;

    setLoading(true);
    try {
      if (activeSession.estadoActual === 'almuerzo') {
        await finalizarAlmuerzo();
      } else {
        await registrarAlmuerzo();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el almuerzo');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarJornada = () => {
    // ✅ Si hay break o almuerzo activo, pedir confirmación especial
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
              setFinalizando(true); // ✅ Detener contador inmediatamente
              setLoading(true);
              try {
                // Finalizar break/almuerzo primero
                if (activeSession.estadoActual === 'break') {
                  await finalizarBreak();
                } else if (activeSession.estadoActual === 'almuerzo') {
                  await finalizarAlmuerzo();
                }
                // Esperar un momento para que se actualice el estado
                await new Promise(resolve => setTimeout(resolve, 500));
                // Ahora finalizar jornada
                await finalizarJornada();
                // Ya no necesitamos Alert ni setLoading(false) porque signOut() cierra la sesión automáticamente
              } catch (error) {
                console.error('Error finalizando jornada:', error);
                Alert.alert('Error', 'No se pudo finalizar la jornada: ' + error.message);
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
            setFinalizando(true); // ✅ Detener contador inmediatamente
            setLoading(true);
            try {
              await finalizarJornada();
              // Ya no necesitamos Alert.alert porque signOut() cierra la app automáticamente
            } catch (error) {
              console.error('Error finalizando jornada:', error);
              Alert.alert('Error', 'No se pudo finalizar la jornada: ' + error.message);
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

  const formatHora = (timestamp) => {
    if (!timestamp) return '--:--';
    // ✅ Manejar Firestore Timestamp o ISO string
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
      {/* Header */}
      <LinearGradient
        colors={getGradient()}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {/* Avatar del usuario */}
            {userProfile?.photoURL ? (
              <Image
                source={{ uri: userProfile.photoURL }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(userProfile?.name || userProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>👋 Hola,</Text>
              <Text style={styles.userName}>{userProfile?.name || userProfile?.displayName || user?.email}</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Card de Jornada Activa - Diseño Sobrio */}
        <SobrioCard borderColor={getPrimaryColor()}>
          <OverlineText color={getPrimaryColor()}>
            JORNADA LABORAL ACTIVA
          </OverlineText>

          <View style={[styles.statusBadge, { backgroundColor: getEstadoColor() }]}>
            <Text style={styles.statusText}>{getEstadoTexto()}</Text>
          </View>

          <View style={styles.timerContainer}>
            {activeSession?.estadoActual === 'trabajando' && (
              <>
                <Text style={styles.timerLabel}>⚡ Tiempo Trabajado</Text>
                <Text style={styles.timerText}>{tiempoTrabajado}</Text>
              </>
            )}
            {activeSession?.estadoActual === 'break' && (
              <>
                <Text style={styles.timerLabel}>☕ Tiempo en Break</Text>
                <Text style={styles.timerText}>{tiempoDescanso}</Text>
                <Text style={styles.timerSubtext}>Trabajado: {tiempoTrabajado}</Text>
              </>
            )}
            {activeSession?.estadoActual === 'almuerzo' && (
              <>
                <Text style={styles.timerLabel}>🍽️ Tiempo en Almuerzo</Text>
                <Text style={styles.timerText}>{tiempoDescanso}</Text>
                <Text style={styles.timerSubtext}>Trabajado: {tiempoTrabajado}</Text>
              </>
            )}
            {!activeSession && (
              <>
                <Text style={styles.timerLabel}>⏱️ Sin Sesión Activa</Text>
                <Text style={styles.timerText}>00:00:00</Text>
              </>
            )}
          </View>

          <View style={styles.infoGrid}>
            <DetailRow
              icon="🕐"
              label="Hora de Entrada"
              value={formatHora(activeSession?.entrada?.hora)}
              iconColor={getPrimaryColor()}
            />
            {activeSession?.salida && (
              <DetailRow
                icon="🏠"
                label="Hora de Salida"
                value={formatHora(activeSession.salida.hora)}
                iconColor={getPrimaryColor()}
              />
            )}
          </View>

          {activeSession && activeSession.estadoActual !== 'finalizado' && (
            <View style={styles.actions}>
              {/* Botón Break */}
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  { backgroundColor: getPrimaryColor() },
                  activeSession.estadoActual === 'break' && styles.actionButtonActive,
                  (loading || activeSession.estadoActual === 'almuerzo') && styles.actionButtonDisabled
                ]}
                onPress={handleBreak}
                disabled={Boolean(loading || activeSession.estadoActual === 'almuerzo')}
              >
                <Text style={[
                  styles.actionButtonText,
                  (loading || activeSession.estadoActual === 'almuerzo') && styles.actionButtonTextDisabled
                ]}>
                  {activeSession.estadoActual === 'break' ? '✅ Finalizar Break' : '☕ Tomar Break'}
                </Text>
              </TouchableOpacity>

              {/* Botón Almuerzo */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: getSecondaryColor() },
                  activeSession.estadoActual === 'almuerzo' && styles.actionButtonActive,
                  (loading || activeSession.estadoActual === 'break' || activeSession.almuerzo?.fin) && styles.actionButtonDisabled
                ]}
                onPress={handleAlmuerzo}
                disabled={Boolean(loading || activeSession.estadoActual === 'break' || activeSession.almuerzo?.fin)}
              >
                <Text style={[
                  styles.actionButtonText,
                  (loading || activeSession.estadoActual === 'break' || activeSession.almuerzo?.fin) && styles.actionButtonTextDisabled
                ]}>
                  {activeSession.estadoActual === 'almuerzo' ? '✅ Finalizar Almuerzo' : '🍽️ Ir a Almuerzo'}
                </Text>
              </TouchableOpacity>

              {/* Botón Finalizar Jornada */}
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  styles.finalizarButton,
                  (loading || activeSession.estadoActual === 'break' || activeSession.estadoActual === 'almuerzo') && styles.actionButtonDisabled
                ]}
                onPress={handleFinalizarJornada}
                disabled={Boolean(loading || activeSession.estadoActual === 'break' || activeSession.estadoActual === 'almuerzo')}
              >
                <Text style={[
                  styles.actionButtonText, 
                  styles.finalizarButtonText,
                  (loading || activeSession.estadoActual === 'break' || activeSession.estadoActual === 'almuerzo') && styles.actionButtonTextDisabled
                ]}>
                  🏠 Finalizar Jornada
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SobrioCard>

        {/* Registro del Día - Diseño Sobrio */}
        <SobrioCard borderColor={getPrimaryColor()} style={{ marginTop: 16 }}>
          <OverlineText color={getPrimaryColor()}>
            📋 MI REGISTRO HOY
          </OverlineText>
          
          <View style={styles.registroItem}>
            <Text style={styles.registroLabel}>✅ Entrada</Text>
            <Text style={styles.registroValue}>{formatHora(activeSession?.entrada?.hora)}</Text>
          </View>

          {activeSession?.breaks && activeSession.breaks.length > 0 && (
            <>
              {activeSession.breaks.map((breakItem, index) => (
                <View key={index} style={styles.registroItem}>
                  <Text style={styles.registroLabel}>☕ Break {index + 1}</Text>
                  <Text style={styles.registroValue}>
                    {formatHora(breakItem.inicio)} - {breakItem.fin ? formatHora(breakItem.fin) : 'Activo'}
                    {breakItem.duracion && ` (${breakItem.duracion} min)`}
                  </Text>
                </View>
              ))}
            </>
          )}

          {activeSession?.almuerzo && (
            <View style={styles.registroItem}>
              <Text style={styles.registroLabel}>🍽️ Almuerzo</Text>
              <Text style={styles.registroValue}>
                {formatHora(activeSession.almuerzo.inicio)} - {activeSession.almuerzo.fin ? formatHora(activeSession.almuerzo.fin) : 'Activo'}
                {activeSession.almuerzo.duracion && ` (${activeSession.almuerzo.duracion} min)`}
              </Text>
            </View>
          )}

          {activeSession?.salida && (
            <View style={styles.registroItem}>
              <Text style={styles.registroLabel}>🏠 Salida</Text>
              <Text style={styles.registroValue}>{formatHora(activeSession.salida.hora)}</Text>
            </View>
          )}
        </SobrioCard>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={getPrimaryColor()} />
          </View>
        )}
      </ScrollView>

      {/* 💬 Botón flotante de Chat */}
      <TouchableOpacity 
        style={[styles.chatButton, { backgroundColor: getPrimaryColor() }]}
        onPress={() => navigation.navigate('Chat')}
        activeOpacity={0.8}
      >
        <Text style={styles.chatIcon}>💬</Text>
        {unreadCount > 0 && (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // ✅ Cambiado de flex-start a center para alinear verticalmente
    gap: 8, // ✅ Gap entre headerLeft y botón logout
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1, // ✅ Permite que ocupe el espacio necesario sin empujar el botón
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginRight: 8, // ✅ Margen derecho para evitar que el texto se pegue al botón
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  userName: {
    fontSize: 18, // ✅ Reducido de 20 a 18 para que quepa mejor
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
    flexShrink: 1, // ✅ Permite que el texto se ajuste si es muy largo
  },
  date: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // ✅ Fondo sutil para mejor visibilidad
    borderRadius: 8, // ✅ Diseño sobrio
    marginLeft: 8, // ✅ Separación del nombre
  },
  logoutIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // ✅ Estilos de card eliminados - ahora usa SobrioCard component
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  timerSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  infoGrid: {
    gap: 12, // ✅ Espaciado entre DetailRow components
    marginBottom: 24,
  },
  // ✅ Estilos infoItem, infoLabel, infoValue eliminados - ahora usa DetailRow component
  actions: {
    gap: 12,
  },
  actionButton: {
    // backgroundColor removido - se aplica dinámicamente desde theme
    paddingVertical: 16,
    borderRadius: 8, // ✅ Diseño sobrio - borderRadius: 1 (8px)
    alignItems: 'center',
    // ✅ Sombras sobrias - Nivel 2
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  actionButtonActive: {
    backgroundColor: '#ffa502', // Mantener para override en estados activos
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc', // ✅ Gris para botones deshabilitados
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonTextDisabled: {
    color: '#999', // ✅ Texto gris para deshabilitados
  },
  finalizarButton: {
    backgroundColor: '#ff4757',
  },
  finalizarButtonText: {
    color: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  registroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  registroLabel: {
    fontSize: 14,
    color: '#666',
  },
  registroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ✅ PASO 2.5: Botón flotante de chat
  chatButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chatIcon: {
    fontSize: 28,
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4757',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
