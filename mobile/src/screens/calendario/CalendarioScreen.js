import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  Dimensions,
  Animated,
  Easing,
  Pressable
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  IconButton,
  SegmentedButtons,
  Portal,
  Modal,
  Button
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onSnapshot, query, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { useColombianHolidays } from '../../hooks/useColombianHolidays';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';
import ExpressiveCard from '../../components/ExpressiveCard';
import { 
  calculateTenthBusinessDay, 
  calculateThirdBusinessDay 
} from '../../utils/dateUtils';
import { 
  format, 
  formatDistanceToNow,
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
  parseISO, 
  isValid
} from 'date-fns';
import { es } from 'date-fns/locale';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { height } = Dimensions.get('window');

const EventoItem = ({ item, index, surfaceColors, onPress }) => {
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

  const getEventColors = (priority, type) => {
    // 1. Festivos
    if (type === 'holiday') return { 
      container: surfaceColors.tertiaryContainer, 
      onContainer: surfaceColors.onTertiaryContainer,
      label: 'Festivo'
    };

    // 2. Eventos Manuales (Agenda Personal)
    if (type === 'custom') return { 
      container: surfaceColors.secondaryContainer, 
      onContainer: surfaceColors.onSecondaryContainer,
      label: 'Nota'
    };

    // 3. Eventos del Sistema (Parafiscales, Coljuegos, etc)
    if (type === 'system') {
      // Obligaciones importantes (Parafiscales, Coljuegos)
      if (priority === 'high' || priority === 'urgent') {
        return { 
          container: surfaceColors.tertiaryContainer, 
          onContainer: surfaceColors.onTertiaryContainer,
          label: 'Obligación'
        };
      }
      return { 
        container: surfaceColors.surfaceContainerHigh, 
        onContainer: surfaceColors.onSurface,
        label: 'Sistema'
      };
    }
    
    // 4. Compromisos Financieros
    if (type === 'commitment') {
      if (priority === 'paid') return { 
        container: surfaceColors.primaryContainer, 
        onContainer: surfaceColors.onPrimaryContainer,
        label: 'Pagado'
      };
      if (priority === 'overdue') return { 
        container: surfaceColors.errorContainer, 
        onContainer: surfaceColors.onErrorContainer,
        label: 'Vencido'
      };
      return { 
        container: surfaceColors.surfaceContainerHigh, 
        onContainer: surfaceColors.onSurface,
        label: 'Pendiente'
      };
    }
    
    // Fallback
    return { 
      container: surfaceColors.surfaceContainerHigh, 
      onContainer: surfaceColors.onSurface,
      label: 'Evento'
    };
  };

  const isValidDate = (d) => d instanceof Date && !isNaN(d);
  const safeDate = isValidDate(item.date) ? item.date : new Date();
  const colors = getEventColors(item.priority, item.type);
  const priority = item.priority; // Extract priority for usage in render

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <ExpressiveCard 
        style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }} 
        variant="filled"
        onPress={() => {
          Haptics.selectionAsync();
          onPress(item);
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          {/* Semantic Date Column */}
          <View style={{ 
            width: 80, 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: colors.container,
            paddingVertical: 16
          }}>
            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 28, 
              fontWeight: '400', 
              color: colors.onContainer,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}>
              {format(safeDate, 'dd')}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: colors.onContainer, 
              textTransform: 'uppercase',
              letterSpacing: 1,
              opacity: 0.8
            }}>
              {format(safeDate, 'MMM', { locale: es })}
            </Text>
          </View>

          {/* Content Column */}
          <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
            {/* Status Badge */}
            <View style={{ 
              alignSelf: 'flex-start',
              backgroundColor: colors.container,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              marginBottom: 8
            }}>
              <Text style={{ 
                fontSize: 11, 
                color: colors.onContainer, 
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                {colors.label}
              </Text>
            </View>

            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 18, 
              fontWeight: '500', 
              color: surfaceColors.onSurface,
              marginBottom: 4,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}>
              {item.title}
            </Text>
            
            <Text style={{ fontSize: 14, color: surfaceColors.onSurfaceVariant }}>
              {item.allDay ? 'Todo el día' : format(safeDate, 'h:mm a', { locale: es })} 
              {item.location ? ` • ${item.location}` : ''}
            </Text>
            
            {item.type === 'commitment' ? (
              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: surfaceColors.onSurfaceVariant, flex: 1 }} numberOfLines={1}>
                  🏢 {item.companyName || 'Sin empresa'}
                </Text>
                <Text style={{ 
                  fontSize: 16, 
                  color: colors.onContainer === surfaceColors.onSurface ? surfaceColors.primary : colors.onContainer, 
                  fontWeight: '700' 
                }}>
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.amount || 0)}
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                {item.type === 'system' && (priority === 'high' || priority === 'urgent') && (
                  <MaterialCommunityIcons 
                    name="alert-circle-outline" 
                    size={16} 
                    color={surfaceColors.onSurfaceVariant} 
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text 
                  style={{ 
                    fontSize: 14, 
                    color: surfaceColors.onSurfaceVariant,
                    flex: 1 
                  }} 
                  numberOfLines={2}
                >
                  {item.description || 'Sin descripción adicional'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ExpressiveCard>
    </Animated.View>
  );
};

export default function CalendarioScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  
  // Surface colors dinámicos
  const surfaceColors = useMemo(() => {
    const scheme = paperTheme.dark ? materialTheme.schemes.dark : materialTheme.schemes.light;
    return {
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      onSurface: scheme.onSurface,
      onSurfaceVariant: scheme.onSurfaceVariant,
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      secondary: scheme.secondary,
      secondaryContainer: scheme.secondaryContainer,
      onSecondaryContainer: scheme.onSecondaryContainer,
      tertiary: scheme.tertiary,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      error: scheme.error,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer,
      outline: scheme.outline,
      background: scheme.background
    };
  }, [paperTheme.dark]);

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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const viewShotRef = useRef();
  
  const holidays = useColombianHolidays(selectedDate.getFullYear());

  // Animations
  const slideAnim = useRef(new Animated.Value(height * 0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 0.9,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

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
        
        // Handle dueDate
        let dueDate = new Date();
        if (data.dueDate?.toDate) dueDate = data.dueDate.toDate();
        else if (typeof data.dueDate === 'string') dueDate = new Date(data.dueDate);

        // Handle paymentDate
        let paymentDate = null;
        if (data.paymentDate?.toDate) paymentDate = data.paymentDate.toDate();
        else if (typeof data.paymentDate === 'string') paymentDate = new Date(data.paymentDate);
        
        return { id: doc.id, ...data, dueDate, paymentDate };
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
      
      return {
        id: `comm-${comm.id}`,
        title: comm.concept || 'Compromiso',
        date: comm.dueDate,
        allDay: true,
        type: 'commitment',
        priority: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
        description: comm.observations || '',
        location: 'Finanzas',
        amount: comm.amount,
        companyName: comm.companyName,
        beneficiary: comm.beneficiary,
        paymentMethod: comm.paymentMethod,
        paymentDate: comm.paymentDate
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
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceColors.background }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 32, 
            fontWeight: '400', 
            color: surfaceColors.onSurface,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }]
          }}>
            Calendario
          </Text>
          <Text style={{ fontSize: 16, color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            Agenda y vencimientos
          </Text>
        </View>
        <IconButton 
          icon="calendar-today" 
          iconColor={surfaceColors.primary}
          size={28}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedDate(new Date());
          }} 
        />
      </View>

      {/* View Selector - SegmentedButtons */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => {
            Haptics.selectionAsync();
            setViewMode(value);
          }}
          buttons={[
            { value: 'day', label: 'Día', icon: 'calendar-today' },
            { value: 'week', label: 'Semana', icon: 'calendar-week' },
            { value: 'month', label: 'Mes', icon: 'calendar-month' },
          ]}
        />
      </View>

      {/* Date Navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }}>
        <IconButton 
          icon="chevron-left" 
          iconColor={surfaceColors.onSurface}
          size={32}
          onPress={() => {
            Haptics.selectionAsync();
            handlePrev();
          }} 
        />
        <Text style={{ 
          fontFamily: 'Roboto-Flex', 
          fontSize: 20, 
          fontWeight: '500', 
          color: surfaceColors.onSurface,
          textTransform: 'capitalize',
          fontVariationSettings: [{ axis: 'wdth', value: 110 }]
        }}>
          {getDateLabel()}
        </Text>
        <IconButton 
          icon="chevron-right" 
          iconColor={surfaceColors.onSurface}
          size={32}
          onPress={() => {
            Haptics.selectionAsync();
            handleNext();
          }} 
        />
      </View>

      <Animated.View style={{ flex: 1, transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
        <FlatList
          data={filteredEventos}
          renderItem={({ item, index }) => (
            <EventoItem 
              item={item} 
              index={index} 
              surfaceColors={surfaceColors} 
              onPress={(event) => {
                setSelectedEvent(event);
                setModalVisible(true);
              }}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[surfaceColors.primary]}
              tintColor={surfaceColors.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <View style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: 60, 
                  backgroundColor: surfaceColors.surfaceContainerHigh, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 24
                }}>
                  <MaterialCommunityIcons name="calendar-blank" size={64} color={surfaceColors.primary} />
                </View>
                <Text style={{ 
                  fontFamily: 'Roboto-Flex', 
                  fontSize: 22, 
                  color: surfaceColors.onSurface,
                  fontVariationSettings: [{ axis: 'wdth', value: 110 }]
                }}>
                  Sin eventos
                </Text>
                <Text style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, marginBottom: 24 }}>
                  No hay nada programado para esta fecha
                </Text>
                <Pressable 
                  style={({ pressed }) => [{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 100,
                    borderWidth: 1,
                    borderColor: surfaceColors.outline,
                    backgroundColor: pressed ? surfaceColors.surfaceContainerHigh : 'transparent'
                  }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setViewMode('month');
                    setSelectedDate(new Date());
                  }}
                >
                  <Text style={{ color: surfaceColors.primary, fontWeight: '600' }}>
                    Ir a Hoy
                  </Text>
                </Pressable>
              </View>
            )
          }
        />
      </Animated.View>

      {/* Event Details Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: surfaceColors.surfaceContainerHigh,
            margin: 24,
            borderRadius: 28,
            padding: 24,
            elevation: 0
          }}
        >
          {selectedEvent && (
            <View>
              <View ref={viewShotRef} collapsable={false} style={{ backgroundColor: surfaceColors.surfaceContainerHigh, padding: 16, borderRadius: 16 }}>
                {/* Header Badge (Relative Time) */}
                <View style={{ 
                  alignSelf: 'center', 
                  backgroundColor: surfaceColors.surfaceContainer,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  marginBottom: 20
                }}>
                  <Text style={{ 
                    fontSize: 12, 
                    color: surfaceColors.onSurfaceVariant, 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {formatDistanceToNow(selectedEvent.date, { addSuffix: true, locale: es })}
                  </Text>
                </View>

                {/* Main Icon */}
                <View style={{ 
                  alignSelf: 'center',
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: selectedEvent.type === 'holiday' ? surfaceColors.tertiaryContainer : 
                                 selectedEvent.type === 'system' ? surfaceColors.secondaryContainer : 
                                 surfaceColors.primaryContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <MaterialCommunityIcons 
                    name={selectedEvent.type === 'holiday' ? 'flag-variant' : 
                          selectedEvent.type === 'system' ? 'bank' : 
                          'calendar-check'} 
                    size={36} 
                    color={selectedEvent.type === 'holiday' ? surfaceColors.onTertiaryContainer : 
                           selectedEvent.type === 'system' ? surfaceColors.onSecondaryContainer : 
                           surfaceColors.onPrimaryContainer} 
                  />
                </View>

                {/* Title */}
                <Text style={{ 
                  fontFamily: 'Roboto-Flex', 
                  fontSize: 24, 
                  fontWeight: '400', 
                  color: surfaceColors.onSurface,
                  textAlign: 'center',
                  marginBottom: 4,
                  fontVariationSettings: [{ axis: 'wdth', value: 110 }]
                }}>
                  {selectedEvent.title}
                </Text>

                {/* Date */}
                <Text style={{ 
                  fontSize: 16, 
                  color: surfaceColors.onSurfaceVariant, 
                  textAlign: 'center',
                  marginBottom: 24,
                  fontWeight: '500'
                }}>
                  {format(selectedEvent.date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </Text>

                {/* Status Badge (if commitment) */}
                {selectedEvent.type === 'commitment' && (
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'center', 
                    marginBottom: 24,
                    gap: 8
                  }}>
                    <View style={{ 
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: selectedEvent.priority === 'paid' ? surfaceColors.primaryContainer : 
                                     selectedEvent.priority === 'overdue' ? surfaceColors.errorContainer : 
                                     surfaceColors.surfaceContainer,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8
                    }}>
                      <MaterialCommunityIcons 
                        name={selectedEvent.priority === 'paid' ? 'check-circle' : 
                              selectedEvent.priority === 'overdue' ? 'alert-circle' : 
                              'clock-outline'} 
                        size={16} 
                        color={selectedEvent.priority === 'paid' ? surfaceColors.onPrimaryContainer : 
                               selectedEvent.priority === 'overdue' ? surfaceColors.onErrorContainer : 
                               surfaceColors.onSurface} 
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '600',
                        color: selectedEvent.priority === 'paid' ? surfaceColors.onPrimaryContainer : 
                               selectedEvent.priority === 'overdue' ? surfaceColors.onErrorContainer : 
                               surfaceColors.onSurface
                      }}>
                        {selectedEvent.priority === 'paid' ? 'Pagado' : 
                         selectedEvent.priority === 'overdue' ? 'Vencido' : 
                         'Pendiente'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Details Section */}
                <View style={{ 
                  backgroundColor: surfaceColors.surfaceContainer,
                  borderRadius: 16,
                  padding: 16,
                  gap: 16
                }}>
                  {/* Company Info */}
                  {selectedEvent.companyName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: surfaceColors.surfaceContainerHigh,
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginRight: 16
                      }}>
                        <MaterialCommunityIcons name="domain" size={20} color={surfaceColors.primary} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, color: surfaceColors.onSurfaceVariant }}>Empresa</Text>
                        <Text style={{ fontSize: 16, color: surfaceColors.onSurface, fontWeight: '500' }}>
                          {selectedEvent.companyName}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Beneficiary Info */}
                  {selectedEvent.beneficiary && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: surfaceColors.surfaceContainerHigh,
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginRight: 16
                      }}>
                        <MaterialCommunityIcons name="account-tie" size={20} color={surfaceColors.secondary} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, color: surfaceColors.onSurfaceVariant }}>Beneficiario</Text>
                        <Text style={{ fontSize: 16, color: surfaceColors.onSurface, fontWeight: '500' }}>
                          {selectedEvent.beneficiary}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Payment Info (if paid) */}
                  {selectedEvent.priority === 'paid' && selectedEvent.paymentDate && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: surfaceColors.surfaceContainerHigh,
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginRight: 16
                      }}>
                        <MaterialCommunityIcons name="check-decagram" size={20} color={surfaceColors.tertiary} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, color: surfaceColors.onSurfaceVariant }}>Pagado el</Text>
                        <Text style={{ fontSize: 16, color: surfaceColors.onSurface, fontWeight: '500' }}>
                          {format(selectedEvent.paymentDate, "d MMM, h:mm a", { locale: es })}
                          {selectedEvent.paymentMethod ? ` • ${selectedEvent.paymentMethod}` : ''}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Amount */}
                  {selectedEvent.amount && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: surfaceColors.surfaceContainerHigh,
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginRight: 16
                      }}>
                        <MaterialCommunityIcons name="cash" size={20} color={surfaceColors.primary} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, color: surfaceColors.onSurfaceVariant }}>Monto</Text>
                        <Text style={{ fontSize: 18, color: surfaceColors.primary, fontWeight: '700' }}>
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedEvent.amount)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: surfaceColors.surfaceContainerHigh,
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginRight: 16
                      }}>
                        <MaterialCommunityIcons name="text-short" size={20} color={surfaceColors.onSurfaceVariant} />
                      </View>
                      <View style={{ flex: 1, paddingTop: 2 }}>
                        <Text style={{ fontSize: 12, color: surfaceColors.onSurfaceVariant }}>Descripción</Text>
                        <Text style={{ fontSize: 15, color: surfaceColors.onSurface, lineHeight: 22 }}>
                          {selectedEvent.description}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
                <Button 
                  mode="text" 
                  onPress={() => setModalVisible(false)}
                  textColor={surfaceColors.onSurfaceVariant}
                >
                  Cerrar
                </Button>
                <Button 
                  mode="filled" 
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleShare();
                  }}
                  buttonColor={surfaceColors.primary}
                  textColor={surfaceColors.onPrimary}
                  icon="share-variant"
                >
                  Compartir
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}
