import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Card,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationsContext';

const CompanyDetailsModal = ({ open, onClose, company }) => {
  const { addNotification } = useNotifications();

  if (!company) {
    return null;
  }

  // Función para copiar al portapapeles
  const handleCopyToClipboard = (text, label) => {
    if (!text) return;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        addNotification({
          type: 'success',
          title: 'Copiado',
          message: `${label} copiado al portapapeles`,
          icon: 'success',
          color: 'success'
        });
      });
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      addNotification({
        type: 'success',
        title: 'Copiado',
        message: `${label} copiado al portapapeles`,
        icon: 'success',
        color: 'success'
      });
      document.body.removeChild(textArea);
    }
  };

  // Componente para mostrar enlaces como botones
  const LinkButton = ({ url, platformName, color = 'primary' }) => {
    if (!url) return null;
    
    const handleOpenLink = (url, platformName) => {
      if (!url) return;
      
      try {
        const finalUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
        
        addNotification({
          type: 'info',
          title: 'Enlace abierto',
          message: `Se abrió el enlace de ${platformName}`,
          icon: 'info',
          color: 'info'
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: `No se pudo abrir el enlace de ${platformName}`,
          icon: 'error',
          color: 'error'
        });
      }
    };
    
    return (
      <Button
        variant="outlined"
        size="small"
        color={color}
        startIcon={<LinkIcon />}
        endIcon={<OpenInNewIcon />}
        onClick={() => handleOpenLink(url, platformName)}
        sx={{ 
          textTransform: 'none',
          borderRadius: 2,
          mt: 0.5
        }}
      >
        Abrir {platformName}
      </Button>
    );
  };

  // Componente para mostrar texto con botón de copiado
  const CopyableText = ({ text, label, showValue = true }) => {
    if (!text) return null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.875rem' }}>
          {showValue ? text : '••••••••'}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={() => handleCopyToClipboard(text, label)}
          sx={{
            minWidth: 'auto',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.7rem',
            textTransform: 'none'
          }}
        >
          Copiar
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Detalles de {company.title || company.name || company.companyName || 'DiverGames SAS'}
          </Typography>
          <Chip
            label="Empresas"
            color="primary"
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Logotipo si existe */}
        {company.logoURL && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src={company.logoURL}
              alt={`Logo de ${company.title || company.name || company.companyName}`}
              sx={{
                maxWidth: 200,
                maxHeight: 120,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1,
                backgroundColor: 'background.paper',
                boxShadow: 1
              }}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Logotipo de {company.title || company.name || company.companyName}
            </Typography>
          </Box>
        )}

        {/* Información Básica en Grid Horizontal */}
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          Información Básica
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Primera fila */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Empresa
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {company.title || company.name || company.companyName || 'DiverGames SAS'}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                NIT
              </Typography>
              <Typography variant="body1">
                {company.nit || '901.001.152-4'}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Email
              </Typography>
              <Typography variant="body1" noWrap>
                {company.email || 'divergamessas@gmail.com'}
              </Typography>
            </Card>
          </Grid>

          {/* Segunda fila */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Representante Legal
              </Typography>
              <Typography variant="body1">
                Isael Carreño Sierra
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Cédula Rep Legal
              </Typography>
              <Typography variant="body1">
                1.065.829.778
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Accesos a Plataformas en Grid Compacto */}
        <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon />
          Accesos a Plataformas
        </Typography>

        <Grid container spacing={2}>
          {/* Coljuegos */}
          <Grid item xs={12} md={6}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: '100%',
                borderLeft: 4,
                borderLeftColor: 'primary.main'
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                🎯 Coljuegos
              </Typography>
              
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Usuario
                </Typography>
                <CopyableText 
                  text="C-901001152"
                  label="Usuario de Coljuegos"
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Contraseña
                </Typography>
                <CopyableText 
                  text="••••••••"
                  label="Contraseña de Coljuegos"
                  showValue={false}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <LinkButton 
                  url="#"
                  platformName="Coljuegos"
                  color="primary"
                />
              </Box>
            </Card>
          </Grid>

          {/* Houndoc */}
          <Grid item xs={12} md={6}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: '100%',
                borderLeft: 4,
                borderLeftColor: 'secondary.main'
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                📋 Houndoc
              </Typography>
              
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Usuario
                </Typography>
                <CopyableText 
                  text="OPE-901001152"
                  label="Usuario de Houndoc"
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Contraseña
                </Typography>
                <CopyableText 
                  text="••••••••"
                  label="Contraseña de Houndoc"
                  showValue={false}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <LinkButton 
                  url="#"
                  platformName="Houndoc"
                  color="secondary"
                />
              </Box>
            </Card>
          </Grid>

          {/* DIAN */}
          <Grid item xs={12} md={6}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: '100%',
                borderLeft: 4,
                borderLeftColor: 'warning.main'
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="warning.main" gutterBottom>
                🏛️ DIAN
              </Typography>
              
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  NIT
                </Typography>
                <CopyableText 
                  text="901001152"
                  label="NIT de DIAN"
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Cédula
                </Typography>
                <CopyableText 
                  text="1065829778"
                  label="Cédula de DIAN"
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Contraseña
                </Typography>
                <CopyableText 
                  text="••••••••"
                  label="Contraseña de DIAN"
                  showValue={false}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <LinkButton 
                  url="#"
                  platformName="DIAN"
                  color="warning"
                />
              </Box>
            </Card>
          </Grid>

          {/* Supersalud */}
          <Grid item xs={12} md={6}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: '100%',
                borderLeft: 4,
                borderLeftColor: 'error.main'
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="error" gutterBottom>
                🏥 Supersalud
              </Typography>
              
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Usuario
                </Typography>
                <CopyableText 
                  text="divergamessas@gmail.com"
                  label="Usuario de Supersalud"
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Contraseña
                </Typography>
                <CopyableText 
                  text="••••••••"
                  label="Contraseña de Supersalud"
                  showValue={false}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <LinkButton 
                  url="#"
                  platformName="Supersalud"
                  color="error"
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
        <Button 
          variant="contained" 
          startIcon={<EditIcon />}
        >
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyDetailsModal;
