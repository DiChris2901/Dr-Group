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
  Linking,
  Alert
} from 'react-native';
import { 
  Text, 
  useTheme, 
  ActivityIndicator, 
  IconButton,
  Surface,
  Chip,
  Avatar,
  Divider,
  Searchbar,
  Button
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth, parseISO, startOfWeek, endOfWeek, subMonths, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { SobrioCard, DetailRow, OverlineText } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';
import { SegmentedButtons } from 'react-native-paper';
import PDFExportService from '../../services/PDFExportService';

const { width, height } = Dimensions.get('window');

export default function AsistenciasScreen({ navigation }) {
  const { userProfile, user, activeSession } = useAuth();
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
  const [filterType, setFilterType] = useState('week'); // 'week' | 'month' | 'last_month' | 'recent'
  const [searchQuery, setSearchQuery] = useState(''); // ✅ Búsqueda por texto
  
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
  }, [userProfile, filterType, activeSession]);

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
        
        // Base query
        let constraints = [where('uid', '==', targetUid)];
        
        const now = new Date();
        
        if (filterType === 'week') {
          const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          constraints.push(where('fecha', '>=', start));
          constraints.push(where('fecha', '<=', end));
          constraints.push(orderBy('fecha', 'desc'));
        } else if (filterType === 'month') {
          const start = format(startOfMonth(now), 'yyyy-MM-dd');
          const end = format(endOfMonth(now), 'yyyy-MM-dd');
          constraints.push(where('fecha', '>=', start));
          constraints.push(where('fecha', '<=', end));
          constraints.push(orderBy('fecha', 'desc'));
        } else if (filterType === 'last_month') {
          const lastMonth = subMonths(now, 1);
          const start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
          const end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
          constraints.push(where('fecha', '>=', start));
          constraints.push(where('fecha', '<=', end));
          constraints.push(orderBy('fecha', 'desc'));
        } else {
          // 'recent' or default
          constraints.push(orderBy('fecha', 'desc'));
          constraints.push(limit(50));
        }

        q = query(collection(db, 'asistencias'), ...constraints);
      } else {
        // Admin query
        let constraints = [];
        
        const now = new Date();
        
        if (filterType === 'week') {
          const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          constraints.push(where('fecha', '>=', start));
          constraints.push(where('fecha', '<=', end));
          constraints.push(orderBy('fecha', 'desc'));
        } else if (filterType === 'month') {
          const start = format(startOfMonth(now), 'yyyy-MM-dd');
          const end = format(endOfMonth(now), 'yyyy-MM-dd');
          constraints.push(where('fecha', '>=', start));
          constraints.push(where('fecha', '<=', end));
          constraints.push(orderBy('fecha', 'desc'));
        } else if (filterType === 'last_month') {
          const lastMonth = subMonths(now, 1);
          const start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
          const end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
          constraints.push(where('fecha', '>=', start));
          constraints.push(where('fecha', '<=', end));
          constraints.push(orderBy('fecha', 'desc'));
        } else {
          constraints.push(orderBy('fecha', 'desc'));
          constraints.push(limit(50));
        }
        
        q = query(collection(db, 'asistencias'), ...constraints);
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

  // ✅ Exportar reporte PDF (Solo admins)
  const handleExportPDF = async () => {
    try {
      Haptics.selectionAsync();
      
      if (filteredAsistencias.length === 0) {
        Alert.alert('Sin datos', 'No hay asistencias para exportar en el período seleccionado.');
        return;
      }

      // Calcular estadísticas
      const stats = PDFExportService.calculateStats(filteredAsistencias);

      // Preparar datos para PDF
      const now = new Date();
      const monthName = format(now, 'MMMM', { locale: es });
      const year = now.getFullYear();

      const pdfParams = {
        employeeName: userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN' 
          ? 'Todos los Empleados' 
          : userProfile?.name || user?.email || 'Empleado',
        employeeEmail: user?.email || 'N/A',
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        year: year.toString(),
        asistencias: filteredAsistencias,
        ...stats,
        primaryColor: surfaceColors.primary
      };

      // Exportar PDF
      await PDFExportService.exportToPDF(pdfParams);

      Alert.alert('✅ Éxito', 'Reporte PDF generado correctamente');
    } catch (error) {
      console.error('❌ Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte. Intenta nuevamente.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'h:mm a');
  };

  // ✅ NUEVO: Filtrado local por búsqueda (búsqueda inteligente de fechas)
  const filteredAsistencias = asistencias.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const userName = usersMap[item.uid]?.name?.toLowerCase() || '';
    const fechaISO = item.fecha || ''; // Formato: "2026-01-20"
    
    // Convertir fecha ISO a formatos legibles en español
    let fechaFormateada = '';
    let fechaDia = '';
    let fechaMes = '';
    let fechaAno = '';
    
    if (fechaISO) {
      try {
        const [ano, mes, dia] = fechaISO.split('-');
        fechaDia = dia;
        fechaMes = mes;
        fechaAno = ano;
        
        // Crear múltiples formatos de búsqueda
        const mesesES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const nombreMes = mesesES[parseInt(mes) - 1] || '';
        
        // Formatos soportados:
        // "20 de enero", "20 enero", "enero 20"
        // "20/01/2026", "20/01", "20-01-2026", "20-01"
        // "2026-01-20" (ISO original)
        fechaFormateada = [
          `${dia} de ${nombreMes}`, // "20 de enero"
          `${dia} ${nombreMes}`,    // "20 enero"
          `${nombreMes} ${dia}`,    // "enero 20"
          `${dia}/${mes}/${ano}`,   // "20/01/2026"
          `${dia}/${mes}`,          // "20/01"
          `${dia}-${mes}-${ano}`,   // "20-01-2026"
          `${dia}-${mes}`,          // "20-01"
          fechaISO                  // "2026-01-20"
        ].join(' ').toLowerCase();
      } catch (e) {
        fechaFormateada = fechaISO.toLowerCase();
      }
    }
    
    // Admin: busca por nombre + fecha
    // Empleado: solo busca por fecha (solo ve sus registros)
    if (userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') {
      return userName.includes(query) || fechaFormateada.includes(query);
    } else {
      return fechaFormateada.includes(query);
    }
  });

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
              ? surfaceColors.surfaceContainer
              : surfaceColors.surfaceContainerLow,
            marginBottom: 16, // ✅ Espaciado ajustado
            borderColor: surfaceColors.outlineVariant, // ✅ Borde sutil
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
      <View style={[styles.header, (userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') && { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text 
            variant="displaySmall" 
            style={{ 
              fontWeight: '400', 
              color: surfaceColors.onSurface,
              letterSpacing: -0.5,
              fontFamily: 'Roboto-Flex',
              marginBottom: 4
            }}
          >
            Historial
          </Text>
          <Text variant="titleMedium" style={{ color: surfaceColors.onSurfaceVariant }}>
            Registro de Asistencias
          </Text>
        </View>
        {/* ✅ Botón Exportar PDF (Solo admins) */}
        {(userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') && (
          <IconButton
            icon="file-pdf-box"
            size={28}
            iconColor={surfaceColors.primary}
            style={{ 
              backgroundColor: surfaceColors.primaryContainer,
              borderRadius: 16 
            }}
            onPress={handleExportPDF}
          />
        )}
      </View>

      {/* ✅ Búsqueda por texto */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Searchbar
          placeholder={(userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') 
            ? "Buscar por nombre o fecha..." 
            : "Buscar por fecha..."}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{
            backgroundColor: surfaceColors.surfaceContainerHigh,
            borderRadius: 32,
            elevation: 0,
          }}
          inputStyle={{ fontSize: 14 }}
          iconColor={surfaceColors.onSurfaceVariant}
        />
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
        {[
          { value: 'week', label: 'Esta Semana', icon: 'calendar-week' },
          { value: 'month', label: 'Este Mes', icon: 'calendar-month' },
          { value: 'last_month', label: 'Mes Pasado', icon: 'calendar-arrow-left' },
          { value: 'recent', label: 'Recientes', icon: 'history' },
        ].map((option) => {
          const isSelected = filterType === option.value;
          return (
            <Chip
              key={option.value}
              selected={isSelected}
              showSelectedOverlay
              onPress={() => {
                Haptics.selectionAsync();
                setFilterType(option.value);
              }}
              icon={option.icon}
              mode={isSelected ? 'flat' : 'outlined'}
              style={{
                backgroundColor: isSelected ? surfaceColors.secondaryContainer : 'transparent',
                borderColor: isSelected ? 'transparent' : surfaceColors.outline,
                borderRadius: 16,
                width: '48%',
              }}
              textStyle={{
                color: isSelected ? surfaceColors.onSecondaryContainer : surfaceColors.onSurfaceVariant,
                fontWeight: isSelected ? '600' : '400',
                textAlign: 'center',
                flex: 1,
                marginRight: 4
              }}
            >
              {option.label}
            </Chip>
          );
        })}
      </View>

      <Animated.View style={[
        styles.sheetContainer,
        {
          backgroundColor: theme.colors.background,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          flex: 1, // Asegurar que ocupe el espacio restante
        }
      ]}>
        <FlatList
          data={filteredAsistencias}
          renderItem={({ item, index }) => <AsistenciaItem item={item} index={index} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} // Espacio extra al final
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
              <View style={{ 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: 40,
                marginTop: 40
              }}>
                <View style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: surfaceColors.surfaceContainerHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24
                }}>
                  <MaterialCommunityIcons name="clock-time-eight-outline" size={64} color={surfaceColors.primary} />
                </View>
                <Text variant="headlineSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
                  Sin registros
                </Text>
                <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'center' }}>
                  No hay asistencias para el filtro seleccionado
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
          <Surface style={[styles.modalContent, dynamicStyles.modalSurface]} elevation={0}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.surfaceVariant }]}>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', letterSpacing: -0.25 }}>Detalle de Asistencia</Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>
            
            {selectedAsistencia && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Usuario Card */}
                <View 
                  style={[
                    styles.expressiveDetailCard, 
                    { 
                      backgroundColor: surfaceColors.surfaceContainerLow,
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: surfaceColors.primary + '20',
                      marginBottom: 12
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {usersMap[selectedAsistencia.uid]?.photoURL ? (
                      <Avatar.Image 
                        size={48} 
                        source={{ uri: usersMap[selectedAsistencia.uid].photoURL }} 
                        style={{ marginRight: 16 }} 
                      />
                    ) : (
                      <Avatar.Text 
                        size={48} 
                        label={(usersMap[selectedAsistencia.uid]?.name || 'U').charAt(0)} 
                        style={{ 
                          marginRight: 16, 
                          backgroundColor: surfaceColors.primaryContainer 
                        }} 
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 4 }}>
                        USUARIO
                      </Text>
                      <Text variant="titleLarge" style={{ color: surfaceColors.onSurface, fontWeight: '600', letterSpacing: -0.25 }}>
                        {usersMap[selectedAsistencia.uid]?.name || 'Usuario'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Fecha Card */}
                <View 
                  style={[
                    styles.expressiveDetailCard, 
                    { 
                      backgroundColor: surfaceColors.surfaceContainerLow,
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: surfaceColors.primary + '20'
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 24, 
                      backgroundColor: surfaceColors.primaryContainer, 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <MaterialCommunityIcons name="calendar" size={24} color={surfaceColors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 4 }}>
                        FECHA
                      </Text>
                      <Text variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', letterSpacing: -0.25 }}>
                        {format(parseISO(selectedAsistencia.fecha + 'T12:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Ubicación y Modalidad - SOLO ADMIN */}
                {(userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') && selectedAsistencia.entrada?.ubicacion && (
                  <View style={{ marginTop: 20 }}>
                    <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600', marginBottom: 16 }}>
                      INFORMACIÓN DE CONEXIÓN
                    </Text>
                    
                    {/* Modalidad */}
                    <View 
                      style={[
                        styles.expressiveDetailCard, 
                        { 
                          backgroundColor: surfaceColors.surfaceContainerLow,
                          borderRadius: 20,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: (selectedAsistencia.entrada.ubicacion.tipo === 'Oficina' ? surfaceColors.primary : surfaceColors.tertiary) + '30',
                          marginBottom: 12
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: 24, 
                          backgroundColor: selectedAsistencia.entrada.ubicacion.tipo === 'Oficina' ? surfaceColors.primaryContainer : surfaceColors.tertiaryContainer, 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginRight: 16
                        }}>
                          <MaterialCommunityIcons 
                            name="wifi" 
                            size={24} 
                            color={selectedAsistencia.entrada.ubicacion.tipo === 'Oficina' ? surfaceColors.primary : surfaceColors.tertiary} 
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 4 }}>
                            MODALIDAD
                          </Text>
                          <Text variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', letterSpacing: -0.25 }}>
                            {selectedAsistencia.entrada.ubicacion.tipo || 'Remoto'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Ubicación GPS */}
                    {selectedAsistencia.entrada.ubicacion.lat && selectedAsistencia.entrada.ubicacion.lon && (
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          const lat = selectedAsistencia.entrada.ubicacion.lat;
                          const lon = selectedAsistencia.entrada.ubicacion.lon;
                          const url = `https://www.google.com/maps?q=${lat},${lon}`;
                          Linking.openURL(url);
                        }}
                        android_ripple={{ color: surfaceColors.primary + '1F' }}
                        style={[
                          styles.expressiveDetailCard, 
                          { 
                            backgroundColor: surfaceColors.surfaceContainerLow,
                            borderRadius: 20,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: surfaceColors.tertiary + '30',
                            marginBottom: 12
                          }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 24, 
                            backgroundColor: surfaceColors.tertiaryContainer, 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginRight: 16
                          }}>
                            <MaterialCommunityIcons name="map-marker" size={24} color={surfaceColors.tertiary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 4 }}>
                              VER UBICACIÓN
                            </Text>
                            <Text variant="bodyMedium" style={{ color: surfaceColors.onSurface, fontWeight: '500' }} numberOfLines={1}>
                              {`${selectedAsistencia.entrada.ubicacion.lat.toFixed(6)}, ${selectedAsistencia.entrada.ubicacion.lon.toFixed(6)}`}
                            </Text>
                          </View>
                          <MaterialCommunityIcons name="chevron-right" size={24} color={surfaceColors.onSurfaceVariant} />
                        </View>
                      </Pressable>
                    )}

                    {/* Dispositivo */}
                    {selectedAsistencia.entrada.dispositivo && (
                      <View 
                        style={[
                          styles.expressiveDetailCard, 
                          { 
                            backgroundColor: surfaceColors.surfaceContainerLow,
                            borderRadius: 20,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: surfaceColors.secondary + '30'
                          }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 24, 
                            backgroundColor: surfaceColors.secondaryContainer, 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginRight: 16
                          }}>
                            <MaterialCommunityIcons name="cellphone" size={24} color={surfaceColors.secondary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 4 }}>
                              DISPOSITIVO
                            </Text>
                            <Text variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', letterSpacing: -0.25 }}>
                              {selectedAsistencia.entrada.dispositivo}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.rowContainer}>
                  {/* Entry */}
                  <View style={[styles.timeCard, { backgroundColor: surfaceColors.surfaceContainerLow, marginRight: 8, borderWidth: 1, borderColor: surfaceColors.secondary + '30' }]}>
                    <View style={styles.timeCardHeader}>
                      <MaterialCommunityIcons name="login" size={24} color={surfaceColors.secondary} />
                      <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 8, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>ENTRADA</Text>
                    </View>
                    <Text variant="headlineSmall" style={{ fontWeight: '600', marginTop: 8, color: surfaceColors.onSurface, letterSpacing: -0.25 }}>
                      {selectedAsistencia.entrada?.hora ? format(selectedAsistencia.entrada.hora.toDate(), 'h:mm a') : '--:--'}
                    </Text>
                  </View>

                  {/* Exit */}
                  <View style={[styles.timeCard, { backgroundColor: surfaceColors.surfaceContainerLow, marginLeft: 8, borderWidth: 1, borderColor: surfaceColors.tertiary + '30' }]}>
                    <View style={styles.timeCardHeader}>
                      <MaterialCommunityIcons name="logout" size={24} color={surfaceColors.tertiary} />
                      <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 8, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>SALIDA</Text>
                    </View>
                    <Text variant="headlineSmall" style={{ fontWeight: '600', marginTop: 8, color: surfaceColors.onSurface, letterSpacing: -0.25 }}>
                      {selectedAsistencia.salida?.hora ? format(selectedAsistencia.salida.hora.toDate(), 'h:mm a') : '--:--'}
                    </Text>
                  </View>
                </View>

                {/* Breaks */}
                {selectedAsistencia.breaks && selectedAsistencia.breaks.length > 0 && (
                  <View style={{ marginTop: 20 }}>
                    <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600', marginBottom: 16 }}>Breaks</Text>
                    {selectedAsistencia.breaks.map((b, i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.expressiveDetailCard, 
                          { 
                            backgroundColor: surfaceColors.surfaceContainerLow,
                            padding: 16,
                            marginBottom: 12,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: surfaceColors.tertiary + '20'
                          }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="coffee" size={20} color={surfaceColors.tertiary} />
                            <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 8, fontWeight: '600' }}>Break {i + 1}</Text>
                          </View>
                          <Text variant="bodyMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
                            {`${b.inicio ? format(b.inicio.toDate(), 'h:mm a') : '--'} - ${b.fin ? format(b.fin.toDate(), 'h:mm a') : 'En curso'}`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Lunch */}
                {selectedAsistencia.almuerzo && (
                  <View style={{ marginTop: 20 }}>
                    <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600', marginBottom: 16 }}>Almuerzo</Text>
                    <View 
                      style={[
                        styles.expressiveDetailCard, 
                        { 
                          backgroundColor: surfaceColors.surfaceContainerLow,
                          padding: 16,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: surfaceColors.tertiary + '20'
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="food" size={20} color={surfaceColors.tertiary} />
                          <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 8, fontWeight: '600' }}>Hora de Almuerzo</Text>
                        </View>
                        <Text variant="bodyMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
                          {`${selectedAsistencia.almuerzo.inicio ? format(selectedAsistencia.almuerzo.inicio.toDate(), 'h:mm a') : '--'} - ${selectedAsistencia.almuerzo.fin ? format(selectedAsistencia.almuerzo.fin.toDate(), 'h:mm a') : 'En curso'}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <Divider style={{ marginVertical: 20, backgroundColor: surfaceColors.surfaceVariant }} />

                <View style={[styles.totalRow, { backgroundColor: surfaceColors.primaryContainer, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: surfaceColors.primary + '30' }]}>
                  <MaterialCommunityIcons name="timer" size={40} color={surfaceColors.primary} />
                  <View style={styles.detailTextContainer}>
                    <Text variant="labelLarge" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, fontWeight: '600', textTransform: 'uppercase' }}>TIEMPO TOTAL</Text>
                    <Text variant="headlineLarge" style={{ fontWeight: '600', color: surfaceColors.primary, marginTop: 4, letterSpacing: -0.5 }}>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sheetContainer: {
    flex: 1,
    marginTop: 10,
    overflow: 'hidden',
  },
  listContent: {
    padding: 20,  // ✅ Espaciado generoso
    paddingBottom: 100,
  },
  // ✅ Expressive Card (border radius 24px, elevation 0)
  expressiveCard: {
    borderRadius: 24,  // ✅ Orgánico (Material You Standard)
    padding: 20,
    elevation: 0,
    borderWidth: 1, // ✅ Borde sutil
    borderColor: 'transparent', // Se sobreescribe dinámicamente
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
    elevation: 0,
  },
  detailTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  timeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,  // ✅ Orgánico (16→20)
    justifyContent: 'center',
    elevation: 0,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  // ✅ Expressive Detail Card (border radius 24px, padding 20px)
  expressiveDetailCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 0,
  },
});
