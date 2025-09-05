const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function testWhatsAppDirectly() {
  console.log('🔍 PROBANDO WHATSAPP BUSINESS DIRECTAMENTE\n');
  
  try {
    // Cambiar por tu número real para la prueba
    const testNumber = '+573001234567'; // ⚠️ CAMBIA POR TU NÚMERO
    
    console.log('🚀 Intentando envío directo desde WhatsApp Business...');
    console.log(`📱 Desde: +12312419541`);
    console.log(`📱 Para: ${testNumber}`);
    console.log('⚠️  IMPORTANTE: Cambia testNumber por tu número real\n');
    
    // Intentar envío directo (sin messaging service, solo WhatsApp)
    const message = await client.messages.create({
      from: 'whatsapp:+12312419541', // Especificar WhatsApp directamente
      to: `whatsapp:${testNumber}`,
      body: `🎉 ¡PRUEBA DIRECTA DE WHATSAPP BUSINESS!

✅ Tu número ${'+12312419541'} YA ESTÁ FUNCIONANDO
📱 Enviado directamente (sin Sandbox)
🏢 DR Group Dashboard
🕒 ${new Date().toLocaleString('es-CO')}

Si recibes este mensaje, ¡tu WhatsApp Business está ACTIVO! 🚀`
    });

    console.log('🎉 ¡ENVÍO DIRECTO EXITOSO!');
    console.log('📨 SID:', message.sid);
    console.log('📊 Estado:', message.status);
    console.log('💰 Precio:', message.price, message.priceUnit);
    
    // Monitorear el estado
    console.log('\n⏳ Monitoreando entrega...');
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const updatedMessage = await client.messages(message.sid).fetch();
        console.log(`📊 ${i + 1}/6: ${updatedMessage.status}`);
        
        if (updatedMessage.status === 'delivered') {
          console.log('🎉 ¡MENSAJE ENTREGADO! Tu WhatsApp Business está FUNCIONANDO');
          break;
        } else if (updatedMessage.status === 'failed') {
          console.log('❌ Mensaje falló:', updatedMessage.errorMessage);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Error monitoreando: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error en envío directo:', error.message);
    console.log('🔍 Código:', error.code);
    
    if (error.code === 63016) {
      console.log('📝 WhatsApp aún no está completamente activado');
    } else if (error.code === 21614) {
      console.log('📝 Número no verificado para WhatsApp');
    } else {
      console.log('📝 Otro tipo de error');
    }
  }
}

testWhatsAppDirectly();
