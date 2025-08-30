// 🔍 Diagnóstico de Compromisos Huérfanos
// Este script busca y reporta compromisos que pueden tener problemas de referencia

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

// Configuración de Firebase (usando la misma del proyecto)
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

async function diagnoseCommitments() {
  console.log('🔍 Iniciando diagnóstico de compromisos...\n');
  
  try {
    // 1. Obtener todos los compromisos
    console.log('📋 Obteniendo todos los compromisos...');
    const commitmentsSnapshot = await getDocs(collection(db, 'commitments'));
    const commitments = [];
    
    commitmentsSnapshot.forEach(doc => {
      commitments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Total de compromisos encontrados: ${commitments.length}\n`);
    
    // 2. Obtener todas las empresas para validar referencias
    console.log('🏢 Obteniendo todas las empresas...');
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const companies = new Set();
    
    companiesSnapshot.forEach(doc => {
      companies.add(doc.id);
    });
    
    console.log(`✅ Total de empresas encontradas: ${companies.size}\n`);
    
    // 3. Analizar problemas comunes
    let orphanedCommitments = 0;
    let missingCompanyName = 0;
    let invalidCompanyRefs = 0;
    let recurringCommitments = 0;
    let problemCommitments = [];
    
    console.log('🔍 Analizando compromisos...\n');
    
    for (const commitment of commitments) {
      let hasProblems = false;
      let problems = [];
      
      // Verificar si falta companyName
      if (!commitment.companyName || commitment.companyName.trim() === '') {
        missingCompanyName++;
        hasProblems = true;
        problems.push('Sin companyName');
      }
      
      // Verificar si companyId es válido
      if (commitment.companyId && !companies.has(commitment.companyId)) {
        invalidCompanyRefs++;
        hasProblems = true;
        problems.push(`CompanyId inválido: ${commitment.companyId}`);
      }
      
      // Verificar si es recurrente
      if (commitment.periodicity && commitment.periodicity !== 'unique') {
        recurringCommitments++;
        problems.push(`Recurrente: ${commitment.periodicity}`);
      }
      
      // Verificar si el documento realmente existe (intento de lectura)
      try {
        const docRef = doc(db, 'commitments', commitment.id);
        const docSnapshot = await getDoc(docRef);
        if (!docSnapshot.exists()) {
          orphanedCommitments++;
          hasProblems = true;
          problems.push('Documento huérfano');
        }
      } catch (error) {
        orphanedCommitments++;
        hasProblems = true;
        problems.push(`Error de lectura: ${error.message}`);
      }
      
      if (hasProblems || problems.length > 0) {
        problemCommitments.push({
          id: commitment.id,
          concept: commitment.concept || 'Sin concepto',
          companyName: commitment.companyName || 'Sin empresa',
          beneficiary: commitment.beneficiary || 'Sin beneficiario',
          problems: problems,
          periodicity: commitment.periodicity || 'unique'
        });
      }
    }
    
    // 4. Reporte de resultados
    console.log('📊 REPORTE DE DIAGNÓSTICO:');
    console.log('=' .repeat(50));
    console.log(`📝 Total de compromisos: ${commitments.length}`);
    console.log(`🏢 Total de empresas: ${companies.size}`);
    console.log(`❌ Compromisos sin companyName: ${missingCompanyName}`);
    console.log(`🔗 Referencias de empresa inválidas: ${invalidCompanyRefs}`);
    console.log(`🔄 Compromisos recurrentes: ${recurringCommitments}`);
    console.log(`👻 Documentos huérfanos: ${orphanedCommitments}`);
    console.log(`⚠️ Total con problemas: ${problemCommitments.length}\n`);
    
    if (problemCommitments.length > 0) {
      console.log('🚨 COMPROMISOS CON PROBLEMAS:');
      console.log('-' .repeat(80));
      
      problemCommitments.forEach((commitment, index) => {
        console.log(`${index + 1}. ${commitment.id}`);
        console.log(`   📝 Concepto: ${commitment.concept}`);
        console.log(`   🏢 Empresa: ${commitment.companyName}`);
        console.log(`   👤 Beneficiario: ${commitment.beneficiary}`);
        console.log(`   🔄 Periodicidad: ${commitment.periodicity}`);
        console.log(`   ⚠️ Problemas: ${commitment.problems.join(', ')}`);
        console.log('');
      });
    }
    
    // 5. Buscar el compromiso específico del error
    const specificCommitment = commitments.find(c => c.id === 'Wn02ZV71752QRHLyi2Uw');
    if (specificCommitment) {
      console.log('🎯 COMPROMISO ESPECÍFICO DEL ERROR ENCONTRADO:');
      console.log('-' .repeat(50));
      console.log(JSON.stringify(specificCommitment, null, 2));
    } else {
      console.log('❌ El compromiso Wn02ZV71752QRHLyi2Uw NO se encontró en la base de datos');
      console.log('   Esto confirma que es un documento huérfano.');
    }
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Ejecutar el diagnóstico
diagnoseCommitments().then(() => {
  console.log('\n✅ Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
