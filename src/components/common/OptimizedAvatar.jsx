import React from 'react';
import { Avatar } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

/**
 * Avatar con carga optimizada
 * - Lazy loading y decoding asíncrono
 * - Fallback a iniciales o ícono si no hay imagen
 */
const OptimizedAvatar = ({ src, alt, children, sx, ...props }) => {
  return (
    <Avatar
      src={src || undefined}
      alt={alt}
      sx={sx}
      imgProps={{ 
        loading: "lazy", 
        decoding: "async"
      }}
      {...props}
    >
      {!src && (children || <PersonIcon />)}
    </Avatar>
  );
};

export default React.memo(OptimizedAvatar);
