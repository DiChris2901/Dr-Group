// Script para ejecutar desde la consola del navegador y crear usuario de tu esposa
import { createSpouseUser } from './addUser.js';

// Función para ejecutar en la consola del navegador
window.createSpouseUserNow = async () => {
  try {
    console.log('🚀 Iniciando creación de usuario para esposa...');
    
    const result = await createSpouseUser(
      'Nombre de tu Esposa',  // Cambia esto por el nombre real
      'smgc18@gmail.com',     // Email de tu esposa
      '3001234567',           // Teléfono de tu esposa (opcional)
      ''                      // Dejamos vacío el authUid por ahora
    );
    
    if (result.success) {
      console.log('✅ ÉXITO:', result.message);
      console.log('👤 Datos del usuario:', result.userData);
      alert('✅ Usuario creado exitosamente! Ya puede iniciar sesión.');
    } else {
      console.error('❌ ERROR:', result.error);
      alert('❌ Error: ' + result.error);
    }
  } catch (error) {
    console.error('❌ Error ejecutando script:', error);
    alert('❌ Error: ' + error.message);
  }
};

console.log('📋 Script cargado. Para crear el usuario ejecuta: createSpouseUserNow()');
