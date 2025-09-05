const twilio = require('twilio');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function checkWhatsAppNumbers() {
  try {
    console.log('🔍 Verificando números de WhatsApp configurados...\n');
    
    // Obtener todos los números de teléfono de la cuenta
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    
    console.log(`📱 Números de teléfono en la cuenta: ${phoneNumbers.length}\n`);
    
    phoneNumbers.forEach((number, index) => {
      console.log(`${index + 1}. Número: ${number.phoneNumber}`);
      console.log(`   Nombre: ${number.friendlyName}`);
      console.log(`   Capabilities: Voice: ${number.capabilities.voice}, SMS: ${number.capabilities.sms}, MMS: ${number.capabilities.mms}`);
      console.log(`   Estado: ${number.status}`);
      console.log('   ---');
    });
    
    // Verificar si +12312419541 está en la lista
    const targetNumber = '+12312419541';
    const foundNumber = phoneNumbers.find(num => num.phoneNumber === targetNumber);
    
    if (foundNumber) {
      console.log(`✅ El número ${targetNumber} está configurado en tu cuenta Twilio`);
      console.log(`   Detalles:`, foundNumber);
    } else {
      console.log(`❌ El número ${targetNumber} NO está configurado en tu cuenta Twilio`);
      console.log(`   Necesitas agregarlo en Twilio Console`);
    }
    
  } catch (error) {
    console.error('❌ Error verificando números:', error.message);
    if (error.code === 20003) {
      console.error('   Verifica tus credenciales de Twilio');
    }
  }
}

checkWhatsAppNumbers();
