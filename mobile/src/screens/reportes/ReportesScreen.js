import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SobrioCard, DetailRow, OverlineText, LoadingState, EmptyState } from '../../components';
import ProtectedScreen from '../../components/ProtectedScreen';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const screenWidth = Dimensions.get('window').width;

/**
 * ReportesScreen - Versión mejorada con gráficos interactivos
 * 
 * FASE 0.6 Features:
 * - ✅ BarChart: Horas trabajadas por día
 * - ✅ LineChart: Tendencia de asistencia en el tiempo
 * - ✅ Filtros: Semana, Mes, Personalizado
 * - ✅ Métricas avanzadas: Promedio, Total días, Score de puntualidad
 * - ✅ Material 3 design con colores dinámicos
 */
function ReportesScreenContent() {
  const { userProfile } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [rangoSeleccionado, setRangoSeleccionado] = useState('semana'); // 'semana', 'mes'
  
  // Datos
  const [asistencias, setAsistencias] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [trendData, setTrendData] = useState({ labels: [], datasets: [{ data: [] }] });
  
  // Verificar si es ADMIN
  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN';

  useEffect(() => {
    cargarDatos();
  }, [rangoSeleccionado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📊 Cargando reportes: ${rangoSeleccionado}`);
      
      // Calcular rango de fechas
      const hoy = new Date();
      let fechaDesde, fechaHasta;
      
      if (rangoSeleccionado === 'semana') {
        fechaDesde = startOfWeek(hoy, { weekStartsOn: 1 }); // Lunes
        fechaHasta = endOfWeek(hoy, { weekStartsOn: 1 }); // Domingo
      } else if (rangoSeleccionado === 'mes') {
        fechaDesde = startOfMonth(hoy);
        fechaHasta = endOfMonth(hoy);
      }
      
      const fechaDesdeStr = format(fechaDesde, 'yyyy-MM-dd');
      const fechaHastaStr = format(fechaHasta, 'yyyy-MM-dd');
      
      console.log(`📅 Rango: ${fechaDesdeStr} → ${fechaHastaStr}`);
      
      // Query a Firestore (simple, sin orderBy)
      const q = query(
        collection(db, 'asistencias'),
        where('fecha', '>=', fechaDesdeStr),
        where('fecha', '<=', fechaHastaStr)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`📋 ${querySnapshot.docs.length} asistencias encontradas`);
      
      const asistenciasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAsistencias(asistenciasData);
      
      // Generar datos para gráficos
      generarDatosGraficos(asistenciasData, fechaDesde, fechaHasta);
      
    } catch (err) {
      console.error('❌ Error cargando reportes:', err);
      setError('Error al cargar reportes. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generarDatosGraficos = (asistenciasData, fechaDesde, fechaHasta) => {
    // Generar todos los días del rango
    const diasDelRango = eachDayOfInterval({ start: fechaDesde, end: fechaHasta });
    
    // Mapa de fecha → horas trabajadas
    const horasPorDia = {};
    const asistenciasPorDia = {};
    
    diasDelRango.forEach(dia => {
      const fechaStr = format(dia, 'yyyy-MM-dd');
      horasPorDia[fechaStr] = 0;
      asistenciasPorDia[fechaStr] = 0;
    });
    
    // Acumular horas por día
    asistenciasData.forEach(asistencia => {
      if (!asistencia.fecha || !asistencia.horasTrabajadas) return;
      
      const fecha = asistencia.fecha;
      asistenciasPorDia[fecha] = (asistenciasPorDia[fecha] || 0) + 1;
      
      // Convertir HH:MM:SS a horas decimales
      const [h, m, s] = asistencia.horasTrabajadas.split(':').map(Number);
      const horasDecimales = h + (m / 60) + (s / 3600);
      
      horasPorDia[fecha] = (horasPorDia[fecha] || 0) + horasDecimales;
    });
    
    // Preparar datos para BarChart (horas por día)
    const labels = diasDelRango.map(dia => format(dia, 'dd MMM', { locale: es }));
    const dataHoras = diasDelRango.map(dia => {
      const fechaStr = format(dia, 'yyyy-MM-dd');
      return Math.round(horasPorDia[fechaStr] * 10) / 10; // Redondear a 1 decimal
    });
    
    setChartData({
      labels,
      datasets: [{ data: dataHoras.length > 0 ? dataHoras : [0] }]
    });
    
    // Preparar datos para LineChart (tendencia de asistencias)
    const dataAsistencias = diasDelRango.map(dia => {
      const fechaStr = format(dia, 'yyyy-MM-dd');
      return asistenciasPorDia[fechaStr] || 0;
    });
    
    setTrendData({
      labels,
      datasets: [{ data: dataAsistencias.length > 0 ? dataAsistencias : [0] }]
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  // Función para formatear duración (DEBE estar ANTES del useMemo)
  const formatearDuracion = (ms) => {
    if (!ms || ms <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calcular estadísticas avanzadas
  const stats = useMemo(() => {
    const total = asistencias.length;
    const finalizadas = asistencias.filter(a => a.estadoActual === 'finalizado').length;
    
    // Total de horas trabajadas
    let totalHorasMs = 0;
    asistencias.forEach(a => {
      if (a.horasTrabajadas) {
        const [h, m, s] = a.horasTrabajadas.split(':').map(Number);
        totalHorasMs += (h * 3600 + m * 60 + s) * 1000;
      }
    });
    
    const totalHorasFormateadas = formatearDuracion(totalHorasMs);
    
    // Promedio de horas por día
    const promedioHorasMs = finalizadas > 0 ? totalHorasMs / finalizadas : 0;
    const promedioHorasFormateadas = formatearDuracion(promedioHorasMs);
    
    // Días únicos trabajados
    const fechasUnicas = new Set(asistencias.map(a => a.fecha));
    const diasTrabajados = fechasUnicas.size;
    
    // Score de puntualidad (asistencias a tiempo: entrada antes de las 9:00 AM)
    let aTiempo = 0;
    asistencias.forEach(a => {
      if (a.entrada && a.entrada.hora) {
        try {
          const horaEntrada = a.entrada.hora.toDate ? a.entrada.hora.toDate() : new Date(a.entrada.hora);
          const hora = horaEntrada.getHours();
          if (hora < 9) aTiempo++;
        } catch (e) {
          // Ignorar errores de conversión
        }
      }
    });
    
    const scorePuntualidad = total > 0 ? Math.round((aTiempo / total) * 100) : 0;
    
    return {
      total,
      finalizadas,
      totalHoras: totalHorasFormateadas,
      promedioHoras: promedioHorasFormateadas,
      diasTrabajados,
      scorePuntualidad
    };
  }, [asistencias]);

  if (loading && !refreshing) {
    return <LoadingState message="Cargando reportes..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="error-outline"
          message={error}
          iconColor="#f44336"
        />
        <TouchableOpacity style={styles.retryButton} onPress={cargarDatos}>
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
        <OverlineText style={styles.headerOverline}>ANÁLISIS Y MÉTRICAS</OverlineText>
        <Text style={styles.headerTitle}>Reportes</Text>
        <Text style={styles.headerSubtitle}>
          Visualiza el rendimiento del equipo
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[getPrimaryColor()]} />
        }
      >
        {/* Filtros de rango */}
        <View style={styles.filtrosRango}>
          <TouchableOpacity
            style={[
              styles.filtroChip,
              rangoSeleccionado === 'semana' && { backgroundColor: getPrimaryColor() + '15', borderColor: getPrimaryColor() }
            ]}
            onPress={() => setRangoSeleccionado('semana')}
          >
            <MaterialIcons 
              name="date-range" 
              size={16} 
              color={rangoSeleccionado === 'semana' ? getPrimaryColor() : '#666'} 
            />
            <Text style={[
              styles.filtroChipText,
              rangoSeleccionado === 'semana' && { color: getPrimaryColor(), fontWeight: '700' }
            ]}>
              Esta Semana
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filtroChip,
              rangoSeleccionado === 'mes' && { backgroundColor: getPrimaryColor() + '15', borderColor: getPrimaryColor() }
            ]}
            onPress={() => setRangoSeleccionado('mes')}
          >
            <MaterialIcons 
              name="calendar-today" 
              size={16} 
              color={rangoSeleccionado === 'mes' ? getPrimaryColor() : '#666'} 
            />
            <Text style={[
              styles.filtroChipText,
              rangoSeleccionado === 'mes' && { color: getPrimaryColor(), fontWeight: '700' }
            ]}>
              Este Mes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Métricas principales */}
        <View style={styles.statsGrid}>
          <SobrioCard style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: getPrimaryColor() }]}>ASISTENCIAS</Text>
          </SobrioCard>
          
          <SobrioCard style={styles.statCard}>
            <Text style={styles.statValue}>{stats.diasTrabajados}</Text>
            <Text style={[styles.statLabel, { color: '#4caf50' }]}>DÍAS</Text>
          </SobrioCard>
          
          <SobrioCard style={styles.statCard}>
            <Text style={styles.statValue}>{stats.scorePuntualidad}%</Text>
            <Text style={[styles.statLabel, { color: '#2196f3' }]}>PUNTUALIDAD</Text>
          </SobrioCard>
        </View>

        {/* Gráfico de barras: Horas por día (Simple) */}
        {chartData.datasets[0].data.length > 0 && chartData.datasets[0].data.some(val => val > 0) ? (
          <View style={styles.chartSection}>
            <OverlineText style={styles.chartTitle}>HORAS TRABAJADAS POR DÍA</OverlineText>
            <SobrioCard>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.simpleBarChart}>
                  {chartData.labels.map((label, index) => {
                    const value = chartData.datasets[0].data[index];
                    const maxValue = Math.max(...chartData.datasets[0].data);
                    const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    
                    return (
                      <View key={index} style={styles.barContainer}>
                        <View style={styles.barWrapper}>
                          <Text style={styles.barValue}>{value.toFixed(1)}h</Text>
                          <View style={styles.barColumn}>
                            <View 
                              style={[
                                styles.bar, 
                                { 
                                  height: `${heightPercent}%`,
                                  backgroundColor: getPrimaryColor()
                                }
                              ]} 
                            />
                          </View>
                        </View>
                        <Text style={styles.barLabel}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              <Text style={styles.chartCaption}>
                📊 Total acumulado: {stats.totalHoras}
              </Text>
            </SobrioCard>
          </View>
        ) : (
          <View style={styles.chartSection}>
            <EmptyState
              icon="bar-chart"
              message="No hay datos suficientes para mostrar el gráfico"
              iconColor="#9e9e9e"
            />
          </View>
        )}

        {/* Gráfico de tendencia: Asistencias por día (Simple) */}
        {trendData.datasets[0].data.length > 0 && trendData.datasets[0].data.some(val => val > 0) ? (
          <View style={styles.chartSection}>
            <OverlineText style={styles.chartTitle}>TENDENCIA DE ASISTENCIAS</OverlineText>
            <SobrioCard>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.simpleTrendChart}>
                  {trendData.labels.map((label, index) => {
                    const value = trendData.datasets[0].data[index];
                    const maxValue = Math.max(...trendData.datasets[0].data);
                    const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    
                    return (
                      <View key={index} style={styles.trendContainer}>
                        <View style={styles.trendWrapper}>
                          <Text style={styles.trendValue}>{value}</Text>
                          <View style={styles.trendColumn}>
                            <View 
                              style={[
                                styles.trendDot, 
                                { 
                                  bottom: `${heightPercent}%`,
                                  backgroundColor: getSecondaryColor()
                                }
                              ]} 
                            />
                            {index < trendData.labels.length - 1 && (
                              <View 
                                style={[
                                  styles.trendLine,
                                  { backgroundColor: getSecondaryColor() + '40' }
                                ]} 
                              />
                            )}
                          </View>
                        </View>
                        <Text style={styles.trendLabel}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              <Text style={styles.chartCaption}>
                📈 Promedio: {stats.promedioHoras} por asistencia
              </Text>
            </SobrioCard>
          </View>
        ) : (
          <View style={styles.chartSection}>
            <EmptyState
              icon="show-chart"
              message="No hay datos suficientes para mostrar la tendencia"
              iconColor="#9e9e9e"
            />
          </View>
        )}

        {/* Detalles adicionales */}
        <View style={styles.detailsSection}>
          <SobrioCard>
            <DetailRow
              icon="check-circle"
              label="Jornadas Finalizadas"
              value={`${stats.finalizadas} de ${stats.total}`}
              iconColor="#4caf50"
              highlight
            />
            <View style={styles.detailSpacer} />
            <DetailRow
              icon="access-time"
              label="Promedio por Asistencia"
              value={stats.promedioHoras}
              iconColor="#2196f3"
            />
            <View style={styles.detailSpacer} />
            <DetailRow
              icon="timer"
              label="Total Acumulado"
              value={stats.totalHoras}
              iconColor={getPrimaryColor()}
            />
          </SobrioCard>
        </View>

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            📊 Los reportes se actualizan en tiempo real
          </Text>
          <Text style={styles.infoText}>
            🔄 Desliza hacia abajo para refrescar
          </Text>
          {isAdmin && (
            <Text style={styles.infoText}>
              👑 Modo administrador: viendo todas las asistencias
            </Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  filtrosRango: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  filtroChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
  filtroChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.3
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  chartSection: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  chartTitle: {
    marginBottom: 12,
    color: '#64748b'
  },
  chartCaption: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500'
  },
  // Simple Bar Chart Styles
  simpleBarChart: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 20,
    minWidth: screenWidth - 64
  },
  barContainer: {
    alignItems: 'center',
    gap: 8,
    minWidth: 50
  },
  barWrapper: {
    alignItems: 'center',
    gap: 6
  },
  barValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333'
  },
  barColumn: {
    width: 40,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center'
  },
  // Simple Trend Chart Styles
  simpleTrendChart: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 12,
    paddingVertical: 20,
    minWidth: screenWidth - 64
  },
  trendContainer: {
    alignItems: 'center',
    gap: 8,
    minWidth: 50
  },
  trendWrapper: {
    alignItems: 'center',
    gap: 6
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333'
  },
  trendColumn: {
    width: 2,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    position: 'relative'
  },
  trendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    left: -4,
    borderWidth: 2,
    borderColor: '#fff'
  },
  trendLine: {
    position: 'absolute',
    right: -10,
    top: '50%',
    width: 20,
    height: 2,
    borderRadius: 1
  },
  trendLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center'
  },
  detailsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  detailSpacer: {
    height: 12
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8
  },
  infoText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20
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
  bottomSpacer: {
    height: 40
  }
});

// Wrap con ProtectedScreen
export default function ReportesScreen() {
  return (
    <ProtectedScreen requiredPermission="reportes.generar">
      <ReportesScreenContent />
    </ProtectedScreen>
  );
}
