import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProtectedScreen from '../../components/ProtectedScreen';
import SobrioCard from '../../components/SobrioCard';
import DetailRow from '../../components/DetailRow';
import OverlineText from '../../components/OverlineText';

const AsistenciasScreen = () => {
  const { getPrimaryColor, getSecondaryColor } = useTheme();
  const { userProfile } = useAuth();
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    cargarAsistencias();
  }, [selectedDate]);

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      
      // Formato de fecha: YYYY-MM-DD
      const fechaStr = selectedDate.toISOString().split('T')[0];
      
      // ✅ Query simple sin orderBy (no requiere índice compuesto)
      const asistenciasRef = collection(db, 'asistencias');
      const q = query(
        asistenciasRef,
        where('fecha', '==', fechaStr)
      );
      
      const querySnapshot = await getDocs(q);
      const asistenciasData = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Obtener datos del usuario
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', data.uid)));
        let userName = 'Usuario desconocido';
        let userPhoto = null;
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          userName = userData.name || userData.displayName || userData.email;
          userPhoto = userData.photoURL;
        }
        
        asistenciasData.push({
          id: doc.id,
          ...data,
          userName,
          userPhoto
        });
      }
      
      // ✅ Ordenar en memoria después de obtener todos los datos (más reciente primero)
      asistenciasData.sort((a, b) => {
        const horaA = a.entrada?.hora?.toDate ? a.entrada.hora.toDate() : new Date(a.entrada?.hora || 0);
        const horaB = b.entrada?.hora?.toDate ? b.entrada.hora.toDate() : new Date(b.entrada?.hora || 0);
        return horaB - horaA; // Descendente (más reciente primero)
      });
      
      setAsistencias(asistenciasData);
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
      Alert.alert('Error', 'No se pudieron cargar las asistencias');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarAsistencias();
    setRefreshing(false);
  };

  const formatearHora = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatearDuracion = (duracion) => {
    if (!duracion) return '00:00:00';
    return duracion;
  };

  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(selectedDate);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setSelectedDate(nuevaFecha);
  };

  const renderAsistenciaItem = ({ item }) => (
    <SobrioCard style={styles.asistenciaCard}>
      {/* Header con usuario */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          {item.userPhoto ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.userFecha}>{item.fecha}</Text>
          </View>
        </View>
        
        {/* Estado badge */}
        <View style={[
          styles.estadoBadge,
          { backgroundColor: item.estadoActual === 'finalizado' ? '#e8f5e9' : '#fff3e0' }
        ]}>
          <Text style={[
            styles.estadoText,
            { color: item.estadoActual === 'finalizado' ? '#2e7d32' : '#ef6c00' }
          ]}>
            {item.estadoActual === 'finalizado' ? '✅ Finalizado' : '⏳ Activo'}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Detalles */}
      <View style={styles.detalles}>
        <DetailRow
          icon="🕐"
          label="Hora de Entrada"
          value={formatearHora(item.entrada?.hora)}
          iconColor={getPrimaryColor()}
        />
        
        <DetailRow
          icon="🕐"
          label="Hora de Salida"
          value={item.salida?.hora ? formatearHora(item.salida.hora) : 'Sin registrar'}
          iconColor={getSecondaryColor()}
        />
        
        <DetailRow
          icon="⏱️"
          label="Horas Trabajadas"
          value={formatearDuracion(item.horasTrabajadas)}
          iconColor="#4caf50"
          highlight
        />
        
        {item.breaks && item.breaks.length > 0 && (
          <DetailRow
            icon="☕"
            label="Breaks"
            value={`${item.breaks.length} break(s)`}
            iconColor="#ff9800"
          />
        )}
        
        {item.almuerzo && item.almuerzo.inicio && (
          <DetailRow
            icon="🍽️"
            label="Almuerzo"
            value={formatearDuracion(item.almuerzo.duracion)}
            iconColor="#2196f3"
          />
        )}
      </View>
    </SobrioCard>
  );

  const fechaTexto = selectedDate.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <ProtectedScreen requiredPermission="asistencias.ver_todos">
      <View style={styles.container}>
        {/* Header con gradiente */}
        <View style={[styles.header, { backgroundColor: getPrimaryColor() }]}>
          <OverlineText style={styles.headerOverline}>ADMINISTRACIÓN</OverlineText>
          <Text style={styles.headerTitle}>Asistencias</Text>
          <Text style={styles.headerSubtitle}>Control de jornadas laborales</Text>
        </View>

        {/* Selector de fecha */}
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => cambiarDia(-1)}
          >
            <Text style={styles.dateButtonText}>← Día Anterior</Text>
          </TouchableOpacity>
          
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateText}>{fechaTexto}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => cambiarDia(1)}
            disabled={selectedDate >= new Date()}
          >
            <Text style={[
              styles.dateButtonText,
              selectedDate >= new Date() && styles.dateButtonDisabled
            ]}>
              Día Siguiente →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas rápidas */}
        <View style={styles.statsContainer}>
          <SobrioCard style={styles.statCard}>
            <Text style={styles.statNumber}>{asistencias.length}</Text>
            <Text style={styles.statLabel}>Asistencias</Text>
          </SobrioCard>
          
          <SobrioCard style={styles.statCard}>
            <Text style={styles.statNumber}>
              {asistencias.filter(a => a.estadoActual === 'finalizado').length}
            </Text>
            <Text style={styles.statLabel}>Finalizadas</Text>
          </SobrioCard>
          
          <SobrioCard style={styles.statCard}>
            <Text style={styles.statNumber}>
              {asistencias.filter(a => a.estadoActual !== 'finalizado').length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </SobrioCard>
        </View>

        {/* Lista de asistencias */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={getPrimaryColor()} />
            <Text style={styles.loadingText}>Cargando asistencias...</Text>
          </View>
        ) : (
          <FlatList
            data={asistencias}
            renderItem={renderAsistenciaItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[getPrimaryColor()]}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>No hay asistencias para esta fecha</Text>
              </View>
            )}
          />
        )}
      </View>
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerOverline: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)'
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  dateButton: {
    padding: 8
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea'
  },
  dateButtonDisabled: {
    color: '#ccc'
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center'
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
    textAlign: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  asistenciaCard: {
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarEmoji: {
    fontSize: 20
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  userFecha: {
    fontSize: 12,
    color: '#666'
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12
  },
  detalles: {
    gap: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  }
});

export default AsistenciasScreen;
