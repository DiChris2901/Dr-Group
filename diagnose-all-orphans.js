// 🔍 Diagnóstico completo de compromisos huérfanos - TODOS LOS TIPOS
// Este script identifica cualquier compromiso que aparece "Sin empresa" o con problemas

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDiW_FyQhF5FcrAo3XBJ3qKYVjCVb4w85Q",
  authDomain: "dr-group-cd21b.firebaseapp.com",
  projectId: "dr-group-cd21b",
  storageBucket: "dr-group-cd21b.firebasestorage.app",
  messagingSenderId: "266292159849",
  appId: "1:266292159849:web:83a2e68b1d4b8b71dced57",
  measurementId: "G-W5YN7P2Z3E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findAllOrphanedCommitments() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE COMPROMISOS HUÉRFANOS');
  console.log('='.repeat(60));
  
  try {
    // 1. Obtener TODOS los compromisos
    console.log('📋 Obteniendo todos los compromisos de Firestore...');
    const allCommitmentsSnapshot = await getDocs(collection(db, 'commitments'));
    const allCommitments = [];
    
    allCommitmentsSnapshot.forEach(doc => {
      const data = doc.data();
      allCommitments.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`✅ Total de compromisos en Firestore: ${allCommitments.length}\n`);
    
    // 2. Categorizar compromisos problemáticos
    const problemCommitments = {
      sinEmpresa: [],
      companyNameVacio: [],
      idsDuplicados: {},
      huerfanos: [],
      recurrentesSinEmpresa: []
    };
    
    console.log('🔍 Analizando compromisos...');
    
    for (const commitment of allCommitments) {
      // Verificar "Sin empresa"
      if (commitment.companyName === 'Sin empresa') {
        problemCommitments.sinEmpresa.push(commitment);
      }
      
      // Verificar companyName vacío
      if (!commitment.companyName || commitment.companyName.trim() === '') {
        problemCommitments.companyNameVacio.push(commitment);
      }
      
      // Verificar IDs duplicados
      if (!problemCommitments.idsDuplicados[commitment.id]) {
        problemCommitments.idsDuplicados[commitment.id] = [];
      }
      problemCommitments.idsDuplicados[commitment.id].push(commitment);
      
      // Verificar recurrentes sin empresa
      if (commitment.periodicity && commitment.periodicity !== 'unique' && 
          (!commitment.companyName || commitment.companyName === 'Sin empresa')) {
        problemCommitments.recurrentesSinEmpresa.push(commitment);
      }
      
      // Verificar si realmente existe en Firestore
      try {
        const docRef = doc(db, 'commitments', commitment.id);
        const docSnapshot = await getDoc(docRef);
        if (!docSnapshot.exists()) {
          problemCommitments.huerfanos.push(commitment);
        }
      } catch (error) {
        console.error(`Error verificando ${commitment.id}:`, error);
        problemCommitments.huerfanos.push(commitment);
      }
    }
    
    // 3. Reportar hallazgos
    console.log('📊 REPORTE DE PROBLEMAS ENCONTRADOS:');
    console.log('='.repeat(50));
    
    console.log(`🏢 Compromisos "Sin empresa": ${problemCommitments.sinEmpresa.length}`);
    console.log(`📝 Compromisos con companyName vacío: ${problemCommitments.companyNameVacio.length}`);
    console.log(`👻 Compromisos huérfanos: ${problemCommitments.huerfanos.length}`);
    console.log(`🔄 Recurrentes sin empresa: ${problemCommitments.recurrentesSinEmpresa.length}`);
    
    // IDs duplicados (solo mostrar los que realmente tienen duplicados)
    const duplicatedIds = Object.entries(problemCommitments.idsDuplicados).filter(([id, commitments]) => commitments.length > 1);
    console.log(`🔁 IDs duplicados: ${duplicatedIds.length}`);
    
    // 4. Mostrar detalles de compromisos "Sin empresa"
    if (problemCommitments.sinEmpresa.length > 0) {
      console.log('\n🚨 COMPROMISOS "SIN EMPRESA" DETALLADOS:');
      console.log('-'.repeat(70));
      
      problemCommitments.sinEmpresa.forEach((commitment, index) => {
        console.log(`${index + 1}. ID: ${commitment.id}`);
        console.log(`   📝 Concepto: ${commitment.concept || 'Sin concepto'}`);
        console.log(`   👤 Proveedor: ${commitment.beneficiary || 'Sin beneficiario'}`);
        console.log(`   💰 Monto: $${(commitment.totalAmount || commitment.amount || 0).toLocaleString()}`);
        console.log(`   📅 Vencimiento: ${commitment.dueDate ? (commitment.dueDate.seconds ? new Date(commitment.dueDate.seconds * 1000).toLocaleDateString() : commitment.dueDate) : 'Sin fecha'}`);
        console.log(`   🔄 Periodicidad: ${commitment.periodicity || 'unique'}`);
        console.log(`   🆔 CompanyId: ${commitment.companyId || 'Sin companyId'}`);
        console.log('');
      });
    }
    
    // 5. Mostrar IDs duplicados si existen
    if (duplicatedIds.length > 0) {
      console.log('\n🔁 IDs DUPLICADOS ENCONTRADOS:');
      console.log('-'.repeat(50));
      
      duplicatedIds.forEach(([id, commitments]) => {
        console.log(`🆔 ID: ${id} (${commitments.length} instancias)`);
        commitments.forEach((commitment, index) => {
          console.log(`   ${index + 1}. ${commitment.concept} - Vence: ${commitment.dueDate ? (commitment.dueDate.seconds ? new Date(commitment.dueDate.seconds * 1000).toLocaleDateString() : commitment.dueDate) : 'Sin fecha'}`);
        });
        console.log('');
      });
    }
    
    // 6. Buscar específicamente Salario y Bonificación
    console.log('\n🎯 ANÁLISIS ESPECÍFICO DE CONCEPTOS PROBLEMÁTICOS:');
    console.log('-'.repeat(60));
    
    const salarioCommitments = allCommitments.filter(c => c.concept === 'Salario' && (!c.companyName || c.companyName === 'Sin empresa'));
    const bonificacionCommitments = allCommitments.filter(c => c.concept === 'Bonificación' && (!c.companyName || c.companyName === 'Sin empresa'));
    
    console.log(`💼 Salarios sin empresa: ${salarioCommitments.length}`);
    console.log(`🎁 Bonificaciones sin empresa: ${bonificacionCommitments.length}`);
    
    if (salarioCommitments.length > 0) {
      console.log('\n💼 SALARIOS PROBLEMÁTICOS:');
      salarioCommitments.forEach((commitment, index) => {
        console.log(`${index + 1}. ID: ${commitment.id} | Proveedor: ${commitment.beneficiary} | Monto: $${(commitment.totalAmount || 0).toLocaleString()} | Vence: ${commitment.dueDate ? (commitment.dueDate.seconds ? new Date(commitment.dueDate.seconds * 1000).toLocaleDateString() : commitment.dueDate) : 'Sin fecha'}`);
      });
    }
    
    if (bonificacionCommitments.length > 0) {
      console.log('\n🎁 BONIFICACIONES PROBLEMÁTICAS:');
      bonificacionCommitments.forEach((commitment, index) => {
        console.log(`${index + 1}. ID: ${commitment.id} | Proveedor: ${commitment.beneficiary} | Monto: $${(commitment.totalAmount || 0).toLocaleString()} | Vence: ${commitment.dueDate ? (commitment.dueDate.seconds ? new Date(commitment.dueDate.seconds * 1000).toLocaleDateString() : commitment.dueDate) : 'Sin fecha'}`);
      });
    }
    
    return {
      total: allCommitments.length,
      problems: problemCommitments,
      salarioProblems: salarioCommitments,
      bonificacionProblems: bonificacionCommitments
    };
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    return null;
  }
}

