const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function findCorrectMessagingService() {
  console.log('🔍 BUSCANDO MESSAGING SERVICES DISPONIBLES\n');
  
  try {
    // Listar todos los messaging services
    console.log('📋 Messaging Services en tu cuenta:');
    const services = await client.messaging.v1.services.list();
    
    if (services.length === 0) {
      console.log('❌ No hay Messaging Services configurados');
      console.log('\n🔧 SOLUCIÓN:');
      console.log('1. Ve a Twilio Console > Messaging > Services');
      console.log('2. Crea un nuevo Messaging Service');
      console.log('3. Agrega tu número +12312419541 al servicio');
      return;
    }
    
    console.log(`✅ Encontrados ${services.length} servicios:\n`);
    
    for (const service of services) {
      console.log(`📦 ${service.friendlyName}`);
      console.log(`   SID: ${service.sid}`);
      console.log(`   Fecha: ${service.dateCreated}`);
      
      try {
        // Verificar números en cada servicio
        const numbers = await client.messaging.v1.services(service.sid).phoneNumbers.list();
        console.log(`   Números: ${numbers.length}`);
        
        numbers.forEach(number => {
          console.log(`     📱 ${number.phoneNumber}`);
          if (number.capabilities) {
            console.log(`        Capabilities: ${JSON.stringify(number.capabilities)}`);
          }
        });
        
        console.log(''); // Línea vacía para separar
      } catch (error) {
        console.log(`   ⚠️ Error obteniendo números: ${error.message}\n`);
      }
    }
    
    // Buscar el servicio que contiene nuestro número
    console.log('🔍 Buscando servicio con tu número +12312419541...');
    
    let correctServiceSid = null;
    for (const service of services) {
      try {
        const numbers = await client.messaging.v1.services(service.sid).phoneNumbers.list();
        const hasOurNumber = numbers.some(num => num.phoneNumber === '+12312419541');
        
        if (hasOurNumber) {
          correctServiceSid = service.sid;
          console.log(`✅ ENCONTRADO: ${service.friendlyName} (${service.sid})`);
          break;
        }
      } catch (error) {
        // Ignorar errores de servicios individuales
      }
    }
    
    if (!correctServiceSid) {
      console.log('❌ Tu número +12312419541 NO está en ningún Messaging Service');
      console.log('\n🔧 NECESITAS:');
      console.log('1. Crear un Messaging Service en Twilio Console');
      console.log('2. Agregar tu número +12312419541 al servicio');
      console.log('3. Configurar WhatsApp en ese servicio');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findCorrectMessagingService();
