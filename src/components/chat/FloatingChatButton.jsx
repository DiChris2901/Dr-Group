import React, { useState } from 'react';
import { Fab, Badge, Tooltip, Zoom } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useChat } from '../../context/ChatContext';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import { useSettings } from '../../context/SettingsContext';
import ChatDrawer from './ChatDrawer';

/**
 * Botón flotante de chat visible en todas las páginas
 * Muestra badge con mensajes no leídos y abre ChatDrawer
 * Usa colores dinámicos del tema (primary + secondary)
 */
const FloatingChatButton = () => {
  // ✅ TODOS LOS HOOKS AL INICIO - EN ORDEN FIJO
  const theme = useTheme();
  const { unreadCount } = useChat();
  const { settings } = useSettings();
  
  // 💾 Estado - Recuperar preferencia del localStorage
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const saved = localStorage.getItem('drgroup_chatDrawerOpen');
    return saved === 'true';
  });

  // 📌 Estado para conversación pendiente a abrir
  const [pendingConversation, setPendingConversation] = React.useState(null);

  // 🔔 Notificaciones de mensajes nuevos cuando drawer está cerrado
  useChatNotifications(drawerOpen);

  // 🎯 Escuchar evento para abrir chat desde notificaciones
  React.useEffect(() => {
    const handleOpenChat = (event) => {
      const conversationId = event.detail?.conversationId;
      if (conversationId) {
        setPendingConversation(conversationId);
        setDrawerOpen(true);
        localStorage.setItem('drgroup_chatDrawerOpen', 'true');
      }
    };

    window.addEventListener('openChat', handleOpenChat);
    
    // Verificar si hay conversación pendiente al montar
    const pending = localStorage.getItem('drgroup_pendingConversation');
    if (pending) {
      setPendingConversation(pending);
      localStorage.removeItem('drgroup_pendingConversation');
    }

    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  // 🎨 Gradiente dinámico con colores del tema
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  // 📍 Detectar si la Taskbar está activa para ajustar posición
  const navigationMode = settings?.navigation?.mode || 'sidebar';
  const showTaskbar = settings?.navigation?.showTaskbar !== false;
  const isTaskbarActive = (navigationMode === 'taskbar' || navigationMode === 'both') && showTaskbar;

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
              bottom: isTaskbarActive 
                ? { xs: 88, md: 112 } // Elevado cuando Taskbar está activa (64px móvil + 16px bottom + 8px margen, 80px desktop + 16px bottom + 16px margen)
                : { xs: 16, md: 24 }, // Posición normal sin Taskbar
              right: { xs: 16, md: 24 },
              zIndex: 1200,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              color: 'white',
              boxShadow: `0 8px 25px ${primaryColor}40`,
              // 🔔 Animación de pulso cuando hay mensajes no leídos
              animation: unreadCount > 0 ? 'chatPulse 2s ease-in-out infinite' : 'none',
              '@keyframes chatPulse': {
                '0%, 100%': {
                  boxShadow: `0 8px 25px ${primaryColor}40`,
                  transform: 'scale(1)'
                },
                '50%': {
                  boxShadow: `0 0 30px ${theme.palette.error.main}80, 0 8px 35px ${primaryColor}60`,
                  transform: 'scale(1.05)'
                }
              },
              '&:hover': {
                background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
                transform: 'scale(1.1)',
                boxShadow: `0 12px 35px ${primaryColor}66`,
                animation: 'none' // Detener animación al hacer hover
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // Transición suave al cambiar posición
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
                  borderColor: 'background.paper',
                  // 🔔 Animación adicional en el badge
                  animation: unreadCount > 0 ? 'badgeBounce 0.5s ease-in-out' : 'none',
                  '@keyframes badgeBounce': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' }
                  }
                }
              }}
            >
              <ChatIcon sx={{ fontSize: 28 }} />
            </Badge>
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Drawer de chat */}
      <ChatDrawer 
        open={drawerOpen} 
        onClose={handleClose} 
        pendingConversation={pendingConversation}
        onConversationOpened={() => setPendingConversation(null)}
      />
    </>
  );
};

export default FloatingChatButton;
