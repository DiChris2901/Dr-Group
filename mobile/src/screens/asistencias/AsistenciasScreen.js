import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SobrioCard, DetailRow, OverlineText, EmptyState, LoadingState } from '../../components';
import ProtectedScreen from '../../components/ProtectedScreen';
import { format, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * AsistenciasScreen - Historial de asistencias con filtros avanzados
 * 
 * Mejoras FASE 0.5:
 * - ✅ Filtro de rango de fechas (desde/hasta)
 * - ✅ Filtro de empleado (solo ADMIN)
 * - ✅ Navegación al detalle completo
 * - ✅ Performance mejorada (carga usuarios una sola vez)
 * - ✅ Integración con EmptyState/LoadingState
 */
function AsistenciasScreenContent({ navigation }) {
  const { userProfile } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  
  // Estados
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState(startOfMonth(new Date()));
  const [fechaHasta, setFechaHasta] = useState(new Date());
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [showEmpleadoPicker, setShowEmpleadoPicker] = useState(false);
  
  // Cache de usuarios
  const [usersMap, setUsersMap] = useState({});
  const [empleados, setEmpleados] = useState([]);
  
  // Verificar si es ADMIN
  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN';

  // Cargar todos los usuarios una sola vez (fix N+1 problem)
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Cargar asistencias cuando cambian los filtros Y cuando usersMap está listo
  useEffect(() => {
    // ✅ Solo cargar si ya tenemos usuarios cargados
    if (Object.keys(usersMap).length > 0) {
      cargarAsistencias();
    }
  }, [fechaDesde, fechaHasta, empleadoSeleccionado, usersMap]);

  const cargarUsuarios = async () => {
    try {
      console.log('📥 Cargando usuarios desde Firestore...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userMap = {};
      const empleadosList = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        userMap[doc.id] = {
          uid: doc.id,
          name: userData.name || userData.displayName || userData.email,
          email: userData.email,
          photoURL: userData.photoURL
        };
        
        // Lista para el picker (solo ADMIN)
        empleadosList.push({
          uid: doc.id,
          name: userData.name || userData.displayName || userData.email
        });
      });
      
      console.log(`✅ ${Object.keys(userMap).length} usuarios cargados`);
      setUsersMap(userMap);
      setEmpleados(empleadosList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setError('Error al cargar usuarios. Verifica tu conexión.');
    }
  };

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Cargando asistencias...');
      console.log('👥 Usuarios en caché:', Object.keys(usersMap).length);
      
      // Formatear fechas para query
      const fechaDesdeStr = format(fechaDesde, 'yyyy-MM-dd');
      const fechaHastaStr = format(fechaHasta, 'yyyy-MM-dd');
      
      console.log(`📅 Rango: ${fechaDesdeStr} → ${fechaHastaStr}`);
      
      // ✅ Query simplificada (sin orderBy para evitar índice compuesto)
      // Solo filtro de rango de fechas, el resto se hace client-side
      let q = query(
        collection(db, 'asistencias'),
        where('fecha', '>=', fechaDesdeStr),
        where('fecha', '<=', fechaHastaStr)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`📋 ${querySnapshot.docs.length} asistencias encontradas`);
      
      let asistenciasData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const userData = usersMap[data.uid] || {};
        
        // Debug: Verificar si encontró usuario
        if (!userData.name) {
          console.warn(`⚠️ Usuario no encontrado: ${data.uid}`);
        }
        
        return {
          id: doc.id,
          ...data,
          userName: userData.name || 'Usuario',
          userEmail: userData.email || '',
          userPhoto: userData.photoURL || null
        };
      });
      
      // ✅ Filtro de empleado client-side (evita índice compuesto)
      if (isAdmin && empleadoSeleccionado) {
        console.log(`🔍 Filtrando por empleado: ${empleadoSeleccionado}`);
        asistenciasData = asistenciasData.filter(a => a.uid === empleadoSeleccionado);
        console.log(`✅ ${asistenciasData.length} asistencias después del filtro`);
      }
      
      // ✅ Ordenamiento client-side (más reciente primero)
      asistenciasData.sort((a, b) => {
        if (a.fecha > b.fecha) return -1;
        if (a.fecha < b.fecha) return 1;
        return 0;
      });
      
      console.log(`✅ ${asistenciasData.length} asistencias cargadas y ordenadas`);
      setAsistencias(asistenciasData);
    } catch (err) {
      console.error('❌ Error cargando asistencias:', err);
      setError('Error al cargar asistencias. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarAsistencias();
  };

  const handleFiltroRapido = (tipo) => {
    const hoy = new Date();
    switch (tipo) {
      case 'hoy':
        setFechaDesde(hoy);
        setFechaHasta(hoy);
        break;
      case 'semana':
        setFechaDesde(subDays(hoy, 7));
        setFechaHasta(hoy);
        break;
      case 'mes':
        setFechaDesde(startOfMonth(hoy));
        setFechaHasta(endOfMonth(hoy));
        break;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'trabajando': return '#4caf50';
      case 'break': return '#ff9800';
      case 'almuerzo': return '#2196f3';
      case 'finalizado': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'trabajando': return 'Trabajando';
      case 'break': return 'En Break';
      case 'almuerzo': return 'Almorzando';
      case 'finalizado': return 'Finalizado';
      default: return 'Desconocido';
    }
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = asistencias.length;
    const finalizadas = asistencias.filter(a => a.estadoActual === 'finalizado').length;
    const activas = asistencias.filter(a => a.estadoActual !== 'finalizado').length;
    
    return { total, finalizadas, activas };
  }, [asistencias]);

  const renderAsistenciaItem = (asistencia) => {
    const estadoColor = getEstadoColor(asistencia.estadoActual);
    
    return (
      <TouchableOpacity
        key={asistencia.id}
        onPress={() => navigation.navigate('AsistenciaDetail', { asistencia })}
        activeOpacity={0.7}
      >
        <SobrioCard style={styles.asistenciaCard}>
          {/* Header con usuario */}
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              {asistencia.userPhoto ? (
                <Image source={{ uri: asistencia.userPhoto }} style={styles.userAvatar} />
              ) : (
                <View style={[styles.userAvatarPlaceholder, { backgroundColor: getPrimaryColor() + '20' }]}>
                  <MaterialIcons name="person" size={24} color={getPrimaryColor()} />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{asistencia.userName}</Text>
                <Text style={styles.userDate}>{format(new Date(asistencia.fecha), "d 'de' MMMM, yyyy", { locale: es })}</Text>
              </View>
            </View>
            
            {/* Estado badge */}
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '26' }]}>
              <Text style={[styles.estadoText, { color: estadoColor }]}>
                {getEstadoLabel(asistencia.estadoActual)}
              </Text>
            </View>
          </View>

          {/* Información detallada */}
          <View style={styles.cardDetails}>
            <DetailRow
              icon="login"
              label="Entrada"
              value={asistencia.entrada?.hora ? format(asistencia.entrada.hora.toDate(), 'HH:mm:ss') : '--:--'}
              iconColor={getPrimaryColor()}
            />
            
            {asistencia.salida?.hora && (
              <DetailRow
                icon="logout"
                label="Salida"
                value={format(asistencia.salida.hora.toDate(), 'HH:mm:ss')}
                iconColor={getSecondaryColor()}
              />
            )}
            
            <DetailRow
              icon="access-time"
              label="Horas Trabajadas"
              value={asistencia.horasTrabajadas || '00:00:00'}
              iconColor="#4caf50"
              highlight={asistencia.estadoActual === 'finalizado'}
            />
            
            {asistencia.breaks && asistencia.breaks.length > 0 && (
              <DetailRow
                icon="free-breakfast"
                label="Breaks"
                value={`${asistencia.breaks.length} break(s)`}
                iconColor="#ff9800"
              />
            )}
          </View>

          {/* Flecha de navegación */}
          <View style={styles.cardFooter}>
            <Text style={styles.verDetalleText}>Ver detalle completo</Text>
            <MaterialIcons name="chevron-right" size={24} color={getPrimaryColor()} />
          </View>
        </SobrioCard>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Cargando asistencias..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="error-outline"
          message={error}
          iconColor="#f44336"
        />
        <TouchableOpacity style={styles.retryButton} onPress={cargarAsistencias}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <OverlineText style={styles.headerOverline}>HISTORIAL DE ASISTENCIAS</OverlineText>
        <Text style={styles.headerTitle}>Control de Jornadas</Text>
        <Text style={styles.headerSubtitle}>
          Consulta el historial completo de asistencias
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[getPrimaryColor()]} />
        }
      >
        {/* Filtros rápidos */}
        <View style={styles.filtrosRapidos}>
          <TouchableOpacity
            style={[styles.filtroChip, { borderColor: getPrimaryColor() }]}
            onPress={() => handleFiltroRapido('hoy')}
          >
            <MaterialIcons name="today" size={16} color={getPrimaryColor()} />
            <Text style={[styles.filtroChipText, { color: getPrimaryColor() }]}>Hoy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filtroChip, { borderColor: getPrimaryColor() }]}
            onPress={() => handleFiltroRapido('semana')}
          >
            <MaterialIcons name="date-range" size={16} color={getPrimaryColor()} />
            <Text style={[styles.filtroChipText, { color: getPrimaryColor() }]}>Semana</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filtroChip, { borderColor: getPrimaryColor() }]}
            onPress={() => handleFiltroRapido('mes')}
          >
            <MaterialIcons name="calendar-today" size={16} color={getPrimaryColor()} />
            <Text style={[styles.filtroChipText, { color: getPrimaryColor() }]}>Mes</Text>
          </TouchableOpacity>
        </View>

        {/* Rango de fechas */}
        <View style={styles.rangoFechas}>
          <Text style={styles.rangoFechasLabel}>Periodo seleccionado:</Text>
          <Text style={styles.rangoFechasValue}>
            {format(fechaDesde, "d MMM", { locale: es })} - {format(fechaHasta, "d MMM yyyy", { locale: es })}
          </Text>
        </View>

        {/* Filtro de empleado (solo ADMIN) */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.empleadoSelector}
            onPress={() => setShowEmpleadoPicker(true)}
          >
            <View style={styles.empleadoSelectorContent}>
              <MaterialIcons name="filter-list" size={20} color={getPrimaryColor()} />
              <Text style={styles.empleadoSelectorText}>
                {empleadoSeleccionado
                  ? usersMap[empleadoSeleccionado]?.name || 'Empleado'
                  : 'Todos los empleados'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        )}

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: getPrimaryColor() + '15' }]}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: getPrimaryColor() }]}>TOTAL</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#4caf50' + '15' }]}>
            <Text style={styles.statValue}>{stats.finalizadas}</Text>
            <Text style={[styles.statLabel, { color: '#4caf50' }]}>FINALIZADAS</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#ff9800' + '15' }]}>
            <Text style={styles.statValue}>{stats.activas}</Text>
            <Text style={[styles.statLabel, { color: '#ff9800' }]}>ACTIVAS</Text>
          </View>
        </View>

        {/* Lista de asistencias */}
        <View style={styles.listContainer}>
          <OverlineText style={styles.listTitle}>Registros ({asistencias.length})</OverlineText>
          
          {asistencias.length === 0 ? (
            <EmptyState
              icon="event-busy"
              message="No hay asistencias en el periodo seleccionado"
              iconColor="#9e9e9e"
            />
          ) : (
            asistencias.map(renderAsistenciaItem)
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal picker de empleado */}
      <Modal
        visible={showEmpleadoPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmpleadoPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Empleado</Text>
              <TouchableOpacity onPress={() => setShowEmpleadoPicker(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.empleadoList}>
              {/* Opción "Todos" */}
              <TouchableOpacity
                style={[
                  styles.empleadoItem,
                  !empleadoSeleccionado && { backgroundColor: getPrimaryColor() + '15' }
                ]}
                onPress={() => {
                  setEmpleadoSeleccionado(null);
                  setShowEmpleadoPicker(false);
                }}
              >
                <MaterialIcons name="people" size={20} color={getPrimaryColor()} />
                <Text style={styles.empleadoItemText}>Todos los empleados</Text>
                {!empleadoSeleccionado && (
                  <MaterialIcons name="check" size={20} color={getPrimaryColor()} />
                )}
              </TouchableOpacity>
              
              {/* Lista de empleados */}
              {empleados.map(emp => (
                <TouchableOpacity
                  key={emp.uid}
                  style={[
                    styles.empleadoItem,
                    empleadoSeleccionado === emp.uid && { backgroundColor: getPrimaryColor() + '15' }
                  ]}
                  onPress={() => {
                    setEmpleadoSeleccionado(emp.uid);
                    setShowEmpleadoPicker(false);
                  }}
                >
                  <MaterialIcons name="person" size={20} color={getPrimaryColor()} />
                  <Text style={styles.empleadoItemText}>{emp.name}</Text>
                  {empleadoSeleccionado === emp.uid && (
                    <MaterialIcons name="check" size={20} color={getPrimaryColor()} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  headerOverline: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  content: {
    flex: 1
  },
  filtrosRapidos: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#fff'
  },
  filtroChipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  rangoFechas: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  rangoFechasLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#64748b',
    marginBottom: 4
  },
  rangoFechasValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333'
  },
  empleadoSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  empleadoSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  empleadoSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  listContainer: {
    paddingHorizontal: 16
  },
  listTitle: {
    marginBottom: 12,
    color: '#64748b'
  },
  asistenciaCard: {
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  userDate: {
    fontSize: 13,
    color: '#64748b'
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  cardDetails: {
    gap: 8
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)'
  },
  verDetalleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b'
  },
  retryButton: {
    margin: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#667eea',
    borderRadius: 12,
    alignItems: 'center'
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  empleadoList: {
    paddingHorizontal: 16
  },
  empleadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 4
  },
  empleadoItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  bottomSpacer: {
    height: 40
  }
});

// Wrap con ProtectedScreen
export default function AsistenciasScreen({ navigation }) {
  return (
    <ProtectedScreen requiredPermission="asistencias.ver_todos">
      <AsistenciasScreenContent navigation={navigation} />
    </ProtectedScreen>
  );
}
