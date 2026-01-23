import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Warning, CheckCircle, Error as ErrorIcon, Refresh } from '@mui/icons-material';
import { migratePermissionsApp } from '../../utils/migratePermissions';

export default function PermissionsMigrationTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const handleLog = (message, type) => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runMigration = async () => {
    setIsRunning(true);
    setLogs([]);
    setStats(null);
    setError(null);

    const result = await migratePermissionsApp(handleLog);

    if (result.success) {
      setStats(result.stats);
    } else {
      setError(result.error);
    }

    setIsRunning(false);
  };

  const resetTool = () => {
    setLogs([]);
    setStats(null);
    setError(null);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🔐 Migración de Permisos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Script de inicialización del sistema RBAC para la app móvil
        </Typography>

        {/* Warning */}
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            ⚠️ Advertencia - Leer antes de ejecutar
          </Typography>
          <Typography variant="body2">
            Este script creará la colección <strong>PermissionsApp</strong> y agregará el campo{' '}
            <strong>appRole</strong> a los usuarios existentes.{' '}
            <strong>NO modificará el campo 'role' del dashboard web.</strong>
          </Typography>
        </Alert>

        {/* Info Box */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            📋 Qué hace este script:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Crea la colección <strong>PermissionsApp/{'{uid}'}</strong> para cada usuario</li>
            <li>
              Asigna permisos según el rol actual del dashboard:
              <Box component="ul" sx={{ mt: 0.5 }}>
                <li><strong>ADMIN</strong> → 18 permisos (ADMIN en app)</li>
                <li><strong>EMPLEADO</strong> → 9 permisos (USER en app)</li>
                <li><strong>daruedagu@gmail.com</strong> → 35 permisos (SUPERADMIN en app)</li>
              </Box>
            </li>
            <li>Agrega el campo <strong>appRole</strong> a users/{'{uid}'} (independiente de 'role')</li>
            <li>Registra todos los cambios en el log</li>
          </Box>
        </Alert>

        {/* Action Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={runMigration}
          disabled={isRunning}
          startIcon={isRunning ? <Refresh /> : <CheckCircle />}
          sx={{
            py: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #66408b 100%)',
            }
          }}
        >
          {isRunning ? '⏳ Ejecutando Migración...' : '🚀 Ejecutar Migración'}
        </Button>

        {/* Progress */}
        {isRunning && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Procesando usuarios...
            </Typography>
          </Box>
        )}

        {/* Stats */}
        {stats && !isRunning && (
          <Paper 
            variant="outlined" 
            sx={{ 
              mt: 3, 
              p: 3, 
              background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              border: '2px solid #4caf50'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Migración Completada
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Chip label={`Total: ${stats.total}`} color="primary" />
              <Chip label={`SUPERADMIN: ${stats.superadmin}`} sx={{ bgcolor: '#9c27b0', color: 'white' }} />
              <Chip label={`ADMIN: ${stats.admin}`} sx={{ bgcolor: '#ff9800', color: 'white' }} />
              <Chip label={`USER: ${stats.user}`} sx={{ bgcolor: '#4caf50', color: 'white' }} />
              {stats.errors > 0 && <Chip label={`Errores: ${stats.errors}`} color="error" />}
            </Box>
            <Button onClick={resetTool} sx={{ mt: 2 }} variant="outlined">
              Reiniciar
            </Button>
          </Paper>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight={600}>Error Fatal</Typography>
            <Typography variant="body2">{error}</Typography>
            <Button onClick={resetTool} sx={{ mt: 2 }} size="small" variant="outlined" color="error">
              Reintentar
            </Button>
          </Alert>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Paper 
            variant="outlined" 
            sx={{ 
              mt: 3, 
              maxHeight: 400, 
              overflow: 'auto',
              bgcolor: '#f5f5f5',
              borderRadius: 2
            }}
          >
            <List dense>
              {logs.map((log, index) => (
                <ListItem 
                  key={index}
                  sx={{
                    bgcolor: 
                      log.type === 'success' ? '#e8f5e9' :
                      log.type === 'error' ? '#ffebee' :
                      log.type === 'warning' ? '#fff3cd' :
                      'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                    mx: 1
                  }}
                >
                  <ListItemText
                    primary={log.message}
                    secondary={log.timestamp}
                    primaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: 
                        log.type === 'success' ? '#2e7d32' :
                        log.type === 'error' ? '#c62828' :
                        log.type === 'warning' ? '#856404' :
                        '#1565c0'
                    }}
                    secondaryTypographyProps={{
                      fontSize: 11
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}
