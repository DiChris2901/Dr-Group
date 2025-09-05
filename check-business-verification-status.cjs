const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function checkBusinessStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE WHATSAPP BUSINESS\n');
  
  try {
    // 1. Verificar el número de teléfono directamente
    console.log('📱 Verificando número +12312419541...');
    
    try {
      const phoneNumber = await client.incomingPhoneNumbers.list({
        phoneNumber: '+12312419541'
      });
      
      if (phoneNumber.length > 0) {
        console.log('✅ Número encontrado en la cuenta');
        console.log('📋 Detalles:', {
          sid: phoneNumber[0].sid,
          friendlyName: phoneNumber[0].friendlyName,
          capabilities: phoneNumber[0].capabilities
        });
      } else {
        console.log('⚠️ Número no encontrado como incoming number');
      }
    } catch (error) {
      console.log('⚠️ Error verificando incoming numbers:', error.message);
    }
    
    // 2. Verificar el messaging service
    console.log('\n🛠️ Verificando Messaging Service...');
    const service = await client.messaging.v1.services('MG54aad017083c59b0fb86fe0e7d2dd5f2').fetch();
    console.log('✅ Servicio activo:', service.friendlyName);
    
    // 3. Verificar números en el messaging service
    console.log('\n📋 Números en el Messaging Service:');
    const serviceNumbers = await client.messaging.v1.services('MG54aad017083c59b0fb86fe0e7d2dd5f2')
      .phoneNumbers.list();
    
    serviceNumbers.forEach(number => {
      console.log(`  📱 ${number.phoneNumber}`);
      console.log(`     Capabilities: ${JSON.stringify(number.capabilities)}`);
    });
    
    // 4. Intentar envío directo (para probar el error específico)
    console.log('\n🧪 Probando envío directo desde Business number...');
    try {
      // Usar un número de prueba que no cause costo
      const testMessage = await client.messages.create({
        from: '+12312419541',
        to: '+15005550006', // Número de prueba de Twilio (siempre falla sin costo)
        body: 'Test de verificación'
      });
      
      console.log('✅ Envío directo exitoso (inesperado con número de prueba)');
    } catch (directError) {
      console.log('❌ Error en envío directo (esperado):');
      console.log(`   Código: ${directError.code}`);
      console.log(`   Mensaje: ${directError.message}`);
      
      // Analizar el error específico
      if (directError.code === 21614) {
        console.log('\n🔍 DIAGNÓSTICO: Número no verificado para WhatsApp');
        console.log('   → La verificación de Meta aún está pendiente');
      } else if (directError.code === 21211) {
        console.log('\n🔍 DIAGNÓSTICO: Número inválido o no configurado');
      } else if (directError.code === 63016) {
        console.log('\n🔍 DIAGNÓSTICO: Número no aprobado para WhatsApp Business');
      }
    }
    
    // 5. Verificar estado de WhatsApp específicamente
    console.log('\n📞 Verificando capacidades de WhatsApp...');
    try {
      // Intentar obtener información específica de WhatsApp
      const whatsappSenders = await client.messaging.v1.services('MG54aad017083c59b0fb86fe0e7d2dd5f2')
        .phoneNumbers.list();
      
      whatsappSenders.forEach(sender => {
        const hasWhatsApp = sender.capabilities && sender.capabilities.includes && sender.capabilities.includes('whatsapp');
        console.log(`  ${sender.phoneNumber}: WhatsApp ${hasWhatsApp ? '✅' : '❌'}`);
      });
    } catch (error) {
      console.log('⚠️ Error verificando capacidades WhatsApp:', error.message);
    }
    
    console.log('\n📊 CONCLUSIÓN:');
    console.log('Si ves errores arriba, tu número Business aún no está completamente verificado.');
    console.log('El sistema seguirá usando Sandbox hasta que Meta apruebe la verificación.');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkBusinessStatus();
