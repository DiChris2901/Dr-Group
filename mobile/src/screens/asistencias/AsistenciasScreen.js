import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
  ScrollView
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
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { SobrioCard, DetailRow, OverlineText } from '../../components';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AsistenciasScreen({ navigation }) {
  const { userProfile, user } = useAuth();
  const theme = useTheme();
  
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
      
      // Filtrar y ordenar en cliente para usuarios normales
      if (userProfile?.role !== 'ADMIN' && userProfile?.role !== 'SUPER_ADMIN') {
        asistenciasData = asistenciasData
          .sort((a, b) => {
            const dateCompare = b.fecha.localeCompare(a.fecha);
            if (dateCompare !== 0) return dateCompare;
            
            const timeA = a.entrada?.hora?.toMillis ? a.entrada.hora.toMillis() : 0;
            const timeB = b.entrada?.hora?.toMillis ? b.entrada.hora.toMillis() : 0;
            return timeB - timeA;
          });
      }
      
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
    
    let statusColor = theme.colors.error;
    let statusLabel = 'INCOMPLETO';
    let statusIcon = 'alert-circle-outline';

    if (isCompleted) {
      statusColor = theme.colors.primary; // Verde/Primary para completado
      statusLabel = 'COMPLETADO';
      statusIcon = 'check-circle-outline';
    } else if (isWorking) {
      statusColor = theme.colors.tertiary; // Naranja/Tertiary para en curso
      statusLabel = 'EN CURSO';
      statusIcon = 'clock-outline';
    }

    return (
      <SobrioCard 
        onPress={() => handleItemPress(item)}
        style={{ marginBottom: 12 }}
        variant={isCompleted ? 'surface' : 'outlined'}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            {user.photoURL ? (
              <Avatar.Image size={32} source={{ uri: user.photoURL }} style={{ marginRight: 10 }} />
            ) : (
              <Avatar.Text size={32} label={(user.name || 'U').charAt(0)} style={{ marginRight: 10, backgroundColor: theme.colors.primaryContainer }} />
            )}
            <View>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                {format(new Date(item.fecha), "EEEE d 'de' MMMM", { locale: es })}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                {user.name || 'Usuario'}
              </Text>
            </View>
          </View>
          <Chip 
            icon={statusIcon} 
            style={{ backgroundColor: statusColor + '20' }} 
            textStyle={{ color: statusColor, fontSize: 10, fontWeight: 'bold' }}
            compact
          >
            {statusLabel}
          </Chip>
        </View>

        <Divider style={{ marginVertical: 12 }} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <OverlineText style={{ color: theme.colors.secondary }}>Entrada</OverlineText>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{formatTime(item.entrada?.hora)}</Text>
          </View>
          <View style={styles.statItem}>
            <OverlineText style={{ color: theme.colors.secondary }}>Salida</OverlineText>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{formatTime(item.salida?.hora)}</Text>
          </View>
          <View style={styles.statItem}>
            <OverlineText style={{ color: theme.colors.secondary }}>Total</OverlineText>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              {item.horasTrabajadas || '--:--'}
            </Text>
          </View>
        </View>
      </SobrioCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
          Historial
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
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
                <Ionicons name="time-outline" size={64} color={theme.colors.outline} />
                <Text variant="bodyLarge" style={{ color: theme.colors.secondary, marginTop: 16 }}>
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
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalContent, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <View style={styles.modalHeader}>
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
                    value={format(new Date(selectedAsistencia.fecha), "EEEE d 'de' MMMM, yyyy", { locale: es })} 
                    iconColor={theme.colors.primary}
                  />
                </SobrioCard>

                <View style={styles.rowContainer}>
                  {/* Entry */}
                  <View style={[styles.timeCard, { backgroundColor: theme.colors.secondaryContainer + '30', marginRight: 8 }]}>
                    <View style={styles.timeCardHeader}>
                      <Ionicons name="log-in" size={20} color={theme.colors.secondary} />
                      <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginLeft: 8, fontWeight: 'bold' }}>ENTRADA</Text>
                    </View>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginTop: 4, color: theme.colors.onSurface }}>
                      {selectedAsistencia.entrada?.hora ? format(selectedAsistencia.entrada.hora.toDate(), 'h:mm a') : '--:--'}
                    </Text>
                  </View>

                  {/* Exit */}
                  <View style={[styles.timeCard, { backgroundColor: theme.colors.tertiaryContainer + '30', marginLeft: 8 }]}>
                    <View style={styles.timeCardHeader}>
                      <Ionicons name="log-out" size={20} color={theme.colors.tertiary} />
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
                  <Ionicons name="timer" size={28} color={theme.colors.primary} />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sheetContainer: {
    flex: 1,
    marginTop: 10,
    overflow: 'hidden',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
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
    borderRadius: 16,
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
