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
  FlatList
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
  const { userProfile } = useAuth();
  const { getGradient, getPrimaryColor } = useTheme();
  
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usersMap, setUsersMap] = useState({});

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
    if (Object.keys(usersMap).length > 0 && userProfile) {
      cargarAsistencias();
    }
  }, [usersMap, userProfile]);

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
      
      let q = query(
        collection(db, 'asistencias'),
        where('fecha', '>=', fechaInicioStr),
        orderBy('fecha', 'desc')
      );

      // Si no es admin, filtrar solo sus asistencias
      if (userProfile?.role !== 'ADMIN' && userProfile?.role !== 'SUPER_ADMIN') {
        if (!userProfile?.uid) {
          setLoading(false);
          return;
        }
        q = query(
          collection(db, 'asistencias'),
          where('uid', '==', userProfile.uid),
          where('fecha', '>=', fechaInicioStr),
          orderBy('fecha', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const asistenciasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGradient: {
    height: height * 0.25,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -40,
    overflow: 'hidden',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#adb5bd',
    marginBottom: 4,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3436',
  },
  statDivider: {
    width: 1,
    height: 24,
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
});
