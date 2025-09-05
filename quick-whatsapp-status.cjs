const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function quickStatusCheck() {
  try {
    const numbers = await client.messaging.v1.services('MG27cf7b7e053b2fce451e7df1df543916').phoneNumbers.list();
    const ourNumber = numbers.find(n => n.phoneNumber === '+12312419541');
    
    const hasWhatsApp = ourNumber && ourNumber.capabilities.includes('whatsapp');
    
    console.log('📊 Estado WhatsApp Business:');
    console.log(`📱 Número: +12312419541`);
    console.log(`🟢 WhatsApp: ${hasWhatsApp ? '✅ ACTIVO' : '⏳ PENDIENTE'}`);
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-CO')}`);
    
    if (hasWhatsApp) {
      console.log('🎉 ¡TU WHATSAPP BUSINESS YA ESTÁ ACTIVO!');
      console.log('Ya puedes usar tu número sin fallback a Sandbox');
    } else {
      console.log('⏳ Verificación aún pendiente con Meta');
      console.log('El sistema seguirá usando Sandbox mientras tanto');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickStatusCheck();
