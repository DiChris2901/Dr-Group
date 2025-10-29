import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme
} from '@mui/material';

const TaskbarMenu = ({ open, anchorEl, onClose, items, onItemClick }) => {
  const theme = useTheme();

  return (
    <Menu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      TransitionProps={{ timeout: 100 }}
      disableScrollLock
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 220,
            mt: -1,
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.15)'
          }
        }
      }}
    >
      {items.map((item, index) => (
        <MenuItem
          key={item.path}
          onClick={() => onItemClick(item.path)}
          sx={{
              py: 1.5,
              px: 2,
              borderLeft: '3px solid transparent',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                borderLeft: `3px solid ${theme.palette.primary.main}`,
                transform: 'translateX(2px)',
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main
                }
              },
              transition: 'all 0.1s ease-out'
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              transition: 'color 0.1s ease-out'
            }}>
              <item.icon sx={{ fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            />
        </MenuItem>
      ))}
    </Menu>
  );
};

export default TaskbarMenu;
