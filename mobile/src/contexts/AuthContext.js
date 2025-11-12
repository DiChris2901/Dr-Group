import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import * as Location from 'expo-location';
import * as Device from 'expo-device';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Cargar perfil completo del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
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

      // 2. ✅ Cargar perfil del usuario PRIMERO (para obtener nombre correcto)
      let nombreEmpleado = user.email; // Fallback por defecto
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          // ✅ Usar 'name' como campo principal (según instrucciones), fallback a displayName → email
          nombreEmpleado = profileData.name || profileData.displayName || user.email;
          setUserProfile(profileData);
        }
      } catch (profileError) {
        console.warn('No se pudo cargar perfil del usuario:', profileError);
      }

      // 3. Obtener ubicación
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          location = {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude
          };
        }
      } catch (locError) {
        console.warn('No se pudo obtener ubicación:', locError);
      }

      // 4. Obtener información del dispositivo
      const deviceInfo = {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion
      };

      // 5. Registrar entrada en asistencias
      // ✅ Usar fecha local en lugar de UTC para evitar desajustes de zona horaria
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const asistenciaData = {
        uid: user.uid, // ✅ Cambiar empleadoId por uid (consistencia con dashboard)
        empleadoEmail: user.email,
        empleadoNombre: nombreEmpleado, // ✅ Ahora tiene el nombre correcto
        fecha: today,
        entrada: {
          hora: Timestamp.now(), // ✅ Usar Timestamp de Firestore (maneja zona horaria correctamente)
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

      return { success: true, user };
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Si hay sesión activa y no ha finalizado, marcar como finalizada
      if (activeSession && !activeSession.salida) {
        await updateDoc(doc(db, 'asistencias', activeSession.id), {
          salida: {
            hora: Timestamp.now() // ✅ Usar Timestamp de Firestore
          },
          estadoActual: 'finalizado',
          updatedAt: Timestamp.now()
        });
      }
      
      await firebaseSignOut(auth);
      setActiveSession(null);
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  };

  const registrarBreak = async () => {
    if (!activeSession) return;
    
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

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        breaks: updatedBreaks,
        estadoActual: 'break',
        updatedAt: Timestamp.now()
      });

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

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        breaks: updatedBreaks,
        estadoActual: 'trabajando',
        updatedAt: Timestamp.now()
      });

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

    try {
      const almuerzoInicio = Timestamp.now(); // ✅ Usar Timestamp de Firestore

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        almuerzo: {
          inicio: almuerzoInicio,
          fin: null,
          duracion: null
        },
        estadoActual: 'almuerzo',
        updatedAt: Timestamp.now()
      });

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

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        almuerzo: {
          ...activeSession.almuerzo,
          fin: fin,
          duracion: duracionHMS
        },
        estadoActual: 'trabajando',
        updatedAt: Timestamp.now()
      });

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
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          location = {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude
          };
        }
      } catch (locError) {
        console.warn('No se pudo obtener ubicación:', locError);
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

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        salida: {
          hora: salidaTimestamp, // ✅ Usar Timestamp de Firestore
          ubicacion: location
        },
        horasTrabajadas: horasTrabajadas,
        estadoActual: 'finalizado',
        updatedAt: Timestamp.now()
      });

      setActiveSession(null);
      
      // ✅ Cerrar sesión automáticamente después de finalizar jornada
      await signOut();
    } catch (error) {
      console.error('Error finalizando jornada:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    activeSession,
    signIn,
    signOut,
    registrarBreak,
    finalizarBreak,
    registrarAlmuerzo,
    finalizarAlmuerzo,
    finalizarJornada
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
