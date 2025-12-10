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
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const { width, height } = Dimensions.get('window');

export default function ReportesScreen() {
  const { userProfile } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rangoSeleccionado, setRangoSeleccionado] = useState('semana');
  const [stats, setStats] = useState({
    totalHoras: 0,
    diasTrabajados: 0,
    promedioDiario: 0,
    puntualidad: 100
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
    cargarDatos();
  }, [rangoSeleccionado]);

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
      
      const q = query(
        collection(db, 'asistencias'),
        where('fecha', '>=', fechaDesdeStr),
        where('fecha', '<=', fechaHastaStr)
      );
      
      const querySnapshot = await getDocs(q);
      const asistencias = querySnapshot.docs.map(doc => doc.data());
      
      // Calcular métricas simples
      let totalMinutos = 0;
      asistencias.forEach(a => {
        if (a.horasTrabajadas) {
          const [h, m] = a.horasTrabajadas.split(':').map(Number);
          totalMinutos += (h * 60) + m;
        }
      });

      setStats({
        totalHoras: Math.floor(totalMinutos / 60),
        diasTrabajados: asistencias.length,
        promedioDiario: asistencias.length ? Math.floor(totalMinutos / asistencias.length / 60) : 0,
        puntualidad: 98 // Mock value for now
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

          {/* Gráfico Placeholder (Visual) */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Rendimiento Semanal</Text>
            <View style={styles.chartPlaceholder}>
              {[60, 80, 45, 90, 75, 30, 85].map((h, i) => (
                <View key={i} style={styles.barContainer}>
                  <View style={[styles.bar, { height: `${h}%`, backgroundColor: getPrimaryColor() }]} />
                  <Text style={styles.barLabel}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  filterText: {
    fontSize: 14,
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
    marginBottom: 24,
  },
  statCardContainer: {
    width: (width - 52) / 2,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2d3436',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b2bec3',
    letterSpacing: 1,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#dfe6e9',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 24,
  },
  chartPlaceholder: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
    width: 20,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#b2bec3',
    fontWeight: '600',
  },
});
