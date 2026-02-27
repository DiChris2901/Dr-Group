import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  BreakfastDining as BreakIcon,
  LunchDining as LunchIcon,
  ExitToApp as ExitIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  LocationOn as LocationOnIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  DevicesOther as DevicesIcon,
  OpenInNew as OpenInNewIcon,
  GpsFixed as GpsFixedIcon,
  GpsOff as GpsOffIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  SignalCellularAlt as SignalIcon,
  LinearScale as LinearScaleIcon,
  PersonOff as PersonOffIcon,
  FreeBreakfast as CoffeeIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PhoneAndroid as PhoneAndroidIcon,
  AccessTimeFilled as AccessTimeFilledIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { exportarAsistenciasExcel } from '../utils/asistenciasExcelExport';
import PageSkeleton from '../components/common/PageSkeleton';

const AsistenciasPage = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ False inicial (no carga hasta aplicar filtros)
  const [error, setError] = useState(null);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ✅ Filtros Avanzados
  const [filterPeriodo, setFilterPeriodo] = useState('hoy'); // 'hoy', 'ayer', '7dias', '30dias', 'mes_actual', 'personalizado'
  const [filterEmpleado, setFilterEmpleado] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all'); // all, trabajando, break, almuerzo, finalizado
  const [filterUbicacion, setFilterUbicacion] = useState('all'); // all, oficina, remoto
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [searchText, setSearchText] = useState('');
  
  // Control de query activa
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [activeListener, setActiveListener] = useState(null);
  const activeListenerRef = useRef(null); // ✅ Ref para cleanup seguro al desmontar
  const [hasMoreData, setHasMoreData] = useState(false); // ✅ Warning si hay +100 registros
  const initialLoadDone = useRef(false); // ✅ Control de auto-carga inicial
  
  // Exportando Excel
  const [exporting, setExporting] = useState(false);
  
  // Fila expandible
  const [expandedRow, setExpandedRow] = useState(null);
  
  // ✅ KPI en tiempo real del día (independiente de filtros)
  const [todayAsistencias, setTodayAsistencias] = useState([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [kpiModal, setKpiModal] = useState(null); // null | 'active' | 'absent' | 'all' | 'break' | 'lunch' | 'finished'
  const [expandedKpiEmployee, setExpandedKpiEmployee] = useState(null); // uid del empleado expandido en modal
  const todayListenerRef2 = useRef(null);
  
  // Lista de empleados para dropdown
  const [empleadosList, setEmpleadosList] = useState([]);
  
  // ✅ Datos de la APP: Configuración laboral y novedades
  const [workSchedule, setWorkSchedule] = useState(null); // settings/work_schedule
  const [officeLocation, setOfficeLocation] = useState(null); // settings/location
  const [novedadesMap, setNovedadesMap] = useState({}); // {uid_fecha: [novedades]}

  // ✅ Usar hook centralizado de permisos
  const { hasPermission } = usePermissions();
  const canViewAsistencias = hasPermission('asistencias');

  // ✅ Cargar lista de empleados para filtro (solo nombres, no asistencias)
  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        const empleados = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            uid: doc.id,
            nombre: d.name || d.displayName || d.email,
            email: d.email,
            photoURL: d.photoURL || null,
            position: d.position || null,
            department: d.department || null,
            phone: d.phone || null,
            appRole: d.appRole || d.role || null
          };
        });
        setEmpleadosList(empleados);
      } catch (err) {
        console.error('Error cargando empleados:', err);
      }
    };
    
    if (canViewAsistencias) {
      fetchEmpleados();
    }
  }, [canViewAsistencias]);

  // ✅ Cargar configuración laboral desde la APP (settings/work_schedule + settings/location)
  useEffect(() => {
    const fetchWorkSettings = async () => {
      try {
        const [scheduleSnap, locationSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'work_schedule')),
          getDoc(doc(db, 'settings', 'location'))
        ]);
        if (scheduleSnap.exists()) setWorkSchedule(scheduleSnap.data());
        if (locationSnap.exists()) setOfficeLocation(locationSnap.data());
      } catch (err) {
        // Silencioso - son datos complementarios
      }
    };
    if (canViewAsistencias) fetchWorkSettings();
  }, [canViewAsistencias]);

  // ✅ Real-time listener para KPIs del día (independiente de filtros de tabla)
  useEffect(() => {
    if (!canViewAsistencias) return;
    
    setTodayLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'asistencias'),
      where('fecha', '==', today),
      limit(200)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toDate = (v) => { if (!v) return null; if (v.toDate) return v.toDate(); return new Date(v); };
      const data = snapshot.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          uid: raw.uid,
          estadoActual: raw.estadoActual,
          entrada: raw.entrada ? { hora: toDate(raw.entrada.hora) } : null,
          breaks: raw.breaks || [],
          almuerzo: raw.almuerzo || null,
          salida: raw.salida ? { hora: toDate(raw.salida.hora) } : null,
          horasTrabajadas: raw.horasTrabajadas
        };
      });
      setTodayAsistencias(data);
      setTodayLoading(false);
    }, (err) => {
      console.error('Error en listener KPI tiempo real:', err);
      setTodayLoading(false);
    });
    
    todayListenerRef2.current = unsubscribe;
    return () => { if (todayListenerRef2.current) { todayListenerRef2.current(); todayListenerRef2.current = null; } };
  }, [canViewAsistencias]);

  // ✅ Empleados del día con estado (cross-reference asistencias + lista de usuarios)
  const todayEmployees = useMemo(() => {
    if (empleadosList.length === 0) return [];
    
    const attendanceMap = {};
    todayAsistencias.forEach(a => { attendanceMap[a.uid] = a; });
    
    return empleadosList
      .filter(emp => !['ADMIN', 'SUPERADMIN'].includes((emp.appRole || '').toUpperCase()))
      .map(emp => {
        const att = attendanceMap[emp.uid];
        return {
          ...emp,
          status: att?.estadoActual || 'ausente',
          attendance: att || null
        };
      })
      .sort((a, b) => {
        const order = { trabajando: 1, break: 2, almuerzo: 3, finalizado: 4, ausente: 5 };
        return (order[a.status] || 99) - (order[b.status] || 99);
      });
  }, [empleadosList, todayAsistencias]);

  // ✅ Estadísticas del día en tiempo real
  const todayStats = useMemo(() => ({
    total: todayEmployees.length,
    active: todayEmployees.filter(e => e.status === 'trabajando').length,
    absent: todayEmployees.filter(e => e.status === 'ausente').length,
    break: todayEmployees.filter(e => e.status === 'break').length,
    lunch: todayEmployees.filter(e => e.status === 'almuerzo').length,
    finished: todayEmployees.filter(e => e.status === 'finalizado').length,
  }), [todayEmployees]);

  // ✅ Empleados filtrados para modal KPI
  const kpiModalEmployees = useMemo(() => {
    if (!kpiModal) return [];
    const statusMap = { active: 'trabajando', absent: 'ausente', break: 'break', lunch: 'almuerzo', finished: 'finalizado' };
    if (kpiModal === 'all') return todayEmployees;
    return todayEmployees.filter(e => e.status === statusMap[kpiModal]);
  }, [kpiModal, todayEmployees]);

  // ✅ Configuración visual del modal KPI
  const kpiModalConfig = useMemo(() => {
    const configs = {
      active:   { title: 'Personal Activo',      icon: <AccessTimeIcon />,   color: theme.palette.primary.main },
      absent:   { title: 'Personal Ausente',      icon: <PersonOffIcon />,    color: theme.palette.error.main },
      all:      { title: 'Todos los Empleados',   icon: <GroupsIcon />,       color: theme.palette.text.primary },
      break:    { title: 'Personal en Break',     icon: <CoffeeIcon />,       color: theme.palette.info.main },
      lunch:    { title: 'Personal en Almuerzo',  icon: <LunchIcon />,        color: theme.palette.warning.main },
      finished: { title: 'Jornada Finalizada',    icon: <CheckCircleIcon />,  color: theme.palette.text.secondary },
    };
    return configs[kpiModal] || configs.all;
  }, [kpiModal, theme]);

  // ✅ Helper: Calcular puntualidad comparando hora de entrada vs horario configurado
  const getPuntualidadInfo = useCallback((entradaHora) => {
    if (!entradaHora || !workSchedule?.startTime) return null;
    
    const [schedH, schedM] = workSchedule.startTime.split(':').map(Number);
    const gracePeriod = workSchedule.gracePeriod || 0;
    
    // Hora límite = horario + gracia
    const limiteMinutos = schedH * 60 + schedM + gracePeriod;
    const entradaMinutos = entradaHora.getHours() * 60 + entradaHora.getMinutes();
    
    const diffMin = entradaMinutos - limiteMinutos;
    
    if (diffMin <= 0) {
      return { tipo: 'puntual', label: 'Puntual', color: 'success', minutos: 0 };
    } else {
      const horas = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      const tardeLabel = horas > 0 ? `Tarde (+${horas}h ${mins}min)` : `Tarde (+${mins} min)`;
      return { tipo: 'tarde', label: tardeLabel, color: 'error', minutos: diffMin };
    }
  }, [workSchedule]);

  // ✅ Función para aplicar filtros y cargar datos de Firestore
  const handleApplyFilters = async () => {
    if (!canViewAsistencias) {
      setError('No tienes permisos para ver asistencias');
      return;
    }

    // Si no hay período seleccionado, establecer '7dias' por defecto
    const periodoFinal = filterPeriodo || '7dias';
    if (!filterPeriodo) {
      setFilterPeriodo('7dias'); // Actualizar el Select visualmente
    }

    // Limpiar listener anterior si existe
    if (activeListener) {
      activeListener();
      setActiveListener(null);
    }

    setLoading(true);
    setError(null);
    
    try {
      // ✅ Calcular rango de fechas según período seleccionado
      // Si no hay período, usar últimos 7 días por defecto
      let startDate = null;
      let endDate = null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const periodoActual = filterPeriodo || '7dias'; // Default a 7 días
      
      switch (periodoActual) {
        case 'hoy':
          startDate = format(today, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'ayer':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = format(yesterday, 'yyyy-MM-dd');
          endDate = format(yesterday, 'yyyy-MM-dd');
          break;
        case '7dias':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case '30dias':
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'mes_actual':
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = format(firstDay, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'personalizado':
          if (!filterDateStart || !filterDateEnd) {
            showToast('Por favor selecciona un rango de fechas', 'warning');
            setLoading(false);
            return;
          }
          startDate = filterDateStart;
          endDate = filterDateEnd;
          break;
        default:
          showToast('Por favor selecciona un período', 'warning');
          setLoading(false);
          return;
      }
      
      // ✅ Construir query específica de Firestore con LÍMITE DE 100
      let q;
      
      if (filterEmpleado !== 'all') {
        // Query con filtro de empleado + rango de fechas + LÍMITE
        q = query(
          collection(db, 'asistencias'),
          where('uid', '==', filterEmpleado),
          where('fecha', '>=', startDate),
          where('fecha', '<=', endDate),
          orderBy('fecha', 'desc'),
          limit(101) // ✅ Traer 101 para detectar si hay más
        );
      } else {
        // Query solo con rango de fechas + LÍMITE
        q = query(
          collection(db, 'asistencias'),
          where('fecha', '>=', startDate),
          where('fecha', '<=', endDate),
          orderBy('fecha', 'desc'),
          limit(101) // ✅ Traer 101 para detectar si hay más
        );
      }
      


      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const asistenciasData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // ✅ Helper para convertir Timestamp o ISO string a Date
            const toDate = (value) => {
              if (!value) return null;
              if (value.toDate) return value.toDate(); // Firestore Timestamp
              return new Date(value); // ISO string
            };

            // ✅ Formato de APP MÓVIL: UN documento con entrada/breaks/almuerzo/salida
            // ✅ Cross-reference: Si empleadoNombre está vacío, buscar en lista de usuarios
            const uid = data.uid || data.empleadoId;
            let nombre = data.empleadoNombre;
            if (!nombre || nombre === 'undefined') {
              const empleadoMatch = empleadosList.find(e => e.uid === uid);
              nombre = empleadoMatch?.nombre || data.empleadoEmail || 'Sin nombre';
            }

            asistenciasData.push({
              id: doc.id,
              uid: uid,
              empleadoEmail: data.empleadoEmail,
              empleadoNombre: nombre,
              fecha: data.fecha,
              entrada: {
                hora: toDate(data.entrada?.hora),
                ubicacion: data.entrada?.ubicacion || null, // ✅ Ubicación GPS
                dispositivo: data.entrada?.dispositivo || null, // ✅ Dispositivo móvil
                // ✅ Datos extra de la APP para seguridad y control
                locationProvider: data.entrada?.locationProvider || null,
                locationAccuracy: data.entrada?.locationAccuracy || null,
                locationIsMocked: data.entrada?.locationIsMocked || false,
                locationObtainedAt: data.entrada?.locationObtainedAt || null
              },
              breaks: (data.breaks || []).map(br => ({
                inicio: toDate(br.inicio),
                fin: toDate(br.fin),
                duracion: br.duracion
              })),
              almuerzo: data.almuerzo || null,
              almuerzoInicio: toDate(data.almuerzo?.inicio),
              almuerzoFin: toDate(data.almuerzo?.fin),
              almuerzoDuracion: data.almuerzo?.duracion || null,
              salida: data.salida ? {
                hora: toDate(data.salida.hora),
                ubicacion: data.salida.ubicacion || null // ✅ Preservar ubicación con tipo (Remoto/Oficina)
              } : null,
              estadoActual: data.estadoActual,
              horasTrabajadas: data.horasTrabajadas || null,
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt)
            });
          });
          
          // ✅ Detectar si hay más de 100 registros
          if (asistenciasData.length > 100) {
            setHasMoreData(true);
            asistenciasData.pop(); // Eliminar el registro 101
          } else {
            setHasMoreData(false);
          }
          
          // ✅ Aplicar filtros de estado y ubicación (client-side)
          let filteredData = asistenciasData;
          
          // Filtro por estado
          if (filterEstado !== 'all') {
            filteredData = filteredData.filter(a => 
              (a.estadoActual || '').toLowerCase() === filterEstado.toLowerCase()
            );
          }
          
          // Filtro por ubicación
          if (filterUbicacion !== 'all') {
            filteredData = filteredData.filter(a => {
              const ubicacionSalida = a.salida?.ubicacion || {};
              const tipo = ubicacionSalida.tipo || '';
              
              if (filterUbicacion === 'oficina') {
                return tipo.toLowerCase() === 'oficina';
              } else if (filterUbicacion === 'remoto') {
                return tipo.toLowerCase() === 'remoto';
              }
              return true;
            });
          }
          
          setAsistencias(filteredData);
          setHasAppliedFilters(true);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error en listener de asistencias:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      activeListenerRef.current = unsubscribe;
      setActiveListener(() => unsubscribe);
      
      // ✅ Cargar novedades del mismo rango de fechas (lectura de datos de la APP)
      try {
        const novedadesQuery = query(
          collection(db, 'novedades'),
          where('date', '>=', new Date(startDate + 'T00:00:00')),
          where('date', '<=', new Date(endDate + 'T23:59:59')),
          orderBy('date', 'desc')
        );
        const novedadesSnap = await getDocs(novedadesQuery);
        const novedadesData = {};
        novedadesSnap.forEach((d) => {
          const nData = d.data();
          const nDate = nData.date?.toDate ? nData.date.toDate() : new Date(nData.date);
          const fechaKey = format(nDate, 'yyyy-MM-dd');
          const key = `${nData.uid}_${fechaKey}`;
          if (!novedadesData[key]) novedadesData[key] = [];
          novedadesData[key].push({
            id: d.id,
            type: nData.type,
            description: nData.description,
            status: nData.status,
            hasAttachment: !!nData.attachmentUrl,
            userName: nData.userName
          });
        });
        setNovedadesMap(novedadesData);
      } catch (novedadesErr) {
        // Silencioso - novedades son datos complementarios
      }
    } catch (err) {
      console.error('❌ Error configurando listener:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ✅ Función para limpiar filtros y volver a estado inicial
  const handleClearFilters = () => {
    // Detener listener activo
    if (activeListener) {
      activeListener();
      setActiveListener(null);
    }
    
    // Reset estados
    setFilterPeriodo('hoy'); // Mantener valor por defecto
    setFilterEmpleado('all');
    setFilterEstado('all');
    setFilterUbicacion('all');
    setFilterDateStart('');
    setFilterDateEnd('');
    setSearchText('');
    setAsistencias([]);
    setHasAppliedFilters(false);
    setHasMoreData(false);
    setPage(0);
    
    showToast('Filtros limpiados', 'info');
  };

  // ✅ Cleanup del listener al desmontar el componente
  useEffect(() => {
    return () => {
      if (activeListenerRef.current) {
        activeListenerRef.current();
        activeListenerRef.current = null;
      }
    };
  }, []);

  // ✅ Auto-carga inicial con filtro "Hoy" al montar
  useEffect(() => {
    if (canViewAsistencias && empleadosList.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      handleApplyFilters();
    }
  }, [canViewAsistencias, empleadosList]);

  // ✅ Reset de página si no hay datos
  useEffect(() => {
    if (asistencias.length === 0 && page > 0) {
      setPage(0);
    }
  }, [asistencias.length, page]);

  // ✅ PROCESAMIENTO DE ASISTENCIAS (ya vienen agrupadas de la app móvil)
  const asistenciasAgrupadas = useMemo(() => {
    return asistencias.map(asistencia => {
      let horasTrabajadas = asistencia.horasTrabajadas;
      
      // 🔄 SIEMPRE recalcular desde timestamps si existen entrada y salida
      if (asistencia.entrada?.hora && asistencia.salida?.hora) {
        // Tiempo total: salida - entrada
        const diffMs = asistencia.salida.hora.getTime() - asistencia.entrada.hora.getTime();
        
        // Calcular tiempo de descansos (breaks + almuerzo) en milisegundos
        let tiempoDescansoMs = 0;
        

        
        // Sumar breaks
        if (asistencia.breaks && Array.isArray(asistencia.breaks)) {
          asistencia.breaks.forEach(b => {
            let breakMs = 0;
            
            // Si duracion es 0 o null, calcular desde timestamps
            if (!b.duracion || b.duracion === 0) {
              if (b.inicio && b.fin) {
                const inicio = new Date(b.inicio);
                const fin = new Date(b.fin);
                breakMs = fin - inicio;
              }
            }
            // Si es string HH:MM:SS
            else if (typeof b.duracion === 'string' && b.duracion.includes(':')) {
              const [h, m, s] = b.duracion.split(':').map(Number);
              breakMs = (h * 60 * 60 + m * 60 + s) * 1000;
            }
            // Si es número (minutos legacy)
            else if (typeof b.duracion === 'number' && b.duracion > 0) {
              breakMs = b.duracion * 60 * 1000;
            }
            
            tiempoDescansoMs += breakMs;
          });
        }
        
        // Sumar almuerzo
        let almuerzoMs = 0;
        
        // Si duracion es 0 o null, calcular desde timestamps
        if (!asistencia.almuerzoDuracion || asistencia.almuerzoDuracion === 0) {
          if (asistencia.almuerzo?.inicio && asistencia.almuerzo?.fin) {
            const inicio = new Date(asistencia.almuerzo.inicio);
            const fin = new Date(asistencia.almuerzo.fin);
            almuerzoMs = fin - inicio;
          }
        }
        // Si es string HH:MM:SS
        else if (typeof asistencia.almuerzoDuracion === 'string' && asistencia.almuerzoDuracion.includes(':')) {
          const [h, m, s] = asistencia.almuerzoDuracion.split(':').map(Number);
          almuerzoMs = (h * 60 * 60 + m * 60 + s) * 1000;
        }
        // Si es número (minutos legacy)
        else if (typeof asistencia.almuerzoDuracion === 'number' && asistencia.almuerzoDuracion > 0) {
          almuerzoMs = asistencia.almuerzoDuracion * 60 * 1000;
        }
        
        tiempoDescansoMs += almuerzoMs;
        
        // Tiempo trabajado efectivo = tiempo total - descansos
        const tiempoTrabajadoMs = diffMs - tiempoDescansoMs;
        
        // Convertir a HH:MM:SS
        const horas = Math.floor(tiempoTrabajadoMs / 1000 / 60 / 60);
        const minutos = Math.floor((tiempoTrabajadoMs / 1000 / 60) % 60);
        const segundos = Math.floor((tiempoTrabajadoMs / 1000) % 60);
        horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
      }
      // Si no hay timestamps pero existe horasTrabajadas decimal (legacy), convertir
      else if (horasTrabajadas && typeof horasTrabajadas === 'number') {
        const totalSegundos = Math.floor(horasTrabajadas * 60 * 60);
        const horas = Math.floor(totalSegundos / 60 / 60);
        const minutos = Math.floor((totalSegundos / 60) % 60);
        const segundos = Math.floor(totalSegundos % 60);
        horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
      }
      
      return {
        ...asistencia,
        horasTrabajadas
      };
    }).sort((a, b) => {
      // Ordenar por fecha desc, luego por nombre
      const dateCompare = b.fecha.localeCompare(a.fecha);
      if (dateCompare !== 0) return dateCompare;
      return (a.empleadoNombre || '').localeCompare(b.empleadoNombre || '');
    });
  }, [asistencias]);

  // ✅ FILTRADO ADICIONAL POR BÚSQUEDA DE TEXTO (solo si aplicó filtros)
  const asistenciasFiltradas = useMemo(() => {
    if (!hasAppliedFilters) return [];
    
    return asistenciasAgrupadas.filter((asistencia) => {
      // Búsqueda por nombre/email (opcional)
      if (searchText) {
        const search = searchText.toLowerCase();
        const nombre = (asistencia.empleadoNombre || '').toLowerCase();
        const email = (asistencia.empleadoEmail || '').toLowerCase();
        return nombre.includes(search) || email.includes(search);
      }
      
      return true;
    });
  }, [asistenciasAgrupadas, searchText, hasAppliedFilters]);

  // ✅ CONFIGURACIÓN DE ESTADOS para Chip visual
  const getEstadoConfig = (estado) => {
    switch ((estado || '').toLowerCase()) {
      case 'trabajando':
        return { label: 'Trabajando', color: 'success', icon: '🟢' };
      case 'break':
        return { label: 'Break', color: 'info', icon: '☕' };
      case 'almuerzo':
        return { label: 'Almuerzo', color: 'warning', icon: '🍽️' };
      case 'finalizado':
        return { label: 'Finalizado', color: 'default', icon: '🏠' };
      case 'ausente':
        return { label: 'Ausente', color: 'error', icon: '⚫' };
      default:
        return { label: estado || 'Desconocido', color: 'default', icon: '❓' };
    }
  };

  // ✅ PAGINACIÓN
  const asistenciasPaginadas = useMemo(() => {
    const start = page * rowsPerPage;
    return asistenciasFiltradas.slice(start, start + rowsPerPage);
  }, [asistenciasFiltradas, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ✅ EXPORTACIÓN A EXCEL (Formato Python)
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportarAsistenciasExcel(asistenciasFiltradas);
      showToast('Excel exportado exitosamente', 'success');
    } catch (err) {
      console.error('❌ Error exportando Excel:', err);
      showToast('Error al exportar Excel: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  // ✅ FORMATO DE HORA
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return format(date, 'HH:mm:ss', { locale: es });
    } catch (err) {
      return '-';
    }
  };

  // ✅ SIN PERMISOS
  if (!canViewAsistencias) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="body2">
            No tienes permisos para ver el módulo de asistencias. Contacta al administrador.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1400px', mx: 'auto' }}>
      {/* Header Sobrio con Gradiente Simplificado */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 1.2
          }}>
            CONTROL DE PERSONAL • ASISTENCIAS
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            mt: 0.5,
            mb: 0.5,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AccessTimeIcon sx={{ fontSize: 32 }} />
            Asistencias del Personal
          </Typography>
          <Typography variant="body1" sx={{
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Registro completo de entrada, breaks, almuerzo y salida del personal
          </Typography>
        </Box>
      </Paper>

      {/* ✅ KPI Cards - Estado del personal en TIEMPO REAL (siempre visible, datos del día) */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, overflowX: 'auto' }}>
        {[
          { key: 'active',   label: 'Activos',    value: todayStats.active,   icon: <AccessTimeIcon />,   color: theme.palette.primary.main },
          { key: 'absent',   label: 'Ausentes',   value: todayStats.absent,   icon: <PersonOffIcon />,    color: theme.palette.error.main },
          { key: 'all',      label: 'Total',       value: todayStats.total,    icon: <GroupsIcon />,       color: theme.palette.text.primary },
          { key: 'break',    label: 'Break',       value: todayStats.break,    icon: <CoffeeIcon />,       color: theme.palette.info.main },
          { key: 'lunch',    label: 'Almuerzo',    value: todayStats.lunch,    icon: <LunchIcon />,        color: theme.palette.warning.main },
          { key: 'finished', label: 'Finalizado',  value: todayStats.finished, icon: <CheckCircleIcon />,  color: theme.palette.text.secondary },
        ].map((kpi) => (
          <Paper
            key={kpi.key}
            elevation={0}
            onClick={() => setKpiModal(kpi.key)}
            sx={{
              flex: 1,
              minWidth: 0,
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: alpha(kpi.color, 0.4),
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ 
                width: 36, height: 36, 
                bgcolor: alpha(kpi.color, 0.12),
                color: kpi.color 
              }}>
                {kpi.icon}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: kpi.color, lineHeight: 1.2 }}>
                  {todayLoading ? '...' : kpi.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {kpi.label}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Filtros Avanzados */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.8),
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}
      >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              🔍 Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2} alignItems="center">
              {/* Período */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={filterPeriodo}
                    label="Período"
                    onChange={(e) => setFilterPeriodo(e.target.value)}
                  >
                    <MenuItem value="">Seleccionar...</MenuItem>
                    <MenuItem value="hoy">Hoy</MenuItem>
                    <MenuItem value="ayer">Ayer</MenuItem>
                    <MenuItem value="7dias">Últimos 7 días</MenuItem>
                    <MenuItem value="30dias">Últimos 30 días</MenuItem>
                    <MenuItem value="mes_actual">Mes actual</MenuItem>
                    <MenuItem value="personalizado">Rango personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Empleado */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    value={filterEmpleado}
                    label="Empleado"
                    onChange={(e) => setFilterEmpleado(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {empleadosList.map((emp) => (
                      <MenuItem key={emp.uid} value={emp.uid}>
                        {emp.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ✅ Estado */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filterEstado}
                    label="Estado"
                    onChange={(e) => setFilterEstado(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="trabajando">🟢 Trabajando</MenuItem>
                    <MenuItem value="break">☕ Break</MenuItem>
                    <MenuItem value="almuerzo">🍽️ Almuerzo</MenuItem>
                    <MenuItem value="finalizado">🏠 Finalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* ✅ Ubicación */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ubicación</InputLabel>
                  <Select
                    value={filterUbicacion}
                    label="Ubicación"
                    onChange={(e) => setFilterUbicacion(e.target.value)}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    <MenuItem value="oficina">🏢 Oficina</MenuItem>
                    <MenuItem value="remoto">🏠 Remoto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Fechas personalizadas (solo si período = personalizado) */}
              {filterPeriodo === 'personalizado' && (
                <>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Desde"
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Hasta"
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Búsqueda por texto */}
              <Grid item xs={12} sm={6} md={filterPeriodo === 'personalizado' ? 2 : 2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar por nombre"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Diego, Carolina..."
                />
              </Grid>

              {/* Botones */}
              <Grid item xs={12} md={filterPeriodo === 'personalizado' ? 12 : 12}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{
                      flex: 1,
                      minWidth: 120,
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                    }}
                  >
                    {loading ? 'Cargando...' : 'Aplicar Filtros'}
                  </Button>
                  {hasAppliedFilters && (
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        fontWeight: 600
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                    onClick={handleExportExcel}
                    disabled={asistencias.length === 0 || exporting}
                    sx={{
                      flex: 1,
                      minWidth: 120,
                      fontWeight: 600
                    }}
                  >
                    Excel
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Info de resultados */}
            {hasAppliedFilters && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  📊 Mostrando <strong>{asistenciasFiltradas.length}</strong> registro{asistenciasFiltradas.length !== 1 ? 's' : ''} 
                  {searchText && ` filtrados por "${searchText}"`}
                </Typography>
              </Box>
            )}

            {/* ✅ WARNING: Más de 100 registros disponibles */}
            {hasMoreData && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mt: 2,
                  borderRadius: 1,
                  boxShadow: '0 2px 8px rgba(255,152,0,0.15)'
                }}
              >
                ⚠️ <strong>Mostrando 100 registros</strong>. Hay más datos disponibles. 
                Ajusta los filtros para resultados más específicos (por ej. selecciona un empleado o reduce el rango de fechas).
              </Alert>
            )}
          </CardContent>
        </Card>

      {/* Tabla */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}
        >
          {loading ? (
            <PageSkeleton variant="table" kpiCount={0} rows={8} />
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : !hasAppliedFilters ? (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={400} sx={{ p: 4 }}>
              <CalendarIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona los filtros para ver registros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elige un período y opcionalmente un empleado, luego presiona "Aplicar Filtros"
              </Typography>
            </Box>
          ) : asistencias.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No hay registros de asistencias para los filtros seleccionados.
            </Alert>
          ) : (
            <>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{
                  minWidth: 800,
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  '& .MuiTableCell-root': {
                    borderColor: alpha(theme.palette.divider, 0.12),
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
                  },
                  '& .MuiTableHead-root .MuiTableRow-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    '& .MuiTableCell-root': {
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      paddingY: 1.5,
                      borderColor: alpha(theme.palette.primary.main, 0.12),
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: theme.palette.text.secondary
                    }
                  },
                  '& .MuiTableBody-root .MuiTableRow-root': {
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04)
                    },
                    '& .MuiTableCell-root': {
                      paddingY: 1.5,
                      fontSize: '0.85rem',
                      borderColor: alpha(theme.palette.divider, 0.08)
                    }
                  }
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell>Empleado</TableCell>
                      <TableCell align="center">Fecha</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Entrada</TableCell>
                      <TableCell align="center">Breaks</TableCell>
                      <TableCell align="center">Almuerzo</TableCell>
                      <TableCell align="center">Salida</TableCell>
                      <TableCell align="center">Horas Trabajadas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asistenciasPaginadas.map((asistencia, index) => {
                      const estadoConfig = getEstadoConfig(asistencia.estadoActual);
                      const isExpanded = expandedRow === asistencia.id;
                      
                      return (
                      <React.Fragment key={`${asistencia.id}-${index}`}>
                      <TableRow
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                          },
                          transition: 'background-color 0.15s ease',
                          cursor: 'pointer',
                          ...(isExpanded && {
                            backgroundColor: alpha(theme.palette.primary.main, 0.06),
                            '& > .MuiTableCell-root': {
                              borderBottom: 'none',
                              fontWeight: 600
                            }
                          }),
                          ...(!isExpanded && {
                            '& > .MuiTableCell-root': {
                              borderBottom: undefined
                            }
                          })
                        }}
                        onClick={() => setExpandedRow(isExpanded ? null : asistencia.id)}
                      >
                        {/* Expand Icon */}
                        <TableCell sx={{ width: 40, px: 0.5 }}>
                          <IconButton size="small" sx={{ 
                            p: 0.5,
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: isExpanded ? theme.palette.primary.main : theme.palette.text.secondary
                          }}>
                            <KeyboardArrowDownIcon fontSize="small" />
                          </IconButton>
                        </TableCell>

                        {/* Empleado */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: theme.palette.primary.main
                              }}
                            >
                              {(asistencia.empleadoNombre || 'U')[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {asistencia.empleadoNombre || 'Sin nombre'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {asistencia.fecha ? format(parseISO(asistencia.fecha), 'dd/MM/yyyy', { locale: es }) : '-'}
                          </Typography>
                        </TableCell>

                        {/* Estado */}
                        <TableCell align="center">
                          <Chip
                            label={`${estadoConfig.icon} ${estadoConfig.label}`}
                            size="small"
                            color={estadoConfig.color}
                            variant={estadoConfig.color === 'default' ? 'outlined' : 'filled'}
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              ...(estadoConfig.color !== 'default' && {
                                backgroundColor: alpha(theme.palette[estadoConfig.color]?.main || theme.palette.grey[500], 0.12),
                                color: theme.palette[estadoConfig.color]?.dark || theme.palette.text.primary
                              })
                            }}
                          />
                        </TableCell>

                        {/* Entrada + Puntualidad */}
                        <TableCell align="center">
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                            <Chip
                              label={formatTime(asistencia.entrada?.hora) || '-'}
                              size="small"
                              sx={{
                                height: 22,
                                backgroundColor: alpha(theme.palette.success.main, 0.12),
                                color: theme.palette.success.dark,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                border: 'none'
                              }}
                            />
                            {(() => {
                              const puntualidad = getPuntualidadInfo(asistencia.entrada?.hora);
                              if (!puntualidad) return null;
                              return (
                                <Typography variant="caption" sx={{
                                  fontSize: '0.6rem',
                                  fontWeight: 600,
                                  color: puntualidad.tipo === 'puntual' 
                                    ? theme.palette.success.main 
                                    : theme.palette.error.main,
                                  lineHeight: 1
                                }}>
                                  {puntualidad.tipo === 'puntual' ? '✓ Puntual' : `⏰ ${puntualidad.label}`}
                                </Typography>
                              );
                            })()}
                          </Box>
                        </TableCell>

                        {/* Breaks — tiempo total consolidado */}
                        <TableCell align="center">
                          {asistencia.breaks && asistencia.breaks.length > 0 ? (
                            (() => {
                              // Sumar duración total de todos los breaks
                              let totalMs = 0;
                              let hayEnCurso = false;
                              asistencia.breaks.forEach(br => {
                                if (br.fin && br.inicio) {
                                  totalMs += new Date(br.fin) - new Date(br.inicio);
                                } else if (br.inicio && !br.fin) {
                                  hayEnCurso = true;
                                }
                              });
                              
                              let duracionLabel = 'En curso';
                              if (totalMs > 0) {
                                const h = Math.floor(totalMs / 3600000);
                                const m = Math.floor((totalMs % 3600000) / 60000);
                                const s = Math.floor((totalMs % 60000) / 1000);
                                duracionLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                              }
                              
                              return (
                                <Tooltip title={`${asistencia.breaks.length} break${asistencia.breaks.length > 1 ? 's' : ''} tomado${asistencia.breaks.length > 1 ? 's' : ''}`}>
                                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                                    <Chip
                                      icon={<BreakIcon sx={{ fontSize: 12 }} />}
                                      label={duracionLabel}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        backgroundColor: alpha(theme.palette.info.main, 0.12),
                                        color: theme.palette.info.dark,
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                        border: 'none',
                                        '& .MuiChip-icon': { color: theme.palette.info.dark }
                                      }}
                                    />
                                    {hayEnCurso && (
                                      <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 500, fontSize: '0.6rem' }}>
                                        En curso
                                      </Typography>
                                    )}
                                  </Box>
                                </Tooltip>
                              );
                            })()
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Almuerzo */}
                        <TableCell align="center">
                          {asistencia.almuerzo ? (
                            <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
                              {(() => {
                                const horaInicio = formatTime(asistencia.almuerzoInicio);
                                let duracion = 'En curso';
                                
                                if (asistencia.almuerzoDuracion && typeof asistencia.almuerzoDuracion === 'string' && asistencia.almuerzoDuracion.includes(':')) {
                                  duracion = asistencia.almuerzoDuracion;
                                } else if (asistencia.almuerzoDuracion && typeof asistencia.almuerzoDuracion === 'number' && asistencia.almuerzoDuracion > 0) {
                                  duracion = `${asistencia.almuerzoDuracion} min`;
                                } else if (asistencia.almuerzoFin && asistencia.almuerzoInicio) {
                                  const diffMs = asistencia.almuerzoFin - asistencia.almuerzoInicio;
                                  const horas = Math.floor(diffMs / 1000 / 60 / 60);
                                  const minutos = Math.floor((diffMs / 1000 / 60) % 60);
                                  const segundos = Math.floor((diffMs / 1000) % 60);
                                  duracion = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
                                }
                                
                                return (
                                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                                    <Chip
                                      icon={<LunchIcon sx={{ fontSize: 12 }} />}
                                      label={horaInicio}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        backgroundColor: alpha(theme.palette.warning.main, 0.15),
                                        color: theme.palette.warning.dark,
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                        border: 'none',
                                        '& .MuiChip-icon': { color: theme.palette.warning.dark }
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.65rem' }}>
                                      {duracion}
                                    </Typography>
                                  </Box>
                                );
                              })()}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Salida */}
                        <TableCell align="center">
                          <Chip
                            label={formatTime(asistencia.salida?.hora) || '-'}
                            size="small"
                            sx={{
                              height: 22,
                              backgroundColor: asistencia.salida?.hora 
                                ? alpha(theme.palette.grey[500], 0.12)
                                : alpha(theme.palette.divider, 0.3),
                              color: asistencia.salida?.hora 
                                ? theme.palette.text.primary
                                : 'text.secondary',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              border: 'none'
                            }}
                          />
                        </TableCell>

                        {/* Horas Trabajadas */}
                        <TableCell align="center">
                          {asistencia.horasTrabajadas ? (
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                              <TimerIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: theme.palette.primary.main
                                }}
                              >
                                {typeof asistencia.horasTrabajadas === 'string' && asistencia.horasTrabajadas.includes(':')
                                  ? asistencia.horasTrabajadas
                                  : `${asistencia.horasTrabajadas}h`}
                              </Typography>
                            </Box>
                          ) : (
                            <Chip
                              label="En curso"
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                backgroundColor: alpha(theme.palette.success.main, 0.08),
                                color: theme.palette.success.dark,
                                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>

                      {/* ✅ Fila expandible con detalle completo + datos de la APP */}
                      {isExpanded && (
                      <TableRow>
                        <TableCell sx={{ py: 0 }} colSpan={9}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ 
                              py: 2, 
                              px: 2.5,
                              mx: 1,
                              my: 1,
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}>
                              {/* ⚠️ Alerta GPS Simulado */}
                              {asistencia.entrada?.locationIsMocked && (
                                <Alert 
                                  severity="error" 
                                  icon={<GpsOffIcon />}
                                  sx={{ mb: 2, borderRadius: 1, py: 0.5 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ⚠️ GPS SIMULADO DETECTADO — La ubicación de entrada fue reportada como falsa por el dispositivo
                                  </Typography>
                                </Alert>
                              )}

                              {/* Encabezado compacto: Dispositivo + Email + GPS Quality */}
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1.5}>
                                {/* Dispositivo */}
                                <Chip
                                  icon={<DevicesIcon sx={{ fontSize: 14 }} />}
                                  label={(() => {
                                    const d = asistencia.entrada?.dispositivo;
                                    if (!d) return 'Sin dispositivo';
                                    if (typeof d === 'string') return d;
                                    if (typeof d === 'object') return `${d.brand || ''} ${d.modelName || ''}`.trim() || 'Desconocido';
                                    return 'Sin dispositivo';
                                  })()}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 24, fontSize: '0.7rem', borderColor: alpha(theme.palette.divider, 0.3) }}
                                />
                                {/* Email */}
                                {asistencia.empleadoEmail && (
                                  <Chip
                                    icon={<PersonIcon sx={{ fontSize: 14 }} />}
                                    label={asistencia.empleadoEmail}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 24, fontSize: '0.7rem', borderColor: alpha(theme.palette.divider, 0.3) }}
                                  />
                                )}
                                {/* GPS Quality inline chips */}
                                {asistencia.entrada?.locationProvider && (
                                  <Chip
                                    icon={<GpsFixedIcon sx={{ fontSize: 12 }} />}
                                    label={({ 
                                      GPS: 'GPS', 
                                      Network: 'Red móvil', 
                                      LastKnown: 'Última conocida', 
                                      Fused: 'GPS combinado',
                                      WiFi: 'WiFi'
                                    })[asistencia.entrada.locationProvider] || asistencia.entrada.locationProvider}
                                    size="small"
                                    sx={{ 
                                      height: 22, 
                                      fontSize: '0.6rem',
                                      backgroundColor: asistencia.entrada.locationProvider === 'GPS' 
                                        ? alpha(theme.palette.success.main, 0.1)
                                        : alpha(theme.palette.warning.main, 0.1),
                                      color: asistencia.entrada.locationProvider === 'GPS'
                                        ? theme.palette.success.dark
                                        : theme.palette.warning.dark,
                                      '& .MuiChip-icon': { color: 'inherit' }
                                    }}
                                  />
                                )}
                                {asistencia.entrada?.locationAccuracy != null && (
                                  <Chip
                                    icon={<SignalIcon sx={{ fontSize: 12 }} />}
                                    label={`±${Math.round(asistencia.entrada.locationAccuracy)}m`}
                                    size="small"
                                    sx={{ 
                                      height: 22, 
                                      fontSize: '0.6rem',
                                      backgroundColor: asistencia.entrada.locationAccuracy <= 20
                                        ? alpha(theme.palette.success.main, 0.1)
                                        : asistencia.entrada.locationAccuracy <= 100
                                          ? alpha(theme.palette.warning.main, 0.1)
                                          : alpha(theme.palette.error.main, 0.1),
                                      color: asistencia.entrada.locationAccuracy <= 20
                                        ? theme.palette.success.dark
                                        : asistencia.entrada.locationAccuracy <= 100
                                          ? theme.palette.warning.dark
                                          : theme.palette.error.dark,
                                      '& .MuiChip-icon': { color: 'inherit' }
                                    }}
                                  />
                                )}
                                {asistencia.entrada?.locationIsMocked && (
                                  <Chip
                                    icon={<GpsOffIcon sx={{ fontSize: 12 }} />}
                                    label="GPS FALSO"
                                    size="small"
                                    sx={{ 
                                      height: 22, fontSize: '0.6rem', fontWeight: 700,
                                      backgroundColor: alpha(theme.palette.error.main, 0.15),
                                      color: theme.palette.error.dark,
                                      '& .MuiChip-icon': { color: theme.palette.error.dark }
                                    }}
                                  />
                                )}
                              </Box>

                              {/* Contenido principal en 3 columnas: Entrada | Salida | Estado */}
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

                                {/* Columna 1: Ubicación Entrada */}
                                <Box sx={{ 
                                  flex: 1, 
                                  minWidth: { xs: '100%', sm: '45%', md: 0 },
                                  p: 1.5, 
                                  borderRadius: 1, 
                                  backgroundColor: alpha(theme.palette.divider, 0.04),
                                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
                                }}>
                                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                                    <LocationOnIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.palette.text.secondary, fontSize: '0.65rem' }}>
                                      Ubicación Entrada
                                    </Typography>
                                  </Box>
                                  {asistencia.entrada?.ubicacion?.lat ? (
                                    <Box>
                                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                        <Chip
                                          label={asistencia.entrada.ubicacion.tipo || 'GPS'}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.65rem' }}
                                        />
                                        <Tooltip title="Abrir en Google Maps">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://www.google.com/maps?q=${asistencia.entrada.ubicacion.lat},${asistencia.entrada.ubicacion.lon}`, '_blank');
                                            }}
                                            sx={{ p: 0.3, color: theme.palette.info.main }}
                                          >
                                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                      {asistencia.entrada.ubicacion.distanciaOficina != null && (
                                        <Typography variant="caption" sx={{ 
                                          color: asistencia.entrada.ubicacion.distanciaOficina <= (officeLocation?.radius || 100) 
                                            ? theme.palette.success.main 
                                            : theme.palette.warning.main,
                                          fontWeight: 600,
                                          fontSize: '0.7rem'
                                        }}>
                                          📍 {asistencia.entrada.ubicacion.distanciaOficina >= 1000 
                                            ? `${(asistencia.entrada.ubicacion.distanciaOficina / 1000).toFixed(1)} km` 
                                            : `${Math.round(asistencia.entrada.ubicacion.distanciaOficina)} m`} de la oficina
                                        </Typography>
                                      )}
                                    </Box>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">Sin ubicación</Typography>
                                  )}
                                </Box>

                                {/* Columna 2: Ubicación Salida */}
                                <Box sx={{ 
                                  flex: 1, 
                                  minWidth: { xs: '100%', sm: '45%', md: 0 },
                                  p: 1.5, 
                                  borderRadius: 1, 
                                  backgroundColor: alpha(theme.palette.divider, 0.04),
                                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
                                }}>
                                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                                    <ExitIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.palette.text.secondary, fontSize: '0.65rem' }}>
                                      Ubicación Salida
                                    </Typography>
                                  </Box>
                                  {asistencia.salida?.ubicacion?.lat ? (
                                    <Box>
                                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                        <Chip
                                          label={asistencia.salida.ubicacion.tipo || 'GPS'}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.65rem' }}
                                        />
                                        <Tooltip title="Abrir en Google Maps">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://www.google.com/maps?q=${asistencia.salida.ubicacion.lat},${asistencia.salida.ubicacion.lon}`, '_blank');
                                            }}
                                            sx={{ p: 0.3, color: theme.palette.info.main }}
                                          >
                                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                      {asistencia.salida.ubicacion.distanciaOficina != null && (
                                        <Typography variant="caption" sx={{ 
                                          color: theme.palette.text.secondary,
                                          fontWeight: 500,
                                          fontSize: '0.7rem'
                                        }}>
                                          📍 {asistencia.salida.ubicacion.distanciaOficina >= 1000 
                                            ? `${(asistencia.salida.ubicacion.distanciaOficina / 1000).toFixed(1)} km` 
                                            : `${Math.round(asistencia.salida.ubicacion.distanciaOficina)} m`} de la oficina
                                        </Typography>
                                      )}
                                    </Box>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      {asistencia.salida?.hora ? 'Sin ubicación' : 'Pendiente'}
                                    </Typography>
                                  )}
                                </Box>

                                {/* Columna 3: Estado del Día (Puntualidad + Novedades) */}
                                <Box sx={{ 
                                  flex: 1.2, 
                                  minWidth: { xs: '100%', md: 0 },
                                  p: 1.5, 
                                  borderRadius: 1, 
                                  backgroundColor: alpha(theme.palette.divider, 0.04),
                                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
                                }}>
                                  {/* Puntualidad */}
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.palette.text.secondary, fontSize: '0.65rem' }}>
                                      Estado del Día
                                    </Typography>
                                  </Box>
                                  {(() => {
                                    const puntualidad = getPuntualidadInfo(asistencia.entrada?.hora);
                                    if (!puntualidad) return <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Sin horario configurado</Typography>;
                                    return (
                                      <Box mb={1}>
                                        <Chip
                                          label={puntualidad.tipo === 'puntual' ? '✓ Puntual' : `⏰ ${puntualidad.label}`}
                                          size="small"
                                          sx={{
                                            height: 22,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            backgroundColor: alpha(
                                              puntualidad.tipo === 'puntual' ? theme.palette.success.main : theme.palette.error.main,
                                              0.12
                                            ),
                                            color: puntualidad.tipo === 'puntual' ? theme.palette.success.dark : theme.palette.error.dark
                                          }}
                                        />
                                        {workSchedule && (
                                          <Typography variant="caption" display="block" sx={{ mt: 0.3, color: theme.palette.text.secondary, fontSize: '0.6rem' }}>
                                            Horario: {workSchedule.startTime} - {workSchedule.endTime}
                                            {workSchedule.gracePeriod > 0 && ` (${workSchedule.gracePeriod} min gracia)`}
                                          </Typography>
                                        )}
                                      </Box>
                                    );
                                  })()}

                                  {/* Novedades */}
                                  {(() => {
                                    const key = `${asistencia.uid}_${asistencia.fecha}`;
                                    const novedades = novedadesMap[key];
                                    if (!novedades || novedades.length === 0) {
                                      return (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                          Sin novedades reportadas
                                        </Typography>
                                      );
                                    }
                                    
                                    const tipoLabels = {
                                      llegada_tarde: '⏰ Llegada tarde',
                                      permiso: '📋 Permiso',
                                      incapacidad: '🏥 Incapacidad',
                                      calamidad: '🚨 Calamidad',
                                      retraso: '⏳ Retraso',
                                      urgencia_medica: '🚑 Urgencia médica',
                                      solicitud_reapertura: '🔓 Solicitud reapertura',
                                      otro: '📝 Otro'
                                    };
                                    
                                    const statusColors = {
                                      pending: { bg: theme.palette.warning.main, label: 'Pendiente' },
                                      approved: { bg: theme.palette.success.main, label: 'Aprobada' },
                                      rejected: { bg: theme.palette.error.main, label: 'Rechazada' }
                                    };
                                    
                                    return (
                                      <Box display="flex" flexDirection="column" gap={0.5} sx={{ 
                                        mt: 0.5,
                                        pt: 0.5, 
                                        borderTop: `1px dashed ${alpha(theme.palette.divider, 0.2)}` 
                                      }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                          Novedades ({novedades.length})
                                        </Typography>
                                        {novedades.map((nov, nIdx) => {
                                          const statusInfo = statusColors[nov.status] || statusColors.pending;
                                          return (
                                            <Box key={nIdx} display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                                              <Chip
                                                label={tipoLabels[nov.type] || nov.type}
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  fontSize: '0.6rem',
                                                  fontWeight: 600,
                                                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                                                  color: theme.palette.info.dark
                                                }}
                                              />
                                              <Chip
                                                label={statusInfo.label}
                                                size="small"
                                                sx={{
                                                  height: 18,
                                                  fontSize: '0.55rem',
                                                  fontWeight: 600,
                                                  backgroundColor: alpha(statusInfo.bg, 0.12),
                                                  color: statusInfo.bg
                                                }}
                                              />
                                              {nov.hasAttachment && (
                                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: theme.palette.text.secondary }}>📎</Typography>
                                              )}
                                              {nov.description && (
                                                <Tooltip title={nov.description}>
                                                  <Typography variant="caption" sx={{ 
                                                    fontSize: '0.6rem', 
                                                    color: theme.palette.text.secondary,
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    cursor: 'help'
                                                  }}>
                                                    {nov.description}
                                                  </Typography>
                                                </Tooltip>
                                              )}
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    );
                                  })()}
                                </Box>

                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                      )}
                      </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginación */}
              <TablePagination
                component="div"
                count={asistenciasFiltradas.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '& .MuiTablePagination-toolbar': {
                    px: 2
                  }
                }}
              />
            </>
          )}
        </Card>

      {/* ✅ Modal KPI - Detalle de empleados por estado */}
      <Dialog
        open={kpiModal !== null}
        onClose={() => { setKpiModal(null); setExpandedKpiEmployee(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '85vh',
            background: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        {kpiModal && (() => {
          const cfg = kpiModalConfig;
          const emps = kpiModalEmployees;
          const toDate = (v) => { if (!v) return null; if (v.toDate) return v.toDate(); if (typeof v === 'string' || typeof v === 'number') return new Date(v); return v instanceof Date ? v : null; };
          
          return (
            <>
              {/* ═══ Header ═══ */}
              <Box sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}>
                <Box sx={{ px: 3, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ 
                    width: 48, height: 48, 
                    bgcolor: alpha(cfg.color, 0.15),
                    color: cfg.color,
                    '& .MuiSvgIcon-root': { fontSize: 26 }
                  }}>
                    {cfg.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: cfg.color, lineHeight: 1.2 }}>
                      {cfg.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {emps.length} empleado{emps.length !== 1 ? 's' : ''} • Hoy {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={() => { setKpiModal(null); setExpandedKpiEmployee(null); }} 
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.text.primary, 0.05),
                      '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.1) }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* ═══ Mini summary chips ═══ */}
                {kpiModal === 'all' && (
                  <Box sx={{ px: 3, pb: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {[
                      { label: `${todayStats.active} activos`, color: theme.palette.primary.main, show: todayStats.active > 0 },
                      { label: `${todayStats.break} break`, color: theme.palette.info.main, show: todayStats.break > 0 },
                      { label: `${todayStats.lunch} almuerzo`, color: theme.palette.warning.main, show: todayStats.lunch > 0 },
                      { label: `${todayStats.finished} finalizado`, color: theme.palette.text.secondary, show: todayStats.finished > 0 },
                      { label: `${todayStats.absent} ausentes`, color: theme.palette.error.main, show: todayStats.absent > 0 },
                    ].filter(c => c.show).map((c, i) => (
                      <Chip 
                        key={i} 
                        label={c.label} 
                        size="small" 
                        sx={{ 
                          height: 22, 
                          fontSize: '0.7rem', 
                          fontWeight: 600,
                          bgcolor: alpha(c.color, 0.1),
                          color: c.color,
                          border: `1px solid ${alpha(c.color, 0.2)}`
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {/* ═══ Lista de empleados ═══ */}
              <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                {emps.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                    <Avatar sx={{ 
                      width: 64, height: 64, mx: 'auto', mb: 2, 
                      bgcolor: alpha(cfg.color, 0.08) 
                    }}>
                      {cfg.icon}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                      No hay empleados en esta categoría
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                      Los datos se actualizan en tiempo real
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {emps.map((emp, idx) => {
                      const statusCfg = getEstadoConfig(emp.status);
                      const entradaHora = emp.attendance?.entrada?.hora;
                      const isExpanded = expandedKpiEmployee === emp.uid;
                      const hasAttendance = !!emp.attendance;

                      // Color del dot de estado
                      const dotColor = {
                        success: theme.palette.success.main,
                        info: theme.palette.info.main,
                        warning: theme.palette.warning.main,
                        error: theme.palette.error.main,
                        default: theme.palette.text.disabled
                      }[statusCfg.color] || theme.palette.text.disabled;

                      // Puntualidad
                      const puntualidad = entradaHora && workSchedule?.startTime ? getPuntualidadInfo(entradaHora) : null;

                      // Time info contextual
                      const timeInfo = (() => {
                        if (!emp.attendance) return 'Sin registro';
                        if (emp.status === 'trabajando' && entradaHora) return `Desde ${format(entradaHora, 'HH:mm')}`;
                        if (emp.status === 'break') {
                          const lastBreak = emp.attendance.breaks?.[emp.attendance.breaks.length - 1];
                          if (lastBreak?.inicio) {
                            const t = toDate(lastBreak.inicio);
                            return t ? `Break desde ${format(t, 'HH:mm')}` : 'En break';
                          }
                        }
                        if (emp.status === 'almuerzo' && emp.attendance.almuerzo?.inicio) {
                          const t = toDate(emp.attendance.almuerzo.inicio);
                          return t ? `Almuerzo desde ${format(t, 'HH:mm')}` : 'En almuerzo';
                        }
                        if (emp.status === 'finalizado' && emp.attendance.salida?.hora) {
                          return `Finalizó ${format(emp.attendance.salida.hora, 'HH:mm')}`;
                        }
                        if (entradaHora) return `Entrada ${format(entradaHora, 'HH:mm')}`;
                        return 'Sin registro';
                      })();

                      return (
                        <Box key={emp.uid}>
                          {/* ═══ Fila principal del empleado ═══ */}
                          <Box 
                            onClick={() => hasAttendance && setExpandedKpiEmployee(isExpanded ? null : emp.uid)}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1.5, 
                              px: 2.5, 
                              py: 1.5,
                              cursor: hasAttendance ? 'pointer' : 'default',
                              borderBottom: !isExpanded && idx < emps.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.06)}` : 'none',
                              transition: 'background 0.15s ease',
                              '&:hover': hasAttendance ? { bgcolor: alpha(theme.palette.primary.main, 0.03) } : {},
                            }}
                          >
                            {/* Avatar con status indicator */}
                            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                              <Avatar 
                                src={emp.photoURL || undefined}
                                sx={{ 
                                  width: 42, height: 42, 
                                  bgcolor: alpha(dotColor, 0.12),
                                  fontSize: '0.95rem',
                                  fontWeight: 600,
                                  color: dotColor
                                }}
                              >
                                {(emp.nombre || 'U').charAt(0).toUpperCase()}
                              </Avatar>
                              {/* Status dot overlay */}
                              <Box sx={{ 
                                position: 'absolute', bottom: -1, right: -1,
                                width: 13, height: 13, borderRadius: '50%', 
                                bgcolor: dotColor,
                                border: `2.5px solid ${theme.palette.background.paper}`,
                              }} />
                            </Box>

                            {/* Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
                                {emp.nombre || 'Sin nombre'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', lineHeight: 1.2 }}>
                                {[emp.position, emp.department].filter(Boolean).join(' • ') || emp.email}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: dotColor, 
                                fontWeight: 500, 
                                fontSize: '0.68rem',
                                lineHeight: 1.4
                              }}>
                                {timeInfo}
                              </Typography>
                            </Box>

                            {/* Puntualidad badge */}
                            {puntualidad && (
                              <Chip 
                                label={puntualidad.label}
                                size="small"
                                sx={{ 
                                  height: 22, 
                                  fontSize: '0.65rem', 
                                  fontWeight: 600,
                                  flexShrink: 0,
                                  bgcolor: alpha(
                                    puntualidad.color === 'success' ? theme.palette.success.main : theme.palette.error.main, 
                                    0.1
                                  ),
                                  color: puntualidad.color === 'success' ? theme.palette.success.main : theme.palette.error.main,
                                  border: `1px solid ${alpha(
                                    puntualidad.color === 'success' ? theme.palette.success.main : theme.palette.error.main,
                                    0.25
                                  )}`
                                }}
                              />
                            )}

                            {/* Expand indicator */}
                            {hasAttendance && (
                              <Box sx={{ flexShrink: 0, color: 'text.disabled', display: 'flex' }}>
                                {isExpanded ? <ExpandLessIcon sx={{ fontSize: 20 }} /> : <ExpandMoreIcon sx={{ fontSize: 20 }} />}
                              </Box>
                            )}
                          </Box>

                          {/* ═══ Detalle expandible de sesión ═══ */}
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {hasAttendance && (
                              <Box sx={{ 
                                mx: 2.5, mb: 1.5, mt: 0.5,
                                p: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 1.5,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderBottom: idx < emps.length - 1 ? undefined : 'none',
                              }}>
                                {/* Entrada */}
                                {entradaHora && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                    <LoginIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>Entrada</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      {format(entradaHora, 'hh:mm a')}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Breaks */}
                                {emp.attendance.breaks?.length > 0 && emp.attendance.breaks.map((b, i) => {
                                  const bInicio = toDate(b.inicio);
                                  const bFin = toDate(b.fin);
                                  return (
                                    <Box key={`brk-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                      <CoffeeIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                                        Break{emp.attendance.breaks.length > 1 ? ` #${i + 1}` : ''}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {bInicio ? format(bInicio, 'hh:mm a') : '?'}
                                        {' - '}
                                        {bFin ? (() => {
                                          const durMs = bFin - bInicio;
                                          const mins = Math.floor(durMs / 60000);
                                          return `${format(bFin, 'hh:mm a')} (${mins}min)`;
                                        })() : 'En curso...'}
                                      </Typography>
                                    </Box>
                                  );
                                })}

                                {/* Almuerzo */}
                                {emp.attendance.almuerzo?.inicio && (() => {
                                  const aInicio = toDate(emp.attendance.almuerzo.inicio);
                                  const aFin = toDate(emp.attendance.almuerzo.fin);
                                  return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                      <RestaurantIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>Almuerzo</Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {aInicio ? format(aInicio, 'hh:mm a') : '?'}
                                        {' - '}
                                        {aFin ? (() => {
                                          const durMs = aFin - aInicio;
                                          const mins = Math.floor(durMs / 60000);
                                          return `${format(aFin, 'hh:mm a')} (${mins}min)`;
                                        })() : 'En curso...'}
                                      </Typography>
                                    </Box>
                                  );
                                })()}

                                {/* Salida */}
                                {emp.attendance.salida?.hora && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                    <LogoutIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>Salida</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      {format(emp.attendance.salida.hora, 'hh:mm a')}
                                    </Typography>
                                  </Box>
                                )}

                                {/* ═══ Tiempo trabajado ═══ */}
                                {entradaHora && (
                                  <Box sx={{ 
                                    display: 'flex', alignItems: 'center', gap: 1.5, 
                                    pt: 1, mt: 0.5,
                                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                  }}>
                                    <AccessTimeFilledIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                                    <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, color: 'text.secondary' }}>
                                      Tiempo trabajado
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                      {(() => {
                                        const fin = emp.attendance.salida?.hora || new Date();
                                        let totalMs = fin - entradaHora;
                                        
                                        // Restar breaks
                                        if (emp.attendance.breaks) {
                                          emp.attendance.breaks.forEach(b => {
                                            const bI = toDate(b.inicio);
                                            const bF = toDate(b.fin);
                                            if (bI && bF) totalMs -= (bF - bI);
                                          });
                                        }
                                        // Restar almuerzo
                                        if (emp.attendance.almuerzo?.inicio && emp.attendance.almuerzo?.fin) {
                                          const aI = toDate(emp.attendance.almuerzo.inicio);
                                          const aF = toDate(emp.attendance.almuerzo.fin);
                                          if (aI && aF) totalMs -= (aF - aI);
                                        }
                                        
                                        if (totalMs < 0) totalMs = 0;
                                        const hours = Math.floor(totalMs / 3600000);
                                        const mins = Math.floor((totalMs % 3600000) / 60000);
                                        return `${hours}h ${mins}m`;
                                      })()}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </DialogContent>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default AsistenciasPage;
