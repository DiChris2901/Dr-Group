import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  AppState,
  Dimensions
} from 'react-native';
import { 
  Text, 
  Surface, 
  FAB, 
  Portal, 
  Modal, 
  useTheme as usePaperTheme, 
  Avatar, 
  Chip,
  Button,
  IconButton
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useTheme } from '../../contexts/ThemeContext';
import RingChart from '../../components/RingChart';
import NovedadesScreen from '../novedades/NovedadesScreen'; // We will reuse logic but adapt UI later if needed

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const theme = usePaperTheme();
  const { isDarkMode, toggleDarkMode } = useTheme();
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
    signOut
  } = useAuth();
  
  const [tiempoTrabajado, setTiempoTrabajado] = useState('00:00:00');
  const [progress, setProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // ✅ Timer Logic
  useEffect(() => {
    const formatMs = (ms) => {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

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
  }, [activeSession]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh logic
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ✅ FAB Actions Logic
  const getFabActions = () => {
    if (!activeSession) return [];

    const actions = [];

    if (activeSession.estadoActual === 'trabajando') {
      // Verificar límite de breaks (Máximo 2)
      const breaksCount = activeSession.breaks ? activeSession.breaks.length : 0;
      
      if (breaksCount < 2) {
        actions.push({
          icon: 'coffee',
          label: `Tomar Break (${breaksCount}/2)`,
          onPress: () => registrarBreak(),
          style: { backgroundColor: theme.colors.tertiaryContainer },
        });
      } else {
        // Opción desactivada (Gris)
        actions.push({
          icon: 'coffee-off',
          label: 'Breaks Agotados',
          onPress: () => Alert.alert('Límite Alcanzado', 'Ya has tomado los 2 breaks permitidos por jornada.'),
          style: { backgroundColor: theme.colors.surfaceVariant },
          color: theme.colors.onSurfaceVariant,
        });
      }

      actions.push(
        {
          icon: 'food',
          label: 'Almorzar',
          onPress: () => registrarAlmuerzo(),
          style: { backgroundColor: theme.colors.secondaryContainer },
        },
        {
          icon: 'home-export-outline',
          label: 'Finalizar Jornada',
          onPress: () => finalizarJornada(),
          style: { backgroundColor: theme.colors.errorContainer },
        }
      );
    } else if (activeSession.estadoActual === 'break') {
      actions.push({
        icon: 'play',
        label: 'Volver del Break',
        onPress: () => finalizarBreak(),
        style: { backgroundColor: theme.colors.primary },
      });
    } else if (activeSession.estadoActual === 'almuerzo') {
      actions.push({
        icon: 'play',
        label: 'Volver del Almuerzo',
        onPress: () => finalizarAlmuerzo(),
        style: { backgroundColor: theme.colors.primary },
      });
    }

    return actions;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              Hola, {userProfile?.displayName?.split(' ')[0] || 'Usuario'}
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton 
              icon={isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"} 
              mode="contained-tonal"
              onPress={toggleDarkMode} 
            />
            <IconButton 
              icon="bell-outline" 
              mode="contained-tonal"
              onPress={() => navigation.navigate('Notifications')} 
            />
            <IconButton 
              icon="logout" 
              mode="contained-tonal"
              iconColor={theme.colors.error}
              onPress={() => {
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
        </View>

        {/* Ring Chart Section */}
        <View style={styles.chartContainer}>
          <RingChart 
            progress={progress} 
            label={tiempoTrabajado}
            subLabel={activeSession?.estadoActual === 'trabajando' ? 'Tiempo Trabajado' : activeSession?.estadoActual?.toUpperCase() || 'INACTIVO'}
            color={
              activeSession?.estadoActual === 'break' ? theme.colors.tertiary :
              activeSession?.estadoActual === 'almuerzo' ? theme.colors.secondary :
              theme.colors.primary
            }
          />
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Avatar.Icon size={40} icon="clock-start" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
            <View style={styles.statText}>
              <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>Entrada</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {activeSession?.entrada?.hora ? 
                  (activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora))
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--'}
              </Text>
            </View>
          </Surface>

          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Avatar.Icon size={40} icon="clock-end" style={{ backgroundColor: theme.colors.errorContainer }} color={theme.colors.error} />
            <View style={styles.statText}>
              <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>Salida</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {activeSession?.salida?.hora ? 
                  (activeSession.salida.hora.toDate ? activeSession.salida.hora.toDate() : new Date(activeSession.salida.hora))
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--'}
              </Text>
            </View>
          </Surface>
        </View>

        {/* Novedades Button */}
        <Surface style={[styles.actionCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
          <View style={styles.actionContent}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSecondaryContainer }}>
              ¿Alguna Novedad?
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              Reporta llegadas tarde, permisos o incapacidades.
            </Text>
          </View>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Novedades')}
            style={{ borderRadius: 12 }}
          >
            Reportar
          </Button>
        </Surface>

      </ScrollView>

      {/* Floating Action Button Group or Single Start Button */}
      {!activeSession ? (
        <View style={{ position: 'absolute', bottom: 90, right: 16 }}>
          <Button
            mode="contained"
            icon="login"
            onPress={() => iniciarJornada()}
            style={{ borderRadius: 16, height: 56, justifyContent: 'center' }}
            contentStyle={{ height: 56, paddingHorizontal: 8 }}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          >
            INICIAR
          </Button>
        </View>
      ) : (
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'menu'}
          actions={getFabActions()}
          onStateChange={({ open }) => setFabOpen(open)}
          onPress={() => {
            if (fabOpen) {
              // do something if the speed dial is open
            }
          }}
          style={styles.fab}
          fabStyle={{ backgroundColor: theme.colors.primaryContainer }}
        />
      )}

      {/* Novedades Bottom Sheet Modal - REMOVED in favor of navigation */}
      {/* <Portal> ... </Portal> */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
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
  actionCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
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
  }
});

