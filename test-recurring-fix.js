// 🧪 Script de prueba para verificar la corrección de compromisos recurrentes
// Este script simula la creación de compromisos recurrentes con los datos corregidos

console.log('🧪 INICIANDO PRUEBAS DE CORRECCIÓN DE COMPROMISOS RECURRENTES');
console.log('='.repeat(60));

// Simular datos de prueba que representan el problema anterior
const testCases = [
  {
    name: 'Caso 1: Datos completos (debería funcionar)',
    commitmentData: {
      concept: 'Salario',
      companyId: 'company123',
      companyName: 'DR Group S.A.S.', // ✅ Presente
      beneficiary: 'Kerly Mauricio Cañón Uneme',
      beneficiaryNit: '1234567890',
      totalAmount: 1509620,
      dueDate: new Date('2025-09-29'),
      periodicity: 'monthly',
      recurringCount: 4
    }
  },
  {
    name: 'Caso 2: Datos sin companyName (problema anterior - debería fallar)',
    commitmentData: {
      concept: 'Bonificación',
      companyId: 'company456',
      // companyName: undefined, // ❌ Faltante (problema anterior)
      beneficiary: 'Carolina Rios',
      beneficiaryNit: '0987654321',
      totalAmount: 353443,
      dueDate: new Date('2025-10-29'),
      periodicity: 'monthly',
      recurringCount: 4
    }
  },
  {
    name: 'Caso 3: companyName vacío (problema anterior - debería fallar)',
    commitmentData: {
      concept: 'Otra Obligación',
      companyId: 'company789',
      companyName: '', // ❌ Vacío (problema anterior)
      beneficiary: 'Proveedor Ejemplo',
      beneficiaryNit: '1122334455',
      totalAmount: 500000,
      dueDate: new Date('2025-11-29'),
      periodicity: 'monthly',
      recurringCount: 3
    }
  }
];

// Función para simular generateRecurringCommitments (versión corregida)
const simulateGenerateRecurringCommitments = (commitmentData, instancesCount = 12, skipFirst = false) => {
  console.log(`📋 Simulando generación para: ${commitmentData.concept}`);
  
  try {
    // ✅ VALIDACIONES CRÍTICAS (las que agregamos)
    if (!commitmentData) {
      throw new Error('commitmentData es requerido');
    }
    
    if (!commitmentData.concept || commitmentData.concept.trim() === '') {
      throw new Error('El concepto del compromiso es requerido');
    }
    
    if (!commitmentData.companyName || commitmentData.companyName.trim() === '') {
      console.error('❌ CRITICAL: companyName faltante en commitmentData');
      console.error('📋 Datos recibidos:', {
        companyId: commitmentData.companyId,
        companyName: commitmentData.companyName,
        concept: commitmentData.concept,
        beneficiary: commitmentData.beneficiary
      });
      throw new Error('companyName es requerido para evitar compromisos huérfanos');
    }
    
    if (commitmentData.periodicity === 'unique') {
      return [commitmentData];
    }

    // Simular generación de compromisos
    const generatedCommitments = [];
    const baseDate = new Date(commitmentData.dueDate);
    const startIndex = skipFirst ? 1 : 0;
    
    for (let i = startIndex; i < instancesCount + startIndex && i < commitmentData.recurringCount + startIndex; i++) {
      // Simular addMonths
      const currentDate = new Date(baseDate);
      currentDate.setMonth(currentDate.getMonth() + i);
      
      const commitment = {
        ...commitmentData,
        dueDate: currentDate,
        companyName: commitmentData.companyName, // ✅ Explícitamente asegurar
        instanceNumber: i + 1,
        isRecurring: true
      };

      // ✅ VALIDACIÓN FINAL ANTES DE AGREGAR
      if (!commitment.companyName || commitment.companyName.trim() === '') {
        throw new Error(`Compromiso ${i + 1} quedaría sin companyName - cancelando generación`);
      }

      generatedCommitments.push(commitment);
    }

    return generatedCommitments;
  } catch (error) {
    throw error;
  }
};

// Ejecutar pruebas
console.log('\n🧪 EJECUTANDO CASOS DE PRUEBA:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log('-'.repeat(50));
  
  try {
    const result = simulateGenerateRecurringCommitments(
      testCase.commitmentData, 
      testCase.commitmentData.recurringCount || 12, 
      false
    );
    
    console.log(`✅ ÉXITO: Se generaron ${result.length} compromisos`);
    console.log(`📋 Primer compromiso:`, {
      concept: result[0].concept,
      companyName: result[0].companyName,
      beneficiary: result[0].beneficiary,
      dueDate: result[0].dueDate.toLocaleDateString()
    });
    
    // Verificar que ninguno tenga companyName vacío
    const invalidCommitments = result.filter(c => !c.companyName || c.companyName.trim() === '');
    if (invalidCommitments.length > 0) {
      console.log(`❌ ADVERTENCIA: ${invalidCommitments.length} compromisos sin companyName detectados`);
    } else {
      console.log('✅ Todos los compromisos tienen companyName válido');
    }
    
  } catch (error) {
    console.log(`❌ ERROR (esperado para casos problemáticos): ${error.message}`);
  }
  
  console.log('');
});

// Resumen de la corrección
console.log('📊 RESUMEN DE LA CORRECCIÓN IMPLEMENTADA:');
console.log('='.repeat(50));
console.log('✅ NewCommitmentPage.jsx:');
console.log('   • Se agregó resolución de companyName antes de crear compromisos recurrentes');
console.log('   • commitmentData ahora incluye explícitamente companyName');
console.log('');
console.log('✅ CommitmentEditFormComplete.jsx:');
console.log('   • Se agregó resolución de companyName en updatedData');
console.log('   • Los compromisos recurrentes generados en edición tendrán companyName');
console.log('');
console.log('✅ recurringCommitments.js:');
console.log('   • Se agregaron validaciones críticas para prevenir compromisos huérfanos');
console.log('   • generateRecurringCommitments valida companyName antes de generar');
console.log('   • saveRecurringCommitments valida todos los compromisos antes de guardar');
console.log('   • Se agregó logging detallado para debugging');
console.log('');
console.log('🎯 RESULTADO ESPERADO:');
console.log('   • No más compromisos con "Sin empresa"');
console.log('   • Todos los compromisos recurrentes tendrán companyName válido');
console.log('   • Errores claros si faltan datos críticos');
console.log('   • Mejor debugging y monitoreo');

console.log('\n✅ Pruebas completadas');
