import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Assignment,
  AttachMoney,
  Business,
  People,
  ReceiptLong,
  BarChart,
  NotificationsActive,
  Storage,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const sections = [
  { title: 'Compromisos', description: 'Gestiona compromisos financieros fijos mensuales', icon: Assignment, path: '/commitments', color: 'primary' },
  { title: 'Pagos', description: 'Registro y seguimiento de pagos realizados', icon: AttachMoney, path: '/payments', color: 'success' },
  { title: 'Liquidaciones', description: 'Liquidaciones por sala y cálculos automáticos', icon: ReceiptLong, path: '/facturacion/liquidaciones', color: 'warning' },
  { title: 'Empresas', description: 'Administración de empresas del grupo', icon: Business, path: '/empresas', color: 'info' },
  { title: 'Usuarios', description: 'Gestión de usuarios, roles y permisos', icon: People, path: '/users', color: 'secondary' },
  { title: 'Alertas', description: 'Centro de alertas y notificaciones del sistema', icon: NotificationsActive, path: '/alerts', color: 'error' },
  { title: 'Auditoría', description: 'Logs de actividad y trazabilidad del sistema', icon: BarChart, path: '/admin/activity-logs', color: 'primary' },
  { title: 'Storage', description: 'Gestión de archivos y almacenamiento', icon: Storage, path: '/admin/storage', color: 'success' },
];

const SectionCard = ({ section, index }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const Icon = section.icon;

  const colorMap = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
    secondary: theme.palette.secondary.main,
    error: theme.palette.error.main,
  };

  const color = colorMap[section.color] || theme.palette.primary.main;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      style={{ height: '100%' }}
    >
      <Card
        onClick={() => navigate(section.path)}
        sx={{
          height: '100%',
          cursor: 'pointer',
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: `0 4px 20px ${alpha(color, 0.18)}`,
            borderColor: alpha(color, 0.35),
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              backgroundColor: alpha(color, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Icon sx={{ fontSize: 24, color }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5, color: 'text.primary' }}>
            {section.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {section.description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ExecutiveDashboardPage = () => {
  const theme = useTheme();

  const now = new Date();
  const hora = now.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1400px', mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary">
            {saludo}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Selecciona una sección para comenzar a trabajar
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={2.5}>
        {sections.map((section, index) => (
          <Grid item xs={12} sm={6} md={3} key={section.path}>
            <SectionCard section={section} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ExecutiveDashboardPage;
