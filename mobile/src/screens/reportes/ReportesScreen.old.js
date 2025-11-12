import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProtectedScreen from '../../components/ProtectedScreen';
import SobrioCard from '../../components/SobrioCard';
import DetailRow from '../../components/DetailRow';
import OverlineText from '../../components/OverlineText';

const ReportesScreen = () => {
  const { getPrimaryColor, getSecondaryColor } = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAsistenciasHoy: 0,
    totalAsistenciasSemana: 0,
    horasTotalesHoy: '00:00:00',
    horasTotalesSemana: '00:00:00',
    promedioHorasDia: '00:00:00',
    asistenciasActivasHoy: 0,
    usuarioConMasHoras: { name: '--', horas: '00:00:00' },
    breaksTotales: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      const hoy = new Date();
      const fechaHoyStr = hoy.toISOString().split('T')[0];
      
      // Calcular fecha de inicio de semana (lunes)
      const primerDiaSemana = new Date(hoy);
      primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
      const fechaSemanaStr = primerDiaSemana.toISOString().split('T')[0];
      
      // Query para asistencias de hoy
      const asistenciasHoyRef = collection(db, 'asistencias');
      const qHoy = query(
        asistenciasHoyRef,
        where('fecha', '==', fechaHoyStr)
      );
      const snapshotHoy = await getDocs(qHoy);
      
      // Query para asistencias de la semana
      const qSemana = query(
        asistenciasHoyRef,
        where('fecha', '>=', fechaSemanaStr)
      );
      const snapshotSemana = await getDocs(qSemana);
      
      // Procesar datos de hoy
      let totalHorasHoyMs = 0;
      let asistenciasActivasHoy = 0;
      let breaksTotales = 0;
      const horasPorUsuario = {};
      
      for (const doc of snapshotHoy.docs) {
        const data = doc.data();
        
        if (data.estadoActual !== 'finalizado') {
          asistenciasActivasHoy++;
        }
        
        if (data.breaks) {
          breaksTotales += data.breaks.length;
        }
        
        // Convertir horas trabajadas a milisegundos
        if (data.horasTrabajadas) {
          const [h, m, s] = data.horasTrabajadas.split(':').map(Number);
          const ms = (h * 3600 + m * 60 + s) * 1000;
          totalHorasHoyMs += ms;
          
          // Acumular por usuario
          const userName = data.userName || 'Usuario desconocido';
          if (!horasPorUsuario[userName]) {
            horasPorUsuario[userName] = 0;
          }
          horasPorUsuario[userName] += ms;
        }
      }
      
      // Procesar datos de la semana
      let totalHorasSemanaMs = 0;
      for (const doc of snapshotSemana.docs) {
        const data = doc.data();
        if (data.horasTrabajadas) {
          const [h, m, s] = data.horasTrabajadas.split(':').map(Number);
          const ms = (h * 3600 + m * 60 + s) * 1000;
          totalHorasSemanaMs += ms;
        }
      }
      
      // Calcular usuario con más horas
      let maxUsuario = { name: '--', horas: '00:00:00' };
      if (Object.keys(horasPorUsuario).length > 0) {
        const maxUser = Object.keys(horasPorUsuario).reduce((a, b) => 
          horasPorUsuario[a] > horasPorUsuario[b] ? a : b
        );
        maxUsuario = {
          name: maxUser,
          horas: formatearDuracionDesdeMs(horasPorUsuario[maxUser])
        };
      }
      
      // Calcular promedio de horas por día
      const cantidadAsistenciasHoy = snapshotHoy.size;
      const promedioMs = cantidadAsistenciasHoy > 0 ? totalHorasHoyMs / cantidadAsistenciasHoy : 0;
      
      setStats({
        totalAsistenciasHoy: snapshotHoy.size,
        totalAsistenciasSemana: snapshotSemana.size,
        horasTotalesHoy: formatearDuracionDesdeMs(totalHorasHoyMs),
        horasTotalesSemana: formatearDuracionDesdeMs(totalHorasSemanaMs),
        promedioHorasDia: formatearDuracionDesdeMs(promedioMs),
        asistenciasActivasHoy,
        usuarioConMasHoras: maxUsuario,
        breaksTotales
      });
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatearDuracionDesdeMs = (ms) => {
    if (!ms || ms <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEstadisticas();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ProtectedScreen requiredPermission="reportes.generar">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getPrimaryColor()} />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      </ProtectedScreen>
    );
  }

  return (
    <ProtectedScreen requiredPermission="reportes.generar">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[getPrimaryColor()]}
          />
        }
      >
        {/* Header con gradiente */}
        <View style={[styles.header, { backgroundColor: getPrimaryColor() }]}>
          <OverlineText style={styles.headerOverline}>ADMINISTRACIÓN</OverlineText>
          <Text style={styles.headerTitle}>Reportes</Text>
          <Text style={styles.headerSubtitle}>Estadísticas y métricas del equipo</Text>
        </View>

        {/* Sección: Resumen de hoy */}
        <View style={styles.section}>
          <OverlineText style={styles.sectionTitle}>Resumen de Hoy</OverlineText>
          
          <View style={styles.metricsGrid}>
            <SobrioCard style={styles.metricCard}>
              <Text style={styles.metricNumber}>{stats.totalAsistenciasHoy}</Text>
              <Text style={styles.metricLabel}>Asistencias</Text>
              <Text style={styles.metricIcon}>👥</Text>
            </SobrioCard>
            
            <SobrioCard style={styles.metricCard}>
              <Text style={styles.metricNumber}>{stats.asistenciasActivasHoy}</Text>
              <Text style={styles.metricLabel}>Activas</Text>
              <Text style={styles.metricIcon}>⏳</Text>
            </SobrioCard>
          </View>

          <SobrioCard style={styles.detailCard}>
            <DetailRow
              icon="⏱️"
              label="Horas Totales Hoy"
              value={stats.horasTotalesHoy}
              iconColor="#4caf50"
              highlight
            />
            <View style={styles.detailSpacer} />
            <DetailRow
              icon="📊"
              label="Promedio por Usuario"
              value={stats.promedioHorasDia}
              iconColor="#2196f3"
            />
            <View style={styles.detailSpacer} />
            <DetailRow
              icon="☕"
              label="Breaks Totales"
              value={`${stats.breaksTotales} break(s)`}
              iconColor="#ff9800"
            />
          </SobrioCard>
        </View>

        {/* Sección: Resumen de la semana */}
        <View style={styles.section}>
          <OverlineText style={styles.sectionTitle}>Resumen de la Semana</OverlineText>
          
          <View style={styles.metricsGrid}>
            <SobrioCard style={styles.metricCard}>
              <Text style={styles.metricNumber}>{stats.totalAsistenciasSemana}</Text>
              <Text style={styles.metricLabel}>Asistencias</Text>
              <Text style={styles.metricIcon}>📅</Text>
            </SobrioCard>
            
            <SobrioCard style={styles.metricCard}>
              <Text style={styles.metricNumber}>{stats.horasTotalesSemana}</Text>
              <Text style={styles.metricLabel}>Horas Totales</Text>
              <Text style={styles.metricIcon}>⏰</Text>
            </SobrioCard>
          </View>
        </View>

        {/* Sección: Usuario destacado */}
        <View style={styles.section}>
          <OverlineText style={styles.sectionTitle}>Usuario Destacado</OverlineText>
          
          <SobrioCard style={styles.highlightCard}>
            <View style={styles.highlightHeader}>
              <Text style={styles.highlightEmoji}>🏆</Text>
              <View style={styles.highlightInfo}>
                <Text style={styles.highlightTitle}>Mayor Tiempo Trabajado Hoy</Text>
                <Text style={styles.highlightName}>{stats.usuarioConMasHoras.name}</Text>
              </View>
            </View>
            <View style={styles.highlightDivider} />
            <View style={styles.highlightFooter}>
              <Text style={styles.highlightLabel}>Horas trabajadas:</Text>
              <Text style={styles.highlightValue}>{stats.usuarioConMasHoras.horas}</Text>
            </View>
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
        </View>
      </ScrollView>
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollContent: {
    paddingBottom: 40 // 🎨 Material 3 padding (↑ de 32)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 16, // 🎨 Material 3 spacing (↑ de 12)
    fontSize: 15, // 🎨 Material 3 Body Medium (↑ de 14)
    color: '#666'
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
  section: {
    paddingHorizontal: 20, // 🎨 Material 3 padding (↑ de 16)
    marginTop: 28 // 🎨 Material 3 spacing (↑ de 24)
  },
  sectionTitle: {
    color: '#666',
    marginBottom: 16, // 🎨 Material 3 spacing (↑ de 12)
    paddingHorizontal: 6 // 🎨 Material 3 padding (↑ de 4)
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16, // 🎨 Material 3 gap (↑ de 12)
    marginBottom: 16 // 🎨 Material 3 spacing (↑ de 12)
  },
  metricCard: {
    flex: 1,
    padding: 24, // 🎨 Material 3 padding (↑ de 20)
    alignItems: 'center',
    position: 'relative'
  },
  metricNumber: {
    fontSize: 36, // 🎨 Material 3 Display Small (↑ de 32)
    fontWeight: '700',
    color: '#333',
    marginBottom: 6, // 🎨 Material 3 spacing (↑ de 4)
    letterSpacing: 0.3 // 🎨 Material 3 tracking (nuevo)
  },
  metricLabel: {
    fontSize: 13, // 🎨 Material 3 Label Large (↑ de 12)
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.0, // 🎨 Material 3 tracking (↑ de 0.5)
    textAlign: 'center'
  },
  metricIcon: {
    fontSize: 28, // 🎨 Material 3 icon size (↑ de 24)
    position: 'absolute',
    top: 16, // 🎨 Material 3 positioning (↑ de 12)
    right: 16, // 🎨 Material 3 positioning (↑ de 12)
    opacity: 0.3
  },
  detailCard: {
    padding: 24 // 🎨 Material 3 padding (↑ de 20)
  },
  detailSpacer: {
    height: 16 // 🎨 Material 3 spacing (↑ de 12)
  },
  highlightCard: {
    padding: 24 // 🎨 Material 3 padding (↑ de 20)
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20 // 🎨 Material 3 spacing (↑ de 16)
  },
  highlightEmoji: {
    fontSize: 44, // 🎨 Material 3 emoji size (↑ de 40)
    marginRight: 20 // 🎨 Material 3 spacing (↑ de 16)
  },
  highlightInfo: {
    flex: 1
  },
  highlightTitle: {
    fontSize: 12, // 🎨 Material 3 Label Medium (↑ de 11)
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.0, // 🎨 Material 3 tracking (↑ de 0.5)
    marginBottom: 6 // 🎨 Material 3 spacing (↑ de 4)
  },
  highlightName: {
    fontSize: 20, // 🎨 Material 3 Title Medium (↑ de 18)
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.15 // 🎨 Material 3 tracking (nuevo)
  },
  highlightDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 16
  },
  highlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  highlightLabel: {
    fontSize: 15, // 🎨 Material 3 Body Medium (↑ de 14)
    color: '#666',
    lineHeight: 22 // 🎨 Material 3 line-height (nuevo)
  },
  highlightValue: {
    fontSize: 28, // 🎨 Material 3 Display Small (↑ de 24)
    fontWeight: '700',
    color: '#4caf50',
    letterSpacing: 0.2 // 🎨 Material 3 tracking (nuevo)
  },
  infoSection: {
    paddingHorizontal: 20, // 🎨 Material 3 padding (↑ de 16)
    marginTop: 28, // 🎨 Material 3 spacing (↑ de 24)
    gap: 12 // 🎨 Material 3 gap (↑ de 8)
  },
  infoText: {
    fontSize: 14, // 🎨 Material 3 Body Small (↑ de 13)
    color: '#999',
    textAlign: 'center',
    lineHeight: 22 // 🎨 Material 3 line-height (↑ de 20)
  }
});

export default ReportesScreen;
