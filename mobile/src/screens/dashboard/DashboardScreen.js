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
import { useNotifications } from '../../contexts/NotificationsContext';
import { LinearGradient } from 'expo-linear-gradient';
import SobrioCard from '../../components/SobrioCard';
import DetailRow from '../../components/DetailRow';
import OverlineText from '../../components/OverlineText';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, userProfile, activeSession, signOut, registrarBreak, finalizarBreak, registrarAlmuerzo, finalizarAlmuerzo, finalizarJornada } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  const { scheduleNotification, cancelNotification } = useNotifications();
  const [tiempoTrabajado, setTiempoTrabajado] = useState('00:00:00');
  const [tiempoDescanso, setTiempoDescanso] = useState('00:00:00'); // ✅ Contador de break/almuerzo
  const [loading, setLoading] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const WORK_SESSION_NOTIFICATION_ID = 'work-session-notification'; // ✅ ID fijo para sobreescribir

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

  // ✅ Función helper para actualizar notificación de jornada
  const updateWorkSessionNotification = async (estadoActual, tiempoActual) => {
    try {
      if (!activeSession) return;

      // Formatear hora de entrada
      const entradaDate = activeSession.entrada.hora.toDate 
        ? activeSession.entrada.hora.toDate() 
        : new Date(activeSession.entrada.hora);
      const horaEntrada = entradaDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      // Determinar mensaje según estado
      let titulo = '🕐 Jornada Laboral Activa';
      let cuerpo = '';

      switch (estadoActual) {
        case 'trabajando':
          cuerpo = `Entrada: ${horaEntrada}\nTiempo trabajado: ${tiempoActual}\nEstado: Trabajando 💼`;
          break;
        case 'break':
          const breakActual = activeSession.breaks?.[activeSession.breaks.length - 1];
          const inicioBreak = breakActual?.inicio?.toDate 
            ? breakActual.inicio.toDate() 
            : new Date(breakActual?.inicio || Date.now());
          const horaBreak = inicioBreak.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
          cuerpo = `Break iniciado: ${horaBreak}\nTiempo trabajado: ${tiempoActual}\nEstado: En Break ☕`;
          break;
        case 'almuerzo':
          const inicioAlmuerzo = activeSession.almuerzo?.inicio?.toDate 
            ? activeSession.almuerzo.inicio.toDate() 
            : new Date(activeSession.almuerzo?.inicio || Date.now());
          const horaAlmuerzo = inicioAlmuerzo.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
          cuerpo = `Almuerzo iniciado: ${horaAlmuerzo}\nTiempo trabajado: ${tiempoActual}\nEstado: Almorzando 🍽️`;
          break;
        default:
          cuerpo = `Entrada: ${horaEntrada}\nTiempo trabajado: ${tiempoActual}`;
      }

      // ✅ Crear/actualizar notificación con ID fijo (sobreescribe automáticamente)
      await Notifications.scheduleNotificationAsync({
        identifier: WORK_SESSION_NOTIFICATION_ID, // ID fijo - sobreescribe
        content: {
          title: titulo,
          body: cuerpo,
          data: { type: 'work-session' },
          sound: false,
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Inmediato
      });

      console.log(`✅ Notificación actualizada: ${estadoActual}`);
    } catch (error) {
      console.error('❌ Error actualizando notificación:', error);
    }
  };

  // ✅ Actualizar notificación cuando cambia el estado de la sesión
  useEffect(() => {
    if (!activeSession || activeSession.estadoActual === 'finalizado' || finalizando) {
      // Cancelar notificación si no hay sesión activa
      Notifications.cancelScheduledNotificationAsync(WORK_SESSION_NOTIFICATION_ID).catch(() => {});
      Notifications.dismissNotificationAsync(WORK_SESSION_NOTIFICATION_ID).catch(() => {});
      return;
    }

    // Actualizar notificación inmediatamente al cambiar estado
    updateWorkSessionNotification(activeSession.estadoActual, tiempoTrabajado);

    // Cleanup al desmontar
    return () => {
      if (activeSession?.estadoActual === 'finalizado') {
        Notifications.dismissNotificationAsync(WORK_SESSION_NOTIFICATION_ID).catch(() => {});
      }
    };
  }, [activeSession?.estadoActual]); // ✅ Solo cuando cambia el estado (trabajando, break, almuerzo)

  // ✅ Actualizar notificación periódicamente con el tiempo trabajado (cada 30 segundos)
  useEffect(() => {
    if (!activeSession || activeSession.estadoActual === 'finalizado' || finalizando) return;

    const interval = setInterval(() => {
      updateWorkSessionNotification(activeSession.estadoActual, tiempoTrabajado);
    }, 30000); // 30 segundos - balance entre actualización y performance

    return () => clearInterval(interval);
  }, [activeSession, tiempoTrabajado, finalizando]); // ✅ Se actualiza cuando cambia el tiempo

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
                
                // ✅ Mostrar notificación final con resumen
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: '✅ Jornada Finalizada',
                    body: `Total trabajado: ${tiempoTrabajado}\n¡Buen trabajo! 🎉`,
                    data: { type: 'work-session-complete' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null,
                });
                
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
              
              // ✅ Mostrar notificación final con resumen
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: '✅ Jornada Finalizada',
                  body: `Total trabajado: ${tiempoTrabajado}\n¡Buen trabajo! 🎉`,
                  data: { type: 'work-session-complete' },
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
              });
              
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
        {/* ✅ VISTA PARA ADMIN/SUPER_ADMIN - Solo panel administrativo */}
        {(userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') ? (
          <>
            {/* Panel de Administración */}
            <SobrioCard borderColor={getSecondaryColor()}>
              <OverlineText color={getSecondaryColor()}>
                PANEL DE ADMINISTRACIÓN
              </OverlineText>
              <Text style={styles.welcomeTitle}>Bienvenido, Administrador</Text>
              <Text style={styles.welcomeText}>
                Como administrador, tienes acceso completo al sistema de gestión de asistencias y reportes.
              </Text>

              <View style={styles.adminInfo}>
                <DetailRow
                  icon="👤"
                  label="Rol"
                  value={userProfile?.role || 'N/A'}
                  iconColor={getPrimaryColor()}
                  highlight
                />
                <DetailRow
                  icon="📧"
                  label="Email"
                  value={user?.email || 'N/A'}
                  iconColor={getSecondaryColor()}
                />
                <DetailRow
                  icon="📅"
                  label="Fecha"
                  value={new Date().toLocaleDateString('es-CO', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  iconColor="#4caf50"
                />
              </View>
            </SobrioCard>

            {/* Accesos Rápidos Administrativos */}
            <SobrioCard style={{ marginTop: 16 }}>
              <OverlineText color={getPrimaryColor()}>
                ACCESOS RÁPIDOS
              </OverlineText>
              <Text style={styles.cardTitle}>Gestión del Sistema</Text>
              
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2196f3' }]}
                  onPress={() => navigation.navigate('Asistencias')}
                >
                  <Text style={styles.actionButtonText}>👥 Ver Todas las Asistencias</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
                  onPress={() => navigation.navigate('Reportes')}
                >
                  <Text style={styles.actionButtonText}>📊 Ver Reportes y Estadísticas</Text>
                </TouchableOpacity>
              </View>
            </SobrioCard>

            {/* Información adicional */}
            <SobrioCard style={{ marginTop: 16 }}>
              <OverlineText color="#ff9800">
                INFORMACIÓN
              </OverlineText>
              <Text style={styles.infoTitle}>ℹ️ Nota Importante</Text>
              <Text style={styles.infoText}>
                Los administradores no requieren registrar jornadas laborales. 
                Tu función principal es supervisar y gestionar las asistencias del equipo.
              </Text>
            </SobrioCard>
          </>
        ) : (
          <>
            {/* ✅ VISTA PARA USER - Control de jornada laboral completo */}
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
          </>
        )}
        {/* ✅ FIN: Renderizado condicional según rol */}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={getPrimaryColor()} />
          </View>
        )}
      </ScrollView>

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
    paddingVertical: 18, // 🎨 Material 3 padding (↑ de 16px)
    borderRadius: 28, // 🎨 Material 3 Extra Large (↑ de 8px)
    alignItems: 'center',
    // 🎨 Material 3 Elevation Level 2
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6, // ↑ de 4
    },
    shadowOpacity: 0.14, // ↑ de 0.08
    shadowRadius: 16, // ↑ de 12px
    elevation: 5, // ↑ de 3
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
    fontSize: 20, // 🎨 Material 3 Title Medium (↑ de 18px)
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20, // 🎨 Material 3 spacing (↑ de 16px)
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
  // ✅ Estilos para vista de administrador
  welcomeTitle: {
    fontSize: 24, // 🎨 Material 3 Headline Small (↑ de 22px)
    fontWeight: '700',
    color: '#333',
    marginTop: 16, // 🎨 Material 3 spacing (↑ de 12px)
    marginBottom: 12, // 🎨 Material 3 spacing (↑ de 8px)
    letterSpacing: 0.3, // 🎨 Material 3 tracking (nuevo)
  },
  welcomeText: {
    fontSize: 15, // 🎨 Material 3 Body Medium (↑ de 14px)
    color: '#666',
    lineHeight: 22, // 🎨 Material 3 line-height (↑ de 20)
    marginBottom: 20, // 🎨 Material 3 spacing (↑ de 16px)
  },
  adminInfo: {
    gap: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
