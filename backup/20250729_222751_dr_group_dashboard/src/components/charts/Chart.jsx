/**
 * Professional Chart Component
 * Adapted from Minimal template for DR Group Dashboard
 */

import { lazy, Suspense } from 'react';
import { styled } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';

// Lazy load ApexCharts
const LazyChart = lazy(() =>
  import('react-apexcharts').then((module) => ({ default: module.default }))
);

export function Chart({ type, series, options, sx, width = "100%", height = "100%", ...other }) {
  const renderFallback = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: 200,
      }}
    >
      <CircularProgress size={40} />
    </Box>
  );

  return (
    <ChartRoot sx={sx} {...other}>
      <Suspense fallback={renderFallback()}>
        <LazyChart
          type={type}
          series={series}
          options={options}
          width={width}
          height={height}
        />
      </Suspense>
    </ChartRoot>
  );
}

const ChartRoot = styled('div')(({ theme }) => ({
  width: '100%',
  flexShrink: 0,
  position: 'relative',
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
}));
