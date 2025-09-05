const twilio = require('twilio');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function createMessagingService() {
  console.log('🔧 Creando Servicio de Messaging para WhatsApp...\n');
  
  try {
    // Verificar si ya existe un servicio
    console.log('🔍 Verificando servicios existentes...');
    const existingServices = await client.messaging.v1.services.list();
    
    let service;
    const drGroupService = existingServices.find(s => 
      s.friendlyName.toLowerCase().includes('dr group') || 
      s.friendlyName.toLowerCase().includes('whatsapp')
    );
    
    if (drGroupService) {
      console.log(`✅ Servicio existente encontrado: ${drGroupService.friendlyName} (${drGroupService.sid})`);
      service = drGroupService;
    } else {
      console.log('🆕 Creando nuevo servicio de messaging...');
      service = await client.messaging.v1.services.create({
        friendlyName: 'DR Group WhatsApp Service',
        usecase: 'marketing',
        usecaseProTierRequirements: {
          brandingEnabled: false,
          shortCodeEnabled: false
        }
      });
      console.log(`✅ Servicio creado: ${service.friendlyName} (${service.sid})`);
    }
    
    // Verificar números en el servicio
    console.log('\n📱 Verificando números en el servicio...');
    const phoneNumbers = await client.messaging.v1.services(service.sid).phoneNumbers.list();
    
    if (phoneNumbers.length === 0) {
      console.log('➕ Agregando número +12312419541 al servicio...');
      try {
        await client.messaging.v1.services(service.sid).phoneNumbers.create({
          phoneNumberSid: await getPhoneNumberSid('+12312419541')
        });
        console.log('✅ Número agregado al servicio');
      } catch (err) {
        console.log('❌ Error agregando número:', err.message);
      }
    } else {
      console.log('✅ Números existentes en el servicio:');
      phoneNumbers.forEach(phone => {
        console.log(`  📱 ${phone.phoneNumber} (${phone.sid})`);
      });
    }
    
    // Mostrar configuración para usar en el código
    console.log('\n🔧 Configuración para usar en tu código:');
    console.log(`const MESSAGING_SERVICE_SID = '${service.sid}';`);
    console.log(`\n// En lugar de usar 'from: whatsapp:+12312419541', usar:`);
    console.log(`// messagingServiceSid: '${service.sid}'`);
    
    return service.sid;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

async function getPhoneNumberSid(phoneNumber) {
  const numbers = await client.incomingPhoneNumbers.list();
  const number = numbers.find(n => n.phoneNumber === phoneNumber);
  return number ? number.sid : null;
}

// Ejecutar
createMessagingService()
  .then((serviceSid) => {
    if (serviceSid) {
      console.log(`\n✅ ¡Servicio configurado correctamente! SID: ${serviceSid}`);
    } else {
      console.log('\n❌ No se pudo configurar el servicio');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
