import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, Timestamp, query, where, getDocs, onSnapshot, getDocsFromServer } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';

const ACTIVE_SESSION_KEY = '@active_session_state';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false); // 🔒 CANDADO: Prevenir múltiples inicios
  const [lastCreatedSessionId, setLastCreatedSessionId] = useState(null); // 🔒 TRACK: Último registro creado

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

  // 🔒 CAPA 1: Verificar si ya se creó registro hoy (Cache Local)
  const checkTodaySessionInCache = async (uid, todayStr) => {
    try {
      const cacheKey = `session_${uid}_${todayStr}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const sessionData = JSON.parse(cached);
        console.log('✅ CAPA 1 - Registro encontrado en caché local:', sessionData.sessionId);
        return sessionData;
      }
      return null;
    } catch (error) {
      console.error('Error verificando caché local:', error);
      return null;
    }
  };

  // 🔒 CAPA 1: Guardar registro en cache local
  const saveTodaySessionInCache = async (uid, todayStr, sessionId) => {
    try {
      const cacheKey = `session_${uid}_${todayStr}`;
      const data = { sessionId, timestamp: Date.now() };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      console.log('💾 Registro guardado en caché local:', cacheKey);
    } catch (error) {
      console.error('Error guardando en caché:', error);
    }
  };

  const syncPendingActions = async () => {
    try {
      const pending = await AsyncStorage.getItem('pending_actions');
      if (!pending) return;

      const actions = JSON.parse(pending);
      if (actions.length === 0) return;

      console.log('🔄 Sincronizando acciones pendientes:', actions.length);
      
      // 🔒 FILTRAR DUPLICADOS: Solo procesar acciones únicas
      const uniqueActions = [];
      const seenSessionIds = new Set();
      
      for (const action of actions) {
        if (action.type === 'create_session') {
          // Verificar si ya procesamos esta fecha
          const cacheKey = `session_${action.data.uid}_${action.data.fecha}`;
          if (seenSessionIds.has(cacheKey)) {
            console.log('⚠️ Acción duplicada detectada, saltando:', cacheKey);
            continue;
          }
          seenSessionIds.add(cacheKey);
          uniqueActions.push(action);
        } else {
          uniqueActions.push(action);
        }
      }
      
      console.log(`📊 Acciones únicas a sincronizar: ${uniqueActions.length} de ${actions.length}`);
      
      for (const action of uniqueActions) {
        if (action.type === 'update_session') {
          await updateDoc(doc(db, 'asistencias', action.sessionId), action.data);
        } else if (action.type === 'create_session') {
          // 🔒 Verificar que no exista antes de crear
          const qCheck = query(
            collection(db, 'asistencias'),
            where('uid', '==', action.data.uid),
            where('fecha', '==', action.data.fecha)
          );
          const existingSnap = await getDocs(qCheck);
          
          if (existingSnap.empty) {
            const newDoc = await addDoc(collection(db, 'asistencias'), action.data);
            console.log('✅ Sesión offline creada:', newDoc.id);
          } else {
            console.log('⚠️ Sesión ya existe en Firestore, saltando creación');
          }
        }
      }

      await AsyncStorage.removeItem('pending_actions');
      if (uniqueActions.length > 0) {
        Alert.alert('Sincronización', 'Tus registros offline se han subido correctamente.');
      }
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

            // ✅ Registrar Push Token (Solo si hay internet)
            if (isConnected) {
              NotificationService.registerForPushNotificationsAsync().then(async (token) => {
                if (token) {
                  await updateDoc(doc(db, 'users', firebaseUser.uid), {
                    pushToken: token,
                    lastLogin: Timestamp.now(),
                    deviceInfo: {
                      os: Platform.OS,
                      version: Platform.Version
                    }
                  });
                }
              }).catch(e => console.log('Error token push:', e));
            }
          }
          
          // NOTA: La carga de sesión activa se maneja ahora en el useEffect de abajo con onSnapshot
          // para soportar actualizaciones en tiempo real (ej. reapertura por admin).
        } catch (e) {
          console.log('Error cargando datos iniciales (posible offline):', e);
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

  // ✅ NUEVO: Listener en tiempo real para la sesión de HOY
  // Esto permite detectar automáticamente si un admin reabre la jornada
  useEffect(() => {
    if (!user) {
      setActiveSession(null);
      return () => {}; // ✅ Cleanup vacío cuando no hay usuario
    }

    // ✅ PASO 1: Intentar cargar sesión guardada de AsyncStorage (instantáneo)
    const loadSavedSession = async () => {
      try {
        const savedSession = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          
          // Verificar que sea del día actual
          if (parsed.fecha === todayStr && parsed.estadoActual !== 'finalizado') {
            // Reconstruir Timestamp de entrada
            if (parsed.entrada?.hora && typeof parsed.entrada.hora === 'number') {
              parsed.entrada.hora = Timestamp.fromMillis(parsed.entrada.hora);
            }
            setActiveSession(parsed);
          } else {
            // Limpiar sesión antigua o finalizada
            await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
          }
        }
      } catch (error) {
        console.error('Error cargando sesión guardada:', error);
      }
    };

    loadSavedSession();

    // ✅ PASO 2: Listener de Firestore (override si hay diferencias)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const q = query(
      collection(db, 'asistencias'),
      where('uid', '==', user.uid),
      where('fecha', '==', todayStr)
    );

    const unsubscribe = onSnapshot(
      q, 
      async (snapshot) => {
        if (!snapshot.empty) {
          // Si existe registro de hoy, lo cargamos (sea abierto o cerrado)
          // Esto permite que si el admin borra la 'salida', la app se entere inmediatamente
          const docData = snapshot.docs[0].data();
          const sessionState = { ...docData, id: snapshot.docs[0].id };
          setActiveSession(sessionState);
          
          // ✅ Actualizar AsyncStorage también
          try {
            const sessionToSave = {
              ...sessionState,
              entrada: sessionState.entrada?.hora ? {
                ...sessionState.entrada,
                hora: sessionState.entrada.hora.toMillis ? sessionState.entrada.hora.toMillis() : new Date(sessionState.entrada.hora).getTime()
              } : sessionState.entrada
            };
            await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionToSave));
          } catch (e) {
            console.error('Error actualizando AsyncStorage:', e);
          }
        } else {
          // Si no hay registro de hoy, buscamos si hay alguna sesión ABIERTA de días anteriores
        // (Caso borde: olvidó cerrar ayer)
        // Nota: Esto requiere una query separada única vez, no listener constante para no complicar
        checkPreviousOpenSession(user.uid);
      }
    }, (error) => {
      console.log("Error escuchando sesión:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const checkPreviousOpenSession = async (uid) => {
    try {
      const q = query(
        collection(db, 'asistencias'),
        where('uid', '==', uid),
        where('estadoActual', '!=', 'finalizado')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        // Solo si NO es de hoy (porque la de hoy ya la hubiera detectado el listener)
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (docData.fecha !== todayStr) {
           setActiveSession({ ...docData, id: snapshot.docs[0].id });
        }
      } else {
        setActiveSession(null);
      }
    } catch (e) {
      console.log("Error buscando sesiones previas:", e);
    }
  };

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
      // 🔒 CAPA 1: CANDADO DE PROCESAMIENTO (Prevenir doble tap)
      if (isStartingSession) {
        console.log('⚠️ Ya se está iniciando una jornada, ignorando toque duplicado');
        throw new Error('Ya se está procesando el inicio de jornada. Por favor espera...');
      }
      
      setIsStartingSession(true); // 🔒 Activar candado

      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // ✅ Verificar que no haya sesión activa
      if (activeSession && !activeSession.salida) {
        throw new Error('Ya tienes una jornada activa');
      }

      // ⚡ OPTIMIZACIÓN: Ejecutar validaciones en PARALELO
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // � CAPA 1: Verificar caché local PRIMERO (más rápido y funciona offline)
      const cachedSession = await checkTodaySessionInCache(user.uid, todayStr);
      if (cachedSession) {
        console.log('✅ Registro encontrado en caché, cargando sesión existente...');
        try {
          const docSnap = await getDoc(doc(db, 'asistencias', cachedSession.sessionId));
          if (docSnap.exists()) {
            const sessionData = { id: docSnap.id, ...docSnap.data() };
            setActiveSession(sessionData);
            return { success: true, sessionId: docSnap.id, resumed: true, fromCache: true };
          }
        } catch (e) {
          console.warn('No se pudo cargar sesión desde Firestore, continuando...');
        }
      }
      
      // 🚀 Iniciar queries y ubicación en PARALELO (no esperar secuencialmente)
      const validationsPromise = (async () => {
        // 🔒 CAPA 2: Query con retry y timeout para conexiones lentas
        const qToday = query(
          collection(db, 'asistencias'),
          where('uid', '==', user.uid),
          where('fecha', '==', todayStr)
        );
        
        // ✅ Intentar obtener desde el servidor con RETRY y TIMEOUT
        let snapshotToday;
        const maxRetries = 2;
        let attempt = 0;
        
        while (attempt <= maxRetries) {
          try {
            attempt++;
            console.log(`🔍 CAPA 2 - Intento ${attempt}/${maxRetries + 1} de consultar Firestore...`);
            
            // ⚡ Query con timeout de 8 segundos
            const queryPromise = getDocsFromServer(qToday);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout Firestore')), 8000)
            );
            
            snapshotToday = await Promise.race([queryPromise, timeoutPromise]);
            console.log('✅ Query exitosa en intento', attempt);
            break; // Éxito, salir del loop
          } catch (e) {
            console.log(`⚠️ Intento ${attempt} falló:`, e.message);
            
            if (attempt > maxRetries) {
              // Último intento: usar caché local
              console.log('⚠️ Todos los intentos fallaron, usando caché local');
              try {
                snapshotToday = await getDocs(qToday);
              } catch (cacheError) {
                console.error('❌ Error crítico: No se puede acceder ni a servidor ni a caché');
                throw new Error('Sin conexión a internet. Por favor verifica tu conexión y intenta nuevamente.');
              }
            } else {
              // Esperar 1 segundo antes del siguiente intento
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!snapshotToday.empty) {
          // ✅ Ordenar por creación descendente para asegurar que tomamos la última sesión (la más reciente)
          const sessions = snapshotToday.docs.map(d => ({ id: d.id, ...d.data() }));
          sessions.sort((a, b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
              return timeB - timeA;
          });

          const existingSession = sessions[0];
          console.log(`🔎 Verificando sesión ${existingSession.id}. Salida:`, existingSession.salida ? 'SÍ' : 'NO');

          if (existingSession.salida) {
            throw new Error('Ya finalizaste tu jornada de hoy. Si fue un error, contacta a tu supervisor para que autorice una reapertura.');
          }
          
          // ✅ Si existe pero NO tiene salida, retornar sesión existente
          return { existingSession, shouldResume: true };
        }

        // ✅ VALIDACIÓN DE HORARIO DE INICIO (Ventana de 5 minutos) - Solo si NO hay sesión existente
        try {
          const scheduleDoc = await getDoc(doc(db, 'settings', 'work_schedule'));
          if (scheduleDoc.exists()) {
            const schedule = scheduleDoc.data();
            if (schedule.startTime) {
              const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
              const workStartDate = new Date(now);
              workStartDate.setHours(startHour, startMinute, 0, 0);
              const allowedLoginTime = new Date(workStartDate.getTime() - 5 * 60000);
              
              if (now < allowedLoginTime) {
                const allowedTimeStr = allowedLoginTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                throw new Error(`Aún es muy temprano. Puedes iniciar jornada a partir de las ${allowedTimeStr}`);
              }
            }
          }
        } catch (scheduleError) {
          if (scheduleError.message.includes('Aún es muy temprano')) {
            throw scheduleError;
          }
          console.warn('Error validando horario:', scheduleError);
        }
        
        return { shouldResume: false };
      })();

      // 🚀 Obtener ubicación en PARALELO (mientras se validan datos)
      const locationPromise = (async () => {
        let location = null;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            try {
              // ⚡ OPTIMIZADO: Timeout reducido a 5 segundos (antes 10)
              const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000) // ⚡ 5s en lugar de 10s
              );
              
              const loc = await Promise.race([locationPromise, timeoutPromise]);
              location = {
                lat: loc.coords.latitude,
                lon: loc.coords.longitude
              };
            } catch (currentLocError) {
              console.warn('Timeout GPS, usando última ubicación conocida...');
              // ⚡ Fallback inmediato a última ubicación conocida
              const lastLoc = await Location.getLastKnownPositionAsync();
              if (lastLoc) {
                location = {
                  lat: lastLoc.coords.latitude,
                  lon: lastLoc.coords.longitude,
                  isFallback: true
                };
              }
            }

            // ✅ Verificar si está en oficina (opcional, no bloquea si falla)
            if (location) {
              try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'location'));
                if (settingsDoc.exists()) {
                  const officeLoc = settingsDoc.data();
                  const R = 6371e3;
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
          }
        } catch (locError) {
          console.warn('No se pudo obtener ubicación:', locError.message);
        }
        
        // ✅ Siempre retornar algo (aunque sea fallback)
        return location || { tipo: 'Remoto (Sin GPS)', isFallback: true };
      })();

      // ⚡ ESPERAR A QUE AMBAS OPERACIONES TERMINEN EN PARALELO
      const [validationResult, location] = await Promise.all([validationsPromise, locationPromise]);

      // Si hay sesión existente, retornarla inmediatamente
      if (validationResult.shouldResume) {
        setActiveSession({
          ...validationResult.existingSession,
          id: validationResult.existingSession.id
        });
        return { success: true, sessionId: validationResult.existingSession.id, resumed: true };
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
      // Nota: 'now' ya fue declarado al inicio de la función para validaciones
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // 🔒 CAPA 3: Generar ID único de sesión (timestamp + uid)
      const sessionUniqueId = `${user.uid}_${today}_${Date.now()}`;
      
      // 🔒 CAPA 3: Verificar si acabamos de crear este registro (prevenir doble tap)
      if (lastCreatedSessionId && lastCreatedSessionId.startsWith(`${user.uid}_${today}`)) {
        const timeSinceLastCreation = Date.now() - parseInt(lastCreatedSessionId.split('_')[2]);
        if (timeSinceLastCreation < 5000) { // Menos de 5 segundos
          console.log('⚠️ CAPA 3 - Registro duplicado detectado (menos de 5s desde último), abortando');
          throw new Error('Ya se está procesando tu registro. Por favor espera...');
        }
      }
      
      const asistenciaData = {
        uid: user.uid,
        empleadoEmail: user.email,
        empleadoNombre: nombreEmpleado,
        fecha: today,
        sessionUniqueId, // 🔒 ID único para detectar duplicados
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

      // 🔒 CAPA 3: ÚLTIMA VERIFICACIÓN antes de crear (por si acaso)
      const finalCheck = query(
        collection(db, 'asistencias'),
        where('uid', '==', user.uid),
        where('fecha', '==', today)
      );
      const finalSnapshot = await getDocs(finalCheck);
      
      if (!finalSnapshot.empty) {
        console.log('⚠️ CAPA 3 - Registro detectado en última verificación, usando existente');
        const existingDoc = finalSnapshot.docs[0];
        const existingData = { id: existingDoc.id, ...existingDoc.data() };
        setActiveSession(existingData);
        await saveTodaySessionInCache(user.uid, today, existingDoc.id);
        return { success: true, sessionId: existingDoc.id, resumed: true, preventedDuplicate: true };
      }

      const asistenciaRef = await addDoc(collection(db, 'asistencias'), asistenciaData);
      console.log('✅ Registro creado exitosamente:', asistenciaRef.id);
      
      // 🔒 Guardar en tracking para prevenir duplicados
      setLastCreatedSessionId(sessionUniqueId);
      
      // 🔒 Guardar en caché local
      await saveTodaySessionInCache(user.uid, today, asistenciaRef.id);
      
      const sessionState = {
        ...asistenciaData,
        id: asistenciaRef.id
      };
      
      setActiveSession(sessionState);
      
      // ✅ Persistir activeSession completa para recuperar al reabrir app
      try {
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({
          ...sessionState,
          entrada: {
            ...sessionState.entrada,
            hora: sessionState.entrada.hora.toMillis ? sessionState.entrada.hora.toMillis() : new Date(sessionState.entrada.hora).getTime()
          }
        }));
      } catch (e) {
        console.error('Error persistiendo activeSession:', e);
      }

      // ⚡ OPTIMIZADO: Notificaciones en background (no bloquean el retorno)
      Promise.all([
        NotificationService.notifyWorkDayComplete(9),
        NotificationService.updateStateNotification('trabajando', now)
      ]).catch(e => console.log('Error programando notificaciones:', e));

      return { success: true, sessionId: asistenciaRef.id };
    } catch (error) {
      // Solo loguear como error si NO es el caso controlado de jornada finalizada
      if (!error.message.includes('Ya finalizaste tu jornada')) {
        console.error('Error iniciando jornada:', error);
      }
      throw error;
    } finally {
      // 🔓 SIEMPRE liberar el candado (éxito o error)
      setIsStartingSession(false);
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

      // ✅ Programar notificación si el break es muy largo (15 min)
      await NotificationService.notifyLongBreak(15);
      
      // ✅ Actualizar notificación persistente
      await NotificationService.updateStateNotification('break', new Date());
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

      // ✅ Actualizar notificación persistente
      await NotificationService.updateStateNotification('trabajando', new Date());

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

      // ✅ Actualizar notificación persistente
      await NotificationService.updateStateNotification('almuerzo', new Date());

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
      
      // ✅ Actualizar notificación persistente
      await NotificationService.updateStateNotification('trabajando', new Date());
    } catch (error) {
      console.error('Error finalizando almuerzo:', error);
      throw error;
    }
  };

  const finalizarJornada = async () => {
    if (!activeSession) return;

    try {
      // ⚡ ULTRA-OPTIMIZADO: GPS con timeout agresivo de 2 segundos
      const locationPromise = (async () => {
        let location = { tipo: 'Remoto (Sin GPS)', isFallback: true }; // ⚡ Fallback por defecto
        
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            // ⚡ Intentar última ubicación conocida PRIMERO (es instantánea)
            const lastLoc = await Location.getLastKnownPositionAsync();
            if (lastLoc) {
              location = {
                lat: lastLoc.coords.latitude,
                lon: lastLoc.coords.longitude,
                isFallback: true,
                tipo: 'Remoto (Última Conocida)'
              };
            }
            
            // ⚡ SOLO si no hay última ubicación, intentar GPS actual con timeout MUY corto
            if (!lastLoc) {
              try {
                const locationPromise = Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Low, // ⚡ Precisión baja = más rápido
                });
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 2000) // ⚡ 2s timeout
                );
                
                const loc = await Promise.race([locationPromise, timeoutPromise]);
                location = {
                  lat: loc.coords.latitude,
                  lon: loc.coords.longitude,
                  tipo: 'Remoto (GPS)'
                };
              } catch (e) {
                // Ya tenemos fallback, no hacer nada
              }
            }

            // ⚡ Verificar oficina solo si tenemos coordenadas (no bloqueante)
            if (location.lat && location.lon) {
              try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'location'));
                if (settingsDoc.exists()) {
                  const officeLoc = settingsDoc.data();
                  const R = 6371e3;
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
                }
              } catch (e) {
                // Ignorar error, ya tenemos ubicación
              }
            }
          }
        } catch (e) {
          // Ya tenemos fallback por defecto
        }
        
        return location;
      })();

      // ⚡ Calcular horas trabajadas (instantáneo)
      const entradaDate = activeSession.entrada.hora.toDate ? activeSession.entrada.hora.toDate() : new Date(activeSession.entrada.hora);
      const salidaTimestamp = Timestamp.now();
      const salidaDate = salidaTimestamp.toDate();
      
      const diffMs = salidaDate - entradaDate;
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

      const tiempoTrabajadoMs = diffMs - tiempoDescansoMs;
      const horas = Math.floor(tiempoTrabajadoMs / 1000 / 60 / 60);
      const minutos = Math.floor((tiempoTrabajadoMs / 1000 / 60) % 60);
      const segundos = Math.floor((tiempoTrabajadoMs / 1000) % 60);
      const horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      // ⚡ Esperar máximo 2 segundos por GPS, luego continuar con fallback
      const location = await Promise.race([
        locationPromise,
        new Promise(resolve => setTimeout(() => resolve({ tipo: 'Remoto (Timeout)', isFallback: true }), 2000))
      ]);

      const updateData = {
        salida: {
          hora: salidaTimestamp,
          ubicacion: location
        },
        horasTrabajadas: horasTrabajadas,
        estadoActual: 'finalizado',
        updatedAt: Timestamp.now()
      };

      // ⚡ Update a Firestore
      if (isConnected) {
        await updateDoc(doc(db, 'asistencias', activeSession.id), updateData);
      } else {
        await queueAction({
          type: 'update_session',
          sessionId: activeSession.id,
          data: updateData
        });
      }

      // ✅ Limpiar AsyncStorage al finalizar
      try {
        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
      } catch (e) {
        console.error('Error limpiando AsyncStorage:', e);
      }
      
      // ✅ Actualizar estado inmediatamente
      setActiveSession({
        ...activeSession,
        ...updateData,
        estadoActual: 'finalizado'
      });
      
      // ⚡ Notificaciones en background (no bloquean)
      Promise.all([
        NotificationService.clearStateNotification(),
        NotificationService.cancelAllNotifications()
      ]).catch(e => console.log('Error limpiando notificaciones:', e));

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
    hasPermission,
    isConnected, // 🔒 Estado de conexión
    isStartingSession, // 🔒 Estado de procesamiento del inicio
    reloadUserProfile: async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile({ ...userDoc.data(), uid: user.uid });
        }
      }
    }
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
