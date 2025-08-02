import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon 
} from '@mui/icons-material';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';
import ProfileAvatar from './ProfileAvatar';

/**
 * Componente para subir y gestionar fotos de perfil
 */
const ProfileImageUpload = ({ 
  open, 
  onClose, 
  userId, 
  userEmail, 
  displayName, 
  onImageUpdated 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Por favor selecciona una imagen válida (JPG, PNG, WEBP)');
      return;
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('La imagen es muy grande. El tamaño máximo es 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Crear referencia al archivo en Storage
      const fileName = `profile-images/${userId}`;
      const storageRef = ref(storage, fileName);

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Actualizar documento del usuario en Firestore
      await updateDoc(doc(db, 'users', userId), {
        photoURL: downloadURL,
        profileImagePath: fileName,
        updatedAt: new Date()
      });

      setSuccess(true);
      setUploadProgress(0);
      
      // Notificar al componente padre
      if (onImageUpdated) {
        onImageUpdated(downloadURL);
      }

      // Cerrar modal después de un momento
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Error al subir la imagen: ' + err.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!userId) return;

    try {
      setUploading(true);
      setError(null);

      // Eliminar archivo de Storage
      const fileName = `profile-images/${userId}`;
      const storageRef = ref(storage, fileName);
      
      try {
        await deleteObject(storageRef);
      } catch (deleteErr) {
        // Si el archivo no existe, continuar
        console.log('File not found in storage, continuing...');
      }

      // Actualizar documento del usuario en Firestore
      await updateDoc(doc(db, 'users', userId), {
        photoURL: null,
        profileImagePath: null,
        updatedAt: new Date()
      });

      setSuccess(true);
      
      // Notificar al componente padre
      if (onImageUpdated) {
        onImageUpdated(null);
      }

      // Cerrar modal después de un momento
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Error al eliminar la imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.95) 100%)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <PhotoCameraIcon />
        Foto de Perfil
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {displayName || userEmail}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sube una foto de perfil para personalizar tu cuenta
          </Typography>
        </Box>

        {/* Vista previa actual */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ProfileAvatar
            userId={userId}
            userEmail={userEmail}
            displayName={displayName}
            size={120}
          />
        </Box>

        {/* Selector de archivo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="profile-image-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="profile-image-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
              disabled={uploading}
            >
              Seleccionar Imagen
            </Button>
          </label>

          {preview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Vista previa:
              </Typography>
              <Avatar
                src={preview}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto',
                  border: '2px solid',
                  borderColor: 'primary.main'
                }}
              />
            </Box>
          )}
        </Box>

        {/* Progreso de subida */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              Subiendo... {uploadProgress}%
            </Typography>
          </Box>
        )}

        {/* Mensajes de error y éxito */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Imagen actualizada correctamente!
          </Alert>
        )}

        {/* Información adicional */}
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
          Formatos soportados: JPG, PNG, WEBP<br />
          Tamaño máximo: 5MB
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Tooltip title="Eliminar foto actual">
          <IconButton
            onClick={handleDeleteImage}
            disabled={uploading}
            sx={{ 
              color: 'error.main',
              '&:hover': { backgroundColor: 'error.light', color: 'white' }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        <Button 
          onClick={handleClose}
          disabled={uploading}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          sx={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #218838 0%, #1ea085 100%)',
            }
          }}
        >
          {uploading ? 'Subiendo...' : 'Subir Imagen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileImageUpload;
