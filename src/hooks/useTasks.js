import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useTasks = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contadores útiles
  const pendingTasksCount = tasks.filter(task => !task.completed).length;
  const completedTasksCount = tasks.filter(task => task.completed).length;
  const highPriorityPendingCount = tasks.filter(task => !task.completed && task.priority === 'high').length;
  const tasksCount = tasks.length;

  // Listener en tiempo real para todas las tareas del usuario
  useEffect(() => {
    if (!currentUser?.uid) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasksData = [];
        snapshot.forEach((doc) => {
          tasksData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            dueDate: doc.data().dueDate?.toDate() || null
          });
        });
        setTasks(tasksData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Agregar nueva tarea
  const addTask = useCallback(async (taskData) => {
    if (!currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const newTask = {
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'medium', // low, medium, high
        completed: false,
        dueDate: taskData.dueDate || null,
        tags: taskData.tags || [],
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', error);
      setError(error.message);
      throw error;
    }
  }, [currentUser?.uid]);

  // Actualizar tarea existente
  const updateTask = useCallback(async (taskId, updates) => {
    if (!taskId) {
      throw new Error('ID de tarea requerido');
    }

    try {
      const taskRef = doc(db, 'tasks', taskId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Si se está actualizando el estado de completado, agregar timestamp
      if ('completed' in updates) {
        updateData.completedAt = updates.completed ? serverTimestamp() : null;
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Alternar estado de completado
  const toggleTaskComplete = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    try {
      await updateTask(taskId, { completed: !task.completed });
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }, [tasks, updateTask]);

  // Eliminar tarea
  const deleteTask = useCallback(async (taskId) => {
    if (!taskId) {
      throw new Error('ID de tarea requerido');
    }

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Obtener tarea por ID
  const getTaskById = useCallback(async (taskId) => {
    if (!taskId) return null;

    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (taskSnap.exists()) {
        const data = taskSnap.data();
        return {
          id: taskSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || null,
          completedAt: data.completedAt?.toDate() || null
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Obtener tareas recientes (para vista previa)
  const getRecentTasks = useCallback((count = 5, showCompleted = false) => {
    let filteredTasks = tasks;
    
    if (!showCompleted) {
      filteredTasks = tasks.filter(task => !task.completed);
    }
    
    return filteredTasks
      .sort((a, b) => {
        // Priorizar por: 1) Vencimiento próximo, 2) Prioridad, 3) Fecha de creación
        if (a.dueDate && b.dueDate) {
          return a.dueDate - b.dueDate;
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.createdAt - a.createdAt;
      })
      .slice(0, count);
  }, [tasks]);

  // Obtener tareas por prioridad
  const getTasksByPriority = useCallback((priority) => {
    return tasks.filter(task => task.priority === priority && !task.completed);
  }, [tasks]);

  // Obtener tareas vencidas
  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate < now
    );
  }, [tasks]);

  // Obtener tareas por vencer (próximas 24 horas)
  const getUpcomingTasks = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate >= now && 
      task.dueDate <= tomorrow
    );
  }, [tasks]);

  // Buscar tareas
  const searchTasks = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return tasks;
    
    const term = searchTerm.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(term) ||
      task.description.toLowerCase().includes(term) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }, [tasks]);

  return {
    // Estado
    tasks,
    loading,
    error,
    
    // Contadores
    tasksCount,
    pendingTasksCount,
    completedTasksCount,
    highPriorityPendingCount,
    
    // Operaciones CRUD
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    getTaskById,
    
    // Utilidades de consulta
    getRecentTasks,
    getTasksByPriority,
    getOverdueTasks,
    getUpcomingTasks,
    searchTasks
  };
};