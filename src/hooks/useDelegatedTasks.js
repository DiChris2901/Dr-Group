import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para gestión de tareas delegadas (colaborativas entre usuarios)
 * Collection: delegated_tasks
 * 
 * Estados del workflow:
 * - pendiente: Tarea creada, sin asignar
 * - asignada: Asignada a un usuario, sin iniciar
 * - en_progreso: Usuario trabajando activamente
 * - en_revision: Completada, esperando aprobación
 * - completada: Aprobada y cerrada exitosamente
 * - cancelada: Cancelada por el creador/admin
 * - traslado_pendiente: Solicitud de traslado pendiente de aprobación
 */
export const useDelegatedTasks = () => {
  const { currentUser, userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const TASKS_PER_PAGE = 10;

  // Función para cargar tareas con listener en tiempo real
  const loadTasks = useCallback((pageNumber = 1) => {
    if (!currentUser?.uid) {
      setTasks([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    // Query: Tareas donde el usuario es creador O asignado O tiene permiso ver_todas
    const hasPermissionVerTodas = userProfile?.permissions?.['tareas.ver_todas'] || 
                                  userProfile?.permissions?.['tareas'] ||
                                  (Array.isArray(userProfile?.permissions) && 
                                   (userProfile?.permissions.includes('tareas.ver_todas') ||
                                    userProfile?.permissions.includes('tareas')));

    let tasksQuery;
    if (hasPermissionVerTodas) {
      // Ver todas las tareas
      tasksQuery = query(
        collection(db, 'delegated_tasks'),
        orderBy('fechaCreacion', 'desc'),
        limit(TASKS_PER_PAGE)
      );
    } else {
      // Solo tareas propias (creadas o asignadas)
      tasksQuery = query(
        collection(db, 'delegated_tasks'),
        where('participantes', 'array-contains', currentUser.uid),
        orderBy('fechaCreacion', 'desc'),
        limit(TASKS_PER_PAGE)
      );
    }

    // Si es página siguiente, iniciar después del último documento
    if (pageNumber > 1 && lastVisible) {
      if (hasPermissionVerTodas) {
        tasksQuery = query(
          collection(db, 'delegated_tasks'),
          orderBy('fechaCreacion', 'desc'),
          startAfter(lastVisible),
          limit(TASKS_PER_PAGE)
        );
      } else {
        tasksQuery = query(
          collection(db, 'delegated_tasks'),
          where('participantes', 'array-contains', currentUser.uid),
          orderBy('fechaCreacion', 'desc'),
          startAfter(lastVisible),
          limit(TASKS_PER_PAGE)
        );
      }
    }

    // Listener en tiempo real con onSnapshot
    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasksData = [];
        snapshot.forEach((doc) => {
          tasksData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Guardar último documento para paginación
        if (!snapshot.empty) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        }

        setTasks(tasksData);
        setHasMore(snapshot.docs.length === TASKS_PER_PAGE);
        setCurrentPage(pageNumber);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching delegated tasks:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid, userProfile, lastVisible]);

  // Cargar tareas al montar o cambiar usuario con listener en tiempo real
  useEffect(() => {
    const unsubscribe = loadTasks(1);
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.uid, userProfile?.permissions]);

  // Funciones de paginación
  const nextPage = useCallback(() => {
    if (hasMore) {
      loadTasks(currentPage + 1);
    }
  }, [hasMore, currentPage, loadTasks]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      // Para ir a página anterior, necesitaríamos re-cargar desde el inicio
      // Simplificación: recargar desde página 1
      setLastVisible(null);
      loadTasks(1);
    }
  }, [currentPage, loadTasks]);

  const refreshTasks = useCallback(() => {
    setLastVisible(null);
    loadTasks(1);
  }, [loadTasks]);

  /**
   * Crear nueva tarea
   */
  const createTask = useCallback(async (taskData) => {
    if (!currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const newTask = {
        // INFO BÁSICA
        titulo: taskData.titulo || '',
        descripcion: taskData.descripcion || '',
        categoria: taskData.categoria || 'general',
        prioridad: taskData.prioridad || 'media', // urgente, alta, media, baja
        
        // ASIGNACIÓN
        creadoPor: {
          uid: currentUser.uid,
          nombre: userProfile?.name || userProfile?.displayName || currentUser.email,
          fecha: serverTimestamp()
        },
        asignadoA: taskData.asignadoA || null,
        
        // ESTADOS
        estadoActual: taskData.asignadoA ? 'asignada' : 'pendiente',
        historialEstados: [
          {
            estado: taskData.asignadoA ? 'asignada' : 'pendiente',
            fecha: Timestamp.now(),
            usuario: currentUser.uid
          }
        ],
        
        // TRASLADOS
        traslado: null,
        contadorTraslados: 0,
        historialAsignaciones: taskData.asignadoA ? [
          {
            usuario: taskData.asignadoA,
            fechaInicio: Timestamp.now(),
            razonCambio: 'Asignación inicial'
          }
        ] : [],
        
        // PROGRESO
        porcentajeCompletado: 0,
        checklistItems: taskData.checklistItems || [],
        
        // EMPRESA
        empresa: taskData.empresa || null,
        
        // ADJUNTOS
        archivosAdjuntos: [],
        
        // FECHAS
        fechaCreacion: serverTimestamp(),
        fechaVencimiento: taskData.fechaVencimiento ? Timestamp.fromDate(taskData.fechaVencimiento) : null,
        fechaCompletada: null,
        
        // TRACKING
        participantes: [currentUser.uid, ...(taskData.asignadoA ? [taskData.asignadoA.uid] : [])],
        ultimaActividad: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'delegated_tasks'), newTask);
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message);
      throw error;
    }
  }, [currentUser, userProfile]);

  /**
   * Actualizar tarea
   */
  const updateTask = useCallback(async (taskId, updates) => {
    if (!taskId) {
      throw new Error('ID de tarea requerido');
    }

    try {
      const taskRef = doc(db, 'delegated_tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        ultimaActividad: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  /**
   * Cambiar estado de la tarea
   */
  const changeStatus = useCallback(async (taskId, nuevoEstado, comentario = '') => {
    if (!taskId || !nuevoEstado) {
      throw new Error('ID y estado requeridos');
    }

    try {
      const taskRef = doc(db, 'delegated_tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        throw new Error('Tarea no encontrada');
      }

      const taskData = taskSnap.data();
      const historialActualizado = [
        ...(taskData.historialEstados || []),
        {
          estado: nuevoEstado,
          fecha: Timestamp.now(),
          usuario: currentUser.uid,
          comentario
        }
      ];

      const updateData = {
        estadoActual: nuevoEstado,
        historialEstados: historialActualizado,
        ultimaActividad: serverTimestamp()
      };

      if (nuevoEstado === 'completada') {
        updateData.fechaCompletada = serverTimestamp();
        updateData.porcentajeCompletado = 100;
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error changing status:', error);
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  /**
   * Asignar tarea a un usuario
   */
  const assignTask = useCallback(async (taskId, usuarioDestino) => {
    if (!taskId || !usuarioDestino) {
      throw new Error('ID de tarea y usuario requeridos');
    }

    try {
      const taskRef = doc(db, 'delegated_tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        throw new Error('Tarea no encontrada');
      }

      const taskData = taskSnap.data();
      const historialAsignaciones = [
        ...(taskData.historialAsignaciones || []),
        {
          usuario: usuarioDestino,
          fechaInicio: Timestamp.now(),
          razonCambio: 'Asignación manual'
        }
      ];

      // Agregar a participantes si no existe
      const participantes = taskData.participantes || [];
      if (!participantes.includes(usuarioDestino.uid)) {
        participantes.push(usuarioDestino.uid);
      }

      await updateDoc(taskRef, {
        asignadoA: usuarioDestino,
        estadoActual: 'asignada',
        historialAsignaciones,
        participantes,
        historialEstados: [
          ...(taskData.historialEstados || []),
          {
            estado: 'asignada',
            fecha: Timestamp.now(),
            usuario: currentUser.uid,
            comentario: `Tarea asignada a ${usuarioDestino.nombre}`
          }
        ],
        ultimaActividad: serverTimestamp()
      });
    } catch (error) {
      console.error('Error assigning task:', error);
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  /**
   * Solicitar traslado de tarea
   */
  const requestTransfer = useCallback(async (taskId, nuevoUsuario, razon = '') => {
    if (!taskId || !nuevoUsuario) {
      throw new Error('ID de tarea y usuario destino requeridos');
    }

    try {
      const taskRef = doc(db, 'delegated_tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        throw new Error('Tarea no encontrada');
      }

      const taskData = taskSnap.data();

      // Validar límite de traslados
      if ((taskData.contadorTraslados || 0) >= 3) {
        throw new Error('Se alcanzó el límite de 3 traslados por tarea');
      }

      await updateDoc(taskRef, {
        estadoActual: 'traslado_pendiente',
        traslado: {
          estado: 'solicitud_pendiente',
          solicitadoPor: {
            uid: currentUser.uid,
            nombre: userProfile?.name || userProfile?.displayName || currentUser.email,
            fecha: Timestamp.now(),
            razon
          },
          nuevoAsignado: nuevoUsuario,
          respuesta: null
        },
        ultimaActividad: serverTimestamp()
      });

      // TODO: Crear notificación para el creador
    } catch (error) {
      console.error('Error requesting transfer:', error);
      setError(error.message);
      throw error;
    }
  }, [currentUser, userProfile]);

  /**
   * Aprobar o rechazar traslado
   */
  const respondTransfer = useCallback(async (taskId, decision, comentario = '') => {
    if (!taskId || !decision) {
      throw new Error('ID de tarea y decisión requeridos');
    }

    try {
      const taskRef = doc(db, 'delegated_tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        throw new Error('Tarea no encontrada');
      }

      const taskData = taskSnap.data();

      if (decision === 'aprobado') {
        const historialAsignaciones = [
          ...(taskData.historialAsignaciones || []),
          {
            usuario: taskData.traslado.nuevoAsignado,
            fechaInicio: Timestamp.now(),
            razonCambio: `Traslado aprobado: ${taskData.traslado.solicitadoPor.razon}`
          }
        ];

        // Agregar nuevo usuario a participantes
        const participantes = taskData.participantes || [];
        if (!participantes.includes(taskData.traslado.nuevoAsignado.uid)) {
          participantes.push(taskData.traslado.nuevoAsignado.uid);
        }

        await updateDoc(taskRef, {
          asignadoA: taskData.traslado.nuevoAsignado,
          estadoActual: 'asignada',
          contadorTraslados: (taskData.contadorTraslados || 0) + 1,
          historialAsignaciones,
          participantes,
          traslado: {
            ...taskData.traslado,
            estado: 'aprobado',
            respuesta: {
              aprobadoPor: currentUser.uid,
              fecha: Timestamp.now(),
              decision: 'aprobado',
              comentario
            }
          },
          ultimaActividad: serverTimestamp()
        });
      } else {
        // Rechazado: volver al estado anterior
        await updateDoc(taskRef, {
          estadoActual: taskData.historialEstados[taskData.historialEstados.length - 2]?.estado || 'asignada',
          traslado: {
            ...taskData.traslado,
            estado: 'rechazado',
            respuesta: {
              rechazadoPor: currentUser.uid,
              fecha: Timestamp.now(),
              decision: 'rechazado',
              comentario
            }
          },
          ultimaActividad: serverTimestamp()
        });
      }

      // TODO: Crear notificaciones
    } catch (error) {
      console.error('Error responding transfer:', error);
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  /**
   * Aprobar o rechazar tarea en revisión (solo creador)
   */
  const approveTask = useCallback(async (taskId, approved, comentario = '') => {
    if (!taskId || typeof approved !== 'boolean') {
      throw new Error('ID de tarea y decisión requeridos');
    }

    try {
      const taskRef = doc(db, 'delegated_tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        throw new Error('Tarea no encontrada');
      }

      const taskData = taskSnap.data();

      // Verificar que el usuario actual es el creador
      if (taskData.creadoPor?.uid !== currentUser?.uid) {
        throw new Error('Solo el creador de la tarea puede aprobar');
      }

      // Verificar que la tarea está en revisión
      if (taskData.estado !== 'en_revision' && taskData.estadoActual !== 'en_revision') {
        throw new Error('La tarea debe estar en revisión para poder aprobar');
      }

      const nuevoEstado = approved ? 'completada' : 'en_progreso';
      const historialActualizado = [
        ...(taskData.historialEstados || []),
        {
          estado: nuevoEstado,
          fecha: Timestamp.now(),
          usuario: currentUser.uid,
          comentario: `${approved ? 'Aprobado' : 'Rechazado'}: ${comentario}`,
          aprobacion: {
            aprobado: approved,
            aprobadoPor: currentUser.uid,
            fecha: Timestamp.now()
          }
        }
      ];

      const updateData = {
        estado: nuevoEstado,
        estadoActual: nuevoEstado,
        historialEstados: historialActualizado,
        ultimaActividad: serverTimestamp()
      };

      if (approved) {
        updateData.fechaCompletada = serverTimestamp();
        updateData.porcentajeCompletado = 100;
      } else {
        updateData.porcentajeCompletado = 50; // Volver a en progreso
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error approving task:', error);
      setError(error.message);
      throw error;
    }
  }, [currentUser]);

  /**
   * Actualizar progreso de la tarea
   */
  const updateProgress = useCallback(async (taskId, porcentaje, checklistItems = []) => {
    if (!taskId) {
      throw new Error('ID de tarea requerido');
    }

    try {
      await updateTask(taskId, {
        porcentajeCompletado: Math.min(100, Math.max(0, porcentaje)),
        checklistItems,
        ultimaActividad: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }, [updateTask]);

  /**
   * Eliminar tarea (solo creador o admin)
   */
  const deleteTask = useCallback(async (taskId) => {
    if (!taskId) {
      throw new Error('ID de tarea requerido');
    }

    try {
      const taskRef = doc(db, 'delegated_tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Estadísticas y contadores
  const stats = {
    total: tasks.length,
    pendientes: tasks.filter(t => t.estadoActual === 'pendiente').length,
    asignadas: tasks.filter(t => t.estadoActual === 'asignada').length,
    enProgreso: tasks.filter(t => t.estadoActual === 'en_progreso').length,
    enRevision: tasks.filter(t => t.estadoActual === 'en_revision').length,
    completadas: tasks.filter(t => t.estadoActual === 'completada').length,
    canceladas: tasks.filter(t => t.estadoActual === 'cancelada').length,
    trasladoPendiente: tasks.filter(t => t.estadoActual === 'traslado_pendiente').length,
    
    // Mis tareas
    misAsignadas: tasks.filter(t => t.asignadoA?.uid === currentUser?.uid).length,
    creadasPorMi: tasks.filter(t => t.creadoPor?.uid === currentUser?.uid).length,
    
    // Prioridades
    urgentes: tasks.filter(t => t.prioridad === 'urgente' && t.estadoActual !== 'completada' && t.estadoActual !== 'cancelada').length,
    vencidas: tasks.filter(t => {
      if (t.estadoActual === 'completada' || t.estadoActual === 'cancelada') return false;
      if (!t.fechaVencimiento) return false;
      return t.fechaVencimiento.toDate() < new Date();
    }).length
  };

  // Funciones de consulta
  const getTasksByStatus = useCallback((status) => {
    return tasks.filter(task => task.estadoActual === status);
  }, [tasks]);

  const getMyTasks = useCallback(() => {
    return tasks.filter(task => task.asignadoA?.uid === currentUser?.uid);
  }, [tasks, currentUser]);

  const getCreatedByMe = useCallback(() => {
    return tasks.filter(task => task.creadoPor?.uid === currentUser?.uid);
  }, [tasks, currentUser]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => 
      task.estadoActual !== 'completada' && 
      task.estadoActual !== 'cancelada' &&
      task.fechaVencimiento && 
      task.fechaVencimiento.toDate() < now
    );
  }, [tasks]);

  return {
    // Estado
    tasks,
    loading,
    error,
    stats,
    
    // Paginación
    currentPage,
    hasMore,
    nextPage,
    previousPage,
    refreshTasks,
    
    // Operaciones CRUD
    createTask,
    updateTask,
    deleteTask,
    
    // Gestión de estados
    changeStatus,
    
    // Asignación y traslados
    assignTask,
    requestTransfer,
    respondTransfer,
    
    // Aprobación
    approveTask,
    
    // Progreso
    updateProgress,
    
    // Consultas
    getTasksByStatus,
    getMyTasks,
    getCreatedByMe,
    getOverdueTasks
  };
};
