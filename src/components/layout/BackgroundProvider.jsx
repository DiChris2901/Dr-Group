import React, { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useSettings } from '../../context/SettingsContext';

const BackgroundProvider = ({ children }) => {
  const theme = useTheme();
  const { settings } = useSettings();

  useEffect(() => {
    // Aplicar el fondo del tema al body
    const body = document.body;
    const html = document.documentElement;
    
    // Usar el fondo simple del tema sin elementos decorativos
    body.style.background = theme.palette.background.default;
    body.style.color = theme.palette.text.primary;
    body.style.transition = 'background 0.3s ease, color 0.3s ease';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.minHeight = '100vh';
    
    html.style.background = theme.palette.background.default;
    html.style.transition = 'background 0.3s ease';
    
    // Cleanup function
    return () => {
      // No cleanup necesario ya que el theme provider manejará los cambios
    };
  }, [theme.palette.background.default, theme.palette.text.primary, theme.palette.mode]);

  return <>{children}</>;
};

export default BackgroundProvider;
