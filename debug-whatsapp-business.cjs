const twilio = require('twilio');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function debugWhatsAppSenders() {
  console.log('🔍 Verificando configuración de WhatsApp...\n');
  
  try {
    // 1. Verificar números de WhatsApp disponibles
    console.log('📱 Números de WhatsApp disponibles:');
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    phoneNumbers.forEach(number => {
      console.log(`  - ${number.phoneNumber} (${number.friendlyName})`);
    });

    // 2. Verificar WhatsApp Senders específicamente
    console.log('\n📞 WhatsApp Senders configurados:');
    try {
      const senders = await client.messaging.v1.services.list();
      console.log(`Total de servicios de messaging: ${senders.length}`);
      
      for (const service of senders) {
        console.log(`\nServicio: ${service.friendlyName} (${service.sid})`);
        try {
          const phoneNumbers = await client.messaging.v1.services(service.sid).phoneNumbers.list();
          phoneNumbers.forEach(phone => {
            console.log(`  📱 ${phone.phoneNumber} - Capacidades: ${phone.capabilities.join(', ')}`);
          });
        } catch (err) {
          console.log(`  ⚠️ No se pudieron obtener números para este servicio`);
        }
      }
    } catch (err) {
      console.log('⚠️ No se pudieron obtener servicios de messaging');
    }

    // 3. Verificar estado específico de WhatsApp Business
    console.log('\n🏢 Estado de WhatsApp Business API:');
    try {
      // Intentar obtener información de WhatsApp Business
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
        }
      });
      
      if (response.ok) {
        console.log('✅ API de Twilio accesible');
      } else {
        console.log('❌ Problema con API de Twilio');
      }
    } catch (err) {
      console.log('❌ Error verificando API:', err.message);
    }

    // 4. Probar envío de mensaje de prueba desde sandbox
    console.log('\n🧪 Probando envío desde Sandbox:');
    try {
      const testMessage = await client.messages.create({
        from: 'whatsapp:+14155238886', // Sandbox
        to: 'whatsapp:+12312419541',   // Tu número
        body: '🧪 Mensaje de prueba desde Sandbox - ' + new Date().toLocaleTimeString()
      });
      console.log(`✅ Mensaje de prueba enviado: ${testMessage.sid}`);
      console.log(`📊 Estado: ${testMessage.status}`);
    } catch (err) {
      console.log(`❌ Error enviando desde Sandbox: ${err.message}`);
    }

    // 5. Probar envío desde tu número personal
    console.log('\n📱 Probando envío desde número personal (+12312419541):');
    try {
      const testMessage = await client.messages.create({
        from: 'whatsapp:+12312419541', // Tu número
        to: 'whatsapp:+12312419541',   // A ti mismo
        body: '📱 Mensaje de prueba desde número personal - ' + new Date().toLocaleTimeString()
      });
      console.log(`✅ Mensaje personal enviado: ${testMessage.sid}`);
      console.log(`📊 Estado: ${testMessage.status}`);
    } catch (err) {
      console.log(`❌ Error enviando desde número personal: ${err.message}`);
      console.log(`🔍 Detalle del error:`, err);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar verificación
debugWhatsAppSenders()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error ejecutando verificación:', error);
    process.exit(1);
  });
