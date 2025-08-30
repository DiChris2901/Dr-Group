// Script para diagnosticar y corregir compromisos recurrentes sin companyName
// Este script debe ejecutarse desde la consola del navegador en la aplicación

console.log('🔍 Iniciando diagnóstico de compromisos recurrentes...');

// Esta función debe ejecutarse en la consola del navegador
async function fixRecurringCommitments() {
  try {
    // Verificar que Firebase esté disponible
    if (typeof db === 'undefined') {
      console.error('❌ Firebase no está disponible. Ejecuta este script desde la consola del navegador en la aplicación.');
      return;
    }
    
    console.log('🔍 Buscando compromisos recurrentes sin companyName...');
    
    // Buscar compromisos que son recurrentes y no tienen companyName
    const commitments = await getDocs(query(
      collection(db, 'commitments'),
      where('isRecurring', '==', true)
    ));
    
    let foundIssues = 0;
    let fixed = 0;
    
    for (const doc of commitments.docs) {
      const data = doc.data();
      
      // Verificar si el compromiso no tiene companyName pero tiene companyId
      if (!data.companyName && data.companyId) {
        console.log(`❌ Compromiso sin companyName encontrado: ${doc.id}`);
        console.log(`   Concepto: ${data.concept || 'N/A'}`);
        console.log(`   CompanyId: ${data.companyId}`);
        
        foundIssues++;
        
        // Buscar la información de la empresa
        try {
          const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
          
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            
            // Actualizar el compromiso con el nombre de la empresa
            await updateDoc(doc.ref, {
              companyName: companyData.name
            });
            
            console.log(`✅ Compromiso ${doc.id} actualizado con companyName: ${companyData.name}`);
            fixed++;
          } else {
            console.log(`⚠️  Empresa no encontrada para companyId: ${data.companyId}`);
            
            // Si no existe la empresa, buscar el compromiso padre
            if (data.parentCommitmentId) {
              const parentDoc = await getDoc(doc(db, 'commitments', data.parentCommitmentId));
              
              if (parentDoc.exists()) {
                const parentData = parentDoc.data();
                
                if (parentData.companyName) {
                  await updateDoc(doc.ref, {
                    companyName: parentData.companyName
                  });
                  
                  console.log(`✅ Compromiso ${doc.id} actualizado con companyName del padre: ${parentData.companyName}`);
                  fixed++;
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error procesando compromiso ${doc.id}:`, error);
        }
      }
      
      // También verificar compromisos que podrían tener companyName vacío
      if (data.companyName === '' || data.companyName === null) {
        console.log(`⚠️  Compromiso con companyName vacío: ${doc.id}`);
        foundIssues++;
        
        if (data.companyId) {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
            
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              
              await updateDoc(doc.ref, {
                companyName: companyData.name
              });
              
              console.log(`✅ Compromiso ${doc.id} actualizado con companyName: ${companyData.name}`);
              fixed++;
            }
          } catch (error) {
            console.error(`❌ Error procesando compromiso ${doc.id}:`, error);
          }
        }
      }
    }
    
    console.log('\n📊 Resumen:');
    console.log(`   Compromisos con problemas encontrados: ${foundIssues}`);
    console.log(`   Compromisos corregidos: ${fixed}`);
    
    return { foundIssues, fixed };
    
  } catch (error) {
    console.error('❌ Error ejecutando el diagnóstico:', error);
  }
}

// Instrucciones para el usuario
console.log(`
📋 INSTRUCCIONES:
1. Abre la aplicación DR Group Dashboard en tu navegador
2. Inicia sesión
3. Abre la consola del navegador (F12)
4. Pega este código completo en la consola
5. Ejecuta: fixRecurringCommitments()

Este script buscará y corregirá compromisos recurrentes que no tienen el campo companyName correctamente asignado.
`);

// Exportar la función para que esté disponible en la consola
window.fixRecurringCommitments = fixRecurringCommitments;
