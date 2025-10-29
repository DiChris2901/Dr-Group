import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TaskbarSearch = ({ open, onToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchValue('');
      setIsFocused(false);
    }
  }, [open]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
      onToggle();
    }
  };

  const handleClear = () => {
    setSearchValue('');
  };

  return (
    <Box
      component="form"
      onSubmit={handleSearch}
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        width: '100%'
      }}
    >
      <AnimatePresence mode="wait">
        {!open ? (
          // Search Button (Collapsed)
          <motion.div
            key="search-button"
            initial={{ width: 48, opacity: 0 }}
            animate={{ width: 48, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <IconButton
              onClick={onToggle}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'translateY(-4px) scale(1.05)',
                  boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                },
                transition: 'all 0.2s ease'
              }}
            >
              <SearchIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </motion.div>
        ) : (
          // Search Input (Expanded)
          <motion.div
            key="search-input"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 120 }}
            style={{ width: '100%' }}
          >
            <TextField
              fullWidth
              autoFocus
              size="small"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Buscar en todo el sistema..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ 
                      color: isFocused 
                        ? theme.palette.primary.main 
                        : theme.palette.text.secondary,
                      transition: 'color 0.2s ease'
                    }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {searchValue && (
                      <IconButton
                        size="small"
                        onClick={handleClear}
                        sx={{
                          '&:hover': {
                            color: theme.palette.error.main
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={onToggle}
                      sx={{
                        ml: 0.5,
                        '&:hover': {
                          color: theme.palette.text.primary
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  height: 48,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    }
                  },
                  '&.Mui-focused': {
                    bgcolor: theme.palette.background.paper,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2
                    }
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.95rem',
                  fontWeight: 500
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default TaskbarSearch;
