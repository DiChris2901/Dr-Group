const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dr-group-dashboard'
  });
}

const db = admin.firestore();

async function fixRecurringCommitments() {
  try {
    console.log('🔍 Buscando compromisos recurrentes sin companyName...');
    
    // Buscar compromisos que son recurrentes y no tienen companyName
    const commitments = await db.collection('commitments')
      .where('isRecurring', '==', true)
      .get();
    
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
          const companyDoc = await db.collection('companies').doc(data.companyId).get();
          
          if (companyDoc.exists) {
            const companyData = companyDoc.data();
            
            // Actualizar el compromiso con el nombre de la empresa
            await doc.ref.update({
              companyName: companyData.name
            });
            
            console.log(`✅ Compromiso ${doc.id} actualizado con companyName: ${companyData.name}`);
            fixed++;
          } else {
            console.log(`⚠️  Empresa no encontrada para companyId: ${data.companyId}`);
            
            // Si no existe la empresa, buscar el compromiso padre
            if (data.parentCommitmentId) {
              const parentDoc = await db.collection('commitments').doc(data.parentCommitmentId).get();
              
              if (parentDoc.exists) {
                const parentData = parentDoc.data();
                
                if (parentData.companyName) {
                  await doc.ref.update({
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
            const companyDoc = await db.collection('companies').doc(data.companyId).get();
            
            if (companyDoc.exists) {
              const companyData = companyDoc.data();
              
              await doc.ref.update({
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
    
    // También revisar compromisos no recurrentes por si acaso
    console.log('\n🔍 Revisando también compromisos no recurrentes...');
    
    const nonRecurringCommitments = await db.collection('commitments')
      .where('isRecurring', '==', false)
      .get();
    
    let nonRecurringIssues = 0;
    let nonRecurringFixed = 0;
    
    for (const doc of nonRecurringCommitments.docs) {
      const data = doc.data();
      
      if ((!data.companyName || data.companyName === '') && data.companyId) {
        console.log(`❌ Compromiso no recurrente sin companyName: ${doc.id}`);
        nonRecurringIssues++;
        
        try {
          const companyDoc = await db.collection('companies').doc(data.companyId).get();
          
          if (companyDoc.exists) {
            const companyData = companyDoc.data();
            
            await doc.ref.update({
              companyName: companyData.name
            });
            
            console.log(`✅ Compromiso no recurrente ${doc.id} actualizado con companyName: ${companyData.name}`);
            nonRecurringFixed++;
          }
        } catch (error) {
          console.error(`❌ Error procesando compromiso no recurrente ${doc.id}:`, error);
        }
      }
    }
    
    console.log('\n📊 Resumen final:');
    console.log(`   Compromisos recurrentes con problemas: ${foundIssues}`);
    console.log(`   Compromisos recurrentes corregidos: ${fixed}`);
    console.log(`   Compromisos no recurrentes con problemas: ${nonRecurringIssues}`);
    console.log(`   Compromisos no recurrentes corregidos: ${nonRecurringFixed}`);
    console.log(`   Total de correcciones: ${fixed + nonRecurringFixed}`);
    
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error);
  }
}

// Ejecutar el script
fixRecurringCommitments()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
