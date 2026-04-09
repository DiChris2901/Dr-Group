import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Verifica si ya se creó un registro de asistencia hoy (Capa 1: Cache Local).
 * @param {string} uid  - UID del usuario
 * @param {string} todayStr - Fecha en formato 'YYYY-MM-DD'
 * @returns {object|null} Datos de sesión cacheados o null
 */
export const checkTodaySessionInCache = async (uid, todayStr) => {
  try {
    const cacheKey = `session_${uid}_${todayStr}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const sessionData = JSON.parse(cached);
      return sessionData;
    }
    return null;
  } catch (error) {
    console.error('Error verificando caché local:', error);
    return null;
  }
};

/**
 * Guarda el ID de sesión en cache local para evitar registros duplicados.
 * @param {string} uid - UID del usuario
 * @param {string} todayStr - Fecha en formato 'YYYY-MM-DD'
 * @param {string} sessionId - ID del documento de asistencia
 */
export const saveTodaySessionInCache = async (uid, todayStr, sessionId) => {
  try {
    const cacheKey = `session_${uid}_${todayStr}`;
    const data = { sessionId, timestamp: Date.now() };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error guardando en caché:', error);
  }
};
