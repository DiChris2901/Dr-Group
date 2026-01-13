import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  FormControlLabel,
  Radio,
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
  Delete,
  CheckCircle,
  Warning,
  Info,
  Error as ErrorIcon,
  Casino,
  Timeline,
  Storage,
  PieChart,
  BarChart,
  DateRange,
  Save
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import useActivityLogs from '../hooks/useActivityLogs';
import { exportarLiquidacionSpectacular, exportarLiquidacionSimple } from '../utils/liquidacionExcelExportSpectacularFixed';
import { exportarLiquidacionPythonFormat } from '../utils/liquidacionExcelExportPythonFormat';
import { exportarReporteDiarioSala } from '../utils/liquidacionExcelExportDiarioSala';
import useCompanies from '../hooks/useCompanies';
import ExportarPorSalaModal from '../components/modals/ExportarPorSalaModal';
import ReporteDiarioModal from '../components/modals/ReporteDiarioModal';
import ConfirmarGuardadoModal from '../components/modals/ConfirmarGuardadoModal';
import liquidacionPersistenceService from '../services/liquidacionPersistenceService';
import * as XLSX from 'xlsx';

const LiquidacionesPage = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivityLogs();
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
  // Modal exportar por sala
  const [showSalaModal, setShowSalaModal] = useState(false);
  // Modal reporte diario
  const [showDailyModal, setShowDailyModal] = useState(false);
  // Modal confirmar guardado
  const [showConfirmarGuardadoModal, setShowConfirmarGuardadoModal] = useState(false);

  // Estados para persistencia Firebase
  const [guardandoLiquidacion, setGuardandoLiquidacion] = useState(false);
  const [liquidacionGuardadaId, setLiquidacionGuardadaId] = useState(null);
  const [historialLiquidaciones, setHistorialLiquidaciones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const abrirModalSala = () => {
    if (!reporteBySala) {
      addNotification('No hay reporte por sala para exportar', 'warning');
      return;
    }
    setShowSalaModal(true);
  };

  // Función para detectar período de liquidación (derivado de la última fecha reporte del archivo ORIGINAL)
  const detectarPeriodoLiquidacion = () => {
    if (!originalData || !Array.isArray(originalData) || originalData.length === 0) return 'No detectado';
    try {
      // 1. Identificar la clave que representa la fecha de reporte (busca coincidencias flexibles)
      const posiblesClavesFecha = [
        'fecha reporte','fecha_reporte','fecha','fecha reporte ', 'fecha  reporte'
      ];
      // Tomar la primera fila con contenido para inspeccionar claves
      const sample = originalData.find(r => r && Object.keys(r).length > 0);
      if (!sample) return 'No detectado';
      const claves = Object.keys(sample);
      let claveFecha = null;
      for (const c of claves) {
        const cLower = c.toLowerCase().trim();
        if (posiblesClavesFecha.some(pk => cLower.includes(pk.replace(/\s+/g,' ').trim()))) {
          claveFecha = c;
          break;
        }
      }
      if (!claveFecha) {
        // fallback: cualquier clave que contenga 'fecha'
        claveFecha = claves.find(c => c.toLowerCase().includes('fecha'));
        if (!claveFecha) return 'No detectado';
      }
      // 2. Extraer todas las fechas válidas
      const fechas = [];
      for (const row of originalData) {
        if (!row || row[claveFecha] === undefined || row[claveFecha] === null || row[claveFecha] === '') continue;
        let valor = row[claveFecha];
        let fechaObj = null;
        if (typeof valor === 'number') {
          // Excel serial (asumiendo base 1900)
            fechaObj = new Date((valor - 25569) * 86400 * 1000);
        } else if (typeof valor === 'string') {
          // Normalizar separadores
          const vTrim = valor.trim();
          // Intento directo
          const directo = new Date(vTrim);
          if (!isNaN(directo.getTime())) {
            fechaObj = directo;
          } else {
            // Intentar DD/MM/YYYY
            const m = vTrim.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
            if (m) {
              const d = parseInt(m[1]);
              const mo = parseInt(m[2]) - 1;
              let y = parseInt(m[3]);
              if (y < 100) y += 2000; // normalizar años cortos
              fechaObj = new Date(y, mo, d);
            }
          }
        }
        if (fechaObj && !isNaN(fechaObj.getTime())) fechas.push(fechaObj);
      }
      if (fechas.length === 0) return 'No detectado';
      // 3. Tomar la fecha máxima (último día reportado)
      const fechaFin = new Date(Math.max(...fechas.map(f => f.getTime())));
      if (isNaN(fechaFin.getTime())) return 'No detectado';
      // 4. Formatear a "Mes Año" con mayúscula inicial
      const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      return `${meses[fechaFin.getMonth()]} ${fechaFin.getFullYear()}`;
    } catch (e) {
      console.warn('Error detectando período liquidación:', e);
      return 'No detectado';
    }
  };

  // Función para mostrar modal de confirmación de guardado
  const mostrarConfirmacionGuardado = () => {
    if (!originalData || !consolidatedData) {
      addNotification('No hay datos suficientes para guardar', 'warning');
      return;
    }
    setShowConfirmarGuardadoModal(true);
  };

  // Función para guardar liquidación en Firebase (con confirmación)
  const confirmarGuardadoLiquidacion = async (periodoEditado) => {
    if (!currentUser?.uid) {
      addNotification('Debes estar autenticado para guardar liquidaciones', 'warning');
      return;
    }

    try {
      setGuardandoLiquidacion(true);
      addLog('💾 Guardando solo archivos originales en Firebase...', 'info');
      
      // Usar el período editado del modal o detectado automáticamente
      const periodoDetectado = periodoEditado || detectarPeriodoLiquidacion();
      
      // Mostrar qué archivos se van a guardar
      addLog(`📁 Archivo principal: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
      if (archivoTarifas) {
        addLog(`📄 Archivo de tarifas: ${archivoTarifas.name} (${(archivoTarifas.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
      } else {
        addLog('📊 Sin archivo de tarifas - usando tarifas del archivo principal', 'info');
      }

      const liquidacionData = {
        empresa: empresa || 'Sin Empresa',
        originalData,
        consolidatedData,
        reporteBySala,
        metricsData,
        tarifasOficiales,
        originalFile: selectedFile,
        archivoTarifas: archivoTarifas, // Incluir archivo de tarifas si existe
        periodoDetectado: periodoDetectado // Incluir período detectado
      };

      // Usar el período editado/confirmado del modal
      addLog(`📅 Período confirmado: ${periodoDetectado}`, 'info');
      
      // Parsear el período para extraer mes y año correctamente
      let periodoInfo;
      try {
        const match = periodoDetectado.match(/(\w+)\s+(\d{4})/);
        if (match) {
          const mesTexto = match[1].toLowerCase();
          const año = parseInt(match[2]);
          
          periodoInfo = {
            periodoLiquidacion: `${mesTexto}_${año}`,
            mesLiquidacion: mesTexto,
            añoLiquidacion: año,
            fechaProcesamiento: new Date().toISOString().split('T')[0]
          };
          
          addLog(`📅 Período parseado correctamente: ${mesTexto} ${año}`, 'success');
        } else {
          throw new Error('No se pudo parsear el período');
        }
        
        // Agregar información del período a los datos
        liquidacionData.periodoInfo = periodoInfo;
        liquidacionData.periodoDetectado = periodoDetectado;
      } catch (error) {
        addLog(`⚠️ Error parseando período, usando fallback: ${error.message}`, 'warning');
        // Fallback a extractPeriodoInfo solo si falla el parseo
        periodoInfo = liquidacionPersistenceService.extractPeriodoInfo(originalData);
        liquidacionData.periodoInfo = periodoInfo;
      }

      const liquidacionId = await liquidacionPersistenceService.saveLiquidacion(
        liquidacionData, 
        currentUser.uid
      );

      setLiquidacionGuardadaId(liquidacionId);
      addLog(`✅ Liquidación guardada con ID: ${liquidacionId}`, 'success');
      addLog(`📦 Archivos guardados: ${archivoTarifas ? '2 archivos' : '1 archivo'} (solo originales)`, 'info');
      addLog(`💡 Ventaja: Al cargar del historial se procesarán con la lógica más actualizada`, 'info');
      addNotification('Liquidación guardada exitosamente en Firebase', 'success');

      // 💾 LOG DE ACTIVIDAD: Liquidación guardada en Firebase
      try {
        await logActivity(
          'liquidacion_guardada',
          'liquidacion',
          liquidacionId,
          {
            empresa: empresa || 'Sin Empresa',
            periodo: periodoDetectado || 'Sin período',
            registros: consolidatedData?.length || 0,
            archivoOriginal: selectedFile?.name || null,
            tieneArchivoTarifas: !!archivoTarifas,
            archivoTarifas: archivoTarifas?.name || null
          },
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging liquidacion save:', logError);
      }

      // Actualizar historial
      await cargarHistorialLiquidaciones();
      
      // Cerrar modal
      setShowConfirmarGuardadoModal(false);
    } catch (error) {
      console.error('Error guardando liquidación:', error);
      addLog(`❌ Error guardando liquidación: ${error.message}`, 'error');
      addNotification('Error al guardar liquidación en Firebase', 'error');
    } finally {
      setGuardandoLiquidacion(false);
    }
  };

  // Función para cargar historial de liquidaciones
  const cargarHistorialLiquidaciones = async () => {
    if (!currentUser?.uid) return;

    try {
      setCargandoHistorial(true);
      const historial = await liquidacionPersistenceService.getUserLiquidaciones(currentUser.uid, 10);
      setHistorialLiquidaciones(historial);
    } catch (error) {
      console.error('Error cargando historial:', error);
      
      // Si es un error de índices, mostrar mensaje más amigable
      if (error.message.includes('requires an index')) {
        addNotification('Los índices de la base de datos se están configurando. El historial estará disponible en unos minutos.', 'warning');
      } else {
        addNotification('Error al cargar historial de liquidaciones', 'error');
      }
      
      // En caso de error, dejar el historial vacío pero no romper la app
      setHistorialLiquidaciones([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Función para cargar liquidación del historial con procesamiento en tiempo real
  const cargarLiquidacion = async (liquidacionId) => {
    if (!currentUser?.uid) return;

    try {
      setProcessing(true);
      addLog(`📂 Cargando liquidación ${liquidacionId}...`, 'info');
      
      // Verificar disponibilidad de empresas (sin esperas largas)
      const empresasDisponibles = companies && companies.length > 0;
      addLog(`🏢 Estado empresas: ${empresasDisponibles ? `${companies.length} disponibles` : 'no disponibles'}`, 'info');
      
      addLog(`⚙️ Descargando y procesando archivos originales...`, 'info');

      // Función de procesamiento que sigue el flujo completo normal
      const processFunction = async (originalFile, tarifasFile = null) => {
        // Leer archivo principal
        const data = await readFile(originalFile);
        addLog('✅ Archivo original leído correctamente', 'success');
        
        // Extraer número de contrato del archivo (siguiendo lógica original)
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
            addLog(`🏢 Empresa detectada: ${empresaDetectada}`, 'success');
          } else {
            addLog(`⚠️ No se encontró empresa para el contrato: ${numeroContrato}`, 'warning');
            empresaDetectada = `Contrato ${numeroContrato} (No encontrado)`;
          }
        } else {
          addLog('⚠️ No se pudo detectar número de contrato', 'warning');
          empresaDetectada = 'Empresa no detectada';
        }
        
        // Detectar encabezados (siguiendo lógica original)
        const headerRow = detectarFilaEncabezados(data);
        addLog(`🔍 Encabezados detectados en fila ${headerRow + 1}`, 'info');
        
        // Procesar datos (siguiendo lógica original)
        const processedData = procesarDatos(data, headerRow);
        
        // Consolidar por NUC (siguiendo lógica original)
        const consolidated = consolidarDatos(processedData);
        
        // CORREGIR: Actualizar empresa en todos los registros consolidados
        const consolidatedConEmpresa = consolidated.map(item => ({
          ...item,
          empresa: empresaDetectada || 'Empresa no detectada'
        }));
        
        // Generar reporte por sala (siguiendo lógica original)
        const reporteSala = generarReporteSala(consolidatedConEmpresa);
        
        // Calcular métricas (siguiendo lógica original)
        const metrics = calcularMetricas(consolidatedConEmpresa, reporteSala);
        
        // Debug: Calcular totales paso a paso (siguiendo lógica original)
        const totalProduccion = consolidatedConEmpresa.reduce((sum, item) => {
          const produccion = Number(item.produccion) || 0;
          return sum + produccion;
        }, 0);
        
        const totalDerechos = consolidatedConEmpresa.reduce((sum, item) => {
          const derechos = Number(item.derechosExplotacion) || 0;
          return sum + derechos;
        }, 0);
        
        const totalGastos = consolidatedConEmpresa.reduce((sum, item) => {
          const gastos = Number(item.gastosAdministracion) || 0;
          return sum + gastos;
        }, 0);
        
        addLog('📊 TOTALES CALCULADOS:', 'info');
        addLog(`   • Total Producción: ${totalProduccion.toLocaleString()}`, 'info');
        addLog(`   • Total Derechos: ${totalDerechos.toLocaleString()}`, 'info');
        addLog(`   • Total Gastos: ${totalGastos.toLocaleString()}`, 'info');
        
        // Inicializar variables para procesamiento de tarifas
        let tarifasOficialesCalculadas = {};
        let consolidatedConTarifas = consolidatedConEmpresa;
        let metricasConTarifas = metrics;
        
        if (tarifasFile) {
          addLog('📄 Procesando archivo de tarifas...', 'info');
          
          try {
            // Procesar archivo de tarifas (siguiendo lógica de procesarArchivoTarifas)
            const tarifasData = await tarifasFile.arrayBuffer();
            const workbook = XLSX.read(tarifasData, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Detectar encabezados (siguiendo lógica original)
            let headerRow = -1;
            for (let i = 0; i < Math.min(5, jsonData.length); i++) {
              const row = jsonData[i];
              if (Array.isArray(row) && row.some(cell => 
                cell && typeof cell === 'string' && 
                (cell.toLowerCase().includes('nuc') || cell.toLowerCase().includes('tarifa'))
              )) {
                headerRow = i;
                break;
              }
            }

            if (headerRow !== -1) {
              const headers = jsonData[headerRow];
              const dataRows = jsonData.slice(headerRow + 1);

              // Mapear columnas (siguiendo lógica original)
              const nucIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('nuc'));
              const tarifaIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('tarifa'));
              const derechosIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('derechos'));
              const gastosIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('gastos'));

              if (nucIndex !== -1 && tarifaIndex !== -1) {
                // Procesar tarifas fijas (siguiendo lógica original)
                let tarífasEncontradas = 0;

                dataRows.forEach((row) => {
                  if (row[nucIndex] && row[tarifaIndex] === 'Tarifa fija') {
                    const nuc = row[nucIndex].toString();
                    const derechos = parseFloat(row[derechosIndex]) || 0;
                    const gastos = parseFloat(row[gastosIndex]) || 0;
                    
                    if (derechos > 0 || gastos > 0) {
                      tarifasOficialesCalculadas[nuc] = {
                        derechosAdicionales: derechos,
                        gastosAdicionales: gastos
                      };
                      tarífasEncontradas++;
                    }
                  }
                });

                // Aplicar ajustes a los datos consolidados (siguiendo lógica original)
                if (tarífasEncontradas > 0) {
                  consolidatedConTarifas = consolidated.map(maquina => {
                    const nucString = maquina.nuc.toString();
                    
                    if (tarifasOficialesCalculadas[nucString]) {
                      const infoTarifa = tarifasOficialesCalculadas[nucString];
                      const nuevosDerechos = maquina.derechosExplotacion + infoTarifa.derechosAdicionales;
                      const nuevosGastos = maquina.gastosAdministracion + infoTarifa.gastosAdicionales;
                      
                      return {
                        ...maquina,
                        derechosExplotacion: nuevosDerechos,
                        gastosAdministracion: nuevosGastos,
                        totalImpuestos: nuevosDerechos + nuevosGastos,
                        tarifa: 'Tarifa fija (valores sumados)'
                      };
                    }
                    
                    return { ...maquina, tarifa: 'Cálculo original (sin ajuste)' };
                  });

                  // Recalcular totales con tarifas aplicadas
                  const nuevoTotalDerechos = consolidatedConTarifas.reduce((sum, item) => sum + item.derechosExplotacion, 0);
                  const nuevoTotalGastos = consolidatedConTarifas.reduce((sum, item) => sum + item.gastosAdministracion, 0);
                  
                  // Actualizar métricas con tarifas aplicadas
                  metricasConTarifas = {
                    ...metrics,
                    totalDerechos: nuevoTotalDerechos,
                    totalGastos: nuevoTotalGastos,
                    totalImpuestos: nuevoTotalDerechos + nuevoTotalGastos
                  };

                  addLog(`✅ ${tarífasEncontradas} tarifas aplicadas correctamente`, 'success');
                } else {
                  addLog('⚠️ No se encontraron tarifas válidas en el archivo', 'warning');
                }
              } else {
                addLog('❌ No se encontraron columnas NUC o Tarifa en el archivo de tarifas', 'error');
              }
            } else {
              addLog('❌ No se encontraron encabezados válidos en el archivo de tarifas', 'error');
            }
          } catch (tarifasError) {
            addLog(`❌ Error procesando archivo de tarifas: ${tarifasError.message}`, 'error');
          }
        }

        // Calcular totales finales (con tarifas aplicadas si existen)
        const totalProduccionFinal = consolidatedConTarifas.reduce((sum, item) => {
          const produccion = Number(item.produccion) || 0;
          return sum + produccion;
        }, 0);
        
        const totalDerechosFinal = consolidatedConTarifas.reduce((sum, item) => {
          const derechos = Number(item.derechosExplotacion) || 0;
          return sum + derechos;
        }, 0);
        
        const totalGastosFinal = consolidatedConTarifas.reduce((sum, item) => {
          const gastos = Number(item.gastosAdministracion) || 0;
          return sum + gastos;
        }, 0);

        // Preparar datos de validación finales (como en procesamiento normal, con tarifas aplicadas)
        const validacion = {
          consolidated: consolidatedConTarifas,
          reporteSala,
          metrics: metricasConTarifas,
          totalMaquinas: consolidatedConTarifas.length,
          totalEstablecimientos: reporteSala.length,
          totalProduccion: totalProduccionFinal,
          totalDerechos: totalDerechosFinal,
          totalGastos: totalGastosFinal,
          totalImpuestos: totalDerechosFinal + totalGastosFinal
        };

        return {
          originalData: processedData,
          validationData: validacion,
          empresaDetectada,
          tarifasOficiales: tarifasOficialesCalculadas
        };
      };

      // Cargar y procesar usando el servicio optimizado
      const liquidacionCompleta = await liquidacionPersistenceService.loadAndProcessLiquidacion(
        liquidacionId,
        currentUser.uid,
        processFunction
      );

      // Extraer datos procesados
      const { metadata, originalFile, tarifasFile, ...processedData } = liquidacionCompleta;
      
      // Debug: Mostrar metadatos recibidos (convertir a string para evitar errores de renderizado)
      addLog(`🔍 DEBUG - Metadatos recibidos:`, 'info');
      addLog(`   • metadata.empresa: "${typeof metadata.empresa === 'object' ? JSON.stringify(metadata.empresa) : metadata.empresa}"`, 'info');
      addLog(`   • processedData.empresaDetectada: "${typeof processedData.empresaDetectada === 'object' ? JSON.stringify(processedData.empresaDetectada) : processedData.empresaDetectada}"`, 'info');
      addLog(`   • Companies disponibles: ${companies.length}`, 'info');
      
      // Establecer empresa (priorizar metadatos guardados del histórico)
      // Manejar caso donde empresa puede ser string u objeto
      let empresaMetadata = metadata.empresa;
      if (typeof empresaMetadata === 'object' && empresaMetadata?.nombre) {
        empresaMetadata = empresaMetadata.nombre;
      } else if (typeof empresaMetadata === 'object' && empresaMetadata?.name) {
        empresaMetadata = empresaMetadata.name;
      }
      
      let empresaDetectada = processedData.empresaDetectada;
      if (typeof empresaDetectada === 'object' && empresaDetectada?.nombre) {
        empresaDetectada = empresaDetectada.nombre;
      } else if (typeof empresaDetectada === 'object' && empresaDetectada?.name) {
        empresaDetectada = empresaDetectada.name;
      }
      
      let empresaFinal = empresaMetadata || empresaDetectada || 'GENERAL';
      
      // Si la empresa de metadatos no se encuentra en companies, intentar detectar nuevamente
      if (empresaMetadata && companies.length > 0) {
        const empresaEnMetadatos = companies.find(comp => comp.name === empresaMetadata);
        if (empresaEnMetadatos) {
          empresaFinal = empresaMetadata;
          addLog(`🏢 Empresa restaurada desde metadatos: ${empresaFinal}`, 'success');
        } else {
          // Si no se encuentra, usar la empresa detectada del procesamiento
          empresaFinal = empresaDetectada || empresaMetadata || 'GENERAL';
          addLog(`⚠️ Empresa de metadatos no encontrada, usando detectada: ${empresaFinal}`, 'warning');
        }
      } else {
        addLog(`🏢 Empresa detectada desde archivo: ${empresaFinal}`, 'info');
      }
      
      setEmpresa(empresaFinal);
      
      // Establecer empresa completa con logo
      if (companies && companies.length > 0) {
        const empresaCompleta = companies.find(comp => comp.name === empresaFinal);
        if (empresaCompleta) {
          setEmpresaCompleta(empresaCompleta);
          addLog(`🏢 Empresa completa establecida: ${empresaCompleta.name}`, 'success');
          addLog(`🖼️ Logo empresa: ${empresaCompleta.logo ? 'SÍ disponible' : 'NO disponible'}`, empresaCompleta.logo ? 'success' : 'warning');
        } else {
          // Intentar búsqueda más flexible
          const empresaFlexible = companies.find(comp => 
            comp.name.toLowerCase().trim() === empresaFinal.toLowerCase().trim()
          );
          if (empresaFlexible) {
            setEmpresaCompleta(empresaFlexible);
            addLog(`� Empresa establecida: ${empresaFlexible.name}`, 'success');
          } else {
            addLog(`⚠️ Empresa "${empresaFinal}" no encontrada en catálogo`, 'warning');
          }
        }
      }

      // Establecer archivo seleccionado
      setSelectedFile(originalFile);
      if (tarifasFile) {
        setArchivoTarifas(tarifasFile);
      }

      // Aplicar datos originales primero
      setOriginalData(processedData.originalData || []);
      
      // Auto-confirmar validación (como si el usuario hubiera confirmado)
      // Esto simula el flujo completo sin mostrar el modal
      if (processedData.validationData) {
        const validationData = processedData.validationData;
        
        // Crear métricas finales (siguiendo lógica de confirmarValidacion)
        const metricasFinales = {
          ...validationData.metrics,
          totalProduccion: validationData.totalProduccion,
          totalDerechos: validationData.totalDerechos,
          totalGastos: validationData.totalGastos,
          totalImpuestos: validationData.totalImpuestos
        };
        
        // IMPORTANTE: Actualizar empresa y período en datos consolidados antes de aplicar
        // Obtener el período correcto desde Firebase
        const periodoFirebase = metadata?.fechas?.periodoDetectadoModal || 
                               metadata?.fechas?.periodoLiquidacion ||
                               metadata?.periodoLiquidacion ||
                               metadata?.periodo;
        
        addLog(`📅 Período desde Firebase: ${periodoFirebase}`, 'info');
        
        const consolidatedConEmpresa = validationData.consolidated.map(item => ({
          ...item,
          empresa: empresaFinal,
          // Sobrescribir el período con el valor correcto de Firebase
          periodoTexto: periodoFirebase || item.periodoTexto
        }));
        
        const reporteSalaConEmpresa = validationData.reporteSala.map(sala => ({
          ...sala,
          empresa: empresaFinal,
          // También actualizar período en reporte por sala si existe
          periodoTexto: periodoFirebase || sala.periodoTexto
        }));
        
        // Aplicar datos validados con empresa corregida
        setConsolidatedData(consolidatedConEmpresa);
        setReporteBySala(reporteSalaConEmpresa);
        setMetricsData(metricasFinales);
        
        // Establecer tarifas oficiales si existen
        if (processedData.tarifasOficiales && Object.keys(processedData.tarifasOficiales).length > 0) {
          setTarifasOficiales(processedData.tarifasOficiales);
          addLog(`📋 ${Object.keys(processedData.tarifasOficiales).length} tarifas oficiales cargadas`, 'info');
        }
        
        addLog(`📊 ${validationData.totalMaquinas} máquinas consolidadas`, 'success');
        addLog(`🏢 ${validationData.totalEstablecimientos} establecimientos procesados`, 'success');
        
        // Establecer ID de liquidación guardada
        setLiquidacionGuardadaId(liquidacionId);
      }

      // CRÍTICO: Establecer validationData para habilitar pestañas de resultados
      if (processedData.validationData) {
        setValidationData(processedData.validationData);
        addLog(`✅ Datos de validación establecidos - pestañas habilitadas`, 'success');
      }
      
      setActiveTab(0); // Ir a pestaña de resumen
      addLog('✅ Liquidación cargada y procesada exitosamente', 'success');
      addNotification(`Liquidación ${metadata.periodoLiquidacion} cargada y procesada`, 'success');

    } catch (error) {
      console.error('Error cargando liquidación:', error);
      addLog(`❌ Error cargando liquidación: ${error.message}`, 'error');
      addNotification('Error al cargar liquidación', 'error');
    } finally {
      setProcessing(false);
    }
  };

  
  // Referencias
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const logIdCounter = useRef(0);

  // Efectos
  useEffect(() => {
    // Cargar historial de liquidaciones cuando el usuario se autentique
    if (currentUser?.uid) {
      cargarHistorialLiquidaciones();
    }
  }, [currentUser?.uid]);

  // Effect para carga automática desde histórico
  useEffect(() => {
    const liquidacionId = searchParams.get('cargar');
    if (liquidacionId && currentUser?.uid && !processing) {
      addLog(`🔄 Carga automática solicitada para liquidación: ${liquidacionId}`, 'info');
      cargarLiquidacion(liquidacionId);
      
      // Limpiar parámetro URL después de iniciar la carga
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, currentUser?.uid]);

  // Effect para recalcular métricas cuando falten
  useEffect(() => {
    if (consolidatedData && consolidatedData.length > 0 && reporteBySala && reporteBySala.length > 0 && !metricsData) {
      const nuevasMetricas = calcularMetricas(consolidatedData, reporteBySala);
      setMetricsData(nuevasMetricas);
    }
  }, [consolidatedData, reporteBySala, metricsData]);

  // Función para agregar logs con límite de 100 registros
  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    logIdCounter.current += 1;
    const newLog = {
      id: `log-${logIdCounter.current}-${Date.now()}`,
      timestamp,
      message,
      type
    };
    setLogs(prev => {
      const updated = [...prev, newLog];
      // Mantener solo los últimos 100 logs para evitar memory leak
      if (updated.length > 100) {
        return updated.slice(-100);
      }
      return updated;
    });
  }, []);

  // Función para limpiar logs manualmente
  const limpiarLogs = useCallback(() => {
    setLogs([]);
    addLog('🧹 Logs limpiados correctamente', 'info');
  }, []);

  // Función para buscar empresa por número de contrato
  const buscarEmpresaPorContrato = useCallback((numeroContrato) => {
    if (!companies || companies.length === 0) {
      return null;
    }

    // Normalizar el número de contrato del archivo (quitar "Contrato" si está presente)
    let numeroContratoNormalizado = numeroContrato.toString().trim().toUpperCase();
    
    // Si empieza con "Contrato", quitarlo
    if (numeroContratoNormalizado.startsWith('CONTRATO')) {
      numeroContratoNormalizado = numeroContratoNormalizado.replace(/^CONTRATO\s*/i, '').trim();
    }

    // Buscar por número de contrato EXACTO (case-insensitive)
    const empresaEncontrada = companies.find(company => {
      if (!company.contractNumber) {
        return false;
      }
      
      const contratoEmpresa = company.contractNumber.toString().trim().toUpperCase();
      const contratoArchivo = numeroContratoNormalizado;
      
      return contratoEmpresa === contratoArchivo;
    });

    if (empresaEncontrada) {
      setEmpresaCompleta(empresaEncontrada); // Guardar empresa completa
      return empresaEncontrada.name;
    } else {
      setEmpresaCompleta(null); // Limpiar empresa completa
      return null;
    }
  }, [companies]);

  // Manejo de archivos
  const handleFileSelect = (event) => {
    // 🔒 VALIDACIÓN CRÍTICA: Prevenir carga si empresas no están disponibles
    if (companiesLoading) {
      addNotification({
        type: 'warning',
        title: 'Cargando empresas',
        message: 'Por favor espera a que se carguen las empresas antes de subir archivos...',
        icon: 'warning',
        color: 'warning'
      });
      // Limpiar el input file para que pueda volver a intentar
      event.target.value = null;
      return;
    }

    if (!companies || companies.length === 0) {
      addNotification({
        type: 'error',
        title: 'Sin empresas disponibles',
        message: 'No se encontraron empresas en la base de datos. Verifica tu conexión.',
        icon: 'error',
        color: 'error'
      });
      event.target.value = null;
      return;
    }
    
    // Prevenir carga si ya hay archivos procesados o viene del histórico
    if (selectedFile || liquidacionGuardadaId) {
      addNotification('Ya hay archivos procesados. Reinicia la aplicación para cargar otros.', 'warning');
      return;
    }
    
    const file = event.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file) => {
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
    
    // Limpiar estados previos para nuevo archivo local
    setLiquidacionGuardadaId(null);
    setEmpresa(''); // Limpiar empresa anterior
    setEmpresaCompleta(null); // Limpiar empresa completa anterior
    
    addLog(`📁 Archivo seleccionado: ${file.name}`, 'success');
    
    // 🔍 EXTRAER Y VALIDAR EMPRESA INMEDIATAMENTE
    try {
      addLog('🏢 Detectando empresa del archivo...', 'info');
      
      // Leer archivo para extraer número de contrato
      const data = await readFile(file);
      
      // Buscar número de contrato en las primeras 15 filas (IGNORAR HEADERS)
      let numeroContrato = null;
      const valoresIgnorados = ['contrato', 'contract', 'numero', 'number', 'código', 'codigo'];
      
      for (let i = 1; i < Math.min(15, data.length); i++) {
        const fila = data[i];
        
        if (fila && fila[0]) {
          const posibleContrato = fila[0].toString().trim();
          const posibleContratoLower = posibleContrato.toLowerCase();
          
          // Ignorar si es un header (palabras como "Contrato", "Contract", etc.)
          const esHeader = valoresIgnorados.some(palabra => 
            posibleContratoLower === palabra || 
            posibleContratoLower.startsWith(palabra + ' ')
          );
          
          if (esHeader) {
            continue; // Saltar esta fila y continuar buscando
          }
          
          // Si llegamos aquí, es un valor real (no un header)
          if (posibleContrato && posibleContrato !== '') {
            numeroContrato = posibleContrato;
            addLog(`📋 Número de contrato encontrado en fila ${i}: ${numeroContrato}`, 'info');
            break;
          }
        }
      }
      
      // Buscar empresa por contrato ANTES de mostrar el popup
      if (numeroContrato) {
        const empresaDetectada = buscarEmpresaPorContrato(numeroContrato);
        
        if (empresaDetectada) {
          setEmpresa(empresaDetectada);
          addLog(`✅ Empresa detectada: ${empresaDetectada}`, 'success');
          addNotification({
            type: 'success',
            title: 'Empresa detectada',
            message: `Se detectó la empresa: ${empresaDetectada}`,
            icon: 'success',
            color: 'success'
          });
        } else {
          const empresaNoEncontrada = `Contrato ${numeroContrato} (No encontrado)`;
          setEmpresa(empresaNoEncontrada);
          addLog(`⚠️ No se encontró empresa para el contrato: ${numeroContrato}`, 'warning');
          addNotification({
            type: 'warning',
            title: 'Empresa no encontrada',
            message: `No se encontró empresa para el contrato: ${numeroContrato}`,
            icon: 'warning',
            color: 'warning'
          });
        }
      } else {
        setEmpresa('Empresa no detectada');
        addLog('⚠️ No se pudo detectar número de contrato en el archivo', 'warning');
      }
    } catch (error) {
      console.error('❌ [DETECCIÓN EMPRESA] Error:', error);
      setEmpresa('Error al detectar empresa');
      addLog(`❌ Error al detectar empresa: ${error.message}`, 'error');
    }
    
    // Procesar automáticamente después de detectar empresa
    setTimeout(() => {
      procesarLiquidacion(file);
    }, 500);
  };

  // Drag & Drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // No cambiar estado visual si ya hay archivos procesados
    if (selectedFile || liquidacionGuardadaId) {
      return;
    }
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [selectedFile, liquidacionGuardadaId]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // 🔒 VALIDACIÓN CRÍTICA: Prevenir drop si empresas no están disponibles
    if (companiesLoading) {
      addNotification({
        type: 'warning',
        title: 'Cargando empresas',
        message: 'Por favor espera a que se carguen las empresas antes de subir archivos...',
        icon: 'warning',
        color: 'warning'
      });
      return;
    }

    if (!companies || companies.length === 0) {
      addNotification({
        type: 'error',
        title: 'Sin empresas disponibles',
        message: 'No se encontraron empresas en la base de datos. Verifica tu conexión.',
        icon: 'error',
        color: 'error'
      });
      return;
    }

    // Prevenir drop si ya hay archivos procesados o viene del histórico
    if (selectedFile || liquidacionGuardadaId) {
      addNotification('Ya hay archivos procesados. Reinicia la aplicación para cargar otros.', 'warning');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  }, [selectedFile, liquidacionGuardadaId, companiesLoading, companies, addNotification]);

  // Consolidar datos por NUC (función que faltaba)
  // Agrupar por establecimiento (función que faltaba)
  const agruparPorEstablecimiento = (consolidated) => {
    const grouped = {};
    
    consolidated.forEach(item => {
      if (!grouped[item.establecimiento]) {
        grouped[item.establecimiento] = {
          establecimiento: item.establecimiento,
          empresa: item.empresa,
          maquinas: [],
          totalProduccion: 0,
          totalMaquinas: 0
        };
      }
      
      grouped[item.establecimiento].maquinas.push(item);
      grouped[item.establecimiento].totalProduccion += item.produccion;
      grouped[item.establecimiento].totalMaquinas += 1;
    });
    
    const result = Object.values(grouped);
    return result;
  };

  // Función de procesamiento completo reutilizable
  const procesarDatosCompletos = async (data, empresaParam = null) => {
    try {
      // Detectar empresa si no se proporciona (IGNORAR HEADERS)
      let empresaDetectada = empresaParam;
      if (!empresaDetectada) {
        let numeroContrato = null;
        const valoresIgnorados = ['contrato', 'contract', 'numero', 'number', 'código', 'codigo'];
        
        for (let i = 1; i < Math.min(15, data.length); i++) {
          const fila = data[i];
          if (fila && fila[0]) {
            const posibleContrato = fila[0].toString().trim();
            const posibleContratoLower = posibleContrato.toLowerCase();
            
            // Ignorar si es un header
            const esHeader = valoresIgnorados.some(palabra => 
              posibleContratoLower === palabra || 
              posibleContratoLower.startsWith(palabra + ' ')
            );
            
            if (esHeader) {
              continue; // Saltar esta fila
            }
            
            if (posibleContrato && posibleContrato !== '') {
              numeroContrato = posibleContrato;
              break;
            }
          }
        }
        
        if (numeroContrato) {
          empresaDetectada = buscarEmpresaPorContrato(numeroContrato);
        }
        empresaDetectada = empresaDetectada || 'Empresa no detectada';
      }

      // Detectar encabezados
      const headerRow = detectarFilaEncabezados(data);
      
      // Procesar datos
      const processedData = procesarDatos(data, headerRow);
      
      // Consolidar por NUC (usa función completa con cálculos)
      const consolidated = consolidarDatos(processedData);
      
      // Agrupar por establecimiento
      const reporteSala = agruparPorEstablecimiento(consolidated);
      
      // Calcular métricas usando la función completa con validación
      const metrics = calcularMetricas(consolidated, reporteSala);

      return {
        originalData: processedData,
        consolidatedData: consolidated,
        reporteBySala: reporteSala,
        metricsData: metrics,
        tarifasOficiales: {} // Se llenarían con archivo de tarifas
      };

    } catch (error) {
      console.error('Error en procesarDatosCompletos:', error);
      throw error;
    }
  };

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
      
      // Extraer número de contrato del archivo (IGNORAR HEADERS)
      let numeroContrato = null;
      let empresaDetectada = null;
      
      addLog('🔍 Buscando número de contrato en el archivo...', 'info');
      
      // Buscar en las primeras 15 filas para encontrar el contrato (IGNORAR HEADERS)
      const valoresIgnorados = ['contrato', 'contract', 'numero', 'number', 'código', 'codigo'];
      
      for (let i = 1; i < Math.min(15, data.length); i++) {
        const fila = data[i];
        if (fila && fila[0]) {
          const posibleContrato = fila[0].toString().trim();
          const posibleContratoLower = posibleContrato.toLowerCase();
          
          // Ignorar si es un header (palabras como "Contrato", "Contract", etc.)
          const esHeader = valoresIgnorados.some(palabra => 
            posibleContratoLower === palabra || 
            posibleContratoLower.startsWith(palabra + ' ')
          );
          
          if (esHeader) {
            continue; // Saltar esta fila y continuar buscando
          }
          
          // Si llegamos aquí, es un valor real (no un header)
          if (posibleContrato && posibleContrato !== '') {
            numeroContrato = posibleContrato;
            addLog(`📋 Número de contrato encontrado en fila ${i}: ${numeroContrato}`, 'info');
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
      
      // Agregar información de empresa a los datos consolidados
      const consolidatedConEmpresa = consolidated.map(item => ({
        ...item,
        empresa: empresaDetectada || empresa || 'Empresa no detectada'
      }));
      
      // Generar reporte por sala
      const reporteSala = generarReporteSala(consolidatedConEmpresa);
      
      // Calcular métricas
      const metrics = calcularMetricas(consolidatedConEmpresa, reporteSala);
      
      // Calcular totales
      const totalProduccion = consolidatedConEmpresa.reduce((sum, item) => {
        const produccion = Number(item.produccion) || 0;
        return sum + produccion;
      }, 0);
      
      const totalDerechos = consolidatedConEmpresa.reduce((sum, item) => {
        const derechos = Number(item.derechosExplotacion) || 0;
        return sum + derechos;
      }, 0);
      
      const totalGastos = consolidatedConEmpresa.reduce((sum, item) => {
        const gastos = Number(item.gastosAdministracion) || 0;
        return sum + gastos;
      }, 0);
      
      // Preparar datos de validación
      const validacion = {
        consolidated: consolidatedConEmpresa,
        reporteSala,
        metrics,
        totalMaquinas: consolidatedConEmpresa.length,
        totalEstablecimientos: reporteSala.length,
        totalProduccion: totalProduccion,
        totalDerechos: totalDerechos,
        totalGastos: totalGastos,
        totalImpuestos: totalDerechos + totalGastos
      };
      
      // Mostrar modal de validación
      setValidationData(validacion);
      setShowValidationModal(true);
      
      // 📊 LOG DE ACTIVIDAD: Archivo procesado exitosamente
      try {
        // Detectar período para el log
        let periodoLog = 'No detectado';
        try {
          periodoLog = detectarPeriodoLiquidacion();
        } catch (periodoError) {
          console.warn('No se pudo detectar período:', periodoError);
        }
        
        // Usar empresaDetectada que está disponible en este scope
        const empresaParaLog = empresaDetectada || numeroContrato || 'general';
        
        // Crear ID Entidad más descriptivo con empresa y período
        const entityIdCompleto = periodoLog !== 'No detectado' 
          ? `${empresaParaLog} - ${periodoLog}`
          : empresaParaLog;
        
        await logActivity(
          'archivo_liquidacion_procesado',
          'liquidacion',
          entityIdCompleto,
          {
            fileName: archivo.name || 'sin-nombre',
            fileSize: archivo.size || 0,
            empresa: empresaDetectada || 'Empresa no detectada',
            numeroContrato: numeroContrato || 'No detectado',
            periodo: periodoLog,
            totalMaquinas: consolidatedConEmpresa.length || 0,
            totalEstablecimientos: reporteSala.length || 0,
            totalProduccion: totalProduccion || 0,
            totalDerechos: totalDerechos || 0,
            totalGastos: totalGastos || 0,
            totalImpuestos: (totalDerechos + totalGastos) || 0
          },
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging liquidacion processing:', logError);
      }
      
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
      }
      // Mapeos alternativos para compatibilidad
      else if (headerLower.includes('sala') || headerLower.includes('casino')) {
        columnMap.establecimiento = index;
      } else if (headerLower.includes('categoria') || headerLower.includes('tipo')) {
        columnMap.tipoApuesta = index;
      }
    });
    
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
      
      return obj;
    }).filter(row => row.nuc && row.nuc !== ''); // Filtrar filas válidas
    
    return processedRows;
  };

  // Formatear fecha sin problemas de timezone (DD/MM/YYYY)
  const formatearFechaSinTimezone = (fecha) => {
    try {
      if (!fecha || isNaN(fecha.getTime())) return '';
      
      // Usar componentes UTC para evitar problemas de zona horaria
      const dia = String(fecha.getUTCDate()).padStart(2, '0');
      const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
      const año = fecha.getUTCFullYear();
      
      return `${dia}/${mes}/${año}`;
    } catch {
      return '';
    }
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
  // Fallback: si no podemos determinar, tratamos como sin cambios para no sesgar métricas
  return 'Sin cambios';
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

  // Consolidar datos por NUC (memoizado para evitar reprocesamiento)
  const consolidarDatos = useCallback((data) => {
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
        primerDia: formatearFechaSinTimezone(fechaInicio),
        ultimoDia: formatearFechaSinTimezone(fechaFin),
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
    
    return result;
  }, [empresa]); // Memoizado con dependencia en empresa

  // Generar reporte por sala
  const generarReporteSala = (consolidatedConEmpresa) => {
    const grouped = {};
    
    consolidatedConEmpresa.forEach(item => {
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
      // Crear métricas finales usando los valores actualizados individuales
      const metricasFinales = {
        ...validationData.metrics,
        totalProduccion: validationData.totalProduccion,
        totalDerechos: validationData.totalDerechos,
        totalGastos: validationData.totalGastos,
        totalImpuestos: validationData.totalImpuestos
      };
      
      // Aplicar datos validados
      setConsolidatedData(validationData.consolidated);
      setReporteBySala(validationData.reporteSala);
      setMetricsData(metricasFinales);
      
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

    setProcesandoTarifas(true);
    addLog('📄 Procesando archivo de tarifas...', 'info');

    try {
      // Procesamiento optimizado
      const data = await archivo.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Detectar encabezados rápidamente (solo primeras 5 filas)
      let headerRow = -1;
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i];
        if (Array.isArray(row) && row.some(cell => 
          cell && typeof cell === 'string' && 
          (cell.toLowerCase().includes('nuc') || cell.toLowerCase().includes('tarifa'))
        )) {
          headerRow = i;
          break;
        }
      }

      if (headerRow === -1) {
        throw new Error('No se encontraron encabezados válidos (NUC, Tarifa) en el archivo de tarifas');
      }

      const headers = jsonData[headerRow];
      const dataRows = jsonData.slice(headerRow + 1);

      // Mapear columnas optimizado
      const nucIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('nuc'));
      const tarifaIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('tarifa'));
      const derechosIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('derechos'));
      const gastosIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('gastos'));

      if (nucIndex === -1 || tarifaIndex === -1) {
        throw new Error('No se encontraron columnas NUC o Tarifa en el archivo. Verifique que el archivo tenga estas columnas.');
      }

      // Procesamiento rápido - solo tarifas fijas necesarias
      const nuevasTarifas = {};
      let tarífasEncontradas = 0;

      dataRows.forEach((row) => {
        if (row[nucIndex] && row[tarifaIndex] === 'Tarifa fija') {
          const nuc = row[nucIndex].toString();
          const derechos = parseFloat(row[derechosIndex]) || 0;
          const gastos = parseFloat(row[gastosIndex]) || 0;
          
          if (derechos > 0 || gastos > 0) {
            nuevasTarifas[nuc] = {
              derechosAdicionales: derechos,
              gastosAdicionales: gastos
            };
            tarífasEncontradas++;
          }
        }
      });

      if (tarífasEncontradas === 0) {
        throw new Error('No se encontraron tarifas válidas en el archivo. Verifique que las columnas contengan datos numéricos.');
      }

      // Aplicar ajustes optimizado
      if (validationData?.consolidated) {
        const datosAjustados = validationData.consolidated.map(maquina => {
          const nucString = maquina.nuc.toString();
          
          if (nuevasTarifas[nucString]) {
            const infoTarifa = nuevasTarifas[nucString];
            const nuevosDerechos = maquina.derechosExplotacion + infoTarifa.derechosAdicionales;
            const nuevosGastos = maquina.gastosAdministracion + infoTarifa.gastosAdicionales;
            
            return {
              ...maquina,
              derechosExplotacion: nuevosDerechos,
              gastosAdministracion: nuevosGastos,
              totalImpuestos: nuevosDerechos + nuevosGastos,
              tarifa: 'Tarifa fija (valores sumados)'
            };
          }
          
          return { ...maquina, tarifa: 'Cálculo original (sin ajuste)' };
        });

        // Recalcular totales rápido
        const nuevoTotalDerechos = datosAjustados.reduce((sum, item) => sum + item.derechosExplotacion, 0);
        const nuevoTotalGastos = datosAjustados.reduce((sum, item) => sum + item.gastosAdministracion, 0);

        const nuevasMetricas = {
          ...validationData.metrics,
          totalDerechos: nuevoTotalDerechos,
          totalGastos: nuevoTotalGastos,
          totalImpuestos: nuevoTotalDerechos + nuevoTotalGastos
        };

        // Actualizar validation data con ajustes rápido
        const nuevoValidationData = {
          ...validationData,
          consolidated: datosAjustados,
          metrics: nuevasMetricas
        };

        setValidationData(nuevoValidationData);

        // Auto-confirmar rápidamente con los valores correctos
        setTimeout(() => {
          setConsolidatedData(datosAjustados);
          setReporteBySala(nuevoValidationData.reporteSala);
          setMetricsData(nuevasMetricas);
          
          addLog(`✅ ${tarífasEncontradas} tarifas aplicadas correctamente`, 'success');
          setActiveTab(0);
          setShowValidationModal(false);
          setValidationData(null);
        }, 500); // Reducido a 500ms para mayor velocidad
      }

      setTarifasOficiales(nuevasTarifas);
      addLog(`✅ Archivo de tarifas procesado: ${tarífasEncontradas} ajustes aplicados`, 'success');
      setShowTarifasOptions(false);
      setLiquidacionCoincide(true);
      
      // 📄 LOG DE ACTIVIDAD: Archivo de tarifas procesado
      try {
        await logActivity(
          'archivo_tarifas_procesado',
          'liquidacion',
          empresa || 'general',
          {
            fileName: archivo.name || 'sin-nombre',
            fileSize: archivo.size || 0,
            empresa: empresa || 'Empresa no detectada',
            tarifasEncontradas: tarífasEncontradas || 0,
            tarifasAplicadas: Object.keys(nuevasTarifas).length || 0
          },
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging tariffs processing:', logError);
      }
      
    } catch (error) {
      addLog(`❌ Error procesando archivo de tarifas: ${error.message}`, 'error');
      addNotification('Error al procesar archivo de tarifas', 'error');
    } finally {
      setProcesandoTarifas(false);
    }
  };

  const seleccionarArchivoTarifas = () => {
    addLog('📁 Abriendo selector de archivo de tarifas...', 'info');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const archivo = e.target.files[0];
      
      if (archivo) {
        // VALIDAR: No debe ser el mismo archivo inicial
        if (selectedFile && archivo.name === selectedFile.name && archivo.size === selectedFile.size) {
          addLog('❌ Error: No puede subir el mismo archivo inicial', 'error');
          addNotification('Error: Debe subir un archivo de tarifas diferente al archivo inicial', 'error');
          return;
        }
        
        addLog(`📄 Archivo de tarifas seleccionado: ${archivo.name}`, 'info');
        setArchivoTarifas(archivo);
        
        // PROCESAR AUTOMÁTICAMENTE
        procesarArchivoTarifas(archivo);
      } else {
        addLog('❌ No se seleccionó archivo de tarifas', 'warning');
      }
    };
    
    input.onerror = (error) => {
      console.error('❌ Error en selector de archivo:', error);
      addLog('❌ Error abriendo selector de archivo', 'error');
    };
    
    input.click();
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
  // Calcular métricas (memoizado para evitar recálculos innecesarios)
  const calcularMetricas = useMemo(() => {
    return (consolidatedData, reporteSala) => {
      if (!consolidatedData || !Array.isArray(consolidatedData) || consolidatedData.length === 0) {
        return null;
      }

      if (!reporteSala || !Array.isArray(reporteSala)) {
        return null;
      }

      // Normalización helper
      const toNumber = (v) => {
        if (v === null || v === undefined) return 0;
        if (typeof v === 'number') return isFinite(v) ? v : 0;
        if (typeof v === 'string') {
          const cleaned = v.replace(/[$,%\s]/g, '').replace(/\.(?=.*\.)/g,'').replace(/,/g,'.');
          const n = parseFloat(cleaned);
          return isNaN(n) ? 0 : n;
        }
        return 0;
      };

      // Asegurar que cada item tenga cálculos financieros básicos si faltan
      consolidatedData.forEach(item => {
        const prod = toNumber(item.produccion || item.totalProduccion);
        if (!item || prod === 0) return;
        if (typeof item.derechosExplotacion !== 'number' || isNaN(item.derechosExplotacion) || item.derechosExplotacion === 0) {
          item.derechosExplotacion = prod * 0.12;
        }
        if (typeof item.gastosAdministracion !== 'number' || isNaN(item.gastosAdministracion) || item.gastosAdministracion === 0) {
          item.gastosAdministracion = prod * 0.015;
        }
        if (typeof item.totalImpuestos !== 'number' || isNaN(item.totalImpuestos) || item.totalImpuestos === 0) {
          item.totalImpuestos = toNumber(item.derechosExplotacion) + toNumber(item.gastosAdministracion);
        }
      });

      const totalProduccion = consolidatedData.reduce((sum, item) => sum + toNumber(item.produccion), 0);
    const totalDerechos = consolidatedData.reduce((sum, item) => sum + toNumber(item.derechosExplotacion), 0);
    const totalGastos = consolidatedData.reduce((sum, item) => sum + toNumber(item.gastosAdministracion), 0);
    const totalImpuestos = consolidatedData.reduce((sum, item) => sum + toNumber(item.totalImpuestos), 0);

    // Posibles variantes de estado novedad
    const isSinCambios = (estado) => {
      const norm = (estado || '').toString().trim().toLowerCase();
      if (!norm || ['sin informacion','sin información',''].includes(norm)) return true; // tratar ausencia como sin cambios
      return ['sin cambios', 'sin_cambios', 'sin-cambios', 'ok', 'igual'].includes(norm);
    };

    const sinCambios = consolidatedData.filter(item => isSinCambios(item.novedad)).length;
    const conNovedades = consolidatedData.length - sinCambios;
    const porcentajeSinCambios = consolidatedData.length > 0 ? (sinCambios / consolidatedData.length * 100) : 0;
    const porcentajeConNovedad = consolidatedData.length > 0 ? (conNovedades / consolidatedData.length * 100) : 0;
    const promedioEstablecimiento = reporteSala.length > 0 ? totalProduccion / reporteSala.length : 0;
    
    const metricas = {
      totalMaquinas: consolidatedData.length,
      totalEstablecimientos: reporteSala.length,
      totalProduccion,
      totalDerechos,
      totalGastos,
      totalImpuestos,
      sinCambios,
      conNovedades,
      porcentajeSinCambios,
      porcentajeConNovedad,
      promedioEstablecimiento
    };

    return metricas;
    };
  }, []); // Memoizado sin dependencias (función pura)

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
        
        // 📤 LOG DE ACTIVIDAD: Exportación consolidada
        try {
          await logActivity(
            'liquidacion_consolidada_exportada',
            'liquidacion',
            empresa || 'GENERAL',
            {
              exportFormat: 'python',
              empresa: empresa || 'GENERAL',
              registrosExportados: consolidatedData?.length || 0,
              fileName: result?.fileName || 'Liquidacion.xlsx'
            },
            currentUser.uid,
            userProfile?.name || currentUser.displayName || 'Usuario desconocido',
            currentUser.email
          );
        } catch (logError) {
          console.error('Error logging export:', logError);
        }
        
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

  const abrirModalDaily = () => {
    if (!consolidatedData) {
      addNotification('No hay datos para exportar reporte diario', 'warning');
      return;
    }
    const establecimientosUnicos = [...new Set(consolidatedData.map(i => i.establecimiento).filter(Boolean))];
    if (establecimientosUnicos.length === 0) {
      addNotification('No se detectaron establecimientos en los datos', 'error');
      return;
    }
    if (establecimientosUnicos.length === 1) {
      // Exportación directa
      exportarReporteDiario(establecimientosUnicos[0]);
    } else {
      setShowDailyModal(true);
    }
  };

  const exportarReporteDiario = async (establecimientoForzado) => {
    if (!consolidatedData || !consolidatedData.length) {
      addNotification('No hay datos para exportar reporte diario', 'warning');
      return;
    }

    // Si el usuario seleccionó solo un establecimiento previamente (por sala export), usamos ese; de lo contrario pedimos el primero.
    const establecimientosUnicos = [...new Set(consolidatedData.map(item => item.establecimiento).filter(Boolean))];
    if (!establecimientosUnicos.length) {
      addNotification('No se detectaron establecimientos en los datos', 'error');
      return;
    }

    let establecimientoTarget;
    if (establecimientoForzado) {
      establecimientoTarget = establecimientoForzado;
    } else {
      establecimientoTarget = establecimientosUnicos[0];
      if (establecimientosUnicos.length > 1) {
        addNotification(`Usando el primer establecimiento (${establecimientoTarget}).`, 'info');
      }
    }

    try {
      // Usar exclusivamente el primer archivo (originalData) para datos diarios reales
      if (!originalData || !Array.isArray(originalData) || originalData.length === 0) {
        addNotification('No hay archivo original con datos diarios', 'warning');
        return;
      }
      const hayFechasReales = originalData.some(r => r['Fecha reporte'] || r.fechaReporte || r['Fecha'] || r.fecha);
      if (!hayFechasReales) {
        addLog('⚠️ No se encontraron fechas diarias explícitas en el archivo original. No se genera reporte.', 'warning');
        addNotification('No hay registros diarios reales en el archivo original', 'warning');
        return;
      }
      addLog(`📅 Generando reporte diario multi-hoja (solo datos reales) para ${establecimientoTarget}...`, 'info');
      await exportarReporteDiarioSala(originalData, establecimientoTarget, empresa || 'General');
      addLog('✅ Reporte diario exportado (multi-hoja por día)', 'success');
      addNotification('Reporte diario exportado', 'success');
      
      // 📅 LOG DE ACTIVIDAD: Exportación reporte diario
      try {
        await logActivity(
          'reporte_diario_exportado',
          'liquidacion',
          establecimientoTarget || 'sin-establecimiento',
          {
            empresa: empresa || 'General',
            establecimiento: establecimientoTarget || 'sin-establecimiento',
            registrosDiarios: originalData?.length || 0,
            exportFormat: 'python'
          },
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging daily report export:', logError);
      }
      
      setShowDailyModal(false);
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
      setEmpresaCompleta(null); // Limpiar empresa completa con logo
      
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
      
      // Resetear estados de Firebase
      setGuardandoLiquidacion(false);
      setLiquidacionGuardadaId(null);
      setHistorialLiquidaciones([]);
      setCargandoHistorial(false);
      setShowConfirmarGuardadoModal(false);
      
      // Resetear input de archivo con un pequeño retraso
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 100);
      
      // Forzar re-render después del reset con un pequeño delay
      setTimeout(() => {
        addLog('🔄 Aplicación reiniciada correctamente', 'info');
        addLog('📁 Listo para cargar un nuevo archivo', 'info');
      }, 150);
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
            Procesador de Liquidaciones
            {liquidacionGuardadaId && (
              <Chip 
                label="Sincronizado" 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 500,
                  '& .MuiChip-icon': { color: 'white' }
                }}
                icon={<Storage />}
              />
            )}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Sistema avanzado de procesamiento y análisis de liquidaciones de máquinas
          </Typography>
        </Box>
      </Paper>

      {/* Sección de Historial de Liquidaciones - Solo si hay datos */}
      {historialLiquidaciones.length > 0 && (
        <Card sx={{ 
          mb: 3,
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Storage sx={{ color: theme.palette.info.main, fontSize: '1.2rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Liquidaciones Guardadas
              </Typography>
              {guardandoLiquidacion && (
                <CircularProgress size={16} />
              )}
              {liquidacionGuardadaId && (
                <Chip 
                  label="Guardado" 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {historialLiquidaciones.slice(0, 5).map((liquidacion) => (
                <Chip
                  key={liquidacion.id}
                  label={`${
                    typeof liquidacion.empresa === 'string' 
                      ? liquidacion.empresa 
                      : liquidacion.empresa?.nombre || liquidacion.empresa?.name || 'Sin Empresa'
                  } - ${liquidacion.fechas?.periodoDetectadoModal || `${liquidacion.fechas?.mesLiquidacion} ${liquidacion.fechas?.añoLiquidacion}`}`}
                  onClick={() => cargarLiquidacion(liquidacion.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                  deleteIcon={liquidacion.id === liquidacionGuardadaId ? <CheckCircle /> : undefined}
                  onDelete={liquidacion.id === liquidacionGuardadaId ? () => {} : undefined}
                />
              ))}
              {historialLiquidaciones.length > 5 && (
                <Chip 
                  label={`+${historialLiquidaciones.length - 5} más`} 
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>

            {liquidacionGuardadaId && (
              <Alert 
                severity="success" 
                sx={{ mt: 2, py: 0.5 }}
                icon={<Storage />}
              >
                Esta liquidación está sincronizada con Firebase (ID: {liquidacionGuardadaId.slice(-8)})
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

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
              
              {/* Botón seleccionar archivo - Deshabilitar si ya hay archivos procesados o viene del histórico */}
              <Button
                variant="contained"
                startIcon={companiesLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={!!(selectedFile || liquidacionGuardadaId || companiesLoading)} // Deshabilitar si está cargando empresas
                sx={{ 
                  mb: 2, 
                  mr: 1,
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  background: (selectedFile || liquidacionGuardadaId || companiesLoading)
                    ? alpha(theme.palette.action.disabled, 0.12)
                    : undefined,
                  color: (selectedFile || liquidacionGuardadaId || companiesLoading)
                    ? theme.palette.action.disabled
                    : undefined,
                  '&:disabled': {
                    background: alpha(theme.palette.action.disabled, 0.12),
                    color: theme.palette.action.disabled
                  }
                }}
              >
                {companiesLoading
                  ? 'Cargando empresas...'
                  : selectedFile 
                    ? 'Archivo Ya Seleccionado'
                    : liquidacionGuardadaId 
                      ? 'Liquidación del Histórico'
                      : 'Seleccionar Archivo'
                }
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                disabled={!!(selectedFile || liquidacionGuardadaId)} // Deshabilitar si ya hay archivo o viene del histórico
                style={{ display: 'none' }}
              />
              
              {/* Zona drag & drop - Diseño Sobrio - Deshabilitar si ya hay archivos o cargando */}
              <Paper
                ref={dropZoneRef}
                onDragEnter={selectedFile || liquidacionGuardadaId || companiesLoading ? undefined : handleDrag}
                onDragLeave={selectedFile || liquidacionGuardadaId || companiesLoading ? undefined : handleDrag}
                onDragOver={selectedFile || liquidacionGuardadaId || companiesLoading ? undefined : handleDrag}
                onDrop={selectedFile || liquidacionGuardadaId || companiesLoading ? undefined : handleDrop}
                sx={{
                  p: 3,
                  border: `2px dashed ${
                    selectedFile || liquidacionGuardadaId || companiesLoading
                      ? alpha(theme.palette.action.disabled, 0.3)
                      : dragActive 
                        ? alpha(theme.palette.primary.main, 0.6) 
                        : alpha(theme.palette.divider, 0.15)
                  }`,
                  backgroundColor: selectedFile || liquidacionGuardadaId || companiesLoading
                    ? alpha(theme.palette.action.disabled, 0.05)
                    : dragActive 
                      ? alpha(theme.palette.primary.main, 0.08) 
                      : alpha(theme.palette.primary.main, 0.04),
                  textAlign: 'center',
                  cursor: selectedFile || liquidacionGuardadaId || companiesLoading ? 'not-allowed' : 'pointer',
                  mb: 2,
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  opacity: selectedFile || liquidacionGuardadaId || companiesLoading ? 0.6 : 1
                }}
              >
                {companiesLoading ? (
                  <>
                    <CircularProgress size={40} sx={{ mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      Cargando empresas desde Firestore...
                    </Typography>
                  </>
                ) : (
                  <>
                    <CloudUpload sx={{ 
                      fontSize: 40, 
                      color: selectedFile || liquidacionGuardadaId
                        ? alpha(theme.palette.action.disabled, 0.5)
                        : alpha(theme.palette.text.secondary, 0.7), 
                      mb: 1 
                    }} />
                    <Typography 
                      variant="body2" 
                      color={selectedFile || liquidacionGuardadaId ? "textDisabled" : "textSecondary"}
                    >
                      {selectedFile
                        ? 'Archivo ya seleccionado - Reinicia para cargar otro'
                        : liquidacionGuardadaId
                          ? 'Liquidación del histórico - No requiere archivos'
                          : 'También puedes arrastrar archivos Excel/CSV aquí'
                      }
                    </Typography>
                  </>
                )}
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
                    ) : empresa && typeof empresa === 'string' ? (
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

              {/* Botón Guardar Liquidación - Solo para liquidaciones nuevas (no desde histórico) */}
              {originalData && consolidatedData && !processing && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    💾 Guardar en Firebase
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Save />}
                    onClick={mostrarConfirmacionGuardado}
                    disabled={!!(guardandoLiquidacion || liquidacionGuardadaId)} // Deshabilitar si ya está guardada (cargada desde histórico)
                    sx={{
                      borderRadius: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                      background: liquidacionGuardadaId 
                        ? alpha(theme.palette.action.disabled, 0.12)
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: liquidacionGuardadaId 
                        ? theme.palette.action.disabled
                        : 'white',
                      '&:hover': liquidacionGuardadaId ? {} : {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6c5ce7 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      },
                      '&:disabled': {
                        background: alpha(theme.palette.action.disabled, 0.12),
                        color: theme.palette.action.disabled
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {guardandoLiquidacion 
                      ? 'Guardando...' 
                      : liquidacionGuardadaId 
                        ? 'Liquidación del Histórico'
                        : 'Guardar Liquidación'
                    }
                  </Button>
                  
                  {liquidacionGuardadaId && (
                    <Box sx={{
                      mt: 1,
                      p: 1,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      borderRadius: 1,
                      textAlign: 'center',
                      border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                    }}>
                      <Typography variant="caption" color="info.main" sx={{ fontWeight: 500 }}>
                        📋 Liquidación cargada desde histórico: {liquidacionGuardadaId.slice(0, 8)}...
                      </Typography>
                    </Box>
                  )}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="overline" sx={{ 
                    fontWeight: 600, 
                    color: 'secondary.main',
                    letterSpacing: 0.8,
                    fontSize: '0.75rem'
                  }}>
                    Registro de Actividades
                  </Typography>
                  
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    📋 Log de Actividades
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={`${logs.length} registros`}
                    size="small"
                    color={logs.length > 80 ? 'warning' : 'default'}
                    sx={{ fontWeight: 500 }}
                  />
                  {logs.length > 0 && (
                    <IconButton
                      size="small"
                      onClick={limpiarLogs}
                      sx={{ 
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.08)
                        }
                      }}
                      title="Limpiar logs"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
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
            height: 'fit-content',
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
                {tarifasOficiales && Object.keys(tarifasOficiales).length > 0 && (
                  <Tab 
                    label="🏷️ Tarifa Fija" 
                    icon={<Receipt />}
                    iconPosition="start"
                  />
                )}
              </Tabs>
            </Box>
            
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                              Sin Cambios ({metricsData.porcentajeSinCambios?.toFixed(1) || '0.0'}%)
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
                              Con Novedades ({(100 - (metricsData.porcentajeSinCambios || 0)).toFixed(1)}%)
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
                                <TableCell>Tarifa</TableCell>
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
                                  <TableCell>
                                    <Chip 
                                      label={
                                        tarifasOficiales && tarifasOficiales[row.nuc.toString()] 
                                          ? 'Tarifa Fija' 
                                          : 'Tarifa Variable'
                                      }
                                      color={
                                        tarifasOficiales && tarifasOficiales[row.nuc.toString()] 
                                          ? 'secondary' 
                                          : 'primary'
                                      }
                                      size="small"
                                      sx={{ 
                                        fontWeight: 500,
                                        fontSize: '0.75rem'
                                      }}
                                    />
                                  </TableCell>
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
                              onClick={abrirModalSala}
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
                              onClick={abrirModalDaily}
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

                {/* Pestaña Tarifa Fija - Solo si hay tarifas oficiales */}
                {activeTab === 3 && tarifasOficiales && Object.keys(tarifasOficiales).length > 0 && (
                  <motion.div
                    key="tarifaFija"
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
                          Información de tarifa fija aparecerá aquí después del procesamiento
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
                              Máquinas con Tarifa Oficial
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              🏷️ Máquinas con Tarifa Fija
                            </Typography>
                          </Box>
                        </Box>
                        
                        <TableContainer 
                          component={Paper} 
                          sx={{ 
                            maxHeight: 600,
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
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
                                <TableCell>Serial</TableCell>
                                <TableCell>NUC</TableCell>
                                <TableCell>Derechos Fijos</TableCell>
                                <TableCell>Gastos Fijos</TableCell>
                                <TableCell>Total Impuestos Fijos</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {consolidatedData
                                .filter(row => tarifasOficiales && tarifasOficiales[row.nuc.toString()])
                                .map((row, index) => (
                                  <TableRow key={`tarifa-fija-${row.nuc}-${index}`} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.establecimiento}</TableCell>
                                    <TableCell>{row.serial}</TableCell>
                                    <TableCell>{row.nuc}</TableCell>
                                    <TableCell>{formatCurrency(tarifasOficiales[row.nuc.toString()]?.derechosAdicionales || 0)}</TableCell>
                                    <TableCell>{formatCurrency(tarifasOficiales[row.nuc.toString()]?.gastosAdicionales || 0)}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      {formatCurrency(
                                        (tarifasOficiales[row.nuc.toString()]?.derechosAdicionales || 0) +
                                        (tarifasOficiales[row.nuc.toString()]?.gastosAdicionales || 0)
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        {/* Resumen de tarifa fija */}
                        <Box sx={{ 
                          mt: 3, 
                          p: 3, 
                          background: theme => alpha(theme.palette.secondary.main, 0.08),
                          borderRadius: 2,
                          border: theme => `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            📊 Resumen Tarifa Fija
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="textSecondary">
                                Total Máquinas con Tarifa Fija
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                {consolidatedData.filter(row => tarifasOficiales && tarifasOficiales[row.nuc.toString()]).length}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="textSecondary">
                                Total Derechos Fijos
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                {formatCurrency(
                                  Object.values(tarifasOficiales).reduce((sum, tarifa) => sum + (tarifa.derechosAdicionales || 0), 0)
                                )}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="textSecondary">
                                Total Gastos Fijos
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                {formatCurrency(
                                  Object.values(tarifasOficiales).reduce((sum, tarifa) => sum + (tarifa.gastosAdicionales || 0), 0)
                                )}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
  {/* Modal Exportar por Sala */}
    <ExportarPorSalaModal
      open={showSalaModal}
      onClose={() => setShowSalaModal(false)}
      reporteBySala={reporteBySala}
      consolidatedData={consolidatedData}
      empresa={empresa}
      addLog={addLog}
      addNotification={addNotification}
    />
    
    {/* Modal Reporte Diario */}
    <ReporteDiarioModal
      open={showDailyModal}
      onClose={() => setShowDailyModal(false)}
      consolidatedData={consolidatedData}
      originalData={originalData}
      empresa={empresa}
      addLog={addLog}
      addNotification={addNotification}
    />

    {/* Modal Confirmar Guardado */}
    <ConfirmarGuardadoModal
      open={showConfirmarGuardadoModal}
      onClose={() => setShowConfirmarGuardadoModal(false)}
      onConfirm={confirmarGuardadoLiquidacion}
      periodoDetectado={detectarPeriodoLiquidacion()}
      loading={guardandoLiquidacion}
    />
    </Container>
    </>
  );
};

export default LiquidacionesPage;
