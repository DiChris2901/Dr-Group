import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Slider,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert
} from '@mui/material';
import {
  GridView as GridIcon,
  ViewList as ListIcon,
  TableChart as TableIcon,
  BarChart as ChartBarIcon,
  ShowChart as ChartLineIcon,
  DonutSmall as ChartDonutIcon,
  Speed as SpeedIcon,
  Notifications as NotificationIcon,
  Schedule as ScheduleIcon,
  Dashboard as DashboardIcon,
  Business as CompanyIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';

const DashboardCustomizer = ({ settings, updateSettings }) => {
  const theme = useMuiTheme();
  
  // Valores por defecto completos para evitar errores
  const defaultDashboard = {
    layout: {
      columns: 3,
      cardSize: 'medium',
      density: 'normal',
      viewMode: 'cards'
    },
    widgets: {
      stats: true,
      recentCommitments: true,
      upcomingPayments: true,
      monthlyChart: true,
      companiesOverview: true,
      quickActions: true
    },
    alerts: {
      enabled: true,
      daysBeforeExpiry: 7,
      emailNotifications: true,
      inAppNotifications: true,
      amountThreshold: 10000
    },
    behavior: {
      autoRefresh: true,
      refreshInterval: 30,
      defaultPeriod: 'month',
      animationsEnabled: true,
      showTooltips: true
    },
    appearance: {
      chartType: 'bar',
      showTrends: true,
      compactMode: false,
      transparencyLevel: 80
    }
  };
  
  // Dashboard settings con fusión profunda para evitar undefined
  const dashboardSettings = {
    ...defaultDashboard,
    ...settings?.dashboard,
    layout: {
      ...defaultDashboard.layout,
      ...settings?.dashboard?.layout
    },
    widgets: {
      ...defaultDashboard.widgets,
      ...settings?.dashboard?.widgets
    },
    alerts: {
      ...defaultDashboard.alerts,
      ...settings?.dashboard?.alerts
    },
    behavior: {
      ...defaultDashboard.behavior,
      ...settings?.dashboard?.behavior
    },
    appearance: {
      ...defaultDashboard.appearance,
      ...settings?.dashboard?.appearance
    }
  };

  const handleLayoutChange = (field, value) => {
    updateSettings('dashboard', {
      ...dashboardSettings,
      layout: {
        ...dashboardSettings.layout,
        [field]: value
      }
    });
  };

  const handleWidgetToggle = (widget) => {
    const currentWidgets = dashboardSettings.widgets || {};
    updateSettings('dashboard', {
      ...dashboardSettings,
      widgets: {
        ...currentWidgets,
        [widget]: !currentWidgets[widget]
      }
    });
  };

  const handleAlertChange = (field, value) => {
    updateSettings('dashboard', {
      ...dashboardSettings,
      alerts: {
        ...dashboardSettings.alerts,
        [field]: value
      }
    });
  };

  const handleBehaviorChange = (field, value) => {
    updateSettings('dashboard', {
      ...dashboardSettings,
      behavior: {
        ...dashboardSettings.behavior,
        [field]: value
      }
    });
  };

  const handleAppearanceChange = (field, value) => {
    updateSettings('dashboard', {
      ...dashboardSettings,
      appearance: {
        ...dashboardSettings.appearance,
        [field]: value
      }
    });
  };

  const widgetsList = [
    { id: 'stats', name: 'Estadísticas Principales', icon: <DashboardIcon />, description: 'Métricas clave del dashboard' },
    { id: 'recentCommitments', name: 'Compromisos Recientes', icon: <CompanyIcon />, description: 'Últimos compromisos agregados' },
    { id: 'upcomingPayments', name: 'Pagos Próximos', icon: <ScheduleIcon />, description: 'Compromisos próximos a vencer' },
    { id: 'monthlyChart', name: 'Gráfico Mensual', icon: <ChartBarIcon />, description: 'Análisis mensual de compromisos' },
    { id: 'companiesOverview', name: 'Resumen de Empresas', icon: <CompanyIcon />, description: 'Vista general de empresas' },
    { id: 'quickActions', name: 'Acciones Rápidas', icon: <SpeedIcon />, description: 'Botones de acceso rápido' }
  ];

  return (
    <Box>
      {/* Layout Configuration */}
      <Card elevation={0} sx={{ mb: 3, backgroundColor: 'transparent', border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GridIcon color="primary" />
            Layout y Visualización
          </Typography>
          
          <Grid container spacing={3}>
            {/* Columnas */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Número de Columnas</FormLabel>
                <Select
                  value={dashboardSettings.layout.columns}
                  onChange={(e) => handleLayoutChange('columns', e.target.value)}
                  size="small"
                >
                  <MenuItem value={2}>2 Columnas</MenuItem>
                  <MenuItem value={3}>3 Columnas</MenuItem>
                  <MenuItem value={4}>4 Columnas</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Tamaño de Cards */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Tamaño de Cards</FormLabel>
                <Select
                  value={dashboardSettings.layout.cardSize}
                  onChange={(e) => handleLayoutChange('cardSize', e.target.value)}
                  size="small"
                >
                  <MenuItem value="small">Pequeño</MenuItem>
                  <MenuItem value="medium">Mediano</MenuItem>
                  <MenuItem value="large">Grande</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Modo de Vista */}
            <Grid item xs={12}>
              <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'block' }}>Modo de Vista</FormLabel>
              <ToggleButtonGroup
                value={dashboardSettings.layout.viewMode}
                exclusive
                onChange={(e, value) => value && handleLayoutChange('viewMode', value)}
                size="small"
              >
                <ToggleButton value="cards">
                  <GridIcon fontSize="small" sx={{ mr: 1 }} />
                  Cards
                </ToggleButton>
                <ToggleButton value="list">
                  <ListIcon fontSize="small" sx={{ mr: 1 }} />
                  Lista
                </ToggleButton>
                <ToggleButton value="table">
                  <TableIcon fontSize="small" sx={{ mr: 1 }} />
                  Tabla
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Widgets Configuration */}
      <Card elevation={0} sx={{ mb: 3, backgroundColor: 'transparent', border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon color="primary" />
            Widgets del Dashboard
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona qué widgets deseas mostrar en tu dashboard
          </Typography>

          <List>
            {widgetsList.map((widget) => (
              <ListItem key={widget.id} divider>
                <ListItemIcon>
                  {widget.icon}
                </ListItemIcon>
                <ListItemText
                  primary={widget.name}
                  secondary={widget.description}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={Boolean(dashboardSettings.widgets?.[widget.id])}
                    onChange={() => handleWidgetToggle(widget.id)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Alerts Configuration */}
      <Card elevation={0} sx={{ mb: 3, backgroundColor: 'transparent', border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationIcon color="primary" />
            Alertas y Notificaciones
          </Typography>

          <Grid container spacing={3}>
            {/* Habilitar Alertas */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dashboardSettings.alerts.enabled}
                    onChange={(e) => handleAlertChange('enabled', e.target.checked)}
                    color="primary"
                  />
                }
                label="Habilitar alertas de compromisos"
              />
            </Grid>

            {dashboardSettings.alerts.enabled && (
              <>
                {/* Días antes del vencimiento */}
                <Grid item xs={12} md={6}>
                  <FormLabel sx={{ mb: 2, fontWeight: 600, display: 'block' }}>
                    Alertar {dashboardSettings.alerts.daysBeforeExpiry} días antes del vencimiento
                  </FormLabel>
                  <Slider
                    value={dashboardSettings.alerts.daysBeforeExpiry}
                    onChange={(e, value) => handleAlertChange('daysBeforeExpiry', value)}
                    min={1}
                    max={30}
                    marks={[
                      { value: 1, label: '1 día' },
                      { value: 7, label: '7 días' },
                      { value: 15, label: '15 días' },
                      { value: 30, label: '30 días' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Grid>

                {/* Umbral de monto */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Umbral de Monto para Alerta</FormLabel>
                    <TextField
                      type="number"
                      value={dashboardSettings.alerts.amountThreshold}
                      onChange={(e) => handleAlertChange('amountThreshold', parseFloat(e.target.value) || 0)}
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </FormControl>
                </Grid>

                {/* Tipos de notificaciones */}
                <Grid item xs={12}>
                  <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'block' }}>Tipos de Notificaciones</FormLabel>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={dashboardSettings.alerts.emailNotifications}
                          onChange={(e) => handleAlertChange('emailNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Notificaciones por Email"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={dashboardSettings.alerts.inAppNotifications}
                          onChange={(e) => handleAlertChange('inAppNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Notificaciones en la App"
                    />
                  </FormGroup>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Behavior Configuration */}
      <Card elevation={0} sx={{ mb: 3, backgroundColor: 'transparent', border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            Comportamiento
          </Typography>

          <Grid container spacing={3}>
            {/* Auto Refresh */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dashboardSettings.behavior.autoRefresh}
                    onChange={(e) => handleBehaviorChange('autoRefresh', e.target.checked)}
                    color="primary"
                  />
                }
                label="Actualización automática"
              />
              
              {dashboardSettings.behavior.autoRefresh && (
                <Box sx={{ mt: 2 }}>
                  <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'block' }}>
                    Intervalo: {dashboardSettings.behavior.refreshInterval} segundos
                  </FormLabel>
                  <Slider
                    value={dashboardSettings.behavior.refreshInterval}
                    onChange={(e, value) => handleBehaviorChange('refreshInterval', value)}
                    min={10}
                    max={300}
                    marks={[
                      { value: 10, label: '10s' },
                      { value: 30, label: '30s' },
                      { value: 60, label: '1m' },
                      { value: 300, label: '5m' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              )}
            </Grid>

            {/* Período por defecto */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Período por Defecto</FormLabel>
                <Select
                  value={dashboardSettings.behavior.defaultPeriod}
                  onChange={(e) => handleBehaviorChange('defaultPeriod', e.target.value)}
                  size="small"
                >
                  <MenuItem value="week">Última Semana</MenuItem>
                  <MenuItem value="month">Último Mes</MenuItem>
                  <MenuItem value="quarter">Último Trimestre</MenuItem>
                  <MenuItem value="year">Último Año</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Otras opciones de comportamiento */}
            <Grid item xs={12}>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.behavior.animationsEnabled}
                      onChange={(e) => handleBehaviorChange('animationsEnabled', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Habilitar animaciones"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.behavior.showTooltips}
                      onChange={(e) => handleBehaviorChange('showTooltips', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Mostrar tooltips informativos"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Appearance Configuration */}
      <Card elevation={0} sx={{ mb: 3, backgroundColor: 'transparent', border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChartBarIcon color="primary" />
            Apariencia y Gráficos
          </Typography>

          <Grid container spacing={3}>
            {/* Tipo de gráfico por defecto */}
            <Grid item xs={12} md={6}>
              <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'block' }}>Tipo de Gráfico por Defecto</FormLabel>
              <ToggleButtonGroup
                value={dashboardSettings.appearance.chartType}
                exclusive
                onChange={(e, value) => value && handleAppearanceChange('chartType', value)}
                size="small"
                fullWidth
              >
                <ToggleButton value="bar">
                  <ChartBarIcon fontSize="small" sx={{ mr: 1 }} />
                  Barras
                </ToggleButton>
                <ToggleButton value="line">
                  <ChartLineIcon fontSize="small" sx={{ mr: 1 }} />
                  Líneas
                </ToggleButton>
                <ToggleButton value="donut">
                  <ChartDonutIcon fontSize="small" sx={{ mr: 1 }} />
                  Donut
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Nivel de transparencia */}
            <Grid item xs={12} md={6}>
              <FormLabel sx={{ mb: 2, fontWeight: 600, display: 'block' }}>
                Transparencia: {dashboardSettings.appearance.transparencyLevel}%
              </FormLabel>
              <Slider
                value={dashboardSettings.appearance.transparencyLevel}
                onChange={(e, value) => handleAppearanceChange('transparencyLevel', value)}
                min={50}
                max={100}
                marks={[
                  { value: 50, label: '50%' },
                  { value: 70, label: '70%' },
                  { value: 90, label: '90%' },
                  { value: 100, label: '100%' }
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>

            {/* Otras opciones de apariencia */}
            <Grid item xs={12}>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.appearance.showTrends}
                      onChange={(e) => handleAppearanceChange('showTrends', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Mostrar indicadores de tendencia"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.appearance.compactMode}
                      onChange={(e) => handleAppearanceChange('compactMode', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Modo compacto para gráficos"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Información */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          💡 <strong>Tip:</strong> Los cambios se guardan automáticamente. Puedes restablecer toda la configuración usando el botón "Restablecer Todo" en la parte superior.
        </Typography>
      </Alert>
    </Box>
  );
};

export default DashboardCustomizer;
