/**
 * Simple Chart Hook for DR Group Dashboard
 */

import { useTheme } from '@mui/material/styles';

export function useChart(updatedOptions = {}) {
  const theme = useTheme();
  
  const baseOptions = {
    chart: {
      background: 'transparent',
      fontFamily: theme.typography.fontFamily,
      foreColor: theme.palette.text.secondary,
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
    },
  };

  // Simple merge function
  const mergeOptions = (base, updates) => {
    return { ...base, ...updates };
  };

  return mergeOptions(baseOptions, updatedOptions);
}
    fontWeight: theme.typography.subtitle2.fontWeight,
  };

  const LABEL_VALUE = {
    offsetY: 8,
    color: theme.palette.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
  };

  return {
    // Chart configuration
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      parentHeightOffset: 0,
      fontFamily: theme.typography.fontFamily,
      foreColor: theme.palette.text.disabled,
      animations: {
        enabled: true,
        speed: 360,
        animateGradually: { enabled: true, delay: 120 },
        dynamicAnimation: { enabled: true, speed: 360 },
      },
    },

    // Colors based on theme
    colors: [
      theme.palette.primary.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
      theme.palette.success.main,
      theme.palette.warning.dark,
      theme.palette.success.dark,
      theme.palette.info.dark,
    ],

    // States
    states: {
      hover: { filter: { type: 'darken' } },
      active: { filter: { type: 'darken' } },
    },

    // Fill
    fill: {
      opacity: 1,
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100],
      },
    },

    // Data labels
    dataLabels: { enabled: false },

    // Stroke
    stroke: {
      width: 3,
      curve: 'smooth',
      lineCap: 'round',
    },

    // Grid
    grid: {
      strokeDashArray: 3,
      borderColor: theme.palette.divider,
      xaxis: {
        lines: { show: false },
      },
    },

    // Xaxis
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: theme.palette.text.disabled,
        },
      },
    },

    // Yaxis
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.disabled,
        },
      },
    },

    // Markers
    markers: {
      size: 0,
      strokeColors: theme.palette.background.paper,
    },

    // Tooltip
    tooltip: {
      theme: theme.palette.mode,
      fillSeriesColor: false,
      style: {
        fontSize: theme.typography.body2.fontSize,
      },
    },

    // Legend
    legend: {
      show: true,
      fontSize: String(theme.typography.subtitle2.fontSize),
      fontWeight: String(theme.typography.subtitle2.fontWeight),
      labels: {
        colors: theme.palette.text.primary,
      },
      itemMargin: {
        horizontal: 12,
      },
    },

    // Responsive
    responsive: [
      {
        breakpoint: theme.breakpoints.values.sm,
        options: {
          legend: {
            position: 'bottom',
            horizontalAlign: 'center',
          },
        },
      },
    ],
  };
};
