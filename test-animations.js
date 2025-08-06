/**
 * Script de prueba para verificar funcionalidad de animaciones
 * Ejecutar en consola del navegador en http://localhost:5173
 */

console.log('🎨 Iniciando prueba de funcionalidad de animaciones...');

// Función para verificar el estado actual de animaciones
function checkAnimationsStatus() {
  try {
    // Buscar el switch de animaciones en el DOM
    const animationSwitch = document.querySelector('[data-testid="animation-switch"], input[type="checkbox"]');
    
    if (!animationSwitch) {
      console.warn('❌ No se encontró el switch de animaciones en el DOM');
      console.log('💡 Asegúrate de que el drawer de configuración esté abierto');
      return false;
    }

    const isEnabled = animationSwitch.checked;
    console.log(`🎬 Estado actual de animaciones: ${isEnabled ? 'HABILITADAS' : 'DESHABILITADAS'}`);
    
    // Verificar si las animaciones CSS están aplicadas
    const elements = document.querySelectorAll('[class*="MuiBox"], [class*="MuiButton"], [class*="MuiPaper"]');
    let animatedElements = 0;
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      if (styles.transition !== 'all 0s ease 0s' && styles.transition !== 'none') {
        animatedElements++;
      }
    });
    
    console.log(`🔍 Elementos con transiciones CSS: ${animatedElements}/${elements.length}`);
    
    return {
      switchEnabled: isEnabled,
      elementsWithAnimations: animatedElements,
      totalElements: elements.length
    };
    
  } catch (error) {
    console.error('❌ Error verificando estado de animaciones:', error);
    return false;
  }
}

// Función para alternar animaciones
function toggleAnimations() {
  try {
    const animationSwitch = document.querySelector('input[type="checkbox"]');
    if (animationSwitch) {
      animationSwitch.click();
      console.log('🔄 Switch de animaciones alternado');
      
      // Verificar estado después del cambio
      setTimeout(() => {
        checkAnimationsStatus();
      }, 500);
    } else {
      console.warn('❌ No se encontró el switch de animaciones');
    }
  } catch (error) {
    console.error('❌ Error alternando animaciones:', error);
  }
}

// Función para probar animaciones específicas
function testSpecificAnimations() {
  console.log('🧪 Probando animaciones específicas...');
  
  // Buscar botones con efectos hover
  const buttons = document.querySelectorAll('button, [role="button"]');
  buttons.forEach((btn, index) => {
    if (index < 3) { // Solo los primeros 3 botones
      console.log(`🎯 Probando botón ${index + 1}:`);
      
      // Simular hover
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      setTimeout(() => {
        btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      }, 1000);
    }
  });
}

// Función principal de prueba
function runAnimationTest() {
  console.log('🚀 Ejecutando prueba completa de animaciones...');
  console.log('');
  
  // 1. Verificar estado inicial
  console.log('1️⃣ Verificando estado inicial...');
  const initialStatus = checkAnimationsStatus();
  
  if (!initialStatus) {
    console.log('❌ No se pudo completar la prueba. Abre el drawer de configuración.');
    return;
  }
  
  console.log('');
  
  // 2. Probar toggle de animaciones
  console.log('2️⃣ Probando alternado de animaciones...');
  setTimeout(() => {
    toggleAnimations();
    
    // 3. Verificar después del cambio
    setTimeout(() => {
      console.log('');
      console.log('3️⃣ Verificando estado después del cambio...');
      checkAnimationsStatus();
      
      // 4. Probar animaciones específicas
      setTimeout(() => {
        console.log('');
        console.log('4️⃣ Probando animaciones específicas...');
        testSpecificAnimations();
        
        console.log('');
        console.log('✅ Prueba completada. Revisa los resultados arriba.');
      }, 1000);
    }, 1000);
  }, 1000);
}

// Exportar funciones para uso manual
window.checkAnimationsStatus = checkAnimationsStatus;
window.toggleAnimations = toggleAnimations;
window.testSpecificAnimations = testSpecificAnimations;
window.runAnimationTest = runAnimationTest;

console.log('');
console.log('📝 Funciones disponibles:');
console.log('- checkAnimationsStatus() - Verificar estado actual');
console.log('- toggleAnimations() - Alternar animaciones');
console.log('- testSpecificAnimations() - Probar animaciones específicas');
console.log('- runAnimationTest() - Ejecutar prueba completa');
console.log('');
console.log('💡 Para ejecutar la prueba automática, escribe: runAnimationTest()');
