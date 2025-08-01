import React, { useState } from 'react';
import { Avatar } from '@mui/material';

const ProfileAvatar = ({ photoURL, name, email, size = 40, border = true }) => {
  const [imageError, setImageError] = useState(false);
  
  // Generar iniciales mejor
  const getInitials = () => {
    if (name) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U'; // Usuario genérico
  };
  
  const initials = getInitials();
  
  const handleImageError = (e) => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Determinar si mostrar imagen o iniciales
  const shouldShowImage = photoURL && !imageError;

  return (
    <Avatar
      src={shouldShowImage ? photoURL : undefined}
      onError={handleImageError}
      onLoad={handleImageLoad}
      sx={{
        width: size,
        height: size,
        bgcolor: shouldShowImage ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: size > 40 ? '1.2rem' : '1rem',
        fontWeight: 600,
        border: border ? '2px solid rgba(255, 255, 255, 0.3)' : 'none',
        position: 'relative',
        zIndex: 10,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }
      }}
    >
      {!shouldShowImage && initials}
    </Avatar>
  );
};

export default ProfileAvatar;
