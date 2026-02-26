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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  alpha,
  useTheme,
  Autocomplete
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePermissions } from '../hooks/usePermissions';
import PageSkeleton from '../components/common/PageSkeleton';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import festivosColombianos from 'festivos-colombianos';
import { parseISO } from 'date-fns';

const FacturacionPage = () => {
  // Cache de salas (se carga 1 vez, evita 3 getDocs redundantes)
  const salasCacheRef = useRef(null);
  const loadSalasCache = useCallback(async () => {
    if (salasCacheRef.current) return salasCacheRef.current;
    const salasSnapshot = await getDocs(collection(db, 'salas'));
    const salas = salasSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    salasCacheRef.current = salas;
    return salas;
  }, []);

  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [todasLasLiquidaciones, setTodasLasLiquidaciones] = useState([]); // Para opciones de filtros
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    empresa: '',
    periodo: '',
    sala: '',
    estado: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  // Estados de UI
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogVistaPrevia, setDialogVistaPrevia] = useState({ open: false, liquidacion: null });
  const [dialogRegistrarPago, setDialogRegistrarPago] = useState({ open: false, liquidacion: null });
  const [datosDetalles, setDatosDetalles] = useState([]);

  // Contextos
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const theme = useTheme();

  // ✅ SISTEMA DE PERMISOS CENTRALIZADO (con soporte jerárquico)
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Verificar acceso a la página (soporta jerarquía: 'facturacion' incluye 'facturacion.cuentas_cobro')
  const hasPageAccess = hasAnyPermission(['facturacion.cuentas_cobro', 'facturacion']);

  // 🐛 DEBUG: Log de permisos (temporal)
  useEffect(() => {
  }, [userProfile, hasPermission, hasPageAccess]);

  // Listener en tiempo real para liquidaciones aprobadas
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError(null);

    // Query para TODAS las liquidaciones por sala (sin filtro de usuario)
    const liquidacionesQuery = query(
      collection(db, 'liquidaciones_por_sala')
    );

    const unsubscribe = onSnapshot(
      liquidacionesQuery,
      async (snapshot) => {
        try {
          const liquidacionesData = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Agregar estado de facturación si no existe
            const estadoFacturacion = data.estadoFacturacion || 'pendiente';
            
            liquidacionesData.push({
              id: doc.id,
              ...data,
              estadoFacturacion
            });
          });

          
          // Log detallado de empresas y periodos únicos
          const empresasUnicas = [...new Set(liquidacionesData.map(l => l.empresa?.nombre).filter(Boolean))];
          const periodosUnicos = [...new Set(liquidacionesData.map(l => l.fechas?.periodoLiquidacion).filter(Boolean))];

          // Guardar TODAS las liquidaciones para opciones de filtros
          setTodasLasLiquidaciones(liquidacionesData);

          // SOLO mostrar datos en tabla si hay filtros aplicados
          const hayFiltrosValidos = filtrosAplicados && Object.values(filtrosAplicados).some(f => f && f.trim && f.trim());
          
          let liquidacionesFiltradas = [];
          
          if (hayFiltrosValidos) {
            
            // Primero filtrar por criterios
            liquidacionesFiltradas = liquidacionesData.filter(liquidacion => {
              const nombreEmpresaLiq = liquidacion.empresa?.nombre;
              const periodoLiq = liquidacion.fechas?.periodoLiquidacion;
              const nombreSalaLiq = liquidacion.sala?.nombre;
              
              const pasaEmpresa = !filtrosAplicados.empresa || nombreEmpresaLiq === filtrosAplicados.empresa;
              const pasaPeriodo = !filtrosAplicados.periodo || periodoLiq === filtrosAplicados.periodo;
              const pasaSala = !filtrosAplicados.sala || nombreSalaLiq === filtrosAplicados.sala;
              const pasaEstado = !filtrosAplicados.estado || liquidacion.estadoFacturacion === filtrosAplicados.estado;
              
              return pasaEmpresa && pasaPeriodo && pasaSala && pasaEstado;
            });

            // Luego eliminar originales si existe versión editada
            const idsOriginalesConEdicion = new Set();
            
            // Identificar qué liquidaciones originales tienen una versión editada
            liquidacionesFiltradas.forEach(liq => {
              if (liq.esEdicion && liq.liquidacionOriginalId) {
                idsOriginalesConEdicion.add(liq.liquidacionOriginalId);
              }
            });
            
            // Filtrar para excluir las originales que tienen edición
            liquidacionesFiltradas = liquidacionesFiltradas.filter(liq => {
              // Si es una liquidación editada, incluirla
              if (liq.esEdicion) return true;
              
              // Si es una original PERO tiene edición, excluirla
              if (idsOriginalesConEdicion.has(liq.id)) {
                return false;
              }
              
              // Si es una original sin edición, incluirla
              return true;
            });
            
          } else {
          }

          setLiquidaciones(liquidacionesFiltradas);

          // Calcular estadísticas
          const stats = calcularEstadisticas(liquidacionesFiltradas);
          setEstadisticas(stats);

          setLoading(false);
        } catch (error) {
          console.error('Error procesando datos:', error);
          setError(error.message);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error en listener:', error);
        setError('Error de conexión con Firebase');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, filtrosAplicados]);

  // Calcular estadísticas
  const calcularEstadisticas = (data) => {
    const stats = {
      total: data.length,
      pendientes: 0,
      facturadas: 0,
      pagadas: 0,
      vencidas: 0,
      montos: {
        total: 0,
        pendiente: 0,
        cobrado: 0
      }
    };

    const hoy = new Date();

    data.forEach(liq => {
      const totalImpuestos = liq.metricas?.totalImpuestos || 0;
      stats.montos.total += totalImpuestos;

      switch (liq.estadoFacturacion) {
        case 'pendiente':
          stats.pendientes++;
          stats.montos.pendiente += totalImpuestos;
          break;
        case 'facturada':
          stats.facturadas++;
          stats.montos.pendiente += totalImpuestos;
          // Verificar si está vencida
          if (liq.fechaVencimiento) {
            const fechaVenc = new Date(liq.fechaVencimiento.seconds * 1000);
            if (fechaVenc < hoy) {
              stats.vencidas++;
            }
          }
          break;
        case 'pagada':
          stats.pagadas++;
          stats.montos.cobrado += totalImpuestos;
          break;
        default:
          stats.pendientes++;
          stats.montos.pendiente += totalImpuestos;
      }
    });

    return stats;
  };

  // Obtener opciones para filtros desde TODAS las liquidaciones
  const opcionesFiltros = useMemo(() => {
    return {
      empresas: [...new Set(todasLasLiquidaciones.map(l => l.empresa?.nombre).filter(Boolean))].sort(),
      periodos: [...new Set(todasLasLiquidaciones.map(l => l.fechas?.periodoLiquidacion).filter(Boolean))].sort().reverse(),
      salas: [...new Set(todasLasLiquidaciones.map(l => l.sala?.nombre).filter(Boolean))].sort()
    };
  }, [todasLasLiquidaciones]);

  // Aplicar filtros
  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros });
  };

  const limpiarFiltros = () => {
    setFiltros({ empresa: '', periodo: '', sala: '', estado: '' });
    setFiltrosAplicados({});
  };

  // Formatear montos
  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto || 0);
  };

  // Formatear período
  const formatearPeriodo = (periodo) => {
    if (!periodo) return '';
    const [mes, año] = periodo.split('_');
    const mesesMap = {
      enero: 'Enero', febrero: 'Febrero', marzo: 'Marzo',
      abril: 'Abril', mayo: 'Mayo', junio: 'Junio',
      julio: 'Julio', agosto: 'Agosto', septiembre: 'Septiembre',
      octubre: 'Octubre', noviembre: 'Noviembre', diciembre: 'Diciembre'
    };
    return `${mesesMap[mes] || mes} ${año}`;
  };

  // Obtener color del estado
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'pendiente': return 'default';
      case 'facturada': return 'warning';
      case 'pagada': return 'success';
      case 'vencida': return 'error';
      default: return 'default';
    }
  };

  // Obtener icono del estado
  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'pendiente': return <ScheduleIcon fontSize="small" />;
      case 'facturada': return <ReceiptIcon fontSize="small" />;
      case 'pagada': return <CheckCircleIcon fontSize="small" />;
      case 'vencida': return <WarningIcon fontSize="small" />;
      default: return <ScheduleIcon fontSize="small" />;
    }
  };

  // ========================================
  // � FUNCIÓN TEMPORAL: SINCRONIZAR EMPRESAS
  // ========================================
  
  const sincronizarEmpresas = async () => {
    setSincronizando(true);
    
    try {
      
      // Función para normalizar texto
      const normalizarTexto = (texto) => {
        return texto
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ');
      };
      
      // 1. Cargar TODAS las liquidaciones por sala (sin filtro de usuario)
      const liquidacionesQuery = query(
        collection(db, 'liquidaciones_por_sala')
      );
      const liquidacionesSnapshot = await getDocs(liquidacionesQuery);
      
      
      // 2. Cargar salas desde cache (1 read o 0 si ya esta cargado)
      const salasArray = await loadSalasCache();
      const salasMap = new Map();

      salasArray.forEach(sala => {
        const nombreNormalizado = normalizarTexto(sala.nombre || sala.name || '');
        salasMap.set(nombreNormalizado, sala);
      });
      
      
      // 3. Procesar cada liquidación
      let actualizadas = 0;
      let noEncontradas = 0;
      let errores = 0;
      
      for (const liquidacionDoc of liquidacionesSnapshot.docs) {
        const liquidacion = liquidacionDoc.data();
        const nombreSala = liquidacion.sala?.nombre;
        
        if (!nombreSala) {
          continue;
        }
        
        const nombreSalaNormalizado = normalizarTexto(nombreSala);
        const salaEncontrada = salasMap.get(nombreSalaNormalizado);
        
        if (!salaEncontrada || !salaEncontrada.companyId) {
          noEncontradas++;
          continue;
        }
        
        try {
          // Cargar empresa correcta
          const empresaDoc = await getDoc(doc(db, 'companies', salaEncontrada.companyId));
          
          if (!empresaDoc.exists()) {
            noEncontradas++;
            continue;
          }
          
          const empresaData = empresaDoc.data();
          const empresaActualizada = {
            id: empresaDoc.id,
            nombre: empresaData.name || empresaData.nombre,
            normalizado: (empresaData.name || empresaData.nombre).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
          };
          
          // Actualizar liquidación
          await updateDoc(doc(db, 'liquidaciones_por_sala', liquidacionDoc.id), {
            empresa: empresaActualizada,
            updatedAt: serverTimestamp()
          });
          
          actualizadas++;
          
        } catch (error) {
          console.error(`❌ Error actualizando ${nombreSala}:`, error);
          errores++;
        }
      }
      
      // Mostrar resultado
      const mensaje = `
        ✅ Sincronización completada:
        • ${actualizadas} liquidaciones actualizadas
        ${noEncontradas > 0 ? `• ${noEncontradas} salas no encontradas` : ''}
        ${errores > 0 ? `• ${errores} errores` : ''}
      `;
      
      addNotification(mensaje, actualizadas > 0 ? 'success' : 'warning');
      
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      addNotification('Error al sincronizar empresas: ' + error.message, 'error');
    } finally {
      setSincronizando(false);
    }
  };

  // ========================================
  // �📅 FUNCIONES PARA CÁLCULO DE DÍAS HÁBILES
  // ========================================
  
  // Obtener festivos colombianos con Ley Emiliani aplicada
  const obtenerFestivos = (year) => {
    try {
      const festivosOficiales = festivosColombianos(year);
      
      const festivosEmiliani = [
        "San José", "San Pedro y San Pablo", "Asunción de la Virgen",
        "Día de la Raza", "Todos los Santos", "Independencia de Cartagena",
        "Sagrado Corazón", "Ascensión del Señor", "Corpus Christi"
      ];
      
      const aplicarLeyEmiliani = (fechaString) => {
        try {
          // Crear fecha directamente desde el string YYYY-MM-DD
          const [year, month, day] = fechaString.split('-').map(Number);
          const fecha = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
          const diaSemana = getDay(fecha);
          
          if (diaSemana === 0) {
            return addDays(fecha, 1);
          } else if (diaSemana > 1) {
            return addDays(fecha, 8 - diaSemana);
          } else {
            return fecha;
          }
        } catch (error) {
          console.error('Error aplicando Ley Emiliani a:', fechaString, error);
          return null;
        }
      };
      
      return festivosOficiales.map(festivo => {
        const aplicaEmiliani = festivosEmiliani.some(nombre => 
          festivo.celebration.includes(nombre)
        );
        
        if (aplicaEmiliani) {
          const fechaCorregida = aplicarLeyEmiliani(festivo.holiday);
          if (fechaCorregida) {
            const year = fechaCorregida.getFullYear();
            const month = String(fechaCorregida.getMonth() + 1).padStart(2, '0');
            const day = String(fechaCorregida.getDate()).padStart(2, '0');
            return {
              date: `${year}-${month}-${day}`,
              name: festivo.celebration
            };
          }
        }
        
        return {
          date: festivo.holiday,
          name: festivo.celebration
        };
      }).filter(Boolean); // Filtrar nulls
    } catch (error) {
      console.error('Error obteniendo festivos:', error);
      return [];
    }
  };
  
  // Verificar si un día es hábil
  const esHabil = (fecha, holidays) => {
    try {
      const dayOfWeek = getDay(fecha);
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Formatear fecha manualmente para evitar problemas con toISOString
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const fechaISO = `${year}-${month}-${day}`;
      
      const isHoliday = holidays.some(holiday => holiday.date === fechaISO);
      
      return !isWeekendDay && !isHoliday;
    } catch (error) {
      console.error('Error en esHabil:', error, fecha);
      return false;
    }
  };
  
  // Sumar días hábiles desde una fecha base
  const sumarDiasHabiles = (fechaBase, diasAsumar, holidays) => {
    let fecha = addDays(new Date(fechaBase), 1);
    let contador = 0;
    let iteraciones = 0;
    const MAX_ITERACIONES = 100; // Límite de seguridad
    
    while (contador < diasAsumar && iteraciones < MAX_ITERACIONES) {
      if (esHabil(fecha, holidays)) {
        contador++;
      }
      if (contador < diasAsumar) {
        fecha = addDays(fecha, 1);
      }
      iteraciones++;
    }
    
    if (iteraciones >= MAX_ITERACIONES) {
    }
    
    return fecha;
  };
  
  // Calcular el décimo día hábil del mes (para Coljuegos)
  const calcularDecimoHabil = (year, month) => {
    const holidays = obtenerFestivos(year);
    const fechaBase = new Date(year, month, 0); // Último día del mes anterior
    return sumarDiasHabiles(fechaBase, 10, holidays);
  };
  
  // ========================================
  // 📄 GENERACIÓN DE PDF
  // ========================================
  
  // Generar PDF profesional
  const generarPDF = async (liquidacion) => {
    try {
      addNotification('Generando documento PDF...', 'info');
      
      // Cargar detalles completos de la liquidación
      const liquidacionDoc = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacion.id));
      
      if (!liquidacionDoc.exists()) {
        addNotification('No se encontró la liquidación', 'error');
        return;
      }

      const datosCompletos = liquidacionDoc.data();
      
      // Función para normalizar texto (eliminar tildes, mayúsculas y caracteres especiales)
      const normalizarTexto = (texto) => {
        if (!texto) return '';
        return texto
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ') // Normalizar espacios múltiples
          .replace(/[^\w\s]/g, ''); // Eliminar caracteres especiales excepto espacios y letras
      };
      
      // Función para comparar nombres con similitud
      const calcularSimilitud = (str1, str2) => {
        const s1 = normalizarTexto(str1);
        const s2 = normalizarTexto(str2);
        
        // Si son exactamente iguales después de normalizar
        if (s1 === s2) return 100;
        
        // Si uno contiene al otro
        if (s1.includes(s2) || s2.includes(s1)) return 90;
        
        // Calcular palabras en común
        const palabras1 = s1.split(' ').filter(p => p.length > 2);
        const palabras2 = s2.split(' ').filter(p => p.length > 2);
        
        if (palabras1.length === 0 || palabras2.length === 0) return 0;
        
        const palabrasComunes = palabras1.filter(p => palabras2.includes(p)).length;
        const totalPalabras = Math.max(palabras1.length, palabras2.length);
        
        return (palabrasComunes / totalPalabras) * 80;
      };
      
      // Cargar datos completos de la sala (CLIENTE)
      let datosSala = datosCompletos.sala || {};
      
      // Intentar cargar datos completos de la sala desde Firestore
      const nombreSalaOriginal = datosCompletos.sala?.nombre || '';
      
      if (nombreSalaOriginal) {
        try {
          // Primero intentar con ID si existe
          if (datosCompletos.sala?.id || datosCompletos.salaId) {
            const salaId = datosCompletos.sala?.id || datosCompletos.salaId;
            const salaDoc = await getDoc(doc(db, 'salas', salaId));
            if (salaDoc.exists()) {
              const salaData = salaDoc.data();
              datosSala = {
                id: salaDoc.id,
                nombre: salaData.nombre || salaData.name || datosSala.nombre,
                direccion: salaData.direccion || salaData.address || datosSala.direccion,
                ciudad: salaData.ciudad || salaData.city || null,
                propietario: salaData.contactoAutorizado || null,
                telefono: salaData.contactPhone || salaData.telefono || null,
                email: salaData.contactEmail || salaData.email || null,
                administracion: salaData.administracion || 0,
                conexion: salaData.conexion || 0
              };
            }
          } else {
            // Si no hay ID, buscar por nombre con similitud (usando cache)
            const salasParaBusqueda = await loadSalasCache();

            let mejorCoincidencia = null;
            let mejorSimilitud = 0;

            salasParaBusqueda.forEach((sala) => {
              const nombreSalaDB = sala.nombre || sala.name || '';

              if (nombreSalaDB) {
                const similitud = calcularSimilitud(nombreSalaOriginal, nombreSalaDB);

                // Si la similitud es mayor al 75%, considerarla candidata
                if (similitud > mejorSimilitud && similitud >= 75) {
                  mejorSimilitud = similitud;
                  mejorCoincidencia = sala;
                }
              }
            });
            
            if (mejorCoincidencia) {
              datosSala = {
                id: mejorCoincidencia.id,
                nombre: mejorCoincidencia.nombre || mejorCoincidencia.name || datosSala.nombre,
                direccion: mejorCoincidencia.direccion || mejorCoincidencia.address || datosSala.direccion,
                ciudad: mejorCoincidencia.ciudad || mejorCoincidencia.city || null,
                propietario: mejorCoincidencia.contactoAutorizado || null,
                telefono: mejorCoincidencia.contactPhone || mejorCoincidencia.telefono || null,
                email: mejorCoincidencia.contactEmail || mejorCoincidencia.email || null,
                administracion: mejorCoincidencia.administracion || 0,
                conexion: mejorCoincidencia.conexion || 0
              };
            } else {
            }
          }
        } catch (error) {
        }
      }
      
      // Cargar datos de la empresa (PRESTADOR)
      let datosEmpresa = datosCompletos.empresa || {};
      
      // Intentar cargar datos completos de la empresa desde Firestore
      let empresaId = datosCompletos.empresa?.id || datosCompletos.empresaId;
      
      // Si no tenemos ID pero tenemos el nombre, buscar por nombre
      if (!empresaId && datosCompletos.empresa?.nombre) {
        try {
          const empresasQuery = query(
            collection(db, 'companies'),
            where('name', '==', datosCompletos.empresa.nombre)
          );
          const empresasSnapshot = await getDocs(empresasQuery);
          if (!empresasSnapshot.empty) {
            empresaId = empresasSnapshot.docs[0].id;
          }
        } catch (error) {
        }
      }
      
      // Cargar documento completo de la empresa
      if (empresaId) {
        try {
          const empresaDoc = await getDoc(doc(db, 'companies', empresaId));
          if (empresaDoc.exists()) {
            const empresaData = empresaDoc.data();
            datosEmpresa = {
              id: empresaDoc.id,
              nombre: empresaData.name || empresaData.nombre || datosEmpresa.nombre,
              nit: empresaData.taxId || empresaData.nit || 'N/A',
              contratoColjuegos: empresaData.contratoColjuegos || empresaData.contractNumber || empresaData.contratoColJuegos || empresaData.contractNum || null,
              direccion: empresaData.address || empresaData.direccion || null,
              telefono: empresaData.phone || empresaData.telefono || null,
              logo: empresaData.logoURL || empresaData.logo || empresaData.logoUrl || null,
              // Datos bancarios
              bankAccount: empresaData.bankAccount || null,
              bankName: empresaData.bankName || null,
              accountType: empresaData.accountType || 'Ahorros'
            };
          }
        } catch (error) {
        }
      } else {
      }
      
      const fechaEmision = new Date();
      
      // Calcular fecha de vencimiento: décimo día hábil del mes SIGUIENTE al periodo liquidado
      let fechaVencimiento;
      
      try {
        const periodoLiquidacion = datosCompletos.fechas?.periodoLiquidacion;
        
        if (periodoLiquidacion) {
          // Parsear el periodo
          let añoPeriodo, mesPeriodo;
          
          if (periodoLiquidacion.includes('-')) {
            // Formato: "2025-09"
            const partes = periodoLiquidacion.split('-');
            añoPeriodo = parseInt(partes[0]);
            mesPeriodo = parseInt(partes[1]); // 1-12
          } else if (periodoLiquidacion.includes('_')) {
            // Formato: "septiembre_2025"
            const meses = {
              'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
              'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
            };
            const partes = periodoLiquidacion.toLowerCase().split('_');
            mesPeriodo = meses[partes[0]];
            añoPeriodo = parseInt(partes[1]);
          } else {
            // Formato: "Septiembre 2025"
            const meses = {
              'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
              'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
            };
            const partes = periodoLiquidacion.toLowerCase().split(' ');
            mesPeriodo = meses[partes[0]];
            añoPeriodo = parseInt(partes[1]);
          }
          
          
          // Calcular mes de vencimiento (siguiente al periodo)
          // mesPeriodo está en base 1 (1-12), calcularDecimoHabil espera base 0 (0-11)
          let mesVencimiento = mesPeriodo - 1; // Convertir a base 0
          let añoVencimiento = añoPeriodo;
          
          // Si es diciembre (11 en base 0), pasar a enero (0) del siguiente año
          if (mesVencimiento === 11) {
            mesVencimiento = 0;
            añoVencimiento++;
          } else {
            mesVencimiento++; // Siguiente mes
          }
          
          
          // Calcular décimo día hábil
          fechaVencimiento = calcularDecimoHabil(añoVencimiento, mesVencimiento);
        } else {
          // Fallback: mes siguiente al actual
          const mesActual = fechaEmision.getMonth();
          const añoActual = fechaEmision.getFullYear();
          const mesSiguiente = mesActual === 11 ? 0 : mesActual + 1;
          const añoSiguiente = mesActual === 11 ? añoActual + 1 : añoActual;
          fechaVencimiento = calcularDecimoHabil(añoSiguiente, mesSiguiente);
        }
        
      } catch (error) {
        console.error('❌ Error calculando fecha de vencimiento:', error);
        // Fallback: 30 días desde hoy
        fechaVencimiento = addDays(fechaEmision, 30);
      }

      // Crear documento PDF
      const pdf = new jsPDF();
      
      // 🎨 PALETA DE COLORES CORPORATIVA - FORMATO PYTHON (DR Group)
      const BRAND_COLORS = {
        titleBg: [11, 48, 64],        // #0B3040 - Azul oscuro corporativo
        subtitleBg: [26, 95, 122],    // #1A5F7A - Azul medio
        metricsBg: [51, 65, 85],      // #334155 - Gris azulado
        white: [255, 255, 255],       // #FFFFFF - Texto claro
        textDark: [34, 51, 68],       // #223344 - Texto oscuro
        borderMedium: [192, 204, 218] // #C0CCDA - Bordes
      };
      
      // Función auxiliar para convertir imagen a Base64
      const getBase64Image = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = (error) => reject(error);
          img.src = url;
        });
      };

      // ========================================
      // 📋 HEADER CORPORATIVO - FORMATO PYTHON
      // ========================================
      
      // Fondo principal azul oscuro corporativo (#0B3040)
      pdf.setFillColor(...BRAND_COLORS.titleBg);
      pdf.rect(0, 0, 210, 50, 'F');
      
      // Cargar y mostrar logo
      const logoUrl = datosEmpresa.logo || datosEmpresa.logoURL || datosEmpresa.logoUrl;
      if (logoUrl) {
        try {
          const logoBase64 = await getBase64Image(logoUrl);
          
          // Contenedor blanco redondeado para el logo
          pdf.setFillColor(...BRAND_COLORS.white);
          pdf.roundedRect(15, 12, 35, 26, 3, 3, 'F');
          
          // Logo centrado dentro del contenedor
          pdf.addImage(logoBase64, 'PNG', 17.5, 14.5, 30, 21);
        } catch (error) {
        }
      }
      
      // Título principal - Derecha del logo
      pdf.setTextColor(...BRAND_COLORS.white);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text('CUENTA DE COBRO', 55, 22);
      
      // Subtítulo con nombre de empresa
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(datosEmpresa.nombre || datosEmpresa.name || '', 55, 30);
      
      // Fecha de generación - Esquina superior derecha
      pdf.setFontSize(9);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`, 145, 20);
      
      // Línea decorativa bajo el header
      pdf.setDrawColor(...BRAND_COLORS.borderMedium);
      pdf.setLineWidth(0.5);
      pdf.line(10, 52, 200, 52);
      
      // ========================================
      // 📄 INFORMACIÓN DEL PRESTADOR Y CLIENTE
      // ========================================
      
      // Información del PRESTADOR (Empresa) - Columna izquierda
      let yPos = 60;
      pdf.setTextColor(...BRAND_COLORS.textDark);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      // Título con fondo azul medio
      pdf.setFillColor(...BRAND_COLORS.subtitleBg);
      pdf.rect(15, yPos - 4, 85, 8, 'F');
      pdf.setTextColor(...BRAND_COLORS.white);
      pdf.text('DATOS DEL PRESTADOR', 18, yPos + 1);
      
      yPos += 8;
      pdf.setTextColor(...BRAND_COLORS.textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(datosEmpresa.nombre || datosEmpresa.name || 'N/A', 18, yPos);
      yPos += 5;
      pdf.text(`NIT: ${datosEmpresa.nit || datosEmpresa.taxId || 'N/A'}`, 18, yPos);
      yPos += 5;
      if (datosEmpresa.contratoColjuegos) {
        pdf.text(`Contrato Coljuegos: ${datosEmpresa.contratoColjuegos}`, 18, yPos);
        yPos += 5;
      }
      if (datosEmpresa.direccion || datosEmpresa.address) {
        pdf.text(`Dirección: ${datosEmpresa.direccion || datosEmpresa.address}`, 18, yPos);
        yPos += 5;
      }
      if (datosEmpresa.telefono || datosEmpresa.phone) {
        pdf.text(`Teléfono: ${datosEmpresa.telefono || datosEmpresa.phone}`, 18, yPos);
        yPos += 5;
      }
      
      // Información del CLIENTE (Sala) - Columna izquierda
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      
      // Título con fondo azul medio
      pdf.setFillColor(...BRAND_COLORS.subtitleBg);
      pdf.rect(15, yPos - 4, 85, 8, 'F');
      pdf.setTextColor(...BRAND_COLORS.white);
      pdf.text('DATOS DEL CLIENTE', 18, yPos + 1);
      
      yPos += 8;
      pdf.setTextColor(...BRAND_COLORS.textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      // Propietario (contacto principal)
      if (datosSala.propietario) {
        pdf.text(`Propietario: ${datosSala.propietario}`, 18, yPos);
        yPos += 5;
      }
      
      // Nombre de la sala
      pdf.text(`Sala: ${datosSala.nombre || 'N/A'}`, 18, yPos);
      yPos += 5;
      
      // Dirección
      if (datosSala.direccion) {
        pdf.text(`Dirección: ${datosSala.direccion}`, 18, yPos);
        yPos += 5;
      }
      
      // Ciudad
      if (datosSala.ciudad) {
        pdf.text(`Ciudad: ${datosSala.ciudad}`, 18, yPos);
        yPos += 5;
      }
      
      // Teléfono
      if (datosSala.telefono) {
        pdf.text(`Teléfono: ${datosSala.telefono}`, 18, yPos);
        yPos += 5;
      }
      
      // Email
      if (datosSala.email) {
        pdf.text(`Email: ${datosSala.email}`, 18, yPos);
        yPos += 5;
      }
      
      // Guardar posición final de la columna izquierda
      const yPosIzquierda = yPos;
      
      // Columna derecha - Información del documento
      let yPosDerecha = 60;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      
      // Título con fondo azul medio
      pdf.setFillColor(...BRAND_COLORS.subtitleBg);
      pdf.rect(110, yPosDerecha - 4, 85, 8, 'F');
      pdf.setTextColor(...BRAND_COLORS.white);
      pdf.text('INFORMACIÓN DEL DOCUMENTO', 113, yPosDerecha + 1);
      
      yPosDerecha += 8;
      pdf.setTextColor(...BRAND_COLORS.textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Período: ${formatearPeriodo(datosCompletos.fechas?.periodoLiquidacion)}`, 113, yPosDerecha);
      yPosDerecha += 5;
      pdf.text(`Fecha Emisión: ${fechaEmision.toLocaleDateString('es-CO')}`, 113, yPosDerecha);
      yPosDerecha += 5;
      pdf.text(`Fecha Vencimiento: ${fechaVencimiento.toLocaleDateString('es-CO')}`, 113, yPosDerecha);
      
      // ========================================
      // 📊 RESUMEN DE PRODUCCIÓN Y MÁQUINAS - Tabla en columna derecha
      // ========================================
      
      yPosDerecha += 10;
      
      // Preparar datos necesarios
      const totalProduccion = datosCompletos.metricas?.totalProduccion || 0;
      const totalMaquinas = datosCompletos.metricas?.totalMaquinas || 0;
      const administracionPorMaquina = datosSala.administracion || 0;
      const conexionPorMaquina = datosSala.conexion || 0;
      
      // Datos para la mini tabla
      const resumenData = [
        ['Total de Producción:', formatearMonto(totalProduccion)],
        ['Total de Máquinas:', totalMaquinas.toString()],
        ['Administración (por máquina):', formatearMonto(administracionPorMaquina)],
        ['Conexión (por máquina):', formatearMonto(conexionPorMaquina)]
      ];
      
      // Tabla compacta con diseño corporativo
      autoTable(pdf, {
        startY: yPosDerecha - 4,
        head: [['RESUMEN', '']],
        body: resumenData,
        theme: 'plain',
        margin: { left: 110 },
        tableWidth: 85,
        headStyles: {
          fillColor: BRAND_COLORS.subtitleBg,  // #1A5F7A - Azul medio corporativo
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'left',
          cellPadding: { top: 2, right: 2, bottom: 2, left: 3 },
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: BRAND_COLORS.textDark,
          cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 3 }, // Padding más compacto
          minCellHeight: 5 // Altura mínima de celda más pequeña
        },
        columnStyles: {
          0: { cellWidth: 52, halign: 'left', fontStyle: 'normal' },
          1: { cellWidth: 33, halign: 'right', fontStyle: 'bold', cellPadding: { top: 1.5, right: 0, bottom: 1.5, left: 2 } } // Sin padding derecho para alineación perfecta
        },
        didDrawPage: function (data) {
          yPosDerecha = data.cursor.y;
        }
      });
      
      // Calcular la posición más baja entre ambas columnas y agregar margen
      const yPosFinal = Math.max(yPosIzquierda, yPosDerecha) + 8;
      
      // Línea separadora con color corporativo
      pdf.setDrawColor(...BRAND_COLORS.borderMedium);
      pdf.setLineWidth(0.5);
      pdf.line(15, yPosFinal, 195, yPosFinal);
      
      // Actualizar yPos para siguiente sección
      yPos = yPosFinal;
      
      // ========================================
      // 📊 TABLA DE CONCEPTOS - FORMATO PYTHON
      // ========================================
      
      yPos += 10;
      pdf.setTextColor(...BRAND_COLORS.textDark);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('DETALLE DE LIQUIDACIÓN', 15, yPos);
      
      yPos += 5;
      
      // Preparar datos para la tabla
      const derechosExplotacion = datosCompletos.metricas?.derechosExplotacion || 0;
      const gastosAdministracion = datosCompletos.metricas?.gastosAdministracion || 0;
      const totalImpuestos = datosCompletos.metricas?.totalImpuestos || 0;
      
      // Calcular totales
      const totalAdministracion = administracionPorMaquina * totalMaquinas;
      const totalConexion = conexionPorMaquina * totalMaquinas;
      const totalAPagar = derechosExplotacion + gastosAdministracion + totalAdministracion + totalConexion;
      
      
      const tableData = [
        ['Derechos de Explotación', formatearMonto(derechosExplotacion)],
        ['Gastos de Administración', formatearMonto(gastosAdministracion)],
        ['Total Administración (' + totalMaquinas + ' máquinas)', formatearMonto(totalAdministracion)],
        ['Total Conexión (' + totalMaquinas + ' máquinas)', formatearMonto(totalConexion)]
      ];
      
      // Tabla con diseño corporativo Python
      autoTable(pdf, {
        startY: yPos,
        head: [['Concepto', 'Valor']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: BRAND_COLORS.titleBg,       // #0B3040 - Azul oscuro corporativo
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
          lineWidth: 0.1,
          lineColor: BRAND_COLORS.borderMedium
        },
        bodyStyles: {
          fontSize: 9,
          textColor: BRAND_COLORS.textDark,
          lineWidth: 0.1,
          lineColor: BRAND_COLORS.borderMedium
        },
        columnStyles: {
          0: { cellWidth: 130, halign: 'left' },
          1: { cellWidth: 50, halign: 'right' }
        },
        margin: { left: 15, right: 15 },
        didDrawPage: function (data) {
          pdf.lastTableY = data.cursor.y;
        }
      });
      
      // ========================================
      // 💰 TOTAL A PAGAR - FORMATO PYTHON
      // ========================================
      
      const finalY = (pdf.lastTableY || yPos + 40) + 10;
      
      // Verificar si necesitamos una nueva página
      const pageHeight = pdf.internal.pageSize.height;
      if (finalY > pageHeight - 80) {
        pdf.addPage();
        yPos = 20; // Reiniciar posición en nueva página
      }
      
      // Fondo azul medio corporativo (#1A5F7A)
      pdf.setFillColor(...BRAND_COLORS.subtitleBg);
      pdf.rect(15, finalY, 180, 15, 'F');
      
      pdf.setTextColor(...BRAND_COLORS.white);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL A PAGAR:', 20, finalY + 10);
      pdf.text(formatearMonto(totalAPagar), 190, finalY + 10, { align: 'right' });
      
      // ========================================
      // 💳 INFORMACIÓN BANCARIA Y TÉRMINOS - FORMATO PYTHON
      // ========================================
      
      let infoY = finalY + 25;
      
      // Verificar si necesitamos nueva página
      if (infoY > pageHeight - 60) {
        pdf.addPage();
        infoY = 20;
      }
      
      // COLUMNA IZQUIERDA: INFORMACIÓN PARA PAGO
      if (datosEmpresa.bankAccount && datosEmpresa.bankName) {
        pdf.setTextColor(...BRAND_COLORS.textDark);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        // Título con fondo gris azulado (#334155)
        pdf.setFillColor(...BRAND_COLORS.metricsBg);
        pdf.rect(15, infoY - 4, 85, 8, 'F');
        pdf.setTextColor(...BRAND_COLORS.white);
        pdf.text('INFORMACIÓN PARA PAGO', 18, infoY + 1);
        
        let leftY = infoY + 8;
        pdf.setTextColor(...BRAND_COLORS.textDark);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`Banco: ${datosEmpresa.bankName}`, 18, leftY);
        leftY += 5;
        pdf.text(`Tipo de Cuenta: ${datosEmpresa.accountType || 'Ahorros'}`, 18, leftY);
        leftY += 5;
        pdf.text(`Número de Cuenta: ${datosEmpresa.bankAccount}`, 18, leftY);
        leftY += 5;
        pdf.text(`Titular: ${datosEmpresa.nombre || 'DR Group SAS'}`, 18, leftY);
      } else {
      }
      
      // COLUMNA DERECHA: TÉRMINOS Y CONDICIONES
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      
      // Título con fondo gris azulado
      pdf.setFillColor(...BRAND_COLORS.metricsBg);
      pdf.rect(110, infoY - 4, 85, 8, 'F');
      pdf.setTextColor(...BRAND_COLORS.white);
      pdf.text('TÉRMINOS Y CONDICIONES', 113, infoY + 1);
      
      let rightY = infoY + 8;
      pdf.setTextColor(...BRAND_COLORS.textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('• Forma de pago: Transferencia o', 113, rightY);
      rightY += 3.5;
      pdf.text('  Consignación bancaria', 113, rightY);
      rightY += 4;
      pdf.text('• Fecha límite de pago: Décimo día hábil', 113, rightY);
      rightY += 3.5;
      pdf.text('  del mes', 113, rightY);
      rightY += 4;
      pdf.text('• Tan pronto realice la consignación o', 113, rightY);
      rightY += 3.5;
      pdf.text('  transferencia por favor remita el', 113, rightY);
      rightY += 3.5;
      pdf.text('  comprobante de pago', 113, rightY);
      
      // ========================================
      // 🔖 FOOTER CORPORATIVO - FORMATO PYTHON
      // ========================================
      
      // Obtener número total de páginas
      const totalPages = pdf.internal.pages.length - 1;
      
      // Agregar footer a todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const currentPageHeight = pdf.internal.pageSize.height;
        
        // Línea superior del footer
        pdf.setDrawColor(...BRAND_COLORS.borderMedium);
        pdf.setLineWidth(0.3);
        pdf.line(15, currentPageHeight - 20, 195, currentPageHeight - 20);
        
        // Texto del footer
        pdf.setTextColor(...BRAND_COLORS.textDark);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Documento generado por ${datosEmpresa.nombre || datosEmpresa.name || 'DR Group'}`, 105, currentPageHeight - 14, { align: 'center' });
        pdf.setFontSize(7);
        pdf.text(`Fecha de generación: ${new Date().toLocaleString('es-CO')}`, 105, currentPageHeight - 10, { align: 'center' });
        
        // Marca de agua corporativa y número de página
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(6);
        pdf.text('DR Group Dashboard - Sistema de Facturación', 105, currentPageHeight - 6, { align: 'center' });
        pdf.text(`Página ${i} de ${totalPages}`, 195, currentPageHeight - 6, { align: 'right' });
      }
      
      // Guardar PDF
      const nombreArchivo = `Cuenta_Cobro_${datosEmpresa.nombre?.replace(/\s+/g, '_') || 'Empresa'}_${datosSala.nombre?.replace(/\s+/g, '_')}_${formatearPeriodo(datosCompletos.fechas?.periodoLiquidacion).replace(/\s+/g, '_')}.pdf`;
      pdf.save(nombreArchivo);
      
      // Actualizar estado en Firestore
      await updateDoc(doc(db, 'liquidaciones_por_sala', liquidacion.id), {
        estadoFacturacion: 'facturada',
        fechaFacturacion: serverTimestamp(),
        fechaVencimiento: fechaVencimiento,
        pdfGenerado: true,
        nombreArchivoPDF: nombreArchivo
      });
      
      addNotification('✅ Documento PDF generado y descargado correctamente', 'success');
    } catch (error) {
      console.error('Error generando PDF:', error);
      addNotification('❌ Error al generar documento PDF', 'error');
    }
  };

  // Descargar PDF existente
  const descargarPDF = async (liquidacion) => {
    try {
      // Si ya tiene PDF generado, regenerarlo con los mismos datos
      addNotification('Descargando documento PDF...', 'info');
      
      // Re-generar el PDF (ya que no guardamos el archivo en storage por ahora)
      await generarPDF(liquidacion);
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      addNotification('Error al descargar documento', 'error');
    }
  };

  // Enviar por email (placeholder)
  const enviarEmail = async (liquidacion) => {
    try {
      addNotification('Enviando documento por email...', 'info');
      
      // TODO: Implementar envío por email
      
      setTimeout(() => {
        addNotification('📧 Funcionalidad de email pendiente de implementar', 'info');
      }, 1000);
      
    } catch (error) {
      console.error('Error enviando email:', error);
      addNotification('Error al enviar email', 'error');
    }
  };

  // Registrar pago
  const registrarPago = async () => {
    try {
      const liquidacion = dialogRegistrarPago.liquidacion;
      if (!liquidacion) return;

      await updateDoc(doc(db, 'liquidaciones_por_sala', liquidacion.id), {
        estadoFacturacion: 'pagada',
        fechaPago: serverTimestamp()
      });

      addNotification('Pago registrado correctamente', 'success');
      setDialogRegistrarPago({ open: false, liquidacion: null });
    } catch (error) {
      console.error('Error registrando pago:', error);
      addNotification('Error al registrar pago', 'error');
    }
  };

  // Ver detalles
  const verDetalles = async (liquidacion) => {
    try {
      const liquidacionDoc = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacion.id));
      
      if (liquidacionDoc.exists()) {
        const data = liquidacionDoc.data();
        if (data.datosConsolidados && Array.isArray(data.datosConsolidados)) {
          setDatosDetalles(data.datosConsolidados);
          
          // Función para normalizar texto
          const normalizarTexto = (texto) => {
            return texto
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim()
              .replace(/\s+/g, ' ');
          };
          
          // Cargar datos de la sala usando búsqueda normalizada
          let datosAdicionales = {};
          const nombreSala = data.sala?.nombre;
          
          if (nombreSala) {
            try {
              // Buscar sala por nombre normalizado (usando cache)
              const salasParaPreview = await loadSalasCache();
              const nombreSalaNormalizado = normalizarTexto(nombreSala);

              let salaEncontrada = null;
              salasParaPreview.forEach(sala => {
                const nombreNormalizado = normalizarTexto(sala.nombre || sala.name || '');

                if (nombreNormalizado === nombreSalaNormalizado) {
                  salaEncontrada = sala;
                }
              });
              
              if (salaEncontrada) {
                
                datosAdicionales = {
                  administracion: salaEncontrada.administracion || 0,
                  conexion: salaEncontrada.conexion || 0,
                  contactoAutorizado: salaEncontrada.contactoAutorizado || 'N/A',
                  ciudad: salaEncontrada.ciudad || 'N/A'
                };
                
              } else {
              }
            } catch (salaError) {
              console.error('Error cargando datos de sala:', salaError);
            }
          }
          
          setDialogVistaPrevia({ 
            open: true, 
            liquidacion: { id: liquidacionDoc.id, ...data },
            datosAdicionales 
          });
        }
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
      addNotification('Error al cargar detalles', 'error');
    }
  };

  // Componente de estadísticas
  const EstadisticasResumen = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, mr: 2 }}>
                <ScheduleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{estadisticas?.pendientes || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Pendientes</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, mr: 2 }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{estadisticas?.facturadas || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Facturadas</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, mr: 2 }}>
                <CheckCircleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{estadisticas?.pagadas || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Pagadas</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, mr: 2 }}>
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatearMonto(estadisticas?.montos?.total)}</Typography>
                <Typography variant="body2" color="textSecondary">Total</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Componente de filtros
  const PanelFiltros = () => (
    <Card sx={{ mb: 3, borderRadius: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Filtros</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select 
                value={filtros.empresa} 
                label="Empresa" 
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltros.empresas.map(empresa => (
                  <MenuItem key={empresa} value={empresa}>{empresa}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select value={filtros.periodo} label="Período" onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}>
                <MenuItem value="">Todos</MenuItem>
                {opcionesFiltros.periodos.map(periodo => (
                  <MenuItem key={periodo} value={periodo}>{formatearPeriodo(periodo)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Autocomplete
              size="small"
              options={opcionesFiltros.salas}
              value={filtros.sala || null}
              onChange={(event, newValue) => {
                setFiltros({ ...filtros, sala: newValue || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sala"
                  placeholder="Buscar sala..."
                />
              )}
              noOptionsText="No se encontraron salas"
              clearText="Limpiar"
              openText="Abrir"
              closeText="Cerrar"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={filtros.estado} label="Estado" onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="facturada">Facturada</MenuItem>
                <MenuItem value="pagada">Pagada</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Box display="flex" gap={1} height="100%">
              <Button variant="contained" onClick={aplicarFiltros} fullWidth size="small" sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none' }}>
                Aplicar
              </Button>
              <Button variant="outlined" onClick={limpiarFiltros} fullWidth size="small" sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none' }}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) return <PageSkeleton variant="table" kpiCount={4} />;

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ✅ Validar acceso a la página
  if (!hasPageAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="h6">⛔ Acceso Denegado</Typography>
          <Typography sx={{ mt: 1 }}>
            No tienes permisos para acceder a Cuentas de Cobro.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Contacta al administrador si necesitas acceso a esta sección.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        borderRadius: 1,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="overline" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1.2 }}>
            GESTIÓN FINANCIERA • FACTURACIÓN Y COBRO
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <ReceiptIcon sx={{ fontSize: '2rem' }} />
            Cuentas de Cobro y Facturación
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.5 }}>
            Generación de documentos y seguimiento de pagos por sala
          </Typography>
        </Box>
      </Paper>

      {/* Estadísticas - Solo mostrar si hay filtros aplicados */}
      {estadisticas && Object.values(filtrosAplicados || {}).some(f => f && f.trim && f.trim()) && <EstadisticasResumen />}

      {/* Filtros */}
      <PanelFiltros />

      {/* Tabla principal */}
      <Card sx={{ borderRadius: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Empresa / Sala</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Monto Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {liquidaciones.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <FilterIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">
                          {Object.values(filtrosAplicados || {}).some(f => f && f.trim && f.trim()) 
                            ? 'No se encontraron liquidaciones con los filtros aplicados'
                            : 'Selecciona filtros para ver las liquidaciones'
                          }
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          {Object.values(filtrosAplicados || {}).some(f => f && f.trim && f.trim())
                            ? 'Intenta modificar los criterios de búsqueda'
                            : 'Usa los filtros de arriba para buscar liquidaciones por empresa, periodo, sala o estado'
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {liquidaciones.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((liquidacion) => (
                  <TableRow key={liquidacion.id} sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) } }}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">{liquidacion.empresa?.nombre}</Typography>
                        <Typography variant="caption" color="textSecondary">{liquidacion.sala?.nombre}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatearPeriodo(liquidacion.fechas?.periodoLiquidacion)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {formatearMonto(liquidacion.metricas?.totalImpuestos)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={obtenerIconoEstado(liquidacion.estadoFacturacion)}
                        label={liquidacion.estadoFacturacion || 'Pendiente'}
                        color={obtenerColorEstado(liquidacion.estadoFacturacion)}
                        size="small"
                        sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" onClick={() => verDetalles(liquidacion)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {liquidacion.estadoFacturacion === 'pendiente' && (
                          <Tooltip title="Generar documento">
                            <IconButton size="small" color="primary" onClick={() => generarPDF(liquidacion)}>
                              <PdfIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {liquidacion.estadoFacturacion === 'facturada' && (
                          <>
                            <Tooltip title="Descargar PDF">
                              <IconButton size="small" color="primary" onClick={() => descargarPDF(liquidacion)}>
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Enviar por email">
                              <IconButton size="small" color="secondary" onClick={() => enviarEmail(liquidacion)}>
                                <EmailIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Registrar pago">
                              <IconButton size="small" color="success" onClick={() => setDialogRegistrarPago({ open: true, liquidacion })}>
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {liquidacion.estadoFacturacion === 'pagada' && (
                          <Tooltip title="Descargar PDF">
                            <IconButton size="small" color="primary" onClick={() => descargarPDF(liquidacion)}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {liquidaciones.length > 0 && (
            <TablePagination
              component="div"
              count={liquidaciones.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          )}

          {liquidaciones.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                No se encontraron liquidaciones aprobadas para facturar
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog Vista Previa */}
      <Dialog open={dialogVistaPrevia.open} onClose={() => setDialogVistaPrevia({ open: false, liquidacion: null, datosAdicionales: {} })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ReceiptIcon />
            <Typography variant="h6">Vista Previa - Cuenta de Cobro</Typography>
          </Box>
          <IconButton onClick={() => setDialogVistaPrevia({ open: false, liquidacion: null, datosAdicionales: {} })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {dialogVistaPrevia.liquidacion && (() => {
            const metricas = dialogVistaPrevia.liquidacion.metricas || {};
            const datosAdicionales = dialogVistaPrevia.datosAdicionales || {};
            
            // Extraer valores
            const produccion = metricas.totalProduccion || 0;
            const derechosExplotacion = metricas.derechosExplotacion || 0;
            const gastosAdministracion = metricas.gastosAdministracion || 0;
            const totalMaquinas = metricas.totalMaquinas || 0;
            const administracion = datosAdicionales.administracion || 0;
            const conexion = datosAdicionales.conexion || 0;
            
            // Calcular totales
            const totalAdministracion = administracion * totalMaquinas;
            const totalConexion = conexion * totalMaquinas;
            const totalAPagar = derechosExplotacion + gastosAdministracion + totalAdministracion + totalConexion;
            
            return (
              <Box>
                <Paper sx={{ p: 3, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom>CUENTA DE COBRO</Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Información General */}
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
                    Información General
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">EMPRESA</Typography>
                      <Typography variant="body2" fontWeight="medium">{dialogVistaPrevia.liquidacion.empresa?.nombre}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">SALA</Typography>
                      <Typography variant="body2" fontWeight="medium">{dialogVistaPrevia.liquidacion.sala?.nombre}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">CIUDAD</Typography>
                      <Typography variant="body2" fontWeight="medium">{datosAdicionales.ciudad || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">PROPIETARIO</Typography>
                      <Typography variant="body2" fontWeight="medium">{datosAdicionales.contactoAutorizado || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">PERÍODO</Typography>
                      <Typography variant="body2" fontWeight="medium">{formatearPeriodo(dialogVistaPrevia.liquidacion.fechas?.periodoLiquidacion)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">TOTAL DE MÁQUINAS</Typography>
                      <Typography variant="body2" fontWeight="medium">{totalMaquinas}</Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Desglose Financiero */}
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
                    Desglose Financiero
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">PRODUCCIÓN</Typography>
                      <Typography variant="body2" fontWeight="medium">{formatearMonto(produccion)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">DERECHOS DE EXPLOTACIÓN</Typography>
                      <Typography variant="body2" fontWeight="medium">{formatearMonto(derechosExplotacion)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">GASTOS DE ADMINISTRACIÓN</Typography>
                      <Typography variant="body2" fontWeight="medium">{formatearMonto(gastosAdministracion)}</Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Costos por Máquina */}
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
                    Costos por Máquina
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">ADMINISTRACIÓN (por máquina)</Typography>
                      <Typography variant="body2" fontWeight="medium">{formatearMonto(administracion)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">CONEXIÓN (por máquina)</Typography>
                      <Typography variant="body2" fontWeight="medium">{formatearMonto(conexion)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">TOTAL ADMINISTRACIÓN ({totalMaquinas} máquinas)</Typography>
                      <Typography variant="body1" fontWeight="600" color="secondary.main">{formatearMonto(totalAdministracion)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">TOTAL CONEXIÓN ({totalMaquinas} máquinas)</Typography>
                      <Typography variant="body1" fontWeight="600" color="secondary.main">{formatearMonto(totalConexion)}</Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Total Final */}
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}>
                    <Typography variant="caption" color="textSecondary">TOTAL A PAGAR</Typography>
                    <Typography variant="h5" fontWeight="700" color="primary.main" gutterBottom>
                      {formatearMonto(totalAPagar)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      Derechos ({formatearMonto(derechosExplotacion)}) + Gastos ({formatearMonto(gastosAdministracion)}) + 
                      Total Admin ({formatearMonto(totalAdministracion)}) + Total Conexión ({formatearMonto(totalConexion)})
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogVistaPrevia({ open: false, liquidacion: null, datosAdicionales: {} })}>Cerrar</Button>
          <Button 
            variant="contained" 
            startIcon={<PdfIcon />}
            onClick={() => {
              if (dialogVistaPrevia.liquidacion) {
                generarPDF(dialogVistaPrevia.liquidacion);
                setDialogVistaPrevia({ open: false, liquidacion: null, datosAdicionales: {} });
              }
            }}
          >
            Generar PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Registrar Pago */}
      <Dialog open={dialogRegistrarPago.open} onClose={() => setDialogRegistrarPago({ open: false, liquidacion: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago Recibido</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Confirma que has recibido el pago de esta cuenta de cobro.
          </Typography>
          {dialogRegistrarPago.liquidacion && (
            <Box>
              <Typography variant="body2"><strong>Sala:</strong> {dialogRegistrarPago.liquidacion.sala?.nombre}</Typography>
              <Typography variant="body2"><strong>Monto:</strong> {formatearMonto(dialogRegistrarPago.liquidacion.metricas?.totalImpuestos)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRegistrarPago({ open: false, liquidacion: null })}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={registrarPago} startIcon={<CheckCircleIcon />}>
            Confirmar Pago
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacturacionPage;
