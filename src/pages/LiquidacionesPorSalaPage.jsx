import React, { useState, useEffect, useMemo } from 'react';
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
  Checkbox,
  Badge,
  FormControlLabel,
  alpha,
  useTheme,
  GlobalStyles
} from '@mui/material';
import { Chip } from '@mui/material';
import {
  Business as BusinessIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import liquidacionPersistenceService from '../services/liquidacionPersistenceService';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import systemConfigService from '../services/systemConfigService';
// Formateador reutilizable para ingreso base manual
const formatearCOPManual = (v) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v || 0);

const LiquidacionesPorSalaPage = () => {
  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [todasLasLiquidaciones, setTodasLasLiquidaciones] = useState([]); // Para opciones de filtros
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    empresa: '',
    periodo: '',
    sala: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  // Estados de UI
  const [dialogDetalles, setDialogDetalles] = useState({ open: false, liquidacion: null });
  const [dialogFacturacion, setDialogFacturacion] = useState({ open: false, liquidacion: null });
  const [dialogEdicion, setDialogEdicion] = useState({ open: false, liquidacion: null });
  
  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Opciones adicionales de edición (tarifa fija, normalización de negativos)
  const [opcionesEdicion, setOpcionesEdicion] = useState({ maquinasNegativasCero: false }); // tarifa fija ahora es por máquina
  // SMMLV actual (para tarifa fija)
  const [smmlvActual, setSmmlvActual] = useState(null);

  // Determinar días del mes de la liquidación (para lógica de tarifa fija 'mes completo')
  const diasDelMesLiquidacion = useMemo(() => {
    try {
      if (!dialogEdicion.liquidacion) return 30; // fallback
      const periodo = dialogEdicion.liquidacion?.fechas?.periodoLiquidacion || dialogEdicion.liquidacion?.periodo;
      if (!periodo) return 30;
      const partes = periodo.split('_');
      if (partes.length < 2) return 30;
      const mesStr = partes[0].toLowerCase();
      const añoNum = parseInt(partes[1], 10) || new Date().getFullYear();
      const mapaMeses = {
        'enero':0,'febrero':1,'marzo':2,'abril':3,'mayo':4,'junio':5,
        'julio':6,'agosto':7,'septiembre':8,'setiembre':8,'octubre':9,'noviembre':10,'diciembre':11
      };
      const mesIndex = mapaMeses[mesStr];
      if (mesIndex == null) return 30;
      const dias = new Date(añoNum, mesIndex + 1, 0).getDate();
      return dias || 30;
    } catch (e) {
      console.warn('No se pudo calcular días del mes, usando 30.', e);
      return 30;
    }
  }, [dialogEdicion.liquidacion]);

  // Cargar SMMLV al abrir el diálogo de edición
  useEffect(() => {
    const cargarSMMLV = async () => {
      if (!dialogEdicion.open) return;
      try {
        // Intentar por service si existe
        let valor = null;
        if (systemConfigService?.getGeneralConfig) {
          const cfg = await systemConfigService.getGeneralConfig();
          valor = cfg?.smmlvActual ?? null;
        }
        if (valor == null) {
          // Fallback directo Firestore
          const generalDoc = await getDoc(doc(db, 'system_config', 'general'));
            if (generalDoc.exists()) {
              valor = generalDoc.data()?.smmlvActual ?? null;
            }
        }
        if (valor != null) setSmmlvActual(Number(valor));
      } catch (e) {
        console.error('Error cargando SMMLV actual:', e);
      }
    };
    cargarSMMLV();
  }, [dialogEdicion.open]);

  // Helper para porcentajes tarifa fija según tipo de apuesta
  const obtenerPorcentajeTarifaFija = (tipo) => {
    if (tipo == null) return 0.30; // fallback
    const t = String(tipo).toLowerCase().trim();
    // Normalizar posibles formatos
    if (/(^|\s)1($|\s)/.test(t) || t === '1') return 0.30;
    if (/(^|\s)2($|\s)/.test(t) || t === '2') return 0.40;
    if (/(^|\s)3($|\s)/.test(t) || t === '3') return 0.45;
    return 0.30; // default
  };

  const calcularTarifaFijaMaquina = (maquina) => {
    if (!smmlvActual) return { derechos: 0, gastos: 0 };
    let dias = (maquina.diasTransmitidos ?? maquina.dias_tx ?? maquina.dias) || 0;
    if (dias < 0) dias = 0;
    const porcentaje = obtenerPorcentajeTarifaFija(maquina.tipoApuesta || maquina.tipo_apuesta || maquina.tipo);
    // Nueva regla:
    // - Si transmitió TODOS los días del mes (>= díasDelMesLiquidacion) => Derechos = SMMLV * %
    // - Si transmitió menos => Derechos = (SMMLV / 30) * dias * %
    let derechos;
    if (dias >= diasDelMesLiquidacion && diasDelMesLiquidacion > 0) {
      derechos = smmlvActual * porcentaje;
    } else {
      derechos = (smmlvActual / 30) * dias * porcentaje;
    }
    const gastos = derechos * 0.01; // 1% de derechos
    return { derechos, gastos };
  };

  // Ajuste solicitado: con "Máquinas negativas a 0" se debe poner en 0 también
  // Derechos de Explotación y Gastos de Administración para máquinas con
  // producción negativa y sin tarifa fija. Al desactivar, se restauran
  // los valores originales.
  const esTotalImpuestosForzadoCero = (m) => {
    if (!opcionesEdicion.maquinasNegativasCero) return false;
    if (m.tarifaFijaActiva) return false;
    return (m.produccion || 0) < 0; // condición de negatividad
  };

  const toggleTarifaFijaFila = (index) => {
    setDatosMaquinasSala(prev => {
      const nuevas = [...prev];
      const m = { ...nuevas[index] };
      const estabaActiva = !!m.tarifaFijaActiva;
      if (!m.tarifaFijaActiva) {
        // Guardar originales para posible reversión
        if (m._originalValores == null) {
          m._originalValores = {
            produccion: m.produccion,
            derechosExplotacion: m.derechosExplotacion,
            gastosAdministracion: m.gastosAdministracion
          };
        }
        const { derechos, gastos } = calcularTarifaFijaMaquina(m);
        m.derechosExplotacion = derechos;
        m.gastosAdministracion = gastos;
        m.tarifaFijaActiva = true;
        m.fueEditada = true; // activación cuenta como edición
      } else {
        // Revertir a originales
        if (m._originalValores) {
          m.produccion = m._originalValores.produccion;
          m.derechosExplotacion = m._originalValores.derechosExplotacion;
          m.gastosAdministracion = m._originalValores.gastosAdministracion;
        }
        m.tarifaFijaActiva = false;
        // Eliminar marca de edición si la única diferencia era la tarifa fija
        // Comparamos valores actuales con originales guardados para determinar si persiste una edición real.
        if (m._originalValores) {
          const difProduccion = m.produccion !== m._originalValores.produccion;
          const difDerechos = m.derechosExplotacion !== m._originalValores.derechosExplotacion;
          const difGastos = m.gastosAdministracion !== m._originalValores.gastosAdministracion;
          if (!difProduccion && !difDerechos && !difGastos) {
            m.fueEditada = false;
          }
        } else {
          // Sin backup significa que no se alteró nada realmente
          m.fueEditada = false;
        }
      }
      // Si estaba activa y ahora se desactivó, ya se gestionó fueEditada arriba
      if (!estabaActiva && m.tarifaFijaActiva) {
        m.fueEditada = true;
      }
      nuevas[index] = m;
      if (!edicionDirty) setEdicionDirty(true);
      return nuevas;
    });
  };

  // Reaplicar normalización cuando cambia el flag global de negativos
  // Ahora SÍ alteramos temporalmente los campos de derechos/gastos de la máquina,
  // guardando respaldo para poder revertir al desactivar.
  useEffect(() => {
    if (!dialogEdicion.open) return;
    setDatosMaquinasSala(prev => {
      if (opcionesEdicion.maquinasNegativasCero) {
        // Activando: para máquinas negativas sin tarifa fija, poner derechos/gastos en 0
        // y crear respaldo para poder revertir.
        let changed = false;
        const nuevas = prev.map(m => {
          const esNegativaSinTarifa = !m.tarifaFijaActiva && (m.produccion || 0) < 0;
          if (esNegativaSinTarifa) {
            const yaTieneBackup = m._negativoBackup != null;
            const actualizado = { ...m };
            if (!yaTieneBackup) {
              actualizado._negativoBackup = {
                derechosExplotacion: m.derechosExplotacion,
                gastosAdministracion: m.gastosAdministracion
              };
            }
            actualizado.derechosExplotacion = 0;
            actualizado.gastosAdministracion = 0;
            // marcar como edición automática por negativos
            if (!actualizado.fueEditada) actualizado.fueEditada = true;
            actualizado._autoEditNegativo = true;
            changed = true;
            return actualizado;
          }
          return m;
        });
        if (changed && !edicionDirty) setEdicionDirty(true);
        return nuevas;
      } else {
        // Desactivando: restaurar derechos/gastos desde backup si provino del auto marcado negativo
        const nuevas = prev.map(m => {
          if (m._autoEditNegativo) {
            const copia = { ...m };
            // Restaurar valores originales si hay backup
            if (copia._negativoBackup) {
              copia.derechosExplotacion = copia._negativoBackup.derechosExplotacion;
              copia.gastosAdministracion = copia._negativoBackup.gastosAdministracion;
            }
            delete copia._negativoBackup;
            delete copia._autoEditNegativo;
            // Limpiar marca de edición solo si no hay otros cambios (tarifa fija u otros)
            if (!copia.tarifaFijaActiva) {
              copia.fueEditada = false;
            }
            return copia;
          }
          return m;
        });
        return nuevas;
      }
    });
  }, [opcionesEdicion.maquinasNegativasCero, dialogEdicion.open]);
  const [dialogHistorial, setDialogHistorial] = useState({ open: false, liquidacion: null });
  const [datosEdicion, setDatosEdicion] = useState({});
  // Estado para controlar si hay cambios no guardados en la edición (deshabilita auto-guardado)
  const [edicionDirty, setEdicionDirty] = useState(false);
  // Estado editable para ingreso base manual (SMMLV + Auxilio)
  const [ingresoBaseManual, setIngresoBaseManual] = useState({ smmlv: '' });
  const totalIngresoBaseManual = useMemo(() => {
    return parseFloat(ingresoBaseManual.smmlv) || 0;
  }, [ingresoBaseManual]);

  // Contextos
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const theme = useTheme();

  // Listener en tiempo real para actualizaciones automáticas
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError(null);

    // Crear query base para TODAS las liquidaciones por sala (sin filtro de usuario)
    const liquidacionesQuery = query(
      collection(db, 'liquidaciones_por_sala')
    );

    // Listener en tiempo real
    const unsubscribe = onSnapshot(
      liquidacionesQuery,
      async (snapshot) => {
        try {
          // Procesar datos del snapshot
          const liquidacionesRealTime = [];
          const idsVistos = new Set();
          
          snapshot.forEach((doc) => {
            // Evitar duplicados por ID
            if (!idsVistos.has(doc.id)) {
              idsVistos.add(doc.id);
              liquidacionesRealTime.push({
                id: doc.id,
                ...doc.data()
              });
            } else {
              console.warn('⚠️ Liquidación duplicada detectada y omitida:', doc.id);
            }
          });

          console.log(`📡 Datos en tiempo real: ${liquidacionesRealTime.length} liquidaciones (TODAS)`);
          console.log('🔍 Usuario actual:', currentUser?.uid);
          console.log('🔍 Filtros aplicados:', filtrosAplicados);
          console.log('ℹ️ Mostrando liquidaciones de TODOS los usuarios del sistema');
          
          if (liquidacionesRealTime.length > 0) {
            console.log('🔍 Primera liquidación encontrada:', liquidacionesRealTime[0]);
          }

          // Verificar que las liquidaciones principales existen antes de mostrar las por sala
          const liquidacionesValidadas = [];
          for (const liquidacion of liquidacionesRealTime) {
            try {
            // ⚠️ SISTEMA DE VALIDACIÓN DESACTIVADO TEMPORALMENTE
            // TODO: Revisar y corregir la lógica de validación
            /*
            // Si es una liquidación editada, verificar que la original existe
            if (liquidacion.liquidacionOriginalId) {
              // Detectar referencia circular (bug donde liquidacionOriginalId === id)
              if (liquidacion.liquidacionOriginalId === liquidacion.id) {
                console.warn('⚠️ Referencia circular detectada, removiendo liquidación con bug:', liquidacion.id);
                await deleteDoc(doc(db, 'liquidaciones_por_sala', liquidacion.id));
                continue; // Saltar esta liquidación
              }
              
              const originalDoc = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacion.liquidacionOriginalId));
              if (!originalDoc.exists()) {
                console.warn('⚠️ Liquidación original no existe, removiendo edición:', liquidacion.id);
                // Eliminar automáticamente la liquidación huérfana
                await deleteDoc(doc(db, 'liquidaciones_por_sala', liquidacion.id));
                continue; // Saltar esta liquidación
              }
            }              // Si tiene liquidacionId, verificar que la liquidación principal existe
              if (liquidacion.liquidacionId) {
                const principalDoc = await getDoc(doc(db, 'liquidaciones', liquidacion.liquidacionId));
                if (!principalDoc.exists()) {
                  console.warn('⚠️ Liquidación principal no existe, removiendo por sala:', liquidacion.id);
                  // Eliminar automáticamente la liquidación huérfana
                  await deleteDoc(doc(db, 'liquidaciones_por_sala', liquidacion.id));
                  continue; // Saltar esta liquidación
                }
              }
            */
              
              // Logging temporal para debug de ediciones
              if (liquidacion.esEdicion || liquidacion.liquidacionId || liquidacion.liquidacionOriginalId) {
                console.log('🔍 LIQUIDACIÓN EDITADA DETECTADA:', {
                  id: liquidacion.id,
                  sala: liquidacion.sala?.nombre,
                  esEdicion: liquidacion.esEdicion,
                  liquidacionId: liquidacion.liquidacionId,
                  liquidacionOriginalId: liquidacion.liquidacionOriginalId,
                  maquinasEditadas: liquidacion.maquinasEditadas
                });
              }
              
              // Agregar todas las liquidaciones sin validación automática
              liquidacionesValidadas.push(liquidacion);
            } catch (error) {
              console.error('Error verificando liquidación:', liquidacion.id, error);
              // En caso de error, mantener la liquidación (comportamiento conservador)
              liquidacionesValidadas.push(liquidacion);
            }
          }

          // Guardar todas las liquidaciones para opciones de filtros
          setTodasLasLiquidaciones(liquidacionesValidadas);
          
          // Aplicar filtros localmente si existen
          let liquidacionesFiltradas = liquidacionesValidadas;
          
          // Verificar si hay filtros con valores válidos (no vacíos)
          const hayFiltrosValidos = filtrosAplicados && Object.values(filtrosAplicados).some(f => f && f.trim && f.trim());
          
          if (hayFiltrosValidos) {
            console.log('🔧 Aplicando filtros localmente...');
            liquidacionesFiltradas = liquidacionesRealTime.filter(liquidacion => {
              const pasaEmpresa = !filtrosAplicados.empresa || !filtrosAplicados.empresa.trim() || liquidacion.empresa.nombre === filtrosAplicados.empresa;
              const pasaPeriodo = !filtrosAplicados.periodo || !filtrosAplicados.periodo.trim() || liquidacion.fechas.periodoLiquidacion === filtrosAplicados.periodo;
              const pasaSala = !filtrosAplicados.sala || !filtrosAplicados.sala.trim() || liquidacion.sala.nombre === filtrosAplicados.sala;
              
              console.log(`🔍 Liquidación ${liquidacion.sala.nombre}: empresa=${pasaEmpresa}, periodo=${pasaPeriodo}, sala=${pasaSala}`);
              
              return pasaEmpresa && pasaPeriodo && pasaSala;
            });
            console.log(`📊 Después de filtros: ${liquidacionesFiltradas.length} de ${liquidacionesRealTime.length}`);
          } else {
            console.log('🔍 Sin filtros aplicados, mostrando tabla vacía');
            // Sin filtros = tabla vacía (requiere aplicar filtros para ver datos)
            liquidacionesFiltradas = [];
          }

          // Consolidación ordenada: sustituir la fila del original por la edición acumulada manteniendo posición
          const mapaEdiciones = new Map();
          for (const liq of liquidacionesFiltradas) {
            if (liq.esEdicion && liq.liquidacionOriginalId) {
              mapaEdiciones.set(liq.liquidacionOriginalId, liq);
            }
          }
          const liquidacionesConsolidadas = liquidacionesFiltradas.reduce((acc, liq) => {
            if (liq.esEdicion) {
              // Las ediciones se insertarán únicamente cuando se procese su original (para evitar que queden al final)
              return acc; 
            }
            if (mapaEdiciones.has(liq.id)) {
              const edicion = mapaEdiciones.get(liq.id);
              acc.push({ ...edicion, _reemplaza: liq.id });
            } else {
              acc.push(liq);
            }
            return acc;
          }, []);

          setLiquidaciones(liquidacionesConsolidadas);

          // Calcular estadísticas en tiempo real
          const estadisticasRealTime = calcularEstadisticasLocalmente(liquidacionesConsolidadas);
          setEstadisticas(estadisticasRealTime);

          setLoading(false);
          setError(null);

        } catch (error) {
          console.error('Error procesando datos en tiempo real:', error);
          setError(error.message);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error en listener de Firebase:', error);
        setError('Error conectando con la base de datos');
        setLoading(false);
        addNotification('Error de conexión con Firebase', 'error');
      }
    );

    // Cleanup function
    return () => {
      console.log('🔌 Desconectando listener de Firebase');
      unsubscribe();
    };
  }, [currentUser?.uid, filtrosAplicados]);

  // Función de carga manual (backup para casos especiales)
  const cargarDatos = async () => {
    try {
      console.log('🔄 Recarga manual de datos...');
      // El listener en tiempo real se encargará de actualizar automáticamente
      // Esta función se mantiene para compatibilidad
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
      addNotification('Error al cargar liquidaciones por sala', 'error');
    }
  };

  // Estado para datos detallados de máquinas
  const [datosMaquinasSala, setDatosMaquinasSala] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // Cargar datos detallados de las máquinas desde datosConsolidados
  const cargarDetallesSala = async (liquidacionSala) => {
    try {
      setCargandoDetalles(true);
      console.log('🔍 Cargando detalles para sala:', liquidacionSala.sala.nombre);
      console.log('📋 Datos de liquidación recibidos:', liquidacionSala);
      
      // Obtener el documento completo desde Firebase
      const liquidacionDoc = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacionSala.id));
      
      if (!liquidacionDoc.exists()) {
        console.warn('❌ No se encontró el documento de liquidación');
        setDatosMaquinasSala([]);
        addNotification('No se encontró el documento de liquidación', 'warning');
        return;
      }

      const liquidacionData = liquidacionDoc.data();
      console.log('📄 Documento completo cargado:', liquidacionData);
      
      // Verificar si tiene datosConsolidados
      if (liquidacionData.datosConsolidados && Array.isArray(liquidacionData.datosConsolidados)) {
        const datosConsolidados = liquidacionData.datosConsolidados;
        console.log(`📊 Datos consolidados encontrados: ${datosConsolidados.length} máquinas`);
        console.log('🔧 Muestra de datos:', datosConsolidados.slice(0, 2));
        
        // Procesar los datos para la tabla
        let maquinasData = datosConsolidados.map((maquina, index) => {
          if (index < 3) {
            try {
              console.log('[DEBUG diasTx] Raw maquina keys:', Object.keys(maquina));
              console.log('[DEBUG diasTx] Valores candidatos:', {
                diasTransmitidos: maquina.diasTransmitidos,
                dias_transmitidos: maquina.dias_transmitidos,
                diasTx: maquina.diasTx,
                dias_mes: maquina.dias_mes,
                diasMes: maquina.diasMes,
                dias: maquina.dias,
                metrics: maquina.metrics && {
                  diasTransmitidos: maquina.metrics.diasTransmitidos,
                  dias_tx: maquina.metrics.dias_tx,
                  dias: maquina.metrics.dias
                },
                detalle: maquina.detalle && {
                  diasTransmitidos: maquina.detalle.diasTransmitidos,
                  dias: maquina.detalle.dias
                }
              });
            } catch(e) { /* noop */ }
          }
          // Fallbacks extensivos para dias transmitidos (según distintos orígenes posibles)
          const diasTx = (
            maquina.diasTransmitidos ??
            maquina.dias_transmitidos ??
            maquina.diasTx ??
            maquina.dias_mes ??
            maquina.diasMes ??
            maquina.dias ??
            (maquina.metrics && (maquina.metrics.diasTransmitidos || maquina.metrics.dias_tx || maquina.metrics.dias)) ??
            (maquina.detalle && (maquina.detalle.diasTransmitidos || maquina.detalle.dias))
          );

          let diasTransmitidosNormalizado = diasTx;
          if (typeof diasTransmitidosNormalizado === 'string') {
            const parsed = parseInt(diasTransmitidosNormalizado.replace(/[^0-9]/g,''),10);
            if (!isNaN(parsed)) diasTransmitidosNormalizado = parsed; else diasTransmitidosNormalizado = null;
          }
          if (typeof diasTransmitidosNormalizado === 'number' && diasTransmitidosNormalizado < 0) {
            diasTransmitidosNormalizado = null; // evitar valores negativos anómalos
          }

          return ({
          id: index,
          serial: maquina.serial || 'N/A',
          nuc: maquina.nuc?.toString() || 'N/A',
          tipoApuesta: maquina.tipoApuesta || maquina.tipo_apuesta || maquina.tipo || null,
          diasTransmitidos: diasTransmitidosNormalizado ?? null,
          produccion: maquina.produccion || 0,
          derechosExplotacion: maquina.derechosExplotacion || 0,
          gastosAdministracion: maquina.gastosAdministracion || 0,
          totalImpuestos: maquina.totalImpuestos || 0,
          fueEditada: maquina.fueEditada === true // preservar bandera si existe
          });
        });

        // Si ninguna máquina trae diasTransmitidos pero el documento tiene un valor global potencial (por ejemplo en metricas), intentar inferir
        if (maquinasData.every(m => m.diasTransmitidos == null)) {
          const posibleGlobal = liquidacionData.diasTransmitidos || liquidacionData.diasMes || liquidacionData.dias || null;
          if (typeof posibleGlobal === 'number' && posibleGlobal > 0 && posibleGlobal <= 31) {
            console.log('[INFO diasTx] Usando valor global inferido para diasTransmitidos:', posibleGlobal);
            maquinasData.forEach(m => { m.diasTransmitidos = posibleGlobal; });
          }
        }

        // Si seguimos sin valores y este documento es una EDICION (tiene liquidacionOriginalId), intentar fusionar desde el documento original
        if (maquinasData.every(m => m.diasTransmitidos == null) && liquidacionData.liquidacionOriginalId) {
          try {
            console.log('[MERGE diasTx] Intentando obtener diasTransmitidos desde original:', liquidacionData.liquidacionOriginalId);
            const originalSnap = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacionData.liquidacionOriginalId));
            if (originalSnap.exists()) {
              const originalData = originalSnap.data();
              if (Array.isArray(originalData.datosConsolidados)) {
                const mapaOriginal = new Map();
                originalData.datosConsolidados.forEach(om => {
                  const serialO = om.serial || om.Serial;
                  if (!serialO) return;
                  const diasO = om.diasTransmitidos ?? om.dias_transmitidos ?? om.dias ?? null;
                  if (diasO != null) mapaOriginal.set(serialO, diasO);
                });
                if (mapaOriginal.size > 0) {
                  maquinasData = maquinasData.map(m => {
                    if (m.diasTransmitidos == null) {
                      const diasO = mapaOriginal.get(m.serial);
                      if (diasO != null) {
                        return { ...m, diasTransmitidos: diasO };
                      }
                    }
                    return m;
                  });
                  console.log(`[MERGE diasTx] Dias transmitidos aplicados desde original para ${Array.from(mapaOriginal.keys()).length} máquinas`);
                } else {
                  console.log('[MERGE diasTx] Original no contenía diasTransmitidos por máquina');
                }
              }
            } else {
              console.warn('[MERGE diasTx] No se encontró documento original');
            }
          } catch(mergeErr) {
            console.warn('[MERGE diasTx] Error intentando fusionar diasTransmitidos desde original:', mergeErr);
          }
        }
        
        console.log('✅ Datos procesados para la tabla:', maquinasData);
        setDatosMaquinasSala(maquinasData);
        
      } else {
        console.warn('❌ No se encontraron datosConsolidados en el documento');
        console.log('Estructura del documento:', Object.keys(liquidacionData));
        setDatosMaquinasSala([]);
        addNotification('No se encontraron datos consolidados de máquinas', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Error cargando detalles de sala:', error);
      setDatosMaquinasSala([]);
      addNotification('Error al cargar detalles de la sala', 'error');
    } finally {
      setCargandoDetalles(false);
    }
  };

  // Abrir modal de detalles siempre mostrando el documento ORIGINAL (sin modificaciones)
  const verDetallesOriginal = async (liquidacion) => {
    try {
      // Determinar el ID del documento original
      let originalId = null;
      if (liquidacion?.esEdicion && liquidacion?.liquidacionOriginalId) {
        originalId = liquidacion.liquidacionOriginalId;
      } else if (liquidacion?._reemplaza) {
        // La fila edición trae referencia del original reemplazado
        originalId = liquidacion._reemplaza;
      } else if (liquidacion?.id) {
        // Si es el original (o no hay ediciones), el propio id
        originalId = liquidacion.id;
      }

      if (!originalId) {
        // Fallback seguro
        setDialogDetalles({ open: true, liquidacion });
        await cargarDetallesSala(liquidacion);
        return;
      }

      const originalSnap = await getDoc(doc(db, 'liquidaciones_por_sala', originalId));
      if (originalSnap.exists()) {
        const originalData = originalSnap.data();
        const originalDoc = { id: originalId, ...originalData };
        setDialogDetalles({ open: true, liquidacion: originalDoc });
        await cargarDetallesSala(originalDoc);
      } else {
        // Si no existe el original, mostrar el actual con advertencia
        setDialogDetalles({ open: true, liquidacion });
        await cargarDetallesSala(liquidacion);
        addNotification('No se encontró la liquidación original; mostrando el documento actual.', 'warning');
      }
    } catch (e) {
      // En caso de error, mostrar el actual para no bloquear la UI
      setDialogDetalles({ open: true, liquidacion });
      await cargarDetallesSala(liquidacion);
      console.warn('Error abriendo detalles del original, se muestra el documento actual:', e);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros });
  };

  const limpiarFiltros = () => {
    setFiltros({ empresa: '', periodo: '', sala: '' });
    setFiltrosAplicados({});
  };

  // Funciones para edición de liquidaciones
  const abrirModalEdicion = async (liquidacion) => {
    console.log('🔧 Abriendo modal de edición para:', liquidacion);

    let baseParaEdicion = liquidacion;

    // Si el usuario hace clic sobre el ORIGINAL que ya tiene ediciones, cargar la edición acumulada
    if (!liquidacion.esEdicion && (liquidacion.tieneEdiciones || liquidacion.edicionId)) {
      try {
        if (liquidacion.edicionId) {
          const docEd = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacion.edicionId));
          if (docEd.exists()) {
            baseParaEdicion = { id: docEd.id, ...docEd.data() };
            console.log('🔄 Usando edición acumulada existente para nueva edición incremental');
          }
        }
      } catch (e) {
        console.warn('No se pudo cargar edición acumulada, se usará original:', e);
      }
    }

    setDatosEdicion({
      sala: baseParaEdicion.sala.nombre,
      empresa: baseParaEdicion.empresa,
      periodo: baseParaEdicion.fechas?.periodoLiquidacion || baseParaEdicion.periodo,
      totalProduccion: baseParaEdicion.metricas.totalProduccion,
      derechosExplotacion: baseParaEdicion.metricas.derechosExplotacion,
      gastosAdministracion: baseParaEdicion.metricas.gastosAdministracion,
      totalImpuestos: baseParaEdicion.metricas.totalImpuestos,
      numeroMaquinas: baseParaEdicion.metricas.totalMaquinas || baseParaEdicion.metricas.numeroMaquinas,
      motivoEdicion: ''
    });

    setDatosMaquinasSala([]); // limpiar
    setDialogEdicion({ open: true, liquidacion: baseParaEdicion });
    setEdicionDirty(false);
    // Inicializar ingreso base manual si existe en edición previa
    if (baseParaEdicion?.esEdicion && baseParaEdicion?.ingresoBaseManual) {
      setIngresoBaseManual({
        smmlv: baseParaEdicion.ingresoBaseManual.smmlv || ''
      });
    } else {
      // Prefill desde config del sistema si existe
      try {
        const cfg = await systemConfigService.getConfig();
        if (cfg?.smmlvActual != null) {
          setIngresoBaseManual({ smmlv: String(cfg.smmlvActual) });
        } else {
          setIngresoBaseManual({ smmlv: '' });
        }
      } catch {
        setIngresoBaseManual({ smmlv: '' });
      }
    }
    // Inicializar opciones de edición desde documento existente (si es edición) o valores por defecto
    if (baseParaEdicion?.esEdicion && baseParaEdicion?.opcionesEdicion) {
      setOpcionesEdicion({
        tarifaFija: !!baseParaEdicion.opcionesEdicion.tarifaFija,
        maquinasNegativasCero: !!baseParaEdicion.opcionesEdicion.maquinasNegativasCero
      });
    } else {
      setOpcionesEdicion({ tarifaFija: false, maquinasNegativasCero: false });
    }

    console.log('🔍 Cargando datos de máquinas para documento de edición con id:', baseParaEdicion.id);
    try {
      await cargarDetallesSala(baseParaEdicion);
      console.log('✅ Datos de máquinas cargados exitosamente para edición');
    } catch (error) {
      console.error('❌ Error al cargar datos de máquinas (edición):', error);
    }
  };

  const guardarEdicionLiquidacion = async () => {
    try {
      const docEnEdicion = dialogEdicion.liquidacion;
      if (!docEnEdicion) return;

      // Si estamos sobre la edición acumulada, necesitamos reconstruir un "originalDoc" mínimo con el id del original
      const originalDocForUpsert = docEnEdicion.esEdicion ? {
        id: docEnEdicion.liquidacionOriginalId,
        userId: docEnEdicion.userId,
        empresa: docEnEdicion.empresa,
        sala: docEnEdicion.sala,
        fechas: docEnEdicion.fechas
      } : docEnEdicion;

      const usuario = {
        uid: currentUser.uid,
        email: currentUser.email,
        name: userProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || currentUser.email || 'Usuario'
      };

      const idEdicion = await liquidacionPersistenceService.upsertLiquidacionEdicionPorSala({
        originalDoc: originalDocForUpsert,
        nuevosDatosMaquinas: datosMaquinasSala,
        motivoEdicion: datosEdicion.motivoEdicion,
        usuario,
        opcionesEdicion,
        ingresoBaseManual: {
          smmlv: parseFloat(ingresoBaseManual.smmlv) || 0,
          auxilio: 0,
          total: parseFloat(ingresoBaseManual.smmlv) || 0
        }
      });

      console.log('📄 Edición acumulativa aplicada. ID edición:', idEdicion);
      addNotification('Cambios aplicados. Edición acumulada actualizada.', 'success');

      setDialogEdicion({ open: false, liquidacion: null });
      setDatosMaquinasSala([]);
      setDatosEdicion({});
      setEdicionDirty(false);
  setOpcionesEdicion({ tarifaFija: false, maquinasNegativasCero: false });
  setIngresoBaseManual({ smmlv: '' });
    } catch (error) {
      console.error('Error al guardar edición acumulativa:', error);
      addNotification('Error aplicando la edición', 'error');
    }
  };



  // Estado para almacenar los datos originales para comparación
  const [datosOriginales, setDatosOriginales] = useState(null);

  // Cerrar modal de historial y limpiar datos
  const cerrarModalHistorial = () => {
    setDialogHistorial({ open: false, liquidacion: null });
    setDatosOriginales(null);
  };

  // Cargar datos originales (para mostrar "Antes" si no viene en historial)
  const cargarDatosOriginales = async (liquidacionOriginalId) => {
    try {
      if (!liquidacionOriginalId) return null;
      const snap = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacionOriginalId));
      if (!snap.exists()) return null;
      const data = snap.data();
      if (!Array.isArray(data.datosConsolidados)) return null;
      const map = new Map();
      data.datosConsolidados.forEach(om => {
        const raw = om.serial ?? om.Serial;
        if (raw == null) return;
        const key = String(raw).trim();
        const derechos = om.derechosExplotacion || 0;
        const gastos = om.gastosAdministracion || 0;
        map.set(key, {
          produccion: om.produccion,
          derechosExplotacion: derechos,
          gastosAdministracion: gastos,
          totalImpuestos: (om.totalImpuestos != null ? om.totalImpuestos : (derechos + gastos))
        });
      });
      return map;
    } catch (e) {
      console.warn('⚠️ No se pudieron cargar datos originales para historial:', e);
      return null;
    }
  };

  // Verificar si una máquina fue editada
  const fueEditadaMaquina = (maquina, liquidacionEditada) => {
    if (!liquidacionEditada || !maquina) return false;

    const serialMaquina = maquina?.serial || maquina?.Serial;
    
    // LÓGICA PRINCIPAL: Buscar en datosConsolidados la máquina con el campo fueEditada
    if (liquidacionEditada?.datosConsolidados && Array.isArray(liquidacionEditada.datosConsolidados)) {
      const maquinaEditadaEnDatos = liquidacionEditada.datosConsolidados.find(m => {
        const serialEnDatos = m?.serial || m?.Serial;
        return serialEnDatos === serialMaquina && m?.fueEditada === true;
      });
      
      if (maquinaEditadaEnDatos) {
        return true;
      }
    }

    // FALLBACK: Verificar si hay campos específicos de identificación de edición
    if (liquidacionEditada?.maquinasEditadas && Array.isArray(liquidacionEditada.maquinasEditadas)) {
      if (liquidacionEditada.maquinasEditadas.includes(serialMaquina)) {
        return true;
      }
    }

    return false;
  };

  // Abrir historial asegurando que si se hace clic desde el ORIGINAL con ediciones
  // se cargue el documento de edición acumulada real (esEdicion: true)
  const abrirHistorial = async (liquidacion) => {
    try {
      setDialogHistorial(prev => ({ ...prev, open: true, liquidacion: null, loading: true }));
      // Si ya es una edición, usarla directamente
      if (liquidacion.esEdicion) {
        const originalesMap = await cargarDatosOriginales(liquidacion.liquidacionOriginalId);
        setDatosOriginales(originalesMap);
        setDialogHistorial({ open: true, liquidacion, loading: false });
        return;
      }
      // Si es original pero tiene flag de ediciones, buscar una edición (la acumulada)
      if (liquidacion.tieneEdiciones || liquidacion.edicionId) {
        try {
          if (liquidacion.edicionId) {
            const editDoc = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacion.edicionId));
            if (editDoc.exists()) {
              const data = editDoc.data();
              const originalesMap = await cargarDatosOriginales(data.liquidacionOriginalId);
              setDatosOriginales(originalesMap);
              setDialogHistorial({ open: true, liquidacion: { id: editDoc.id, ...data }, loading: false });
              return;
            }
          }
          // Fallback: query por liquidacionOriginalId
          const q = query(
            collection(db, 'liquidaciones_por_sala'),
            where('liquidacionOriginalId', '==', liquidacion.id),
            where('esEdicion', '==', true),
            limit(1)
          );
            const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0];
            const data = d.data();
            const originalesMap = await cargarDatosOriginales(data.liquidacionOriginalId);
            setDatosOriginales(originalesMap);
            setDialogHistorial({ open: true, liquidacion: { id: d.id, ...data }, loading: false });
          } else {
            addNotification('No se encontró la edición acumulada todavía.', 'warning');
            setDialogHistorial({ open: false, liquidacion: null, loading: false });
          }
        } catch (e) {
          console.error('Error cargando edición acumulada:', e);
          addNotification('Error cargando edición acumulada', 'error');
          setDialogHistorial({ open: false, liquidacion: null, loading: false });
        }
      } else {
        addNotification('Este registro aún no tiene ediciones.', 'info');
        setDialogHistorial({ open: false, liquidacion: null, loading: false });
      }
    } catch (error) {
      console.error('Error abriendo historial:', error);
      addNotification('Error abriendo historial', 'error');
      setDialogHistorial({ open: false, liquidacion: null, loading: false });
    }
  };

  // Eliminar liquidación editada
  const eliminarLiquidacionEditada = async (liquidacionEditada) => {
    if (!liquidacionEditada?.id) {
      addNotification('Error: No se puede eliminar la liquidación (ID no válido)', 'error');
      return;
    }

    // Confirmar eliminación
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar esta edición?\n\n` +
      `Sala: ${liquidacionEditada.sala?.nombre}\n` +
      `Período: ${formatearPeriodo(liquidacionEditada.fechas?.periodoLiquidacion)}\n` +
      `Editado: ${liquidacionEditada.fechaEdicion?.seconds ? 
        new Date(liquidacionEditada.fechaEdicion.seconds * 1000).toLocaleString('es-CO') : 
        liquidacionEditada.fechaEdicion?.toDate ? 
        liquidacionEditada.fechaEdicion.toDate().toLocaleString('es-CO') :
        'N/A'
      }\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      console.log('🗑️ Eliminando liquidación editada:', liquidacionEditada.id);
      
      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, 'liquidaciones_por_sala', liquidacionEditada.id));
      // Limpiar flags en el original
      if (liquidacionEditada.liquidacionOriginalId) {
        try {
          await setDoc(doc(db, 'liquidaciones_por_sala', liquidacionEditada.liquidacionOriginalId), { tieneEdiciones: false, edicionId: null }, { merge: true });
        } catch (e) {
          console.warn('No se pudieron limpiar flags en original:', e);
        }
      }
      
      console.log('✅ Liquidación editada eliminada correctamente');
      
      // Actualizar la lista local de manera más inteligente
      setLiquidaciones(prevLiquidaciones => 
        prevLiquidaciones.map(liq => {
          // Si es la liquidación original de la edición que eliminamos, 
          // quitarle el flag de edición para que no muestre el botón
          if (liq.id === liquidacionEditada.liquidacionOriginalId) {
            return {
              ...liq,
              esEdicion: false,
              historialEdiciones: [],
              tieneEdiciones: false,
              edicionId: null
            };
          }
          // Si es la liquidación editada que eliminamos, removerla
          if (liq.id === liquidacionEditada.id && liq.esEdicion === true) {
            return null;
          }
          return liq;
        }).filter(Boolean) // Remover los null
      );
      
      addNotification(
        `Edición eliminada correctamente. Se mantiene la liquidación original.`, 
        'success'
      );
      
      // Cerrar el modal de historial
      cerrarModalHistorial();
      
    } catch (error) {
      console.error('Error al eliminar liquidación editada:', error);
      addNotification('Error al eliminar la edición de la liquidación', 'error');
    }
  };

  // Calcular totales automáticamente desde la tabla de máquinas
  const calcularTotalesDesdeTabla = () => {
    if (!datosMaquinasSala || datosMaquinasSala.length === 0) {
      return {
        totalProduccion: 0,
        totalDerechos: 0,
        totalGastos: 0,
        totalGeneral: 0
      };
    }

    const totalProduccion = datosMaquinasSala.reduce((sum, maq) => sum + (parseFloat(maq.produccion) || 0), 0);
    // Para totales de derechos y gastos no se hace ajuste; el ajuste solo afecta el totalGeneral mostrado por fila.
    const totalDerechos = datosMaquinasSala.reduce((sum, maq) => sum + (parseFloat(maq.derechosExplotacion) || 0), 0);
    const totalGastos = datosMaquinasSala.reduce((sum, maq) => sum + (parseFloat(maq.gastosAdministracion) || 0), 0);
    // totalGeneral debe considerar filas forzadas a 0
    const totalGeneral = datosMaquinasSala.reduce((sum, maq) => {
      const base = (parseFloat(maq.derechosExplotacion) || 0) + (parseFloat(maq.gastosAdministracion) || 0);
      return sum + (esTotalImpuestosForzadoCero(maq) ? 0 : base);
    }, 0);

    return {
      totalProduccion,
      totalDerechos,
      totalGastos,
      totalGeneral
    };
  };

  // Calcular estadísticas localmente
  const calcularEstadisticasLocalmente = (liquidacionesData) => {
    const estadisticas = {
      totalLiquidaciones: liquidacionesData.length,
      montos: {
        totalProduccion: 0,
        totalDerechos: 0,
        totalGastos: 0,
        totalImpuestos: 0
      },
      salas: new Set(),
      empresas: new Set(),
      periodos: new Set()
    };

    liquidacionesData.forEach(liq => {
      
      // Sumar montos
      if (liq.metricas) {
        estadisticas.montos.totalProduccion += liq.metricas.totalProduccion || 0;
        estadisticas.montos.totalDerechos += liq.metricas.derechosExplotacion || 0;
        estadisticas.montos.totalGastos += liq.metricas.gastosAdministracion || 0;
        estadisticas.montos.totalImpuestos += (liq.metricas.derechosExplotacion || 0) + (liq.metricas.gastosAdministracion || 0);
      }
      
      // Agregar a conjuntos únicos
      if (liq.sala?.nombre) estadisticas.salas.add(liq.sala.nombre);
      if (liq.empresa?.nombre) estadisticas.empresas.add(liq.empresa.nombre);
      if (liq.fechas?.periodoLiquidacion) estadisticas.periodos.add(liq.fechas.periodoLiquidacion);
    });

    // Convertir Sets a arrays
    estadisticas.salas = Array.from(estadisticas.salas);
    estadisticas.empresas = Array.from(estadisticas.empresas);
    estadisticas.periodos = Array.from(estadisticas.periodos);

    return estadisticas;
  };



  // Obtener opciones únicas para filtros (usando todas las liquidaciones disponibles)
  const opcionesFiltros = useMemo(() => {
    return {
      empresas: [...new Set(todasLasLiquidaciones.map(l => l.empresa.nombre))].sort(),
      periodos: [...new Set(todasLasLiquidaciones.map(l => l.fechas.periodoLiquidacion))].sort().reverse(),
      salas: [...new Set(todasLasLiquidaciones.map(l => l.sala.nombre))].sort()
    };
  }, [todasLasLiquidaciones]);

  // Calcular totales automáticamente cuando cambien los datos de las máquinas
  const totalesCalculados = useMemo(() => {
    return calcularTotalesDesdeTabla();
  }, [datosMaquinasSala]);

  // Funciones de manejo de estados
  const actualizarEstadoFacturacion = async (salaId, nuevoEstado, datosAdicionales = {}) => {
    try {
      const datosFacturacion = {
        estado: nuevoEstado,
        ...datosAdicionales,
        [`fecha${nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1)}`]: new Date().toISOString()
      };

      await liquidacionPersistenceService.actualizarEstadoFacturacion(salaId, datosFacturacion);
      if (addNotification && typeof addNotification === 'function') {
        addNotification(`Estado actualizado a: ${nuevoEstado}`, 'success');
      }
      cargarDatos(); // Recargar datos

    } catch (error) {
      console.error('Error actualizando estado:', error);
      if (addNotification && typeof addNotification === 'function') {
        addNotification('Error al actualizar estado', 'error');
      }
    }
  };

  // Formatear montos (producción - sin decimales)
  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto || 0);
  };

  // Formatear montos con decimales (derechos y gastos - máximo 2 decimales)
  const formatearMontoConDecimales = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(monto || 0);
  };

  // Parsear moneda a número (para campos de edición)
  const parsearMoneda = (valorFormateado) => {
    if (!valorFormateado) return 0;
    // Remover símbolos de moneda y espacios, mantener decimales
    const valorString = valorFormateado.toString()
      .replace(/[\$\s]/g, '') // Remover $ y espacios
      .replace(/\./g, '') // Remover puntos de miles
      .replace(/,/g, '.'); // Convertir coma decimal a punto
    return parseFloat(valorString) || 0;
  };

  // Aplicar normalización para valores negativos en máquinas
  const aplicarNormalizacionNegativos = (maquinas) => {
    if (!Array.isArray(maquinas)) return maquinas;
    
    // Simplemente retornar las máquinas ya que la normalización se hace en tiempo real
    // Esta función existe para mantener compatibilidad con ediciones previas
    return maquinas;
  };

  // Formatear período (de "agosto_2025" a "Agosto 2025")
  const formatearPeriodo = (periodo) => {
    if (!periodo) return '';
    
    const [mes, año] = periodo.split('_');
    const mesesMap = {
      enero: 'Enero',
      febrero: 'Febrero',
      marzo: 'Marzo',
      abril: 'Abril',
      mayo: 'Mayo',
      junio: 'Junio',
      julio: 'Julio',
      agosto: 'Agosto',
      septiembre: 'Septiembre',
      octubre: 'Octubre',
      noviembre: 'Noviembre',
      diciembre: 'Diciembre'
    };
    
    return `${mesesMap[mes] || mes} ${año}`;
  };

  // Componente de estadísticas con diseño sobrio
  const EstadisticasResumen = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.primary.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mr: 2 
              }}>
                <StoreIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {estadisticas?.totalLiquidaciones || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Liquidaciones
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.success.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                mr: 2 
              }}>
                <PaymentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatearMonto(estadisticas?.montos?.totalProduccion)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Producción
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.warning.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                mr: 2 
              }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatearMontoConDecimales(estadisticas?.montos?.totalDerechos)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Derechos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.info.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                mr: 2 
              }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatearMonto(estadisticas?.montos?.totalImpuestos)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Impuestos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Componente de filtros con diseño sobrio
  const PanelFiltros = () => (
    <Card sx={{ 
      mb: 3,
      borderRadius: 1,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderColor: alpha(theme.palette.primary.main, 0.8)
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filtros
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                value={filtros.empresa}
                label="Empresa"
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltros.empresas.map(empresa => (
                  <MenuItem key={empresa} value={empresa}>{empresa}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={filtros.periodo}
                label="Período"
                onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {opcionesFiltros.periodos.map(periodo => (
                  <MenuItem key={periodo} value={periodo}>{formatearPeriodo(periodo)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sala</InputLabel>
              <Select
                value={filtros.sala}
                label="Sala"
                onChange={(e) => setFiltros({ ...filtros, sala: e.target.value })}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltros.salas.map(sala => (
                  <MenuItem key={sala} value={sala}>{sala}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1} height="100%">
              <Button 
                variant="contained" 
                onClick={aplicarFiltros}
                fullWidth
                size="small"
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Aplicar
              </Button>
              <Button 
                variant="outlined" 
                onClick={limpiarFiltros}
                fullWidth
                size="small"
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={cargarDatos}>
            Reintentar
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <GlobalStyles styles={{
        '@keyframes pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.5 },
          '100%': { opacity: 1 }
        }
      }} />
      {/* Header sobrio con gradiente controlado */}
      <Paper sx={{
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        mb: 3
      }}>
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{
            fontWeight: 600, 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 1.2
          }}>
            GESTIÓN FINANCIERA • CONTROL DE LIQUIDACIONES
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 700, 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5
          }}>
            <StoreIcon sx={{ fontSize: '2rem' }} />
            Liquidaciones por Sala
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            mt: 0.5
          }}>
            Control y gestión de liquidaciones organizadas por sala
          </Typography>
        </Box>
      </Paper>

        {/* Estadísticas */}
        {estadisticas && <EstadisticasResumen />}

        {/* Filtros */}
        <PanelFiltros />

        {/* Tabla de liquidaciones con diseño sobrio */}
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table sx={{
                '& .MuiTableCell-root': {
                  borderColor: 'divider'
                },
                '& .MuiTableHead-root .MuiTableRow-root': {
                  borderBottom: `1px solid ${theme.palette.divider}`
                }
              }}>
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}>
                    <TableCell sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Empresa / Sala
                    </TableCell>
                    <TableCell sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Período
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Máquinas
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Producción
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Impuestos
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {liquidaciones.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((liquidacion, index) => (
                    <TableRow
                      key={`${liquidacion.id}_${index}`}
                      sx={{
                        borderColor: 'divider',
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {liquidacion.empresa.nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {liquidacion.sala.nombre}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {formatearPeriodo(liquidacion.fechas.periodoLiquidacion)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Badge badgeContent={liquidacion.metricas.totalMaquinas} color="primary">
                            <StoreIcon color="action" />
                          </Badge>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatearMonto(liquidacion.metricas.totalProduccion)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            {formatearMonto(liquidacion.metricas.totalImpuestos)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Ver detalles máquina por máquina">
                              <IconButton 
                                size="small"
                                onClick={() => { verDetallesOriginal(liquidacion); }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {/* Botón condicional: solo mostrar si es edición acumulada o el original tiene ediciones */}
                            {(() => {
                              // Si es la edición acumulada (fila reemplazo) siempre mostrar
                              if (liquidacion.esEdicion) return true;
                              // Si la fila fue sustituida (original ocultado) no debería llegar aquí, pero por seguridad
                              if (liquidacion._reemplaza) return true;
                              // Caso original: mostrar si conserva referencia válida a edición presente
                              if (liquidacion.tieneEdiciones && liquidacion.edicionId) {
                                return liquidaciones.some(l => l.id === liquidacion.edicionId && l.esEdicion);
                              }
                              return false;
                            })() && (
                              <Tooltip title={liquidacion.esEdicion ? 'Ver liquidación editada' : 'Ver ediciones'}>
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => abrirHistorial(liquidacion)}
                                >
                                  <InfoIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            <Tooltip title="Editar liquidación">
                              <IconButton 
                                size="small"
                                color="secondary"
                                onClick={() => abrirModalEdicion(liquidacion)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
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
                onPageChange={(event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  '& .MuiTablePagination-toolbar': {
                    paddingLeft: theme.spacing(2),
                    paddingRight: theme.spacing(2)
                  }
                }}
              />
            )}

            {liquidaciones.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  {Object.keys(filtrosAplicados).length === 0 || !Object.values(filtrosAplicados).some(f => f && f.trim && f.trim()) 
                    ? 'Aplica filtros para ver las liquidaciones por sala'
                    : 'No se encontraron liquidaciones que coincidan con los filtros aplicados'
                  }
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog de detalles máquina por máquina */}
        <Dialog 
          open={dialogDetalles.open} 
          onClose={() => {
            setDialogDetalles({ open: false, liquidacion: null });
            setDatosMaquinasSala([]);
          }}
          /* Auto-size: dejamos que el contenido defina ancho, con límites de viewport */
          fullWidth={false}
          maxWidth={false}
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              width: 'auto',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <DialogTitle sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <ViewIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
                  Detalle de Liquidación
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {dialogDetalles.liquidacion ? `${dialogDetalles.liquidacion.empresa.nombre} • ${formatearPeriodo(dialogDetalles.liquidacion.fechas.periodoLiquidacion)}` : '—'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => { setDialogDetalles({ open: false, liquidacion: null }); setDatosMaquinasSala([]); }} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 6 }}>
            {/* Layout flexible para que el ancho total se adapte al contenido real de la tabla */}
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 3,
              // El panel izquierdo se dimensiona por su contenido (tabla), hasta un máximo relativo
              '& > .detalle-maquinas-wrapper': {
                flex: '0 1 auto'
              },
              '& > .sidebar-metricas': {
                flex: '0 0 320px'
              },
              // Evitar que el contenedor provoque shrink que genere scroll horizontal
              overflowX: 'visible'
            }}>
              <Box className="detalle-maquinas-wrapper">
                {dialogDetalles.liquidacion && (
                  <Box>
                    {/* Tabla detallada de máquinas en Paper auto-ajustable */}
                    <Paper sx={{
                      mt: 1.5,
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.primary.light, 0.02),
                      width: 'fit-content',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 2
                      }}>
                        DETALLE POR MÁQUINA
                      </Typography>
                      {cargandoDetalles ? (
                        <Box display="flex" justifyContent="center" py={4}>
                          <CircularProgress />
                          <Typography sx={{ ml: 2 }}>Cargando detalles...</Typography>
                        </Box>
                      ) : datosMaquinasSala.length > 0 ? (
                        <Box sx={{
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                          borderRadius: 1,
                          overflow: 'hidden',
                          width: 'fit-content'
                        }}>
                          <TableContainer /* Altura automática: sin maxHeight interno; scroll recaerá en el Dialog si excede viewport */>
                            <Table size="small" sx={{
                              width: 'fit-content',
                              tableLayout: 'auto',
                              '& .MuiTableCell-root': {
                                borderColor: 'divider',
                                padding: '8px 12px'
                              },
                              '& .MuiTableHead-root .MuiTableRow-root': {
                                borderBottom: `1px solid ${theme.palette.divider}`
                              }
                            }}>
                              <TableHead>
                                <TableRow sx={{ 
                                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                  borderBottom: `1px solid ${theme.palette.divider}`
                                }}>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    Serial
                                  </TableCell>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    NUC
                                  </TableCell>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    Tipo Apuesta
                                  </TableCell>
                                  {/* Columna Días Tx removida en modal Detalle por requerimiento */}
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Producción
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Derechos de Explotación
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Gastos de Administración
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Total Impuestos
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {datosMaquinasSala.map((maquina, index) => (
                                  <TableRow 
                                    key={index} 
                                    sx={{
                                      borderColor: 'divider',
                                      transition: 'background-color 0.2s ease',
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                      }
                                    }}
                                  >
                                    <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                      {maquina.serial || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                      {maquina.nuc || 'N/A'}
                                    </TableCell>
                                      <TableCell align="center" sx={{ borderColor: 'divider', fontSize: '0.8rem', fontWeight: 500 }}>
                                        {maquina.tipoApuesta || maquina.tipo_apuesta || maquina.tipo || '—'}
                                      </TableCell>
                                      {/* Celda Días Tx removida en modal Detalle */}
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.success.main, fontWeight: 500, fontSize: '0.8rem' }}>
                                        {formatearMonto(maquina.produccion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.warning.main, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.derechosExplotacion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.error.main, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.gastosAdministracion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.totalImpuestos)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          No se pudieron cargar los detalles de las máquinas para esta sala.
                        </Alert>
                      )}
                    </Paper>
                  </Box>
                )}
              </Box>

              <Box className="sidebar-metricas">
                {dialogDetalles.liquidacion && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                    {/* Información adicional */}
                    <Paper sx={{ 
                      mt: 1.5,
                      p: 2.5, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.primary.light, 0.02)
                    }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 1.5 }}>
                        Información Adicional
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Sala:</strong> {dialogDetalles.liquidacion.sala.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Empresa:</strong> {dialogDetalles.liquidacion.empresa.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Período:</strong> {formatearPeriodo(dialogDetalles.liquidacion.fechas.periodoLiquidacion)}
                      </Typography>
                    </Paper>

                    {/* Métricas (vertical full-width) */}
                    <Paper sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.primary.light, 0.02)
                    }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                        Métricas
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.12) : alpha(theme.palette.primary.main, 0.03) }}>
                          <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.1, fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>MÁQUINAS</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.primary.main }}>{dialogDetalles.liquidacion.metricas.totalMaquinas}</Typography>
                        </Paper>
                        <Paper elevation= {0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.success.dark, 0.12) : alpha(theme.palette.success.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>PRODUCCIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.success.main }}>{formatearMonto(dialogDetalles.liquidacion.metricas.totalProduccion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.12) : alpha(theme.palette.warning.light, 0.08) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>DERECHOS DE EXPLOTACIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.warning.main }}>{formatearMontoConDecimales(dialogDetalles.liquidacion.metricas.derechosExplotacion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.error.dark, 0.12) : alpha(theme.palette.error.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>GASTOS DE ADMINISTRACIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.error.main }}>{formatearMontoConDecimales(dialogDetalles.liquidacion.metricas.gastosAdministracion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.info.dark, 0.12) : alpha(theme.palette.info.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>TOTAL IMPUESTOS</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.text.primary }}>{formatearMontoConDecimales(dialogDetalles.liquidacion.metricas.totalImpuestos)}</Typography>
                        </Paper>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              onClick={() => {
                setDialogDetalles({ open: false, liquidacion: null });
                setDatosMaquinasSala([]);
              }}
              variant="outlined"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de gestión de facturación con diseño sobrio */}
        <Dialog 
          open={dialogFacturacion.open} 
          onClose={() => setDialogFacturacion({ open: false, liquidacion: null })}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
            }
          }}
        >
          <DialogTitle sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <ReceiptIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                  Gestión de Facturación
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Control de Estados
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogFacturacion({ open: false, liquidacion: null })} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 5 }}>
            {dialogFacturacion.liquidacion && (
              <Box>
                <Paper sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha(theme.palette.primary.light, 0.04)
                }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, mb: 1 }}>
                    Información de la Sala
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {dialogFacturacion.liquidacion.sala.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Estado: {dialogFacturacion.liquidacion.facturacion.estado.toUpperCase()}
                  </Typography>
                </Paper>
                <Paper sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.default, 0.4)
                    : alpha(theme.palette.primary.light, 0.02)
                }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, mb: 2 }}>
                    Acciones
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<PdfIcon />}
                      disabled={['generada', 'enviada', 'pagada'].includes(dialogFacturacion.liquidacion.facturacion.estado)}
                      onClick={() => {
                        actualizarEstadoFacturacion(dialogFacturacion.liquidacion.id, 'generada');
                        setDialogFacturacion({ open: false, liquidacion: null });
                      }}
                      sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none', py: 1.5 }}
                    >
                      Generar PDF/Factura
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SendIcon />}
                      disabled={!['generada'].includes(dialogFacturacion.liquidacion.facturacion.estado)}
                      onClick={() => {
                        actualizarEstadoFacturacion(dialogFacturacion.liquidacion.id, 'enviada');
                        setDialogFacturacion({ open: false, liquidacion: null });
                      }}
                      sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none', py: 1.5 }}
                    >
                      Marcar como Enviada
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PaymentIcon />}
                      disabled={!['enviada'].includes(dialogFacturacion.liquidacion.facturacion.estado)}
                      onClick={() => {
                        actualizarEstadoFacturacion(dialogFacturacion.liquidacion.id, 'pagada');
                        setDialogFacturacion({ open: false, liquidacion: null });
                      }}
                      sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none', py: 1.5 }}
                    >
                      Marcar como Pagada
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              onClick={() => setDialogFacturacion({ open: false, liquidacion: null })}
              variant="outlined"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de edición de liquidación */}
        <Dialog 
          open={dialogEdicion.open} 
          onClose={() => {
            setDialogEdicion({ open: false, liquidacion: null });
            setDatosMaquinasSala([]);
            setDatosEdicion({});
            setEdicionDirty(false);
          }}
          fullWidth={false}
          maxWidth={false}
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              width: 'auto',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <DialogTitle sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <EditIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                  Editar Liquidación
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {dialogEdicion.liquidacion ? `${dialogEdicion.liquidacion.sala?.nombre} • ${formatearPeriodo(dialogEdicion.liquidacion.periodo)}` : '—'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => { setDialogEdicion({ open: false, liquidacion: null }); setDatosMaquinasSala([]); setDatosEdicion({}); }} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3, pt: 6 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 3,
              '& > .edit-left': { flex: '0 1 auto' },
              '& > .edit-right': { flex: '0 0 340px' }
            }}>
              <Box className="edit-left">
                <Paper sx={{ mt: 1.5, p: 3, mb: 3, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02), width: 'fit-content', maxWidth: '100%' }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                    DETALLE POR MÁQUINA
                  </Typography>
                  {cargandoDetalles ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Cargando detalles...</Typography>
                    </Box>
                  ) : datosMaquinasSala.length > 0 ? (
                    <Box sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`, borderRadius: 1, overflow: 'hidden', width: 'fit-content' }}>
                      <TableContainer>
                        <Table size="small" sx={{ width: 'fit-content', tableLayout: 'auto', '& .MuiTableCell-root': { borderColor: 'divider', padding: '8px 12px' }, '& .MuiTableHead-root .MuiTableRow-root': { borderBottom: `1px solid ${theme.palette.divider}` } }}>
                          <TableHead>
                            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderBottom: `1px solid ${theme.palette.divider}` }}>
                              <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Serial</TableCell>
                              <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>NUC</TableCell>
                              <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Tipo Apuesta</TableCell>
                              <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Días Tx</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Producción</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Derechos de Explotación</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Gastos de Administración</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Total Impuestos</TableCell>
                              <TableCell align="center" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Tarifa Fija</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {datosMaquinasSala.map((maquina, index) => (
                              <TableRow key={index} sx={{ 
                                borderColor: 'divider', 
                                transition: 'background-color 0.2s ease', 
                                backgroundColor: maquina.fueEditada ? alpha(theme.palette.warning.main, 0.12) : 'transparent',
                                borderLeft: maquina.fueEditada ? `4px solid ${theme.palette.warning.main}` : '4px solid transparent',
                                '&:hover': { backgroundColor: maquina.fueEditada ? alpha(theme.palette.warning.main, 0.18) : alpha(theme.palette.primary.main, 0.04) } 
                              }}>
                                <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <span>{maquina.serial || 'N/A'}</span>
                                    {maquina.fueEditada && (
                                      <Chip label="EDITADA" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600 }} />
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>{maquina.nuc || 'N/A'}</TableCell>
                                <TableCell align="center" sx={{ borderColor: 'divider', fontSize: '0.8rem', fontWeight: 500 }}>{maquina.tipoApuesta || maquina.tipo_apuesta || maquina.tipo || '—'}</TableCell>
                                <TableCell align="center" sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                  {maquina.diasTransmitidos ?? '—'}
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <TextField
                                    variant="standard"
                                    type="text"
                                    size="small"
                                    disabled={!!maquina.tarifaFijaActiva}
                                    value={formatearMonto(maquina.produccion || 0)}
                                    onChange={(e) => {
                                      const nuevaProduccion = parsearMoneda(e.target.value);
                                      setDatosMaquinasSala(prev => {
                                        const nuevas = [...prev];
                                        const derechos = nuevaProduccion * 0.12;
                                        const gastos = derechos * 0.01;
                                        const updated = { ...nuevas[index], produccion: nuevaProduccion, derechosExplotacion: derechos, gastosAdministracion: gastos, fueEditada: true };
                                        // Si había backup de negativos y ahora ya no es negativo, eliminarlo
                                        if (updated._negativosOriginal && nuevaProduccion >= 0) {
                                          delete updated._negativosOriginal;
                                        }
                                        nuevas[index] = updated;
                                        const normalizadas = aplicarNormalizacionNegativos(nuevas);
                                        return normalizadas;
                                      });
                                      if (!edicionDirty) setEdicionDirty(true);
                                    }}
                                    InputProps={{
                                      style: { color: maquina.tarifaFijaActiva ? theme.palette.text.disabled : theme.palette.success.main, fontWeight: 500, fontSize: '0.8rem', textAlign: 'right' },
                                      disableUnderline: false
                                    }}
                                    sx={{ '& input': { textAlign: 'right' } }}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <Typography sx={{ color: theme.palette.warning.main, fontWeight: 500, fontSize: '0.8rem' }}>
                                    {formatearMontoConDecimales(maquina.derechosExplotacion || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <Typography sx={{ color: theme.palette.error.main, fontWeight: 500, fontSize: '0.8rem' }}>
                                    {formatearMontoConDecimales(maquina.gastosAdministracion || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <Typography sx={{ color: esTotalImpuestosForzadoCero(maquina) ? theme.palette.text.disabled : theme.palette.text.primary, fontWeight: 600, fontSize: '0.8rem' }}>
                                    {esTotalImpuestosForzadoCero(maquina)
                                      ? formatearMontoConDecimales(0)
                                      : formatearMontoConDecimales((maquina.derechosExplotacion || 0) + (maquina.gastosAdministracion || 0))}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ borderColor: 'divider', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                  {(((maquina.derechosExplotacion || 0) === 0 && (maquina.gastosAdministracion || 0) === 0) || maquina.tarifaFijaActiva) ? (
                                    <Checkbox
                                      size="small"
                                      color="primary"
                                      checked={!!maquina.tarifaFijaActiva}
                                      onChange={() => toggleTarifaFijaFila(index)}
                                      disabled={!smmlvActual}
                                    />
                                  ) : (
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ borderRadius: 1 }} action={<Button color="warning" size="small" onClick={() => cargarDetallesSala(dialogEdicion.liquidacion)}>Reintentar</Button>}>
                      <Typography variant="body2">No se pudieron cargar los detalles de las máquinas</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                        ID de liquidación: {dialogEdicion.liquidacion?.id}<br/>
                        Datos disponibles: {datosMaquinasSala.length} máquinas<br/>
                        Estado de carga: {cargandoDetalles ? 'Cargando...' : 'Completado'}
                      </Typography>
                    </Alert>
                  )}
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02), width: 'fit-content' }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>Motivo de la Edición</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={datosEdicion.motivoEdicion || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('🔧 Motivo changed:', value, 'Length:', value.length);
                      setDatosEdicion(prev => ({ ...prev, motivoEdicion: value }));
                      // Marcar como sucio si cambia el motivo
                      if (!edicionDirty) setEdicionDirty(true);
                    }}
                    placeholder="Describe el motivo de esta edición..."
                    required
                    helperText={!datosEdicion.motivoEdicion && edicionDirty ? 'Ingresa un motivo para habilitar el guardado' : ' '}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 1, backgroundColor: alpha(theme.palette.info.main, 0.1), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                    <Typography variant="body2">Se creará un nuevo registro manteniendo el original como historial. Esta acción quedará registrada para auditoría.</Typography>
                  </Alert>
                </Paper>
              </Box>

              <Box className="edit-right">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                  <Paper sx={{ mt: 1.5, p: 2.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02) }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 1.5 }}>
                      Información Base
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Sala:</strong> {dialogEdicion.liquidacion?.sala?.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Empresa:</strong> {dialogEdicion.liquidacion?.empresa?.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Período:</strong> {dialogEdicion.liquidacion 
                        ? formatearPeriodo(
                            dialogEdicion.liquidacion?.fechas?.periodoLiquidacion 
                              || dialogEdicion.liquidacion?.periodo 
                              || datosEdicion.periodo
                          ) 
                        : '—'}
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02) }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                      Métricas Calculadas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.success.dark, 0.12) : alpha(theme.palette.success.light, 0.06) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>PRODUCCIÓN</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600, m: 0 }}>{formatearMonto(totalesCalculados.totalProduccion)}</Typography>
                      </Paper>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.12) : alpha(theme.palette.warning.light, 0.08) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>DERECHOS</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.warning.main, fontWeight: 600, m: 0 }}>{formatearMontoConDecimales(totalesCalculados.totalDerechos)}</Typography>
                      </Paper>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.error.dark, 0.12) : alpha(theme.palette.error.light, 0.06) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>GASTOS</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600, m: 0 }}>{formatearMontoConDecimales(totalesCalculados.totalGastos)}</Typography>
                      </Paper>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.info.dark, 0.12) : alpha(theme.palette.info.light, 0.06) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>TOTAL</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600, m: 0 }}>{formatearMontoConDecimales(totalesCalculados.totalGeneral)}</Typography>
                      </Paper>
                      {/* Panel de ingreso base manual removido (valor ahora interno e invisible) */}
                    </Box>
                  </Paper>
                  <Paper sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.default, 0.5)
                      : alpha(theme.palette.primary.light, 0.02)
                  }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                      Herramientas de Edición
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Estado:</strong> Modo edición activo</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Auto-guardado:</strong> Deshabilitado</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Cambios pendientes:</strong> {edicionDirty ? 'Sí' : 'No'}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Control de versión:</strong> Activado</Typography>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={opcionesEdicion.maquinasNegativasCero} onChange={(e) => { setOpcionesEdicion(o => ({ ...o, maquinasNegativasCero: e.target.checked })); if (!edicionDirty) setEdicionDirty(true); }} />}
                        label={
                          <Tooltip title="Forzará máquinas con producción negativa a cero (solo aplica a máquinas sin tarifa fija)." placement="top" arrow>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>Máquinas negativas a 0</Typography>
                          </Tooltip>
                        }
                      />
                      { (opcionesEdicion.maquinasNegativasCero) && (
                        <Alert severity="info" sx={{ borderRadius: 1, py: 0.5 }} icon={<InfoIcon fontSize="small" />}>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Los negativos se normalizarán a 0 en máquinas sin tarifa fija.</Typography>
                        </Alert>
                      ) }
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              onClick={() => {
                setDialogEdicion({ open: false, liquidacion: null });
                setDatosMaquinasSala([]);
                setDatosEdicion({});
                setEdicionDirty(false);
              }}
              variant="outlined"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                console.log('🔧 Button state:', { 
                  motivoEdicion: datosEdicion.motivoEdicion, 
                  length: datosEdicion.motivoEdicion?.length,
                  disabled: !datosEdicion.motivoEdicion 
                });
                guardarEdicionLiquidacion();
              }}
              // Ahora solo depende del motivo: si hay cambios pero el usuario no cambió producción y solo quiere documentar un ajuste, igual puede guardar
              disabled={!datosEdicion.motivoEdicion}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.24)}` } }}
            >
              Guardar Edición
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de historial de ediciones - Modal ajustado */}
        <Dialog 
          open={dialogHistorial.open} 
          onClose={cerrarModalHistorial}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
              height: '80vh'
            }
          }}
        >
          <DialogTitle sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                <InfoIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                  Liquidación Editada
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {dialogHistorial.liquidacion ? `${dialogHistorial.liquidacion.sala?.nombre} • ${formatearPeriodo(dialogHistorial.liquidacion.fechas?.periodoLiquidacion)}` : '—'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ 
                color: 'secondary.main', 
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                px: 1.5, 
                py: 0.5, 
                borderRadius: 1.5,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}>
                VERSIÓN EDITADA
              </Typography>
              <IconButton onClick={cerrarModalHistorial} sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3, overflow: 'auto' }}>
            {dialogHistorial.liquidacion && (
              <Grid container spacing={3} alignItems="flex-start">
                {/* Columna izquierda: Detalle por máquina */}
                <Grid item xs={12} md={9} lg={9}>
                    {/* Tabla detallada de máquinas editadas */}
                    <Paper sx={{
                      mt: 1.5,
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.secondary.light, 0.02),
                      width: '100%',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 1,
                        alignSelf: 'flex-start'
                      }}>
                        DETALLE POR MÁQUINA (VALORES EDITADOS)
                      </Typography>
                      
                      {/* Leyenda de indicadores visuales */}
                      <Box sx={{ 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        alignSelf: 'flex-start',
                        width: '100%'
                      }}>
                        <Box sx={{
                          width: 4,
                          height: 16,
                          backgroundColor: theme.palette.warning.main,
                          borderRadius: 0.5
                        }} />
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          fontWeight: 500
                        }}>
                          Las filas resaltadas indican máquinas que fueron modificadas en esta edición
                        </Typography>
                      </Box>
                      
                      {dialogHistorial.liquidacion.datosConsolidados?.length > 0 ? (
                        <Box sx={{
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
                          borderRadius: 1,
                          overflow: 'hidden',
                          width: 'fit-content',
                          maxWidth: '100%'
                        }}>
                          <TableContainer>
                            <Table size="small" sx={{
                              width: 'fit-content',
                              tableLayout: 'auto',
                              '& .MuiTableCell-root': {
                                borderColor: 'divider',
                                padding: '8px 12px'
                              },
                              '& .MuiTableHead-root .MuiTableRow-root': {
                                borderBottom: `1px solid ${theme.palette.divider}`
                              }
                            }}>
                              <TableHead>
                                <TableRow sx={{ 
                                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                  borderBottom: `1px solid ${theme.palette.divider}`
                                }}>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    Serial
                                  </TableCell>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    NUC
                                  </TableCell>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    Tipo Apuesta
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Producción
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Derechos de Explotación
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Gastos de Administración
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Total Impuestos
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {dialogHistorial.liquidacion.datosConsolidados.map((maquina, index) => {
                                  const fueMaquinaEditada = fueEditadaMaquina(maquina, dialogHistorial.liquidacion);
                                  return (
                                    <TableRow 
                                      key={index} 
                                      sx={{
                                        borderColor: 'divider',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: fueMaquinaEditada 
                                          ? alpha(theme.palette.warning.main, 0.08)
                                          : 'transparent',
                                        borderLeft: fueMaquinaEditada 
                                          ? `4px solid ${theme.palette.warning.main}`
                                          : '4px solid transparent',
                                        '&:hover': {
                                          backgroundColor: fueMaquinaEditada
                                            ? alpha(theme.palette.warning.main, 0.12)
                                            : alpha(theme.palette.secondary.main, 0.04)
                                        }
                                      }}
                                    >
                                    <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {fueMaquinaEditada && (
                                          <EditIcon 
                                            sx={{ 
                                              fontSize: '1rem', 
                                              color: theme.palette.warning.main,
                                              animation: 'pulse 2s infinite'
                                            }} 
                                          />
                                        )}
                                        <span>{maquina.serial || 'N/A'}</span>
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                      {maquina.nuc || 'N/A'}
                                    </TableCell>
                                    <TableCell align="center" sx={{ borderColor: 'divider', fontSize: '0.8rem', fontWeight: 500 }}>
                                      {maquina.tipoApuesta || maquina.tipo_apuesta || maquina.tipo || '—'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.success.main, fontWeight: 500, fontSize: '0.8rem' }}>
                                        {formatearMonto(maquina.produccion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.warning.main, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.derechosExplotacion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.error.main, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.gastosAdministracion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.totalImpuestos)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          No se encontraron datos consolidados para esta liquidación editada.
                        </Alert>
                      )}
                    </Paper>
                </Grid>

                {/* Columna derecha: Información + Métricas */}
                <Grid item xs={12} md={3} lg={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                    {/* Información adicional */}
                    <Paper sx={{ 
                      mt: 1.5,
                      p: 2.5, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.secondary.light, 0.02)
                    }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 1.5 }}>
                        Información de la Edición
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Sala:</strong> {dialogHistorial.liquidacion.sala?.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Empresa:</strong> {dialogHistorial.liquidacion.empresa?.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Período:</strong> {formatearPeriodo(dialogHistorial.liquidacion.fechas?.periodoLiquidacion)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Editado por:</strong> {
                          (() => {
                            const usuario = dialogHistorial.liquidacion.usuarioEdicion;
                            
                            // Si es un objeto con información completa
                            if (usuario && typeof usuario === 'object') {
                              return usuario.name || usuario.displayName || usuario.email?.split('@')[0] || usuario.email || 'Usuario';
                            }
                            
                            // Si es un UID string y coincide con el usuario actual, usar su información
                            if (typeof usuario === 'string' && usuario === currentUser?.uid) {
                              return userProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || currentUser.email || 'Tú';
                            }
                            
                            // Para otros UIDs o casos no identificados
                            return typeof usuario === 'string' ? 'Usuario no identificado' : 'Usuario no registrado';
                          })()
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Motivo:</strong> {dialogHistorial.liquidacion.motivoEdicion || 'Sin motivo especificado'}
                      </Typography>
                    </Paper>

                    {/* Métricas editadas */}
                    <Paper sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.secondary.light, 0.02)
                    }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                        Métricas (Valores Editados)
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.12) : alpha(theme.palette.primary.main, 0.03) }}>
                          <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.1, fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>MÁQUINAS</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.primary.main }}>{dialogHistorial.liquidacion.metricas?.totalMaquinas || dialogHistorial.liquidacion.metricas?.numeroMaquinas || 0}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.success.dark, 0.12) : alpha(theme.palette.success.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>PRODUCCIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.success.main }}>{formatearMonto(dialogHistorial.liquidacion.metricas?.totalProduccion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.12) : alpha(theme.palette.warning.light, 0.08) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>DERECHOS DE EXPLOTACIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.warning.main }}>{formatearMontoConDecimales(dialogHistorial.liquidacion.metricas?.derechosExplotacion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.error.dark, 0.12) : alpha(theme.palette.error.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>GASTOS DE ADMINISTRACIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.error.main }}>{formatearMontoConDecimales(dialogHistorial.liquidacion.metricas?.gastosAdministracion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.info.dark, 0.12) : alpha(theme.palette.info.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>TOTAL IMPUESTOS</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.text.primary }}>{formatearMontoConDecimales(dialogHistorial.liquidacion.metricas?.totalImpuestos)}</Typography>
                        </Paper>
                      </Box>
                    </Paper>
                  </Box>
                </Grid>

                {/* Fila inferior: Historial de cambios */}
                <Grid item xs={12}>
                  <Paper sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.warning.dark, 0.05)
                      : alpha(theme.palette.warning.light, 0.03),
                    width: '100%'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                      mb: 2
                    }}>
                      HISTORIAL DE EDICIONES
                    </Typography>

                    {dialogHistorial.liquidacion.historialEdiciones?.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dialogHistorial.liquidacion.historialEdiciones.map((edicion, index) => (
                          <Box key={index} sx={{
                            p: 2,
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                            background: theme.palette.mode === 'dark'
                              ? alpha(theme.palette.warning.dark, 0.03)
                              : alpha(theme.palette.warning.light, 0.02)
                          }}>
                            <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                              <strong>Editado por:</strong> {
                                (() => {
                                  const usuario = edicion.usuario;
                                  if (usuario && typeof usuario === 'object') {
                                    return usuario.name || usuario.displayName || usuario.email?.split('@')[0] || usuario.email || 'Usuario';
                                  }
                                  if (typeof usuario === 'string' && usuario === currentUser?.uid) {
                                    return userProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || currentUser.email || 'Tú';
                                  }
                                  return typeof usuario === 'string' ? 'Usuario no identificado' : 'Usuario no registrado';
                                })()
                              }
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                              <strong>Motivo:</strong> {edicion.motivo || 'Sin motivo especificado'}
                            </Typography>

                            {Array.isArray(edicion.cambios) && edicion.cambios.length > 0 && (
                              <Box sx={{ mt: 1, border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`, borderRadius: 1, overflow: 'hidden', width: 'fit-content' }}>
                                <Table size="small" sx={{ minWidth: 980, tableLayout: 'auto' }}>
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
                                      <TableCell rowSpan={2} sx={{ fontSize: '0.75rem', fontWeight: 700, verticalAlign: 'middle' }}>Serial</TableCell>
                                      <TableCell align="center" colSpan={4} sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700 }}>ANTES (Original)</TableCell>
                                      <TableCell align="center" colSpan={4} sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700 }}>DESPUÉS (Modificada)</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Producción</TableCell>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Derechos</TableCell>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Gastos</TableCell>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Total Impuestos</TableCell>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Producción</TableCell>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Derechos</TableCell>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Gastos</TableCell>
                                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Total Impuestos</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {edicion.cambios.map((chg, idx) => {
                                      const serialKey = (chg.serial != null) ? String(chg.serial).trim() : '';
                                      const a = chg.antes || (datosOriginales?.get(serialKey) ?? null);
                                      const d = chg.despues || chg.nuevo || null;
                                      return (
                                        <TableRow key={`c-${idx}`}>
                                          <TableCell sx={{ fontSize: '0.8125rem' }}>{chg.serial || '—'}</TableCell>
                                          <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{a ? formatearMonto(a.produccion) : '—'}</TableCell>
                                          <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{a ? formatearMontoConDecimales(a.derechosExplotacion) : '—'}</TableCell>
                                          <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{a ? formatearMontoConDecimales(a.gastosAdministracion) : '—'}</TableCell>
                                          <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{a ? formatearMontoConDecimales(a.totalImpuestos ?? ((a.derechosExplotacion || 0) + (a.gastosAdministracion || 0))) : '—'}</TableCell>
                                          <TableCell align="right" sx={{ color: theme.palette.success.main, fontWeight: 600, whiteSpace: 'nowrap' }}>{d ? formatearMonto(d.produccion) : '—'}</TableCell>
                                          <TableCell align="right" sx={{ color: theme.palette.warning.main, fontWeight: 600, whiteSpace: 'nowrap' }}>{d ? formatearMontoConDecimales(d.derechosExplotacion) : '—'}</TableCell>
                                          <TableCell align="right" sx={{ color: theme.palette.error.main, fontWeight: 600, whiteSpace: 'nowrap' }}>{d ? formatearMontoConDecimales(d.gastosAdministracion) : '—'}</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: theme.palette.text.primary }}>{d ? formatearMontoConDecimales(d.totalImpuestos ?? ((d.derechosExplotacion || 0) + (d.gastosAdministracion || 0))) : '—'}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 1 }}>
                        No hay historial de ediciones disponible
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1.5, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={() => eliminarLiquidacionEditada(dialogHistorial.liquidacion)}
                variant="contained"
                startIcon={<DeleteIcon />}
                sx={{ 
                  borderRadius: 1.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Eliminar Edición
              </Button>
              {dialogHistorial.liquidacion?.esEdicion && (
                <Button
                  onClick={() => {
                    cerrarModalHistorial();
                    abrirModalEdicion(dialogHistorial.liquidacion);
                  }}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 1.5, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    borderWidth: 2,
                    background: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                    '&:hover': {
                      borderWidth: 2,
                      background: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                  startIcon={<EditIcon />}
                >
                  Editar
                </Button>
              )}
            </Box>
            <Button
              onClick={cerrarModalHistorial}
              variant="text"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default LiquidacionesPorSalaPage;
