import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { SobrioCard, DetailRow, OverlineText } from '../../components';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * AsistenciaDetailScreen - Detalle completo de una jornada laboral
 * 
 * Material 3 Expressive Design aplicado
 */
export default function AsistenciaDetailScreen({ route, navigation }) {
  const { asistencia } = route.params;
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();

  const formatearHora = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "HH:mm:ss", { locale: es });
  };

  const formatearFechaCompleta = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  const getEstadoColor = () => {
    switch (asistencia.estadoActual) {
      case 'trabajando': return '#4caf50';
      case 'break': return '#ff9800';
      case 'almuerzo': return '#2196f3';
      case 'finalizado': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getEstadoLabel = () => {
    switch (asistencia.estadoActual) {
      case 'trabajando': return 'Trabajando';
      case 'break': return 'En Break';
      case 'almuerzo': return 'Almorzando';
      case 'finalizado': return 'Finalizado';
      default: return 'Desconocido';
    }
  };

  const getEstadoIcon = () => {
    switch (asistencia.estadoActual) {
      case 'trabajando': return '💼';
      case 'break': return '☕';
      case 'almuerzo': return '🍽️';
      case 'finalizado': return '✅';
      default: return '❓';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <OverlineText style={styles.headerOverline}>DETALLE DE ASISTENCIA</OverlineText>
          <Text style={styles.headerTitle}>{asistencia.userName || 'Usuario'}</Text>
          <Text style={styles.headerSubtitle}>{asistencia.fecha}</Text>
        </View>

        {/* Estado badge */}
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor() + '26' }]}>
          <Text style={styles.estadoEmoji}>{getEstadoIcon()}</Text>
          <Text style={[styles.estadoText, { color: getEstadoColor() }]}>
            {getEstadoLabel()}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Entrada */}
        <View style={styles.section}>
          <OverlineText style={styles.sectionTitle}>ENTRADA</OverlineText>
          <SobrioCard>
            <DetailRow
              icon="log-in"
              label="Hora de Entrada"
              value={formatearHora(asistencia.entrada?.hora)}
              iconColor={getPrimaryColor()}
              highlight
            />
            {asistencia.entrada?.ubicacion && (
              <DetailRow
                icon="location"
                label="Ubicación"
                value={`${asistencia.entrada.ubicacion.lat.toFixed(6)}, ${asistencia.entrada.ubicacion.lon.toFixed(6)}`}
                iconColor="#4caf50"
              />
            )}
            {asistencia.entrada?.dispositivo && (
              <DetailRow
                icon="phone-portrait"
                label="Dispositivo"
                value={asistencia.entrada.dispositivo}
                iconColor="#2196f3"
              />
            )}
          </SobrioCard>
        </View>

        {/* Breaks */}
        {asistencia.breaks && asistencia.breaks.length > 0 && (
          <View style={styles.section}>
            <OverlineText style={styles.sectionTitle}>
              BREAKS ({asistencia.breaks.length})
            </OverlineText>
            {asistencia.breaks.map((breakItem, index) => (
              <SobrioCard key={index} style={styles.breakCard}>
                <View style={styles.breakHeader}>
                  <Text style={styles.breakTitle}>☕ Break #{index + 1}</Text>
                  {breakItem.duracion && (
                    <Text style={styles.breakDuration}>{breakItem.duracion}</Text>
                  )}
                </View>
                <DetailRow
                  icon="play"
                  label="Inicio"
                  value={formatearHora(breakItem.inicio)}
                  iconColor="#ff9800"
                />
                {breakItem.fin && (
                  <DetailRow
                    icon="square"
                    label="Fin"
                    value={formatearHora(breakItem.fin)}
                    iconColor="#ff9800"
                  />
                )}
                {!breakItem.fin && (
                  <Text style={styles.breakActive}>🔴 Break activo</Text>
                )}
              </SobrioCard>
            ))}
          </View>
        )}

        {/* Almuerzo */}
        {asistencia.almuerzo && asistencia.almuerzo.inicio && (
          <View style={styles.section}>
            <OverlineText style={styles.sectionTitle}>ALMUERZO</OverlineText>
            <SobrioCard>
              <DetailRow
                icon="play"
                label="Inicio"
                value={formatearHora(asistencia.almuerzo.inicio)}
                iconColor="#2196f3"
              />
              {asistencia.almuerzo.fin && (
                <>
                  <DetailRow
                    icon="square"
                    label="Fin"
                    value={formatearHora(asistencia.almuerzo.fin)}
                    iconColor="#2196f3"
                  />
                  {asistencia.almuerzo.duracion && (
                    <DetailRow
                      icon="timer"
                      label="Duración"
                      value={asistencia.almuerzo.duracion}
                      iconColor="#4caf50"
                      highlight
                    />
                  )}
                </>
              )}
              {!asistencia.almuerzo.fin && (
                <Text style={styles.almuerzoPending}>⏳ Almuerzo en curso</Text>
              )}
            </SobrioCard>
          </View>
        )}

        {/* Salida */}
        {asistencia.salida && (
          <View style={styles.section}>
            <OverlineText style={styles.sectionTitle}>SALIDA</OverlineText>
            <SobrioCard>
              <DetailRow
                icon="log-out"
                label="Hora de Salida"
                value={formatearHora(asistencia.salida.hora)}
                iconColor={getSecondaryColor()}
                highlight
              />
            </SobrioCard>
          </View>
        )}

        {/* Resumen */}
        <View style={styles.section}>
          <OverlineText style={styles.sectionTitle}>RESUMEN DE JORNADA</OverlineText>
          <SobrioCard>
            <DetailRow
              icon="access-time"
              label="Horas Trabajadas"
              value={asistencia.horasTrabajadas || '00:00:00'}
              iconColor="#4caf50"
              highlight
            />
            <DetailRow
              icon="event"
              label="Fecha Completa"
              value={formatearFechaCompleta(asistencia.entrada?.hora)}
              iconColor="#9e9e9e"
            />
          </SobrioCard>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  header: {
    paddingTop: 48,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  headerContent: {
    marginBottom: 16
  },
  headerOverline: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  estadoEmoji: {
    fontSize: 18
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  content: {
    flex: 1
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#64748b'
  },
  breakCard: {
    marginBottom: 12
  },
  breakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)'
  },
  breakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  breakDuration: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4caf50'
  },
  breakActive: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    fontSize: 13,
    fontWeight: '600',
    color: '#ff9800',
    textAlign: 'center'
  },
  almuerzoPending: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    fontSize: 13,
    fontWeight: '600',
    color: '#2196f3',
    textAlign: 'center'
  },
  bottomSpacer: {
    height: 40
  }
});
