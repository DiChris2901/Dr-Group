import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para gestionar favoritos del Taskbar
 * Persiste en Firebase: userSettings/{uid}/taskbar/favorites
 */
export const useFavorites = (maxFavorites = 5) => {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos desde Firebase
  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUser) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'userSettings', currentUser.uid, 'taskbar', 'favorites');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFavorites(docSnap.data().items || []);
        } else {
          // Favoritos por defecto: Dashboard, Compromisos, Pagos
          const defaultFavorites = [
            { path: '/dashboard', permission: 'dashboard' },
            { path: '/commitments', permission: 'compromisos' },
            { path: '/payments', permission: 'pagos' }
          ];
          setFavorites(defaultFavorites);
          // Guardar defaults en Firebase
          await setDoc(docRef, { items: defaultFavorites });
        }
      } catch (error) {
        console.error('Error cargando favoritos:', error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [currentUser]);

  // Guardar favoritos en Firebase
  const saveFavorites = async (newFavorites) => {
    if (!currentUser) return;

    try {
      const docRef = doc(db, 'userSettings', currentUser.uid, 'taskbar', 'favorites');
      await setDoc(docRef, { items: newFavorites });
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error guardando favoritos:', error);
    }
  };

  // Agregar favorito
  const addFavorite = async (item) => {
    if (favorites.length >= maxFavorites) {
      console.warn(`Máximo de ${maxFavorites} favoritos alcanzado`);
      return false;
    }

    if (isFavorite(item.path)) {
      console.warn('Este item ya es favorito');
      return false;
    }

    const newFavorites = [...favorites, { path: item.path, permission: item.permission }];
    await saveFavorites(newFavorites);
    return true;
  };

  // Remover favorito
  const removeFavorite = async (path) => {
    const newFavorites = favorites.filter(fav => fav.path !== path);
    await saveFavorites(newFavorites);
  };

  // Toggle favorito (agregar si no existe, remover si existe)
  const toggleFavorite = async (item) => {
    if (isFavorite(item.path)) {
      await removeFavorite(item.path);
      return false; // Removido
    } else {
      const added = await addFavorite(item);
      return added; // true si se agregó, false si alcanzó el máximo
    }
  };

  // Verificar si un path es favorito
  const isFavorite = (path) => {
    return favorites.some(fav => fav.path === path);
  };

  // Reordenar favoritos (drag & drop futuro)
  const reorderFavorites = async (newOrder) => {
    await saveFavorites(newOrder);
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    reorderFavorites,
    maxFavorites
  };
};
