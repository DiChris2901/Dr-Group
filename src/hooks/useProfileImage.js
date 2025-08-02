import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Hook personalizado para manejar las imágenes de perfil de los usuarios
 * @param {string} userId - ID del usuario
 * @param {string} userEmail - Email del usuario (fallback)
 * @returns {Object} - {imageUrl, loading, error, refreshImage}
 */
export const useProfileImage = (userId, userEmail) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProfileImage = async () => {
    if (!userId && !userEmail) {
      setImageUrl(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Intentar cargar la imagen usando diferentes rutas posibles
      const possiblePaths = [
        `profile-images/${userId}`, // Ruta principal por ID
        `profile-images/${userId}.jpg`,
        `profile-images/${userId}.jpeg`,
        `profile-images/${userId}.png`,
        `profile-images/${userId}.webp`,
        `users/${userId}/profile`, // Ruta alternativa
        `users/${userId}/profile.jpg`,
        `users/${userId}/profile.jpeg`,
        `users/${userId}/profile.png`,
        `users/${userId}/profile.webp`
      ];

      // Si no hay userId, intentar con email
      if (!userId && userEmail) {
        const emailId = userEmail.replace(/[@.]/g, '_');
        possiblePaths.push(
          `profile-images/${emailId}`,
          `profile-images/${emailId}.jpg`,
          `profile-images/${emailId}.jpeg`,
          `profile-images/${emailId}.png`,
          `profile-images/${emailId}.webp`
        );
      }

      let foundUrl = null;

      // Intentar cargar desde cada ruta posible
      for (const path of possiblePaths) {
        try {
          const imageRef = ref(storage, path);
          const url = await getDownloadURL(imageRef);
          foundUrl = url;
          break; // Si encontramos la imagen, salir del loop
        } catch (err) {
          // Continuar con la siguiente ruta si esta falla
          continue;
        }
      }

      setImageUrl(foundUrl);
    } catch (err) {
      console.error('Error loading profile image:', err);
      setError(err);
      setImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileImage();
  }, [userId, userEmail]);

  const refreshImage = () => {
    loadProfileImage();
  };

  return {
    imageUrl,
    loading,
    error,
    refreshImage
  };
};

/**
 * Hook simplificado para obtener la URL de una imagen de perfil
 * @param {string} userId - ID del usuario
 * @param {string} userEmail - Email del usuario (fallback)
 * @returns {string|null} - URL de la imagen o null
 */
export const useProfileImageUrl = (userId, userEmail) => {
  const { imageUrl } = useProfileImage(userId, userEmail);
  return imageUrl;
};

export default useProfileImage;
