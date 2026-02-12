import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Animated,
  Linking,
  Dimensions,
  TouchableWithoutFeedback,
  Pressable
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  Avatar, 
  Searchbar,
  Portal,
  Modal,
  IconButton,
  ActivityIndicator,
  Menu,
  Button
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import materialTheme from '../../../material-theme.json';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { collection, query, orderBy, getDocs, updateDoc, doc, onSnapshot, where, Timestamp, limit, startAfter } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Hooks & Components
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import ExpressiveCard from '../../components/ExpressiveCard';
import DetailRow from '../../components/DetailRow';
import OverlineText from '../../components/OverlineText';

const { width } = Dimensions.get('window');

export default function AdminNovedadesScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  const { can } = usePermissions();
  const primaryColor = getPrimaryColor();

  // Surface colors dinámicos
  const surfaceColors = useMemo(() => {
    const scheme = paperTheme.dark ? materialTheme.schemes.dark : materialTheme.schemes.light;
    return {
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      onSurface: scheme.onSurface,
      onSurfaceVariant: scheme.onSurfaceVariant,
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      surfaceVariant: scheme.surfaceVariant,
      background: scheme.background,
      error: scheme.error,
      outlineVariant: scheme.outlineVariant
    };
  }, [paperTheme.dark]);

  const [novedades, setNovedades] = useState([]);
  const [filteredNovedades, setFilteredNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Removido filterStatus - mostrar todo y permitir filtrar por tipo/fecha solamente
  const [filterType, setFilterType] = useState('all'); // 'all' | 'llegada_tarde' | etc.
  const [filterDate, setFilterDate] = useState('last_30'); // 'today' | 'last_7' | 'last_30' | 'this_month' | 'last_month' | 'last_3_months' | 'all'
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [dateMenuVisible, setDateMenuVisible] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false); // ✅ Control manual de ejecución

  // ✅ Ref para cleanup de listener
  const unsubscribeRef = useRef(null);

  // ✅ Calcular rango de fechas según filtro
  const getDateRange = useCallback((filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(filter) {
      case 'today':
        return Timestamp.fromDate(today);
      case 'last_7':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return Timestamp.fromDate(last7);
      case 'last_30':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return Timestamp.fromDate(last30);
      case 'this_month':
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return Timestamp.fromDate(thisMonth);
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return Timestamp.fromDate(lastMonth);
      case 'last_3_months':
        const last3Months = new Date(today);
        last3Months.setMonth(last3Months.getMonth() - 3);
        return Timestamp.fromDate(last3Months);
      case 'all':
      default:
        return null;
    }
  }, []);

  // ✅ Función para aplicar filtros manualmente
  const applyFilters = useCallback(() => {
    setFiltersApplied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ✅ Función para limpiar filtros y vaciar resultados
  const clearFilters = useCallback(() => {
    setFilterType('all');
    setFilterDate('last_30');
    setNovedades([]);
    setFilteredNovedades([]);
    setFiltersApplied(false);
    setLastVisible(null);
    setHasMore(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // ✅ Real-time listener con query optimizado por filtros (solo ejecuta si filtersApplied === true)
  useFocusEffect(
    useCallback(() => {
      // ❌ No ejecutar si no se han aplicado filtros manualmente
      if (!filtersApplied) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setNovedades([]);
      setLastVisible(null);
      setHasMore(true);
      
      // ✅ Construir query dinámico correctamente
      // ORDEN CORRECTO: collection → where() clauses → orderBy() → limit()
      let queryConstraints = [collection(db, 'novedades')];
      
      // Filtrar por tipo si no es 'all'
      if (filterType !== 'all') {
        queryConstraints.push(where('type', '==', filterType));
      }
      
      // Filtrar por fecha si no es 'all'
      const dateStart = getDateRange(filterDate);
      if (dateStart) {
        queryConstraints.push(where('date', '>=', dateStart));
      }
      
      // Siempre ordenar por fecha descendente
      queryConstraints.push(orderBy('date', 'desc'));
      queryConstraints.push(limit(20));
      
      const q = query(...queryConstraints);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNovedades(data);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 20);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error('Error al cargar novedades:', error);
        if (error.message?.includes('index')) {
          Alert.alert(
            'Índice Requerido', 
            'Firestore necesita crear un índice compuesto. Verifica Firebase Console.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'No se pudieron cargar las novedades');
        }
        setLoading(false);
        setRefreshing(false);
      });
    
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [filtersApplied, filterType, filterDate, getDateRange]) // ✅ Solo re-ejecutar cuando se apliquen filtros
);

  // Mantener onRefresh solo para el pull-to-refresh manual
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // El onSnapshot se encarga, pero simulamos un delay o podríamos reconectar
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // ✅ Cargar más novedades (paginación) - Solo si filtros aplicados
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastVisible || !filtersApplied) return;
    
    setLoadingMore(true);
    try {
      // Construir query con el mismo orden que el inicial
      let queryConstraints = [collection(db, 'novedades')];
      
      if (filterType !== 'all') {
        queryConstraints.push(where('type', '==', filterType));
      }
      
      const dateStart = getDateRange(filterDate);
      if (dateStart) {
        queryConstraints.push(where('date', '>=', dateStart));
      }
      
      queryConstraints.push(orderBy('date', 'desc'));
      queryConstraints.push(startAfter(lastVisible));
      queryConstraints.push(limit(20));
      
      const q = query(...queryConstraints);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const newData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNovedades(prev => [...prev, ...newData]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 20);
      }
    } catch (error) {
      console.error('Error loading more:', error);
    }
    setLoadingMore(false);
  }, [hasMore, loadingMore, lastVisible, filtersApplied, filterType, filterDate, getDateRange]);

  const filterData = useCallback(() => {
    let filtered = novedades;

    // Solo filtrar por búsqueda (status y tipo ya están en query)
    if (searchQuery.trim()) {
      filtered = filtered.filter(n =>
        n.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [novedades, searchQuery]);

  useEffect(() => {
    setFilteredNovedades(filterData());
  }, [searchQuery, novedades, filterData]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const item = novedades.find(n => n.id === id);

      // Optimistic Update
      setNovedades(prev => prev.map(n => 
        n.id === id ? { ...n, status: newStatus } : n
      ));

      await updateDoc(doc(db, 'novedades', id), { status: newStatus });
      
      // ✅ Lógica de Reapertura Automática
      if (newStatus === 'approved' && item?.type === 'solicitud_reapertura') {
        try {
            const dateObj = item.date.toDate();
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            
            // Buscar el documento de asistencia correcto (ID autogenerado)
            const qAsistencia = query(
                collection(db, 'asistencias'),
                where('uid', '==', item.uid),
                where('fecha', '==', dateStr)
            );
            
            const snapshot = await getDocs(qAsistencia);
            
            if (!snapshot.empty) {
                // ✅ Ordenar en memoria para evitar errores de índice y asegurar el último registro
                const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                const docData = docs[0];
                const docId = docData.id;

                // ❌ Lógica de "Gap" ELIMINADA a petición del usuario.
                // Al reabrir, se asume que el tiempo transcurrido SÍ fue trabajado.
                // Simplemente borramos la salida y dejamos que el contador siga corriendo.
                
                await updateDoc(doc(db, 'asistencias', docId), {
                    salida: null,
                    horasTrabajadas: null,
                    estadoActual: 'trabajando'
                    // No tocamos los breaks
                });
                Alert.alert('Reapertura Exitosa', 'La jornada ha sido reabierta. El tiempo transcurrido contará como trabajado.');
            } else {
                throw new Error('No se encontró registro de asistencia para esta fecha');
            }
        } catch (err) {
            console.error("Error reabriendo jornada:", err);
            Alert.alert('Advertencia', 'Se aprobó la novedad pero no se pudo reabrir la jornada automáticamente. Verifique si existe el registro.');
        }
      }

      if (selectedNovedad?.id === id) {
        setSelectedNovedad(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
      // fetchNovedades(); // Ya no es necesario revertir manualmente, onSnapshot lo hará si falla en servidor
    }
  };

  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={[
          styles.actionButton, 
          { 
            backgroundColor: surfaceColors.errorContainer, 
            transform: [{ translateX: trans }],
            borderRadius: 100, // Pill/Circle shape
            width: 80, // Fixed width for circle/pill
            height: 80, // Fixed height
            marginRight: 24, // Spacing from edge
          }
        ]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleStatusChange(item.id, 'rejected');
            }}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            android_ripple={{ color: surfaceColors.onErrorContainer + '1F', borderless: true }}
          >
            <MaterialCommunityIcons name="close" size={32} color={surfaceColors.onErrorContainer} />
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftActionContainer}>
        <Animated.View style={[
          styles.actionButton, 
          { 
            backgroundColor: surfaceColors.primaryContainer, 
            transform: [{ translateX: trans }],
            borderRadius: 100, // Pill/Circle shape
            width: 80,
            height: 80,
            marginLeft: 24,
          }
        ]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleStatusChange(item.id, 'approved');
            }}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            android_ripple={{ color: surfaceColors.onPrimaryContainer + '1F', borderless: true }}
          >
            <MaterialCommunityIcons name="check" size={32} color={surfaceColors.onPrimaryContainer} />
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={(p, d) => renderRightActions(p, d, item)}
      renderLeftActions={(p, d) => renderLeftActions(p, d, item)}
      containerStyle={{ overflow: 'visible' }} // Allow shadows/elevation to show
    >
      <ExpressiveCard 
        onPress={() => { setSelectedNovedad(item); setModalVisible(true); }}
        style={{ marginBottom: 16 }}
        variant="outlined" // ✅ CORRECCIÓN: Forzar variante outlined para tener borde
      >
        <View style={styles.cardHeader}>
          <Avatar.Text 
            size={48} // Larger avatar for expressive touch
            label={item.userName ? item.userName.substring(0, 2).toUpperCase() : 'NA'} 
            style={{ backgroundColor: surfaceColors.primaryContainer }}
            color={surfaceColors.onPrimaryContainer}
            labelStyle={{ fontWeight: '600' }}
          />
          <View style={styles.headerText}>
            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 18, 
              fontWeight: '500', 
              color: surfaceColors.onSurface,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }] // Google Look
            }}>
              {item.userName || 'Usuario'}
            </Text>
            <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
              {item.date?.toDate ? format(item.date.toDate(), "d MMM, h:mm a", { locale: es }) : 'Fecha inválida'}
            </Text>
          </View>
          
          {/* Status Chip - Material 3 Assist Chip Style */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: item.status === 'pending' ? surfaceColors.outlineVariant : 'transparent',
            backgroundColor: item.status === 'pending' ? 'transparent' : item.status === 'approved' ? surfaceColors.primaryContainer : surfaceColors.errorContainer
          }}>
            <MaterialCommunityIcons 
              name={item.status === 'pending' ? 'clock-outline' : item.status === 'approved' ? 'check' : 'close'}
              size={16}
              color={item.status === 'pending' ? surfaceColors.onSurfaceVariant : item.status === 'approved' ? surfaceColors.onPrimaryContainer : surfaceColors.onErrorContainer}
              style={{ marginRight: 6 }}
            />
            <Text style={{ 
              color: item.status === 'pending' ? surfaceColors.onSurfaceVariant : item.status === 'approved' ? surfaceColors.onPrimaryContainer : surfaceColors.onErrorContainer, 
              fontSize: 12, 
              fontWeight: '600' 
            }}>
              {item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
            </Text>
          </View>
        </View>
        
        <View style={{ marginTop: 16 }}>
            <OverlineText color={surfaceColors.primary} style={{ marginBottom: 6 }}>
                {item.type?.replace('_', ' ')}
            </OverlineText>
            {item.description ? (
                <Text 
                  numberOfLines={2} 
                  style={{ 
                    color: surfaceColors.onSurfaceVariant, 
                    fontSize: 15, 
                    lineHeight: 22 
                  }}
                >
                    {item.description}
                </Text>
            ) : null}
        </View>
      </ExpressiveCard>
    </Swipeable>
  );

  // ✅ Validación de permiso (después de todos los hooks)
  if (!can(APP_PERMISSIONS.ADMIN_NOVEDADES)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <MaterialCommunityIcons name="shield-lock" size={64} color={paperTheme.colors.error} />
          <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: '600' }}>🔒 Acceso Denegado</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center' }}>No tienes permiso para administrar novedades</Text>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text variant="bodyMedium" style={{ color: primaryColor, fontWeight: '600' }}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
        
        {/* Header Expresivo */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              iconColor={surfaceColors.onSurface}
            />
            <IconButton
              icon="inbox"
              mode="contained-tonal"
              size={20}
              onPress={onRefresh}
              iconColor={surfaceColors.primary}
              style={{
                backgroundColor: surfaceColors.primaryContainer,
              }}
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 57, // Display Small
              lineHeight: 64,
              fontWeight: '400', 
              color: surfaceColors.onSurface, 
              letterSpacing: -0.5,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }] // Google Look
            }}>
              Novedades
            </Text>
            <Text variant="titleMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
              Gestionar reportes de empleados
            </Text>
          </View>
        </View>

        {/* Filters Container */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16, gap: 16 }}>
          {/* Filters Grid: Tipo + Fecha */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Filter Type - Dropdown Menu */}
            <View style={{ flex: 1 }}>
              <Menu
                visible={typeMenuVisible}
                onDismiss={() => setTypeMenuVisible(false)}
                anchor={
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setTypeMenuVisible(true);
                      Haptics.selectionAsync();
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
                          Tipo de Novedad
                        </Text>
                        <Text style={{ 
                          fontSize: 15, 
                          color: surfaceColors.onSurface,
                          fontFamily: 'Roboto-Flex',
                          fontWeight: '500'
                        }}>
                          {[
                            { value: 'all', label: 'Todos' },
                            { value: 'llegada_tarde', label: 'Llegada Tarde' },
                            { value: 'olvido_salida', label: 'Olvido Salida' },
                            { value: 'solicitud_reapertura', label: 'Reapertura' },
                            { value: 'urgencia_medica', label: 'Urgencia Médica' },
                            { value: 'calamidad', label: 'Calamidad' },
                            { value: 'otro', label: 'Otro' },
                          ].find(t => t.value === filterType)?.label || 'Todos'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons 
                        name="menu-down" 
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
                setFilterType('all'); 
                setTypeMenuVisible(false); 
              }}
              title="Todos"
              leadingIcon="filter-variant"
              titleStyle={{ color: filterType === 'all' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterType('llegada_tarde'); 
                setTypeMenuVisible(false); 
              }}
              title="Llegada Tarde"
              leadingIcon="clock-alert"
              titleStyle={{ color: filterType === 'llegada_tarde' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterType('olvido_salida'); 
                setTypeMenuVisible(false); 
              }}
              title="Olvido Salida"
              leadingIcon="logout"
              titleStyle={{ color: filterType === 'olvido_salida' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterType('solicitud_reapertura'); 
                setTypeMenuVisible(false); 
              }}
              title="Reapertura"
              leadingIcon="lock-open"
              titleStyle={{ color: filterType === 'solicitud_reapertura' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterType('urgencia_medica'); 
                setTypeMenuVisible(false); 
              }}
              title="Urgencia Médica"
              leadingIcon="hospital-box"
              titleStyle={{ color: filterType === 'urgencia_medica' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterType('calamidad'); 
                setTypeMenuVisible(false); 
              }}
              title="Calamidad"
              leadingIcon="alert"
              titleStyle={{ color: filterType === 'calamidad' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterType('otro'); 
                setTypeMenuVisible(false); 
              }}
              title="Otro"
              leadingIcon="dots-horizontal"
              titleStyle={{ color: filterType === 'otro' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
              </Menu>
            </View>

            {/* Filter Date - Dropdown Menu */}
            <View style={{ flex: 1 }}>
              <Menu
                visible={dateMenuVisible}
                onDismiss={() => setDateMenuVisible(false)}
                anchor={
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setDateMenuVisible(true);
                      Haptics.selectionAsync();
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
                          Rango de Fecha
                        </Text>
                        <Text style={{ 
                          fontSize: 15, 
                          color: surfaceColors.onSurface,
                          fontFamily: 'Roboto-Flex',
                          fontWeight: '500'
                        }}>
                          {[
                            { value: 'today', label: 'Hoy' },
                            { value: 'last_7', label: 'Últimos 7 días' },
                            { value: 'last_30', label: 'Últimos 30 días' },
                            { value: 'this_month', label: 'Este mes' },
                            { value: 'last_month', label: 'Mes anterior' },
                            { value: 'last_3_months', label: 'Últimos 3 meses' },
                            { value: 'all', label: 'Todo' },
                          ].find(d => d.value === filterDate)?.label || 'Últimos 30 días'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons 
                        name="menu-down" 
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
                setFilterDate('today'); 
                setDateMenuVisible(false); 
              }}
              title="Hoy"
              leadingIcon="calendar-today"
              titleStyle={{ color: filterDate === 'today' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterDate('last_7'); 
                setDateMenuVisible(false); 
              }}
              title="Últimos 7 días"
              leadingIcon="calendar-week"
              titleStyle={{ color: filterDate === 'last_7' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterDate('last_30'); 
                setDateMenuVisible(false); 
              }}
              title="Últimos 30 días"
              leadingIcon="calendar-month"
              titleStyle={{ color: filterDate === 'last_30' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterDate('this_month'); 
                setDateMenuVisible(false); 
              }}
              title="Este mes"
              leadingIcon="calendar"
              titleStyle={{ color: filterDate === 'this_month' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterDate('last_month'); 
                setDateMenuVisible(false); 
              }}
              title="Mes anterior"
              leadingIcon="calendar-arrow-left"
              titleStyle={{ color: filterDate === 'last_month' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterDate('last_3_months'); 
                setDateMenuVisible(false); 
              }}
              title="Últimos 3 meses"
              leadingIcon="calendar-multiple"
              titleStyle={{ color: filterDate === 'last_3_months' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
            <Menu.Item
              onPress={() => { 
                setFilterDate('all'); 
                setDateMenuVisible(false); 
              }}
              title="Todo"
              leadingIcon="calendar-blank"
              titleStyle={{ color: filterDate === 'all' ? surfaceColors.primary : surfaceColors.onSurface }}
            />
              </Menu>
            </View>
          </View>

          {/* Searchbar */}
          <Searchbar
            placeholder="Buscar por nombre de empleado..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{ 
              backgroundColor: surfaceColors.surfaceContainerHigh, 
              borderRadius: 28,
              height: 56,
            }}
            inputStyle={{ 
              minHeight: 0,
              alignSelf: 'center',
              fontFamily: 'Roboto-Flex',
            }}
            iconColor={surfaceColors.onSurfaceVariant}
            placeholderTextColor={surfaceColors.onSurfaceVariant}
            elevation={0}
          />

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Button
              mode="contained"
              onPress={applyFilters}
              icon="filter-check"
              style={{ flex: 1, borderRadius: 24 }}
              contentStyle={{ paddingVertical: 10 }}
              labelStyle={{ fontFamily: 'Roboto-Flex', fontWeight: '600', fontSize: 15 }}
            >
              Aplicar Filtros
            </Button>
            <Button
              mode="outlined"
              onPress={clearFilters}
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

        {!filtersApplied && !loading ? (
          <View style={styles.emptyState}>
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: surfaceColors.surfaceContainerHigh,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <MaterialCommunityIcons 
                name="filter-outline" 
                size={80} 
                color={surfaceColors.primary} 
              />
            </View>
            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 24, 
              fontWeight: '400', 
              color: surfaceColors.onSurface,
              textAlign: 'center',
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}>
              Configura los filtros
            </Text>
            <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
              Selecciona los criterios de búsqueda y presiona "Aplicar Filtros" para ver las novedades.
            </Text>
          </View>
        ) : filteredNovedades.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: surfaceColors.surfaceContainerHigh,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <MaterialCommunityIcons 
                name="check-decagram" 
                size={80} 
                color={surfaceColors.primary} 
              />
            </View>
            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 24, 
              fontWeight: '400', 
              color: surfaceColors.onSurface,
              textAlign: 'center',
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}>
              ¡Todo al día!
            </Text>
            <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
              No hay novedades pendientes por revisar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNovedades}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              loadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={surfaceColors.primary} />
                </View>
              ) : null
            )}
          />
        )}

        {/* Detail Modal */}
        <Portal>
          <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: surfaceColors.surfaceContainerHigh }]}>
            {selectedNovedad && (
              <View>
                <OverlineText color={surfaceColors.primary} style={{ marginBottom: 16, fontSize: 16 }}>
                  Detalle de Novedad
                </OverlineText>
                
                <DetailRow 
                  icon="account"
                  label="Empleado"
                  value={selectedNovedad.userName}
                  iconColor={surfaceColors.primary}
                />
                
                <View style={{ height: 12 }} />

                <DetailRow 
                  icon="alert-circle"
                  label="Tipo"
                  value={selectedNovedad.type?.replace('_', ' ').toUpperCase()}
                  iconColor={surfaceColors.onSurfaceVariant}
                />

                <View style={{ height: 12 }} />

                <DetailRow 
                  icon="file-document-outline"
                  label="Descripción"
                  value={selectedNovedad.description || 'Sin descripción'}
                  iconColor={surfaceColors.onSurfaceVariant}
                />

                {selectedNovedad.attachmentUrl && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(selectedNovedad.attachmentUrl);
                    }}
                    android_ripple={{ color: surfaceColors.primary + '1F' }}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 14,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: surfaceColors.primary,
                        marginTop: 24,
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                      }
                    ]}
                  >
                    <MaterialCommunityIcons name="paperclip" size={20} color={surfaceColors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ color: surfaceColors.primary, fontWeight: '500', fontSize: 15 }}>
                      Ver Adjunto
                    </Text>
                  </Pressable>
                )}

                {/* Botones de Acción - Solo si está pendiente */}
                {selectedNovedad.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleStatusChange(selectedNovedad.id, 'rejected');
                        setModalVisible(false);
                      }}
                      android_ripple={{ color: surfaceColors.onErrorContainer + '1F' }}
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          marginRight: 8,
                          padding: 16,
                          borderRadius: 24,
                          backgroundColor: surfaceColors.errorContainer,
                          alignItems: 'center',
                          transform: [{ scale: pressed ? 0.98 : 1 }]
                        }
                      ]}
                    >
                      <Text style={{ color: surfaceColors.onErrorContainer, fontWeight: '600', fontSize: 16 }}>
                        Rechazar
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleStatusChange(selectedNovedad.id, 'approved');
                        setModalVisible(false);
                      }}
                      android_ripple={{ color: surfaceColors.onPrimaryContainer + '1F' }}
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          marginLeft: 8,
                          padding: 16,
                          borderRadius: 24,
                          backgroundColor: surfaceColors.primaryContainer,
                          alignItems: 'center',
                          transform: [{ scale: pressed ? 0.98 : 1 }]
                        }
                      ]}
                    >
                      <Text style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '600', fontSize: 16 }}>
                        {selectedNovedad.type === 'solicitud_reapertura' ? 'Autorizar Reapertura' : 'Aprobar'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </Modal>
        </Portal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerContent: {
    paddingHorizontal: 4,
  },
  filterChips: {
    // Removed flex styles that caused stretching
  },
  searchBar: {
    marginBottom: 20, // Increased spacing
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  rightActionContainer: {
    width: 120, // Increased width for better swipe feel
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  leftActionContainer: {
    width: 120,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0, // No shadow, just color
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  modal: {
    margin: 20,
    padding: 24,
    borderRadius: 28,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
  }
});
