// Registry global para gestionar listeners de Firestore
import { onSnapshot } from 'firebase/firestore';

class ListenerManager {
  constructor() {
    this.listeners = new Set();
    this.isClearing = false;
  }

  // Registrar un listener
  register(unsubscribe) {
    if (typeof unsubscribe === 'function') {
      this.listeners.add(unsubscribe);
      console.log(`📡 Listener registrado. Total activos: ${this.listeners.size}`);
    }
    return unsubscribe;
  }

  // Wrapper para onSnapshot que auto-registra
  createManagedSnapshot(query, callback, errorCallback) {
    const unsubscribe = onSnapshot(
      query,
      callback,
      (error) => {
        console.error('🔥 Error en snapshot listener:', error);
        if (errorCallback) errorCallback(error);
        // Auto-remover en caso de error
        this.unregister(unsubscribe);
      }
    );

    return this.register(unsubscribe);
  }

  // Desregistrar un listener específico
  unregister(unsubscribe) {
    if (this.listeners.has(unsubscribe)) {
      this.listeners.delete(unsubscribe);
      console.log(`📡 Listener desregistrado. Total activos: ${this.listeners.size}`);
    }
  }

  // Limpiar todos los listeners
  clearAll() {
    if (this.isClearing) return; // Evitar recursión
    
    this.isClearing = true;
    console.log(`🧹 Limpiando ${this.listeners.size} listeners activos...`);
    
    const listenersArray = Array.from(this.listeners);
    this.listeners.clear();
    
    listenersArray.forEach((unsubscribe, index) => {
      try {
        unsubscribe();
        console.log(`✅ Listener ${index + 1} limpiado`);
      } catch (error) {
        console.error(`❌ Error limpiando listener ${index + 1}:`, error);
      }
    });
    
    this.isClearing = false;
    console.log('🧹 Limpieza de listeners completada');
  }

  // Obtener estadísticas
  getStats() {
    return {
      activeListeners: this.listeners.size,
      isClearing: this.isClearing
    };
  }
}

// Instancia global
const listenerManager = new ListenerManager();

export default listenerManager;

// Helper function para uso directo
export const managedOnSnapshot = (query, callback, errorCallback) => {
  return listenerManager.createManagedSnapshot(query, callback, errorCallback);
};

// Función para limpiar todos los listeners (para usar en logout)
export const clearAllListeners = () => {
  listenerManager.clearAll();
};