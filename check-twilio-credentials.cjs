const twilio = require('twilio');

console.log('🔍 VERIFICANDO MÚLTIPLES CONFIGURACIONES DE CREDENCIALES\n');

// Configuración 1: Del script original
const config1 = {
  name: 'Script Original',
  accountSid: 'AC4edddde73e334e2f68b9e0a99ba9e3a7',
  authToken: 'eaab8d47be8a6fea30e3043b54b62e96'
};

// Configuración 2: Del archivo functions
const config2 = {
  name: 'Functions File',
  accountSid: 'AC9d2313319dee6dcba99298003893c190',
  authToken: '2025cd85312e59bf48af46786e73be64'
};

async function testCredentials(config) {
  console.log(`🧪 Probando: ${config.name}`);
  console.log(`📱 Account SID: ${config.accountSid}`);
  console.log(`🔑 Auth Token: ${config.authToken.substring(0, 8)}...${config.authToken.substring(config.authToken.length - 4)}`);
  
  try {
    const client = twilio(config.accountSid, config.authToken);
    const account = await client.api.accounts(config.accountSid).fetch();
    
    console.log(`✅ ${config.name}: VÁLIDO`);
    console.log(`   Nombre: ${account.friendlyName}`);
    console.log(`   Estado: ${account.status}`);
    console.log(`   Tipo: ${account.type || 'Main'}`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${config.name}: INVÁLIDO`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Código: ${error.code || 'N/A'}`);
    return false;
  }
}

async function main() {
  console.log('⚡ Iniciando verificación de credenciales...\n');
  
  const result1 = await testCredentials(config1);
  console.log('');
  const result2 = await testCredentials(config2);
  console.log('');
  
  console.log('📊 RESUMEN:');
  console.log(`- ${config1.name}: ${result1 ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log(`- ${config2.name}: ${result2 ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  
  if (result1 && !result2) {
    console.log('\n🔧 ACCIÓN REQUERIDA:');
    console.log('Las credenciales del functions/whatsapp-notifications.js están desactualizadas');
    console.log('Usa las credenciales del script original');
  } else if (!result1 && result2) {
    console.log('\n🔧 ACCIÓN REQUERIDA:');
    console.log('Las credenciales del script original están desactualizadas');
    console.log('Usa las credenciales del functions/whatsapp-notifications.js');
  } else if (!result1 && !result2) {
    console.log('\n🚨 PROBLEMA CRÍTICO:');
    console.log('Ninguna configuración es válida. Verifica en Twilio Console:');
    console.log('https://console.twilio.com/');
  } else {
    console.log('\n🤔 AMBAS CONFIGURACIONES SON VÁLIDAS:');
    console.log('Esto puede indicar que tienes múltiples cuentas o subcuentas');
  }
}

main().catch(console.error);
