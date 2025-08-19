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
  Button
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapVert as SwapVertIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
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

const BankAccountsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // Estados
  const [companies, setCompanies] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Estados del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccountForModal, setSelectedAccountForModal] = useState(null);
  const [selectedAccountMovements, setSelectedAccountMovements] = useState([]);
  const [selectedAccountBalance, setSelectedAccountBalance] = useState({});

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
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}
        >
          💰 Cuentas Bancarias
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Balance y movimientos de todas las cuentas registradas
        </Typography>
      </Box>

      {bankAccounts.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate('/companies')}
              sx={{ ml: 1 }}
            >
              Agregar Cuentas
            </Button>
          }
        >
          No hay cuentas bancarias registradas. Agrega información bancaria en la sección de Empresas.
        </Alert>
      ) : (
        <>
          {/* Resumen General */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.success.main}20 0%, ${theme.palette.success.main}10 100%)` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Total Ingresos
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(
                          incomes.reduce((sum, income) => sum + (income.amount || 0), 0)
                        )}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.error.main}20 0%, ${theme.palette.error.main}10 100%)` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" color="error.main" gutterBottom>
                        Total Pagos
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(
                          payments.filter(p => !p.is4x1000Tax).reduce((sum, payment) => sum + (payment.amount || 0), 0)
                        )}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <TrendingDownIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.warning.main}20 0%, ${theme.palette.warning.main}10 100%)` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" color="warning.main" gutterBottom>
                        4x1000 Pagado
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(calculate4x1000Totals().total)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {calculate4x1000Totals().count} impuestos
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <ReceiptIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.primary.main}10 100%)` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" color="primary.main" gutterBottom>
                        Balance General
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(
                          incomes.reduce((sum, income) => sum + (income.amount || 0), 0) -
                          payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
                        )}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <SwapVertIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.secondary.main}20 0%, ${theme.palette.secondary.main}10 100%)` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                        Cuentas Activas
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {bankAccounts.length}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <AccountBalanceIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Cuentas Individuales */}
          <Grid container spacing={3}>
            {bankAccounts.map((account, index) => {
              const balance = calculateAccountBalance(account.account);
              const movements = getAccountMovements(account.account);

              return (
                <Grid item xs={12} lg={6} key={account.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      sx={{ 
                        height: 'fit-content',
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <AccountBalanceIcon />
                          </Avatar>
                        }
                        title={
                          <Typography variant="h6" fontWeight="bold">
                            {account.companyName}
                          </Typography>
                        }
                        subheader={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {account.account} - {account.bank}
                            </Typography>
                            <Chip
                              label={formatCurrency(balance.balance)}
                              color={balance.balance >= 0 ? 'success' : 'error'}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                        action={
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleOpenMovementsModal(account)}
                          >
                            Detalles
                          </Button>
                        }
                      />

                      <CardContent sx={{ pt: 0 }}>
                        {/* Balance Summary */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={3}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="success.main" fontWeight="bold">
                                {formatCurrency(balance.incomes)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Ingresos ({balance.incomesCount})
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={3}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="error.main" fontWeight="bold">
                                {formatCurrency(balance.payments)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Pagos ({balance.paymentsCount})
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={3}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="warning.main" fontWeight="bold">
                                {formatCurrency(balance.tax4x1000)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                4x1000 ({balance.tax4x1000Count})
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={3}>
                            <Box textAlign="center">
                              <Typography 
                                variant="h6" 
                                color={getBalanceColor(balance.balance)} 
                                fontWeight="bold"
                              >
                                {formatCurrency(balance.balance)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Balance
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Modal de movimientos de cuenta */}
      <AccountMovementsModal
        open={modalOpen}
        onClose={handleCloseModal}
        account={selectedAccountForModal}
        movements={selectedAccountMovements}
        balance={selectedAccountBalance}
      />
    </Box>
  );
};

export default BankAccountsPage;
