import admin from 'firebase-admin';

// Verificar si ya está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dr-group-dashboard'
  });
}

const db = admin.firestore();

async function checkCommitmentsData() {
  try {
    console.log('🔍 Analizando compromisos...');
    const commitmentsSnapshot = await db.collection('commitments').get();
    
    if (commitmentsSnapshot.empty) {
      console.log('❌ No se encontraron compromisos');
      return;
    }

    console.log(`✅ Encontrados ${commitmentsSnapshot.size} compromisos:`);
    
    let totalCommitments = 0;
    let paidCommitments = 0;
    let pendingCommitments = 0;
    let overdueCommitments = 0;
    const now = new Date();

    commitmentsSnapshot.forEach((doc) => {
      const commitment = doc.data();
      totalCommitments++;

      // Convertir fecha de vencimiento
      const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      const isOverdue = dueDate < now;

      // Verificar múltiples campos de estado de pago
      const isPaid = commitment.status === 'completed' || 
                    commitment.status === 'paid' || 
                    commitment.status === 'Pagado' ||
                    commitment.status === 'pagado' ||
                    commitment.status === 'PAGADO' ||
                    commitment.paid === true ||
                    commitment.isPaid === true ||
                    commitment.paymentStatus === 'paid' ||
                    commitment.paymentStatus === 'Pagado' ||
                    commitment.paymentStatus === 'pagado' ||
                    commitment.completed === true;

      if (isPaid) {
        paidCommitments++;
      } else {
        pendingCommitments++;
        if (isOverdue) {
          overdueCommitments++;
        }
      }

      console.log(`\n💼 Compromiso ID: ${doc.id}`);
      console.log(`   Descripción: ${commitment.description || 'Sin descripción'}`);
      console.log(`   Status: ${commitment.status || 'Sin status'}`);
      console.log(`   Paid: ${commitment.paid || false}`);
      console.log(`   isPaid: ${commitment.isPaid || false}`);
      console.log(`   paymentStatus: ${commitment.paymentStatus || 'Sin paymentStatus'}`);
      console.log(`   completed: ${commitment.completed || false}`);
      console.log(`   Monto: $${commitment.amount?.toLocaleString() || 'Sin monto'}`);
      console.log(`   Fecha vencimiento: ${dueDate.toLocaleDateString()}`);
      console.log(`   ¿Es vencido?: ${isOverdue ? 'SÍ' : 'NO'}`);
      console.log(`   ¿Está pagado?: ${isPaid ? 'SÍ' : 'NO'}`);
      console.log(`   Empresa: ${commitment.company || 'Sin empresa'}`);
      console.log(`   Todos los campos: ${Object.keys(commitment).join(', ')}`);
    });

    console.log('\n📊 RESUMEN FINAL:');
    console.log(`   Total de compromisos: ${totalCommitments}`);
    console.log(`   Compromisos pagados: ${paidCommitments}`);
    console.log(`   Compromisos pendientes: ${pendingCommitments}`);
    console.log(`   Compromisos vencidos: ${overdueCommitments}`);

  } catch (error) {
    console.error('❌ Error al verificar compromisos:', error);
  }
}

// Ejecutar la función
checkCommitmentsData()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el análisis:', error);
    process.exit(1);
  });
