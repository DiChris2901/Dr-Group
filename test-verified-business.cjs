const twilio = require('twilio');

// Configuración actualizada
const accountSid = 'AC9d2313319dee6dcba99298003893c190';
const authToken = '2025cd85312e59bf48af46786e73be64';
const businessNumber = '+12312419541';
const messagingServiceSid = 'MG54aad017083c59b0fb86fe0e7d2dd5f2';

const client = twilio(accountSid, authToken);

async function testPostVerification() {
  console.log('🎉 PROBANDO WHATSAPP BUSINESS POST-VERIFICACIÓN\n');
  
  try {
    // 1. Verificar configuración
    console.log('🔧 Verificando configuración...');
    const service = await client.messaging.v1.services(messagingServiceSid).fetch();
    console.log('✅ Messaging Service:', service.friendlyName);
    
    // 2. Verificar números en el servicio
    const phoneNumbers = await client.messaging.v1.services(messagingServiceSid)
      .phoneNumbers.list();
    
    console.log('📱 Números configurados:');
    phoneNumbers.forEach(number => {
      console.log(`  - ${number.phoneNumber}`);
    });

    // 3. CAMBIAR POR TU NÚMERO REAL
    const testNumber = '+573001234567'; // ⚠️ REEMPLAZA CON TU NÚMERO
    
    console.log(`\n🚀 Enviando mensaje de prueba a ${testNumber}...`);
    console.log('⚠️  IMPORTANTE: Cambia testNumber por tu número real\n');
    
    // Usar messaging service (recomendado)
    const message = await client.messages.create({
      messagingServiceSid: messagingServiceSid,
      to: testNumber,
      body: `🎉 ¡VERIFICACIÓN EXITOSA!

Tu WhatsApp Business ${businessNumber} ya está funcionando correctamente.

✅ Verificación completada
📱 Enviado vía Messaging Service
🏢 DR Group Dashboard
🕒 ${new Date().toLocaleString('es-CO')}`
    });

    console.log('✅ Mensaje enviado!');
    console.log('📨 SID:', message.sid);
    console.log('📊 Estado inicial:', message.status);
    console.log('🔄 Dirección:', message.direction);
    
    // 4. Monitorear el estado
    console.log('\n⏳ Monitoreando entrega...');
    
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const updatedMessage = await client.messages(message.sid).fetch();
        console.log(`📊 ${i + 1}/8: ${updatedMessage.status}`);
        
        if (updatedMessage.status === 'delivered') {
          console.log('🎉 ¡MENSAJE ENTREGADO EXITOSAMENTE!');
          console.log('💰 Costo:', updatedMessage.price, updatedMessage.priceUnit);
          break;
        } else if (updatedMessage.status === 'failed' || updatedMessage.status === 'undelivered') {
          console.log('❌ Mensaje falló:', updatedMessage.errorMessage || 'Sin detalles');
          break;
        }
      } catch (error) {
        console.log(`⚠️ Error obteniendo estado: ${error.message}`);
      }
    }
    
    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('🔍 Código:', error.code);
    }
  }
}

testPostVerification();
