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
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import {
  Category,
  Search,
  GetApp,
  TrendingUp,
  AttachMoney,
  Assignment,
  LocalAtm,
  Receipt,
  Business,
  Build,
  Group
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportsConceptPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('last6months');
  const [tabValue, setTabValue] = useState(0);

  // TODO: Conectar con Firebase - categorizar compromisos automáticamente por concepto
  const conceptsData = [];

  const categories = [
    { id: 'all', name: 'Todos los Conceptos', icon: Category },
    { id: 'servicios', name: 'Servicios', icon: Build },
    { id: 'marketing', name: 'Marketing', icon: Receipt },
    { id: 'tecnologia', name: 'Tecnología', icon: LocalAtm },
    { id: 'financiero', name: 'Financiero', icon: AttachMoney },
    { id: 'logistica', name: 'Logística', icon: Business },
    { id: 'rrhh', name: 'RRHH', icon: Group }
  ];

  const filteredConcepts = conceptsData.filter(concept => {
    const matchesSearch = concept.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || concept.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const chartData = filteredConcepts.map(concept => ({
    name: concept.name.substring(0, 15) + (concept.name.length > 15 ? '...' : ''),
    amount: concept.totalAmount,
    commitments: concept.commitments,
    color: concept.color
  }));

  const pieData = filteredConcepts.map(concept => ({
    name: concept.name,
    value: concept.totalAmount,
    color: concept.color
  }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalStats = () => {
    return filteredConcepts.reduce((acc, concept) => ({
      totalAmount: acc.totalAmount + concept.totalAmount,
      totalCommitments: acc.totalCommitments + concept.commitments,
      totalCompleted: acc.totalCompleted + concept.completed,
      totalPending: acc.totalPending + concept.pending,
      totalOverdue: acc.totalOverdue + concept.overdue
    }), {
      totalAmount: 0,
      totalCommitments: 0,
      totalCompleted: 0,
      totalPending: 0,
      totalOverdue: 0
    });
  };

  const stats = getTotalStats();

  const exportReport = () => {
    console.log('Exportando reporte por concepto...');
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
            🏷️ Reportes por Concepto
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis de compromisos agrupados por tipo de concepto
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
                placeholder="Buscar concepto..."
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
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Categoría"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <category.icon fontSize="small" />
                        {category.name}
                      </Box>
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
            label: 'Conceptos Activos', 
            value: filteredConcepts.length, 
            color: '#667eea',
            icon: Category
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(stats.totalAmount), 
            color: '#4caf50',
            icon: AttachMoney
          },
          { 
            label: 'Total Compromisos', 
            value: stats.totalCommitments, 
            color: '#f093fb',
            icon: Assignment
          },
          { 
            label: 'Ticket Promedio', 
            value: formatCurrency(stats.totalAmount / stats.totalCommitments || 0), 
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

      {/* Charts Section */}
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Distribución por Monto" />
          <Tab label="Distribución por Cantidad" />
        </Tabs>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                height: '400px'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    {tabValue === 0 ? 'Montos por Concepto' : 'Cantidad de Compromisos por Concepto'}
                  </Typography>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          tabValue === 0 ? formatCurrency(value) : value,
                          tabValue === 0 ? 'Monto' : 'Compromisos'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        dataKey={tabValue === 0 ? 'amount' : 'commitments'} 
                        fill="#667eea"
                        name={tabValue === 0 ? 'Monto' : 'Compromisos'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                height: '400px'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Distribución de Montos
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>

      {/* Concepts Table */}
      <Card sx={{ 
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Detalle por Concepto
          </Typography>
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Concepto</TableCell>
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
                {filteredConcepts.map((concept, index) => (
                  <motion.tr
                    key={concept.id}
                    component={TableRow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          background: `linear-gradient(135deg, ${concept.color} 0%, ${concept.color}90 100%)`
                        }}>
                          {concept.icon}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600 }}>
                          {concept.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                        {formatCurrency(concept.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{concept.commitments}</TableCell>
                    <TableCell>
                      <Chip 
                        label={concept.completed}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={concept.pending}
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={concept.overdue}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(concept.avgAmount)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {concept.growth > 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                        ) : (
                          <TrendingUp sx={{ color: '#f44336', fontSize: 16, transform: 'rotate(180deg)' }} />
                        )}
                        <Typography 
                          sx={{ 
                            fontWeight: 600,
                            color: concept.growth > 0 ? '#4caf50' : '#f44336'
                          }}
                        >
                          {concept.growth > 0 ? '+' : ''}{concept.growth}%
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

export default ReportsConceptPage;
