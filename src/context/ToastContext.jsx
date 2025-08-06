import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, severity = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      severity,
      duration,
      open: true,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const value = {
    success,
    error,
    warning,
    info,
    showToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000 }}>
        <AnimatePresence>
          {toasts.map((toast, index) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{ 
                marginBottom: '12px',
                maxWidth: '400px',
              }}
            >
              <Alert
                severity={toast.severity}
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => hideToast(toast.id)}
                  >
                    <Close fontSize="inherit" />
                  </IconButton>
                }
                sx={{
                  background: theme => theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                  '& .MuiAlert-icon': {
                    fontSize: '1.5rem',
                  },
                  '& .MuiAlert-message': {
                    fontWeight: 500,
                    fontSize: '0.95rem',
                  }
                }}
              >
                {toast.message}
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
