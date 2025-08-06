import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para buscar usuario por email (para preview en login)
  const getUserByEmail = async (email) => {
    try {
      console.log('🔍 Buscando usuario con email:', email);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Resultados de búsqueda:', querySnapshot.size, 'documentos encontrados');
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = {
          uid: userDoc.id,
          ...userDoc.data()
        };
        console.log('✅ Usuario encontrado en Firestore:', userData);
        return userData;
      }
      console.log('❌ No se encontró usuario con email:', email);
      return null;
    } catch (error) {
      console.error('❌ Error buscando usuario por email:', error);
      return null;
    }
  };

  // Función para verificar si un email tiene usuario registrado (sin autenticación)
  const checkEmailExists = async (email) => {
    try {
      // Esta función intentará verificar si el email existe en la base de datos
      // Si falla por permisos, retornará null y usaremos el preview genérico
      const user = await getUserByEmail(email);
      return user;
    } catch (error) {
      console.log('💡 No se pudo verificar email (permisos), usando preview genérico');
      return null;
    }
  };

  // Función para actualizar el perfil del usuario
  const updateUserProfile = async (updates) => {
    try {
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Actualizar en Firestore
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Actualizar estado local
      setUserProfile(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date()
      }));

      return true;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  };

  // Cargar perfil del usuario desde Firestore
  const loadUserProfile = async (user) => {
    try {
      console.log('🔍 Cargando perfil para usuario:', user.uid, user.email);
      
      // Primero intentar buscar por UID
      let userDocRef = doc(db, 'users', user.uid);
      let userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        console.log('✅ Perfil encontrado por UID:', userDoc.data());
        setUserProfile({
          uid: user.uid,
          email: user.email,
          ...userDoc.data()
        });
        return;
      }
      
      // Si no se encuentra por UID, buscar por email
      console.log('🔍 No encontrado por UID, buscando por email...');
      const userByEmail = await getUserByEmail(user.email);
      
      if (userByEmail) {
        console.log('✅ Perfil encontrado por email:', userByEmail);
        setUserProfile({
          uid: user.uid,
          email: user.email,
          ...userByEmail
        });
        return;
      }
      
      // Usuario no tiene perfil en Firestore
      console.warn('⚠️ Usuario autenticado sin perfil en Firestore:', user.email);
      console.warn('⚠️ Debe ser creado manualmente desde UserManagementPage');
      setUserProfile(null);
      
    } catch (error) {
      console.error('❌ Error cargando perfil del usuario:', error);
      setError('Error cargando datos del usuario');
    }
  };

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    user: currentUser, // Alias para compatibilidad
    userProfile,
    login,
    logout,
    updateUserProfile,
    getUserByEmail,
    checkEmailExists,
    loading,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
