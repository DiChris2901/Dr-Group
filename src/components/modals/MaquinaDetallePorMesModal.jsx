import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Paper,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  alpha
} from '@mui/material';
import { Close as CloseIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const formatPeriodoLabel = (periodoLiquidacion) => {
  if (!periodoLiquidacion || typeof periodoLiquidacion !== 'string') return 'N/A';
  if (!periodoLiquidacion.includes('_')) return periodoLiquidacion;

  const parts = periodoLiquidacion.split('_').filter(Boolean);
  if (parts.length < 2) return periodoLiquidacion;

  const year = parts[parts.length - 1];
  const monthRaw = parts.slice(0, -1).join(' ');
  const month = monthRaw
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');

  return `${month} ${year}`;
};

const periodoScore = (periodoLiquidacion) => {
  if (!periodoLiquidacion || typeof periodoLiquidacion !== 'string') return null;
  if (!periodoLiquidacion.includes('_')) return null;

  const parts = periodoLiquidacion.split('_').filter(Boolean);
  if (parts.length < 2) return null;

  const year = Number.parseInt(parts[parts.length - 1], 10);
  if (!Number.isFinite(year)) return null;

  const monthStr = parts.slice(0, -1).join('_').toLowerCase();
  const monthMap = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11
  };

  const monthIndex = Object.prototype.hasOwnProperty.call(monthMap, monthStr) ? monthMap[monthStr] : null;
  if (monthIndex === null) return null;

  return year * 12 + monthIndex;
};

const pickNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const matchMachine = (m, selection) => {
  if (!m || !selection) return false;

  const serial = (m.serial || m.Serial || '').toString().trim();
  const nuc = (m.nuc ?? m.NUC ?? '').toString().trim();

  const selSerial = (selection.serial || '').toString().trim();
  const selNuc = (selection.nuc || '').toString().trim();

  if (selSerial && serial && selSerial === serial) return true;
  if (selNuc && nuc && selNuc === nuc) return true;

  return false;
};

const extractMachineMetrics = (doc, machineSelection) => {
  const datos = Array.isArray(doc?.datosConsolidados) ? doc.datosConsolidados : [];
  const machine = datos.find((m) => matchMachine(m, machineSelection));
  if (!machine) {
    return {
      found: false,
      produccion: 0,
      impuestos: 0,
      derechosExplotacion: 0,
      gastosAdministracion: 0
    };
  }

  return {
    found: true,
    produccion: pickNumber(machine?.produccion),
    impuestos: pickNumber(machine?.totalImpuestos ?? machine?.impuestos),
    derechosExplotacion: pickNumber(machine?.derechosExplotacion),
    gastosAdministracion: pickNumber(machine?.gastosAdministracion)
  };
};

