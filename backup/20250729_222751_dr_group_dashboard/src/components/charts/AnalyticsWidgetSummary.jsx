/**
 * Professional Analytics Widget Summary
 * Adapted from Minimal template for DR Group Dashboard
 */

import React from 'react';
import { Box, Card, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { fNumber, fPercent, fShortenNumber } from '../../utils/formatNumber';
import { Chart } from './Chart';
import { useChart } from '../../hooks/useChart';

export function AnalyticsWidgetSummary({
  sx,
  icon,
  title,
  total,
  chart,
  percent,
  color = 'primary',
  ...other
}) {
  const theme = useTheme();

  const chartColors = [theme.palette[color].main];

  const chartOptions = useChart({
    chart: { 
      sparkline: { enabled: true },
      type: 'line',
    },
    colors: chartColors,
    xaxis: { 
      categories: chart?.categories || [] 
    },
    grid: {
      padding: {
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,
      },
    },
    tooltip: {
      y: { 
        formatter: (value) => fNumber(value), 
        title: { formatter: () => '' } 
      },
    },
    markers: {
      strokeWidth: 0,
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    ...(chart?.options || {}),
  });

  const renderTrending = () => {
    if (percent === undefined || percent === null) return null;
    
    return (
      <Box
        sx={{
          top: 16,
          gap: 0.5,
          right: 16,
          display: 'flex',
          position: 'absolute',
          alignItems: 'center',
          color: percent < 0 ? 'error.main' : 'success.main',
        }}
      >
        {percent < 0 ? (
          <TrendingDown sx={{ width: 20, height: 20 }} />
        ) : (
          <TrendingUp sx={{ width: 20, height: 20 }} />
        )}
        <Box component="span" sx={{ typography: 'subtitle2' }}>
          {percent > 0 && '+'}
          {fPercent(percent)}
        </Box>
      </Box>
    );
  };

  return (
    <Card
      sx={[
        () => ({
          p: 3,
          position: 'relative',
          background: `linear-gradient(135deg, ${theme.palette[color].light}15, ${theme.palette[color].main}08)`,
          border: `1px solid ${theme.palette[color].light}30`,
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease-in-out',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* Icon */}
      <Box 
        sx={{ 
          width: 64, 
          height: 64, 
          mb: 3, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: `${color}.main`,
          color: 'common.white',
        }}
      >
        {icon}
      </Box>

      {/* Trending indicator */}
      {renderTrending()}

      {/* Content */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 112 }}>
          <Box sx={{ mb: 1, typography: 'subtitle2', color: 'text.secondary' }}>
            {title}
          </Box>
          <Box sx={{ typography: 'h4', color: 'text.primary' }}>
            {fShortenNumber(total)}
          </Box>
        </Box>

        {/* Chart */}
        {chart?.series && (
          <Chart
            type="line"
            series={[{ data: chart.series }]}
            options={chartOptions}
            width={84}
            height={56}
            sx={{ flexShrink: 0 }}
          />
        )}
      </Box>

      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: -20,
          width: 240,
          height: 240,
          opacity: 0.08,
          zIndex: -1,
          background: `radial-gradient(circle, ${theme.palette[color].main} 0%, transparent 70%)`,
        }}
      />
    </Card>
  );
}
