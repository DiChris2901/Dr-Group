const twilio = require('twilio');

// Configuración actual
const accountSid = 'AC4edddde73e334e2f68b9e0a99ba9e3a7';
const authToken = 'eaab8d47be8a6fea30e3043b54b62e96';
const businessNumber = '+12312419541';
const messagingServiceSid = 'MG54aad017083c59b0fb86fe0e7d2dd5f2';

const client = twilio(accountSid, authToken);

async function testBusinessVerified() {
  console.log('🔍 Verificando estado del número Business después de verificación...\n');
  
  try {
    // 1. Verificar el Messaging Service
    console.log('🛠️ Verificando Messaging Service:', messagingServiceSid);
    const service = await client.messaging.v1.services(messagingServiceSid).fetch();
    console.log('✅ Estado del servicio:', {
      sid: service.sid,
      friendlyName: service.friendlyName,
      inboundRequestUrl: service.inboundRequestUrl,
      fallbackUrl: service.fallbackUrl
    });

    // 2. Verificar números asociados al servicio
    console.log('\n📋 Números en el Messaging Service:');
    const phoneNumbers = await client.messaging.v1.services(messagingServiceSid)
      .phoneNumbers.list();
    
    phoneNumbers.forEach(number => {
      console.log(`  - ${number.phoneNumber} (capabilities: ${JSON.stringify(number.capabilities)})`);
    });

    // 3. Verificar números disponibles en la cuenta
    console.log('\n📱 Números disponibles en la cuenta:');
    const incomingNumbers = await client.incomingPhoneNumbers.list();
    incomingNumbers.forEach(number => {
      console.log(`  - ${number.phoneNumber} (${number.friendlyName || 'Sin nombre'})`);
    });

    // 4. Enviar mensaje de prueba con Business API
    const testNumber = '+573001234567'; // ⚠️ CAMBIA POR TU NÚMERO REAL
    console.log(`\n🚀 Enviando mensaje de prueba a ${testNumber}...`);
    console.log('⚠️  IMPORTANTE: Cambia el número de prueba en el código antes de ejecutar');
    
    // Comentar esta línea si no quieres enviar mensaje aún
    // return; // Descomenta para evitar envío accidental
    
    const message = await client.messages.create({
      from: businessNumber, // Usar directamente el número Business
      to: testNumber,
      body: '🎉 ¡VERIFICACIÓN COMPLETADA! Tu WhatsApp Business ya está funcionando correctamente.\n\n✅ Mensaje enviado desde número verificado\n📱 DR Group Dashboard\n🕒 ' + new Date().toLocaleString('es-CO')
    });

    console.log('✅ Mensaje enviado exitosamente!');
    console.log('📨 SID del mensaje:', message.sid);
    console.log('📡 Status:', message.status);
    console.log('🔄 Dirección:', message.direction);

    // 5. Monitorear el estado del mensaje
    console.log('\n⏳ Monitoreando estado del mensaje...');
    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async () => {
      attempts++;
      try {
        const updatedMessage = await client.messages(message.sid).fetch();
        console.log(`📊 Intento ${attempts}: ${updatedMessage.status}`);
        
        if (updatedMessage.status === 'delivered' || updatedMessage.status === 'read') {
          console.log('🎉 ¡Mensaje entregado exitosamente!');
          console.log('💰 Precio:', updatedMessage.price, updatedMessage.priceUnit);
          return true;
        } else if (updatedMessage.status === 'failed' || updatedMessage.status === 'undelivered') {
          console.log('❌ Mensaje falló:', updatedMessage.errorMessage || 'Sin detalles');
          return true;
        } else if (attempts >= maxAttempts) {
          console.log('⏰ Tiempo de espera agotado. Estado final:', updatedMessage.status);
          return true;
        }
        
        // Esperar 3 segundos antes del siguiente intento
        setTimeout(checkStatus, 3000);
      } catch (error) {
        console.error('❌ Error monitoreando mensaje:', error.message);
      }
    };

    await checkStatus();

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.code) {
      console.error('🔍 Código de error:', error.code);
    }
    if (error.moreInfo) {
      console.error('📖 Más información:', error.moreInfo);
    }
  }
}

// Ejecutar la prueba
testBusinessVerified().then(() => {
  console.log('\n✅ Prueba completada');
}).catch(error => {
  console.error('\n❌ Error en la prueba:', error);
});
