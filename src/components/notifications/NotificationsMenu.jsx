import React from 'react';
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
  Avatar,
  alpha,
  useTheme,
  Button,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../../context/NotificationsContext';

const getNotificationColor = (type) => {
  const colors = {
    success: '#4caf50',
    error: '#f44336', 
    warning: '#ff9800',
    info: '#2196f3'
  };
  return colors[type] || colors.info;
};

const getNotificationIcon = (type) => {
  const icons = {
    success: <SuccessIcon fontSize="small" />,
    error: <ErrorIcon fontSize="small" />,
    warning: <WarningIcon fontSize="small" />,
    info: <InfoIcon fontSize="small" />
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
  const { notifications, markAsRead, deleteNotification, clearAllNotifications } = useNotifications();

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          width: 380,
          maxHeight: 500,
          mt: 1,
          borderRadius: 2,
          boxShadow: theme.shadows[8],
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }
      }}
    >
      <MenuList sx={{ p: 0 }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.02)
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notificaciones
              {unreadCount > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    minWidth: 20,
                    textAlign: 'center'
                  }}
                >
                  {unreadCount}
                </Box>
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {notifications.length > 0 && (
                <Tooltip title="Limpiar todas">
                  <IconButton size="small" onClick={handleClearAll}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Cerrar">
                <IconButton size="small" onClick={onClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

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
                      : alpha(theme.palette.primary.main, 0.04),
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.1)
                    }
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: alpha(getNotificationColor(notification.type), 0.15),
                        color: getNotificationColor(notification.type)
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={notification.title}
                    secondary={notification.message}
                    primaryTypographyProps={{
                      fontWeight: notification.read ? 400 : 600,
                      variant: 'body2'
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                    {!notification.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.primary.main
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
                          '&:hover': { opacity: 1 }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {sortedNotifications.length > 0 && (
          <Box sx={{ 
            p: 1, 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            textAlign: 'center'
          }}>
            <Button
              size="small"
              onClick={handleClearAll}
              sx={{ 
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1)
                }
              }}
            >
              🧹 Limpiar todas
            </Button>
          </Box>
        )}
      </MenuList>
    </Menu>
  );
};

export default NotificationsMenu;
