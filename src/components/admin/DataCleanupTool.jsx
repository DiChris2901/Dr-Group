import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

const DataCleanupTool = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Verificar que el usuario sea administrador
  const isAdmin = currentUser?.email === 'diegorodriguezc29@gmail.com'; // Ajusta según tu email de admin

  // Obtener estadísticas antes de limpiar
  const getCleanupStats = async () => {
    try {
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const commitmentsSnapshot = await getDocs(collection(db, 'commitments'));
      
      return {
        payments: paymentsSnapshot.size,
        commitments: commitmentsSnapshot.size
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  };

  // Función para limpiar la colección de pagos
  const cleanupPayments = async () => {
    setLoading(true);
    try {
      // Obtener estadísticas primero
      const currentStats = await getCleanupStats();
      setStats(currentStats);
      
      if (currentStats.payments === 0) {
        addNotification({
          type: 'info',
          title: 'Sin datos',
          message: 'No hay pagos para eliminar',
          icon: 'info'
        });
        setLoading(false);
        return;
      }

      setConfirmDialog(true);
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al obtener datos para limpieza',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar la limpieza confirmada
  const executeCleanup = async () => {
    setLoading(true);
    setConfirmDialog(false);
    
    try {
      // Limpiar pagos
      const paymentsRef = collection(db, 'payments');
      const paymentsSnapshot = await getDocs(paymentsRef);
      
      if (!paymentsSnapshot.empty) {
        // Usar batch para eliminar múltiples documentos
        const batches = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;
        
        paymentsSnapshot.forEach((document) => {
          currentBatch.delete(doc(db, 'payments', document.id));
          operationCount++;
          
          // Firestore limita a 500 operaciones por batch
          if (operationCount === 500) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        });
        
        // Agregar el último batch si tiene operaciones
        if (operationCount > 0) {
          batches.push(currentBatch);
        }
        
        // Ejecutar todos los batches
        for (const batch of batches) {
          await batch.commit();
        }
        
        addNotification({
          type: 'success',
          title: '🧹 Limpieza Completada',
          message: `Se eliminaron ${paymentsSnapshot.size} registros de pagos exitosamente`,
          icon: 'success',
          duration: 8000
        });
      } else {
        addNotification({
          type: 'info',
          title: 'Sin cambios',
          message: 'No había registros de pagos para eliminar',
          icon: 'info'
        });
      }
      
    } catch (error) {
      console.error('Error durante limpieza:', error);
      addNotification({
        type: 'error',
        title: 'Error en limpieza',
        message: 'Ocurrió un error durante la limpieza de datos',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert severity="warning" icon={<WarningIcon />}>
        <Typography variant="body1" fontWeight={600}>
          Acceso Restringido
        </Typography>
        <Typography variant="body2">
          Esta herramienta solo está disponible para administradores.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🧹 Herramienta de Limpieza de Datos
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Esta herramienta permite eliminar todos los datos de prueba de la base de datos.
            <strong> Esta acción no se puede deshacer.</strong>
          </Typography>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              ⚠️ <strong>Precaución:</strong> Esta acción eliminará permanentemente todos los registros de pagos.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="error"
              startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
              onClick={cleanupPayments}
              disabled={loading}
              sx={{
                minWidth: 200,
                py: 1.5,
                fontWeight: 600
              }}
            >
              {loading ? 'Obteniendo datos...' : 'Limpiar Datos de Pagos'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog
        open={confirmDialog}
        onClose={() => !loading && setConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            ⚠️ Confirmar Eliminación de Datos
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              Esta acción eliminará permanentemente los siguientes datos:
            </Typography>
          </Alert>

          {stats && (
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Registros de Pagos"
                  secondary="Todos los pagos registrados en el sistema"
                />
                <Chip 
                  label={`${stats.payments} registros`}
                  color={stats.payments > 0 ? "error" : "default"}
                  size="small"
                />
              </ListItem>
            </List>
          )}

          <Typography variant="body2" sx={{ mt: 2, fontWeight: 500, color: 'error.main' }}>
            ⚠️ Esta acción NO se puede deshacer. ¿Estás seguro?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setConfirmDialog(false)} 
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={executeCleanup} 
            disabled={loading}
            variant="contained" 
            color="error"
            startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataCleanupTool;
