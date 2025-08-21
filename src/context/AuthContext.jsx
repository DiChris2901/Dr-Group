import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

// Helper functions para detectar dispositivo y navegador
const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
};

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  const platform = navigator.platform || 'Unknown';
  return `${browserName} ${browserVersion} on ${platform}`;
};

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
      
      // 🆕 Registrar inicio de sesión en historial
      try {
        await addDoc(collection(db, 'loginHistory'), {
          userId: result.user.uid,
          action: 'login',
          timestamp: new Date(),
          email: result.user.email,
          ipAddress: 'Unknown', // Requiere servicio externo para obtener IP real
          userAgent: navigator.userAgent,
          deviceType: getDeviceType(),
          deviceInfo: getBrowserInfo(),
          success: true
        });
        console.log('✅ Inicio de sesión registrado en historial');
      } catch (historyError) {
        console.error('⚠️ Error registrando historial:', historyError);
        // No bloquear el login si falla el registro del historial
      }

      // 🆕 Crear sesión activa
      try {
        // Primero, marcar otras sesiones como no actuales
        const sessionsRef = collection(db, 'activeSessions');
        const existingSessionsQuery = query(sessionsRef, where('userId', '==', result.user.uid));
        const existingSessionsSnapshot = await getDocs(existingSessionsQuery);
        
        // Actualizar sesiones existentes para marcarlas como no actuales
        const updatePromises = existingSessionsSnapshot.docs.map(doc => 
          updateDoc(doc.ref, { isCurrent: false })
        );
        await Promise.all(updatePromises);

        // Crear nueva sesión activa
        await addDoc(collection(db, 'activeSessions'), {
          userId: result.user.uid,
          deviceType: getDeviceType(),
          deviceInfo: getBrowserInfo(),
          lastActivity: new Date(),
          loginTime: new Date(),
          isCurrent: true,
          location: 'Unknown', // Requiere geolocalización
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        console.log('✅ Sesión activa creada');
      } catch (sessionError) {
        console.error('⚠️ Error creando sesión activa:', sessionError);
        // No bloquear el login si falla el registro de sesión
      }

      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      const userId = currentUser?.uid;
      
      // 🆕 Limpiar sesiones activas antes de cerrar sesión
      if (userId) {
        try {
          // Registrar cierre de sesión en historial
          await addDoc(collection(db, 'loginHistory'), {
            userId: userId,
            action: 'logout',
            timestamp: new Date(),
            email: currentUser.email,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            deviceInfo: getBrowserInfo()
          });

          // Eliminar sesión activa actual
          const sessionsRef = collection(db, 'activeSessions');
          const currentSessionQuery = query(
            sessionsRef, 
            where('userId', '==', userId),
            where('isCurrent', '==', true)
          );
          const currentSessionSnapshot = await getDocs(currentSessionQuery);
          
          const deletePromises = currentSessionSnapshot.docs.map(doc => 
            updateDoc(doc.ref, { 
              isCurrent: false, 
              logoutTime: new Date(),
              active: false 
            })
          );
          await Promise.all(deletePromises);
          
          console.log('✅ Sesión cerrada y registrada en historial');
        } catch (cleanupError) {
          console.error('⚠️ Error en limpieza de sesión:', cleanupError);
          // Continuar con el logout aunque falle la limpieza
        }
      }

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
      console.log('🚀 AuthContext - updateUserProfile iniciado');
      console.log('📊 AuthContext - Updates recibidos:', updates);
      console.log('👤 AuthContext - CurrentUser:', { uid: currentUser?.uid, email: currentUser?.email });
      
      if (!currentUser) {
        console.error('❌ AuthContext - No hay usuario autenticado');
        throw new Error('No hay usuario autenticado');
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      console.log('📄 AuthContext - Referencia de documento:', userDocRef.path);
      
      // Verificar si el documento existe, si no, crearlo
      console.log('🔍 AuthContext - Verificando si documento existe...');
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('📝 AuthContext - Documento de usuario no existe, creándolo...');
        // Crear documento base del usuario
        const baseUserData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
          role: 'viewer', // Rol por defecto
          status: 'active',
          companies: [],
          permissions: {
            dashboard: true,
            commitments: false,
            users: false,
            reports: false,
            settings: false
          },
          theme: {
            darkMode: false,
            primaryColor: '#1976d2',
            secondaryColor: '#dc004e'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(userDocRef, baseUserData);
        console.log('✅ AuthContext - Documento de usuario creado exitosamente');
      } else {
        console.log('✅ AuthContext - Documento existe, datos actuales:', userDoc.data());
      }
      
      // Preparar datos de actualización
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      console.log('📝 AuthContext - Datos a actualizar en Firestore:', updateData);
      
      // Actualizar en Firestore
      console.log('💾 AuthContext - Actualizando documento en Firestore...');
      await updateDoc(userDocRef, updateData);
      console.log('✅ AuthContext - Documento actualizado exitosamente en Firestore');

      // Actualizar estado local
      console.log('🔄 AuthContext - Actualizando estado local...');
      setUserProfile(prev => {
        const newProfile = {
          ...prev,
          ...updates,
          updatedAt: new Date()
        };
        console.log('📊 AuthContext - Nuevo estado userProfile:', newProfile);
        return newProfile;
      });

      console.log('🎉 AuthContext - updateUserProfile completado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ AuthContext - Error actualizando perfil:', error);
      console.error('❌ AuthContext - Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  };

  // 🆕 Función para actualizar actividad de la sesión
  const updateSessionActivity = async () => {
    if (!currentUser) return;

    try {
      const sessionsRef = collection(db, 'activeSessions');
      const currentSessionQuery = query(
        sessionsRef, 
        where('userId', '==', currentUser.uid),
        where('isCurrent', '==', true)
      );
      const currentSessionSnapshot = await getDocs(currentSessionQuery);
      
      const updatePromises = currentSessionSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { 
          lastActivity: new Date()
        })
      );
      await Promise.all(updatePromises);
      
    } catch (error) {
      console.error('⚠️ Error actualizando actividad de sesión:', error);
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
      
      // Usuario no tiene perfil en Firestore, crearlo automáticamente
      console.log('📝 Usuario sin perfil en Firestore, creando documento automáticamente...');
      
      const baseUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'viewer', // Rol por defecto
        status: 'active',
        companies: [],
        permissions: {
          dashboard: true,
          commitments: false,
          users: false,
          reports: false,
          settings: false
        },
        theme: {
          darkMode: false,
          primaryColor: '#1976d2',
          secondaryColor: '#dc004e'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      
      await setDoc(userDocRef, baseUserData);
      console.log('✅ Documento de usuario creado automáticamente');
      
      setUserProfile({
        uid: user.uid,
        email: user.email,
        ...baseUserData
      });
      
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

  // 🆕 Actualizar actividad de la sesión cada 5 minutos
  useEffect(() => {
    if (!currentUser) return;

    // Actualizar inmediatamente
    updateSessionActivity();

    // Configurar intervalo para actualizar cada 5 minutos
    const interval = setInterval(() => {
      updateSessionActivity();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,
    user: currentUser, // Alias para compatibilidad
    userProfile,
    login,
    logout,
    updateUserProfile,
    updateSessionActivity, // 🆕 Nueva función disponible
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
