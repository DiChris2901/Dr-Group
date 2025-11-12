import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ThemeContext } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SobrioCard, EmptyState, ErrorState, LoadingState } from '../../components';

/**
 * CalendarioScreen - Vista de eventos programados
 * 
 * Collection: calendar_events
 * Query: Real-time listener con onSnapshot
 * Funcionalidad: Solo lectura (NO crear/editar)
 * 
 * Material 3 Expressive Design aplicado
 */
export default function CalendarioScreen({ navigation }) {
  const { getGradient, getPrimaryColor } = useContext(ThemeContext);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ REAL-TIME LISTENER (como DashboardCalendar.jsx del dashboard web)
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'calendar_events'),
        orderBy('date', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const eventosData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            eventosData.push({
              id: doc.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
            });
          });
          
          console.log(`📅 Eventos cargados: ${eventosData.length}`);
          setEventos(eventosData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error cargando eventos:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error configurando listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // El listener real-time se encarga de actualizar automáticamente
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Función para obtener color según prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#f44336'; // Rojo
      case 'high': return '#ff9800';   // Naranja
      case 'medium': return '#ffc107'; // Amarillo
      case 'low': return '#4caf50';    // Verde
      default: return '#9e9e9e';       // Gris
    }
  };

  // Función para obtener etiqueta de prioridad
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgent': return 'URGENTE';
      case 'high': return 'ALTA';
      case 'medium': return 'MEDIA';
      case 'low': return 'BAJA';
      default: return 'NORMAL';
    }
  };

  // Renderizar cada evento
  const renderEvento = ({ item }) => (
    <SobrioCard style={styles.eventoCard} borderColor={getPriorityColor(item.priority)}>
      <View style={styles.eventoHeader}>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={styles.eventoContent}>
          <View style={styles.eventoTitleRow}>
            <Text style={styles.eventoTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '1A' }]}>
              <Text style={[styles.priorityBadgeText, { color: getPriorityColor(item.priority) }]}>
                {getPriorityLabel(item.priority)}
              </Text>
            </View>
          </View>
          
          <View style={styles.eventoDateRow}>
            <MaterialIcons name="event" size={16} color="#64748b" />
            <Text style={styles.eventoDate}>
              {format(item.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </Text>
          </View>
          
          {item.description && (
            <Text style={styles.eventoDescription} numberOfLines={3}>
              {item.description}
            </Text>
          )}
          
          {item.createdByName && (
            <View style={styles.eventoFooter}>
              <MaterialIcons name="person-outline" size={14} color="#94a3b8" />
              <Text style={styles.eventoCreator}>
                Creado por {item.createdByName}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SobrioCard>
  );

  // Estados de carga
  if (loading) return <LoadingState message="Cargando eventos..." />;
  if (error) return <ErrorState message={error} onRetry={() => setLoading(true)} />;
  if (eventos.length === 0) return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <MaterialIcons name="event" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Calendario</Text>
        <Text style={styles.headerSubtitle}>Eventos programados</Text>
      </LinearGradient>
      <EmptyState 
        icon="event-available" 
        message="No hay eventos programados" 
        iconColor={getPrimaryColor()}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <MaterialIcons name="event" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Calendario</Text>
        <Text style={styles.headerSubtitle}>{eventos.length} evento{eventos.length !== 1 ? 's' : ''} programado{eventos.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      {/* Lista de eventos */}
      <FlatList
        data={eventos}
        renderItem={renderEvento}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[getPrimaryColor()]}
            tintColor={getPrimaryColor()}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32, // 🎨 Material 3 Large
    borderBottomRightRadius: 32,
    // Material 3 Elevation Level 2
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 30, // 🎨 Material 3 Headline Medium
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15, // 🎨 Material 3 Body Medium
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  list: {
    padding: 16,
    paddingBottom: 24
  },
  eventoCard: {
    marginBottom: 12
  },
  eventoHeader: {
    flexDirection: 'row'
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 16
  },
  eventoContent: {
    flex: 1
  },
  eventoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12
  },
  eventoTitle: {
    flex: 1,
    fontSize: 18, // 🎨 Material 3 Title Medium
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12, // 🎨 Material 3 Medium
  },
  priorityBadgeText: {
    fontSize: 11, // 🎨 Material 3 Label Small
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  eventoDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  eventoDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  eventoDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 20,
    letterSpacing: 0.2,
    marginBottom: 12
  },
  eventoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  eventoCreator: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    letterSpacing: 0.3,
  }
});
