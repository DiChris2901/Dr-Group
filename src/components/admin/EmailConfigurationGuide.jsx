import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Email,
  Settings,
  Code,
  CheckCircle,
  OpenInNew,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  Key,
  Template,
  Launch
} from '@mui/icons-material';

const EmailConfigurationGuide = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const emailTemplateHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1976d2;">DR Group Dashboard</h1>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1976d2; margin-top: 0;">{{title}}</h2>
            <p>Hola <strong>{{userName}}</strong>,</p>
            <p>{{message}}</p>
        </div>
        
        <div style="background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Detalles:</h3>
            <p><strong>Usuario:</strong> {{userName}}</p>
            <p><strong>Email:</strong> {{userEmail}}</p>
            <p><strong>Fecha:</strong> {{date}}</p>
            <p><strong>Empresa:</strong> {{companyName}}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://dr-group-dashboard.web.app" 
               style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Ir al Dashboard
            </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            <p>Este es un mensaje automático del sistema DR Group Dashboard</p>
        </div>
    </div>
</body>
</html>`;

  const steps = [
    {
      label: 'Crear Cuenta en EmailJS',
      content: (
        <Box>
          <Typography paragraph>
            EmailJS es un servicio que permite enviar emails directamente desde el frontend sin backend.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              🎯 <strong>Cuenta Gratuita:</strong> 200 emails/mes incluidos
            </Typography>
          </Alert>
          <List>
            <ListItem>
              <ListItemIcon><Launch /></ListItemIcon>
              <ListItemText>
                <Link href="https://www.emailjs.com" target="_blank" rel="noopener">
                  Ir a EmailJS.com
                  <OpenInNew fontSize="small" sx={{ ml: 0.5 }} />
                </Link>
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle /></ListItemIcon>
              <ListItemText primary="Crear cuenta gratuita" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle /></ListItemIcon>
              <ListItemText primary="Verificar email de confirmación" />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: 'Configurar Servicio de Email',
      content: (
        <Box>
          <Typography paragraph>
            Configura tu proveedor de email (Gmail, Outlook, etc.)
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><Settings /></ListItemIcon>
              <ListItemText primary="Ir a 'Email Services' en el dashboard de EmailJS" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Email /></ListItemIcon>
              <ListItemText primary="Seleccionar 'Gmail' o tu proveedor" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Key /></ListItemIcon>
              <ListItemText primary="Autorizar acceso a tu cuenta de email" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Code /></ListItemIcon>
              <ListItemText primary="Copiar el SERVICE_ID generado" />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ⚠️ <strong>Importante:</strong> Guarda el SERVICE_ID, lo necesitarás para las variables de entorno
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Crear Template de Email',
      content: (
        <Box>
          <Typography paragraph>
            Crea el template HTML que se usará para los emails
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><Template /></ListItemIcon>
              <ListItemText primary="Ir a 'Email Templates' en EmailJS" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle /></ListItemIcon>
              <ListItemText primary="Crear nuevo template" />
            </ListItem>
          </List>
          
          <Box sx={{ mt: 2 }}>
            <Button
              onClick={() => toggleSection('template')}
              endIcon={expandedSection === 'template' ? <ExpandLess /> : <ExpandMore />}
              variant="outlined"
              size="small"
            >
              Ver Template HTML Completo
            </Button>
            <Collapse in={expandedSection === 'template'}>
              <Paper sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Template HTML para EmailJS:
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(emailTemplateHtml)}
                    title="Copiar template"
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
                <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '300px' }}>
                  {emailTemplateHtml}
                </pre>
              </Paper>
            </Collapse>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              📧 <strong>Variables disponibles:</strong> userName, userEmail, title, message, date, companyName, subject
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Configurar Variables de Entorno',
      content: (
        <Box>
          <Typography paragraph>
            Agrega las credenciales de EmailJS a tu archivo .env
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              🔒 <strong>Seguridad:</strong> Nunca commits las credenciales reales al repositorio
            </Typography>
          </Alert>

          <Paper sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '14px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Agregar a tu archivo .env:
              </Typography>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(`VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx  
VITE_EMAILJS_PUBLIC_KEY=tu_public_key_aqui`)}
                title="Copiar variables"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
            <pre>
{`VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx  
VITE_EMAILJS_PUBLIC_KEY=tu_public_key_aqui`}
            </pre>
          </Paper>

          <List sx={{ mt: 2 }}>
            <ListItem>
              <ListItemIcon><Key /></ListItemIcon>
              <ListItemText primary="SERVICE_ID: Obténlo de 'Email Services'" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Template /></ListItemIcon>
              <ListItemText primary="TEMPLATE_ID: Obténlo del template creado" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Code /></ListItemIcon>
              <ListItemText primary="PUBLIC_KEY: Obténlo de 'Account > API Keys'" />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: 'Probar Configuración',
      content: (
        <Box>
          <Typography paragraph>
            Prueba que todo funcione correctamente
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle /></ListItemIcon>
              <ListItemText primary="Reinicia el servidor de desarrollo" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Email /></ListItemIcon>
              <ListItemText primary="Ve a Configuración de Notificaciones" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Launch /></ListItemIcon>
              <ListItemText primary="Haz clic en 'Prueba' en la tarjeta de Email" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle /></ListItemIcon>
              <ListItemText primary="Verifica que llegue el email de prueba" />
            </ListItem>
          </List>
          
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              🎉 <strong>¡Listo!</strong> El sistema de notificaciones por email está configurado
            </Typography>
          </Alert>
        </Box>
      )
    }
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Email color="primary" />
          <Typography variant="h5" component="h2">
            Configuración de Email con EmailJS
          </Typography>
          <Chip label="Guía Completa" color="primary" size="small" />
        </Box>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      {index === steps.length - 1 ? 'Finalizar' : 'Continuar'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Atrás
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              🎉 Configuración Completada
            </Typography>
            <Typography paragraph>
              El sistema de notificaciones por email está listo para usar. 
              Ahora los usuarios pueden recibir notificaciones automáticas por correo electrónico.
            </Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Reiniciar Guía
            </Button>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailConfigurationGuide;