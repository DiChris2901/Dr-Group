/**
 * Simple Analytics Widget Summary for DR Group Dashboard
 */

import React from 'react';
import { Box, Card, Typography, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { formatNumber } from '../../utils/formatNumber';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          py: 2,
          px: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          ...sx,
        }}
        {...other}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: `${color}.lighter`,
              color: `${color}.main`,
              mr: 2,
              width: 56,
              height: 56
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight="600">
              {typeof total === 'number' ? formatNumber(total) : total}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            {percent && (
              <Typography 
                variant="caption" 
                color={percent > 0 ? 'success.main' : 'error.main'}
              >
                {percent > 0 ? '+' : ''}{percent}%
              </Typography>
            )}
          </Box>
        </Box>
      </Card>
    </motion.div>
  );
}

export default AnalyticsWidgetSummary;
