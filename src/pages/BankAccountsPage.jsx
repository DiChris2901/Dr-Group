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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
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
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
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
  const [expandedCard, setExpandedCard] = useState(null);

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

    // Pagos desde esta cuenta
    const accountPayments = payments.filter(payment => payment.sourceAccount === accountNumber);
    const totalPayments = accountPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return {
      incomes: totalIncomes,
      payments: totalPayments,
      balance: totalIncomes - totalPayments,
      incomesCount: accountIncomes.length,
      paymentsCount: accountPayments.length
    };
  };

  // Obtener movimientos para una cuenta específica
  const getAccountMovements = (accountNumber) => {
    const accountIncomes = incomes
      .filter(income => income.account === accountNumber)
      .map(income => ({ ...income, type: 'income' }));
    
    const accountPayments = payments
      .filter(payment => payment.sourceAccount === accountNumber)
      .map(payment => ({ ...payment, type: 'payment' }));

    return [...accountIncomes, ...accountPayments]
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
            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.error.main}20 0%, ${theme.palette.error.main}10 100%)` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" color="error.main" gutterBottom>
                        Total Pagos
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(
                          payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
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

            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={3}>
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
              const isExpanded = expandedCard === account.account;

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
                          <IconButton
                            onClick={() => setExpandedCard(isExpanded ? null : account.account)}
                            sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                          >
                            <ArrowDownIcon />
                          </IconButton>
                        }
                      />

                      <CardContent sx={{ pt: 0 }}>
                        {/* Balance Summary */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={4}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="success.main" fontWeight="bold">
                                {formatCurrency(balance.incomes)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Ingresos ({balance.incomesCount})
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={4}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="error.main" fontWeight="bold">
                                {formatCurrency(balance.payments)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Pagos ({balance.paymentsCount})
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={4}>
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

                        {/* Movimientos (collapsed/expanded) */}
                        <AnimatePresence>
                          {isExpanded && movements.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle2" gutterBottom>
                                Últimos Movimientos
                              </Typography>
                              
                              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {movements.slice(0, 10).map((movement, idx) => (
                                  <ListItem key={`${movement.type}-${movement.id}-${idx}`}>
                                    <ListItemIcon>
                                      {movement.type === 'income' ? (
                                        <TrendingUpIcon color="success" />
                                      ) : (
                                        <TrendingDownIcon color="error" />
                                      )}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2">
                                          {movement.type === 'income' 
                                            ? `Ingreso: ${movement.client}` 
                                            : `Pago: ${movement.concept}`
                                          }
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {format(movement.date, 'dd/MMM/yyyy', { locale: es })}
                                        </Typography>
                                      }
                                    />
                                    <ListItemSecondaryAction>
                                      <Typography 
                                        variant="body2" 
                                        color={movement.type === 'income' ? 'success.main' : 'error.main'}
                                        fontWeight="medium"
                                      >
                                        {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
                                      </Typography>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {movements.length === 0 && (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No hay movimientos registrados para esta cuenta.
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default BankAccountsPage;
