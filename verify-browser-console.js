/**
 * 🔍 VERIFICADOR SIMPLE DE ARCHIVOS HUÉRFANOS
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre las DevTools de tu navegador (F12)
 * 2. Ve a la pestaña Console
 * 3. Copia y pega este código completo
 * 4. Presiona Enter para ejecutar
 * 5. Espera los resultados
 */

(async function verifyOrphanFiles() {
  console.log('🔍 Iniciando verificación de archivos...');
  
  // Lista de archivos sospechosos de la imagen
  const suspiciousFiles = [
    'invoices/175588271853?_wf346dlr.pdf',
    'invoices/175683822990_zw9dzgxu.pdf', 
    'invoices/175588382345_u0n3esfw.pdf',
    'invoices/175588961323_40130hfx.pdf',
    'invoices/175588962301_1jwgwql3.pdf',
    'invoices/175623105715?_cf6eh671x.pdf',
    'invoices/175623401950_hew26cnmn.pdf',
    'invoices/175648617023B_afhhr3a3.pdf'
  ];
  
  // Acceder a Firebase desde la app (debe estar disponible globalmente)
  if (!window.firebase && !window.db) {
    console.error('❌ Firebase no está disponible. Asegúrate de estar en la página de la app.');
    return;
  }
  
  // Usar la instancia de Firestore de la app
  const db = window.db || window.firebase?.firestore();
  if (!db) {
    console.error('❌ No se pudo acceder a Firestore');
    return;
  }
  
  console.log('✅ Conectado a Firestore');
  
  // Función para buscar URLs en datos
  function findUrlsInData(data, path = '') {
    const urls = [];
    
    if (!data) return urls;
    
    if (typeof data === 'string' && data.includes('firebasestorage.googleapis.com')) {
      const pathMatch = data.match(/o\/(.+?)\?/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        urls.push({ url: data, path: filePath, foundIn: path });
      }
    } else if (Array.isArray(data)) {
      data.forEach((item, index) => {
        urls.push(...findUrlsInData(item, `${path}[${index}]`));
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        urls.push(...findUrlsInData(data[key], path ? `${path}.${key}` : key));
      });
    }
    
    return urls;
  }
  
  // Escanear colecciones
  const collections = ['commitments', 'payments', 'users', 'companies', 'files', 'incomes'];
  const allReferences = [];
  
  for (const collectionName of collections) {
    console.log(`🔍 Escaneando ${collectionName}...`);
    
    try {
      const snapshot = await db.collection(collectionName).get();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const foundUrls = findUrlsInData(data, `${collectionName}/${doc.id}`);
        allReferences.push(...foundUrls);
      });
      
      console.log(`✅ ${collectionName}: ${snapshot.size} docs, ${allReferences.filter(r => r.foundIn.startsWith(collectionName)).length} referencias`);
    } catch (error) {
      console.error(`❌ Error en ${collectionName}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total referencias: ${allReferences.length}`);
  
  // Verificar cada archivo
  console.log('\n🔍 VERIFICACIÓN:\n');
  
  let realOrphans = 0;
  let inUse = 0;
  
  suspiciousFiles.forEach(filePath => {
    // Buscar referencias exactas
    const exactMatch = allReferences.find(ref => ref.path === filePath);
    
    // Buscar por nombre de archivo
    const fileName = filePath.split('/').pop().replace(/[?_]/g, '');
    const nameMatch = allReferences.find(ref => 
      ref.path.includes(fileName) || 
      ref.url.includes(fileName)
    );
    
    if (exactMatch) {
      console.log(`✅ EN USO: ${filePath}`);
      console.log(`   📍 Encontrado en: ${exactMatch.foundIn}`);
      inUse++;
    } else if (nameMatch) {
      console.log(`⚠️  POSIBLE USO: ${filePath}`);
      console.log(`   📍 Similar en: ${nameMatch.foundIn} -> ${nameMatch.path}`);
      inUse++;
    } else {
      console.log(`❌ HUÉRFANO: ${filePath}`);
      realOrphans++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN:');
  console.log(`✅ Archivos en uso: ${inUse}`);
  console.log(`❌ Archivos huérfanos: ${realOrphans}`);
  
  if (realOrphans === 0) {
    console.log('\n🛡️  IMPORTANTE: TODOS los archivos están siendo utilizados!');
    console.log('🚨 NO elimines ninguno de estos archivos.');
  } else {
    console.log(`\n⚠️  Solo ${realOrphans} archivos son realmente huérfanos.`);
  }
})();
