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
    paddingTop: 52, // 🎨 Material 3 generous spacing (↑ de 48)
    paddingHorizontal: 28, // 🎨 Material 3 horizontal padding (↑ de 24)
    paddingBottom: 28, // 🎨 Material 3 (↑ de 24)
    borderBottomLeftRadius: 32, // 🎨 Material 3 Extra Large (↑ de 24)
    borderBottomRightRadius: 32 // 🎨 Material 3 Extra Large (↑ de 24)
  },
  headerOverline: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6 // 🎨 Material 3 spacing (↑ de 4)
  },
  headerTitle: {
    fontSize: 30, // 🎨 Material 3 Headline Medium (↑ de 28)
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6, // 🎨 Material 3 spacing (↑ de 4)
    letterSpacing: 0.3 // 🎨 Material 3 tracking (nuevo)
  },
  headerSubtitle: {
    fontSize: 15, // 🎨 Material 3 Body Medium (↑ de 14)
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22 // 🎨 Material 3 line-height (nuevo)
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, // 🎨 Material 3 padding (↑ de 16)
    paddingVertical: 16, // 🎨 Material 3 padding (↑ de 12)
    backgroundColor: '#fff',
    marginHorizontal: 20, // 🎨 Material 3 margin (↑ de 16)
    marginTop: 20, // 🎨 Material 3 margin (↑ de 16)
    borderRadius: 24, // 🎨 Material 3 Large (↑ de 16)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // 🎨 Material 3 elevation (↑ de 2)
    shadowOpacity: 0.12, // 🎨 Material 3 shadow (↑ de 0.06)
    shadowRadius: 16, // 🎨 Material 3 blur (↑ de 8)
    elevation: 4 // 🎨 Material 3 (↑ de 2)
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
    paddingHorizontal: 20, // 🎨 Material 3 padding (↑ de 16)
    paddingVertical: 16, // 🎨 Material 3 padding (↑ de 12)
    gap: 16 // 🎨 Material 3 gap (↑ de 12)
  },
  statCard: {
    flex: 1,
    padding: 20, // 🎨 Material 3 padding (↑ de 16)
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 28, // 🎨 Material 3 Display Small (↑ de 24)
    fontWeight: '700',
    color: '#333',
    marginBottom: 6, // 🎨 Material 3 spacing (↑ de 4)
    letterSpacing: 0.2 // 🎨 Material 3 tracking (nuevo)
  },
  statLabel: {
    fontSize: 12, // 🎨 Material 3 Label Medium (↑ de 11)
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.0 // 🎨 Material 3 tracking (↑ de 0.5)
  },
  listContent: {
    padding: 20, // 🎨 Material 3 padding (↑ de 16)
    paddingBottom: 40 // 🎨 Material 3 bottom padding (↑ de 32)
  },
  asistenciaCard: {
    marginBottom: 16 // 🎨 Material 3 spacing (↑ de 12)
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
    width: 44, // 🎨 Material 3 avatar size (↑ de 40)
    height: 44, // 🎨 Material 3 avatar size (↑ de 40)
    borderRadius: 22, // 🎨 Material 3 circular (↑ de 20)
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16 // 🎨 Material 3 spacing (↑ de 12)
  },
  avatarEmoji: {
    fontSize: 22 // 🎨 Material 3 icon size (↑ de 20)
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 16, // 🎨 Material 3 Title Small (↑ de 15)
    fontWeight: '600',
    color: '#333',
    marginBottom: 4, // 🎨 Material 3 spacing (↑ de 2)
    letterSpacing: 0.1 // 🎨 Material 3 tracking (nuevo)
  },
  userFecha: {
    fontSize: 13, // 🎨 Material 3 Body Small (↑ de 12)
    color: '#666',
    lineHeight: 18 // 🎨 Material 3 line-height (nuevo)
  },
  estadoBadge: {
    paddingHorizontal: 16, // 🎨 Material 3 padding (↑ de 12)
    paddingVertical: 8, // 🎨 Material 3 padding (↑ de 6)
    borderRadius: 20 // 🎨 Material 3 Full (↑ de 16)
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
