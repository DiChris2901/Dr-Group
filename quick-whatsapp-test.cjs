const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';
const MESSAGING_SERVICE_SID = 'MG96fbd375e79dec60497c551823f0f9e0';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function quickTest() {
  try {
    console.log('🚀 Enviando mensaje de prueba rápido...');
    
    const message = await client.messages.create({
      messagingServiceSid: MESSAGING_SERVICE_SID,
      to: 'whatsapp:+12312419541',
      body: `✅ PRUEBA RÁPIDA - ${new Date().toLocaleString()}\n\n🎉 ¡Tu WhatsApp Business API está funcionando!\n\n📱 Enviado desde: +12312419541\n🏢 Via: DR Group Messaging Service`
    });
    
    console.log(`✅ Mensaje enviado: ${message.sid}`);
    console.log(`📊 Estado: ${message.status}`);
    
    // Esperar 5 segundos y verificar
    console.log('\n⏳ Esperando 5 segundos para verificar estado...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await client.messages(message.sid).fetch();
    console.log(`\n🔄 Estado final: ${status.status}`);
    
    if (status.errorCode) {
      console.log(`❌ Error: ${status.errorCode} - ${status.errorMessage}`);
      return false;
    }
    
    if (status.status === 'delivered' || status.status === 'sent') {
      console.log('\n🎉 ¡ÉXITO TOTAL! WhatsApp Business API funcionando perfectamente');
      return true;
    } else {
      console.log(`\n⚠️ Estado: ${status.status} - Verifica tu WhatsApp`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

quickTest()
  .then(success => {
    console.log(success ? '\n✅ CONFIGURACIÓN EXITOSA' : '\n❌ NECESITA AJUSTES');
    process.exit(0);
  });
