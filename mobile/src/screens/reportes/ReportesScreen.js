import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Pressable,
  Platform
} from 'react-native';
import { 
  Text, 
  Surface, 
  SegmentedButtons, 
  Card, 
  Avatar, 
  useTheme, 
  ActivityIndicator 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function ReportesScreen() {
  const { userProfile, user } = useAuth();
  const theme = useTheme();
  
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

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const hoy = new Date();
      let fechaDesde, fechaHasta;
      
      if (rangoSeleccionado === 'semana') {
        fechaDesde = startOfWeek(hoy, { weekStartsOn: 1 });
        fechaHasta = endOfWeek(hoy, { weekStartsOn: 1 });
      } else if (rangoSeleccionado === 'mes') {
        fechaDesde = startOfMonth(hoy);
        fechaHasta = endOfMonth(hoy);
      } else {
        // Año actual
        fechaDesde = startOfYear(hoy);
        fechaHasta = endOfYear(hoy);
      }
      
      const fechaDesdeStr = format(fechaDesde, 'yyyy-MM-dd');
      const fechaHastaStr = format(fechaHasta, 'yyyy-MM-dd');
      
      let q = query(
        collection(db, 'asistencias'),
        where('fecha', '>=', fechaDesdeStr),
        where('fecha', '<=', fechaHastaStr)
      );

      // Si no es admin, solo ver sus propios datos
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
      
      if (rangoSeleccionado === 'semana') {
        chartLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        const days = new Array(7).fill(0);
        
        asistenciasValidas.forEach(a => {
          if (a.fecha) {
            const [year, month, day] = a.fecha.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dayIndex = date.getDay(); 
            const index = dayIndex === 0 ? 6 : dayIndex - 1;
            
            if (a.horasTrabajadas) {
              const [h, m] = a.horasTrabajadas.split(':').map(Number);
              days[index] += h + (m / 60);
            }
          }
        });
        chartData = days.map(v => Number(v.toFixed(1)));
      } else if (rangoSeleccionado === 'mes') {
        chartLabels = ['S1', 'S2', 'S3', 'S4', 'S5'];
        const weeks = new Array(5).fill(0);
        
        asistenciasValidas.forEach(a => {
          if (a.fecha) {
            const [year, month, day] = a.fecha.split('-').map(Number);
            const weekIndex = Math.floor((day - 1) / 7);
            
            if (a.horasTrabajadas && weekIndex < 5) {
              const [h, m] = a.horasTrabajadas.split(':').map(Number);
              weeks[weekIndex] += h + (m / 60);
            }
          }
        });
        chartData = weeks.map(v => Number(v.toFixed(1)));
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
              const [h, m] = a.horasTrabajadas.split(':').map(Number);
              months[monthIndex] += h + (m / 60);
            }
          }
        });
        chartData = months.map(v => Number(v.toFixed(1)));
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
          const [h, m] = a.horasTrabajadas.split(':').map(Number);
          totalMinutos += (h * 60) + m;
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

      setStats({
        totalHoras: Math.floor(totalMinutos / 60),
        diasTrabajados: diasReales,
        promedioDiario: diasReales ? (totalMinutos / diasReales / 60).toFixed(1) : 0,
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
  }, [rangoSeleccionado, userProfile, user]);

  useEffect(() => {
    if (userProfile) {
      cargarDatos();
    }
  }, [cargarDatos, userProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
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
          borderColor: color + '20'
        }
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text variant="headlineMedium" style={{ fontWeight: '600', color: surfaceColors.onSurface, letterSpacing: -0.5 }}>{value}</Text>
        <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, fontWeight: '500', marginTop: 4 }}>{title}</Text>
        {subtitle && <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{subtitle}</Text>}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" style={{ fontWeight: '600', color: surfaceColors.primary, letterSpacing: -0.5 }}>
            Estadísticas
          </Text>
          <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            Tu desempeño laboral
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={rangoSeleccionado}
            onValueChange={setRangoSeleccionado}
            buttons={[
              { value: 'semana', label: 'Semana', icon: 'calendar-week' },
              { value: 'mes', label: 'Mes', icon: 'calendar-month' },
              { value: 'anio', label: 'Año', icon: 'calendar-today' },
            ]}
          />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} size="large" />
        ) : (
          <>
            {/* Chart */}
            <View style={[styles.chartCard, { backgroundColor: surfaceColors.surfaceContainerLow, borderWidth: 1, borderColor: surfaceColors.primary + '20' }]}>
              <View style={{ padding: 20 }}>
                <Text variant="titleLarge" style={{ marginBottom: 20, fontWeight: '600', color: surfaceColors.onSurface, letterSpacing: -0.25 }}>
                  Horas Trabajadas
                </Text>
                <BarChart
                  data={{
                    labels: stats.chartLabels,
                    datasets: [{ data: stats.chartData }]
                  }}
                  width={width - 80}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix="h"
                  chartConfig={{
                    backgroundColor: surfaceColors.surfaceContainerLow,
                    backgroundGradientFrom: surfaceColors.surfaceContainerLow,
                    backgroundGradientTo: surfaceColors.surfaceContainerLow,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(${parseInt(surfaceColors.primary.slice(1,3), 16)}, ${parseInt(surfaceColors.primary.slice(3,5), 16)}, ${parseInt(surfaceColors.primary.slice(5,7), 16)}, ${opacity})`,
                    labelColor: (opacity = 1) => surfaceColors.onSurfaceVariant,
                    barPercentage: 0.7,
                    propsForBackgroundLines: {
                      strokeDasharray: '', // solid lines
                      stroke: surfaceColors.surfaceVariant
                    }
                  }}
                  style={{
                    borderRadius: 20,
                    paddingRight: 40
                  }}
                  showValuesOnTopOfBars
                />
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard 
                title="Total Horas" 
                value={stats.totalHoras} 
                subtitle="Acumulado"
                icon="clock" 
                color={surfaceColors.primary} 
              />
              <StatCard 
                title="Días" 
                value={stats.diasTrabajados} 
                subtitle="Trabajados"
                icon="calendar-check" 
                color={surfaceColors.secondary} 
              />
              <StatCard 
                title="Promedio" 
                value={`${stats.promedioDiario}h`} 
                subtitle="Diario"
                icon="chart-line" 
                color={surfaceColors.tertiary} 
              />
              <StatCard 
                title="Puntualidad" 
                value={`${stats.puntualidad}%`} 
                subtitle="Llegadas a tiempo"
                icon="star" 
                color={stats.puntualidad > 90 ? surfaceColors.primary : surfaceColors.error} 
              />
            </View>
          </>
        )}
      </ScrollView>
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
    borderRadius: 24,  // ✅ Orgánico
    elevation: 0,  // ✅ Tonal Elevation
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: (width - 40 - 16) / 2,  // ✅ Ajustado para padding 20
    padding: 20,  // ✅ Espaciado generoso (16→20)
    borderRadius: 24,  // ✅ Orgánico (20→24)
    alignItems: 'flex-start',
    elevation: 0,  // ✅ Tonal Elevation
  },
  iconContainer: {
    width: 56,  // ✅ Tamaño fijo para consistencia
    height: 56,
    borderRadius: 28,  // ✅ Círculo perfecto
    marginBottom: 16,  // ✅ Espaciado generoso (12→16)
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    alignItems: 'flex-start',
  }
});