// Función para limpiar compromisos específicos por concepto
async function cleanupByConceptAndProvider(concept, provider = null) {
  console.log(`\n🧹 LIMPIANDO: ${concept}${provider ? ` de ${provider}` : ''}`);
  console.log('-'.repeat(50));
  
  try {
    let queryConstraints = [where('concept', '==', concept)];
    
    if (provider) {
      queryConstraints.push(where('beneficiary', '==', provider));
    }
    
    // Buscar compromisos "Sin empresa"
    queryConstraints.push(where('companyName', 'in', ['Sin empresa', '', null]));
    
    const q = query(collection(db, 'commitments'), ...queryConstraints);
    const snapshot = await getDocs(q);
    
    console.log(`📋 Compromisos encontrados para limpiar: ${snapshot.size}`);
    
    if (snapshot.size === 0) {
      console.log('✅ No hay compromisos problemáticos de este tipo');
      return 0;
    }
    
    // Mostrar detalles antes de eliminar
    console.log('\n📋 COMPROMISOS QUE SE VAN A ELIMINAR:');
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   👤 Proveedor: ${data.beneficiary || 'Sin beneficiario'}`);
      console.log(`   💰 Monto: $${(data.totalAmount || data.amount || 0).toLocaleString()}`);
      console.log(`   📅 Vencimiento: ${data.dueDate ? (data.dueDate.seconds ? new Date(data.dueDate.seconds * 1000).toLocaleDateString() : data.dueDate) : 'Sin fecha'}`);
    });
    
    // Confirmar eliminación
    if (!process.argv.includes('--confirm')) {
      console.log('\n⚠️ MODO PREVIEW: Para eliminar realmente, agrega --confirm');
      return 0;
    }
    
    // Eliminar en batch
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ ${snapshot.size} compromisos eliminados exitosamente`);
    
    return snapshot.size;
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    return 0;
  }
}

// Ejecutar diagnóstico
async function main() {
  const results = await findAllOrphanedCommitments();
  
  if (results && (results.salarioProblems.length > 0 || results.bonificacionProblems.length > 0)) {
    console.log('\n🛠️ OPCIONES DE LIMPIEZA DISPONIBLES:');
    console.log('=' .repeat(50));
    console.log('1. Para limpiar salarios: node diagnose-all-orphans.js --cleanup-salarios');
    console.log('2. Para limpiar bonificaciones: node diagnose-all-orphans.js --cleanup-bonificaciones');
    console.log('3. Para limpiar todo: node diagnose-all-orphans.js --cleanup-all');
    console.log('\nAgregar --confirm para ejecutar realmente');
  }
  
  // Ejecutar limpieza si se solicita
  if (process.argv.includes('--cleanup-salarios')) {
    await cleanupByConceptAndProvider('Salario');
  } else if (process.argv.includes('--cleanup-bonificaciones')) {
    await cleanupByConceptAndProvider('Bonificación');
  } else if (process.argv.includes('--cleanup-all')) {
    const salarios = await cleanupByConceptAndProvider('Salario');
    const bonificaciones = await cleanupByConceptAndProvider('Bonificación');
    console.log(`\n📊 TOTAL ELIMINADO: ${salarios + bonificaciones} compromisos`);
  }
}

main().then(() => {
  console.log('\n✅ Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
