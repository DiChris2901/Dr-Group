import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  Surface, 
  IconButton, 
  Chip 
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { onSnapshot, query, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { useColombianHolidays } from '../../hooks/useColombianHolidays';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  esHabil, 
  calculateTenthBusinessDay, 
  calculateThirdBusinessDay 
} from '../../utils/dateUtils';
import { 
  format, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  addDays, 
  addWeeks, 
  addMonths, 
  subDays, 
  subWeeks, 
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isValid
} from 'date-fns';
import { es } from 'date-fns/locale';

const { width, height } = Dimensions.get('window');

// Componente renderizado fuera para evitar "Invalid hook call"
const EventoItem = ({ item, index, styles, theme }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const getPriorityColor = (priority, type) => {
    if (type === 'holiday') return '#9c27b0'; // Morado para festivos
    if (type === 'system') return '#2196f3'; // Azul para sistema
    if (type === 'commitment') {
      if (priority === 'paid') return '#4caf50';
      if (priority === 'overdue') return '#f44336';
      return '#ff9800';
    }
    
    switch (priority) {
      case 'urgent': return '#ff4757';
      case 'high': return '#ffa502';
      case 'medium': return '#eccc68';
      case 'low': return '#2ed573';
      default: return '#a4b0be';
    }
  };

  const isValidDate = (d) => d instanceof Date && !isNaN(d);
  const safeDate = isValidDate(item.date) ? item.date : new Date();
  const priorityColor = getPriorityColor(item.priority, item.type);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Surface style={styles.card} elevation={1}>
        <View style={[styles.priorityStrip, { backgroundColor: priorityColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.dateBox}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
              {format(safeDate, 'dd')}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>
              {format(safeDate, 'MMM', { locale: es })}
            </Text>
          </View>
          <View style={styles.eventInfo}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
              {item.allDay ? 'Todo el día' : format(safeDate, 'h:mm a', { locale: es })} 
              {item.location ? ` • ${item.location}` : ''}
            </Text>
            
            {item.type === 'commitment' ? (
              <View style={{ marginTop: 4 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  🏢 {item.companyName || 'Sin empresa'}
                </Text>
                <Text variant="labelLarge" style={{ color: priorityColor, fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.amount || 0)}
                </Text>
              </View>
            ) : (
              item.description && (
                <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.outline }}>
                  {item.description}
                </Text>
              )
            )}
          </View>
        </View>
      </Surface>
    </Animated.View>
  );
};

export default function CalendarioScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { getGradient, getPrimaryColor } = useTheme();
  const [allEventos, setAllEventos] = useState([]);
  const [filteredEventos, setFilteredEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data Sources
  const [customEvents, setCustomEvents] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // View State
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const holidays = useColombianHolidays(selectedDate.getFullYear());

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

  // 1. Fetch Custom Events
  useEffect(() => {
    const q = query(collection(db, 'calendar_events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        let eventDate = new Date();
        if (data.date?.toDate) eventDate = data.date.toDate();
        else if (data.date instanceof Date) eventDate = data.date;
        else if (typeof data.date === 'string') eventDate = new Date(data.date);
        else if (data.date?.seconds) eventDate = new Date(data.date.seconds * 1000);

        return { id: doc.id, ...data, date: eventDate, type: 'custom' };
      });
      setCustomEvents(events);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Commitments
  useEffect(() => {
    const q = query(collection(db, 'commitments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms = snapshot.docs.map(doc => {
        const data = doc.data();
        let dueDate = new Date();
        if (data.dueDate?.toDate) dueDate = data.dueDate.toDate();
        else if (typeof data.dueDate === 'string') dueDate = new Date(data.dueDate);
        
        return { id: doc.id, ...data, dueDate };
      });
      setCommitments(comms);
    });
    return () => unsubscribe();
  }, []);

  // 3. Fetch Companies (Contracts)
  useEffect(() => {
    const q = query(collection(db, 'companies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comps = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });
      setCompanies(comps);
    });
    return () => unsubscribe();
  }, []);

  // 4. Combine and Generate Events
  useEffect(() => {
    if (!holidays || !Array.isArray(holidays) || !holidays.length) return;

    const generatedEvents = [];
    const year = selectedDate.getFullYear();

    // --- A. Festivos ---
    holidays.forEach(h => {
      generatedEvents.push({
        id: `holiday-${h.date}`,
        title: `🇨🇴 ${h.name}`,
        date: parseISO(h.date),
        allDay: true,
        type: 'holiday',
        priority: 'low',
        description: 'Festivo Nacional'
      });
    });

    // --- B. Eventos del Sistema (Coljuegos, UIAF, Parafiscales) ---
    // Generamos para todos los meses del año actual para permitir navegación fluida
    for (let month = 0; month < 12; month++) {
      // 1. Coljuegos (10mo día hábil)
      const coljuegosDate = calculateTenthBusinessDay(year, month + 1, holidays);
      generatedEvents.push({
        id: `coljuegos-${year}-${month}`,
        title: '🎰 Pago Coljuegos',
        date: coljuegosDate,
        allDay: true,
        type: 'system',
        priority: 'high',
        description: 'Vencimiento pago Derechos de Explotación y Gastos de Administración'
      });

      // 2. Parafiscales (3er día hábil)
      const parafiscalesDate = calculateThirdBusinessDay(year, month + 1, holidays);
      generatedEvents.push({
        id: `parafiscales-${year}-${month}`,
        title: '👥 Parafiscales',
        date: parafiscalesDate,
        allDay: true,
        type: 'system',
        priority: 'high',
        description: 'Pago seguridad social y parafiscales'
      });

      // 3. UIAF (Día 10 del mes)
      const uiafDate = new Date(year, month, 10);
      generatedEvents.push({
        id: `uiaf-${year}-${month}`,
        title: '👮 Reporte UIAF',
        date: uiafDate,
        allDay: true,
        type: 'system',
        priority: 'medium',
        description: 'Reporte SIREL'
      });
    }

    // --- C. Compromisos ---
    const commitmentEvents = commitments.map(comm => {
      const isPaid = comm.status === 'paid';
      const isOverdue = !isPaid && new Date(comm.dueDate) < new Date();
      
      // Formatear monto
      const formattedAmount = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(comm.amount || 0);

      return {
        id: `comm-${comm.id}`,
        title: comm.concept || 'Compromiso',
        date: comm.dueDate,
        allDay: true,
        type: 'commitment',
        priority: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
        description: `${comm.companyName || 'Sin empresa'}\n${formattedAmount}`,
        location: 'Finanzas',
        amount: comm.amount,
        companyName: comm.companyName
      };
    });

    // --- D. Contratos ---
    const contractEvents = companies
      .filter(c => c.contractExpirationDate)
      .map(comp => {
        let expDate;
        if (comp.contractExpirationDate?.toDate) expDate = comp.contractExpirationDate.toDate();
        else if (typeof comp.contractExpirationDate === 'string') expDate = new Date(comp.contractExpirationDate);
        
        if (!isValid(expDate)) return null;

        return {
          id: `contract-${comp.id}`,
          title: `📄 Contrato ${comp.name}`,
          date: expDate,
          allDay: true,
          type: 'system',
          priority: 'urgent',
          description: 'Vencimiento de contrato'
        };
      })
      .filter(Boolean);

    // --- Merge All ---
    const finalEvents = [
      ...customEvents,
      ...generatedEvents,
      ...commitmentEvents,
      ...contractEvents
    ];

    // Sort by date
    finalEvents.sort((a, b) => a.date - b.date);

    setAllEventos(finalEvents);
    setLoading(false);

  }, [customEvents, commitments, companies, holidays, selectedDate]);

  // Filter events
  useEffect(() => {
    const filtered = allEventos.filter(event => {
      const eventDate = event.date;
      if (!isValid(eventDate)) return false;

      switch (viewMode) {
        case 'day':
          return isSameDay(eventDate, selectedDate);
        case 'week':
          return isSameWeek(eventDate, selectedDate, { weekStartsOn: 1 });
        case 'month':
          return isSameMonth(eventDate, selectedDate);
        default:
          return true;
      }
    });
    setFilteredEventos(filtered);
  }, [allEventos, viewMode, selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    // Re-fetch logic is handled by onSnapshot automatically, just fake delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePrev = () => {
    switch (viewMode) {
      case 'day': setSelectedDate(subDays(selectedDate, 1)); break;
      case 'week': setSelectedDate(subWeeks(selectedDate, 1)); break;
      case 'month': setSelectedDate(subMonths(selectedDate, 1)); break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day': setSelectedDate(addDays(selectedDate, 1)); break;
      case 'week': setSelectedDate(addWeeks(selectedDate, 1)); break;
      case 'month': setSelectedDate(addMonths(selectedDate, 1)); break;
    }
  };

  const getDateLabel = () => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
      case 'week':
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(start, 'd MMM')} - ${format(end, 'd MMM', { locale: es })}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy', { locale: es });
      default:
        return '';
    }
  };

  const styles = createStyles(paperTheme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: paperTheme.colors.primary }}>
          Calendario
        </Text>
        <IconButton icon="calendar-today" onPress={() => setSelectedDate(new Date())} />
      </View>

      {/* View Selector */}
      <View style={styles.viewSelectorContainer}>
        <View style={styles.viewSelector}>
          {['day', 'week', 'month'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewOption,
                viewMode === mode && { backgroundColor: paperTheme.colors.primaryContainer }
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text 
                style={[
                  styles.viewOptionText,
                  viewMode === mode && { color: paperTheme.colors.onPrimaryContainer, fontWeight: 'bold' }
                ]}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNavigator}>
        <IconButton icon="chevron-left" onPress={handlePrev} />
        <Text variant="titleLarge" style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
          {getDateLabel()}
        </Text>
        <IconButton icon="chevron-right" onPress={handleNext} />
      </View>

      <Animated.View style={[
        styles.sheetContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}>
        <FlatList
          data={filteredEventos}
          renderItem={({ item, index }) => <EventoItem item={item} index={index} styles={styles} theme={paperTheme} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[getPrimaryColor()]}
              tintColor={getPrimaryColor()}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <MaterialIcons name="event-busy" size={64} color={paperTheme.colors.outline} />
                <Text variant="bodyLarge" style={styles.emptyText}>No hay eventos para esta fecha</Text>
                <TouchableOpacity 
                  style={[styles.resetButton, { borderColor: getPrimaryColor() }]}
                  onPress={() => {
                    setViewMode('month');
                    setSelectedDate(new Date());
                  }}
                >
                  <Text style={[styles.resetText, { color: getPrimaryColor() }]}>
                    Ir a Hoy
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  viewSelectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 24,
    padding: 4,
  },
  viewOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  viewOptionText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  priorityStrip: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: theme.colors.outlineVariant,
    marginRight: 16,
    minWidth: 60,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: theme.colors.outline,
    marginTop: 16,
    marginBottom: 24,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  resetText: {
    fontWeight: '600',
  },
});
