import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Person,
  Schedule,
  Info,
  Assignment,
  Security,
  Payment,
  Assessment,
  Business,
  Visibility
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

/**
 * Tabla de logs de actividad con diseño sobrio y profesional
 * Muestra información detallada de cada acción registrada
 */
const ActivityLogTable = ({ logs, loading }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRow, setExpandedRow] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleExpand = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  // Función para obtener icono según el tipo de acción
  const getActionIcon = (action) => {
    const iconMap = {
      'create_commitment': <Assignment color="success" />,
      'update_commitment': <Assignment color="warning" />,
      'delete_commitment': <Assignment color="error" />,
      'create_payment': <Payment color="success" />,
      'update_payment': <Payment color="warning" />,
      'delete_payment': <Payment color="error" />,
      'view_report': <Assessment color="info" />,
      'download_report': <Assessment color="primary" />,
      'export_data': <Assessment color="secondary" />,
      'login': <Security color="success" />,
      'logout': <Security color="error" />,
      'profile_update': <Person color="info" />
    };
    return iconMap[action] || <Info color="default" />;
  };

  // Función para obtener color del chip según el tipo de acción
  const getActionColor = (action) => {
    if (action.includes('create')) return 'success';
    if (action.includes('update')) return 'warning';
    if (action.includes('delete')) return 'error';
    if (action.includes('view') || action.includes('download')) return 'info';
    if (action === 'login') return 'success';
    if (action === 'logout') return 'error';
    return 'default';
  };

  // Función para formatear el tipo de acción para mostrar
  const formatAction = (action) => {
    const actionMap = {
      'create_commitment': 'Crear Compromiso',
      'update_commitment': 'Editar Compromiso',
      'delete_commitment': 'Eliminar Compromiso',
      'create_payment': 'Registrar Pago',
      'update_payment': 'Editar Pago',
      'delete_payment': 'Eliminar Pago',
      'view_report': 'Ver Reporte',
      'download_report': 'Descargar Reporte',
      'export_data': 'Exportar Datos',
      'login': 'Iniciar Sesión',
      'logout': 'Cerrar Sesión',
      'profile_update': 'Actualizar Perfil'
    };
    return actionMap[action] || action.replace('_', ' ').toUpperCase();
  };

  // Función para obtener color del rol
  const getRoleColor = (role) => {
    const roleColors = {
      'admin': 'error',
      'super_admin': 'secondary',
      'user': 'primary',
      'viewer': 'info'
    };
    return roleColors[role] || 'default';
  };

  const formatRole = (role) => {
    const roleMap = {
      'admin': 'Admin',
      'super_admin': 'Super Admin',
      'user': 'Usuario',
      'viewer': 'Solo Lectura'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Cargando logs de actividad...
        </Typography>
      </Box>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay logs de actividad para mostrar
        </Typography>
      </Box>
    );
  }

  const displayedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <TableContainer component={Paper} sx={{ 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.8)
        }
      }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                Usuario
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                Acción
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                Entidad
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                Fecha y Hora
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                Detalles
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedLogs.map((log, index) => (
              <React.Fragment key={log.id || index}>
                <TableRow
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  {/* Usuario */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '0.875rem'
                        }}
                      >
                        {log.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {log.userName || 'Usuario desconocido'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.userEmail}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={formatRole(log.userRole)}
                            color={getRoleColor(log.userRole)}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.75rem' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Acción */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getActionIcon(log.action)}
                      <Box>
                        <Chip
                          label={formatAction(log.action)}
                          color={getActionColor(log.action)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Tipo de entidad */}
                  <TableCell>
                    <Chip
                      label={log.entityType?.toUpperCase() || 'N/A'}
                      color="default"
                      size="small"
                      variant="filled"
                      sx={{ 
                        bgcolor: alpha(theme.palette.text.primary, 0.08),
                        color: theme.palette.text.primary
                      }}
                    />
                  </TableCell>

                  {/* Fecha y hora */}
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {log.timestamp ? format(log.timestamp, 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.timestamp ? format(log.timestamp, 'HH:mm:ss', { locale: es }) : 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Botón de detalles */}
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleExpand(log.id)}
                        sx={{
                          color: theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        {expandedRow === log.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>

                {/* Fila expandible con detalles */}
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                    <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                      <Box sx={{ 
                        margin: 2, 
                        p: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Detalles de la Actividad
                        </Typography>
                        
                        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                          {log.entityId && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">ID Entidad:</Typography>
                              <Typography variant="body2" fontFamily="monospace">{log.entityId}</Typography>
                            </Box>
                          )}
                          
                          {log.details?.url && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">URL:</Typography>
                              <Typography variant="body2">{log.details.url}</Typography>
                            </Box>
                          )}
                          
                          {log.details?.commitmentAmount && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Monto:</Typography>
                              <Typography variant="body2" color="success.main" fontWeight={500}>
                                ${log.details.commitmentAmount.toLocaleString('es-CO')}
                              </Typography>
                            </Box>
                          )}
                          
                          {log.details?.companyName && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Empresa:</Typography>
                              <Typography variant="body2">{log.details.companyName}</Typography>
                            </Box>
                          )}
                          
                          {log.details?.userAgent && (
                            <Box sx={{ gridColumn: '1 / -1' }}>
                              <Typography variant="caption" color="text.secondary">Navegador:</Typography>
                              <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                                {log.details.userAgent}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={logs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          '& .MuiTablePagination-toolbar': {
            paddingX: 2
          }
        }}
      />
    </motion.div>
  );
};

export default ActivityLogTable;
