import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Grid,
  Avatar,
  LinearProgress,
  alpha
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  AttachMoney,
  Business,
  Schedule,
  Warning,
  Person
} from '@mui/icons-material';
import { format, isAfter, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

const CommitmentCard = ({ commitment, onEdit, onDelete, onPayment }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'paid': return 'Pagado';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getDaysUntilDue = () => {
    if (!commitment.dueDate) return null;
    const dueDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
    return differenceInDays(dueDate, new Date());
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'dd MMM yyyy', { locale: es });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card 
        elevation={2}
        sx={{ 
          height: '100%',
          border: isOverdue ? '2px solid' : isUrgent ? '1px solid' : 'none',
          borderColor: isOverdue ? 'error.main' : isUrgent ? 'warning.main' : 'transparent',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {isOverdue && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'error.main',
              borderRadius: '50%',
              p: 1,
              zIndex: 1
            }}
          >
            <Warning sx={{ color: 'white', fontSize: 16 }} />
          </Box>
        )}

        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {commitment.name}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <Box 
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02)
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AttachMoney fontSize="small" color="primary" />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Monto
                  </Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  color="primary.main" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {formatCurrency(commitment.amount)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Schedule fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Vencimiento
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDate(commitment.dueDate)}
              </Typography>
              {daysUntilDue !== null && (
                <Typography 
                  variant="caption" 
                  color={isOverdue ? 'error.main' : isUrgent ? 'warning.main' : 'text.secondary'}
                >
                  {isOverdue 
                    ? `Vencido hace ${Math.abs(daysUntilDue)} días`
                    : daysUntilDue === 0 
                    ? 'Vence hoy'
                    : `${daysUntilDue} días restantes`
                  }
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Business fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              {commitment.companyName || commitment.company || 'Sin empresa'}
            </Typography>
          </Box>

          {commitment.beneficiary && (
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Person fontSize="small" color="primary" />
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                Proveedor: {commitment.beneficiary}
              </Typography>
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip 
              label={getStatusText(commitment.status)}
              color={getStatusColor(commitment.status)}
              size="small"
              variant="outlined"
            />
            
            {commitment.type === 'recurring' && (
              <Chip 
                label="Recurrente"
                size="small"
                variant="outlined"
                color="info"
              />
            )}
          </Box>

          {(commitment.concept || commitment.description) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {commitment.concept || commitment.description}
            </Typography>
          )}
        </CardContent>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onEdit(commitment); handleMenuClose(); }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Editar
          </MenuItem>
          {commitment.status === 'pending' && (
            <MenuItem onClick={() => { onPayment(commitment); handleMenuClose(); }}>
              <ListItemIcon>
                <AttachMoney fontSize="small" />
              </ListItemIcon>
              Registrar Pago
            </MenuItem>
          )}
          <MenuItem onClick={() => { onDelete(commitment); handleMenuClose(); }}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Eliminar
          </MenuItem>
        </Menu>
      </Card>
    </motion.div>
  );
};

export default CommitmentCard;
