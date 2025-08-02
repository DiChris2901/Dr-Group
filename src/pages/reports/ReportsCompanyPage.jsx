import React, { useState, useEffect } from 'react';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportsCompanyPage = () => {
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('last6months');

  // Mock data - en producción vendrá de Firebase
  const companies = [
    { 
      id: 'coca-cola', 
      name: 'Coca-Cola', 
      totalAmount: 450000, 
      commitments: 24, 
      completed: 18, 
      pending: 4, 
      overdue: 2,
      growth: 12.5,
      avgAmount: 18750,
      logo: '🥤'
    },
    { 
      id: 'pepsi', 
      name: 'Pepsi', 
      totalAmount: 380000, 
      commitments: 19, 
      completed: 15, 
      pending: 3, 
      overdue: 1,
      growth: 8.2,
      avgAmount: 20000,
      logo: '🥤'
    },
    { 
      id: 'bimbo', 
      name: 'Bimbo', 
      totalAmount: 320000, 
      commitments: 16, 
      completed: 12, 
      pending: 3, 
      overdue: 1,
      growth: -2.1,
      avgAmount: 20000,
      logo: '🍞'
    },
    { 
      id: 'femsa', 
      name: 'Femsa', 
      totalAmount: 290000, 
      commitments: 15, 
      completed: 11, 
      pending: 3, 
      overdue: 1,
      growth: 15.8,
      avgAmount: 19333,
      logo: '🏢'
    },
    { 
      id: 'walmart', 
      name: 'Walmart', 
      totalAmount: 260000, 
      commitments: 12, 
      completed: 9, 
      pending: 2, 
      overdue: 1,
      growth: 6.4,
      avgAmount: 21667,
      logo: '🛒'
    },
    { 
      id: 'nestle', 
      name: 'Nestlé', 
      totalAmount: 240000, 
      commitments: 14, 
      completed: 10, 
      pending: 3, 
      overdue: 1,
      growth: 4.2,
      avgAmount: 17143,
      logo: '☕'
    }
  ];

  const monthlyCompanyData = [
    { month: 'Ene', 'Coca-Cola': 65000, 'Pepsi': 58000, 'Bimbo': 42000, 'Femsa': 38000 },
    { month: 'Feb', 'Coca-Cola': 72000, 'Pepsi': 61000, 'Bimbo': 45000, 'Femsa': 41000 },
    { month: 'Mar', 'Coca-Cola': 68000, 'Pepsi': 59000, 'Bimbo': 48000, 'Femsa': 43000 },
    { month: 'Abr', 'Coca-Cola': 75000, 'Pepsi': 63000, 'Bimbo': 51000, 'Femsa': 46000 },
    { month: 'May', 'Coca-Cola': 78000, 'Pepsi': 66000, 'Bimbo': 54000, 'Femsa': 48000 },
    { month: 'Jun', 'Coca-Cola': 82000, 'Pepsi': 69000, 'Bimbo': 52000, 'Femsa': 50000 }
  ];

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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
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
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                border: `1px solid ${stat.color}30`,
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
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
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
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
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
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
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
    </Box>
  );
};

export default ReportsCompanyPage;
