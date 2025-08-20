// 🔍 VERIFICADOR DE DATOS DE PAGO EN FIRESTORE
// Ejecutar este código en la consola del navegador después de crear un pago

const verificarUltimoPago = async () => {
  console.log('🔍 INICIANDO VERIFICACIÓN DE ÚLTIMO PAGO...');
  console.log('=====================================');

  try {
    // Importar Firebase
    const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
    const { db } = await import('./src/config/firebase.js');

    // 1. Obtener el último pago creado
    console.log('📊 1. OBTENIENDO ÚLTIMO PAGO...');
    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    if (paymentsSnapshot.empty) {
      console.log('❌ No se encontraron pagos en la base de datos');
      return;
    }

    const ultimoPago = paymentsSnapshot.docs[0];
    const datosPago = ultimoPago.data();
    
    console.log('✅ ÚLTIMO PAGO ENCONTRADO:');
    console.log('ID:', ultimoPago.id);
    console.log('Datos completos:', datosPago);
    
    // 2. Verificar campos específicos
    console.log('\n📋 2. VERIFICACIÓN DE CAMPOS ESPECÍFICOS:');
    console.log('=====================================');
    
    // Campos básicos
    console.log('🏢 INFORMACIÓN BÁSICA:');
    console.log('  - Company:', datosPago.companyName || '❌ FALTANTE');
    console.log('  - Concept:', datosPago.concept || '❌ FALTANTE');
    console.log('  - Amount:', datosPago.amount || '❌ FALTANTE');
    console.log('  - Original Amount:', datosPago.originalAmount || '❌ FALTANTE');
    console.log('  - Method:', datosPago.method || '❌ FALTANTE');
    console.log('  - Reference:', datosPago.reference || '❌ FALTANTE');
    console.log('  - Date:', datosPago.date ? datosPago.date.toDate() : '❌ FALTANTE');
    
    // Campos de intereses
    console.log('\n💰 INTERESES:');
    console.log('  - Interests (general):', datosPago.interests || 0);
    console.log('  - Intereses Derechos Explotación:', datosPago.interesesDerechosExplotacion || 0);
    console.log('  - Intereses Gastos Administración:', datosPago.interesesGastosAdministracion || 0);
    
    const totalIntereses = (datosPago.interests || 0) + 
                          (datosPago.interesesDerechosExplotacion || 0) + 
                          (datosPago.interesesGastosAdministracion || 0);
    console.log('  - TOTAL INTERESES:', totalIntereses);
    
    // Información bancaria
    console.log('\n🏦 INFORMACIÓN BANCARIA:');
    console.log('  - Source Account:', datosPago.sourceAccount || '❌ FALTANTE');
    console.log('  - Source Bank:', datosPago.sourceBank || '❌ FALTANTE');
    
    // Comprobantes
    console.log('\n📎 COMPROBANTES:');
    console.log('  - Attachments:', datosPago.attachments ? `${datosPago.attachments.length} archivo(s)` : '❌ FALTANTE');
    if (datosPago.attachments && datosPago.attachments.length > 0) {
      datosPago.attachments.forEach((url, index) => {
        console.log(`    ${index + 1}. ${url}`);
      });
    }
    
    // Metadatos
    console.log('\n🔧 METADATOS:');
    console.log('  - Status:', datosPago.status || '❌ FALTANTE');
    console.log('  - Processed By:', datosPago.processedBy || '❌ FALTANTE');
    console.log('  - Processed By Email:', datosPago.processedByEmail || '❌ FALTANTE');
    console.log('  - Created At:', datosPago.createdAt ? datosPago.createdAt.toDate() : '❌ FALTANTE');
    console.log('  - Updated At:', datosPago.updatedAt ? datosPago.updatedAt.toDate() : '❌ FALTANTE');

    // 3. Verificar si es Coljuegos
    const esColjuegos = datosPago.companyName?.toLowerCase().includes('coljuegos') ||
                       datosPago.concept?.toLowerCase().includes('coljuegos');
    
    console.log('\n🎰 DETECCIÓN COLJUEGOS:');
    console.log('  - Es Coljuegos:', esColjuegos ? '✅ SÍ' : '❌ NO');
    
    if (esColjuegos) {
      const tieneInteresesColjuegos = datosPago.interesesDerechosExplotacion > 0 || 
                                     datosPago.interesesGastosAdministracion > 0;
      console.log('  - Tiene intereses Coljuegos:', tieneInteresesColjuegos ? '✅ SÍ' : '⚠️ NO');
    }

    // 4. Buscar 4x1000 relacionado
    console.log('\n💳 4. VERIFICACIÓN DEL 4x1000:');
    console.log('=====================================');
    
    const tax4x1000Query = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const tax4x1000Snapshot = await getDocs(tax4x1000Query);
    const registros4x1000 = [];
    
    tax4x1000Snapshot.forEach(doc => {
      const data = doc.data();
      if (data.is4x1000Tax === true) {
        registros4x1000.push({
          id: doc.id,
          amount: data.amount,
          createdAt: data.createdAt?.toDate(),
          companyName: data.companyName
        });
      }
    });
    
    if (registros4x1000.length > 0) {
      console.log('✅ REGISTROS 4x1000 ENCONTRADOS:', registros4x1000.length);
      registros4x1000.forEach((reg, index) => {
        console.log(`  ${index + 1}. $${reg.amount} - ${reg.companyName} (${reg.createdAt})`);
      });
    } else {
      console.log('⚠️ No se encontraron registros automáticos de 4x1000');
    }

    // 5. Verificar actualización del compromiso
    console.log('\n📋 5. VERIFICACIÓN DEL COMPROMISO:');
    console.log('=====================================');
    
    if (datosPago.commitmentId) {
      const { doc, getDoc } = await import('firebase/firestore');
      const commitmentRef = doc(db, 'commitments', datosPago.commitmentId);
      const commitmentSnap = await getDoc(commitmentRef);
      
      if (commitmentSnap.exists()) {
        const commitmentData = commitmentSnap.data();
        console.log('✅ COMPROMISO ENCONTRADO:');
        console.log('  - isPaid:', commitmentData.isPaid);
        console.log('  - paid:', commitmentData.paid);
        console.log('  - paymentId:', commitmentData.paymentId);
        console.log('  - paymentAmount:', commitmentData.paymentAmount);
        console.log('  - interestPaid:', commitmentData.interestPaid);
        console.log('  - paymentMethod:', commitmentData.paymentMethod);
        console.log('  - receiptUrls:', commitmentData.receiptUrls ? commitmentData.receiptUrls.length + ' archivo(s)' : 'No hay');
      } else {
        console.log('❌ COMPROMISO NO ENCONTRADO con ID:', datosPago.commitmentId);
      }
    } else {
      console.log('❌ NO HAY COMMITMENT ID en el pago');
    }

    // 6. Resumen final
    console.log('\n📊 6. RESUMEN FINAL:');
    console.log('=====================================');
    
    const camposCompletos = [];
    const camposFaltantes = [];
    
    const camposRequeridos = [
      'companyName', 'concept', 'amount', 'originalAmount', 'method', 
      'date', 'status', 'processedBy', 'createdAt'
    ];
    
    camposRequeridos.forEach(campo => {
      if (datosPago[campo]) {
        camposCompletos.push(campo);
      } else {
        camposFaltantes.push(campo);
      }
    });
    
    console.log('✅ CAMPOS COMPLETOS:', camposCompletos.length + '/' + camposRequeridos.length);
    console.log('❌ CAMPOS FALTANTES:', camposFaltantes);
    
    if (camposFaltantes.length === 0) {
      console.log('\n🎉 ¡VERIFICACIÓN EXITOSA! Todos los datos están guardados correctamente.');
    } else {
      console.log('\n⚠️ ADVERTENCIA: Faltan algunos campos importantes.');
    }

    return datosPago;
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
};

// Ejecutar verificación
console.log('🚀 Para verificar el último pago, ejecuta: verificarUltimoPago()');
console.log('📖 O ejecuta directamente el código...');

// Auto-ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  window.verificarUltimoPago = verificarUltimoPago;
  console.log('✅ Función disponible como window.verificarUltimoPago()');
}
