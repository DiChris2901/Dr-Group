import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const { width, height } = Dimensions.get('window');

export default function ReportesScreen() {
  const { userProfile, user } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rangoSeleccionado, setRangoSeleccionado] = useState('semana');
  const [stats, setStats] = useState({
    totalHoras: 0,
    diasTrabajados: 0,
    promedioDiario: 0,
    puntualidad: 100,
    chartData: [0, 0, 0, 0, 0, 0, 0],
    chartLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  });

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
    if (userProfile) {
      cargarDatos();
    }
  }, [rangoSeleccionado, userProfile]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const hoy = new Date();
      let fechaDesde, fechaHasta;
      
      if (rangoSeleccionado === 'semana') {
        fechaDesde = startOfWeek(hoy, { weekStartsOn: 1 });
        fechaHasta = endOfWeek(hoy, { weekStartsOn: 1 });
      } else {
        fechaDesde = startOfMonth(hoy);
        fechaHasta = endOfMonth(hoy);
      }
      
      const fechaDesdeStr = format(fechaDesde, 'yyyy-MM-dd');
      const fechaHastaStr = format(fechaHasta, 'yyyy-MM-dd');
      
      let q = query(
        collection(db, 'asistencias'),
        where('fecha', '>=', fechaDesdeStr),
        where('fecha', '<=', fechaHastaStr)
      );

      // ✅ FILTRO DE SEGURIDAD: Si no es admin, solo ver sus propios datos
      if (userProfile?.role !== 'ADMIN' && userProfile?.role !== 'SUPER_ADMIN') {
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
      }
      
      const querySnapshot = await getDocs(q);
      const asistencias = querySnapshot.docs.map(doc => doc.data());
      
      // Calcular métricas reales
      let totalMinutos = 0;
      let onTimeCount = 0;
      
      // Arrays para gráfico
      let chartData = [];
      let chartLabels = [];
      
      if (rangoSeleccionado === 'semana') {
        chartLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        const days = new Array(7).fill(0);
        
        asistencias.forEach(a => {
          if (a.fecha) {
            // Crear fecha segura (evitar problemas de zona horaria con string YYYY-MM-DD)
            const [year, month, day] = a.fecha.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dayIndex = date.getDay(); // 0 = Domingo, 1 = Lunes...
            const index = dayIndex === 0 ? 6 : dayIndex - 1; // Mover Domingo al final (6)
            
            if (a.horasTrabajadas) {
              const [h, m] = a.horasTrabajadas.split(':').map(Number);
              days[index] += h + (m / 60);
            }
          }
        });
        
        // Escalar a porcentaje (asumiendo 12h como 100% para visualización)
        chartData = days.map(h => Math.min((h / 12) * 100, 100));
        
      } else {
        // Lógica para Mes (Agrupado por semanas)
        chartLabels = ['S1', 'S2', 'S3', 'S4', 'S5'];
        const weeks = new Array(5).fill(0);
        
        asistencias.forEach(a => {
          if (a.fecha) {
            const [year, month, day] = a.fecha.split('-').map(Number);
            // Calcular semana aproximada del mes (0-4)
            const weekIndex = Math.floor((day - 1) / 7);
            
            if (a.horasTrabajadas && weekIndex < 5) {
              const [h, m] = a.horasTrabajadas.split(':').map(Number);
              weeks[weekIndex] += h + (m / 60);
            }
          }
        });
        
        // Escalar a porcentaje (asumiendo 50h/semana como 100%)
        chartData = weeks.map(h => Math.min((h / 50) * 100, 100));
      }

      // ✅ Obtener configuración de jornada
      let workStartHour = 8;
      let workStartMinute = 0;
      let gracePeriod = 15;
      let workDays = [1, 2, 3, 4, 5]; // Lunes a Viernes por defecto

      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'work_schedule'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.startTime) {
            const [h, m] = data.startTime.split(':').map(Number);
            workStartHour = h;
            workStartMinute = m;
          }
          if (data.gracePeriod !== undefined) {
            gracePeriod = Number(data.gracePeriod);
          }
          if (data.workDays) {
            workDays = data.workDays;
          }
        }
      } catch (e) {
        console.log('Usando configuración por defecto (08:00 + 15m)');
      }

      let punctualityBaseCount = 0;

      asistencias.forEach(a => {
        // Total Horas
        if (a.horasTrabajadas) {
          const [h, m] = a.horasTrabajadas.split(':').map(Number);
          totalMinutos += (h * 60) + m;
        }
        
        // ✅ Puntualidad Dinámica (Solo en días laborales)
        if (a.entrada?.hora) {
          const date = a.entrada.hora.toDate ? a.entrada.hora.toDate() : new Date(a.entrada.hora);
          const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun...
          
          // Solo evaluar puntualidad si es un día laboral configurado
          if (workDays.includes(dayOfWeek)) {
            punctualityBaseCount++;
            
            const hour = date.getHours();
            const minute = date.getMinutes();
            
            // Calcular minutos totales del día para comparar
            const entryTime = hour * 60 + minute;
            const limitTime = workStartHour * 60 + workStartMinute + gracePeriod;

            if (entryTime <= limitTime) {
              onTimeCount++;
            }
          }
        }
      });

      setStats({
        totalHoras: Math.floor(totalMinutos / 60),
        diasTrabajados: asistencias.length,
        promedioDiario: asistencias.length ? (totalMinutos / asistencias.length / 60).toFixed(1) : 0,
        puntualidad: punctualityBaseCount > 0 ? Math.round((onTimeCount / punctualityBaseCount) * 100) : 100,
        chartData,
        chartLabels
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const StatCard = ({ title, value, subtitle, icon, color, delay }) => {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    
    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: delay,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={[styles.statCardContainer, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <MaterialIcons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statSubtitle}>{subtitle}</Text>
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
          <Text style={styles.headerTitle}>Reportes</Text>
          <Text style={styles.headerSubtitle}>Métricas de Desempeño</Text>
        </View>
      </LinearGradient>

      <Animated.View style={[
        styles.sheetContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[getPrimaryColor()]}
              tintColor={getPrimaryColor()}
            />
          }
        >
          {/* Filtros */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, rangoSeleccionado === 'semana' && styles.filterButtonActive]}
              onPress={() => setRangoSeleccionado('semana')}
            >
              <Text style={[styles.filterText, rangoSeleccionado === 'semana' && styles.filterTextActive]}>
                Esta Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, rangoSeleccionado === 'mes' && styles.filterButtonActive]}
              onPress={() => setRangoSeleccionado('mes')}
            >
              <Text style={[styles.filterText, rangoSeleccionado === 'mes' && styles.filterTextActive]}>
                Este Mes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid de Estadísticas */}
          <View style={styles.statsGrid}>
            <StatCard
              title="HORAS TOTALES"
              value={stats.totalHoras}
              subtitle="Horas trabajadas"
              icon="access-time"
              color="#2196f3"
              delay={0}
            />
            <StatCard
              title="DÍAS"
              value={stats.diasTrabajados}
              subtitle="Días asistidos"
              icon="calendar-today"
              color="#4caf50"
              delay={100}
            />
            <StatCard
              title="PROMEDIO"
              value={`${stats.promedioDiario}h`}
              subtitle="Horas por día"
              icon="trending-up"
              color="#ff9800"
              delay={200}
            />
            <StatCard
              title="PUNTUALIDAD"
              value={`${stats.puntualidad}%`}
              subtitle="Score mensual"
              icon="verified"
              color="#9c27b0"
              delay={300}
            />
          </View>

          {/* Gráfico Real */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {rangoSeleccionado === 'semana' ? 'Rendimiento Semanal' : 'Rendimiento Mensual'}
            </Text>
            <View style={styles.chartPlaceholder}>
              {stats.chartData.map((h, i) => (
                <View key={i} style={styles.barContainer}>
                  <View style={[styles.bar, { height: `${Math.max(h, 5)}%`, backgroundColor: getPrimaryColor() }]} />
                  <Text style={styles.barLabel}>{stats.chartLabels[i]}</Text>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
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
    height: height * 0.30, // Aumentado para evitar corte
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28, // Reducido para diseño sobrio
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
    marginTop: -50, // Ajustado
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16, // Reducido de 20
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 16,
    marginBottom: 16, // Reducido de 24
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10, // Reducido de 12
    alignItems: 'center',
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  filterText: {
    fontSize: 13, // Reducido de 14
    fontWeight: '600',
    color: '#999',
  },
  filterTextActive: {
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16, // Reducido de 24
  },
  statCardContainer: {
    width: (width - 44) / 2, // Ajustado para padding 16 (16*2 + 12 gap = 44)
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 20, // Reducido de 24
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40, // Reducido de 48
    height: 40, // Reducido de 48
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // Reducido de 12
  },
  statValue: {
    fontSize: 20, // Reducido de 24
    fontWeight: '800',
    color: '#2d3436',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 9, // Reducido de 10
    fontWeight: '700',
    color: '#b2bec3',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 9,
    color: '#dfe6e9',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20, // Reducido de 24
    padding: 16, // Reducido de 24
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16, // Reducido de 18
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 16, // Reducido de 24
  },
  chartPlaceholder: {
    height: 140, // Reducido de 150
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
    width: 20,
  },
  bar: {
    width: 6, // Reducido de 8
    borderRadius: 3,
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 10, // Reducido de 12
    color: '#b2bec3',
    fontWeight: '600',
  },
});
