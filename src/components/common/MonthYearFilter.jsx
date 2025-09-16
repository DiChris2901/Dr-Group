import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  DateRange as DateIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { startOfMonth, endOfMonth } from 'date-fns';

const MonthYearFilter = ({ 
  selectedMonth, 
  selectedYear,
  onMonthChange,
  onYearChange,
  sx = {},
  includeAll = true 
}) => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  // Generar años (desde hace 5 años hasta 2 años en el futuro)
  const availableYears = [];
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    availableYears.push(i);
  }

  // Meses del año
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      backgroundColor: theme.palette.background.paper,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      },
      '&.Mui-focused': {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
      }
    }
  };

  return (
    <Grid container spacing={1.5} sx={sx}>
      {/* Selector de Mes */}
      <Grid item xs={6}>
        <FormControl fullWidth sx={fieldStyles}>
          <InputLabel>Mes</InputLabel>
          <Select
            value={selectedMonth || 'all'}
            onChange={(e) => onMonthChange(e.target.value)}
            label="Mes"
            startAdornment={
              <InputAdornment position="start">
                <CalendarIcon color="primary" sx={{ fontSize: 20 }} />
              </InputAdornment>
            }
          >
            {includeAll && (
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  Todos
                </Box>
              </MenuItem>
            )}
            
            {months.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                  {month.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Selector de Año */}
      <Grid item xs={6}>
        <FormControl fullWidth sx={fieldStyles}>
          <InputLabel>Año</InputLabel>
          <Select
            value={selectedYear || 'all'}
            onChange={(e) => onYearChange(e.target.value)}
            label="Año"
            startAdornment={
              <InputAdornment position="start">
                <DateIcon color="primary" sx={{ fontSize: 20 }} />
              </InputAdornment>
            }
          >
            {includeAll && (
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DateIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  Todos
                </Box>
              </MenuItem>
            )}
            
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DateIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                  {year}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default MonthYearFilter;

// Función helper para obtener rango de fechas del mes/año seleccionado
export const getMonthYearRange = (selectedMonth, selectedYear) => {
  if (!selectedMonth || !selectedYear || selectedMonth === 'all' || selectedYear === 'all') {
    return null;
  }
  
  const date = new Date(selectedYear, selectedMonth - 1, 1);
  
  return {
    startDate: startOfMonth(date),
    endDate: endOfMonth(date)
  };
};
