import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  CircularProgress,
  Avatar,
  alpha
} from '@mui/material';
import {
  CloudUpload,
  Assessment,
  Business,
  Receipt,
  TrendingUp,
  Download,
  Refresh,
  Search,
  FilterList,
  GetApp,
  DeleteForever,
  CheckCircle,
  Warning,
  Info,
  Error as ErrorIcon,
  Casino,
  Timeline,
  Storage,
  PieChart,
  BarChart,
  DateRange
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { exportarLiquidacionSpectacular, exportarLiquidacionSimple } from '../utils/liquidacionExcelExportSpectacularFixed';
import { exportarLiquidacionPythonFormat } from '../utils/liquidacionExcelExportPythonFormat';
import useCompanies from '../hooks/useCompanies';
import * as XLSX from 'xlsx';

const LiquidacionesPage = () => {
  const theme = useTheme();
  const { currentUser, firestoreProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { companies, loading: companiesLoading } = useCompanies();

  // Estados principales
  const [selectedFile, setSelectedFile] = useState(null);
  const [empresa, setEmpresa] = useState('');
  const [empresaCompleta, setEmpresaCompleta] = useState(null); // Estado para empresa completa con logo
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // Estados de datos
  const [originalData, setOriginalData] = useState(null);
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [reporteBySala, setReporteBySala] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  
  // Estados de UI
  const [logs, setLogs] = useState([]);
  const [showEstablecimientoSelector, setShowEstablecimientoSelector] = useState(false);
  const [selectedEstablecimientos, setSelectedEstablecimientos] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationData, setValidationData] = useState(null);
  const [tarifasOficiales, setTarifasOficiales] = useState({});
  const [archivoTarifas, setArchivoTarifas] = useState(null);
  
  // Estados para sistema de tarifas y validación
  const [liquidacionCoincide, setLiquidacionCoincide] = useState(true);
  const [showTarifasOptions, setShowTarifasOptions] = useState(false);
  const [procesandoTarifas, setProcesandoTarifas] = useState(false);
  
  // Referencias
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const logIdCounter = useRef(0);

  // Debug: Monitorear cambios en metricsData
  console.log('🎯 COMPONENT RENDER - metricsData:', metricsData);
  
  // Debug adicional: mostrar valores específicos cuando metricsData existe
  if (metricsData) {
    console.log('📊 VALORES ESPECÍFICOS EN RENDER:');
    console.log('  - totalDerechos:', metricsData.totalDerechos);
    console.log('  - totalGastos:', metricsData.totalGastos);
    console.log('  - totalProduccion:', metricsData.totalProduccion);
    console.log('  - totalImpuestos:', metricsData.totalImpuestos);
  }

  // Función para agregar logs
  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    logIdCounter.current += 1;
    const newLog = {
      id: `log-${logIdCounter.current}-${Date.now()}`,
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // Función para buscar empresa por número de contrato
  const buscarEmpresaPorContrato = useCallback((numeroContrato) => {
    if (!companies || companies.length === 0) {
      console.log('⚠️ No hay empresas cargadas');
      return null;
    }

    console.log(`🔍 Buscando empresa con contrato: ${numeroContrato}`);
    console.log('📋 Empresas disponibles:', companies.map(c => ({ nombre: c.name, contrato: c.contractNumber })));

    // Buscar por número de contrato exacto
    const empresaEncontrada = companies.find(company => 
      company.contractNumber === numeroContrato || 
      company.contractNumber === numeroContrato.toString()
    );

    if (empresaEncontrada) {
      console.log(`✅ Empresa encontrada: ${empresaEncontrada.name} (Contrato: ${empresaEncontrada.contractNumber})`);
      setEmpresaCompleta(empresaEncontrada); // Guardar empresa completa
      return empresaEncontrada.name;
    } else {
      console.log(`❌ No se encontró empresa con contrato: ${numeroContrato}`);
      console.log('📝 Contratos disponibles:', companies.map(c => c.contractNumber));
      setEmpresaCompleta(null); // Limpiar empresa completa
      return null;
    }
  }, [companies]);

  // Manejo de archivos
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      addNotification('Error: Solo se permiten archivos Excel (.xlsx, .xls) o CSV', 'error');
      return;
    }

    setSelectedFile(file);
    addLog(`📁 Archivo seleccionado: ${file.name}`, 'success');
    
    // La empresa se obtendrá automáticamente del archivo al procesarlo
    addLog('🏢 La empresa se detectará automáticamente del archivo...', 'info');
    
    // Procesar automáticamente después de un breve delay
    setTimeout(() => {
      procesarLiquidacion(file);
    }, 500);
  };

  // Drag & Drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Procesamiento principal
  const procesarLiquidacion = async (archivoManual = null) => {
    const archivo = archivoManual || selectedFile;
    
    if (!archivo) {
      addNotification('Error: Seleccione un archivo primero', 'error');
      return;
    }

    if (companiesLoading) {
      addNotification('Esperando carga de empresas...', 'warning');
      return;
    }

    // Si no hay archivo manual, verificar que el selectedFile esté establecido
    if (!archivoManual && !selectedFile) {
      addNotification('Error: No hay archivo seleccionado', 'error');
      return;
    }

    setProcessing(true);
    addLog('⚙️ Iniciando procesamiento automático...', 'info');

    try {
      // Leer archivo
      const data = await readFile(archivo);
      addLog('✅ Archivo leído correctamente', 'success');
      
      // Extraer número de contrato del archivo (primera columna de datos)
      let numeroContrato = null;
      let empresaDetectada = null;
      
      addLog('🔍 Buscando número de contrato en el archivo...', 'info');
      
      // Buscar en las primeras filas para encontrar el contrato
      for (let i = 1; i < Math.min(10, data.length); i++) {
        const fila = data[i];
        if (fila && fila[0]) {
          const posibleContrato = fila[0].toString().trim();
          if (posibleContrato && posibleContrato !== '') {
            numeroContrato = posibleContrato;
            addLog(`📋 Número de contrato encontrado: ${numeroContrato}`, 'info');
            break;
          }
        }
      }
      
      if (numeroContrato) {
        empresaDetectada = buscarEmpresaPorContrato(numeroContrato);
        if (empresaDetectada) {
          setEmpresa(empresaDetectada);
          addLog(`🏢 Empresa detectada: ${empresaDetectada}`, 'success');
        } else {
          addLog(`⚠️ No se encontró empresa para el contrato: ${numeroContrato}`, 'warning');
          addNotification(`Contrato ${numeroContrato} no encontrado en la base de datos`, 'warning');
          // Continuar con empresa "Desconocida"
          setEmpresa(`Contrato ${numeroContrato} (No encontrado)`);
        }
      } else {
        addLog('⚠️ No se pudo detectar número de contrato', 'warning');
        setEmpresa('Empresa no detectada');
      }
      
      // Detectar encabezados
      const headerRow = detectarFilaEncabezados(data);
      addLog(`🔍 Encabezados detectados en fila ${headerRow + 1}`, 'info');
      
      // Procesar datos
      const processedData = procesarDatos(data, headerRow);
      setOriginalData(processedData);
      
      // Consolidar por NUC
      const consolidated = consolidarDatos(processedData);
      
      // Generar reporte por sala
      const reporteSala = generarReporteSala(consolidated);
      
      // Calcular métricas
      const metrics = calcularMetricas(consolidated, reporteSala);
      
      // Debug: Log de los datos consolidados
      console.log('🔍 DATOS CONSOLIDAS PARA VALIDACIÓN:');
      console.log('Número de máquinas consolidadas:', consolidated.length);
      console.log('Primera máquina consolidada:', consolidated[0]);
      console.log('Últimas 3 máquinas:', consolidated.slice(-3));
      
      // Debug: Calcular totales paso a paso
      const totalProduccion = consolidated.reduce((sum, item) => {
        const produccion = Number(item.produccion) || 0;
        console.log(`Máquina ${item.nuc}: producción = ${produccion}`);
        return sum + produccion;
      }, 0);
      
      const totalDerechos = consolidated.reduce((sum, item) => {
        const derechos = Number(item.derechosExplotacion) || 0;
        return sum + derechos;
      }, 0);
      
      const totalGastos = consolidated.reduce((sum, item) => {
        const gastos = Number(item.gastosAdministracion) || 0;
        return sum + gastos;
      }, 0);
      
      console.log('📊 TOTALES CALCULADOS:');
      console.log('Total Producción:', totalProduccion);
      console.log('Total Derechos:', totalDerechos);
      console.log('Total Gastos:', totalGastos);
      
      // Preparar datos de validación
      const validacion = {
        consolidated,
        reporteSala,
        metrics,
        totalMaquinas: consolidated.length,
        totalEstablecimientos: reporteSala.length,
        totalProduccion: totalProduccion,
        totalDerechos: totalDerechos,
        totalGastos: totalGastos,
        totalImpuestos: totalDerechos + totalGastos
      };
      
      // Mostrar modal de validación
      setValidationData(validacion);
      setShowValidationModal(true);
      
    } catch (error) {
      console.error('Error procesando liquidación:', error);
      addLog(`❌ Error: ${error.message}`, 'error');
      addNotification(`Error procesando liquidación: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Función para leer archivo
  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Error leyendo archivo: ' + error.message));
        }
      };
      
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsBinaryString(file);
    });
  };

  // Detectar fila de encabezados (mejorado como Python)
  const detectarFilaEncabezados = (data) => {
    const columnasClave = ['serial', 'nuc', 'nuid', 'establecimiento', 'sala', 'base', 'liquidacion', 'produccion'];
    
    addLog('🔍 Analizando las primeras 15 filas para encontrar encabezados...');
    
    // Búsqueda estricta
    for (let fila = 0; fila < Math.min(15, data.length); fila++) {
      const row = data[fila];
      if (!row) continue;
      
      const rowText = row.map(cell => String(cell || '').toLowerCase().trim());
      const coincidencias = columnasClave.filter(clave => 
        rowText.some(cell => cell.includes(clave))
      );
      
      if (coincidencias.length >= 3) {
        addLog(`✅ Encabezados detectados en fila ${fila + 1} con ${coincidencias.length} coincidencias: ${coincidencias.join(', ')}`);
        return fila;
      }
    }
    
    // Búsqueda flexible
    addLog('🔍 Búsqueda estricta fallida, probando búsqueda flexible...');
    const palabrasEncabezado = ['serial', 'nuc', 'establecimiento', 'contrato', 'codigo', 'tipo', 'fecha', 'base', 'liquidacion', 'produccion', 'ingresos', 'casino', 'sala'];
    
    for (let fila = 0; fila < Math.min(15, data.length); fila++) {
      const row = data[fila];
      if (!row) continue;
      
      const rowText = row.map(cell => String(cell || '').toLowerCase().trim());
      const coincidencias = palabrasEncabezado.filter(palabra => 
        rowText.some(cell => cell.includes(palabra))
      );
      
      if (coincidencias.length >= 4) {
        addLog(`✅ Encabezados detectados (flexible) en fila ${fila + 1} con ${coincidencias.length} coincidencias: ${coincidencias.join(', ')}`);
        return fila;
      }
    }
    
    // Análisis de primera fila específicamente
    if (data[0]) {
      const primeraFila = data[0].map(cell => String(cell || '').toLowerCase().trim());
      const coincidenciasPrimera = palabrasEncabezado.filter(palabra => 
        primeraFila.some(cell => cell.includes(palabra))
      );
      
      if (coincidenciasPrimera.length >= 4) {
        addLog(`✅ Primera fila contiene ${coincidenciasPrimera.length} palabras clave, usando como encabezados`);
        return 0;
      }
    }
    
    // Fallback
    addLog('⚠️ No se detectaron encabezados automáticamente, usando fila 2 como fallback');
    return 1;
  };

  // Procesar datos del archivo
  const procesarDatos = (data, headerRow) => {
    const headers = data[headerRow];
    const rows = data.slice(headerRow + 1);
    
    console.log('Headers encontrados:', headers);
    console.log('Procesando desde fila:', headerRow);
    
    // Mapear columnas basado en el análisis del archivo real
    const columnMap = {};
    headers.forEach((header, index) => {
      const headerLower = String(header || '').toLowerCase().trim();
      
      // Mapeo específico basado en el archivo "Liquidación Diaria.xlsx"
      if (headerLower.includes('nuc')) {
        columnMap.nuc = index;
      } else if (headerLower.includes('serial')) {
        columnMap.serial = index;
      } else if (headerLower.includes('establecimiento')) {
        columnMap.establecimiento = index;
      } else if (headerLower.includes('tipo') && headerLower.includes('apuesta')) {
        columnMap.tipoApuesta = index;
      } else if (headerLower.includes('fecha') && headerLower.includes('reporte')) {
        columnMap.fecha = index;
      } else if (headerLower.includes('contrato')) {
        columnMap.contrato = index;
      } else if (headerLower.includes('cod') && headerLower.includes('local')) {
        columnMap.codLocal = index;
      } else if (headerLower.includes('código') && headerLower.includes('marca')) {
        columnMap.codigoMarca = index;
      } 
      // MAPEO PRINCIPAL para la columna de valores monetarios
      else if (
        headerLower.includes('base') && (headerLower.includes('liquidación') || headerLower.includes('liquidacion')) ||
        headerLower === 'base liquidación diaria' ||
        headerLower === 'base liquidacion diaria' ||
        headerLower.includes('produccion') || 
        headerLower.includes('ingresos') ||
        headerLower.includes('valor') ||
        headerLower.includes('monto')
      ) {
        columnMap.baseLiquidacion = index;
        console.log(`✅ COLUMNA DE VALORES ENCONTRADA: "${header}" en índice ${index}`);
      }
      // Mapeos alternativos para compatibilidad
      else if (headerLower.includes('sala') || headerLower.includes('casino')) {
        columnMap.establecimiento = index;
      } else if (headerLower.includes('categoria') || headerLower.includes('tipo')) {
        columnMap.tipoApuesta = index;
      }
      
      // Debug: mostrar el mapeo
      console.log(`🔍 Header "${header}" → headerLower: "${headerLower}" → index: ${index}`);
    });
    
    console.log('Mapeo de columnas:', columnMap);
    
    // Verificar que tenemos las columnas esenciales
    const columnasEsenciales = ['nuc', 'baseLiquidacion'];
    const columnasFaltantes = columnasEsenciales.filter(col => columnMap[col] === undefined);
    
    if (columnasFaltantes.length > 0) {
      console.warn('⚠️ Columnas esenciales faltantes:', columnasFaltantes);
      addLog(`⚠️ Columnas faltantes: ${columnasFaltantes.join(', ')}`, 'warning');
    }
    
    // Convertir filas a objetos
    const processedRows = rows.map((row, index) => {
      const obj = {};
      Object.keys(columnMap).forEach(key => {
        obj[key] = row[columnMap[key]] || '';
      });
      
      // Log de muestra para las primeras 5 filas
      if (index < 5) {
        console.log(`Fila ${index + 1} procesada:`, obj);
      }
      
      return obj;
    }).filter(row => row.nuc && row.nuc !== ''); // Filtrar filas válidas
    
    console.log('Filas procesadas:', processedRows.length);
    console.log('Primera fila procesada completa:', processedRows[0]);
    
    return processedRows;
  };

  // Calcular días del mes de una fecha
  const calcularDiasMes = (fecha) => {
    try {
      if (!fecha) return 31;
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 31;
      
      const year = fechaObj.getFullYear();
      const month = fechaObj.getMonth();
      return new Date(year, month + 1, 0).getDate();
    } catch {
      return 31; // Valor por defecto
    }
  };

  // Determinar novedad basado en días transmitidos vs días del mes
  const determinarNovedad = (diasTransmitidos, diasMes) => {
    try {
      const dias = parseInt(diasTransmitidos);
      const totalDias = parseInt(diasMes);
      
      if (dias === totalDias) {
        return 'Sin cambios';
      } else if (dias < totalDias) {
        return 'Retiro / Adición';
      } else {
        return 'Retiro / Adición';
      }
    } catch {
      return 'Sin información';
    }
  };

  // Convertir fecha a período texto
  const convertirFechaAPeriodo = (fecha) => {
    try {
      if (!fecha) return '';
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return '';
      
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      return `${meses[fechaObj.getMonth()]} ${fechaObj.getFullYear()}`;
    } catch {
      return '';
    }
  };

  // Consolidar datos por NUC
  const consolidarDatos = (data) => {
    console.log('📊 Consolidando', data.length, 'registros...');
    
    const grouped = {};
    
    data.forEach((row, index) => {
      const key = `${row.nuc}_${row.establecimiento}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          nuc: row.nuc,
          serial: row.serial,
          establecimiento: row.establecimiento,
          tipoApuesta: row.tipoApuesta,
          empresa: empresa,
          produccion: 0,
          diasTransmitidos: 0,
          fechas: []
        };
      }
      
      // Convertir base liquidación a número
      let baseLiq = 0;
      if (row.baseLiquidacion !== undefined && row.baseLiquidacion !== '') {
        baseLiq = parseFloat(row.baseLiquidacion) || 0;
        
        // Debug: Log los primeros 10 valores para verificar
        if (index < 10) {
          console.log(`🔍 Fila ${index + 1}: baseLiquidacion original = "${row.baseLiquidacion}", convertido = ${baseLiq}`);
        }
      } else {
        if (index < 10) {
          console.log(`⚠️ Fila ${index + 1}: baseLiquidacion está vacía o undefined:`, row.baseLiquidacion);
        }
      }
      
      grouped[key].produccion += baseLiq;
      grouped[key].diasTransmitidos += 1;
      
      // Manejar fechas (pueden estar en formato numérico de Excel)
      if (row.fecha && row.fecha !== '') {
        let fechaObj;
        
        if (typeof row.fecha === 'number') {
          // Fecha en formato numérico de Excel (días desde 1900-01-01)
          fechaObj = new Date((row.fecha - 25569) * 86400 * 1000);
        } else {
          fechaObj = new Date(row.fecha);
        }
        
        if (!isNaN(fechaObj.getTime())) {
          grouped[key].fechas.push(fechaObj);
        }
      }
    });
    
    // Convertir a array y calcular campos derivados
    const result = Object.values(grouped).map(item => {
      const derechosExplotacion = item.produccion * 0.12;
      const gastosAdministracion = derechosExplotacion * 0.01;
      const totalImpuestos = derechosExplotacion + gastosAdministracion;
      
      // Calcular período
      let fechaInicio = null;
      let fechaFin = null;
      
      if (item.fechas.length > 0) {
        const fechasValidas = item.fechas.filter(f => !isNaN(f.getTime()));
        if (fechasValidas.length > 0) {
          fechaInicio = new Date(Math.min(...fechasValidas.map(f => f.getTime())));
          fechaFin = new Date(Math.max(...fechasValidas.map(f => f.getTime())));
        }
      }

      // Calcular días del mes basado en la última fecha
      const diasMes = fechaFin ? calcularDiasMes(fechaFin) : 31;
      const periodoTexto = fechaFin ? convertirFechaAPeriodo(fechaFin) : '';
      const novedad = determinarNovedad(item.diasTransmitidos, diasMes);
      
      const consolidatedItem = {
        empresa: item.empresa,
        serial: item.serial,
        nuc: item.nuc,
        establecimiento: item.establecimiento,
        diasTransmitidos: item.diasTransmitidos,
        diasMes: diasMes,
        primerDia: fechaInicio && !isNaN(fechaInicio.getTime()) ? fechaInicio.toLocaleDateString() : '',
        ultimoDia: fechaFin && !isNaN(fechaFin.getTime()) ? fechaFin.toLocaleDateString() : '',
        periodoTexto: periodoTexto,
        tipoApuesta: item.tipoApuesta,
        produccion: item.produccion,
        derechosExplotacion: derechosExplotacion,
        gastosAdministracion: gastosAdministracion,
        totalImpuestos: totalImpuestos,
        novedad: novedad
      };
      
      return consolidatedItem;
    });
    
    console.log('✅ Consolidación completada:', result.length, 'máquinas únicas');
    console.log('💰 Producción total calculada:', result.reduce((sum, item) => sum + item.produccion, 0).toLocaleString());
    
    return result;
  };

  // Generar reporte por sala
  const generarReporteSala = (consolidatedData) => {
    const grouped = {};
    
    consolidatedData.forEach(item => {
      if (!grouped[item.establecimiento]) {
        grouped[item.establecimiento] = {
          establecimiento: item.establecimiento,
          empresa: item.empresa,
          totalMaquinas: 0,
          produccion: 0,
          derechosExplotacion: 0,
          gastosAdministracion: 0,
          totalImpuestos: 0
        };
      }
      
      const grupo = grouped[item.establecimiento];
      grupo.totalMaquinas += 1;
      grupo.produccion += item.produccion;
      grupo.derechosExplotacion += item.derechosExplotacion;
      grupo.gastosAdministracion += item.gastosAdministracion;
      grupo.totalImpuestos += item.totalImpuestos;
    });
    
    // Calcular promedio por establecimiento
    return Object.values(grouped).map(item => ({
      ...item,
      promedioEstablecimiento: item.produccion / item.totalMaquinas
    })).sort((a, b) => b.produccion - a.produccion);
  };

  // Confirmar validación y finalizar procesamiento
  const confirmarValidacion = () => {
    if (validationData) {
      console.log('🔍 CONFIRMAR VALIDACIÓN - Datos recibidos:');
      console.log('validationData.metrics:', validationData.metrics);
      console.log('validationData.totalDerechos:', validationData.totalDerechos);
      console.log('validationData.totalGastos:', validationData.totalGastos);
      
      // Crear métricas finales usando los valores actualizados individuales
      const metricasFinales = {
        ...validationData.metrics,
        totalProduccion: validationData.totalProduccion,
        totalDerechos: validationData.totalDerechos,
        totalGastos: validationData.totalGastos,
        totalImpuestos: validationData.totalImpuestos
      };
      
      console.log('🎯 MÉTRICAS FINALES PARA APLICAR:', metricasFinales);
      
      // Aplicar datos validados
      setConsolidatedData(validationData.consolidated);
      setReporteBySala(validationData.reporteSala);
      setMetricsData(metricasFinales);
      
      console.log('✅ Estados actualizados en confirmarValidacion');
      
      addLog(`📊 ${validationData.totalMaquinas} máquinas consolidadas`, 'success');
      addLog(`🏢 ${validationData.totalEstablecimientos} establecimientos procesados`, 'success');
      addLog('✅ Procesamiento completado exitosamente', 'success');
      
      addNotification('Liquidación procesada correctamente', 'success');
      
      // Cambiar a pestaña de resumen
      setActiveTab(0);
    }
    
    // Cerrar modal
    setShowValidationModal(false);
    setValidationData(null);
  };

  // Funciones para manejo de tarifas (basadas en la versión Python)
  const handleLiquidacionCoincide = () => {
    setLiquidacionCoincide(true);
    setShowTarifasOptions(false);
    addLog('✅ Liquidación marcada como coincidente', 'success');
    confirmarValidacion();
  };

  const handleLiquidacionNoCoincide = () => {
    setLiquidacionCoincide(false);
    setShowTarifasOptions(true);
    addLog('⚠️ Liquidación marcada como no coincidente - Se requiere ajuste de tarifas', 'warning');
  };

  const procesarArchivoTarifas = async (archivo) => {
    if (!archivo) {
      addLog('❌ No se proporcionó archivo de tarifas', 'error');
      return;
    }

    console.log('📄 Iniciando procesamiento de archivo de tarifas:', archivo.name);
    setProcesandoTarifas(true);
    addLog('📄 Procesando archivo de tarifas...', 'info');

    try {
      console.log('📖 Leyendo archivo...');
      const data = await archivo.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log('📊 Datos del archivo de tarifas:', jsonData.length, 'filas');
      addLog(`📊 Archivo de tarifas cargado: ${jsonData.length} filas`, 'info');

      // Detectar fila de encabezados en archivo de tarifas
      let headerRow = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (Array.isArray(row) && row.some(cell => 
          cell && typeof cell === 'string' && 
          (cell.toLowerCase().includes('nuc') || cell.toLowerCase().includes('tarifa'))
        )) {
          headerRow = i;
          console.log('✅ Encabezados de tarifas encontrados en fila:', i);
          break;
        }
      }

      if (headerRow === -1) {
        throw new Error('No se encontraron encabezados válidos (NUC, Tarifa) en el archivo de tarifas');
      }

      const headers = jsonData[headerRow];
      const dataRows = jsonData.slice(headerRow + 1);

      console.log('📋 Headers de tarifas:', headers);

      // Mapear columnas de tarifas basado en la estructura real del archivo
      const nucIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('nuc'));
      const tarifaIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('tarifa'));
      const entradasIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('entradas'));
      const salidasIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('salidas'));
      const derechosIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('derechos'));
      const gastosIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('gastos'));

      console.log('🔍 Índices encontrados:', {
        NUC: nucIndex,
        Tarifa: tarifaIndex,
        Entradas: entradasIndex,
        Salidas: salidasIndex,
        Derechos: derechosIndex,
        Gastos: gastosIndex
      });

      if (nucIndex === -1 || tarifaIndex === -1) {
        throw new Error('No se encontraron columnas NUC o Tarifa en el archivo. Verifique que el archivo tenga estas columnas.');
      }

      console.log('🔧 Creando mapeo de tarifas basado en tipo de tarifa...');

      // Crear mapeo de tarifas - SOLO para agregar valores de tarifa fija
      const nuevasTarifas = {};
      let tarífasEncontradas = 0;

      dataRows.forEach((row, index) => {
        if (row[nucIndex] && row[tarifaIndex]) {
          const nuc = row[nucIndex].toString();
          const tipoTarifa = row[tarifaIndex]?.toString();
          
          // Extraer datos adicionales
          const entradas = parseFloat(row[entradasIndex]) || 0;
          const salidas = parseFloat(row[salidasIndex]) || 0;
          const derechos = parseFloat(row[derechosIndex]) || 0;
          const gastos = parseFloat(row[gastosIndex]) || 0;
          
          // SOLO procesar máquinas con "Tarifa fija"
          if (tipoTarifa === 'Tarifa fija') {
            if (derechos > 0 || gastos > 0) {
              nuevasTarifas[nuc] = {
                tipo: tipoTarifa,
                metodo: 'Suma directa de derechos y gastos',
                entradas,
                salidas,
                derechos,
                gastos,
                // Valores a SUMAR a la liquidación existente
                derechosAdicionales: derechos,
                gastosAdicionales: gastos
              };
              tarífasEncontradas++;
              
              // Debug: mostrar primeras 5 tarifas fijas
              if (index < 5) {
                console.log(`✅ Tarifa fija encontrada - NUC: ${nuc}, Derechos: $${derechos.toLocaleString()}, Gastos: $${gastos.toLocaleString()}`);
              }
            }
          } else if (tipoTarifa === 'Tarifa variable') {
            // Para tarifa variable: NO hacer nada, mantener cálculo original
            console.log(`ℹ️ Tarifa variable - NUC: ${nuc} - Se mantiene cálculo original`);
          }
        }
      });

      console.log(`📊 Total de tarifas cargadas: ${tarífasEncontradas}`);
      addLog(`📊 Tarifas cargadas: ${tarífasEncontradas} NUCs con tarifa definida`, 'info');

      if (tarífasEncontradas === 0) {
        throw new Error('No se encontraron tarifas válidas en el archivo. Verifique que las columnas contengan datos numéricos.');
      }

      // Aplicar ajustes a datos consolidados - SUMAR valores de tarifa fija
      console.log('🔄 Aplicando ajustes de tarifas fijas...');
      let ajustesAplicados = 0;
      let totalDerechosAdicionales = 0;
      let totalGastosAdicionales = 0;

      if (validationData?.consolidated) {
        const datosAjustados = validationData.consolidated.map(maquina => {
          const nucString = maquina.nuc.toString();
          
          if (nuevasTarifas[nucString]) {
            const infoTarifa = nuevasTarifas[nucString];
            
            // SUMAR los valores adicionales de tarifa fija
            const derechosOriginales = maquina.derechosExplotacion;
            const gastosOriginales = maquina.gastosAdministracion;
            
            const nuevosDerechos = derechosOriginales + infoTarifa.derechosAdicionales;
            const nuevosGastos = gastosOriginales + infoTarifa.gastosAdicionales;
            const nuevosTotalImpuestos = nuevosDerechos + nuevosGastos;
            
            ajustesAplicados++;
            totalDerechosAdicionales += infoTarifa.derechosAdicionales;
            totalGastosAdicionales += infoTarifa.gastosAdicionales;
            
            console.log(`✅ Ajuste aplicado - NUC: ${nucString}, Tipo: ${infoTarifa.tipo}`);
            console.log(`   Derechos: $${derechosOriginales.toLocaleString()} + $${infoTarifa.derechosAdicionales.toLocaleString()} = $${nuevosDerechos.toLocaleString()}`);
            console.log(`   Gastos: $${gastosOriginales.toLocaleString()} + $${infoTarifa.gastosAdicionales.toLocaleString()} = $${nuevosGastos.toLocaleString()}`);
            
            return {
              ...maquina,
              // Mantener producción original
              produccion: maquina.produccion,
              // SUMAR derechos y gastos adicionales
              derechosExplotacion: nuevosDerechos,
              gastosAdministracion: nuevosGastos,
              totalImpuestos: nuevosTotalImpuestos,
              // Información de ajuste
              tarifa: 'Tarifa fija (valores sumados)',
              tipoTarifa: infoTarifa.tipo,
              metodoCalculo: infoTarifa.metodo,
              derechosAdicionales: infoTarifa.derechosAdicionales,
              gastosAdicionales: infoTarifa.gastosAdicionales
            };
          }
          
          // Si no tiene tarifa fija, mantener valores originales
          return { ...maquina, tarifa: 'Cálculo original (sin ajuste)' };
        });

        // Recalcular totales
        const nuevoTotalProduccion = datosAjustados.reduce((sum, item) => sum + item.produccion, 0);
        const nuevoTotalDerechos = datosAjustados.reduce((sum, item) => sum + item.derechosExplotacion, 0);
        const nuevoTotalGastos = datosAjustados.reduce((sum, item) => sum + item.gastosAdministracion, 0);
        const nuevoTotalImpuestos = nuevoTotalDerechos + nuevoTotalGastos;

        console.log('📊 NUEVOS TOTALES DESPUÉS DE SUMAR TARIFA FIJA:');
        console.log('Producción:', nuevoTotalProduccion, '(sin cambios)');
        console.log('Derechos:', nuevoTotalDerechos, `(+$${totalDerechosAdicionales.toLocaleString()} adicionales)`);
        console.log('Gastos:', nuevoTotalGastos, `(+$${totalGastosAdicionales.toLocaleString()} adicionales)`);
        console.log('Total Impuestos:', nuevoTotalImpuestos);

        // Recalcular métricas con los nuevos totales
        const nuevasMetricas = {
          ...validationData.metrics,
          totalProduccion: nuevoTotalProduccion,
          totalDerechos: nuevoTotalDerechos,
          totalGastos: nuevoTotalGastos,
          totalImpuestos: nuevoTotalImpuestos
        };

        console.log('🔍 ACTUALIZACIÓN DE MÉTRICAS DESPUÉS DE TARIFAS:');
        console.log('Métricas originales:', validationData.metrics);
        console.log('Nuevas métricas calculadas:', nuevasMetricas);
        console.log('nuevoTotalDerechos calculado:', nuevoTotalDerechos);
        console.log('nuevoTotalGastos calculado:', nuevoTotalGastos);

        // Actualizar validation data con ajustes
        const nuevoValidationData = {
          ...validationData,
          consolidated: datosAjustados,
          metrics: nuevasMetricas,
          totalMaquinas: datosAjustados.length,
          totalEstablecimientos: validationData.totalEstablecimientos,
          totalProduccion: nuevoTotalProduccion,
          totalDerechos: nuevoTotalDerechos,
          totalGastos: nuevoTotalGastos,
          totalImpuestos: nuevoTotalImpuestos,
          ajusteTarifaFijaAplicado: true,
          derechosAdicionales: totalDerechosAdicionales,
          gastosAdicionales: totalGastosAdicionales
        };

        console.log('🔍 NUEVO VALIDATION DATA COMPLETO:', nuevoValidationData);
        setValidationData(nuevoValidationData);

        // TEMPORAL: Comentado para debug - podría estar causando inconsistencias
        // setConsolidatedData(datosAjustados);
        // setOriginalData(datosAjustados);

        // Auto-confirmar después de 2 segundos con los valores correctos
        setTimeout(() => {
          console.log('🚀 AUTO-CONFIRMANDO CON VALORES AJUSTADOS...');
          
          // Crear métricas finales con los valores calculados directamente
          const metricasFinalesDirectas = {
            ...validationData.metrics,
            totalProduccion: nuevoTotalProduccion,
            totalDerechos: nuevoTotalDerechos,
            totalGastos: nuevoTotalGastos,
            totalImpuestos: nuevoTotalImpuestos
          };
          
          console.log('🎯 MÉTRICAS FINALES DIRECTAS:', metricasFinalesDirectas);
          
          // Aplicar datos validados directamente
          setConsolidatedData(datosAjustados);
          setReporteBySala(nuevoValidationData.reporteSala);
          setMetricsData(metricasFinalesDirectas);
          
          addLog(`📊 ${datosAjustados.length} máquinas consolidadas con tarifas ajustadas`, 'success');
          addLog(`🏢 ${nuevoValidationData.totalEstablecimientos} establecimientos procesados`, 'success');
          addLog('✅ Procesamiento con tarifas completado exitosamente', 'success');
          
          // Cambiar a pestaña de resumen
          setActiveTab(0);
          
          // Cerrar modal
          setShowValidationModal(false);
          setValidationData(null);
        }, 2000);
      }

      setTarifasOficiales(nuevasTarifas);
      
      addLog(`🔄 Ajustes aplicados: ${ajustesAplicados} máquinas con tarifa fija`, 'success');
      addLog(`💰 Derechos adicionales sumados: $ ${totalDerechosAdicionales.toLocaleString()}`, 'info');
      addLog(`💰 Gastos adicionales sumados: $ ${totalGastosAdicionales.toLocaleString()}`, 'info');
      addLog('✅ Archivo de tarifas procesado correctamente', 'success');
      
      // Mostrar mensaje de éxito
      addNotification(`Tarifas fijas aplicadas: ${ajustesAplicados} máquinas ajustadas`, 'success');
      
      // Ocultar opciones de tarifas y mostrar que se aplicaron ajustes
      setShowTarifasOptions(false);
      setLiquidacionCoincide(true); // Ahora coincide porque se aplicaron las tarifas oficiales
      
      // CERRAR MODAL Y APLICAR DATOS FINALES después de procesamiento exitoso
      // COMENTADO: Ahora se maneja directamente en el procesamiento de tarifas fijas
      // setTimeout(() => {
      //   // Primero confirmar validación para aplicar datos finales
      //   confirmarValidacion();
      //   addLog('✨ Procesamiento completado - Mostrando resumen final con ajustes', 'success');
      //   addNotification('Liquidación completada con ajustes de tarifa fija', 'success');
      // }, 2000); // 2 segundos para que el usuario vea el mensaje de éxito
      
    } catch (error) {
      addLog(`❌ Error procesando archivo de tarifas: ${error.message}`, 'error');
      addNotification('Error al procesar archivo de tarifas', 'error');
    } finally {
      setProcesandoTarifas(false);
    }
  };

  const seleccionarArchivoTarifas = () => {
    console.log('🔄 Iniciando selección de archivo de tarifas...');
    addLog('📁 Abriendo selector de archivo de tarifas...', 'info');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const archivo = e.target.files[0];
      console.log('📄 Archivo seleccionado:', archivo);
      
      if (archivo) {
        // VALIDAR: No debe ser el mismo archivo inicial
        if (selectedFile && archivo.name === selectedFile.name && archivo.size === selectedFile.size) {
          console.log('❌ Archivo duplicado detectado');
          addLog('❌ Error: No puede subir el mismo archivo inicial', 'error');
          addNotification('Error: Debe subir un archivo de tarifas diferente al archivo inicial', 'error');
          return;
        }
        
        console.log('✅ Archivo válido, procesando automáticamente...', archivo.name);
        addLog(`📄 Archivo de tarifas seleccionado: ${archivo.name}`, 'info');
        setArchivoTarifas(archivo);
        
        // PROCESAR AUTOMÁTICAMENTE
        procesarArchivoTarifas(archivo);
      } else {
        console.log('❌ No se seleccionó archivo');
        addLog('❌ No se seleccionó archivo de tarifas', 'warning');
      }
    };
    
    input.onerror = (error) => {
      console.error('❌ Error en selector de archivo:', error);
      addLog('❌ Error abriendo selector de archivo', 'error');
    };
    
    input.click();
    console.log('📂 Selector de archivo activado');
  };

  const continuarSinTarifas = () => {
    setShowTarifasOptions(false);
    addLog('➡️ Continuando sin ajustes de tarifas', 'info');
    confirmarValidacion();
  };

  // Función auxiliar para calcular métricas
  const calcularMetrics = (data) => {
    const totalProduccion = data.reduce((sum, item) => sum + (item.produccion || 0), 0);
    const totalDerechos = data.reduce((sum, item) => sum + (item.derechosExplotacion || 0), 0);
    const totalGastos = data.reduce((sum, item) => sum + (item.gastosAdministracion || 0), 0);
    const totalImpuestos = totalDerechos + totalGastos;
    
    return {
      totalMaquinas: data.length,
      totalEstablecimientos: new Set(data.map(item => item.establecimiento)).size,
      totalProduccion,
      totalDerechos,
      totalGastos,
      totalImpuestos
    };
  };

  // Cancelar validación
  const cancelarValidacion = () => {
    setShowValidationModal(false);
    setValidationData(null);
    addLog('❌ Procesamiento cancelado por el usuario', 'warning');
  };

  // Calcular métricas generales
  const calcularMetricas = (consolidatedData, reporteSala) => {
    const totalProduccion = consolidatedData.reduce((sum, item) => sum + item.produccion, 0);
    const totalDerechos = consolidatedData.reduce((sum, item) => sum + item.derechosExplotacion, 0);
    const totalGastos = consolidatedData.reduce((sum, item) => sum + item.gastosAdministracion, 0);
    const totalImpuestos = consolidatedData.reduce((sum, item) => sum + item.totalImpuestos, 0);
    
    const sinCambios = consolidatedData.filter(item => item.novedad === 'Sin cambios').length;
    const conNovedades = consolidatedData.length - sinCambios;
    
    return {
      totalMaquinas: consolidatedData.length,
      totalEstablecimientos: reporteSala.length,
      totalProduccion,
      totalDerechos,
      totalGastos,
      totalImpuestos,
      sinCambios,
      conNovedades,
      porcentajeSinCambios: consolidatedData.length > 0 ? (sinCambios / consolidatedData.length * 100) : 0,
      promedioEstablecimiento: reporteSala.length > 0 ? totalProduccion / reporteSala.length : 0
    };
  };

  // Funciones de exportación
  const exportarConsolidado = async () => {
    if (!consolidatedData) {
      addNotification('No hay datos consolidados para exportar', 'warning');
      return;
    }

    try {
      addLog('📦 Exportando con formato Python exacto...', 'info');
      const result = await exportarLiquidacionPythonFormat(consolidatedData, empresa || 'GENERAL');
      if (result.success) {
        addLog(`✅ ${result.message}`, 'success');
        addNotification('Liquidación exportada (formato Python exacto)', 'success');
        return;
      }
    } catch (e) {
      console.error('Error formato Python:', e);
      addLog('⚠️ Falló formato Python, usando versión spectacular...', 'warning');
    }

    try {
      addLog('✨ Iniciando exportación spectacular...', 'info');
      const result = await exportarLiquidacionSpectacular(consolidatedData, empresa || 'GENERAL');
      if (result.success) {
        addLog(`✅ ${result.message}`, 'success');
        addNotification('Liquidación exportada con diseño SPECTACULAR 💎', 'success');
      }
    } catch (error) {
      console.error('Error exportando datos consolidados:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      try {
        addLog('🔄 Intentando exportación simple...', 'info');
        const fallbackResult = exportarLiquidacionSimple(consolidatedData, empresa || 'GENERAL');
        if (fallbackResult.success) {
          addLog(`✅ ${fallbackResult.message}`, 'success');
          addNotification('Datos exportados (formato simple)', 'warning');
        }
      } catch (fallbackError) {
        console.error('Error en exportación de respaldo:', fallbackError);
        addLog(`❌ Error en exportación de respaldo: ${fallbackError.message}`, 'error');
        addNotification('Error al exportar datos consolidados', 'error');
      }
    }
  };

  const exportarReporteSala = () => {
    if (!reporteBySala) {
      addNotification('No hay reporte por sala para exportar', 'warning');
      return;
    }

    try {
      addLog('🏢 Iniciando exportación de reporte por sala...', 'info');
      
      const ws = XLSX.utils.json_to_sheet(reporteBySala.map(row => ({
        'Establecimiento': row.establecimiento,
        'Empresa': row.empresa,
        'Total Máquinas': row.totalMaquinas,
        'Producción': row.produccion,
        'Derechos de Explotación': row.derechosExplotacion,
        'Gastos de Administración': row.gastosAdministracion,
        'Total Impuestos': row.totalImpuestos,
        'Promedio/Establecimiento': row.promedioEstablecimiento
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte por Sala');

      const timestamp = new Date().toLocaleString('es-CO').replace(/[/:]/g, '-').replace(', ', '_');
      const filename = `Reporte_Salas_${empresa || 'General'}_${timestamp}.xlsx`;
      
      XLSX.writeFile(wb, filename);
      
      addLog(`✅ Reporte por sala exportado como: ${filename}`, 'success');
      addNotification('Reporte por sala exportado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error exportando reporte por sala:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      addNotification('Error al exportar reporte por sala', 'error');
    }
  };

  const exportarReporteDiario = () => {
    if (!consolidatedData) {
      addNotification('No hay datos para exportar reporte diario', 'warning');
      return;
    }

    try {
      addLog('📅 Iniciando exportación de reporte diario...', 'info');
      
      const wb = XLSX.utils.book_new();
      
      // Agrupar datos por establecimiento y crear una hoja por establecimiento
      const establecimientosUnicos = [...new Set(consolidatedData.map(item => item.establecimiento))];
      
      establecimientosUnicos.forEach(establecimiento => {
        const datosEstablecimiento = consolidatedData.filter(item => item.establecimiento === establecimiento);
        
        // Crear reporte diario expandido
        const datosExpandidos = [];
        datosEstablecimiento.forEach(maquina => {
          // Para cada máquina, crear una entrada por cada día transmitido
          for (let dia = 1; dia <= maquina.diasTransmitidos; dia++) {
            datosExpandidos.push({
              'Día': dia,
              'Fecha': maquina.ultimoDia, // Simplificado - en Python sería más elaborado
              'NUC': maquina.nuc,
              'Serial': maquina.serial,
              'Producción Diaria': (maquina.produccion / maquina.diasTransmitidos).toFixed(2),
              'Derechos Diarios': (maquina.derechosExplotacion / maquina.diasTransmitidos).toFixed(2),
              'Gastos Diarios': (maquina.gastosAdministracion / maquina.diasTransmitidos).toFixed(2),
              'Total Impuestos Diarios': (maquina.totalImpuestos / maquina.diasTransmitidos).toFixed(2)
            });
          }
        });
        
        const ws = XLSX.utils.json_to_sheet(datosExpandidos);
        XLSX.utils.book_append_sheet(wb, ws, establecimiento.substring(0, 31)); // Límite de caracteres para nombre de hoja
      });

      const timestamp = new Date().toLocaleString('es-CO').replace(/[/:]/g, '-').replace(', ', '_');
      const filename = `Reporte_Diario_${empresa || 'General'}_${timestamp}.xlsx`;
      
      XLSX.writeFile(wb, filename);
      
      addLog(`✅ Reporte diario exportado como: ${filename}`, 'success');
      addNotification('Reporte diario exportado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error exportando reporte diario:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      addNotification('Error al exportar reporte diario', 'error');
    }
  };

  // Reiniciar aplicación
  const reiniciarAplicacion = () => {
    if (window.confirm('¿Está seguro que desea reiniciar? Se perderán todos los datos cargados.')) {
      // Resetear estados de archivos y empresa
      setSelectedFile(null);
      setEmpresa('');
      
      // Resetear estados de datos
      setOriginalData(null);
      setConsolidatedData(null);
      setReporteBySala(null);
      setMetricsData(null);
      
      // Resetear estados de UI
      setLogs([]);
      logIdCounter.current = 0;
      setActiveTab(0);
      setProcessing(false);
      setDragActive(false);
      
      // Resetear estados de validación y tarifas
      setShowValidationModal(false);
      setValidationData(null);
      setTarifasOficiales({});
      setArchivoTarifas(null);
      setLiquidacionCoincide(true);
      setShowTarifasOptions(false);
      setProcesandoTarifas(false);
      
      // Resetear estados del selector de establecimientos
      setShowEstablecimientoSelector(false);
      setSelectedEstablecimientos([]);
      
      // Resetear input de archivo con un pequeño retraso
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 100);
      
      addLog('🔄 Aplicación reiniciada correctamente', 'info');
      addLog('📁 Listo para cargar un nuevo archivo', 'info');
    }
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Renderizar modal de validación dentro del return principal
  return (
    <>
      {/* Modal de validación - Diseño Sobrio */}
      <Dialog
        open={showValidationModal}
        onClose={() => {}} // Prevenir cierre accidental
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
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
          background: theme.palette.mode === 'dark' 
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Assessment />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                mb: 0,
                color: 'text.primary' 
              }}>
                🔍 Validación de Liquidación
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Revise los cálculos antes de finalizar el procesamiento
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 5 }}>
          {validationData && (
            <Grid container spacing={3}>
              {/* Resumen de máquinas - Diseño Sobrio */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 3,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: alpha(theme.palette.primary.main, 0.08),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <Typography variant="overline" sx={{ 
                    fontWeight: 600, 
                    color: 'primary.main',
                    letterSpacing: 0.8,
                    fontSize: '0.75rem'
                  }}>
                    Información General
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
                    📊 Resumen de Consolidación
                  </Typography>
                  <Typography sx={{ color: 'text.primary', mb: 1 }}>
                    🎰 Máquinas consolidadas: <strong>{validationData.totalMaquinas}</strong>
                  </Typography>
                  <Typography sx={{ color: 'text.primary', mb: 1 }}>
                    🏢 Establecimientos: <strong>{validationData.totalEstablecimientos}</strong>
                  </Typography>
                  <Typography sx={{ color: 'text.primary' }}>
                    🏢 Empresa: <strong>{empresa || 'No detectada'}</strong>
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Totales financieros - Diseño Sobrio */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 3,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  background: alpha(theme.palette.secondary.main, 0.08),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <Typography variant="overline" sx={{ 
                    fontWeight: 600, 
                    color: 'secondary.main',
                    letterSpacing: 0.8,
                    fontSize: '0.75rem'
                  }}>
                    Información Financiera
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
                    💰 Totales Financieros
                  </Typography>
                  <Typography sx={{ color: 'text.primary', mb: 1 }}>
                    Producción: <strong>$ {validationData.totalProduccion.toLocaleString()}</strong>
                  </Typography>
                  <Typography sx={{ color: 'text.primary', mb: 1 }}>
                    Derechos (12%): <strong>$ {validationData.totalDerechos.toLocaleString()}</strong>
                  </Typography>
                  <Typography sx={{ color: 'text.primary', mb: 1 }}>
                    Gastos (1%): <strong>$ {validationData.totalGastos.toLocaleString()}</strong>
                  </Typography>
                  <Typography sx={{ color: 'text.primary', fontSize: '1.1em', fontWeight: 600 }}>
                    <strong>Total Impuestos: $ {validationData.totalImpuestos.toLocaleString()}</strong>
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Pregunta de coincidencia de tarifas - Diseño Sobrio */}
              {!showTarifasOptions && (
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 3,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    background: alpha(theme.palette.info.main, 0.08),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <Typography variant="h6" sx={{ color: 'text.primary', textAlign: 'center', mb: 2 }}>
                      🔍 ¿Los cálculos coinciden con las tarifas oficiales?
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}>
                      Si tiene un archivo de tarifas oficial para verificar, puede seleccionar "No Coincide" para hacer ajustes.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button 
                        onClick={handleLiquidacionCoincide}
                        variant="contained"
                        size="large"
                        color="success"
                        sx={{ 
                          minWidth: 140,
                          borderRadius: 1,
                          fontWeight: 600,
                          textTransform: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                        }}
                      >
                        ✅ Sí Coincide
                      </Button>
                      <Button 
                        onClick={handleLiquidacionNoCoincide}
                        variant="contained"
                        size="large"
                        color="error"
                        sx={{ 
                          minWidth: 140,
                          borderRadius: 1,
                          fontWeight: 600,
                          textTransform: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                        }}
                      >
                        ❌ No Coincide
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Opciones de tarifas - Diseño Sobrio */}
              {showTarifasOptions && (
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 3,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    background: alpha(theme.palette.warning.main, 0.08),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
                      ⚙️ Ajuste de Tarifas Oficiales
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                      Seleccione un archivo Excel con las tarifas oficiales para ajustar automáticamente los cálculos.
                      El archivo debe contener columnas "NUC" y "Tarifa".
                    </Typography>
                    
                    {procesandoTarifas && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2,
                        p: 2,
                        borderRadius: 1,
                        background: alpha(theme.palette.info.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                      }}>
                        <CircularProgress size={20} color="info" />
                        <Typography sx={{ color: 'text.primary' }}>Procesando archivo de tarifas...</Typography>
                      </Box>
                    )}
                    
                    {liquidacionCoincide && !procesandoTarifas && showTarifasOptions && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 1,
                        background: alpha(theme.palette.success.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}>
                        <Typography sx={{ color: 'text.primary', textAlign: 'center' }}>
                          ✅ Tarifas procesadas correctamente. El modal se cerrará automáticamente en unos segundos...
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button 
                        onClick={seleccionarArchivoTarifas}
                        variant="contained"
                        disabled={procesandoTarifas}
                        sx={{ 
                          borderRadius: 1,
                          fontWeight: 600,
                          textTransform: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                        }}
                      >
                        📁 Seleccionar Archivo de Tarifas
                      </Button>
                      <Button 
                        onClick={continuarSinTarifas}
                        variant="outlined"
                        disabled={procesandoTarifas}
                        sx={{ 
                          borderRadius: 1,
                          fontWeight: 500,
                          textTransform: 'none'
                        }}
                      >
                        ➡️ Continuar Sin Ajustes
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
              
              {/* Advertencia final - Diseño Sobrio */}
              {!showTarifasOptions && (
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 3,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    background: alpha(theme.palette.info.main, 0.04),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <Typography variant="body1" sx={{ color: 'text.primary', textAlign: 'center' }}>
                      ⚠️ <strong>Importante:</strong> Una vez confirmada la validación, los datos estarán listos para exportar.
                      <br />Revise cuidadosamente los totales antes de continuar.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Validación de liquidación en proceso
          </Typography>
          <Button 
            onClick={cancelarValidacion}
            variant="outlined"
            sx={{ 
              borderRadius: 1,
              fontWeight: 500,
              textTransform: 'none',
              px: 3
            }}
          >
            ❌ Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header - Diseño Sobrio */}
      <Paper sx={{ 
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        mb: 6
      }}>
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{ 
            fontWeight: 600, 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 1.2
          }}>
            SISTEMA • PROCESAMIENTO
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
            🏢 Procesador de Liquidaciones
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Sistema avanzado de procesamiento y análisis de liquidaciones de máquinas
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Panel de Control - Diseño Sobrio */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: 'fit-content',
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'primary.main',
                letterSpacing: 0.8,
                fontSize: '0.75rem'
              }}>
                Gestión de Archivos
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                📁 1. Seleccionar Archivo
              </Typography>
              
              {/* Botón seleccionar archivo */}
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ 
                  mb: 2, 
                  mr: 1,
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Seleccionar Archivo
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
              />
              
              {/* Zona drag & drop - Diseño Sobrio */}
              <Paper
                ref={dropZoneRef}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                  p: 3,
                  border: `2px dashed ${dragActive ? alpha(theme.palette.primary.main, 0.6) : alpha(theme.palette.divider, 0.15)}`,
                  backgroundColor: dragActive 
                    ? alpha(theme.palette.primary.main, 0.08) 
                    : alpha(theme.palette.primary.main, 0.04),
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 2,
                  borderRadius: 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <CloudUpload sx={{ 
                  fontSize: 40, 
                  color: alpha(theme.palette.text.secondary, 0.7), 
                  mb: 1 
                }} />
                <Typography variant="body2" color="textSecondary">
                  También puedes arrastrar archivos Excel/CSV aquí
                </Typography>
              </Paper>
              
              {selectedFile && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}
                >
                  <strong>Archivo seleccionado:</strong><br />
                  {selectedFile.name}
                </Alert>
              )}
              
              {/* Campo empresa - Detectado automáticamente con Avatar y tipografía mejorada */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem'
                }}>
                  🏢 Empresa (Detectada automáticamente)
                </Typography>
                
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 1,
                    backgroundColor: empresa ? alpha(theme.palette.success.main, 0.04) : alpha(theme.palette.grey[500], 0.04),
                    border: `1px solid ${empresa ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.grey[500], 0.2)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: empresa ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.grey[500], 0.08),
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Avatar con logo de la empresa o inicial */}
                    {empresaCompleta?.logoURL ? (
                      <Avatar
                        src={empresaCompleta.logoURL}
                        alt={`Logo de ${empresaCompleta.name}`}
                        sx={{
                          width: 48,
                          height: 48,
                          border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                    ) : empresa ? (
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: alpha(theme.palette.success.main, 0.15),
                          color: theme.palette.success.main,
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {empresa.charAt(0).toUpperCase()}
                      </Avatar>
                    ) : (
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: alpha(theme.palette.grey[500], 0.15),
                          color: theme.palette.grey[600],
                          fontWeight: 600,
                          fontSize: '1.2rem',
                          border: `2px solid ${alpha(theme.palette.grey[500], 0.3)}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        ?
                      </Avatar>
                    )}
                    
                    {/* Información de la empresa */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: empresa ? theme.palette.text.primary : theme.palette.text.secondary,
                          mb: 0.5,
                          lineHeight: 1.2
                        }}
                      >
                        {empresa || 'Se detectará del archivo...'}
                      </Typography>
                      
                      {empresaCompleta && (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              mb: 0.3
                            }}
                          >
                            NIT: {empresaCompleta.nit}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.success.main,
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            Contrato: {empresaCompleta.contractNumber}
                          </Typography>
                        </Box>
                      )}
                      
                      {!empresa && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontStyle: 'italic',
                            fontSize: '0.85rem'
                          }}
                        >
                          La empresa se detectará automáticamente del número de contrato en el archivo
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Indicador de estado */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {empresa ? (
                        <Chip
                          label="Detectada"
                          color="success"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                      ) : (
                        <Chip
                          label="Pendiente"
                          color="default"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            backgroundColor: alpha(theme.palette.grey[500], 0.1),
                            color: theme.palette.grey[600]
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Box>
              
              {/* Procesamiento automático */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ⚙️ 2. Procesamiento Automático
              </Typography>
              
              {/* Estado del procesamiento automático - Diseño Sobrio */}
              {!selectedFile ? (
                <Box sx={{ 
                  p: 3, 
                  border: `2px dashed ${alpha(theme.palette.divider, 0.15)}`,
                  borderRadius: 1,
                  textAlign: 'center',
                  mb: 2,
                  backgroundColor: alpha(theme.palette.background.default, 0.5)
                }}>
                  <Typography variant="body1" color="text.secondary">
                    ⏳ Seleccione un archivo para iniciar el procesamiento automático
                  </Typography>
                </Box>
              ) : processing ? (
                <Box sx={{ 
                  p: 3, 
                  background: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: 1,
                  textAlign: 'center',
                  mb: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}>
                  <Typography variant="body1" color="primary" sx={{ mb: 1 }}>
                    ⚙️ Procesando automáticamente...
                  </Typography>
                  <LinearProgress />
                </Box>
              ) : (
                <Box sx={{ 
                  p: 3, 
                  background: alpha(theme.palette.success.main, 0.08),
                  borderRadius: 1,
                  textAlign: 'center',
                  mb: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}>
                  <Typography variant="body1" color="success.main">
                    ✅ Archivo procesado correctamente
                  </Typography>
                </Box>
              )}
              
              {/* Línea separadora */}
              <Divider sx={{ my: 3 }} />
              
              {/* Botón reiniciar */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                🔄 3. Reiniciar
              </Typography>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={reiniciarAplicacion}
                color="secondary"
                sx={{
                  borderRadius: 1,
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                Reiniciar Aplicación
              </Button>
            </CardContent>
          </Card>
          
          {/* Log de actividades - Diseño Sobrio */}
          <Card sx={{ 
            mt: 2,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'secondary.main',
                letterSpacing: 0.8,
                fontSize: '0.75rem'
              }}>
                Registro de Actividades
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                📋 Log de Actividades
              </Typography>
              
              <Box sx={{ 
                maxHeight: 300, 
                overflow: 'auto',
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                borderRadius: 1,
                p: 1,
                backgroundColor: alpha(theme.palette.background.default, 0.5)
              }}>
                {logs.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No hay actividades registradas
                  </Typography>
                )}
                {logs.length > 0 && logs.map(log => (
                  <Box key={log.id} sx={{ mb: 1, fontSize: '0.875rem' }}>
                    <span style={{ color: alpha(theme.palette.text.secondary, 0.8) }}>
                      [{log.timestamp}]
                    </span>{' '}
                    <span style={{ 
                      color: log.type === 'error' ? theme.palette.error.main : 
                             log.type === 'success' ? theme.palette.success.main : 
                             theme.palette.text.primary 
                    }}>
                      {log.message}
                    </span>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Panel de Resultados - Diseño Sobrio */}
        <Grid item xs={12} md={8}>
          <Card sx={{
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 500,
                    textTransform: 'none',
                    fontSize: '0.875rem'
                  }
                }}
              >
                <Tab 
                  label="📊 Resumen" 
                  icon={<PieChart />}
                  iconPosition="start"
                />
                <Tab 
                  label="📋 Consolidado" 
                  icon={<Receipt />}
                  iconPosition="start"
                />
                <Tab 
                  label="🏢 Por Sala" 
                  icon={<Business />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            
            <CardContent sx={{ p: 3 }}>
              <AnimatePresence mode="wait">
                {/* Pestaña Resumen - Diseño Sobrio */}
                {activeTab === 0 && (
                  <motion.div
                    key="resumen"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {!metricsData ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Assessment sx={{ 
                          fontSize: 60, 
                          color: alpha(theme.palette.text.secondary, 0.7), 
                          mb: 2 
                        }} />
                        <Typography variant="h6" color="textSecondary">
                          Resumen de datos aparecerá aquí después del procesamiento
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={3}>
                        {/* Métricas principales - Diseño Sobrio */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            background: alpha(theme.palette.primary.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.primary.main, 0.12)
                            }
                          }}>
                            <Casino sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.primary.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {metricsData.totalMaquinas}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Máquinas Consolidadas
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                            background: alpha(theme.palette.secondary.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.secondary.main, 0.12)
                            }
                          }}>
                            <Business sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.secondary.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {metricsData.totalEstablecimientos}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Total Establecimientos
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            background: alpha(theme.palette.success.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.success.main, 0.12)
                            }
                          }}>
                            <TrendingUp sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.success.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {formatCurrency(metricsData.totalProduccion)}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Total Producción
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                            background: alpha(theme.palette.warning.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.warning.main, 0.12)
                            }
                          }}>
                            <Assessment sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.warning.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {formatCurrency(metricsData.totalDerechos)}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Derechos de Explotación
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            background: alpha(theme.palette.info.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.info.main, 0.12)
                            }
                          }}>
                            <Receipt sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.info.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {formatCurrency(metricsData.totalGastos)}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Gastos de Administración
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            background: alpha(theme.palette.error.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.error.main, 0.12)
                            }
                          }}>
                            <Storage sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.error.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {formatCurrency(metricsData.totalImpuestos)}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}>
                              TOTAL IMPUESTOS
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        {/* Estadísticas de novedades - Diseño Sobrio */}
                        <Grid item xs={12}>
                          <Typography variant="overline" sx={{ 
                            fontWeight: 600, 
                            color: 'text.secondary',
                            letterSpacing: 0.8,
                            fontSize: '0.75rem'
                          }}>
                            Análisis Detallado
                          </Typography>
                          <Typography variant="h6" sx={{ mt: 1, mb: 3, fontWeight: 600 }}>
                            📈 Estadísticas de Novedades
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            background: alpha(theme.palette.success.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.success.main, 0.12)
                            }
                          }}>
                            <CheckCircle sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.success.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {metricsData.sinCambios}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Sin Cambios ({metricsData.porcentajeSinCambios.toFixed(1)}%)
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                            background: alpha(theme.palette.warning.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.warning.main, 0.12)
                            }
                          }}>
                            <Warning sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.warning.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {metricsData.conNovedades}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Con Novedades ({(100 - metricsData.porcentajeSinCambios).toFixed(1)}%)
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            background: alpha(theme.palette.info.main, 0.08),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              background: alpha(theme.palette.info.main, 0.12)
                            }
                          }}>
                            <BarChart sx={{ 
                              fontSize: 32, 
                              mb: 1.5, 
                              color: theme.palette.info.main 
                            }} />
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}>
                              {formatCurrency(metricsData.promedioEstablecimiento)}
                            </Typography>
                            <Typography variant="body2" sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Promedio/Establecimiento
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    )}
                  </motion.div>
                )}
                
                {/* Pestaña Consolidado - Diseño Sobrio */}
                {activeTab === 1 && (
                  <motion.div
                    key="consolidado"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {!consolidatedData ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Receipt sx={{ 
                          fontSize: 60, 
                          color: alpha(theme.palette.text.secondary, 0.7), 
                          mb: 2 
                        }} />
                        <Typography variant="h6" color="textSecondary">
                          Datos consolidados aparecerán aquí después del procesamiento
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 3 
                        }}>
                          <Box>
                            <Typography variant="overline" sx={{ 
                              fontWeight: 600, 
                              color: 'primary.main',
                              letterSpacing: 0.8,
                              fontSize: '0.75rem'
                            }}>
                              Información Detallada
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              📋 Datos Consolidados por Máquina
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            startIcon={<Download />}
                            size="small"
                            onClick={exportarConsolidado}
                            disabled={!consolidatedData}
                            sx={{
                              borderRadius: 1,
                              fontWeight: 600,
                              textTransform: 'none',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                            }}
                          >
                            Exportar Consolidado
                          </Button>
                        </Box>
                        
                        <TableContainer 
                          component={Paper} 
                          sx={{ 
                            maxHeight: 600,
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}
                        >
                          <Table 
                            stickyHeader
                            sx={{
                              '& .MuiTableCell-root': {
                                borderColor: theme.palette.divider,
                                borderBottom: `1px solid ${theme.palette.divider}`
                              },
                              '& .MuiTableHead-root': {
                                '& .MuiTableRow-root': {
                                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                  '& .MuiTableCell-root': {
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    paddingY: 2,
                                    borderColor: theme.palette.divider
                                  }
                                }
                              },
                              '& .MuiTableBody-root': {
                                '& .MuiTableRow-root': {
                                  '&:hover': { backgroundColor: theme.palette.action.hover },
                                  '&:last-child .MuiTableCell-root': { borderBottom: 'none' },
                                  '& .MuiTableCell-root': {
                                    paddingY: 1.8,
                                    fontSize: '0.85rem',
                                    borderColor: theme.palette.divider
                                  }
                                }
                              }
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell>Empresa</TableCell>
                                <TableCell>Serial</TableCell>
                                <TableCell>NUC</TableCell>
                                <TableCell>Establecimiento</TableCell>
                                <TableCell>Días Transmitidos</TableCell>
                                <TableCell>Días del Mes</TableCell>
                                <TableCell>Primer Día</TableCell>
                                <TableCell>Último Día</TableCell>
                                <TableCell>Período</TableCell>
                                <TableCell>Tipo Apuesta</TableCell>
                                <TableCell>Producción</TableCell>
                                <TableCell>Derechos (12%)</TableCell>
                                <TableCell>Gastos (1%)</TableCell>
                                <TableCell>Total Impuestos</TableCell>
                                <TableCell>Novedad</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {consolidatedData.map((row, index) => (
                                <TableRow key={`consolidated-${row.nuc}-${row.establecimiento}-${index}`} hover>
                                  <TableCell>{row.empresa}</TableCell>
                                  <TableCell>{row.serial}</TableCell>
                                  <TableCell>{row.nuc}</TableCell>
                                  <TableCell>{row.establecimiento}</TableCell>
                                  <TableCell>{row.diasTransmitidos}</TableCell>
                                  <TableCell>{row.diasMes}</TableCell>
                                  <TableCell>{row.primerDia}</TableCell>
                                  <TableCell>{row.ultimoDia}</TableCell>
                                  <TableCell>{row.periodoTexto}</TableCell>
                                  <TableCell>{row.tipoApuesta}</TableCell>
                                  <TableCell>{formatCurrency(row.produccion)}</TableCell>
                                  <TableCell>{formatCurrency(row.derechosExplotacion)}</TableCell>
                                  <TableCell>{formatCurrency(row.gastosAdministracion)}</TableCell>
                                  <TableCell><strong>{formatCurrency(row.totalImpuestos)}</strong></TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={row.novedad}
                                      color={row.novedad === 'Sin cambios' ? 'success' : 'warning'}
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </motion.div>
                )}
                
                {/* Pestaña Por Sala - Diseño Sobrio */}
                {activeTab === 2 && (
                  <motion.div
                    key="sala"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {!reporteBySala ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Business sx={{ 
                          fontSize: 60, 
                          color: alpha(theme.palette.text.secondary, 0.7), 
                          mb: 2 
                        }} />
                        <Typography variant="h6" color="textSecondary">
                          Reporte por establecimiento aparecerá aquí después del procesamiento
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 3 
                        }}>
                          <Box>
                            <Typography variant="overline" sx={{ 
                              fontWeight: 600, 
                              color: 'secondary.main',
                              letterSpacing: 0.8,
                              fontSize: '0.75rem'
                            }}>
                              Información por Ubicación
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              🏢 Reporte por Establecimiento
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button
                              variant="contained"
                              startIcon={<Download />}
                              size="small"
                              onClick={exportarReporteSala}
                              disabled={!reporteBySala}
                              sx={{
                                borderRadius: 1,
                                fontWeight: 600,
                                textTransform: 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                              }}
                            >
                              Exportar por Sala
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<DateRange />}
                              size="small"
                              onClick={exportarReporteDiario}
                              disabled={!consolidatedData}
                              sx={{
                                borderRadius: 1,
                                fontWeight: 500,
                                textTransform: 'none'
                              }}
                            >
                              Reporte Diario
                            </Button>
                          </Box>
                        </Box>
                        
                        <TableContainer 
                          component={Paper} 
                          sx={{ 
                            maxHeight: 600,
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}
                        >
                          <Table 
                            stickyHeader
                            sx={{
                              '& .MuiTableCell-root': {
                                borderColor: theme.palette.divider,
                                borderBottom: `1px solid ${theme.palette.divider}`
                              },
                              '& .MuiTableHead-root': {
                                '& .MuiTableRow-root': {
                                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                  '& .MuiTableCell-root': {
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    paddingY: 2,
                                    borderColor: theme.palette.divider
                                  }
                                }
                              },
                              '& .MuiTableBody-root': {
                                '& .MuiTableRow-root': {
                                  '&:hover': { backgroundColor: theme.palette.action.hover },
                                  '&:last-child .MuiTableCell-root': { borderBottom: 'none' },
                                  '& .MuiTableCell-root': {
                                    paddingY: 1.8,
                                    fontSize: '0.85rem',
                                    borderColor: theme.palette.divider
                                  }
                                }
                              }
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell>Establecimiento</TableCell>
                                <TableCell>Empresa</TableCell>
                                <TableCell>Total Máquinas</TableCell>
                                <TableCell>Producción</TableCell>
                                <TableCell>Derechos</TableCell>
                                <TableCell>Gastos</TableCell>
                                <TableCell>Total Impuestos</TableCell>
                                <TableCell>Promedio/Establecimiento</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reporteBySala.map((row, index) => (
                                <TableRow key={`sala-${row.establecimiento}-${index}`}>
                                  <TableCell sx={{ fontWeight: 600 }}>{row.establecimiento}</TableCell>
                                  <TableCell>{row.empresa}</TableCell>
                                  <TableCell>{row.totalMaquinas}</TableCell>
                                  <TableCell>{formatCurrency(row.produccion)}</TableCell>
                                  <TableCell>{formatCurrency(row.derechosExplotacion)}</TableCell>
                                  <TableCell>{formatCurrency(row.gastosAdministracion)}</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(row.totalImpuestos)}</TableCell>
                                  <TableCell>{formatCurrency(row.promedioEstablecimiento)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </>
  );
};

export default LiquidacionesPage;
