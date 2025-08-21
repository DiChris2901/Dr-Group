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
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';

const ReportsCompanyPage = () => {
  const theme = useTheme();
  
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
      {/* Header sobrio */}
      <Box sx={{ 
        mb: 6,
        textAlign: 'left'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            mb: 1,
            color: 'text.primary'
          }}
        >
          🏢 Reportes por Empresa
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontWeight: 400
          }}
        >
          Análisis detallado del desempeño por empresa
        </Typography>
      </Box>

      {/* Filtros sobrios */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar empresa"
                placeholder="Nombre de empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
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
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
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
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
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
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1.5
                }}
              >
                Exportar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tarjetas de resumen sobrias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Empresas', 
            value: filteredCompanies.length, 
            color: theme.palette.primary.main,
            icon: Business
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(filteredCompanies.reduce((sum, c) => sum + c.totalAmount, 0)), 
            color: theme.palette.success.main,
            icon: AttachMoney
          },
          { 
            label: 'Compromisos Totales', 
            value: filteredCompanies.reduce((sum, c) => sum + c.commitments, 0), 
            color: theme.palette.info.main,
            icon: Business
          },
          { 
            label: 'Tasa Promedio Completado', 
            value: `${Math.round(filteredCompanies.reduce((sum, c) => sum + getCompletionRate(c), 0) / filteredCompanies.length)}%`, 
            color: theme.palette.warning.main,
            icon: TrendingUp
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
                    <stat.icon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráfico sobrio */}
      <Card sx={{
        mb: 4,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
            Tendencia por Empresa (Últimos 6 meses)
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyCompanyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Coca-Cola" fill={theme.palette.primary.main} />
              <Bar dataKey="Pepsi" fill={theme.palette.success.main} />
              <Bar dataKey="Bimbo" fill={theme.palette.info.main} />
              <Bar dataKey="Femsa" fill={theme.palette.warning.main} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla de empresas sobria */}
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
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
            Detalle por Empresa
          </Typography>
          <TableContainer component={Paper} sx={{ 
            backgroundColor: 'transparent',
            boxShadow: 'none' 
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Empresa</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Monto Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Compromisos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Completados</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Pendientes</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Vencidos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Promedio</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Crecimiento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.map((company, index) => (
                  <TableRow
                    key={company.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: theme.palette.action.hover 
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          backgroundColor: `${theme.palette.primary.main}15`,
                          color: 'primary.main'
                        }}>
                          {company.logo}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {company.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(company.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{company.commitments}</TableCell>
                    <TableCell>
                      <Chip 
                        label={company.completed}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.pending}
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.overdue}
                        color="error"
                        size="small"
                        variant="outlined"
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
                  </TableRow>
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
