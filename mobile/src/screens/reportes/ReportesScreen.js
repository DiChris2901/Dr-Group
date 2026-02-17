import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Pressable,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Text, 
  Surface, 
  SegmentedButtons, // ✅ Revertido a SegmentedButtons
  Card, 
  Avatar, 
  useTheme, 
  ActivityIndicator,
  Button,
  IconButton,
  Menu
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { es } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function ReportesScreen() {
  const navigation = useNavigation();
  const { userProfile, user, activeSession } = useAuth();
  const { can } = usePermissions();
  const theme = useTheme();
  
  // ✅ TODOS LOS HOOKS PRIMERO (Rules of Hooks)
  const [loading, setLoading] = useState(false); // ✅ No auto-carga
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // ✅ Rastrear si ya buscó
  const [rangoSeleccionado, setRangoSeleccionado] = useState('day'); // ✅ Día por defecto
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('todos'); // UID o 'todos'
  const [empleados, setEmpleados] = useState([]); // Lista de empleados
  const [menuVisible, setMenuVisible] = useState(false);
  const [periodoMenuVisible, setPeriodoMenuVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [stats, setStats] = useState({
    totalHoras: 0,
    diasTrabajados: 0,
    promedioDiario: 0,
    puntualidad: null,
    onTimeCount: 0,
    punctualityBaseCount: 0,
    chartData: [0, 0, 0, 0, 0, 0, 0],
    chartLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  });
  
  // 🔒 Validación de permisos (NO bloquear UI, solo controlar contenido)
  const puedeVerTodos = can(APP_PERMISSIONS.REPORTES_TODOS);
  const puedeVerPropios = can(APP_PERMISSIONS.REPORTES_PROPIOS);
  
  // ✅ Surface colors dinámicos (Material You Expressive)
  const surfaceColors = theme.dark 
    ? materialTheme.schemes.dark 
    : materialTheme.schemes.light;
  
  const dynamicStyles = {
    container: { backgroundColor: surfaceColors.surface },
    surfaceContainerLow: { backgroundColor: surfaceColors.surfaceContainerLow },
    surfaceContainer: { backgroundColor: surfaceColors.surfaceContainer },
    text: { color: surfaceColors.onSurface },
    textSecondary: { color: surfaceColors.onSurfaceVariant }
  };

  // ✅ Limpiar filtros y resultados
  const limpiarFiltros = useCallback(() => {
    setRangoSeleccionado('day');
    setEmpleadoSeleccionado('todos');
    setHasSearched(false);
    setStartDate(new Date());
    setEndDate(new Date());
    setStats({
      totalHoras: 0,
      diasTrabajados: 0,
      promedioDiario: 0,
      puntualidad: null,
      onTimeCount: 0,
      punctualityBaseCount: 0,
      chartData: [0, 0, 0, 0, 0, 0, 0],
      chartLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ✅ Limpiar al salir de la pantalla
  useFocusEffect(
    useCallback(() => {
      return () => {
        limpiarFiltros();
      };
    }, [limpiarFiltros])
  );

  // ✅ Detectar cambios REALES de permisos (no el mount inicial)
  const permissionsInitialized = useRef(false);
  useEffect(() => {
    if (!permissionsInitialized.current) {
      // Ignorar la primera ejecución (mount inicial / resolución de permisos)
      permissionsInitialized.current = true;
      return;
    }
    // Solo limpiar si los permisos cambian DESPUÉS de la inicialización
    if (hasSearched) {
      setStats({
        totalHoras: 0,
        diasTrabajados: 0,
        promedioDiario: 0,
        puntualidad: null,
        onTimeCount: 0,
        punctualityBaseCount: 0,
        chartData: [0, 0, 0, 0, 0, 0, 0],
        chartLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D']
      });
      setHasSearched(false);
      // Limpiar caché relacionada con reportes
      AsyncStorage.getAllKeys().then(keys => {
        const reportesKeys = keys.filter(key => key.startsWith('reportes_'));
        AsyncStorage.multiRemove(reportesKeys);
      });
    }
  }, [puedeVerTodos, puedeVerPropios]); // Ejecutar cuando cambien los permisos

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setHasSearched(true); // ✅ Marcar búsqueda realizada
      Haptics.selectionAsync();
      const hoy = new Date();
      let fechaDesde, fechaHasta;
      
      switch (rangoSeleccionado) {
        case 'day':
          fechaDesde = startOfDay(hoy);
          fechaHasta = endOfDay(hoy);
          break;
        case 'semana':
          fechaDesde = startOfWeek(hoy, { weekStartsOn: 1 });
          fechaHasta = endOfWeek(hoy, { weekStartsOn: 1 });
          break;
        case 'mes':
          fechaDesde = startOfMonth(hoy);
          fechaHasta = endOfMonth(hoy);
          break;
        case 'custom':
          fechaDesde = startOfDay(startDate);
          fechaHasta = endOfDay(endDate);
          break;
        default:
          fechaDesde = startOfDay(hoy);
          fechaHasta = endOfDay(hoy);
      }
      
      const fechaDesdeStr = format(fechaDesde, 'yyyy-MM-dd');
      const fechaHastaStr = format(fechaHasta, 'yyyy-MM-dd');
      
      // ✅ Generar clave única para caché
      const cacheKey = `reportes_${rangoSeleccionado}_${empleadoSeleccionado}_${user?.uid}`;
      
      // ✅ Verificar caché local (válido por 30 minutos)
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
          
          if (timestamp > thirtyMinutesAgo) {
            // Caché válido: usar datos guardados
            setStats(data);
            setLoading(false);
            return;
          }
        }
      } catch (cacheError) {
        console.log('Error leyendo caché:', cacheError);
      }
      
      let q;
      
      // 🔒 CONTROL DE ACCESO BASADO EN PERMISOS
      if (puedeVerTodos) {
        // PERMISO: reportes.todos → Ver reportes de TODOS los usuarios
        if (empleadoSeleccionado === 'todos') {
          q = query(
            collection(db, 'asistencias'),
            where('fecha', '>=', fechaDesdeStr),
            where('fecha', '<=', fechaHastaStr)
          );
        } else {
          // Ver empleado específico
          q = query(
            collection(db, 'asistencias'),
            where('uid', '==', empleadoSeleccionado),
            where('fecha', '>=', fechaDesdeStr),
            where('fecha', '<=', fechaHastaStr)
          );
        }
      } else if (puedeVerPropios) {
        // PERMISO: reportes.propios → Ver SOLO sus reportes
        const targetUid = userProfile?.uid || user?.uid;
        if (!targetUid) {
          setLoading(false);
          return;
        }
        q = query(
          collection(db, 'asistencias'),
          where('uid', '==', targetUid),
          where('fecha', '>=', fechaDesdeStr),
          where('fecha', '<=', fechaHastaStr)
        );
      } else {
        // Sin permisos: no cargar nada
        setLoading(false);
        return;
      }
      
      const querySnapshot = await getDocs(q);
      let asistencias = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 🎯 FILTRAR ADMIN: Solo si tiene permiso reportes.todos y vista "todos"
      if (puedeVerTodos && empleadoSeleccionado === 'todos') {
        // Obtener UIDs de usuarios ADMIN para excluirlos de reportes generales
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const adminUIDs = new Set();
        
        usersSnapshot.docs.forEach(userDoc => {
          const userData = userDoc.data();
          if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
            adminUIDs.add(userDoc.id);
          }
        });
        
        // Filtrar asistencias de ADMIN
        asistencias = asistencias.filter(a => !adminUIDs.has(a.uid));
      }
      
      // ✅ Filtrar días únicos y válidos
      const fechasUnicas = new Set();
      const asistenciasValidas = asistencias.filter(a => {
        // Si tiene fecha y entrada, cuenta como día asistido
        // Independientemente de si completó las horas o no
        if (a.fecha && a.entrada) {
          fechasUnicas.add(a.fecha);
          return true;
        }
        return false;
      });

      const diasReales = fechasUnicas.size;
      
      // Calcular métricas
      let totalMinutos = 0;
      let onTimeCount = 0;
      let chartData = [];
      let chartLabels = [];
      
      if (rangoSeleccionado === 'day') {
        // Vista Diaria: Horas trabajadas por hora del día
        chartLabels = ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM'];
        chartData = new Array(6).fill(0);
        
        // Solo mostrar total de horas (chart simplificado para día)
        const totalHoras = asistenciasValidas.reduce((sum, a) => {
          if (a.horasTrabajadas) {
            const parts = a.horasTrabajadas.split(':');
            if (parts.length >= 2) {
              const h = Number(parts[0]) || 0;
              const m = Number(parts[1]) || 0;
              return sum + h + (m / 60);
            }
          }
          return sum;
        }, 0);
        
        // Distribuir proporcionalmente en el día
        chartData = chartData.map((_, i) => Number((totalHoras / 6).toFixed(1)));
      } else if (rangoSeleccionado === 'semana') {
        chartLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        const days = new Array(7).fill(0);
        
        asistenciasValidas.forEach(a => {
          if (a.fecha) {
            const [year, month, day] = a.fecha.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dayIndex = date.getDay(); 
            const index = dayIndex === 0 ? 6 : dayIndex - 1;
            
            if (a.horasTrabajadas) {
              const parts = a.horasTrabajadas.split(':');
              if (parts.length >= 2) {
                const h = Number(parts[0]) || 0;
                const m = Number(parts[1]) || 0;
                days[index] += h + (m / 60);
              }
            }
          }
        });
        chartData = days.map(v => Number.isFinite(v) ? Number(v.toFixed(1)) : 0);
      } else if (rangoSeleccionado === 'mes') {
        chartLabels = ['S1', 'S2', 'S3', 'S4', 'S5'];
        const weeks = new Array(5).fill(0);
        
        asistenciasValidas.forEach(a => {
          if (a.fecha) {
            const [year, month, day] = a.fecha.split('-').map(Number);
            const weekIndex = Math.floor((day - 1) / 7);
            
            if (a.horasTrabajadas && weekIndex < 5) {
              const parts = a.horasTrabajadas.split(':');
              if (parts.length >= 2) {
                const h = Number(parts[0]) || 0;
                const m = Number(parts[1]) || 0;
                weeks[weekIndex] += h + (m / 60);
              }
            }
          }
        });
        chartData = weeks.map(v => Number.isFinite(v) ? Number(v.toFixed(1)) : 0);
      } else {
        // Vista Anual
        chartLabels = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        const months = new Array(12).fill(0);
        
        asistenciasValidas.forEach(a => {
          if (a.fecha) {
            const [year, month, day] = a.fecha.split('-').map(Number);
            // month es 1-12, index es 0-11
            const monthIndex = month - 1;
            
            if (a.horasTrabajadas && monthIndex >= 0 && monthIndex < 12) {
              const parts = a.horasTrabajadas.split(':');
              if (parts.length >= 2) {
                const h = Number(parts[0]) || 0;
                const m = Number(parts[1]) || 0;
                months[monthIndex] += h + (m / 60);
              }
            }
          }
        });
        chartData = months.map(v => Number.isFinite(v) ? Number(v.toFixed(1)) : 0);
      }

      // Configuración de jornada para puntualidad
      let workStartHour = 8;
      let workStartMinute = 0;
      let gracePeriod = 15;
      let workDays = [1, 2, 3, 4, 5];

      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'work_schedule'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.startTime) {
            const [h, m] = data.startTime.split(':').map(Number);
            workStartHour = h;
            workStartMinute = m;
          }
          if (data.gracePeriod !== undefined) gracePeriod = Number(data.gracePeriod);
          if (data.workDays) workDays = data.workDays;
        }
      } catch (e) {
        console.log('Usando configuración por defecto');
      }

      let punctualityBaseCount = 0;

      asistenciasValidas.forEach(a => {
        if (a.horasTrabajadas) {
          const parts = a.horasTrabajadas.split(':');
          if (parts.length >= 2) {
            const h = Number(parts[0]) || 0;
            const m = Number(parts[1]) || 0;
            totalMinutos += (h * 60) + m;
          }
        }
        
        if (a.entrada?.hora) {
          const date = a.entrada.hora.toDate ? a.entrada.hora.toDate() : new Date(a.entrada.hora);
          const dayOfWeek = date.getDay();
          
          if (workDays.includes(dayOfWeek)) {
            punctualityBaseCount++;
            const hour = date.getHours();
            const minute = date.getMinutes();
            const entryTime = hour * 60 + minute;
            const limitTime = workStartHour * 60 + workStartMinute + gracePeriod;

            if (entryTime <= limitTime) {
              onTimeCount++;
            }
          }
        }
      });

      // 🎯 CORRECCIÓN: Calcular promedio diario correctamente
      let promedioDiarioCalculado = 0;
      
      if (userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') {
        // ADMIN: Calcular promedio de promedios de cada empleado (sin contar ADMIN)
        const empleadoStats = {};
        
        asistenciasValidas.forEach(a => {
          if (!empleadoStats[a.uid]) {
            empleadoStats[a.uid] = { totalMinutos: 0, diasTrabajados: new Set() };
          }
          
          if (a.horasTrabajadas) {
            const parts = a.horasTrabajadas.split(':');
            if (parts.length >= 2) {
              const h = Number(parts[0]) || 0;
              const m = Number(parts[1]) || 0;
              empleadoStats[a.uid].totalMinutos += (h * 60) + m;
            }
          }
          
          if (a.fecha) {
            empleadoStats[a.uid].diasTrabajados.add(a.fecha);
          }
        });
        
        // Calcular promedio de cada empleado y luego el promedio general
        const promediosEmpleados = Object.values(empleadoStats)
          .filter(e => e.diasTrabajados.size > 0)
          .map(e => e.totalMinutos / e.diasTrabajados.size / 60)
          .filter(p => Number.isFinite(p)); // Filtrar NaN e Infinity
        
        if (promediosEmpleados.length > 0) {
          const sumaPromedios = promediosEmpleados.reduce((sum, p) => sum + p, 0);
          const promedio = sumaPromedios / promediosEmpleados.length;
          promedioDiarioCalculado = Number.isFinite(promedio) ? promedio.toFixed(1) : '0';
        }
      } else {
        // USUARIO NORMAL: Calcular su propio promedio
        if (diasReales > 0 && Number.isFinite(totalMinutos)) {
          const promedio = totalMinutos / diasReales / 60;
          promedioDiarioCalculado = Number.isFinite(promedio) ? promedio.toFixed(1) : '0';
        } else {
          promedioDiarioCalculado = '0';
        }
      }

      const statsData = {
        totalHoras: Number.isFinite(totalMinutos) ? Math.floor(totalMinutos / 60) : 0,
        diasTrabajados: diasReales,
        promedioDiario: promedioDiarioCalculado,
        puntualidad: punctualityBaseCount > 0 ? Math.round((onTimeCount / punctualityBaseCount) * 100) : null,
        onTimeCount,
        punctualityBaseCount,
        chartData,
        chartLabels
      };

      setStats(statsData);

      // ✅ Guardar en caché
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          data: statsData,
          timestamp: Date.now()
        }));
      } catch (cacheError) {
        console.log('Error guardando caché:', cacheError);
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rangoSeleccionado, empleadoSeleccionado, startDate, endDate, userProfile, user, activeSession]);

  // 🎯 Cargar lista de empleados (solo para ADMIN)
  useEffect(() => {
    const cargarEmpleados = async () => {
      if (userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN') {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const empleadosLista = [];
          
          usersSnapshot.docs.forEach(userDoc => {
            const userData = userDoc.data();
            // Excluir ADMIN y SUPER_ADMIN
            if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
              empleadosLista.push({
                uid: userDoc.id,
                nombre: userData.name || userData.displayName || userData.email,
                email: userData.email
              });
            }
          });
          
          // Ordenar alfabéticamente
          empleadosLista.sort((a, b) => a.nombre.localeCompare(b.nombre));
          setEmpleados(empleadosLista);
        } catch (error) {
          console.error('Error cargando empleados:', error);
        }
      }
    };
    
    cargarEmpleados();
  }, [userProfile]);

  // ✅ ELIMINADO: useEffect de auto-carga
  // Ahora solo carga al presionar "Aplicar Filtros"

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDatos();
  }, [cargarDatos]);

  const StatCard = memo(({ title, value, subtitle, icon, color, style, isHero = false }) => {
    // Detectar si es layout horizontal para ajustar espaciado
    const isRow = style?.flexDirection === 'row' || (typeof style === 'object' && style.flexDirection === 'row');

    return (
      <Pressable
        onPress={() => Haptics.selectionAsync()}
        android_ripple={{ color: surfaceColors.primary + '1F' }}
        style={({ pressed }) => [
          styles.statCard,
          {
            backgroundColor: pressed 
              ? surfaceColors.surfaceContainer
              : surfaceColors.surfaceContainerLow,
            borderWidth: 1,
            borderColor: surfaceColors.outlineVariant, // ✅ Borde sutil como en Novedades
            borderRadius: 16, // ✅ Radio 16px como en Novedades
          },
          style
        ]}
      >
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: color + '15',
            width: isHero ? 48 : 40,
            height: isHero ? 48 : 40,
            borderRadius: isHero ? 24 : 20,
            marginBottom: isRow ? 0 : 8
          }
        ]}>
          <MaterialCommunityIcons name={icon} size={isHero ? 24 : 20} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text 
            variant={isHero ? "headlineSmall" : "titleLarge"}
            style={{ 
              fontWeight: '600', 
              color: surfaceColors.onSurface, 
              letterSpacing: -0.5,
              fontFamily: 'Roboto-Flex',
              fontVariationSettings: "'wdth' 110",
              lineHeight: isHero ? 32 : 28
            }}
          >
            {value}
          </Text>
          <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, fontWeight: '500', marginTop: 0 }}>{title}</Text>
          {subtitle && <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10, marginTop: 0 }}>{subtitle}</Text>}
        </View>
      </Pressable>
    );
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
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
          <IconButton
            icon="chart-bar"
            mode="contained-tonal"
            size={20}
            onPress={() => {
              Haptics.selectionAsync();
              onRefresh();
            }}
            iconColor={surfaceColors.primary}
            style={{
              backgroundColor: surfaceColors.primaryContainer,
            }}
          />
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
            Estadísticas
          </Text>
          <Text variant="titleMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            {puedeVerTodos ? 'Desempeño del equipo' : 'Tu desempeño laboral'}
          </Text>
        </View>
      </View>

      {/* Filters Grid: Empleados + Período (Estilo AdminNovedades) */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16, gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Filter Empleados - Solo si tiene permiso */}
              {puedeVerTodos && (
                <View style={{ flex: 1 }}>
                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <TouchableWithoutFeedback
                        onPress={() => {
                          setMenuVisible(true);
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
                                Empleado
                              </Text>
                              <Text style={{ 
                                fontSize: 15, 
                                color: surfaceColors.onSurface,
                                fontFamily: 'Roboto-Flex',
                                fontWeight: '500'
                              }}>
                                {empleadoSeleccionado === 'todos' 
                                  ? 'Todos' 
                                  : empleados.find(e => e.uid === empleadoSeleccionado)?.nombre?.split(' ')[0] || 'Sel.'}
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
                        setEmpleadoSeleccionado('todos'); 
                        setMenuVisible(false); 
                      }}
                      title="Todos los Empleados"
                      leadingIcon="account-multiple"
                      titleStyle={{
                        color: empleadoSeleccionado === 'todos' ? surfaceColors.primary : surfaceColors.onSurface,
                        fontWeight: empleadoSeleccionado === 'todos' ? '600' : '400'
                      }}
                    />
                    {empleados.map((emp) => (
                      <Menu.Item
                        key={emp.uid}
                        onPress={() => { 
                          setEmpleadoSeleccionado(emp.uid); 
                          setMenuVisible(false); 
                        }}
                        title={emp.nombre}
                        leadingIcon="account"
                        titleStyle={{
                          color: empleadoSeleccionado === emp.uid ? surfaceColors.primary : surfaceColors.onSurface,
                          fontWeight: empleadoSeleccionado === emp.uid ? '600' : '400'
                        }}
                      />
                    ))}
                  </Menu>
                </View>
              )}

              {/* Filter Período */}
              <View style={{ flex: 1 }}>
                <Menu
                  visible={periodoMenuVisible}
                  onDismiss={() => setPeriodoMenuVisible(false)}
                  anchor={
                    <TouchableWithoutFeedback
                      onPress={() => {
                        setPeriodoMenuVisible(true);
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
                              Período
                            </Text>
                            <Text style={{ 
                              fontSize: 15, 
                              color: surfaceColors.onSurface,
                              fontFamily: 'Roboto-Flex',
                              fontWeight: '500'
                            }}>
                              {[
                                { value: 'day', label: 'Hoy' },
                                { value: 'semana', label: 'Semana' },
                                { value: 'mes', label: 'Este Mes' },
                                { value: 'custom', label: 'Rango' },
                              ].find(p => p.value === rangoSeleccionado)?.label || 'Hoy'}
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
                      setRangoSeleccionado('day'); 
                      setPeriodoMenuVisible(false); 
                    }}
                    title="Hoy"
                    leadingIcon="calendar-today"
                    titleStyle={{
                      color: rangoSeleccionado === 'day' ? surfaceColors.primary : surfaceColors.onSurface,
                      fontWeight: rangoSeleccionado === 'day' ? '600' : '400'
                    }}
                  />
                  <Menu.Item
                    onPress={() => { 
                      setRangoSeleccionado('semana'); 
                      setPeriodoMenuVisible(false); 
                    }}
                    title="Esta Semana"
                    leadingIcon="calendar-week"
                    titleStyle={{
                      color: rangoSeleccionado === 'semana' ? surfaceColors.primary : surfaceColors.onSurface,
                      fontWeight: rangoSeleccionado === 'semana' ? '600' : '400'
                    }}
                  />
                  <Menu.Item
                    onPress={() => { 
                      setRangoSeleccionado('mes'); 
                      setPeriodoMenuVisible(false); 
                    }}
                    title="Este Mes"
                    leadingIcon="calendar-month"
                    titleStyle={{
                      color: rangoSeleccionado === 'mes' ? surfaceColors.primary : surfaceColors.onSurface,
                      fontWeight: rangoSeleccionado === 'mes' ? '600' : '400'
                    }}
                  />
                  <Menu.Item
                    onPress={() => { 
                      setRangoSeleccionado('custom'); 
                      setPeriodoMenuVisible(false); 
                    }}
                    title="Rango Personalizado"
                    leadingIcon="calendar-range"
                    titleStyle={{
                      color: rangoSeleccionado === 'custom' ? surfaceColors.primary : surfaceColors.onSurface,
                      fontWeight: rangoSeleccionado === 'custom' ? '600' : '400'
                    }}
                  />
                </Menu>
              </View>
            </View>

            {/* ✅ Date Pickers (Solo si custom) */}
            {rangoSeleccionado === 'custom' && (
              <View style={{ marginBottom: 16, marginTop: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
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
                        {format(startDate, 'dd/MM/yyyy')}
                      </Text>
                      <MaterialCommunityIcons name="calendar" size={20} color={surfaceColors.primary} />
                    </Pressable>
                  </View>

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
                        {format(endDate, 'dd/MM/yyyy')}
                      </Text>
                      <MaterialCommunityIcons name="calendar" size={20} color={surfaceColors.primary} />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

        {/* ✅ Botones Aplicar/Limpiar */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Button
            mode="contained"
            onPress={cargarDatos}
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

      {/* ScrollView para contenido scrollable */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} size="large" />
        ) : !hasSearched ? (
          // ✅ Estado inicial: sin buscar
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 }}>
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
                name="chart-bar" 
                size={64} 
                color={surfaceColors.primary} 
              />
            </View>
            <Text variant="headlineSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
              Selecciona filtros
            </Text>
            <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'center' }}>
              Configura el período y presiona "Aplicar Filtros" para ver tus estadísticas
            </Text>
          </View>
        ) : (
          <>
            {/* 1. Hero Card: Total Horas (KPI Principal) */}
            <StatCard 
              title="Total Horas Trabajadas" 
              value={stats.totalHoras} 
              subtitle="Acumulado del periodo"
              icon="clock-check-outline" 
              color={surfaceColors.primary}
              style={{ width: '100%', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 20 }}
              isHero={true}
            />

            {/* 2. Grid Secundario: Días y Promedio */}
            <View style={styles.statsGrid}>
              <StatCard 
                title="Días" 
                value={stats.diasTrabajados} 
                subtitle="Trabajados"
                icon="calendar-check" 
                color={surfaceColors.secondary} 
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              />
              <StatCard 
                title="Promedio" 
                value={`${stats.promedioDiario}h`} 
                subtitle="Diario"
                icon="chart-line" 
                color={surfaceColors.tertiary} 
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              />
            </View>

            {/* 3. Puntualidad (Full Width Highlight) */}
            <StatCard 
              title="Puntualidad" 
              value={stats.puntualidad !== null ? `${stats.puntualidad}%` : '--'} 
              subtitle={
                stats.puntualidad !== null 
                  ? `${stats.onTimeCount} de ${stats.punctualityBaseCount} llegadas a tiempo` 
                  : "Sin registros válidos"
              }
              icon="star" 
              color={(stats.puntualidad || 0) >= 90 ? surfaceColors.primary : surfaceColors.error} 
              style={{ width: '100%', marginTop: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 20 }}
            />

            {/* 4. Chart (Detalle al final) */}
            <View style={[styles.chartCard, { backgroundColor: surfaceColors.surfaceContainerLow, borderWidth: 1, borderColor: surfaceColors.outlineVariant }]}>
              <View style={{ padding: 20 }}>
                <Text variant="titleLarge" style={{ marginBottom: 20, fontWeight: '600', color: surfaceColors.onSurface, letterSpacing: -0.25, fontFamily: 'Roboto-Flex', fontVariationSettings: "'wdth' 110" }}>
                  Tendencia de Horas
                </Text>
                <LineChart
                  data={{
                    labels: stats.chartLabels,
                    datasets: [{ 
                      data: stats.chartData,
                      color: (opacity = 1) => surfaceColors.primary,
                      strokeWidth: 3
                    }]
                  }}
                  width={width - 80}
                  height={240}
                  yAxisLabel=""
                  yAxisSuffix="h"
                  fromZero={true}
                  chartConfig={{
                    backgroundColor: surfaceColors.surfaceContainerLow,
                    backgroundGradientFrom: surfaceColors.surfaceContainerLow,
                    backgroundGradientTo: surfaceColors.surfaceContainerLow,
                    decimalPlaces: 1,
                    color: (opacity = 1) => surfaceColors.primary,
                    labelColor: (opacity = 1) => surfaceColors.onSurfaceVariant,
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: surfaceColors.surfaceContainerLow
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '4',
                      stroke: surfaceColors.onSurface + '1F',
                      strokeWidth: 1
                    },
                    propsForLabels: {
                      fontFamily: 'Roboto-Flex',
                      fontSize: 10
                    }
                  }}
                  bezier
                  style={{
                    borderRadius: 20,
                    paddingRight: 40,
                    marginLeft: -10
                  }}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ✅ Date Pickers (Modal nativo) */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
              Haptics.selectionAsync();
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
              Haptics.selectionAsync();
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,  // ✅ Espaciado generoso (24→20)
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  filterContainer: {
    marginBottom: 24,
  },
  chartCard: {
    marginBottom: 24,
    borderRadius: 16,  // ✅ Orgánico (16px como Novedades)
    elevation: 0,  // ✅ Tonal Elevation
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: (width - 40 - 16) / 2,
    padding: 12,
    borderRadius: 16, // ✅ Orgánico (16px como Novedades)
    alignItems: 'flex-start',
    elevation: 0,
  },
  iconContainer: {
    width: 40,  // ⬇️ Reducido de 48 a 40
    height: 40,
    borderRadius: 20,
    marginBottom: 8,  // ⬇️ Reducido de 12 a 8
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    alignItems: 'flex-start',
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});
