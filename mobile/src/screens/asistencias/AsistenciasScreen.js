import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  Animated,
  ScrollView,
  Linking,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Button,
  TextInput,
  Menu
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import { format, startOfMonth, parseISO, startOfWeek, endOfWeek, subMonths, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { SobrioCard, DetailRow, OverlineText } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';
import { SegmentedButtons } from 'react-native-paper';
import PDFExportService from '../../services/PDFExportService';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

export default function AsistenciasScreen({ navigation }) {
  const { userProfile, user, activeSession } = useAuth();
  const { can } = usePermissions();
  const theme = useTheme();
  
  // ✅ TODOS LOS HOOKS PRIMERO (Rules of Hooks)
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Cambiado a false - no carga al inicio
  const [refreshing, setRefreshing] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [filterType, setFilterType] = useState('today'); // 'today' | 'week' | 'month' | 'custom'
  const [searchQuery, setSearchQuery] = useState(''); // ✅ Búsqueda por texto
  const [hasSearched, setHasSearched] = useState(false); // ✅ Controla si se ha buscado alguna vez
  const [periodoMenuVisible, setPeriodoMenuVisible] = useState(false); // ✅ Menu de período
  
  // ✅ NUEVO: Estados para rango de fechas personalizado
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // Modal State
  const [selectedAsistencia, setSelectedAsistencia] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(height * 0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // ✅ FIX: Mover callbacks fuera del JSX (Rules of Hooks)
  const keyExtractor = useCallback((item) => item.id, []);
  const getItemLayout = useCallback((data, index) => ({
    length: 160, // Altura aproximada de cada card
    offset: 160 * index,
    index,
  }), []);
  
  // 🔒 Validación de permisos (NO bloquear UI, solo controlar contenido)
  const puedeVerTodos = can(APP_PERMISSIONS.ASISTENCIAS_TODOS);
  const puedeVerPropias = can(APP_PERMISSIONS.ASISTENCIAS_PROPIAS);
  
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

  // ✅ Función para limpiar filtros y resultados
  const limpiarFiltros = useCallback(() => {
    setFilterType('today');
    setAsistencias([]);
    setHasSearched(false);
    setSearchQuery('');
    setStartDate(new Date());
    setEndDate(new Date());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ✅ Limpiar filtros al salir de la pantalla
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup al cambiar de pantalla
        limpiarFiltros();
      };
    }, [limpiarFiltros])
  );

  // ✅ Solo cargar usuarios al montar (no asistencias)
  useEffect(() => {
    cargarUsuarios();
    
    // 🧹 Limpiar TODOS los cachés de asistencias al iniciar (fix para datos corruptos previos)
    AsyncStorage.getAllKeys().then(keys => {
      const asistenciasKeys = keys.filter(key => key.startsWith('asistencias_'));
      if (asistenciasKeys.length > 0) {
        console.log('🧹 Limpiando', asistenciasKeys.length, 'cachés antiguos de asistencias');
        AsyncStorage.multiRemove(asistenciasKeys);
      }
    });
  }, []);

  // ✅ NUEVO: Detectar cambios de permisos y limpiar datos
  useEffect(() => {
    // Si los permisos cambian (puedeVerTodos o puedeVerPropias), limpiar resultados
    // Esto fuerza al usuario a buscar nuevamente con sus nuevos permisos
    if (hasSearched) {
      setAsistencias([]);
      setHasSearched(false);
      // Limpiar caché de AsyncStorage relacionada con permisos
      AsyncStorage.getAllKeys().then(keys => {
        const asistenciasKeys = keys.filter(key => key.startsWith('asistencias_'));
        AsyncStorage.multiRemove(asistenciasKeys);
      });
    }
  }, [puedeVerTodos, puedeVerPropias]); // Ejecutar cuando cambien los permisos

  // ✅ ELIMINADO: useEffect que cargaba asistencias automáticamente
  // Ahora solo se cargan al presionar "Aplicar Filtros"

  const cargarUsuarios = useCallback(async () => {
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
  }, []);

  // ✅ NUEVA: Función de carga bajo demanda (solo cuando usuario aplica filtros)
  const cargarAsistencias = useCallback(async () => {
    try {
      setLoading(true);
      setHasSearched(true); // Marcar que se realizó una búsqueda
      Haptics.selectionAsync();
      
      let q;
      
      // Determinar rango de fechas según filtro seleccionado
      let startDateStr, endDateStr;
      const now = new Date();
      
      switch (filterType) {
        case 'today':
          startDateStr = format(now, 'yyyy-MM-dd');
          endDateStr = format(now, 'yyyy-MM-dd');
          console.log('🔍 Filtrando HOY:', startDateStr, '→', endDateStr);
          break;
        case 'week':
          startDateStr = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          endDateStr = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          console.log('🔍 Filtrando SEMANA:', startDateStr, '→', endDateStr);
          break;
        case 'month':
          startDateStr = format(startOfMonth(now), 'yyyy-MM-dd');
          endDateStr = format(endOfMonth(now), 'yyyy-MM-dd');
          break;
        case 'custom':
          if (!startDate || !endDate) {
            Alert.alert('Error', 'Por favor selecciona ambas fechas');
            setLoading(false);
            return;
          }
          // Validar que sean fechas válidas
          const validStartDate = startDate instanceof Date && !isNaN(startDate) ? startDate : new Date();
          const validEndDate = endDate instanceof Date && !isNaN(endDate) ? endDate : new Date();
          startDateStr = format(validStartDate, 'yyyy-MM-dd');
          endDateStr = format(validEndDate, 'yyyy-MM-dd');
          break;
        default:
          startDateStr = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          endDateStr = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      }
      
      // ✅ Generar clave única para caché
      const cacheKey = `asistencias_${filterType}_${startDateStr}_${endDateStr}_${user?.uid}_${puedeVerTodos}`;
      
      // ✅ Verificar caché local (NO cachear "today" — datos cambian en tiempo real)
      if (filterType !== 'today') {
        try {
          const cachedData = await AsyncStorage.getItem(cacheKey);
          if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            
            if (timestamp > oneHourAgo) {
              // Caché válido: usar datos guardados (NO leer Firestore)
              setAsistencias(data);
              setLoading(false);
              return;
            }
          }
        } catch (cacheError) {
          console.log('Error leyendo caché:', cacheError);
        }
      }
      
      // 🔒 CONTROL DE ACCESO BASADO EN PERMISOS
      if (puedeVerTodos) {
        // PERMISO: asistencias.todos → Ver registros de TODOS los usuarios
        q = query(
          collection(db, 'asistencias'),
          where('fecha', '>=', startDateStr),
          where('fecha', '<=', endDateStr),
          orderBy('fecha', 'desc'),
          limit(200) // Puede ver más registros
        );
      } else if (puedeVerPropias) {
        // PERMISO: asistencias.propias → Ver SOLO sus registros
        const targetUid = userProfile?.uid || user?.uid;
        if (!targetUid) {
          setLoading(false);
          return;
        }
        
        q = query(
          collection(db, 'asistencias'),
          where('uid', '==', targetUid),
          where('fecha', '>=', startDateStr),
          where('fecha', '<=', endDateStr),
          orderBy('fecha', 'desc'),
          limit(100) // Límite menor para usuarios básicos
        );
      } else {
        // Sin permisos: no cargar nada
        setAsistencias([]);
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      
      console.log('📊 Documentos encontrados:', querySnapshot.size);
      
      let asistenciasData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('  📄 ID:', doc.id, '| Fecha:', data.fecha, '| UID:', data.uid);
        return {
          id: doc.id,
          ...data
        };
      });
      
      // ✅ Ordenar por createdAt (más preciso)
      asistenciasData = asistenciasData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.entrada?.hora?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || b.entrada?.hora?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setAsistencias(asistenciasData);

      // ✅ Guardar en caché local solo para datos históricos (NO "today")
      if (filterType !== 'today') {
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({
            data: asistenciasData,
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          console.log('Error guardando caché:', cacheError);
        }
      }
    } catch (error) {
      console.error('Error cargando asistencias:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile, user, filterType, startDate, endDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarAsistencias();
  }, [cargarAsistencias]);

  const handleItemPress = useCallback((item) => {
    setSelectedAsistencia(item);
    setModalVisible(true);
  }, []);

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
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      // Validar que sea una fecha válida
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '--:--';
      }
      return format(date, 'h:mm a');
    } catch (error) {
      console.log('Error formateando fecha:', error);
      return '--:--';
    }
  };

  // ✅ NUEVO: Filtrado local por búsqueda (búsqueda inteligente de fechas) - Memoizado
  const filteredAsistencias = useMemo(() => asistencias.filter(item => {
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
  }), [asistencias, searchQuery, usersMap, userProfile]);

  const AsistenciaItem = memo(({ item, index }) => {
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

    const handlePress = useCallback(() => {
      Haptics.selectionAsync(); // ✅ Feedback táctil
      handleItemPress(item);
    }, [item]);

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
  });

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top', 'left', 'right']}>
      {/* Header Expresivo */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        {/* Header Top - Navigation Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            iconColor={surfaceColors.onSurface}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon="clock-time-eight-outline"
              mode="contained-tonal"
              size={20}
              iconColor={surfaceColors.primary}
              style={{
                backgroundColor: surfaceColors.primaryContainer,
                marginRight: 8,
              }}
            />
            {puedeVerTodos && (
              <IconButton
                icon="file-pdf-box"
                size={24}
                onPress={() => {
                  Haptics.selectionAsync();
                  handleExportPDF();
                }}
                iconColor={surfaceColors.onSurface}
              />
            )}
          </View>
        </View>
        
        {/* Header Content - Title */}
        <View style={{ paddingHorizontal: 4 }}>
          <Text style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 57, // Display Small
            lineHeight: 64,
            fontWeight: '400', 
            color: surfaceColors.onSurface, 
            letterSpacing: -0.5,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }] // Google Look
          }}>
            Historial
          </Text>
          <Text variant="titleMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            {puedeVerTodos ? 'Registro de Todos' : 'Tus Registros'}
          </Text>
        </View>
      </View>

      {/* ✅ Búsqueda por texto */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
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

      {/* ✅ Filtro de Período (Menu Dropdown) */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <Menu
          visible={periodoMenuVisible}
          onDismiss={() => setPeriodoMenuVisible(false)}
          anchor={
            <TouchableWithoutFeedback
              onPress={() => {
                Haptics.selectionAsync();
                setTimeout(() => setPeriodoMenuVisible(true), 50);
              }}
            >
              <View
                style={{
                  backgroundColor: surfaceColors.surfaceContainerHigh,
                  borderRadius: 24,
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderWidth: 1,
                  borderColor: surfaceColors.outlineVariant,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ 
                    fontSize: 11, 
                    color: surfaceColors.onSurfaceVariant,
                    fontFamily: 'Roboto-Flex',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 4
                  }}>
                    Período
                  </Text>
                  <Text style={{ 
                    fontSize: 15, 
                    color: surfaceColors.onSurface,
                    fontFamily: 'Roboto-Flex',
                    fontWeight: '500'
                  }}>
                    {filterType === 'today' ? 'Hoy' : filterType === 'week' ? 'Esta Semana' : filterType === 'month' ? 'Este Mes' : 'Rango Personalizado'}
                  </Text>
                </View>
                <MaterialCommunityIcons 
                  name={periodoMenuVisible ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color={surfaceColors.onSurfaceVariant} 
                />
                </View>
              </View>
            </TouchableWithoutFeedback>
          }
          contentStyle={{
            backgroundColor: surfaceColors.surfaceContainerHigh,
            borderRadius: 16,
          }}
        >
          <Menu.Item
            onPress={() => { 
              setPeriodoMenuVisible(false);
              setTimeout(() => setFilterType('today'), 100);
            }}
            title="Hoy"
            leadingIcon="calendar-today"
            titleStyle={{
              color: filterType === 'today' ? surfaceColors.primary : surfaceColors.onSurface,
              fontWeight: filterType === 'today' ? '600' : '400'
            }}
          />
          <Menu.Item
            onPress={() => { 
              setPeriodoMenuVisible(false);
              setTimeout(() => setFilterType('week'), 100);
            }}
            title="Esta Semana"
            leadingIcon="calendar-week"
            titleStyle={{
              color: filterType === 'week' ? surfaceColors.primary : surfaceColors.onSurface,
              fontWeight: filterType === 'week' ? '600' : '400'
            }}
          />
          <Menu.Item
            onPress={() => { 
              setPeriodoMenuVisible(false);
              setTimeout(() => setFilterType('month'), 100);
            }}
            title="Este Mes"
            leadingIcon="calendar-month"
            titleStyle={{
              color: filterType === 'month' ? surfaceColors.primary : surfaceColors.onSurface,
              fontWeight: filterType === 'month' ? '600' : '400'
            }}
          />
          <Menu.Item
            onPress={() => { 
              setPeriodoMenuVisible(false);
              setTimeout(() => setFilterType('custom'), 100);
            }}
            title="Rango Personalizado"
            leadingIcon="calendar-range"
            titleStyle={{
              color: filterType === 'custom' ? surfaceColors.primary : surfaceColors.onSurface,
              fontWeight: filterType === 'custom' ? '600' : '400'
            }}
          />
        </Menu>
      </View>

      {/* ✅ NUEVO: Selectores de Fecha (Solo si filterType === 'custom') */}
      {filterType === 'custom' && (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Fecha Inicio */}
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>
                Desde
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowStartDatePicker(true);
                }}
                style={{
                  backgroundColor: surfaceColors.surfaceContainerHigh,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: surfaceColors.outline,
                }}
              >
                <Text style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
                  {startDate && startDate instanceof Date && !isNaN(startDate) 
                    ? format(startDate, 'dd/MM/yyyy') 
                    : format(new Date(), 'dd/MM/yyyy')}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color={surfaceColors.primary} />
              </Pressable>
            </View>

            {/* Fecha Fin */}
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>
                Hasta
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowEndDatePicker(true);
                }}
                style={{
                  backgroundColor: surfaceColors.surfaceContainerHigh,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: surfaceColors.outline,
                }}
              >
                <Text style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
                  {endDate && endDate instanceof Date && !isNaN(endDate) 
                    ? format(endDate, 'dd/MM/yyyy') 
                    : format(new Date(), 'dd/MM/yyyy')}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color={surfaceColors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ✅ Botones Aplicar/Limpiar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            mode="contained"
            onPress={cargarAsistencias}
            loading={loading}
            disabled={loading}
            icon="filter-check"
            style={{ flex: 1, borderRadius: 24 }}
            contentStyle={{ paddingVertical: 10 }}
            labelStyle={{ fontFamily: 'Roboto-Flex', fontWeight: '600', fontSize: 15 }}
          >
            Aplicar Filtros
          </Button>
          <Button
            mode="outlined"
            onPress={limpiarFiltros}
            disabled={loading}
            icon="filter-remove"
            style={{ flex: 1, borderRadius: 24, borderColor: surfaceColors.outlineVariant }}
            contentStyle={{ paddingVertical: 10 }}
            labelStyle={{ fontFamily: 'Roboto-Flex', fontWeight: '600', fontSize: 15 }}
            textColor={surfaceColors.onSurface}
          >
            Limpiar
          </Button>
        </View>
      </View>

      {/* ✅ Date Pickers (Modal nativo) */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate instanceof Date && !isNaN(startDate) ? startDate : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate instanceof Date && !isNaN(endDate) ? endDate : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
          maximumDate={new Date()}
          minimumDate={startDate}
        />
      )}

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
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} // Espacio extra al final
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
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
                  <MaterialCommunityIcons 
                    name={hasSearched ? "clock-time-eight-outline" : "filter-outline"} 
                    size={64} 
                    color={surfaceColors.primary} 
                  />
                </View>
                <Text variant="headlineSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
                  {hasSearched ? 'Sin registros' : 'Selecciona filtros'}
                </Text>
                <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'center' }}>
                  {hasSearched 
                    ? 'No hay asistencias para el filtro seleccionado' 
                    : 'Elige un período y presiona "Aplicar Filtros" para buscar'}
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
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  // ✅ Expressive Detail Card (border radius 24px, padding 20px)
  expressiveDetailCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 0,
  },
});
