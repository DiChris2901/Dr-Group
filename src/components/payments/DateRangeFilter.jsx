import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  InputAdornment,
  Popover,
  Paper,
  Button,
  Divider,
  IconButton,
  alpha
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  startOfDay, 
  endOfDay, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subDays,
  subMonths,
  format,
  isValid
} from 'date-fns';

const DateRangeFilter = ({
  value = 'all',
  customStartDate = null,
  customEndDate = null,
  onChange,
  onCustomRangeChange
}) => {
  const theme = useTheme();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(customStartDate);
  const [tempEndDate, setTempEndDate] = useState(customEndDate);
  const selectRef = useRef(null);

  // Opciones predefinidas de filtros de fecha
  const dateFilterOptions = [
    { value: 'all', label: 'Todas las fechas', icon: '📅' },
    { value: 'thisMonth', label: 'Este mes', icon: '🗓️' },
    { value: 'lastMonth', label: 'Mes pasado', icon: '📆' },
    { value: 'last90Days', label: 'Últimos 90 días', icon: '📊' },
    { value: 'thisYear', label: 'Este año', icon: '🎯' },
    { value: 'lastYear', label: 'Año pasado', icon: '⏳' },
    { value: 'custom', label: 'Rango personalizado', icon: '🎨' }
  ];

  const handleFilterChange = (event) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
    
    if (selectedValue === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      // Limpiar fechas personalizadas si se selecciona otra opción
      if (onCustomRangeChange) {
        onCustomRangeChange(null, null);
      }
    }
  };

  const handleClosePopover = () => {
    setShowCustomPicker(false);
    setTempStartDate(customStartDate);
    setTempEndDate(customEndDate);
  };

  const handleApplyCustomRange = () => {
    if (onCustomRangeChange && tempStartDate && tempEndDate) {
      onCustomRangeChange(tempStartDate, tempEndDate);
    }
    setShowCustomPicker(false);
  };

  const handleClearCustomRange = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    if (onCustomRangeChange) {
      onCustomRangeChange(null, null);
    }
    onChange('all');
    setShowCustomPicker(false);
  };

  // Función para obtener el rango de fechas basado en la opción seleccionada
  const getDateRange = (filterValue) => {
    const now = new Date();
    
    switch (filterValue) {
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'last90Days':
        return {
          start: startOfDay(subDays(now, 89)),
          end: endOfDay(now)
        };
      case 'thisYear':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      case 'lastYear':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        return {
          start: startOfYear(lastYear),
          end: endOfYear(lastYear)
        };
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate
        };
      default:
        return null;
    }
  };

  const isCustomRangeValid = tempStartDate && tempEndDate && tempStartDate <= tempEndDate;

  const getDisplayText = () => {
    if (value === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'dd/MM/yyyy')} - ${format(customEndDate, 'dd/MM/yyyy')}`;
    }
    const option = dateFilterOptions.find(opt => opt.value === value);
    return option?.label || 'Todas las fechas';
  };

  useEffect(() => {
    setTempStartDate(customStartDate);
    setTempEndDate(customEndDate);
  }, [customStartDate, customEndDate]);

  useEffect(() => {
    if (value === 'custom' && !showCustomPicker) {
      setShowCustomPicker(true);
    } else if (value !== 'custom' && showCustomPicker) {
      setShowCustomPicker(false);
    }
  }, [value, showCustomPicker]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <FormControl 
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              backgroundColor: theme.palette.background.default,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
              }
            }
          }}
        >
          <InputLabel>Período</InputLabel>
          <Select
            value={value}
            onChange={handleFilterChange}
            label="Período"
            ref={selectRef}
            startAdornment={
              <InputAdornment position="start">
                <DateRangeIcon color="primary" />
              </InputAdornment>
            }
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  {getDisplayText()}
                </Typography>
              </Box>
            )}
          >
            {dateFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ mr: 1, fontSize: '1.2em' }}>
                    {option.icon}
                  </Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {option.label}
                  </Typography>
                  {option.value === 'custom' && (
                    <CalendarIcon sx={{ ml: 1, color: 'text.secondary', fontSize: 18 }} />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Popover para rango personalizado */}
        <Popover
          open={showCustomPicker && value === 'custom'}
          anchorEl={selectRef.current}
          onClose={handleClosePopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            elevation: 8,
            sx: {
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              backgroundColor: theme.palette.background.paper,
              minWidth: 400,
              maxWidth: 500,
              mt: 1
            }
          }}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Paper elevation={0} sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
                  <Box display="flex" alignItems="center">
                    <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                      Rango Personalizado
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={handleClosePopover}
                    size="small"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <DatePicker
                      label="Fecha inicial"
                      value={tempStartDate}
                      onChange={(newValue) => setTempStartDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'medium',
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <TodayIcon color="primary" />
                              </InputAdornment>
                            )
                          }
                        }
                      }}
                      maxDate={tempEndDate || new Date()}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      label="Fecha final"
                      value={tempEndDate}
                      onChange={(newValue) => setTempEndDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'medium',
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon color="primary" />
                              </InputAdornment>
                            )
                          }
                        }
                      }}
                      minDate={tempStartDate}
                      maxDate={new Date()}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleClearCustomRange}
                    startIcon={<CloseIcon />}
                    sx={{
                      borderColor: alpha(theme.palette.error.main, 0.5),
                      color: 'error.main',
                      '&:hover': {
                        borderColor: 'error.main',
                        backgroundColor: alpha(theme.palette.error.main, 0.05)
                      }
                    }}
                  >
                    Limpiar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleApplyCustomRange}
                    disabled={!isCustomRangeValid}
                    startIcon={<CheckIcon />}
                    sx={{
                      px: 3,
                      borderRadius: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
                    Aplicar Rango
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </AnimatePresence>
        </Popover>
      </motion.div>
    </LocalizationProvider>
  );
};

// Función utilitaria para exportar junto con el componente
export const getDateRangeFromFilter = (filterValue, customStartDate = null, customEndDate = null) => {
  const now = new Date();
  
  switch (filterValue) {
    case 'thisMonth':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    case 'last90Days':
      return {
        start: startOfDay(subDays(now, 89)),
        end: endOfDay(now)
      };
    case 'thisYear':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    case 'lastYear':
      const lastYear = new Date(now.getFullYear() - 1, 0, 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear)
      };
    case 'custom':
      return customStartDate && customEndDate ? {
        start: startOfDay(customStartDate),
        end: endOfDay(customEndDate)
      } : null;
    default:
      return null;
  }
};

export default DateRangeFilter;
