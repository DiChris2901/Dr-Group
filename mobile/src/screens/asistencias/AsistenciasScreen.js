import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  Animated,
  ScrollView,
  Linking
} from 'react-native';
import { 
  Text, 
  useTheme, 
  ActivityIndicator, 
  IconButton,
  Surface,
  Chip,
  Avatar,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { SobrioCard, DetailRow, OverlineText } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';

const { width, height } = Dimensions.get('window');

export default function AsistenciasScreen({ navigation }) {
  const { userProfile, user } = useAuth();
  const theme = useTheme();
  
  // 🎨 Material You Expressive: Surface colors para profundidad (no sombras)
  const surfaceColors = theme.dark 
    ? materialTheme.schemes.dark 
    : materialTheme.schemes.light;
    
  const dynamicStyles = {
    container: { backgroundColor: surfaceColors.background },
    surfaceContainerLow: { backgroundColor: surfaceColors.surfaceContainerLow },
    surfaceContainer: { backgroundColor: surfaceColors.surfaceContainer },
    text: { color: surfaceColors.onSurface },
    textSecondary: { color: surfaceColors.onSurfaceVariant },
    primary: { color: surfaceColors.primary },
    modalOverlay: { backgroundColor: theme.dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' },
    modalSurface: { backgroundColor: surfaceColors.surface }
  };
  
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  
  // Modal State
  const [selectedAsistencia, setSelectedAsistencia] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(height * 0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (userProfile) {
      cargarAsistencias();
    }
  }, [userProfile]);

  const cargarUsuarios = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userMap = {};
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        userMap[doc.id] = {
          uid: doc.id,
          name: userData.name || userData.displayName || userData.email,
          photoURL: userData.photoURL
        };
      });
      setUsersMap(userMap);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      
      let q;
      
      if (userProfile?.role !== 'ADMIN' && userProfile?.role !== 'SUPER_ADMIN') {
        const targetUid = userProfile?.uid || user?.uid;
        if (!targetUid) {
          setLoading(false);
          return;
        }
        q = query(
          collection(db, 'asistencias'),
          where('uid', '==', targetUid)
        );
      } else {
        q = query(
          collection(db, 'asistencias'),
          orderBy('fecha', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      
      let asistenciasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // ✅ Ordenar SIEMPRE por createdAt (fuente de verdad más precisa)
      asistenciasData = asistenciasData.sort((a, b) => {
        // 1. Obtener timestamp de creación o entrada
        const timeA = a.createdAt?.toMillis?.() || a.entrada?.hora?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || b.entrada?.hora?.toMillis?.() || 0;
        
        // 2. Ordenar descendente (más reciente primero)
        return timeB - timeA;
      });
      
      setAsistencias(asistenciasData);
    } catch (error) {
      console.error('Error cargando asistencias:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarAsistencias();
  };

  const handleItemPress = (item) => {
    setSelectedAsistencia(item);
    setModalVisible(true);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'h:mm a');
  };

  const AsistenciaItem = ({ item, index }) => {
    const user = usersMap[item.uid] || {};
    const isCompleted = !!item.salida;
    const isWorking = item.estadoActual === 'trabajando' || item.estadoActual === 'break' || item.estadoActual === 'almuerzo';
    
    let statusColor = surfaceColors.error;
    let statusLabel = 'INCOMPLETO';
    let statusIcon = 'alert-circle';

    if (isCompleted) {
      statusColor = surfaceColors.primary;
      statusLabel = 'COMPLETADO';
      statusIcon = 'check-circle';
    } else if (isWorking) {
      statusColor = surfaceColors.tertiary;
      statusLabel = 'EN CURSO';
      statusIcon = 'clock';
    }

    const handlePress = () => {
      Haptics.selectionAsync(); // ✅ Feedback táctil
      handleItemPress(item);
    };

    return (
      <Pressable
        onPress={handlePress}
        android_ripple={{ 
          color: surfaceColors.primary + '1F'  // ✅ Ripple tintado (12% opacidad)
        }}
        style={({ pressed }) => [
          styles.expressiveCard,
          {
            backgroundColor: pressed 
              ? surfaceColors.surfaceContainer  // ✅ Pressed state con surface color
              : surfaceColors.surfaceContainerLow,
            marginBottom: 20,  // ✅ Espaciado generoso (12→20)
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            {user.photoURL ? (
              <Avatar.Image size={40} source={{ uri: user.photoURL }} style={{ marginRight: 12 }} />
            ) : (
              <Avatar.Text 
                size={40} 
                label={(user.name || 'U').charAt(0)} 
                style={{ 
                  marginRight: 12, 
                  backgroundColor: surfaceColors.primaryContainer 
                }} 
              />
            )}
            <View>
              <Text 
                variant="titleMedium" 
                style={{ 
                  fontWeight: '600',
                  color: surfaceColors.onSurface,
                  letterSpacing: -0.25  // ✅ Tight letter spacing
                }}
              >
                {format(parseISO(item.fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </Text>
              <Text variant="bodySmall" style={{ color: surfaceColors.secondary }}>
                {user.name || 'Usuario'}
              </Text>
            </View>
          </View>
          <View 
            style={[
              styles.statusChip,
              { backgroundColor: statusColor + '20' }
            ]}
          >
            <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />
            <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700', marginLeft: 4 }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Entrada
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: '600', color: surfaceColors.onSurface, marginTop: 4 }}>
              {formatTime(item.entrada?.hora)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Salida
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: '600', color: surfaceColors.onSurface, marginTop: 4 }}>
              {formatTime(item.salida?.hora)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Total
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: surfaceColors.primary, marginTop: 4 }}>
              {item.horasTrabajadas || '--:--'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text 
          variant="headlineMedium" 
          style={{ 
            fontWeight: '500', 
            color: surfaceColors.onSurface,
            letterSpacing: -0.25,  // ✅ Tight spacing
            // ✅ Width Axis 110% se aplicará con Roboto Flex
          }}
        >
          Historial
        </Text>
        <Text variant="titleMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
          Registro de Asistencias
        </Text>
      </View>

      <Animated.View style={[
        styles.sheetContainer,
        {
          backgroundColor: theme.colors.background,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <FlatList
          data={asistencias}
          renderItem={({ item, index }) => <AsistenciaItem item={item} index={index} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="clock-outline" size={64} color={surfaceColors.outline} />
                <Text variant="titleMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 20, textAlign: 'center' }}>
                  No hay registros disponibles
                </Text>
              </View>
            )
          }
        />
      </Animated.View>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, dynamicStyles.modalOverlay]}>
          <Surface style={[styles.modalContent, dynamicStyles.modalSurface]} elevation={4}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.surfaceVariant }]}>
              <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Detalle de Asistencia</Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>
            
            {selectedAsistencia && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <SobrioCard variant="outlined" style={{ marginBottom: 16 }}>
                  <View style={{ marginBottom: 12 }}>
                    <DetailRow 
                      icon="person" 
                      label="Usuario" 
                      value={usersMap[selectedAsistencia.uid]?.name || 'Usuario'} 
                      iconColor={theme.colors.primary}
                    />
                  </View>
                  <DetailRow 
                    icon="calendar" 
                    label="Fecha" 
                    value={format(parseISO(selectedAsistencia.fecha + 'T12:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })} 
                    iconColor={theme.colors.primary}
                  />
                </SobrioCard>

                {/* Ubicación y Modalidad - SOLO ADMIN */}
                {(userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') && selectedAsistencia.entrada?.ubicacion && (
                  <SobrioCard variant="outlined" style={{ marginBottom: 16 }}>
                    <OverlineText style={{ marginBottom: 12 }}>INFORMACIÓN DE CONEXIÓN</OverlineText>
                    
                    {/* Modalidad */}
                    <View style={{ marginBottom: 12 }}>
                      <DetailRow 
                        icon="wifi" 
                        label="Modalidad" 
                        value={selectedAsistencia.entrada.ubicacion.tipo || 'Remoto'} 
                        iconColor={selectedAsistencia.entrada.ubicacion.tipo === 'Oficina' ? theme.colors.primary : theme.colors.warning}
                        highlight={selectedAsistencia.entrada.ubicacion.tipo === 'Oficina'}
                        highlightColor={theme.colors.primary}
                      />
                    </View>

                    {/* Ubicación GPS */}
                    {selectedAsistencia.entrada.ubicacion.lat && selectedAsistencia.entrada.ubicacion.lon && (
                      <TouchableOpacity
                        onPress={() => {
                          const lat = selectedAsistencia.entrada.ubicacion.lat;
                          const lon = selectedAsistencia.entrada.ubicacion.lon;
                          const url = `https://www.google.com/maps?q=${lat},${lon}`;
                          Linking.openURL(url);
                        }}
                      >
                        <DetailRow 
                          icon="location" 
                          label="Ver Ubicación" 
                          value={`${selectedAsistencia.entrada.ubicacion.lat.toFixed(6)}, ${selectedAsistencia.entrada.ubicacion.lon.toFixed(6)}`}
                          iconColor={theme.colors.info}
                        />
                      </TouchableOpacity>
                    )}

                    {/* Dispositivo */}
                    {selectedAsistencia.entrada.dispositivo && (
                      <View style={{ marginTop: 12 }}>
                        <DetailRow 
                          icon="phone-portrait" 
                          label="Dispositivo" 
                          value={selectedAsistencia.entrada.dispositivo} 
                          iconColor={theme.colors.secondary}
                        />
                      </View>
                    )}
                  </SobrioCard>
                )}

                <View style={styles.rowContainer}>
                  {/* Entry */}
                  <View style={[styles.timeCard, { backgroundColor: theme.colors.secondaryContainer + '30', marginRight: 8 }]}>
                    <View style={styles.timeCardHeader}>
                      <MaterialCommunityIcons name="login" size={20} color={theme.colors.secondary} />
                      <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginLeft: 8, fontWeight: 'bold' }}>ENTRADA</Text>
                    </View>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginTop: 4, color: theme.colors.onSurface }}>
                      {selectedAsistencia.entrada?.hora ? format(selectedAsistencia.entrada.hora.toDate(), 'h:mm a') : '--:--'}
                    </Text>
                  </View>

                  {/* Exit */}
                  <View style={[styles.timeCard, { backgroundColor: theme.colors.tertiaryContainer + '30', marginLeft: 8 }]}>
                    <View style={styles.timeCardHeader}>
                      <MaterialCommunityIcons name="logout" size={20} color={theme.colors.tertiary} />
                      <Text variant="labelMedium" style={{ color: theme.colors.tertiary, marginLeft: 8, fontWeight: 'bold' }}>SALIDA</Text>
                    </View>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginTop: 4, color: theme.colors.onSurface }}>
                      {selectedAsistencia.salida?.hora ? format(selectedAsistencia.salida.hora.toDate(), 'h:mm a') : '--:--'}
                    </Text>
                  </View>
                </View>

                {/* Breaks */}
                {selectedAsistencia.breaks && selectedAsistencia.breaks.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <OverlineText style={{ marginBottom: 12 }}>Breaks</OverlineText>
                    {selectedAsistencia.breaks.map((b, i) => (
                      <View key={i} style={{ marginBottom: 12 }}>
                        <DetailRow 
                          icon="cafe" 
                          label={`Break ${i + 1}`}
                          value={`${b.inicio ? format(b.inicio.toDate(), 'h:mm a') : '--'} - ${b.fin ? format(b.fin.toDate(), 'h:mm a') : 'En curso'}`}
                          iconColor={theme.colors.tertiary}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* Lunch */}
                {selectedAsistencia.almuerzo && (
                  <View style={{ marginTop: 16 }}>
                    <OverlineText style={{ marginBottom: 8 }}>Almuerzo</OverlineText>
                    <DetailRow 
                      icon="restaurant" 
                      label="Hora de Almuerzo"
                      value={`${selectedAsistencia.almuerzo.inicio ? format(selectedAsistencia.almuerzo.inicio.toDate(), 'h:mm a') : '--'} - ${selectedAsistencia.almuerzo.fin ? format(selectedAsistencia.almuerzo.fin.toDate(), 'h:mm a') : 'En curso'}`}
                      iconColor={theme.colors.tertiary}
                    />
                  </View>
                )}

                <Divider style={{ marginVertical: 20 }} />

                <View style={[styles.totalRow, { backgroundColor: theme.colors.primaryContainer + '30' }]}>
                  <MaterialCommunityIcons name="timer" size={28} color={theme.colors.primary} />
                  <View style={styles.detailTextContainer}>
                    <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>TIEMPO TOTAL</Text>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                      {selectedAsistencia.horasTrabajadas || '--:--:--'}
                    </Text>
                  </View>
                </View>

              </ScrollView>
            )}
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,  // ✅ Espaciado generoso (24→20)
    paddingTop: 24,
    paddingBottom: 16,
  },
  sheetContainer: {
    flex: 1,
    marginTop: 10,
    overflow: 'hidden',
  },
  listContent: {
    padding: 20,  // ✅ Espaciado generoso (16→20)
    paddingBottom: 100,
  },
  // ✅ Expressive Card (border radius 24px, elevation 0)
  expressiveCard: {
    borderRadius: 24,  // ✅ Orgánico (16→24)
    padding: 20,  // ✅ Generoso (16→20)
    elevation: 0,  // ✅ Tonal elevation
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,  // ✅ Espaciado generoso
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,  // ✅ Orgánico
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  statItem: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  // Modal Styles (Expressive)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,  // ✅ Orgánico (24→32)
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingBottom: 30,
    elevation: 0,  // ✅ Tonal elevation
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalBody: {
    padding: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,  // ✅ Orgánico
  },
  detailTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  timeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});
