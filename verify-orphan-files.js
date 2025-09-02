/**
 * 🔍 VERIFICADOR MANUAL DE ARCHIVOS HUÉRFANOS
 * Script para verificar manualmente si los archivos marcados como "huérfanos" 
 * realmente están siendo utilizados en Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

// Configuración de Firebase (usa la misma que tu app)
const firebaseConfig = {
  // Aquí debes poner tu configuración de Firebase
  // La puedes encontrar en src/config/firebase.js
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lista de archivos marcados como huérfanos (copia de la imagen)
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

/**
 * Función recursiva para buscar URLs en cualquier estructura de datos
 */
function findUrlsInData(data, path = '') {
  const urls = [];
  
  if (!data) return urls;
  
  if (typeof data === 'string' && data.includes('firebasestorage.googleapis.com')) {
    // Extraer path del archivo de la URL
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

/**
 * Verificar si los archivos están siendo utilizados
 */
async function verifyOrphanFiles() {
  console.log('🔍 Iniciando verificación manual de archivos...');
  console.log(`📋 Archivos a verificar: ${suspiciousFiles.length}`);
  
  // Obtener todas las referencias de archivos en Firestore
  const collections = ['commitments', 'payments', 'users', 'companies', 'files', 'incomes'];
  const allReferences = new Set();
  const detailedReferences = [];
  
  for (const collectionName of collections) {
    console.log(`🔍 Escaneando colección: ${collectionName}`);
    
    try {
      const q = query(collection(db, collectionName));
      const snapshot = await getDocs(q);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const foundUrls = findUrlsInData(data, `${collectionName}/${doc.id}`);
        
        foundUrls.forEach(urlInfo => {
          allReferences.add(urlInfo.path);
          detailedReferences.push({
            collection: collectionName,
            docId: doc.id,
            path: urlInfo.path,
            foundIn: urlInfo.foundIn,
            url: urlInfo.url
          });
        });
      });
      
      console.log(`✅ ${collectionName}: ${snapshot.size} documentos procesados`);
    } catch (error) {
      console.error(`❌ Error procesando ${collectionName}:`, error);
    }
  }
  
  console.log(`\n📊 Total referencias encontradas: ${allReferences.size}`);
  
  // Verificar cada archivo "huérfano"
  console.log('\n🔍 VERIFICACIÓN DETALLADA:\n');
  
  const realOrphans = [];
  const falsePositives = [];
  
  suspiciousFiles.forEach(filePath => {
    console.log(`\n🔍 Verificando: ${filePath}`);
    
    // Buscar referencias exactas
    const exactMatches = detailedReferences.filter(ref => ref.path === filePath);
    
    // Buscar referencias similares (por nombre de archivo)
    const fileName = filePath.split('/').pop();
    const similarMatches = detailedReferences.filter(ref => 
      ref.path.includes(fileName.replace(/[?_]/g, '')) || 
      ref.path.endsWith(fileName)
    );
    
    if (exactMatches.length > 0) {
      console.log(`✅ ARCHIVO EN USO - Referencias exactas encontradas:`);
      exactMatches.forEach(match => {
        console.log(`   📍 ${match.collection}/${match.docId} -> ${match.foundIn}`);
      });
      falsePositives.push({
        file: filePath,
        matches: exactMatches
      });
    } else if (similarMatches.length > 0) {
      console.log(`⚠️  ARCHIVO POSIBLEMENTE EN USO - Referencias similares:`);
      similarMatches.forEach(match => {
        console.log(`   📍 ${match.collection}/${match.docId} -> ${match.foundIn}`);
        console.log(`      Path: ${match.path}`);
      });
      falsePositives.push({
        file: filePath,
        matches: similarMatches
      });
    } else {
      console.log(`❌ ARCHIVO REALMENTE HUÉRFANO - No se encontraron referencias`);
      realOrphans.push(filePath);
    }
  });
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL:');
  console.log('='.repeat(60));
  console.log(`❌ Archivos realmente huérfanos: ${realOrphans.length}`);
  console.log(`⚠️  Falsos positivos (archivos en uso): ${falsePositives.length}`);
  
  if (realOrphans.length > 0) {
    console.log('\n🗑️ ARCHIVOS SEGUROS PARA ELIMINAR:');
    realOrphans.forEach(file => {
      console.log(`   • ${file}`);
    });
  }
  
  if (falsePositives.length > 0) {
    console.log('\n🛡️ ARCHIVOS QUE NO DEBES ELIMINAR:');
    falsePositives.forEach(item => {
      console.log(`   • ${item.file} (${item.matches.length} referencias)`);
    });
  }
  
  console.log('\n⚠️ RECOMENDACIÓN: Solo elimina los archivos de la lista "SEGUROS PARA ELIMINAR"');
}

// Ejecutar verificación
verifyOrphanFiles().catch(console.error);
