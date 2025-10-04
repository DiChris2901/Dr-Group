import React, { useState } from 'react';
import { Fab, Badge, Tooltip, Zoom } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useChat } from '../../context/ChatContext';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import ChatDrawer from './ChatDrawer';

/**
 * Botón flotante de chat visible en todas las páginas
 * Muestra badge con mensajes no leídos y abre ChatDrawer
 * Usa colores dinámicos del tema (primary + secondary)
 */
const FloatingChatButton = () => {
  const theme = useTheme();
  const { unreadCount } = useChat();
  
  // 💾 A. Persistencia del estado - Recuperar preferencia del localStorage
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const saved = localStorage.getItem('drgroup_chatDrawerOpen');
    return saved === 'true';
  });

  // 🔔 B. Notificaciones de mensajes nuevos cuando drawer está cerrado
  useChatNotifications(drawerOpen);

  // 🎨 Gradiente dinámico con colores del tema
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  const handleOpen = () => {
    setDrawerOpen(true);
    localStorage.setItem('drgroup_chatDrawerOpen', 'true');
  };

  const handleClose = () => {
    setDrawerOpen(false);
    localStorage.setItem('drgroup_chatDrawerOpen', 'false');
  };

  return (
    <>
      {/* Botón flotante */}
      <Zoom in timeout={300}>
        <Tooltip title="Mensajería interna" placement="left">
          <Fab
            onClick={handleOpen}
            sx={{
              position: 'fixed',
              bottom: { xs: 16, md: 24 },
              right: { xs: 16, md: 24 },
              zIndex: 1200,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              color: 'white',
              boxShadow: `0 8px 25px ${primaryColor}40`,
              '&:hover': {
                background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
                transform: 'scale(1.1)',
                boxShadow: `0 12px 35px ${primaryColor}66`
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: 20,
                  height: 20,
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: 'background.paper'
                }
              }}
            >
              <ChatIcon sx={{ fontSize: 28 }} />
            </Badge>
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Drawer de chat */}
      <ChatDrawer open={drawerOpen} onClose={handleClose} />
    </>
  );
};

export default FloatingChatButton;
