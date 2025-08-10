import React from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const PaginationControls = ({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  onRecordsPerPageChange,
  loading = false
}) => {
  const theme = useTheme();
  
  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  const handlePageSelect = (event) => {
    onPageChange(parseInt(event.target.value));
  };

  const handleRecordsPerPageChange = (event) => {
    onRecordsPerPageChange(parseInt(event.target.value));
    onPageChange(1); // Reset to first page when changing page size
  };

  if (totalRecords === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          p: 3,
          mt: 3,
          background: `linear-gradient(135deg, 
            ${theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.02)' 
              : 'rgba(255, 255, 255, 0.8)'
            }, 
            ${theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(248, 250, 252, 0.9)'
            }
          )`,
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Información de registros */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">
            <strong>{totalRecords}</strong> registros encontrados
          </Typography>
          <Chip
            label={`${startRecord}-${endRecord} de ${totalRecords}`}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>

        {/* Controles de navegación */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Registros por página */}
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={recordsPerPage}
              onChange={handleRecordsPerPageChange}
              disabled={loading}
              sx={{
                '& .MuiSelect-select': {
                  py: 0.5,
                  fontSize: '0.875rem'
                }
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
            por página
          </Typography>

          {/* Botones de navegación */}
          <IconButton
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            <FirstPage />
          </IconButton>
          
          <IconButton
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            <ChevronLeft />
          </IconButton>

          {/* Selector de página */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={currentPage}
              onChange={handlePageSelect}
              disabled={loading}
              sx={{
                '& .MuiSelect-select': {
                  py: 0.5,
                  fontSize: '0.875rem',
                  fontWeight: 600
                }
              }}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <MenuItem key={page} value={page}>
                  Página {page}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            de <strong>{totalPages}</strong>
          </Typography>

          <IconButton
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            <ChevronRight />
          </IconButton>
          
          <IconButton
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            <LastPage />
          </IconButton>
        </Box>
      </Box>
    </motion.div>
  );
};

export default PaginationControls;
