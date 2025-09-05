const twilio = require('twilio');

const client = twilio(
  'AC9d2313319dee6dcba99298003893c190',
  '2025cd85312e59bf48af46786e73be64'
);

async function checkWhatsAppSenders() {
  try {
    console.log('🔍 Verificando WhatsApp Senders...\n');
    
    // Verificar todos los números de teléfono
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    
    console.log('📱 Números en tu cuenta Twilio:');
    phoneNumbers.forEach(number => {
      console.log(`   ${number.phoneNumber} - ${number.friendlyName || 'Sin nombre'}`);
    });
    
    console.log('\n🔍 Verificando configuración de WhatsApp...');
    
    // Buscar configuración específica de WhatsApp
    const targetNumber = '+12312419541';
    const foundNumber = phoneNumbers.find(num => num.phoneNumber === targetNumber);
    
    if (foundNumber) {
      console.log(`✅ Número ${targetNumber} encontrado en Twilio`);
      console.log(`   Nombre: ${foundNumber.friendlyName}`);
      console.log(`   Capabilities:`);
      console.log(`     - Voice: ${foundNumber.capabilities.voice}`);
      console.log(`     - SMS: ${foundNumber.capabilities.sms}`);
      console.log(`     - MMS: ${foundNumber.capabilities.mms}`);
      
      // Para verificar WhatsApp específicamente, necesitas revisar en Console
      console.log('\n📝 Para verificar WhatsApp Business API:');
      console.log('   1. Ve a Twilio Console → Messaging → WhatsApp → Senders');
      console.log('   2. Busca tu número en la lista');
      console.log('   3. Si no aparece, agrégalo como WhatsApp Sender');
    } else {
      console.log(`❌ Número ${targetNumber} no encontrado`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWhatsAppSenders();
