import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Avatar,
  alpha
} from '@mui/material';
// Admin helpers
import { isSystemUser } from '../config/systemUsers';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  Delete,
  Add,
  GetApp,
  DateRange,
  Business,
  Assessment,
  Receipt,
  Timeline,
  MoreVert,
  CloudDownload,
  Archive,
  Restore,
  Close,
  Share as ShareIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import useActivityLogs from '../hooks/useActivityLogs';
import liquidacionPersistenceService from '../services/liquidacionPersistenceService';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import HistoricoPeriodoFilter from '../components/liquidaciones/HistoricoPeriodoFilter';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import ShareToChat from '../components/common/ShareToChat';

const LiquidacionesHistorialPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivityLogs();

  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('todas');
  const [periodoFiltro, setPeriodoFiltro] = useState('thisMonth');
  const [periodoMes, setPeriodoMes] = useState(startOfMonth(new Date()));
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filtros aplicados (los que realmente se usan para consultar Firebase)
  const [appliedFilters, setAppliedFilters] = useState({
    empresa: 'todas',
    periodoFiltro: 'thisMonth',
    periodoMes: startOfMonth(new Date())
  });
  const [filtersApplied, setFiltersApplied] = useState(false); // Bandera para controlar si se han aplicado filtros
  
  // Estados de UI
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [liquidacionToDelete, setLiquidacionToDelete] = useState(null); // Estado específico para eliminación
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [liquidacionToShare, setLiquidacionToShare] = useState(null);

  // Función para cargar usuarios desde Firebase
  const cargarUsuarios = async () => {
    try {
      const usuariosQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      const usuariosData = [];
      
      usuariosSnapshot.forEach((doc) => {
        usuariosData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsuarios(usuariosData);
      console.log('👥 Usuarios cargados:', usuariosData.length);
      return usuariosData;
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      return [];
    }
  };

  // Función para obtener nombre de usuario por email o UID
  const getNombreUsuario = (emailOrUid, usuariosList = usuarios) => {
    // CASO 1: Si no hay emailOrUid, retornar "Usuario desconocido"
    if (!emailOrUid) return 'Usuario desconocido';
    
    // CASO 2: Si no hay usuarios cargados, extraer del email o retornar lo que venga
    if (!usuariosList || usuariosList.length === 0) {
      if (typeof emailOrUid === 'string' && emailOrUid.includes('@')) {
        return emailOrUid.split('@')[0];
      }
      return 'Usuario desconocido';
    }
    
    // CASO 3: Buscar por email primero (insensible a mayúsculas)
    if (typeof emailOrUid === 'string' && emailOrUid.includes('@')) {
      let usuario = usuariosList.find(user => 
        user.email?.toLowerCase() === emailOrUid.toLowerCase()
      );
      if (usuario) {
        return usuario.name || usuario.displayName || emailOrUid.split('@')[0];
      }
    }
    
    // CASO 4: Buscar por UID
    const usuario = usuariosList.find(user => user.uid === emailOrUid);
    if (usuario) {
      return usuario.name || usuario.displayName || usuario.email?.split('@')[0] || 'Usuario desconocido';
    }
    
    // CASO 5: No se encontró el usuario - probablemente fue eliminado
    // Retornar el email o UID parcial para identificación
    if (typeof emailOrUid === 'string') {
      if (emailOrUid.includes('@')) {
        return `${emailOrUid.split('@')[0]} (eliminado)`;
      }
      return `Usuario ${emailOrUid.substring(0, 8)}... (eliminado)`;
    }
    
    return 'Usuario desconocido';
  };

  // Función para cargar empresas desde Firebase
  const cargarEmpresas = async () => {
    try {
      const empresasQuery = query(collection(db, 'companies'), orderBy('name', 'asc'));
      const empresasSnapshot = await getDocs(empresasQuery);
      const empresasData = [];
      
      empresasSnapshot.forEach((doc) => {
        empresasData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setEmpresas(empresasData);
      console.log('🏢 Empresas cargadas:', empresasData.length);
      return empresasData;
    } catch (error) {
      console.error('Error cargando empresas:', error);
      return [];
    }
  };

  // Función para obtener información completa de empresa
  const getEmpresaCompleta = (nombreEmpresa, empresasList = empresas) => {
    if (!nombreEmpresa || !empresasList.length) return null;
    
    // Normalizar el nombre de empresa para búsqueda
    const nombreNormalizado = nombreEmpresa.toLowerCase().trim();
    
    return empresasList.find(empresa => 
      empresa.name?.toLowerCase().trim() === nombreNormalizado ||
      empresa.nit === nombreEmpresa ||
      empresa.name?.toLowerCase().includes(nombreNormalizado.split(' ')[0])
    );
  };

  useEffect(() => {
    // 📊 LOG DE ACTIVIDAD: Página de histórico visitada (SOLO AL MONTAR)
    const logPageView = async () => {
      if (!currentUser?.uid) return;
      
      try {
        await logActivity(
          'historial_liquidaciones_visto',
          'liquidacion',
          'history_page',
          {
            timestamp: new Date().toISOString()
          },
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging history page view:', logError);
      }
    };
    
    logPageView();
    // ✅ Cargar empresas para el filtro (sin cargar liquidaciones)
    cargarEmpresas();
    // ✅ NO CARGAR liquidaciones al iniciar - esperar a que el usuario presione "Aplicar Filtros"
    // cargarHistorial(appliedFilters); // ← Comentado para no cargar automáticamente
  }, []);

  const cargarHistorial = async (filtrosAplicar = appliedFilters) => {
    if (!currentUser?.uid) {
      addNotification('Usuario no autenticado', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Cargando historial con filtros aplicados:', filtrosAplicar);
      
      // Cargar empresas y usuarios primero para obtener los logos y nombres
      const [empresasData, usuariosData] = await Promise.all([
        cargarEmpresas(),
        cargarUsuarios()
      ]);
      
      // Construir filtros para Firebase
      const filtrosFirebase = {};
      
      // Filtro por empresa (enviar a Firebase si no es "todas")
      if (filtrosAplicar.empresa && filtrosAplicar.empresa !== 'todas') {
        filtrosFirebase.empresa = filtrosAplicar.empresa;
      }
      
      // ✅ Filtro por periodo mensual (siempre 1 mes)
      if (filtrosAplicar.periodoMes) {
        filtrosFirebase.startDate = startOfMonth(filtrosAplicar.periodoMes);
        filtrosFirebase.endDate = endOfMonth(filtrosAplicar.periodoMes);
      }
      
      // Cargar liquidaciones desde Firebase CON FILTROS
      // IMPORTANTE: Solo trae de Firebase lo que coincide con los filtros
      const liquidacionesFirebase = await liquidacionPersistenceService.getAllLiquidaciones(
        filtrosFirebase,
        200 // Límite de seguridad
      );

      console.log('📊 Liquidaciones cargadas desde Firebase (todas):', liquidacionesFirebase.length);
      
      if (liquidacionesFirebase.length < 53) {
        console.warn('⚠️ PROBLEMA DETECTADO: Se esperaban al menos 53 liquidaciones pero solo se cargaron', liquidacionesFirebase.length);
        console.warn('⚠️ Verifica el límite en getAllLiquidaciones() o si hay problemas con Firebase');
      }
      
      // Debug: Verificar estructura de liquidaciones
      if (liquidacionesFirebase.length > 0) {
        console.log('🔍 Primera liquidación de ejemplo:', {
          id: liquidacionesFirebase[0].id,
          userId: liquidacionesFirebase[0].userId,
          empresa: liquidacionesFirebase[0].empresa,
          fechas: liquidacionesFirebase[0].fechas
        });
      }

      // Mapear datos de Firebase al formato esperado por la UI
      const liquidacionesMapeadas = liquidacionesFirebase.map((liq, index) => {
        const nombreEmpresa = liq.empresa?.nombre || liq.empresa || 'Sin Empresa';
        const empresaCompleta = getEmpresaCompleta(nombreEmpresa, empresasData);
        const nombreUsuario = getNombreUsuario(liq.userId || liq.processedBy || currentUser.email, usuariosData);
        
        // Debug para la primera liquidación
        if (index === 0) {
          console.log('🔍 Mapeando primera liquidación:', {
            userId: liq.userId,
            nombreUsuario,
            encontrado: usuariosData.some(u => u.uid === liq.userId || u.email === liq.userId)
          });
        }
        
        return {
          id: liq.id,
          fecha: liq.fechas?.createdAt?.toDate() || new Date(liq.fechas?.fechaProcesamiento || Date.now()),
          empresa: nombreEmpresa,
          archivo: liq.archivos?.archivoOriginal?.nombre || 'archivo_liquidacion.xlsx',
          archivoTarifas: liq.archivos?.archivoTarifas?.nombre || null,
          totalMaquinas: liq.metricas?.maquinasConsolidadas || 0,
          totalProduccion: liq.metricas?.totalProduccion || 0,
          totalImpuestos: liq.metricas?.totalImpuestos || 0,
          totalDerechos: liq.metricas?.derechosExplotacion || 0,
          totalGastos: liq.metricas?.gastosAdministracion || 0,
          establecimientos: liq.metricas?.totalEstablecimientos || 0,
          estado: 'completado', // Las liquidaciones guardadas están completas
          procesadoPor: nombreUsuario,
          notas: `Liquidación ${liq.fechas?.mesLiquidacion} ${liq.fechas?.añoLiquidacion}`,
          periodo: liq.fechas?.periodoDetectadoModal || `${liq.fechas?.mesLiquidacion} ${liq.fechas?.añoLiquidacion}`,
          archivosStorage: {
            original: liq.archivos?.archivoOriginal,
            tarifas: liq.archivos?.archivoTarifas
          },
          metadatosCompletos: {
            ...liq, // Guardar metadatos completos para detalles
            empresaCompleta: empresaCompleta // Agregar información completa de empresa
          }
        };
      });

      setLiquidaciones(liquidacionesMapeadas);
      
      console.log('✅ Liquidaciones mapeadas y cargadas:', liquidacionesMapeadas.length);
      console.log('📊 Resumen por usuario procesador:');
      const usuariosProcesadores = liquidacionesMapeadas.reduce((acc, liq) => {
        acc[liq.procesadoPor] = (acc[liq.procesadoPor] || 0) + 1;
        return acc;
      }, {});
      Object.entries(usuariosProcesadores).forEach(([usuario, count]) => {
        console.log(`   - ${usuario}: ${count} liquidaciones`);
      });
      
      // Debug: Contar liquidaciones de Recreativos Tiburón específicamente
      const recreativosTiburon = liquidacionesMapeadas.filter(l => 
        l.empresa.toLowerCase().includes('recreativos') && 
        l.empresa.toLowerCase().includes('tiburón')
      );
      console.log(`🔍 Recreativos Tiburón encontradas: ${recreativosTiburon.length}`);
      if (recreativosTiburon.length < 4) {
        console.warn(`⚠️ PROBLEMA: Se esperaban 4 liquidaciones de Recreativos Tiburón, solo hay ${recreativosTiburon.length}`);
        console.warn('⚠️ Es probable que falten registros de usuarios eliminados');
      }
      recreativosTiburon.forEach(liq => {
        console.log(`   → ${liq.periodo} - Procesado por: ${liq.procesadoPor} - ID: ${liq.id.substring(0, 30)}...`);
      });
      
      if (liquidacionesMapeadas.length === 0) {
        addNotification('No se encontraron liquidaciones guardadas', 'info');
      } else {
        addNotification(`${liquidacionesMapeadas.length} liquidaciones cargadas`, 'success');
      }

    } catch (error) {
      console.error('Error cargando historial:', error);
      
      // Verificar si es error de índice de Firebase
      if (error.message.includes('index') || error.message.includes('índice')) {
        addNotification('⚠️ Creando índice en Firebase. Haz clic en el link de la consola y espera 2-3 minutos.', 'warning', 8000);
      } else {
        addNotification('Error cargando historial de liquidaciones: ' + error.message, 'error');
      }
      
      // Limpiar liquidaciones en caso de error
      setLiquidaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar liquidaciones en el cliente (solo búsqueda por texto)
  // El filtro por empresa ya se aplicó en Firebase
  const liquidacionesFiltradas = liquidaciones.filter(liquidacion => {
    // Solo aplicar búsqueda por texto si hay searchTerm
    if (!searchTerm) return true;
    
    const matchesSearch = liquidacion.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         liquidacion.archivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (liquidacion.procesadoPor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         liquidacion.periodo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Debug: Ver resultado del filtrado
  if (liquidaciones.length > 0) {
    console.log('🔍 Estado del filtro:');
    console.log(`   - Total liquidaciones: ${liquidaciones.length}`);
    console.log(`   - Filtro empresa: "${filterEmpresa}"`);
    console.log(`   - Búsqueda: "${searchTerm}"`);
    console.log(`   - Liquidaciones filtradas: ${liquidacionesFiltradas.length}`);
    
    if (liquidacionesFiltradas.length === 0 && liquidaciones.length > 0) {
      console.error('⚠️ PROBLEMA: Hay liquidaciones pero el filtro las está ocultando todas');
      console.log('🔍 Verificando primera liquidación:', liquidaciones[0]);
      console.log('🔍 filterEmpresa === "todas":', filterEmpresa === 'todas');
    }
  }

  // Paginación
  const totalPages = Math.ceil(liquidacionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const liquidacionesPaginadas = liquidacionesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Debug: Ver paginación
  if (liquidaciones.length > 0) {
    console.log('📄 Paginación:');
    console.log(`   - Página actual: ${currentPage}`);
    console.log(`   - Items por página: ${itemsPerPage}`);
    console.log(`   - Total páginas: ${totalPages}`);
    console.log(`   - Start index: ${startIndex}`);
    console.log(`   - liquidacionesPaginadas.length: ${liquidacionesPaginadas.length}`);
    
    if (liquidacionesPaginadas.length > 0) {
      console.log('✅ Primera liquidación paginada:', liquidacionesPaginadas[0]);
    } else {
      console.error('❌ PROBLEMA: liquidacionesPaginadas está vacío');
    }
  }

  // Obtener empresas únicas para el filtro desde el estado de empresas cargadas
  // (No desde liquidaciones porque al inicio está vacío hasta aplicar filtros)
  const empresasUnicas = empresas.map(e => e.name).sort();
  
  // Debug: Ver empresas únicas detectadas
  if (empresasUnicas.length > 0) {
    console.log('🏢 Empresas disponibles en filtro:', empresasUnicas.length);
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Obtener color del estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'completado': return 'success';
      case 'procesando': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'completado': return '✅';
      case 'procesando': return '⏳';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  // Manejar menú de acciones
  const handleMenuClick = (event, liquidacion) => {
    setAnchorEl(event.currentTarget);
    setSelectedLiquidacion(liquidacion);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLiquidacion(null);
  };

  // Cargar liquidación en el procesador
  const cargarLiquidacionEnProcesador = async () => {
    if (!selectedLiquidacion) return;
    
    // Navegar a la página de liquidaciones con el ID de la liquidación a cargar
    const liquidacionId = selectedLiquidacion.id;
    addNotification(`Cargando liquidación ${selectedLiquidacion.periodo}...`, 'info');
    
    // 📂 LOG DE ACTIVIDAD: Liquidación cargada desde histórico
    try {
      await logActivity(
        'liquidacion_cargada_desde_historial',
        'liquidacion',
        liquidacionId,
        {
          empresa: selectedLiquidacion.empresa || 'Sin empresa',
          periodo: selectedLiquidacion.periodoLiquidacion || 'Sin período',
          archivo: selectedLiquidacion.archivo || null,
          fechaProcesamiento: selectedLiquidacion.fechaProcesamiento || null
        },
        currentUser.uid,
        userProfile?.name || currentUser.displayName || 'Usuario desconocido',
        currentUser.email
      );
    } catch (logError) {
      console.error('Error logging liquidacion load:', logError);
    }
    
    // Redirigir a la página de liquidaciones con parámetro para cargar
    navigate(`/liquidaciones?cargar=${liquidacionId}`);
    handleMenuClose();
  };

  // Ver detalle
  const verDetalle = () => {
    console.log('🔍 Abriendo modal de detalle para:', selectedLiquidacion);
    setShowDetailDialog(true);
    // NO llamar handleMenuClose() aquí para mantener selectedLiquidacion
    setAnchorEl(null); // Solo cerrar el menú, pero mantener la selección
  };

  // Handlers para Share to Chat
  const handleShareLiquidacion = () => {
    setLiquidacionToShare(selectedLiquidacion);
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setLiquidacionToShare(null);
  };

  // Cerrar modal de detalle
  const cerrarModalDetalle = () => {
    setShowDetailDialog(false);
    setSelectedLiquidacion(null); // Limpiar selección al cerrar
  };

  // Descargar liquidación
  const abrirDialogoDescarga = () => {
    console.log('🔍 Abriendo modal de descarga para:', selectedLiquidacion);
    setShowDownloadDialog(true);
    setAnchorEl(null); // Solo cerrar el menú, pero mantener la selección
  };

  // Cerrar modal de descarga
  const cerrarModalDescarga = () => {
    setShowDownloadDialog(false);
    setSelectedLiquidacion(null); // Limpiar selección al cerrar
  };

  const descargarLiquidacion = () => {
    abrirDialogoDescarga();
  };

  const descargarArchivoEspecifico = async (tipoArchivo) => {
    const archivoInfo = tipoArchivo === 'original' 
      ? selectedLiquidacion?.archivosStorage?.original 
      : selectedLiquidacion?.archivosStorage?.tarifas;
      
    const nombreArchivo = tipoArchivo === 'original' 
      ? selectedLiquidacion?.archivo 
      : selectedLiquidacion?.archivoTarifas;

    if (!archivoInfo) {
      addNotification(`No hay archivo ${tipoArchivo} disponible para descargar`, 'warning');
      return;
    }

    try {
      addNotification(`Descargando ${nombreArchivo}...`, 'info');
      
      let filePath = archivoInfo.path;
      const fileUrl = archivoInfo.url;
      
      if (!filePath || filePath.trim() === '') {
        if (fileUrl) {
          const match = fileUrl.match(/\/o\/(.+?)\?/);
          if (match) {
            filePath = decodeURIComponent(match[1]);
          }
        }
      }
      
      if (!filePath || filePath.trim() === '') {
        throw new Error(`No se pudo determinar la ruta del archivo ${tipoArchivo}`);
      }
      
      const fileRef = ref(storage, filePath);
      const downloadUrl = await getDownloadURL(fileRef);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = nombreArchivo;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      addNotification(`Archivo ${tipoArchivo} descargado correctamente`, 'success');
      
      // 📥 LOG DE ACTIVIDAD: Archivo descargado del histórico
      try {
        await logActivity(
          'archivo_liquidacion_descargado',
          'liquidacion',
          selectedLiquidacion?.id || 'unknown',
          {
            empresa: selectedLiquidacion?.empresa || 'Sin empresa',
            periodo: selectedLiquidacion?.periodoLiquidacion || 'Sin período',
            tipoArchivo: tipoArchivo || 'desconocido',
            nombreArchivo: nombreArchivo || 'sin-nombre'
          },
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging file download:', logError);
      }
      
    } catch (error) {
      console.error(`Error descargando archivo ${tipoArchivo}:`, error);
      addNotification(`Error al descargar archivo ${tipoArchivo}: ` + error.message, 'error');
    }
  };

  const descargarTodosLosArchivos = async () => {
    const archivosDisponibles = [];
    
    if (selectedLiquidacion?.archivosStorage?.original) {
      archivosDisponibles.push('original');
    }
    
    if (selectedLiquidacion?.archivosStorage?.tarifas) {
      archivosDisponibles.push('tarifas');
    }
    
    if (archivosDisponibles.length === 0) {
      addNotification('No hay archivos disponibles para descargar', 'warning');
      return;
    }
    
    addNotification(`Descargando ${archivosDisponibles.length} archivo(s)...`, 'info');
    
    for (let i = 0; i < archivosDisponibles.length; i++) {
      await descargarArchivoEspecifico(archivosDisponibles[i]);
      if (i < archivosDisponibles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    cerrarModalDescarga();
  };
  const eliminarLiquidacion = () => {
    setLiquidacionToDelete(selectedLiquidacion); // Guardar en estado específico
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const confirmarEliminacion = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🗑️ CLICK DETECTADO - Iniciando eliminación...');
    console.log('📋 Estado selectedLiquidacion:', selectedLiquidacion);
    console.log('📋 Estado liquidacionToDelete:', liquidacionToDelete);
    
    if (!liquidacionToDelete) {
      console.log('❌ No hay liquidación para eliminar en liquidacionToDelete');
      addNotification('No hay liquidación seleccionada', 'error');
      return;
    }
    
    if (!currentUser?.uid) {
      console.log('❌ No hay usuario autenticado');
      addNotification('Usuario no autenticado', 'error');
      return;
    }
    
    try {
      // 🔑 Verificar si el usuario es ADMIN o SUPER_ADMIN (case-insensitive) o pertenece a SYSTEM_USERS
      const normalizedRole = (userProfile?.role || '').toString().trim().toUpperCase();
      const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || isSystemUser(currentUser?.email);
      console.log('� [UI] Usuario es admin?', isAdmin, '- Role:', userProfile?.role, '- Email:', currentUser?.email);

      console.log('�🔄 [UI] Eliminando liquidación:', {
        liquidacionId: liquidacionToDelete.id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        isAdmin,
        liquidacionData: {
          empresa: liquidacionToDelete.empresa,
          periodo: liquidacionToDelete.periodoLiquidacion,
          archivo: liquidacionToDelete.archivo
        }
      });
      
      // 🔒 VALIDACIÓN ADICIONAL DE SEGURIDAD
      if (!liquidacionToDelete.id || !currentUser.uid) {
        throw new Error('Datos de eliminación incompletos');
      }
      
      await liquidacionPersistenceService.deleteLiquidacion(
        liquidacionToDelete.id, 
        currentUser.uid,
        isAdmin // Pasar flag de admin al servicio
      );
      
      console.log('✅ Liquidación eliminada exitosamente');
      
      // 🗑️ LOG DE ACTIVIDAD: Liquidación eliminada
      try {
        await logActivity(
          'liquidacion_eliminada',
          'liquidacion',
          liquidacionToDelete.id,
          {
            empresa: liquidacionToDelete.empresa || 'Sin empresa',
            periodo: liquidacionToDelete.periodoLiquidacion || 'Sin período',
            archivo: liquidacionToDelete.archivo || null,
            fechaProcesamiento: liquidacionToDelete.fechaProcesamiento || null
          },
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging liquidacion deletion:', logError);
      }
      
      // Actualizar la lista local
      setLiquidaciones(prev => prev.filter(l => l.id !== liquidacionToDelete.id));
      addNotification('Liquidación eliminada correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error eliminando liquidación:', error);
      addNotification('Error al eliminar liquidación: ' + error.message, 'error');
    } finally {
      console.log('🔄 Cerrando modal y limpiando selección');
      setShowDeleteDialog(false);
      setSelectedLiquidacion(null);
      setLiquidacionToDelete(null); // Limpiar estado específico
    }
  };

  // Detectar si hay filtros activos (para mostrar botón de limpiar)
  const hasActiveFilters = searchTerm || filterEmpresa !== 'todas' || periodoFiltro !== 'thisMonth';
  
  // Detectar si se debe mostrar la tabla (solo si se aplicaron filtros Y hay liquidaciones)
  const shouldShowTable = filtersApplied && liquidaciones.length > 0;

  // Funciones wrapper para resetear página al cambiar filtros
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 📅 Handlers para filtro mensual
  const handlePeriodoFiltroChange = (value) => {
    console.log('📅 Filtro de periodo seleccionado:', value);
    setPeriodoFiltro(value);

    if (value === 'thisMonth') {
      setPeriodoMes(startOfMonth(new Date()));
    } else if (value === 'lastMonth') {
      setPeriodoMes(startOfMonth(subMonths(new Date(), 1)));
    }
    // NO recargar automáticamente - esperar a que presione "Aplicar Filtros"
  };

  const handlePeriodoMesChange = (monthDate) => {
    setPeriodoMes(startOfMonth(monthDate));
    // NO recargar automáticamente - esperar a que presione "Aplicar Filtros"
  };

  const handleEmpresaChange = (value) => {
    console.log('🔍 Filtro de empresa seleccionado:', value);
    setFilterEmpresa(value);
    // NO recargar automáticamente - esperar a que presione "Aplicar Filtros"
  };
  
  // Aplicar filtros seleccionados
  const aplicarFiltros = () => {
    console.log('✅ Aplicando filtros:', { 
      empresa: filterEmpresa, 
      periodoFiltro,
      periodoMes
    });
    const nuevosFiltros = {
      empresa: filterEmpresa,
      periodoFiltro,
      periodoMes
    };
    setAppliedFilters(nuevosFiltros);
    setFiltersApplied(true); // ✅ Marcar que se aplicaron filtros
    setCurrentPage(1);
    cargarHistorial(nuevosFiltros);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    console.log('🧹 Limpiando filtros - tabla quedará vacía hasta aplicar filtros');
    setSearchTerm('');
    setFilterEmpresa('todas');
    setPeriodoFiltro('thisMonth');
    setPeriodoMes(startOfMonth(new Date()));
    const filtrosLimpios = { 
      empresa: 'todas',
      periodoFiltro: 'thisMonth',
      periodoMes: startOfMonth(new Date())
    };
    setAppliedFilters(filtrosLimpios);
    setFiltersApplied(false); // ✅ Marcar que NO hay filtros aplicados - tabla queda vacía
    setLiquidaciones([]); // ✅ Limpiar la tabla inmediatamente
    setCurrentPage(1);
    // NO llamar cargarHistorial() - esperar a que el usuario aplique filtros nuevamente
  };

  // Detectar si hay cambios sin aplicar
  const hasUnappliedFilters = 
    filterEmpresa !== appliedFilters.empresa ||
    periodoFiltro !== appliedFilters.periodoFiltro ||
    periodoMes?.getTime?.() !== appliedFilters.periodoMes?.getTime?.();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Sobrio Simplificado */}
      <Paper sx={{
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        borderRadius: 0.6,
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
            LIQUIDACIONES • GESTIÓN
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 700, 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            Histórico de Liquidaciones
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Consulta y gestiona el historial completo de liquidaciones procesadas
          </Typography>
        </Box>
      </Paper>

      {/* Panel de Filtros Premium */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          borderRadius: 1,
          p: 3,
          mb: 4,
          position: 'relative',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.8)
          }
        }}
      >
        <Box>
          {/* Header Premium */}
          <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
            <Box display="flex" alignItems="center">
              <FilterList 
                sx={{ 
                  mr: 2, 
                  color: 'primary.main',
                  fontSize: 28
                }} 
              />
              <Box>
                <Typography 
                  variant="h5" 
                  color="primary.main"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Filtros de Liquidaciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refina tu búsqueda de liquidaciones históricas
                </Typography>
              </Box>
            </Box>
            
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            {/* Búsqueda por texto */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar liquidaciones"
                placeholder="Empresa, archivo, usuario..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0.6,
                    backgroundColor: theme.palette.background.paper,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleSearchChange('')}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: 'error.main' }
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Filtro por empresa */}
            <Grid item xs={12} md={4}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0.6,
                    backgroundColor: theme.palette.background.paper,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
              >
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={filterEmpresa}
                  label="Empresa"
                  onChange={(e) => handleEmpresaChange(e.target.value)}
                >
                  <MenuItem value="todas">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      Todas las empresas
                    </Box>
                  </MenuItem>
                  {empresasUnicas.map(empresa => (
                    <MenuItem key={empresa} value={empresa}>{empresa}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 📅 Filtro por periodo (mensual) */}
            <Grid item xs={12} md={4}>
              <HistoricoPeriodoFilter
                value={periodoFiltro}
                monthDate={periodoMes}
                onChange={handlePeriodoFiltroChange}
                onMonthChange={handlePeriodoMesChange}
              />
            </Grid>
          </Grid>

          {/* Chips de filtros activos */}
          {hasActiveFilters && filtersApplied && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Box mt={3} pt={2} borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Filtros activos:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {searchTerm && (
                    <Chip
                      label={`Búsqueda: "${searchTerm}"`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => handleSearchChange('')}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                  {filterEmpresa !== 'todas' && (
                    <Chip
                      label={`Empresa: ${filterEmpresa}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      onDelete={() => handleEmpresaChange('todas')}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                  {periodoFiltro !== 'thisMonth' && (
                    <Chip
                      label={`Período: ${periodoMes?.toLocaleDateString?.('es-CO', { month: 'long', year: 'numeric' }) || '—'}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onDelete={() => {
                        handlePeriodoFiltroChange('thisMonth');
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                </Box>
              </Box>
            </motion.div>
          )}

          {/* ✅ BOTONES DE ACCIÓN PARA FILTROS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: 2,
              mt: 3,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                onClick={aplicarFiltros}
                disabled={!hasUnappliedFilters && filtersApplied}
                sx={{
                  minWidth: 160,
                  py: 1.5,
                  px: 3,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  background: hasUnappliedFilters || !filtersApplied 
                    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    : theme.palette.action.disabled,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    background: hasUnappliedFilters || !filtersApplied 
                      ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                      : theme.palette.action.disabled,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                  }
                }}
              >
                {filtersApplied && !hasUnappliedFilters ? 'Filtros Aplicados' : 'Aplicar Filtros'}
              </Button>
              {hasActiveFilters && filtersApplied && (
                <Button
                  variant="outlined"
                  startIcon={<Close />}
                  onClick={limpiarFiltros}
                  sx={{
                    minWidth: 140,
                    py: 1.5,
                    px: 3,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: alpha(theme.palette.error.main, 0.5),
                    color: theme.palette.error.main,
                    backgroundColor: alpha(theme.palette.error.main, 0.05),
                    '&:hover': {
                      borderColor: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Limpiar Filtros
                </Button>
              )}
            </Box>
          </motion.div>
        </Box>
      </Paper>

      {/* Estadísticas rápidas - Sistema de Diseño Sobrio */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 0.6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <Receipt sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.primary.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main,
              mb: 0.5
            }}>
              {liquidaciones.length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Total Liquidaciones
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 0.6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <Assessment sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.primary.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.success.main,
              mb: 0.5
            }}>
              {liquidaciones.filter(l => l.estado === 'completado').length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Completadas
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 0.6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <Timeline sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.primary.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.warning.main,
              mb: 0.5
            }}>
              {liquidaciones.filter(l => l.estado === 'procesando').length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              En Proceso
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 0.6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <Business sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.primary.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.error.main,
              mb: 0.5
            }}>
              {empresasUnicas.length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Empresas Activas
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Liquidaciones Sobrio */}
      <Card sx={{ 
        borderRadius: 0.6,
        border: `2px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.8),
          boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.25)}`
        },
        transition: 'all 0.2s ease'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Assessment sx={{ fontSize: 20, color: 'success.main' }} />
              Liquidaciones ({liquidacionesFiltradas.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                href="/liquidaciones"
                sx={{ 
                  borderRadius: 0.6,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Nueva Liquidación
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Cargando historial...</Typography>
            </Box>
          ) : !filtersApplied ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FilterList sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 3, opacity: 0.6 }} />
              <Typography variant="h5" color="textSecondary" gutterBottom>
                Selecciona los filtros y presiona "Aplicar Filtros"
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                Elige empresa y/o período para visualizar las liquidaciones.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                💡 Los datos se cargarán solo cuando apliques los filtros seleccionados.
              </Typography>
            </Box>
          ) : !shouldShowTable ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Receipt sx={{ fontSize: 80, color: theme.palette.grey[400], mb: 3 }} />
              <Typography variant="h5" color="textSecondary" gutterBottom>
                No hay liquidaciones con los filtros aplicados
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                Intenta con otros filtros o crea una nueva liquidación.
              </Typography>
            </Box>
          ) : liquidacionesPaginadas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Receipt sx={{ fontSize: 60, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No se encontraron liquidaciones con los filtros aplicados
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Intenta ajustar los filtros de búsqueda o empresa para encontrar liquidaciones.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              {/* Información de resultados */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Mostrando {liquidacionesPaginadas.length} de {liquidacionesFiltradas.length} liquidaciones
                  {liquidacionesFiltradas.length !== liquidaciones.length && 
                    ` (filtrado de ${liquidaciones.length} total)`
                  }
                </Typography>
                {totalPages > 1 && (
                  <Typography variant="body2" color="textSecondary">
                    Página {currentPage} de {totalPages}
                  </Typography>
                )}
              </Box>

              <TableContainer component={Paper} sx={{ 
                borderRadius: 0.6,
                border: 'none',
                boxShadow: 'none',
                backgroundColor: 'transparent'
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      backgroundColor: alpha(theme.palette.grey[50], 0.5)
                    }}>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Período</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Empresa</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Archivo</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Máquinas</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Producción</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Total Impuestos</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {liquidacionesPaginadas.map((liquidacion) => (
                      <TableRow 
                        key={liquidacion.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.02)
                          },
                          '&:nth-of-type(even)': {
                            backgroundColor: alpha(theme.palette.grey[50], 0.4),
                          }
                        }}
                      >
                        <TableCell>
                          {liquidacion.fecha.toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DateRange sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {liquidacion.periodo || 'No detectado'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Business sx={{ mr: 1, fontSize: 16 }} />
                            {liquidacion.empresa}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {liquidacion.archivo}
                            </Typography>
                            {liquidacion.archivoTarifas && (
                              <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                                + {liquidacion.archivoTarifas}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${liquidacion.totalMaquinas} máquinas`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(liquidacion.totalProduccion)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            {formatCurrency(liquidacion.totalImpuestos)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${getStatusIcon(liquidacion.estado)} ${liquidacion.estado}`}
                            color={getStatusColor(liquidacion.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, liquidacion)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Menú de Acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={verDetalle}>
          <Visibility sx={{ mr: 1 }} /> Ver Detalle
        </MenuItem>
        <MenuItem onClick={cargarLiquidacionEnProcesador}>
          <Restore sx={{ mr: 1 }} /> Cargar para Procesar
        </MenuItem>
        <MenuItem onClick={descargarLiquidacion}>
          <CloudDownload sx={{ mr: 1 }} /> Descargar
        </MenuItem>
        <MenuItem onClick={handleShareLiquidacion}>
          <ShareIcon sx={{ mr: 1 }} /> Compartir en chat
        </MenuItem>
        <MenuItem onClick={eliminarLiquidacion} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>

      {/* Dialog Detalle - Sistema de Diseño Empresarial */}
      <Dialog 
        open={showDetailDialog} 
        onClose={cerrarModalDetalle}
        maxWidth="md"
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
          p: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              width: 40,
              height: 40
            }}>
              <Visibility />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Detalle de Liquidación
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={cerrarModalDetalle}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: 'error.main'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          {selectedLiquidacion ? (
            <Box sx={{ mt: 2 }}>
              {/* Header de la liquidación */}
              <Paper sx={{
                p: 3,
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {/* Avatar con logo real de la empresa o inicial */}
                  {selectedLiquidacion.metadatosCompletos?.empresaCompleta?.logoURL ? (
                    <Avatar
                      src={selectedLiquidacion.metadatosCompletos.empresaCompleta.logoURL}
                      alt={`Logo de ${selectedLiquidacion.empresa}`}
                      sx={{
                        width: 56,
                        height: 56,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      width: 56,
                      height: 56,
                      fontSize: '1.5rem',
                      fontWeight: 700
                    }}>
                      {(selectedLiquidacion.empresa || 'SE').charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  <Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      color: 'primary.main',
                      mb: 0,
                      fontSize: '1.75rem'
                    }}>
                      {selectedLiquidacion.empresa || 'Sin Empresa'}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h5" sx={{ 
                  fontWeight: 700,
                  mb: 2
                }}>
                  Periodo liquidado: {selectedLiquidacion.periodo || selectedLiquidacion.metadatosCompletos?.fechas?.periodoDetectadoModal || 'Periodo no detectado'}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                  Procesado el {selectedLiquidacion.fecha?.toLocaleDateString?.('es-CO') || 
                                selectedLiquidacion.metadatosCompletos?.fechas?.createdAt?.toDate()?.toLocaleDateString?.('es-CO') || 
                                'Fecha no disponible'} por {selectedLiquidacion.procesadoPor || 'Usuario desconocido'}
                </Typography>
              </Paper>

              {/* Métricas principales - Primera fila */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.warning.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Establecimientos
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'warning.main' 
                    }}>
                      {selectedLiquidacion.establecimientos || 
                       selectedLiquidacion.metadatosCompletos?.metricas?.totalEstablecimientos || 
                       0}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.info.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Total Máquinas
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'info.main' 
                    }}>
                      {selectedLiquidacion.totalMaquinas || 
                       selectedLiquidacion.metadatosCompletos?.metricas?.maquinasConsolidadas || 
                       0}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.success.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Producción Total
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'success.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalProduccion || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.totalProduccion || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Segunda fila */}
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Derechos de Explotación
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'secondary.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalDerechos || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.derechosExplotacion || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.error.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Gastos de Administración
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'error.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalGastos || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.gastosAdministracion || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Tercera fila - Total Impuestos centrado */}
              <Grid container spacing={3} sx={{ mt: 2 }} justifyContent="center">
                <Grid item xs={12} sm={8} md={6}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Total Impuestos
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'primary.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalImpuestos || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.totalImpuestos || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No hay datos de liquidación
              </Typography>
              <Typography variant="body2" color="textSecondary">
                No se pudo cargar la información de la liquidación seleccionada
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={cerrarModalDetalle}
            variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 120
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmación Eliminación - Sistema de Diseño Empresarial */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{
          p: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: 'error.main',
            width: 40,
            height: 40
          }}>
            <Delete />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Confirmar Eliminación
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Esta acción no se puede deshacer
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Box sx={{ mt: 3 }}>
            <Paper sx={{
              p: 3,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
              backgroundColor: alpha(theme.palette.warning.main, 0.05)
            }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ¿Está seguro que desea eliminar la liquidación de{' '}
                <Typography component="span" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {liquidacionToDelete?.empresa}
                </Typography>
                ?
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Se eliminarán permanentemente:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <Typography component="li" variant="body2" color="textSecondary">
                  • Todos los archivos originales en Storage
                </Typography>
                <Typography component="li" variant="body2" color="textSecondary">
                  • Metadatos y métricas en Firestore
                </Typography>
                <Typography component="li" variant="body2" color="textSecondary">
                  • Historial de procesamiento
                </Typography>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => {
              setShowDeleteDialog(false);
              setLiquidacionToDelete(null);
            }}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={(e) => {
              console.log('🖱️ CLICK EN BOTÓN ELIMINAR DETECTADO!');
              confirmarEliminacion(e);
            }}
            color="error"
            variant="contained"
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Eliminar Permanentemente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Descarga de Archivos - Sistema de Diseño Empresarial */}
      <Dialog
        open={showDownloadDialog}
        onClose={cerrarModalDescarga}
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
          p: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            width: 40,
            height: 40
          }}>
            <CloudDownload />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Descargar Archivos
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Selecciona qué archivos descargar
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 3 }}>
          {selectedLiquidacion && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Archivos disponibles para{' '}
                <Typography component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {selectedLiquidacion.empresa}
                </Typography>
                {' - '}{selectedLiquidacion.periodo}:
              </Typography>
              
              <Grid container spacing={2}>
                {/* Archivo Original */}
                {selectedLiquidacion.archivosStorage?.original && (
                  <Grid item xs={12}>
                    <Paper sx={{
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          width: 32,
                          height: 32
                        }}>
                          📊
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Archivo Original
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {selectedLiquidacion.archivo}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={() => {
                          descargarArchivoEspecifico('original');
                          cerrarModalDescarga();
                        }}
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Descargar
                      </Button>
                    </Paper>
                  </Grid>
                )}
                
                {/* Archivo de Tarifas */}
                {selectedLiquidacion.archivosStorage?.tarifas && (
                  <Grid item xs={12}>
                    <Paper sx={{
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'secondary.main',
                          width: 32,
                          height: 32
                        }}>
                          💰
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Archivo de Tarifas
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {selectedLiquidacion.archivoTarifas}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={() => {
                          descargarArchivoEspecifico('tarifas');
                          cerrarModalDescarga();
                        }}
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Descargar
                      </Button>
                    </Paper>
                  </Grid>
                )}
              </Grid>
              
              {/* Información adicional */}
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💡 Los archivos se descargarán directamente desde Firebase Storage
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={cerrarModalDescarga}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          
          {/* Botón para descargar todos si hay múltiples archivos */}
          {selectedLiquidacion?.archivosStorage?.original && selectedLiquidacion?.archivosStorage?.tarifas && (
            <Button 
              onClick={descargarTodosLosArchivos}
              variant="contained"
              startIcon={<GetApp />}
              sx={{ 
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Descargar Todos
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog para compartir al chat */}
      <ShareToChat
        open={shareDialogOpen}
        onClose={handleCloseShareDialog}
        entity={liquidacionToShare}
        entityType="liquidacion"
        entityName="liquidación"
      />
    </Container>
  );
};

export default LiquidacionesHistorialPage;
