import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  GetApp,
  Smartphone,
  Computer,
  Close,
  CheckCircle,
  Speed,
  CloudOff,
  Notifications
} from '@mui/icons-material';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApps = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInWebApps);
    };

    checkIfInstalled();

    // Capturar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Detectar cuando se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA instalada exitosamente');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    } else {
      console.log('Usuario rechazó instalar la PWA');
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
    setShowDialog(false);
  };

  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const deviceType = getDeviceType();

  if (isInstalled) {
    return null; // No mostrar si ya está instalada
  }

  return (
    <>
      {isInstallable && (
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={() => setShowDialog(true)}
          sx={{ 
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6
            }
          }}
        >
          Instalar App
        </Button>
      )}

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {deviceType === 'mobile' ? <Smartphone /> : <Computer />}
            <Typography variant="h6">
              Instalar DR Group Dashboard
            </Typography>
          </Box>
          <IconButton onClick={() => setShowDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Instala la aplicación para una mejor experiencia de usuario
            </Typography>
          </Alert>

          <Typography variant="body1" gutterBottom>
            Beneficios de instalar la aplicación:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <Speed color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Acceso rápido"
                secondary="Lanza la app directamente desde tu escritorio o pantalla de inicio"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CloudOff color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Funciona sin conexión"
                secondary="Accede a funciones básicas incluso sin internet"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Notifications color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Notificaciones"
                secondary="Recibe alertas importantes directamente en tu dispositivo"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Experiencia nativa"
                secondary="Interfaz más fluida sin barras del navegador"
              />
            </ListItem>
          </List>

          {deviceType === 'mobile' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                En dispositivos móviles, la app se instalará en tu pantalla de inicio
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setShowDialog(false)}
            color="inherit"
          >
            Ahora no
          </Button>
          <Button 
            onClick={handleInstallClick}
            variant="contained"
            startIcon={<GetApp />}
            disabled={!deferredPrompt}
          >
            Instalar Aplicación
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PWAInstallPrompt;