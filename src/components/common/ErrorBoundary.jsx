import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * ErrorBoundary — Catches unhandled JS errors in child component tree.
 * Displays a clean MUI-styled fallback and allows retry.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <PageContent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
          p={3}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 480,
              textAlign: 'center',
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.error.light}`,
              bgcolor: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(211,47,47,0.08)'
                : 'rgba(211,47,47,0.04)',
            }}
          >
            <ErrorOutlineIcon
              sx={{ fontSize: 56, color: 'error.main', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Algo salió mal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.error?.message || 'Ocurrió un error inesperado al cargar esta sección.'}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              sx={{ borderRadius: 1 }}
            >
              Reintentar
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
