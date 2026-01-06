import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  Skeleton,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  FileDownload,
  Assessment,
  Business,
  CalendarToday,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportarEstadisticasLiquidaciones } from '../utils/estadisticasLiquidacionesExcelExport';
import { useNotifications } from '../context/NotificationsContext';

// ===== PÁGINA DE ESTADÍSTICAS DE LIQUIDACIONES =====
// Comparativas por trimestre, semestre y año
// Métricas por empresa y por sala
// Alertas automáticas y exportación Excel

const LiquidacionesEstadisticasPage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  // ===== ESTADOS =====
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('todas');
  const [salaSeleccionada, setSalaSeleccionada] = useState('todas');
  const [periodoTab, setPeriodoTab] = useState(0); // 0: Trimestral, 1: Semestral, 2: Anual
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [salasDisponibles, setSalasDisponibles] = useState([]);

  // ===== CARGAR EMPRESAS DESDE LIQUIDACIONES =====
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const hace24Meses = new Date();
        hace24Meses.setMonth(hace24Meses.getMonth() - 24);

        const q = query(
          collection(db, 'liquidaciones'),
          where('fechas.createdAt', '>=', hace24Meses)
        );

        const snapshot = await getDocs(q);
        const empresasSet = new Set();
        
        snapshot.docs.forEach(doc => {
          const empresa = doc.data().empresa;
          // Extraer nombre del objeto si es necesario
          const nombreEmpresa = typeof empresa === 'object' && empresa?.nombre 
            ? empresa.nombre 
            : empresa;
          
          if (nombreEmpresa && typeof nombreEmpresa === 'string' && nombreEmpresa.trim()) {
            empresasSet.add(nombreEmpresa);
          }
        });

        const empresasData = Array.from(empresasSet)
          .sort()
          .map((name, index) => ({
            id: `empresa_${index}`,
            name: name
          }));

        setEmpresas(empresasData);
        console.log('✅ Empresas cargadas:', empresasData.length);
      } catch (error) {
        console.error('Error cargando empresas:', error);
      }
    };
    cargarEmpresas();
  }, []);

  // ===== DEBUG: Mostrar estado actual =====
  useEffect(() => {
    console.log('📊 Estado actual:');
    console.log('   - Empresas:', empresas.length);
    console.log('   - Empresa seleccionada:', empresaSeleccionada);
    console.log('   - Salas disponibles:', salasDisponibles.length);
    console.log('   - Sala seleccionada:', salaSeleccionada);
    console.log('   - Liquidaciones:', liquidaciones.length);
  }, [empresas, empresaSeleccionada, salasDisponibles, salaSeleccionada, liquidaciones]);

  // ===== CARGAR LIQUIDACIONES (últimos 24 meses) =====
  useEffect(() => {
    const cargarLiquidaciones = async () => {
      setLoading(true);
      try {
        const hace24Meses = new Date();
        hace24Meses.setMonth(hace24Meses.getMonth() - 24);

        // Cargar todas las liquidaciones de los últimos 24 meses
        const q = query(
          collection(db, 'liquidaciones'),
          where('fechas.createdAt', '>=', hace24Meses),
          orderBy('fechas.createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrar por empresa en el cliente (porque empresa puede ser string u objeto)
        if (empresaSeleccionada !== 'todas') {
          data = data.filter(liq => {
            const empresaDoc = liq.empresa;
            const nombreEmpresa = typeof empresaDoc === 'object' && empresaDoc?.nombre 
              ? empresaDoc.nombre 
              : empresaDoc;
            return nombreEmpresa === empresaSeleccionada;
          });
        }

        setLiquidaciones(data);
        console.log('✅ Liquidaciones totales:', snapshot.docs.length);
        console.log('✅ Liquidaciones filtradas:', data.length);
        console.log('✅ Filtro empresa:', empresaSeleccionada);

        // NOTA: Los datos ya están consolidados por empresa/período
        // No hay array consolidatedData con datos por sala individual
        setSalasDisponibles([]);
        console.log('ℹ️ Los datos están consolidados por empresa/mes (no hay desglose por sala)');
      } catch (error) {
        console.error('Error cargando liquidaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarLiquidaciones();
  }, [empresaSeleccionada]);

  // ===== PROCESAMIENTO DE DATOS =====
  const datosEstadisticos = useMemo(() => {
    if (!liquidaciones.length) return null;

    console.log('🔍 Procesando liquidaciones:', liquidaciones.length);

    // Función para agrupar por período
    const agruparPorPeriodo = (tipo) => {
      const agrupado = {};
      const ahora = new Date();
      const añoActual = ahora.getFullYear();
      const mesActual = ahora.getMonth(); // 0-11

      // Calcular el período actual y los límites
      let periodoActual;
      let periodosAMostrar = [];

      if (tipo === 'trimestral') {
        const trimestreActual = Math.floor(mesActual / 3) + 1;
        // Generar últimos 4 trimestres desde el trimestre anterior al actual
        for (let i = 3; i >= 0; i--) {
          let año = añoActual;
          let trimestre = trimestreActual - i;
          
          while (trimestre <= 0) {
            trimestre += 4;
            año -= 1;
          }
          
          periodosAMostrar.push(`${año}-Q${trimestre}`);
        }
      } else if (tipo === 'semestral') {
        const semestreActual = mesActual < 6 ? 1 : 2;
        // Generar últimos 4 semestres
        for (let i = 3; i >= 0; i--) {
          let año = añoActual;
          let semestre = semestreActual - i;
          
          while (semestre <= 0) {
            semestre += 2;
            año -= 1;
          }
          
          periodosAMostrar.push(`${año}-S${semestre}`);
        }
      } else {
        // Generar últimos 3 años
        for (let i = 2; i >= 0; i--) {
          periodosAMostrar.push(`${añoActual - i}`);
        }
      }

      console.log('📅 Períodos a mostrar:', periodosAMostrar);

      liquidaciones.forEach(liq => {
        // Estructura real de Firestore:
        // - empresa: {nombre, normalizado}
        // - metricas: {totalProduccion, derechosExplotacion, gastosAdministracion, maquinasConsolidadas, totalEstablecimientos, totalImpuestos}
        // - fechas: {mesLiquidacion, añoLiquidacion, periodoLiquidacion, createdAt}
        
        const fecha = liq.fechas?.createdAt?.toDate?.() || new Date(liq.fechas?.createdAt);
        const año = liq.fechas?.añoLiquidacion || fecha.getFullYear();
        const mes = fecha.getMonth(); // 0-11

        let periodoKey;
        if (tipo === 'trimestral') {
          const trimestre = Math.floor(mes / 3) + 1;
          periodoKey = `${año}-Q${trimestre}`;
        } else if (tipo === 'semestral') {
          const semestre = mes < 6 ? 1 : 2;
          periodoKey = `${año}-S${semestre}`;
        } else {
          periodoKey = `${año}`;
        }

        // Solo procesar si está en el rango de períodos a mostrar
        if (!periodosAMostrar.includes(periodoKey)) {
          return;
        }

        if (!agrupado[periodoKey]) {
          agrupado[periodoKey] = {
            produccion: 0,
            diasTransmitidos: 0,
            numSalas: 0,
            maquinas: 0,
            impuestos: 0,
            derechosExplotacion: 0,
            gastosAdministracion: 0,
            numDocumentos: 0
          };
        }

        // Sumar datos desde la estructura real (metricas)
        agrupado[periodoKey].produccion += liq.metricas?.totalProduccion || 0;
        agrupado[periodoKey].numSalas += liq.metricas?.totalEstablecimientos || 0;
        agrupado[periodoKey].maquinas += liq.metricas?.maquinasConsolidadas || 0;
        agrupado[periodoKey].impuestos += liq.metricas?.totalImpuestos || 0;
        agrupado[periodoKey].derechosExplotacion += liq.metricas?.derechosExplotacion || 0;
        agrupado[periodoKey].gastosAdministracion += liq.metricas?.gastosAdministracion || 0;
        
        // Estimación de días transmitidos (30 días por mes como estándar)
        agrupado[periodoKey].diasTransmitidos += 30;
        agrupado[periodoKey].numDocumentos += 1;
      });

      console.log('✅ Datos agrupados por período:', Object.keys(agrupado).length, 'períodos');
      console.log('📊 Períodos con datos:', Object.keys(agrupado));

      return agrupado;
    };

    const tipoActual = periodoTab === 0 ? 'trimestral' : periodoTab === 1 ? 'semestral' : 'anual';
    return agruparPorPeriodo(tipoActual);
  }, [liquidaciones, periodoTab]);

  // ===== CÁLCULO DE KPIs =====
  const kpis = useMemo(() => {
    if (!datosEstadisticos) return null;

    const valores = Object.values(datosEstadisticos);
    const produccionTotal = valores.reduce((sum, p) => sum + p.produccion, 0);
    const diasTotal = valores.reduce((sum, p) => sum + p.diasTransmitidos, 0);
    const produccionPromedio = valores.length > 0 ? produccionTotal / valores.length : 0;

    // Calcular tendencia (últimos 3 períodos vs primeros 3)
    const periodosOrdenados = Object.keys(datosEstadisticos).sort();
    const ultimos3 = periodosOrdenados.slice(-3).reduce((sum, key) => sum + datosEstadisticos[key].produccion, 0);
    const primeros3 = periodosOrdenados.slice(0, 3).reduce((sum, key) => sum + datosEstadisticos[key].produccion, 0);
    
    let tendencia = 'estable';
    let porcentajeCambio = 0;
    if (primeros3 > 0) {
      porcentajeCambio = ((ultimos3 - primeros3) / primeros3) * 100;
      if (porcentajeCambio > 5) tendencia = 'creciente';
      else if (porcentajeCambio < -5) tendencia = 'decreciente';
    }

    // Promedio por sala/máquina
    const salasActivas = new Set();
    Object.values(datosEstadisticos).forEach(p => {
      if (p.numSalas) salasActivas.add(p.numSalas);
    });
    const numSalasPromedio = salasActivas.size > 0 ? Array.from(salasActivas).reduce((a, b) => a + b, 0) / salasActivas.size : 0;
    const produccionPorSala = numSalasPromedio > 0 ? produccionTotal / numSalasPromedio : 0;

    const maquinasTotal = valores.reduce((sum, p) => sum + p.maquinas, 0);
    const produccionPorMaquina = maquinasTotal > 0 ? produccionTotal / maquinasTotal : 0;

    return {
      produccionTotal,
      diasTotal,
      produccionPromedio,
      tendencia,
      porcentajeCambio,
      produccionPorSala,
      produccionPorMaquina,
      numPeriodos: valores.length
    };
  }, [datosEstadisticos]);

  // ===== FORMATEO DE NÚMEROS =====
  const formatearNumeroGrande = (valor) => {
    if (valor >= 1000000000) return `$${(valor / 1000000000).toFixed(1)}MM`;
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}K`;
    return `$${valor}`;
  };

  const formatearPeriodo = (periodo) => {
    if (periodo.includes('Q')) {
      const [año, trimestre] = periodo.split('-');
      const numTrimestre = trimestre.replace('Q', '');
      const nombreTrimestre = {
        '1': '1er Trimestre',
        '2': '2do Trimestre',
        '3': '3er Trimestre',
        '4': '4to Trimestre'
      }[numTrimestre] || trimestre;
      return `${nombreTrimestre} ${año}`;
    }
    if (periodo.includes('S')) {
      const [año, semestre] = periodo.split('-');
      const numSemestre = semestre.replace('S', '');
      const nombreSemestre = {
        '1': '1er Semestre',
        '2': '2do Semestre'
      }[numSemestre] || semestre;
      return `${nombreSemestre} ${año}`;
    }
    return `Año ${periodo}`;
  };

  // ===== DATOS PARA GRÁFICOS =====
  const datosGraficos = useMemo(() => {
    if (!datosEstadisticos) return [];

    return Object.keys(datosEstadisticos)
      .sort()
      .map(key => {
        const data = datosEstadisticos[key];
        
        return {
          periodo: key,
          periodoLabel: formatearPeriodo(key),
          produccion: Math.round(data.produccion),
          diasTransmitidos: data.diasTransmitidos, // Total sumado
          salas: data.numSalas, // Total sumado
          maquinas: data.maquinas, // Total sumado
          impuestos: Math.round(data.impuestos)
        };
      });
  }, [datosEstadisticos]);

  // ===== ALERTAS =====
  const alertas = useMemo(() => {
    if (!datosEstadisticos || Object.keys(datosEstadisticos).length < 2) return [];

    const alerts = [];
    const periodosOrdenados = Object.keys(datosEstadisticos).sort();
    const ultimoPeriodo = periodosOrdenados[periodosOrdenados.length - 1];
    const penultimoPeriodo = periodosOrdenados[periodosOrdenados.length - 2];

    if (ultimoPeriodo && penultimoPeriodo) {
      const prodActual = datosEstadisticos[ultimoPeriodo].produccion;
      const prodAnterior = datosEstadisticos[penultimoPeriodo].produccion;
      const cambio = ((prodActual - prodAnterior) / prodAnterior) * 100;

      if (cambio < -30) {
        alerts.push({
          tipo: 'error',
          mensaje: `Caída crítica de ${Math.abs(cambio).toFixed(1)}% vs período anterior`,
          icono: <ErrorIcon />
        });
      } else if (cambio < -15) {
        alerts.push({
          tipo: 'warning',
          mensaje: `Disminución de ${Math.abs(cambio).toFixed(1)}% vs período anterior`,
          icono: <Warning />
        });
      } else if (cambio > 20) {
        alerts.push({
          tipo: 'success',
          mensaje: `Crecimiento de ${cambio.toFixed(1)}% vs período anterior`,
          icono: <CheckCircle />
        });
      }
    }

    // Alerta si no hay días transmitidos
    if (datosEstadisticos[ultimoPeriodo]?.diasTransmitidos === 0) {
      alerts.push({
        tipo: 'error',
        mensaje: 'No hay días transmitidos en el último período',
        icono: <ErrorIcon />
      });
    }

    return alerts;
  }, [datosEstadisticos]);

  // ===== EXPORTAR A EXCEL =====
  const handleExportarExcel = async () => {
    try {
      const filtros = {
        empresa: empresaSeleccionada,
        sala: 'N/A (consolidado)',
        tipoPeriodo: periodoTab === 0 ? 'Trimestral' : periodoTab === 1 ? 'Semestral' : 'Anual'
      };

      const result = await exportarEstadisticasLiquidaciones(
        datosEstadisticos,
        kpis,
        datosGraficos,
        alertas,
        filtros
      );

      if (result.success) {
        addNotification(result.message, 'success');
      } else {
        addNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Error exportando:', error);
      addNotification('Error al exportar estadísticas', 'error');
    }
  };

  // ===== RENDERIZADO =====
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 2,
            p: 3,
            mb: 3,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Assessment sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Estadísticas de Liquidaciones
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Análisis comparativo por trimestre, semestre y año
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* FILTROS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    value={empresaSeleccionada}
                    onChange={(e) => {
                      setEmpresaSeleccionada(e.target.value);
                      setSalaSeleccionada('todas');
                    }}
                    label="Empresa"
                  >
                    <MenuItem value="todas">Todas las empresas</MenuItem>
                    {empresas.map(emp => (
                      <MenuItem key={emp.id} value={emp.name}>
                        {emp.name || 'Sin nombre'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* NOTA: Filtro por sala oculto - los datos están consolidados por empresa/mes */}
              <Grid item xs={12} sm={8}>
                <Button
                  variant="contained"
                  startIcon={<FileDownload />}
                  fullWidth
                  sx={{ height: 56, borderRadius: 1 }}
                  disabled={!datosEstadisticos}
                  onClick={handleExportarExcel}
                >
                  Exportar Excel
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* TABS DE PERÍODO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={periodoTab}
            onChange={(e, newValue) => setPeriodoTab(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem'
              }
            }}
          >
            <Tab label="Trimestral" icon={<CalendarToday />} iconPosition="start" />
            <Tab label="Semestral" icon={<CalendarToday />} iconPosition="start" />
            <Tab label="Anual" icon={<CalendarToday />} iconPosition="start" />
          </Tabs>
        </Card>
      </motion.div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Box sx={{ mb: 3 }}>
            {alertas.map((alerta, index) => (
              <Alert
                key={index}
                severity={alerta.tipo}
                icon={alerta.icono}
                sx={{ mb: 1, borderRadius: 1 }}
              >
                {alerta.mensaje}
              </Alert>
            ))}
          </Box>
        </motion.div>
      )}

      {/* KPIs */}
      {kpis && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Producción Total */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Producción Total
                  </Typography>
                  <Typography variant="h4" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    ${kpis.produccionTotal.toLocaleString()}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${kpis.numPeriodos} períodos`}
                    sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Promedio por Período */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Promedio por Período
                  </Typography>
                  <Typography variant="h4" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    ${Math.round(kpis.produccionPromedio).toLocaleString()}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${kpis.diasTotal} días total`}
                    sx={{ backgroundColor: alpha(theme.palette.secondary.main, 0.1) }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Tendencia */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Tendencia
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                    {kpis.tendencia === 'creciente' && <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 1 }} />}
                    {kpis.tendencia === 'decreciente' && <TrendingDown sx={{ fontSize: 40, color: 'error.main', mr: 1 }} />}
                    {kpis.tendencia === 'estable' && <TrendingFlat sx={{ fontSize: 40, color: 'warning.main', mr: 1 }} />}
                    <Typography variant="h4" fontWeight={600}>
                      {Math.abs(kpis.porcentajeCambio).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={kpis.tendencia === 'creciente' ? 'Crecimiento' : kpis.tendencia === 'decreciente' ? 'Disminución' : 'Estable'}
                    color={kpis.tendencia === 'creciente' ? 'success' : kpis.tendencia === 'decreciente' ? 'error' : 'default'}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Producción por Máquina */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Prod. Promedio por Sala
                  </Typography>
                  <Typography variant="h4" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    ${Math.round(kpis.produccionPorSala).toLocaleString()}
                  </Typography>
                  <Chip
                    size="small"
                    label="Estimado"
                    sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* GRÁFICO DE BARRAS */}
      {datosGraficos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <Card sx={{ mb: 3, borderRadius: 2, p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Producción por Período
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={datosGraficos}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="periodoLabel" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tickFormatter={(value) => formatearNumeroGrande(value)}
                  style={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Producción') return [`$${value.toLocaleString()}`, name];
                    return [value.toLocaleString(), name];
                  }}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar 
                  dataKey="produccion" 
                  fill={theme.palette.primary.main} 
                  name="Producción"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* GRÁFICO DE LÍNEAS */}
      {datosGraficos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          <Card sx={{ mb: 3, borderRadius: 2, p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Tendencias Operativas
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={datosGraficos}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="periodoLabel" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12 }}
                  label={{ value: 'Días', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12 }}
                  label={{ value: 'Máquinas', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => [value.toLocaleString(), name]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="diasTransmitidos" 
                  stroke={theme.palette.secondary.main} 
                  strokeWidth={2.5} 
                  name="Días Transmitidos"
                  dot={{ fill: theme.palette.secondary.main, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="maquinas" 
                  stroke={theme.palette.warning.main} 
                  strokeWidth={2.5} 
                  name="Máquinas Consolidadas"
                  dot={{ fill: theme.palette.warning.main, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* TABLA DETALLADA */}
      {datosGraficos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.0 }}
        >
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Detalle Comparativo por Período
              </Typography>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Período</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Producción Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Impuestos</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Días</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Salas</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Máquinas</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Prod/Día</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosGraficos.map((row, index) => (
                      <TableRow
                        key={row.periodo}
                        sx={{
                          backgroundColor: index % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{row.periodoLabel}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.primary.main }}>
                          ${row.produccion.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          ${row.impuestos.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{row.diasTransmitidos}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{row.salas}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{row.maquinas.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500 }}>
                          ${row.diasTransmitidos > 0 ? Math.round(row.produccion / row.diasTransmitidos).toLocaleString() : 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* EMPTY STATE */}
      {!datosEstadisticos && !loading && (
        <Card sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay datos disponibles para el período seleccionado
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Intenta seleccionar otra empresa o período
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default LiquidacionesEstadisticasPage;
