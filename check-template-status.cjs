const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function checkTemplateStatus() {
  console.log('📄 VERIFICANDO ESTADO DE PLANTILLAS WHATSAPP\n');
  
  try {
    // Obtener todas las plantillas de contenido
    console.log('🔍 Buscando plantillas de contenido...');
    const contentList = await client.content.v1.contents.list({ limit: 20 });
    
    if (contentList.length === 0) {
      console.log('📭 No tienes plantillas creadas aún');
      console.log('\n🔧 PASOS PARA CREAR PLANTILLAS:');
      console.log('1. Ve a Twilio Console > Messaging > Content');
      console.log('2. Clic en "Create Content"');
      console.log('3. Selecciona "WhatsApp Template"');
      console.log('4. Diseña tu plantilla');
      console.log('5. Envía para aprobación');
      console.log('\n💡 EJEMPLOS DE PLANTILLAS ÚTILES:');
      console.log('- Alerta de vencimiento de compromiso');
      console.log('- Recordatorio de pago');
      console.log('- Confirmación de recepción de documento');
      return;
    }
    
    console.log(`✅ Encontradas ${contentList.length} plantillas:\n`);
    
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    
    for (const content of contentList) {
      console.log(`📄 ${content.friendlyName}`);
      console.log(`   SID: ${content.sid}`);
      console.log(`   Tipo: ${content.types?.whatsapp?.content_type || 'No especificado'}`);
      console.log(`   Idioma: ${content.language || 'No especificado'}`);
      
      // Verificar estado de aprobación
      try {
        const approvalRequests = await client.content.v1.contents(content.sid)
          .approvalRequests.list();
        
        if (approvalRequests.length > 0) {
          const latestRequest = approvalRequests[0];
          const status = latestRequest.status;
          
          console.log(`   Estado: ${getStatusEmoji(status)} ${status.toUpperCase()}`);
          
          if (status === 'approved') {
            approvedCount++;
            console.log(`   🎉 ¡LISTA PARA USAR!`);
            console.log(`   💡 Content SID: ${content.sid}`);
          } else if (status === 'pending') {
            pendingCount++;
            console.log(`   ⏳ En revisión por Meta`);
          } else if (status === 'rejected') {
            rejectedCount++;
            console.log(`   ❌ Rechazada: ${latestRequest.rejection_reason || 'Sin razón especificada'}`);
          }
        } else {
          console.log(`   ❓ Sin solicitudes de aprobación`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error verificando aprobación: ${error.message}`);
      }
      
      console.log(''); // Línea vacía
    }
    
    console.log('📊 RESUMEN:');
    console.log(`✅ Aprobadas: ${approvedCount}`);
    console.log(`⏳ Pendientes: ${pendingCount}`);
    console.log(`❌ Rechazadas: ${rejectedCount}`);
    
    if (approvedCount > 0) {
      console.log('\n🎉 ¡TIENES PLANTILLAS APROBADAS!');
      console.log('Ya puedes usar la sección "Prueba de Plantilla" en la aplicación');
      console.log('Copia el Content SID de una plantilla aprobada');
    } else if (pendingCount > 0) {
      console.log('\n⏳ Plantillas en revisión');
      console.log('Meta suele tomar 1-3 días hábiles para aprobar');
    } else {
      console.log('\n💡 RECOMENDACIÓN:');
      console.log('Crea plantillas en Twilio Console para notificaciones proactivas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function getStatusEmoji(status) {
  switch (status.toLowerCase()) {
    case 'approved': return '✅';
    case 'pending': return '⏳';
    case 'rejected': return '❌';
    default: return '❓';
  }
}

checkTemplateStatus();
