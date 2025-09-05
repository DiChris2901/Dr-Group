const twilio = require('twilio');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';
const MESSAGING_SERVICE_SID = 'MG96fbd375e79dec60497c551823f0f9e0';
const SANDBOX_PHONE_NUMBER = '+14155238886';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function testWhatsAppConfiguration() {
  console.log('🧪 Probando configuración de WhatsApp Business...\n');
  
  try {
    // Prueba 1: Enviar desde Business API usando Messaging Service
    console.log('📱 PRUEBA 1: WhatsApp Business API con Messaging Service');
    console.log('─'.repeat(60));
    
    const businessMessage = await client.messages.create({
      messagingServiceSid: MESSAGING_SERVICE_SID,
      to: 'whatsapp:+12312419541',
      body: `🏢 Prueba Business API - ${new Date().toLocaleTimeString()}\n\n✅ Este mensaje se envía desde tu número personal (+12312419541) usando WhatsApp Business API.\n\n🎉 ¡Si recibes este mensaje, la configuración está funcionando perfectamente!`
    });
    
    console.log(`✅ Mensaje Business enviado: ${businessMessage.sid}`);
    console.log(`📊 Estado inicial: ${businessMessage.status}`);
    console.log(`🔗 Desde: Messaging Service ${MESSAGING_SERVICE_SID}`);
    console.log(`📱 Hacia: whatsapp:+12312419541`);
    
    // Esperar y verificar estado
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const businessStatus = await client.messages(businessMessage.sid).fetch();
    console.log(`🔄 Estado actualizado: ${businessStatus.status}`);
    if (businessStatus.errorCode) {
      console.log(`❌ Error: ${businessStatus.errorCode} - ${businessStatus.errorMessage}`);
    }
    
    console.log('\n' + '─'.repeat(60));
    
    // Prueba 2: Enviar desde Sandbox (como respaldo)
    console.log('\n🧪 PRUEBA 2: Sandbox (respaldo)');
    console.log('─'.repeat(60));
    
    const sandboxMessage = await client.messages.create({
      from: `whatsapp:${SANDBOX_PHONE_NUMBER}`,
      to: 'whatsapp:+12312419541',
      body: `🧪 Prueba Sandbox - ${new Date().toLocaleTimeString()}\n\n⚠️ Este mensaje se envía desde el Sandbox de Twilio.\n\n🔧 Se usa como respaldo si Business API falla.`
    });
    
    console.log(`✅ Mensaje Sandbox enviado: ${sandboxMessage.sid}`);
    console.log(`📊 Estado inicial: ${sandboxMessage.status}`);
    console.log(`🔗 Desde: ${SANDBOX_PHONE_NUMBER} (Sandbox)`);
    console.log(`📱 Hacia: whatsapp:+12312419541`);
    
    // Esperar y verificar estado
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const sandboxStatus = await client.messages(sandboxMessage.sid).fetch();
    console.log(`🔄 Estado actualizado: ${sandboxStatus.status}`);
    if (sandboxStatus.errorCode) {
      console.log(`❌ Error: ${sandboxStatus.errorCode} - ${sandboxStatus.errorMessage}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    console.log(`🏢 Business API: ${businessStatus.status} ${businessStatus.errorCode ? '❌' : '✅'}`);
    console.log(`🧪 Sandbox: ${sandboxStatus.status} ${sandboxStatus.errorCode ? '❌' : '✅'}`);
    
    if (businessStatus.status === 'delivered' || businessStatus.status === 'sent') {
      console.log('\n🎉 ¡ÉXITO! WhatsApp Business API está funcionando correctamente');
      console.log('✅ Tu número personal ya puede enviar mensajes de WhatsApp');
    } else if (sandboxStatus.status === 'delivered' || sandboxStatus.status === 'sent') {
      console.log('\n⚠️ Business API tuvo problemas, pero Sandbox funciona');
      console.log('🔧 Verifica la configuración de WhatsApp Business en Twilio Console');
    } else {
      console.log('\n❌ Ambas configuraciones tuvieron problemas');
      console.log('🔍 Revisa los logs de error arriba');
    }
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  }
}

// Ejecutar pruebas
testWhatsAppConfiguration()
  .then(() => {
    console.log('\n✅ Pruebas completadas');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error ejecutando pruebas:', error);
    process.exit(1);
  });
