import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  LinearProgress,
  Tooltip,
  Button,
  Tab,
  Tabs,
  Fab,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapVert as SwapVertIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import AccountMovementsModal from '../components/modals/AccountMovementsModal';
import PersonalAccountModal from '../components/modals/PersonalAccountModal';
import { fCurrency } from '../utils/formatUtils';

// Styled components con tema spectacular
const StyledCard = styled(Card)(({ theme, accountType }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderColor: alpha(theme.palette.primary.main, 0.2)
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-flexContainer': {
    gap: theme.spacing(1)
  },
  '& .MuiTab-root': {
    borderRadius: theme.spacing(1),
    minHeight: 48,
    textTransform: 'none',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1)
    }
  },
  '& .Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    color: theme.palette.primary.main
  }
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ pt: 3 }}>
              {children}
            </Box>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

const BankAccountsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Estados
  const [companies, setCompanies] = useState([]);
  const [personalAccounts, setPersonalAccounts] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  
  // Estados del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [personalAccountModal, setPersonalAccountModal] = useState({ open: false, account: null });
  const [selectedAccountForModal, setSelectedAccountForModal] = useState(null);
  const [selectedAccountMovements, setSelectedAccountMovements] = useState([]);
  const [selectedAccountBalance, setSelectedAccountBalance] = useState({});

  // Menu contextual
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccountCard, setSelectedAccountCard] = useState(null);

  // Estados del PDF Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState('');

  // Cargar datos desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    const unsubscribes = [];

    // Cargar empresas
    const companiesQuery = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );
    unsubscribes.push(onSnapshot(companiesQuery, (snapshot) => {
      const companiesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.bankAccount && data.bankName) {
          companiesData.push({
            id: doc.id,
            ...data
          });
        }
      });
      setCompanies(companiesData);
    }));

    // Cargar ingresos
    const incomesQuery = query(
      collection(db, 'incomes'),
      orderBy('date', 'desc')
    );
    unsubscribes.push(onSnapshot(incomesQuery, (snapshot) => {
      const incomesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        incomesData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          type: 'income'
        });
      });
      setIncomes(incomesData);
    }));

    // Cargar pagos
    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('date', 'desc')
    );
    unsubscribes.push(onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        paymentsData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          type: 'payment'
        });
      });
      setPayments(paymentsData);
      setLoading(false);
    }));

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  // Cargar cuentas personales
  useEffect(() => {
    if (!currentUser?.uid) {
      setPersonalAccounts([]);
      return;
    }

    const q = query(
      collection(db, 'personal_accounts'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar en el cliente
      accounts.sort((a, b) => {
        if (a.bank !== b.bank) return a.bank.localeCompare(b.bank);
        return (a.accountNumber || '').localeCompare(b.accountNumber || '');
      });
      
      setPersonalAccounts(accounts);
    }, (error) => {
      console.error('Error loading personal accounts:', error);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Obtener cuentas bancarias únicas
  const getBankAccounts = () => {
    return companies.map(company => ({
      id: company.id,
      account: company.bankAccount,
      bank: company.bankName,
      companyName: company.name,
      displayName: `${company.bankAccount} - ${company.bankName} (${company.name})`
    }));
  };

  // Calcular balance por cuenta
  const calculateAccountBalance = (accountNumber) => {
    // Ingresos para esta cuenta
    const accountIncomes = incomes.filter(income => income.account === accountNumber);
    const totalIncomes = accountIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

    // Pagos desde esta cuenta (excluyendo 4x1000)
    const accountPayments = payments.filter(payment => 
      payment.sourceAccount === accountNumber && !payment.is4x1000Tax
    );
    const totalPayments = accountPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // 4x1000 desde esta cuenta
    const account4x1000 = payments.filter(payment => 
      payment.sourceAccount === accountNumber && payment.is4x1000Tax
    );
    const total4x1000 = account4x1000.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Debug logging para cuentas específicas
    if (account4x1000.length > 0) {
      console.log(`🔍 Debug Account ${accountNumber} 4x1000:`, {
        account4x1000: account4x1000.length,
        total4x1000: total4x1000,
        sampleTax: account4x1000[0]
      });
    }

    return {
      incomes: totalIncomes,
      payments: totalPayments,
      tax4x1000: total4x1000,
      balance: totalIncomes - totalPayments - total4x1000,
      incomesCount: accountIncomes.length,
      paymentsCount: accountPayments.length,
      tax4x1000Count: account4x1000.length
    };
  };

  // Calcular totales de 4x1000
  const calculate4x1000Totals = () => {
    const tax4x1000Payments = payments.filter(payment => payment.is4x1000Tax);
    const total4x1000 = tax4x1000Payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Debug logging
    console.log('🔍 Debug 4x1000 Totals:', {
      totalPayments: payments.length,
      tax4x1000Payments: tax4x1000Payments.length,
      total4x1000: total4x1000,
      sampleTaxPayment: tax4x1000Payments[0]
    });
    
    return {
      total: total4x1000,
      count: tax4x1000Payments.length
    };
  };

  // Obtener movimientos para una cuenta específica
  const getAccountMovements = (accountNumber) => {
    const accountIncomes = incomes
      .filter(income => income.account === accountNumber)
      .map(income => ({ ...income, type: 'income' }));
    
    const accountPayments = payments
      .filter(payment => payment.sourceAccount === accountNumber && !payment.is4x1000Tax)
      .map(payment => ({ ...payment, type: 'payment' }));

    const account4x1000 = payments
      .filter(payment => payment.sourceAccount === accountNumber && payment.is4x1000Tax)
      .map(payment => ({ ...payment, type: '4x1000' }));

    return [...accountIncomes, ...accountPayments, ...account4x1000]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Obtener color según el balance
  const getBalanceColor = (balance) => {
    if (balance > 0) return 'success.main';
    if (balance < 0) return 'error.main';
    return 'text.secondary';
  };

  // Abrir modal de movimientos
  const handleOpenMovementsModal = (account) => {
    const balance = calculateAccountBalance(account.account);
    const movements = getAccountMovements(account.account);
    
    setSelectedAccountForModal(account);
    setSelectedAccountMovements(movements);
    setSelectedAccountBalance(balance);
    setModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAccountForModal(null);
    setSelectedAccountMovements([]);
    setSelectedAccountBalance({});
  };

  // Funciones para el sistema de tabs
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Funciones para el menú contextual
  const handleMenuOpen = (event, account) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedAccountCard(account);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAccountCard(null);
  };

  const handleEditPersonalAccount = () => {
    setPersonalAccountModal({ open: true, account: selectedAccountCard });
    handleMenuClose();
  };

  const handleViewAccountMovements = () => {
    if (tabValue === 0) {
      // Cuenta empresarial
      handleOpenMovementsModal({
        account: selectedAccountCard.bankAccount,
        bank: selectedAccountCard.bankName,
        companyName: selectedAccountCard.name
      });
    } else {
      // Cuenta personal - implementar lógica similar si es necesario
      console.log('Ver movimientos cuenta personal:', selectedAccountCard);
    }
    handleMenuClose();
  };

  // Funciones para manejar el PDF
  const handleViewCertification = () => {
    if (selectedAccountCard && selectedAccountCard.bankCertificationURL) {
      setSelectedPdfUrl(selectedAccountCard.bankCertificationURL);
      setSelectedAccountName(`${selectedAccountCard.bankName || selectedAccountCard.bank} - ${selectedAccountCard.name || selectedAccountCard.accountType}`);
      setPdfModalOpen(true);
    } else {
      showToast('No hay certificación bancaria disponible para esta cuenta', 'warning');
    }
    handleMenuClose();
  };

  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedPdfUrl('');
    setSelectedAccountName('');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cuentas Bancarias
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  const bankAccounts = getBankAccounts();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box mb={4}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Cuentas Bancarias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona todas tus cuentas empresariales y personales
          </Typography>
        </Box>
      </motion.div>

      {/* Resumen General */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Total Ingresos
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {fCurrency(incomes.reduce((sum, income) => sum + (income.amount || 0), 0))}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Total Pagos
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {fCurrency(payments.filter(p => !p.is4x1000Tax).reduce((sum, payment) => sum + (payment.amount || 0), 0))}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Balance General
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {fCurrency(
                  incomes.reduce((sum, income) => sum + (income.amount || 0), 0) -
                  payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Cuentas Activas
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {companies.length + personalAccounts.length}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <StyledTabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab
            icon={<BusinessIcon />}
            label={`Empresariales (${companies.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<PersonIcon />}
            label={`Personales (${personalAccounts.length})`}
            iconPosition="start"
          />
        </StyledTabs>
      </motion.div>

      {/* Contenido de los tabs */}
      <TabPanel value={tabValue} index={0}>
        {companies.length > 0 ? (
          <Grid container spacing={3}>
            {companies.map((company, index) => {
              const balance = calculateAccountBalance(company.bankAccount);
              return (
                <Grid item xs={12} sm={6} md={4} key={company.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    <StyledCard accountType="business">
                      <CardContent sx={{ p: 1.5 }}>
                        {/* Header con icono y menú */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <BusinessIcon sx={{ color: 'info.main', fontSize: 16 }} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}>
                                {company.bankName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {company.name}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, company)}
                            sx={{
                              color: 'text.secondary',
                              width: 20,
                              height: 20,
                              '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.08) }
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>

                        {/* Balance principal */}
                        <Box mb={1.5}>
                          <Typography 
                            variant="h5" 
                            fontWeight={700}
                            sx={{ 
                              color: balance.balance >= 0 ? 'success.main' : 'error.main',
                              fontSize: '1.5rem',
                              lineHeight: 1.1
                            }}
                          >
                            {fCurrency(balance.balance)}
                          </Typography>
                          
                          {/* Chip de estado */}
                          <Chip
                            icon={balance.balance >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={balance.balance >= 0 ? 'Positivo' : 'Negativo'}
                            size="small"
                            color={balance.balance >= 0 ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>

                        {/* Información de cuenta */}
                        <Box 
                          sx={{ 
                            p: 1, 
                            bgcolor: alpha(theme.palette.background.default, 0.3),
                            borderRadius: 1,
                            mb: 1.5
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                            Número de Cuenta
                          </Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                            {company.bankAccount}
                          </Typography>
                        </Box>

                        {/* Resumen de movimientos - más compacto */}
                        <Grid container spacing={0.5}>
                          <Grid item xs={4}>
                            <Box textAlign="center">
                              <Typography variant="caption" color="success.main" fontWeight={600} fontSize="0.7rem">
                                {fCurrency(balance.incomes)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" fontSize="0.6rem">
                                Ingresos
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box textAlign="center">
                              <Typography variant="caption" color="error.main" fontWeight={600} fontSize="0.7rem">
                                {fCurrency(balance.payments)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" fontSize="0.6rem">
                                Pagos
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box textAlign="center">
                              <Typography variant="caption" color="warning.main" fontWeight={600} fontSize="0.7rem">
                                {fCurrency(balance.tax4x1000)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" fontSize="0.6rem">
                                4x1000
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Botón de certificación */}
                        {company.bankCertificationURL && (
                          <Box mt={1.5}>
                            <Button
                              fullWidth
                              size="small"
                              startIcon={<PictureAsPdfIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPdfUrl(company.bankCertificationURL);
                                setSelectedAccountName(`${company.bankName} - ${company.name}`);
                                setPdfModalOpen(true);
                              }}
                              sx={{
                                fontSize: '0.7rem',
                                height: 28,
                                textTransform: 'none',
                                bgcolor: alpha(theme.palette.error.main, 0.06),
                                color: 'error.main',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.error.main, 0.1)
                                }
                              }}
                            >
                              Ver Certificación
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </StyledCard>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box textAlign="center" py={8}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay cuentas empresariales registradas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega información bancaria en la sección de Empresas
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {personalAccounts.length > 0 ? (
          <Grid container spacing={3}>
            {personalAccounts.map((account, index) => (
              <Grid item xs={12} sm={6} md={4} key={account.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <StyledCard accountType="personal">
                    <CardContent sx={{ p: 1.5 }}>
                      {/* Header con icono y menú */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <PersonIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}>
                              {account.bank}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {account.accountType || 'Cuenta Personal'}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, account)}
                          sx={{
                            color: 'text.secondary',
                            width: 20,
                            height: 20,
                            '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.08) }
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>

                      {/* Balance principal */}
                      <Box mb={1.5}>
                        <Typography 
                          variant="h5" 
                          fontWeight={700}
                          sx={{ 
                            color: (account.currentBalance || 0) >= 0 ? 'success.main' : 'error.main',
                            fontSize: '1.5rem',
                            lineHeight: 1.1
                          }}
                        >
                          {fCurrency(account.currentBalance || 0)}
                        </Typography>
                        
                        {/* Chip de tipo */}
                        <Chip
                          icon={<PersonIcon />}
                          label="Personal"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>

                      {/* Información de cuenta */}
                      <Box 
                        sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.background.default, 0.3),
                          borderRadius: 1,
                          mb: 1.5
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                          Número de Cuenta
                        </Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                          {account.accountNumber}
                        </Typography>
                      </Box>

                      {/* Información adicional */}
                      <Box textAlign="center" mb={1.5}>
                        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                          Cuenta personal activa
                        </Typography>
                      </Box>

                      {/* Botón de certificación */}
                      {account.bankCertificationURL && (
                        <Box>
                          <Button
                            fullWidth
                            size="small"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPdfUrl(account.bankCertificationURL);
                              setSelectedAccountName(`${account.bank} - ${account.accountType || 'Cuenta Personal'}`);
                              setPdfModalOpen(true);
                            }}
                            sx={{
                              fontSize: '0.7rem',
                              height: 28,
                              textTransform: 'none',
                              bgcolor: alpha(theme.palette.error.main, 0.06),
                              color: 'error.main',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.1)
                              }
                            }}
                          >
                            Ver Certificación
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </StyledCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={8}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay cuentas personales registradas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Presiona + para agregar tu primera cuenta personal
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* FAB para agregar cuentas */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          if (tabValue === 0) {
            navigate('/companies');
          } else {
            setPersonalAccountModal({ open: true, account: null });
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Menu contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewAccountMovements}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver movimientos</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleViewCertification}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver certificación</ListItemText>
        </MenuItem>
        
        {tabValue === 1 && (
          <MenuItem onClick={handleEditPersonalAccount}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar cuenta</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Modales */}
      <AccountMovementsModal
        open={modalOpen}
        onClose={handleCloseModal}
        account={selectedAccountForModal}
        movements={selectedAccountMovements}
        balance={selectedAccountBalance}
      />

      <PersonalAccountModal
        open={personalAccountModal.open}
        onClose={() => setPersonalAccountModal({ open: false, account: null })}
        account={personalAccountModal.account}
      />

      {/* Modal para visualizar PDF */}
      <Dialog
        open={pdfModalOpen}
        onClose={handleClosePdfModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          pb: 2
        }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <PictureAsPdfIcon color="error" />
            <Typography variant="h6" fontWeight={600}>
              Certificación Bancaria
            </Typography>
            <Chip 
              label={selectedAccountName} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
          <IconButton onClick={handleClosePdfModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {selectedPdfUrl ? (
            <iframe
              src={`${selectedPdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title={`Certificación ${selectedAccountName}`}
            />
          ) : (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="400px"
              flexDirection="column"
              gap={2}
            >
              <PictureAsPdfIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="body1" color="text.secondary">
                No hay URL de certificación disponible
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          px: 3, 
          py: 2 
        }}>
          <Button
            onClick={() => {
              if (selectedPdfUrl) {
                const link = document.createElement('a');
                link.href = selectedPdfUrl;
                link.download = `certificacion_${selectedAccountName.replace(/\s+/g, '_')}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
            startIcon={<DownloadIcon />}
            variant="contained"
            disabled={!selectedPdfUrl}
          >
            Descargar
          </Button>
          <Button onClick={handleClosePdfModal} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankAccountsPage;
