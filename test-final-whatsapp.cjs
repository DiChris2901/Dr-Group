const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';
const MESSAGING_SERVICE_SID = 'MG96fbd375e79dec60497c551823f0f9e0';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function testFinalConfiguration() {
  console.log('🎯 PRUEBA FINAL - WhatsApp Business API');
  console.log('=' .repeat(50));
  
  try {
    // Verificar estado del servicio de messaging
    console.log('🔍 Verificando Messaging Service...');
    const service = await client.messaging.v1.services(MESSAGING_SERVICE_SID).fetch();
    console.log(`✅ Servicio: ${service.friendlyName}`);
    console.log(`📊 Estado: ${service.status}`);
    
    // Verificar números en el servicio
    const phoneNumbers = await client.messaging.v1.services(MESSAGING_SERVICE_SID).phoneNumbers.list();
    console.log(`📱 Números configurados: ${phoneNumbers.length}`);
    phoneNumbers.forEach(phone => {
      console.log(`  → ${phone.phoneNumber} (${phone.capabilities.join(', ')})`);
    });
    
    // Enviar mensaje de prueba FINAL
    console.log('\n🚀 Enviando mensaje de prueba FINAL...');
    const testMessage = await client.messages.create({
      messagingServiceSid: MESSAGING_SERVICE_SID,
      to: 'whatsapp:+12312419541',
      body: `🎉 ¡CONFIGURACIÓN COMPLETADA! - ${new Date().toLocaleString()}\n\n✅ WhatsApp Business API funcionando\n📱 Messaging Service configurado\n🏢 DR Group Dashboard listo\n\n¡Ya puedes recibir notificaciones automáticas!`
    });
    
    console.log(`✅ Mensaje enviado: ${testMessage.sid}`);
    console.log(`📊 Estado inicial: ${testMessage.status}`);
    
    // Esperar y verificar estado final
    console.log('\n⏳ Verificando entrega en 8 segundos...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const finalStatus = await client.messages(testMessage.sid).fetch();
    console.log(`\n🔄 Estado final: ${finalStatus.status}`);
    
    if (finalStatus.errorCode) {
      console.log(`❌ Error: ${finalStatus.errorCode} - ${finalStatus.errorMessage}`);
      console.log(`🔗 Más info: ${finalStatus.moreInfo || 'N/A'}`);
      return false;
    }
    
    console.log('\n' + '='.repeat(50));
    if (finalStatus.status === 'delivered') {
      console.log('🎊 ¡ÉXITO TOTAL! WhatsApp Business API 100% funcional');
      console.log('✅ Tu dashboard ya puede enviar notificaciones automáticas');
      console.log('📱 Los usuarios recibirán alertas de compromisos financieros');
    } else if (finalStatus.status === 'sent') {
      console.log('✅ Mensaje enviado correctamente');
      console.log('📱 Revisa tu WhatsApp para confirmar recepción');
    } else {
      console.log(`⚠️ Estado: ${finalStatus.status}`);
      console.log('🔧 La configuración puede necesitar ajustes adicionales');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en prueba final:', error.message);
    if (error.code) {
      console.error(`🔢 Código de error: ${error.code}`);
      console.error(`🔗 Más info: ${error.moreInfo || 'N/A'}`);
    }
    return false;
  }
}

testFinalConfiguration()
  .then(success => {
    console.log(success ? '\n🏁 CONFIGURACIÓN EXITOSA' : '\n⚠️ NECESITA REVISIÓN');
    process.exit(0);
  });
