const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';
const MESSAGING_SERVICE_SID = 'MG96fbd375e79dec60497c551823f0f9e0';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function checkRecentMessages() {
  console.log('📋 Verificando mensajes recientes...\n');
  
  try {
    // Obtener los últimos 5 mensajes
    const messages = await client.messages.list({ limit: 5 });
    
    console.log('📨 Últimos mensajes enviados:');
    console.log('─'.repeat(60));
    
    messages.forEach((message, index) => {
      const date = new Date(message.dateCreated).toLocaleString();
      const status = message.status;
      const error = message.errorCode ? `❌ ${message.errorCode}` : '✅';
      
      console.log(`${index + 1}. ${message.sid}`);
      console.log(`   📅 ${date}`);
      console.log(`   📱 ${message.from} → ${message.to}`);
      console.log(`   📊 Estado: ${status} ${error}`);
      console.log(`   💬 "${message.body?.substring(0, 50)}..."`);
      console.log('');
    });
    
    // Verificar el último mensaje de WhatsApp específicamente
    const whatsappMessages = messages.filter(m => 
      m.to.includes('whatsapp:') && 
      m.dateCreated > new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
    );
    
    if (whatsappMessages.length > 0) {
      const lastWhatsApp = whatsappMessages[0];
      console.log('🎯 Último mensaje de WhatsApp:');
      console.log(`📊 Estado: ${lastWhatsApp.status}`);
      
      if (lastWhatsApp.status === 'delivered') {
        console.log('🎉 ¡ÉXITO! WhatsApp Business API funcionando perfectamente');
      } else if (lastWhatsApp.status === 'sent') {
        console.log('✅ Mensaje enviado, esperando confirmación de entrega');
      } else if (lastWhatsApp.errorCode) {
        console.log(`❌ Error: ${lastWhatsApp.errorCode} - ${lastWhatsApp.errorMessage}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error verificando mensajes:', error.message);
  }
}

checkRecentMessages()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  });
