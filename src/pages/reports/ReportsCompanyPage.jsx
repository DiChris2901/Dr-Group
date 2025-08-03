import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  InputAdornment
} from '@mui/material';
import {
  Business,
  Search,
  GetApp,
  TrendingUp,
  TrendingDown,
  AttachMoney
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';

const ReportsCompanyPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('last6months');

  // Conectar con Firebase para obtener datos reales
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { companies: companiesData, loading: companiesLoading } = useCompanies();
  
  const loading = commitmentsLoading || companiesLoading;

  // Calcular estadísticas por empresa desde Firebase
  const companies = useMemo(() => {
    if (!commitments || !companiesData) return [];
    
    return companiesData.map(company => {
      const companyCommitments = commitments.filter(c => c.companyId === company.id);
      const totalAmount = companyCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      const completed = companyCommitments.filter(c => c.status === 'completed').length;
      const pending = companyCommitments.filter(c => c.status === 'pending').length;
      const overdue = companyCommitments.filter(c => c.status === 'overdue').length;
      
      return {
        id: company.id,
        name: company.name,
        totalAmount,
        commitments: companyCommitments.length,
        completed,
        pending,
        overdue,
        avgTicket: companyCommitments.length > 0 ? totalAmount / companyCommitments.length : 0,
        growth: 0 // TODO: Implementar cálculo de crecimiento
      };
    });
  }, [commitments, companiesData]);

  // Calcular datos mensuales por empresa desde Firebase
  const monthlyCompanyData = useMemo(() => {
    if (!commitments || !companiesData) return [];
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthData = { period: `${month} ${currentYear}` };
      
      companiesData.forEach(company => {
        const monthCommitments = commitments.filter(c => {
          const commitmentDate = new Date(c.dueDate);
          return commitmentDate.getMonth() === index && 
                 commitmentDate.getFullYear() === currentYear &&
                 c.companyId === company.id;
        });
        
        monthData[company.name] = monthCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      });
      
      return monthData;
    });
  }, [commitments, companiesData]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCompany === 'all' || company.id === selectedCompany)
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCompletionRate = (company) => {
    return Math.round((company.completed / company.commitments) * 100);
  };

  const exportReport = () => {
    console.log('Exportando reporte por empresa...');
    // Aquí se implementaría la exportación real
  };

  return (
    <Box sx={{ p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="text.secondary">
            Cargando datos de empresas...
          </Typography>
        </Box>
      ) : (
        <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: isDarkMode
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            🏢 Reportes por Empresa
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis detallado del desempeño por empresa
          </Typography>
        </Box>
      </motion.div>

      {/* Filters */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 4,
        background: isDarkMode 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: isDarkMode 
          ? '1px solid rgba(255, 255, 255, 0.1)' 
          : '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  label="Empresa"
                >
                  <MenuItem value="all">Todas las empresas</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.logo} {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Período"
                >
                  <MenuItem value="last3months">Últimos 3 meses</MenuItem>
                  <MenuItem value="last6months">Últimos 6 meses</MenuItem>
                  <MenuItem value="last12months">Último año</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<GetApp />}
                onClick={exportReport}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 4,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                  }
                }}
              >
                Exportar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Empresas', 
            value: filteredCompanies.length, 
            color: '#667eea',
            icon: Business
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(filteredCompanies.reduce((sum, c) => sum + c.totalAmount, 0)), 
            color: '#4caf50',
            icon: AttachMoney
          },
          { 
            label: 'Compromisos Totales', 
            value: filteredCompanies.reduce((sum, c) => sum + c.commitments, 0), 
            color: '#f093fb',
            icon: Business
          },
          { 
            label: 'Tasa Promedio Completado', 
            value: `${Math.round(filteredCompanies.reduce((sum, c) => sum + getCompletionRate(c), 0) / filteredCompanies.length)}%`, 
            color: '#ff9800',
            icon: TrendingUp
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}08 100%)`
                  : `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                border: isDarkMode 
                  ? `1px solid ${stat.color}40` 
                  : `1px solid ${stat.color}30`,
                borderRadius: 4,
                backdropFilter: 'blur(20px)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <stat.icon sx={{ color: stat.color, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Chart */}
      <Card sx={{
        mb: 3,
        borderRadius: 4,
        background: isDarkMode 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: isDarkMode 
          ? '1px solid rgba(255, 255, 255, 0.1)' 
          : '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Tendencia por Empresa (Últimos 6 meses)
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyCompanyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Coca-Cola" fill="#667eea" />
              <Bar dataKey="Pepsi" fill="#4caf50" />
              <Bar dataKey="Bimbo" fill="#f093fb" />
              <Bar dataKey="Femsa" fill="#ff9800" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card sx={{ 
        borderRadius: 4,
        background: isDarkMode 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: isDarkMode 
          ? '1px solid rgba(255, 255, 255, 0.1)' 
          : '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Detalle por Empresa
          </Typography>
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Empresa</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monto Total</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Compromisos</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Completados</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pendientes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vencidos</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Promedio</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Crecimiento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.map((company, index) => (
                  <motion.tr
                    key={company.id}
                    component={TableRow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          background: isDarkMode
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                        }}>
                          {company.logo}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600 }}>
                          {company.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                        {formatCurrency(company.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{company.commitments}</TableCell>
                    <TableCell>
                      <Chip 
                        label={company.completed}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.pending}
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.overdue}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(company.avgAmount)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {company.growth > 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                        ) : (
                          <TrendingDown sx={{ color: '#f44336', fontSize: 16 }} />
                        )}
                        <Typography 
                          sx={{ 
                            fontWeight: 600,
                            color: company.growth > 0 ? '#4caf50' : '#f44336'
                          }}
                        >
                          {company.growth > 0 ? '+' : ''}{company.growth}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
        </>
      )}
    </Box>
  );
};

export default ReportsCompanyPage;
