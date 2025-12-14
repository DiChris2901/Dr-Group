import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // ✅ Monitorear conexión y sincronizar
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        syncPendingActions();
      }
    });
    return unsubscribe;
  }, []);

  const syncPendingActions = async () => {
    try {
      const pending = await AsyncStorage.getItem('pending_actions');
      if (!pending) return;

      const actions = JSON.parse(pending);
      if (actions.length === 0) return;

      console.log('🔄 Sincronizando acciones pendientes:', actions.length);
      
      for (const action of actions) {
        // Procesar cada acción según su tipo
        // Nota: Esto es simplificado. En producción idealmente se re-ejecuta la lógica completa
        // o se usa un endpoint de API que acepte timestamps pasados.
        // Aquí solo actualizamos Firestore con los datos guardados.
        
        if (action.type === 'update_session') {
          await updateDoc(doc(db, 'asistencias', action.sessionId), action.data);
        } else if (action.type === 'create_session') {
          // Crear sesión pendiente
          await addDoc(collection(db, 'asistencias'), action.data);
        }
      }

      await AsyncStorage.removeItem('pending_actions');
      Alert.alert('Sincronización', 'Tus registros offline se han subido correctamente.');
    } catch (error) {
      console.error('Error sincronizando:', error);
    }
  };

  const queueAction = async (action) => {
    try {
      const pending = await AsyncStorage.getItem('pending_actions');
      const actions = pending ? JSON.parse(pending) : [];
      actions.push(action);
      await AsyncStorage.setItem('pending_actions', JSON.stringify(actions));
      Alert.alert('Modo Offline', 'Registro guardado localmente. Se subirá cuando tengas internet.');
    } catch (error) {
      console.error('Error encolando acción:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Cargar perfil completo del usuario desde Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            // ✅ Incluir UID en el perfil para evitar errores
            setUserProfile({ ...userDoc.data(), uid: firebaseUser.uid });
          }
          
          // ✅ Cargar sesión activa si existe (Persistencia)
          const q = query(
            collection(db, 'asistencias'), 
            where('uid', '==', firebaseUser.uid),
            where('estadoActual', '!=', 'finalizado')
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const sessionDoc = querySnapshot.docs[0];
            setActiveSession({ ...sessionDoc.data(), id: sessionDoc.id });
          }
        } catch (e) {
          console.log('Error cargando datos iniciales (posible offline):', e);
          // Intentar cargar de AsyncStorage si falla Firestore
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setActiveSession(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      // 1. Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. ✅ Cargar perfil del usuario PRIMERO (para obtener nombre correcto y rol)
      let nombreEmpleado = user.email; // Fallback por defecto
      let userRole = 'USER'; // ✅ Por defecto USER
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          // ✅ Usar 'name' como campo principal (según instrucciones), fallback a displayName → email
          nombreEmpleado = profileData.name || profileData.displayName || user.email;
          userRole = profileData.role || 'USER'; // ✅ Obtener rol del usuario
          setUserProfile(profileData);
        }
      } catch (profileError) {
        console.warn('No se pudo cargar perfil del usuario:', profileError);
      }

      // ✅ Ya no auto-registramos entrada al login
      // El usuario debe presionar "Iniciar Jornada" manualmente
      console.log('Login exitoso - Usuario debe iniciar jornada manualmente');
      return { success: true, user };
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // ✅ Ya NO finalizamos automáticamente la jornada al cerrar sesión
      // El usuario debe finalizar jornada manualmente antes de salir
      await firebaseSignOut(auth);
      setActiveSession(null);
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  };

  // ✅ NUEVA FUNCIÓN: Iniciar jornada laboral manualmente
  const iniciarJornada = async () => {
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // ✅ Verificar que no haya sesión activa
      if (activeSession && !activeSession.salida) {
        throw new Error('Ya tienes una jornada activa');
      }

      // 1. Obtener ubicación con TIMEOUT de 5 segundos
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // ✅ Promise.race para timeout
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Más rápido que High
          });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          
          const loc = await Promise.race([locationPromise, timeoutPromise]);
          location = {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude
          };

          // ✅ Verificar si está en oficina
          try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'location'));
            if (settingsDoc.exists()) {
              const officeLoc = settingsDoc.data();
              const R = 6371e3; // metros
              const φ1 = location.lat * Math.PI/180;
              const φ2 = officeLoc.lat * Math.PI/180;
              const Δφ = (officeLoc.lat - location.lat) * Math.PI/180;
              const Δλ = (officeLoc.lon - location.lon) * Math.PI/180;

              const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const d = R * c;

              location.tipo = d <= (officeLoc.radius || 100) ? 'Oficina' : 'Remoto';
              location.distanciaOficina = Math.round(d);
            } else {
              location.tipo = 'Remoto (Sin Config)';
            }
          } catch (e) {
            console.log('Error verificando oficina:', e);
            location.tipo = 'Remoto (Error)';
          }
        }
      } catch (locError) {
        console.warn('No se pudo obtener ubicación (timeout o error):', locError.message);
        // ✅ Continuar sin ubicación
      }

      // 2. Obtener información del dispositivo
      const deviceInfo = {
        brand: 'Android',
        manufacturer: 'Unknown',
        modelName: Platform.constants?.Model || 'Unknown',
        osName: Platform.OS,
        osVersion: Platform.Version?.toString() || 'Unknown'
      };

      // 3. Obtener nombre del empleado desde userProfile
      const nombreEmpleado = userProfile?.name || userProfile?.displayName || user.email.split('@')[0];

      // 4. Registrar entrada en asistencias
      // ✅ Usar fecha LOCAL del dispositivo (lo que el usuario ve)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const asistenciaData = {
        uid: user.uid,
        empleadoEmail: user.email,
        empleadoNombre: nombreEmpleado,
        fecha: today,
        entrada: {
          hora: Timestamp.now(),
          ubicacion: location,
          dispositivo: `${deviceInfo.brand} ${deviceInfo.modelName}`
        },
        breaks: [],
        almuerzo: null,
        salida: null,
        estadoActual: 'trabajando',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const asistenciaRef = await addDoc(collection(db, 'asistencias'), asistenciaData);
      setActiveSession({
        ...asistenciaData,
        id: asistenciaRef.id
      });

      return { success: true, sessionId: asistenciaRef.id };
    } catch (error) {
      console.error('Error iniciando jornada:', error);
      throw error;
    }
  };

  const registrarBreak = async () => {
    if (!activeSession) return;
    
    // ✅ Validar máximo 2 breaks
    if (activeSession.breaks && activeSession.breaks.length >= 2) {
      throw new Error('Has alcanzado el límite máximo de 2 breaks por día.');
    }

    try {
      const breakInicio = Timestamp.now(); // ✅ Usar Timestamp de Firestore
      const updatedBreaks = [
        ...activeSession.breaks,
        {
          inicio: breakInicio,
          fin: null,
          duracion: null
        }
      ];

      const updateData = {
        breaks: updatedBreaks,
        estadoActual: 'break',
        updatedAt: Timestamp.now()
      };

      if (isConnected) {
        await updateDoc(doc(db, 'asistencias', activeSession.id), updateData);
      } else {
        await queueAction({
          type: 'update_session',
          sessionId: activeSession.id,
          data: updateData
        });
      }

      setActiveSession({
        ...activeSession,
        breaks: updatedBreaks,
        estadoActual: 'break'
      });
    } catch (error) {
      console.error('Error registrando break:', error);
      throw error;
    }
  };

  const finalizarBreak = async () => {
    if (!activeSession || activeSession.breaks.length === 0) return;

    try {
      const breakActual = activeSession.breaks[activeSession.breaks.length - 1];
      if (breakActual.fin) return; // Ya está finalizado

      const fin = Timestamp.now(); // ✅ Usar Timestamp de Firestore
      // ✅ El inicio ya es Timestamp, convertir a Date para cálculos
      const inicioDate = breakActual.inicio.toDate ? breakActual.inicio.toDate() : new Date(breakActual.inicio);
      const finDate = fin.toDate();
      const diffMs = finDate - inicioDate;
      
      // Calcular HH:MM:SS
      const horas = Math.floor(diffMs / 1000 / 60 / 60);
      const minutos = Math.floor((diffMs / 1000 / 60) % 60);
      const segundos = Math.floor((diffMs / 1000) % 60);
      const duracionHMS = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      const updatedBreaks = [...activeSession.breaks];
      updatedBreaks[updatedBreaks.length - 1] = {
        ...breakActual,
        fin: fin,
        duracion: duracionHMS
      };

      const updateData = {
        breaks: updatedBreaks,
        estadoActual: 'trabajando',
        updatedAt: Timestamp.now()
      };

      if (isConnected) {
        await updateDoc(doc(db, 'asistencias', activeSession.id), updateData);
      } else {
        await queueAction({
          type: 'update_session',
          sessionId: activeSession.id,
          data: updateData
        });
      }

      setActiveSession({
        ...activeSession,
        breaks: updatedBreaks,
        estadoActual: 'trabajando'
      });
    } catch (error) {
      console.error('Error finalizando break:', error);
      throw error;
    }
  };

  const registrarAlmuerzo = async () => {
    if (!activeSession) return;

    // ✅ Validar máximo 1 almuerzo
    if (activeSession.almuerzo) {
      throw new Error('Ya has registrado tu hora de almuerzo hoy.');
    }

    try {
      const almuerzoInicio = Timestamp.now(); // ✅ Usar Timestamp de Firestore

      const updateData = {
        almuerzo: {
          inicio: almuerzoInicio,
          fin: null,
          duracion: null
        },
        estadoActual: 'almuerzo',
        updatedAt: Timestamp.now()
      };

      if (isConnected) {
        await updateDoc(doc(db, 'asistencias', activeSession.id), updateData);
      } else {
        await queueAction({
          type: 'update_session',
          sessionId: activeSession.id,
          data: updateData
        });
      }

      setActiveSession({
        ...activeSession,
        almuerzo: {
          inicio: almuerzoInicio,
          fin: null,
          duracion: null
        },
        estadoActual: 'almuerzo'
      });
    } catch (error) {
      console.error('Error registrando almuerzo:', error);
      throw error;
    }
  };

  const finalizarAlmuerzo = async () => {
    if (!activeSession || !activeSession.almuerzo) return;

    try {
      const fin = Timestamp.now(); // ✅ Usar Timestamp de Firestore
      // ✅ El inicio ya es Timestamp, convertir a Date para cálculos
      const inicioDate = activeSession.almuerzo.inicio.toDate ? activeSession.almuerzo.inicio.toDate() : new Date(activeSession.almuerzo.inicio);
      const finDate = fin.toDate();
      const diffMs = finDate - inicioDate;
      
      // Calcular HH:MM:SS
      const horas = Math.floor(diffMs / 1000 / 60 / 60);
      const minutos = Math.floor((diffMs / 1000 / 60) % 60);
      const segundos = Math.floor((diffMs / 1000) % 60);
      const duracionHMS = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      const updateData = {
        almuerzo: {
          ...activeSession.almuerzo,
          fin: fin,
          duracion: duracionHMS
        },
        estadoActual: 'trabajando',
        updatedAt: Timestamp.now()
      };

      if (isConnected) {
        await updateDoc(doc(db, 'asistencias', activeSession.id), updateData);
      } else {
        await queueAction({
          type: 'update_session',
          sessionId: activeSession.id,
          data: updateData
        });
      }

      setActiveSession({
        ...activeSession,
        almuerzo: {
          ...activeSession.almuerzo,
          fin: fin,
          duracion: duracionHMS
        },
        estadoActual: 'trabajando'
      });
    } catch (error) {
      console.error('Error finalizando almuerzo:', error);
      throw error;
    }
  };

  const finalizarJornada = async () => {
    if (!activeSession) return;

    try {
      // ✅ Obtener ubicación con TIMEOUT de 5 segundos
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // ✅ Promise.race para timeout
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Más rápido que High
          });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          
          const loc = await Promise.race([locationPromise, timeoutPromise]);
          location = {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude
          };
        }
      } catch (locError) {
        console.warn('No se pudo obtener ubicación (timeout o error):', locError.message);
        // ✅ Continuar sin ubicación
      }

      // Calcular horas trabajadas en formato HH:MM:SS
      // ✅ Convertir Timestamp a Date para cálculos
      const entradaDate = activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora);
      const salidaTimestamp = Timestamp.now();
      const salidaDate = salidaTimestamp.toDate();
      
      // Calcular tiempo total trabajado (sin descansos aún)
      const diffMs = salidaDate - entradaDate;
      
      // Convertir duraciones HH:MM:SS a milisegundos y sumar
      let tiempoDescansoMs = 0;
      
      activeSession.breaks.forEach(b => {
        if (b.duracion && typeof b.duracion === 'string' && b.duracion.includes(':')) {
          const [h, m, s] = b.duracion.split(':').map(Number);
          tiempoDescansoMs += (h * 60 * 60 + m * 60 + s) * 1000;
        }
      });
      
      if (activeSession.almuerzo?.duracion && typeof activeSession.almuerzo.duracion === 'string' && activeSession.almuerzo.duracion.includes(':')) {
        const [h, m, s] = activeSession.almuerzo.duracion.split(':').map(Number);
        tiempoDescansoMs += (h * 60 * 60 + m * 60 + s) * 1000;
      }

      // Tiempo trabajado efectivo = tiempo total - descansos
      const tiempoTrabajadoMs = diffMs - tiempoDescansoMs;
      
      // Convertir a HH:MM:SS
      const horas = Math.floor(tiempoTrabajadoMs / 1000 / 60 / 60);
      const minutos = Math.floor((tiempoTrabajadoMs / 1000 / 60) % 60);
      const segundos = Math.floor((tiempoTrabajadoMs / 1000) % 60);
      const horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      const updateData = {
        salida: {
          hora: salidaTimestamp, // ✅ Usar Timestamp de Firestore
          ubicacion: location
        },
        horasTrabajadas: horasTrabajadas,
        estadoActual: 'finalizado',
        updatedAt: Timestamp.now()
      };

      if (isConnected) {
        await updateDoc(doc(db, 'asistencias', activeSession.id), updateData);
      } else {
        await queueAction({
          type: 'update_session',
          sessionId: activeSession.id,
          data: updateData
        });
      }

      // ✅ Solo actualizar el estado de la sesión a finalizado
      // NO cerrar sesión automáticamente
      setActiveSession({
        ...activeSession,
        ...updateData,
        estadoActual: 'finalizado'
      });
    } catch (error) {
      console.error('Error finalizando jornada:', error);
      throw error;
    }
  };

  // ✅ PASO 1.1: Sistema de permisos basado en roles
  const hasPermission = (permission) => {
    if (!userProfile) return false;
    
    // SUPER_ADMIN tiene todos los permisos
    if (userProfile.role === 'SUPER_ADMIN') return true;
    
    // ADMIN tiene permisos específicos
    if (userProfile.role === 'ADMIN') {
      const adminPermissions = [
        'asistencias.ver_todos',
        'reportes.generar',
        'usuarios.ver',
        'chat'
      ];
      return adminPermissions.includes(permission);
    }
    
    // USER solo tiene permisos básicos
    if (userProfile.role === 'USER') {
      const userPermissions = ['chat', 'asistencia.propia'];
      return userPermissions.includes(permission);
    }
    
    return false;
  };

  const value = {
    user,
    userProfile,
    loading,
    activeSession,
    signIn,
    signOut,
    iniciarJornada, // ✅ Nueva función
    registrarBreak,
    finalizarBreak,
    registrarAlmuerzo,
    finalizarAlmuerzo,
    finalizarJornada,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
