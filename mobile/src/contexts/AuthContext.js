import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
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

      // 2. Obtener ubicación
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

      // 3. Obtener información del dispositivo
      const deviceInfo = {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion
      };

      // 4. Registrar entrada en asistencias
      const today = new Date().toISOString().split('T')[0];
      const asistenciaData = {
        empleadoId: user.uid,
        empleadoEmail: user.email,
        empleadoNombre: userProfile?.displayName || user.email,
        fecha: today,
        entrada: {
          hora: new Date().toISOString(),
          ubicacion: location,
          dispositivo: `${deviceInfo.brand} ${deviceInfo.modelName}`
        },
        breaks: [],
        almuerzo: null,
        salida: null,
        estadoActual: 'trabajando',
        createdAt: new Date(),
        updatedAt: new Date()
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
            hora: new Date().toISOString()
          },
          estadoActual: 'finalizado',
          updatedAt: new Date()
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
      const breakInicio = new Date().toISOString();
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
        updatedAt: new Date()
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

      const fin = new Date();
      const inicio = new Date(breakActual.inicio);
      const diffMs = fin - inicio;
      
      // Calcular HH:MM:SS
      const horas = Math.floor(diffMs / 1000 / 60 / 60);
      const minutos = Math.floor((diffMs / 1000 / 60) % 60);
      const segundos = Math.floor((diffMs / 1000) % 60);
      const duracionHMS = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      const updatedBreaks = [...activeSession.breaks];
      updatedBreaks[updatedBreaks.length - 1] = {
        ...breakActual,
        fin: fin.toISOString(),
        duracion: duracionHMS
      };

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        breaks: updatedBreaks,
        estadoActual: 'trabajando',
        updatedAt: new Date()
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
      const almuerzoInicio = new Date().toISOString();

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        almuerzo: {
          inicio: almuerzoInicio,
          fin: null,
          duracion: null
        },
        estadoActual: 'almuerzo',
        updatedAt: new Date()
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
      const fin = new Date();
      const inicio = new Date(activeSession.almuerzo.inicio);
      const diffMs = fin - inicio;
      
      // Calcular HH:MM:SS
      const horas = Math.floor(diffMs / 1000 / 60 / 60);
      const minutos = Math.floor((diffMs / 1000 / 60) % 60);
      const segundos = Math.floor((diffMs / 1000) % 60);
      const duracionHMS = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      await updateDoc(doc(db, 'asistencias', activeSession.id), {
        almuerzo: {
          ...activeSession.almuerzo,
          fin: fin.toISOString(),
          duracion: duracionHMS
        },
        estadoActual: 'trabajando',
        updatedAt: new Date()
      });

      setActiveSession({
        ...activeSession,
        almuerzo: {
          ...activeSession.almuerzo,
          fin: fin.toISOString(),
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
      const entrada = new Date(activeSession.entrada.hora);
      const salida = new Date();
      
      // Calcular tiempo total trabajado (sin descantos aún)
      const diffMs = salida - entrada;
      
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
          hora: salida.toISOString(),
          ubicacion: location
        },
        horasTrabajadas: horasTrabajadas,
        estadoActual: 'finalizado',
        updatedAt: new Date()
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
