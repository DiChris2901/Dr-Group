import React, { useState } from 'react';
import {
  Menu,
  MenuList,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  alpha,
  useTheme,
  Button,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  NotificationImportant as AlertIcon,
  DoneAll as DoneAllIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';

// Estilos CSS para animaciones spectacular
const styles = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }

  @keyframes slideIn {
    0% {
      opacity: 0;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined' && !document.getElementById('notifications-spectacular-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'notifications-spectacular-styles';
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const getNotificationColor = (type) => {
  const colors = {
    success: '#4caf50',
    error: '#f44336', 
    warning: '#ff9800',
    info: '#2196f3',
    payment: '#2196f3',
    company: '#2196f3',
    report: '#00bcd4',
    schedule: '#ff9800'
  };
  return colors[type] || colors.info;
};

const getNotificationIcon = (type) => {
  const iconProps = { fontSize: 'small' };
  const icons = {
    success: <SuccessIcon {...iconProps} />,
    error: <ErrorIcon {...iconProps} />,
    warning: <WarningIcon {...iconProps} />,
    info: <InfoIcon {...iconProps} />,
    payment: <MoneyIcon {...iconProps} />,
    company: <BusinessIcon {...iconProps} />,
    report: <ReportIcon {...iconProps} />,
    schedule: <ScheduleIcon {...iconProps} />
  };
  return icons[type] || icons.info;
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch (error) {
    return 'Hace un momento';
  }
};

const NotificationsMenu = ({ anchorEl, open, onClose }) => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { 
    notifications, 
    alerts, 
    unreadCount, 
    alertsCount, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications,
    deleteAlert,
    clearAllAlerts,
    resetResolvedAlerts
  } = useNotifications();

  // Configuraciones dinámicas del Design System
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 12;
  const animationsEnabled = settings?.theme?.animations !== false;

  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const sortedNotifications = notifications
    .sort((a, b) => {
      const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return dateB - dateA;
    });

  const sortedAlerts = alerts
    .sort((a, b) => {
      const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return dateB - dateA;
    });

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          width: 420,
          maxHeight: 620,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[8],
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'visible',
          mt: 1,
          '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: theme.palette.background.paper,
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
            border: `1px solid ${theme.palette.divider}`,
            borderBottom: 'none',
            borderRight: 'none'
          },
        }
      }}
    >
      <MenuList sx={{ p: 0 }}>
        {/* Header limpio DS 3.0 sobrio */}
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary 
            }}>
              Centro de Notificaciones
            </Typography>
            <IconButton 
              onClick={onClose} 
              size="small" 
              sx={{ 
                color: theme.palette.text.secondary,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: animationsEnabled ? 'scale(1.1)' : 'none'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Tabs spectacular mejorados */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              mt: 1.5, 
              minHeight: 48,
              position: 'relative',
              zIndex: 1,
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: `${borderRadius / 2}px`,
                transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                '&.Mui-selected': {
                  color: 'white',
                  backgroundColor: alpha(theme.palette.common.white, 0.15),
                  boxShadow: theme.shadows[2]
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.08),
                  transform: animationsEnabled ? 'translateY(-1px)' : 'none'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'white',
                height: 3,
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }
            }}
          >
            <Tab
              icon={
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <NotificationsIcon />
                </Badge>
              }
              label="Notificaciones"
              sx={{ minHeight: 48 }}
            />
            <Tab
              icon={
                <Badge badgeContent={alertsCount} color="warning" max={99}>
                  <AlertIcon />
                </Badge>
              }
              label="Alertas"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {sortedNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No hay notificaciones
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {sortedNotifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    sx={{
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      backgroundColor: notification.read 
                        ? 'transparent' 
                        : alpha(primaryColor, 0.04),
                      cursor: 'pointer',
                      borderRadius: `${borderRadius / 3}px`,
                      mx: 0.5,
                      my: 0.5,
                      transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                      '&:hover': {
                        backgroundColor: alpha(primaryColor, 0.08),
                        transform: animationsEnabled ? 'translateX(6px) scale(1.01)' : 'none',
                        boxShadow: `0 4px 16px ${alpha(primaryColor, 0.15)}`
                      }
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: alpha(getNotificationColor(notification.type), 0.15),
                          color: getNotificationColor(notification.type),
                          boxShadow: `0 4px 12px ${alpha(getNotificationColor(notification.type), 0.25)}`,
                          border: `2px solid ${alpha(getNotificationColor(notification.type), 0.2)}`,
                          transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatRelativeTime(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{
                        fontWeight: notification.read ? 400 : 600,
                        variant: 'body2'
                      }}
                      secondaryTypographyProps={{
                        component: 'div'
                      }}
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: primaryColor,
                              animation: animationsEnabled ? 'pulse 2s infinite' : 'none',
                              boxShadow: `0 0 12px ${alpha(primaryColor, 0.6)}`
                            }}
                          />
                        )}
                        
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            sx={{ 
                              p: 0.5,
                              opacity: 0.7,
                              borderRadius: `${borderRadius / 2}px`,
                              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                              '&:hover': { 
                                opacity: 1,
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                transform: animationsEnabled ? 'scale(1.1)' : 'none',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {sortedNotifications.length > 0 && (
            <Box sx={{ 
              p: 1, 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              textAlign: 'center'
            }}>
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={clearAllNotifications}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${borderRadius / 2}px`,
                  background: `linear-gradient(135deg, ${alpha(primaryColor, 0.1)}, ${alpha(secondaryColor, 0.05)})`,
                  color: primaryColor,
                  border: `1px solid ${alpha(primaryColor, 0.2)}`,
                  transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(primaryColor, 0.15)}, ${alpha(secondaryColor, 0.08)})`,
                    transform: animationsEnabled ? 'translateY(-1px)' : 'none',
                    boxShadow: `0 4px 12px ${alpha(primaryColor, 0.2)}`
                  }
                }}
              >
                Limpiar todas
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {sortedAlerts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <AlertIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No hay alertas activas
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {sortedAlerts.map((alert, index) => (
                  <ListItem
                    key={alert.id}
                    sx={{
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      backgroundColor: alpha(theme.palette.warning.main, 0.04),
                      borderRadius: `${borderRadius / 3}px`,
                      mx: 0.5,
                      my: 0.5,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
                      transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                      animation: animationsEnabled ? `slideIn 0.3s ease-out ${index * 0.1}s both` : 'none',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.warning.main, 0.08),
                        transform: animationsEnabled ? 'translateX(6px) scale(1.01)' : 'none',
                        boxShadow: `0 4px 16px ${alpha(theme.palette.warning.main, 0.2)}`
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          background: animationsEnabled 
                            ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                            : primaryColor,
                          color: 'white',
                          boxShadow: `0 4px 20px ${alpha(primaryColor, 0.4)}`,
                          animation: animationsEnabled ? 'shimmer 3s infinite, pulse 2s infinite' : 'none',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: `0 6px 25px ${alpha(primaryColor, 0.5)}`
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <WarningIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              flex: 1,
                              color: theme.palette.text.primary
                            }}
                          >
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.priority || 'Media'}
                            size="small"
                            color={alert.priority === 'Alta' ? 'error' : 'warning'}
                            sx={{ 
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: alert.priority === 'Alta' 
                                ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                                : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                              color: 'white',
                              borderRadius: `${settings.borderRadius || 12}px`,
                              boxShadow: `0 4px 12px ${alpha(alert.priority === 'Alta' ? theme.palette.error.main : theme.palette.warning.main, 0.3)}`,
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: `0 6px 16px ${alpha(alert.priority === 'Alta' ? theme.palette.error.main : theme.palette.warning.main, 0.4)}`
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5
                            }}
                          >
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatRelativeTime(alert.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondaryTypographyProps={{
                        component: 'div'
                      }}
                    />
                    
                    <ListItemSecondaryAction>
                      <Tooltip title="Resolver">
                        <IconButton
                          size="small"
                          onClick={() => deleteAlert(alert.id)}
                          sx={{ 
                            p: 0.5,
                            opacity: 0.7,
                            '&:hover': { 
                              opacity: 1,
                              backgroundColor: alpha(theme.palette.success.main, 0.1)
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          
          {sortedAlerts.length > 0 && (
            <Box sx={{ 
              p: 2, 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              textAlign: 'center',
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: animationsEnabled ? 'blur(10px)' : 'none'
            }}>
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={clearAllAlerts}
                variant="contained"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${settings.borderRadius || 12}px`,
                  background: animationsEnabled 
                    ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                    : primaryColor,
                  color: 'white',
                  boxShadow: `0 4px 16px ${alpha(primaryColor, 0.4)}`,
                  px: 3,
                  py: 1,
                  animation: animationsEnabled ? 'shimmer 3s infinite' : 'none',
                  '&:hover': {
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: `0 8px 25px ${alpha(primaryColor, 0.5)}`,
                    background: animationsEnabled 
                      ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                      : primaryColor,
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Resolver todas las alertas
              </Button>
              
              {/* Botón de desarrollo para restablecer alertas resueltas */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    resetResolvedAlerts();
                    window.location.reload(); // Recargar para regenerar alertas
                  }}
                  variant="outlined"
                  sx={{ 
                    mt: 1,
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: `${settings.borderRadius || 12}px`,
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                    '&:hover': {
                      borderColor: theme.palette.warning.dark,
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    },
                  }}
                >
                  🔄 Dev: Restablecer Alertas
                </Button>
              )}
            </Box>
          )}
        </TabPanel>
      </MenuList>
    </Menu>
  );
};

export default NotificationsMenu;
