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
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: "spring", 
          damping: 20, 
          stiffness: 100,
          delay: 0.1 
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 1.0)}, ${alpha(theme.palette.secondary.main, 1.0)})`,
            color: 'white',
            p: 3,
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            mb: 4,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
              zIndex: 1
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              animation: 'float 6s ease-in-out infinite',
              zIndex: 1
            },
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(180deg)' }
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <motion.div
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <SearchIcon sx={{ fontSize: 40, mr: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
              </motion.div>
              
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    mb: 0.5
                  }}
                >
                  Resultados de Búsqueda
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9,
                    fontWeight: 400,
                    fontSize: '1.1rem'
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                  {loading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CircularProgress 
                        size={20} 
                        sx={{ color: 'rgba(255, 255, 255, 0.9)' }} 
                      />
                    </motion.div>
                  )}
                </Box>
              </motion.div>
            )}
          </Box>
        </Box>
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
                          e.stopPropagation(); // Evitar que se active el click de la fila
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
        sx={{
          '& .MuiDialog-paper': {
            margin: '24px',
            maxHeight: 'calc(100vh - 48px)',
          }
        }}
        TransitionProps={{
          timeout: 400,
        }}
        transitionDuration={{
          enter: 400,
          exit: 300,
        }}
        componentsProps={{
          backdrop: {
            timeout: 400,
            sx: {
              backdropFilter: 'blur(2px)',
              transition: 'backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 1,
            background: theme.palette.mode === 'dark'
              ? theme.palette.background.paper
              : theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 24px rgba(0, 0, 0, 0.4)'
              : '0 4px 24px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
          }
        }}
      >
        {selectedCompany && (
          <>
            <DialogTitle sx={{ 
              pb: 2, 
              pt: 3,
              px: 3,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'transparent',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <BusinessIcon sx={{ 
                  color: theme.palette.secondary.main,
                  fontSize: 20
                }} />
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '1.1rem'
                  }}>
                    {selectedCompany.name || 'Empresa'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    mt: 0.5
                  }}>
                    Información de la empresa
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                onClick={handleCloseCompanyViewDialog} 
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.secondary, 0.04),
                    color: theme.palette.text.primary
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, pt: 5 }}>
              {/* Logotipo si existe */}
              {selectedCompany.logoURL && (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box
                    component="img"
                    src={selectedCompany.logoURL}
                    alt={`Logo de ${selectedCompany.name}`}
                    sx={{
                      maxWidth: 200,
                      maxHeight: 120,
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 1,
                      p: 1,
                      backgroundColor: 'background.paper',
                      boxShadow: 1
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    display: 'block',
                    mt: 1,
                    fontSize: '0.75rem'
                  }}>
                    Logotipo de {selectedCompany.name}
                  </Typography>
                </Box>
              )}

              {/* Información Básica */}
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 500, 
                mb: 3,
                color: theme.palette.text.primary,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <BusinessIcon sx={{ fontSize: 20, color: theme.palette.secondary.main }} />
                Información Básica
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Nombre de la empresa */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.background.default, 0.5)
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                      mb: 1
                    }}>
                      Empresa
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      fontSize: '0.95rem'
                    }}>
                      {selectedCompany.name}
                    </Typography>
                  </Box>
                </Grid>

                {/* NIT */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.background.default, 0.5)
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                      mb: 1
                    }}>
                      NIT
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: '0.95rem'
                    }}>
                      {selectedCompany.nit || 'No especificado'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Email */}
                {selectedCompany.email && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.background.default, 0.5)
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <EmailIcon sx={{ fontSize: 12 }} />
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem'
                      }} noWrap>
                        {selectedCompany.email}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Representante Legal */}
                {selectedCompany.legalRepresentative && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.background.default, 0.5)
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <PersonIcon sx={{ fontSize: 12 }} />
                        Representante Legal
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem'
                      }}>
                        {selectedCompany.legalRepresentative}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Cédula Representante Legal */}
                {selectedCompany.legalRepresentativeId && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.background.default, 0.5)
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 1
                      }}>
                        Cédula Rep Legal
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem'
                      }}>
                        {selectedCompany.legalRepresentativeId}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Número de Contrato */}
                {selectedCompany.contractNumber && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.background.default, 0.5)
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <ReceiptIcon sx={{ fontSize: 12 }} />
                        Número de Contrato
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem'
                      }}>
                        {selectedCompany.contractNumber}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Descripción si existe */}
                {selectedCompany.description && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 2, 
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.background.default, 0.5)
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 1
                      }}>
                        Descripción
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem',
                        lineHeight: 1.6
                      }}>
                        {selectedCompany.description}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
              <Button onClick={handleCloseCompanyViewDialog} variant="outlined">
                Cerrar
              </Button>
              <Button 
                onClick={() => handleResultClick('company', selectedCompany)}
                variant="contained"
                startIcon={<LaunchIcon />}
              >
                Ver en Empresas
              </Button>
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
        sx={{
          '& .MuiDialog-paper': {
            margin: '24px',
            maxHeight: 'calc(100vh - 48px)',
          }
        }}
        TransitionProps={{
          timeout: 400,
        }}
        transitionDuration={{
          enter: 400,
          exit: 300,
        }}
        componentsProps={{
          backdrop: {
            timeout: 400,
            sx: {
              backdropFilter: 'blur(2px)',
              transition: 'backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 1,
            background: theme.palette.mode === 'dark'
              ? theme.palette.background.paper
              : theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 24px rgba(0, 0, 0, 0.4)'
              : '0 4px 24px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
          }
        }}
      >
        {selectedCommitment && (
          <>
            <DialogTitle sx={{ 
              pb: 2, 
              pt: 3,
              px: 3,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'transparent',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CommitmentIcon sx={{ 
                  color: theme.palette.primary.main,
                  fontSize: 20
                }} />
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '1.1rem'
                  }}>
                    {selectedCommitment.concept || 'Compromiso Financiero'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    mt: 0.5
                  }}>
                    {selectedCommitment.companyName || 'Empresa no especificada'}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                onClick={handleCloseViewDialog} 
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.secondary, 0.04),
                    color: theme.palette.text.primary
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, pt: 5 }}>
              <Stack spacing={4}>
                {/* Estado del compromiso */}
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme.palette.text.secondary, 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 500,
                    mb: 1.5
                  }}>
                    Estado
                  </Typography>
                  <Chip 
                    icon={getStatusInfo(selectedCommitment).icon}
                    label={getStatusInfo(selectedCommitment).label}
                    color={getStatusInfo(selectedCommitment).chipColor}
                    size="small"
                    variant="filled"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                </Box>

                <Divider sx={{ opacity: 0.6 }} />

                {/* Información básica */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 500, 
                    mb: 3,
                    color: theme.palette.text.primary,
                    fontSize: '1rem'
                  }}>
                    Información General
                  </Typography>
                  
                  <Stack spacing={3}>
                    {selectedCommitment.description && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 500,
                          mb: 1
                        }}>
                          Descripción
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: '0.95rem',
                          lineHeight: 1.6
                        }}>
                          {selectedCommitment.description}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: '200px' }}>
                        <Typography variant="subtitle2" sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 500,
                          mb: 1
                        }}>
                          Beneficiario
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: '0.95rem'
                        }}>
                          {selectedCommitment.beneficiary || 'No especificado'}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: '200px' }}>
                        <Typography variant="subtitle2" sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 500,
                          mb: 1
                        }}>
                          Monto
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 500,
                          fontSize: '1.1rem',
                          color: theme.palette.text.primary
                        }}>
                          {formatCurrency(selectedCommitment.amount)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: '200px' }}>
                        <Typography variant="subtitle2" sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 500,
                          mb: 1
                        }}>
                          Fecha de Vencimiento
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: '0.95rem'
                        }}>
                          {safeFormatDate(selectedCommitment.dueDate)}
                        </Typography>
                      </Box>

                      {selectedCommitment.createdAt && (
                        <Box sx={{ flex: 1, minWidth: '200px' }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            fontWeight: 500,
                            mb: 1
                          }}>
                            Fecha de Creación
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: theme.palette.text.primary,
                            fontSize: '0.95rem'
                          }}>
                            {safeFormatDate(selectedCommitment.createdAt, "dd/MM/yyyy")}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </Box>

                {/* Información de pago si existe */}
                {(selectedCommitment.paid || selectedCommitment.isPaid) && (
                  <>
                    <Divider sx={{ opacity: 0.6 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 500, 
                        mb: 3,
                        color: 'success.main',
                        fontSize: '1rem'
                      }}>
                        Información de Pago
                      </Typography>
                      
                      <Stack spacing={3}>
                        {selectedCommitment.paymentDate && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontWeight: 500,
                              mb: 1
                            }}>
                              Fecha de Pago
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem'
                            }}>
                              {safeFormatDate(selectedCommitment.paymentDate)}
                            </Typography>
                          </Box>
                        )}

                        {selectedCommitment.paymentReference && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontWeight: 500,
                              mb: 1
                            }}>
                              Referencia de Pago
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              fontFamily: 'monospace',
                              color: theme.palette.text.primary,
                              fontSize: '0.9rem',
                              backgroundColor: alpha(theme.palette.text.secondary, 0.04),
                              p: 1,
                              borderRadius: 1,
                              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                            }}>
                              {selectedCommitment.paymentReference}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
              <Button onClick={handleCloseViewDialog} variant="outlined">
                Cerrar
              </Button>
              <Button 
                onClick={() => handleResultClick('commitment', selectedCommitment)}
                variant="contained"
                startIcon={<LaunchIcon />}
              >
                Ver en Compromisos
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default GlobalSearchPage;
