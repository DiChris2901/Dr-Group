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
  alpha
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
  where,
  addDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import AccountMovementsModal from '../components/modals/AccountMovementsModal';
import PersonalAccountModal from '../components/modals/PersonalAccountModal';
import { fCurrency } from '../utils/formatUtils';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
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

  // Función para manejar el guardado de cuentas personales
  const handleSavePersonalAccount = async (accountData) => {
    try {
      if (accountData.id && personalAccounts.find(account => account.id === accountData.id)) {
        // Actualizar cuenta existente
        const accountRef = doc(db, 'personal_accounts', accountData.id);
        await updateDoc(accountRef, {
          ...accountData,
          userId: currentUser.uid,
          updatedAt: new Date()
        });
        showToast('Cuenta personal actualizada correctamente', 'success');
      } else {
        // Crear nueva cuenta
        await addDoc(collection(db, 'personal_accounts'), {
          ...accountData,
          userId: currentUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        showToast('Cuenta personal agregada correctamente', 'success');
      }
      setPersonalAccountModal({ open: false, account: null });
    } catch (error) {
      console.error('Error al guardar cuenta personal:', error);
      showToast('Error al guardar la cuenta personal', 'error');
    }
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
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* Header sobrio */}
      <Box sx={{ 
        mb: 6,
        textAlign: 'left'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                color: 'text.primary'
              }}
            >
              🏦 Cuentas Bancarias
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 400
              }}
            >
              {companies.length + personalAccounts.length} cuentas activas
            </Typography>
          </Box>
          
          {/* Botón sobrio para agregar cuentas */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              if (tabValue === 0) {
                navigate('/companies');
              } else {
                setPersonalAccountModal({ open: true, account: null });
              }
            }}
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              px: 3,
              py: 1,
              textTransform: 'none'
            }}
          >
            {tabValue === 0 ? 'Agregar Empresa' : 'Agregar Cuenta Personal'}
          </Button>
        </Box>
      </Box>

      {/* Resumen sobrio */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Ingresos',
            value: fCurrency(incomes.reduce((sum, income) => sum + (income.amount || 0), 0)),
            icon: <TrendingUpIcon />,
            color: theme.palette.success.main
          },
          {
            title: 'Pagos',
            value: fCurrency(payments.filter(p => !p.is4x1000Tax).reduce((sum, payment) => sum + (payment.amount || 0), 0)),
            icon: <TrendingDownIcon />,
            color: theme.palette.error.main
          },
          {
            title: 'Balance',
            value: fCurrency(
              incomes.reduce((sum, income) => sum + (income.amount || 0), 0) -
              payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
            ),
            icon: <AccountBalanceIcon />,
            color: (incomes.reduce((sum, income) => sum + (income.amount || 0), 0) -
              payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)) >= 0 
              ? theme.palette.success.main : theme.palette.error.main
          },
          {
            title: 'Cuentas',
            value: companies.length + personalAccounts.length,
            icon: <BusinessIcon />,
            color: theme.palette.primary.main
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: `${stat.color}15`,
                    color: stat.color
                  }}>
                    {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs sobrios */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            borderRadius: 1,
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.primary',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main'
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText'
            }
          }
        }}
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
      </Tabs>

      {/* Contenido sobrio de los tabs */}
      <TabPanel value={tabValue} index={0}>
        {companies.length > 0 ? (
          <Grid container spacing={3}>
            {companies.map((company) => {
                const balance = calculateAccountBalance(company.bankAccount);
                return (
                  <Grid item xs={12} sm={6} md={4} key={company.id}>
                  <Card sx={{
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header sobrio */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box sx={{
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: `${theme.palette.primary.main}15`,
                            color: 'primary.main'
                          }}>
                            <BusinessIcon sx={{ fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {company.bankName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {company.name}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, company)}
                          sx={{ borderRadius: 1 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {/* Balance */}
                      <Box mb={2}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 600,
                            color: balance.balance >= 0 ? 'success.main' : 'error.main',
                            mb: 1
                          }}
                        >
                          {fCurrency(balance.balance)}
                        </Typography>
                        <Chip
                          label={balance.balance >= 0 ? 'Positivo' : 'Negativo'}
                          size="small"
                          color={balance.balance >= 0 ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </Box>

                      {/* Información de cuenta */}
                      <Box sx={{ 
                        p: 2, 
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        mb: 2
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          Número de Cuenta
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {company.bankAccount}
                        </Typography>
                      </Box>

                      {/* Resumen de movimientos */}
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Box textAlign="center">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {fCurrency(balance.incomes)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Ingresos
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box textAlign="center">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                              {fCurrency(balance.payments)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Pagos
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box textAlign="center">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                              {fCurrency(balance.tax4x1000)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              4x1000
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Botón de certificación */}
                      {company.bankCertificationURL && (
                        <Box mt={2}>
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
                              borderRadius: 1,
                              fontWeight: 500,
                              textTransform: 'none'
                            }}
                          >
                            Ver Certificación
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
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
            {personalAccounts.map((account) => (
              <Grid item xs={12} sm={6} md={4} key={account.id}>
                <Card sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Header sobrio */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: `${theme.palette.secondary.main}15`,
                          color: 'secondary.main'
                        }}>
                          <PersonIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {account.bank}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {account.accountType || 'Cuenta Personal'}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, account)}
                        sx={{ borderRadius: 1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Balance */}
                    <Box mb={2}>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 600,
                          color: (account.currentBalance || 0) >= 0 ? 'success.main' : 'error.main',
                          mb: 1
                        }}
                      >
                        {fCurrency(account.currentBalance || 0)}
                      </Typography>
                      <Chip
                        label="Personal"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>

                    {/* Información de cuenta */}
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      mb: 2
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Número de Cuenta
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {account.accountNumber}
                      </Typography>
                    </Box>

                    {/* Botón de certificación */}
                    {account.bankCertificationURL && (
                      <Box mt={2}>
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
                            borderRadius: 1,
                            fontWeight: 500,
                            textTransform: 'none'
                          }}
                        >
                          Ver Certificación
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
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
              Usa el botón "Agregar Cuenta Personal" para crear tu primera cuenta
            </Typography>
          </Box>
        )}
      </TabPanel>

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
        onSave={handleSavePersonalAccount}
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
