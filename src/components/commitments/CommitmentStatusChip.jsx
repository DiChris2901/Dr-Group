import React from 'react';
import { Chip, CircularProgress, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CheckCircle,
  Warning,
  Schedule,
  CalendarToday,
  Payment,
  NotificationAdd,
  Visibility,
  GetApp
} from '@mui/icons-material';
import { useCommitmentCompleteStatus } from '../../hooks/useCommitmentPaymentStatus';

/**
 * Componente que muestra el estado correcto de un compromiso
 * considerando pagos parciales de la colección payments
 */
const CommitmentStatusChip = ({ commitment, showTooltip = true, variant = 'filled' }) => {
  const theme = useTheme();
  const { status, paymentStats, loading } = useCommitmentCompleteStatus(commitment);

  if (loading) {
    return (
      <Chip
        size="small"
        icon={<CircularProgress size={12} />}
        label="Cargando..."
        variant={variant}
        sx={{ minWidth: 100 }}
      />
    );
  }

  if (!status) {
    return (
      <Chip
        size="small"
        label="Error"
        color="default"
        variant={variant}
      />
    );
  }

  const getStatusDisplay = () => {
    switch (status.key) {
      case 'completed':
        return {
          icon: <CheckCircle />,
          color: 'success',
          gradient: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
          shadowColor: 'rgba(76, 175, 80, 0.3)'
        };
      
      case 'partial':
        return {
          icon: <Payment />,
          color: 'warning',
          gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          shadowColor: 'rgba(255, 152, 0, 0.3)'
        };
      
      case 'overdue':
        return {
          icon: <Warning />,
          color: 'error',
          gradient: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          shadowColor: 'rgba(244, 67, 54, 0.4)'
        };
      
      case 'pending':
        return {
          icon: <CalendarToday />,
          color: 'info',
          gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          shadowColor: 'rgba(33, 150, 243, 0.3)'
        };
      
      default:
        return {
          icon: <Schedule />,
          color: 'default',
          gradient: 'linear-gradient(135deg, #757575 0%, #424242 100%)',
          shadowColor: 'rgba(117, 117, 117, 0.3)'
        };
    }
  };

  const { icon, color, gradient, shadowColor } = getStatusDisplay();

  const chipElement = (
    <Chip
      size="small"
      icon={icon}
      label={status.label}
      variant="outlined"
      sx={{
        // Diseño Sobrio - Chips de Estado con alpha values
        fontWeight: 500,
        minWidth: 88,
        height: 28,
        fontSize: '0.75rem',
        borderRadius: 1.5,
        backgroundColor: 'transparent',
        border: `1px solid ${theme.palette[color].main}40`,
        color: theme.palette[color].main,
        transition: 'all 0.2s ease',
        '& .MuiChip-icon': {
          fontSize: '14px',
          color: theme.palette[color].main
        },
        '& .MuiChip-label': {
          paddingLeft: '6px',
          paddingRight: '8px',
          letterSpacing: '0.02em'
        },
        '&:hover': {
          backgroundColor: `${theme.palette[color].main}08`,
          borderColor: `${theme.palette[color].main}60`,
          boxShadow: 'none'
        }
      }}
    />
  );

  if (!showTooltip) {
    return chipElement;
  }

  const tooltipContent = (
    <div>
      <div><strong>{status.label}</strong></div>
      <div>{status.description}</div>
      {status.key === 'partial' && (
        <div>
          <div>Pagado: ${paymentStats.totalPaid.toLocaleString()}</div>
          <div>Restante: ${paymentStats.remainingAmount.toLocaleString()}</div>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      {chipElement}
    </Tooltip>
  );
};

/**
 * Función utilitaria para obtener información de estado compatible con código legacy
 */
export const getEnhancedStatusInfo = (commitment, theme) => {
  // Esta función debería usarse solo cuando no se pueda usar el componente
  // Para un estado correcto, usar CommitmentStatusChip que incluye el hook
  // NOTA: Se debe pasar el theme como parámetro ya que no es un componente React
  
  // Lógica básica de fallback (sin consultar payments en tiempo real)
  if (commitment.paid || commitment.isPaid) {
    return {
      label: 'Pagado',
      color: theme.palette.success.main,
      chipColor: 'success',
      icon: <CheckCircle />,
      gradient: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
      shadowColor: 'rgba(76, 175, 80, 0.3)',
      action: 'Ver Comprobante',
      actionIcon: <GetApp />
    };
  }

  const today = new Date();
  const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
  
  if (dueDate < today) {
    return {
      label: 'Vencido',
      color: theme.palette.error.main,
      chipColor: 'error',
      icon: <Warning />,
      gradient: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
      shadowColor: 'rgba(244, 67, 54, 0.4)',
      action: 'Pagar Ahora',
      actionIcon: <Payment />
    };
  }

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);
  
  if (dueDate < threeDaysFromNow) {
    return {
      label: 'Próximo',
      color: theme.palette.warning.main,
      chipColor: 'warning',
      icon: <Schedule />,
      gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      shadowColor: 'rgba(255, 152, 0, 0.3)',
      action: 'Programar Pago',
      actionIcon: <NotificationAdd />
    };
  }

  return {
    label: 'Pendiente',
    color: theme.palette.info.main,
    chipColor: 'info',
    icon: <CalendarToday />,
    gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    shadowColor: 'rgba(33, 150, 243, 0.3)',
    action: 'Ver Detalles',
    actionIcon: <Visibility />
  };
};

export default CommitmentStatusChip;
