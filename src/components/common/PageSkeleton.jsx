import { Box, Grid, Paper, Skeleton } from '@mui/material';

/**
 * PageSkeleton - Componente de carga reutilizable
 *
 * Reemplaza spinners, texto y barras de carga en todas las páginas.
 * Imita el layout real: header gradiente → KPI cards → área de contenido.
 *
 * @param {'default'|'table'|'cards'|'form'} variant - Tipo de contenido de la página
 * @param {number} kpiCount - Número de tarjetas KPI (0 para omitirlas)
 * @param {number} rows     - Filas de tabla o cantidad de cards
 */
const PageSkeleton = ({ variant = 'default', kpiCount = 4, rows = 8 }) => {
  const kpiMd = Math.max(2, Math.floor(12 / Math.max(1, kpiCount)));

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1400px', mx: 'auto' }}>

      {/* ── Header gradiente ─────────────────────────────────────────── */}
      <Skeleton
        variant="rectangular"
        height={120}
        animation="wave"
        sx={{ borderRadius: 2, mb: 3 }}
      />

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      {kpiCount > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: kpiCount }).map((_, i) => (
            <Grid item xs={12} sm={6} md={kpiMd} key={i}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(33,150,243,0.15)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={44} height={44} animation="wave" />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="55%" height={32} animation="wave" />
                    <Skeleton variant="text" width="80%" height={18} animation="wave" />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Contenido: tabla ─────────────────────────────────────────── */}
      {variant === 'table' && (
        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: '1px solid rgba(33,150,243,0.1)', overflow: 'hidden' }}
        >
          {/* Barra de filtros */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              gap: 2,
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Skeleton variant="rectangular" height={40} width={220} sx={{ borderRadius: 1 }} animation="wave" />
            <Skeleton variant="rectangular" height={40} width={160} sx={{ borderRadius: 1 }} animation="wave" />
            <Skeleton variant="rectangular" height={40} width={120} sx={{ borderRadius: 1, ml: 'auto' }} animation="wave" />
          </Box>

          {/* Filas */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Array.from({ length: rows }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={32} height={32} animation="wave" />
                <Skeleton variant="text" width="25%" animation="wave" />
                <Skeleton variant="text" width="20%" animation="wave" />
                <Skeleton variant="text" width="15%" animation="wave" />
                <Skeleton variant="text" width="15%" animation="wave" />
                <Skeleton variant="rounded" width={72} height={24} sx={{ ml: 'auto' }} animation="wave" />
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* ── Contenido: grid de cards ──────────────────────────────────── */}
      {variant === 'cards' && (
        <Grid container spacing={2}>
          {Array.from({ length: rows }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper
                elevation={0}
                sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(33,150,243,0.15)' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} animation="wave" />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={24} animation="wave" />
                    <Skeleton variant="text" width="50%" height={18} animation="wave" />
                  </Box>
                </Box>
                <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} animation="wave" />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Contenido: formulario ─────────────────────────────────────── */}
      {variant === 'form' && (
        <Paper
          elevation={0}
          sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(33,150,243,0.1)' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={56}
                sx={{ borderRadius: 1 }}
                animation="wave"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* ── Contenido: bloque genérico ────────────────────────────────── */}
      {variant === 'default' && (
        <Skeleton
          variant="rectangular"
          height={400}
          animation="wave"
          sx={{ borderRadius: 2 }}
        />
      )}
    </Box>
  );
};

export default PageSkeleton;
