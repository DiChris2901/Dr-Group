import admin from 'firebase-admin';
import fs from 'fs';

// Buscar archivo de credenciales
const credentialPaths = [
  './serviceAccountKey.json',
  './config/serviceAccountKey.json',
  './firebase-service-account.json'
];

let serviceAccount = null;
for (const credPath of credentialPaths) {
  if (fs.existsSync(credPath)) {
    const serviceAccountModule = await import(credPath, { assert: { type: 'json' } });
    serviceAccount = serviceAccountModule.default;
    console.log('✅ Credenciales encontradas en:', credPath);
    break;
  }
}

if (!serviceAccount) {
  console.log('❌ No se encontraron credenciales de Firebase');
  process.exit(1);
}

// Inicializar Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCommitments() {
  try {
    console.log('🔍 Consultando compromisos...');
    const snapshot = await db.collection('commitments').limit(10).get();
    
    console.log(`📊 Total documentos encontrados: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      console.log('\n📋 DATOS DE COMPROMISOS:');
      console.log('=' .repeat(60));
      
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  - Amount: ${data.amount || 'N/A'}`);
        console.log(`  - Total Amount: ${data.totalAmount || 'N/A'}`);
        console.log(`  - Created At: ${data.createdAt ? data.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A'}`);
        console.log(`  - Due Date: ${data.dueDate ? data.dueDate.toDate().toLocaleDateString('es-ES') : 'N/A'}`);
        console.log(`  - Company ID: ${data.companyId || 'N/A'}`);
        console.log(`  - Status: ${data.status || 'N/A'}`);
        console.log('  ---');
      });
      
      // Verificar fechas recientes
      console.log('\n📅 VERIFICANDO COMPROMISOS RECIENTES (últimos 30 días):');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSnapshot = await db.collection('commitments')
        .where('createdAt', '>=', thirtyDaysAgo)
        .get();
      
      console.log(`📈 Compromisos creados en últimos 30 días: ${recentSnapshot.size}`);
      
      // Verificar rango actual (últimos 12 meses)
      console.log('\n📅 VERIFICANDO COMPROMISOS (últimos 12 meses):');
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const yearSnapshot = await db.collection('commitments')
        .where('createdAt', '>=', twelveMonthsAgo)
        .get();
      
      console.log(`📊 Compromisos creados en últimos 12 meses: ${yearSnapshot.size}`);
      
    } else {
      console.log('❌ No se encontraron compromisos en la colección');
    }
  } catch (error) {
    console.error('❌ Error consultando compromisos:', error.message);
  }
  
  process.exit(0);
}

checkCommitments();
