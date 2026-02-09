import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, serverTimestamp as rtdbServerTimestamp, set } from 'firebase/database';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth, database, db } from '../config/firebase';
import { useUserPresence } from '../hooks/useUserPresence';
import { clearAllListeners } from '../utils/listenerManager';

// Helper function para logs de auditoría (no podemos usar hooks dentro del provider)
const logAuthActivity = async (action, userId, details = {}) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      action,
      entityType: 'authentication',
      entityId: userId || 'anonymous',
      userId: userId || 'system',
      details: {
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
        deviceInfo: getBrowserInfo(),
        ...details
      },
      timestamp: new Date()
    });
    console.log(`✅ Audit log created: ${action}`);
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
        console.log('⚡ [INIT] Perfil cargado desde caché en inicialización (sin flash)');
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
      console.log('💾 [CACHE] Perfil guardado en localStorage');
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
          console.log('⚡ [CACHE] Perfil cargado desde localStorage (instantáneo)');
          return profile;
        } else {
          console.log('⚠️ [CACHE] Perfil en caché es de otro usuario, ignorando');
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
      
      // 📝 Registrar actividad de auditoría - Inicio de sesión exitoso
      await logAuthActivity('user_login', result.user.uid, {
        email: result.user.email,
        ipAddress: 'Unknown', // Requiere servicio externo
        success: true,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      
      // 🆕 Registrar inicio de sesión en historial (con ID único para evitar duplicados)
      try {
        const loginHistoryId = `${result.user.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const loginHistoryRef = doc(db, 'loginHistory', loginHistoryId);
        
        await setDoc(loginHistoryRef, {
          userId: result.user.uid,
          action: 'login',
          timestamp: new Date(),
          email: result.user.email,
          ipAddress: 'Unknown', // Requiere servicio externo para obtener IP real
          userAgent: navigator.userAgent,
          deviceType: getDeviceType(),
          deviceInfo: getBrowserInfo(),
          success: true
        }, { merge: true }); // merge: true previene errores si el documento ya existe
        
        console.log('✅ Inicio de sesión registrado en historial');
      } catch (historyError) {
        console.warn('⚠️ Error registrando historial (no crítico):', historyError.message);
        // No bloquear el login si falla el registro del historial
      }

      // ✅ Actualizar lastLogin en el documento del usuario
      try {
        const userDocRef = doc(db, 'users', result.user.uid);
        await updateDoc(userDocRef, {
          lastLogin: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Última fecha de acceso actualizada');
      } catch (updateError) {
        console.warn('⚠️ Error actualizando lastLogin:', updateError.message);
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
      
      // 🔴 MARCAR COMO OFFLINE EN RTDB ANTES DE TODO
      if (userId && database) {
        try {
          const userStatusRef = ref(database, `/status/${userId}`);
          await set(userStatusRef, {
            state: 'offline',
            last_changed: rtdbServerTimestamp()
          });
          console.log('🔴 Usuario marcado como offline en RTDB');
        } catch (rtdbError) {
          console.error('⚠️ Error marcando offline en RTDB:', rtdbError);
        }
      }
      
      // 🧹 Limpiar listeners ANTES del signOut para evitar permission-denied
      console.log('🧹 Limpiando listeners antes del logout...');
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
          
          console.log('✅ Sesión cerrada y registrada en historial');
        } catch (cleanupError) {
          console.error('⚠️ Error en limpieza de sesión:', cleanupError);
          // Continuar con el logout aunque falle la limpieza
        }
      }

      await signOut(auth);
      setUserProfile(null);
      
      // ✅ El listener onAuthStateChanged limpiará localStorage automáticamente
      console.log('✅ Logout completado, listener limpiará caché automáticamente');
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
      
      // 🚨 CRÍTICO: NO crear documento automáticamente, solo actualizar si existe
      console.log('🔍 AuthContext - Verificando si documento existe...');
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('❌ AuthContext - Documento de usuario NO existe. No se puede actualizar.');
        throw new Error('El perfil de usuario no existe. Debe ser creado por un administrador.');
      }
      
      console.log('✅ AuthContext - Documento existe, procediendo con actualización');
      
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

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const prevUser = prevUserRef.current;
      
      // 🎯 LÓGICA CORRECTA: Solo limpiar localStorage en cambio real de estado
      if (prevUser !== undefined) { // Ignorar primera inicialización
        if (prevUser !== null && user === null) {
          // 🧹 Verdadero LOGOUT: Usuario estaba autenticado y ahora no
          console.log('🧹 Logout detectado (usuario → null), limpiando localStorage');
          localStorage.removeItem('drgroup-settings');
          localStorage.removeItem('drgroup-userProfile');
          console.log('✅ Cache limpiada (settings + profile), próximo login descargará desde Firestore');
        } else if (prevUser === null && user !== null) {
          // 🎉 LOGIN: Usuario se autenticó
          console.log('🎉 Login detectado (null → usuario), localStorage se actualizará desde Firestore');
        }
      } else {
        // Primera inicialización, no hacer nada
        console.log('⚡ Inicialización de Auth (primera vez)');
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

    console.log('🔄 [PROFILE] Iniciando carga de perfil para:', currentUser.uid);
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // ⚡ PASO 1: Cargar desde localStorage PRIMERO (instantáneo, sin lag)
    const cachedProfile = loadUserProfileFromCache(currentUser.uid);
    if (cachedProfile) {
      console.log('⚡ [PROFILE] Usando caché, setUserProfile inmediatamente');
      setUserProfile(cachedProfile);
      console.log('🖼️ [CACHE] Foto y permisos cargados instantáneamente');
    } else {
      console.log('⚠️ [PROFILE] No hay caché, esperando Firestore...');
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
        
        console.log('✅ [AUTH] Perfil actualizado desde Firestore (background)');
        console.log('� [AUTH] DATOS COMPLETOS DEL USUARIO:');
        console.log('  - Nombre:', userData.name || userData.displayName);
        console.log('  - Email:', userData.email);
        console.log('  - Rol Dashboard:', userData.role);
        console.log('  - Rol App Móvil:', userData.appRole);
        console.log('  - Departamento:', userData.department);
        console.log('  - Posición:', userData.position);
        console.log('  - Compañías:', userData.companies?.length || 0);
        console.log('  - Teléfono:', userData.phone);
        console.log('  - Estado:', userData.status);
        console.log('  - Activo:', userData.isActive);
        console.log('  - Online:', userData.online);
        console.log('👤 [AUTH] Permisos:', Object.keys(userData.permissions || {}).filter(k => userData.permissions[k]));
        console.log('🎨 [AUTH] Colores:', userData.theme);
        console.log('🖼️ [AUTH] Foto de perfil:', userData.photoURL ? 'Sí' : 'No');
        console.log('🔔 [AUTH] Notificaciones:', {
          email: userData.notificationSettings?.emailEnabled,
          telegram: userData.notificationSettings?.telegramEnabled,
          channel: userData.notificationSettings?.notificationChannel
        });
        
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
        
        console.log('🔄 [AUTH] Perfil actualizado en tiempo real (listener)');
        console.log('📋 [AUTH] Rol Dashboard:', userData.role, '| Rol App:', userData.appRole);
        console.log('👤 [AUTH] Compañías:', userData.companies?.length || 0);
        console.log('🔔 [AUTH] Estado:', userData.status, '| Activo:', userData.isActive);
        
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

  // 🆕 Actualizar actividad de la sesión cada 5 minutos
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Actualizar inmediatamente
    updateSessionActivity();

    // Configurar intervalo para actualizar cada 5 minutos
    const interval = setInterval(() => {
      updateSessionActivity();
    }, 5 * 60 * 1000); // 5 minutos

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
