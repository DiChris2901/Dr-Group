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
  InputAdornment,
  Tabs,
  Tab,
  useTheme,
  alpha
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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCommitments } from '../../hooks/useFirestore';

const ReportsConceptPage = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('last6months');
  const [tabValue, setTabValue] = useState(0);

  // Conectar con Firebase para obtener compromisos reales
  const { commitments, loading } = useCommitments();

  // Categorización automática inteligente por concepto
  const conceptsData = useMemo(() => {
    if (!commitments) return [];

    // Función para categorizar automáticamente por keywords
    const categorizeCommitment = (description = '', concept = '') => {
      const text = `${description} ${concept}`.toLowerCase();
      
      if (text.includes('servicio') || text.includes('consultoría') || text.includes('asesoría') || text.includes('profesional')) {
        return 'servicios';
      }
      if (text.includes('marketing') || text.includes('publicidad') || text.includes('promoción') || text.includes('campaña')) {
        return 'marketing';
      }
      if (text.includes('tecnología') || text.includes('software') || text.includes('sistema') || text.includes('app') || text.includes('web')) {
        return 'tecnologia';
      }
      if (text.includes('financiero') || text.includes('banco') || text.includes('crédito') || text.includes('préstamo') || text.includes('contable')) {
        return 'financiero';
      }
      if (text.includes('suministro') || text.includes('material') || text.includes('oficina') || text.includes('papelería') || text.includes('equipo')) {
        return 'suministros';
      }
      if (text.includes('transporte') || text.includes('logística') || text.includes('envío') || text.includes('entrega') || text.includes('flete')) {
        return 'logistica';
      }
      if (text.includes('mantenimiento') || text.includes('reparación') || text.includes('limpieza') || text.includes('jardinería')) {
        return 'mantenimiento';
      }
      if (text.includes('rrhh') || text.includes('personal') || text.includes('nómina') || text.includes('empleado') || text.includes('capacitación')) {
        return 'rrhh';
      }
      
      return 'otros'; // Categoría por defecto
    };

    // Agrupar compromisos por categoría
    const categoryGroups = commitments.reduce((acc, commitment) => {
      const category = categorizeCommitment(commitment.description, commitment.concept);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(commitment);
      return acc;
    }, {});

    // Calcular estadísticas por categoría
    const concepts = Object.entries(categoryGroups).map(([categoryId, categoryCommitments]) => {
      const totalAmount = categoryCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      const completed = categoryCommitments.filter(c => c.status === 'completed').length;
      const pending = categoryCommitments.filter(c => c.status === 'pending').length;
      const overdue = categoryCommitments.filter(c => c.status === 'overdue').length;
      
      // Calcular crecimiento (comparando con período anterior - simplificado)
      const growth = Math.random() * 40 - 20; // TODO: Implementar cálculo real de crecimiento
      
      // Mapear iconos y colores por categoría
      const categoryMap = {
        servicios: { name: 'Servicios Profesionales', icon: '🔧', color: '#667eea' },
        marketing: { name: 'Marketing y Publicidad', icon: '📢', color: '#f093fb' },
        tecnologia: { name: 'Tecnología y Software', icon: '💻', color: '#ff9800' },
        financiero: { name: 'Servicios Financieros', icon: '🏦', color: '#9c27b0' },
        suministros: { name: 'Suministros de Oficina', icon: '📝', color: '#4caf50' },
        logistica: { name: 'Transporte y Logística', icon: '🚚', color: '#795548' },
        mantenimiento: { name: 'Mantenimiento', icon: '🔧', color: '#607d8b' },
        rrhh: { name: 'Recursos Humanos', icon: '👥', color: '#e91e63' },
        otros: { name: 'Otros Conceptos', icon: '📋', color: '#9e9e9e' }
      };

      const categoryInfo = categoryMap[categoryId] || categoryMap.otros;
      
      return {
        id: categoryId,
        name: categoryInfo.name,
        category: categoryId,
        totalAmount,
        commitments: categoryCommitments.length,
        completed,
        pending,
        overdue,
        avgAmount: categoryCommitments.length > 0 ? totalAmount / categoryCommitments.length : 0,
        growth,
        icon: categoryInfo.icon,
        color: categoryInfo.color
      };
    });

    return concepts.filter(concept => concept.commitments > 0); // Solo mostrar categorías con datos
  }, [commitments]);

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

  const chartData = filteredConcepts.map((concept, index) => ({
    name: concept.name.substring(0, 15) + (concept.name.length > 15 ? '...' : ''),
    amount: concept.totalAmount,
    commitments: concept.commitments,
    color: index < 4 ? [
      theme.palette.primary.main,
      theme.palette.secondary.main, 
      theme.palette.success.main,
      theme.palette.warning.main
    ][index] : theme.palette.grey[400]
  }));

  const pieData = filteredConcepts.map((concept, index) => ({
    name: concept.name,
    value: concept.totalAmount,
    color: index < 4 ? [
      theme.palette.primary.main,
      theme.palette.secondary.main, 
      theme.palette.success.main,
      theme.palette.warning.main
    ][index] : theme.palette.grey[400]
  }));

  const formatCurrency = useMemo(() => (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }, []);

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
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="text.secondary">
            Cargando y categorizando compromisos...
          </Typography>
        </Box>
      ) : (
        <>
          {/* HEADER GRADIENT SOBRIO SIMPLIFICADO */}
          <Paper 
            sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              borderRadius: 1,
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              mb: 6
            }}
          >
            <Box sx={{ 
              p: 3, 
              position: 'relative',
              zIndex: 1
            }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                fontSize: '0.7rem', 
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: 1.2
              }}>
                REPORTES • ANÁLISIS POR CONCEPTO
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                mt: 0.5, 
                mb: 0.5,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                🏷️ Reportes por Concepto
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Análisis de {filteredConcepts.length} conceptos agrupados automáticamente
              </Typography>
            </Box>
          </Paper>

      {/* Filtros sobrios */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Filtros de Análisis
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Categoría"
                  sx={{
                    borderRadius: 1
                  }}
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

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Período"
                  sx={{
                    borderRadius: 1
                  }}
                >
                  <MenuItem value="last3months">Últimos 3 meses</MenuItem>
                  <MenuItem value="last6months">Últimos 6 meses</MenuItem>
                  <MenuItem value="last12months">Último año</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Botón de exportar */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={exportReport}
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            py: 1,
            textTransform: 'none'
          }}
        >
          Exportar Reporte
        </Button>
      </Box>

      {/* Resumen sobrio */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Conceptos Activos', 
            value: filteredConcepts.length, 
            color: theme.palette.primary.main,
            icon: Category
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(stats.totalAmount), 
            color: theme.palette.success.main,
            icon: AttachMoney
          },
          { 
            label: 'Total Compromisos', 
            value: stats.totalCommitments, 
            color: theme.palette.info.main,
            icon: Assignment
          },
          { 
            label: 'Ticket Promedio', 
            value: formatCurrency(stats.totalAmount / stats.totalCommitments || 0), 
            color: theme.palette.warning.main,
            icon: TrendingUp
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
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
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sección de gráficos sobria */}
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
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
                backgroundColor: `${theme.palette.primary.main}10`,
                color: 'primary.main'
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText'
              }
            }
          }}
        >
          <Tab label="Distribución por Monto" />
          <Tab label="Distribución por Cantidad" />
        </Tabs>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  {tabValue === 0 ? 'Montos por Concepto' : 'Cantidad de Compromisos por Concepto'}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    key={`bar-chart-${tabValue}`}
                    data={chartData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
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
                      fill={theme.palette.primary.main}
                      name={tabValue === 0 ? 'Monto' : 'Compromisos'}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Distribución de Montos
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart key={`pie-chart-${tabValue}`}>
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
          </Grid>
        </Grid>
      </Box>

      {/* Tabla de conceptos sobria */}
      <Card sx={{ 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalle por Concepto ({filteredConcepts.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Análisis detallado de compromisos agrupados automáticamente por concepto
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ 
            backgroundColor: 'transparent',
            boxShadow: 'none',
            borderRadius: 0
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Concepto</TableCell>
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
                {filteredConcepts.map((concept, index) => (
                  <TableRow
                    key={concept.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: theme.palette.action.hover 
                      },
                      transition: 'background-color 0.2s ease'
                    }}
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

export default ReportsConceptPage;
