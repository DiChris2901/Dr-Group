import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Typography,
  alpha
} from '@mui/material';
import {
  CalendarMonth as CalendarMonthIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, isValid } from 'date-fns';

const FILTERS = [
  { value: 'thisMonth', label: 'Este mes', icon: TodayIcon },
  { value: 'lastMonth', label: 'Mes pasado', icon: DateRangeIcon },
  { value: 'last3Months', label: 'Últimos 3 meses', icon: DateRangeIcon },
  { value: 'last6Months', label: 'Últimos 6 meses', icon: DateRangeIcon },
  { value: 'thisYear', label: 'Todo el año', icon: DateRangeIcon },
  { value: 'allTime', label: 'Todos los meses', icon: DateRangeIcon },
  { value: 'month', label: 'Seleccionar mes…', icon: CalendarMonthIcon }
];

export default function HistoricoPeriodoFilter({
  value = 'thisMonth',
  monthDate = null,
  onChange,
  onMonthChange
}) {
  const theme = useTheme();
  const anchorRef = useRef(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(monthDate);

  const displayText = useMemo(() => {
    if (value === 'month' && monthDate && isValid(monthDate)) {
      const pretty = format(monthDate, 'MMMM yyyy', { locale: es });
      return pretty.charAt(0).toUpperCase() + pretty.slice(1);
    }
    
    // Mapear los valores a textos descriptivos
    const labelMap = {
      'thisMonth': 'Este mes',
      'lastMonth': 'Mes pasado',
      'last3Months': 'Últimos 3 meses',
      'last6Months': 'Últimos 6 meses',
      'thisYear': 'Todo el año',
      'allTime': 'Todos los meses'
    };
    
    return labelMap[value] || 'Este mes';
  }, [value, monthDate]);

  useEffect(() => {
    setTempMonth(monthDate);
  }, [monthDate]);

  const handleSelectChange = (event) => {
    const next = event.target.value;
    onChange?.(next);

    if (next === 'month') {
      setShowMonthPicker(true);
      return;
    }

    setShowMonthPicker(false);
  };

  const handleClose = () => {
    setShowMonthPicker(false);
    setTempMonth(monthDate);
  };

  const handleApply = () => {
    if (!tempMonth || !isValid(tempMonth)) return;
    onMonthChange?.(tempMonth);
    onChange?.('month');
    setShowMonthPicker(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <FormControl
        fullWidth
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 0.6,
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
        }}
      >
        <InputLabel>Período</InputLabel>
        <Select
          value={value}
          onChange={handleSelectChange}
          label="Período"
          ref={anchorRef}
          startAdornment={
            <InputAdornment position="start">
              <DateRangeIcon color="primary" />
            </InputAdornment>
          }
          renderValue={() => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{displayText}</Typography>
            </Box>
          )}
        >
          {FILTERS.map((opt) => {
            const Icon = opt.icon;
            return (
              <MenuItem key={opt.value} value={opt.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Icon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {opt.label}
                  </Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <Popover
        open={showMonthPicker && value === 'month'}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            backgroundColor: theme.palette.background.paper,
            minWidth: 360,
            maxWidth: 420,
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Seleccionar mes
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <DatePicker
            label="Mes"
            value={tempMonth}
            onChange={(newValue) => setTempMonth(newValue)}
            views={['year', 'month']}
            openTo="month"
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'medium',
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon color="primary" />
                    </InputAdornment>
                  )
                }
              }
            }}
          />

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleClose}
              startIcon={<CloseIcon />}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.6),
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'text.primary',
                  backgroundColor: alpha(theme.palette.text.primary, 0.04)
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={!tempMonth || !isValid(tempMonth)}
              startIcon={<CheckIcon />}
              sx={{
                px: 3,
                borderRadius: 1,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              Aplicar
            </Button>
          </Box>
        </Box>
      </Popover>
    </LocalizationProvider>
  );
}
