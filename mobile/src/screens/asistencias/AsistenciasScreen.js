import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Animated,
  Easing,
  Platform,
  FlatList,
  Modal,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const { width, height } = Dimensions.get('window');

export default function AsistenciasScreen({ navigation }) {
  const { userProfile, user } = useAuth();
  const { getGradient, getPrimaryColor } = useTheme();
  
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
        easing: Easing.out(Easing.exp),
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
      console.log('🔄 Iniciando carga de asistencias. Perfil:', userProfile.email);
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
      const fechaInicio = startOfMonth(new Date());
      const fechaInicioStr = format(fechaInicio, 'yyyy-MM-dd');
      
      let q;
      
      // ✅ Simplificar query para evitar necesidad de índice compuesto
      if (userProfile?.role !== 'ADMIN' && userProfile?.role !== 'SUPER_ADMIN') {
        const targetUid = userProfile?.uid || user?.uid;
        
        if (!targetUid) {
          console.log('❌ No hay UID de usuario (ni en perfil ni en auth)');
          setLoading(false);
          return;
        }
        // Solo filtrar por uid, ordenar en cliente
        console.log('🔍 Buscando asistencias para UID:', targetUid);
        q = query(
          collection(db, 'asistencias'),
          where('uid', '==', targetUid)
        );
      } else {
        // Admins ven todas las asistencias (sin filtro de fecha para debug)
        console.log('🔍 Admin buscando todas las asistencias');
        q = query(
          collection(db, 'asistencias'),
          orderBy('fecha', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      console.log('✅ Asistencias encontradas:', querySnapshot.size);
      
      let asistenciasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // ✅ Filtrar y ordenar en cliente para usuarios normales
      if (userProfile?.role !== 'ADMIN' && userProfile?.role !== 'SUPER_ADMIN') {
        asistenciasData = asistenciasData
          .sort((a, b) => {
            // Ordenar por fecha descendente
            const dateCompare = b.fecha.localeCompare(a.fecha);
            if (dateCompare !== 0) return dateCompare;
            
            // Si es la misma fecha, ordenar por hora de entrada descendente
            // Convertir Timestamp a milisegundos para comparar
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

  const openMap = (lat, lon) => {
    if (!lat || !lon) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url);
  };

  const handleItemPress = (item) => {
    setSelectedAsistencia(item);
    setModalVisible(true);
  };

  const AsistenciaItem = ({ item, index }) => {
    const user = usersMap[item.uid] || {};
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const formatTime = (timestamp) => {
      if (!timestamp) return '--:--';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'h:mm a');
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{(user.name || 'U').charAt(0)}</Text>
                </View>
              )}
              <View>
                <Text style={styles.userName}>{user.name || 'Usuario'}</Text>
                <Text style={styles.dateText}>
                  {format(new Date(item.fecha), "EEEE d 'de' MMMM", { locale: es })}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.salida ? '#e1fcef' : '#fff3cd' }]}>
              <Text style={[styles.statusText, { color: item.salida ? '#0ca678' : '#f59f00' }]}>
                {item.salida ? 'COMPLETADO' : 'EN CURSO'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ENTRADA</Text>
              <Text style={styles.statValue}>{formatTime(item.entrada?.hora)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SALIDA</Text>
              <Text style={styles.statValue}>{formatTime(item.salida?.hora)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TOTAL</Text>
              <Text style={styles.statValue}>{item.horasTrabajadas || '--:--'}</Text>
            </View>
          </View>
        </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradient()}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Historial</Text>
          <Text style={styles.headerSubtitle}>Registro de Asistencias</Text>
        </View>
      </LinearGradient>

      <Animated.View style={[
        styles.sheetContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
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
              colors={[getPrimaryColor()]}
              tintColor={getPrimaryColor()}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <MaterialIcons name="history" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay registros este mes</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de Asistencia</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {selectedAsistencia && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* User Info */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={24} color={getPrimaryColor()} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Usuario</Text>
                    <Text style={styles.detailValue}>
                      {usersMap[selectedAsistencia.uid]?.name || 'Usuario'}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={24} color={getPrimaryColor()} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Fecha</Text>
                    <Text style={styles.detailValue}>
                      {format(new Date(selectedAsistencia.fecha), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Entry */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="login" size={24} color="#2e7d32" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Hora de Entrada</Text>
                    <Text style={styles.detailValue}>
                      {selectedAsistencia.entrada?.hora ? format(selectedAsistencia.entrada.hora.toDate(), 'h:mm:ss a') : '--:--'}
                    </Text>
                  </View>
                </View>

                {/* Location - Oculto para el usuario */}
                {/* {selectedAsistencia.entrada?.ubicacion && (
                  <TouchableOpacity 
                    style={styles.locationButton}
                    onPress={() => openMap(selectedAsistencia.entrada.ubicacion.lat, selectedAsistencia.entrada.ubicacion.lon)}
                  >
                    <MaterialIcons name="place" size={24} color="#d32f2f" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Ubicación de Entrada</Text>
                      <Text style={[styles.detailValue, { color: '#1976d2', textDecorationLine: 'underline' }]}>
                        {selectedAsistencia.entrada.ubicacion.tipo || 'Ver en Mapa'}
                      </Text>
                      <Text style={styles.coordsText}>
                        Toca para abrir en Maps
                      </Text>
                    </View>
                  </TouchableOpacity>
                )} */}

                {/* Breaks */}
                {selectedAsistencia.breaks && selectedAsistencia.breaks.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Breaks</Text>
                    {selectedAsistencia.breaks.map((b, i) => (
                      <View key={i} style={styles.subDetailRow}>
                        <MaterialIcons name="coffee" size={18} color="#f57c00" />
                        <Text style={styles.subDetailText}>
                          {b.inicio ? format(b.inicio.toDate(), 'h:mm a') : '--'} - {b.fin ? format(b.fin.toDate(), 'h:mm a') : 'En curso'}
                          {b.duracion ? ` (${b.duracion})` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Lunch */}
                {selectedAsistencia.almuerzo && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Almuerzo</Text>
                    <View style={styles.subDetailRow}>
                      <MaterialIcons name="restaurant" size={18} color="#f57c00" />
                      <Text style={styles.subDetailText}>
                        {selectedAsistencia.almuerzo.inicio ? format(selectedAsistencia.almuerzo.inicio.toDate(), 'h:mm a') : '--'} - 
                        {selectedAsistencia.almuerzo.fin ? format(selectedAsistencia.almuerzo.fin.toDate(), 'h:mm a') : 'En curso'}
                        {selectedAsistencia.almuerzo.duracion ? ` (${selectedAsistencia.almuerzo.duracion})` : ''}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                {/* Exit */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="logout" size={24} color="#c62828" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Hora de Salida</Text>
                    <Text style={styles.detailValue}>
                      {selectedAsistencia.salida?.hora ? format(selectedAsistencia.salida.hora.toDate(), 'h:mm:ss a') : '--:--'}
                    </Text>
                  </View>
                </View>

                {/* Total Worked */}
                <View style={[styles.detailRow, styles.totalRow]}>
                  <MaterialIcons name="timer" size={28} color={getPrimaryColor()} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Tiempo Total Trabajado</Text>
                    <Text style={[styles.detailValue, { fontSize: 20, fontWeight: 'bold', color: getPrimaryColor() }]}>
                      {selectedAsistencia.horasTrabajadas || '--:--:--'}
                    </Text>
                  </View>
                </View>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGradient: {
    height: height * 0.30, // Aumentado para evitar que se corte el título
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28, // Reducido ligeramente para diseño más sobrio
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -50, // Ajustado para mejor integración
    overflow: 'hidden',
  },
  listContent: {
    padding: 16, // Reducido de 20
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20, // Reducido de 24
    marginBottom: 12, // Reducido de 16
    padding: 16, // Reducido de 20 para evitar "sobredimensión"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // Reducido de 20
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3436',
  },
  dateText: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12, // Reducido de 16
    padding: 12, // Reducido de 16
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 9, // Reducido de 10
    fontWeight: '700',
    color: '#adb5bd',
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13, // Reducido de 14
    fontWeight: '700',
    color: '#2d3436',
  },
  statDivider: {
    width: 1,
    height: 20, // Reducido de 24
    backgroundColor: '#e9ecef',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#b2bec3',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#2d3436',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f3f5',
    marginVertical: 10,
    marginBottom: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  coordsText: {
    fontSize: 12,
    color: '#adb5bd',
    marginTop: 2,
  },
  sectionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 12,
  },
  subDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subDetailText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#495057',
  },
  totalRow: {
    marginTop: 10,
    backgroundColor: '#f1f3f5',
    padding: 16,
    borderRadius: 16,
  },
});
