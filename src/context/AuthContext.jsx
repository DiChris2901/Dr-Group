import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, serverTimestamp as rtdbServerTimestamp, set } from 'firebase/database';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth, database, db } from '../config/firebase';
import { useUserPresence } from '../hooks/useUserPresence';
import { clearAllListeners } from '../utils/listenerManager';

// Helper function para logs de auditoría (no podemos usar hooks dentro del provider)
// Escribe a activity_logs (colección principal de auditoría, snake_case)
const logAuthActivity = async (action, userId, details = {}) => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      entityType: 'authentication',
      entityId: userId || 'anonymous',
      userId: userId || 'system',
      userName: details.email || 'Sistema',
      userEmail: details.email || 'system',
      userRole: null,
      details: {
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
        deviceInfo: getBrowserInfo(),
        ...details
      },
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
      ipAddress: null,
      sessionId: sessionStorage.getItem('sessionId') || 'anonymous'
    });
  } catch (error) {
    console.error('❌ Error creating audit log:', error);
  }
};

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
  // 🎨 CRÍTICO: Inicializar userProfile con caché para evitar flash de foto por defecto
  const getInitialUserProfile = () => {
    try {
      const cached = localStorage.getItem('drgroup-userProfile');
      if (cached) {
        const profile = JSON.parse(cached);
        return profile;
      }
    } catch (error) {
      console.error('❌ [INIT] Error leyendo perfil inicial:', error);
    }
    return null;
  };
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(getInitialUserProfile); // ⚡ Inicializar con caché
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🎯 Ref para detectar cambios reales de estado de autenticación
  const prevUserRef = useRef(undefined); // undefined = no inicializado

  // Activar sistema de presencia para el usuario actual
  useUserPresence(currentUser?.uid);

  // 💾 Funciones helper para caché de userProfile en localStorage
  const saveUserProfileToCache = (profile) => {
    try {
      localStorage.setItem('drgroup-userProfile', JSON.stringify(profile));
    } catch (error) {
      console.error('❌ [CACHE] Error guardando perfil:', error);
    }
  };

  const loadUserProfileFromCache = (userId) => {
    try {
      const cached = localStorage.getItem('drgroup-userProfile');
      if (cached) {
        const profile = JSON.parse(cached);
        // Verificar que el caché es del usuario correcto
        if (profile.uid === userId) {
          return profile;
        } else {
          localStorage.removeItem('drgroup-userProfile');
        }
      }
    } catch (error) {
      console.error('❌ [CACHE] Error leyendo perfil:', error);
    }
    return null;
  };
  
  // Activar sistema de presencia para el usuario actual
  useUserPresence(currentUser?.uid);

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // � FIRE-AND-FORGET: Toda la auditoría se ejecuta en background sin bloquear el login
      // Esto permite que el dashboard cargue inmediatamente después de autenticarse
      const uid = result.user.uid;
      const userEmail = result.user.email;
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      Promise.resolve().then(async () => {
        try {
          // 📝 Registrar actividad de auditoría
          logAuthActivity('user_login', uid, {
            email: userEmail,
            ipAddress: 'Unknown',
            success: true,
            sessionId
          });
          
          // 🆕 Registrar inicio de sesión en historial
          const loginHistoryId = `${uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const loginHistoryRef = doc(db, 'loginHistory', loginHistoryId);
          setDoc(loginHistoryRef, {
            userId: uid,
            action: 'login',
            timestamp: new Date(),
            email: userEmail,
            ipAddress: 'Unknown',
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            deviceInfo: getBrowserInfo(),
            success: true
          }, { merge: true });
          
          // ✅ Actualizar lastLogin
          const userDocRef = doc(db, 'users', uid);
          updateDoc(userDocRef, {
            lastLogin: new Date(),
            updatedAt: new Date()
          });
          
          // 🆕 Crear sesión activa
          const sessionsRef = collection(db, 'activeSessions');
          const existingSessionsQuery = query(sessionsRef, where('userId', '==', uid));
          const existingSessionsSnapshot = await getDocs(existingSessionsQuery);
          
          const updatePromises = existingSessionsSnapshot.docs.map(d => 
            updateDoc(d.ref, { isCurrent: false })
          );
          Promise.all(updatePromises);
          
          addDoc(collection(db, 'activeSessions'), {
            userId: uid,
            deviceType: getDeviceType(),
            deviceInfo: getBrowserInfo(),
            lastActivity: new Date(),
            loginTime: new Date(),
            isCurrent: true,
            location: 'Unknown',
            sessionId
          });
          
        } catch (auditError) {
        }
      });

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
      
      // 🔴 MARCAR COMO OFFLINE EN RTDB ANTES DE TODO
      if (userId && database) {
        try {
          const userStatusRef = ref(database, `/status/${userId}`);
          await set(userStatusRef, {
            state: 'offline',
            last_changed: rtdbServerTimestamp()
          });
        } catch (rtdbError) {
          console.error('⚠️ Error marcando offline en RTDB:', rtdbError);
        }
      }
      
      // 🧹 Limpiar listeners ANTES del signOut para evitar permission-denied
      clearAllListeners();
      
      // 🆕 Limpiar sesiones activas antes de cerrar sesión
      if (userId) {
        try {
          // 📝 Registrar actividad de auditoría - Cierre de sesión
          await logAuthActivity('user_logout', userId, {
            email: currentUser.email,
            sessionDuration: 'Unknown', // Se podría calcular con timestamp de login
            reason: 'manual_logout'
          });
          
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
          
        } catch (cleanupError) {
          console.error('⚠️ Error en limpieza de sesión:', cleanupError);
          // Continuar con el logout aunque falle la limpieza
        }
      }

      await signOut(auth);
      setUserProfile(null);
      
      // ✅ El listener onAuthStateChanged limpiará localStorage automáticamente
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para buscar usuario por email (para preview en login)
  const getUserByEmail = async (email) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = {
          uid: userDoc.id,
          ...userDoc.data()
        };
        return userData;
      }
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
      return null;
    }
  };

  // Función para actualizar el perfil del usuario
  const updateUserProfile = async (updates) => {
    try {
      
      if (!currentUser) {
        console.error('❌ AuthContext - No hay usuario autenticado');
        throw new Error('No hay usuario autenticado');
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // 🚨 CRÍTICO: NO crear documento automáticamente, solo actualizar si existe
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('❌ AuthContext - Documento de usuario NO existe. No se puede actualizar.');
        throw new Error('El perfil de usuario no existe. Debe ser creado por un administrador.');
      }
      
      
      // Preparar datos de actualización
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Actualizar en Firestore
      await updateDoc(userDocRef, updateData);

      // 📝 Registrar actividad de auditoría - Actualización de perfil
      await logAuthActivity('profile_update', currentUser.uid, {
        email: currentUser.email,
        updatedFields: Object.keys(updates),
        profileData: {
          displayName: updates.displayName || currentUser.displayName,
          role: updates.role || 'unchanged'
        }
      });

      // Actualizar estado local
      setUserProfile(prev => {
        const newProfile = {
          ...prev,
          ...updates,
          updatedAt: new Date()
        };
        return newProfile;
      });

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

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const prevUser = prevUserRef.current;
      
      // 🎯 LÓGICA CORRECTA: Solo limpiar localStorage en cambio real de estado
      if (prevUser !== undefined) { // Ignorar primera inicialización
        if (prevUser !== null && user === null) {
          // 🧹 Verdadero LOGOUT: Usuario estaba autenticado y ahora no
          // ⚡ MANTENER localStorage como caché para próximo login (evita flash de defaults)
          // Solo limpiar perfil, los settings se mantienen para carga instantánea
          localStorage.removeItem('drgroup-userProfile');
        } else if (prevUser === null && user !== null) {
          // 🎉 LOGIN: Usuario se autenticó
        }
      } else {
        // Primera inicialización, no hacer nada
      }
      
      // Actualizar refs y estado
      prevUserRef.current = user;
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 LISTENER EN TIEMPO REAL para el perfil del usuario (SEPARADO)
  // Se ejecuta solo cuando el uid del usuario cambia
  useEffect(() => {
    if (!currentUser?.uid) {
      setUserProfile(null);
      clearAllListeners();
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // ⚡ PASO 1: Cargar desde localStorage PRIMERO (instantáneo, sin lag)
    const cachedProfile = loadUserProfileFromCache(currentUser.uid);
    if (cachedProfile) {
      setUserProfile(cachedProfile);
    }
    
    // 🔄 PASO 2: Actualizar desde Firestore en background
    const initializeUserProfile = async () => {
      try {
        const docSnapshot = await getDoc(userDocRef);
        
        if (!docSnapshot.exists()) {
          // 🚨 CRÍTICO: NO crear documento automáticamente (puede sobrescribir datos reales)
          console.error('❌ [AUTH] Perfil de usuario NO existe en Firestore:', currentUser.uid);
          console.error('❌ [AUTH] Email:', currentUser.email);
          console.error('⚠️ [AUTH] Este usuario debe ser creado manualmente por un administrador');
          
          // Usar datos del caché si existen, sino mostrar error
          if (!cachedProfile) {
            setError('Tu cuenta no está registrada en el sistema. Contacta al administrador.');
            setUserProfile(null);
          }
          // Si hay caché, lo mantiene (ya se setUserProfile arriba)
          return;
        }
        
        // Documento existe, cargar datos
        const userData = docSnapshot.data();
        const fullProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          ...userData
        };
        setUserProfile(fullProfile);
        saveUserProfileToCache(fullProfile); // Guardar en caché para próximo Ctrl+R
      } catch (error) {
        console.error('❌ Error cargando perfil inicial:', error);
      }
    };
    
    // Cargar perfil inicial
    initializeUserProfile();
    
    // Ahora sí, activar listener en tiempo real para cambios futuros
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const fullProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          ...userData
        };
        
        
        setUserProfile(fullProfile);
        saveUserProfileToCache(fullProfile); // Actualizar caché con cambios en tiempo real
      }
      // ✅ NO crear documento aquí, solo responder a cambios
    }, (error) => {
      console.error('❌ Error en listener de perfil:', error);
      setError('Error cargando datos del usuario');
    });
    
    // Limpiar listener cuando el usuario cambie o se desmonte
    return () => {
      unsubscribeProfile();
    };
  }, [currentUser?.uid]); // ✅ Solo se ejecuta cuando cambia el UID, no el objeto completo

  // 🆕 Actualizar actividad de la sesión cada 15 minutos
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Actualizar inmediatamente
    updateSessionActivity();

    // Configurar intervalo para actualizar cada 15 minutos (reduce ~66% reads/writes vs 5min)
    const interval = setInterval(() => {
      updateSessionActivity();
    }, 15 * 60 * 1000); // 15 minutos

    return () => clearInterval(interval);
  }, [currentUser?.uid]); // ✅ Usar uid primitivo en lugar del objeto completo

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
