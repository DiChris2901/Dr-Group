const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./functions/serviceAccount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteInternetCommitments() {
  try {
    console.log('🔍 Buscando compromisos de Internet con mes/año...');
    
    // Buscar compromisos que contengan "Internet" seguido de " - " (con mes/año)
    const commitments = await db.collection('commitments')
      .where('concept', '>=', 'Internet -')
      .where('concept', '<=', 'Internet -\uf8ff')
      .get();
    
    console.log(`📋 Encontrados ${commitments.size} compromisos de Internet con mes/año`);
    
    if (commitments.size === 0) {
      console.log('✅ No hay compromisos de Internet con mes/año para eliminar');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    commitments.forEach((doc) => {
      const data = doc.data();
      console.log(`🗑️  Eliminando: ${data.concept} - ${data.beneficiary} - $${data.totalAmount}`);
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`✅ Eliminados ${count} compromisos de Internet con mes/año exitosamente!`);
    
  } catch (error) {
    console.error('❌ Error eliminando compromisos:', error);
  } finally {
    process.exit(0);
  }
}

deleteInternetCommitments();
