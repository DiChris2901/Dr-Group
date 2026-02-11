import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_KEY = '@asistencia_pendiente_sync';

/**
 * Genera un UUID simple para identificar acciones
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Obtiene la cola de sincronización pendiente desde AsyncStorage
 */
export const obtenerColaPendiente = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {
      uid: null,
      fecha: null,
      acciones: [],
      lastSync: null
    };
  } catch (error) {
    console.error('Error al leer cola de sincronización:', error);
    return {
      uid: null,
      fecha: null,
      acciones: [],
      lastSync: null
    };
  }
};

/**
 * Guarda una acción en la cola de sincronización
 */
export const guardarEnCola = async (uid, fecha, accion) => {
  try {
    const cola = await obtenerColaPendiente();
    
    // Inicializar si es primera acción del día
    if (!cola.uid || cola.fecha !== fecha) {
      cola.uid = uid;
      cola.fecha = fecha;
      cola.acciones = [];
    }
    
    // Agregar nueva acción
    cola.acciones.push(accion);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cola));
    console.log('✅ Acción guardada en cola:', accion.tipo);
    return true;
  } catch (error) {
    console.error('❌ Error al guardar en cola:', error);
    return false;
  }
};

/**
 * Marca una acción como sincronizada
 */
export const marcarComoSincronizado = async (accionId) => {
  try {
    const cola = await obtenerColaPendiente();
    
    const accion = cola.acciones.find(a => a.id === accionId);
    if (accion) {
      accion.estado = 'sincronizado';
      accion.syncTimestamp = new Date().toISOString();
    }
    
    cola.lastSync = new Date().toISOString();
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cola));
    console.log('✅ Acción marcada como sincronizada:', accionId);
    return true;
  } catch (error) {
    console.error('❌ Error al marcar como sincronizado:', error);
    return false;
  }
};

/**
 * Verifica si hay acciones pendientes de sincronización
 */
export const hayAccionesPendientes = async () => {
  try {
    const cola = await obtenerColaPendiente();
    return cola.acciones.some(a => a.estado === 'pendiente');
  } catch (error) {
    console.error('Error al verificar acciones pendientes:', error);
    return false;
  }
};

/**
 * Limpia acciones sincronizadas antiguas (más de 7 días)
 */
export const limpiarAccionesSincronizadas = async () => {
  try {
    const cola = await obtenerColaPendiente();
    const ahora = new Date();
    const sietesDiasAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    cola.acciones = cola.acciones.filter(accion => {
      if (accion.estado === 'pendiente') {
        return true; // Mantener pendientes siempre
      }
      const fechaSync = new Date(accion.syncTimestamp || accion.timestamp);
      return fechaSync > sietesDiasAtras;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cola));
    console.log('✅ Cola limpiada');
  } catch (error) {
    console.error('Error al limpiar cola:', error);
  }
};

/**
 * Intenta sincronizar una acción específica a Firestore
 */
export const intentarSincronizar = async (uid, fecha, accion) => {
  try {
    const docRef = doc(db, 'asistencias', `${uid}_${fecha}`);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Documento no existe, crear nuevo
      const nuevoDoc = construirDocumentoAsistencia(uid, fecha, accion);
      await setDoc(docRef, nuevoDoc);
      console.log('✅ Documento creado en Firestore:', accion.tipo);
      return true;
    } else {
      // Documento existe, actualizar
      const datosActuales = docSnap.data();
      const actualizacion = aplicarAccion(datosActuales, accion);
      await updateDoc(docRef, actualizacion);
      console.log('✅ Documento actualizado en Firestore:', accion.tipo);
      return true;
    }
  } catch (error) {
    console.error('❌ Error al sincronizar a Firestore:', error.message);
    return false;
  }
};

/**
 * Construye un nuevo documento de asistencia basado en la primera acción
 */
const construirDocumentoAsistencia = (uid, fecha, accion) => {
  const doc = {
    uid,
    fecha,
    estadoActual: 'trabajando',
    breaks: [],
    almuerzo: {}
  };
  
  if (accion.tipo === 'entrada') {
    doc.entrada = {
      hora: accion.timestamp,
      ubicacion: accion.ubicacion || null,
      dispositivo: accion.dispositivo || null
    };
  }
  
  return doc;
};

/**
 * Aplica una acción sobre un documento existente
 */
