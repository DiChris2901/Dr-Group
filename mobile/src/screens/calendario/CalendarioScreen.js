import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  Dimensions,
  Animated,
  Easing,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  Text, 
  useTheme as usePaperTheme, 
  IconButton,
  SegmentedButtons,
  Portal,
  Modal,
  Button,
  FAB
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onSnapshot, query, collection, addDoc, Timestamp, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
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
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { LocaleConfig } from 'react-native-calendars';

// Configurar locale español para react-native-calendars
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';
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
  const { can } = usePermissions();
  const theme = usePaperTheme();
  const paperTheme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  const { scheduleCalendarEventNotification, cancelCalendarNotifications } = useNotifications();
  const { userProfile } = useAuth();
  const { preferences } = useNotificationPreferences();
  
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
  const [changingView, setChangingView] = useState(false);
  
  // ✅ Refs para cleanup de listeners
  const unsubscribeCustomEventsRef = useRef(null);
  const unsubscribeCommitmentsRef = useRef(null);
  const unsubscribeCompaniesRef = useRef(null);
  const isInitialMountRef = useRef(true); // ✅ Evitar programar notificaciones en primera carga
  
  // Data Sources
  const [customEvents, setCustomEvents] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // View State
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    return today;
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const viewShotRef = useRef();
  
  // ✅ Estado para modal de eventos del día en vista anual
  const [dayEventsModalVisible, setDayEventsModalVisible] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  
  // ✅ Estados para crear evento manual
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    date: new Date(),
    allDay: true,
    priority: 'medium',
    notifications: [
      { time: 10, unit: 'minutes', enabled: true }
    ],
    recurrence: {
      enabled: false,
      frequency: 'none', // 'daily', 'weekly', 'monthly', 'yearly'
      endDate: null
    }
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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

  // 1. Fetch Custom Events - ✅ useFocusEffect para cleanup al perder foco
  useFocusEffect(
    useCallback(() => {
      // ✅ Solo eventos de los próximos 3 meses para reducir lecturas
      const now = new Date();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      
      const q = query(
        collection(db, 'calendar_events'),
        limit(150) // ✅ Máximo 150 eventos (historial + futuros)
      );
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
      unsubscribeCustomEventsRef.current = unsubscribe;
      
      return () => {
        if (unsubscribeCustomEventsRef.current) {
          unsubscribeCustomEventsRef.current();
          unsubscribeCustomEventsRef.current = null;
        }
        // ✅ Resetear flag al salir de la pantalla para evitar notificaciones al regresar
        isInitialMountRef.current = true;
      };
    }, [])
  );

  // 2. Fetch Commitments - ✅ useFocusEffect para cleanup al perder foco
  useFocusEffect(
    useCallback(() => {
      const q = query(
        collection(db, 'commitments'),
        limit(150) // ✅ Máximo 150 compromisos recientes
      );
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
      unsubscribeCommitmentsRef.current = unsubscribe;
      
      return () => {
        if (unsubscribeCommitmentsRef.current) {
          unsubscribeCommitmentsRef.current();
          unsubscribeCommitmentsRef.current = null;
        }
      };
    }, [])
  );

  // 3. Fetch Companies (Contracts) - ✅ useFocusEffect para cleanup al perder foco
  useFocusEffect(
    useCallback(() => {
      const q = query(collection(db, 'companies'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const comps = snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data };
        });
        setCompanies(comps);
      });
      unsubscribeCompaniesRef.current = unsubscribe;
      
      return () => {
        if (unsubscribeCompaniesRef.current) {
          unsubscribeCompaniesRef.current();
          unsubscribeCompaniesRef.current = null;
        }
      };
    }, [])
  );

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
      // 1. Coljuegos (10mo día hábil) - Usar month 0-based como el dashboard web
      const coljuegosDate = calculateTenthBusinessDay(year, month, holidays);
      generatedEvents.push({
        id: `coljuegos-${year}-${month}`,
        title: '🎰 Pago Coljuegos',
        date: coljuegosDate,
        allDay: true,
        type: 'system',
        priority: 'high',
        description: 'Vencimiento pago Derechos de Explotación y Gastos de Administración'
      });

      // 2. Parafiscales (3er día hábil) - Usar month 0-based como el dashboard web
      const parafiscalesDate = calculateThirdBusinessDay(year, month, holidays);
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

  // ✅ NUEVO: Programar notificaciones de calendario para eventos próximos (Solo ADMIN con preferencias)
  useEffect(() => {
    // ✅ Skip en primera carga (mount inicial o re-entrada a la pantalla)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (!userProfile || (userProfile.role !== 'ADMIN' && userProfile.role !== 'SUPER_ADMIN')) {
      return;
    }

    // Esperar a que se carguen las preferencias
    if (!preferences || !preferences.calendar.enabled) {
      return;
    }

    const programarNotificaciones = async () => {
      try {
        // Cancelar notificaciones obsoletas primero
        await cancelCalendarNotifications();

        const now = new Date();
        const futureEvents = allEventos.filter(event => {
          // 1. Solo eventos futuros dentro de los próximos 30 días
          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
          const daysDiff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
          if (daysDiff < 0 || daysDiff > 30) return false;

          // 2. Filtrar por preferencias del usuario
          if (event.type === 'system') {
            // Parafiscales
            if (event.title.includes('Parafiscales') && !preferences.calendar.events.parafiscales) {
              return false;
            }
            // Coljuegos
            if (event.title.includes('Coljuegos') && !preferences.calendar.events.coljuegos) {
              return false;
            }
            // UIAF
            if (event.title.includes('UIAF') && !preferences.calendar.events.uiaf) {
              return false;
            }
            // Contratos
            if (event.title.includes('Contrato') && !preferences.calendar.events.contratos) {
              return false;
            }
          }

          // Festivos
          if (event.type === 'holiday' && !preferences.calendar.events.festivos) {
            return false;
          }

          // Eventos personales
          if (event.type === 'custom' && !preferences.calendar.events.custom) {
            return false;
          }

          return true;
        });

        // Programar notificaciones para cada evento (usar preferencias de días antes)
        const daysBeforeArray = preferences.calendar.daysBeforeArray || [2, 0];
        for (const event of futureEvents) {
          await scheduleCalendarEventNotification(event, daysBeforeArray);
        }
      } catch (error) {
        console.error('❌ Error programando notificaciones de calendario:', error);
      }
    };

    // ✅ FIX: Deshabilitado temporalmente para migración a Cloud Functions
    // El sistema anterior causaba duplicidad de notificaciones al navegar
    /*
    if (allEventos.length > 0) {
      programarNotificaciones();
    }
    */
  }, [customEvents, userProfile, preferences]);

  // Filter events
  useEffect(() => {
    const filtered = allEventos.filter(event => {
      const eventDate = event.date;
      if (!isValid(eventDate)) return false;

      switch (viewMode) {
        case 'day':
          return isSameDay(eventDate, selectedDate);
        case 'week':
          // En vista semana, mostrar eventos del día seleccionado (igual que en mes)
          return isSameDay(eventDate, selectedDate);
        case 'month':
          // En vista mes, mostrar eventos del día seleccionado
          return isSameDay(eventDate, selectedDate);
        default:
          return true;
      }
    });
    setFilteredEventos(filtered);
  }, [allEventos, viewMode, selectedDate]);

  // ✅ Resetear a fecha actual al cambiar a vista semana
  useEffect(() => {
    if (viewMode === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedDate(today);
    }
  }, [viewMode]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePrev = () => {
    switch (viewMode) {
      case 'day': setSelectedDate(subDays(selectedDate, 1)); break;
      case 'week': setSelectedDate(subWeeks(selectedDate, 1)); break;
      case 'month': setSelectedDate(subMonths(selectedDate, 1)); break;
      case 'year': setSelectedDate(new Date(selectedDate.getFullYear() - 1, 0, 1)); break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day': setSelectedDate(addDays(selectedDate, 1)); break;
      case 'week': setSelectedDate(addWeeks(selectedDate, 1)); break;
      case 'month': setSelectedDate(addMonths(selectedDate, 1)); break;
      case 'year': setSelectedDate(new Date(selectedDate.getFullYear() + 1, 0, 1)); break;
    }
  };

  const getDateLabel = () => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
      case 'week':
        const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
        return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy', { locale: es });
      case 'year':
        return format(selectedDate, 'yyyy', { locale: es });
      default:
        return '';
    }
  };

  // ✅ Crear evento manual
  const handleCreateEvent = async () => {
    if (!newEventForm.title.trim()) {
      Alert.alert('Error', 'El título del evento es obligatorio');
      return;
    }

    // Validar recurrencia
    if (newEventForm.recurrence.enabled && newEventForm.recurrence.frequency === 'none') {
      Alert.alert('Error', 'Selecciona una frecuencia para la recurrencia');
      return;
    }

    if (newEventForm.recurrence.enabled && !newEventForm.recurrence.endDate) {
      Alert.alert('Error', 'Selecciona una fecha de finalización para la recurrencia');
      return;
    }

    setCreatingEvent(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const eventData = {
        title: newEventForm.title.trim(),
        description: newEventForm.description.trim() || '',
        date: Timestamp.fromDate(newEventForm.date),
        allDay: newEventForm.allDay,
        priority: newEventForm.priority,
        type: 'custom',
        createdBy: userProfile?.uid || 'unknown',
        createdByName: userProfile?.name || userProfile?.displayName || 'Usuario',
        createdAt: Timestamp.now(),
        notifications: newEventForm.notifications,
        recurrence: newEventForm.recurrence.enabled ? {
          enabled: true,
          frequency: newEventForm.recurrence.frequency,
          endDate: Timestamp.fromDate(newEventForm.recurrence.endDate)
        } : { enabled: false }
      };

      await addDoc(collection(db, 'calendar_events'), eventData);

      // Resetear formulario
      setNewEventForm({
        title: '',
        description: '',
        date: new Date(),
        allDay: true,
        priority: 'medium',
        notifications: [
          { time: 10, unit: 'minutes', enabled: true }
        ],
        recurrence: {
          enabled: false,
          frequency: 'none',
          endDate: null
        }
      });

      setShowCreateModal(false);
      Alert.alert('¡Listo!', 'Evento creado exitosamente');
    } catch (error) {
      console.error('Error creando evento:', error);
      Alert.alert('Error', 'No se pudo crear el evento');
    } finally {
      setCreatingEvent(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceColors.background }} edges={['top', 'left', 'right']}>
      {/* Header Expresivo */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        {/* Header Top - Navigation Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            iconColor={surfaceColors.onSurface}
          />
          <IconButton
            icon="calendar-today"
            mode="contained-tonal"
            size={20}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedDate(new Date());
            }}
            iconColor={surfaceColors.primary}
            style={{
              backgroundColor: surfaceColors.primaryContainer,
            }}
          />
        </View>
        
        {/* Header Content - Title */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 57, // Display Small
            lineHeight: 64,
            fontWeight: '400', 
            color: surfaceColors.onSurface, 
            letterSpacing: -0.5,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }] // Google Look
          }}>
            Calendario
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: surfaceColors.onSurfaceVariant, 
            marginTop: 8,
            fontFamily: 'Roboto-Flex',
            letterSpacing: 0.15
          }}>
            Agenda y vencimientos
          </Text>
        </View>
      </View>

      {/* View Selector - SegmentedButtons */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => {
            Haptics.selectionAsync();
            setChangingView(true);
            // ✅ Delay para permitir que se muestre el loading
            setTimeout(() => {
              setViewMode(value);
              setTimeout(() => setChangingView(false), 100);
            }, 50);
          }}
          buttons={[
            { value: 'day', label: 'Día', icon: 'calendar-today' },
            { value: 'week', label: 'Semana', icon: 'calendar-week' },
            { value: 'month', label: 'Mes', icon: 'calendar-month' },
            { value: 'year', label: 'Año', icon: 'calendar' },
          ]}
          disabled={changingView}
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
        {changingView ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
            <ActivityIndicator size="large" color={surfaceColors.primary} />
            <Text style={{ color: surfaceColors.onSurfaceVariant, marginTop: 16, fontSize: 14 }}>
              Cargando vista...
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[surfaceColors.primary]}
                tintColor={surfaceColors.primary}
              />
            }
          >
            {/* Calendario Visual - Solo en vista Mes y Semana */}
            {viewMode === 'month' && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Calendar
                key={format(selectedDate, 'yyyy-MM')}
                current={format(selectedDate, 'yyyy-MM-dd')}
                hideArrows={true}
                hideExtraDays={false}
                disableMonthChange={true}
                renderHeader={() => null}
                markedDates={{
                  ...allEventos.reduce((acc, event) => {
                    // ✅ Validar que event.date sea válido
                    if (!event.date || !isValid(event.date)) return acc;
                    
                    const dateKey = format(event.date, 'yyyy-MM-dd');
                    
                    // Determinar color según tipo de evento
                    let dotColor = surfaceColors.primary; // Default
                    
                    if (event.type === 'commitment') {
                      dotColor = '#f44336'; // Rojo para compromisos
                    } else if (event.type === 'contract') {
                      dotColor = '#2196f3'; // Azul para contratos
                    } else if (event.type === 'custom') {
                      dotColor = '#4caf50'; // Verde para eventos personalizados
                    }
                    
                    if (!acc[dateKey]) {
                      acc[dateKey] = { dots: [] };
                    }
                    
                    // Evitar duplicados
                    if (!acc[dateKey].dots.some(d => d.color === dotColor)) {
                      acc[dateKey].dots.push({ color: dotColor });
                    }
                    
                    return acc;
                  }, {}),
                  ...holidays.reduce((acc, holiday) => {
                    const dateKey = holiday.date;
                    if (!acc[dateKey]) {
                      acc[dateKey] = { dots: [] };
                    }
                    
                    // Color según tipo de festivo
                    const holidayColor = holiday.type === 'civil' ? '#1976d2' : '#9c27b0';
                    
                    if (!acc[dateKey].dots.some(d => d.color === holidayColor)) {
                      acc[dateKey].dots.push({ color: holidayColor });
                    }
                    
                    return acc;
                  }, {}),
                  [format(selectedDate, 'yyyy-MM-dd')]: {
                    selected: true,
                    selectedColor: surfaceColors.primary,
                    dots: [
                      ...allEventos
                        .filter(e => isSameDay(e.date, selectedDate))
                        .map(e => {
                          let color = surfaceColors.primary;
                          if (e.type === 'commitment') color = '#f44336';
                          else if (e.type === 'contract') color = '#2196f3';
                          else if (e.type === 'custom') color = '#4caf50';
                          return { color: 'white' }; // Blanco cuando está seleccionado
                        })
                    ]
                  }
                }}
                markingType={'multi-dot'}
                dayComponent={({date, state, marking}) => {
                  // ✅ Crear fecha en zona local para evitar desfase UTC
                  const [year, month, day] = date.dateString.split('-').map(Number);
                  const dayDate = new Date(year, month - 1, day); // Mes es 0-indexed
                  const dayOfWeek = dayDate.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isHoliday = holidays.some(h => h.date === date.dateString);
                  const isNonWorkingDay = isWeekend || isHoliday;
                  const isSelected = marking?.selected;
                  
                  // ✅ Detectar eventos del sistema para este día
                  const daySystemEvents = allEventos.filter(e => 
                    format(e.date, 'yyyy-MM-dd') === date.dateString && e.type === 'system'
                  );
                  const hasColjuegos = daySystemEvents.some(e => e.title?.includes('Coljuegos'));
                  const hasUIAF = daySystemEvents.some(e => e.title?.includes('UIAF'));
                  const hasParafiscales = daySystemEvents.some(e => e.title?.includes('Parafiscales'));
                  
                  return (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        // ✅ Crear fecha en zona local para evitar desfase UTC
                        const [year, month, dayNum] = date.dateString.split('-').map(Number);
                        setSelectedDate(new Date(year, month - 1, dayNum));
                      }}
                      style={{
                        width: '100%',
                        height: 36,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 8,
                        backgroundColor: isSelected 
                          ? surfaceColors.primary
                          : 'transparent',
                        position: 'relative'
                      }}
                    >
                      {/* Patrón de rayas para festivos/weekends */}
                      {isNonWorkingDay && !isSelected && state !== 'disabled' && (
                        <View style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          borderRadius: 8,
                          opacity: 0.15,
                          backgroundColor: surfaceColors.primary
                        }} />
                      )}
                      
                      <Text style={{
                        fontFamily: 'Roboto-Flex',
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected 
                          ? 'white'
                          : state === 'disabled' 
                            ? surfaceColors.onSurfaceVariant
                            : state === 'today'
                              ? surfaceColors.primary
                              : surfaceColors.onSurface
                      }}>
                        {date.day}
                      </Text>
                      
                      {/* 🎰 Barra para Coljuegos */}
                      {hasColjuegos && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          backgroundColor: '#ff9800',
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8
                        }} />
                      )}
                      
                      {/* 👮 Barra para UIAF */}
                      {hasUIAF && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          backgroundColor: '#9c27b0',
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8
                        }} />
                      )}
                      
                      {/* 👥 Barra para Parafiscales */}
                      {hasParafiscales && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          backgroundColor: '#607d8b',
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8
                        }} />
                      )}
                      
                      {/* Marcadores de eventos (puntos) - Solo si no hay barra del sistema */}
                      {marking?.dots && marking.dots.length > 0 && !hasColjuegos && !hasUIAF && !hasParafiscales && (
                        <View style={{ 
                          flexDirection: 'row', 
                          gap: 2, 
                          position: 'absolute', 
                          bottom: 2 
                        }}>
                          {marking.dots.slice(0, 3).map((dot, index) => (
                            <View
                              key={index}
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: dot.color
                              }}
                            />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                }}
                theme={{
                  backgroundColor: 'transparent',
                  calendarBackground: surfaceColors.surface,
                  textSectionTitleColor: surfaceColors.onSurfaceVariant,
                  textDayFontFamily: 'Roboto-Flex',
                  textMonthFontFamily: 'Roboto-Flex',
                  textDayHeaderFontFamily: 'Roboto-Flex',
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 14,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 12
                }}
                style={{
                  borderRadius: 16,
                  backgroundColor: surfaceColors.surfaceContainerLow,
                  padding: 8,
                  elevation: 0,
                  shadowOpacity: 0
                }}
              />
            </View>
          )}

          {viewMode === 'week' && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <View style={{
                borderRadius: 16,
                backgroundColor: surfaceColors.surfaceContainerLow,
                padding: 16,
                elevation: 0,
                shadowOpacity: 0
              }}>
                {/* Header de la semana */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
                  {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((day, index) => (
                    <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{
                        fontFamily: 'Roboto-Flex',
                        fontSize: 12,
                        fontWeight: '500',
                        color: surfaceColors.onSurfaceVariant,
                        textTransform: 'uppercase'
                      }}>
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Días de la semana */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {Array.from({ length: 7 }).map((_, index) => {
                    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
                    const dayDate = addDays(weekStart, index);
                    const isSelected = isSameDay(dayDate, selectedDate);
                    const isToday = isSameDay(dayDate, new Date());
                    
                    // Verificar festivos y weekends
                    const dayOfWeek = dayDate.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const dateKey = format(dayDate, 'yyyy-MM-dd');
                    const isHoliday = holidays.some(h => h.date === dateKey);
                    const isNonWorkingDay = isWeekend || isHoliday;
                    
                    // Obtener eventos del día
                    const dayEvents = allEventos.filter(e => isSameDay(e.date, dayDate));
                    const dayHoliday = holidays.find(h => h.date === dateKey);
                    
                    // ✅ Detectar eventos del sistema
                    const daySystemEvents = dayEvents.filter(e => e.type === 'system');
                    const hasColjuegos = daySystemEvents.some(e => e.title?.includes('Coljuegos'));
                    const hasUIAF = daySystemEvents.some(e => e.title?.includes('UIAF'));
                    const hasParafiscales = daySystemEvents.some(e => e.title?.includes('Parafiscales'));
                    const hasSystemEvent = hasColjuegos || hasUIAF || hasParafiscales;
                    
                    // Calcular marcadores
                    const markers = [];
                    if (dayHoliday) {
                      markers.push({ color: dayHoliday.type === 'civil' ? '#1976d2' : '#9c27b0' });
                    }
                    dayEvents.forEach(e => {
                      let color = surfaceColors.primary;
                      if (e.type === 'commitment') color = '#f44336';
                      else if (e.type === 'contract') color = '#2196f3';
                      else if (e.type === 'custom') color = '#4caf50';
                      
                      if (!markers.some(m => m.color === color)) {
                        markers.push({ color });
                      }
                    });

                    return (
                      <Pressable
                        key={index}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedDate(dayDate);
                        }}
                        style={({ pressed }) => ({
                          flex: 1,
                          alignItems: 'center',
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: isSelected 
                            ? surfaceColors.primary 
                            : isNonWorkingDay
                              ? surfaceColors.surfaceContainerHigh + '40' // 25% opacidad
                              : pressed 
                                ? surfaceColors.surfaceContainerHigh 
                                : 'transparent',
                          position: 'relative'
                        })}
                      >
                        <Text style={{
                          fontFamily: 'Roboto-Flex',
                          fontSize: 18,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected 
                            ? 'white' 
                            : isToday 
                              ? surfaceColors.primary 
                              : surfaceColors.onSurface
                        }}>
                          {format(dayDate, 'd')}
                        </Text>
                        
                        {/* 🎰 Barra para Coljuegos */}
                        {hasColjuegos && (
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#ff9800',
                            borderBottomLeftRadius: 12,
                            borderBottomRightRadius: 12
                          }} />
                        )}
                        
                        {/* 👮 Barra para UIAF */}
                        {hasUIAF && (
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#9c27b0',
                            borderBottomLeftRadius: 12,
                            borderBottomRightRadius: 12
                          }} />
                        )}
                        
                        {/* 👥 Barra para Parafiscales */}
                        {hasParafiscales && (
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#607d8b',
                            borderBottomLeftRadius: 12,
                            borderBottomRightRadius: 12
                          }} />
                        )}
                        
                        {/* Marcadores de eventos (puntos) - Solo si no hay barra del sistema */}
                        {markers.length > 0 && !hasSystemEvent && (
                          <View style={{ 
                            flexDirection: 'row', 
                            gap: 2, 
                            marginTop: 4 
                          }}>
                            {markers.slice(0, 3).map((marker, i) => (
                              <View
                                key={i}
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: isSelected ? 'white' : marker.color
                                }}
                              />
                            ))}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Vista Anual - Cuadrícula de 12 meses */}
          {viewMode === 'year' && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                justifyContent: 'space-between',
                gap: 12
              }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthDate = new Date(selectedDate.getFullYear(), i, 1);
                  const daysInMonth = new Date(selectedDate.getFullYear(), i + 1, 0).getDate();
                  const firstDayOfMonth = new Date(selectedDate.getFullYear(), i, 1).getDay();
                  const monthHolidays = holidays.filter(h => {
                    // ✅ Parsing UTC-safe: dividir el string y usar componentes
                    const [year, month, day] = h.date.split('-').map(Number);
                    return month - 1 === i && year === selectedDate.getFullYear();
                  });
                  const monthEvents = allEventos.filter(e => {
                    const eventDate = new Date(e.date);
                    return eventDate.getMonth() === i && eventDate.getFullYear() === selectedDate.getFullYear();
                  });

                  return (
                    <View key={i} style={{ 
                      width: '31%', 
                      backgroundColor: surfaceColors.surfaceContainerLow,
                      borderRadius: 16,
                      padding: 8,
                      marginBottom: 8
                    }}>
                      {/* Nombre del mes */}
                      <Text style={{
                        fontFamily: 'Roboto-Flex',
                        fontSize: 12,
                        fontWeight: '600',
                        color: surfaceColors.onSurface,
                        textAlign: 'center',
                        marginBottom: 8,
                        textTransform: 'capitalize'
                      }}>
                        {format(monthDate, 'MMM', { locale: es })}
                      </Text>

                      {/* Días de la semana (iniciales) */}
                      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                          <Text key={idx} style={{
                            flex: 1,
                            fontFamily: 'Roboto-Flex',
                            fontSize: 9,
                            color: surfaceColors.onSurfaceVariant,
                            textAlign: 'center',
                            fontWeight: '500'
                          }}>
                            {day}
                          </Text>
                        ))}
                      </View>

                      {/* Días del mes */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {/* Espacios vacíos antes del primer día */}
                        {Array.from({ length: firstDayOfMonth }, (_, idx) => (
                          <View key={`empty-${idx}`} style={{ width: '14.28%', height: 18 }} />
                        ))}
                        
                        {/* Días del mes */}
                        {Array.from({ length: daysInMonth }, (_, day) => {
                          const dayNum = day + 1;
                          const dateStr = `${selectedDate.getFullYear()}-${String(i + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const dayDate = new Date(selectedDate.getFullYear(), i, dayNum);
                          const dayOfWeek = dayDate.getDay();
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          const isHoliday = monthHolidays.some(h => h.date === dateStr);
                          const hasEvent = monthEvents.some(e => format(e.date, 'yyyy-MM-dd') === dateStr);
                          const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                          
                          // ✅ Detectar eventos del sistema en este día específico
                          const dayEvents = monthEvents.filter(e => format(e.date, 'yyyy-MM-dd') === dateStr);
                          const hasColjuegosPago = dayEvents.some(e => e.type === 'system' && e.title?.includes('Coljuegos'));
                          const hasUIAF = dayEvents.some(e => e.type === 'system' && e.title?.includes('UIAF'));
                          const hasParafiscales = dayEvents.some(e => e.type === 'system' && e.title?.includes('Parafiscales'));

                          return (
                            <Pressable
                              key={dayNum}
                              onPress={() => {
                                Haptics.selectionAsync();
                                // Filtrar eventos del día seleccionado
                                const eventsOfDay = allEventos.filter(e => 
                                  format(e.date, 'yyyy-MM-dd') === dateStr
                                );
                                setSelectedDayDate(dayDate);
                                setSelectedDayEvents(eventsOfDay);
                                setDayEventsModalVisible(true);
                              }}
                              style={{
                                width: '14.28%',
                                height: 18,
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative'
                              }}
                            >
                              {/* Fondo para festivos/fines de semana */}
                              {(isWeekend || isHoliday) && (
                                <View style={{
                                  position: 'absolute',
                                  width: '100%',
                                  height: '100%',
                                  opacity: 0.15,
                                  backgroundColor: surfaceColors.primary,
                                  borderRadius: 2
                                }} />
                              )}
                              
                              {/* Indicador de hoy */}
                              {isToday && (
                                <View style={{
                                  position: 'absolute',
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: 2,
                                  borderWidth: 1,
                                  borderColor: surfaceColors.primary
                                }} />
                              )}

                              <Text style={{
                                fontFamily: 'Roboto-Flex',
                                fontSize: 8,
                                color: isToday 
                                  ? surfaceColors.primary
                                  : (isWeekend || isHoliday)
                                    ? surfaceColors.onSurfaceVariant
                                    : surfaceColors.onSurface,
                                fontWeight: isToday ? '600' : '400'
                              }}>
                                {dayNum}
                              </Text>

                              {/* 🎰 Barra inferior para Coljuegos (Naranja) */}
                              {hasColjuegosPago && (
                                <View style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: 2,
                                  backgroundColor: '#ff9800', // Naranja
                                  borderBottomLeftRadius: 2,
                                  borderBottomRightRadius: 2
                                }} />
                              )}
                              
                              {/* 👮 Barra inferior para UIAF (Morado) */}
                              {hasUIAF && (
                                <View style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: 2,
                                  backgroundColor: '#9c27b0', // Morado
                                  borderBottomLeftRadius: 2,
                                  borderBottomRightRadius: 2
                                }} />
                              )}
                              
                              {/* 👥 Barra inferior para Parafiscales (Azul grisáceo) */}
                              {hasParafiscales && (
                                <View style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: 2,
                                  backgroundColor: '#607d8b', // Azul grisáceo
                                  borderBottomLeftRadius: 2,
                                  borderBottomRightRadius: 2
                                }} />
                              )}

                              {/* Punto indicador de eventos (ocultar si hay barra del sistema) */}
                              {hasEvent && !hasColjuegosPago && !hasUIAF && !hasParafiscales && (
                                <View style={{
                                  position: 'absolute',
                                  bottom: 1,
                                  width: 2,
                                  height: 2,
                                  borderRadius: 1,
                                  backgroundColor: surfaceColors.primary
                                }} />
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Lista de Eventos del Día Seleccionado - Ocultar en vista anual */}
          {viewMode !== 'year' && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 100 }}>
              {filteredEventos.length > 0 ? (
              filteredEventos.map((item, index) => (
                <EventoItem 
                  key={item.id}
                  item={item} 
                  index={index} 
                  surfaceColors={surfaceColors} 
                  onPress={(event) => {
                    setSelectedEvent(event);
                    setModalVisible(true);
                  }}
                />
              ))
            ) : (
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
                  <Text style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, marginBottom: 24, textAlign: 'center' }}>
                    No hay eventos programados para este día
                  </Text>
                  <Pressable 
                    style={({ pressed }) => [{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 100,
                      backgroundColor: pressed ? surfaceColors.primary + '20' : surfaceColors.primaryContainer
                    }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setViewMode('month');
                    }}
                  >
                    <Text style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '600' }}>
                      Ver Mes Completo
                    </Text>
                  </Pressable>
                </View>
              )
            )}
            </View>
          )}
        </ScrollView>
        )}
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

      {/* ✅ Modal Crear Evento */}
      <Portal>
        <Modal 
          visible={showCreateModal} 
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={{
            backgroundColor: surfaceColors.background,
            margin: 20,
            borderRadius: 24,
            maxHeight: '90%'
          }}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ maxHeight: '100%' }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ padding: 24 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ 
                    fontFamily: 'Roboto-Flex', 
                    fontSize: 24, 
                    fontWeight: '500',
                    color: surfaceColors.onSurface,
                    fontVariationSettings: [{ axis: 'wdth', value: 110 }]
                  }}>
                    Nuevo Evento
                  </Text>
                  <IconButton 
                    icon="close" 
                    iconColor={surfaceColors.onSurfaceVariant}
                    onPress={() => setShowCreateModal(false)}
                  />
                </View>

                {/* Formulario */}
                <View style={{ gap: 20 }}>
                  {/* Título */}
                  <View>
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: '600',
                      color: surfaceColors.onSurfaceVariant,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 8
                    }}>
                      Título *
                    </Text>
                    <TextInput
                      value={newEventForm.title}
                      onChangeText={(text) => setNewEventForm(prev => ({ ...prev, title: text }))}
                      placeholder="Ej: Reunión con cliente"
                      placeholderTextColor={surfaceColors.onSurfaceVariant}
                      style={{
                        backgroundColor: surfaceColors.surfaceContainer,
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        color: surfaceColors.onSurface,
                        fontFamily: 'Roboto-Flex'
                      }}
                      maxLength={100}
                    />
                  </View>

                  {/* Descripción */}
                  <View>
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: '600',
                      color: surfaceColors.onSurfaceVariant,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 8
                    }}>
                      Descripción
                    </Text>
                    <TextInput
                      value={newEventForm.description}
                      onChangeText={(text) => setNewEventForm(prev => ({ ...prev, description: text }))}
                      placeholder="Detalles adicionales (opcional)"
                      placeholderTextColor={surfaceColors.onSurfaceVariant}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      style={{
                        backgroundColor: surfaceColors.surfaceContainer,
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 15,
                        color: surfaceColors.onSurface,
                        fontFamily: 'Roboto-Flex',
                        minHeight: 100
                      }}
                      maxLength={500}
                    />
                  </View>

                  {/* Fecha */}
                  <View>
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: '600',
                      color: surfaceColors.onSurfaceVariant,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 8
                    }}>
                      Fecha
                    </Text>
                    <View style={{
                      backgroundColor: surfaceColors.surfaceContainer,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <MaterialCommunityIcons name="calendar" size={24} color={surfaceColors.primary} />
                        <Text style={{ fontSize: 16, color: surfaceColors.onSurface, fontWeight: '500' }}>
                          {format(newEventForm.date, "d 'de' MMMM, yyyy", { locale: es })}
                        </Text>
                      </View>
                      <IconButton 
                        icon="calendar-edit" 
                        iconColor={surfaceColors.primary}
                        size={20}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowDatePicker(true);
                        }}
                      />
                      {showDatePicker && (
                        <DateTimePicker
                          value={newEventForm.date}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) {
                              setNewEventForm(prev => ({ ...prev, date: selectedDate }));
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                          }}
                          minimumDate={new Date()}
                        />
                      )}
                    </View>
                  </View>

                  {/* Prioridad */}
                  <View>
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: '600',
                      color: surfaceColors.onSurfaceVariant,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 8
                    }}>
                      Prioridad
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[
                        { value: 'low', label: 'Baja', icon: 'alert-circle-outline', color: surfaceColors.tertiary },
                        { value: 'medium', label: 'Media', icon: 'alert', color: surfaceColors.secondary },
                        { value: 'high', label: 'Alta', icon: 'alert-octagon', color: surfaceColors.error }
                      ].map((priority) => (
                        <Pressable
                          key={priority.value}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setNewEventForm(prev => ({ ...prev, priority: priority.value }));
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: newEventForm.priority === priority.value 
                              ? surfaceColors.secondaryContainer 
                              : surfaceColors.surfaceContainer,
                            borderRadius: 12,
                            padding: 12,
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: newEventForm.priority === priority.value 
                              ? priority.color 
                              : 'transparent'
                          }}
                        >
                          <MaterialCommunityIcons 
                            name={priority.icon} 
                            size={24} 
                            color={newEventForm.priority === priority.value 
                              ? priority.color 
                              : surfaceColors.onSurfaceVariant
                            } 
                          />
                          <Text style={{ 
                            fontSize: 12, 
                            fontWeight: '600',
                            color: newEventForm.priority === priority.value 
                              ? surfaceColors.onSecondaryContainer 
                              : surfaceColors.onSurfaceVariant,
                            marginTop: 4
                          }}>
                            {priority.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Notificaciones */}
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '600',
                        color: surfaceColors.onSurfaceVariant,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Alertas
                      </Text>
                      <Text style={{ 
                        fontSize: 12, 
                        color: surfaceColors.primary,
                        fontWeight: '600'
                      }}>
                        {newEventForm.notifications.filter(n => n.enabled).length}
                      </Text>
                    </View>
                    <View style={{ gap: 8 }}>
                      {[
                        { time: 0, unit: 'minutes', label: 'A la hora del evento', icon: 'bell-ring' },
                        { time: 10, unit: 'minutes', label: '10 minutos antes', icon: 'clock-fast' },
                        { time: 1, unit: 'hours', label: '1 hora antes', icon: 'clock-alert-outline' },
                        { time: 1, unit: 'days', label: '1 día antes', icon: 'calendar-today' }
                      ].map((notif, index) => {
                        const isActive = newEventForm.notifications.some(
                          n => n.time === notif.time && n.unit === notif.unit && n.enabled
                        );
                        
                        return (
                          <Pressable
                            key={`${notif.time}-${notif.unit}`}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setNewEventForm(prev => {
                                const existingIndex = prev.notifications.findIndex(
                                  n => n.time === notif.time && n.unit === notif.unit
                                );
                                
                                let newNotifications;
                                if (existingIndex >= 0) {
                                  // Toggle existing
                                  newNotifications = [...prev.notifications];
                                  newNotifications[existingIndex] = {
                                    ...newNotifications[existingIndex],
                                    enabled: !newNotifications[existingIndex].enabled
                                  };
                                } else {
                                  // Add new
                                  newNotifications = [...prev.notifications, { ...notif, enabled: true }];
                                }
                                
                                return { ...prev, notifications: newNotifications };
                              });
                            }}
                            style={{
                              backgroundColor: surfaceColors.surfaceContainer,
                              borderRadius: 12,
                              padding: 14,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderWidth: 2,
                              borderColor: isActive ? surfaceColors.primary : 'transparent'
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <MaterialCommunityIcons 
                                name={notif.icon} 
                                size={22} 
                                color={isActive ? surfaceColors.primary : surfaceColors.onSurfaceVariant} 
                              />
                              <Text style={{ 
                                fontSize: 15, 
                                color: isActive ? surfaceColors.onSurface : surfaceColors.onSurfaceVariant,
                                fontWeight: isActive ? '600' : '400'
                              }}>
                                {notif.label}
                              </Text>
                            </View>
                            <View style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: isActive ? surfaceColors.primary : surfaceColors.outline,
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              {isActive && (
                                <MaterialCommunityIcons 
                                  name="check" 
                                  size={16} 
                                  color={surfaceColors.onPrimary} 
                                />
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                      
                      {/* Botón agregar alerta personalizada */}
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          Alert.alert(
                            'Alerta personalizada',
                            'Próximamente podrás configurar alertas con tiempos personalizados',
                            [{ text: 'OK' }]
                          );
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          borderRadius: 12,
                          padding: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          borderWidth: 2,
                          borderColor: surfaceColors.outline,
                          borderStyle: 'dashed'
                        }}
                      >
                        <MaterialCommunityIcons 
                          name="plus-circle-outline" 
                          size={22} 
                          color={surfaceColors.primary} 
                        />
                        <Text style={{ 
                          fontSize: 15, 
                          color: surfaceColors.primary,
                          fontWeight: '600'
                        }}>
                          Agregar alerta personalizada
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Recurrencia */}
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '600',
                        color: surfaceColors.onSurfaceVariant,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Repetir evento
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setNewEventForm(prev => ({
                            ...prev,
                            recurrence: {
                              ...prev.recurrence,
                              enabled: !prev.recurrence.enabled
                            }
                          }));
                        }}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: newEventForm.recurrence.enabled 
                            ? surfaceColors.primary 
                            : surfaceColors.outline,
                          justifyContent: 'center',
                          paddingHorizontal: 2
                        }}
                      >
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: surfaceColors.onPrimary,
                          alignSelf: newEventForm.recurrence.enabled ? 'flex-end' : 'flex-start'
                        }} />
                      </Pressable>
                    </View>

                    {newEventForm.recurrence.enabled && (
                      <View style={{ gap: 12 }}>
                        {/* Frecuencia */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {[
                            { value: 'daily', label: 'Diario', icon: 'calendar-today' },
                            { value: 'weekly', label: 'Semanal', icon: 'calendar-week' },
                            { value: 'monthly', label: 'Mensual', icon: 'calendar-month' },
                            { value: 'yearly', label: 'Anual', icon: 'calendar' }
                          ].map((freq) => (
                            <Pressable
                              key={freq.value}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setNewEventForm(prev => ({
                                  ...prev,
                                  recurrence: {
                                    ...prev.recurrence,
                                    frequency: freq.value
                                  }
                                }));
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: newEventForm.recurrence.frequency === freq.value 
                                  ? surfaceColors.primaryContainer 
                                  : surfaceColors.surfaceContainer,
                                borderRadius: 12,
                                padding: 10,
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: newEventForm.recurrence.frequency === freq.value 
                                  ? surfaceColors.primary 
                                  : 'transparent'
                              }}
                            >
                              <MaterialCommunityIcons 
                                name={freq.icon} 
                                size={20} 
                                color={newEventForm.recurrence.frequency === freq.value 
                                  ? surfaceColors.primary 
                                  : surfaceColors.onSurfaceVariant
                                } 
                              />
                              <Text style={{ 
                                fontSize: 11, 
                                fontWeight: '600',
                                color: newEventForm.recurrence.frequency === freq.value 
                                  ? surfaceColors.onPrimaryContainer 
                                  : surfaceColors.onSurfaceVariant,
                                marginTop: 4,
                                textAlign: 'center'
                              }}>
                                {freq.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>

                        {/* Fecha de finalización */}
                        <View>
                          <Text style={{ 
                            fontSize: 12, 
                            fontWeight: '600',
                            color: surfaceColors.onSurfaceVariant,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 8
                          }}>
                            Finaliza el
                          </Text>
                          <View style={{
                            backgroundColor: surfaceColors.surfaceContainer,
                            borderRadius: 12,
                            padding: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <MaterialCommunityIcons name="calendar-remove" size={22} color={surfaceColors.error} />
                              <Text style={{ 
                                fontSize: 15, 
                                color: newEventForm.recurrence.endDate 
                                  ? surfaceColors.onSurface 
                                  : surfaceColors.onSurfaceVariant,
                                fontWeight: newEventForm.recurrence.endDate ? '500' : '400'
                              }}>
                                {newEventForm.recurrence.endDate 
                                  ? format(newEventForm.recurrence.endDate, "d 'de' MMMM, yyyy", { locale: es })
                                  : 'Seleccionar fecha'
                                }
                              </Text>
                            </View>
                            <IconButton 
                              icon="calendar-edit" 
                              iconColor={surfaceColors.primary}
                              size={20}
                              onPress={() => {
                                Haptics.selectionAsync();
                                // Por ahora usar fecha 30 días después como placeholder
                                const endDate = new Date(newEventForm.date);
                                endDate.setDate(endDate.getDate() + 30);
                                setNewEventForm(prev => ({
                                  ...prev,
                                  recurrence: {
                                    ...prev.recurrence,
                                    endDate: endDate
                                  }
                                }));
                                Alert.alert('Info', 'Fecha establecida a 30 días desde el evento');
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* Botones */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
                  <Button 
                    mode="outlined" 
                    onPress={() => setShowCreateModal(false)}
                    style={{ flex: 1 }}
                    textColor={surfaceColors.onSurfaceVariant}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handleCreateEvent}
                    loading={creatingEvent}
                    disabled={creatingEvent || !newEventForm.title.trim()}
                    style={{ flex: 1 }}
                    buttonColor={surfaceColors.primary}
                    textColor={surfaceColors.onPrimary}
                    icon="check"
                  >
                    Crear
                  </Button>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      {/* Modal de Eventos del Día (Vista Anual) */}
      <Portal>
        <Modal
          visible={dayEventsModalVisible}
          onDismiss={() => setDayEventsModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: surfaceColors.surfaceContainerHigh,
            margin: 20,
            borderRadius: 24,
            maxHeight: '70%'
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{ 
              padding: 24, 
              borderBottomWidth: 1, 
              borderBottomColor: `${surfaceColors.outline}30`,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'Roboto-Flex',
                  fontSize: 20,
                  fontWeight: '600',
                  color: surfaceColors.onSurface,
                  fontVariationSettings: [{ axis: 'wdth', value: 110 }],
                  textTransform: 'capitalize'
                }}>
                  {selectedDayDate && format(selectedDayDate, "EEEE d 'de' MMMM", { locale: es })}
                </Text>
                <Text style={{
                  fontFamily: 'Roboto-Flex',
                  fontSize: 14,
                  color: surfaceColors.onSurfaceVariant,
                  marginTop: 4
                }}>
                  {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'evento' : 'eventos'}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={24}
                iconColor={surfaceColors.onSurface}
                onPress={() => setDayEventsModalVisible(false)}
              />
            </View>

            {/* Lista de eventos */}
            <View style={{ padding: 16 }}>
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event, index) => (
                  <Pressable
                    key={event.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedEvent(event);
                      setDayEventsModalVisible(false);
                      setModalVisible(true);
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: pressed 
                        ? surfaceColors.surfaceContainer 
                        : surfaceColors.surfaceContainerLow,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: index < selectedDayEvents.length - 1 ? 12 : 0,
                      borderLeftWidth: 4,
                      borderLeftColor: 
                        event.type === 'commitment' ? '#f44336' :
                        event.type === 'contract' ? '#2196f3' :
                        '#4caf50'
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 
                          event.type === 'commitment' ? '#f4433615' :
                          event.type === 'contract' ? '#2196f315' :
                          '#4caf5015',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <MaterialCommunityIcons
                          name={
                            event.type === 'commitment' ? 'file-document' :
                            event.type === 'contract' ? 'handshake' :
                            'calendar-star'
                          }
                          size={22}
                          color={
                            event.type === 'commitment' ? '#f44336' :
                            event.type === 'contract' ? '#2196f3' :
                            '#4caf50'
                          }
                        />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontFamily: 'Roboto-Flex',
                          fontSize: 16,
                          fontWeight: '600',
                          color: surfaceColors.onSurface,
                          marginBottom: 4
                        }}>
                          {event.title}
                        </Text>
                        
                        {event.description && (
                          <Text 
                            style={{
                              fontSize: 14,
                              color: surfaceColors.onSurfaceVariant,
                              marginBottom: 8
                            }}
                            numberOfLines={2}
                          >
                            {event.description}
                          </Text>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: surfaceColors.surfaceContainer
                          }}>
                            <Text style={{
                              fontSize: 11,
                              color: surfaceColors.onSurfaceVariant,
                              textTransform: 'uppercase',
                              fontWeight: '600'
                            }}>
                              {event.type === 'commitment' ? 'Compromiso' :
                               event.type === 'contract' ? 'Contrato' :
                               'Personal'}
                            </Text>
                          </View>

                          {event.priority && (
                            <View style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 8,
                              backgroundColor: 
                                event.priority === 'high' ? '#f4433615' :
                                event.priority === 'medium' ? '#ff980015' :
                                '#4caf5015'
                            }}>
                              <Text style={{
                                fontSize: 11,
                                color: 
                                  event.priority === 'high' ? '#f44336' :
                                  event.priority === 'medium' ? '#ff9800' :
                                  '#4caf50',
                                textTransform: 'uppercase',
                                fontWeight: '600'
                              }}>
                                {event.priority === 'high' ? '🔴 Alta' :
                                 event.priority === 'medium' ? '🟡 Media' :
                                 '🟢 Baja'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={surfaceColors.onSurfaceVariant}
                      />
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: surfaceColors.surfaceContainer,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <MaterialCommunityIcons
                      name="calendar-blank"
                      size={40}
                      color={surfaceColors.onSurfaceVariant}
                    />
                  </View>
                  <Text style={{
                    fontFamily: 'Roboto-Flex',
                    fontSize: 16,
                    color: surfaceColors.onSurfaceVariant,
                    textAlign: 'center'
                  }}>
                    No hay eventos programados
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* ✅ FAB Crear Evento */}
      <FAB
        icon="plus"
        label="Evento"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          backgroundColor: surfaceColors.primary,
          borderRadius: 16
        }}
        color={surfaceColors.onPrimary}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCreateModal(true);
        }}
      />
    </SafeAreaView>
  );
}
