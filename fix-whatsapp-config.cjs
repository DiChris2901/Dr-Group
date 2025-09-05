const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function fixWhatsAppConfiguration() {
  console.log('🔧 REPARANDO CONFIGURACIÓN DE WHATSAPP');
  console.log('=' .repeat(50));
  
  try {
    // 1. Listar servicios existentes
    console.log('\n📋 PASO 1: Verificando servicios existentes');
    console.log('-'.repeat(40));
    
    const services = await client.messaging.v1.services.list();
    console.log(`📊 Servicios encontrados: ${services.length}`);
    
    if (services.length > 0) {
      services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.friendlyName} (${service.sid})`);
        console.log(`   Estado: ${service.status}`);
      });
    } else {
      console.log('❌ No hay servicios de messaging configurados');
    }
    
    // 2. Verificar números de teléfono disponibles
    console.log('\n📱 PASO 2: Verificando números disponibles');
    console.log('-'.repeat(40));
    
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    console.log(`📊 Números encontrados: ${phoneNumbers.length}`);
    
    let userPhoneNumber = null;
    phoneNumbers.forEach(phone => {
      console.log(`📱 ${phone.phoneNumber} (${phone.friendlyName})`);
      if (phone.phoneNumber === '+12312419541') {
        userPhoneNumber = phone;
        console.log('   ✅ Este es tu número personal');
      }
    });
    
    if (!userPhoneNumber) {
      console.log('❌ Tu número +12312419541 no está en la cuenta');
      return;
    }
    
    // 3. Crear nuevo servicio de messaging
    console.log('\n🆕 PASO 3: Creando nuevo Messaging Service');
    console.log('-'.repeat(40));
    
    const newService = await client.messaging.v1.services.create({
      friendlyName: 'DR Group WhatsApp Service v2',
      usecaseProTierRequirements: {
        brandingEnabled: false,
        shortCodeEnabled: false
      }
    });
    
    console.log(`✅ Nuevo servicio creado: ${newService.sid}`);
    console.log(`📛 Nombre: ${newService.friendlyName}`);
    
    // 4. Agregar tu número al servicio
    console.log('\n➕ PASO 4: Agregando tu número al servicio');
    console.log('-'.repeat(40));
    
    try {
      await client.messaging.v1.services(newService.sid).phoneNumbers.create({
        phoneNumberSid: userPhoneNumber.sid
      });
      console.log('✅ Número agregado exitosamente al servicio');
    } catch (addError) {
      console.log(`❌ Error agregando número: ${addError.message}`);
    }
    
    // 5. Verificar configuración final
    console.log('\n🔍 PASO 5: Verificando configuración final');
    console.log('-'.repeat(40));
    
    const servicePhones = await client.messaging.v1.services(newService.sid).phoneNumbers.list();
    console.log(`📱 Números en el servicio: ${servicePhones.length}`);
    servicePhones.forEach(phone => {
      console.log(`  → ${phone.phoneNumber}`);
    });
    
    // 6. Probar envío con nuevo servicio
    console.log('\n🧪 PASO 6: Prueba con nuevo servicio');
    console.log('-'.repeat(40));
    
    try {
      // Primero probar con Sandbox (más confiable)
      console.log('🧪 Probando Sandbox primero...');
      const sandboxTest = await client.messages.create({
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+12312419541',
        body: `🧪 Prueba Sandbox reparado - ${new Date().toLocaleTimeString()}\n\n⚠️ IMPORTANTE: Primero envía "join modern-egg" al +14155238886 desde tu WhatsApp`
      });
      
      console.log(`✅ Sandbox Test: ${sandboxTest.sid} - Estado: ${sandboxTest.status}`);
      
      // Luego probar con nuevo servicio
      console.log('\n🏢 Probando nuevo Messaging Service...');
      const serviceTest = await client.messages.create({
        messagingServiceSid: newService.sid,
        to: 'whatsapp:+12312419541',
        body: `🏢 Prueba Servicio Nuevo - ${new Date().toLocaleTimeString()}\n\n✅ Messaging Service reparado y funcionando`
      });
      
      console.log(`✅ Service Test: ${serviceTest.sid} - Estado: ${serviceTest.status}`);
      
    } catch (testError) {
      console.log(`❌ Error en pruebas: ${testError.message}`);
    }
    
    // 7. Mostrar nueva configuración
    console.log('\n🎯 NUEVA CONFIGURACIÓN PARA TU CÓDIGO:');
    console.log('=' .repeat(50));
    console.log(`const MESSAGING_SERVICE_SID = '${newService.sid}';`);
    console.log('\n📝 Actualiza este valor en tu archivo functions/whatsapp-notifications.js');
    
    return newService.sid;
    
  } catch (error) {
    console.error('❌ Error reparando configuración:', error);
    return null;
  }
}

fixWhatsAppConfiguration()
  .then(newServiceSid => {
    if (newServiceSid) {
      console.log(`\n🎉 ¡CONFIGURACIÓN REPARADA!`);
      console.log(`🆔 Nuevo Service SID: ${newServiceSid}`);
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('1. 📝 Actualiza el MESSAGING_SERVICE_SID en tu código');
      console.log('2. 🧪 Envía "join modern-egg" al +14155238886 desde tu WhatsApp');
      console.log('3. 🔄 Prueba el sistema actualizado');
    } else {
      console.log('\n❌ No se pudo reparar la configuración');
    }
    process.exit(0);
  });
