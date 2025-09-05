const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function quickVerificationCheck() {
  console.log('🔍 Verificación rápida post-business verification...\n');
  
  try {
    // Probar las credenciales básicas
    const account = await client.api.accounts('AC9d2313319dee6dcba99298003893c190').fetch();
    console.log('✅ Cuenta verificada:', account.friendlyName);
    
    // Verificar messaging service
    const service = await client.messaging.v1.services('MG54aad017083c59b0fb86fe0e7d2dd5f2').fetch();
    console.log('✅ Messaging Service:', service.friendlyName);
    
    // Verificar números
    const numbers = await client.messaging.v1.services('MG54aad017083c59b0fb86fe0e7d2dd5f2').phoneNumbers.list();
    console.log('📱 Números configurados:', numbers.length);
    numbers.forEach(n => console.log(`  - ${n.phoneNumber}`));
    
    console.log('\n🎉 TODO ESTÁ CONFIGURADO CORRECTAMENTE');
    console.log('👉 Ahora puedes probar desde la aplicación web');
    console.log('🌐 http://localhost:5174/');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickVerificationCheck();