const aplicarAccion = (datosActuales, accion) => {
  const actualizacion = {};
  
  switch (accion.tipo) {
    case 'entrada':
      actualizacion.entrada = {
        hora: accion.timestamp,
        ubicacion: accion.ubicacion || null,
        dispositivo: accion.dispositivo || null
      };
      actualizacion.estadoActual = 'trabajando';
      break;
      
    case 'inicioBreak':
      const breaks = datosActuales.breaks || [];
      breaks.push({ inicio: accion.timestamp });
      actualizacion.breaks = breaks;
      actualizacion.estadoActual = 'break';
      break;
      
    case 'finBreak':
      const breaksActualizados = datosActuales.breaks || [];
      if (breaksActualizados.length > 0) {
        const ultimoBreak = breaksActualizados[breaksActualizados.length - 1];
        if (!ultimoBreak.fin) {
          const inicioDate = new Date(ultimoBreak.inicio);
          const finDate = new Date(accion.timestamp);
          const duracionMs = finDate - inicioDate;
          const duracionHoras = Math.floor(duracionMs / (1000 * 60 * 60));
          const duracionMinutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
          const duracionSegundos = Math.floor((duracionMs % (1000 * 60)) / 1000);
          
          ultimoBreak.fin = accion.timestamp;
          ultimoBreak.duracion = `${String(duracionHoras).padStart(2, '0')}:${String(duracionMinutos).padStart(2, '0')}:${String(duracionSegundos).padStart(2, '0')}`;
        }
      }
      actualizacion.breaks = breaksActualizados;
      actualizacion.estadoActual = 'trabajando';
      break;
      
    case 'inicioAlmuerzo':
      actualizacion.almuerzo = { inicio: accion.timestamp };
      actualizacion.estadoActual = 'almuerzo';
      break;
      
    case 'finAlmuerzo':
      const almuerzo = datosActuales.almuerzo || {};
      if (almuerzo.inicio) {
        const inicioDate = new Date(almuerzo.inicio);
        const finDate = new Date(accion.timestamp);
        const duracionMs = finDate - inicioDate;
        const duracionHoras = Math.floor(duracionMs / (1000 * 60 * 60));
        const duracionMinutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
        const duracionSegundos = Math.floor((duracionMs % (1000 * 60)) / 1000);
        
        almuerzo.fin = accion.timestamp;
        almuerzo.duracion = `${String(duracionHoras).padStart(2, '0')}:${String(duracionMinutos).padStart(2, '0')}:${String(duracionSegundos).padStart(2, '0')}`;
      }
      actualizacion.almuerzo = almuerzo;
      actualizacion.estadoActual = 'trabajando';
      break;
      
    case 'salida':
      actualizacion.salida = { hora: accion.timestamp };
      actualizacion.estadoActual = 'finalizado';
      
      // Calcular horas trabajadas
      if (datosActuales.entrada && datosActuales.entrada.hora) {
        const entradaDate = new Date(datosActuales.entrada.hora);
        const salidaDate = new Date(accion.timestamp);
        let tiempoTrabajadoMs = salidaDate - entradaDate;
        
        // Restar breaks
        (datosActuales.breaks || []).forEach(b => {
          if (b.fin) {
            const inicioBreak = new Date(b.inicio);
            const finBreak = new Date(b.fin);
            tiempoTrabajadoMs -= (finBreak - inicioBreak);
          }
        });
        
        // Restar almuerzo
        if (datosActuales.almuerzo && datosActuales.almuerzo.fin) {
          const inicioAlmuerzo = new Date(datosActuales.almuerzo.inicio);
          const finAlmuerzo = new Date(datosActuales.almuerzo.fin);
          tiempoTrabajadoMs -= (finAlmuerzo - inicioAlmuerzo);
        }
        
        const horas = Math.floor(tiempoTrabajadoMs / (1000 * 60 * 60));
        const minutos = Math.floor((tiempoTrabajadoMs % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((tiempoTrabajadoMs % (1000 * 60)) / 1000);
        
        actualizacion.horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
      }
      break;
  }
  
  return actualizacion;
};

/**
 * Procesa toda la cola de sincronización pendiente
 */
export const procesarColaPendiente = async () => {
  try {
    const cola = await obtenerColaPendiente();
    
    if (!cola.acciones || cola.acciones.length === 0) {
      console.log('No hay acciones pendientes para sincronizar');
      return { exitosas: 0, fallidas: 0 };
    }
    
    let exitosas = 0;
    let fallidas = 0;
    
    // Procesar acciones pendientes en orden
    for (const accion of cola.acciones) {
      if (accion.estado === 'pendiente') {
        const exito = await intentarSincronizar(cola.uid, cola.fecha, accion);
        if (exito) {
          await marcarComoSincronizado(accion.id);
          exitosas++;
        } else {
          fallidas++;
        }
      }
    }
    
    console.log(`✅ Sincronización completada: ${exitosas} exitosas, ${fallidas} fallidas`);
    
    // Limpiar acciones antiguas sincronizadas
    await limpiarAccionesSincronizadas();
    
    return { exitosas, fallidas };
  } catch (error) {
    console.error('❌ Error al procesar cola:', error);
    return { exitosas: 0, fallidas: 0 };
  }
};

/**
 * Obtiene la sesión activa desde la cola local (para mostrar contador offline)
 */
export const obtenerSesionLocal = async () => {
  try {
    const cola = await obtenerColaPendiente();
    
    if (!cola.acciones || cola.acciones.length === 0) {
      return null;
    }
    
    // Construir sesión desde acciones locales
    const sesion = {
      estadoActual: 'finalizado',
      entrada: null,
      breaks: [],
      almuerzo: {},
      salida: null
    };
    
    for (const accion of cola.acciones) {
      switch (accion.tipo) {
        case 'entrada':
          sesion.entrada = {
            hora: accion.timestamp,
            ubicacion: accion.ubicacion,
            dispositivo: accion.dispositivo
          };
          sesion.estadoActual = 'trabajando';
          break;
          
        case 'inicioBreak':
          sesion.breaks.push({ inicio: accion.timestamp });
          sesion.estadoActual = 'break';
          break;
          
        case 'finBreak':
          if (sesion.breaks.length > 0) {
            const ultimoBreak = sesion.breaks[sesion.breaks.length - 1];
            if (!ultimoBreak.fin) {
              ultimoBreak.fin = accion.timestamp;
            }
          }
          sesion.estadoActual = 'trabajando';
          break;
          
        case 'inicioAlmuerzo':
          sesion.almuerzo = { inicio: accion.timestamp };
          sesion.estadoActual = 'almuerzo';
          break;
          
        case 'finAlmuerzo':
          if (sesion.almuerzo.inicio) {
            sesion.almuerzo.fin = accion.timestamp;
          }
          sesion.estadoActual = 'trabajando';
          break;
          
        case 'salida':
          sesion.salida = { hora: accion.timestamp };
          sesion.estadoActual = 'finalizado';
          break;
      }
    }
    
    return sesion;
  } catch (error) {
    console.error('Error al obtener sesión local:', error);
    return null;
  }
};
