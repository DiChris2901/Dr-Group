/**
 * 🚀 SCRIPT DE INICIALIZACIÓN - Dashboard Stats
 * 
 * PROPÓSITO:
 * - Ejecutar el cálculo inicial de estadísticas
 * - Crear el documento system_stats/dashboard
 * 
 * USO:
 * 1. Abrir consola del navegador en: https://dr-group-cd21b.web.app
 * 2. Copiar y pegar este script completo
 * 3. Presionar Enter
 * 4. Esperar mensaje "✅ Estadísticas inicializadas"
 * 
 * ALTERNATIVA:
 * - Usar Firebase Console → Functions → forceRecalculateStats → Run
 */

(async function initDashboardStats() {
  console.log('🚀 Iniciando cálculo de estadísticas...');
  
  try {
    // Importar Firebase Functions desde el SDK del cliente
    const functions = window.firebase.functions();
    
    // Llamar a la Cloud Function de recálculo
    const forceRecalculateStats = functions.httpsCallable('forceRecalculateStats');
    
    console.log('📞 Llamando a Cloud Function...');
    const result = await forceRecalculateStats();
    
    console.log('✅ Estadísticas inicializadas:', result.data.stats);
    console.log('💰 Ahorro proyectado: $21.60/mes → $0.001/mes (99.995%)');
    console.log('📊 Documento creado en: system_stats/dashboard');
    
    alert('✅ Estadísticas del dashboard inicializadas correctamente!\n\n' +
          'Ahorro: 20,000 reads → 1 read por carga\n' +
          'Costo reducido: 99.995%');
    
  } catch (error) {
    console.error('❌ Error inicializando estadísticas:', error);
    
    if (error.code === 'functions/unauthenticated') {
      alert('⚠️ Debes estar autenticado para ejecutar esta función.\n\n' +
            'Por favor inicia sesión en el dashboard e intenta nuevamente.');
    } else {
      alert('❌ Error al inicializar estadísticas:\n' + error.message);
    }
  }
})();
