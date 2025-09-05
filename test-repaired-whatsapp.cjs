const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';
const NEW_MESSAGING_SERVICE_SID = 'MG27cf7b7e053b2fce451e7df1df543916';
const SANDBOX_PHONE_NUMBER = '+14155238886';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function testRepairedWhatsApp() {
  console.log('🔧 PROBANDO CONFIGURACIÓN REPARADA');
  console.log('=' .repeat(50));
  
  try {
    console.log('📱 Enviando mensaje de prueba desde Sandbox...');
    console.log('⚠️  Asegúrate de haber enviado "join modern-egg" al +14155238886');
    
    const sandboxMessage = await client.messages.create({
      from: `whatsapp:${SANDBOX_PHONE_NUMBER}`,
      to: 'whatsapp:+12312419541',
      body: `🎉 ¡SISTEMA REPARADO! - ${new Date().toLocaleString()}\n\n✅ Sandbox activado\n🔧 Messaging Service actualizado\n📱 WhatsApp funcionando\n\n¡Revisa este mensaje en tu WhatsApp!`
    });
    
    console.log(`✅ Mensaje Sandbox enviado: ${sandboxMessage.sid}`);
    console.log(`📊 Estado inicial: ${sandboxMessage.status}`);
    
    // Esperar y verificar estado
    console.log('\n⏳ Verificando entrega en 10 segundos...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const sandboxStatus = await client.messages(sandboxMessage.sid).fetch();
    console.log(`🔄 Estado final Sandbox: ${sandboxStatus.status}`);
    
    if (sandboxStatus.errorCode) {
      console.log(`❌ Error Sandbox: ${sandboxStatus.errorCode} - ${sandboxStatus.errorMessage}`);
    }
    
    // Probar también con Business API
    console.log('\n🏢 Enviando mensaje desde Business API...');
    const businessMessage = await client.messages.create({
      messagingServiceSid: NEW_MESSAGING_SERVICE_SID,
      to: 'whatsapp:+12312419541',
      body: `🏢 Business API Test - ${new Date().toLocaleString()}\n\n✅ Nuevo Messaging Service\n📱 Desde tu número personal\n🎯 DR Group Dashboard listo`
    });
    
    console.log(`✅ Mensaje Business enviado: ${businessMessage.sid}`);
    console.log(`📊 Estado inicial: ${businessMessage.status}`);
    
    // Esperar y verificar estado
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const businessStatus = await client.messages(businessMessage.sid).fetch();
    console.log(`🔄 Estado final Business: ${businessStatus.status}`);
    
    if (businessStatus.errorCode) {
      console.log(`❌ Error Business: ${businessStatus.errorCode} - ${businessStatus.errorMessage}`);
    }
    
    // Resumen final
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log('=' .repeat(50));
    
    const sandboxWorking = sandboxStatus.status === 'delivered' || sandboxStatus.status === 'sent';
    const businessWorking = businessStatus.status === 'delivered' || businessStatus.status === 'sent';
    
    console.log(`🧪 Sandbox: ${sandboxStatus.status} ${sandboxWorking ? '✅' : '❌'}`);
    console.log(`🏢 Business API: ${businessStatus.status} ${businessWorking ? '✅' : '❌'}`);
    
    if (sandboxWorking || businessWorking) {
      console.log('\n🎉 ¡AL MENOS UNA CONFIGURACIÓN FUNCIONA!');
      console.log('📱 Deberías recibir al menos un mensaje en WhatsApp');
      
      if (sandboxWorking) {
        console.log('✅ Sandbox está funcionando - perfecto para pruebas');
      }
      
      if (businessWorking) {
        console.log('✅ Business API está funcionando - perfecto para producción');
      }
    } else {
      console.log('\n⚠️  Ninguna configuración entregó mensajes');
      console.log('🔍 Posibles causas:');
      console.log('  1. No enviaste "join modern-egg" al Sandbox');
      console.log('  2. Tu número no está configurado correctamente para WhatsApp Business');
      console.log('  3. Hay restricciones en tu cuenta de Twilio');
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

testRepairedWhatsApp()
  .then(() => {
    console.log('\n✅ Prueba de configuración reparada completada');
    process.exit(0);
  });
