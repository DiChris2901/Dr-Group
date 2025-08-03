import React from 'react';
import { Box, Typography, Card, CardContent, Divider } from '@mui/material';
import { useUserStats } from '../../hooks/useUserStats';
import { useAuth } from '../../context/AuthContext';

const UserStatsDebug = () => {
  const { user } = useAuth();
  const stats = useUserStats();

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Debug - User Stats
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" component="pre" sx={{ mb: 2 }}>
            Current User ID: {user?.uid || 'No user'}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ mb: 2 }}>
            Loading: {stats.loading ? 'true' : 'false'}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ mb: 2 }}>
            Error: {stats.error || 'none'}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ mb: 2 }}>
            Active Commitments: {stats.activeCommitments}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ mb: 2 }}>
            Total Payments: {stats.totalPayments}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ mb: 2 }}>
            Reports Generated: {stats.reportsGenerated}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ mb: 2 }}>
            Recent Activity Count: {stats.recentActivity?.length || 0}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
            Recent Activity Data:
            {JSON.stringify(stats.recentActivity, null, 2)}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserStatsDebug;
