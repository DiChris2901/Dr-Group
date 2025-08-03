/**
 * Simple Chart Component for DR Group Dashboard
 */

import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

export function Chart({ type, series, options, sx, width = "100%", height = "100%", ...other }) {
  return (
    <Paper
      sx={{
        p: 2,
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        ...sx
      }}
      {...other}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Chart Placeholder
      </Typography>
      <LinearProgress sx={{ width: '80%' }} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Chart Type: {type}
      </Typography>
    </Paper>
  );
}

export default Chart;