const MaquinaDetallePorMesModal = ({
  open,
  onClose,
  empresaNombre,
  salaNombre,
  salaNormalizado,
  machineSelection,
  periodosLiquidacion = [],
  liquidacionesPorSala = []
}) => {
  const theme = useTheme();

  const formatCurrencyTick = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}MM`;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${Math.round(n).toLocaleString()}`;
  };

  const rows = useMemo(() => {
    if (!machineSelection) return [];
    if (!salaNombre) return [];
    if (!Array.isArray(periodosLiquidacion) || !Array.isArray(liquidacionesPorSala)) return [];

    const periodosOrdenados = [...periodosLiquidacion]
      .filter((p) => typeof p === 'string' && p.trim())
      .sort((a, b) => {
        const sa = periodoScore(a);
        const sb = periodoScore(b);
        if (sa === null && sb === null) return String(a).localeCompare(String(b));
        if (sa === null) return -1;
        if (sb === null) return 1;
        return sa - sb;
      });

    const docsSala = liquidacionesPorSala.filter((d) => {
      const p = d?.fechas?.periodoLiquidacion;
      if (!p) return false;
      const salaNormDoc = d?.sala?.normalizado;
      if (salaNormalizado && salaNormDoc) return salaNormDoc === salaNormalizado;
      const salaNombreDoc = d?.sala?.nombre;
      return salaNombreDoc === salaNombre;
    });

    const docByPeriodo = new Map();
    docsSala.forEach((d) => {
      const p = d?.fechas?.periodoLiquidacion;
      if (!p) return;
      if (!docByPeriodo.has(p)) docByPeriodo.set(p, d);
    });

    const computed = periodosOrdenados.map((p) => {
      const doc = docByPeriodo.get(p);
      const m = extractMachineMetrics(doc, machineSelection);

      return {
        periodoLiquidacion: p,
        periodoLabel: formatPeriodoLabel(p),
        found: m.found,
        produccion: m.produccion,
        impuestos: m.impuestos,
        derechosExplotacion: m.derechosExplotacion,
        gastosAdministracion: m.gastosAdministracion
      };
    });

    return computed.map((r, idx) => {
      if (idx === 0) return { ...r, cambioPct: null };
      const prev = computed[idx - 1];
      const base = prev?.produccion || 0;
      if (!base) return { ...r, cambioPct: null };
      return { ...r, cambioPct: ((r.produccion - base) / base) * 100 };
    });
  }, [machineSelection, salaNombre, salaNormalizado, periodosLiquidacion, liquidacionesPorSala]);

  const resumen = useMemo(() => {
    if (!rows.length) return null;

    const totalProduccion = rows.reduce((acc, r) => acc + (r.produccion || 0), 0);
    const totalImpuestos = rows.reduce((acc, r) => acc + (r.impuestos || 0), 0);
    const totalDerechos = rows.reduce((acc, r) => acc + (r.derechosExplotacion || 0), 0);
    const totalGastos = rows.reduce((acc, r) => acc + (r.gastosAdministracion || 0), 0);

    const ultimo = rows[rows.length - 1];
    return {
      totalProduccion,
      totalImpuestos,
      totalDerechos,
      totalGastos,
      ultimoPeriodo: ultimo?.periodoLabel,
      ultimoProduccion: ultimo?.produccion || 0
    };
  }, [rows]);

  const CARD_STYLES = {
    primary: {
      p: 3,
      borderRadius: 2,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      background: theme.palette.background.paper,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    secondary: {
      p: 3.5,
      borderRadius: 2,
      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
      background: theme.palette.background.paper,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }
  };

  const OVERLINE_STYLES = {
    primary: {
      fontWeight: 600,
      color: 'primary.main',
      letterSpacing: 0.8,
      fontSize: '0.75rem'
    },
    secondary: {
      fontWeight: 600,
      color: 'secondary.main',
      letterSpacing: 0.8,
      fontSize: '0.75rem'
    }
  };

  const machineLabel = machineSelection
    ? `Serial: ${machineSelection.serial || 'N/A'} · NUC: ${machineSelection.nuc || 'N/A'}`
    : 'Máquina';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
        }
      }}
    >
      <DialogTitle sx={{
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark'
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <VisibilityIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
              Detalle por mes de la máquina
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Empresa: {empresaNombre || 'N/A'} · Sala: {salaNombre || 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {machineLabel}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 5 }}>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={CARD_STYLES.primary}>
                <Typography variant="overline" sx={OVERLINE_STYLES.primary}>
                  Detalle por mes
                </Typography>

                {!rows.length ? (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                    No hay información mensual disponible para esta máquina en el rango actual.
                  </Alert>
                ) : (
                  <>
                    <Box
                      sx={{
                        mt: 2,
                        height: 240,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        p: 1.5
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                          <CartesianGrid stroke={alpha(theme.palette.text.primary, 0.08)} vertical={false} />
                          <XAxis
                            dataKey="periodoLabel"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                            axisLine={{ stroke: alpha(theme.palette.text.primary, 0.16) }}
                            tickLine={{ stroke: alpha(theme.palette.text.primary, 0.16) }}
                          />
                          <YAxis
                            tickFormatter={formatCurrencyTick}
                            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                            axisLine={{ stroke: alpha(theme.palette.text.primary, 0.16) }}
                            tickLine={{ stroke: alpha(theme.palette.text.primary, 0.16) }}
                            width={72}
                          />
                          <Tooltip
                            formatter={(value, name) => [formatCurrencyTick(value), name]}
                            contentStyle={{
                              borderRadius: 8,
                              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar
                            name="Producción"
                            dataKey="produccion"
                            fill={theme.palette.primary.main}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={32}
                          />
                          <Bar
                            name="Impuestos"
                            dataKey="impuestos"
                            fill={theme.palette.secondary.main}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={32}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>

                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Mes</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Producción</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>% vs mes anterior</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Impuestos</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Derechos</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Gastos adm.</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((r, idx) => (
                            <TableRow
                              key={r.periodoLiquidacion || idx}
                              sx={{
                                backgroundColor: idx % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent'
                              }}
                            >
                              <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>
                                {r.periodoLabel}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: 'primary.main' }}>
                                ${Math.round(r.produccion).toLocaleString()}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 12 }}>
                                {r.cambioPct === null
                                  ? 'N/A'
                                  : `${r.cambioPct > 0 ? '+' : ''}${r.cambioPct.toFixed(1)}%`}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 12 }}>
                                ${Math.round(r.impuestos).toLocaleString()}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 12 }}>
                                ${Math.round(r.derechosExplotacion).toLocaleString()}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 12 }}>
                                ${Math.round(r.gastosAdministracion).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={CARD_STYLES.secondary}>
                <Typography variant="overline" sx={OVERLINE_STYLES.secondary}>
                  Resumen
                </Typography>

                {!resumen ? (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                    Sin datos para mostrar.
                  </Alert>
                ) : (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[
                      { label: 'Producción (rango)', value: resumen.totalProduccion, color: theme.palette.secondary.main },
                      { label: 'Impuestos (rango)', value: resumen.totalImpuestos, color: theme.palette.secondary.main },
                      { label: 'Derechos (rango)', value: resumen.totalDerechos, color: theme.palette.secondary.main },
                      { label: 'Gastos adm. (rango)', value: resumen.totalGastos, color: theme.palette.secondary.main }
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          backgroundColor: alpha(item.color, 0.04),
                          border: `1px solid ${alpha(item.color, 0.2)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: 'text.secondary',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase'
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          ${Math.round(item.value).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}

                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      Último mes considerado: {resumen.ultimoPeriodo || 'N/A'}
                    </Alert>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'flex-end' }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 1, fontWeight: 600, px: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaquinaDetallePorMesModal;
