import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onSnapshot, query, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { useColombianHolidays } from '../../hooks/useColombianHolidays';
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
const EventoItem = ({ item, index }) => {
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={styles.card}>
        <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(item.priority, item.type) }]} />
        <View style={styles.cardContent}>
          <View style={styles.dateBox}>
            <Text style={styles.dayText}>{format(item.date, 'dd')}</Text>
            <Text style={styles.monthText}>{format(item.date, 'MMM', { locale: es }).toUpperCase()}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventTime}>
              {item.allDay ? 'Todo el día' : format(item.date, 'h:mm a', { locale: es })} 
              {item.location ? ` • ${item.location}` : ''}
            </Text>
            
            {item.type === 'commitment' ? (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.companyText}>🏢 {item.companyName || 'Sin empresa'}</Text>
                <Text style={[styles.amountText, { color: getPriorityColor(item.priority, item.type) }]}>
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.amount || 0)}
                </Text>
              </View>
            ) : (
              item.description && (
                <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
              )
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default function CalendarioScreen({ navigation }) {
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
    if (!holidays.length) return;

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradient()}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Calendario</Text>
          
          {/* View Selector */}
          <View style={styles.viewSelector}>
            {['day', 'week', 'month'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.viewOption,
                  viewMode === mode && styles.viewOptionActive
                ]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[
                  styles.viewOptionText,
                  viewMode === mode && styles.viewOptionTextActive
                ]}>
                  {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Navigator */}
          <View style={styles.dateNavigator}>
            <TouchableOpacity onPress={handlePrev} style={styles.navButton}>
              <MaterialIcons name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
            <TouchableOpacity onPress={handleNext} style={styles.navButton}>
              <MaterialIcons name="chevron-right" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[
        styles.sheetContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}>
        <FlatList
          data={filteredEventos}
          renderItem={({ item, index }) => <EventoItem item={item} index={index} />}
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
                <MaterialIcons name="event-busy" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay eventos para esta fecha</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  viewOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  viewOptionActive: {
    backgroundColor: '#fff',
  },
  viewOptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontSize: 14,
  },
  viewOptionTextActive: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navButton: {
    padding: 8,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  sheetContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: '#f5f6fa',
    borderTopLeftRadius: 30,
    borderTopTopRightRadius: 30,
    paddingTop: 20,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
    borderRightColor: '#f0f0f0',
    marginRight: 16,
    minWidth: 60,
  },
  dayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  monthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636e72',
    marginTop: 4,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 12,
    color: '#b2bec3',
  },
  companyText: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 2,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#b2bec3',
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
