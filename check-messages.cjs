const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function checkMessage() {
  try {
    // Buscar el último mensaje enviado a tu número
    const messages = await client.messages.list({
      to: 'whatsapp:+12312419541',
      limit: 5
    });
    
    console.log('📱 Últimos 5 mensajes enviados a tu número:\n');
    
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. ID: ${msg.sid}`);
      console.log(`   Estado: ${msg.status}`);
      console.log(`   Desde: ${msg.from}`);
      console.log(`   Fecha: ${msg.dateCreated}`);
      if (msg.errorCode) {
        console.log(`   ❌ Error: ${msg.errorCode} - ${msg.errorMessage}`);
      }
      console.log('   ---');
    });
    
    // Estado del último mensaje
    const latest = messages[0];
    if (latest) {
      console.log(`\n🔍 Estado del último mensaje (${latest.sid}):`);
      console.log(`📊 Estado actual: ${latest.status}`);
      
      if (latest.status === 'delivered') {
        console.log('🎉 ¡MENSAJE ENTREGADO! WhatsApp Business API funciona perfectamente');
      } else if (latest.status === 'sent') {
        console.log('✅ Mensaje enviado exitosamente, esperando entrega');
      } else if (latest.status === 'failed') {
        console.log('❌ Mensaje falló');
      } else {
        console.log('⏳ Mensaje en proceso...');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMessage();
