import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Container,
  Card,
  CardContent,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Assignment as CommitmentIcon,
  Business as CompanyIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Description as PageIcon,
  TrendingUp as KPIIcon,
  Visibility as ViewIcon,
  Visibility as VisibilityIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
  CalendarToday,
  AttachMoney,
  CheckCircle,
  Warning,
  Schedule,
  Email as EmailIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GlobalSearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  
  const [results, setResults] = useState({
    commitments: [],
    companies: [],
    payments: [],
    users: [],
    pages: []
  });
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Estados para el modal de vista de compromiso
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Estados para el modal de vista de empresa
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyViewDialogOpen, setCompanyViewDialogOpen] = useState(false);

  // Estados para paginación
  const [pagination, setPagination] = useState({
    commitments: { page: 0, rowsPerPage: 5 },
    companies: { page: 0, rowsPerPage: 5 },
    payments: { page: 0, rowsPerPage: 5 },
    users: { page: 0, rowsPerPage: 5 },
    pages: { page: 0, rowsPerPage: 5 }
  });

  // 🔍 Función para realizar búsqueda global
  const performGlobalSearch = async (term) => {
    if (!term || term.length < 2) {
      setResults({ commitments: [], companies: [], payments: [], users: [], pages: [] });
      setTotalResults(0);
      return;
    }

    setLoading(true);
    try {
      const searchResults = {
        commitments: [],
        companies: [],
        payments: [],
        users: [],
        pages: []
      };
      
      const searchLower = term.toLowerCase();

      // Buscar en compromisos
      const commitmentsQuery = query(collection(db, 'commitments'), limit(20));
      const commitmentsSnapshot = await getDocs(commitmentsQuery);
      
      commitmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.concept && data.concept.toLowerCase().includes(searchLower)) ||
          (data.beneficiary && data.beneficiary.toLowerCase().includes(searchLower)) ||
          (data.companyName && data.companyName.toLowerCase().includes(searchLower)) ||
          (data.description && data.description.toLowerCase().includes(searchLower))
        ) {
          searchResults.commitments.push({ id: doc.id, ...data });
        }
      });

      // Buscar en empresas
      const companiesQuery = query(collection(db, 'companies'), limit(15));
      const companiesSnapshot = await getDocs(companiesQuery);
      
      companiesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.name && data.name.toLowerCase().includes(searchLower)) ||
          (data.nit && data.nit.toLowerCase().includes(searchLower)) ||
          (data.description && data.description.toLowerCase().includes(searchLower))
        ) {
          searchResults.companies.push({ id: doc.id, ...data });
        }
      });

      // Buscar en pagos
      const paymentsQuery = query(collection(db, 'payments'), limit(15));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      paymentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.concept && data.concept.toLowerCase().includes(searchLower)) ||
          (data.beneficiary && data.beneficiary.toLowerCase().includes(searchLower)) ||
          (data.companyName && data.companyName.toLowerCase().includes(searchLower))
        ) {
          searchResults.payments.push({ id: doc.id, ...data });
        }
      });

      // Buscar en usuarios
      const usersQuery = query(collection(db, 'users'), limit(10));
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.displayName && data.displayName.toLowerCase().includes(searchLower)) ||
          (data.email && data.email.toLowerCase().includes(searchLower))
        ) {
          searchResults.users.push({ id: doc.id, ...data });
        }
      });

      // Páginas del sistema
      const systemPages = [
        { name: 'Dashboard Principal', path: '/', keywords: ['dashboard', 'inicio', 'principal', 'resumen'], icon: KPIIcon },
        { name: 'Compromisos', path: '/commitments', keywords: ['compromiso', 'obligacion', 'pago', 'deuda'], icon: CommitmentIcon },
        { name: 'Pagos', path: '/payments', keywords: ['pago', 'abono', 'transferencia', 'consignacion'], icon: PaymentIcon },
        { name: 'Empresas', path: '/companies', keywords: ['empresa', 'compania', 'negocio'], icon: CompanyIcon },
        { name: 'Usuarios', path: '/users', keywords: ['usuario', 'persona', 'empleado'], icon: PersonIcon },
        { name: 'Reportes', path: '/reports', keywords: ['reporte', 'informe', 'estadistica'], icon: PageIcon },
        { name: 'Centro de Alertas', path: '/alerts-center', keywords: ['alerta', 'notificacion', 'aviso'], icon: PageIcon },
        { name: 'KPIs Financieros', path: '/financial-kpis', keywords: ['kpi', 'indicador', 'metrica', 'financiero'], icon: KPIIcon },
        { name: 'Dashboard Ejecutivo', path: '/executive-dashboard', keywords: ['ejecutivo', 'gerencia', 'directivo'], icon: KPIIcon },
        { name: 'Compromisos Vencidos', path: '/due-commitments', keywords: ['vencido', 'atrasado', 'moroso'], icon: CommitmentIcon }
      ];

      systemPages.forEach(page => {
        const pageNameMatch = page.name.toLowerCase().includes(searchLower);
        const keywordMatch = page.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchLower) || 
          searchLower.includes(keyword.toLowerCase())
        );
        
        if (pageNameMatch || keywordMatch) {
          searchResults.pages.push(page);
        }
      });

      setResults(searchResults);
      const total = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);
      setTotalResults(total);
      
    } catch (error) {
      console.error('Error in global search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar el modal de vista de compromiso
  const handleViewCommitment = (commitment) => {
    setSelectedCommitment(commitment);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedCommitment(null);
  };

  // Funciones para manejar el modal de vista de empresa
  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setCompanyViewDialogOpen(true);
  };

  const handleCloseCompanyViewDialog = () => {
    setCompanyViewDialogOpen(false);
    setSelectedCompany(null);
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función segura para convertir fechas
  const safeToDate = (dateValue) => {
    if (!dateValue) return null;
    
    // Si ya es un objeto Date
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // Si es un Timestamp de Firebase
    if (dateValue && typeof dateValue.toDate === 'function') {
      try {
        return dateValue.toDate();
      } catch (error) {
        console.warn('Error converting Firebase timestamp:', error);
        return null;
      }
    }
    
    // Si es un objeto con seconds (Firebase timestamp serializado)
    if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
      try {
        return new Date(dateValue.seconds * 1000);
      } catch (error) {
        console.warn('Error converting timestamp object:', error);
        return null;
      }
    }
    
    // Si es un string o number
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn('Error parsing date:', error);
      return null;
    }
  };

  // Función segura para formatear fechas
  const safeFormatDate = (dateValue, formatString = "dd 'de' MMMM 'de' yyyy") => {
    const date = safeToDate(dateValue);
    if (!date) return 'Fecha no válida';
    
    try {
      return format(date, formatString, { locale: es });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Fecha no válida';
    }
  };

  // Función para obtener información de estado
  const getStatusInfo = (commitment) => {
    const today = new Date();
    const dueDate = safeToDate(commitment.dueDate);
    
    if (!dueDate) {
      return {
        label: 'Sin fecha',
        color: theme.palette.grey.main,
        chipColor: 'default',
        icon: <CalendarToday />
      };
    }
    
    if (commitment.paid || commitment.isPaid) {
      return {
        label: 'Pagado',
        color: theme.palette.success.main,
        chipColor: 'success',
        icon: <CheckCircle />
      };
    }

    if (dueDate < today) {
      return {
        label: 'Vencido',
        color: theme.palette.error.main,
        chipColor: 'error',
        icon: <Warning />
      };
    }

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    if (dueDate < threeDaysFromNow) {
      return {
        label: 'Próximo',
        color: theme.palette.warning.main,
        chipColor: 'warning',
        icon: <Schedule />
      };
    }

    return {
      label: 'Pendiente',
      color: theme.palette.info.main,
      chipColor: 'info',
      icon: <CalendarToday />
    };
  };

  // Funciones para manejar paginación
  const handleChangePage = (section, newPage) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage }
    }));
  };

  const handleChangeRowsPerPage = (section, newRowsPerPage) => {
    setPagination(prev => ({
      ...prev,
      [section]: { page: 0, rowsPerPage: parseInt(newRowsPerPage, 10) }
    }));
  };

  const getPaginatedData = (data, section) => {
    const { page, rowsPerPage } = pagination[section];
    return data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  };

  useEffect(() => {
    if (searchTerm) {
      performGlobalSearch(searchTerm);
    }
  }, [searchTerm]);

  const handleResultClick = (type, item) => {
    switch (type) {
      case 'commitment':
        navigate(`/commitments?search=${encodeURIComponent(item.concept || searchTerm)}`);
        break;
      case 'company':
        navigate(`/companies?search=${encodeURIComponent(item.name || searchTerm)}`);
        break;
      case 'payment':
        navigate(`/payments?search=${encodeURIComponent(item.concept || searchTerm)}`);
        break;
      case 'user':
        navigate(`/users?search=${encodeURIComponent(item.displayName || searchTerm)}`);
        break;
      case 'page':
        navigate(item.path);
        break;
      default:
        break;
    }
  };

  const ResultTable = ({ title, data, type, icon: IconComponent, color, columns, renderRow }) => {
    const paginatedData = getPaginatedData(data, type);
    const { page, rowsPerPage } = pagination[type];

    if (data.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          elevation={0}
          sx={{ 
            mb: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.9)
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 3, 
              pb: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <IconComponent sx={{ 
                color: color,
                mr: 1.5,
                fontSize: 24
              }} />
              <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                {title}
              </Typography>
              <Chip 
                label={`${data.length} resultado${data.length !== 1 ? 's' : ''}`}
                size="small" 
                sx={{ 
                  backgroundColor: alpha(color, 0.1),
                  color: color,
                  fontWeight: 600
                }} 
              />
            </Box>
            
            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    '& th': { 
                      backgroundColor: alpha(color, 0.05),
                      fontWeight: 600,
                      borderBottom: `2px solid ${alpha(color, 0.2)}`
                    }
                  }}>
                    {columns.map((column, index) => (
                      <TableCell key={index} sx={{ py: 2 }}>
                        {column}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ py: 2 }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((item, index) => renderRow(item, index))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {data.length > 5 && (
              <TablePagination
                component="div"
                count={data.length}
                page={page}
                onPageChange={(event, newPage) => handleChangePage(type, newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => handleChangeRowsPerPage(type, event.target.value)}
                rowsPerPageOptions={[5, 10, 15, 25]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '& .MuiTablePagination-toolbar': {
                    px: 3
                  },
                  '& .MuiIconButton-root': {
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      backgroundColor: alpha(color, 0.1)
                    }
                  },
                  '& .MuiTablePagination-select': {
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          sx={{
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            p: 3,
            borderRadius: 2,
            mb: 4,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SearchIcon sx={{ fontSize: 32, mr: 2 }} />
              
              <Box>
                <Typography 
                  variant="overline"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    letterSpacing: 1.2
                  }}
                >
                  BÚSQUEDA GLOBAL
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'white',
                    mb: 0.5
                  }}
                >
                  Resultados de Búsqueda
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 400
                  }}
                >
                  {searchTerm ? (
                    <>Mostrando resultados para: <strong>"{searchTerm}"</strong></>
                  ) : (
                    'Ingresa un término de búsqueda'
                  )}
                </Typography>
              </Box>
            </Box>

            {searchTerm && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <Chip 
                  label={`${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`}
                  sx={{
                    backgroundColor: alpha(theme.palette.background.paper, 0.2),
                    color: 'white',
                    fontWeight: 600,
                    border: `1px solid ${alpha(theme.palette.background.paper, 0.3)}`
                  }}
                />
                {loading && (
                  <CircularProgress 
                    size={20} 
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }} 
                  />
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </motion.div>

      <AnimatePresence>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : totalResults > 0 ? (
          <Box>
            {/* Tabla de Compromisos */}
            <ResultTable
              title="Compromisos Financieros"
              data={results.commitments}
              type="commitments"
              icon={CommitmentIcon}
              color={theme.palette.primary.main}
              columns={['Concepto', 'Empresa', 'Beneficiario', 'Monto']}
              renderRow={(item, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      cursor: 'pointer',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }}
                  onClick={() => handleViewCommitment(item)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.concept}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.companyName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.beneficiary}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      {item.amount ? `$${item.amount.toLocaleString()}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCommitment(item);
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )}
            />
            
            {/* Tabla de Empresas */}
            <ResultTable
              title="Empresas"
              data={results.companies}
              type="companies"
              icon={CompanyIcon}
              color={theme.palette.secondary.main}
              columns={['Nombre', 'NIT', 'Descripción']}
              renderRow={(item, index) => (
                <TableRow
                  key={index}
                  sx={{ 
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.15)}`
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          mr: 2,
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main
                        }}
                      >
                        <CompanyIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.nit || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.description || 'Sin descripción'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver empresa">
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => handleViewCompany(item)}
                        sx={{
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                          }
                        }}
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )}
            />
            
            {/* Tabla de Pagos */}
            <ResultTable
              title="Pagos Realizados"
              data={results.payments}
              type="payments"
              icon={PaymentIcon}
              color={theme.palette.success.main}
              columns={['Concepto', 'Empresa', 'Monto', 'Fecha']}
              renderRow={(item, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.success.main, 0.05),
                      cursor: 'pointer',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
                    }
                  }}
                  onClick={() => handleResultClick('payment', item)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.concept}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.companyName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      {item.amount ? `$${item.amount.toLocaleString()}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {safeFormatDate(item.date, "dd/MM/yyyy")}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver pago">
                      <IconButton 
                        size="small" 
                        color="success"
                        sx={{
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            backgroundColor: alpha(theme.palette.success.main, 0.1)
                          }
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )}
            />
            
            {/* Tabla de Usuarios */}
            <ResultTable
              title="Usuarios del Sistema"
              data={results.users}
              type="users"
              icon={PersonIcon}
              color={theme.palette.info.main}
              columns={['Usuario', 'Email', 'Rol']}
              renderRow={(item, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.info.main, 0.05),
                      cursor: 'pointer',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                    }
                  }}
                  onClick={() => handleResultClick('user', item)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={item.photoURL}
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          mr: 2,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main
                        }}
                      >
                        {item.displayName?.charAt(0) || <PersonIcon fontSize="small" />}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.displayName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.role || 'Usuario'} 
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver perfil">
                      <IconButton 
                        size="small" 
                        color="info"
                        sx={{
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            backgroundColor: alpha(theme.palette.info.main, 0.1)
                          }
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )}
            />
            
            {/* Tabla de Páginas del Sistema */}
            <ResultTable
              title="Páginas del Sistema"
              data={results.pages}
              type="pages"
              icon={PageIcon}
              color={theme.palette.warning.main}
              columns={['Página', 'Descripción', 'Ruta']}
              renderRow={(item, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.warning.main, 0.05),
                      cursor: 'pointer',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`
                    }
                  }}
                  onClick={() => handleResultClick('page', item)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <item.icon sx={{ 
                        mr: 2, 
                        color: theme.palette.warning.main,
                        fontSize: 20
                      }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Página del sistema
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {item.path}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ir a página">
                      <IconButton 
                        size="small" 
                        color="warning"
                        sx={{
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            backgroundColor: alpha(theme.palette.warning.main, 0.1)
                          }
                        }}
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )}
            />
          </Box>
        ) : searchTerm && !loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No se encontraron resultados
              </Typography>
              <Typography color="text.secondary">
                Intenta con otros términos de búsqueda
              </Typography>
            </Paper>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Modal de vista de empresa */}
      <Dialog
        open={companyViewDialogOpen}
        onClose={handleCloseCompanyViewDialog}
        maxWidth="lg"
        fullWidth
      >
        {selectedCompany && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <BusinessIcon sx={{ color: theme.palette.secondary.main }} />
                <Typography variant="h6">{selectedCompany.name || 'Empresa'}</Typography>
              </Box>
              <IconButton 
                onClick={handleCloseCompanyViewDialog}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography>Información de la empresa: {selectedCompany.name}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseCompanyViewDialog}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de vista de compromiso */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
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
        {selectedCommitment && (
          <>
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
                  <VisibilityIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    mb: 0,
                    color: 'text.primary' 
                  }}>
                    Detalle del Compromiso
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    display: 'block'
                  }}>
                    {selectedCommitment.companyName || 'Empresa no especificada'}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                onClick={handleCloseViewDialog} 
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    color: 'primary.main'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Información principal - xs=12 md=8 */}
                <Grid item xs={12} md={8}>
                  <Stack spacing={3}>
                    {/* Estado del compromiso */}
                    <Paper sx={{ 
                      p: 2.5, 
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: alpha(theme.palette.primary.main, 0.04)
                    }}>
                      <Typography variant="overline" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em'
                      }}>
                        Estado
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          icon={getStatusInfo(selectedCommitment).icon}
                          label={getStatusInfo(selectedCommitment).label}
                          color={getStatusInfo(selectedCommitment).chipColor}
                          size="medium"
                          variant="filled"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Paper>

                    {/* Información básica */}
                    <Paper sx={{ 
                      p: 2.5, 
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        color: 'text.primary'
                      }}>
                        Información General
                      </Typography>
                      
                      <Stack spacing={2}>
                        {selectedCommitment.description && (
                          <Box>
                            <Typography variant="overline" sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.1em'
                            }}>
                              Concepto
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: 'text.primary',
                              mt: 0.5,
                              lineHeight: 1.6
                            }}>
                              {selectedCommitment.concept || selectedCommitment.description}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <Box sx={{ flex: 1, minWidth: '200px' }}>
                            <Typography variant="overline" sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.1em'
                            }}>
                              Beneficiario
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: 'text.primary',
                              mt: 0.5
                            }}>
                              {selectedCommitment.beneficiary || 'No especificado'}
                            </Typography>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: '200px' }}>
                            <Typography variant="overline" sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.1em'
                            }}>
                              Monto
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 700,
                              color: 'primary.main',
                              mt: 0.5
                            }}>
                              {formatCurrency(selectedCommitment.amount)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <Box sx={{ flex: 1, minWidth: '200px' }}>
                            <Typography variant="overline" sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.1em'
                            }}>
                              Fecha de Vencimiento
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: 'text.primary',
                              mt: 0.5
                            }}>
                              {safeFormatDate(selectedCommitment.dueDate)}
                            </Typography>
                          </Box>

                          {selectedCommitment.createdAt && (
                            <Box sx={{ flex: 1, minWidth: '200px' }}>
                              <Typography variant="overline" sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.1em'
                              }}>
                                Fecha de Creación
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                color: 'text.primary',
                                mt: 0.5
                              }}>
                                {safeFormatDate(selectedCommitment.createdAt, "dd/MM/yyyy")}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Stack>
                    </Paper>

                    {/* Información de pago si existe */}
                    {(selectedCommitment.paid || selectedCommitment.isPaid) && (
                      <Paper sx={{ 
                        p: 2.5, 
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        background: alpha(theme.palette.success.main, 0.08)
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 700, 
                          mb: 2,
                          color: 'success.main'
                        }}>
                          Información de Pago
                        </Typography>
                        
                        <Stack spacing={2}>
                          {selectedCommitment.paymentDate && (
                            <Box>
                              <Typography variant="overline" sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.1em'
                              }}>
                                Fecha de Pago
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                color: 'text.primary',
                                mt: 0.5
                              }}>
                                {safeFormatDate(selectedCommitment.paymentDate)}
                              </Typography>
                            </Box>
                          )}

                          {selectedCommitment.paymentReference && (
                            <Box>
                              <Typography variant="overline" sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.1em'
                              }}>
                                Referencia de Pago
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontFamily: 'monospace',
                                color: 'text.primary',
                                mt: 0.5,
                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                                p: 1.5,
                                borderRadius: 1,
                                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
                              }}>
                                {selectedCommitment.paymentReference}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                </Grid>

                {/* Información lateral - xs=12 md=4 */}
                <Grid item xs={12} md={4}>
                  <Stack spacing={3}>
                    {/* Card de empresa */}
                    <Paper sx={{ 
                      p: 2.5, 
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        color: 'text.primary'
                      }}>
                        Empresa
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: 'primary.main',
                        fontWeight: 600
                      }}>
                        {selectedCommitment.companyName || 'No especificada'}
                      </Typography>
                    </Paper>

                    {/* Acciones rápidas */}
                    <Paper sx={{ 
                      p: 2.5, 
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        color: 'text.primary'
                      }}>
                        Acciones
                      </Typography>
                      <Button 
                        onClick={() => handleResultClick('commitment', selectedCommitment)}
                        variant="contained"
                        startIcon={<LaunchIcon />}
                        fullWidth
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Ver en Compromisos
                      </Button>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ 
              p: 3, 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              gap: 2,
              justifyContent: 'flex-end'
            }}>
              <Button 
                onClick={handleCloseViewDialog} 
                variant="outlined"
                sx={{ 
                  borderRadius: 1,
                  textTransform: 'none'
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default GlobalSearchPage;
