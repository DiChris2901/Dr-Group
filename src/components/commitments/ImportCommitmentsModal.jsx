/**
 * 📥 Import Commitments Modal - DR Group Dashboard
 * Modal para importación masiva de compromisos desde Excel
 * Design System Spectacular aplicado
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  AlertTitle,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Check,
  Error,
  Warning,
  Close,
  ExpandMore,
  ExpandLess,
  Download,
  Info
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useThemeGradients } from '../../utils/designSystem';
import { 
  parseExcelFile, 
  previewImportData, 
  batchCreateCommitments 
} from '../../utils/excelImporter';
import { fCurrency } from '../../utils/formatUtils';

const STEPS = ['Cargar Archivo', 'Previsualizar Datos', 'Importar'];

const ImportCommitmentsModal = ({ open, onClose, onImportComplete }) => {
  const theme = useTheme();
  const gradients = useThemeGradients();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  
  // Estados del wizard
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  // Configuración de dropzone
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await parseExcelFile(file);
      
      if (result.success) {
        setParsedData(result);
        addNotification({
          type: 'success',
          title: '✅ Archivo cargado exitosamente',
          message: `Se encontraron ${result.totalRows} filas para importar`
        });
        setActiveStep(1);
      } else {
        addNotification({
          type: 'error',
          title: '❌ Error al cargar archivo',
          message: result.error
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: '❌ Error procesando archivo',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: loading,
    noClick: false, // Permitir clicks
    noKeyboard: false // Permitir teclado
  });

  // Generar preview de datos
  const handlePreviewData = async () => {
    if (!parsedData) return;

    setLoading(true);
    try {
      const preview = await previewImportData(parsedData.data);
      setPreviewData(preview);
      setActiveStep(2);
    } catch (error) {
      addNotification({
        type: 'error',
        title: '❌ Error generando preview',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar importación
  const handleImport = async () => {
    if (!parsedData) return;

    setLoading(true);
    setImportProgress(0);
    
    try {
      const results = await batchCreateCommitments(
        parsedData.data,
        currentUser,
        (progress) => {
          setImportProgress(progress.percentage);
        }
      );
      
      setImportResults(results);
      
      if (results.success > 0) {
        addNotification({
          type: 'success',
          title: '🎉 Importación completada',
          message: `Se importaron exitosamente ${results.success} compromisos`
        });
        
        // Notificar al componente padre
        onImportComplete?.(results);
      }
      
      if (results.errors > 0) {
        addNotification({
          type: 'warning',
          title: '⚠️ Importación con errores',
          message: `${results.errors} filas no pudieron ser importadas`
        });
      }
      
    } catch (error) {
      addNotification({
        type: 'error',
        title: '❌ Error durante importación',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset modal
  const handleClose = () => {
    setActiveStep(0);
    setParsedData(null);
    setPreviewData(null);
    setImportResults(null);
    setImportProgress(0);
    setShowErrors(false);
    setShowWarnings(false);
    onClose();
  };

  // Componente DropZone
  const DropZone = () => (
    <Box
      {...getRootProps()}
      sx={{
        border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: 3,
        p: 6,
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`
          : 'transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          transform: 'scale(1.02)',
          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`
        }
      }}
    >
      <input {...getInputProps()} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: 'none' }}
      >
        <CloudUpload 
          sx={{ 
            fontSize: 64, 
            color: theme.palette.primary.main,
            mb: 2
          }} 
        />
        
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          o haz clic para seleccionar
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Formatos soportados: .xlsx, .xls, .csv
        </Typography>
      </motion.div>
    </Box>
  );

  // Componente Preview Table
  const PreviewTable = () => {
    if (!previewData) return null;

    const validRows = previewData.filter(row => row.validation.isValid);
    const errorRows = previewData.filter(row => !row.validation.isValid);
    const warningRows = previewData.filter(row => row.validation.warnings.length > 0);

    return (
      <Box>
        {/* Estadísticas */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            icon={<Check />} 
            label={`${validRows.length} Válidas`} 
            color="success" 
            variant="outlined"
          />
          <Chip 
            icon={<Error />} 
            label={`${errorRows.length} Errores`} 
            color="error" 
            variant="outlined"
          />
          <Chip 
            icon={<Warning />} 
            label={`${warningRows.length} Advertencias`} 
            color="warning" 
            variant="outlined"
          />
        </Box>

        {/* Tabla de preview */}
        <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fila</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row) => (
                <TableRow 
                  key={row.rowIndex}
                  sx={{ 
                    backgroundColor: !row.validation.isValid 
                      ? alpha(theme.palette.error.main, 0.1)
                      : row.validation.warnings.length > 0
                      ? alpha(theme.palette.warning.main, 0.1)
                      : 'transparent'
                  }}
                >
                  <TableCell>{row.rowIndex}</TableCell>
                  <TableCell>{row.data.empresa}</TableCell>
                  <TableCell>{row.data.concepto}</TableCell>
                  <TableCell>{fCurrency(row.data.valor)}</TableCell>
                  <TableCell>{row.data.fechaVencimiento}</TableCell>
                  <TableCell>
                    {row.validation.isValid ? (
                      <Chip icon={<Check />} label="Válida" color="success" size="small" />
                    ) : (
                      <Chip icon={<Error />} label="Error" color="error" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Errores y advertencias */}
        {errorRows.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              startIcon={showErrors ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowErrors(!showErrors)}
              color="error"
              size="small"
            >
              Ver errores ({errorRows.length})
            </Button>
            <Collapse in={showErrors}>
              <Alert severity="error" sx={{ mt: 1 }}>
                <AlertTitle>Errores encontrados</AlertTitle>
                <List dense>
                  {errorRows.flatMap(row => 
                    row.validation.errors.map((error, idx) => (
                      <ListItem key={`${row.rowIndex}-${idx}`}>
                        <ListItemIcon><Error fontSize="small" /></ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))
                  )}
                </List>
              </Alert>
            </Collapse>
          </Box>
        )}

        {warningRows.length > 0 && (
          <Box>
            <Button
              startIcon={showWarnings ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowWarnings(!showWarnings)}
              color="warning"
              size="small"
            >
              Ver advertencias ({warningRows.length})
            </Button>
            <Collapse in={showWarnings}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <AlertTitle>Advertencias</AlertTitle>
                <List dense>
                  {warningRows.flatMap(row => 
                    row.validation.warnings.map((warning, idx) => (
                      <ListItem key={`${row.rowIndex}-${idx}`}>
                        <ListItemIcon><Warning fontSize="small" /></ListItemIcon>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))
                  )}
                </List>
              </Alert>
            </Collapse>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 95%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          boxShadow: `0 25px 50px ${alpha(theme.palette.common.black, 0.3)}`
        }
      }}
    >
      <DialogTitle sx={{ 
        background: gradients.primary,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Description />
        <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
          Importar Compromisos desde Excel
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton 
          onClick={handleClose}
          sx={{ color: 'white' }}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Instrucciones */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Formato requerido del Excel</AlertTitle>
          <Typography variant="body2">
            <strong>Columnas esperadas (en orden):</strong><br />
            A: Empresa | B: Mes | C: Año | D: Fecha Vencimiento | E: Periodicidad | 
            F: Beneficiario | G: Concepto | H: Valor | I: Método Pago | J: Pago Aplazado | K: Observaciones
          </Typography>
        </Alert>

        {/* Contenido según step */}
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DropZone />
              
              {/* Botón alternativo para seleccionar archivo */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={loading}
                  sx={{
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    py: 1.5,
                    px: 3
                  }}
                >
                  Seleccionar Archivo Excel
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onDrop([file]);
                      }
                    }}
                  />
                </Button>
              </Box>
              
              {parsedData && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Archivo "{parsedData.fileName}" cargado exitosamente. 
                  Se encontraron {parsedData.totalRows} filas.
                </Alert>
              )}
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {previewData ? (
                <PreviewTable />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Generando preview de los datos...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="import"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Importando compromisos... {importProgress}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={importProgress} 
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Por favor no cierres esta ventana
                  </Typography>
                </Box>
              ) : importResults ? (
                <Alert 
                  severity={importResults.errors > 0 ? 'warning' : 'success'}
                  sx={{ mb: 2 }}
                >
                  <AlertTitle>Importación completada</AlertTitle>
                  <Typography>
                    ✅ {importResults.success} compromisos importados exitosamente<br />
                    {importResults.errors > 0 && `❌ ${importResults.errors} errores encontrados`}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info">
                  <AlertTitle>Listo para importar</AlertTitle>
                  Se importarán {parsedData?.totalRows || 0} compromisos a la base de datos.
                  Esta acción no se puede deshacer.
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        {loading && activeStep !== 2 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(4px)',
              zIndex: 1000
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <LinearProgress sx={{ mb: 2, width: 200 }} />
              <Typography>Procesando...</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
        >
          {importResults ? 'Cerrar' : 'Cancelar'}
        </Button>
        
        {activeStep === 1 && (
          <Button
            onClick={handlePreviewData}
            variant="contained"
            disabled={!parsedData || loading}
            startIcon={<Info />}
          >
            Generar Preview
          </Button>
        )}
        
        {activeStep === 2 && !importResults && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!previewData || loading}
            startIcon={<CloudUpload />}
            color="success"
          >
            Importar Compromisos
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportCommitmentsModal;
